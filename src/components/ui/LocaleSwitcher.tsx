"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

const LABELS: Record<string, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

export function LocaleSwitcher() {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 p-1"
      role="group"
      aria-label={t("label")}
    >
      {routing.locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={isPending}
          aria-current={code === locale}
          onClick={() => {
            startTransition(() => {
              router.replace(pathname, { locale: code });
            });
          }}
          className={`rounded-full px-2.5 py-1 font-mono text-[11px] transition ${
            code === locale
              ? "bg-zinc-50 text-zinc-950"
              : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
