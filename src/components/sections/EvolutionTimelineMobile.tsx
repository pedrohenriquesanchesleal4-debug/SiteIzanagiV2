"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
 * Touch/narrow-viewport fallback: a plain vertical list with a left rail
 * line (no scroll-jacking, no horizontal drag ambiguity with page scroll).
 * Each milestone is a disclosure button — same data as the desktop
 * filmstrip, just a simpler interaction.
 */
export function EvolutionTimelineMobile({ milestones }: { milestones: EvolutionMilestone[] }) {
  const t = useTranslations("evolutionTimeline");
  const locale = useLocale();
  const [expanded, setExpanded] = useState<string | null>(milestones[0]?.id ?? null);

  return (
    <ol className="relative space-y-4 border-l border-zinc-800 pl-6">
      {milestones.map((m) => {
        const isOpen = expanded === m.id;
        return (
          <li key={m.id} className="relative">
            <span
              className={`absolute -left-[29px] top-5 h-2.5 w-2.5 rounded-full ${
                m.isMajor ? "bg-accent" : "bg-zinc-700"
              }`}
            />
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : m.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <code className={`font-mono text-sm ${isOpen ? "text-accent" : "text-zinc-300"}`}>
                      {m.tag}
                    </code>
                    <span className="font-mono text-[11px] text-zinc-600">
                      {formatDate(m.dateIso, locale)}
                    </span>
                  </span>
                  <span className="mt-1 block truncate font-display text-sm font-medium text-zinc-100">
                    {m.title}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`shrink-0 font-mono text-xs text-zinc-500 transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-zinc-800 px-4 py-4">
                      {m.isMajor && (
                        <span className="mb-3 inline-block rounded-full border border-accent/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                          {t("majorBadge")}
                        </span>
                      )}
                      <p className="text-sm text-zinc-400">{m.excerpt}</p>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition hover:text-accent hover:decoration-accent"
                      >
                        {t("viewRelease")} →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
