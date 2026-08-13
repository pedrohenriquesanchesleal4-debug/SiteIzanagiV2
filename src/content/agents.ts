export type AgentDomain =
  | "discovery"
  | "architecture"
  | "quality"
  | "experience"
  | "meta";

export interface AgentDef {
  slug: string;
  command: string;
  domain: AgentDomain;
}

export const DOMAIN_ORDER: AgentDomain[] = [
  "discovery",
  "architecture",
  "quality",
  "experience",
  "meta",
];

export const AGENTS: AgentDef[] = [
  { slug: "discovery", command: "/discovery", domain: "discovery" },
  { slug: "product-reasoner", command: "/product-reasoner", domain: "discovery" },
  { slug: "pm", command: "/pm", domain: "discovery" },
  { slug: "researcher", command: "/researcher", domain: "discovery" },

  { slug: "architect", command: "/architect", domain: "architecture" },
  { slug: "senior-engineer", command: "/senior-engineer", domain: "architecture" },
  { slug: "techlead", command: "/techlead", domain: "architecture" },
  { slug: "database", command: "/database", domain: "architecture" },
  { slug: "devops", command: "/devops", domain: "architecture" },
  { slug: "security", command: "/security", domain: "architecture" },
  { slug: "automation-engineer", command: "/automation-engineer", domain: "architecture" },
  { slug: "form-engineer", command: "/form-engineer", domain: "architecture" },

  { slug: "qa", command: "/qa", domain: "quality" },
  { slug: "bug-hunter", command: "/bug-hunter", domain: "quality" },
  { slug: "evaluator", command: "/evaluator", domain: "quality" },
  { slug: "adversarial-critic", command: "/adversarial-critic", domain: "quality" },

  { slug: "animation", command: "/animation", domain: "experience" },
  { slug: "docs", command: "/docs", domain: "experience" },
  { slug: "professor", command: "/professor", domain: "experience" },

  { slug: "agent-architect", command: "/agent-architect", domain: "meta" },
  { slug: "skill-architect", command: "/skill-architect", domain: "meta" },
];

export const LAYER_KEYS = [
  "routing",
  "orchestration",
  "evaluation",
  "healing",
  "memory",
] as const;

export const REPO_URL = "https://github.com/pedrohenriquesanchesleal4-debug/izanagi-ai";
export const REPO_FULL_NAME = "pedrohenriquesanchesleal4-debug/izanagi-ai";
export const NPM_URL = "https://www.npmjs.com/package/izanagi-ai";
export const INSTALL_COMMAND = "npx izanagi init";
