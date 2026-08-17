import { getTranslations } from "next-intl/server";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";

const CARDS = ["dashboard", "arena"] as const;
const COMMANDS: Record<(typeof CARDS)[number], string> = {
  dashboard: "izanagi dashboard",
  arena: "izanagi arena run",
};

export async function RuntimeTools() {
  const t = await getTranslations("runtimeTools");

  return (
    <section className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <ScrambleLabel text={t("eyebrow")} className="font-mono text-xs uppercase tracking-[0.3em] text-accent" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-5 text-lg text-zinc-400">{t("body")}</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {CARDS.map((card) => {
            const points = t.raw(`${card}.points`) as string[];
            return (
              <div
                key={card}
                className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8"
              >
                <h3 className="font-display text-xl font-semibold text-zinc-50">
                  {t(`${card}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {t(`${card}.body`)}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm text-zinc-500">
                      <span className="mt-0.5 text-accent">→</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <code className="mt-8 block w-fit rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-400">
                  <span className="select-none text-zinc-600">$ </span>
                  {COMMANDS[card]}
                </code>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
