"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { EvolutionMilestone } from "./EvolutionTimelineViewport";

function formatDate(iso: string | null, locale: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" }).format(
      new Date(iso)
    );
  } catch {
    return "";
  }
}

/**
 * Horizontal scroll-scrubbed filmstrip: milestones lay out left-to-right in
 * a native overflow-x scroller (snap points, GPU-cheap, no scroll-jacking).
 * A thin progress rail above tracks scrollXProgress via transform: scaleX
 * only — never width/left, so it's compositor-only. Selecting a card opens
 * a detail panel below instead of relying on truncated card text, keeping
 * every card's default state compact and legible.
 */
export function EvolutionTimelineDesktop({ milestones }: { milestones: EvolutionMilestone[] }) {
  const t = useTranslations("evolutionTimeline");
  const locale = useLocale();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string>(milestones[0]?.id ?? "");

  const { scrollXProgress } = useScroll({ container: scrollerRef });
  const progress = useSpring(scrollXProgress, { stiffness: 240, damping: 32, mass: 0.4 });

  const active = milestones.find((m) => m.id === selected) ?? milestones[0];

  function scrollByCards(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * 340, behavior: "smooth" });
  }

  return (
    <div>
      <div className="relative h-px w-full bg-zinc-800">
        <motion.div
          style={{ scaleX: progress }}
          className="absolute inset-y-0 left-0 h-px w-full origin-left bg-accent"
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-600">
          {t("railLabel")}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label={t("prevLabel")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 text-zinc-500 transition hover:border-accent/60 hover:text-accent"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label={t("nextLabel")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 text-zinc-500 transition hover:border-accent/60 hover:text-accent"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {milestones.map((m) => {
          const isSelected = m.id === selected;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.id)}
              aria-pressed={isSelected}
              className={`group w-[300px] shrink-0 snap-start rounded-2xl border px-6 py-6 text-left transition-colors ${
                isSelected
                  ? "border-accent/70 bg-zinc-900/70"
                  : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-600"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <code
                  className={`font-mono text-sm ${isSelected ? "text-accent" : "text-zinc-300"}`}
                >
                  {m.tag}
                </code>
                <span className="font-mono text-[11px] text-zinc-600">
                  {formatDate(m.dateIso, locale)}
                </span>
              </div>

              {m.isMajor && (
                <span className="mt-3 inline-block rounded-full border border-accent/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                  {t("majorBadge")}
                </span>
              )}

              <p className="mt-4 font-display text-base font-medium text-zinc-100">{m.title}</p>
            </button>
          );
        })}
      </div>

      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8"
        >
          <div className="flex flex-wrap items-baseline gap-3">
            <code className="font-mono text-sm text-accent">{active.tag}</code>
            <span className="font-mono text-xs text-zinc-600">
              {formatDate(active.dateIso, locale)}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-base text-zinc-300">{active.excerpt}</p>
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition hover:text-accent hover:decoration-accent"
          >
            {t("viewRelease")} →
          </a>
        </motion.div>
      )}
    </div>
  );
}
