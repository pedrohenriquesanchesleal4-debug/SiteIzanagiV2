/**
 * Curated subset of the REAL Skill Composer compositions shipped in the
 * installed `izanagi-ai` package at
 * `node_modules/izanagi-ai/core/skill-resolver.json` (the `compositions`
 * object) and explained in `node_modules/izanagi-ai/core/skill-composer.md`.
 *
 * Nothing here is invented: every `id`, `triggers` phrase and `chain` step
 * slug is copied verbatim from that JSON. Nine of the fifteen real domains
 * are represented (a homepage widget showing all fifteen would be denser
 * than useful); each `chain` entry is the alias key exactly as it appears
 * in `skill-resolver.json`, resolved at render time against
 * `src/content/skills.generated.json` for category metadata where a real
 * skill folder exists for that alias (a few aliases — e.g. `backend`,
 * `db`, `security` — map to non-skill engine roles in the source package
 * and are rendered with a neutral "core engine" badge instead of a
 * fabricated category).
 *
 * Do not hand-invent new compositions or chain steps here — if the
 * upstream `skill-resolver.json` changes, update this file to match it.
 */

export interface SkillComposition {
  /** Exact key from skill-resolver.json → compositions */
  id: string;
  /** Exact trigger phrases from skill-resolver.json (kept verbatim, mixed pt/en as in source) */
  triggers: string[];
  /** Exact alias chain, in order, from skill-resolver.json */
  chain: string[];
  /** Exact `artifact` string from skill-resolver.json */
  artifact: string;
}

export const SKILL_COMPOSITIONS: SkillComposition[] = [
  {
    id: "web_cinematic",
    triggers: [
      "site animado",
      "landing",
      "scrollytelling",
      "site estilo video",
      "apple-style",
      "cinematic website",
    ],
    chain: [
      "design-directions",
      "ui-ux-pro-max",
      "frontend",
      "motion-design",
      "animation-web",
      "webgl-3d",
      "web-perf-seo",
      "a11y",
      "anti-ai-slop",
      "qa",
    ],
    artifact:
      "landing cinematografica completa (direcao de design escolhida + design system + componentes + scrollytelling + 3D + zero AI-slop + perf validada)",
  },
  {
    id: "webgl_experience",
    triggers: [
      "site 3d",
      "three.js",
      "webgl",
      "cena 3d",
      "shader",
      "particulas",
      "react three fiber",
    ],
    chain: [
      "design-directions",
      "ui-ux-pro-max",
      "webgl-3d",
      "animation-web",
      "motion-design",
      "frontend",
      "web-perf-seo",
      "anti-ai-slop",
    ],
    artifact: "cena 3D com scroll (direcao de design + zero AI-slop)",
  },
  {
    id: "api_backend",
    triggers: ["api", "rest", "endpoint", "graphql", "backend", "schema de api"],
    chain: ["architect", "backend", "db", "security", "graphql", "logging", "qa"],
    artifact: "API segura com schema validado",
  },
  {
    id: "security_audit",
    triggers: ["auditoria", "vulnerabilidade", "owasp", "pentest", "lgpd", "audit", "seguranca"],
    chain: ["security-privacy", "bug-hunter", "code-auditor", "qa"],
    artifact: "relatorio OWASP + fixes",
  },
  {
    id: "devops_delivery",
    triggers: ["deploy", "ci/cd", "infra", "terraform", "docker", "kubernetes", "slo", "serverless"],
    chain: ["cloud-infra", "iac-terraform", "serverless-edge", "sre-reliability", "logging", "observability"],
    artifact: "infra IaC + SLOs",
  },
  {
    id: "debug_session",
    triggers: ["bug", "erro", "crash", "stack trace", "null", "500", "quebrou", "exception"],
    chain: ["systematic-debugging", "root-cause", "bug", "tdd", "self-fix", "memoria-projeto"],
    artifact: "correcao com teste de regressao",
  },
  {
    id: "fullstack_crud",
    triggers: ["app completo", "crud", "fullstack", "sistema", "dashboard com backend", "saas"],
    chain: [
      "architect",
      "db",
      "backend",
      "design-directions",
      "frontend",
      "security",
      "ui-ux-pro-max",
      "anti-ai-slop",
      "parallel-agents",
      "qa",
      "memoria-projeto",
    ],
    artifact:
      "app fullstack completo (direcao de design + zero AI-slop + execucao paralela)",
  },
  {
    id: "ai_ml_feature",
    triggers: ["ia", "llm", "rag", "agente", "prompt", "chatbot", "embedding", "mcp"],
    chain: ["ai-agent", "prompt-eng", "backend", "db", "security", "observability"],
    artifact: "feature com LLM/RAG",
  },
  {
    id: "new_project_discovery",
    triggers: ["novo projeto", "ideia", "comecar do zero", "brainstorm", "viabilidade", "descoberta"],
    chain: [
      "brainstorming",
      "deep-research",
      "ui-ux-pro-max",
      "requirement-analyzer",
      "tradeoff",
      "risk",
      "task-planner",
    ],
    artifact: "prompt rico aprovado (nunca codigo)",
  },
];

/**
 * Alias (as used in `chain` above) → real skill slug in
 * `skills.generated.json`, taken verbatim from the `aliases` map in
 * `skill-resolver.json`. Aliases with no entry here (e.g. `backend`,
 * `db`, `security`) resolve to non-skill engine roles in the source
 * package (`coding/backend-engineer`, `database/database-engineer`,
 * `security/security-engineer`) and are rendered as a "core engine" step
 * instead of a fabricated skill card.
 */
export const CHAIN_ALIAS_TO_SKILL_SLUG: Record<string, string> = {
  "design-directions": "design-directions",
  "ui-ux-pro-max": "ui-ux-pro-max",
  frontend: "frontend",
  "motion-design": "motion-design",
  "animation-web": "animation-web",
  "webgl-3d": "webgl-3d",
  "web-perf-seo": "web-perf-seo",
  a11y: "accessibility-reviewer",
  "anti-ai-slop": "anti-ai-slop",
  qa: "qa",
  architect: "software-architect",
  graphql: "graphql",
  logging: "logging-expert",
  "security-privacy": "security-privacy",
  "bug-hunter": "bug-hunter",
  "code-auditor": "code-auditor",
  "cloud-infra": "cloud-infra",
  "iac-terraform": "iac-terraform",
  "serverless-edge": "serverless-edge",
  "sre-reliability": "sre-reliability",
  observability: "observability-expert",
  "systematic-debugging": "systematic-debugging",
  "root-cause": "root-cause-analyzer",
  bug: "bug-hunter",
  tdd: "tdd",
  "self-fix": "self-correction",
  "memoria-projeto": "memoria-projeto",
  "parallel-agents": "parallel-agents",
  "ai-agent": "ai-agent",
  "prompt-eng": "prompt-engineering",
  brainstorming: "brainstorming",
  "deep-research": "deep-research",
  "requirement-analyzer": "requirement-analyzer",
  tradeoff: "tradeoff-analyzer",
  risk: "risk-analyzer",
  "task-planner": "task-planner",
};
