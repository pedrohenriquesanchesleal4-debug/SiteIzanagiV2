"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LAYER_KEYS } from "@/content/agents";
import { ArchitectureExplorerDetail } from "./ArchitectureExplorerDetail";
import type { LayerKey } from "./ArchitectureExplorerData";

// Pipeline nodes on a 0-100 x 0-100 stage: five stops left to right, plus a
// dipped return path from Memory back to Routing — the real feedback loop
// (failure patterns + decisions consulted at the next Routing pass), not a
// dead-end line.
const NODE_X: Record<LayerKey, number> = {
  routing: 8,
  orchestration: 29,
  evaluation: 50,
  healing: 71,
  memory: 92,
};
const NODE_Y = 34;
const RETURN_Y = 78;

export function ArchitectureExplorerDesktop() {
  const t = useTranslations("architectureExplorer");
  const prefersReducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<LayerKey>("routing");
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = LAYER_KEYS.indexOf(selected);

  const forwardEdges = useMemo(
    () =>
      LAYER_KEYS.slice(0, -1).map((key, i) => ({
        from: key,
        to: LAYER_KEYS[i + 1],
      })),
    []
  );

  function focusIndex(nextIndex: number) {
    const clamped = (nextIndex + LAYER_KEYS.length) % LAYER_KEYS.length;
    const key = LAYER_KEYS[clamped];
    setSelected(key);
    buttonRefs.current[clamped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusIndex(selectedIndex + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusIndex(selectedIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        focusIndex(0);
        break;
      case "End":
        event.preventDefault();
        focusIndex(LAYER_KEYS.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={t("title")}
        onKeyDown={handleKeyDown}
        className="relative h-[220px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {forwardEdges.map((edge) => (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={NODE_X[edge.from]}
              y1={NODE_Y}
              x2={NODE_X[edge.to]}
              y2={NODE_Y}
              vectorEffect="non-scaling-stroke"
              stroke="#52525b"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          ))}
          {/* Memory -> Routing feedback loop: failure patterns + decisions
              consulted before the next Routing pass (self-healing.md,
              context-engine.md). */}
          <path
            d={`M ${NODE_X.memory} ${NODE_Y + 4} C ${NODE_X.memory} ${RETURN_Y}, ${NODE_X.routing} ${RETURN_Y}, ${NODE_X.routing} ${NODE_Y + 4}`}
            fill="none"
            stroke="var(--color-accent)"
            strokeOpacity={0.35}
            strokeWidth={1}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
            markerEnd="url(#loop-arrow)"
          />
          <defs>
            <marker id="loop-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--color-accent)" fillOpacity={0.6} />
            </marker>
          </defs>
        </svg>

        {LAYER_KEYS.map((key, i) => {
          const isSelected = selected === key;
          return (
            <motion.button
              key={key}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`architecture-tab-${key}`}
              aria-selected={isSelected}
              aria-controls="architecture-panel"
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(key)}
              style={{ left: `${NODE_X[key]}%`, top: `${NODE_Y}%` }}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 focus:outline-none"
              animate={{ scale: isSelected ? 1.12 : 1 }}
              whileHover={prefersReducedMotion ? undefined : { scale: isSelected ? 1.12 : 1.06 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 24 }}
            >
              <span
                className={`font-mono text-[10px] tabular-nums transition-colors ${
                  isSelected ? "text-accent" : "text-zinc-600"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`block h-3 w-3 rounded-full border transition-colors ${
                  isSelected
                    ? "border-accent bg-accent shadow-[0_0_0_5px_rgba(217,138,43,0.18)]"
                    : "border-zinc-600 bg-zinc-800 group-hover:border-zinc-400"
                }`}
              />
              <span
                className={`whitespace-nowrap font-display text-sm font-medium transition-colors ${
                  isSelected ? "text-zinc-50" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {t(`layers.${key}.name`)}
              </span>
            </motion.button>
          );
        })}

        <span
          style={{ left: `${(NODE_X.routing + NODE_X.memory) / 2}%`, top: `${RETURN_Y}%` }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700"
        >
          {`.agents/memoria/ → ${t("layers.routing.name")}`}
        </span>
      </div>

      <div
        id="architecture-panel"
        role="tabpanel"
        aria-labelledby={`architecture-tab-${selected}`}
        className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <ArchitectureExplorerDetail layerKey={selected} onJump={setSelected} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
