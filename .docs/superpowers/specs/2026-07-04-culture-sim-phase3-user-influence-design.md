# Culture Sim Phase 3 — Visitor Influence

**Date:** 2026-07-04
**Status:** Approved
**Builds on:** `.docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md` (v1),
`.docs/superpowers/specs/2026-07-03-culture-sim-phase2-agents-design.md` (Phase 2)
**App:** `apps/pravritti`

## Overview

Phases 1–2 built a society that lives on its own: an Axelrod culture wash
with typed agents (hubs, zealots, open/stubborn pockets, gliding migrants).
Phase 3 lets the visitor join it, in two roles:

1. **Media field (hover, mouse/pen only):** the cursor carries its own
   culture vector — randomized once per visit, "your" identity — and
   continuously makes similarity-gated influence attempts on cells near the
   pointer, like a moving media tower. Regions visibly bend toward your
   culture along your path.
2. **Seed a community (click/tap, all pointers):** a click stamps a small
   disc of cells with a fresh random culture vector. The new community then
   competes, assimilates, or is absorbed by ordinary Axelrod dynamics —
   every click's fate is different.

Presentation stays "visible figures, quiet ground": a faint aura ring marks
the cursor, one quiet ripple marks each click, and the hero still owns the
page.

## Goals

- The background becomes playable without ever announcing itself: hovering
  bends culture, clicking plants it, and the existing bloom shows both.
- All visitor influence flows through the shared `influence()` gate, so the
  Phase 2 rulebook holds against the visitor too: zealots' religious anchor
  resists you, open pockets adopt faster, stubborn ones slower.
- New logic is pure, seeded-RNG deterministic, config-driven, unit-tested;
  an inactive field provably changes nothing.

## Non-goals

- No UI chrome, hints, or copy about interactivity — discovery is the point.
- No changes to `culture.ts`, `agents.ts`, lattice topology, features,
  weights, or type semantics. The golden v1 test stays trivially safe.
- No cursor-affects-migrants coupling (attractor idea rejected in
  brainstorm).
- No persistence of the visitor's culture across visits.

## Simulation — new pure module `src/lib/field.ts`

Mirrors the `agents.ts` pattern: pure, DOM-free, injected `Rng`, own config
interface. State and config:

```ts
export interface FieldConfig {
  radius: number;      // Chebyshev cell radius of the media field (~4)
  attempts: number;    // influence attempts per sim tick while active (~3)
  patchRadius: number; // Euclidean cell radius of a stamped patch (~2.5)
}

export interface FieldState {
  x: number;           // pointer position in cell units (float)
  y: number;
  active: boolean;     // false when idle, off-window, or touch-only
  vector: Uint8Array;  // the visitor's culture (FEATURES traits)
}
```

Two entry points:

- **`stepField(grid, field, cfg, fieldCfg, rng, changed)`** — no-op when
  `field.active` is false. Otherwise makes `attempts` influence attempts per
  tick: each picks a uniform random cell within Chebyshev `radius` of the
  pointer cell (torus-wrapped), and routes the visitor's `vector` through
  `influence(grid, cell, vector, 0, cfg, rng)` — the same call migrant
  deposits use. Changed cells are pushed to `changed[]` so the wash blooms
  along the cursor path.
- **`stampPatch(grid, cx, cy, vector, fieldCfg, changed)`** —
  overwrites every cell within Euclidean `patchRadius` of (cx, cy)
  (torus-wrapped) with `vector`, with two exceptions: zealot cells keep
  their immutable religious feature (index 0), and nobody's *type* byte
  changes — a hub caught in the blast becomes a hub of the new culture.
  All touched cells are pushed to `changed[]`.

Vector creation is a small helper `randomVector(cfg, rng)` (uniform trait
per feature, within `traitCounts`) used for both the per-visit cursor
identity and each click's fresh culture.

## Input model (wired in `CultureCanvas.astro`)

Window-level, passive listeners; **nothing is ever `preventDefault`-ed** —
page semantics are untouched.

- **`pointermove`** (only `pointerType` `"mouse"` or `"pen"`): converts CSS
  px to cell units, updates `field.x/y`, sets `active = true`, resets the
  idle timer. Touch drags never drive the field — they stay pure scroll.
- **Idle fade:** ~4 s without pointer movement sets `active = false` (an
  AFK cursor must not slowly bleach one corner); the next move reactivates.
  Pointer leaving the window (`pointerout` to null / `blur`) deactivates.
- **`click`** (mouse and touch alike — the browser already excludes scroll
  gestures): if the event target is inside an interactive element
  (`closest("a, button, [role=button]")`), do nothing — pressing the Blog
  pill navigates without side effects. Otherwise draw a fresh
  `randomVector`, `stampPatch` at the click point, and spawn a ripple.
- The visitor's cursor `vector` is created once per page load and survives
  resize rebuilds (identity is per visit, not per grid). Grid coordinates
  are recomputed against the new grid on rebuild.

## Rendering (existing agent canvas, in `paintAgents`)

- **Cursor aura:** a soft stroked ring at the pointer, radius ~1.3 cell
  units, in the visitor's culture color via the existing `agentColor()`
  math, low alpha (~0.35), gentle ~3 s breathing. Fades in/out over
  ~300 ms as the field activates/idles.
- **Click ripple:** one-shot ring expanding from ~0.5 to ~3 cell radii over
  ~600 ms, alpha fading to 0, colored with the stamped culture's
  `agentColor()`. Ripples live in a small preallocated pool (~6 slots,
  oldest slot reused) — no hot-loop allocation.
- Both are strokes on the already-cleared-per-frame agent canvas; cost is
  two extra path draws.

## Reduced motion, pause, and failure modes

- **Reduced motion: Phase 3 is fully inert.** No field stepping, no patch
  stamping, no aura, no ripple. The mosaic is frozen anyway — a stamped
  patch could never evolve, and the affordances are pure animation. The
  existing reduced-motion change listener also tears down Phase 3 effects.
- **Tab hidden:** the existing pause freezes everything, field included.
- **No agent canvas/ctx:** aura and ripples are skipped (existing Phase 2
  guard); field and stamp still act on the lattice — the bloom shows them.
- **No canvas at all:** plain cream page, listeners never attached.

## Tuning starting points (config, tuned by eye during implementation)

- `radius 4`, `attempts 3` — a touch stronger than a hub (`hubRadius 3`,
  `hubPulses 2`): the visitor is the loudest broadcaster on the page.
- `patchRadius 2.5` (≈ 21 cells stamped per click).
- Idle timeout 4000 ms; aura alpha 0.35, breathing period 3 s; ripple
  600 ms, pool of 6.

## Testing

Pure vitest, seeded and deterministic, new `field.test.ts` in the style of
`agents.test.ts` (fixtures from `fixtures.ts`):

- **Inactive field is a no-op:** `stepField` with `active: false` leaves the
  grid byte-identical (hash compare) and pushes nothing to `changed[]`.
- **Field radius:** with a seeded run, every cell changed by `stepField`
  lies within Chebyshev `radius` of the pointer cell, including across the
  torus seam.
- **Shared gate:** a zealot's religious feature survives sustained field
  attempts (other features change); all-OPEN vs all-STUBBORN grids under
  the same seeded field diverge in accepted-change counts in the right
  direction.
- **Stamp membership:** exactly the cells within Euclidean `patchRadius`
  are overwritten (including wrap at edges); all written traits are within
  `traitCounts`; `changed[]` lists exactly the touched cells.
- **Stamp exceptions:** a zealot inside the disc keeps feature 0 (others
  overwritten); no cell's `types` byte changes.
- **Determinism:** same seed + same pointer/click script ⇒ identical grids.

Manual browser QA: aura follows the cursor and regions bend at 1440/2000
widths; click blooms a patch that visibly competes over ~30 s; taps stamp
in a true-390 iframe; clicking the Blog pill navigates with no stamp;
reduced-motion page is fully inert to hover and click; tab-hide pause;
console clean.

## Performance budget

~3 influence attempts per 60 Hz tick (a few hundred ops), two stroked
circles per frame, zero hot-loop allocations (ripple pool preallocated).
Noise next to the existing wash and migrant stepping.
