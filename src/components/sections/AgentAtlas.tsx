"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";
import { AgentAtlasDesktop } from "./AgentAtlasDesktop";
import { AgentAtlasMobile } from "./AgentAtlasMobile";

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
 * Same tier-detect convention as StoryCanvas (narrow viewport + coarse
 * pointer = mobile), implemented with useSyncExternalStore instead of an
 * effect + setState: it renders "checking" during SSR/first paint (matching
 * the server) and picks up the real tier — reactively, on media query
 * change — as soon as it resolves on the client.
 */
function useViewportTier(): Tier {
  return useSyncExternalStore(subscribeToTier, getTierSnapshot, getServerTierSnapshot);
}

/**
 * Agent Atlas: agents rendered as entities positioned on a spatial map
 * (clustered by domain, connected by real handoff edges) rather than a plain
 * grid — see AgentAtlasDesktop. Touch/narrow viewports get a searchable list
 * fallback instead, per the same tier-split convention as StoryCanvas.
 */
export function AgentAtlas() {
  const t = useTranslations("agentsSection");
  const tier = useViewportTier();

  return (
    <section id="agents" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <ScrambleLabel text={t("eyebrow")} className="font-mono text-xs uppercase tracking-[0.3em] text-accent" />
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-zinc-400">{t("body")}</p>

        <div className="mt-16">
          {tier === "checking" && <div className="h-[560px] rounded-3xl bg-zinc-900/30" />}
          {tier === "desktop" && <AgentAtlasDesktop />}
          {tier === "mobile" && <AgentAtlasMobile />}
        </div>
      </div>
    </section>
  );
}
