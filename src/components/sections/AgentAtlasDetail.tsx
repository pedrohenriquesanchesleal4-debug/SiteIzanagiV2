"use client";

import { useTranslations } from "next-intl";
import {
  AGENTS_BY_SLUG,
  SKILLS_BY_SLUG,
  agentFilePath,
  skillFilePath,
} from "@/lib/agentAtlasData";

const MAX_SKILL_FILES = 6;

/**
 * Shared detail renderer used by both the desktop side panel and the mobile
 * inline-expand row. Headers are localized; the body content (role, skills,
 * handoffs, always/never, file paths) is the real generated data straight
 * from the framework's own source files — not marketing copy, so it isn't
 * re-translated per locale.
 */
export function AgentAtlasDetail({
  slug,
  onJump,
}: {
  slug: string;
  onJump?: (slug: string) => void;
}) {
  const t = useTranslations("agentsSection");
  const agent = AGENTS_BY_SLUG[slug];
  if (!agent) return null;

  const skillFiles = agent.skills.slice(0, MAX_SKILL_FILES);
  const extraSkillCount = agent.skills.length - skillFiles.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
          {t(`domains.${agent.domain}`)}
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold text-zinc-50">
          {t(`items.${agent.slug}.title`)}
        </h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">/{agent.slug}</p>
      </div>

      <section>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {t("atlas.role")}
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{agent.role}</p>
      </section>

      <section>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {t("atlas.skills")}
        </h4>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {agent.skills.map((skillSlug) => {
            const skill = SKILLS_BY_SLUG[skillSlug];
            return (
              <li key={skillSlug}>
                <span
                  title={skill?.description ?? skillSlug}
                  className="inline-block rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] text-zinc-400"
                >
                  {skillSlug}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {t("atlas.handoffs")}
        </h4>
        {agent.handoffs.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">{t("atlas.handoffsEmpty")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {agent.handoffs.map((h) => (
              <li key={`${h.to}-${h.reason}`}>
                <button
                  type="button"
                  onClick={() => onJump?.(h.to)}
                  disabled={!onJump}
                  className="group flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-sm transition hover:border-accent/60 disabled:cursor-default disabled:hover:border-zinc-800"
                >
                  <span aria-hidden className="text-accent">
                    &rarr;
                  </span>
                  <span className="font-medium text-zinc-200">
                    {t(`items.${h.to}.title`)}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-zinc-500">
                    {h.reason.replace(/_/g, " ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {t("atlas.always")}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {agent.always.map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-relaxed text-zinc-400">
                <span className="text-accent">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {t("atlas.never")}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {agent.never.map((item) => (
              <li key={item} className="flex gap-2 text-xs leading-relaxed text-zinc-400">
                <span className="text-zinc-600">&times;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {t("atlas.files")}
        </h4>
        <ul className="mt-2 space-y-1 font-mono text-[11px] text-zinc-500">
          <li className="truncate">
            <span className="text-zinc-600">{t("atlas.agentFile")}: </span>
            {agentFilePath(agent.slug)}
          </li>
          {skillFiles.map((s) => (
            <li key={s} className="truncate">
              <span className="text-zinc-600">{t("atlas.skillFiles")}: </span>
              {skillFilePath(s)}
            </li>
          ))}
          {extraSkillCount > 0 && (
            <li className="text-zinc-600">{t("atlas.moreFiles", { count: extraSkillCount })}</li>
          )}
        </ul>
      </section>
    </div>
  );
}
