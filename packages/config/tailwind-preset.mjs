/**
 * Shared Tailwind preset for Pravritti sites.
 * Maps the design tokens in tokens.css onto Tailwind's theme so utilities
 * (text-coral-ink, bg-sun, font-display, shadow-coral, …) stay on-brand and
 * consistent across every subdomain. Tokens remain the single source of truth;
 * this just exposes them.
 */

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        sun: "var(--sun)",
        teal: "var(--teal)",
        leaf: "var(--leaf)",
        coral: "var(--coral)",
        "coral-ink": "var(--coral-ink)",
        "teal-ink": "var(--teal-ink)",
        "leaf-ink": "var(--leaf-ink)",
        "wash-sun": "var(--wash-sun)",
        "wash-coral": "var(--wash-coral)",
        "wash-teal": "var(--wash-teal)",
        "wash-leaf": "var(--wash-leaf)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        coral: "var(--shadow-coral)",
      },
      transitionTimingFunction: {
        "out-quint": "var(--ease-out-quint)",
        "out-expo": "var(--ease-out-expo)",
        spring: "var(--ease-spring)",
      },
      zIndex: {
        sticky: "var(--z-sticky)",
        "game-toggle": "var(--z-game-toggle)",
        overlay: "var(--z-overlay)",
        toast: "var(--z-toast)",
      },
    },
  },
};
