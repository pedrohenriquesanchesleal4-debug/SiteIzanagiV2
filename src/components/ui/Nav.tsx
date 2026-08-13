"use client";

import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { REPO_URL } from "@/content/agents";

export function Nav() {
  const t = useTranslations("nav");

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-8">
      <nav className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-zinc-800/80 bg-zinc-950/70 px-4 py-2.5 backdrop-blur-md">
        <Link href="/" className="font-display text-sm font-semibold tracking-wide text-zinc-50">
          IZANAGI
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          <a href="#agents" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            {t("agents")}
          </a>
          <a href="#install" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            {t("install")}
          </a>
          <Link href="/changelog" className="text-sm text-zinc-400 transition hover:text-zinc-100">
            {t("changelog")}
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 transition hover:text-zinc-100"
          >
            {t("github")}
          </a>
        </div>
        <LocaleSwitcher />
      </nav>
    </header>
  );
}
