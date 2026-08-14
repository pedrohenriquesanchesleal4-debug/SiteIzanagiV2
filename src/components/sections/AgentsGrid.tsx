"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { AGENTS, DOMAIN_ORDER, type AgentDomain } from "@/content/agents";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { ScrambleLabel } from "@/components/ui/ScrambleLabel";

const DOMAIN_ACCENT: Record<AgentDomain, string> = {
  discovery: "from-cyan-400/20 to-transparent",
  architecture: "from-violet-400/20 to-transparent",
  quality: "from-emerald-400/20 to-transparent",
  experience: "from-amber-400/20 to-transparent",
  meta: "from-pink-400/20 to-transparent",
};

export function AgentsGrid() {
  const t = useTranslations("agentsSection");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      const cards = root.querySelectorAll<HTMLElement>("[data-agent-card]");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          scrollTrigger: { trigger: root, start: "top 80%" },
        }
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="agents" ref={rootRef} className="relative bg-zinc-950 px-6 py-28 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <ScrambleLabel text={t("eyebrow")} className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400" />
        <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-zinc-400">{t("body")}</p>

        <div className="mt-16 space-y-14">
          {DOMAIN_ORDER.map((domain) => {
            const agentsInDomain = AGENTS.filter((a) => a.domain === domain);
            return (
              <div key={domain}>
                <h3 className="mb-5 font-mono text-sm uppercase tracking-widest text-zinc-500">
                  {t(`domains.${domain}`)}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {agentsInDomain.map((agent) => (
                    <div
                      key={agent.slug}
                      data-agent-card
                      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b p-5 transition hover:border-zinc-600 ${DOMAIN_ACCENT[domain]}`}
                    >
                      <p className="font-mono text-[11px] text-zinc-500">{agent.command}</p>
                      <p className="mt-2 font-display text-base font-medium text-zinc-100">
                        {t(`items.${agent.slug}.title`)}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                        {t(`items.${agent.slug}.desc`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
