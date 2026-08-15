"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { createContext, useContext, useEffect, useState } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
}

interface ScrollCtx {
  lenis: Lenis | null;
}

const ScrollContext = createContext<ScrollCtx>({ lenis: null });

export function useLenis() {
  return useContext(ScrollContext).lenis;
}

/**
 * Bridges Lenis' smooth-scroll RAF loop into GSAP's ticker so ScrollTrigger
 * reads the same interpolated scroll position Lenis renders.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const instance = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      autoRaf: false,
    });
    // Lenis has no "created" event to subscribe to instead: this mounts the
    // instance exactly once and publishes it to context consumers below —
    // it never loops or cascades.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      instance.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis }}>
      {children}
    </ScrollContext.Provider>
  );
}

export { gsap, ScrollTrigger };
