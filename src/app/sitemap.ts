import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL, SITE_ROUTES } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return SITE_ROUTES.map((route) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "daily",
    priority: route === "" ? 1 : 0.6,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [
          locale,
          `${SITE_URL}/${locale}${route}`,
        ]),
      ),
    },
  }));
}
