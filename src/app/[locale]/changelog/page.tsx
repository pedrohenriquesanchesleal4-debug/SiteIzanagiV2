import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCommits, getReleases } from "@/lib/github";
import { REPO_URL } from "@/content/agents";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("changelogPage");
  return { title: t("title") };
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function ChangelogPage({
  params,
}: PageProps<"/[locale]/changelog">) {
  const { locale } = await params;
  const t = await getTranslations("changelogPage");
  const [releases, commits] = await Promise.all([getReleases(8), getCommits(20)]);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-28 pt-32 sm:px-12">
      <Link
        href="/"
        className="font-mono text-xs text-zinc-500 underline decoration-zinc-700 underline-offset-4 hover:text-zinc-200"
      >
        ← {t("back")}
      </Link>

      <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-accent">
        {t("eyebrow")}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-zinc-50 sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg text-zinc-400">{t("subtitle")}</p>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold text-zinc-100">
          {t("releasesTitle")}
        </h2>
        {releases.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">{t("empty")}</p>
        ) : (
          <ol className="mt-6 space-y-6 border-l border-zinc-800 pl-6">
            {releases.map((r) => (
              <li key={r.id} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="flex flex-wrap items-baseline gap-3">
                  <code className="font-mono text-sm text-accent">
                    {r.tagName || t("unreleased")}
                  </code>
                  <span className="font-mono text-xs text-zinc-600">
                    {formatDate(r.publishedAt, locale)}
                  </span>
                </div>
                {r.name && <p className="mt-1 font-display text-base text-zinc-100">{r.name}</p>}
                <a
                  href={r.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-zinc-500 hover:text-zinc-200"
                >
                  {t("viewOnGithub")} →
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl font-semibold text-zinc-100">
          {t("commitsTitle")}
        </h2>
        {commits.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">{t("empty")}</p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
            {commits.map((c) => (
              <li key={c.sha} className="flex items-center gap-4 px-5 py-4">
                <code className="shrink-0 font-mono text-xs text-accent">{c.sha}</code>
                <p className="flex-1 truncate text-sm text-zinc-300">{c.message}</p>
                <a
                  href={c.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-[11px] text-zinc-600 hover:text-zinc-200"
                >
                  {t("viewCommit")}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-14 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-400"
      >
        {t("viewOnGithub")}
      </a>
    </div>
  );
}
