// One-time / on-demand build step: turns the izanagi-ai package's own
// agent JSONs and skill frontmatter into small, UI-ready JSON files the
// site can render (Agent Atlas cards/detail views, skill directory) without
// hand-typing content that drifts from the real framework. Run with:
//   node scripts/build-framework-data.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, "..");
const PKG_ROOT = path.resolve(SITE_ROOT, "node_modules", "izanagi-ai");
const AGENTS_DIR = path.join(PKG_ROOT, "agents");
const SKILLS_DIR = path.join(PKG_ROOT, "skills");
const RESOLVER_PATH = path.join(PKG_ROOT, "core", "skill-resolver.json");
const AGENTS_OUT = path.join(SITE_ROOT, "src", "content", "agents.generated.json");
const SKILLS_OUT = path.join(SITE_ROOT, "src", "content", "skills.generated.json");

if (!existsSync(PKG_ROOT)) {
  console.error(`izanagi-ai package not found at ${PKG_ROOT}`);
  process.exit(1);
}

// Same slug -> domain grouping as the hand-written src/content/agents.ts
// (kept in sync manually since the real agent JSONs carry no domain field).
const DOMAIN_BY_SLUG = {
  discovery: "discovery",
  "product-reasoner": "discovery",
  pm: "discovery",
  researcher: "discovery",

  architect: "architecture",
  "senior-engineer": "architecture",
  "ai-engineer": "architecture",
  techlead: "architecture",
  database: "architecture",
  devops: "architecture",
  security: "architecture",
  "automation-engineer": "architecture",
  "form-engineer": "architecture",

  qa: "quality",
  "bug-hunter": "quality",
  evaluator: "quality",
  "adversarial-critic": "quality",

  animation: "experience",
  docs: "experience",
  professor: "experience",

  "agent-architect": "meta",
  "skill-architect": "meta",
};

function deriveAgentSlug(filename) {
  // e.g. "adversarial-critic-agent.json" -> "adversarial-critic"
  return filename.replace(/\.json$/, "").replace(/-agent$/, "");
}

function buildAgents() {
  const files = readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".json"));
  const agents = files
    .map((file) => {
      const json = JSON.parse(readFileSync(path.join(AGENTS_DIR, file), "utf8"));
      const slug = deriveAgentSlug(file);
      const domain = DOMAIN_BY_SLUG[slug] ?? "meta";

      return {
        slug,
        name: json.name,
        role: json.role,
        domain,
        skills: Array.isArray(json.skills) ? json.skills : [],
        handoffs: Array.isArray(json.handoffs)
          ? json.handoffs.map((h) => ({ to: h.to, reason: h.reason }))
          : [],
        always: Array.isArray(json.always) ? json.always.slice(0, 4) : [],
        never: Array.isArray(json.never) ? json.never.slice(0, 4) : [],
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  writeFileSync(AGENTS_OUT, JSON.stringify(agents, null, 2) + "\n");
  console.log(`Wrote ${agents.length} agents to ${AGENTS_OUT}`);
  return agents;
}

// Frontmatter parser tolerant of the two shapes actually used in this repo's
// SKILL.md files: a quoted single-line value (`description: "..."`, the
// common case) and a ">" folded block scalar spanning indented lines below
// the key (used by at least one skill, e.g. skills/caveman/SKILL.md).
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const lines = match[1].split("\n");
  const fm = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const idx = line.indexOf(":");
    if (idx === -1) {
      i++;
      continue;
    }
    const key = line.slice(0, idx).trim();
    let rawValue = line.slice(idx + 1).trim();

    if (rawValue === ">" || rawValue === "|") {
      // Folded/literal block scalar: collect subsequent indented lines.
      const blockLines = [];
      i++;
      while (i < lines.length && (lines[i].startsWith("  ") || lines[i].trim() === "")) {
        blockLines.push(lines[i].trim());
        i++;
      }
      fm[key] = blockLines.join(" ").trim();
      continue;
    }

    if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      rawValue = rawValue.slice(1, -1);
    } else if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
      rawValue = rawValue.slice(1, -1);
    }
    fm[key] = rawValue;
    i++;
  }
  return fm;
}

// No per-skill category/domain field exists anywhere in the package: the
// only categorization in .manifest groups skills by which top-level folder
// they live in ("Skill Library", "Teaching", "Coding", ...), and every file
// under skills/*/SKILL.md falls into the single undifferentiated "Skill
// Library" bucket; core/skill-resolver.json's aliases map has no category
// field either. So category is derived with a keyword heuristic over each
// skill's name + description (checked in this priority order).
const CATEGORY_RULES = [
  { category: "testing-qa", pattern: /\b(teste|test|tdd|qa\b|quality assurance|playwright|e2e|wcag|accessib|acessibilidade|cobertura)/i },
  { category: "security", pattern: /\b(segurança|security|owasp|vulnerab|credencia|secret|pentest|privacy|privacidade|auth)/i },
  { category: "database", pattern: /\b(banco de dados|database|sql\b|postgres|mysql|redis|mongo|query|schema|migra[cç][aã]o)/i },
  { category: "devops", pattern: /\b(devops|docker|kubernetes|k8s|ci\/cd|terraform|infra|deploy|pipeline|observability|monitoring|logging|sre\b)/i },
  { category: "frontend", pattern: /\b(frontend|front-end|ui\/ux|ui\b|ux\b|css|react|vue|animation|animação|design system|acessib|componente|webgl|motion)/i },
  { category: "architecture", pattern: /\b(arquitetur|architecture|ddd\b|cqrs|microservi|hexagonal|clean architecture|design pattern|padr(ã|a)o arquitetural)/i },
  { category: "documentation", pattern: /\b(documenta|readme|technical writ|escrita t[eé]cnica|diagrama)/i },
  { category: "ai-agent", pattern: /\b(agente|agent\b|llm\b|prompt|ia\b|ai\b|hallucina|alucina)/i },
];

function categorize(name, description) {
  const haystack = `${name} ${description}`;
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }
  return "misc";
}

// Real cross-skill dependency signal, derived (not fabricated) from
// core/skill-resolver.json's "compositions" map: each composition is a named
// workflow ("web_cinematic", "security_audit", ...) with a "chain" of short
// IDs meant to run together. A short ID resolves to one of our real skill
// slugs either directly (chain entries are often already bare skill slugs,
// e.g. "qa", "frontend") or via the resolver's "aliases" map when the alias
// target is itself a `skills/<slug>` path (aliases pointing at the other
// category folders — architecture/, coding/, security/, etc. — are out of
// scope, same as buildSkills below, and left unresolved). Any two resolved
// slugs that co-occur in a chain are recorded as dependencies of each other.
function buildSkillDependencies(skillSlugs) {
  if (!existsSync(RESOLVER_PATH)) return {};
  const resolver = JSON.parse(readFileSync(RESOLVER_PATH, "utf8"));
  const aliases = resolver.aliases ?? {};
  const compositions = resolver.compositions ?? {};

  const resolve = (id) => {
    if (skillSlugs.has(id)) return id;
    const target = aliases[id];
    if (target && target.startsWith("skills/")) {
      const candidate = target.slice("skills/".length).split("/")[0];
      if (skillSlugs.has(candidate)) return candidate;
    }
    return null;
  };

  const depMap = {};
  for (const composition of Object.values(compositions)) {
    const chain = Array.isArray(composition.chain) ? composition.chain : [];
    const resolved = [...new Set(chain.map(resolve).filter(Boolean))];
    for (const slug of resolved) {
      const others = resolved.filter((s) => s !== slug);
      const set = depMap[slug] ?? new Set();
      others.forEach((o) => set.add(o));
      depMap[slug] = set;
    }
  }

  // Cap so the UI never has to render a wall of "dependencies" for the
  // heavily-shared skills (design-directions, frontend, qa, ...).
  const capped = {};
  for (const [slug, set] of Object.entries(depMap)) {
    capped[slug] = [...set].sort().slice(0, 6);
  }
  return capped;
}

function buildSkills() {
  const names = readdirSync(SKILLS_DIR).filter((n) =>
    statSync(path.join(SKILLS_DIR, n)).isDirectory()
  );

  const withoutDeps = names
    .map((slug) => {
      const filePath = path.join(SKILLS_DIR, slug, "SKILL.md");
      if (!existsSync(filePath)) return null;
      const content = readFileSync(filePath, "utf8");
      const fm = parseFrontmatter(content);
      if (!fm.name || !fm.description) return null;

      return {
        slug,
        name: fm.name,
        description: fm.description,
        category: categorize(fm.name, fm.description),
      };
    })
    .filter(Boolean);

  const skillSlugs = new Set(withoutDeps.map((s) => s.slug));
  const depMap = buildSkillDependencies(skillSlugs);

  const skills = withoutDeps
    .map((skill) => {
      const dependencies = depMap[skill.slug];
      return dependencies && dependencies.length > 0
        ? { ...skill, dependencies }
        : skill;
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));

  writeFileSync(SKILLS_OUT, JSON.stringify(skills, null, 2) + "\n");
  console.log(`Wrote ${skills.length} skills to ${SKILLS_OUT}`);
  return skills;
}

buildAgents();
buildSkills();
