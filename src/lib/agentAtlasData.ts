import agentsJson from "@/content/agents.generated.json";
import skillsJson from "@/content/skills.generated.json";
import type { AgentDomain } from "@/content/agents";

export interface AgentHandoff {
  to: string;
  reason: string;
}

export interface AgentAtlasNode {
  slug: string;
  name: string;
  role: string;
  domain: AgentDomain;
  skills: string[];
  handoffs: AgentHandoff[];
  always: string[];
  never: string[];
}

export interface SkillEntry {
  slug: string;
  name: string;
  description: string;
  category: string;
}

export const AGENTS_DATA: AgentAtlasNode[] = agentsJson as AgentAtlasNode[];
export const SKILLS_DATA: SkillEntry[] = skillsJson as SkillEntry[];

export const SKILLS_BY_SLUG: Record<string, SkillEntry> = Object.fromEntries(
  SKILLS_DATA.map((s) => [s.slug, s])
);

export const AGENTS_BY_SLUG: Record<string, AgentAtlasNode> = Object.fromEntries(
  AGENTS_DATA.map((a) => [a.slug, a])
);

export interface Point {
  x: number;
  y: number;
}

export interface AtlasEdge {
  from: string;
  to: string;
  reason: string;
}

// Every edge implied by handoffs, source -> target. Targets are guaranteed to
// exist within AGENTS_DATA (verified at generation time against the 21 real
// agent slugs), but the lookup still guards defensively.
export const ATLAS_EDGES: AtlasEdge[] = AGENTS_DATA.flatMap((agent) =>
  agent.handoffs
    .filter((h) => AGENTS_BY_SLUG[h.to])
    .map((h) => ({ from: agent.slug, to: h.to, reason: h.reason }))
);

// Cluster centers in a 0-100 x 0-100 percentage space (pentagon-ish layout,
// architecture at the hub since it receives/sends the most handoffs).
const CLUSTER_CENTERS: Record<AgentDomain, Point> = {
  discovery: { x: 17, y: 22 },
  meta: { x: 83, y: 20 },
  architecture: { x: 50, y: 55 },
  quality: { x: 84, y: 82 },
  experience: { x: 16, y: 80 },
};

const CLUSTER_SPREAD: Record<AgentDomain, number> = {
  discovery: 13,
  meta: 10,
  architecture: 22,
  quality: 13,
  experience: 13,
};

const GOLDEN_ANGLE_DEG = 137.50776;

/** Deterministic spiral placement — no Math.random so SSR/CSR match exactly. */
function spiralOffsets(count: number, spread: number): Point[] {
  if (count <= 1) return [{ x: 0, y: 0 }];
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    const angleRad = ((i * GOLDEN_ANGLE_DEG) * Math.PI) / 180;
    const r = spread * Math.sqrt((i + 0.6) / count);
    pts.push({ x: r * Math.cos(angleRad), y: r * Math.sin(angleRad) * 0.72 });
  }
  return pts;
}

export interface PositionedAgent extends AgentAtlasNode {
  x: number;
  y: number;
}

/** Groups agents by domain, then spiral-distributes each group around its cluster center. */
export function computeAtlasLayout(domainOrder: AgentDomain[]): PositionedAgent[] {
  const result: PositionedAgent[] = [];
  for (const domain of domainOrder) {
    const members = AGENTS_DATA.filter((a) => a.domain === domain);
    const offsets = spiralOffsets(members.length, CLUSTER_SPREAD[domain]);
    const center = CLUSTER_CENTERS[domain];
    members.forEach((agent, i) => {
      const off = offsets[i];
      result.push({
        ...agent,
        x: Math.min(97, Math.max(3, center.x + off.x)),
        y: Math.min(96, Math.max(6, center.y + off.y)),
      });
    });
  }
  return result;
}

export const CLUSTER_LABEL_POS: Record<AgentDomain, Point> = CLUSTER_CENTERS;

export function agentFilePath(slug: string): string {
  return `node_modules/izanagi-ai/agents/${slug}-agent.json`;
}

export function skillFilePath(slug: string): string {
  return `node_modules/izanagi-ai/skills/${slug}/SKILL.md`;
}
