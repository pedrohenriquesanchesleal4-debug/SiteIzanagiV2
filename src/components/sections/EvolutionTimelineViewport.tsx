"use client";

import { useSyncExternalStore } from "react";
import { EvolutionTimelineDesktop } from "./EvolutionTimelineDesktop";
import { EvolutionTimelineMobile } from "./EvolutionTimelineMobile";

export interface EvolutionMilestone {
  id: string;
  version: string;
  tag: string;
  title: string;
  dateIso: string | null;
  excerpt: string;
  url: string;
  isMajor: boolean;
}

type Tier = "checking" | "desktop" | "mobile";

function getTierSnapshot(): Tier {
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return narrowViewport && coarsePointer ? "mobile" : "desktop";
}

function getServerTierSnapshot(): Tier {
  return "checking";
}

function subscribeToTier(onChange: () => void) {
  const queries = [
    window.matchMedia("(max-width: 767px)"),
    window.matchMedia("(pointer: coarse)"),
  ];
  queries.forEach((mq) => mq.addEventListener("change", onChange));
  return () => queries.forEach((mq) => mq.removeEventListener("change", onChange));
}

/**
 * Same tier-detect convention as AgentAtlas/StoryCanvas: horizontal
 * scroll-scrubbed filmstrip on desktop/mouse, a plain vertical expandable
 * list on touch/narrow viewports where horizontal scroll-jacking is a poor
 * interaction. Data is fetched once server-side in EvolutionTimeline and
 * passed down as plain, serializable props.
 */
function useViewportTier(): Tier {
  return useSyncExternalStore(subscribeToTier, getTierSnapshot, getServerTierSnapshot);
}

export function EvolutionTimelineViewport({ milestones }: { milestones: EvolutionMilestone[] }) {
  const tier = useViewportTier();

  if (tier === "checking") {
    return <div className="h-[420px] rounded-3xl bg-zinc-900/30" />;
  }

  return tier === "desktop" ? (
    <EvolutionTimelineDesktop milestones={milestones} />
  ) : (
    <EvolutionTimelineMobile milestones={milestones} />
  );
}
