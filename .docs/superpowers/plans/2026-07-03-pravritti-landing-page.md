# Pravritti Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the root-domain landing page at `apps/pravritti`: logo hero + tagline + Blog link over a living Axelrod culture-dissemination background canvas, themed with a new light "earth" token set.

**Architecture:** New Astro 5 static app mirroring `apps/hiren`, consuming the shared Tailwind preset from `@pravritti/config`. A second token file (`tokens-earth.css`) reuses the exact custom-property names of the existing dark theme so the preset works unchanged. The simulation is a pure-logic TS module (`culture.ts`, seeded RNG, no DOM) driven by a thin canvas component; palette math lives in its own tested module.

**Tech Stack:** Astro ^5.5.0, Tailwind ^3.4.17 + `@astrojs/tailwind` ^5.1.5, vitest ^4.1.9, pnpm 11 workspace, Cloudflare Pages (static).

**Spec:** `.docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md`

## Global Constraints

- Node >= 20, pnpm 11 workspace (`apps/*`, `packages/*`). Run all commands from the repo root.
- Commit messages use the `task:` prefix (repo convention) and end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Tagline copy, exactly: `Finding ways to improve on all the things.`
- App package name is `pravritti`; the root package gets renamed to `pravritti-root` in Task 2 to free the name (lockfile keys importers by path, so this is safe).
- Feature order everywhere (arrays, rendering): index 0 = religious, 1 = logical, 2 = economical, 3 = societal. Trait counts `[4, 5, 5, 6]`, similarity weights `[0.4, 0.15, 0.2, 0.25]` (sum = 1).
- v1 has NO agent categories and NO user interaction (Phases 2/3 get their own design rounds). `CultureGrid.types` exists but stays all-zero.
- The canvas is decorative: `aria-hidden="true"`, `pointer-events: none`, and every failure mode degrades to a plain cream page.
- `dist/` and `.astro/` are already gitignored globally — never force-add them.

---

### Task 1: Earth token theme in `packages/config`

**Files:**
- Create: `packages/config/tokens-earth.css`
- Modify: `packages/config/package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: importable stylesheet `@pravritti/config/tokens-earth.css` defining every CSS custom property that `tokens.css` defines (same names, light values). Later tasks import it in `global.css` and rely on `--bg`, `--ink`, `--muted`, `--coral-ink`, `--wash-coral`, `--line-strong`, `--sun`, `--font-*`, `--radius-pill`, `--ease-out-expo`, `--z-sticky`, `--z-base`, `--dur-fast`.

- [ ] **Step 1: Write `packages/config/tokens-earth.css`**

```css
/*
 * Pravritti shared design tokens — light "earth" theme, derived from the
 * Pravritti logo palette (slate #263238/#455b64, cream #ffeedd, leaf #5b893d,
 * browns #472c1f/#8a663e). Same custom-property names as tokens.css so the
 * shared Tailwind preset works unchanged; a site picks its theme by importing
 * one file or the other. OKLCH throughout. Text roles contrast-checked on --bg.
 */

:root {
  color-scheme: light;

  /* ---- Neutrals (warm cream paper; deeper cream = elevation) ---- */
  --bg: oklch(0.963 0.015 78); /* softened logo cream */
  --surface: oklch(0.935 0.02 78);
  --surface-2: oklch(0.91 0.025 77);
  --ink: oklch(0.32 0.03 230); /* logo slate #263238 — ~11:1 on bg */
  --muted: oklch(0.47 0.035 225); /* logo slate-grey #455b64 — ~5:1 on bg */
  --line: oklch(0.885 0.02 80);
  --line-strong: oklch(0.8 0.025 80);

  /* ---- Accent roles, re-pointed to the logo palette ----
   * coral → wordmark brown (primary link/CTA), leaf → logo green,
   * teal → slate, sun → warm sand. -ink variants are darkened for text. */
  --sun: oklch(0.83 0.07 80);
  --teal: oklch(0.47 0.035 225);
  --leaf: oklch(0.6 0.11 135); /* logo leaf green #5b893d */
  --coral: oklch(0.55 0.06 70); /* wordmark brown #8a663e */

  --coral-ink: oklch(0.47 0.06 68); /* brown as link/text on cream — ~5:1 */
  --teal-ink: oklch(0.43 0.04 228);
  --leaf-ink: oklch(0.48 0.1 137);

  /* Danger (kept for parity; tuned darker for a light bg) */
  --danger: oklch(0.5 0.19 27);
  --danger-bright: oklch(0.56 0.2 27);

  /* ---- Semantic surface washes (accent over cream) ---- */
  --wash-sun: color-mix(in oklch, var(--sun) 22%, var(--bg));
  --wash-coral: color-mix(in oklch, var(--coral) 14%, var(--bg));
  --wash-teal: color-mix(in oklch, var(--teal) 14%, var(--bg));
  --wash-leaf: color-mix(in oklch, var(--leaf) 16%, var(--bg));

  /* ---- Type families (identical to tokens.css) ---- */
  --font-display: "Bricolage Grotesque Variable", "Bricolage Grotesque", ui-sans-serif,
    system-ui, sans-serif;
  --font-body: "Hanken Grotesk Variable", "Hanken Grotesk", ui-sans-serif, system-ui,
    sans-serif;
  --font-mono: "Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* ---- Radii (identical to tokens.css) ---- */
  --radius-sm: 0.4rem;
  --radius: 0.75rem;
  --radius-lg: 1.25rem;
  --radius-xl: 2rem;
  --radius-pill: 999px;

  /* ---- Shadows + glows (soft warm-grey — light theme depth is subtle) ---- */
  --shadow-sm: 0 1px 2px -1px oklch(0.35 0.05 60 / 0.12), 0 2px 8px -3px oklch(0.35 0.05 60 / 0.08);
  --shadow-md: 0 10px 28px -10px oklch(0.35 0.05 60 / 0.18), 0 3px 10px -5px oklch(0.35 0.05 60 / 0.1);
  --shadow-lg: 0 28px 60px -22px oklch(0.35 0.05 60 / 0.22);
  --shadow-coral: 0 12px 32px -12px oklch(0.47 0.06 68 / 0.35);
  --glow-coral: 0 0 0 1px color-mix(in oklch, var(--coral) 35%, transparent),
    0 12px 40px -12px oklch(0.55 0.06 70 / 0.4);
  --glow-sun: 0 0 60px -10px oklch(0.83 0.07 80 / 0.5);

  /* ---- Motion (identical to tokens.css) ---- */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.4, 0.5, 1);
  --dur-fast: 160ms;
  --dur: 320ms;
  --dur-slow: 620ms;

  /* ---- Semantic z-index scale (identical to tokens.css) ---- */
  --z-base: 0;
  --z-raised: 10;
  --z-sticky: 100;
  --z-hub-bar: 300;
  --z-panel: 600;
  --z-overlay: 800;
  --z-toast: 950;
}
```

- [ ] **Step 2: Export it from the config package**

In `packages/config/package.json`, extend `exports`:

```json
{
  "name": "@pravritti/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./tailwind-preset": "./tailwind-preset.mjs",
    "./tokens.css": "./tokens.css",
    "./tokens-earth.css": "./tokens-earth.css"
  }
}
```

- [ ] **Step 3: Verify custom-property name parity**

Every var the espresso theme defines must exist in the earth theme (the shared preset references them by name). `--shadow-coral` is an intentional earth-only extra (the preset maps `shadow-coral` but tokens.css never defined it).

Run:
```bash
comm -23 \
  <(grep -oE '^\s*--[a-z0-9-]+' packages/config/tokens.css | tr -d ' ' | sort -u) \
  <(grep -oE '^\s*--[a-z0-9-]+' packages/config/tokens-earth.css | tr -d ' ' | sort -u)
```
Expected: empty output (no var in tokens.css is missing from tokens-earth.css).

- [ ] **Step 4: Commit**

```bash
git add packages/config/tokens-earth.css packages/config/package.json
git commit -m "task: light earth token theme derived from the logo palette

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Scaffold `apps/pravritti`

**Files:**
- Modify: `package.json` (repo root — rename only)
- Create: `apps/pravritti/package.json`
- Create: `apps/pravritti/astro.config.mjs`
- Create: `apps/pravritti/tailwind.config.mjs`
- Create: `apps/pravritti/tsconfig.json`
- Create: `apps/pravritti/vitest.config.ts`
- Create: `apps/pravritti/src/styles/global.css`
- Create: `apps/pravritti/src/layouts/BaseLayout.astro`
- Create: `apps/pravritti/src/pages/index.astro` (placeholder — real hero in Task 8)

**Interfaces:**
- Consumes: `@pravritti/config/tokens-earth.css` (Task 1).
- Produces: a booting app. `BaseLayout.astro` accepts `Props { title?: string; description?: string }` and renders `<slot />`; later tasks add `<CultureCanvas />`/`<SiteNav />` into it. `global.css` provides the base layer, `.sr-only`, and the reduced-motion kill rule.

- [ ] **Step 1: Free the package name — rename the root package**

In the root `package.json`, change only the name field: `"name": "pravritti"` → `"name": "pravritti-root"`. Everything else stays. (pnpm keys workspace importers by path; nothing references the root by name.)

- [ ] **Step 2: Write `apps/pravritti/package.json`**

```json
{
  "name": "pravritti",
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
    "@fontsource-variable/bricolage-grotesque": "^5.1.1",
    "@fontsource-variable/geist-mono": "^5.1.1",
    "@fontsource-variable/hanken-grotesk": "^5.1.1",
    "@pravritti/config": "workspace:*",
    "astro": "^5.5.0",
    "tailwindcss": "^3.4.17"
  },
  "devDependencies": {
    "vitest": "^4.1.9"
  }
}
```

- [ ] **Step 3: Write the four config files**

`apps/pravritti/astro.config.mjs`:
```js
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
```

`apps/pravritti/tailwind.config.mjs`:
```js
import preset from "@pravritti/config/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
};
```

`apps/pravritti/tsconfig.json`:
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

`apps/pravritti/vitest.config.ts`:
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

- [ ] **Step 4: Write `apps/pravritti/src/styles/global.css`**

```css
@import "@pravritti/config/tokens-earth.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ------------------------------------------------------------------ *
 * Base
 * ------------------------------------------------------------------ */
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
    color-scheme: light;
  }

  body {
    margin: 0;
    background-color: var(--bg);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 1.0625rem;
    line-height: 1.65;
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "ss01", "cv01";
    overflow-x: clip;
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.025em;
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
    outline: 2.5px solid var(--coral-ink);
    outline-offset: 3px;
    border-radius: 3px;
  }

  ::selection {
    background: var(--sun);
    color: var(--ink);
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

  img,
  svg,
  canvas {
    display: block;
    max-width: 100%;
  }
}

/* Content never depends on an animation firing. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 5: Write `apps/pravritti/src/layouts/BaseLayout.astro`**

```astro
---
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/geist-mono";
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
}

const {
  title = "Pravritti — Finding ways to improve on all the things.",
  description = "Pravritti builds products and experiments — finding ways to improve on all the things.",
} = Astro.props;

const canonical = new URL(Astro.url.pathname, Astro.site);
const year = new Date().getFullYear();
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta name="theme-color" content="#faf3ea" />
    <meta name="color-scheme" content="light" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta name="twitter:card" content="summary" />

    <link
      rel="icon"
      href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='14' y='16' width='4' height='11' rx='1.5' fill='%23472c1f'/%3E%3Ccircle cx='16' cy='12' r='9' fill='%235b893d'/%3E%3C/svg%3E"
    />
  </head>
  <body>
    <slot />
    <footer aria-label="Site footer">© {year} Pravritti</footer>

    <style>
      footer {
        position: fixed;
        bottom: 0.9rem;
        left: 0;
        right: 0;
        z-index: var(--z-raised);
        text-align: center;
        font-size: 0.72rem;
        letter-spacing: 0.02em;
        color: var(--muted);
        pointer-events: none;
      }
    </style>
  </body>
</html>
```

- [ ] **Step 6: Write placeholder `apps/pravritti/src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout>
  <main id="main">
    <h1>Pravritti</h1>
  </main>
</BaseLayout>
```

- [ ] **Step 7: Install and verify dev + build**

Run:
```bash
pnpm install
pnpm --filter pravritti build
```
Expected: install succeeds linking the new workspace package; build completes with `apps/pravritti/dist/index.html` created. Check the built HTML references the earth theme:
```bash
grep -o "pravritti" apps/pravritti/dist/index.html | head -1
```
Expected: `pravritti`.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml apps/pravritti
git commit -m "task: scaffold apps/pravritti shell on the earth theme

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Culture sim core — RNG, grid, similarity, neighbors

**Files:**
- Create: `apps/pravritti/src/lib/culture.ts`
- Test: `apps/pravritti/src/lib/culture.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Tasks 4–7):
  - `type Rng = () => number` — returns in `[0, 1)`.
  - `const FEATURES = 4`
  - `interface CultureConfig { traitCounts: readonly number[]; weights: readonly number[]; batchSize: number; innovationRate: number; driftPerTick: number; warmupTicks: number }`
  - `const defaultConfig: CultureConfig`
  - `interface CultureGrid { cols: number; rows: number; cells: Uint8Array; types: Uint8Array }`
  - `mulberry32(seed: number): Rng`
  - `createGrid(cols: number, rows: number, cfg: CultureConfig, rng: Rng): CultureGrid`
  - `similarity(grid: CultureGrid, a: number, b: number, cfg: CultureConfig): number`
  - `neighborIndex(grid: CultureGrid, cell: number, d: number): number` — d: 0=left,1=right,2=up,3=down, torus wrap.

- [ ] **Step 1: Write the failing tests**

`apps/pravritti/src/lib/culture.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createGrid,
  defaultConfig,
  FEATURES,
  mulberry32,
  neighborIndex,
  similarity,
  type CultureConfig,
} from "./culture";

/** Small config used across tests — same shape as production, tiny sizes. */
export const testConfig: CultureConfig = {
  traitCounts: [4, 5, 5, 6],
  weights: [0.4, 0.15, 0.2, 0.25],
  batchSize: 8,
  innovationRate: 0.01,
  driftPerTick: 0,
  warmupTicks: 0,
};

/** Write one culture vector into a grid cell. */
export function setCell(cells: Uint8Array, i: number, traits: number[]): void {
  for (let f = 0; f < FEATURES; f++) cells[i * FEATURES + f] = traits[f];
}

describe("mulberry32", () => {
  it("is deterministic for a seed and stays in [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs across seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

describe("createGrid", () => {
  it("allocates cells and zeroed types, traits within bounds", () => {
    const grid = createGrid(6, 4, testConfig, mulberry32(7));
    expect(grid.cols).toBe(6);
    expect(grid.rows).toBe(4);
    expect(grid.cells.length).toBe(6 * 4 * FEATURES);
    expect(grid.types.length).toBe(6 * 4);
    expect(grid.types.every((t) => t === 0)).toBe(true);
    for (let i = 0; i < 6 * 4; i++) {
      for (let f = 0; f < FEATURES; f++) {
        expect(grid.cells[i * FEATURES + f]).toBeLessThan(testConfig.traitCounts[f]);
      }
    }
  });
});

describe("similarity", () => {
  it("is 1 for identical and 0 for fully distinct cultures", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 3, 4]);
    expect(similarity(grid, 0, 1, testConfig)).toBeCloseTo(1, 10);
    setCell(grid.cells, 1, [0, 1, 2, 3]);
    expect(similarity(grid, 0, 1, testConfig)).toBe(0);
  });

  it("weights partial matches per feature", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 0, 0, 0]); // religious only → 0.4
    expect(similarity(grid, 0, 1, testConfig)).toBeCloseTo(0.4, 10);
    setCell(grid.cells, 1, [0, 2, 3, 0]); // logical + economical → 0.35
    expect(similarity(grid, 0, 1, testConfig)).toBeCloseTo(0.35, 10);
  });
});

describe("neighborIndex", () => {
  it("wraps on the torus in all four directions", () => {
    const grid = createGrid(3, 2, testConfig, mulberry32(1));
    // Grid indices:  0 1 2
    //                3 4 5
    expect(neighborIndex(grid, 0, 0)).toBe(2); // left wraps
    expect(neighborIndex(grid, 2, 1)).toBe(0); // right wraps
    expect(neighborIndex(grid, 0, 2)).toBe(3); // up wraps
    expect(neighborIndex(grid, 3, 3)).toBe(0); // down wraps
    expect(neighborIndex(grid, 4, 0)).toBe(3);
    expect(neighborIndex(grid, 4, 1)).toBe(5);
    expect(neighborIndex(grid, 4, 2)).toBe(1);
  });
});

describe("defaultConfig", () => {
  it("weights sum to 1 and match trait counts in length", () => {
    expect(defaultConfig.weights.length).toBe(FEATURES);
    expect(defaultConfig.traitCounts.length).toBe(FEATURES);
    const sum = defaultConfig.weights.reduce((s, w) => s + w, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter pravritti test`
Expected: FAIL — `Cannot find module './culture'` (or unresolved imports).

- [ ] **Step 3: Write `apps/pravritti/src/lib/culture.ts`**

```ts
/**
 * Axelrod culture-dissemination model (v1: uniform rules for every agent).
 *
 * Pure logic — no DOM, no Date, no Math.random. All randomness flows through
 * an injectable RNG so tests are deterministic. Every rate lives in
 * CultureConfig so Phase 2 (agent categories) and Phase 3 (user influence)
 * tune and extend this module rather than rewrite it; CultureGrid.types is
 * the reserved per-cell agent-category byte (all zero in v1).
 *
 * Spec: .docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md
 */

/** Uniform random in [0, 1). */
export type Rng = () => number;

/** Feature order everywhere: religious, logical, economical, societal. */
export const FEATURES = 4;

export interface CultureConfig {
  /** Trait count q per feature. */
  traitCounts: readonly number[];
  /** Similarity weight per feature; must sum to 1. */
  weights: readonly number[];
  /** Interaction attempts per stepBatch call. */
  batchSize: number;
  /** Chance an accepted interaction invents a novel trait instead of copying. */
  innovationRate: number;
  /** Average random single-feature mutations per stepBatch (may be < 1). */
  driftPerTick: number;
  /** Batches run before first paint so regions exist on frame one. */
  warmupTicks: number;
}

export const defaultConfig: CultureConfig = {
  traitCounts: [4, 5, 5, 6],
  weights: [0.4, 0.15, 0.2, 0.25],
  batchSize: 96,
  innovationRate: 0.01,
  driftPerTick: 0.4,
  warmupTicks: 2000,
};

export interface CultureGrid {
  cols: number;
  rows: number;
  /** cols × rows cells × FEATURES traits, row-major. */
  cells: Uint8Array;
  /** Reserved for Phase 2 agent categories; all zero in v1. */
  types: Uint8Array;
}

/** Deterministic 32-bit RNG (mulberry32). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fresh grid with uniformly random traits per feature. */
export function createGrid(
  cols: number,
  rows: number,
  cfg: CultureConfig,
  rng: Rng,
): CultureGrid {
  const cells = new Uint8Array(cols * rows * FEATURES);
  for (let i = 0; i < cols * rows; i++) {
    for (let f = 0; f < FEATURES; f++) {
      cells[i * FEATURES + f] = Math.floor(rng() * cfg.traitCounts[f]);
    }
  }
  return { cols, rows, cells, types: new Uint8Array(cols * rows) };
}

/** Weighted fraction of features on which cells a and b agree. */
export function similarity(
  grid: CultureGrid,
  a: number,
  b: number,
  cfg: CultureConfig,
): number {
  let s = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[a * FEATURES + f] === grid.cells[b * FEATURES + f]) {
      s += cfg.weights[f];
    }
  }
  return s;
}

/** Torus von Neumann neighbor of `cell` in direction d (0=L,1=R,2=U,3=D). */
export function neighborIndex(grid: CultureGrid, cell: number, d: number): number {
  const { cols, rows } = grid;
  const x = cell % cols;
  const y = (cell / cols) | 0;
  if (d === 0) return y * cols + ((x + cols - 1) % cols);
  if (d === 1) return y * cols + ((x + 1) % cols);
  if (d === 2) return ((y + rows - 1) % rows) * cols + x;
  return ((y + 1) % rows) * cols + x;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter pravritti test`
Expected: PASS (all describe blocks above green).

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/culture.ts apps/pravritti/src/lib/culture.test.ts
git commit -m "task: culture sim core — seeded rng, grid, weighted similarity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Interaction rule, innovation, drift, stepBatch

**Files:**
- Modify: `apps/pravritti/src/lib/culture.ts` (append)
- Test: `apps/pravritti/src/lib/culture.test.ts` (append)

**Interfaces:**
- Consumes: Task 3's exports.
- Produces (used by Tasks 5 and 7):
  - `interact(grid: CultureGrid, cell: number, nbr: number, cfg: CultureConfig, rng: Rng): number` — one homophily-gated influence attempt; returns the changed feature index or -1. RNG draw order: acceptance, feature pick, innovation, [novel trait].
  - `stepBatch(grid: CultureGrid, cfg: CultureConfig, rng: Rng, changed: number[]): number` — one tick: `batchSize` attempts + drift; pushes changed cell indices (duplicates possible) into `changed`; returns change count.

- [ ] **Step 1: Write the failing tests (append to `culture.test.ts`)**

Add to the imports from `./culture`: `interact`, `stepBatch`. Then append:

```ts
/** RNG stub that replays a fixed sequence (cycles if exhausted). */
export function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("interact", () => {
  it("never fires between identical cells or with itself", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 3, 4]);
    expect(interact(grid, 0, 1, testConfig, seqRng([0]))).toBe(-1);
    expect(interact(grid, 0, 0, testConfig, seqRng([0]))).toBe(-1);
  });

  it("never fires across zero similarity (homophily gate at 0)", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [0, 1, 2, 3]);
    // Acceptance draw of exactly 0 still fails: rng() >= sim(0).
    expect(interact(grid, 0, 1, testConfig, seqRng([0]))).toBe(-1);
    expect(grid.cells.slice(0, 4)).toEqual(Uint8Array.from([1, 2, 3, 4]));
  });

  it("copies the neighbor's trait on the picked differing feature", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 0, 0]); // differs on economical(2), societal(3); sim 0.55
    // Draws: accept(0.1 < 0.55), feature pick(0.6 → 2nd differing = societal), innovation(0.9 ≥ rate → copy)
    const changed = interact(grid, 0, 1, testConfig, seqRng([0.1, 0.6, 0.9]));
    expect(changed).toBe(3);
    expect(grid.cells[0 * FEATURES + 3]).toBe(0); // copied neighbor's societal trait
    expect(grid.cells[0 * FEATURES + 2]).toBe(3); // economical untouched
  });

  it("rejects when the acceptance draw exceeds similarity", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 0, 0]); // sim 0.55
    expect(interact(grid, 0, 1, testConfig, seqRng([0.7]))).toBe(-1);
  });

  it("innovates a trait different from its own instead of copying", () => {
    const cfg: CultureConfig = { ...testConfig, innovationRate: 1 };
    const grid = createGrid(2, 1, cfg, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 3, 0]); // differs on societal only
    // Draws: accept, feature pick, innovation(0 < 1 → innovate), novel trait pick
    const changed = interact(grid, 0, 1, cfg, seqRng([0.1, 0.0, 0.0, 0.5]));
    expect(changed).toBe(3);
    expect(grid.cells[3]).not.toBe(4); // changed away from its old trait
    expect(grid.cells[3]).toBeLessThan(cfg.traitCounts[3]);
  });
});

describe("stepBatch", () => {
  it("reports changed cell indices and returns their count", () => {
    const grid = createGrid(4, 4, testConfig, mulberry32(11));
    const changed: number[] = [];
    let total = 0;
    for (let t = 0; t < 200; t++) {
      changed.length = 0;
      const n = stepBatch(grid, testConfig, mulberry32(t + 1), changed);
      expect(changed.length).toBe(n);
      for (const i of changed) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(16);
      }
      total += n;
    }
    expect(total).toBeGreaterThan(0); // random 4×4 soup must see some influence
  });

  it("drift injects ~driftPerTick mutations even in a monoculture", () => {
    const cfg: CultureConfig = { ...testConfig, driftPerTick: 1 };
    const grid = createGrid(4, 4, cfg, mulberry32(3));
    grid.cells.fill(1); // monoculture: no interaction can ever fire
    const changed: number[] = [];
    const n = stepBatch(grid, cfg, mulberry32(5), changed);
    expect(n).toBe(1); // exactly floor(1) drift mutation
    const mutated = changed[0];
    const traits = grid.cells.slice(mutated * FEATURES, mutated * FEATURES + FEATURES);
    expect(traits.some((t) => t !== 1)).toBe(true);
  });

  it("a monoculture with zero drift never changes", () => {
    const grid = createGrid(4, 4, testConfig, mulberry32(3));
    grid.cells.fill(2);
    const changed: number[] = [];
    for (let t = 0; t < 500; t++) {
      expect(stepBatch(grid, testConfig, mulberry32(t + 1), changed)).toBe(0);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm --filter pravritti test`
Expected: FAIL — `interact`/`stepBatch` not exported; Task 3 tests still PASS.

- [ ] **Step 3: Append the implementation to `culture.ts`**

```ts
/** A trait in [0, q) guaranteed different from `not`. */
function differentTrait(q: number, not: number, rng: Rng): number {
  return (not + 1 + Math.floor(rng() * (q - 1))) % q;
}

/**
 * One homophily-gated influence attempt from `nbr` onto `cell`.
 * Returns the feature index that changed, or -1 if nothing happened.
 * RNG draw order: acceptance, differing-feature pick, innovation, [novel trait].
 */
export function interact(
  grid: CultureGrid,
  cell: number,
  nbr: number,
  cfg: CultureConfig,
  rng: Rng,
): number {
  if (cell === nbr) return -1;
  const sim = similarity(grid, cell, nbr, cfg);
  if (sim >= 1) return -1; // identical — nothing to exchange
  if (rng() >= sim) return -1; // homophily gate; always rejects at sim 0

  // Pick uniformly among differing features without allocating.
  let nDiff = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] !== grid.cells[nbr * FEATURES + f]) nDiff++;
  }
  let k = Math.floor(rng() * nDiff);
  let feature = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] !== grid.cells[nbr * FEATURES + f] && k-- === 0) {
      feature = f;
      break;
    }
  }

  const at = cell * FEATURES + feature;
  grid.cells[at] =
    rng() < cfg.innovationRate
      ? differentTrait(cfg.traitCounts[feature], grid.cells[at], rng)
      : grid.cells[nbr * FEATURES + feature];
  return feature;
}

/**
 * Advance one tick: cfg.batchSize interaction attempts plus cultural drift.
 * Drift keeps the grid out of Axelrod's absorbing (frozen) state forever.
 * Changed cell indices are pushed into `changed` (duplicates possible).
 */
export function stepBatch(
  grid: CultureGrid,
  cfg: CultureConfig,
  rng: Rng,
  changed: number[],
): number {
  const n = grid.cols * grid.rows;
  let count = 0;
  for (let i = 0; i < cfg.batchSize; i++) {
    const cell = Math.floor(rng() * n);
    const nbr = neighborIndex(grid, cell, Math.floor(rng() * 4));
    if (interact(grid, cell, nbr, cfg, rng) >= 0) {
      changed.push(cell);
      count++;
    }
  }
  let drifts = Math.floor(cfg.driftPerTick);
  if (rng() < cfg.driftPerTick - drifts) drifts++;
  for (let i = 0; i < drifts; i++) {
    const cell = Math.floor(rng() * n);
    const f = Math.floor(rng() * FEATURES);
    const at = cell * FEATURES + f;
    grid.cells[at] = differentTrait(cfg.traitCounts[f], grid.cells[at], rng);
    changed.push(cell);
    count++;
  }
  return count;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter pravritti test`
Expected: PASS. If the "copies the neighbor's trait" test fails on the picked feature, re-check the documented RNG draw order — the test's `seqRng` sequence encodes it exactly.

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/culture.ts apps/pravritti/src/lib/culture.test.ts
git commit -m "task: homophily interactions with innovation and drift

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Warm-up, region formation, and liveness guarantees

**Files:**
- Modify: `apps/pravritti/src/lib/culture.ts` (append)
- Test: `apps/pravritti/src/lib/culture.test.ts` (append)

**Interfaces:**
- Consumes: Tasks 3–4 exports.
- Produces (used by Task 7):
  - `warmup(grid: CultureGrid, cfg: CultureConfig, rng: Rng): void` — runs `cfg.warmupTicks` batches.
  - `meanNeighborSimilarity(grid: CultureGrid, cfg: CultureConfig): number` — mean similarity over each cell's right+down neighbors.

- [ ] **Step 1: Write the failing tests (append to `culture.test.ts`)**

Add `warmup` and `meanNeighborSimilarity` to the imports from `./culture` (`defaultConfig` is already imported since Task 3). Append:

```ts
describe("warmup and emergent structure", () => {
  it("meanNeighborSimilarity averages right+down pair similarity", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    setCell(grid.cells, 0, [1, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 0, 0]); // pair sim 0.55 in both directions
    // 2×1 torus: right neighbor is the other cell, down neighbor is itself (sim 1).
    // Pairs: cell0→right(0.55), cell0→down(1), cell1→right(0.55), cell1→down(1).
    expect(meanNeighborSimilarity(grid, testConfig)).toBeCloseTo((0.55 + 1 + 0.55 + 1) / 4, 10);
  });

  it("warm-up grows regions well above the random baseline", () => {
    const cfg: CultureConfig = {
      ...defaultConfig,
      batchSize: 256,
      warmupTicks: 6000,
      driftPerTick: 0.1,
    };
    const rng = mulberry32(2026);
    const grid = createGrid(32, 24, cfg, rng);
    const before = meanNeighborSimilarity(grid, cfg);
    // Random-init expectation: Σ weight_f / q_f = 0.4/4 + 0.15/5 + 0.2/5 + 0.25/6 ≈ 0.212
    expect(before).toBeGreaterThan(0.12);
    expect(before).toBeLessThan(0.32);
    warmup(grid, cfg, rng);
    expect(meanNeighborSimilarity(grid, cfg)).toBeGreaterThan(0.45);
  });

  it("stays alive long after warm-up (never freezes)", () => {
    const cfg: CultureConfig = { ...defaultConfig, batchSize: 96, warmupTicks: 2000 };
    const rng = mulberry32(7);
    const grid = createGrid(24, 16, cfg, rng);
    warmup(grid, cfg, rng);
    const changed: number[] = [];
    for (let window = 0; window < 10; window++) {
      let changes = 0;
      for (let t = 0; t < 500; t++) {
        changed.length = 0;
        changes += stepBatch(grid, cfg, rng, changed);
      }
      expect(changes).toBeGreaterThan(0); // every 500-tick window shows life
    }
  });

  it("drift revives a fully absorbed two-culture grid", () => {
    // Checkerboard of two cultures with zero feature overlap — a true
    // Axelrod absorbing state: every neighbor pair has similarity 0.
    const frozen: CultureConfig = { ...testConfig, batchSize: 96, driftPerTick: 0 };
    const grid = createGrid(8, 8, frozen, mulberry32(1));
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        setCell(grid.cells, y * 8 + x, (x + y) % 2 === 0 ? [0, 0, 0, 0] : [1, 1, 1, 1]);
      }
    }
    const changed: number[] = [];
    const rng = mulberry32(9);
    for (let t = 0; t < 300; t++) {
      changed.length = 0;
      expect(stepBatch(grid, frozen, rng, changed)).toBe(0); // absorbed: dead
    }
    const alive: CultureConfig = { ...frozen, driftPerTick: 0.4 };
    let changes = 0;
    for (let t = 0; t < 2000; t++) {
      changed.length = 0;
      changes += stepBatch(grid, alive, rng, changed);
    }
    // Drift alone would average ~0.4 × 2000 = 800; interactions it re-enables
    // must add measurably on top.
    expect(changes).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm --filter pravritti test`
Expected: FAIL — `warmup`/`meanNeighborSimilarity` not exported.

- [ ] **Step 3: Append the implementation to `culture.ts`**

```ts
/** Run cfg.warmupTicks batches so the first painted frame shows regions. */
export function warmup(grid: CultureGrid, cfg: CultureConfig, rng: Rng): void {
  const scratch: number[] = [];
  for (let i = 0; i < cfg.warmupTicks; i++) {
    scratch.length = 0;
    stepBatch(grid, cfg, rng, scratch);
  }
}

/** Mean similarity over each cell's right and down neighbors (torus). */
export function meanNeighborSimilarity(grid: CultureGrid, cfg: CultureConfig): number {
  const n = grid.cols * grid.rows;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += similarity(grid, i, neighborIndex(grid, i, 1), cfg);
    sum += similarity(grid, i, neighborIndex(grid, i, 3), cfg);
  }
  return sum / (2 * n);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter pravritti test`
Expected: PASS. All assertions are deterministic (fixed seeds). If a threshold assertion fails, do NOT loosen it silently — inspect the printed value: region growth far below 0.45 or revival barely above the drift mean means the model rules have a bug (check the homophily gate direction and `differentTrait`).

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/culture.ts apps/pravritti/src/lib/culture.test.ts
git commit -m "task: warmup, region metric, and no-freeze liveness tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Quiet-wash palette module

**Files:**
- Create: `apps/pravritti/src/lib/palette.ts`
- Test: `apps/pravritti/src/lib/palette.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Task 7):
  - `interface Rgb { r: number; g: number; b: number }`
  - `const BG: Rgb` — cream `{ r: 250, g: 243, b: 234 }`, kept in sync with `--bg`.
  - `const FAMILIES: readonly Rgb[]` — 4 hue families indexed by the religious trait: leaf, clay, slate, sand.
  - `mix(a: Rgb, b: Rgb, t: number): Rgb` — channel lerp, rounded.
  - `cellColor(religious: number, societal: number, societalCount: number): Rgb`
  - `cellAlpha(logical: number, logicalCount: number): number` — in [0.55, 1].
  - `cellRadius(economical: number, economicalCount: number, cellPx: number): number` — in [0.24, 0.38] × cellPx.

- [ ] **Step 1: Write the failing tests**

`apps/pravritti/src/lib/palette.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BG, cellAlpha, cellColor, cellRadius, FAMILIES, mix, type Rgb } from "./palette";

function dist(a: Rgb, b: Rgb): number {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

describe("mix", () => {
  it("hits both endpoints and the midpoint", () => {
    const a: Rgb = { r: 0, g: 100, b: 200 };
    const b: Rgb = { r: 100, g: 0, b: 0 };
    expect(mix(a, b, 0)).toEqual(a);
    expect(mix(a, b, 1)).toEqual(b);
    expect(mix(a, b, 0.5)).toEqual({ r: 50, g: 50, b: 100 });
  });
});

describe("cellColor", () => {
  it("stays heavily washed toward the cream background for every trait combo", () => {
    const bgSpan = dist({ r: 0, g: 0, b: 0 }, BG);
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      for (let soc = 0; soc < 6; soc++) {
        const c = cellColor(rel, soc, 6);
        // Quiet wash: every cell color sits much nearer BG than its family base.
        expect(dist(c, BG)).toBeLessThan(dist(FAMILIES[rel], BG) * 0.45);
        expect(dist(c, BG)).toBeLessThan(bgSpan); // sanity: valid, near-bg color
      }
    }
  });

  it("higher societal shade moves the color closer to the background", () => {
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      const deep = cellColor(rel, 0, 6);
      const airy = cellColor(rel, 5, 6);
      expect(dist(airy, BG)).toBeLessThan(dist(deep, BG));
    }
  });

  it("keeps hue families distinguishable at the same shade", () => {
    const seen = new Set(
      Array.from({ length: FAMILIES.length }, (_, rel) => {
        const c = cellColor(rel, 2, 6);
        return `${c.r},${c.g},${c.b}`;
      }),
    );
    expect(seen.size).toBe(FAMILIES.length);
  });
});

describe("cellAlpha / cellRadius", () => {
  it("alpha is monotonic in the logical trait and bounded", () => {
    let prev = 0;
    for (let l = 0; l < 5; l++) {
      const a = cellAlpha(l, 5);
      expect(a).toBeGreaterThanOrEqual(0.55);
      expect(a).toBeLessThanOrEqual(1);
      expect(a).toBeGreaterThan(prev);
      prev = a;
    }
    expect(cellAlpha(4, 5)).toBe(1);
  });

  it("radius is monotonic in the economical trait and fits the cell slot", () => {
    let prev = 0;
    for (let e = 0; e < 5; e++) {
      const r = cellRadius(e, 5, 14);
      expect(r).toBeGreaterThan(prev);
      expect(r).toBeLessThan(7); // must never overflow a 14px slot
      prev = r;
    }
    expect(cellRadius(0, 5, 14)).toBeCloseTo(0.24 * 14, 5);
    expect(cellRadius(4, 5, 14)).toBeCloseTo(0.38 * 14, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter pravritti test palette`
Expected: FAIL — `Cannot find module './palette'`.

- [ ] **Step 3: Write `apps/pravritti/src/lib/palette.ts`**

```ts
/**
 * Quiet-wash palette for the culture canvas.
 *
 * Canvas needs numeric RGB for per-cell lerping, so these values are the
 * logo palette committed as numbers; BG mirrors --bg in tokens-earth.css.
 * Visual encoding (spec): religious → hue family, societal → shade,
 * economical → dot radius, logical → opacity. Every color is washed hard
 * toward the cream background — the mosaic reads on the second look.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Cream background — keep in sync with --bg in tokens-earth.css. */
export const BG: Rgb = { r: 250, g: 243, b: 234 };

/** Hue families indexed by the religious trait: leaf, clay, slate, sand. */
export const FAMILIES: readonly Rgb[] = [
  { r: 91, g: 137, b: 61 }, // leaf green  #5b893d
  { r: 138, g: 102, b: 62 }, // clay brown  #8a663e
  { r: 69, g: 91, b: 100 }, // slate       #455b64
  { r: 176, g: 148, b: 110 }, // sand
];

/** How far every cell color is pulled toward BG (the "quiet" in quiet wash). */
const WASH = 0.72;
/** Societal shade range: extra pull toward BG from deep (0) to airy (1). */
const SHADE_MIN = 0.15;
const SHADE_SPAN = 0.45;

const ALPHA_MIN = 0.55;
const RADIUS_MIN = 0.24;
const RADIUS_MAX = 0.38;

/** Channel-wise linear interpolation from a to b, rounded. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/** Fill color for a cell: family hue, shaded by societal, washed to cream. */
export function cellColor(religious: number, societal: number, societalCount: number): Rgb {
  const t = societalCount <= 1 ? 0 : societal / (societalCount - 1);
  const shaded = mix(FAMILIES[religious], BG, SHADE_MIN + SHADE_SPAN * t);
  return mix(shaded, BG, WASH);
}

/** Dot opacity from the logical trait. */
export function cellAlpha(logical: number, logicalCount: number): number {
  const t = logicalCount <= 1 ? 1 : logical / (logicalCount - 1);
  return ALPHA_MIN + (1 - ALPHA_MIN) * t;
}

/** Dot radius in px from the economical trait; never overflows the slot. */
export function cellRadius(economical: number, economicalCount: number, cellPx: number): number {
  const t = economicalCount <= 1 ? 1 : economical / (economicalCount - 1);
  return (RADIUS_MIN + (RADIUS_MAX - RADIUS_MIN) * t) * cellPx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter pravritti test`
Expected: PASS (palette + all culture tests).

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/palette.ts apps/pravritti/src/lib/palette.test.ts
git commit -m "task: quiet-wash palette mapping traits to color, alpha, radius

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: CultureCanvas component — renderer and lifecycle

**Files:**
- Create: `apps/pravritti/src/components/CultureCanvas.astro`
- Modify: `apps/pravritti/src/layouts/BaseLayout.astro` (mount the canvas)

**Interfaces:**
- Consumes: `culture.ts` (Tasks 3–5) and `palette.ts` (Task 6) exactly as specified in their Produces blocks.
- Produces: `<CultureCanvas />` — self-contained fixed background layer. No props.

- [ ] **Step 1: Write `apps/pravritti/src/components/CultureCanvas.astro`**

```astro
---
// Decorative background: Axelrod culture-dissemination simulation rendered
// as a quiet wash. Purely progressive enhancement — any failure leaves a
// plain cream page. Spec: .docs/superpowers/specs/2026-07-03-*-design.md
---

<canvas id="culture-canvas" aria-hidden="true"></canvas>

<script>
  import {
    createGrid,
    defaultConfig,
    FEATURES,
    mulberry32,
    stepBatch,
    warmup,
    type CultureGrid,
  } from "../lib/culture";
  import { BG, cellAlpha, cellColor, cellRadius } from "../lib/palette";

  const CELL = 14; // CSS px per cell slot
  const MAX_COLS = 120;
  const MAX_ROWS = 80;
  const LERP_MS = 600; // change blooms, never blinks
  const STEP_MS = 1000 / 60; // fixed sim timestep, independent of display Hz
  /** Per-channel snap thresholds for [r, g, b, alpha, radius]. */
  const EPS = [1, 1, 1, 0.02, 0.15];

  const canvas = document.getElementById("culture-canvas") as HTMLCanvasElement | null;
  const ctx = canvas ? canvas.getContext("2d") : null;

  if (canvas && ctx) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const rng = mulberry32(Date.now() % 0x7fffffff || 1);
    const cfg = defaultConfig;
    const bgStyle = `rgb(${BG.r} ${BG.g} ${BG.b})`;

    let grid: CultureGrid;
    let cellPx = CELL; // device px per cell
    let raf = 0;
    let lastT = 0;
    let acc = 0;
    const changed: number[] = [];
    /** Displayed r,g,b,alpha,radius per cell (lerped toward target). */
    let shown: Float32Array;
    /** Target r,g,b,alpha,radius per cell (derived from culture). */
    let target: Float32Array;
    /** Cells currently animating toward their target. */
    const animating = new Set<number>();

    function writeTarget(i: number): void {
      const f = i * FEATURES;
      const color = cellColor(grid.cells[f], grid.cells[f + 3], cfg.traitCounts[3]);
      const o = i * 5;
      target[o] = color.r;
      target[o + 1] = color.g;
      target[o + 2] = color.b;
      target[o + 3] = cellAlpha(grid.cells[f + 1], cfg.traitCounts[1]);
      target[o + 4] = cellRadius(grid.cells[f + 2], cfg.traitCounts[2], cellPx);
    }

    function paintCell(i: number): void {
      const x = (i % grid.cols) * cellPx;
      const y = ((i / grid.cols) | 0) * cellPx;
      const o = i * 5;
      ctx.fillStyle = bgStyle;
      ctx.fillRect(x, y, cellPx, cellPx);
      ctx.beginPath();
      ctx.arc(x + cellPx / 2, y + cellPx / 2, shown[o + 4], 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${shown[o]} ${shown[o + 1]} ${shown[o + 2]} / ${shown[o + 3]})`;
      ctx.fill();
    }

    function rebuild(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cellPx = CELL * dpr;
      const cols = Math.min(Math.ceil(window.innerWidth / CELL), MAX_COLS);
      const rows = Math.min(Math.ceil(window.innerHeight / CELL), MAX_ROWS);
      canvas.width = cols * cellPx;
      canvas.height = rows * cellPx;
      canvas.style.width = `${cols * CELL}px`;
      canvas.style.height = `${rows * CELL}px`;
      grid = createGrid(cols, rows, cfg, rng);
      warmup(grid, cfg, rng); // first visible frame already shows regions
      const n = cols * rows;
      shown = new Float32Array(n * 5);
      target = new Float32Array(n * 5);
      animating.clear();
      ctx.fillStyle = bgStyle;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < n; i++) {
        writeTarget(i);
        shown.set(target.subarray(i * 5, i * 5 + 5), i * 5);
        paintCell(i);
      }
    }

    function frame(t: number): void {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(t - lastT, 100); // clamp long gaps (tab jank)
      lastT = t;
      acc += dt;
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        changed.length = 0;
        stepBatch(grid, cfg, rng, changed);
        for (const i of changed) {
          writeTarget(i);
          animating.add(i);
        }
      }
      const k = Math.min(dt / LERP_MS, 1);
      for (const i of animating) {
        const o = i * 5;
        let done = true;
        for (let c = 0; c < 5; c++) {
          const d = target[o + c] - shown[o + c];
          if (Math.abs(d) <= EPS[c]) {
            shown[o + c] = target[o + c];
          } else {
            shown[o + c] += d * k;
            done = false;
          }
        }
        paintCell(i);
        if (done) animating.delete(i);
      }
    }

    function start(): void {
      if (raf) return;
      lastT = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop(): void {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    rebuild();
    if (!reduced.matches) start(); // reduced motion: mature static mosaic

    reduced.addEventListener("change", () => (reduced.matches ? stop() : start()));

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!reduced.matches) start();
    });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 300);
    });
  }
</script>

<style>
  #culture-canvas {
    position: fixed;
    inset: 0;
    z-index: var(--z-base);
    pointer-events: none;
  }
</style>
```

- [ ] **Step 2: Mount it in `BaseLayout.astro`**

In `apps/pravritti/src/layouts/BaseLayout.astro`, add to the frontmatter imports:

```astro
import CultureCanvas from "../components/CultureCanvas.astro";
```

and change the top of `<body>` from:

```astro
  <body>
    <slot />
```

to:

```astro
  <body>
    <CultureCanvas />
    <slot />
```

- [ ] **Step 3: Verify in the browser**

Run: `pnpm --filter pravritti dev`

Then check, in a real browser (this is a visual feature — screenshots or eyes required):
1. `http://localhost:4321/` shows a cream page with a soft, slowly shifting mosaic of green/brown/slate/sand dots — regions visible, changes bloom in gently. The placeholder `<h1>Pravritti</h1>` must sit ON TOP of the canvas and be fully readable.
2. First paint already shows regions (soft color fields), not uniform noise.
3. Emulate `prefers-reduced-motion: reduce` (DevTools → Rendering) → mosaic renders but does not animate.
4. Hide the tab ~30 s, return → no burst of catching-up; motion resumes calmly.
5. Resize the window → after ~300 ms the canvas rebuilds to the new size.
6. Console shows no errors.

- [ ] **Step 4: Run the full test suite and build**

Run: `pnpm --filter pravritti test && pnpm --filter pravritti build`
Expected: all tests PASS; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/components/CultureCanvas.astro apps/pravritti/src/layouts/BaseLayout.astro
git commit -m "task: culture canvas renderer with lerp, pause, and reduced motion

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Hero, nav, and the real landing page

**Files:**
- Create: `apps/pravritti/src/components/SiteNav.astro`
- Create: `apps/pravritti/src/components/Hero.astro`
- Modify: `apps/pravritti/src/layouts/BaseLayout.astro` (mount nav)
- Modify: `apps/pravritti/src/pages/index.astro` (replace placeholder)

**Interfaces:**
- Consumes: `BaseLayout.astro` (Tasks 2/7), logo at `public/logos/logo-02.svg` (already committed).
- Produces: `<SiteNav />` (no props), `<Hero />` (no props), final `/` page.

- [ ] **Step 1: Write `apps/pravritti/src/components/SiteNav.astro`**

```astro
---
// Top-right nav. One quiet pill: Blog.
---

<nav aria-label="Site">
  <a class="nav-pill" href="/blog">Blog</a>
</nav>

<style>
  nav {
    position: fixed;
    top: clamp(1rem, 3vw, 1.75rem);
    right: clamp(1rem, 3vw, 1.75rem);
    z-index: var(--z-sticky);
  }

  .nav-pill {
    display: inline-flex;
    align-items: center;
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--coral-ink);
    padding: 0.5rem 1.15rem;
    border: 1.5px solid var(--line-strong);
    border-radius: var(--radius-pill);
    background: color-mix(in oklch, var(--surface) 72%, transparent);
    backdrop-filter: blur(6px);
    transition:
      background var(--dur-fast) var(--ease-out-quint),
      border-color var(--dur-fast) var(--ease-out-quint),
      transform var(--dur-fast) var(--ease-out-quint);
  }

  .nav-pill:hover {
    background: var(--wash-coral);
    border-color: var(--coral-ink);
    transform: translateY(-1px);
  }
</style>
```

- [ ] **Step 2: Write `apps/pravritti/src/components/Hero.astro`**

```astro
---
// The hero IS the page: logo + tagline, centered over the culture canvas.
---

<main id="main" class="hero">
  <div class="hero-inner">
    <h1>
      <img src="/logos/logo-02.svg" alt="Pravritti" width="1191" height="548" />
    </h1>
    <p class="tagline">Finding ways to improve on all the things.</p>
  </div>
</main>

<style>
  .hero {
    position: relative;
    z-index: var(--z-raised);
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: clamp(1.5rem, 5vw, 3rem);
  }

  .hero-inner {
    display: grid;
    justify-items: center;
    gap: 0.25rem;
    animation: rise-in 0.9s var(--ease-out-expo) both;
  }

  h1 img {
    width: min(640px, 84vw);
    height: auto;
  }

  .tagline {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(1.25rem, 1rem + 1.6vw, 1.9rem);
    letter-spacing: -0.02em;
    text-align: center;
    color: var(--ink);
  }

  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
  }
</style>
```

- [ ] **Step 3: Mount the nav in `BaseLayout.astro`**

Add to the frontmatter imports of `apps/pravritti/src/layouts/BaseLayout.astro`:

```astro
import SiteNav from "../components/SiteNav.astro";
```

and change:

```astro
  <body>
    <CultureCanvas />
    <slot />
```

to:

```astro
  <body>
    <CultureCanvas />
    <SiteNav />
    <slot />
```

- [ ] **Step 4: Replace `apps/pravritti/src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Hero from "../components/Hero.astro";
---

<BaseLayout>
  <Hero />
</BaseLayout>
```

- [ ] **Step 5: Verify in the browser**

Run: `pnpm --filter pravritti dev` and check:
1. Logo centered, tagline beneath it in the display font; both rise in once on load.
2. **Blog** pill top right; hover shows the brown wash; keyboard Tab reaches it with a visible focus ring.
3. The `©` footer line sits at the bottom, unobtrusive.
4. The page does not scroll at desktop sizes; at a narrow mobile width (~375px) the logo scales down and everything still fits.
5. Screen-reader sanity: the accessibility tree shows `heading level 1 "Pravritti"` (the img alt inside the h1).
6. With reduced motion emulated: no entrance animation, content simply present.

- [ ] **Step 6: Build check + commit**

Run: `pnpm --filter pravritti build`
Expected: success.

```bash
git add apps/pravritti/src/components/SiteNav.astro apps/pravritti/src/components/Hero.astro apps/pravritti/src/layouts/BaseLayout.astro apps/pravritti/src/pages/index.astro
git commit -m "task: hero with logo and tagline, blog pill nav

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Blog coming-soon and 404 pages

**Files:**
- Create: `apps/pravritti/src/pages/blog.astro`
- Create: `apps/pravritti/src/pages/404.astro`

**Interfaces:**
- Consumes: `BaseLayout.astro` (with canvas + nav mounted).
- Produces: `/blog` and `/404` routes.

- [ ] **Step 1: Write `apps/pravritti/src/pages/blog.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout
  title="Blog — Pravritti"
  description="The Pravritti blog — notes on building, testing, and improving all the things. Coming soon."
>
  <main id="main" class="notice">
    <div class="notice-inner">
      <h1>The blog is on its way.</h1>
      <p>Notes on building, testing, and improving all the things — coming soon.</p>
      <a class="home-link" href="/">← Back home</a>
    </div>
  </main>
</BaseLayout>

<style>
  .notice {
    position: relative;
    z-index: var(--z-raised);
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: clamp(1.5rem, 5vw, 3rem);
    text-align: center;
  }

  .notice-inner {
    display: grid;
    justify-items: center;
    gap: 1rem;
    max-width: 34rem;
  }

  h1 {
    font-size: clamp(1.9rem, 1.4rem + 2.4vw, 3rem);
  }

  p {
    margin: 0;
    color: var(--muted);
  }

  .home-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--coral-ink);
    padding: 0.6rem 1.25rem;
    border: 1.5px solid var(--line-strong);
    border-radius: var(--radius-pill);
    transition:
      background var(--dur-fast) var(--ease-out-quint),
      border-color var(--dur-fast) var(--ease-out-quint);
  }

  .home-link:hover {
    background: var(--wash-coral);
    border-color: var(--coral-ink);
  }
</style>
```

- [ ] **Step 2: Write `apps/pravritti/src/pages/404.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Not found — Pravritti" description="That page wandered off.">
  <main id="main" class="notice">
    <div class="notice-inner">
      <h1>That page wandered off.</h1>
      <p>Nothing lives at this address. The cultures below carry on regardless.</p>
      <a class="home-link" href="/">← Back home</a>
    </div>
  </main>
</BaseLayout>

<style>
  .notice {
    position: relative;
    z-index: var(--z-raised);
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: clamp(1.5rem, 5vw, 3rem);
    text-align: center;
  }

  .notice-inner {
    display: grid;
    justify-items: center;
    gap: 1rem;
    max-width: 34rem;
  }

  h1 {
    font-size: clamp(1.9rem, 1.4rem + 2.4vw, 3rem);
  }

  p {
    margin: 0;
    color: var(--muted);
  }

  .home-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--coral-ink);
    padding: 0.6rem 1.25rem;
    border: 1.5px solid var(--line-strong);
    border-radius: var(--radius-pill);
    transition:
      background var(--dur-fast) var(--ease-out-quint),
      border-color var(--dur-fast) var(--ease-out-quint);
  }

  .home-link:hover {
    background: var(--wash-coral);
    border-color: var(--coral-ink);
  }
</style>
```

- [ ] **Step 3: Verify in the browser**

With `pnpm --filter pravritti dev`:
1. Clicking the **Blog** pill from `/` lands on the coming-soon page over the same living background; "← Back home" returns.
2. Any bogus URL (e.g. `/nope`) renders the 404 page in dev.

- [ ] **Step 4: Build + commit**

Run: `pnpm --filter pravritti build`
Expected: success, `dist/blog/index.html` and `dist/404.html` exist.

```bash
git add apps/pravritti/src/pages/blog.astro apps/pravritti/src/pages/404.astro
git commit -m "task: blog coming-soon and 404 pages

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Final verification pass

**Files:** none expected (fixes only if checks fail).

**Interfaces:** n/a.

- [ ] **Step 1: Full test suite**

Run: `pnpm --filter pravritti test`
Expected: every culture + palette test PASS.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter pravritti exec tsc --noEmit`
Expected: no errors (strict mode; `noUnusedLocals`/`noUnusedParameters` are on — clean up any stragglers).

- [ ] **Step 3: Clean production build + preview sweep**

Run: `pnpm --filter pravritti build && pnpm --filter pravritti preview`

In the browser against the preview server, walk the spec's manual list once more: `/`, `/blog`, a 404 URL, reduced-motion emulation, tab-hide/return, window resize, hero readability over the mosaic, keyboard navigation to the Blog pill and home links.

- [ ] **Step 4: Confirm nothing regressed for hiren**

Run: `pnpm --filter hiren build`
Expected: still builds (we touched only the root package name and added files; this catches accidental fallout).

- [ ] **Step 5: Commit any fixes; otherwise done**

If steps 1–4 forced changes, commit them:

```bash
git add -A && git commit -m "task: final verification fixes for the landing page

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Deployment note for the human: create the Cloudflare Pages project for the root domain with build command `pnpm --filter pravritti build` and output directory `apps/pravritti/dist`, pointed at this branch — same pattern as the existing apps.
