"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import skillsData from "@/content/skills.generated.json";
import agentsData from "@/content/agents.generated.json";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";

interface Skill {
  slug: string;
  name: string;
  description: string;
  category: string;
  dependencies?: string[];
}

interface Agent {
  slug: string;
  name: string;
  skills: string[];
}

const SKILLS = skillsData as Skill[];
const AGENTS = agentsData as Agent[];

// category -> list of agent {slug, name} that reference each skill, built
// once at module scope (both arrays are static generated data).
const AGENTS_BY_SKILL = new Map<string, Agent[]>();
for (const skill of SKILLS) {
  AGENTS_BY_SKILL.set(
    skill.slug,
    AGENTS.filter((agent) => agent.skills.includes(skill.slug))
  );
}

const CATEGORY_ORDER = [
  "testing-qa",
  "security",
  "database",
  "devops",
  "frontend",
  "architecture",
  "ai-agent",
  "documentation",
  "misc",
] as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function SkillUniverse() {
  const t = useTranslations("skillsSection");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const normalizedQuery = normalize(query.trim());

  const matches = useMemo(() => {
    const result = new Map<string, boolean>();
    for (const skill of SKILLS) {
      const categoryOk = !category || skill.category === category;
      const queryOk =
        normalizedQuery.length === 0 ||
        normalize(skill.name).includes(normalizedQuery) ||
        normalize(skill.description).includes(normalizedQuery) ||
        normalize(skill.category).includes(normalizedQuery) ||
        normalize(skill.slug).includes(normalizedQuery);
      result.set(skill.slug, categoryOk && queryOk);
    }
    return result;
  }, [normalizedQuery, category]);

  const isFiltering = normalizedQuery.length > 0 || category !== null;
  const matchCount = isFiltering
    ? [...matches.values()].filter(Boolean).length
    : SKILLS.length;

  const ordered = useMemo(() => {
    if (!isFiltering) return SKILLS;
    return [...SKILLS].sort((a, b) => {
      const aMatch = matches.get(a.slug) ? 0 : 1;
      const bMatch = matches.get(b.slug) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.slug.localeCompare(b.slug);
    });
  }, [isFiltering, matches]);

  const selectedSkill = selected ? SKILLS.find((s) => s.slug === selected) ?? null : null;
  const selectedAgents = selectedSkill ? AGENTS_BY_SKILL.get(selectedSkill.slug) ?? [] : [];

  return (
    <section id="skills" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <ScrambleLabel text={t("eyebrow")} className="font-mono text-xs uppercase tracking-[0.3em] text-accent" />
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-zinc-400">
          {t("body", { count: SKILLS.length })}
        </p>

        {/* Search + category filters */}
        <div className="mt-10 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 font-mono text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-accent"
            />
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-600">
              {t("resultCount", { count: matchCount, total: SKILLS.length })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                category === null
                  ? "border-accent text-accent"
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {t("allCategories")}
            </button>
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory((current) => (current === cat ? null : cat))}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                  category === cat
                    ? "border-accent text-accent"
                    : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {t(`categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Selected skill detail panel */}
        {selectedSkill ? (
          <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-accent/60 bg-zinc-900/70 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-base text-zinc-100">{selectedSkill.name}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-accent">
                  {t(`categories.${selectedSkill.category}`)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={t("close")}
                className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 font-mono text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
              >
                {t("close")}
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-zinc-400">{selectedSkill.description}</p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                  {t("usedBy")}
                </p>
                {selectedAgents.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedAgents.map((agent) => (
                      <span
                        key={agent.slug}
                        className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-300"
                      >
                        {agent.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-600">{t("noAgents")}</p>
                )}
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                  {t("location")}
                </p>
                <p className="mt-2 font-mono text-xs text-zinc-300">
                  skills/{selectedSkill.slug}/SKILL.md
                </p>
              </div>
            </div>

            {selectedSkill.dependencies && selectedSkill.dependencies.length > 0 ? (
              <div className="mt-5">
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-600">
                  {t("dependencies")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedSkill.dependencies.map((dep) => (
                    <button
                      key={dep}
                      type="button"
                      onClick={() => setSelected(dep)}
                      className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-400 transition hover:border-accent hover:text-accent"
                    >
                      {dep}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : null}

        {/* Skill chip grid — only real matches are rendered while filtering,
            instead of dimming non-matches to a near-invisible state. */}
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ordered
            .filter((skill) => !isFiltering || matches.get(skill.slug))
            .map((skill) => {
              const isSelected = selected === skill.slug;
              return (
                <motion.button
                  key={skill.slug}
                  layout
                  type="button"
                  onClick={() => setSelected((current) => (current === skill.slug ? null : skill.slug))}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  initial={false}
                  animate={{ opacity: 1 }}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-accent/60"
                  }`}
                >
                  <p className="truncate font-mono text-xs text-zinc-100">{skill.name}</p>
                  <p
                    className={`mt-1 truncate font-mono text-[10px] uppercase tracking-wide ${
                      isSelected ? "text-accent" : "text-zinc-600"
                    }`}
                  >
                    {t(`categories.${skill.category}`)}
                  </p>
                </motion.button>
              );
            })}
        </div>

        {matchCount === 0 ? (
          <p className="mt-8 text-center font-mono text-sm text-zinc-600">{t("emptyState")}</p>
        ) : null}
      </div>
    </section>
  );
}
