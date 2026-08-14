"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/**
 * Subtle depth cue used on premium product sites (Apple, igloo.inc): the
 * camera drifts a few hundredths of a unit toward the pointer and dollies in
 * slightly as the scroll story progresses — never enough to disorient, just
 * enough that the scene reads as a real 3D space instead of a flat sprite.
 */
export function CameraRig({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const { camera, pointer } = useThree();
  const current = useRef({ x: 0, y: 0 });

  useFrame(() => {
    current.current.x = THREE.MathUtils.lerp(current.current.x, pointer.x, 0.04);
    current.current.y = THREE.MathUtils.lerp(current.current.y, pointer.y, 0.04);

    const progress = progressRef.current;
    camera.position.x = current.current.x * 0.5;
    camera.position.y = current.current.y * 0.3;
    camera.position.z = THREE.MathUtils.lerp(11.5, 9.8, progress);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
