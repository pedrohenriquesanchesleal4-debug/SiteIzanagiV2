"use client";

import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector2, MathUtils } from "three";
import type { BloomEffect, ChromaticAberrationEffect } from "postprocessing";

/**
 * Bloom gives the particles real glow instead of flat additive dots;
 * chromatic aberration is pinned near zero at rest and only creeps in
 * during the "chaos" phase (a felt sense of instability, not a gimmick
 * running full-time); vignette frames the scene like a lens, not a div.
 */
export function PostFX({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const aberrationRef = useRef<ChromaticAberrationEffect>(null);
  const bloomRef = useRef<BloomEffect>(null);

  // @react-three/postprocessing's ChromaticAberration prop types are
  // over-eager with Omit<Partial<...>> here and reject radialModulation /
  // modulationOffset as JSX props even though the effect instance itself
  // has real setters for both — set them imperatively instead.
  useEffect(() => {
    if (!aberrationRef.current) return;
    aberrationRef.current.radialModulation = true;
    aberrationRef.current.modulationOffset = 0.2;
  }, []);

  useFrame(() => {
    const p = progressRef.current;
    const chaosWeight = p > 0.16 && p < 0.74 ? 1 - Math.abs(p - 0.45) / 0.3 : 0;
    const amount = Math.max(0, chaosWeight) * 0.0028 + 0.0002;
    aberrationRef.current?.offset.set(amount, amount * 0.6);

    // Same wordmark->chaos threshold as AgentGraph's phase weights. The
    // wordmark's own blending + edge-sharpness switch (AgentGraph.tsx) is
    // what makes the letterforms readable at all; bloom still needs to
    // stay close to off while the word is legible, since mipmap blur
    // re-softens even crisp, non-additive dots back toward a haze once
    // its own intensity is anything but negligible.
    const t1 = MathUtils.smoothstep(p, 0.16, 0.32);
    if (bloomRef.current) {
      bloomRef.current.intensity = MathUtils.lerp(0.01, 0.7, t1);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        intensity={0.7}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.65}
      />
      <ChromaticAberration ref={aberrationRef} offset={new Vector2(0.0002, 0.0001)} />
      <Vignette offset={0.35} darkness={0.7} />
    </EffectComposer>
  );
}
