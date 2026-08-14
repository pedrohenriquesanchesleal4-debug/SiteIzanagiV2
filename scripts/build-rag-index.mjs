// One-time / on-demand build step: turns the izanagi-ai package's own docs
// (AGENTS.md, SYSTEM.md, RULES.md, README.md, agent JSONs, skill frontmatter)
// into an embedded chunk index the chat API can do retrieval against at
// request time. Run with:
//   node --env-file=.env.local scripts/build-rag-index.mjs
import { GoogleGenAI } from "@google/genai";
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, "..");
const PKG_ROOT = path.resolve(SITE_ROOT, "..", "node_modules", "izanagi-ai");
const OUT_PATH = path.join(SITE_ROOT, "src", "content", "rag-index.json");
const EMBED_MODEL = "gemini-embedding-001";
const BATCH_SIZE = 20;

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("Missing GOOGLE_AI_API_KEY. Run with: node --env-file=.env.local scripts/build-rag-index.mjs");
  process.exit(1);
}
if (!existsSync(PKG_ROOT)) {
  console.error(`izanagi-ai package not found at ${PKG_ROOT}`);
  process.exit(1);
}

function splitMarkdownBySections(text) {
  const lines = text.split("\n");
  const sections = [];
  let heading = "Overview";
  let buffer = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body.length > 60) sections.push({ heading, body });
    buffer = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      flush();
      heading = line.replace(/^#{1,3}\s+/, "").trim();
    }
    buffer.push(line);
  }
  flush();
  return sections;
}

function readDocChunks(filename) {
  const filePath = path.join(PKG_ROOT, filename);
  if (!existsSync(filePath)) return [];
  const text = readFileSync(filePath, "utf8");
  return splitMarkdownBySections(text).map((s, i) => ({
    id: `${filename}#${i}-${s.heading.slice(0, 40)}`,
    source: filename,
    text: `[Izanagi AI framework docs — ${filename} — ${s.heading}]\n${s.body}`,
  }));
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    fm[key] = value;
  }
  return fm;
}

function readSkillChunks() {
  const skillsDir = path.join(PKG_ROOT, "skills");
  if (!existsSync(skillsDir)) return [];
  const names = readdirSync(skillsDir).filter((n) =>
    statSync(path.join(skillsDir, n)).isDirectory()
  );

  return names
    .map((name) => {
      const filePath = path.join(skillsDir, name, "SKILL.md");
      if (!existsSync(filePath)) return null;
      const content = readFileSync(filePath, "utf8");
      const fm = parseFrontmatter(content);
      if (!fm.description) return null;
      return {
        id: `skill::${name}`,
        source: `skills/${name}/SKILL.md`,
        text: `[Izanagi AI framework skill] "${name}": ${fm.description}`,
      };
    })
    .filter(Boolean);
}

function readAgentChunks() {
  const agentsDir = path.join(PKG_ROOT, "agents");
  if (!existsSync(agentsDir)) return [];
  const files = readdirSync(agentsDir).filter((f) => f.endsWith(".json"));

  return files
    .map((file) => {
      try {
        const json = JSON.parse(readFileSync(path.join(agentsDir, file), "utf8"));
        const parts = [
          `[Izanagi AI framework agent] "${json.name}"`,
          json.purpose ? `Purpose: ${json.purpose}` : "",
          Array.isArray(json.skills) && json.skills.length
            ? `Uses skills: ${json.skills.join(", ")}`
            : "",
          Array.isArray(json.always) && json.always.length
            ? `Always: ${json.always.slice(0, 4).join("; ")}`
            : "",
          Array.isArray(json.never) && json.never.length
            ? `Never: ${json.never.slice(0, 4).join("; ")}`
            : "",
        ].filter(Boolean);
        return { id: `agent::${json.name}`, source: `agents/${file}`, text: parts.join("\n") };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function readManualChunks() {
  return [
    {
      id: "manual::install",
      source: "manual",
      text:
        "[Izanagi AI — how to install] Install globally with `npm install -g izanagi-ai`, or run without installing via `npx izanagi <command>`. The CLI binary is available as both `izanagi` and `izanagi-ai`. First step in a new project: `npx izanagi init` — it auto-detects which AI CLI/IDE you're using (Claude Code, Cursor, Codex, Copilot, Kimi) and generates only the adapter files that CLI needs. Published on npm as `izanagi-ai`, MIT licensed, source at github.com/pedrohenriquesanchesleal4-debug/izanagi-ai.",
    },
    {
      id: "manual::architecture",
      source: "manual",
      text:
        "[Izanagi AI — architecture] Izanagi is a layered runtime for autonomous software engineering: Routing (picks the right agent/skill for a task) → Orchestration (chains skills and agents into an execution graph) → Evaluation (scores the output against weighted metrics with a PASS/FAIL-style verdict) → Self-Healing (detects failures at runtime and corrects course without human intervention) → Memory (persistent, anti-repetition memory of past decisions and mistakes across runs, stored in `.agents/memoria/`). It ships 21 core specialized agents plus skills organized by domain, and a Skill Composer that chains skills together per task type.",
    },
    {
      id: "manual::commands",
      source: "manual",
      text:
        "[Izanagi AI — CLI commands] Key commands: `izanagi init` scaffolds a project; `izanagi run [agent] --task \"...\"` executes a task through the adaptive runtime; `izanagi agent create` / `izanagi skill create` generate new agents/skills on demand when a real capability gap is found; `izanagi doctor --deep` audits integrity and runs a security scan; `izanagi export --cli <name>` regenerates adapters for a specific AI CLI; `izanagi eval`, `izanagi benchmark`, `izanagi trace`, `izanagi explain <run-id>` cover evaluation, benchmarking, execution tracing and decision explainability.",
    },
  ];
}

async function embedWithRetry(ai, params, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.embedContent(params);
    } catch (err) {
      const message = err?.message ?? String(err);
      const isRateLimit = err?.status === 429 || message.includes("RESOURCE_EXHAUSTED");
      if (!isRateLimit || attempt === maxAttempts) throw err;

      const match = message.match(/retryDelay":"(\d+)s"/) ?? message.match(/retry in ([\d.]+)s/);
      const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 2000 : 30000;
      console.log(`  rate limited, waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${maxAttempts})...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

async function main() {
  const chunks = [
    ...readDocChunks("AGENTS.md"),
    ...readDocChunks("SYSTEM.md"),
    ...readDocChunks("RULES.md"),
    ...readDocChunks("README.md"),
    ...readAgentChunks(),
    ...readSkillChunks(),
    ...readManualChunks(),
  ];

  console.log(`Collected ${chunks.length} chunks. Embedding in batches of ${BATCH_SIZE}...`);

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  const indexed = [];

  // Free-tier embedContent quota is 100 requests/minute and each item in a
  // batch counts individually — resume-safe: re-running the script re-embeds
  // everything, so on a partial failure just re-run it.
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const res = await embedWithRetry(ai, {
      model: EMBED_MODEL,
      contents: batch.map((c) => c.text),
      config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 },
    });

    batch.forEach((c, j) => {
      const values = res.embeddings?.[j]?.values;
      if (values) indexed.push({ ...c, embedding: values });
    });

    console.log(`  embedded ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`);

    const doneCount = i + BATCH_SIZE;
    if (doneCount < chunks.length && doneCount % 80 === 0) {
      console.log("  pausing ~55s to stay under the free-tier per-minute quota...");
      await new Promise((r) => setTimeout(r, 55000));
    } else {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  writeFileSync(OUT_PATH, JSON.stringify({ model: EMBED_MODEL, dimensions: 768, chunks: indexed }));
  console.log(`Wrote ${indexed.length} embedded chunks to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
