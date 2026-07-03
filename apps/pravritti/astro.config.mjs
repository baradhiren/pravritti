// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://pravritti.org",
  integrations: [
    tailwind({
      // We own the base reset / tokens in src/styles/global.css.
      applyBaseStyles: false,
    }),
  ],
  prefetch: false,
  compressHTML: true,
});
