/**
 * Chikitsalay-local Tailwind config. Exposes the brand tokens (single source
 * of truth in src/styles/tokens.css) as utilities. Brand-local: we deliberately
 * do NOT extend the shared espresso preset.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        card: "var(--card)",
        "card-warm": "var(--card-warm)",
        espresso: "var(--espresso)",
        bark: "var(--bark)",
        muted: "var(--muted)",
        sage: "var(--sage)",
        "sage-deep": "var(--sage-deep)",
        leaf: "var(--leaf)",
        success: "var(--success)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        guserif: "var(--font-gu-serif)",
        gusans: "var(--font-gu-sans)",
      },
      borderColor: {
        line: "var(--line)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
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
