# Tithi Site (tithi.pravritti.org) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `apps/tithi`, a lean Astro static site serving as the Tithi mobile app's official web presence + store-compliance home (landing, privacy, support, data-deletion, Android Digital Asset Links), faithful to the Tithi app brand.

**Architecture:** A new Astro SSG app in the existing pnpm monorepo, mirroring `apps/hiren`'s setup but with its own Tithi brand token layer (`apps/tithi/src/styles/tokens.css`) instead of the shared espresso palette. Brand tokens map to Tailwind utilities via a tithi-local `tailwind.config.mjs`. All copy/links live in one `content.ts`. No backend; static output served by a Cloudflare Pages project watching the `tithi` git branch.

**Tech Stack:** Astro 5, `@astrojs/tailwind` 5 + Tailwind 3, `@fontsource/noto-serif-gujarati` + `@fontsource/noto-sans-gujarati`, vitest 4 (for the one data module with logic).

## Global Constraints

- **Branch:** all work happens on the `tithi` branch (Cloudflare Pages watches it). Already created and checked out.
- **Node:** `>=20`; package manager `pnpm@11.8.0`.
- **Dark only by design.** No light theme. No drop shadows, glass, or gradients — *except* the Diya Moon's gold glow (the one permitted glow). Depth = warm tone steps + gold hairlines.
- **Token discipline:** components reference token names / Tailwind utilities, never raw hex. Brand values live only in `apps/tithi/src/styles/tokens.css`. Do **not** modify `packages/config` (espresso palette belongs to `hiren`/apex).
- **Gujarati-first:** where both scripts appear, Gujarati leads (larger / first), English is secondary (~75–80% size, `on-surface-secondary`). Never reversed.
- **Vermilion is fill/marker only** — never small text on dark (fails contrast). Festival/emphasis *text* uses `gold` or `on-surface`.
- **Exact app palette (hex, do not alter):** surface `#1A1413`, surface-elevated `#251D1A`, surface-variant `#312622`, gold `#E0A93B`, gold-deep `#B8862B`, vermilion `#C1372E`, on-gold `#1A100C`, on-surface `#F3E9D8`, on-surface-secondary `#C2B2A0`, on-surface-muted `#8C7A6E`, auspicious `#8FBF6F`, inauspicious `#D98C7A`, neutral-band `#D9B86A`, holiday `#E5645A`, moon-lit `#F7EAC9`, moon-dark `#2A1D1C`, hairline `#E0A93B2E`.
- **Fonts:** Noto Serif Gujarati (display, w600/700), Noto Sans Gujarati (body, w400/500). Both cover Latin; English uses the same families.
- **Radii:** sm 8 · md 12 · lg 20 · xl 28 · full 999. Spacing uses Tailwind defaults (already 4/8-based).
- **Motion:** fast 150 · base 200 · slow 300ms; one expressive animation only (the diya halo breathe ~4s), disabled under `prefers-reduced-motion`.
- **Content stubs (leave as clearly-marked placeholders, never block the build):** contact email, `assetlinks.json` package name + SHA-256 fingerprint, real store URLs, real screenshots.
- **Commit prefix:** use `task:` (project convention), not `feat:`/`chore:`.
- **No overt religious icons** (no Om/Swastik/kalash). No emoji.

---

## File Structure

```
apps/tithi/
├─ package.json
├─ astro.config.mjs
├─ tailwind.config.mjs
├─ tsconfig.json
├─ vitest.config.ts
├─ public/
│  ├─ .well-known/assetlinks.json
│  ├─ screenshots/today.png            # placeholder
│  ├─ favicon.svg
│  └─ og.png                           # placeholder
└─ src/
   ├─ layouts/
   │  ├─ BaseLayout.astro
   │  └─ DocLayout.astro
   ├─ styles/
   │  ├─ tokens.css
   │  └─ global.css
   ├─ data/
   │  ├─ content.ts
   │  └─ content.test.ts
   ├─ components/
   │  ├─ SiteHeader.astro
   │  ├─ DiyaMoon.astro
   │  ├─ Hero.astro
   │  ├─ StoreBadges.astro
   │  ├─ Features.astro
   │  ├─ PhoneMock.astro
   │  └─ Footer.astro
   └─ pages/
      ├─ index.astro
      ├─ privacy.astro
      ├─ support.astro
      ├─ data-deletion.astro
      └─ 404.astro
```

---

## Task 1: Scaffold the app + design-system foundation

Stand up `apps/tithi` as a buildable Astro app with the Tithi brand token layer wired into Tailwind, plus a stub home page. Deliverable: `pnpm --filter tithi build` succeeds and the page uses brand tokens.

**Files:**
- Create: `apps/tithi/package.json`
- Create: `apps/tithi/astro.config.mjs`
- Create: `apps/tithi/tsconfig.json`
- Create: `apps/tithi/tailwind.config.mjs`
- Create: `apps/tithi/src/styles/tokens.css`
- Create: `apps/tithi/src/styles/global.css`
- Create: `apps/tithi/src/layouts/BaseLayout.astro`
- Create: `apps/tithi/src/pages/index.astro` (temporary stub, replaced in Task 4)

**Interfaces:**
- Produces: `BaseLayout.astro` with `Props { title?: string; description?: string }`; brand Tailwind utilities (`bg-surface`, `text-on-surface`, `text-gold`, `font-display`, `font-body`, `rounded-xl`, `border-hairline`, etc.); CSS custom properties in `tokens.css`.

- [ ] **Step 1: Create `apps/tithi/package.json`**

```json
{
  "name": "tithi",
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
    "@astrojs/tailwind": "^5.1.5",
    "@fontsource/noto-sans-gujarati": "^5.2.7",
    "@fontsource/noto-serif-gujarati": "^5.2.7",
    "@pravritti/config": "workspace:*",
    "astro": "^5.5.0",
    "tailwindcss": "^3.4.17"
  },
  "devDependencies": {
    "vitest": "^4.1.9"
  }
}
```

- [ ] **Step 2: Create `apps/tithi/astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://tithi.pravritti.org",
  integrations: [
    tailwind({
      // We own the base reset / tokens in src/styles/global.css.
      applyBaseStyles: false,
    }),
  ],
  prefetch: false,
  compressHTML: true,
});
```

- [ ] **Step 3: Create `apps/tithi/tsconfig.json`**

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

- [ ] **Step 4: Create `apps/tithi/src/styles/tokens.css`** (the Tithi brand — this site's single source of truth)

```css
/*
 * Tithi brand tokens — "diya on dark". Warm ember background lit by saffron-gold
 * and kumkum-vermilion; serif Gujarati type; the Diya Moon as the only glow.
 * Faithful to the Tithi app's MASTER design system. Dark only by design.
 * Brand-local: do NOT import the shared espresso tokens here.
 */

:root {
  color-scheme: dark;

  /* ---- Surfaces (warm ember dark) ---- */
  --surface: #1a1413;
  --surface-elevated: #251d1a;
  --surface-variant: #312622;
  --scrim: rgb(0 0 0 / 0.6);

  /* ---- Brand / accent (diya light) ---- */
  --gold: #e0a93b;
  --gold-deep: #b8862b;
  --vermilion: #c1372e; /* fill / marker only — never small text on dark */
  --on-gold: #1a100c;

  /* ---- Text on dark ---- */
  --on-surface: #f3e9d8; /* ~15:1 */
  --on-surface-secondary: #c2b2a0; /* ~7:1 */
  --on-surface-muted: #8c7a6e; /* ~3.3:1 — large / non-essential only */

  /* ---- Status (choghadiya bands, occasions) ---- */
  --auspicious: #8fbf6f;
  --inauspicious: #d98c7a;
  --neutral-band: #d9b86a;
  --holiday: #e5645a; /* Sundays / holidays — legible as text */

  /* ---- The Diya Moon (signature) ---- */
  --moon-lit: #f7eac9;
  --moon-dark: #2a1d1c;
  --moon-glow: rgb(224 169 59 / 0.22); /* gold @ 22% — resting halo */
  --moon-glow-strong: rgb(224 169 59 / 0.45); /* gold @ 45% — halo core */

  /* ---- Lines, not shadows ---- */
  --hairline: #e0a93b2e; /* gold @ 18% — the tithi-patra ruled-line motif */

  /* ---- Type families (both cover Latin) ---- */
  --font-display: "Noto Serif Gujarati", ui-serif, Georgia, serif;
  --font-body: "Noto Sans Gujarati", ui-sans-serif, system-ui, sans-serif;

  /* ---- Radii ---- */
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 999px;

  /* ---- Motion ---- */
  --dur-fast: 150ms;
  --dur-base: 200ms;
  --dur-slow: 300ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
}
```

- [ ] **Step 5: Create `apps/tithi/src/styles/global.css`** (import tokens, then Tailwind layers + reset; mirrors hiren's pattern)

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
    color-scheme: dark;
  }

  body {
    margin: 0;
    background-color: var(--surface);
    color: var(--on-surface);
    font-family: var(--font-body);
    font-size: 1.0625rem;
    line-height: 1.5;
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
    font-weight: 700;
    line-height: 1.15;
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
    outline: 2.5px solid var(--gold);
    outline-offset: 3px;
    border-radius: 3px;
  }

  ::selection {
    background: var(--gold);
    color: var(--on-gold);
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
}
```

- [ ] **Step 6: Create `apps/tithi/tailwind.config.mjs`** (maps brand tokens → utilities; follows the shared preset pattern, brand-local values)

```js
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
```

- [ ] **Step 7: Create `apps/tithi/src/layouts/BaseLayout.astro`** (head/meta/fonts/global.css)

```astro
---
import "@fontsource/noto-serif-gujarati/600.css";
import "@fontsource/noto-serif-gujarati/700.css";
import "@fontsource/noto-sans-gujarati/400.css";
import "@fontsource/noto-sans-gujarati/500.css";
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
}

const {
  title = "Tithi — Gujarati Vikram Samvat panchang",
  description = "Tithi is a warm, devotional Gujarati panchang for your phone — daily tithi and vrat, festivals, and choghadiya, in a calm Gujarati-first design.",
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="theme-color" content="#1a1413" />
    <meta name="color-scheme" content="dark" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

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

- [ ] **Step 8: Create temporary `apps/tithi/src/pages/index.astro`** (stub; replaced in Task 4)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout>
  <main id="main" class="mx-auto max-w-site px-4 py-24">
    <h1 class="text-gold text-4xl">તિથિ</h1>
    <p class="text-on-surface-secondary mt-4">Scaffold check.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 9: Install deps from repo root**

Run: `pnpm install`
Expected: completes; `tithi` appears as a workspace package, `@pravritti/config` symlinked.

- [ ] **Step 10: Build the app**

Run: `pnpm --filter tithi build`
Expected: build succeeds; `apps/tithi/dist/index.html` is produced.

- [ ] **Step 11: Verify the brand token reached the output**

Run: `grep -r "#1a1413\|--surface" apps/tithi/dist/ | head`
Expected: at least one match (the ember surface token is present in the emitted CSS).

- [ ] **Step 12: Commit**

```bash
git add apps/tithi pnpm-lock.yaml
git commit -m "task: scaffold apps/tithi with Tithi brand token layer"
```

---

## Task 2: Content module (`content.ts`) + test

All site copy, links, and the contact email in one typed module, so launch-day edits are one-file changes. This is the one module with real shape worth a unit test.

**Files:**
- Create: `apps/tithi/vitest.config.ts`
- Create: `apps/tithi/src/data/content.ts`
- Test: `apps/tithi/src/data/content.test.ts`

**Interfaces:**
- Produces:
  - `app: { name; nameGu; tagline; taglineEn; subtitle; shortDescription; description; closingLine }` (all `string`)
  - `features: string[]` (length 7)
  - `stores: { comingSoon: boolean; android: string; ios: string }`
  - `contactEmail: string`
  - `docDates: { privacy: string; support: string; dataDeletion: string }`

- [ ] **Step 1: Create `apps/tithi/vitest.config.ts`**

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

- [ ] **Step 2: Write the failing test `apps/tithi/src/data/content.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { app, contactEmail, docDates, features, stores } from "./content";

describe("content", () => {
  it("names the app in both scripts", () => {
    expect(app.name).toBe("Tithi");
    expect(app.nameGu).toBe("તિથિ");
  });

  it("lists exactly the seven product features as non-empty strings", () => {
    expect(features).toHaveLength(7);
    for (const f of features) {
      expect(typeof f).toBe("string");
      expect(f.trim().length).toBeGreaterThan(0);
    }
  });

  it("exposes both store slots and a coming-soon flag", () => {
    expect(typeof stores.comingSoon).toBe("boolean");
    expect(stores).toHaveProperty("android");
    expect(stores).toHaveProperty("ios");
  });

  it("provides a contact email and document dates", () => {
    expect(typeof contactEmail).toBe("string");
    expect(contactEmail.length).toBeGreaterThan(0);
    expect(docDates).toHaveProperty("privacy");
    expect(docDates).toHaveProperty("support");
    expect(docDates).toHaveProperty("dataDeletion");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter tithi test`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 4: Create `apps/tithi/src/data/content.ts`**

```ts
/**
 * Single source of truth for all Tithi-site copy, links, and the contact email.
 * Launch-day edits (real store URLs, contact email) happen here only.
 * Items prefixed TODO_ are intentional placeholders — safe for the build,
 * must be filled before go-live.
 */

export const app = {
  name: "Tithi",
  nameGu: "તિથિ",
  tagline: "આજનું પંચાંગ",
  taglineEn: "Today's panchang",
  subtitle: "Gujarati panchang calendar",
  shortDescription:
    "Gujarati Vikram Samvat panchang — tithi, festivals, choghadiya.",
  description:
    "Tithi is a warm, devotional Gujarati panchang for your phone. It brings the authority of the printed tithi-patra into a calm, modern, Gujarati-first app — built for daily tithi and vrat checks, festivals, and choghadiya.",
  closingLine:
    "A quiet morning and evening companion for tithi, festival, and muhurat checks.",
} as const;

export const features: string[] = [
  "Vikram Samvat and Gregorian dates side by side.",
  "Today's tithi at a glance, with the lunar month and paksha.",
  "Festivals and holidays highlighted across the month.",
  "Choghadiya and muhurat timing for day and night, by city.",
  "Moon phases rendered as a hand-drawn diya moon.",
  "Gujarati-first typography in a restful, devotional dark design.",
  "Works offline. No account, no ads, and no personal data collected.",
];

export const stores = {
  // Listings submitted/imminent — flip comingSoon to false and paste real URLs.
  comingSoon: true,
  android: "TODO_PLAY_STORE_URL",
  ios: "TODO_APP_STORE_URL",
} as const;

// TODO: replace with the real support inbox before go-live.
export const contactEmail = "hello@pravritti.org";

export const docDates = {
  privacy: "2026-06-25",
  support: "2026-06-25",
  dataDeletion: "2026-06-25",
} as const;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter tithi test`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/tithi/vitest.config.ts apps/tithi/src/data
git commit -m "task: add tithi content module + test"
```

---

## Task 3: Diya Moon signature + BaseLayout favicon

Build the signature `DiyaMoon` SVG component (hero glow + small/wordmark crescent) and the favicon that reuses the same mark. Deliverable: home stub renders the glowing moon; favicon exists.

**Files:**
- Create: `apps/tithi/src/components/DiyaMoon.astro`
- Create: `apps/tithi/public/favicon.svg`
- Modify: `apps/tithi/src/pages/index.astro` (drop the moon in to verify; this stub is replaced in Task 4)

**Interfaces:**
- Produces: `DiyaMoon.astro` with `Props { size?: number; glow?: boolean; label?: string; class?: string }`. Renders an inline `<svg>` crescent (`--moon-lit` limb over `--moon-dark` disk); when `glow` is true, a breathing gold halo that goes static under `prefers-reduced-motion`. Always carries an accessible label.

- [ ] **Step 1: Create `apps/tithi/src/components/DiyaMoon.astro`**

```astro
---
/**
 * The Diya Moon — Tithi's signature. A flat hand-drawn waxing crescent
 * (moon-lit limb over a moon-dark disk) with a warm gold "aarti diya" halo.
 * The web uses the flat rendering (the app's own small-size/fallback moon),
 * not the native Blender frames. The halo is the ONE permitted glow.
 */
interface Props {
  size?: number;
  glow?: boolean;
  label?: string;
  class?: string;
}
const { size = 240, glow = true, label = "Waxing crescent moon", class: className = "" } =
  Astro.props;
const uid = "diya-" + Math.random().toString(36).slice(2, 8);
---

<span
  class:list={["diya", className]}
  role="img"
  aria-label={label}
  style={`--diya-size:${size}px`}
>
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <defs>
      <radialGradient id={`${uid}-halo`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="var(--moon-glow-strong)" />
        <stop offset="55%" stop-color="var(--moon-glow)" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
      <mask id={`${uid}-crescent`}>
        <circle cx="50" cy="50" r="33" fill="white" />
        <circle cx="63" cy="45" r="29" fill="black" />
      </mask>
    </defs>
    {glow && <circle class="diya-halo" cx="50" cy="50" r="49" fill={`url(#${uid}-halo)`} />}
    <circle cx="50" cy="50" r="33" fill="var(--moon-dark)" />
    <circle cx="50" cy="50" r="33" fill="var(--moon-lit)" mask={`url(#${uid}-crescent)`} />
  </svg>
</span>

<style>
  .diya {
    display: inline-grid;
    place-items: center;
    width: var(--diya-size);
    height: var(--diya-size);
    line-height: 0;
  }
  .diya-halo {
    transform-box: fill-box;
    transform-origin: center;
    animation: diya-breathe 4s var(--ease-out, ease-in-out) infinite;
  }
  @keyframes diya-breathe {
    0%,
    100% {
      opacity: 0.7;
      transform: scale(0.97);
    }
    50% {
      opacity: 1;
      transform: scale(1.04);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .diya-halo {
      animation: none;
      opacity: 0.9;
    }
  }
</style>
```

- [ ] **Step 2: Create `apps/tithi/public/favicon.svg`** (the wordmark's crescent mark, on the ember surface)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1a1413" />
  <mask id="c">
    <circle cx="50" cy="50" r="30" fill="#fff" />
    <circle cx="63" cy="44" r="26" fill="#000" />
  </mask>
  <circle cx="50" cy="50" r="30" fill="#2a1d1c" />
  <circle cx="50" cy="50" r="30" fill="#f7eac9" mask="url(#c)" />
</svg>
```

- [ ] **Step 3: Drop the moon into the index stub to verify rendering** — replace `apps/tithi/src/pages/index.astro` with:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import DiyaMoon from "../components/DiyaMoon.astro";
---

<BaseLayout>
  <main id="main" class="mx-auto grid max-w-site place-items-center px-4 py-24">
    <DiyaMoon size={220} />
    <h1 class="text-gold mt-8 text-4xl">તિથિ</h1>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Build and verify the moon + favicon are emitted**

Run: `pnpm --filter tithi build && grep -l "moon-lit\|diya-halo" apps/tithi/dist/index.html && test -f apps/tithi/dist/favicon.svg && echo OK`
Expected: prints the index path and `OK` (moon markup present, favicon copied).

- [ ] **Step 5: Commit**

```bash
git add apps/tithi/src/components/DiyaMoon.astro apps/tithi/public/favicon.svg apps/tithi/src/pages/index.astro
git commit -m "task: add Diya Moon signature component + favicon"
```

---

## Task 4: Landing page

Build the compact landing page from the content module: header, hero (moon + wordmark + tagline + store badges), phone mockup, features list, trust line, footer. Deliverable: `/` renders all sections.

**Files:**
- Create: `apps/tithi/src/components/SiteHeader.astro`
- Create: `apps/tithi/src/components/StoreBadges.astro`
- Create: `apps/tithi/src/components/Hero.astro`
- Create: `apps/tithi/src/components/PhoneMock.astro`
- Create: `apps/tithi/src/components/Features.astro`
- Create: `apps/tithi/src/components/Footer.astro`
- Create: `apps/tithi/public/screenshots/today.png` (placeholder)
- Modify: `apps/tithi/src/pages/index.astro` (final version)

**Interfaces:**
- Consumes: `app`, `features`, `stores`, `contactEmail` from `../data/content`; `DiyaMoon` from Task 3.
- Produces: `SiteHeader`, `Hero`, `StoreBadges` (`Props { class?: string }`), `PhoneMock` (`Props { src: string; alt: string }`), `Features`, `Footer` — all prop-light Astro components.

- [ ] **Step 1: Create a placeholder screenshot**

Run: `printf '\x89PNG\r\n\x1a\n' > apps/tithi/public/screenshots/today.png`
Then replace with a real export later. (A 1×1-ish placeholder is fine; `PhoneMock` sets dimensions via CSS.)

> Note: this writes a minimal placeholder file so the reference resolves. The real screenshot drops in at the same path before launch.

- [ ] **Step 2: Create `apps/tithi/src/components/SiteHeader.astro`**

```astro
---
import { app } from "../data/content";
---

<header class="mx-auto flex max-w-site items-center justify-between px-4 py-5">
  <a href="/" class="flex items-baseline gap-2" aria-label={`${app.name} home`}>
    <span class="font-display text-2xl font-bold text-on-surface">{app.nameGu}</span>
    <span class="font-body text-sm text-on-surface-muted">tithi</span>
  </a>
  <nav class="flex items-center gap-5 text-sm text-on-surface-secondary">
    <a class="hover:text-gold" href="/privacy">Privacy</a>
    <a class="hover:text-gold" href="/support">Support</a>
  </nav>
</header>
```

- [ ] **Step 3: Create `apps/tithi/src/components/StoreBadges.astro`**

```astro
---
import { stores } from "../data/content";
interface Props {
  class?: string;
}
const { class: className = "" } = Astro.props;
const soon = stores.comingSoon;
---

<div class:list={["flex flex-wrap items-center gap-3", className]}>
  <a
    href={soon ? "#" : stores.android}
    aria-disabled={soon}
    class:list={[
      "inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5",
      soon ? "pointer-events-none text-on-surface-muted" : "text-on-surface hover:border-gold",
    ]}
  >
    <span class="font-body text-sm font-medium">Google Play</span>
    {soon && <span class="text-xs text-on-surface-muted">· soon</span>}
  </a>
  <a
    href={soon ? "#" : stores.ios}
    aria-disabled={soon}
    class:list={[
      "inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5",
      soon ? "pointer-events-none text-on-surface-muted" : "text-on-surface hover:border-gold",
    ]}
  >
    <span class="font-body text-sm font-medium">App Store</span>
    {soon && <span class="text-xs text-on-surface-muted">· soon</span>}
  </a>
</div>
```

- [ ] **Step 4: Create `apps/tithi/src/components/PhoneMock.astro`** (device frame holding a screenshot)

```astro
---
interface Props {
  src: string;
  alt: string;
}
const { src, alt } = Astro.props;
---

<div class="mx-auto w-[260px] max-w-full rounded-xl border border-hairline bg-surface-elevated p-2 shadow-none">
  <div class="overflow-hidden rounded-lg bg-surface-variant">
    <img src={src} alt={alt} width="244" height="528" class="block aspect-[9/19.5] w-full object-cover" />
  </div>
</div>
```

- [ ] **Step 5: Create `apps/tithi/src/components/Hero.astro`**

```astro
---
import { app } from "../data/content";
import DiyaMoon from "./DiyaMoon.astro";
import StoreBadges from "./StoreBadges.astro";
import PhoneMock from "./PhoneMock.astro";
---

<section class="mx-auto grid max-w-site items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
  <div class="text-center md:text-left">
    <div class="mb-8 flex justify-center md:justify-start">
      <DiyaMoon size={180} label="Tithi — the lunar day" />
    </div>
    <h1 class="font-display text-5xl font-bold leading-tight text-on-surface md:text-6xl">
      {app.nameGu}
    </h1>
    <p class="mt-1 font-body text-lg text-on-surface-secondary">
      {app.tagline} <span class="text-on-surface-muted">· {app.taglineEn}</span>
    </p>
    <p class="mx-auto mt-6 max-w-prose font-body text-on-surface-secondary md:mx-0">
      {app.description}
    </p>
    <StoreBadges class="mt-8 justify-center md:justify-start" />
  </div>
  <div class="flex justify-center">
    <PhoneMock src="/screenshots/today.png" alt="Tithi showing today's tithi, lunar month, and paksha" />
  </div>
</section>
```

- [ ] **Step 6: Create `apps/tithi/src/components/Features.astro`** (gold-hairline-ruled list, not boxy cards)

```astro
---
import { features } from "../data/content";
---

<section class="mx-auto max-w-site px-4 py-12">
  <h2 class="font-display text-2xl font-bold text-on-surface">What Tithi gives you</h2>
  <ul class="mt-6 border-t border-hairline">
    {
      features.map((feature) => (
        <li class="border-b border-hairline py-4 font-body text-on-surface-secondary">
          {feature}
        </li>
      ))
    }
  </ul>
</section>
```

- [ ] **Step 7: Create `apps/tithi/src/components/Footer.astro`** (trust line + links)

```astro
---
import { app } from "../data/content";
const year = new Date().getFullYear();
---

<footer class="mt-12 border-t border-hairline">
  <div class="mx-auto max-w-site px-4 py-10">
    <p class="font-body text-sm text-on-surface-secondary">
      Works offline · No account · No ads · No data collected.
    </p>
    <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p class="font-body text-sm text-on-surface-muted">
        © {year} {app.name} · {app.nameGu}
      </p>
      <nav class="flex gap-5 font-body text-sm text-on-surface-secondary">
        <a class="hover:text-gold" href="/privacy">Privacy</a>
        <a class="hover:text-gold" href="/support">Support</a>
        <a class="hover:text-gold" href="/data-deletion">Data deletion</a>
      </nav>
    </div>
  </div>
</footer>
```

- [ ] **Step 8: Replace `apps/tithi/src/pages/index.astro` with the final landing page**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Hero from "../components/Hero.astro";
import Features from "../components/Features.astro";
import Footer from "../components/Footer.astro";
---

<BaseLayout>
  <SiteHeader />
  <main id="main">
    <Hero />
    <Features />
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 9: Build and verify all landing sections render**

Run: `pnpm --filter tithi build && grep -o "આજનું પંચાંગ\|What Tithi gives you\|No data collected\|Google Play" apps/tithi/dist/index.html | sort -u`
Expected: all four strings present (tagline, features heading, trust line, store badge).

- [ ] **Step 10: Verify all seven features rendered**

Run: `grep -c 'class="border-b border-hairline py-4' apps/tithi/dist/index.html`
Expected: `7`.

- [ ] **Step 11: Commit**

```bash
git add apps/tithi/src/components apps/tithi/src/pages/index.astro apps/tithi/public/screenshots
git commit -m "task: build tithi landing page"
```

---

## Task 5: Document pages (privacy, support, data-deletion)

A shared `DocLayout` and the three legal/support documents. Deliverable: all three pages render with consistent prose framing.

**Files:**
- Create: `apps/tithi/src/layouts/DocLayout.astro`
- Create: `apps/tithi/src/pages/privacy.astro`
- Create: `apps/tithi/src/pages/support.astro`
- Create: `apps/tithi/src/pages/data-deletion.astro`

**Interfaces:**
- Consumes: `app`, `contactEmail`, `docDates` from `../data/content`; `SiteHeader`, `Footer` components.
- Produces: `DocLayout.astro` with `Props { title: string; updated?: string }` — renders `SiteHeader`, a prose column (`max-w-prose`), an `<h1>` + optional "Last updated" line, a `<slot />`, and `Footer`.

- [ ] **Step 1: Create `apps/tithi/src/layouts/DocLayout.astro`**

```astro
---
import BaseLayout from "./BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Footer from "../components/Footer.astro";

interface Props {
  title: string;
  updated?: string;
}
const { title, updated } = Astro.props;
---

<BaseLayout title={`${title} — Tithi`}>
  <SiteHeader />
  <main id="main" class="mx-auto max-w-prose px-4 py-12">
    <a href="/" class="font-body text-sm text-on-surface-muted hover:text-gold">← Tithi home</a>
    <h1 class="mt-4 font-display text-3xl font-bold text-on-surface">{title}</h1>
    {updated && <p class="mt-2 font-body text-sm text-on-surface-muted">Last updated {updated}</p>}
    <div class="doc mt-8 font-body text-on-surface-secondary">
      <slot />
    </div>
  </main>
  <Footer />
</BaseLayout>

<style>
  .doc :global(h2) {
    font-family: var(--font-display);
    font-size: 1.25rem;
    color: var(--on-surface);
    margin: 2rem 0 0.75rem;
  }
  .doc :global(p) {
    margin: 0 0 1rem;
    line-height: 1.6;
  }
  .doc :global(ul) {
    margin: 0 0 1rem;
    padding-left: 1.25rem;
    list-style: disc;
  }
  .doc :global(li) {
    margin: 0.35rem 0;
  }
  .doc :global(a) {
    color: var(--gold);
  }
  .doc :global(hr) {
    border: 0;
    border-top: 1px solid var(--hairline);
    margin: 2rem 0;
  }
</style>
```

- [ ] **Step 2: Create `apps/tithi/src/pages/privacy.astro`** (drafted from the app's real stance; user verifies before go-live)

```astro
---
import DocLayout from "../layouts/DocLayout.astro";
import { contactEmail, docDates } from "../data/content";
---

<DocLayout title="Privacy Policy" updated={docDates.privacy}>
  <p>
    Tithi is built to respect you. The app runs entirely on your device: it needs no account, shows
    no ads, and collects no personal data. Nothing about you is sent to us or to any third party.
  </p>

  <h2>What we collect</h2>
  <p>
    Nothing. Tithi does not collect your name, email, phone number, contacts, precise location, or
    any advertising or analytics identifier. We have no servers that receive your data because there
    is nothing to receive.
  </p>

  <h2>What stays on your device</h2>
  <p>
    Your settings — such as the city you choose for choghadiya and muhurat timing — are stored only
    on your device so the app can show the right times. They never leave your phone, and removing the
    app removes them.
  </p>

  <h2>Works offline</h2>
  <p>
    Tithi works without an internet connection. Panchang, festival, and timing data are computed on
    your device.
  </p>

  <h2>Children</h2>
  <p>
    Tithi is suitable for all ages and does not knowingly collect data from anyone, including
    children.
  </p>

  <h2>Changes</h2>
  <p>
    If this policy ever changes, the updated date above will change with it.
  </p>

  <h2>Contact</h2>
  <p>
    Questions about privacy? Write to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
  </p>
</DocLayout>
```

- [ ] **Step 3: Create `apps/tithi/src/pages/support.astro`**

```astro
---
import DocLayout from "../layouts/DocLayout.astro";
import { contactEmail, docDates } from "../data/content";
---

<DocLayout title="Support" updated={docDates.support}>
  <p>
    Need help, found something off, or want a city added? Write to
    <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we'll get back to you.
  </p>

  <h2>Frequently asked</h2>

  <p><strong>How do I read today's tithi?</strong><br />
    The home screen shows the current tithi with its lunar month (masa) and paksha, alongside the
    Gregorian date. The Diya Moon shows tonight's phase.</p>

  <p><strong>What is choghadiya?</strong><br />
    Choghadiya divides the day and night into time windows — Amrit, Shubh, Labh, Char, Udveg, Rog,
    Kaal — each marking auspicious, neutral, or inauspicious timing for activities. Tithi shows them
    for your chosen city.</p>

  <p><strong>How do I change my city?</strong><br />
    Choghadiya and muhurat timings depend on location. Set your city in the app's settings; it's
    stored only on your device.</p>

  <p><strong>Where does the festival and panchang data come from?</strong><br />
    Tithi follows the Gujarati Vikram Samvat panchang and computes dates and timings on your device,
    so it works offline.</p>

  <h2>Send feedback</h2>
  <p>
    Suggestions and corrections are welcome — email
    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
  </p>
</DocLayout>
```

- [ ] **Step 4: Create `apps/tithi/src/pages/data-deletion.astro`**

```astro
---
import DocLayout from "../layouts/DocLayout.astro";
import { contactEmail, docDates } from "../data/content";
---

<DocLayout title="Data deletion" updated={docDates.dataDeletion}>
  <p>
    Tithi stores everything on your device and collects no account or personal data, so there is no
    server-side data to delete.
  </p>

  <h2>Removing your data</h2>
  <p>
    To remove everything Tithi has stored — your city and app settings — uninstall the app, or clear
    its storage from your device:
  </p>
  <ul>
    <li><strong>Android:</strong> Settings → Apps → Tithi → Storage → Clear storage, or uninstall the app.</li>
    <li><strong>iOS:</strong> Press and hold the Tithi icon → Remove App → Delete App.</li>
  </ul>

  <h2>Any other request</h2>
  <p>
    If you have a question about data deletion, write to
    <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
  </p>
</DocLayout>
```

- [ ] **Step 5: Build and verify the three pages exist with their headings**

Run: `pnpm --filter tithi build && for p in privacy support data-deletion; do grep -q "Last updated" apps/tithi/dist/$p/index.html && echo "$p OK"; done`
Expected: `privacy OK`, `support OK`, `data-deletion OK`.

- [ ] **Step 6: Commit**

```bash
git add apps/tithi/src/layouts/DocLayout.astro apps/tithi/src/pages/privacy.astro apps/tithi/src/pages/support.astro apps/tithi/src/pages/data-deletion.astro
git commit -m "task: add privacy, support, and data-deletion pages"
```

---

## Task 6: Android asset links, 404, OG image + full verification

The store-compliance asset file, a branded 404, a placeholder OG image, and a final whole-site verification. Deliverable: complete site builds; `assetlinks.json` is valid JSON served at the right path.

**Files:**
- Create: `apps/tithi/public/.well-known/assetlinks.json`
- Create: `apps/tithi/src/pages/404.astro`
- Create: `apps/tithi/public/og.png` (placeholder)

**Interfaces:**
- Consumes: `BaseLayout`, `SiteHeader`, `Footer`, `DiyaMoon`.

- [ ] **Step 1: Create `apps/tithi/public/.well-known/assetlinks.json`** (placeholder fingerprint + package — see the TODO)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "TODO_ANDROID_PACKAGE_NAME",
      "sha256_cert_fingerprints": ["TODO_RELEASE_SHA256_FINGERPRINT"]
    }
  }
]
```

> TODO before go-live: set `package_name` (e.g. `org.pravritti.tithi`) and the release signing key's SHA-256 fingerprint (from Play Console → App signing, or `keytool -list -v`). The file is valid JSON now so the build never breaks; only the values are pending.

- [ ] **Step 2: Create `apps/tithi/src/pages/404.astro`** (branded, diya-on-dark)

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SiteHeader from "../components/SiteHeader.astro";
import Footer from "../components/Footer.astro";
import DiyaMoon from "../components/DiyaMoon.astro";
---

<BaseLayout title="Not found — Tithi">
  <SiteHeader />
  <main id="main" class="mx-auto grid max-w-site place-items-center px-4 py-24 text-center">
    <DiyaMoon size={140} glow={false} label="Crescent moon" />
    <h1 class="mt-8 font-display text-3xl font-bold text-on-surface">આ પાનું મળ્યું નથી</h1>
    <p class="mt-2 font-body text-on-surface-secondary">This page could not be found.</p>
    <a class="mt-6 rounded-full border border-hairline px-5 py-2.5 font-body text-sm text-on-surface hover:border-gold" href="/">
      Back to Tithi home
    </a>
  </main>
  <Footer />
</BaseLayout>
```

- [ ] **Step 3: Create a placeholder OG image**

Run: `printf '\x89PNG\r\n\x1a\n' > apps/tithi/public/og.png`

> Note: minimal placeholder so the `og:image` reference resolves. Replace with a real 1200×630 social card (Diya Moon on ember, wordmark) before launch.

- [ ] **Step 4: Full clean build**

Run: `pnpm --filter tithi build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Verify `assetlinks.json` is served at the well-known path and is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('apps/tithi/dist/.well-known/assetlinks.json','utf8')); console.log('valid JSON, served at /.well-known/assetlinks.json')"`
Expected: prints the success line (file copied verbatim, parses cleanly).

- [ ] **Step 6: Verify the 404 page built**

Run: `test -f apps/tithi/dist/404.html && grep -q "આ પાનું મળ્યું નથી" apps/tithi/dist/404.html && echo "404 OK"`
Expected: `404 OK`.

- [ ] **Step 7: Type-check the whole app**

Run: `pnpm --filter tithi exec astro check`
Expected: 0 errors. (Warnings about the placeholder PNGs being tiny are acceptable.)

- [ ] **Step 8: Run the unit test once more**

Run: `pnpm --filter tithi test`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add apps/tithi/public/.well-known apps/tithi/src/pages/404.astro apps/tithi/public/og.png
git commit -m "task: add Android asset links, 404, and OG placeholder"
```

---

## Post-implementation: deployment (manual, by the user)

Not a code task — for reference when wiring Cloudflare Pages:
- New Pages project → **Root directory** `apps/tithi`, **Build command** `pnpm install && pnpm --filter tithi build`, **Output** `apps/tithi/dist`.
- **Production branch:** `tithi` (Pages redeploys on every push to it).
- **Build watch paths:** `apps/tithi/**`, `packages/config/**`.
- **Custom domain:** `tithi.pravritti.org`.
- Before go-live, fill the four content stubs (contact email, `assetlinks.json` package + fingerprint, real store URLs + flip `stores.comingSoon`, real screenshots + OG image).

---

## Self-Review

**Spec coverage** (each spec section → task):
- Lean landing page → Task 4. ✓
- Privacy / Support / Data-deletion → Task 5. ✓
- Tithi brand token layer (exact palette, fonts, radii, motion) → Task 1 + Global Constraints. ✓
- Diya Moon signature + wordmark/favicon → Task 3. ✓
- `assetlinks.json` (Android Digital Asset Links, placeholder) → Task 6. ✓
- Screenshots via PhoneMock (placeholder) → Task 4. ✓
- Store badges "coming soon," swappable → Task 4 (`StoreBadges` + `stores.comingSoon`). ✓
- English spine + real Gujarati content (તિથિ, આજનું પંચાંગ, festival/term names, Gujarati 404) → Tasks 3–6. ✓
- Single `content.ts` source + content stubs (email, fingerprint, store URLs) → Task 2 + Task 6. ✓
- 404 page → Task 6. ✓
- Deployment on `tithi` branch / Cloudflare → Global Constraints + Post-implementation notes. ✓
- Espresso tokens untouched; brand-local; no shared-preset import → Task 1 + Global Constraints. ✓

**Placeholder scan:** The only "TODO_" strings are the *intentional content stubs* the spec mandates (contact email default, store URLs, asset-links package/fingerprint, real images). Each is valid for the build and called out. No plan-step placeholders.

**Type consistency:** `content.ts` exports (`app`, `features`, `stores`, `contactEmail`, `docDates`) match every consumer (Hero, StoreBadges, Features, Footer, DocLayout, doc pages). `DiyaMoon` props (`size`, `glow`, `label`, `class`) match all call sites (Hero `size`/`label`, 404 `size`/`glow`/`label`). `PhoneMock` props (`src`, `alt`) match the Hero call. `DocLayout` props (`title`, `updated`) match all three doc pages.
