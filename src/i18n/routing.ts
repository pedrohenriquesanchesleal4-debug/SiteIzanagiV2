import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pt", "es"],
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: {
    name: "IZANAGI_LOCALE",
  },
});

export type AppLocale = (typeof routing.locales)[number];
