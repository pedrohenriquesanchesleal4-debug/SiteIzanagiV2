"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LAYER_KEYS } from "@/content/agents";
import type { LayerKey } from "./ArchitectureExplorerData";
import { ArchitectureExplorerDetail } from "./ArchitectureExplorerDetail";

/**
 * Touch/narrow-viewport fallback: a vertical accordion of the 5 layers in
 * pipeline order, instead of the desktop's spatial loop diagram — same
 * interaction language as AgentAtlasMobile (expand-in-place, same detail
 * content).
 */
export function ArchitectureExplorerMobile() {
  const t = useTranslations("architectureExplorer");
  const prefersReducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<LayerKey | null>("routing");

  return (
    <div className="space-y-2">
      {LAYER_KEYS.map((key, i) => {
        const isOpen = expanded === key;
        return (
          <div key={key} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : key)}
              aria-expanded={isOpen}
              aria-controls={`architecture-panel-${key}`}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="font-mono text-[10px] tabular-nums text-zinc-600">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`font-display text-sm font-medium ${isOpen ? "text-accent" : "text-zinc-100"}`}>
                {t(`layers.${key}.name`)}
              </span>
              <span
                aria-hidden
                className={`ml-auto font-mono text-xs text-zinc-500 transition-transform ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`architecture-panel-${key}`}
                  initial={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-zinc-800 px-4 py-5">
                    <ArchitectureExplorerDetail layerKey={key} onJump={setExpanded} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
