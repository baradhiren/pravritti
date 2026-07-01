# Chikitsalay Site (chikitsalay.pravritti.org) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/chikitsalay`, a bilingual (Gujarati-default + English) Astro static site for Dr. Durgaben Vala's Ayurvedic clinic in Sutrapada — a landing page, a Markdown blog, WhatsApp/Instagram footer, and Instagram-driven booking — faithful to the clinic's logo-derived brand.

**Architecture:** A new Astro SSG app in the existing pnpm monorepo, mirroring `apps/tithi`, with its own brand-local token layer (`src/styles/tokens.css`). Routed i18n (Gujarati at `/`, English at `/en/`) via manually authored per-locale pages plus small tested helper functions. Clinic facts + UI strings live in typed modules; the blog is an Astro content collection of Markdown files. No backend; static output served by Cloudflare Pages watching the `chikitsalay` branch.

**Tech Stack:** Astro 5, `@astrojs/tailwind` 5 + Tailwind 3, `@astrojs/mdx`, `astro:content` collections, `@fontsource` (Lora, Nunito Sans, Noto Serif Gujarati, Noto Sans Gujarati), vitest 4.

## Global Constraints

- **Branch:** all work on `chikitsalay` (Cloudflare Pages watches it). Already created and checked out.
- **Node:** `>=20`; package manager `pnpm@11.8.0`.
- **Light only by design.** Warm cream paper; no dark theme. Depth = warm tone steps + soft hairlines + one soft card-hover shadow. No glass, heavy gradients, or neon.
- **Token discipline:** components reference token names / Tailwind utilities, never raw hex. Brand values live only in `apps/chikitsalay/src/styles/tokens.css`. Do **not** modify `packages/config` and do **not** import the shared espresso preset — this brand is local.
- **Bilingual routed i18n:** Gujarati default at `/`, English at `/en/`. Header toggle preserves the current page. UI strings come from per-locale dictionaries.
- **Blog rule (option B):** posts may be single-language; each declares its own `lang`. The blog index lists all posts together, each card tagged with its language. Each post has ONE canonical URL `/blog/<slug>/` rendered in its own language.
- **Green-as-text discipline:** `sage` (`#8C9A63`) is fill/marker only. Green *text* uses `sage-deep` (`#5F6B3C`). Espresso does body/headings.
- **Mobile-first, phone-critical:** verified at 375 / 768 / 1024 / 1440px in BOTH locales; no horizontal scroll; collapsing hamburger nav with the language toggle always reachable; ≥44px touch targets.
- **Accessibility:** WCAG AA min, 16px+ body, visible focus rings, keyboard nav, `prefers-reduced-motion` respected, no color-only meaning.
- **All clinic facts are placeholders** marked `TODO_`, isolated to `src/data/clinic.ts`; valid so they never block the build.
- **No Ayurveda clichés / no emoji.** Warmth from paper tone, serif headings, space, and the logo-derived leaf motif. Icons: one inline stroke-SVG set.
- **Commit prefix:** use `task:` (project convention).

---

## File Structure

```
apps/chikitsalay/
├─ package.json
├─ astro.config.mjs            # site, tailwind, mdx, i18n (gu default, en)
├─ tailwind.config.mjs         # brand tokens → utilities
├─ tsconfig.json
├─ vitest.config.ts
├─ public/
│  ├─ logo.svg                 # placeholder brand mark (real logo drops in later)
│  ├─ favicon-32.png           # placeholder
│  ├─ apple-touch-icon.png     # placeholder
│  └─ og.png                   # placeholder
└─ src/
   ├─ styles/{tokens.css, global.css}
   ├─ i18n/{ui.ts, ui.test.ts}                 # dictionaries + locale helpers
   ├─ data/{clinic.ts, clinic.test.ts}         # clinic facts (placeholders)
   ├─ lib/{posts.ts, posts.test.ts}            # reading time + sort helpers
   ├─ content/
   │  ├─ config.ts                             # blog collection schema
   │  └─ blog/*.md                             # seed posts (mixed gu/en)
   ├─ layouts/{BaseLayout.astro, PostLayout.astro}
   ├─ components/
   │  ├─ Logo.astro  LeafMark.astro  LangToggle.astro
   │  ├─ SiteHeader.astro  Footer.astro
   │  ├─ Hero.astro  Treatments.astro  AboutDoctor.astro
   │  ├─ BlogTeaser.astro  PostCard.astro
   └─ pages/
      ├─ index.astro            # gu home
      ├─ en/index.astro         # en home
      ├─ blog/index.astro       # gu blog index
      ├─ en/blog/index.astro    # en blog index
      ├─ blog/[slug].astro      # single-language post
      └─ 404.astro
```

---

## Task 1: Scaffold app + brand tokens + i18n/mdx config

Stand up `apps/chikitsalay` as a buildable bilingual Astro app: brand token layer wired to Tailwind, MDX + i18n configured, `BaseLayout`, and temporary `gu` + `en` home stubs. Deliverable: `pnpm --filter chikitsalay build` succeeds and emits both `/index.html` and `/en/index.html` using brand tokens.

**Files:**
- Create: `apps/chikitsalay/package.json`
- Create: `apps/chikitsalay/astro.config.mjs`
- Create: `apps/chikitsalay/tsconfig.json`
- Create: `apps/chikitsalay/vitest.config.ts`
- Create: `apps/chikitsalay/tailwind.config.mjs`
- Create: `apps/chikitsalay/src/styles/tokens.css`
- Create: `apps/chikitsalay/src/styles/global.css`
- Create: `apps/chikitsalay/src/layouts/BaseLayout.astro`
- Create: `apps/chikitsalay/src/pages/index.astro` (temp stub)
- Create: `apps/chikitsalay/src/pages/en/index.astro` (temp stub)

**Interfaces:**
- Produces: `BaseLayout.astro` with `Props { title?: string; description?: string; lang?: "gu" | "en" }` — sets `<html lang>`, imports all four font families + `global.css`, canonical/OG meta. Brand Tailwind utilities: `bg-paper text-espresso text-sage text-sage-deep text-leaf text-bark text-muted bg-card bg-card-warm border-line font-display font-body font-guserif font-gusans rounded-{sm,lg,xl} max-w-site max-w-prose shadow-card`.

- [ ] **Step 1: Create `apps/chikitsalay/package.json`**

```json
{
  "name": "chikitsalay",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@astrojs/mdx": "^4.2.0",
    "@astrojs/tailwind": "^5.1.5",
    "@fontsource/lora": "^5.2.5",
    "@fontsource/nunito-sans": "^5.2.5",
    "@fontsource/noto-sans-gujarati": "^5.2.7",
    "@fontsource/noto-serif-gujarati": "^5.2.7",
    "@pravritti/config": "workspace:*",
    "astro": "^5.5.0",
    "tailwindcss": "^3.4.17"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.9",
    "typescript": "^5.9.3",
    "vitest": "^4.1.9"
  }
}
```

> Note: `@pravritti/config` is included for workspace parity (as `tithi` does); we do NOT import its preset. Brand tokens are local.

- [ ] **Step 2: Create `apps/chikitsalay/astro.config.mjs`**

```js
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
```

- [ ] **Step 3: Create `apps/chikitsalay/tsconfig.json`**

```json
{
  "extends": ["astro/tsconfigs/strict", "../../tsconfig.base.json"],
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "verbatimModuleSyntax": false
  }
}
```

- [ ] **Step 4: Create `apps/chikitsalay/vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Create `apps/chikitsalay/src/styles/tokens.css`** (the brand — single source of truth)

```css
/*
 * Pravritti Chikitsalay brand tokens — "diya-warm, rooted, light".
 * Palette extracted from the clinic logo: espresso brown, sage-olive,
 * leaf green, on warm cream paper. Light only by design. Brand-local:
 * do NOT import the shared espresso platform tokens here.
 */

:root {
  color-scheme: light;

  /* ---- Surfaces (warm cream) ---- */
  --paper: #faf6ec;
  --card: #ffffff;
  --card-warm: #f3eddf;
  --scrim: rgb(59 42 30 / 0.5);

  /* ---- Ink / brown ---- */
  --espresso: #3b2a1e; /* headings, body, logo */
  --bark: #6b4e3b; /* secondary brown, ghost-button border */
  --muted: #6f6154; /* secondary text */

  /* ---- Brand green (from wordmark + leaves) ---- */
  --sage: #8c9a63; /* fill / button / marker ONLY */
  --sage-deep: #5f6b3c; /* green TEXT / links (passes 4.5:1 on cream) */
  --leaf: #9db36a; /* fresh accent / motif */

  /* ---- Lines ---- */
  --line: #e4dac6;

  /* ---- Footer (on espresso) ---- */
  --footer-ink: #eee6d6;
  --footer-muted: #c9bca8;
  --footer-line: #5a4636;

  /* ---- Status ---- */
  --success: #5f6b3c;
  --danger: #c0553d;

  /* ---- Type: Latin (en) defaults + Gujarati overrides ---- */
  --font-display: "Lora", Georgia, "Times New Roman", serif;
  --font-body: "Nunito Sans", system-ui, sans-serif;
  --font-gu-serif: "Noto Serif Gujarati", serif;
  --font-gu-sans: "Noto Sans Gujarati", sans-serif;

  /* ---- Radii ---- */
  --radius-sm: 10px;
  --radius: 14px;
  --radius-lg: 18px;
  --radius-xl: 22px;
  --radius-full: 999px;

  /* ---- Motion ---- */
  --dur-fast: 150ms;
  --dur-base: 200ms;
  --dur-slow: 300ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);

  /* ---- The one soft shadow (card hover) ---- */
  --shadow-card: 0 20px 44px -28px rgb(59 42 30 / 0.4);
}

/* Gujarati locale swaps the default display/body families to Gujarati. */
html[lang="gu"] {
  --font-display: var(--font-gu-serif);
  --font-body: var(--font-gu-sans);
}
```

- [ ] **Step 6: Create `apps/chikitsalay/src/styles/global.css`**

```css
@import "./tokens.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [hidden] {
    display: none !important;
  }

  html {
    -webkit-text-size-adjust: 100%;
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
  }

  body {
    margin: 0;
    background-color: var(--paper);
    color: var(--espresso);
    font-family: var(--font-body);
    font-size: 1.0625rem;
    line-height: 1.6;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow-x: clip;
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.01em;
    text-wrap: balance;
    margin: 0;
  }

  p {
    text-wrap: pretty;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :focus-visible {
    outline: 2.5px solid var(--sage-deep);
    outline-offset: 3px;
    border-radius: 3px;
  }

  ::selection {
    background: var(--sage);
    color: #fff;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Force Gujarati faces on inline Gujarati inside an English page. */
  .gu {
    font-family: var(--font-gu-serif);
  }
  .gu-body {
    font-family: var(--font-gu-sans);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 7: Create `apps/chikitsalay/tailwind.config.mjs`**

```js
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
```

- [ ] **Step 8: Create `apps/chikitsalay/src/layouts/BaseLayout.astro`**

```astro
---
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "@fontsource/noto-serif-gujarati/600.css";
import "@fontsource/noto-serif-gujarati/700.css";
import "@fontsource/noto-sans-gujarati/400.css";
import "@fontsource/noto-sans-gujarati/500.css";
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
  lang?: "gu" | "en";
}

const {
  title = "Pravritti Chikitsalay — Ayurvedic clinic, Sutrapada",
  description =
    "Classical Ayurvedic care with Dr. Durgaben Vala in Sutrapada, Gujarat — consultation, panchakarma, and personalised herbal treatment.",
  lang = "gu",
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="theme-color" content="#faf6ec" />
    <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={new URL("/og.png", Astro.site)} />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
    <slot />
  </body>
</html>
```

- [ ] **Step 9: Create temporary `apps/chikitsalay/src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout lang="gu">
  <main id="main" class="mx-auto max-w-site px-4 py-24">
    <h1 class="text-espresso text-4xl">પ્રવૃત્તિ ચિકિત્સાલય</h1>
    <p class="text-muted mt-4">Scaffold check (gu).</p>
  </main>
</BaseLayout>
```

- [ ] **Step 10: Create temporary `apps/chikitsalay/src/pages/en/index.astro`**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
---

<BaseLayout lang="en" title="Pravritti Chikitsalay — Ayurvedic clinic">
  <main id="main" class="mx-auto max-w-site px-4 py-24">
    <h1 class="text-espresso text-4xl">Pravritti Chikitsalay</h1>
    <p class="text-muted mt-4">Scaffold check (en).</p>
  </main>
</BaseLayout>
```

- [ ] **Step 11: Install deps from repo root**

Run: `pnpm install`
Expected: completes; `chikitsalay` appears as a workspace package.

- [ ] **Step 12: Build**

Run: `pnpm --filter chikitsalay build`
Expected: build succeeds; `apps/chikitsalay/dist/index.html` and `apps/chikitsalay/dist/en/index.html` are produced.

- [ ] **Step 13: Verify both locales + brand token reached output**

Run: `grep -rl "#faf6ec\|--paper" apps/chikitsalay/dist/ | head && test -f apps/chikitsalay/dist/en/index.html && echo "EN OK"`
Expected: at least one CSS match and `EN OK`.

- [ ] **Step 14: Commit**

```bash
git add apps/chikitsalay pnpm-lock.yaml
git commit -m "task: scaffold apps/chikitsalay with brand tokens + bilingual config"
```

---

## Task 2: i18n dictionaries + locale helpers

All UI strings for both locales plus pure, tested helper functions for locale detection and path switching. This is the module that makes the header toggle and every localized label correct.

**Files:**
- Create: `apps/chikitsalay/src/i18n/ui.ts`
- Test: `apps/chikitsalay/src/i18n/ui.test.ts`

**Interfaces:**
- Produces:
  - `type Locale = "gu" | "en"`
  - `locales: readonly Locale[]`, `defaultLocale: Locale`
  - `ui: Record<Locale, Record<string, string>>`
  - `t(locale: Locale, key: string): string`
  - `getLocale(pathname: string): Locale`
  - `stripLocale(pathname: string): string` (→ gu-canonical path)
  - `localizePath(locale: Locale, canonicalPath: string): string`
  - `oppositeLocale(locale: Locale): Locale`
  - `switchLocalePath(pathname: string): string`

- [ ] **Step 1: Write the failing test `apps/chikitsalay/src/i18n/ui.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  ui,
  t,
  getLocale,
  stripLocale,
  localizePath,
  oppositeLocale,
  switchLocalePath,
} from "./ui";

describe("ui dictionaries", () => {
  it("has identical key sets for gu and en", () => {
    const gu = Object.keys(ui.gu).sort();
    const en = Object.keys(ui.en).sort();
    expect(en).toEqual(gu);
  });

  it("has non-empty strings for every key", () => {
    for (const locale of ["gu", "en"] as const) {
      for (const [key, val] of Object.entries(ui[locale])) {
        expect(val.trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("t() returns the localized string", () => {
    expect(t("en", "nav.blog")).toBe(ui.en["nav.blog"]);
    expect(t("gu", "nav.blog")).toBe(ui.gu["nav.blog"]);
  });
});

describe("locale helpers", () => {
  it("detects locale from pathname", () => {
    expect(getLocale("/")).toBe("gu");
    expect(getLocale("/blog/")).toBe("gu");
    expect(getLocale("/en")).toBe("en");
    expect(getLocale("/en/")).toBe("en");
    expect(getLocale("/en/blog/")).toBe("en");
  });

  it("strips the locale prefix to the gu-canonical path", () => {
    expect(stripLocale("/")).toBe("/");
    expect(stripLocale("/blog/")).toBe("/blog/");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/en/")).toBe("/");
    expect(stripLocale("/en/blog/")).toBe("/blog/");
  });

  it("localizes a canonical path", () => {
    expect(localizePath("gu", "/")).toBe("/");
    expect(localizePath("gu", "/blog/")).toBe("/blog/");
    expect(localizePath("en", "/")).toBe("/en/");
    expect(localizePath("en", "/blog/")).toBe("/en/blog/");
  });

  it("gives the opposite locale", () => {
    expect(oppositeLocale("gu")).toBe("en");
    expect(oppositeLocale("en")).toBe("gu");
  });

  it("switches a pathname to the other locale", () => {
    expect(switchLocalePath("/")).toBe("/en/");
    expect(switchLocalePath("/en/")).toBe("/");
    expect(switchLocalePath("/blog/")).toBe("/en/blog/");
    expect(switchLocalePath("/en/blog/")).toBe("/blog/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter chikitsalay test`
Expected: FAIL — cannot resolve `./ui`.

- [ ] **Step 3: Create `apps/chikitsalay/src/i18n/ui.ts`**

```ts
/**
 * Bilingual UI strings + pure locale helpers for the Chikitsalay site.
 * Gujarati is the default locale (served at /); English lives under /en/.
 * Clinic FACTS live in ../data/clinic.ts; only interface copy lives here.
 */

export type Locale = "gu" | "en";
export const locales: readonly Locale[] = ["gu", "en"];
export const defaultLocale: Locale = "gu";

export const ui = {
  gu: {
    "nav.about": "પરિચય",
    "nav.treatments": "સારવાર",
    "nav.blog": "લેખ",
    "nav.contact": "સંપર્ક",
    "nav.menu": "મેનૂ",
    "lang.switch": "English માં જુઓ",
    "cta.book": "ઇન્સ્ટાગ્રામ પર બુક કરો",
    "cta.whatsapp": "વૉટ્સએપ કરો",
    "hero.eyebrow": "આયુર્વેદિક ચિકિત્સાલય · સૂત્રાપાડા, ગુજરાત",
    "hero.leadEn": "Rooted care for lasting wellbeing",
    "hero.lead":
      "ડૉ. દુર્ગાબેન વાળા સાથે શાસ્ત્રોક્ત આયુર્વેદિક પરામર્શ, પંચકર્મ અને વ્યક્તિગત ઔષધ-ઉપચાર — લક્ષણ નહીં, મૂળ કારણની સારવાર.",
    "hero.openToday": "આજે ખુલ્લું",
    "trust.years": "વર્ષનો અનુભવ",
    "trust.qual": "લાયકાત ધરાવતા વૈદ્ય",
    "trust.rating": "દર્દી રેટિંગ",
    "treat.label": "અમે શું સારવાર કરીએ છીએ",
    "treat.head": "શાસ્ત્રોક્ત આયુર્વેદમાંથી ઉપચાર",
    "treat.sub": "દરેક ઉપચાર તમારી પ્રકૃતિ સમજવાથી શરૂ થાય છે.",
    "about.label": "તમારા વૈદ્યને મળો",
    "about.body":
      "ડૉ. વાળા સૂત્રાપાડામાં શાસ્ત્રોક્ત આયુર્વેદની પ્રેક્ટિસ કરે છે — સમય-ચકાસાયેલ શાસ્ત્ર સાથે હૂંફાળો, દર્દી-કેન્દ્રિત અભિગમ. આહાર, દિનચર્યા અને પ્રકૃતિ — સમગ્ર વ્યક્તિને સમજ્યા પછી જ ઉપચાર.",
    "blog.label": "લેખ-સંગ્રહ",
    "blog.head": "રોજિંદા જીવન માટે આયુર્વેદ",
    "blog.sub": "આહાર, ઋતુ અને સરળ ઉપચાર પરના વિસ્તૃત લેખ — ગુજરાતી અને English માં.",
    "blog.viewAll": "બધા લેખ જુઓ",
    "blog.readtime": "મિનિટ વાંચન",
    "blog.back": "← બધા લેખ",
    "blog.empty": "હાલમાં કોઈ લેખ નથી. ટૂંક સમયમાં પાછા આવો.",
    "footer.mission":
      "સૂત્રાપાડા, ગુજરાતમાં શાસ્ત્રોક્ત આયુર્વેદિક સારવાર. મૂળ કારણની, હળવાશથી અને સંપૂર્ણ સારવાર.",
    "footer.clinic": "ચિકિત્સાલય",
    "footer.visit": "મુલાકાત",
    "footer.directions": "દિશા મેળવો",
    "footer.rights": "સર્વ હક્ક સ્વાધીન.",
    "nf.head": "આ પાનું મળ્યું નથી",
    "nf.body": "તમે શોધી રહ્યા છો તે પાનું અહીં નથી.",
    "nf.home": "મુખ્ય પાનાં પર પાછા જાઓ",
  },
  en: {
    "nav.about": "About",
    "nav.treatments": "Treatments",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.menu": "Menu",
    "lang.switch": "ગુજરાતીમાં જુઓ",
    "cta.book": "Book on Instagram",
    "cta.whatsapp": "WhatsApp us",
    "hero.eyebrow": "Ayurvedic Clinic · Sutrapada, Gujarat",
    "hero.leadEn": "પ્રકૃતિ સાથે, સ્વસ્થ જીવન",
    "hero.lead":
      "Classical Ayurvedic consultation, panchakarma, and personalised herbal care with Dr. Durgaben Vala — treating the cause, not just the symptom.",
    "hero.openToday": "Open today",
    "trust.years": "Years of practice",
    "trust.qual": "Qualified Vaidya",
    "trust.rating": "Patient rating",
    "treat.label": "What we treat",
    "treat.head": "Care drawn from classical Ayurveda",
    "treat.sub": "Every plan begins with understanding your prakruti — your unique constitution.",
    "about.label": "Meet your vaidya",
    "about.body":
      "Dr. Vala practises classical Ayurveda in Sutrapada, blending time-tested shastra with a warm, patient-first approach. Her focus is on understanding the whole person — diet, routine, and constitution — before prescribing.",
    "blog.label": "From the journal",
    "blog.head": "Ayurveda for everyday life",
    "blog.sub": "Long-form notes on food, seasons, and simple remedies — in Gujarati and English.",
    "blog.viewAll": "View all articles",
    "blog.readtime": "min read",
    "blog.back": "← All articles",
    "blog.empty": "No articles yet. Check back soon.",
    "footer.mission":
      "Classical Ayurvedic care in Sutrapada, Gujarat. Treating the cause, gently and thoroughly.",
    "footer.clinic": "Clinic",
    "footer.visit": "Visit",
    "footer.directions": "Get directions",
    "footer.rights": "All rights reserved.",
    "nf.head": "Page not found",
    "nf.body": "The page you are looking for isn't here.",
    "nf.home": "Back to home",
  },
} as const;

export function t(locale: Locale, key: string): string {
  return ui[locale][key as keyof (typeof ui)[Locale]] ?? ui.gu[key as keyof typeof ui.gu] ?? key;
}

export function getLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "gu";
}

export function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname === "/en/") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

export function localizePath(locale: Locale, canonicalPath: string): string {
  const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  if (locale === "gu") return path;
  if (path === "/") return "/en/";
  return `/en${path}`;
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === "gu" ? "en" : "gu";
}

export function switchLocalePath(pathname: string): string {
  return localizePath(oppositeLocale(getLocale(pathname)), stripLocale(pathname));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter chikitsalay test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/chikitsalay/src/i18n
git commit -m "task: add bilingual UI dictionaries + locale helpers"
```

---

## Task 3: Clinic facts content module

All clinic facts (name, doctor, hours, address, socials, treatments, credential chips) in one typed module — every factual value a marked `TODO_` placeholder. Launch-day edits happen here only.

**Files:**
- Create: `apps/chikitsalay/src/data/clinic.ts`
- Test: `apps/chikitsalay/src/data/clinic.test.ts`

**Interfaces:**
- Produces:
  - `clinic` — object with `name, nameGu, wordmark, taglineEn, taglineGu, city, cityGu, addressLines: string[], mapsUrl, phone, whatsapp, instagram, instagramBooking, email, hoursShort, hoursShortGu, yearsPractice, qualification, rating` and `doctor: { name, nameGu, credentials, credentialsGu }`
  - `treatments: { slug, titleEn, titleGu, blurbEn, blurbGu }[]` (length 3)
  - `credentialChips: { en: string; gu: string }[]`

- [ ] **Step 1: Write the failing test `apps/chikitsalay/src/data/clinic.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { clinic, treatments, credentialChips } from "./clinic";

describe("clinic facts", () => {
  it("names the clinic and doctor in both scripts", () => {
    expect(clinic.name).toBe("Pravritti Chikitsalay");
    expect(clinic.nameGu.length).toBeGreaterThan(0);
    expect(clinic.doctor.name).toContain("Vala");
    expect(clinic.doctor.nameGu.length).toBeGreaterThan(0);
  });

  it("keeps the real Google Maps link (not a placeholder)", () => {
    expect(clinic.mapsUrl).toMatch(/^https:\/\/maps\.app\.goo\.gl\//);
  });

  it("exposes contact + social slots", () => {
    for (const key of ["phone", "whatsapp", "instagram", "instagramBooking", "email"] as const) {
      expect(typeof clinic[key]).toBe("string");
      expect(clinic[key].length).toBeGreaterThan(0);
    }
  });

  it("lists exactly three treatments, each bilingual and non-empty", () => {
    expect(treatments).toHaveLength(3);
    for (const tr of treatments) {
      for (const field of ["slug", "titleEn", "titleGu", "blurbEn", "blurbGu"] as const) {
        expect(tr[field].trim().length, `${tr.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("provides credential chips in both languages", () => {
    expect(credentialChips.length).toBeGreaterThan(0);
    for (const chip of credentialChips) {
      expect(chip.en.trim().length).toBeGreaterThan(0);
      expect(chip.gu.trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter chikitsalay test src/data/clinic.test.ts`
Expected: FAIL — cannot resolve `./clinic`.

- [ ] **Step 3: Create `apps/chikitsalay/src/data/clinic.ts`**

```ts
/**
 * Single source of truth for all Chikitsalay clinic FACTS. Every value marked
 * TODO_ is an intentional placeholder — valid for the build, must be filled
 * before go-live. UI/interface copy lives in ../i18n/ui.ts, not here.
 */

export const clinic = {
  name: "Pravritti Chikitsalay",
  nameGu: "પ્રવૃત્તિ ચિકિત્સાલય",
  wordmark: "pravritti",

  taglineEn: "Rooted care for lasting wellbeing",
  taglineGu: "પ્રકૃતિ સાથે, સ્વસ્થ જીવન",

  doctor: {
    name: "Dr. Durgaben Vala",
    nameGu: "ડૉ. દુર્ગાબેન વાળા",
    credentials: "BAMS · Ayurvedic Physician", // TODO_CONFIRM real credentials
    credentialsGu: "BAMS · આયુર્વેદિક ચિકિત્સક",
  },

  city: "Sutrapada, Gujarat",
  cityGu: "સૂત્રાપાડા, ગુજરાત",
  addressLines: ["TODO_ADDRESS_LINE_1", "Sutrapada, Gir Somnath, Gujarat"],
  // Real Google Maps link supplied by the clinic — keep as-is.
  mapsUrl: "https://maps.app.goo.gl/Md1bxccuyyCq6FYp8",

  phone: "TODO_PHONE", // e.g. "+91 90000 00000"
  whatsapp: "https://wa.me/TODO_WHATSAPP_NUMBER", // digits only, incl. country code
  instagram: "https://instagram.com/TODO_INSTAGRAM_HANDLE",
  instagramBooking: "https://instagram.com/TODO_INSTAGRAM_HANDLE", // booking via DM
  email: "TODO_EMAIL", // e.g. "clinic@pravritti.org"

  hoursShort: "Mon–Sat · 9:30–1:30, 4–7", // TODO_CONFIRM hours
  hoursShortGu: "સોમ–શનિ · 9:30–1:30, 4–7",

  yearsPractice: "15+", // TODO_CONFIRM
  qualification: "BAMS", // TODO_CONFIRM
  rating: "4.9★", // TODO_CONFIRM / remove if no public rating
} as const;

export const treatments = [
  {
    slug: "panchakarma",
    titleEn: "Panchakarma",
    titleGu: "પંચકર્મ",
    blurbEn: "Deep detoxification and rejuvenation therapies, tailored and supervised end to end.",
    blurbGu: "ઊંડી શુદ્ધિ અને પુનર્યૌવન ચિકિત્સા — વ્યક્તિગત અને સંપૂર્ણ દેખરેખ હેઠળ.",
  },
  {
    slug: "chronic",
    titleEn: "Chronic conditions",
    titleGu: "દીર્ઘકાલીન રોગ",
    blurbEn: "Joint pain, skin, digestion, and lifestyle disorders addressed at the root.",
    blurbGu: "સાંધાનો દુખાવો, ત્વચા, પાચન અને જીવનશૈલીના રોગોની મૂળથી સારવાર.",
  },
  {
    slug: "womens-wellness",
    titleEn: "Women's wellness",
    titleGu: "સ્ત્રી આરોગ્ય",
    blurbEn: "Menstrual health, fertility support, and pre- and post-natal Ayurvedic care.",
    blurbGu: "માસિક આરોગ્ય, પ્રજનન સહાય અને ગર્ભાવસ્થા પૂર્વે-પછીની આયુર્વેદિક સંભાળ.",
  },
] as const;

export const credentialChips = [
  { en: "Panchakarma specialist", gu: "પંચકર્મ નિષ્ણાત" },
  { en: "Herbal formulation", gu: "ઔષધ નિર્માણ" },
  { en: "Diet & lifestyle", gu: "આહાર અને જીવનશૈલી" },
] as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter chikitsalay test src/data/clinic.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/chikitsalay/src/data
git commit -m "task: add clinic facts content module (placeholders)"
```

---

## Task 4: Site chrome — Logo, LeafMark, LangToggle, Header (mobile menu), Footer

The persistent chrome shared by every page, including the mobile hamburger menu and the language toggle. Deliverable: a temporary harness page renders header + footer in both locales; the mobile menu toggles.

**Files:**
- Create: `apps/chikitsalay/src/components/Logo.astro`
- Create: `apps/chikitsalay/src/components/LeafMark.astro`
- Create: `apps/chikitsalay/src/components/LangToggle.astro`
- Create: `apps/chikitsalay/src/components/SiteHeader.astro`
- Create: `apps/chikitsalay/src/components/Footer.astro`
- Create: `apps/chikitsalay/public/logo.svg`
- Modify: `apps/chikitsalay/src/pages/index.astro` (harness — replaced in Task 5)
- Modify: `apps/chikitsalay/src/pages/en/index.astro` (harness — replaced in Task 5)

**Interfaces:**
- Consumes: `t, localizePath, switchLocalePath, type Locale` from `../i18n/ui`; `clinic` from `../data/clinic`.
- Produces:
  - `Logo.astro` — `Props { class?: string }` (img from `/logo.svg`, alt = clinic name).
  - `LeafMark.astro` — `Props { size?: number; class?: string }` (inline decorative SVG, `aria-hidden`).
  - `LangToggle.astro` — `Props { locale: Locale; target: string }` — pill: active locale label + link to `target` for the other locale.
  - `SiteHeader.astro` — `Props { locale: Locale; toggleTarget: string }` — sticky header, desktop nav (`hidden md:flex`), Book CTA, hamburger (`md:hidden`) opening a mobile menu.
  - `Footer.astro` — `Props { locale: Locale }` — espresso footer, WhatsApp + Instagram links, clinic/visit columns, directions → `clinic.mapsUrl`.

- [ ] **Step 1: Create `apps/chikitsalay/public/logo.svg`** (placeholder mark — real logo replaces this file later)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="12" fill="#FAF6EC"/>
  <path d="M24 8c-3 5-9 6-9 13 0 5 4 8 4 13 0 3-2 5-2 8h14c0-3-2-5-2-8 0-5 4-8 4-13 0-7-6-8-9-13z" fill="#8C9A63"/>
  <path d="M24 40V10" stroke="#3B2A1E" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="24" cy="9" r="2.6" fill="#3B2A1E"/>
</svg>
```

- [ ] **Step 2: Create `apps/chikitsalay/src/components/Logo.astro`**

```astro
---
import { clinic } from "../data/clinic";
interface Props {
  class?: string;
}
const { class: className = "" } = Astro.props;
---

<span class:list={["flex items-center gap-2.5", className]}>
  <img src="/logo.svg" width="38" height="38" alt="" class="block h-[38px] w-[38px]" />
  <span class="leading-none">
    <span class="block font-display text-[22px] font-semibold text-sage-deep">{clinic.wordmark}</span>
    <span class="block font-guserif text-[15px] text-bark" lang="gu">{clinic.nameGu.split(" ")[1]}</span>
  </span>
  <span class="sr-only">{clinic.name}</span>
</span>
```

- [ ] **Step 3: Create `apps/chikitsalay/src/components/LeafMark.astro`**

```astro
---
interface Props {
  size?: number;
  class?: string;
}
const { size = 74, class: className = "" } = Astro.props;
---

<svg
  viewBox="0 0 80 80"
  width={size}
  height={size}
  fill="none"
  aria-hidden="true"
  class:list={[className]}
>
  <path d="M40 72C40 46 20 40 12 20c22 2 30 18 28 40" stroke="var(--leaf)" stroke-width="2.4" />
  <path d="M40 72C40 50 56 42 68 26c-16 0-28 12-28 34" stroke="var(--sage)" stroke-width="2.4" />
</svg>
```

- [ ] **Step 4: Create `apps/chikitsalay/src/components/LangToggle.astro`**

```astro
---
import { t, oppositeLocale, type Locale } from "../i18n/ui";
interface Props {
  locale: Locale;
  target: string;
}
const { locale, target } = Astro.props;
const other = oppositeLocale(locale);
const label: Record<Locale, string> = { gu: "ગુ", en: "EN" };
---

<a
  href={target}
  class="inline-flex items-center rounded-full border border-line text-[13px] font-bold"
  aria-label={t(locale, "lang.switch")}
>
  <span class:list={["px-3 py-1.5 rounded-full", locale === "gu" ? "bg-sage text-white" : "text-muted"]}>{label.gu}</span>
  <span class:list={["px-3 py-1.5 rounded-full", locale === "en" ? "bg-sage text-white" : "text-muted"]}>{label.en}</span>
  <span class="sr-only">→ {label[other]}</span>
</a>
```

- [ ] **Step 5: Create `apps/chikitsalay/src/components/SiteHeader.astro`**

```astro
---
import { t, localizePath, type Locale } from "../i18n/ui";
import Logo from "./Logo.astro";
import LangToggle from "./LangToggle.astro";
import { clinic } from "../data/clinic";

interface Props {
  locale: Locale;
  toggleTarget: string;
}
const { locale, toggleTarget } = Astro.props;

const nav = [
  { key: "nav.about", href: localizePath(locale, "/") + "#about" },
  { key: "nav.treatments", href: localizePath(locale, "/") + "#treatments" },
  { key: "nav.blog", href: localizePath(locale, "/blog/") },
  { key: "nav.contact", href: localizePath(locale, "/") + "#footer" },
];
---

<header class="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur">
  <div class="mx-auto flex max-w-site items-center justify-between px-4 py-3.5 md:py-4">
    <a href={localizePath(locale, "/")} aria-label={clinic.name}><Logo /></a>

    <nav class="hidden items-center gap-7 text-[15px] font-semibold md:flex">
      {nav.map((item) => <a class="hover:text-sage-deep" href={item.href}>{t(locale, item.key)}</a>)}
      <LangToggle locale={locale} target={toggleTarget} />
      <a
        class="rounded-full bg-sage px-5 py-2.5 font-bold text-white transition-colors hover:bg-sage-deep"
        href={clinic.instagramBooking}
        target="_blank"
        rel="noopener"
      >{t(locale, "cta.book")}</a>
    </nav>

    <button
      id="menu-btn"
      class="flex h-11 w-11 items-center justify-center rounded md:hidden"
      aria-label={t(locale, "nav.menu")}
      aria-expanded="false"
      aria-controls="mobile-menu"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  </div>

  <div id="mobile-menu" class="border-t border-line bg-paper px-4 py-4 md:hidden" hidden>
    <nav class="flex flex-col gap-1 text-[17px] font-semibold">
      {nav.map((item) => <a class="rounded-sm py-3 hover:text-sage-deep" href={item.href}>{t(locale, item.key)}</a>)}
    </nav>
    <div class="mt-4 flex items-center justify-between border-t border-line pt-4">
      <LangToggle locale={locale} target={toggleTarget} />
      <a
        class="rounded-full bg-sage px-5 py-3 font-bold text-white"
        href={clinic.instagramBooking}
        target="_blank"
        rel="noopener"
      >{t(locale, "cta.book")}</a>
    </div>
  </div>
</header>

<script>
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("mobile-menu");
  btn?.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    if (menu) menu.hidden = open;
  });
</script>
```

- [ ] **Step 6: Create `apps/chikitsalay/src/components/Footer.astro`**

```astro
---
import { t, localizePath, type Locale } from "../i18n/ui";
import { clinic } from "../data/clinic";
interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const year = new Date().getFullYear();
const clinicName = locale === "gu" ? clinic.nameGu : clinic.name;
const hours = locale === "gu" ? clinic.hoursShortGu : clinic.hoursShort;
const city = locale === "gu" ? clinic.cityGu : clinic.city;
---

<footer id="footer" class="mt-2 bg-espresso text-[color:var(--footer-ink)]">
  <div class="mx-auto grid max-w-site gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr]">
    <div>
      <div class="font-display text-[22px] text-white">
        {clinic.wordmark}
        <span class="font-guserif text-base text-[color:var(--footer-muted)]" lang="gu">{clinic.nameGu.split(" ")[1]}</span>
      </div>
      <p class="mt-3 max-w-[38ch] text-[15px] text-[color:var(--footer-muted)]">{t(locale, "footer.mission")}</p>
      <div class="mt-5 flex gap-3">
        <a
          href={clinic.whatsapp}
          target="_blank"
          rel="noopener"
          aria-label="WhatsApp"
          class="flex h-11 w-11 items-center justify-center rounded border border-[color:var(--footer-line)] hover:bg-[color:var(--footer-line)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 0 16 8 8 0 0 1-4-1l-.3-.2-2.4.6.6-2.3-.2-.4A8 8 0 0 1 12 4zm4.5 10.3c-.2-.1-1.3-.7-1.5-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2 0-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3c-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6 1.8 2.8 4.4 3.9c1.6.7 2.2.7 3 .6.5 0 1.3-.6 1.5-1.1s.2-1 .1-1.1z"/></svg>
        </a>
        <a
          href={clinic.instagram}
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
          class="flex h-11 w-11 items-center justify-center rounded border border-[color:var(--footer-line)] hover:bg-[color:var(--footer-line)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg>
        </a>
      </div>
    </div>

    <div>
      <h2 class="mb-3.5 font-body text-[13px] font-bold uppercase tracking-wider text-[color:var(--footer-muted)]">{t(locale, "footer.clinic")}</h2>
      <a class="mb-2.5 block text-[15px] hover:text-white" href={localizePath(locale, "/") + "#about"}>{t(locale, "nav.about")}</a>
      <a class="mb-2.5 block text-[15px] hover:text-white" href={localizePath(locale, "/") + "#treatments"}>{t(locale, "nav.treatments")}</a>
      <a class="mb-2.5 block text-[15px] hover:text-white" href={localizePath(locale, "/blog/")}>{t(locale, "nav.blog")}</a>
      <a class="mb-2.5 block text-[15px] hover:text-white" href={clinic.instagramBooking} target="_blank" rel="noopener">{t(locale, "cta.book")}</a>
    </div>

    <div>
      <h2 class="mb-3.5 font-body text-[13px] font-bold uppercase tracking-wider text-[color:var(--footer-muted)]">{t(locale, "footer.visit")}</h2>
      <p class="mb-2.5 text-[15px]">{city}</p>
      <a class="mb-2.5 block text-[15px] hover:text-white" href={clinic.mapsUrl} target="_blank" rel="noopener">{t(locale, "footer.directions")}</a>
      <p class="mb-2.5 text-[15px] text-[color:var(--footer-muted)]">{hours}</p>
    </div>
  </div>
  <div class="border-t border-[color:var(--footer-line)] px-4 py-4.5 text-center text-[13px] text-[color:var(--footer-muted)]">
    © {year} {clinicName} · {t(locale, "footer.rights")}
  </div>
</footer>
```

- [ ] **Step 7: Wire the harness into `apps/chikitsalay/src/pages/index.astro`** (gu — temporary; replaced in Task 5)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Footer from "../components/Footer.astro";
import { switchLocalePath } from "../i18n/ui";

const pathname = Astro.url.pathname;
---

<BaseLayout lang="gu">
  <SiteHeader locale="gu" toggleTarget={switchLocalePath(pathname)} />
  <main id="main" class="mx-auto max-w-site px-4 py-16">
    <h1 class="text-espresso text-4xl">Chrome harness (gu)</h1>
  </main>
  <Footer locale="gu" />
</BaseLayout>
```

- [ ] **Step 8: Wire the harness into `apps/chikitsalay/src/pages/en/index.astro`** (en — temporary; replaced in Task 5)

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import SiteHeader from "../../components/SiteHeader.astro";
import Footer from "../../components/Footer.astro";
import { switchLocalePath } from "../../i18n/ui";

const pathname = Astro.url.pathname;
---

<BaseLayout lang="en" title="Pravritti Chikitsalay — Ayurvedic clinic">
  <SiteHeader locale="en" toggleTarget={switchLocalePath(pathname)} />
  <main id="main" class="mx-auto max-w-site px-4 py-16">
    <h1 class="text-espresso text-4xl">Chrome harness (en)</h1>
  </main>
  <Footer locale="en" />
</BaseLayout>
```

- [ ] **Step 9: Build and verify chrome renders in both locales with a working toggle target**

Run: `pnpm --filter chikitsalay build && grep -q 'href="/en/"' apps/chikitsalay/dist/index.html && grep -q 'href="/"' apps/chikitsalay/dist/en/index.html && grep -q 'id="mobile-menu"' apps/chikitsalay/dist/index.html && echo "CHROME OK"`
Expected: `CHROME OK` (gu page links to `/en/`, en page links back to `/`, mobile menu present).

- [ ] **Step 10: Type-check**

Run: `pnpm --filter chikitsalay exec astro check`
Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
git add apps/chikitsalay/src/components apps/chikitsalay/public/logo.svg apps/chikitsalay/src/pages
git commit -m "task: add site chrome — header, footer, language toggle, mobile menu"
```

---

## Task 5: Landing page sections + home pages (both locales)

Build the hero, treatments, and about-doctor sections and assemble the real home page in both locales. (Blog teaser is added in Task 6.) Deliverable: `/` and `/en/` render all three sections responsively.

**Files:**
- Create: `apps/chikitsalay/src/components/Hero.astro`
- Create: `apps/chikitsalay/src/components/Treatments.astro`
- Create: `apps/chikitsalay/src/components/AboutDoctor.astro`
- Modify: `apps/chikitsalay/src/pages/index.astro` (final gu home, minus teaser)
- Modify: `apps/chikitsalay/src/pages/en/index.astro` (final en home, minus teaser)

**Interfaces:**
- Consumes: `t, type Locale` from `../i18n/ui`; `clinic, treatments, credentialChips` from `../data/clinic`; `LeafMark` from `./LeafMark`.
- Produces: `Hero.astro`, `Treatments.astro`, `AboutDoctor.astro` — each `Props { locale: Locale }`.

- [ ] **Step 1: Create `apps/chikitsalay/src/components/Hero.astro`**

```astro
---
import { t, type Locale } from "../i18n/ui";
import { clinic } from "../data/clinic";
import LeafMark from "./LeafMark.astro";
interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
// The twin-script headline is a constant brand statement on both locales:
// English literary line above the large Gujarati line.
---

<section class="mx-auto grid max-w-site items-center gap-12 px-4 py-14 md:grid-cols-[1.05fr_.95fr] md:py-20">
  <div class="text-center md:text-left">
    <span class="mb-5 inline-flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-sage-deep">
      <span class="hidden h-px w-6 bg-sage sm:inline-block"></span>{t(locale, "hero.eyebrow")}
    </span>
    <h1 class="text-[clamp(1.5rem,6vw,1.9rem)] font-medium text-bark">{clinic.taglineEn}</h1>
    <p class="mt-1.5 font-guserif text-[clamp(2rem,9vw,3.25rem)] font-bold leading-[1.1] text-espresso" lang="gu">{clinic.taglineGu}</p>
    <p class="mx-auto mt-5 max-w-[46ch] text-[18px] text-muted md:mx-0">{t(locale, "hero.lead")}</p>

    <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:justify-start">
      <a
        class="inline-flex items-center justify-center gap-2 rounded-full bg-sage px-5 py-3 font-bold text-white transition-colors hover:bg-sage-deep"
        href={clinic.instagramBooking}
        target="_blank"
        rel="noopener"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" stroke="none"/></svg>
        {t(locale, "cta.book")}
      </a>
      <a
        class="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-bark px-5 py-3 font-bold text-espresso transition-colors hover:bg-card-warm"
        href={clinic.whatsapp}
        target="_blank"
        rel="noopener"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        {t(locale, "cta.whatsapp")}
      </a>
    </div>

    <div class="mt-9 flex justify-center gap-8 border-t border-line pt-6 md:justify-start">
      <div><div class="font-display text-[28px] font-bold text-sage-deep">{clinic.yearsPractice}</div><div class="text-[13.5px] text-muted">{t(locale, "trust.years")}</div></div>
      <div><div class="font-display text-[28px] font-bold text-sage-deep">{clinic.qualification}</div><div class="text-[13.5px] text-muted">{t(locale, "trust.qual")}</div></div>
      <div><div class="font-display text-[28px] font-bold text-sage-deep">{clinic.rating}</div><div class="text-[13.5px] text-muted">{t(locale, "trust.rating")}</div></div>
    </div>
  </div>

  <div class="relative mx-auto w-full max-w-[420px]">
    <LeafMark class="absolute -right-2 -top-4 opacity-90" />
    <div class="flex aspect-[4/5] items-end overflow-hidden rounded-xl border border-line bg-gradient-to-b from-[#E9E2CF] to-[#DCD3BC] shadow-card">
      <div class="flex h-full w-full items-center justify-center text-sm text-bark opacity-60">{clinic.doctor.name} — portrait</div>
    </div>
    <div class="absolute -left-3 bottom-7 rounded-lg border border-line bg-card px-4 py-3 shadow-card">
      <div class="font-display text-[15px] font-bold text-espresso">{t(locale, "hero.openToday")}</div>
      <div class="text-[12.5px] text-muted">{locale === "gu" ? clinic.hoursShortGu : clinic.hoursShort}</div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create `apps/chikitsalay/src/components/Treatments.astro`**

```astro
---
import { t, type Locale } from "../i18n/ui";
import { treatments } from "../data/clinic";
interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const icons: Record<string, string> = {
  panchakarma: "M12 3c0 5-4 6-4 11a4 4 0 0 0 8 0c0-5-4-6-4-11z",
  chronic: "M8 21c0-6 2-9 8-11M6 9a6 6 0 0 1 12 0",
  "womens-wellness": "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z",
};
---

<section id="treatments" class="mx-auto max-w-site scroll-mt-24 px-4 py-14">
  <div class="mx-auto mb-10 max-w-[60ch] text-center">
    <div class="text-[13px] font-bold uppercase tracking-wider text-sage-deep">{t(locale, "treat.label")}</div>
    <h2 class="mt-3 text-[clamp(1.6rem,5vw,2.1rem)]">{t(locale, "treat.head")}</h2>
    <p class="mt-2.5 text-muted">{t(locale, "treat.sub")}</p>
  </div>
  <div class="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
    {treatments.map((tr) => (
      <article class="rounded-xl border border-line bg-card p-7 transition-transform duration-200 hover:-translate-y-1 hover:shadow-card">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded bg-card-warm text-sage-deep">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d={icons[tr.slug]} /></svg>
        </div>
        <div class="font-guserif text-[15px] text-bark" lang="gu">{tr.titleGu}</div>
        <h3 class="mt-1 text-[20px]">{tr.titleEn}</h3>
        <p class="mt-2 text-[15px] text-muted">{locale === "gu" ? tr.blurbGu : tr.blurbEn}</p>
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Create `apps/chikitsalay/src/components/AboutDoctor.astro`**

```astro
---
import { t, type Locale } from "../i18n/ui";
import { clinic, credentialChips } from "../data/clinic";
interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const name = locale === "gu" ? clinic.doctor.nameGu : clinic.doctor.name;
const creds = locale === "gu" ? clinic.doctor.credentialsGu : clinic.doctor.credentials;
---

<section id="about" class="scroll-mt-24 border-y border-line bg-card-warm">
  <div class="mx-auto grid max-w-site items-center gap-10 px-4 py-14 md:grid-cols-[.8fr_1.2fr]">
    <div class="flex aspect-square items-center justify-center rounded-xl border border-line bg-gradient-to-b from-[#E4DCC7] to-[#D3C9B0] text-sm text-bark opacity-70">
      {clinic.name} — photo
    </div>
    <div>
      <div class="text-[13px] font-bold uppercase tracking-wider text-sage-deep">{t(locale, "about.label")}</div>
      <h2 class="mt-3 text-[clamp(1.6rem,5vw,1.9rem)]">{name}</h2>
      <div class="mt-1.5 font-bold text-sage-deep">{creds}</div>
      <p class="mt-4 text-muted">{t(locale, "about.body")}</p>
      <div class="mt-5 flex flex-wrap gap-2.5">
        {credentialChips.map((chip) => (
          <span class="rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px] font-semibold text-sage-deep">{locale === "gu" ? chip.gu : chip.en}</span>
        ))}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Replace `apps/chikitsalay/src/pages/index.astro`** (final gu home, teaser added in Task 6)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Hero from "../components/Hero.astro";
import Treatments from "../components/Treatments.astro";
import AboutDoctor from "../components/AboutDoctor.astro";
import Footer from "../components/Footer.astro";
import { switchLocalePath } from "../i18n/ui";

const toggleTarget = switchLocalePath(Astro.url.pathname);
---

<BaseLayout lang="gu">
  <SiteHeader locale="gu" toggleTarget={toggleTarget} />
  <main id="main">
    <Hero locale="gu" />
    <Treatments locale="gu" />
    <AboutDoctor locale="gu" />
  </main>
  <Footer locale="gu" />
</BaseLayout>
```

- [ ] **Step 5: Replace `apps/chikitsalay/src/pages/en/index.astro`** (final en home, teaser added in Task 6)

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import SiteHeader from "../../components/SiteHeader.astro";
import Hero from "../../components/Hero.astro";
import Treatments from "../../components/Treatments.astro";
import AboutDoctor from "../../components/AboutDoctor.astro";
import Footer from "../../components/Footer.astro";
import { switchLocalePath } from "../../i18n/ui";

const toggleTarget = switchLocalePath(Astro.url.pathname);
---

<BaseLayout lang="en" title="Pravritti Chikitsalay — Ayurvedic clinic, Sutrapada">
  <SiteHeader locale="en" toggleTarget={toggleTarget} />
  <main id="main">
    <Hero locale="en" />
    <Treatments locale="en" />
    <AboutDoctor locale="en" />
  </main>
  <Footer locale="en" />
</BaseLayout>
```

- [ ] **Step 6: Build and verify both homes render all sections**

Run: `pnpm --filter chikitsalay build && grep -o "પ્રકૃતિ સાથે, સ્વસ્થ જીવન\|Panchakarma\|Meet your vaidya" apps/chikitsalay/dist/en/index.html | sort -u && grep -q "id=\"treatments\"" apps/chikitsalay/dist/index.html && echo "HOME OK"`
Expected: the three English strings on the en page + `HOME OK`.

- [ ] **Step 7: Verify all three treatment cards render**

Run: `grep -c 'class="rounded-xl border border-line bg-card p-7' apps/chikitsalay/dist/index.html`
Expected: `3`.

- [ ] **Step 8: Type-check**

Run: `pnpm --filter chikitsalay exec astro check`
Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
git add apps/chikitsalay/src/components apps/chikitsalay/src/pages
git commit -m "task: build landing page sections + bilingual home pages"
```

---

## Task 6: Blog — collection, helpers, index (both locales), post pages, teaser

The blog: content-collection schema, reading-time/sort helpers, seed posts (mixed languages), a localized blog index listing all posts, single-language post pages, and the home-page teaser. Deliverable: blog index lists posts; a post renders long-form; both homes show the latest three.

**Files:**
- Create: `apps/chikitsalay/src/content/config.ts`
- Create: `apps/chikitsalay/src/content/blog/dinacharya-morning-routine.md` (en)
- Create: `apps/chikitsalay/src/content/blog/chomasa-pachan.md` (gu)
- Create: `apps/chikitsalay/src/content/blog/ahara-prakruti.md` (gu)
- Create: `apps/chikitsalay/src/lib/posts.ts`
- Test: `apps/chikitsalay/src/lib/posts.test.ts`
- Create: `apps/chikitsalay/src/components/PostCard.astro`
- Create: `apps/chikitsalay/src/components/BlogTeaser.astro`
- Create: `apps/chikitsalay/src/layouts/PostLayout.astro`
- Create: `apps/chikitsalay/src/pages/blog/index.astro`
- Create: `apps/chikitsalay/src/pages/en/blog/index.astro`
- Create: `apps/chikitsalay/src/pages/blog/[slug].astro`
- Modify: `apps/chikitsalay/src/pages/index.astro` (insert teaser)
- Modify: `apps/chikitsalay/src/pages/en/index.astro` (insert teaser)

**Interfaces:**
- Produces:
  - `src/content/config.ts` — `blog` collection, schema `{ title: string; date: Date; lang: "gu"|"en"; summary: string; tags: string[]; cover?: string; draft: boolean }`.
  - `src/lib/posts.ts` — `readingMinutes(text: string): number`; `sortByDateDesc<T extends { data: { date: Date } }>(posts: T[]): T[]`.
  - `PostCard.astro` — `Props { post: CollectionEntry<"blog">; locale: Locale }`.
  - `BlogTeaser.astro` — `Props { locale: Locale }`.
  - `PostLayout.astro` — `Props { post: CollectionEntry<"blog"> }`.

- [ ] **Step 1: Create `apps/chikitsalay/src/content/config.ts`**

```ts
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    lang: z.enum(["gu", "en"]),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: Create seed post `apps/chikitsalay/src/content/blog/dinacharya-morning-routine.md`**

```markdown
---
title: "The morning routine that changes everything"
date: 2026-06-10
lang: "en"
summary: "What a classical Ayurvedic dinacharya looks like, and where to actually begin."
tags: ["Dinacharya"]
draft: false
---

Ayurveda places enormous weight on _dinacharya_ — the daily routine. Not because
routine is virtuous, but because the body keeps time, and aligning with that clock
is the cheapest medicine there is.

## Start before the sun

Waking in the _brahma muhurta_, the hour and a half before sunrise, sets the tone
for digestion, mood, and clarity through the day.

## Three habits to begin with

1. Scrape the tongue and rinse the mouth.
2. Drink warm water.
3. Sit quietly for five minutes before reaching for the phone.

Begin with these. Everything else can follow once they hold.
```

- [ ] **Step 3: Create seed post `apps/chikitsalay/src/content/blog/chomasa-pachan.md`**

```markdown
---
title: "ચોમાસામાં પાચન કેવી રીતે સાચવવું"
date: 2026-06-22
lang: "gu"
summary: "વરસાદની ઋતુમાં તમારા અગ્નિ — પાચનશક્તિ — ને સ્થિર રાખવા માટે છ સરળ ટેવ."
tags: ["Ritucharya"]
draft: false
---

ચોમાસામાં વાત દોષ વધે છે અને અગ્નિ મંદ પડે છે. તેથી આ ઋતુમાં પાચનની ખાસ કાળજી જરૂરી છે.

## સરળ ટેવ

- ગરમ અને તાજું ભોજન લો.
- ઠંડા અને વાસી ખોરાકથી દૂર રહો.
- આદુ અને લીંબુનો ઉપયોગ કરો.

આ નાની ટેવ ઋતુભર તમારા પાચનને સ્વસ્થ રાખશે.
```

- [ ] **Step 4: Create seed post `apps/chikitsalay/src/content/blog/ahara-prakruti.md`**

```markdown
---
title: "તમારી પ્રકૃતિ પ્રમાણે આહાર"
date: 2026-05-30
lang: "gu"
summary: "દરેક ભોજનને પ્રોજેક્ટ બનાવ્યા વિના તમારા દોષ પ્રમાણે કેવી રીતે ખાવું."
tags: ["Ahara"]
draft: false
---

આયુર્વેદ કહે છે કે દરેક વ્યક્તિની પ્રકૃતિ અલગ છે — વાત, પિત્ત અને કફ.

## મૂળ સિદ્ધાંત

તમારી પ્રકૃતિ સમજો, ઋતુ સમજો, અને એ પ્રમાણે આહાર પસંદ કરો. જટિલતા જરૂરી નથી.
```

- [ ] **Step 5: Write the failing test `apps/chikitsalay/src/lib/posts.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { readingMinutes, sortByDateDesc } from "./posts";

describe("readingMinutes", () => {
  it("returns at least 1 minute for short text", () => {
    expect(readingMinutes("a few words here")).toBe(1);
  });

  it("scales with word count (~200 wpm)", () => {
    const text = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readingMinutes(text)).toBe(3);
  });
});

describe("sortByDateDesc", () => {
  it("orders posts newest first without mutating input", () => {
    const input = [
      { data: { date: new Date("2026-01-01") } },
      { data: { date: new Date("2026-03-01") } },
      { data: { date: new Date("2026-02-01") } },
    ];
    const out = sortByDateDesc(input);
    expect(out.map((p) => p.data.date.getMonth())).toEqual([2, 1, 0]);
    expect(input[0].data.date.getMonth()).toBe(0); // input unchanged
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm --filter chikitsalay test src/lib/posts.test.ts`
Expected: FAIL — cannot resolve `./posts`.

- [ ] **Step 7: Create `apps/chikitsalay/src/lib/posts.ts`**

```ts
/** Small pure helpers for the blog. Kept framework-free so they are unit-tested. */

export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function sortByDateDesc<T extends { data: { date: Date } }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter chikitsalay test src/lib/posts.test.ts`
Expected: PASS.

- [ ] **Step 9: Create `apps/chikitsalay/src/components/PostCard.astro`**

```astro
---
import type { CollectionEntry } from "astro:content";
import { t, type Locale } from "../i18n/ui";
import { readingMinutes } from "../lib/posts";
interface Props {
  post: CollectionEntry<"blog">;
  locale: Locale;
}
const { post, locale } = Astro.props;
const mins = readingMinutes(post.body);
const langLabel = post.data.lang === "gu" ? "ગુજરાતી" : "English";
const isGu = post.data.lang === "gu";
---

<article class="overflow-hidden rounded-xl border border-line bg-card transition-transform duration-200 hover:-translate-y-1 hover:shadow-card">
  <a href={`/blog/${post.slug}/`} class="block">
    <div class="aspect-[16/10] bg-gradient-to-b from-[#E7E0CD] to-[#D6D9BC]"></div>
    <div class="p-5.5">
      {post.data.tags[0] && <span class="text-[12px] font-bold uppercase tracking-wider text-sage-deep">{post.data.tags[0]}</span>}
      <h3 class:list={["mt-2 text-[19px] leading-tight", isGu && "font-guserif"]} lang={post.data.lang}>{post.data.title}</h3>
      <p class="mt-2 text-[14.5px] text-muted" lang={post.data.lang}>{post.data.summary}</p>
      <div class="mt-3.5 text-[13px] text-muted">{langLabel} · {mins} {t(locale, "blog.readtime")}</div>
    </div>
  </a>
</article>
```

- [ ] **Step 10: Create `apps/chikitsalay/src/components/BlogTeaser.astro`**

```astro
---
import { getCollection } from "astro:content";
import { t, localizePath, type Locale } from "../i18n/ui";
import { sortByDateDesc } from "../lib/posts";
import PostCard from "./PostCard.astro";
interface Props {
  locale: Locale;
}
const { locale } = Astro.props;
const posts = sortByDateDesc(await getCollection("blog", (p) => !p.data.draft)).slice(0, 3);
---

{posts.length > 0 && (
  <section class="mx-auto max-w-site px-4 py-14">
    <div class="mx-auto mb-10 max-w-[60ch] text-center">
      <div class="text-[13px] font-bold uppercase tracking-wider text-sage-deep">{t(locale, "blog.label")}</div>
      <h2 class="mt-3 text-[clamp(1.6rem,5vw,2.1rem)]">{t(locale, "blog.head")}</h2>
      <p class="mt-2.5 text-muted">{t(locale, "blog.sub")}</p>
    </div>
    <div class="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
      {posts.map((post) => <PostCard post={post} locale={locale} />)}
    </div>
    <div class="mt-9 text-center">
      <a class="inline-flex rounded-full border-[1.5px] border-bark px-5 py-2.5 font-bold text-espresso hover:bg-card-warm" href={localizePath(locale, "/blog/")}>{t(locale, "blog.viewAll")}</a>
    </div>
  </section>
)}
```

- [ ] **Step 11: Create `apps/chikitsalay/src/layouts/PostLayout.astro`**

```astro
---
import type { CollectionEntry } from "astro:content";
import BaseLayout from "./BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Footer from "../components/Footer.astro";
import { t, localizePath, switchLocalePath } from "../i18n/ui";
import { readingMinutes } from "../lib/posts";
import { clinic } from "../data/clinic";

interface Props {
  post: CollectionEntry<"blog">;
}
const { post } = Astro.props;
const locale = post.data.lang;
const mins = readingMinutes(post.body);
const dateStr = post.data.date.toLocaleDateString(locale === "gu" ? "gu-IN" : "en-GB", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
// Post chrome follows the post's own language; the toggle points to the other
// locale's blog index (single-language posts have no counterpart URL).
const toggleTarget = switchLocalePath(localizePath(locale, "/blog/"));
---

<BaseLayout lang={locale} title={`${post.data.title} — ${clinic.name}`} description={post.data.summary}>
  <SiteHeader locale={locale} toggleTarget={toggleTarget} />
  <main id="main" class="mx-auto max-w-prose px-4 py-12">
    <a href={localizePath(locale, "/blog/")} class="text-[14px] text-muted hover:text-sage-deep">{t(locale, "blog.back")}</a>
    <h1 class="mt-4 text-[clamp(1.9rem,6vw,2.6rem)] font-bold text-espresso" lang={locale}>{post.data.title}</h1>
    <p class="mt-3 text-[14px] text-muted">{dateStr} · {mins} {t(locale, "blog.readtime")}</p>
    <div class="post mt-8 text-espresso" lang={locale}>
      <slot />
    </div>
  </main>
  <Footer locale={locale} />
</BaseLayout>

<style>
  .post :global(h2) {
    font-family: var(--font-display);
    font-size: 1.4rem;
    margin: 2rem 0 0.75rem;
  }
  .post :global(p) {
    margin: 0 0 1rem;
    line-height: 1.75;
    color: var(--muted);
  }
  .post :global(ul),
  .post :global(ol) {
    margin: 0 0 1rem;
    padding-left: 1.25rem;
    color: var(--muted);
  }
  .post :global(li) {
    margin: 0.35rem 0;
  }
  .post :global(a) {
    color: var(--sage-deep);
    text-decoration: underline;
  }
  .post :global(strong) {
    color: var(--espresso);
  }
</style>
```

- [ ] **Step 12: Create `apps/chikitsalay/src/pages/blog/[slug].astro`**

```astro
---
import { getCollection, type CollectionEntry } from "astro:content";
import PostLayout from "../../layouts/PostLayout.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog", (p) => !p.data.draft);
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}

type Props = { post: CollectionEntry<"blog"> };
const { post } = Astro.props as Props;
const { Content } = await post.render();
---

<PostLayout post={post}>
  <Content />
</PostLayout>
```

- [ ] **Step 13: Create `apps/chikitsalay/src/pages/blog/index.astro`** (gu blog index — lists ALL posts)

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import SiteHeader from "../../components/SiteHeader.astro";
import Footer from "../../components/Footer.astro";
import PostCard from "../../components/PostCard.astro";
import { t, switchLocalePath } from "../../i18n/ui";
import { sortByDateDesc } from "../../lib/posts";

const posts = sortByDateDesc(await getCollection("blog", (p) => !p.data.draft));
const toggleTarget = switchLocalePath(Astro.url.pathname);
---

<BaseLayout lang="gu" title="લેખ — પ્રવૃત્તિ ચિકિત્સાલય">
  <SiteHeader locale="gu" toggleTarget={toggleTarget} />
  <main id="main" class="mx-auto max-w-site px-4 py-14">
    <div class="mb-10 max-w-[60ch]">
      <div class="text-[13px] font-bold uppercase tracking-wider text-sage-deep">{t("gu", "blog.label")}</div>
      <h1 class="mt-3 text-[clamp(1.8rem,6vw,2.4rem)]">{t("gu", "blog.head")}</h1>
      <p class="mt-2.5 text-muted">{t("gu", "blog.sub")}</p>
    </div>
    {posts.length === 0 ? (
      <p class="text-muted">{t("gu", "blog.empty")}</p>
    ) : (
      <div class="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {posts.map((post) => <PostCard post={post} locale="gu" />)}
      </div>
    )}
  </main>
  <Footer locale="gu" />
</BaseLayout>
```

- [ ] **Step 14: Create `apps/chikitsalay/src/pages/en/blog/index.astro`** (en blog index — lists ALL posts)

```astro
---
import { getCollection } from "astro:content";
import BaseLayout from "../../../layouts/BaseLayout.astro";
import SiteHeader from "../../../components/SiteHeader.astro";
import Footer from "../../../components/Footer.astro";
import PostCard from "../../../components/PostCard.astro";
import { t, switchLocalePath } from "../../../i18n/ui";
import { sortByDateDesc } from "../../../lib/posts";

const posts = sortByDateDesc(await getCollection("blog", (p) => !p.data.draft));
const toggleTarget = switchLocalePath(Astro.url.pathname);
---

<BaseLayout lang="en" title="Blog — Pravritti Chikitsalay">
  <SiteHeader locale="en" toggleTarget={toggleTarget} />
  <main id="main" class="mx-auto max-w-site px-4 py-14">
    <div class="mb-10 max-w-[60ch]">
      <div class="text-[13px] font-bold uppercase tracking-wider text-sage-deep">{t("en", "blog.label")}</div>
      <h1 class="mt-3 text-[clamp(1.8rem,6vw,2.4rem)]">{t("en", "blog.head")}</h1>
      <p class="mt-2.5 text-muted">{t("en", "blog.sub")}</p>
    </div>
    {posts.length === 0 ? (
      <p class="text-muted">{t("en", "blog.empty")}</p>
    ) : (
      <div class="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {posts.map((post) => <PostCard post={post} locale="en" />)}
      </div>
    )}
  </main>
  <Footer locale="en" />
</BaseLayout>
```

- [ ] **Step 15: Insert the teaser into `apps/chikitsalay/src/pages/index.astro`** — add the import and the component after `<AboutDoctor locale="gu" />`:

Add to the frontmatter imports:
```astro
import BlogTeaser from "../components/BlogTeaser.astro";
```
Add inside `<main>`, after `<AboutDoctor locale="gu" />`:
```astro
    <BlogTeaser locale="gu" />
```

- [ ] **Step 16: Insert the teaser into `apps/chikitsalay/src/pages/en/index.astro`** — add the import and the component after `<AboutDoctor locale="en" />`:

Add to the frontmatter imports:
```astro
import BlogTeaser from "../../components/BlogTeaser.astro";
```
Add inside `<main>`, after `<AboutDoctor locale="en" />`:
```astro
    <BlogTeaser locale="en" />
```

- [ ] **Step 17: Build and verify blog index, a post, and the teaser**

Run: `pnpm --filter chikitsalay build && test -f apps/chikitsalay/dist/blog/index.html && test -f apps/chikitsalay/dist/en/blog/index.html && test -f apps/chikitsalay/dist/blog/dinacharya-morning-routine/index.html && grep -q "min read" apps/chikitsalay/dist/blog/index.html && grep -q "min read" apps/chikitsalay/dist/index.html && echo "BLOG OK"`
Expected: `BLOG OK` (both indexes built, post built, teaser present on home).

- [ ] **Step 18: Verify the index lists all three posts**

Run: `grep -c 'class="overflow-hidden rounded-xl border border-line bg-card' apps/chikitsalay/dist/blog/index.html`
Expected: `3`.

- [ ] **Step 19: Type-check + full test run**

Run: `pnpm --filter chikitsalay exec astro check && pnpm --filter chikitsalay test`
Expected: 0 check errors; all vitest suites PASS.

- [ ] **Step 20: Commit**

```bash
git add apps/chikitsalay/src
git commit -m "task: add blog — collection, index, posts, and home teaser"
```

---

## Task 7: 404 page, icon/OG placeholders, and full-site verification

The branded bilingual 404, placeholder favicons/OG image, and a final whole-site verification pass. Deliverable: complete site builds clean; no horizontal-scroll regressions; all checks green.

**Files:**
- Create: `apps/chikitsalay/src/pages/404.astro`
- Create: `apps/chikitsalay/public/favicon-32.png` (placeholder)
- Create: `apps/chikitsalay/public/apple-touch-icon.png` (placeholder)
- Create: `apps/chikitsalay/public/og.png` (placeholder)

**Interfaces:**
- Consumes: `BaseLayout`, `SiteHeader`, `Footer`, `LeafMark`, `t`, `switchLocalePath`.

- [ ] **Step 1: Create `apps/chikitsalay/src/pages/404.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Footer from "../components/Footer.astro";
import LeafMark from "../components/LeafMark.astro";
import { t, localizePath, switchLocalePath } from "../i18n/ui";

const toggleTarget = switchLocalePath(Astro.url.pathname);
---

<BaseLayout lang="gu" title="404 — પ્રવૃત્તિ ચિકિત્સાલય">
  <SiteHeader locale="gu" toggleTarget={toggleTarget} />
  <main id="main" class="mx-auto grid max-w-site place-items-center px-4 py-24 text-center">
    <LeafMark size={90} />
    <h1 class="mt-6 text-[clamp(1.8rem,6vw,2.4rem)] text-espresso">{t("gu", "nf.head")}</h1>
    <p class="mt-2 text-muted">{t("gu", "nf.body")}</p>
    <a class="mt-6 rounded-full border-[1.5px] border-bark px-5 py-2.5 font-bold text-espresso hover:bg-card-warm" href={localizePath("gu", "/")}>{t("gu", "nf.home")}</a>
  </main>
  <Footer locale="gu" />
</BaseLayout>
```

- [ ] **Step 2: Create placeholder icons + OG image**

Run:
```bash
printf '\x89PNG\r\n\x1a\n' > apps/chikitsalay/public/favicon-32.png
printf '\x89PNG\r\n\x1a\n' > apps/chikitsalay/public/apple-touch-icon.png
printf '\x89PNG\r\n\x1a\n' > apps/chikitsalay/public/og.png
```

> Note: minimal valid PNG signatures so the references resolve and the build never breaks. Replace with the real favicon (from the logo), a 180×180 apple-touch-icon, and a 1200×630 OG card (leaf mark + wordmark on cream) before go-live.

- [ ] **Step 3: Full clean build**

Run: `pnpm --filter chikitsalay build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Verify the 404 built with its Gujarati heading**

Run: `test -f apps/chikitsalay/dist/404.html && grep -q "આ પાનું મળ્યું નથી" apps/chikitsalay/dist/404.html && echo "404 OK"`
Expected: `404 OK`.

- [ ] **Step 5: Guard against horizontal-scroll regressions**

Run: `grep -rq "overflow-x: clip\|overflow-x:clip" apps/chikitsalay/dist/index.html && echo "NO-HSCROLL GUARD OK"`
Expected: `NO-HSCROLL GUARD OK` (body still ships the `overflow-x: clip` rule).

- [ ] **Step 6: Verify token discipline — no raw brand hex leaked into component markup**

Run: `! grep -rniE "#(3b2a1e|8c9a63|5f6b3c|9db36a|faf6ec)" apps/chikitsalay/src/components apps/chikitsalay/src/layouts && echo "TOKEN DISCIPLINE OK"`
Expected: `TOKEN DISCIPLINE OK` (brand hex lives only in `tokens.css`; gradient stop colors used in mockups are neutral tints, not brand tokens).

- [ ] **Step 7: Type-check + all tests**

Run: `pnpm --filter chikitsalay exec astro check && pnpm --filter chikitsalay test`
Expected: 0 check errors; all suites PASS.

- [ ] **Step 8: Manual responsive check (record result)**

Run: `pnpm --filter chikitsalay preview` then open the preview URL and, using browser dev-tools device toolbar, verify at **375 / 768 / 1024 / 1440px in both `/` and `/en/`**: no horizontal scroll; hamburger menu opens and the language toggle is reachable; hero CTAs stack full-width; treatment/blog grids collapse to one column; footer stacks. Note any issue before committing.
Expected: all breakpoints pass in both locales.

- [ ] **Step 9: Commit**

```bash
git add apps/chikitsalay/src/pages/404.astro apps/chikitsalay/public
git commit -m "task: add branded 404, icon/OG placeholders, and final verification"
```

---

## Post-implementation: deployment (manual, by the user)

Not a code task — for reference when wiring Cloudflare Pages:
- New Pages project → **Root directory** `apps/chikitsalay`, **Build command** `pnpm install && pnpm --filter chikitsalay build`, **Output** `apps/chikitsalay/dist`.
- **Production branch:** `chikitsalay` (Pages redeploys on every push to it).
- **Build watch paths:** `apps/chikitsalay/**`, `packages/config/**`.
- **Custom domain:** `chikitsalay.pravritti.org`.
- Before go-live, fill the `clinic.ts` placeholders (credentials, hours, address, phone, WhatsApp number, Instagram handle), replace `logo.svg` / favicons / `og.png` with real assets, add real Dr. Vala + clinic photos, and write real blog posts (delete the seed posts).

---

## Self-Review

**Spec coverage** (each spec section → task):
- New `apps/chikitsalay` Astro app, monorepo pattern, `chikitsalay` branch → Task 1 + Global Constraints. ✓
- Logo-derived palette + green-as-text discipline + light-only → Task 1 (`tokens.css`) + Global Constraints. ✓
- Bilingual routed i18n (gu `/`, en `/en/`) + header toggle → Task 1 (config) + Task 2 (helpers) + Task 4 (LangToggle/Header). ✓
- Bilingual type pairing (Lora/Nunito + Noto Gujarati) → Task 1 (fonts + `html[lang=gu]` swap + `.gu` utilities). ✓
- Landing page = approved mockup (header/hero/treatments/about/blog/footer) → Tasks 4–6. ✓
- Blog: Markdown content collection, single-language posts (option B), one index listing all, canonical `/blog/<slug>/` → Task 6. ✓
- Clinic facts placeholdered in one module → Task 3. ✓
- WhatsApp + Instagram footer; Instagram-only booking as primary CTA sitewide → Task 4 (Footer + Header CTA) + Task 5 (Hero CTA). ✓
- Google Maps directions link → Task 3 (`clinic.mapsUrl`) + Task 4 (Footer). ✓
- Responsive / mobile-first hard requirement → Tasks 4–6 responsive classes + Task 7 Step 8 manual check + Step 5 hscroll guard. ✓
- Accessibility (focus rings, reduced-motion, ≥44px, no color-only) → Task 1 (`global.css`) + Task 4 (44px targets, aria on menu/toggle). ✓
- 404 → Task 7. ✓
- Espresso platform tokens untouched; brand-local; no shared-preset import → Task 1 + Global Constraints + Task 7 Step 6 guard. ✓

**Placeholder scan:** The only `TODO_` strings are the intentional clinic-fact stubs the spec mandates (phone, WhatsApp, Instagram, email, address, and confirm-notes on credentials/hours/rating). Each is valid for the build and isolated to `clinic.ts`. No plan-step placeholders.

**Type consistency:**
- i18n exports (`Locale`, `t`, `getLocale`, `stripLocale`, `localizePath`, `oppositeLocale`, `switchLocalePath`, `ui`, `locales`, `defaultLocale`) match every consumer (Header, Footer, LangToggle, Hero, Treatments, AboutDoctor, BlogTeaser, PostCard, PostLayout, all pages, 404).
- `clinic` fields used by components (`wordmark`, `nameGu`, `instagramBooking`, `whatsapp`, `instagram`, `mapsUrl`, `hoursShort`/`hoursShortGu`, `city`/`cityGu`, `yearsPractice`, `qualification`, `rating`, `taglineEn`/`taglineGu`, `doctor.*`) all exist in Task 3's module.
- `treatments` item shape (`slug`, `titleEn`, `titleGu`, `blurbEn`, `blurbGu`) matches `Treatments.astro`; `credentialChips` (`en`/`gu`) matches `AboutDoctor.astro`.
- `posts.ts` (`readingMinutes`, `sortByDateDesc`) matches PostCard/BlogTeaser/PostLayout/indexes usage.
- `PostLayout`/`PostCard`/`[slug].astro` all use `CollectionEntry<"blog">`, `post.slug`, `post.body`, `post.render()` consistently with the Task 6 `type: "content"` collection.
- Component prop names are consistent: `SiteHeader { locale, toggleTarget }`, `LangToggle { locale, target }`, `Hero/Treatments/AboutDoctor/BlogTeaser/Footer { locale }`, `PostCard { post, locale }`, `PostLayout { post }` — matching every call site.
