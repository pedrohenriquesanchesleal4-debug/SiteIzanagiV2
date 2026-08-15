import { getTranslations } from "next-intl/server";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";
import { getReleases, type GithubRelease } from "@/lib/github";
import { EvolutionTimelineViewport, type EvolutionMilestone } from "./EvolutionTimelineViewport";

export const revalidate = 3600;

/**
 * Hand-curated fallback grounded in the izanagi-ai package's own CHANGELOG.md
 * (node_modules/izanagi-ai/CHANGELOG.md at the time of writing, package
 * version 3.0.0) — used only if the GitHub API is unreachable/rate-limited,
 * so the section never renders empty or with placeholder content. Every
 * entry below is a real, shipped release; nothing here is fabricated.
 */
const FALLBACK_MILESTONES: EvolutionMilestone[] = [
  {
    id: "3.0.0",
    version: "3.0.0",
    tag: "v3.0.0",
    title: "Runtime root-resolution rewrite",
    dateIso: "2026-08-15",
    excerpt:
      "Every runtime command operated on the installed package's own directory instead of the user's project. Fixed by wiring resolveFrameworkRoot(cwd) into every command path — bumped major because it changes resolved-root behavior everywhere.",
    url: "https://github.com/pedrohenriquesanchesleal4-debug/izanagi-ai/releases/tag/v3.0.0",
    isMajor: true,
  },
  {
    id: "2.13.0",
    version: "2.13.0",
    tag: "v2.13.0",
    title: "Opencode adapter goes generative",
    dateIso: "2026-08-15",
    excerpt:
      "exportToOpencode() now generates .opencode/agent/*.md from agents/*.json like every other CLI adapter, replacing a frozen one-time snapshot that never received agent fixes.",
    url: "https://github.com/pedrohenriquesanchesleal4-debug/izanagi-ai/releases/tag/v2.13.0",
    isMajor: false,
  },
  {
    id: "2.11.0",
    version: "2.11.0",
    tag: "v2.11.0",
    title: "Native Claude Code subagents",
    dateIso: "2026-08-14",
    excerpt:
      "All 21 agents export as native Claude Code subagents (.claude/agents/*.md) with scoped tool grants, auto-delegated by description — the first architectural shift from slash-command-only to native agent-tool routing.",
    url: "https://github.com/pedrohenriquesanchesleal4-debug/izanagi-ai/releases/tag/v2.11.0",
    isMajor: true,
  },
  {
    id: "2.10.4",
    version: "2.10.4",
    tag: "v2.10.4",
    title: "Policy Engine & Checkpoint/Resume",
    dateIso: "2026-08-12",
    excerpt:
      "Contextual permission engine (dev/ci/production, trust tiers) wired into ToolRegistry.execute(), plus real checkpoint/resume so long runs restore budget, artifacts and model without replanning.",
    url: "https://github.com/pedrohenriquesanchesleal4-debug/izanagi-ai/releases/tag/v2.10.4",
    isMajor: false,
  },
  {
    id: "2.10.0",
    version: "2.10.0",
    tag: "v2.10.0",
    title: "Agent Genome (Phase 7)",
    dateIso: "2026-08-11",
    excerpt:
      "The 18 core agents formalize the 13-field genome (purpose, capabilities, permissions, handoffs, evaluation...) and gain a real Agent Factory + Skill Factory reachable from the CLI — the base for adaptive routing.",
    url: "https://github.com/pedrohenriquesanchesleal4-debug/izanagi-ai/releases/tag/v2.10.0",
    isMajor: true,
  },
];

function stripMarkdown(body: string): string {
  return body
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^-\s+/gm, "")
    .trim();
}

function excerptFromBody(body: string | null): string {
  if (!body) return "";
  const clean = stripMarkdown(body);
  const firstLine = clean
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 12);
  if (!firstLine) return "";
  return firstLine.length > 180 ? `${firstLine.slice(0, 177)}...` : firstLine;
}

function parseSemver(tag: string): { major: number; minor: number; patch: number } | null {
  const match = tag.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

function toMilestones(releases: GithubRelease[]): EvolutionMilestone[] {
  return releases
    .filter((r) => r.tagName)
    .map((r) => {
      const semver = parseSemver(r.tagName);
      const isMajor = Boolean(semver && semver.minor === 0 && semver.patch === 0 && semver.major > 0);
      return {
        id: String(r.id),
        version: r.tagName.replace(/^v/, ""),
        tag: r.tagName,
        title: r.name && r.name !== r.tagName ? r.name : r.tagName,
        dateIso: r.publishedAt,
        excerpt: excerptFromBody(r.body),
        url: r.htmlUrl,
        isMajor,
      };
    })
    .filter((m) => m.excerpt.length > 0);
}

export async function EvolutionTimeline() {
  const t = await getTranslations("evolutionTimeline");
  const releases = await getReleases(12);
  const derived = toMilestones(releases);
  const milestones = derived.length >= 3 ? derived : FALLBACK_MILESTONES;

  return (
    <section id="timeline" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <ScrambleLabel
              text={t("eyebrow")}
              className="font-mono text-xs uppercase tracking-[0.3em] text-accent"
            />
            <h2 className="mt-4 font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 text-lg text-zinc-400">{t("body")}</p>
          </div>
          <code className="shrink-0 rounded-full border border-zinc-800 px-4 py-2 font-mono text-xs text-zinc-500">
            {t("currentVersion", { version: milestones[0]?.version ?? "3.0.0" })}
          </code>
        </div>

        <div className="mt-16">
          <EvolutionTimelineViewport milestones={milestones} />
        </div>
      </div>
    </section>
  );
}
