"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { DOMAIN_ORDER } from "@/content/agents";
import { AGENTS_DATA } from "@/lib/agentAtlasData";
import { AgentAtlasDetail } from "./AgentAtlasDetail";

/**
 * Touch/narrow-viewport fallback: a searchable, groupable list instead of a
 * spatial map — same underlying data and detail content as the desktop atlas,
 * just without hover/click-on-canvas interactions that don't translate to touch.
 */
export function AgentAtlasMobile() {
  const t = useTranslations("agentsSection");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AGENTS_DATA;
    return AGENTS_DATA.filter(
      (a) => a.slug.includes(q) || a.role.toLowerCase().includes(q) || a.domain.includes(q)
    );
  }, [query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("atlas.search")}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-accent/60 focus:outline-none"
      />

      <div className="mt-6 space-y-8">
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-500">{t("atlas.noResults")}</p>
        )}
        {DOMAIN_ORDER.map((domain) => {
          const inDomain = filtered.filter((a) => a.domain === domain);
          if (inDomain.length === 0) return null;
          return (
            <div key={domain}>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-zinc-500">
                {t(`domains.${domain}`)}
              </h3>
              <div className="space-y-2">
                {inDomain.map((agent) => {
                  const isOpen = expanded === agent.slug;
                  return (
                    <div
                      key={agent.slug}
                      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : agent.slug)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                      >
                        <span
                          className={`font-display text-sm font-medium ${
                            isOpen ? "text-accent" : "text-zinc-100"
                          }`}
                        >
                          {t(`items.${agent.slug}.title`)}
                        </span>
                        <span
                          aria-hidden
                          className={`font-mono text-xs text-zinc-500 transition-transform ${
                            isOpen ? "rotate-45" : ""
                          }`}
                        >
                          +
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-zinc-800 px-4 py-5">
                              <AgentAtlasDetail slug={agent.slug} onJump={setExpanded} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
