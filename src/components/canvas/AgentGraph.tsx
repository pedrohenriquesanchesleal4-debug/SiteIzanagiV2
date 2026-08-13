"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const CLUSTER_COUNT = 5;
const POINTS_PER_CLUSTER = 16;
const TOTAL_POINTS = CLUSTER_COUNT * POINTS_PER_CLUSTER;
const SCATTER_RADIUS = 6.5;
const CLUSTER_RADIUS = 4.2;

const ACCENT_START = new THREE.Color("#7C3AED");
const ACCENT_END = new THREE.Color("#22D3EE");

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

interface NodeDatum {
  scattered: THREE.Vector3;
  grouped: THREE.Vector3;
  cluster: number;
  delay: number;
  spinSpeed: number;
}

export interface AgentGraphProps {
  /** Mutable ref (0..1) updated by a GSAP ScrollTrigger scrub — read every frame, never triggers re-renders. */
  progressRef: React.MutableRefObject<number>;
}

export function AgentGraph({ progressRef }: AgentGraphProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);
  const lastBucketRef = useRef(-1);

  const nodes = useMemo<NodeDatum[]>(() => {
    const clusterCenters = Array.from({ length: CLUSTER_COUNT }, (_, i) => {
      const angle = (i / CLUSTER_COUNT) * Math.PI * 2;
      return new THREE.Vector3(
        Math.cos(angle) * CLUSTER_RADIUS,
        Math.sin(angle) * CLUSTER_RADIUS * 0.6,
        Math.sin(angle * 1.3) * 1.5
      );
    });

    return Array.from({ length: TOTAL_POINTS }, (_, i) => {
      const cluster = i % CLUSTER_COUNT;
      const center = clusterCenters[cluster];
      const local = randomOnSphere(1.1);
      return {
        scattered: randomOnSphere(SCATTER_RADIUS),
        grouped: center.clone().add(local),
        cluster,
        delay: Math.random() * 0.35,
        spinSpeed: 0.05 + Math.random() * 0.08,
      };
    });
  }, []);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(TOTAL_POINTS * 3);
    const colors = new Float32Array(TOTAL_POINTS * 3);
    nodes.forEach((n, i) => {
      n.scattered.toArray(positions, i * 3);
      const t = n.cluster / (CLUSTER_COUNT - 1);
      const c = ACCENT_START.clone().lerp(ACCENT_END, t);
      c.toArray(colors, i * 3);
    });
    return { positions, colors };
  }, [nodes]);

  const maxLines = TOTAL_POINTS * 4;
  const linePositions = useMemo(() => new Float32Array(maxLines * 2 * 3), [maxLines]);

  useFrame((state, delta) => {
    const progress = progressRef.current;
    const geometry = pointsRef.current?.geometry;
    const posAttr = geometry?.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;

    if (posAttr) {
      nodes.forEach((n, i) => {
        const local = THREE.MathUtils.clamp(
          (progress - n.delay) / (1 - n.delay || 1),
          0,
          1
        );
        const eased = local * local * (3 - 2 * local);
        const x = THREE.MathUtils.lerp(n.scattered.x, n.grouped.x, eased);
        const y = THREE.MathUtils.lerp(n.scattered.y, n.grouped.y, eased);
        const z = THREE.MathUtils.lerp(n.scattered.z, n.grouped.z, eased);
        posAttr.setXYZ(i, x, y, z);
      });
      posAttr.needsUpdate = true;
    }

    const bucket = Math.floor(progress * 12);
    if (bucket !== lastBucketRef.current && linesRef.current) {
      lastBucketRef.current = bucket;
      let edgeCount = 0;
      const connectThreshold = 0.4;

      if (progress > connectThreshold && posAttr) {
        for (let c = 0; c < CLUSTER_COUNT; c++) {
          const members = nodes
            .map((n, i) => ({ n, i }))
            .filter(({ n }) => n.cluster === c);

          for (let a = 0; a < members.length; a++) {
            for (let b = a + 1; b < members.length; b++) {
              if (edgeCount >= maxLines) break;
              if (Math.random() > 0.35) continue;
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
      (lineGeom as THREE.BufferGeometry).computeBoundingSphere();
    }

    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = THREE.MathUtils.clamp((progress - 0.4) / 0.3, 0, 1) * 0.5;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (0.04 + progress * 0.05);
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#8B9BFF"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <fog attach="fog" args={["#09090b", 8, 20]} />
    </group>
  );
}
