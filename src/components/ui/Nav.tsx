"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Link } from "@/i18n/navigation";
import { REPO_URL } from "@/content/agents";
import { useChat } from "./ChatWidget";

const SECTION_LINKS = [
  { key: "architecture", href: "#architecture" },
  { key: "agents", href: "#agents" },
  { key: "simulator", href: "#simulator" },
  { key: "skills", href: "#skills" },
  { key: "playground", href: "#playground" },
  { key: "timeline", href: "#timeline" },
  { key: "install", href: "#install" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const tChat = useTranslations("chat");
  const { open, toggleChat } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // Close the mobile menu whenever an in-page anchor is followed, since it
  // doesn't trigger a route change we could otherwise hook into.
  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-8">
      <nav className="pointer-events-auto flex w-full max-w-5xl flex-col rounded-[28px] border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md sm:rounded-full">
        <div className="flex w-full items-center justify-between px-4 py-2.5">
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
          <div className="flex items-center gap-2 sm:gap-3">
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
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={t("menuLabel")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 sm:hidden"
            >
              <span className="sr-only">{t("menuLabel")}</span>
              <span className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 top-0 h-px w-4 bg-current transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
                />
                <span
                  className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-opacity ${menuOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`absolute left-0 top-3 h-px w-4 bg-current transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
                />
              </span>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div
            id="mobile-nav-menu"
            className="flex flex-col gap-1 border-t border-zinc-800/80 px-4 pb-4 pt-2 sm:hidden"
          >
            {SECTION_LINKS.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-2 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-50"
              >
                {t(link.key)}
              </a>
            ))}
            <Link
              href="/changelog"
              onClick={closeMenu}
              className="rounded-lg px-2 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-50"
            >
              {t("changelog")}
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="rounded-lg px-2 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-50"
            >
              {t("github")}
            </a>
            <div className="mt-2 border-t border-zinc-800/80 pt-3">
              <LocaleSwitcher />
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
