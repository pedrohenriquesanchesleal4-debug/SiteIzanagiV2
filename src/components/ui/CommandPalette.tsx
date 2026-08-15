"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { REPO_URL } from "@/content/agents";
import { useChat } from "./ChatWidget";

type CommandAction =
  | { kind: "section"; id: string }
  | { kind: "route"; href: string }
  | { kind: "external"; href: string }
  | { kind: "chat" };

interface CommandItem {
  id: string;
  label: string;
  hint: string;
  action: CommandAction;
}

/**
 * Global Cmd/Ctrl+K command palette. A small, static list of real navigable
 * targets — no fuzzy-search library, no fake results. Mounted once in
 * layout.tsx, sits above everything (including the chat panel).
 */
export function CommandPalette() {
  const t = useTranslations("commandPalette");
  const router = useRouter();
  const pathname = usePathname();
  const { openChat } = useChat();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<CommandItem[]>(
    () => [
      {
        id: "architecture",
        label: t("architecture"),
        hint: t("architectureHint"),
        action: { kind: "section", id: "architecture" },
      },
      {
        id: "agents",
        label: t("agents"),
        hint: t("agentsHint"),
        action: { kind: "section", id: "agents" },
      },
      {
        id: "simulator",
        label: t("simulator"),
        hint: t("simulatorHint"),
        action: { kind: "section", id: "simulator" },
      },
      {
        id: "skills",
        label: t("skills"),
        hint: t("skillsHint"),
        action: { kind: "section", id: "skills" },
      },
      {
        id: "playground",
        label: t("playground"),
        hint: t("playgroundHint"),
        action: { kind: "section", id: "playground" },
      },
      {
        id: "timeline",
        label: t("timeline"),
        hint: t("timelineHint"),
        action: { kind: "section", id: "timeline" },
      },
      {
        id: "install",
        label: t("install"),
        hint: t("installHint"),
        action: { kind: "section", id: "install" },
      },
      {
        id: "changelog",
        label: t("changelog"),
        hint: t("changelogHint"),
        action: { kind: "route", href: "/changelog" },
      },
      {
        id: "github",
        label: t("github"),
        hint: t("githubHint"),
        action: { kind: "external", href: REPO_URL },
      },
      {
        id: "chat",
        label: t("chat"),
        hint: t("chatHint"),
        action: { kind: "chat" },
      },
    ],
    [t]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q)
    );
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const runAction = useCallback(
    (item: CommandItem) => {
      close();
      const { action } = item;
      if (action.kind === "section") {
        if (pathname === "/") {
          document
            .getElementById(action.id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          router.push(`/#${action.id}`);
        }
      } else if (action.kind === "route") {
        router.push(action.href);
      } else if (action.kind === "external") {
        window.open(action.href, "_blank", "noopener,noreferrer");
      } else if (action.kind === "chat") {
        openChat();
      }
    },
    [close, pathname, router, openChat]
  );

  // Global Cmd/Ctrl+K toggle. Resetting query/activeIndex here happens
  // inside the keydown handler (an event callback), not synchronously in
  // the effect body, so it doesn't trip the set-state-in-effect rule.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) {
            setQuery("");
            setActiveIndex(0);
          }
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus the input whenever the palette opens — no setState here, just a
  // DOM side effect, so it's a legitimate use of an effect.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) runAction(item);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("close")}
        onClick={close}
        className="fixed inset-0 z-[60] bg-zinc-950/80"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed left-1/2 top-24 z-[70] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2"
      >
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
            <span className="font-mono text-xs text-zinc-500">⌘K</span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={t("placeholder")}
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={close}
              aria-label={t("close")}
              className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-200"
            >
              {t("esc")}
            </button>
          </div>

          <ul className="max-h-80 overflow-y-auto py-2">
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                {t("noResults")}
              </li>
            )}
            {filtered.map((item, i) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => runAction(item)}
                  className={`flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition ${
                    i === activeIndex
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-300"
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <span
                    className={`font-mono text-xs ${
                      i === activeIndex ? "text-accent" : "text-zinc-600"
                    }`}
                  >
                    {item.hint}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
