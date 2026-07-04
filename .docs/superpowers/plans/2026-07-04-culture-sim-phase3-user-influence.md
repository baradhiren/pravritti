# Culture Sim Phase 3 — Visitor Influence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The visitor joins the culture sim — the cursor broadcasts a per-visit culture as a local media field, and clicks/taps stamp fresh culture patches that compete by ordinary Axelrod dynamics.

**Architecture:** One new pure module `src/lib/field.ts` (mirrors `agents.ts`: injected RNG, no DOM, own config) holds the media-field tick and the patch stamp, both honoring the shared `influence()` gate / zealot immutability. `CultureCanvas.astro` gains passive window-level pointer wiring, feeds the field into the existing fixed-timestep loop, and draws a cursor aura + click ripples on the existing agent canvas.

**Tech Stack:** Astro 5 + TypeScript, vitest, Canvas 2D. Monorepo: pnpm; app filter `pravritti`.

**Spec:** `.docs/superpowers/specs/2026-07-04-culture-sim-phase3-user-influence-design.md`

## Global Constraints

- `culture.ts` and `agents.ts` MUST NOT change. The golden v1 test (`GOLDEN_V1_HASH = 1748424110` in `culture.test.ts`) must still pass at every commit.
- All visitor influence on lattice cells flows through `influence(grid, cell, vector, 0, cfg, rng)` — never a parallel acceptance rule. The one exception is `stampPatch`, which overwrites wholesale by design but still preserves zealot feature 0 and never touches `types`.
- Pure modules under `src/lib/` use no DOM, no `Date`, no `Math.random` — all randomness through the injected `Rng`.
- Input listeners are passive observers: never call `preventDefault`, never block navigation; both canvases stay `pointer-events: none`.
- Reduced motion (`prefers-reduced-motion: reduce`): Phase 3 is fully inert — no field stepping, no stamping, no aura, no ripple.
- Media field responds to `pointerType` `"mouse"` or `"pen"` only; clicks/taps stamp for all pointer types; clicks whose target is inside `a, button, [role=button]` do nothing.
- Tuning values verbatim: `radius 4`, `attempts 3`, `patchRadius 2.5`, `IDLE_MS 4000`; aura radius `1.3` cell units, alpha `0.35`, breathe `3000` ms, fade `300` ms; ripple `600` ms, `0.5 → 3` cell radii, pool `6`.
- Feature order everywhere: religious(0), logical(1), economical(2), societal(3); `FEATURES = 4`.
- Test suite must be green at every commit: `pnpm --filter pravritti test` (41 existing tests + new ones).
- Commit messages use the `task:` prefix.

## File Structure

- Create `apps/pravritti/src/lib/field.ts` — pure visitor-influence logic: `FieldConfig`, `defaultFieldConfig`, `FieldState`, `randomVector`, `createField`, `stepField`, `stampPatch`.
- Create `apps/pravritti/src/lib/field.test.ts` — seeded deterministic tests, fixtures from `./fixtures`.
- Modify `apps/pravritti/src/components/CultureCanvas.astro` — imports, constants, state, `frame()` integration, `rebuild()` pointer remap, input listeners, aura/ripple drawing in `paintAgents()`, reduced-motion teardown.

Reference signatures already in the codebase (do not modify these files):

```ts
// culture.ts
export type Rng = () => number;
export const FEATURES = 4;
export const TYPE_ZEALOT = 2; export const TYPE_OPEN = 3; export const TYPE_STUBBORN = 4;
export interface CultureGrid { cols: number; rows: number; cells: Uint8Array; types: Uint8Array; hubs: number[]; }
export function influence(grid: CultureGrid, cell: number, src: Uint8Array, srcOff: number, cfg: CultureConfig, rng: Rng): number; // returns changed feature index, or -1
// fixtures.ts (test-only)
export const testConfig: CultureConfig; // neutral rates, driftPerTick 0, innovationRate 0.01
export function setCell(cells: Uint8Array, i: number, traits: number[]): void;
// palette.ts
export function agentColor(religious: number, societal: number, societalCount: number): Rgb; // {r,g,b}
```

---

### Task 1: `field.ts` foundation — config, state, `randomVector`, `createField`, `stampPatch`

**Files:**
- Create: `apps/pravritti/src/lib/field.ts`
- Test: `apps/pravritti/src/lib/field.test.ts`

**Interfaces:**
- Consumes: `FEATURES`, `TYPE_ZEALOT`, `CultureConfig`, `CultureGrid`, `Rng` from `./culture`; `testConfig`, `setCell` from `./fixtures` (tests).
- Produces (Tasks 2–4 rely on these exact names):
  - `interface FieldConfig { radius: number; attempts: number; patchRadius: number }`
  - `const defaultFieldConfig: FieldConfig` = `{ radius: 4, attempts: 3, patchRadius: 2.5 }`
  - `interface FieldState { x: number; y: number; active: boolean; vector: Uint8Array }`
  - `randomVector(cfg: CultureConfig, rng: Rng): Uint8Array`
  - `createField(cfg: CultureConfig, rng: Rng): FieldState`
  - `stampPatch(grid: CultureGrid, cx: number, cy: number, vector: Uint8Array, fieldCfg: FieldConfig, changed: number[]): number`

- [ ] **Step 1: Write the failing tests**

Create `apps/pravritti/src/lib/field.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createGrid, FEATURES, mulberry32, TYPE_OPEN, TYPE_ZEALOT } from "./culture";
import { setCell, testConfig } from "./fixtures";
import {
  createField,
  defaultFieldConfig,
  randomVector,
  stampPatch,
  type FieldConfig,
} from "./field";

const patchCfg: FieldConfig = { ...defaultFieldConfig, patchRadius: 2.5 };

describe("randomVector", () => {
  it("draws every trait within its feature's range", () => {
    const rng = mulberry32(7);
    for (let n = 0; n < 200; n++) {
      const v = randomVector(testConfig, rng);
      expect(v.length).toBe(FEATURES);
      for (let f = 0; f < FEATURES; f++) {
        expect(v[f]).toBeGreaterThanOrEqual(0);
        expect(v[f]).toBeLessThan(testConfig.traitCounts[f]);
      }
    }
  });
});

describe("createField", () => {
  it("starts inactive at the origin with a per-visit culture", () => {
    const field = createField(testConfig, mulberry32(7));
    expect(field.active).toBe(false);
    expect(field.x).toBe(0);
    expect(field.y).toBe(0);
    expect(field.vector.length).toBe(FEATURES);
  });
});

describe("stampPatch", () => {
  it("overwrites exactly the disc within patchRadius and reports each cell once", () => {
    const rng = mulberry32(11);
    const grid = createGrid(20, 20, testConfig, rng);
    const before = grid.cells.slice();
    const vector = Uint8Array.from([1, 2, 3, 4]);
    const changed: number[] = [];
    const stamped = stampPatch(grid, 10.4, 10.6, vector, patchCfg, changed);

    // Disc membership measured in whole-cell offsets from the base cell
    // (floor(cx), floor(cy)) = (10, 10).
    const expected: number[] = [];
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        const dx = x - 10;
        const dy = y - 10;
        if (dx * dx + dy * dy <= 2.5 * 2.5) expected.push(y * 20 + x);
      }
    }
    expect([...changed].sort((a, b) => a - b)).toEqual(expected);
    expect(stamped).toBe(expected.length);
    for (let i = 0; i < 400; i++) {
      for (let f = 0; f < FEATURES; f++) {
        const want = expected.includes(i) ? vector[f] : before[i * FEATURES + f];
        expect(grid.cells[i * FEATURES + f]).toBe(want);
      }
    }
  });

  it("wraps across the torus seam", () => {
    const rng = mulberry32(12);
    const grid = createGrid(20, 20, testConfig, rng);
    const changed: number[] = [];
    stampPatch(grid, 0.2, 0.3, Uint8Array.from([1, 2, 3, 4]), patchCfg, changed);
    // dx = -2, dy = 0 from base cell (0, 0) lands at x = 18 across the seam.
    expect(changed).toContain(18);
  });

  it("preserves a zealot's religious feature but overwrites the rest", () => {
    const rng = mulberry32(13);
    const grid = createGrid(20, 20, testConfig, rng);
    const center = 10 * 20 + 10;
    grid.types[center] = TYPE_ZEALOT;
    setCell(grid.cells, center, [0, 0, 0, 0]);
    stampPatch(grid, 10.5, 10.5, Uint8Array.from([3, 4, 4, 5]), patchCfg, []);
    expect(grid.cells[center * FEATURES]).toBe(0); // religion anchored
    expect(grid.cells[center * FEATURES + 1]).toBe(4);
    expect(grid.cells[center * FEATURES + 2]).toBe(4);
    expect(grid.cells[center * FEATURES + 3]).toBe(5);
  });

  it("never changes any type byte", () => {
    const rng = mulberry32(14);
    const grid = createGrid(20, 20, testConfig, rng);
    grid.types[210] = TYPE_ZEALOT;
    grid.types[211] = TYPE_OPEN;
    const before = grid.types.slice();
    stampPatch(grid, 10.5, 10.5, Uint8Array.from([1, 2, 3, 4]), patchCfg, []);
    expect(grid.types).toEqual(before);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter pravritti exec vitest run src/lib/field.test.ts`
Expected: FAIL — cannot resolve `./field`.

- [ ] **Step 3: Write the implementation**

Create `apps/pravritti/src/lib/field.ts`:

```ts
/**
 * Phase 3 visitor influence: the cursor as a local "media field" and
 * click-stamped culture patches. Pure logic — injected RNG, no DOM.
 * Field attempts route through culture.influence and the stamp preserves
 * zealot anchors, so the Phase 2 rulebook holds against the visitor too.
 * Spec: .docs/superpowers/specs/2026-07-04-culture-sim-phase3-user-influence-design.md
 */
import {
  FEATURES,
  influence,
  TYPE_ZEALOT,
  type CultureConfig,
  type CultureGrid,
  type Rng,
} from "./culture";

export interface FieldConfig {
  /** Chebyshev cell radius of the media field. */
  radius: number;
  /** Influence attempts per sim tick while the field is active. */
  attempts: number;
  /** Euclidean cell radius of a stamped patch. */
  patchRadius: number;
}

export const defaultFieldConfig: FieldConfig = {
  radius: 4,
  attempts: 3,
  patchRadius: 2.5,
};

export interface FieldState {
  /** Pointer position in cell units (float). */
  x: number;
  y: number;
  /** False when idle, off-window, or on touch-only input. */
  active: boolean;
  /** The visitor's culture — FEATURES traits, fixed per visit. */
  vector: Uint8Array;
}

/** Uniform random culture vector within cfg.traitCounts. */
export function randomVector(cfg: CultureConfig, rng: Rng): Uint8Array {
  const v = new Uint8Array(FEATURES);
  for (let f = 0; f < FEATURES; f++) v[f] = Math.floor(rng() * cfg.traitCounts[f]);
  return v;
}

/** Inactive field at the origin with a fresh per-visit culture. */
export function createField(cfg: CultureConfig, rng: Rng): FieldState {
  return { x: 0, y: 0, active: false, vector: randomVector(cfg, rng) };
}

/**
 * Overwrite every cell within Euclidean patchRadius of the base cell
 * (floor(cx), floor(cy)) — torus-wrapped — with `vector`. Zealots keep
 * their immutable religious feature (index 0); no cell's type changes.
 * Touched cells are pushed into `changed`; returns how many were stamped.
 * Assumes 2 * ceil(patchRadius) + 1 <= cols/rows (true for every
 * production grid), so distinct offsets never wrap onto the same cell.
 */
export function stampPatch(
  grid: CultureGrid,
  cx: number,
  cy: number,
  vector: Uint8Array,
  fieldCfg: FieldConfig,
  changed: number[],
): number {
  const r = fieldCfg.patchRadius;
  const ir = Math.ceil(r);
  const bx = Math.min(grid.cols - 1, Math.floor(cx));
  const by = Math.min(grid.rows - 1, Math.floor(cy));
  let stamped = 0;
  for (let dy = -ir; dy <= ir; dy++) {
    for (let dx = -ir; dx <= ir; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = (((bx + dx) % grid.cols) + grid.cols) % grid.cols;
      const y = (((by + dy) % grid.rows) + grid.rows) % grid.rows;
      const cell = y * grid.cols + x;
      const f0 = grid.types[cell] === TYPE_ZEALOT ? 1 : 0;
      for (let f = f0; f < FEATURES; f++) {
        grid.cells[cell * FEATURES + f] = vector[f];
      }
      changed.push(cell);
      stamped++;
    }
  }
  return stamped;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter pravritti exec vitest run src/lib/field.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 5: Run the full suite (golden test must stay green)**

Run: `pnpm --filter pravritti test`
Expected: PASS — 47 tests (41 existing + 6 new), including `golden v1 evolution hash`.

- [ ] **Step 6: Commit**

```bash
git add apps/pravritti/src/lib/field.ts apps/pravritti/src/lib/field.test.ts
git commit -m "task: field.ts foundation — visitor vector + culture patch stamp"
```

---

### Task 2: `field.ts` — `stepField` (the media field)

**Files:**
- Modify: `apps/pravritti/src/lib/field.ts` (append)
- Test: `apps/pravritti/src/lib/field.test.ts` (append)

**Interfaces:**
- Consumes: Task 1's `FieldState`, `FieldConfig`; `influence` from `./culture`.
- Produces (Task 3 relies on this exact name):
  - `stepField(grid: CultureGrid, field: FieldState, cfg: CultureConfig, fieldCfg: FieldConfig, rng: Rng, changed: number[]): number` — returns accepted-change count; no-op (zero RNG draws) while `field.active` is false.

- [ ] **Step 1: Write the failing tests**

Append to `apps/pravritti/src/lib/field.test.ts`. Extend the two import blocks — from `./culture` also import `TYPE_STUBBORN`; from `./field` also import `stepField` and `type FieldState`. Then append:

```ts
describe("stepField", () => {
  it("is a no-op while inactive", () => {
    const rng = mulberry32(21);
    const grid = createGrid(12, 12, testConfig, rng);
    const before = grid.cells.slice();
    const field = createField(testConfig, rng);
    field.x = 6;
    field.y = 6; // parked over the grid but never activated
    const changed: number[] = [];
    let accepted = 0;
    for (let t = 0; t < 500; t++) {
      accepted += stepField(grid, field, testConfig, defaultFieldConfig, rng, changed);
    }
    expect(accepted).toBe(0);
    expect(changed).toEqual([]);
    expect(grid.cells).toEqual(before);
  });

  it("only ever touches cells within the field radius (torus Chebyshev)", () => {
    const rng = mulberry32(22);
    const grid = createGrid(16, 16, testConfig, rng);
    const fcfg: FieldConfig = { ...defaultFieldConfig, radius: 2 };
    const field = createField(testConfig, rng);
    field.active = true;
    field.x = 0.5;
    field.y = 0.5; // base cell (0, 0) — the field spans the seam
    const changed: number[] = [];
    for (let t = 0; t < 2000; t++) stepField(grid, field, testConfig, fcfg, rng, changed);
    expect(changed.length).toBeGreaterThan(0);
    for (const i of changed) {
      const x = i % 16;
      const y = (i / 16) | 0;
      const dx = Math.min(x, 16 - x);
      const dy = Math.min(y, 16 - y);
      expect(Math.max(dx, dy)).toBeLessThanOrEqual(2);
    }
  });

  it("cannot move a zealot's religious anchor", () => {
    const rng = mulberry32(23);
    const cfg = { ...testConfig, innovationRate: 0 };
    const grid = createGrid(8, 8, cfg, rng);
    const target = 4 * 8 + 4;
    grid.types[target] = TYPE_ZEALOT;
    setCell(grid.cells, target, [0, 0, 3, 4]);
    const field: FieldState = {
      x: 4.5,
      y: 4.5,
      active: true,
      vector: Uint8Array.from([1, 2, 3, 4]),
    };
    const fcfg: FieldConfig = { ...defaultFieldConfig, radius: 0 }; // hammer one cell
    for (let t = 0; t < 3000; t++) stepField(grid, field, cfg, fcfg, rng, []);
    expect(grid.cells[target * FEATURES]).toBe(0); // religion anchored
    expect(grid.cells[target * FEATURES + 1]).toBe(2); // the rest assimilated
  });

  it("open pockets accept the visitor faster than stubborn ones", () => {
    const cfg = { ...testConfig, openRate: 1.6, stubbornRate: 0.45 };
    const run = (type: number): number => {
      const rng = mulberry32(31); // identical worlds, identical draws
      const grid = createGrid(10, 10, cfg, rng);
      grid.types.fill(type);
      const field: FieldState = {
        x: 5,
        y: 5,
        active: true,
        vector: randomVector(cfg, rng),
      };
      let accepted = 0;
      for (let t = 0; t < 1500; t++) {
        accepted += stepField(grid, field, cfg, defaultFieldConfig, rng, []);
      }
      return accepted;
    };
    expect(run(TYPE_OPEN)).toBeGreaterThan(run(TYPE_STUBBORN));
  });

  it("pushes exactly the accepted cells into changed", () => {
    const rng = mulberry32(41);
    const grid = createGrid(12, 12, testConfig, rng);
    const field: FieldState = {
      x: 6,
      y: 6,
      active: true,
      vector: randomVector(testConfig, rng),
    };
    const changed: number[] = [];
    let accepted = 0;
    for (let t = 0; t < 500; t++) {
      accepted += stepField(grid, field, testConfig, defaultFieldConfig, rng, changed);
    }
    expect(accepted).toBeGreaterThan(0);
    expect(changed.length).toBe(accepted);
  });

  it("replays identically for the same seed and pointer script", () => {
    const run = (): Uint8Array => {
      const rng = mulberry32(51);
      const grid = createGrid(12, 12, testConfig, rng);
      const field = createField(testConfig, rng);
      field.active = true;
      for (let t = 0; t < 400; t++) {
        field.x = (t * 0.03) % 12;
        field.y = (t * 0.017) % 12;
        stepField(grid, field, testConfig, defaultFieldConfig, rng, []);
        if (t === 200) {
          stampPatch(grid, 3.3, 8.8, randomVector(testConfig, rng), defaultFieldConfig, []);
        }
      }
      return grid.cells.slice();
    };
    expect(run()).toEqual(run());
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `pnpm --filter pravritti exec vitest run src/lib/field.test.ts`
Expected: FAIL — `stepField` is not exported (Task 1's 6 tests still pass).

- [ ] **Step 3: Write the implementation**

Append to `apps/pravritti/src/lib/field.ts`:

```ts
/**
 * Media-field tick: while active, make `attempts` influence attempts at
 * uniform random cells within Chebyshev `radius` of the pointer's base
 * cell (torus-wrapped). Accepted changes are pushed into `changed`;
 * returns how many were accepted. Inactive fields draw no RNG at all.
 * RNG draws per attempt: dx, dy, then influence's own draws.
 */
export function stepField(
  grid: CultureGrid,
  field: FieldState,
  cfg: CultureConfig,
  fieldCfg: FieldConfig,
  rng: Rng,
  changed: number[],
): number {
  if (!field.active) return 0;
  const span = fieldCfg.radius * 2 + 1;
  const bx = Math.min(grid.cols - 1, Math.floor(field.x));
  const by = Math.min(grid.rows - 1, Math.floor(field.y));
  let accepted = 0;
  for (let a = 0; a < fieldCfg.attempts; a++) {
    const dx = Math.floor(rng() * span) - fieldCfg.radius;
    const dy = Math.floor(rng() * span) - fieldCfg.radius;
    const x = (((bx + dx) % grid.cols) + grid.cols) % grid.cols;
    const y = (((by + dy) % grid.rows) + grid.rows) % grid.rows;
    const cell = y * grid.cols + x;
    if (influence(grid, cell, field.vector, 0, cfg, rng) >= 0) {
      changed.push(cell);
      accepted++;
    }
  }
  return accepted;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter pravritti exec vitest run src/lib/field.test.ts`
Expected: PASS — 12 tests.

- [ ] **Step 5: Run the full suite**

Run: `pnpm --filter pravritti test`
Expected: PASS — 53 tests, golden hash included.

- [ ] **Step 6: Commit**

```bash
git add apps/pravritti/src/lib/field.ts apps/pravritti/src/lib/field.test.ts
git commit -m "task: stepField — cursor as a similarity-gated media field"
```

---

### Task 3: Canvas wiring — pointer input drives the field, clicks stamp patches

**Files:**
- Modify: `apps/pravritti/src/components/CultureCanvas.astro`

**Interfaces:**
- Consumes: `createField`, `defaultFieldConfig`, `randomVector`, `stampPatch`, `stepField` from `../lib/field` (Tasks 1–2).
- Produces (Task 4 relies on these): script-level `field` (FieldState), `fcfg`, `cssPerCell`, `lastMoveT`, `IDLE_MS`; the click handler as the place ripples spawn from.

No visuals yet — this task's observable effect is the wash bending near the cursor and blooming at clicks. Verified here by tests/build; behavioral pixel-probe QA lands in Task 4.

- [ ] **Step 1: Add the import**

In the `<script>` block of `apps/pravritti/src/components/CultureCanvas.astro`, after the `../lib/agents` import block (currently lines 25–30), insert:

```ts
  import {
    createField,
    defaultFieldConfig,
    randomVector,
    stampPatch,
    stepField,
  } from "../lib/field";
```

Also add a third spec line to the component's top comment block (lines 1–8):

```
//        .docs/superpowers/specs/2026-07-04-culture-sim-phase3-user-influence-design.md
```

- [ ] **Step 2: Add the constant**

After `const HUB_PULSE_MS = 5000;` (currently line 59), add:

```ts
  const IDLE_MS = 4000; // media field sleeps after this long without movement
```

- [ ] **Step 3: Add Phase 3 state**

After the Phase 2 state block (after `let lastTrailT = 0;`, currently line 93), add:

```ts
    // ---- Phase 3 visitor field (inert under reduced motion) ------------
    const fcfg = defaultFieldConfig;
    /** Per-visit identity: created once, survives rebuilds. */
    const field = createField(cfg, rng);
    let cssPerCell = CELL; // CSS px per cell, for pointer px → cell units
    let lastClientX = 0;
    let lastClientY = 0;
    let lastMoveT = 0;
```

- [ ] **Step 4: Remap the pointer on rebuild**

In `rebuild()`, directly after `cellPx = cellCss * dpr;` (currently line 195), add:

```ts
      cssPerCell = cellCss;
      // Pointer position re-derived against the new cell size.
      field.x = lastClientX / cellCss;
      field.y = lastClientY / cellCss;
```

- [ ] **Step 5: Step the field in the sim loop**

In `frame()`, inside the `while (acc >= STEP_MS)` loop, after the `stepMigrants` line (currently line 267), add:

```ts
        stepField(grid, field, cfg, fcfg, rng, changed);
```

And before the `while` loop (directly after `acc += dt;`, currently line 262), add the idle check:

```ts
      if (field.active && t - lastMoveT >= IDLE_MS) field.active = false;
```

- [ ] **Step 6: Add the input listeners**

After the resize listener (currently lines 325–329), add:

```ts
    // ---- Phase 3: visitor input — passive observers, never preventDefault.
    window.addEventListener("pointermove", (e) => {
      if (reduced.matches) return;
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      field.x = e.clientX / cssPerCell;
      field.y = e.clientY / cssPerCell;
      field.active = true;
      lastMoveT = performance.now();
    });

    // Leaving the window (or losing focus) mutes the field.
    window.addEventListener("pointerout", (e) => {
      if (e.relatedTarget === null) field.active = false;
    });
    window.addEventListener("blur", () => {
      field.active = false;
    });

    window.addEventListener("click", (e) => {
      if (reduced.matches) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el && el.closest("a, button, [role=button]")) return; // navigation stays clean
      const vec = randomVector(cfg, rng);
      const touched: number[] = [];
      stampPatch(grid, e.clientX / cssPerCell, e.clientY / cssPerCell, vec, fcfg, touched);
      for (const i of touched) {
        writeTarget(i);
        animating.add(i);
      }
    });
```

Note: the click handler uses its own `touched` array — the shared `changed` array is reset at the top of each sim tick, so pushing into it from an event handler would lose the entries.

- [ ] **Step 7: Verify suite and build**

Run: `pnpm --filter pravritti test`
Expected: PASS — 53 tests.

Run: `pnpm --filter pravritti build`
Expected: build completes with no errors or type warnings.

- [ ] **Step 8: Commit**

```bash
git add apps/pravritti/src/components/CultureCanvas.astro
git commit -m "task: wire pointer input — media field follows cursor, clicks stamp patches"
```

---

### Task 4: Aura + ripple rendering, reduced-motion inertness, browser QA

**Files:**
- Modify: `apps/pravritti/src/components/CultureCanvas.astro`
- Temporary (delete before commit): `apps/pravritti/public/qa-p3.html`

**Interfaces:**
- Consumes: Task 3's `field`, `lastMoveT`, `IDLE_MS`, click handler; `agentColor` from `../lib/palette` (already imported).
- Produces: final Phase 3 visuals; nothing downstream.

- [ ] **Step 1: Add visual constants**

After `const IDLE_MS = 4000;` (added in Task 3), add:

```ts
  const AURA_RADIUS = 1.3; // cell units
  const AURA_ALPHA = 0.35;
  const AURA_BREATHE_MS = 3000;
  const AURA_FADE_MS = 300;
  const RIPPLE_MS = 600;
  const RIPPLE_FROM = 0.5; // cell units
  const RIPPLE_TO = 3;
  const RIPPLE_POOL = 6;
```

- [ ] **Step 2: Add ripple pool state and spawn helper**

After the Phase 3 state block from Task 3, add:

```ts
    let auraLevel = 0; // 0..1 fade toward (field.active ? 1 : 0)
    /** Preallocated ripple slots: x, y (cell units), start ms, r, g, b. */
    const ripples = new Float32Array(RIPPLE_POOL * 6);
    let rippleSlot = 0;

    function spawnRipple(x: number, y: number, vec: Uint8Array, t: number): void {
      const c = agentColor(vec[0], vec[3], cfg.traitCounts[3]);
      const o = rippleSlot * 6;
      rippleSlot = (rippleSlot + 1) % RIPPLE_POOL;
      ripples[o] = x;
      ripples[o + 1] = y;
      ripples[o + 2] = t;
      ripples[o + 3] = c.r;
      ripples[o + 4] = c.g;
      ripples[o + 5] = c.b;
    }
```

- [ ] **Step 3: Spawn a ripple on click**

In the Task 3 click handler, after the `for (const i of touched)` loop, add:

```ts
      spawnRipple(e.clientX / cssPerCell, e.clientY / cssPerCell, vec, performance.now());
```

- [ ] **Step 4: Fade the aura in the frame loop**

In `frame()`, directly after the idle check added in Task 3 (`if (field.active && t - lastMoveT >= IDLE_MS) ...`), add:

```ts
      const ak = Math.min(dt / AURA_FADE_MS, 1);
      auraLevel += ((field.active ? 1 : 0) - auraLevel) * ak;
```

- [ ] **Step 5: Draw aura and ripples in `paintAgents`**

In `paintAgents(t)`, after the hub-rings `for` loop ends (currently line 161's closing `}`), and BEFORE the migrants section (`// Migrants — hidden entirely under reduced motion.`), add:

```ts
      // Phase 3 visitor marks — fully absent under reduced motion.
      if (!reduced.matches) {
        if (auraLevel > 0.02) {
          const c = agentColor(field.vector[0], field.vector[3], cfg.traitCounts[3]);
          const breathe = 1 + 0.08 * Math.sin((t / AURA_BREATHE_MS) * Math.PI * 2);
          actx.strokeStyle = `rgb(${c.r} ${c.g} ${c.b} / ${AURA_ALPHA * auraLevel})`;
          actx.lineWidth = cellPx * 0.08;
          actx.beginPath();
          actx.arc(field.x * cellPx, field.y * cellPx, cellPx * AURA_RADIUS * breathe, 0, Math.PI * 2);
          actx.stroke();
        }
        for (let s = 0; s < RIPPLE_POOL; s++) {
          const o = s * 6;
          const age = t - ripples[o + 2];
          if (ripples[o + 2] <= 0 || age < 0 || age >= RIPPLE_MS) continue;
          const p = age / RIPPLE_MS;
          const radius = RIPPLE_FROM + (RIPPLE_TO - RIPPLE_FROM) * p;
          actx.strokeStyle = `rgb(${ripples[o + 3]} ${ripples[o + 4]} ${ripples[o + 5]} / ${0.4 * (1 - p)})`;
          actx.lineWidth = cellPx * 0.06;
          actx.beginPath();
          actx.arc(ripples[o] * cellPx, ripples[o + 1] * cellPx, cellPx * radius, 0, Math.PI * 2);
          actx.stroke();
        }
      }
```

- [ ] **Step 6: Tear Phase 3 down when reduced motion switches on**

In the `reduced.addEventListener("change", ...)` handler (currently lines 311–318), extend the `if (reduced.matches)` branch — after `stop();` and before `paintAgents(...)` — with:

```ts
        field.active = false; // Phase 3 goes fully inert
        auraLevel = 0;
        ripples.fill(0);
```

- [ ] **Step 7: Verify suite and build**

Run: `pnpm --filter pravritti test` — Expected: PASS, 53 tests.
Run: `pnpm --filter pravritti build` — Expected: clean.

- [ ] **Step 8: Create the QA probe page**

Create `apps/pravritti/public/qa-p3.html` (temporary — deleted in Step 11):

```html
<!doctype html>
<meta charset="utf-8" />
<title>P3 QA probe</title>
<iframe id="f" src="/" style="width: 1280px; height: 800px; border: 0"></iframe>
<pre id="out"></pre>
<script>
  const log = (s) => (document.getElementById("out").textContent += s + "\n");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const f = document.getElementById("f");
  f.addEventListener("load", async () => {
    try {
      const w = f.contentWindow;
      const d = w.document;
      const wash = d.getElementById("culture-canvas");
      const agents = d.getElementById("agents-canvas");
      const dpr = wash.width / wash.clientWidth;
      const snap = (cv, x, y, r) =>
        cv
          .getContext("2d")
          .getImageData(
            Math.round((x - r) * dpr),
            Math.round((y - r) * dpr),
            Math.round(2 * r * dpr),
            Math.round(2 * r * dpr),
          )
          .data.slice();
      const alphaSum = (px) => {
        let s = 0;
        for (let i = 3; i < px.length; i += 4) s += px[i];
        return s;
      };
      const diff = (a, b) => {
        let n = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
        return n;
      };
      const move = (x, y) =>
        w.dispatchEvent(
          new w.PointerEvent("pointermove", { pointerType: "mouse", clientX: x, clientY: y, bubbles: true }),
        );

      await sleep(600);
      const cx = 300;
      const cy = 620; // empty ground, away from hero and nav

      // 1) Aura appears near the synthetic cursor.
      const auraBefore = alphaSum(snap(agents, cx, cy, 45));
      for (let i = 0; i < 15; i++) {
        move(cx - 15 + i * 2, cy);
        await sleep(30);
      }
      await sleep(400);
      log("aura alpha before/after move: " + auraBefore + " / " + alphaSum(snap(agents, cx, cy, 45)));

      // 2) Ambient wash change (control), then a click stamps a patch.
      const amb0 = snap(wash, cx, cy, 45);
      await sleep(800);
      const ambient = diff(amb0, snap(wash, cx, cy, 45));
      const pre = snap(wash, cx, cy, 45);
      w.dispatchEvent(new w.MouseEvent("click", { clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      await sleep(120);
      log("ripple alpha just after click: " + alphaSum(snap(agents, cx, cy, 70)));
      await sleep(800);
      log("wash diff ambient vs after-click: " + ambient + " / " + diff(pre, snap(wash, cx, cy, 45)));

      // 3) A click on the nav pill must neither stamp nor ripple.
      const pill = d.querySelector("nav a");
      const pr = pill.getBoundingClientRect();
      const nx = pr.left + pr.width / 2;
      const ny = pr.top + pr.height / 2;
      pill.addEventListener("click", (e) => e.preventDefault(), { once: true });
      const navBefore = alphaSum(snap(agents, nx, ny, 70));
      pill.dispatchEvent(new w.MouseEvent("click", { clientX: nx, clientY: ny, bubbles: true, cancelable: true }));
      await sleep(120);
      log("nav-guard aura+ripple alpha before/after: " + navBefore + " / " + alphaSum(snap(agents, nx, ny, 70)));

      log("DONE");
    } catch (err) {
      log("ERROR " + err);
    }
  });
</script>
```

- [ ] **Step 9: Run the probe (normal + reduced motion)**

```bash
pnpm --filter pravritti build
pnpm --filter pravritti preview &   # serves on http://localhost:4321
sleep 2
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --window-size=1400,950 --virtual-time-budget=8000 \
  --dump-dom http://localhost:4321/qa-p3.html 2>/dev/null | grep -A 8 'id="out"'
"$CHROME" --headless --disable-gpu --window-size=1400,950 --virtual-time-budget=8000 \
  --force-prefers-reduced-motion \
  --dump-dom http://localhost:4321/qa-p3.html 2>/dev/null | grep -A 8 'id="out"'
```

Expected (normal run):
- aura alpha after move ≫ before (before ≈ 0 unless a migrant passes through)
- ripple alpha just after click > 0
- wash diff after-click ≫ ambient control
- nav-guard alpha after ≈ before (no jump)
- `DONE`, no `ERROR`

Expected (reduced-motion run):
- aura alpha before and after both ≈ 0
- ripple alpha 0
- wash diff ambient and after-click both 0 (frozen mosaic, inert click)
- `DONE`, no `ERROR`

- [ ] **Step 10: Screenshot sanity + console check**

```bash
"$CHROME" --headless --disable-gpu --window-size=2000,1100 --virtual-time-budget=4000 \
  --screenshot=/tmp/p3-desktop.png http://localhost:4321/ 2>/dev/null
```

View `/tmp/p3-desktop.png`: page identical in character to Phase 2 (no stray rings — the aura must not render before any pointer movement). Then kill the preview server.

- [ ] **Step 11: Delete the probe and commit**

```bash
rm apps/pravritti/public/qa-p3.html
git add apps/pravritti/src/components/CultureCanvas.astro
git commit -m "task: cursor aura + click ripples; phase 3 inert under reduced motion"
```

---

## Verification (whole plan)

- `pnpm --filter pravritti test` → 53 tests green, including `golden v1 evolution hash`.
- `git diff <base>..HEAD -- apps/pravritti/src/lib/culture.ts apps/pravritti/src/lib/agents.ts` → empty.
- `pnpm --filter pravritti build` → clean.
- Probe evidence from Task 4 Step 9 recorded in the task report.
- Mobile taps run the exact same `click` handler verified by the probe (no
  width-dependent logic; `cssPerCell` adapts via the existing resize
  rebuild), and Phase 3 adds no DOM/CSS, so the Phase 2 true-390 layout QA
  still stands.
