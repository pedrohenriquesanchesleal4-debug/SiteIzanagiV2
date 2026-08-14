"use client";

import { useEffect, useState } from "react";
import { StoryDesktop } from "./StoryDesktop";
import { StoryMobile } from "./StoryMobile";

type Tier = "checking" | "desktop" | "mobile";

function detectTier(): Tier {
  if (typeof window === "undefined") return "mobile";

  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion || (narrowViewport && coarsePointer)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Deliberately two different experiences, not one responsive compromise:
 * pinned/scrubbed WebGL storytelling on desktop, plain-flow one-shot reveals
 * on touch/narrow/reduced-motion. See StoryDesktop / StoryMobile for why.
 */
export function StoryCanvas() {
  const [tier, setTier] = useState<Tier>("checking");

  useEffect(() => {
    setTier(detectTier());
  }, []);

  if (tier === "checking") {
    return <div className="h-[100svh] bg-zinc-950" />;
  }

  return tier === "desktop" ? <StoryDesktop /> : <StoryMobile />;
}
