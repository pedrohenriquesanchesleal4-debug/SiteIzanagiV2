"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";
import { ArchitectureExplorerDesktop } from "./ArchitectureExplorerDesktop";
import { ArchitectureExplorerMobile } from "./ArchitectureExplorerMobile";

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

/** Same tier-detect convention as AgentAtlas/StoryCanvas. */
function useViewportTier(): Tier {
  return useSyncExternalStore(subscribeToTier, getTierSnapshot, getServerTierSnapshot);
}

/**
 * Architecture Explorer: the real izanagi-ai layered runtime (Routing →
 * Orchestration → Evaluation → Healing → Memory, per AGENTS.md section 1)
 * rendered as an interactive closed-loop diagram. Desktop gets a horizontal
 * pipeline with a curved feedback path; touch/narrow viewports get a
 * vertical accordion — same interaction language and detail content as
 * AgentAtlas, applied to 5 layers instead of 21 agents. Layer data itself
 * lives in ArchitectureExplorerData.tsx (grounded in node_modules/izanagi-ai
 * core/*.md engine docs) to avoid a circular import between this file and
 * its Desktop/Mobile children.
 */
export function ArchitectureExplorer() {
  const t = useTranslations("architectureExplorer");
  const tier = useViewportTier();

  return (
    <section id="architecture" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <ScrambleLabel text={t("eyebrow")} className="font-mono text-xs uppercase tracking-[0.3em] text-accent" />
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-zinc-400">{t("body")}</p>

        <div className="mt-16">
          {tier === "checking" && <div className="h-[520px] rounded-3xl bg-zinc-900/30" />}
          {tier === "desktop" && <ArchitectureExplorerDesktop />}
          {tier === "mobile" && <ArchitectureExplorerMobile />}
        </div>
      </div>
    </section>
  );
}
