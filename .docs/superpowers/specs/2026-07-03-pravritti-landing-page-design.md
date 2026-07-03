# Pravritti Landing Page — Design Spec

**Date:** 2026-07-03
**Status:** Approved pending final review
**App:** `apps/pravritti` (root domain, e.g. pravritti.org)

## Overview

A single-viewport landing page for Pravritti. The hero is the Pravritti logo
(robot + tree illustration with wordmark) and the tagline *"Finding ways to
improve on all the things."* Behind everything runs a quiet, living background:
a cellular-automaton simulation of cultural dissemination based on Axelrod's
model — a visual statement of "one society, many cultures" where local
convergence and global diversity emerge from simple interaction rules.

## Goals

- Ship the root-domain landing page: logo hero, tagline, Blog nav link.
- Establish a light "earth" theme in the shared design system, derived from the
  logo palette, without disturbing the existing dark espresso theme used by
  `apps/hiren`.
- Build v1 of the culture simulation: uniform-rule Axelrod model with
  innovation and drift, rendered as a low-contrast "quiet wash" that never
  freezes and never competes with the hero.

## Non-goals (v1) and roadmap

v1 deliberately excludes the richer mechanics discussed during brainstorming.
They are planned, and **each phase gets its own brainstorming and
experimentation cycle before any implementation** — nothing below is designed
yet, only earmarked:

- **Phase 2 — Agent categories.** Typed agents that modulate the rules rather
  than the state: hubs (strong broadcasters), zealots (immutable features),
  migrants (mobile agents crossing cultural boundaries), openness/stubbornness
  modifiers. Each type gets distinct visual treatment. Requires its own design
  round: rule balancing, visual language, performance re-validation.
- **Phase 3 — User influence.** The visitor affects the cultures: cursor as a
  local "media field" injecting influence, clicks seeding new cultures.
  Requires its own design round: interaction affordances, ensuring play never
  distracts from the hero, touch behavior.
- The blog itself (only a coming-soon page ships now).

The v1 simulation module must be written so these phases extend it rather than
rewrite it: rule parameters live in one config object, and the per-cell state
layout leaves room for an agent-type field.

## Architecture

New Astro app at `apps/pravritti`, mirroring `apps/hiren`:

- Astro 5 + `@astrojs/tailwind`, Tailwind 3 with the shared preset from
  `@pravritti/config` (workspace dependency).
- `tsconfig.json` extends the repo base; `vitest` for simulation logic tests.
- Fonts: `@fontsource-variable/bricolage-grotesque`,
  `@fontsource-variable/hanken-grotesk`, `@fontsource-variable/geist-mono`
  (same as hiren).
- Static output. Deployed as its own Cloudflare Pages project from the current
  branch: build `pnpm --filter pravritti build`, output `apps/pravritti/dist`.

### Routes

| Route | Content |
|-------|---------|
| `/` | Hero: logo + tagline over the simulation canvas |
| `/blog` | On-brand "coming soon" page, link back home |
| `404` | Minimal, same shell |

### File layout

```
apps/pravritti/
  astro.config.mjs
  tailwind.config.mjs
  tsconfig.json
  vitest.config.ts
  package.json
  public/logos/logo-02.svg      (already in place)
  src/
    styles/global.css           (imports tokens-earth.css + fonts)
    layouts/BaseLayout.astro    (head, nav, canvas mount)
    components/SiteNav.astro    (Blog link, top right)
    components/Hero.astro       (logo + tagline)
    components/CultureCanvas.astro  (canvas element + client script)
    lib/culture.ts              (pure simulation logic — no DOM)
    lib/culture.test.ts
    pages/index.astro
    pages/blog.astro
    pages/404.astro
```

## Design system — the "earth" theme

The shared token structure in `packages/config` remains the single source of
truth. A second token file, `packages/config/tokens-earth.css`, defines the
**same custom-property names** as `tokens.css` so the shared Tailwind preset
works unchanged. `apps/hiren` keeps importing `tokens.css` (dark espresso);
`apps/pravritti` imports `tokens-earth.css`. No changes to
`tailwind-preset.mjs`.

Values derived from the logo palette (`#263238` slate, `#455b64` slate-grey,
`#939291` grey, `#ffeedd` cream, `#5b893d` leaf green, `#472c1f` deep brown,
`#8a663e` wordmark brown), expressed in OKLCH like the existing tokens:

- `color-scheme: light`.
- **Neutrals:** `--bg` warm cream (softened from `#ffeedd` for large
  surfaces), `--surface`/`--surface-2` slightly deeper cream for elevation,
  `--ink` deep slate `#263238`, `--muted` slate-grey `#455b64` (contrast-checked
  ≥ 4.5:1 on `--bg`), `--line`/`--line-strong` warm greys.
- **Accent roles** re-pointed to the logo palette, keeping existing names:
  `--leaf` → logo green `#5b893d`; `--coral` → wordmark brown `#8a663e`
  (primary link/CTA role); `--teal` → slate `#455b64`; `--sun` → warm sand
  (derived between cream and brown). `-ink` variants darkened as needed for
  text contrast on the light bg.
- **Washes** via the same `color-mix` recipe, mixing accents toward the light
  `--bg`.
- **Shadows** lightened for a light theme (soft warm-grey, low alpha); same
  radii, motion curves, duration and z-index scales; same three font families.

## Page composition

Single viewport, no scroll on `/`:

- **Nav (top):** no wordmark on the left — the logo is the page. Top right: a
  quiet pill link **Blog**, `--coral-ink` text with a wash hover, focus-visible
  ring.
- **Hero (center):** the full logo SVG served from `public/logos/logo-02.svg`
  as an `<img>` with `alt="Pravritti"`, width-capped (~min(640px, 80vw)), the
  page's `<h1>` is visually-hidden text "Pravritti" (the wordmark lives inside
  the image). Below it the tagline in the display font, `--ink`:
  *"Finding ways to improve on all the things."*
- **Footer:** one whisper-small muted line (© Pravritti) pinned to the bottom.
- **`/blog`:** same shell and background; centered short message that the blog
  is coming soon, plus a link back home.

Subtle entrance: hero fades/rises once on load (respecting
`prefers-reduced-motion`). No other page-level animation — the background is
the motion.

## The culture simulation (v1)

### Model

Pure-logic module `src/lib/culture.ts`, no DOM access, driven by a seeded RNG
(injectable for tests).

- **Grid:** sized from the viewport at cell ≈ 14 px, capped at 120 × 80 cells.
  Torus wrapping (no dead edges). Von Neumann neighborhood (4 neighbors).
- **State:** each cell holds a culture vector of **F = 4 features** —
  *religious, logical, economical, societal* — each an integer trait. Traits
  per feature: religious q=4 (maps to the 4 hue families), societal q=6,
  economical q=5, logical q=5. Stored as flat typed arrays; layout reserves an
  agent-type byte per cell for Phase 2 (unused in v1).
- **Similarity:** weighted fraction of matching features. Weights: religious
  0.4, societal 0.25, economical 0.2, logical 0.15 — religion is the slowest
  to change and anchors regions.
- **Tick:** a batch of B random (cell, random-neighbor) pairs. For each pair,
  with probability = weighted similarity (and only if not identical), the cell
  copies the neighbor's trait on one randomly chosen differing feature.
- **Innovation:** with probability ~1% an interaction produces a *novel*
  random trait on the chosen feature instead of a copy.
- **Drift:** each tick, a very low per-cell mutation probability flips one
  random feature to a random trait. Innovation + drift keep the system out of
  Axelrod's absorbing (frozen) state permanently.
- **Init:** uniform random traits, then ~2,000 warm-up batches before first
  paint so the first visible frame already shows soft regions, not noise.
- All rates (B, innovation, drift, weights, warm-up) live in one exported
  config object for tuning and for Phase 2/3 extension.

### Rendering — "quiet wash"

- Full-viewport `<canvas>` behind all content: `position: fixed`, `inset: 0`,
  `z-index` below content, `aria-hidden="true"`, `pointer-events: none`.
- Visual encoding: *religious* → hue family (leaf green / clay brown / slate /
  sand); *societal* → shade within the family; *economical* → dot size (cells
  render as rounded dots/squares within their 14 px slot); *logical* →
  opacity. Every color is mixed ≈ 85% toward the cream `--bg` — the result
  reads as a soft, slowly drifting mosaic you notice on the second look.
  Hero text contrast never depends on an overlay.
- Palette is precomputed from the earth tokens into a lookup table at init
  (no per-frame color math).
- Dirty-cell rendering: only cells whose culture changed since the last frame
  redraw, with a short lerp (~600 ms) from old to new color so changes bloom
  rather than blink.
- Target cadence: simulation stepped on rAF, visually calm — tuned so a given
  region shifts noticeably over ~10–20 s, not per-second flicker.

### Engineering behavior

- Pause the loop when `document.hidden`; resume on visibility.
- Debounced (~300 ms) rebuild + reseed on resize.
- `prefers-reduced-motion: reduce`: run the warm-up, paint one mature static
  mosaic, never animate. Listen for changes to the media query.
- No-canvas/JS-failure fallback: the page is a normal cream page; nothing
  breaks (canvas is purely decorative).
- Budget: ≤ 9,600 cells, batched interactions per frame — well under a
  millisecond of work per frame on commodity hardware; no allocations in the
  hot loop.

## Testing

Vitest unit tests on `culture.ts` (seeded RNG makes everything deterministic):

- Weighted similarity: identical vectors → 1, fully distinct → 0, known
  partial cases → exact weighted values.
- Interaction rule: copy only happens on a differing feature; identical pairs
  never interact; probability gating respects similarity.
- Innovation: over N interactions, novel traits appear at roughly the
  configured rate.
- Liveness: after a long run (e.g. 50k batches), activity (changes per batch)
  stays above zero — the grid never freezes.
- Warm-up produces regions: mean neighbor-similarity after warm-up
  significantly exceeds the random-init baseline.

Manual verification before finishing: run the dev server, view both routes,
check reduced-motion behavior, tab-hide pause, resize, and hero readability.

## Deployment

Cloudflare Pages project for the root domain, current branch. Build command
`pnpm --filter pravritti build`, output directory `apps/pravritti/dist`.
No server-side code.
