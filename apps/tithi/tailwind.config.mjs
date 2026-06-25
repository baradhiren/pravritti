/**
 * Tithi-local Tailwind config. Follows the same authoring pattern as
 * @pravritti/config/tailwind-preset but carries the Tithi app brand (diya on
 * dark). Brand values are the single source of truth in src/styles/tokens.css;
 * this just exposes them as utilities. We deliberately do NOT extend the shared
 * espresso preset (semantic color names differ: gold/vermilion vs sun/coral).
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-variant": "var(--surface-variant)",
        gold: "var(--gold)",
        "gold-deep": "var(--gold-deep)",
        vermilion: "var(--vermilion)",
        "on-gold": "var(--on-gold)",
        "on-surface": "var(--on-surface)",
        "on-surface-secondary": "var(--on-surface-secondary)",
        "on-surface-muted": "var(--on-surface-muted)",
        auspicious: "var(--auspicious)",
        inauspicious: "var(--inauspicious)",
        "neutral-band": "var(--neutral-band)",
        holiday: "var(--holiday)",
        "moon-lit": "var(--moon-lit)",
        "moon-dark": "var(--moon-dark)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      borderColor: {
        hairline: "var(--hairline)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      maxWidth: {
        prose: "68ch",
        site: "72rem",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
    },
  },
};
