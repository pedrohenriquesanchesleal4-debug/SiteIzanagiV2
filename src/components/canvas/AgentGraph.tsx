"use client";

/* eslint-disable react-hooks/immutability --
 * This component drives a three.js particle system straight from a
 * useFrame RAF loop: shader uniforms and typed-array buffer attributes
 * (positions, uniforms.value) are mutated in place every frame by design —
 * that's how R3F avoids going through React's render cycle at 60fps. The
 * React Compiler's immutability assumption doesn't apply to this imperative
 * three.js code, so this file opts out of that specific rule.
 */
/* eslint-disable react-hooks/purity --
 * Math.random() below runs inside a useMemo(..., []) that generates each
 * particle's stable per-mount attributes (seed, size, delay) exactly once —
 * it's the intended way to memoize a "compute once" random value, not a
 * per-render impurity bug.
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createNoise4D } from "simplex-noise";
import { sampleTextPoints } from "@/lib/textPoints";

const CLUSTER_COUNT = 5;
const POINTS_PER_CLUSTER = 144;
const TOTAL_POINTS = CLUSTER_COUNT * POINTS_PER_CLUSTER;
const CHAOS_RADIUS = 7;
const CLUSTER_RADIUS = 4.2;
const WORDMARK_SCALE_X = 2.5;
const WORDMARK_SCALE_Y = 0.74;
const WORDMARK_OFFSET_X = 2.5;
const WORDMARK_OFFSET_Y = 0.9;

// Single semantic accent (matches --color-accent in globals.css) — clusters
// no longer ramp between two competing hues, only between this accent and
// the neutral wordmark color.
const ACCENT = new THREE.Color("#d98a2b");
const WORDMARK_COLOR = new THREE.Color("#F4F4F5");

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function randomOnSphere(radius: number) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * (0.55 + Math.random() * 0.45);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

// Soft, glowing, alpha-blended points with a hot core — rendered procedurally
// (smoothstep on gl_PointCoord) instead of a baked canvas sprite, so edges
// stay crisp at any zoom and the core can carry its own color grade.
const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  uniform float uSizeScale;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uSizeScale * (420.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uCoreBoost;
  uniform float uAlphaScale;
  uniform float uSharpness;
  varying vec3 vColor;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    // Two edge profiles: a soft gaussian-like falloff (glowy sparkle, used
    // once the wordmark dissolves into chaos/cluster) and a near-hard disc
    // (crisp dot, used while the letterforms need to actually read as
    // text — a scatter of soft blobs never reconstructs legible strokes,
    // no matter the point count or blending mode).
    float softAlpha = smoothstep(0.5, 0.05, dist);
    float hardAlpha = smoothstep(0.5, 0.4, dist);
    float alpha = mix(softAlpha, hardAlpha, uSharpness);
    float shapedAlpha = mix(alpha * alpha, alpha, uSharpness);
    float core = smoothstep(0.16, 0.0, dist);
    vec3 finalColor = vColor + core * uCoreBoost;
    gl_FragColor = vec4(finalColor, shapedAlpha * uAlphaScale);
  }
`;

interface NodeDatum {
  wordmark: THREE.Vector3;
  chaos: THREE.Vector3;
  cluster: THREE.Vector3;
  clusterIndex: number;
  delay: number;
  flowSeed: number;
  size: number;
}

export interface AgentGraphProps {
  /** Mutable ref (0..1) updated by a GSAP ScrollTrigger scrub — read every frame, never triggers re-renders. */
  progressRef: React.MutableRefObject<number>;
}

/**
 * The hero centerpiece: IZANAGI materializes out of noise (wordmark),
 * dissolves into a flow-noise turbulence field as the "problem" copy lands
 * (particles are advected by a simplex-noise vector field, not just jittered
 * randomly — real fluid-like motion), then resolves into the five-cluster
 * agent network as "what Izanagi is" explains the layers.
 */
export function AgentGraph({ progressRef }: AgentGraphProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);
  const lastBucketRef = useRef(-1);
  const noise = useMemo(() => createNoise4D(), []);
  const uniforms = useMemo(
    () => ({
      uSizeScale: { value: 1 },
      uCoreBoost: { value: 0.55 },
      uAlphaScale: { value: 1 },
      uSharpness: { value: 0 },
    }),
    []
  );

  const nodes = useMemo<NodeDatum[]>(() => {
    const wordmarkPoints = sampleTextPoints("IZANAGI", { count: TOTAL_POINTS });

    const clusterCenters = Array.from({ length: CLUSTER_COUNT }, (_, i) => {
      const angle = (i / CLUSTER_COUNT) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * CLUSTER_RADIUS,
        Math.sin(angle) * CLUSTER_RADIUS * 0.6,
        Math.sin(angle * 1.3) * 1.5
      );
    });

    return Array.from({ length: TOTAL_POINTS }, (_, i) => {
      const clusterIndex = i % CLUSTER_COUNT;
      const center = clusterCenters[clusterIndex];
      const local = randomOnSphere(1.1);
      const wp = wordmarkPoints[i] ?? { x: 0, y: 0 };

      return {
        wordmark: new THREE.Vector3(
          wp.x * WORDMARK_SCALE_X + WORDMARK_OFFSET_X + (Math.random() - 0.5) * 0.04,
          wp.y * WORDMARK_SCALE_Y + WORDMARK_OFFSET_Y + (Math.random() - 0.5) * 0.04,
          (Math.random() - 0.5) * 0.3
        ),
        chaos: randomOnSphere(CHAOS_RADIUS),
        cluster: center.clone().add(local),
        clusterIndex,
        delay: Math.random() * 0.35,
        flowSeed: Math.random() * 1000,
        size: 0.65 + Math.random() * 0.9,
      };
    });
  }, []);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(TOTAL_POINTS * 3);
    const colors = new Float32Array(TOTAL_POINTS * 3);
    const sizes = new Float32Array(TOTAL_POINTS);
    nodes.forEach((n, i) => {
      n.wordmark.toArray(positions, i * 3);
      WORDMARK_COLOR.toArray(colors, i * 3);
      sizes[i] = n.size;
    });
    return { positions, colors, sizes };
  }, [nodes]);

  const maxLines = TOTAL_POINTS * 2;
  const linePositions = useMemo(() => new Float32Array(maxLines * 2 * 3), [maxLines]);

  useFrame((state, delta) => {
    const progress = progressRef.current;
    const geometry = pointsRef.current?.geometry;
    const posAttr = geometry?.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    const colorAttr = geometry?.getAttribute("color") as
      | THREE.BufferAttribute
      | undefined;

    // Phase weights: wordmark -> chaos -> cluster, always summing to 1.
    const t1 = smoothstep(0.16, 0.32, progress);
    const t2 = smoothstep(0.56, 0.74, progress);
    const wWordmark = 1 - t1;
    const wChaos = t1 * (1 - t2);
    const wCluster = t1 * t2;
    const time = state.clock.elapsedTime;
    const flowStrength = wChaos * 1.4;
    const flowFreq = 0.14;
    const flowSpeed = 0.12;

    // The wordmark packs ~700 points into a small on-screen area. Two
    // separate things were destroying legibility, not just one:
    // (1) additive blending sums every overlapping point's alpha, so a
    //     dense letterform saturates to one solid white blob — fixed by
    //     switching to normal blending while the word is legible (overlap
    //     occludes instead of summing to white) and only cross-fading to
    //     additive as it dissolves into chaos, where the glow is wanted.
    // (2) each point's edge is a soft gaussian-like falloff (intentional
    //     for the glowy chaos/cluster look) — a scatter of soft blobs
    //     never reads as crisp strokes no matter the blending mode or
    //     point count, so uSharpness flips each dot to a near-hard disc
    //     specifically while the wordmark needs to read as actual text.
    const additiveMix = smoothstep(0.1, 0.3, 1 - wWordmark);
    if (materialRef.current) {
      materialRef.current.blending =
        additiveMix > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
    }
    uniforms.uSharpness.value = THREE.MathUtils.lerp(1, 0, 1 - wWordmark);
    uniforms.uSizeScale.value = THREE.MathUtils.lerp(0.26, 1.05, 1 - wWordmark);
    uniforms.uCoreBoost.value = THREE.MathUtils.lerp(0.05, 0.55, 1 - wWordmark);
    uniforms.uAlphaScale.value = 1;

    if (posAttr && colorAttr) {
      nodes.forEach((n, i) => {
        const local = THREE.MathUtils.clamp(
          (progress - n.delay) / (1 - n.delay || 1),
          0,
          1
        );
        const eased = local * local * (3 - 2 * local);

        // Flow-noise advection: three decorrelated 4D simplex samples (seeded
        // per axis) act as a smoothly time-varying displacement field, so
        // particles drift like turbulence/smoke instead of jittering in place.
        const fx = n.chaos.x * flowFreq;
        const fy = n.chaos.y * flowFreq;
        const fz = n.chaos.z * flowFreq;
        const tw = time * flowSpeed;
        const flowX = noise(fx, fy, fz + n.flowSeed, tw) * flowStrength;
        const flowY = noise(fx + 37.1, fy + 11.4, fz + n.flowSeed, tw) * flowStrength;
        const flowZ = noise(fx + 71.9, fy + 53.2, fz + n.flowSeed, tw) * flowStrength;

        const x = THREE.MathUtils.lerp(
          THREE.MathUtils.lerp(n.wordmark.x, n.chaos.x + flowX, eased),
          n.cluster.x,
          wCluster
        );
        const y = THREE.MathUtils.lerp(
          THREE.MathUtils.lerp(n.wordmark.y, n.chaos.y + flowY, eased),
          n.cluster.y,
          wCluster
        );
        const z = THREE.MathUtils.lerp(
          THREE.MathUtils.lerp(n.wordmark.z, n.chaos.z + flowZ, eased),
          n.cluster.z,
          wCluster
        );

        posAttr.setXYZ(i, x, y, z);

        const r = THREE.MathUtils.lerp(WORDMARK_COLOR.r, ACCENT.r, 1 - wWordmark);
        const g = THREE.MathUtils.lerp(WORDMARK_COLOR.g, ACCENT.g, 1 - wWordmark);
        const b = THREE.MathUtils.lerp(WORDMARK_COLOR.b, ACCENT.b, 1 - wWordmark);
        colorAttr.setXYZ(i, r, g, b);
      });
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
    }

    const bucket = Math.floor(progress * 40);
    if (bucket !== lastBucketRef.current && linesRef.current && posAttr) {
      lastBucketRef.current = bucket;
      let edgeCount = 0;

      if (wCluster > 0.15) {
        for (let c = 0; c < CLUSTER_COUNT; c++) {
          const members = nodes
            .map((n, i) => ({ n, i }))
            .filter(({ n }) => n.clusterIndex === c);

          for (let a = 0; a < members.length; a++) {
            for (let b = a + 1; b < members.length; b++) {
              if (edgeCount >= maxLines) break;
              if (Math.random() > 0.08) continue;
              const ia = members[a].i;
              const ib = members[b].i;
              linePositions[edgeCount * 6] = posAttr.getX(ia);
              linePositions[edgeCount * 6 + 1] = posAttr.getY(ia);
              linePositions[edgeCount * 6 + 2] = posAttr.getZ(ia);
              linePositions[edgeCount * 6 + 3] = posAttr.getX(ib);
              linePositions[edgeCount * 6 + 4] = posAttr.getY(ib);
              linePositions[edgeCount * 6 + 5] = posAttr.getZ(ib);
              edgeCount++;
            }
          }
        }
      }

      const lineGeom = linesRef.current.geometry;
      lineGeom.setDrawRange(0, edgeCount * 2);
      const lineAttr = lineGeom.getAttribute("position") as THREE.BufferAttribute;
      lineAttr.set(linePositions);
      lineAttr.needsUpdate = true;
      lineGeom.computeBoundingSphere();
    }

    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = wCluster * 0.45;
    }

    if (groupRef.current) {
      const spin = 0.03 + wChaos * 0.1 + wCluster * 0.03;
      groupRef.current.rotation.y += delta * spin;
      groupRef.current.rotation.x = Math.sin(time * 0.07) * (0.05 + wChaos * 0.06);
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          uniforms={uniforms}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#52525b"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <fog attach="fog" args={["#09090b", 7, 19]} />
    </group>
  );
}
