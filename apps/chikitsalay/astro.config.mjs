// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://chikitsalay.pravritti.org",
  i18n: {
    defaultLocale: "gu",
    locales: ["gu", "en"],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    tailwind({ applyBaseStyles: false }),
    mdx(),
  ],
  prefetch: false,
  compressHTML: true,
});
