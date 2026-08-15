"use client";

import { useTranslations } from "next-intl";
import { REPO_URL } from "@/content/agents";
import { Magnetic } from "@/components/ui/Magnetic";

export function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 py-32 sm:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,138,43,0.12),_transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 text-lg text-zinc-400">{t("body")}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <code className="rounded-full bg-zinc-50 px-6 py-3 font-mono text-sm font-medium text-zinc-950">
            {t("primary")}
          </code>
          <Magnetic>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-400"
            >
              {t("secondary")}
            </a>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
