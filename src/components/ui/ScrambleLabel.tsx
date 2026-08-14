"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/scroll";

/**
 * Small uppercase mono "eyebrow" labels decode in from random characters
 * instead of just fading — a literal nod to the product (an AI reading/
 * generating text) rather than a decorative flourish. Plays once when it
 * scrolls into view; reduced-motion renders the final text immediately.
 */
export function ScrambleLabel({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        duration: 0.9,
        scrambleText: { text, chars: "01<>/\\{}[]#$%", speed: 0.35, revealDelay: 0.1 },
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 92%" },
      });
    });

    return () => ctx.revert();
  }, [text]);

  return (
    <p ref={ref} className={className}>
      {text}
    </p>
  );
}
