# Culture Sim Phase 2 — Agent Categories

**Date:** 2026-07-03
**Status:** Approved
**Builds on:** `.docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md` (v1)
**App:** `apps/pravritti`

## Overview

v1 ships a uniform-rule Axelrod culture wash: every cell follows the same
homophily + influence rules, and all motion is regions shifting in place.
Phase 2 introduces **typed agents** — the "different categories of cellular
agents with visual and behavioural traits" from the original vision — in two
layers:

1. **Lattice-resident types** (hubs, zealots, open, stubborn) that modulate
   the existing rules through the per-cell `types` byte v1 reserved.
2. **Migrants** — a small pool of freely-moving agents that glide anywhere on
   the canvas (float positions, not grid-snapped), carrying culture across
   regional boundaries. This answers the "freely moving agents across the
   canvas" feedback.

Chosen presentation: **visible figures on quiet ground** — the wash stays
low-contrast; the typed agents are few, small, and clearly visible.

## Goals

- The background gains visible life: gliding migrants with trails, pulsing
  hub rings, fixed zealot pins — without competing with the hero.
- Each agent type has ONE clear behavioral rule and ONE clear visual mark.
- All rules remain pure, seeded-RNG deterministic, config-driven, and
  unit-tested; an all-NORMAL grid behaves exactly like v1.

## Non-goals

- Phase 3 (user influence: cursor as media field, click-to-seed) — its own
  brainstorm later.
- Any change to lattice topology, features, weights, or the quiet-wash
  rendering of ordinary cells.

## Layer 1 — Lattice-resident types (`culture.ts`)

The reserved `CultureGrid.types` byte gets semantics:

| Value | Type | Rule | Story |
|-------|------|------|-------|
| 0 | NORMAL | v1 behavior, unchanged | everyone else |
| 1 | HUB | Broadcasts: each tick, every hub makes `hubPulses` (~2) extra influence attempts at random cells within Chebyshev radius `hubRadius` (~3), similarity-gated as usual | media tower / guru with a sphere of influence |
| 2 | ZEALOT | Its religious feature (index 0) can NEVER change — interaction, drift, and migrant deposits all skip it; other features stay mutable; influences others normally | living anchor; regions crystallize around it |
| 3 | OPEN | Acceptance probability × `openRate` (~1.6, clamped ≤ 1) when receiving influence | cosmopolitan pockets churn faster |
| 4 | STUBBORN | Acceptance probability × `stubbornRate` (~0.45) when receiving influence | holdout pockets resist change |

- **Seeding:** `seedTypes(grid, cfg, rng)` scatters types uniformly at
  random, non-overlapping, after `createGrid`. Fractions/counts in config:
  zealots ~0.4% of cells, open ~8%, stubborn ~8%; hub count computed by the
  canvas from viewport area (clamped ~3–8) and passed in.
- **Backward-compatibility invariant (tested):** all-NORMAL types +
  neutral config (`openRate = stubbornRate = 1`, `hubPulses = 0`) is
  behaviorally identical to v1 — same seed, same grid evolution.
- All new rates live in `CultureConfig` alongside the v1 knobs.

## Layer 2 — Migrants (new pure module `src/lib/agents.ts`)

A small pool of free agents, stored as struct-of-arrays typed arrays:

- **State per migrant:** float x/y in cell units; heading (radians); its own
  culture vector (same 4 features/trait ranges as cells).
- **Movement:** constant gentle glide (~50 css px/s) along its heading;
  heading drifts each tick by small random jitter (smooth wandering, no
  zig-zag); torus wrap at canvas edges.
- **Cultural exchange (the point):** a few times a second, similarity-gated
  Axelrod exchange with the cell underneath, direction 50/50:
  - **Absorb:** migrant copies one differing trait from the cell — its dot
    color visibly shifts as it assimilates into a region.
  - **Deposit:** the cell copies one differing trait from the migrant —
    routed through the same rule path as lattice influence, so zealot
    immunity and open/stubborn rates hold; changed cells are reported so the
    wash blooms along the migrant's path (visible culture streaks).
- **Counts:** ~8–24, scaled to viewport area, in config.
- Pure logic, injected RNG, no DOM — unit-tested like `culture.ts`.

## Rendering (in `CultureCanvas.astro`)

A second transparent canvas, same size and placement, stacked directly above
the wash canvas (still `aria-hidden`, `pointer-events: none`, behind all
content). The wash keeps dirty-cell painting; the agent canvas fully clears
and redraws its ~30 figures every frame (trivial cost):

- **Migrants:** saturated dot in the migrant's current culture color — same
  hue/shade math as cells but WITHOUT the wash-toward-cream (new
  `agentColor()` in `palette.ts`) — with a short fading trail of past
  positions.
- **Hubs:** a soft ring around the hub cell, slowly pulsing (~5 s period),
  stroked in the hub's current family hue at low alpha, plus a small solid
  center dot.
- **Zealots:** a tiny fixed pin-dot in deep brown `#472c1f` — the one logo
  color v1 never used; here it means "roots."
- **Reduced motion:** hub rings + zealot pins drawn once, static (no pulse);
  migrants not drawn at all. Tab-hidden pause freezes both layers as today.
- **Resize:** debounced rebuild reseeds both layers (as v1 does).
- **Failure modes:** same guard style as v1 — no second canvas/ctx means no
  agent layer, wash unaffected; no canvas at all means plain cream page.

## Tuning starting points (all config, tuned by eye during implementation)

- Hubs: 1 per ~220k css px², clamp 3–8. `hubRadius 3`, `hubPulses 2`.
- Zealots 0.4% of cells; open 8%; stubborn 8%.
- Migrants: 1 per ~110k css px², clamp 8–24; speed ~0.045 cells/tick at the
  60 Hz sim step; exchange chance ~8%/tick; trail ~7 ghost points.
- `openRate 1.6`, `stubbornRate 0.45`.

## Testing

Pure vitest, seeded and deterministic, extending the v1 suites:

- **Equivalence:** all-NORMAL grid + neutral config reproduces v1 evolution
  exactly for the same seed.
- **Zealot:** religious trait survives heavy interaction + drift + migrant
  deposits over a long run; other features do change.
- **Openness:** identical grids seeded all-OPEN vs all-STUBBORN show
  accepted-change counts diverging in the right direction.
- **Hub:** on a small grid with one hub, changes concentrate within
  `hubRadius` versus a hub-free control.
- **Migrants:** positions always in bounds (wrap correct); zero-similarity
  cell+migrant never exchange; deposit mutates the cell AND reports it in
  `changed[]`; absorb mutates the migrant; determinism per seed.
- **Seeding:** type counts match config, no overlaps, values only 0–4.

Manual browser QA: figures visible but hero-safe at 1440/2000/390 widths,
reduced-motion static, tab-hide pause, resize reseed.

## Performance budget

~30 extra draws + one full canvas clear per frame; migrant stepping is a few
hundred float ops per tick. Negligible next to the existing wash; no new
allocations in the hot loop (trail buffers preallocated).
