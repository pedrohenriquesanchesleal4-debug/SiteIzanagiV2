import { LAYER_KEYS } from "@/content/agents";

export type LayerKey = (typeof LAYER_KEYS)[number];

export interface EngineRef {
  /** Translation subkey under architectureExplorer.layers.<layer>.engines.<key> */
  key: string;
  /** Real file path inside the installed izanagi-ai package. */
  file: string;
}

export interface LayerData {
  key: LayerKey;
  /** Real agent slugs (src/content/agents.ts) whose chains run inside this layer. */
  agents: string[];
  /** Real core/*.md engine docs grounding this layer. */
  engines: EngineRef[];
  /** Real CLI commands (bin/izanagi.js) exposing this layer. */
  cli: string[];
  /** Layer(s) this one hands its output/feedback to — the closed loop, not just left-to-right. */
  feedsInto: LayerKey[];
}

function coreFilePath(file: string): string {
  return `node_modules/izanagi-ai/core/${file}`;
}

/**
 * The five-layer runtime as described in AGENTS.md section 1 (Routing →
 * Orchestration → Evaluation → Healing → Memory), grounded in the real
 * engine docs shipped inside node_modules/izanagi-ai/core/*.md. Not a linear
 * pipeline: Evaluation branches into Healing (on failure) and Memory
 * (traces/reflection on every run); Healing loops back into Orchestration
 * for retries; Memory closes the loop by feeding failure patterns and
 * decisions back into Routing before the next task starts.
 */
export const ARCHITECTURE_LAYERS: Record<LayerKey, LayerData> = {
  routing: {
    key: "routing",
    agents: ["discovery", "product-reasoner", "pm"],
    engines: [
      { key: "decisionEngine", file: coreFilePath("decision-engine.md") },
      { key: "modelRouter", file: coreFilePath("model-router.md") },
    ],
    cli: ["izanagi agent list", "izanagi agent inspect <name>", "izanagi skill search <q>"],
    feedsInto: ["orchestration"],
  },
  orchestration: {
    key: "orchestration",
    agents: [
      "architect",
      "senior-engineer",
      "techlead",
      "database",
      "devops",
      "security",
      "automation-engineer",
      "form-engineer",
    ],
    engines: [
      { key: "planningEngine", file: coreFilePath("planning-engine.md") },
      { key: "executionGraph", file: coreFilePath("execution-graph.md") },
      { key: "skillComposer", file: coreFilePath("skill-composer.md") },
    ],
    cli: ["izanagi workflow list", "izanagi workflow inspect fullstack", 'izanagi run "task" --runtime'],
    feedsInto: ["evaluation"],
  },
  evaluation: {
    key: "evaluation",
    agents: ["qa", "evaluator", "adversarial-critic"],
    engines: [
      { key: "evaluationEngine", file: coreFilePath("evaluation-engine.md") },
      { key: "qualityGates", file: coreFilePath("quality-gates.md") },
      { key: "reflectionEngine", file: coreFilePath("reflection-engine.md") },
    ],
    cli: ["izanagi eval <file.json>", "izanagi eval --report <run-id>"],
    feedsInto: ["healing", "memory"],
  },
  healing: {
    key: "healing",
    agents: ["bug-hunter", "techlead"],
    engines: [
      { key: "selfHealing", file: coreFilePath("self-healing.md") },
      { key: "checkpointSwarm", file: coreFilePath("checkpoint-healing-engine.md") },
    ],
    cli: ["izanagi memory inspect", "izanagi memory search <q>"],
    feedsInto: ["orchestration", "memory"],
  },
  memory: {
    key: "memory",
    agents: ["agent-architect", "skill-architect", "docs"],
    engines: [
      { key: "contextEngine", file: coreFilePath("context-engine.md") },
      { key: "compressionEngine", file: coreFilePath("compression-engine.md") },
      { key: "tokenManager", file: coreFilePath("token-manager.md") },
      { key: "evolutionEngine", file: coreFilePath("evolution-engine.md") },
      { key: "tracing", file: coreFilePath("tracing.md") },
    ],
    cli: ["izanagi trace", "izanagi trace <run-id>"],
    feedsInto: ["routing"],
  },
};
