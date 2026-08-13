import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NPM_URL, REPO_URL } from "@/content/agents";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 px-6 py-12 sm:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm font-semibold text-zinc-200">IZANAGI AI</p>
          <p className="mt-1 max-w-md text-sm text-zinc-500">{t("tagline")}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-zinc-500">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200">
            {nav("github")}
          </a>
          <a href={NPM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-200">
            npm
          </a>
          <Link href="/changelog" className="hover:text-zinc-200">
            {nav("changelog")}
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl font-mono text-[11px] text-zinc-700">
        {t("madeWith")} · © {new Date().getFullYear()} · {t("rights")}
      </p>
    </footer>
  );
}
