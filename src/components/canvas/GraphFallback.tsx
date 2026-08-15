const NODES = [
  { x: 20, y: 30, r: 3 }, { x: 35, y: 18, r: 2.4 }, { x: 12, y: 48, r: 2 },
  { x: 48, y: 40, r: 3.2 }, { x: 62, y: 22, r: 2.2 }, { x: 70, y: 55, r: 3 },
  { x: 82, y: 35, r: 2.4 }, { x: 90, y: 60, r: 2 }, { x: 55, y: 70, r: 2.6 },
  { x: 30, y: 78, r: 2 }, { x: 8, y: 68, r: 2.4 }, { x: 75, y: 80, r: 2.8 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [3, 8], [8, 9], [9, 10], [8, 11], [5, 11],
];

/**
 * CSS/SVG stand-in for <AgentGraph> — used on mobile, low-power devices, or
 * when the visitor asks for prefers-reduced-motion. Same "orchestration"
 * motif, none of the WebGL/GSAP scroll-scrub cost.
 */
export function GraphFallback() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full opacity-70"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Monochrome accent ramp (opacity only, no second hue) — keeps the
            depth cue without reintroducing a bicolor gradient. */}
        <linearGradient id="graph-fallback-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d98a2b" stopOpacity="1" />
          <stop offset="100%" stopColor="#d98a2b" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a].x}
          y1={NODES[a].y}
          x2={NODES[b].x}
          y2={NODES[b].y}
          stroke="url(#graph-fallback-accent)"
          strokeWidth={0.25}
          className="motion-safe:animate-[fallback-edge_5s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
      {NODES.map((n, i) => (
        <circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={n.r}
          fill="url(#graph-fallback-accent)"
          className="motion-safe:animate-[fallback-node_4s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.22}s`, transformOrigin: `${n.x}px ${n.y}px` }}
        />
      ))}
    </svg>
  );
}
