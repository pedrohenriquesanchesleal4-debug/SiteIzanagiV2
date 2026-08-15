"use client";

import { useSyncExternalStore } from "react";
import { StoryDesktop } from "./StoryDesktop";
import { StoryMobile } from "./StoryMobile";

type Tier = "checking" | "desktop" | "mobile";

function getTierSnapshot(): Tier {
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion || (narrowViewport && coarsePointer)) {
    return "mobile";
  }
  return "desktop";
}

function getServerTierSnapshot(): Tier {
  return "checking";
}

function subscribeToTier(onChange: () => void) {
  const queries = [
    window.matchMedia("(max-width: 767px)"),
    window.matchMedia("(pointer: coarse)"),
    window.matchMedia("(prefers-reduced-motion: reduce)"),
  ];
  queries.forEach((mq) => mq.addEventListener("change", onChange));
  return () => queries.forEach((mq) => mq.removeEventListener("change", onChange));
}

/**
 * Same tier-detect convention as AgentAtlas: useSyncExternalStore renders
 * "checking" during SSR/first paint and picks up the real tier reactively
 * on media query change, instead of a mount effect calling setState.
 */
function useViewportTier(): Tier {
  return useSyncExternalStore(subscribeToTier, getTierSnapshot, getServerTierSnapshot);
}

/**
 * Deliberately two different experiences, not one responsive compromise:
 * pinned/scrubbed WebGL storytelling on desktop, plain-flow one-shot reveals
 * on touch/narrow/reduced-motion. See StoryDesktop / StoryMobile for why.
 */
export function StoryCanvas() {
  const tier = useViewportTier();

  if (tier === "checking") {
    return <div className="h-[100svh] bg-zinc-950" />;
  }

  return tier === "desktop" ? <StoryDesktop /> : <StoryMobile />;
}
