"use client";

import { useTranslations } from "next-intl";
import { ARCHITECTURE_LAYERS, type LayerKey } from "./ArchitectureExplorerData";

/**
 * Shared detail renderer for both the desktop pipeline panel and the mobile
 * accordion row — mirrors AgentAtlasDetail's structure (real data first,
 * marketing copy second). Agent titles are pulled from the existing
 * `agentsSection.items.<slug>.title` keys (already shipped, real agent
 * names) instead of duplicating that copy under a new namespace.
 */
export function ArchitectureExplorerDetail({
  layerKey,
  onJump,
}: {
  layerKey: LayerKey;
  onJump?: (layer: LayerKey) => void;
}) {
  const t = useTranslations("architectureExplorer");
  const tAgents = useTranslations("agentsSection");
  const layer = ARCHITECTURE_LAYERS[layerKey];
  if (!layer) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">
          {t(`layers.${layerKey}.name`)}
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold text-zinc-50">
          {t(`layers.${layerKey}.tagline`)}
        </h3>
      </div>

      <p className="text-sm leading-relaxed text-zinc-300">{t(`layers.${layerKey}.body`)}</p>

      <section>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {t("sectionLabels.engines")}
        </h4>
        <ul className="mt-2 space-y-3">
          {layer.engines.map((engine) => (
            <li key={engine.key} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="font-display text-sm font-medium text-zinc-100">
                {t(`layers.${layerKey}.engines.${engine.key}.name`)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {t(`layers.${layerKey}.engines.${engine.key}.description`)}
              </p>
              <p className="mt-2 truncate font-mono text-[10px] text-zinc-600">{engine.file}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          {t("sectionLabels.agents")}
        </h4>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {layer.agents.map((slug) => (
            <li key={slug}>
              <span className="inline-block rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
                {tAgents(`items.${slug}.title`)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section>
          <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {t("sectionLabels.cli")}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {layer.cli.map((cmd) => (
              <li
                key={cmd}
                className="truncate rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400"
              >
                {cmd}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            {t("sectionLabels.feedsInto")}
          </h4>
          <ul className="mt-2 space-y-1.5">
            {layer.feedsInto.map((target) => (
              <li key={target}>
                <button
                  type="button"
                  onClick={() => onJump?.(target)}
                  disabled={!onJump}
                  className="group flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-sm transition hover:border-accent/60 disabled:cursor-default disabled:hover:border-zinc-800"
                >
                  <span aria-hidden className="text-accent">
                    &rarr;
                  </span>
                  <span className="font-medium text-zinc-200">{t(`layers.${target}.name`)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
