"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { AgentGraph } from "./AgentGraph";
import { GraphFallback } from "./GraphFallback";

type Capability = "checking" | "full" | "fallback";

function detectCapability(): Capability {
  if (typeof window === "undefined") return "fallback";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  if (reducedMotion || (narrowViewport && coarsePointer)) {
    return "fallback";
  }

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return "fallback";
  } catch {
    return "fallback";
  }

  return "full";
}

/**
 * Owns the scroll-progress ref shared with <AgentGraph> and decides,
 * once on mount (client-only — SSR always renders the fallback to avoid
 * a WebGL flash/layout shift), whether to mount the real R3F scene or the
 * lightweight SVG stand-in.
 */
export function SceneHost({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const [capability, setCapability] = useState<Capability>("checking");
  const mountedOnce = useRef(false);

  useEffect(() => {
    if (mountedOnce.current) return;
    mountedOnce.current = true;
    setCapability(detectCapability());
  }, []);

  if (capability !== "full") {
    return <GraphFallback />;
  }

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 11], fov: 45 }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 6, 6]} intensity={40} color="#22D3EE" />
      <pointLight position={[-6, -4, 4]} intensity={30} color="#7C3AED" />
      <Suspense fallback={null}>
        <AgentGraph progressRef={progressRef} />
      </Suspense>
    </Canvas>
  );
}
