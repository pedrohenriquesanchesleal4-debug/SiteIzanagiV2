"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";

const PULL_RADIUS = 70;
const STRENGTH = 0.35;

/**
 * Wraps a single interactive child (button/link) and pulls it a few px
 * toward the cursor within PULL_RADIUS, springing back on leave — the
 * standard "magnetic button" pattern. No-ops on touch/reduced-motion.
 */
export function Magnetic({ children }: { children: React.ReactElement }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!supportsFinePointer || reducedMotion) return;

    const target = wrapper.firstElementChild as HTMLElement | null;
    if (!target) return;

    const setX = gsap.quickTo(target, "x", { duration: 0.35, ease: "power3.out" });
    const setY = gsap.quickTo(target, "y", { duration: 0.35, ease: "power3.out" });

    function onMove(e: MouseEvent) {
      const rect = wrapper!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < PULL_RADIUS + rect.width / 2) {
        setX(dx * STRENGTH);
        setY(dy * STRENGTH);
      } else {
        setX(0);
        setY(0);
      }
    }

    function onLeave() {
      setX(0);
      setY(0);
    }

    window.addEventListener("mousemove", onMove);
    wrapper.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      wrapper.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} data-magnetic className="inline-block">
      {children}
    </div>
  );
}
