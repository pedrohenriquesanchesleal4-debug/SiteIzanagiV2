"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import skillsData from "@/content/skills.generated.json";
import {
  SKILL_COMPOSITIONS,
  CHAIN_ALIAS_TO_SKILL_SLUG,
  type SkillComposition,
} from "@/content/skillCompositions";

interface Skill {
  slug: string;
  name: string;
  description: string;
  category: string;
}

const SKILLS = skillsData as Skill[];
const SKILL_BY_SLUG = new Map(SKILLS.map((skill) => [skill.slug, skill]));

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Real, honest keyword matching — no fuzzy-search library, no claimed
 * semantic/AI matching. A composition matches the query when the query is
 * a substring of (or contains) one of its real `triggers`, its own domain
 * id, or one of the real skill aliases in its `chain`. Same rigor as
 * CommandPalette's static-list substring match.
 */
function scoreComposition(comp: SkillComposition, query: string): number {
  if (!query) return 0;
  let score = 0;
  for (const trigger of comp.triggers) {
    const t = normalize(trigger);
    if (t === query) score += 100;
    else if (t.includes(query) || (query.length >= 3 && query.includes(t))) score += 40;
  }
  if (normalize(comp.id).replace(/_/g, " ").includes(query)) score += 20;
  for (const step of comp.chain) {
    if (query.length >= 3 && normalize(step).includes(query)) score += 10;
  }
  return score;
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const stepVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } },
};

export function SkillPlayground() {
  const t = useTranslations("skillPlayground");
  const tSkills = useTranslations("skillsSection");
  const [query, setQuery] = useState("");

  const normalizedQuery = normalize(query);

  const resolved = useMemo(() => {
    if (!normalizedQuery) return null;
    let best: SkillComposition | null = null;
    let bestScore = 0;
    for (const comp of SKILL_COMPOSITIONS) {
      const score = scoreComposition(comp, normalizedQuery);
      if (score > bestScore) {
        best = comp;
        bestScore = score;
      }
    }
    return bestScore > 0 ? best : null;
  }, [normalizedQuery]);

  const showEmptyState = normalizedQuery.length > 0 && !resolved;

  return (
    <section id="playground" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* Left column: intro copy + input, asymmetric against the result panel */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 max-w-md text-lg text-zinc-400">{t("body")}</p>

            <div className="mt-10">
              <label htmlFor="skill-playground-input" className="sr-only">
                {t("inputLabel")}
              </label>
              <input
                id="skill-playground-input"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("placeholder")}
                aria-label={t("inputLabel")}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-accent"
              />
            </div>

            <div className="mt-6">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                {t("tryLabel")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SKILL_COMPOSITIONS.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setQuery(comp.triggers[0])}
                    className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                      resolved?.id === comp.id
                        ? "border-accent text-accent"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {comp.triggers[0]}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 max-w-md text-xs leading-relaxed text-zinc-600">
              {t("disclaimer")}
            </p>
          </div>

          {/* Right column: resolution result, aria-live so the chain reveal is announced */}
          <div aria-live="polite" className="min-h-[24rem]">
            <AnimatePresence mode="wait">
              {resolved ? (
                <motion.div
                  key={resolved.id}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0 }}
                  variants={container}
                  className="rounded-2xl border border-accent/60 bg-zinc-900/70 p-6 sm:p-8"
                >
                  <motion.div variants={stepVariant} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
                        {t("domainLabel")}
                      </p>
                      <p className="mt-1 font-mono text-lg text-zinc-50">{resolved.id}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-zinc-400">
                      {t("stepCount", { count: resolved.chain.length })}
                    </span>
                  </motion.div>

                  <motion.p
                    variants={stepVariant}
                    className="mt-4 text-sm leading-relaxed text-zinc-400"
                  >
                    {resolved.artifact}
                  </motion.p>

                  <motion.p
                    variants={stepVariant}
                    className="mt-6 font-mono text-[11px] uppercase tracking-widest text-zinc-600"
                  >
                    {t("chainLabel")}
                  </motion.p>

                  <div className="mt-3 flex flex-col gap-2">
                    {resolved.chain.map((step, index) => {
                      const slug = CHAIN_ALIAS_TO_SKILL_SLUG[step];
                      const skill = slug ? SKILL_BY_SLUG.get(slug) : undefined;
                      return (
                        <motion.div
                          key={`${resolved.id}-${step}-${index}`}
                          variants={stepVariant}
                          className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2.5"
                        >
                          <span className="font-mono text-xs text-zinc-600">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-sm text-zinc-100">{step}</span>
                          <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                            {skill ? tSkills(`categories.${skill.category}`) : t("coreEngine")}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : showEmptyState ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center"
                >
                  <p className="font-mono text-sm text-zinc-400">{t("emptyStateTitle")}</p>
                  <p className="mt-2 text-xs text-zinc-600">{t("emptyStateBody")}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex min-h-[24rem] flex-col justify-center rounded-2xl border border-dashed border-zinc-800 p-8"
                >
                  <p className="font-mono text-sm text-zinc-600">{t("idleHint")}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
