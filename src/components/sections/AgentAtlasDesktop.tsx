"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { DOMAIN_ORDER } from "@/content/agents";
import {
  ATLAS_EDGES,
  CLUSTER_LABEL_POS,
  computeAtlasLayout,
  type PositionedAgent,
} from "@/lib/agentAtlasData";
import { AgentAtlasDetail } from "./AgentAtlasDetail";

export function AgentAtlasDesktop() {
  const t = useTranslations("agentsSection");
  const [selected, setSelected] = useState<string | null>(null);
  const nodes = useMemo(() => computeAtlasLayout(DOMAIN_ORDER), []);
  const nodeBySlug = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.slug, n])) as Record<string, PositionedAgent>,
    [nodes]
  );

  const connectedSlugs = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    for (const e of ATLAS_EDGES) {
      if (e.from === selected) set.add(e.to);
      if (e.to === selected) set.add(e.from);
    }
    return set;
  }, [selected]);

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="relative min-h-[560px] flex-1 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {ATLAS_EDGES.map((edge) => {
            const from = nodeBySlug[edge.from];
            const to = nodeBySlug[edge.to];
            if (!from || !to) return null;
            const isActive =
              connectedSlugs && connectedSlugs.has(edge.from) && connectedSlugs.has(edge.to);
            const isDimmed = connectedSlugs && !isActive;
            return (
              <line
                key={`${edge.from}-${edge.to}-${edge.reason}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                vectorEffect="non-scaling-stroke"
                stroke={isActive ? "var(--color-accent)" : "#52525b"}
                strokeWidth={isActive ? 1.4 : 1}
                strokeOpacity={isDimmed ? 0.08 : isActive ? 0.85 : 0.25}
                className="transition-[stroke-opacity] duration-300"
              />
            );
          })}
        </svg>

        {DOMAIN_ORDER.map((domain) => {
          const pos = CLUSTER_LABEL_POS[domain];
          return (
            <span
              key={domain}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-700"
            >
              {t(`domains.${domain}`)}
            </span>
          );
        })}

        {nodes.map((agent) => {
          const isSelected = selected === agent.slug;
          const isDimmed = connectedSlugs ? !connectedSlugs.has(agent.slug) : false;
          return (
            <motion.button
              key={agent.slug}
              type="button"
              onClick={() => setSelected(isSelected ? null : agent.slug)}
              style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 focus:outline-none"
              animate={{ opacity: isDimmed ? 0.28 : 1, scale: isSelected ? 1.15 : 1 }}
              whileHover={{ scale: isSelected ? 1.15 : 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <span
                className={`block h-2.5 w-2.5 rounded-full border transition-colors ${
                  isSelected
                    ? "border-accent bg-accent shadow-[0_0_0_4px_rgba(217,138,43,0.18)]"
                    : "border-zinc-600 bg-zinc-800 group-hover:border-zinc-400"
                }`}
              />
              <span
                className={`whitespace-nowrap font-mono text-[10px] transition-colors ${
                  isSelected ? "font-semibold text-accent" : "text-zinc-500"
                }`}
              >
                {t(`items.${agent.slug}.title`)}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="w-full shrink-0 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 xl:w-96">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AgentAtlasDetail slug={selected} onJump={setSelected} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[300px] flex-col items-center justify-center text-center"
            >
              <p className="max-w-[22ch] text-sm text-zinc-500">{t("atlas.empty")}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
