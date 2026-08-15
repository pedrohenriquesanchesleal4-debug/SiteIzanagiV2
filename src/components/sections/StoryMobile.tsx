"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/scroll";
import { LAYER_KEYS, INSTALL_COMMAND } from "@/content/agents";

/**
 * Mobile gets its own pace on purpose: no pinned/scrubbed canvas. A pinned
 * section fights the browser's own momentum scroll and the address-bar
 * resize-on-scroll on phones — it reads as "stuck", not cinematic. Here the
 * wordmark plays once on load, then everything is plain document flow with
 * lightweight enter-once reveals, so a swipe always visibly moves the page.
 */

function InstallCommandLine() {
  const t = useTranslations("install");
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(INSTALL_COMMAND);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — no-op, the command is still selectable text */
        }
      }}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3.5 text-left transition active:border-zinc-400"
    >
      <code className="font-mono text-sm text-zinc-200">
        <span className="select-none text-zinc-600">$ </span>
        {INSTALL_COMMAND}
      </code>
      <span className="shrink-0 font-mono text-xs text-zinc-500 group-active:text-accent">
        {copied ? t("copied") : t("copy")}
      </span>
    </button>
  );
}

export function StoryMobile() {
  const t = useTranslations();
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!reducedMotion) {
        gsap.fromTo(
          lineRefs.current.filter(Boolean),
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out", delay: 0.1 }
        );
        gsap.fromTo(
          "[data-mobile-dot]",
          { opacity: 0, scale: 0.4 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.04,
            ease: "back.out(1.6)",
            delay: 0.35,
          }
        );
      }

      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          }
        );
      });

      root.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
        const items = group.querySelectorAll<HTMLElement>("[data-reveal-item]");
        gsap.fromTo(
          items,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: group, start: "top 88%" },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const dots = Array.from({ length: 9 });

  return (
    <div ref={rootRef} className="relative bg-zinc-950">
      {/* Act 0 — Hero: cinematic boot. IZANAGI, then the pipeline it runs on. */}
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-16 pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-3 px-8 pt-8 opacity-70">
          {dots.map((_, i) => (
            <span
              key={i}
              data-mobile-dot
              className="h-2 w-2 rounded-full bg-zinc-700"
              style={{ marginLeft: `${(i % 4) * 14}px` }}
            />
          ))}
        </div>

        <p
          ref={(el) => {
            lineRefs.current[0] = el;
          }}
          className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-accent"
        >
          {t("hero.eyebrow")}
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.08] text-zinc-50">
          <span
            ref={(el) => {
              lineRefs.current[1] = el;
            }}
            className="block"
          >
            {t("hero.titleLine1")}
          </span>
          <span
            ref={(el) => {
              lineRefs.current[2] = el;
            }}
            className="block"
          >
            {t("hero.titleLine2")}
          </span>
          <span
            ref={(el) => {
              lineRefs.current[3] = el;
            }}
            className="block text-accent"
          >
            {t("hero.titleLine3")}
          </span>
        </h1>
        <p
          ref={(el) => {
            lineRefs.current[4] = el;
          }}
          className="mt-6 text-base text-zinc-400"
        >
          {t("hero.subtitle")}
        </p>
        <div
          ref={(el) => {
            lineRefs.current[5] = el;
          }}
          className="mt-8"
        >
          <InstallCommandLine />
        </div>
        <p
          ref={(el) => {
            lineRefs.current[6] = el;
          }}
          className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600"
        >
          {t("hero.scrollHint")}
        </p>
      </section>

      {/* Act 1 — Scene 1: an idea is easy, execution is not. */}
      <section data-reveal className="px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {t("problem.eyebrow")}
        </p>
        <h2 className="font-display text-2xl font-semibold leading-tight text-zinc-50">
          {t("problem.titleLine1")}
          <br />
          <span className="text-accent">{t("problem.titleLine2")}</span>
        </h2>
        <p className="mt-4 text-base text-zinc-400">{t("problem.body")}</p>
      </section>

      {/* Act 2 — Scenes 2+3: every task starts with intent; intent needs context. */}
      <section data-reveal className="px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {t("intent.eyebrow")}
        </p>
        <h2 className="font-display text-2xl font-semibold leading-tight text-zinc-50">
          {t("intent.titleLine1")}
          <br />
          <span className="text-accent">{t("intent.titleLine2")}</span>
        </h2>
        <p className="mt-4 text-base text-zinc-400">{t("intent.body")}</p>
      </section>

      {/* Act 3 — Scenes 4-7 compressed into the five-layer pipeline. */}
      <section className="px-6 py-16">
        <div data-reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {t("whatIsIt.eyebrow")}
          </p>
          <h2 className="font-display text-2xl font-semibold leading-tight text-zinc-50">
            {t("whatIsIt.titleLine1")}
            <br />
            <span className="text-accent">{t("whatIsIt.titleLine2")}</span>
          </h2>
          <p className="mt-4 text-base text-zinc-400">{t("whatIsIt.body")}</p>
        </div>
        <div data-reveal-stagger className="mt-8 grid grid-cols-1 gap-3">
          {LAYER_KEYS.map((key, i) => (
            <div
              key={key}
              data-reveal-item
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
            >
              <span className="font-mono text-xs text-accent">0{i + 1}</span>
              <p className="mt-1 font-display text-sm font-medium text-zinc-100">
                {t(`whatIsIt.layers.${key}.title`)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {t(`whatIsIt.layers.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Act 4 — Scene 8: every failure becomes memory, the system evolves. */}
      <section data-reveal className="px-6 py-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {t("evolution.eyebrow")}
        </p>
        <h2 className="font-display text-2xl font-semibold leading-tight text-zinc-50">
          {t("evolution.titleLine1")}
          <br />
          <span className="text-accent">{t("evolution.titleLine2")}</span>
        </h2>
        <p className="mt-4 text-base text-zinc-400">{t("evolution.body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#agents"
            className="rounded-full bg-zinc-50 px-5 py-3 text-sm font-medium text-zinc-950"
          >
            {t("evolution.ctaPrimary")}
          </a>
          <a
            href="#install"
            className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-100"
          >
            {t("evolution.ctaSecondary")}
          </a>
        </div>
      </section>
    </div>
  );
}
