/**
 * Fixed film-grain texture over the whole page — the single cheapest signal
 * that separates a hand-finished site from a flat "AI template" one. Pure
 * SVG feTurbulence + CSS, no JS, no bundle cost. Frozen instantly under
 * prefers-reduced-motion via the global rule in globals.css.
 */
export function GrainOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.05] mix-blend-soft-light"
    >
      <svg className="h-full w-full animate-grain-shift" preserveAspectRatio="none">
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain-filter)" />
      </svg>
    </div>
  );
}
