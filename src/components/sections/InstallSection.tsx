"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { INSTALL_COMMAND } from "@/content/agents";

function CopyableLine({ text }: { text: string }) {
  const t = useTranslations("install");
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — no-op, the command is still selectable text */
        }
      }}
      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4 text-left transition hover:border-zinc-600"
    >
      <code className="font-mono text-sm text-zinc-200 sm:text-base">
        <span className="select-none text-zinc-600">$ </span>
        {text}
      </code>
      <span className="shrink-0 font-mono text-xs text-zinc-500 group-hover:text-cyan-400">
        {copied ? t("copied") : t("copy")}
      </span>
    </button>
  );
}

export function InstallSection() {
  const t = useTranslations("install");
  const steps = t.raw("steps") as string[];

  return (
    <section id="install" className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400">
          {t("eyebrow")}
        </p>
        <h2 className="mt-4 font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 text-lg text-zinc-400">{t("body")}</p>

        <div className="mt-10 space-y-3">
          {steps.map((step) => (
            <CopyableLine key={step} text={step} />
          ))}
        </div>

        <p className="mt-6 text-sm text-zinc-600">{t("note")}</p>
      </div>
    </section>
  );
}

export { INSTALL_COMMAND };
