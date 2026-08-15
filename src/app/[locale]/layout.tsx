import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SmoothScrollProvider } from "@/lib/scroll";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";
import { ChatWidget, ChatProvider } from "@/components/ui/ChatWidget";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { StructuredData } from "@/components/seo/StructuredData";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("title");
  const description = t("description");
  const url = `${SITE_URL}/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s — Izanagi AI`,
    },
    description,
    keywords: [
      "Izanagi AI",
      "AI agent framework",
      "autonomous software engineering",
      "izanagi-ai npm package",
      "multi-agent orchestration",
      "AI coding agents",
      "Claude Code agents",
      "skill composer",
      "self-healing AI runtime",
    ],
    applicationName: "Izanagi AI",
    authors: [{ name: "Pedro Henrique", url: "https://github.com/pedrohenriquesanchesleal4-debug" }],
    creator: "Pedro Henrique",
    publisher: "Izanagi AI",
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en`,
        es: `${SITE_URL}/es`,
        pt: `${SITE_URL}/pt`,
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      url,
      siteName: "Izanagi AI",
      title,
      description,
      locale,
      images: [{ url: `${SITE_URL}/${locale}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/${locale}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "technology",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "a11y" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
        <StructuredData locale={locale} title={tMeta("title")} description={tMeta("description")} />
        <NextIntlClientProvider messages={messages}>
          <SmoothScrollProvider>
            <ChatProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-zinc-50 focus:px-4 focus:py-2 focus:text-sm focus:text-zinc-950"
              >
                {t("skipToContent")}
              </a>
              <GrainOverlay />
              <Nav />
              <main id="main">{children}</main>
              <Footer />
              <ChatWidget />
              <CommandPalette />
            </ChatProvider>
          </SmoothScrollProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
