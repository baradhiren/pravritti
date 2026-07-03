# Culture Sim Phase 2 — Agent Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed agents to the Pravritti culture background — hubs, zealots, open/stubborn cells modulating the lattice rules, plus freely-gliding migrants on a second canvas layer.

**Architecture:** The lattice keeps its v1 shape; the reserved `types` byte gains semantics enforced inside a new shared `influence()` primitive (which `interact()` now delegates to), so neighbor influence, hub broadcasts, and migrant deposits all obey the same rules. Migrants live in a new pure module `agents.ts` (float positions, injected RNG). Rendering adds a second transparent canvas above the wash: full clear + ~30 figures per frame.

**Tech Stack:** Same as v1 — TypeScript in Astro 5, vitest ^4.1.9, canvas 2D. No new dependencies.

**Spec:** `.docs/superpowers/specs/2026-07-03-culture-sim-phase2-agents-design.md`
**v1 spec:** `.docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md`

## Global Constraints

- Run all commands from the repo root. Test command: `pnpm --filter pravritti test`. Typecheck: `pnpm --filter pravritti exec tsc --noEmit`.
- Commit messages use the `task:` prefix and end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- `culture.ts` and `agents.ts` stay PURE: no DOM, no `Date`, no `Math.random`; all randomness via injected `Rng`.
- Feature order everywhere: 0=religious, 1=logical, 2=economical, 3=societal. `FEATURES = 4`.
- Type byte semantics: `0 NORMAL, 1 HUB, 2 ZEALOT, 3 OPEN, 4 STUBBORN`.
- **Neutral-path equivalence is non-negotiable:** an untyped grid with neutral config (`openRate=1, stubbornRate=1, hubPulses=0`, zero fractions, empty `hubs`) must take the *identical RNG-draw path* as v1 — guarded by a golden-hash test captured from unmodified v1 code in Task 1 Step 1. All 25 existing v1 tests must keep passing unchanged (except the mechanical `testConfig` literal extension).
- Migrant deposits MUST route through `influence()` so zealot immunity and open/stubborn rates hold for the receiving cell.
- Do not touch `packages/config`, `apps/hiren`, pages, or layouts. Only `apps/pravritti/src/lib/*` and `CultureCanvas.astro`.
- The agent canvas is decorative like the wash: `aria-hidden="true"`, `pointer-events: none`, behind content; missing canvas/ctx degrades silently (wash unaffected; no canvas at all → plain cream page).
- Reduced motion: hub rings + zealot pins render once, static; migrants are not drawn at all.

---

### Task 1: Type constants, config fields, `seedTypes`, and the v1 golden test

**Files:**
- Modify: `apps/pravritti/src/lib/culture.ts`
- Test: `apps/pravritti/src/lib/culture.test.ts`

**Interfaces:**
- Consumes: existing v1 exports (`CultureConfig`, `CultureGrid`, `createGrid`, `stepBatch`, `mulberry32`).
- Produces (used by Tasks 2, 3, 5):
  - `const TYPE_NORMAL = 0`, `TYPE_HUB = 1`, `TYPE_ZEALOT = 2`, `TYPE_OPEN = 3`, `TYPE_STUBBORN = 4`
  - `CultureConfig` gains REQUIRED fields: `openRate, stubbornRate, hubRadius, hubPulses, zealotFraction, openFraction, stubbornFraction` (all `number`)
  - `CultureGrid` gains `hubs: number[]` (empty from `createGrid`)
  - `seedTypes(grid: CultureGrid, hubCount: number, cfg: CultureConfig, rng: Rng): void` — resets all types, places hubs (filling `grid.hubs`), then zealots/open/stubborn by fraction, at distinct random cells.

- [ ] **Step 1: Capture the v1 golden hash from UNMODIFIED code**

Before touching anything, create a throwaway file `apps/pravritti/src/lib/_golden.test.ts`:

```ts
import { describe, it } from "vitest";
import { createGrid, mulberry32, stepBatch, type CultureConfig } from "./culture";

describe("golden capture", () => {
  it("prints the v1 hash", () => {
    const cfg: CultureConfig = {
      traitCounts: [4, 5, 5, 6],
      weights: [0.4, 0.15, 0.2, 0.25],
      batchSize: 8,
      innovationRate: 0.01,
      driftPerTick: 0.4,
      warmupTicks: 0,
    };
    const grid = createGrid(8, 8, cfg, mulberry32(99));
    const rng = mulberry32(1234);
    const changed: number[] = [];
    for (let t = 0; t < 500; t++) {
      changed.length = 0;
      stepBatch(grid, cfg, rng, changed);
    }
    let h = 2166136261;
    for (const c of grid.cells) h = Math.imul(h ^ c, 16777619) >>> 0;
    throw new Error(`GOLDEN_V1_HASH = ${h}`);
  });
});
```

Run: `pnpm --filter pravritti exec vitest run src/lib/_golden.test.ts`
Expected: 1 failed test whose error message prints `GOLDEN_V1_HASH = <number>`. **Record that number**, then delete the file:

```bash
rm apps/pravritti/src/lib/_golden.test.ts
```

- [ ] **Step 2: Write the failing tests (append to `culture.test.ts`)**

Add `seedTypes`, `TYPE_HUB`, `TYPE_OPEN`, `TYPE_STUBBORN`, `TYPE_ZEALOT` to the existing import from `./culture`. Append (replace `<GOLDEN>` with the number from Step 1):

```ts
const GOLDEN_V1_HASH = <GOLDEN>; // captured from unmodified v1 code (Task 1 Step 1)

describe("v1 neutral-path equivalence", () => {
  it("neutral config + untyped grid reproduces the v1 evolution exactly", () => {
    const grid = createGrid(8, 8, testConfig, mulberry32(99));
    const rng = mulberry32(1234);
    const changed: number[] = [];
    for (let t = 0; t < 500; t++) {
      changed.length = 0;
      stepBatch(grid, { ...testConfig, driftPerTick: 0.4 }, rng, changed);
    }
    let h = 2166136261;
    for (const c of grid.cells) h = Math.imul(h ^ c, 16777619) >>> 0;
    expect(h).toBe(GOLDEN_V1_HASH);
  });
});

describe("seedTypes", () => {
  it("places the configured counts without overlap and fills hubs[]", () => {
    const cfg: CultureConfig = {
      ...testConfig,
      zealotFraction: 0.05,
      openFraction: 0.1,
      stubbornFraction: 0.1,
    };
    const grid = createGrid(20, 20, cfg, mulberry32(5));
    seedTypes(grid, 4, cfg, mulberry32(6));
    const counts = [0, 0, 0, 0, 0];
    for (const t of grid.types) counts[t]++;
    expect(counts[TYPE_HUB]).toBe(4);
    expect(counts[TYPE_ZEALOT]).toBe(Math.round(400 * 0.05));
    expect(counts[TYPE_OPEN]).toBe(Math.round(400 * 0.1));
    expect(counts[TYPE_STUBBORN]).toBe(Math.round(400 * 0.1));
    expect(grid.hubs).toHaveLength(4);
    for (const h of grid.hubs) expect(grid.types[h]).toBe(TYPE_HUB);
  });

  it("is deterministic and resets previous seeding", () => {
    const cfg: CultureConfig = { ...testConfig, zealotFraction: 0.02 };
    const a = createGrid(16, 16, cfg, mulberry32(1));
    const b = createGrid(16, 16, cfg, mulberry32(1));
    seedTypes(a, 3, cfg, mulberry32(2));
    seedTypes(a, 3, cfg, mulberry32(2)); // reseed must not accumulate
    seedTypes(b, 3, cfg, mulberry32(2));
    expect(a.types).toEqual(b.types);
    expect(a.hubs).toEqual(b.hubs);
  });
});
```

Note: the golden test passes only after Step 4 updates `testConfig`; the seedTypes tests fail on the missing exports first — that's the RED.

- [ ] **Step 3: Run tests to verify the new ones fail**

Run: `pnpm --filter pravritti test`
Expected: FAIL — `seedTypes`/`TYPE_*` not exported (import error takes the whole file RED). This is expected; prior tests recover in Step 5.

- [ ] **Step 4: Implement in `culture.ts` and extend `testConfig`**

In `culture.ts`, add below the `FEATURES` constant:

```ts
/** Agent categories stored in CultureGrid.types (Phase 2). */
export const TYPE_NORMAL = 0;
export const TYPE_HUB = 1;
export const TYPE_ZEALOT = 2;
export const TYPE_OPEN = 3;
export const TYPE_STUBBORN = 4;
```

Extend `CultureConfig` (append fields to the interface) and `defaultConfig`:

```ts
  /** Acceptance multiplier when the receiving cell is OPEN. */
  openRate: number;
  /** Acceptance multiplier when the receiving cell is STUBBORN. */
  stubbornRate: number;
  /** Chebyshev reach of a hub's broadcast pulses. */
  hubRadius: number;
  /** Extra influence attempts each hub makes per tick. */
  hubPulses: number;
  /** Fractions of cells seeded as zealot / open / stubborn. */
  zealotFraction: number;
  openFraction: number;
  stubbornFraction: number;
```

```ts
  // in defaultConfig:
  openRate: 1.6,
  stubbornRate: 0.45,
  hubRadius: 3,
  hubPulses: 2,
  zealotFraction: 0.004,
  openFraction: 0.08,
  stubbornFraction: 0.08,
```

Extend `CultureGrid` with `/** Hub cell indices, filled by seedTypes (empty in v1 mode). */ hubs: number[];` and change `createGrid`'s return to `{ cols, rows, cells, types: new Uint8Array(cols * rows), hubs: [] }`.

Append `seedTypes` (after `neighborIndex`):

```ts
/** Place `count` cells of `type` at distinct random NORMAL cells. */
function placeType(grid: CultureGrid, count: number, type: number, rng: Rng): number[] {
  const placed: number[] = [];
  const n = grid.cols * grid.rows;
  while (placed.length < count) {
    const i = Math.floor(rng() * n);
    if (grid.types[i] === TYPE_NORMAL) {
      grid.types[i] = type;
      placed.push(i);
    }
  }
  return placed;
}

/**
 * Seed agent categories onto a grid: hubs first (indices recorded in
 * grid.hubs), then zealots/open/stubborn by fraction. Resets any previous
 * seeding. Callers keep hubCount + fractions well below the cell count
 * (defaults total ~17%) so rejection sampling terminates fast.
 */
export function seedTypes(
  grid: CultureGrid,
  hubCount: number,
  cfg: CultureConfig,
  rng: Rng,
): void {
  grid.types.fill(TYPE_NORMAL);
  const n = grid.cols * grid.rows;
  grid.hubs = placeType(grid, hubCount, TYPE_HUB, rng);
  placeType(grid, Math.round(n * cfg.zealotFraction), TYPE_ZEALOT, rng);
  placeType(grid, Math.round(n * cfg.openFraction), TYPE_OPEN, rng);
  placeType(grid, Math.round(n * cfg.stubbornFraction), TYPE_STUBBORN, rng);
}
```

In `culture.test.ts`, extend the `testConfig` literal with NEUTRAL values (this keeps every v1 test and the golden test on the v1 path):

```ts
export const testConfig: CultureConfig = {
  traitCounts: [4, 5, 5, 6],
  weights: [0.4, 0.15, 0.2, 0.25],
  batchSize: 8,
  innovationRate: 0.01,
  driftPerTick: 0,
  warmupTicks: 0,
  openRate: 1,
  stubbornRate: 1,
  hubRadius: 3,
  hubPulses: 0,
  zealotFraction: 0,
  openFraction: 0,
  stubbornFraction: 0,
};
```

- [ ] **Step 5: Run tests to verify all pass**

Run: `pnpm --filter pravritti test`
Expected: PASS — all 25 v1 tests plus the 3 new ones (golden hash matches because nothing behavioral changed yet). If the golden test fails here, STOP: the capture and the test are not equivalent — recheck both use the same seeds/config.

- [ ] **Step 6: Commit**

```bash
git add apps/pravritti/src/lib/culture.ts apps/pravritti/src/lib/culture.test.ts
git commit -m "task: type constants, seedTypes, and v1 golden equivalence test

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Rule modulation — `influence()`, openness, zealots, hub broadcasts

**Files:**
- Modify: `apps/pravritti/src/lib/culture.ts`
- Test: `apps/pravritti/src/lib/culture.test.ts`

**Interfaces:**
- Consumes: Task 1's constants/config/`hubs`.
- Produces (used by Task 3):
  - `influence(grid: CultureGrid, cell: number, src: Uint8Array, srcOff: number, cfg: CultureConfig, rng: Rng): number` — one gated influence attempt onto `cell` from an arbitrary culture vector; returns changed feature or -1. RNG draw order (identical to v1 `interact`): acceptance, feature pick, innovation, [novel trait].
  - `interact` keeps its exact v1 signature and delegates to `influence`.
  - `stepBatch` additionally runs hub pulses (between the interaction batch and drift) and skips feature 0 in drift for zealots.

- [ ] **Step 1: Write the failing tests (append to `culture.test.ts`)**

Add nothing new to imports except what's used below (`TYPE_HUB`, `TYPE_OPEN`, `TYPE_STUBBORN`, `TYPE_ZEALOT` already imported in Task 1). Append:

```ts
describe("agent-type rules", () => {
  it("open cells accept more influence than stubborn cells", () => {
    const cfg: CultureConfig = {
      ...testConfig,
      batchSize: 64,
      openRate: 1.6,
      stubbornRate: 0.45,
    };
    const run = (type: number): number => {
      const grid = createGrid(12, 12, cfg, mulberry32(42));
      grid.types.fill(type);
      const rng = mulberry32(7);
      const changed: number[] = [];
      let total = 0;
      for (let t = 0; t < 100; t++) {
        changed.length = 0;
        total += stepBatch(grid, cfg, rng, changed);
      }
      return total;
    };
    // Acceptance scales ~3.5x between the two; a 1.3x margin over a short
    // window is a conservative check that the rate actually applies.
    expect(run(TYPE_OPEN)).toBeGreaterThan(run(TYPE_STUBBORN) * 1.3);
  });

  it("zealots never change their religious trait", () => {
    const cfg: CultureConfig = { ...testConfig, driftPerTick: 0.5 };
    const grid = createGrid(10, 10, cfg, mulberry32(3));
    grid.types.fill(TYPE_ZEALOT);
    const before = new Uint8Array(100);
    for (let i = 0; i < 100; i++) before[i] = grid.cells[i * FEATURES];
    const rng = mulberry32(11);
    const changed: number[] = [];
    let changes = 0;
    for (let t = 0; t < 1500; t++) {
      changed.length = 0;
      changes += stepBatch(grid, cfg, rng, changed);
    }
    for (let i = 0; i < 100; i++) expect(grid.cells[i * FEATURES]).toBe(before[i]);
    expect(changes).toBeGreaterThan(0); // non-religious features still evolve
  });

  it("no interaction fires when only the protected feature differs", () => {
    const grid = createGrid(2, 1, testConfig, mulberry32(1));
    grid.types[0] = TYPE_ZEALOT;
    setCell(grid.cells, 0, [0, 2, 3, 4]);
    setCell(grid.cells, 1, [1, 2, 3, 4]); // differs only on religious
    // Forced accept (0.0 < sim 0.6) must still bail: nothing pickable.
    expect(interact(grid, 0, 1, testConfig, seqRng([0.0]))).toBe(-1);
    expect(grid.cells.slice(0, 4)).toEqual(Uint8Array.from([0, 2, 3, 4]));
  });

  it("hub broadcasts concentrate within hubRadius", () => {
    const cfg: CultureConfig = {
      ...testConfig,
      batchSize: 0,
      innovationRate: 0,
      hubPulses: 4,
      hubRadius: 2,
    };
    const grid = createGrid(15, 15, cfg, mulberry32(1));
    for (let i = 0; i < 225; i++) setCell(grid.cells, i, [0, 0, 0, 0]);
    const hub = 7 * 15 + 7; // dead center — radius 2 never wraps
    setCell(grid.cells, hub, [0, 0, 0, 1]); // differs on societal → sim 0.75
    grid.types[hub] = TYPE_HUB;
    grid.hubs = [hub];
    const rng = mulberry32(9);
    const changed: number[] = [];
    let total = 0;
    for (let t = 0; t < 300; t++) {
      changed.length = 0;
      stepBatch(grid, cfg, rng, changed);
      for (const i of changed) {
        const dx = Math.abs((i % 15) - 7);
        const dy = Math.abs(((i / 15) | 0) - 7);
        expect(Math.max(dx, dy)).toBeLessThanOrEqual(2);
        total++;
      }
    }
    expect(total).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm --filter pravritti test`
Expected: the four new tests FAIL (rates not applied, zealot trait changes, hub makes no changes with batchSize 0); all prior tests PASS.

- [ ] **Step 3: Implement in `culture.ts`**

Add below `differentTrait`:

```ts
/** Acceptance multiplier for the receiving cell's agent type. */
function typeRate(type: number, cfg: CultureConfig): number {
  if (type === TYPE_OPEN) return cfg.openRate;
  if (type === TYPE_STUBBORN) return cfg.stubbornRate;
  return 1;
}

/**
 * One homophily-gated influence attempt onto `cell` from an arbitrary
 * culture vector (`src` at `srcOff`). Neighbor influence, hub broadcasts,
 * and migrant deposits all route through here so agent-type rules hold
 * everywhere. Returns the changed feature index, or -1.
 * RNG draw order (identical to v1): acceptance, feature pick, innovation,
 * [novel trait].
 */
export function influence(
  grid: CultureGrid,
  cell: number,
  src: Uint8Array,
  srcOff: number,
  cfg: CultureConfig,
  rng: Rng,
): number {
  let sim = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] === src[srcOff + f]) sim += cfg.weights[f];
  }
  if (sim >= 1) return -1; // identical — nothing to exchange
  if (rng() >= sim * typeRate(grid.types[cell], cfg)) return -1; // homophily gate

  // Zealots never change their religious feature (index 0).
  const f0 = grid.types[cell] === TYPE_ZEALOT ? 1 : 0;
  let nDiff = 0;
  for (let f = f0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] !== src[srcOff + f]) nDiff++;
  }
  if (nDiff === 0) return -1; // only the protected feature differs
  let k = Math.floor(rng() * nDiff);
  let feature = f0;
  for (let f = f0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] !== src[srcOff + f] && k-- === 0) {
      feature = f;
      break;
    }
  }

  const at = cell * FEATURES + feature;
  grid.cells[at] =
    rng() < cfg.innovationRate
      ? differentTrait(cfg.traitCounts[feature], grid.cells[at], rng)
      : src[srcOff + feature];
  return feature;
}
```

Replace the BODY of `interact` (signature unchanged) with delegation:

```ts
export function interact(
  grid: CultureGrid,
  cell: number,
  nbr: number,
  cfg: CultureConfig,
  rng: Rng,
): number {
  if (cell === nbr) return -1;
  return influence(grid, cell, grid.cells, nbr * FEATURES, cfg, rng);
}
```

In `stepBatch`, insert hub pulses between the interaction loop and the drift block:

```ts
  // Hub broadcasts: outsized reach within hubRadius, same gates as everyone.
  for (const hub of grid.hubs) {
    for (let p = 0; p < cfg.hubPulses; p++) {
      const dx = Math.floor(rng() * (2 * cfg.hubRadius + 1)) - cfg.hubRadius;
      const dy = Math.floor(rng() * (2 * cfg.hubRadius + 1)) - cfg.hubRadius;
      const x = ((hub % grid.cols) + dx + grid.cols) % grid.cols;
      const y = (((hub / grid.cols) | 0) + dy + grid.rows) % grid.rows;
      const targetCell = y * grid.cols + x;
      if (interact(grid, targetCell, hub, cfg, rng) >= 0) {
        changed.push(targetCell);
        count++;
      }
    }
  }
```

And make drift zealot-aware — replace the drift body's feature pick:

```ts
  for (let i = 0; i < drifts; i++) {
    const cell = Math.floor(rng() * n);
    const f =
      grid.types[cell] === TYPE_ZEALOT
        ? 1 + Math.floor(rng() * (FEATURES - 1))
        : Math.floor(rng() * FEATURES);
    const at = cell * FEATURES + f;
    grid.cells[at] = differentTrait(cfg.traitCounts[f], grid.cells[at], rng);
    changed.push(cell);
    count++;
  }
```

(Neutral-path check you can do by eye: with zero types, `typeRate` is 1, `f0` is 0, the `nDiff === 0` guard can't trigger when `sim < 1`, empty `hubs` skips the pulse loop without consuming RNG, and the non-zealot drift pick is the same single draw — so the RNG stream is byte-identical to v1. The golden test enforces this.)

- [ ] **Step 4: Run tests to verify all pass — especially the golden test**

Run: `pnpm --filter pravritti test`
Expected: ALL PASS, including `v1 neutral-path equivalence` (this is the proof the refactor didn't shift any RNG draw) and every v1 `interact` test (their seqRng sequences encode the draw order). If the golden test fails, the refactor changed the draw path — diff your `influence` against this plan, do NOT re-capture the golden value.

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/culture.ts apps/pravritti/src/lib/culture.test.ts
git commit -m "task: agent-type rules — openness, zealots, hub broadcasts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Migrant layer — `agents.ts`

**Files:**
- Create: `apps/pravritti/src/lib/agents.ts`
- Test: `apps/pravritti/src/lib/agents.test.ts`

**Interfaces:**
- Consumes: `FEATURES`, `influence`, `TYPE_ZEALOT`, types `CultureConfig`/`CultureGrid`/`Rng` from `./culture`; test helpers `testConfig`, `setCell` from `./culture.test`.
- Produces (used by Task 5):
  - `interface MigrantConfig { speed: number; turnJitter: number; exchangeRate: number }` and `const defaultMigrantConfig: MigrantConfig` (`{ speed: 0.045, turnJitter: 0.05, exchangeRate: 0.08 }`)
  - `interface MigrantPool { count: number; x: Float32Array; y: Float32Array; heading: Float32Array; cells: Uint8Array }`
  - `createMigrants(count: number, grid: CultureGrid, cfg: CultureConfig, rng: Rng): MigrantPool`
  - `cellUnder(pool: MigrantPool, m: number, grid: CultureGrid): number`
  - `stepMigrants(pool: MigrantPool, grid: CultureGrid, cfg: CultureConfig, mcfg: MigrantConfig, rng: Rng, changed: number[]): number` — moves everyone, maybe exchanges; deposits push cell indices into `changed`; returns deposit count.

- [ ] **Step 1: Write the failing tests**

`apps/pravritti/src/lib/agents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createGrid,
  FEATURES,
  mulberry32,
  TYPE_ZEALOT,
  type CultureConfig,
} from "./culture";
import { setCell, testConfig } from "./culture.test";
import {
  cellUnder,
  createMigrants,
  stepMigrants,
  type MigrantConfig,
} from "./agents";

/** Stationary migrant that tries to exchange every tick. */
const still: MigrantConfig = { speed: 0, turnJitter: 0, exchangeRate: 1 };

describe("createMigrants", () => {
  it("spawns in bounds with valid traits, deterministically", () => {
    const grid = createGrid(10, 8, testConfig, mulberry32(1));
    const a = createMigrants(12, grid, testConfig, mulberry32(4));
    const b = createMigrants(12, grid, testConfig, mulberry32(4));
    expect(a.x).toEqual(b.x);
    expect(a.cells).toEqual(b.cells);
    for (let m = 0; m < 12; m++) {
      expect(a.x[m]).toBeGreaterThanOrEqual(0);
      expect(a.x[m]).toBeLessThan(10);
      expect(a.y[m]).toBeGreaterThanOrEqual(0);
      expect(a.y[m]).toBeLessThan(8);
      for (let f = 0; f < FEATURES; f++) {
        expect(a.cells[m * FEATURES + f]).toBeLessThan(testConfig.traitCounts[f]);
      }
    }
  });
});

describe("movement", () => {
  it("glides straight with zero jitter and wraps on the torus", () => {
    const grid = createGrid(6, 6, testConfig, mulberry32(2));
    const pool = createMigrants(1, grid, testConfig, mulberry32(3));
    pool.x[0] = 5.9;
    pool.y[0] = 2;
    pool.heading[0] = 0; // heading 0 → +x
    const mcfg: MigrantConfig = { speed: 0.2, turnJitter: 0, exchangeRate: 0 };
    const changed: number[] = [];
    stepMigrants(pool, grid, testConfig, mcfg, mulberry32(5), changed);
    expect(pool.x[0]).toBeCloseTo(0.1, 4); // 5.9 + 0.2 wraps past 6
    expect(pool.y[0]).toBeCloseTo(2, 4);
  });

  it("stays in bounds over a long wander and cellUnder stays valid", () => {
    const grid = createGrid(6, 6, testConfig, mulberry32(2));
    const pool = createMigrants(3, grid, testConfig, mulberry32(3));
    const wander: MigrantConfig = { speed: 0.31, turnJitter: 0.4, exchangeRate: 0 };
    const rng = mulberry32(6);
    const changed: number[] = [];
    for (let t = 0; t < 5000; t++) {
      stepMigrants(pool, grid, testConfig, wander, rng, changed);
      for (let m = 0; m < 3; m++) {
        expect(pool.x[m]).toBeGreaterThanOrEqual(0);
        expect(pool.x[m]).toBeLessThan(6);
        expect(pool.y[m]).toBeGreaterThanOrEqual(0);
        expect(pool.y[m]).toBeLessThan(6);
        const cell = cellUnder(pool, m, grid);
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(36);
      }
    }
  });
});

describe("cultural exchange", () => {
  it("never exchanges across zero similarity", () => {
    const grid = createGrid(4, 4, testConfig, mulberry32(1));
    for (let i = 0; i < 16; i++) setCell(grid.cells, i, [0, 0, 0, 0]);
    const pool = createMigrants(1, grid, testConfig, mulberry32(2));
    pool.cells.set([1, 1, 1, 1]);
    const gridBefore = grid.cells.slice();
    const poolBefore = pool.cells.slice();
    const changed: number[] = [];
    const rng = mulberry32(3);
    for (let t = 0; t < 500; t++) {
      expect(stepMigrants(pool, grid, testConfig, still, rng, changed)).toBe(0);
    }
    expect(grid.cells).toEqual(gridBefore);
    expect(pool.cells).toEqual(poolBefore);
    expect(changed).toHaveLength(0);
  });

  it("a stationary migrant and its cell converge through two-way exchange", () => {
    const cfg: CultureConfig = { ...testConfig, innovationRate: 0 };
    const grid = createGrid(4, 4, cfg, mulberry32(1));
    for (let i = 0; i < 16; i++) setCell(grid.cells, i, [0, 2, 3, 4]);
    const pool = createMigrants(1, grid, cfg, mulberry32(2));
    pool.x[0] = 1.5;
    pool.y[0] = 1.5;
    pool.cells.set([0, 2, 0, 0]); // shares religious+logical → sim 0.55
    const cell = cellUnder(pool, 0, grid);
    const changed: number[] = [];
    const rng = mulberry32(9);
    let deposits = 0;
    for (let t = 0; t < 2000; t++) {
      changed.length = 0;
      const d = stepMigrants(pool, grid, cfg, still, rng, changed);
      deposits += d;
      if (d > 0) expect(changed).toContain(cell);
    }
    for (let f = 0; f < FEATURES; f++) {
      expect(pool.cells[f]).toBe(grid.cells[cell * FEATURES + f]);
    }
    expect(deposits).toBeGreaterThan(0); // deposits actually fired
  });

  it("respects zealot immunity on deposits while the migrant assimilates", () => {
    const cfg: CultureConfig = { ...testConfig, innovationRate: 0 };
    const grid = createGrid(4, 4, cfg, mulberry32(1));
    for (let i = 0; i < 16; i++) setCell(grid.cells, i, [2, 2, 3, 4]);
    grid.types.fill(TYPE_ZEALOT);
    const pool = createMigrants(1, grid, cfg, mulberry32(2));
    pool.x[0] = 2.5;
    pool.y[0] = 2.5;
    pool.cells.set([0, 2, 3, 4]); // differs ONLY on religious
    const before = grid.cells.slice();
    const changed: number[] = [];
    const rng = mulberry32(7);
    for (let t = 0; t < 1500; t++) {
      expect(stepMigrants(pool, grid, cfg, still, rng, changed)).toBe(0);
    }
    expect(grid.cells).toEqual(before); // zealots never took the migrant's religion
    expect(pool.cells[0]).toBe(2); // the migrant assimilated instead
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter pravritti test agents`
Expected: FAIL — `Cannot find module './agents'`.

- [ ] **Step 3: Write `apps/pravritti/src/lib/agents.ts`**

```ts
/**
 * Phase 2 migrant layer: freely-moving agents that glide over the culture
 * lattice, absorbing traits from regions they cross and depositing their
 * own. Pure logic — injected RNG, no DOM. Deposits route through
 * culture.influence so zealot immunity and open/stubborn rates hold for
 * the receiving cell.
 * Spec: .docs/superpowers/specs/2026-07-03-culture-sim-phase2-agents-design.md
 */
import {
  FEATURES,
  influence,
  type CultureConfig,
  type CultureGrid,
  type Rng,
} from "./culture";

export interface MigrantConfig {
  /** Glide speed in cell units per tick. */
  speed: number;
  /** Max |heading change| in radians per tick (smooth wander). */
  turnJitter: number;
  /** Chance per migrant per tick of attempting a cultural exchange. */
  exchangeRate: number;
}

export const defaultMigrantConfig: MigrantConfig = {
  speed: 0.045,
  turnJitter: 0.05,
  exchangeRate: 0.08,
};

export interface MigrantPool {
  count: number;
  /** Position in cell units: x in [0, cols), y in [0, rows). */
  x: Float32Array;
  y: Float32Array;
  /** Travel direction in radians. */
  heading: Float32Array;
  /** count × FEATURES culture traits. */
  cells: Uint8Array;
}

/** Random pool: uniform positions, headings, and cultures. */
export function createMigrants(
  count: number,
  grid: CultureGrid,
  cfg: CultureConfig,
  rng: Rng,
): MigrantPool {
  const pool: MigrantPool = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    heading: new Float32Array(count),
    cells: new Uint8Array(count * FEATURES),
  };
  for (let m = 0; m < count; m++) {
    pool.x[m] = rng() * grid.cols;
    pool.y[m] = rng() * grid.rows;
    pool.heading[m] = rng() * Math.PI * 2;
    for (let f = 0; f < FEATURES; f++) {
      pool.cells[m * FEATURES + f] = Math.floor(rng() * cfg.traitCounts[f]);
    }
  }
  return pool;
}

/** Lattice index of the cell migrant m is currently over. */
export function cellUnder(pool: MigrantPool, m: number, grid: CultureGrid): number {
  // Clamp guards the float32 edge case where x rounds up to exactly cols.
  const cx = Math.min(grid.cols - 1, Math.floor(pool.x[m]));
  const cy = Math.min(grid.rows - 1, Math.floor(pool.y[m]));
  return cy * grid.cols + cx;
}

function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}

/** Similarity-gated copy of one differing cell trait onto migrant m. */
function absorb(
  pool: MigrantPool,
  m: number,
  grid: CultureGrid,
  cell: number,
  cfg: CultureConfig,
  rng: Rng,
): boolean {
  let sim = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (pool.cells[m * FEATURES + f] === grid.cells[cell * FEATURES + f]) {
      sim += cfg.weights[f];
    }
  }
  if (sim >= 1) return false;
  if (rng() >= sim) return false;
  let nDiff = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (pool.cells[m * FEATURES + f] !== grid.cells[cell * FEATURES + f]) nDiff++;
  }
  let k = Math.floor(rng() * nDiff);
  for (let f = 0; f < FEATURES; f++) {
    if (pool.cells[m * FEATURES + f] !== grid.cells[cell * FEATURES + f] && k-- === 0) {
      pool.cells[m * FEATURES + f] = grid.cells[cell * FEATURES + f];
      return true;
    }
  }
  return false;
}

/**
 * Advance every migrant one tick: wander, glide, wrap, maybe exchange.
 * Deposits mutate the lattice (via influence) and push the cell index into
 * `changed`; absorptions mutate the migrant's own culture. Returns the
 * number of deposits.
 * RNG draws per migrant: turn, exchange gate, then if exchanging:
 * direction, then the attempt's own draws.
 */
export function stepMigrants(
  pool: MigrantPool,
  grid: CultureGrid,
  cfg: CultureConfig,
  mcfg: MigrantConfig,
  rng: Rng,
  changed: number[],
): number {
  let deposits = 0;
  for (let m = 0; m < pool.count; m++) {
    pool.heading[m] += (rng() * 2 - 1) * mcfg.turnJitter;
    pool.x[m] = wrap(pool.x[m] + Math.cos(pool.heading[m]) * mcfg.speed, grid.cols);
    pool.y[m] = wrap(pool.y[m] + Math.sin(pool.heading[m]) * mcfg.speed, grid.rows);
    if (rng() >= mcfg.exchangeRate) continue;

    const cell = cellUnder(pool, m, grid);
    if (rng() < 0.5) {
      absorb(pool, m, grid, cell, cfg, rng);
    } else if (influence(grid, cell, pool.cells, m * FEATURES, cfg, rng) >= 0) {
      changed.push(cell);
      deposits++;
    }
  }
  return deposits;
}
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `pnpm --filter pravritti test`
Expected: ALL PASS (agents suite + every culture/palette test). The zealot-immunity test proves the deposit path really goes through `influence`.

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/agents.ts apps/pravritti/src/lib/agents.test.ts
git commit -m "task: migrant layer — gliding agents with two-way exchange

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Saturated agent colors and the zealot pin (`palette.ts`)

**Files:**
- Modify: `apps/pravritti/src/lib/palette.ts`
- Test: `apps/pravritti/src/lib/palette.test.ts`

**Interfaces:**
- Consumes: existing `Rgb`, `BG`, `FAMILIES`, `mix`, private `SHADE_MIN`/`SHADE_SPAN`.
- Produces (used by Task 5):
  - `agentColor(religious: number, societal: number, societalCount: number): Rgb` — family hue shaded by societal, WITHOUT the wash (saturated figures).
  - `const ZEALOT_PIN: Rgb` — `{ r: 71, g: 44, b: 31 }` (logo deep brown `#472c1f`).

- [ ] **Step 1: Write the failing tests (append to `palette.test.ts`)**

Add `agentColor`, `ZEALOT_PIN` to the existing import from `./palette`. Append:

```ts
describe("agentColor / ZEALOT_PIN", () => {
  it("is far more saturated than the washed cell color", () => {
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      for (let soc = 0; soc < 6; soc++) {
        const agent = agentColor(rel, soc, 6);
        const cell = cellColor(rel, soc, 6);
        expect(dist(agent, BG)).toBeGreaterThan(dist(cell, BG) * 2);
      }
    }
  });

  it("keeps families distinguishable and fades with societal shade", () => {
    const seen = new Set(
      Array.from({ length: FAMILIES.length }, (_, rel) => {
        const c = agentColor(rel, 2, 6);
        return `${c.r},${c.g},${c.b}`;
      }),
    );
    expect(seen.size).toBe(FAMILIES.length);
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      expect(dist(agentColor(rel, 5, 6), BG)).toBeLessThan(dist(agentColor(rel, 0, 6), BG));
    }
  });

  it("pins are the logo deep brown #472c1f", () => {
    expect(ZEALOT_PIN).toEqual({ r: 71, g: 44, b: 31 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter pravritti test palette`
Expected: FAIL — `agentColor`/`ZEALOT_PIN` not exported.

- [ ] **Step 3: Implement (append to `palette.ts`)**

```ts
/** Deep-brown zealot pin — logo #472c1f, the anchor color. */
export const ZEALOT_PIN: Rgb = { r: 71, g: 44, b: 31 };

/**
 * Saturated agent color: same hue/shade math as cells but WITHOUT the wash.
 * Used for the Phase 2 figures (migrants, hub rings) that sit above the
 * quiet ground.
 */
export function agentColor(religious: number, societal: number, societalCount: number): Rgb {
  const t = societalCount <= 1 ? 0 : societal / (societalCount - 1);
  return mix(FAMILIES[religious], BG, SHADE_MIN + SHADE_SPAN * t);
}
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `pnpm --filter pravritti test`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/pravritti/src/lib/palette.ts apps/pravritti/src/lib/palette.test.ts
git commit -m "task: saturated agent colors and zealot pin

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Agent canvas layer in `CultureCanvas.astro`

**Files:**
- Modify: `apps/pravritti/src/components/CultureCanvas.astro` (full-file replacement below — safer than many scattered edits)

**Interfaces:**
- Consumes: everything produced by Tasks 1–4 (`seedTypes`, `TYPE_ZEALOT`, `influence` indirectly via `stepMigrants`, `createMigrants`, `defaultMigrantConfig`, `stepMigrants`, `MigrantPool`, `agentColor`, `ZEALOT_PIN`).
- Produces: the finished Phase 2 background. No API for later tasks.

- [ ] **Step 1: Replace `apps/pravritti/src/components/CultureCanvas.astro` with:**

```astro
---
// Decorative background: Axelrod culture-dissemination simulation rendered
// as a quiet wash, plus the Phase 2 agent layer — gliding migrants, pulsing
// hub rings, zealot pins — on a second transparent canvas. Purely
// progressive enhancement: any failure leaves a plain cream page.
// Specs: .docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md
//        .docs/superpowers/specs/2026-07-03-culture-sim-phase2-agents-design.md
---

<canvas id="culture-canvas" aria-hidden="true"></canvas>
<canvas id="agents-canvas" aria-hidden="true"></canvas>

<script>
  import {
    createGrid,
    defaultConfig,
    FEATURES,
    mulberry32,
    seedTypes,
    stepBatch,
    TYPE_ZEALOT,
    warmup,
    type CultureGrid,
  } from "../lib/culture";
  import {
    createMigrants,
    defaultMigrantConfig,
    stepMigrants,
    type MigrantPool,
  } from "../lib/agents";
  import {
    agentColor,
    BG,
    cellAlpha,
    cellColor,
    cellRadius,
    ZEALOT_PIN,
  } from "../lib/palette";

  const CELL = 20; // base CSS px per cell (grows on very large viewports)
  const MAX_COLS = 120;
  const MAX_ROWS = 80;
  const LERP_MS = 450; // change blooms, never blinks
  const STEP_MS = 1000 / 60; // fixed sim timestep, independent of display Hz
  // Warm-up scales with grid area so regions form to the same degree on every
  // viewport (a fixed tick budget under-warms big grids, leaving speckle).
  // ~80 interaction attempts/cell lands near mean-similarity 0.6; the bounds
  // keep the one-time synchronous warm-up between ~20ms and ~65ms.
  const WARMUP_PER_CELL = 80;
  const WARMUP_MIN_TICKS = 2000;
  const WARMUP_MAX_TICKS = 8000;
  /** Per-channel snap thresholds for [r, g, b, alpha, radius]. */
  const EPS = [1, 1, 1, 0.02, 0.15];
  // Agent-layer densities (per css px² of viewport) and visual constants.
  const HUB_AREA = 220_000; // ~1 hub per this many px², clamped 3..8
  const MIGRANT_AREA = 110_000; // ~1 migrant per this many px², clamped 8..24
  const TRAIL_POINTS = 7;
  const TRAIL_SAMPLE_MS = 90;
  const HUB_PULSE_MS = 5000;

  const washCanvas = document.getElementById("culture-canvas") as HTMLCanvasElement | null;
  const ctx = washCanvas ? washCanvas.getContext("2d") : null;
  const agentCanvas = document.getElementById("agents-canvas") as HTMLCanvasElement | null;
  const actx = agentCanvas ? agentCanvas.getContext("2d") : null;

  if (washCanvas && ctx) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const rng = mulberry32(Date.now() % 0x7fffffff || 1);
    const cfg = defaultConfig;
    const mcfg = defaultMigrantConfig;
    const bgStyle = `rgb(${BG.r} ${BG.g} ${BG.b})`;

    let grid: CultureGrid;
    let cellPx = CELL; // device px per cell
    let stepCfg = cfg; // live pace, rescaled to grid size in rebuild()
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

    // ---- Phase 2 agent layer state (inert when agentCanvas/actx missing) --
    let migrants: MigrantPool | null = null;
    let zealotCells: number[] = [];
    /** Ring buffer of past head positions per migrant (TRAIL_POINTS × x,y). */
    let trails = new Float32Array(0);
    let trailHead = 0;
    let lastTrailT = 0;

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

    function sampleTrails(): void {
      if (!migrants) return;
      trailHead = (trailHead + 1) % TRAIL_POINTS;
      for (let m = 0; m < migrants.count; m++) {
        const idx = (m * TRAIL_POINTS + trailHead) * 2;
        trails[idx] = migrants.x[m];
        trails[idx + 1] = migrants.y[m];
      }
    }

    function paintAgents(t: number): void {
      if (!agentCanvas || !actx) return;
      actx.clearRect(0, 0, agentCanvas.width, agentCanvas.height);

      // Zealot pins — deep-brown anchors.
      actx.fillStyle = `rgb(${ZEALOT_PIN.r} ${ZEALOT_PIN.g} ${ZEALOT_PIN.b} / 0.55)`;
      for (const i of zealotCells) {
        const x = (i % grid.cols) * cellPx + cellPx / 2;
        const y = ((i / grid.cols) | 0) * cellPx + cellPx / 2;
        actx.beginPath();
        actx.arc(x, y, cellPx * 0.09, 0, Math.PI * 2);
        actx.fill();
      }

      // Hub rings — slow pulse; static under reduced motion.
      for (let h = 0; h < grid.hubs.length; h++) {
        const i = grid.hubs[h];
        const f = i * FEATURES;
        const c = agentColor(grid.cells[f], grid.cells[f + 3], cfg.traitCounts[3]);
        const x = (i % grid.cols) * cellPx + cellPx / 2;
        const y = ((i / grid.cols) | 0) * cellPx + cellPx / 2;
        const pulse = reduced.matches
          ? 0.7
          : 0.6 + 0.2 * (0.5 + 0.5 * Math.sin((t / HUB_PULSE_MS) * Math.PI * 2 + h));
        actx.strokeStyle = `rgb(${c.r} ${c.g} ${c.b} / 0.35)`;
        actx.lineWidth = cellPx * 0.08;
        actx.beginPath();
        actx.arc(x, y, cellPx * pulse, 0, Math.PI * 2);
        actx.stroke();
        actx.fillStyle = `rgb(${c.r} ${c.g} ${c.b} / 0.8)`;
        actx.beginPath();
        actx.arc(x, y, cellPx * 0.12, 0, Math.PI * 2);
        actx.fill();
      }

      // Migrants — hidden entirely under reduced motion.
      if (!migrants || reduced.matches) return;
      for (let m = 0; m < migrants.count; m++) {
        const f = m * FEATURES;
        const c = agentColor(migrants.cells[f], migrants.cells[f + 3], cfg.traitCounts[3]);
        for (let p = 1; p < TRAIL_POINTS; p++) {
          const idx = (m * TRAIL_POINTS + ((trailHead + p) % TRAIL_POINTS)) * 2;
          actx.fillStyle = `rgb(${c.r} ${c.g} ${c.b} / ${0.28 * (p / TRAIL_POINTS)})`;
          actx.beginPath();
          actx.arc(
            trails[idx] * cellPx,
            trails[idx + 1] * cellPx,
            cellPx * (0.06 + 0.06 * (p / TRAIL_POINTS)),
            0,
            Math.PI * 2,
          );
          actx.fill();
        }
        actx.fillStyle = `rgb(${c.r} ${c.g} ${c.b} / 0.9)`;
        actx.beginPath();
        actx.arc(migrants.x[m] * cellPx, migrants.y[m] * cellPx, cellPx * 0.16, 0, Math.PI * 2);
        actx.fill();
      }
    }

    function rebuild(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Cell size grows on large viewports so a bounded cell count still
      // covers the whole screen — no unfilled strip past MAX_COLS/MAX_ROWS.
      const cellCss = Math.max(CELL, Math.ceil(vw / MAX_COLS), Math.ceil(vh / MAX_ROWS));
      cellPx = cellCss * dpr;
      const cols = Math.ceil(vw / cellCss);
      const rows = Math.ceil(vh / cellCss);
      washCanvas.width = cols * cellPx;
      washCanvas.height = rows * cellPx;
      washCanvas.style.width = `${cols * cellCss}px`;
      washCanvas.style.height = `${rows * cellCss}px`;
      if (agentCanvas) {
        agentCanvas.width = cols * cellPx;
        agentCanvas.height = rows * cellPx;
        agentCanvas.style.width = `${cols * cellCss}px`;
        agentCanvas.style.height = `${rows * cellCss}px`;
      }
      const n = cols * rows;
      grid = createGrid(cols, rows, cfg, rng);
      // First visible frame already shows regions — warm-up tracks grid size.
      const warmupTicks = Math.min(
        WARMUP_MAX_TICKS,
        Math.max(WARMUP_MIN_TICKS, Math.round((WARMUP_PER_CELL * n) / cfg.batchSize)),
      );
      warmup(grid, { ...cfg, warmupTicks }, rng);
      // Live pace scales with grid size so the field visibly evolves at any
      // resolution (a fixed batch barely stirs a big grid). Extra drift keeps
      // gentle motion everywhere, not only at region boundaries.
      stepCfg = {
        ...cfg,
        batchSize: Math.max(cfg.batchSize, Math.round(n / 26)),
        driftPerTick: Math.max(cfg.driftPerTick, n / 3200),
      };
      // Phase 2: seed agent categories after warm-up (typed dynamics start
      // live) and size the populations to the viewport.
      const area = vw * vh;
      seedTypes(grid, Math.min(8, Math.max(3, Math.round(area / HUB_AREA))), cfg, rng);
      zealotCells = [];
      for (let i = 0; i < n; i++) {
        if (grid.types[i] === TYPE_ZEALOT) zealotCells.push(i);
      }
      if (actx) {
        const migCount = Math.min(24, Math.max(8, Math.round(area / MIGRANT_AREA)));
        migrants = createMigrants(migCount, grid, cfg, rng);
        trails = new Float32Array(migCount * TRAIL_POINTS * 2);
        for (let m = 0; m < migCount; m++) {
          for (let p = 0; p < TRAIL_POINTS; p++) {
            trails[(m * TRAIL_POINTS + p) * 2] = migrants.x[m];
            trails[(m * TRAIL_POINTS + p) * 2 + 1] = migrants.y[m];
          }
        }
        trailHead = 0;
      }
      shown = new Float32Array(n * 5);
      target = new Float32Array(n * 5);
      animating.clear();
      ctx.fillStyle = bgStyle;
      ctx.fillRect(0, 0, washCanvas.width, washCanvas.height);
      for (let i = 0; i < n; i++) {
        writeTarget(i);
        shown.set(target.subarray(i * 5, i * 5 + 5), i * 5);
        paintCell(i);
      }
      // Static agent layer exists even when the loop never starts.
      paintAgents(performance.now());
    }

    function frame(t: number): void {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(t - lastT, 100); // clamp long gaps (tab jank)
      lastT = t;
      acc += dt;
      while (acc >= STEP_MS) {
        acc -= STEP_MS;
        changed.length = 0;
        stepBatch(grid, stepCfg, rng, changed);
        if (migrants) stepMigrants(migrants, grid, cfg, mcfg, rng, changed);
        for (const i of changed) {
          writeTarget(i);
          animating.add(i);
        }
      }
      if (migrants && t - lastTrailT >= TRAIL_SAMPLE_MS) {
        sampleTrails();
        lastTrailT = t;
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
      paintAgents(t);
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

    reduced.addEventListener("change", () => {
      if (reduced.matches) {
        stop();
        paintAgents(performance.now()); // erase migrants, freeze rings
      } else {
        start();
      }
    });

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
  #culture-canvas,
  #agents-canvas {
    position: fixed;
    inset: 0;
    z-index: var(--z-base);
    pointer-events: none;
  }
</style>
```

- [ ] **Step 2: Typecheck, test, build**

Run: `pnpm --filter pravritti exec tsc --noEmit && pnpm --filter pravritti test && pnpm --filter pravritti build`
Expected: tsc clean, all tests pass (no lib changes in this task), build succeeds.

- [ ] **Step 3: Verify in the browser**

Run `pnpm --filter pravritti dev` and check (real browser / screenshots — the controller performs visual QA; note that raw headless-Chrome windows below ~500px wide are clamped, so QA mobile via a real-width iframe):

1. Migrants: ~a dozen saturated dots gliding smoothly with fading trails; colors shift over time as they assimilate; wash cells bloom along their paths.
2. Hubs: 3–8 soft rings, each slowly pulsing, with a center dot; regions near hubs trend toward the hub's colors.
3. Zealots: sparse tiny deep-brown pins, fixed in place.
4. Hero + tagline remain clearly readable; the figures read as life, not noise.
5. Reduced-motion emulation: static wash + static rings + pins, NO migrants.
6. Tab-hide ~30 s and return: calm resume, no burst.
7. Resize: everything reseeds and still covers the full viewport.

- [ ] **Step 4: Commit**

```bash
git add apps/pravritti/src/components/CultureCanvas.astro
git commit -m "task: agent canvas layer — migrants, hub rings, zealot pins

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Final verification pass

**Files:** none expected (fixes only if checks fail).

- [ ] **Step 1: Full suite + typecheck + build**

Run: `pnpm --filter pravritti test && pnpm --filter pravritti exec tsc --noEmit && pnpm --filter pravritti build`
Expected: everything green (culture + agents + palette suites; the golden test still passing is the final proof v1 semantics survived Phase 2).

- [ ] **Step 2: Walk the browser QA list from Task 5 Step 3 once more against `pnpm --filter pravritti preview`** (production build), including `/blog` and a 404 URL (both share the background).

- [ ] **Step 3: Commit any fixes; otherwise done**

```bash
git add -A && git commit -m "task: phase 2 final verification fixes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
