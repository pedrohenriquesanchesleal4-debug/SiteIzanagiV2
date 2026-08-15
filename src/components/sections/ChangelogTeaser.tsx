import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCommits } from "@/lib/github";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";

export async function ChangelogTeaser() {
  const t = await getTranslations("changelogTeaser");
  const commits = await getCommits(4);

  return (
    <section className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <ScrambleLabel text={t("eyebrow")} className="font-mono text-xs uppercase tracking-[0.3em] text-accent" />
        <h2 className="mt-4 font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 text-lg text-zinc-400">{t("body")}</p>

        {commits.length > 0 && (
          <ul className="mt-10 divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
            {commits.map((c) => (
              <li key={c.sha} className="flex items-center gap-4 px-5 py-4">
                <code className="font-mono text-xs text-accent">{c.sha}</code>
                <p className="flex-1 truncate text-sm text-zinc-300">{c.message}</p>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/changelog"
          className="mt-8 inline-flex items-center gap-2 font-mono text-sm text-zinc-200 underline decoration-zinc-700 underline-offset-4 transition hover:decoration-accent"
        >
          {t("cta")} →
        </Link>
      </div>
    </section>
  );
}
