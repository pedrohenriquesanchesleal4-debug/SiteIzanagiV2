"use client";

import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { REPO_URL } from "@/content/agents";
import { useChat } from "./ChatWidget";

export function Nav() {
  const t = useTranslations("nav");
  const tChat = useTranslations("chat");
  const { open, toggleChat } = useChat();

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleChat}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition sm:text-sm ${
              open
                ? "border-accent/60 text-accent"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
            }`}
          >
            {tChat("launcherLabel")}
          </button>
          <LocaleSwitcher />
        </div>
      </nav>
    </header>
  );
}
