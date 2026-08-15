import { REPO_URL } from "@/content/agents";
import { SITE_URL } from "@/lib/seo";

interface StructuredDataProps {
  locale: string;
  title: string;
  description: string;
}

/**
 * JSON-LD for the site: SoftwareApplication (the izanagi-ai package/CLI this
 * site documents) + WebSite (for sitelinks search box eligibility signals).
 * Rendered per-locale so `inLanguage` matches the active route.
 */
export function StructuredData({ locale, title, description }: StructuredDataProps) {
  const url = `${SITE_URL}/${locale}`;

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Izanagi AI",
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "AI Agent Framework",
    operatingSystem: "Cross-platform (Node.js)",
    description,
    url,
    downloadUrl: "https://www.npmjs.com/package/izanagi-ai",
    softwareVersion: "3.0.0",
    codeRepository: REPO_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    inLanguage: locale,
    sameAs: [REPO_URL, "https://www.npmjs.com/package/izanagi-ai"],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: title,
    url,
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
