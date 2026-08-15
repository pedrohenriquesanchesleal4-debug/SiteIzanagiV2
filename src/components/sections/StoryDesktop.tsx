"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { SceneHost } from "@/components/canvas/SceneHost";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { LAYER_KEYS } from "@/content/agents";
import { Magnetic } from "@/components/ui/Magnetic";

const ACT_COUNT = 3;

/**
 * Windowed cross-fade for act `i` out of `ACT_COUNT`, driven purely by the
 * wrapper's own scroll progress (0..1) — NOT by each act's own bounding box.
 *
 * Acts live inside a `position: sticky` box, so their client rect stays put
 * while pinned; a ScrollTrigger keyed to an act's own top/bottom (the usual
 * pattern) never fires correctly in there. Computing opacity as a function
 * of one reliable progress value (measured on the tall, non-sticky wrapper)
 * sidesteps that entirely.
 */
function actOpacity(progress: number, i: number) {
  const seg = 1 / ACT_COUNT;
  const center = (i + 0.5) * seg;
  const halfWidth = seg * 0.75;
  let opacity = 1 - Math.abs(progress - center) / halfWidth;

  if (i === 0 && progress <= center) opacity = 1;
  if (i === ACT_COUNT - 1 && progress >= center) opacity = 1;

  return Math.min(Math.max(opacity, 0), 1);
}

export function StoryDesktop() {
  const t = useTranslations();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const actRefs = useRef<(HTMLDivElement | null)[]>([]);
  const eyebrowRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const scrambledRef = useRef<boolean[]>([false, false, false]);
  const progressRef = useRef(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The eyebrow scramble-in can't use its own ScrollTrigger (see the
    // component-level comment: nested triggers inside this sticky box don't
    // track scroll) — instead it piggybacks on the one progress value we
    // already compute reliably, firing once per act the first time it's
    // more than half-visible.
    function maybeScramble(i: number, opacity: number) {
      if (reducedMotion || scrambledRef.current[i] || opacity < 0.5) return;
      const el = eyebrowRefs.current[i];
      if (!el) return;
      scrambledRef.current[i] = true;
      const finalText = el.textContent ?? "";
      gsap.to(el, {
        duration: 0.8,
        scrambleText: { text: finalText, chars: "01<>/\\{}[]#$%", speed: 0.4, revealDelay: 0.05 },
        ease: "none",
      });
    }

    function applyProgress(progress: number) {
      progressRef.current = progress;
      actRefs.current.forEach((act, i) => {
        if (!act) return;
        const opacity = actOpacity(progress, i);
        act.style.opacity = opacity.toFixed(3);
        act.style.transform = `translateY(${(1 - opacity) * 20}px)`;
        act.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
        act.setAttribute("aria-hidden", opacity < 0.5 ? "true" : "false");
        maybeScramble(i, opacity);
      });
    }

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        onUpdate: (self) => applyProgress(self.progress),
      });
      applyProgress(trigger.progress);
    }, wrapper);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapperRef} className="relative" style={{ height: "320vh" }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-zinc-950">
        <div className="absolute inset-0">
          <SceneHost progressRef={progressRef} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950" />

        <div
          ref={(el) => {
            actRefs.current[0] = el;
          }}
          className="absolute inset-0 z-10 flex items-center px-6 will-change-[opacity,transform] sm:px-12"
        >
          <div className="max-w-3xl">
            <p
              ref={(el) => {
                eyebrowRefs.current[0] = el;
              }}
              className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-accent"
            >
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] text-zinc-50 sm:text-6xl lg:text-7xl">
              {t("hero.titleLine1")}
              <br />
              {t("hero.titleLine2")}
              <br />
              <span className="text-accent">{t("hero.titleLine3")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-400">{t("hero.subtitle")}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Magnetic>
                <a
                  href="#agents"
                  className="rounded-full bg-zinc-50 px-6 py-3 text-sm font-medium text-zinc-950 transition hover:bg-accent"
                >
                  {t("hero.ctaPrimary")}
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#install"
                  className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-400"
                >
                  {t("hero.ctaSecondary")}
                </a>
              </Magnetic>
            </div>
            <p className="mt-14 font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">
              {t("hero.scrollHint")}
            </p>
          </div>
        </div>

        <div
          ref={(el) => {
            actRefs.current[1] = el;
          }}
          className="absolute inset-0 z-10 flex items-center px-6 opacity-0 will-change-[opacity,transform] sm:px-12"
        >
          <div className="max-w-2xl">
            <p
              ref={(el) => {
                eyebrowRefs.current[1] = el;
              }}
              className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-accent"
            >
              {t("problem.eyebrow")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
              {t("problem.title")}
            </h2>
            <p className="mt-6 text-lg text-zinc-400">{t("problem.body")}</p>
          </div>
        </div>

        <div
          ref={(el) => {
            actRefs.current[2] = el;
          }}
          className="absolute inset-0 z-10 flex items-center px-6 opacity-0 will-change-[opacity,transform] sm:px-12"
        >
          <div className="max-w-2xl">
            <p
              ref={(el) => {
                eyebrowRefs.current[2] = el;
              }}
              className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-accent"
            >
              {t("whatIsIt.eyebrow")}
            </p>
            <h2 className="font-display text-3xl font-semibold text-zinc-50 sm:text-5xl">
              {t("whatIsIt.title")}
            </h2>
            <p className="mt-5 text-lg text-zinc-400">{t("whatIsIt.body")}</p>
            <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LAYER_KEYS.map((key, i) => (
                <li
                  key={key}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
                >
                  <span className="font-mono text-xs text-accent">0{i + 1}</span>
                  <p className="mt-1 font-display text-sm font-medium text-zinc-100">
                    {t(`whatIsIt.layers.${key}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {t(`whatIsIt.layers.${key}.desc`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
