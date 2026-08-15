"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { AGENTS, type AgentDef } from "@/content/agents";

/**
 * Agent Swarm Simulator — a scripted, client-only demo of Multi-Agent Swarm
 * Mode (AGENTS.md §5 "Execução Paralela Concorrente" + §2's 21-agent table).
 * The visitor picks a real task category, hits "Run simulation", and watches
 * real Izanagi agent slugs/commands light up in concurrent waves with mock
 * (but framework-accurate) status lines. Explicitly labeled a simulation —
 * no network call, no backend, nothing to fake as "live".
 *
 * Sequencing (SWARM_SEQUENCES below) is derived from the real handoff graph
 * in src/content/agents.generated.json (e.g. architect -> senior-engineer
 * "implementacao", senior-engineer -> qa "verificacao"), collapsed into
 * concurrent waves to illustrate swarm parallelism rather than a strict
 * single-file chain.
 */

type CategoryId = "feature" | "bug" | "security" | "agentDesign";

const CATEGORY_ORDER: CategoryId[] = ["feature", "bug", "security", "agentDesign"];

// Each inner array is a "wave" of agents that would run concurrently.
const SWARM_SEQUENCES: Record<CategoryId, string[][]> = {
  feature: [["product-reasoner"], ["architect", "database"], ["senior-engineer"], ["qa", "techlead"]],
  bug: [["bug-hunter"], ["senior-engineer"], ["qa"]],
  security: [["security"], ["senior-engineer", "devops"], ["qa"]],
  agentDesign: [["agent-architect"], ["skill-architect", "security"], ["techlead"]],
};

const AGENT_BY_SLUG = Object.fromEntries(AGENTS.map((a) => [a.slug, a])) as Record<
  string,
  AgentDef
>;

type RunState = "idle" | "running" | "done";

interface LogLine {
  id: string;
  text: string;
}

function subscribeToReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

export function AgentSimulator() {
  const t = useTranslations("agentSimulator");
  const reducedMotion = useReducedMotion();

  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [activeWave, setActiveWave] = useState(-1);
  const [log, setLog] = useState<LogLine[]>([]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runId = useRef(0);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const waves = selected ? SWARM_SEQUENCES[selected] : null;

  const handleSelectCategory = useCallback(
    (id: CategoryId) => {
      clearTimers();
      setSelected(id);
      setRunState("idle");
      setActiveWave(-1);
      setLog([]);
    },
    [clearTimers]
  );

  const handleRun = useCallback(() => {
    if (!selected) return;
    clearTimers();
    runId.current += 1;
    const thisRun = runId.current;
    const sequence = SWARM_SEQUENCES[selected];

    setRunState("running");
    setActiveWave(-1);
    setLog([]);

    const waveGap = reducedMotion ? 60 : 1050;
    const lineGap = reducedMotion ? 0 : 160;

    sequence.forEach((wave, waveIndex) => {
      const waveDelay = waveIndex * waveGap;
      const startWave = setTimeout(() => {
        if (runId.current !== thisRun) return;
        setActiveWave(waveIndex);
        wave.forEach((slug, slugIndex) => {
          const lineDelay = slugIndex * lineGap;
          const addLine = setTimeout(() => {
            if (runId.current !== thisRun) return;
            const agentName = t(`agentNames.${slug}`);
            const text = t(`statusTemplates.${slug}`, { agent: agentName });
            setLog((prev) => [...prev, { id: `${waveIndex}-${slug}`, text }]);
          }, lineDelay);
          timers.current.push(addLine);
        });
      }, waveDelay);
      timers.current.push(startWave);
    });

    const totalDelay = (sequence.length - 1) * waveGap + 700;
    const finish = setTimeout(() => {
      if (runId.current !== thisRun) return;
      setRunState("done");
    }, totalDelay);
    timers.current.push(finish);
  }, [selected, reducedMotion, clearTimers, t]);

  const handleReset = useCallback(() => {
    clearTimers();
    runId.current += 1;
    setRunState("idle");
    setActiveWave(-1);
    setLog([]);
  }, [clearTimers]);

  const totalWaves = waves?.length ?? 0;

  return (
    <section id="simulator" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">{t("eyebrow")}</p>
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-zinc-400">{t("body")}</p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            {t("simulatedBadge")}
          </span>
        </div>

        {/* Category picker */}
        <div
          role="group"
          aria-label={t("chooseLabel")}
          className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CATEGORY_ORDER.map((id) => {
            const isSelected = selected === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSelectCategory(id)}
                className={`rounded-2xl border px-5 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600"
                }`}
              >
                <span
                  className={`font-display text-sm font-medium ${
                    isSelected ? "text-accent" : "text-zinc-100"
                  }`}
                >
                  {t(`categories.${id}.label`)}
                </span>
                <span className="mt-1.5 block text-sm text-zinc-500">
                  {t(`categories.${id}.description`)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Run controls */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={!selected || runState === "running"}
            onClick={handleRun}
            className="rounded-full bg-accent px-6 py-2.5 font-mono text-sm font-medium text-zinc-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            {runState === "running" ? t("runningLabel") : t("runButton")}
          </button>
          {runState !== "idle" && (
            <button
              type="button"
              onClick={handleReset}
              className="font-mono text-sm text-zinc-500 underline decoration-zinc-700 underline-offset-4 transition-colors hover:text-zinc-300"
            >
              {t("resetButton")}
            </button>
          )}
          {waves && runState !== "idle" && (
            <span className="font-mono text-xs text-zinc-600">
              {t("stageLabel", {
                index: Math.min(activeWave + 1, totalWaves),
                total: totalWaves,
              })}
            </span>
          )}
        </div>

        {/* Visualization + log */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 sm:p-8">
            {!waves ? (
              <p className="flex min-h-[220px] items-center justify-center text-center text-sm text-zinc-600">
                {t("idleHint")}
              </p>
            ) : (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:justify-between">
                {waves.map((wave, waveIndex) => {
                  const isActive = runState === "running" && activeWave === waveIndex;
                  const isPast =
                    (runState === "running" && activeWave > waveIndex) || runState === "done";
                  const transitionLabel =
                    waveIndex < waves.length - 1
                      ? t(`categories.${selected}.transitions.${waveIndex}`)
                      : null;
                  return (
                    <div key={waveIndex} className="flex flex-1 items-center gap-3 sm:gap-2">
                      <div className="flex flex-1 flex-col gap-2">
                        {wave.map((slug) => {
                          const agentDef = AGENT_BY_SLUG[slug];
                          const lit = isActive || isPast;
                          return (
                            <motion.div
                              key={slug}
                              animate={{
                                opacity: lit ? 1 : 0.45,
                                scale: isActive ? 1.03 : 1,
                              }}
                              transition={{ duration: reducedMotion ? 0 : 0.3 }}
                              className={`rounded-xl border px-3.5 py-2.5 ${
                                isActive
                                  ? "border-accent bg-accent/10 shadow-[0_0_0_3px_rgba(217,138,43,0.14)]"
                                  : isPast
                                    ? "border-zinc-700 bg-zinc-900/60"
                                    : "border-zinc-800 bg-zinc-900/30"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                    isActive ? "bg-accent" : isPast ? "bg-zinc-500" : "bg-zinc-700"
                                  }`}
                                  aria-hidden
                                />
                                <span
                                  className={`font-display text-sm font-medium ${
                                    isActive ? "text-accent" : "text-zinc-200"
                                  }`}
                                >
                                  {t(`agentNames.${slug}`)}
                                </span>
                              </div>
                              {agentDef && (
                                <span className="mt-0.5 block font-mono text-[11px] text-zinc-600">
                                  {agentDef.command}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                      {waveIndex < waves.length - 1 && (
                        <div className="hidden shrink-0 flex-col items-center gap-1 sm:flex sm:max-w-[6.5rem]">
                          <span
                            aria-hidden
                            className={`font-mono text-lg ${
                              isPast ? "text-accent/60" : "text-zinc-700"
                            }`}
                          >
                            &rarr;
                          </span>
                          <span className="text-center font-mono text-[10px] leading-tight text-zinc-600">
                            {transitionLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-zinc-500">
              {t("logAriaLabel")}
            </p>
            <div
              role="log"
              aria-live="polite"
              aria-label={t("logAriaLabel")}
              className="min-h-[220px] space-y-2 font-mono text-sm"
            >
              {log.length === 0 && runState === "idle" && (
                <p className="text-zinc-600">{t("idleHint")}</p>
              )}
              <AnimatePresence initial={false}>
                {log.map((line) => (
                  <motion.p
                    key={line.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.25 }}
                    className="text-zinc-300"
                  >
                    <span className="select-none text-accent">{"> "}</span>
                    {line.text}
                  </motion.p>
                ))}
              </AnimatePresence>
              {runState === "done" && (
                <motion.p
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-2 text-zinc-500"
                >
                  {t("doneLabel")}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
