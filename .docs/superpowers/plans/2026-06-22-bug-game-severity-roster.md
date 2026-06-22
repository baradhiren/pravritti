# Bug Game — Severity Roster & System Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single recoloured ladybug with six procedural insect silhouettes organised on a Sev 0–4 axis, add severity-scaled scoring, and add a "System health" bar that drains while bugs live, restores on squash, and ends the run (still revealing the site) when it goes red.

**Architecture:** Pure game logic (roster, severity maps, weighted spawn, health math, taunt pools) moves into a new tested module `src/lib/bugGame.ts`. The six canvas silhouette routines move into `src/lib/bugShapes.ts`. `BugGame.astro` imports both and keeps only the runtime: game loop, input, DOM/HUD, animations, and the health/lose wiring. This mirrors the existing `src/lib/icons.ts` pattern and shrinks the 1100-line component.

**Tech Stack:** Astro 5, TypeScript, HTML `<canvas>` 2D, Vitest (new, for the logic module only).

## Global Constraints

- Software-bug pun names stay; they are the point of the QA portfolio.
- Gameplay is squash-only plus the health drain — no other player/page damage, no combo multiplier, no art-asset pipeline (all drawn on the existing `<canvas>`).
- Losing never traps the visitor: a lost run reveals the portfolio via the existing `game:cleared` → scatter → reveal path. The site is always reachable.
- Reduced-motion users still get no game (unchanged head-script gate).
- Severity numbers (HP / points / drain / restore / thresholds) are the spec's starting values, copied verbatim below; keep them as named constants so they stay tunable.
- Health: `HEALTH_MAX = 100`, `LOSE_AT = 35` (lose when `health < 35`).
- `POINTS = {4:1, 3:2, 2:5, 1:10, 0:25}`
- `HEALTH_DRAIN = {4:0.5, 3:1, 2:2, 1:3.5, 0:6}` (per second, per living bug)
- `HEALTH_RESTORE = {4:2, 3:3, 2:6, 1:12, 0:25}` (on squash)

---

## File Structure

- `apps/hiren/vitest.config.ts` — **create** — Vitest config via Astro's Vite pipeline.
- `apps/hiren/src/lib/bugGame.ts` — **create** — types, roster, severity maps, weighted spawn, health math, taunt pools. Pure, fully tested.
- `apps/hiren/src/lib/bugGame.test.ts` — **create** — unit tests for the above.
- `apps/hiren/src/lib/bugShapes.ts` — **create** — six `drawX(c, s, type)` silhouette routines + `SHAPES` dispatch map. Build-verified.
- `apps/hiren/src/components/BugGame.astro` — **modify** — consume the modules; add points scoring, the System-health HUD + drain/restore loop + lose sequence, and taunt behaviour.
- `apps/hiren/package.json` — **modify** — add `test` script + `vitest` devDependency.

---

### Task 1: Vitest setup

**Files:**
- Modify: `apps/hiren/package.json`
- Create: `apps/hiren/vitest.config.ts`
- Create: `apps/hiren/src/lib/bugGame.test.ts` (temporary sanity test)

**Interfaces:**
- Produces: a working `pnpm --filter hiren test` command for all later logic tasks.

- [ ] **Step 1: Add the dev dependency and script**

Run: `pnpm --filter hiren add -D vitest`

Then edit `apps/hiren/package.json` `scripts` to add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Create the Vitest config**

Create `apps/hiren/vitest.config.ts`:

```ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add a sanity test**

Create `apps/hiren/src/lib/bugGame.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Run it**

Run: `pnpm --filter hiren test`
Expected: PASS — 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/package.json apps/hiren/pnpm-lock.yaml apps/hiren/vitest.config.ts apps/hiren/src/lib/bugGame.test.ts
git commit -m "chore(hiren): add vitest for game logic tests"
```

---

### Task 2: Types, roster, and points/severity maps

**Files:**
- Create: `apps/hiren/src/lib/bugGame.ts`
- Modify: `apps/hiren/src/lib/bugGame.test.ts` (replace sanity test)

**Interfaces:**
- Produces:
  - `type Severity = 0 | 1 | 2 | 3 | 4`
  - `type Shape = "gnat" | "moth" | "wasp" | "mosquito" | "spider" | "roach"`
  - `type BugType = { name: string; severity: Severity; shape: Shape; hp: number; sizeMul: number; speedMul: number; color: string; spot: string; grows?: boolean; dodges?: boolean; flickers?: boolean; ignoresHit?: boolean }`
  - `const TYPES: BugType[]`
  - `const POINTS: Record<Severity, number>`
  - `function pointsFor(sev: Severity): number`

- [ ] **Step 1: Write the failing test**

Replace `apps/hiren/src/lib/bugGame.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { TYPES, POINTS, pointsFor } from "./bugGame";

describe("roster", () => {
  it("covers every severity tier 0..4", () => {
    const sevs = new Set(TYPES.map((t) => t.severity));
    expect([...sevs].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("only references the six known shapes", () => {
    const shapes = new Set(["gnat", "moth", "wasp", "mosquito", "spider", "roach"]);
    for (const t of TYPES) expect(shapes.has(t.shape)).toBe(true);
  });

  it("maps points by severity", () => {
    expect(pointsFor(4)).toBe(1);
    expect(pointsFor(2)).toBe(5);
    expect(pointsFor(0)).toBe(25);
    expect(POINTS[1]).toBe(10);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter hiren test`
Expected: FAIL — cannot find module `./bugGame` exports.

- [ ] **Step 3: Implement the module**

Create `apps/hiren/src/lib/bugGame.ts`:

```ts
export type Severity = 0 | 1 | 2 | 3 | 4;
export type Shape = "gnat" | "moth" | "wasp" | "mosquito" | "spider" | "roach";

export type BugType = {
  name: string;
  severity: Severity;
  shape: Shape;
  hp: number;
  sizeMul: number;
  speedMul: number;
  color: string; // body
  spot: string;  // markings / legs accent
  grows?: boolean;
  dodges?: boolean;
  flickers?: boolean;
  ignoresHit?: boolean; // sometimes shrugs off the first hit (Flaky Test)
};

export const POINTS: Record<Severity, number> = { 4: 1, 3: 2, 2: 5, 1: 10, 0: 25 };
export const pointsFor = (sev: Severity): number => POINTS[sev];

// Sev 4 Cosmetic (gnat) · 3 Minor (moth) · 2 Major (wasp/mosquito)
// · 1 Critical (spider/roach) · 0 Blocker (scaled spider/roach)
export const TYPES: BugType[] = [
  // Sev 4 — Cosmetic
  { name: "Typo",         severity: 4, shape: "gnat", hp: 1, sizeMul: 0.7,  speedMul: 0.8, color: "oklch(0.82 0.05 95)",  spot: "oklch(0.62 0.05 95)" },
  { name: "Cosmetic Bug", severity: 4, shape: "gnat", hp: 1, sizeMul: 0.72, speedMul: 0.85, color: "oklch(0.8 0.06 110)", spot: "oklch(0.6 0.05 110)" },
  { name: "Lorem Ipsum",  severity: 4, shape: "gnat", hp: 1, sizeMul: 0.7,  speedMul: 0.8, color: "oklch(0.83 0.04 80)",  spot: "oklch(0.62 0.04 80)" },
  { name: "Whitespace",   severity: 4, shape: "gnat", hp: 1, sizeMul: 0.68, speedMul: 0.9, color: "oklch(0.85 0.03 100)", spot: "oklch(0.64 0.03 100)" },
  // Sev 3 — Minor
  { name: "Off-by-One",   severity: 3, shape: "moth", hp: 1, sizeMul: 0.9,  speedMul: 1.1, color: "oklch(0.74 0.07 70)",  spot: "oklch(0.5 0.06 60)" },
  { name: "Magic Number", severity: 3, shape: "moth", hp: 1, sizeMul: 0.88, speedMul: 1.0, color: "oklch(0.72 0.08 60)",  spot: "oklch(0.48 0.06 55)" },
  { name: "Tooltip Typo", severity: 3, shape: "moth", hp: 1, sizeMul: 0.9,  speedMul: 1.05, color: "oklch(0.73 0.06 85)", spot: "oklch(0.5 0.05 80)" },
  // Sev 2 — Major
  { name: "Race Condition", severity: 2, shape: "wasp",     hp: 2, sizeMul: 0.95, speedMul: 1.7, color: "oklch(0.82 0.15 75)", spot: "oklch(0.32 0.04 60)" },
  { name: "Heisenbug",      severity: 2, shape: "mosquito", hp: 2, sizeMul: 0.9,  speedMul: 1.3, color: "oklch(0.76 0.13 300)", spot: "oklch(0.5 0.12 300)", flickers: true },
  { name: "Flaky Test",     severity: 2, shape: "mosquito", hp: 2, sizeMul: 0.95, speedMul: 1.0, color: "oklch(0.76 0.11 196)", spot: "oklch(0.46 0.1 200)", ignoresHit: true },
  // Sev 1 — Critical
  { name: "Null Pointer", severity: 1, shape: "spider", hp: 3, sizeMul: 1.15, speedMul: 1.0, color: "oklch(0.62 0.2 28)",  spot: "oklch(0.35 0.13 25)", dodges: true },
  { name: "Regression",   severity: 1, shape: "roach",  hp: 3, sizeMul: 1.25, speedMul: 0.8, color: "oklch(0.5 0.08 45)",  spot: "oklch(0.3 0.05 40)" },
  { name: "Memory Leak",  severity: 1, shape: "roach",  hp: 3, sizeMul: 0.95, speedMul: 0.7, color: "oklch(0.6 0.18 22)",  spot: "oklch(0.36 0.14 20)", grows: true },
  { name: "Deadlock",     severity: 1, shape: "spider", hp: 3, sizeMul: 1.2,  speedMul: 0.85, color: "oklch(0.58 0.16 300)", spot: "oklch(0.34 0.12 300)", dodges: true },
  // Sev 0 — Blocker (boss)
  { name: "Segfault",     severity: 0, shape: "spider", hp: 5, sizeMul: 1.7, speedMul: 0.75, color: "oklch(0.5 0.22 25)", spot: "oklch(0.28 0.14 22)", dodges: true },
  { name: "Kernel Panic", severity: 0, shape: "roach",  hp: 5, sizeMul: 1.75, speedMul: 0.7, color: "oklch(0.46 0.12 35)", spot: "oklch(0.26 0.08 30)" },
  { name: "Prod Outage",  severity: 0, shape: "spider", hp: 5, sizeMul: 1.8, speedMul: 0.72, color: "oklch(0.48 0.2 18)",  spot: "oklch(0.26 0.13 18)", dodges: true, grows: true },
];
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter hiren test`
Expected: PASS — all roster tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/lib/bugGame.ts apps/hiren/src/lib/bugGame.test.ts
git commit -m "feat(hiren): bug roster + severity/points map"
```

---

### Task 3: Weighted spawn selection

**Files:**
- Modify: `apps/hiren/src/lib/bugGame.ts`
- Modify: `apps/hiren/src/lib/bugGame.test.ts`

**Interfaces:**
- Consumes: `TYPES`, `Severity`, `BugType` from Task 2.
- Produces:
  - `function severityWeights(progress: number): Record<Severity, number>`
  - `function pickType(opts: { squashed: number; hasBlocker: boolean; rng?: () => number }): BugType`

- [ ] **Step 1: Write the failing test**

Append to `apps/hiren/src/lib/bugGame.test.ts`:

```ts
import { severityWeights, pickType } from "./bugGame";

describe("spawn weighting", () => {
  it("favours low severity early, higher severity late", () => {
    const early = severityWeights(0);
    const late = severityWeights(1);
    expect(early[4]).toBeGreaterThan(early[1]);
    expect(late[2] + late[1]).toBeGreaterThan(late[4]);
  });

  it("never spawns a blocker from the weighted path", () => {
    expect(severityWeights(0)[0]).toBe(0);
    expect(severityWeights(1)[0]).toBe(0);
  });

  it("rng=0 early picks a Cosmetic (sev 4) type", () => {
    const t = pickType({ squashed: 0, hasBlocker: false, rng: () => 0 });
    expect(t.severity).toBe(4);
  });

  it("spawns a blocker only after warmup, one at a time", () => {
    // rng=0 passes the <0.04 blocker gate; needs squashed>=12 and no blocker alive
    expect(pickType({ squashed: 12, hasBlocker: false, rng: () => 0 }).severity).toBe(0);
    expect(pickType({ squashed: 12, hasBlocker: true, rng: () => 0 }).severity).not.toBe(0);
    expect(pickType({ squashed: 5, hasBlocker: false, rng: () => 0 }).severity).not.toBe(0);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter hiren test`
Expected: FAIL — `severityWeights`/`pickType` not exported.

- [ ] **Step 3: Implement**

Append to `apps/hiren/src/lib/bugGame.ts`:

```ts
const EARLY_W: Record<Severity, number> = { 4: 5, 3: 4, 2: 1.5, 1: 0.4, 0: 0 };
const LATE_W: Record<Severity, number> = { 4: 1.5, 3: 2, 2: 3, 1: 2, 0: 0 };

export function severityWeights(progress: number): Record<Severity, number> {
  const p = Math.max(0, Math.min(1, progress));
  const lerp = (a: number, b: number) => a + (b - a) * p;
  return {
    4: lerp(EARLY_W[4], LATE_W[4]),
    3: lerp(EARLY_W[3], LATE_W[3]),
    2: lerp(EARLY_W[2], LATE_W[2]),
    1: lerp(EARLY_W[1], LATE_W[1]),
    0: 0,
  };
}

export function pickType(opts: { squashed: number; hasBlocker: boolean; rng?: () => number }): BugType {
  const rng = opts.rng ?? Math.random;
  // Rare boss: only after a warmup, never more than one alive.
  if (opts.squashed >= 12 && !opts.hasBlocker && rng() < 0.04) {
    const blockers = TYPES.filter((t) => t.severity === 0);
    return blockers[Math.floor(rng() * blockers.length)];
  }
  const w = severityWeights(Math.min(1, opts.squashed / 20));
  const tiers: Severity[] = [4, 3, 2, 1];
  const total = tiers.reduce((s, t) => s + w[t], 0);
  let r = rng() * total;
  let sev: Severity = 4;
  for (const t of tiers) {
    r -= w[t];
    if (r <= 0) {
      sev = t;
      break;
    }
  }
  const pool = TYPES.filter((t) => t.severity === sev);
  return pool[Math.floor(rng() * pool.length)];
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter hiren test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/lib/bugGame.ts apps/hiren/src/lib/bugGame.test.ts
git commit -m "feat(hiren): severity-weighted spawn with rare blocker"
```

---

### Task 4: System-health math

**Files:**
- Modify: `apps/hiren/src/lib/bugGame.ts`
- Modify: `apps/hiren/src/lib/bugGame.test.ts`

**Interfaces:**
- Consumes: `Severity` from Task 2.
- Produces:
  - `const HEALTH_MAX = 100`, `const LOSE_AT = 35`
  - `const HEALTH_DRAIN: Record<Severity, number>`, `const HEALTH_RESTORE: Record<Severity, number>`
  - `function clampHealth(h: number): number`
  - `function drainHealth(health: number, severities: Severity[], dtMs: number): number`
  - `function restoreHealth(health: number, sev: Severity): number`
  - `function isLost(health: number): boolean`
  - `function healthColor(health: number): string`

- [ ] **Step 1: Write the failing test**

Append to `apps/hiren/src/lib/bugGame.test.ts`:

```ts
import {
  drainHealth, restoreHealth, isLost, healthColor, clampHealth, HEALTH_MAX, LOSE_AT,
} from "./bugGame";

describe("system health", () => {
  it("drains by summed severity rate over time", () => {
    // one Critical (3.5/s) for 1000ms from 100 -> 96.5
    expect(drainHealth(100, [1], 1000)).toBeCloseTo(96.5, 5);
    // two bugs sum their rates: 3.5 + 0.5 = 4/s for 500ms = 2 damage
    expect(drainHealth(100, [1, 4], 500)).toBeCloseTo(98, 5);
  });

  it("never drains below zero", () => {
    expect(drainHealth(1, [0], 5000)).toBe(0);
  });

  it("restores by severity and caps at max", () => {
    expect(restoreHealth(50, 1)).toBe(62); // +12
    expect(restoreHealth(95, 0)).toBe(HEALTH_MAX); // +25 capped
  });

  it("loses strictly below the threshold", () => {
    expect(isLost(LOSE_AT)).toBe(false);
    expect(isLost(LOSE_AT - 0.01)).toBe(true);
  });

  it("clamps and colours from green (high) to red (low)", () => {
    expect(clampHealth(140)).toBe(100);
    expect(clampHealth(-3)).toBe(0);
    expect(healthColor(100)).toContain("150"); // green hue
    expect(healthColor(LOSE_AT)).toContain("30"); // red hue at the floor
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter hiren test`
Expected: FAIL — health exports missing.

- [ ] **Step 3: Implement**

Append to `apps/hiren/src/lib/bugGame.ts`:

```ts
export const HEALTH_MAX = 100;
export const LOSE_AT = 35;
export const HEALTH_DRAIN: Record<Severity, number> = { 4: 0.5, 3: 1, 2: 2, 1: 3.5, 0: 6 };
export const HEALTH_RESTORE: Record<Severity, number> = { 4: 2, 3: 3, 2: 6, 1: 12, 0: 25 };

export const clampHealth = (h: number): number => Math.max(0, Math.min(HEALTH_MAX, h));

export function drainHealth(health: number, severities: Severity[], dtMs: number): number {
  const perSec = severities.reduce((s, sev) => s + HEALTH_DRAIN[sev], 0);
  return clampHealth(health - perSec * (dtMs / 1000));
}

export const restoreHealth = (health: number, sev: Severity): number =>
  clampHealth(health + HEALTH_RESTORE[sev]);

export const isLost = (health: number): boolean => health < LOSE_AT;

// Green (high) -> red (low). oklch hue 150=green .. 30=red, mapped across
// [LOSE_AT, HEALTH_MAX] so the bar reads fully red right at the fail floor.
export function healthColor(health: number): string {
  const frac = Math.max(0, Math.min(1, (clampHealth(health) - LOSE_AT) / (HEALTH_MAX - LOSE_AT)));
  const hue = Math.round(30 + frac * 120);
  return `oklch(0.72 0.17 ${hue})`;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter hiren test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/lib/bugGame.ts apps/hiren/src/lib/bugGame.test.ts
git commit -m "feat(hiren): system-health drain/restore/colour math"
```

---

### Task 5: Taunt pools

**Files:**
- Modify: `apps/hiren/src/lib/bugGame.ts`
- Modify: `apps/hiren/src/lib/bugGame.test.ts`

**Interfaces:**
- Consumes: `Severity` from Task 2.
- Produces:
  - `const CULTURE_TAUNTS: string[]`, `const EVASIVE_TAUNTS: string[]`
  - `function pickTaunt(severity: Severity, rng?: () => number): string`

- [ ] **Step 1: Write the failing test**

Append to `apps/hiren/src/lib/bugGame.test.ts`:

```ts
import { CULTURE_TAUNTS, EVASIVE_TAUNTS, pickTaunt } from "./bugGame";

describe("taunts", () => {
  it("low severity draws only from the culture pool", () => {
    expect(pickTaunt(4, () => 0)).toBe(CULTURE_TAUNTS[0]);
    for (let i = 0; i < 50; i++) {
      const line = pickTaunt(3, Math.random);
      expect(CULTURE_TAUNTS).toContain(line);
    }
  });

  it("high severity can draw from the evasive pool too", () => {
    // rng just under 1 lands in the appended evasive section
    const line = pickTaunt(1, () => 0.999999);
    expect(EVASIVE_TAUNTS).toContain(line);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm --filter hiren test`
Expected: FAIL — taunt exports missing.

- [ ] **Step 3: Implement**

Append to `apps/hiren/src/lib/bugGame.ts`:

```ts
// Deadpan artifacts of a culture that never prioritised these bugs.
export const CULTURE_TAUNTS: string[] = [
  "I am here because a deadline had higher priority.",
  "Marked 'won't fix' three sprints ago.",
  "Still P3. Always P3.",
  "Closed as 'works on my machine.'",
  "Filed under 'known issues.'",
  "Triaged to 'later.' Later never came.",
  "Nobody owns this module.",
  "Repro steps: 'sometimes.'",
  "Cut from scope, not from the build.",
  "There's a // TODO with my name on it.",
  "I survived two reorgs.",
  "Acceptance criteria were aspirational.",
];

// Higher severities also brag about hiding.
export const EVASIVE_TAUNTS: string[] = [
  "Catch me if you can.",
  "I hide in the darkness of checkout.",
  "I live in the auth flow.",
  "I've been in production since launch.",
  "You'll never find my repro.",
  "Roll back — I'll wait.",
  "I scale with your traffic.",
];

export function pickTaunt(severity: Severity, rng: () => number = Math.random): string {
  const pool = severity <= 2 ? [...CULTURE_TAUNTS, ...EVASIVE_TAUNTS] : CULTURE_TAUNTS;
  return pool[Math.floor(rng() * pool.length)];
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter hiren test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/lib/bugGame.ts apps/hiren/src/lib/bugGame.test.ts
git commit -m "feat(hiren): severity-aware taunt pools"
```

---

### Task 6: Six silhouette draw routines

**Files:**
- Create: `apps/hiren/src/lib/bugShapes.ts`

**Interfaces:**
- Consumes: `BugType`, `Shape` from `bugGame.ts`.
- Produces: `const SHAPES: Record<Shape, (c: CanvasRenderingContext2D, s: number, type: BugType) => void>` — each draws a body-centred silhouette (heading already applied by the caller's `rotate`), using `type.color` for the body and `type.spot` for legs/markings. Legs/wings are static here; the caller adds the animated leg swing it already computes.

Verification is by build + eye (canvas can't be unit-tested without a heavy mock), so this task has no automated test — its gate is `npm run build` and the manual check in Task 11.

- [ ] **Step 1: Create the shapes module**

Create `apps/hiren/src/lib/bugShapes.ts`:

```ts
import type { BugType, Shape } from "./bugGame";

type Draw = (c: CanvasRenderingContext2D, s: number, type: BugType) => void;

const TAU = Math.PI * 2;

function legs(c: CanvasRenderingContext2D, s: number, color: string, pairs: number, spread: number) {
  c.strokeStyle = color;
  c.lineWidth = Math.max(1.4, s * 0.05);
  c.lineCap = "round";
  for (let i = 0; i < pairs; i++) {
    const ly = (-0.2 + (i / Math.max(1, pairs - 1)) * 0.6) * s;
    c.beginPath();
    c.moveTo(-s * 0.28, ly);
    c.lineTo(-s * spread, ly + s * 0.08);
    c.moveTo(s * 0.28, ly);
    c.lineTo(s * spread, ly + s * 0.08);
    c.stroke();
  }
}

function head(c: CanvasRenderingContext2D, s: number, y: number, r: number) {
  c.fillStyle = "oklch(0.3 0.03 45)";
  c.strokeStyle = "oklch(0.78 0.05 65)";
  c.lineWidth = Math.max(1.2, s * 0.04);
  c.beginPath();
  c.arc(0, y, r, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = "oklch(0.96 0.01 90)";
  c.beginPath();
  c.arc(-r * 0.4, y - r * 0.1, r * 0.22, 0, TAU);
  c.arc(r * 0.4, y - r * 0.1, r * 0.22, 0, TAU);
  c.fill();
}

const gnat: Draw = (c, s, t) => {
  legs(c, s, t.spot, 3, 0.55);
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.1, s * 0.34, s * 0.4, 0, 0, TAU);
  c.fill();
  // oversized googly eyes -> reads cute/harmless
  c.fillStyle = "oklch(0.98 0.01 90)";
  c.beginPath();
  c.arc(-s * 0.14, -s * 0.28, s * 0.18, 0, TAU);
  c.arc(s * 0.14, -s * 0.28, s * 0.18, 0, TAU);
  c.fill();
  c.fillStyle = "oklch(0.2 0.02 60)";
  c.beginPath();
  c.arc(-s * 0.14, -s * 0.26, s * 0.07, 0, TAU);
  c.arc(s * 0.14, -s * 0.26, s * 0.07, 0, TAU);
  c.fill();
};

const moth: Draw = (c, s, t) => {
  legs(c, s, t.spot, 3, 0.45);
  // broad fuzzy wings
  c.fillStyle = t.color;
  c.globalAlpha = 0.92;
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.ellipse(dir * s * 0.36, s * 0.04, s * 0.4, s * 0.5, dir * 0.5, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
  c.fillStyle = t.spot;
  c.beginPath();
  c.ellipse(0, s * 0.08, s * 0.16, s * 0.46, 0, 0, TAU);
  c.fill();
  // feathery antennae
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.2, s * 0.04);
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.moveTo(dir * s * 0.06, -s * 0.4);
    c.quadraticCurveTo(dir * s * 0.3, -s * 0.7, dir * s * 0.18, -s * 0.85);
    c.stroke();
  }
  head(c, s, -s * 0.34, s * 0.18);
};

const wasp: Draw = (c, s, t) => {
  legs(c, s, t.spot, 3, 0.5);
  // blurred wings
  c.fillStyle = "oklch(0.9 0.02 230 / 0.35)";
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.ellipse(dir * s * 0.3, -s * 0.05, s * 0.34, s * 0.18, dir * 0.4, 0, TAU);
    c.fill();
  }
  // striped abdomen
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.18, s * 0.3, s * 0.5, 0, 0, TAU);
  c.fill();
  c.fillStyle = t.spot;
  for (const yy of [0.02, 0.22, 0.42]) {
    c.beginPath();
    c.ellipse(0, s * yy, s * 0.3 * (1 - yy * 0.5), s * 0.07, 0, 0, TAU);
    c.fill();
  }
  // stinger
  c.beginPath();
  c.moveTo(-s * 0.05, s * 0.64);
  c.lineTo(0, s * 0.82);
  c.lineTo(s * 0.05, s * 0.64);
  c.fill();
  head(c, s, -s * 0.36, s * 0.2);
};

const mosquito: Draw = (c, s, t) => {
  legs(c, s, t.spot, 3, 0.7); // long dangling legs
  c.fillStyle = "oklch(0.9 0.02 300 / 0.3)";
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.ellipse(dir * s * 0.26, -s * 0.04, s * 0.3, s * 0.12, dir * 0.5, 0, TAU);
    c.fill();
  }
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.16, s * 0.16, s * 0.46, 0, 0, TAU);
  c.fill();
  head(c, s, -s * 0.36, s * 0.16);
  // long proboscis
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.2, s * 0.045);
  c.beginPath();
  c.moveTo(0, -s * 0.48);
  c.lineTo(0, -s * 0.78);
  c.stroke();
};

const spider: Draw = (c, s, t) => {
  legs(c, s, t.spot, 4, 0.85); // 8 long splayed legs
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.22, s * 0.42, s * 0.46, 0, 0, TAU); // abdomen
  c.fill();
  c.beginPath();
  c.ellipse(0, -s * 0.22, s * 0.26, s * 0.24, 0, 0, TAU); // cephalothorax
  c.fill();
  // fangs
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.4, s * 0.05);
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.moveTo(dir * s * 0.08, -s * 0.4);
    c.lineTo(dir * s * 0.14, -s * 0.54);
    c.stroke();
  }
  c.fillStyle = "oklch(0.96 0.02 30)";
  for (const dx of [-0.12, -0.04, 0.04, 0.12]) {
    c.beginPath();
    c.arc(dx * s, -s * 0.26, s * 0.035, 0, TAU);
    c.fill();
  }
};

const roach: Draw = (c, s, t) => {
  legs(c, s, t.spot, 3, 0.6);
  // flat glossy carapace
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.12, s * 0.42, s * 0.58, 0, 0, TAU);
  c.fill();
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.4, s * 0.05);
  c.beginPath();
  c.moveTo(0, -s * 0.4);
  c.lineTo(0, s * 0.6);
  c.stroke();
  // gloss highlight
  c.fillStyle = "oklch(1 0 0 / 0.25)";
  c.beginPath();
  c.ellipse(-s * 0.16, -s * 0.08, s * 0.1, s * 0.3, -0.3, 0, TAU);
  c.fill();
  head(c, s, -s * 0.4, s * 0.2);
  // long twitching antennae
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.2, s * 0.04);
  for (const dir of [-1, 1]) {
    c.beginPath();
    c.moveTo(dir * s * 0.08, -s * 0.5);
    c.quadraticCurveTo(dir * s * 0.5, -s * 0.8, dir * s * 0.66, -s * 0.6);
    c.stroke();
  }
};

export const SHAPES: Record<Shape, Draw> = {
  gnat, moth, wasp, mosquito, spider, roach,
};
```

- [ ] **Step 2: Type-check via build**

Run: `pnpm --filter hiren build`
Expected: build completes (the module is imported in Task 7; for now confirm it compiles — `npx tsc --noEmit` inside `apps/hiren` also works).

- [ ] **Step 3: Commit**

```bash
git add apps/hiren/src/lib/bugShapes.ts
git commit -m "feat(hiren): six procedural bug silhouettes"
```

---

### Task 7: Render the new silhouettes in BugGame.astro

**Files:**
- Modify: `apps/hiren/src/components/BugGame.astro` (the inline `<script>`: remove the local `BugType`/`TYPES`/ladybug `drawBug` body; import the modules; dispatch by shape)

**Interfaces:**
- Consumes: `TYPES`, `BugType`, `pickType`, `SHAPES` from the new modules.
- Produces: bugs rendered with per-shape silhouettes; spawn uses `pickType`.

This and later BugGame tasks are gated by `pnpm --filter hiren build` plus the manual check in Task 11 (canvas behaviour isn't unit-tested).

- [ ] **Step 1: Import the modules**

At the top of the `<script>` in `apps/hiren/src/components/BugGame.astro`, add:

```ts
import { TYPES, pickType, pointsFor, restoreHealth, drainHealth, isLost, healthColor, HEALTH_MAX, pickTaunt } from "../lib/bugGame";
import type { BugType, Severity } from "../lib/bugGame";
import { SHAPES } from "../lib/bugShapes";
```

Remove the now-duplicated local `type BugType = {…}` and the local `const TYPES: BugType[] = [...]` array (Task 2 owns them). Keep the `Bug`, `Particle`, `Splat` runtime types. Add `tauntAt: number` to the `Bug` type and initialise it to `0` in `spawnBug`.

- [ ] **Step 2: Replace the ladybug body in `drawBug` with a shape dispatch**

In `drawBug`, keep the existing setup (`save`, `translate`, `rotate`, `globalAlpha`, hurt flash) and the animated leg swing block, but replace the fixed ladybug body/head/spots drawing (the ellipse body through the 4-spot loop) with:

```ts
      // body + features per silhouette; hurt flash still overrides the body fill
      const savedColor = b.type.color;
      if (hurt) (b.type as BugType & { color: string }).color = "oklch(0.97 0.04 90)";
      SHAPES[b.type.shape](c, s, b.type);
      if (hurt) (b.type as BugType & { color: string }).color = savedColor;

      // HP pips for multi-hit bugs (unchanged)
      if (b.maxHp > 1) {
        c.fillStyle = "oklch(0.2 0.02 55 / 0.8)";
        for (let i = 0; i < b.hp; i++) {
          c.beginPath();
          c.arc((i - (b.hp - 1) / 2) * s * 0.2, s * 0.12, s * 0.05, 0, Math.PI * 2);
          c.fill();
        }
      }
```

(The leg swing the loop already draws can stay; `SHAPES` adds static legs too — if they visually double up, delete the old swing block and rely on the shape legs. Decide by eye in Task 11.)

- [ ] **Step 3: Spawn via `pickType`**

Find the spawn call in the loop:

```ts
spawnBug(TYPES[Math.floor(rand(0, TYPES.length))]);
```

Replace with:

```ts
const hasBlocker = bugs.some((b) => b.type.severity === 0);
spawnBug(pickType({ squashed, hasBlocker }));
```

And change the two seeded opening spawns (`spawnBug(TYPES[0])` / `spawnBug(TYPES[2])`) to gentle low-severity ones:

```ts
spawnBug(TYPES.find((t) => t.name === "Typo")!);
spawnBug(TYPES.find((t) => t.name === "Off-by-One")!);
```

- [ ] **Step 4: Generalise the Flaky-Test hit check**

In `hit`, replace the name check:

```ts
if (best.type.name === "Flaky Test" && best.hp === best.maxHp && Math.random() < 0.35) {
```

with the flag:

```ts
if (best.type.ignoresHit && best.hp === best.maxHp && Math.random() < 0.35) {
```

- [ ] **Step 5: Build and eyeball**

Run: `pnpm --filter hiren build`
Expected: builds clean. (Full visual check is Task 11.)

- [ ] **Step 6: Commit**

```bash
git add apps/hiren/src/components/BugGame.astro
git commit -m "feat(hiren): render per-severity silhouettes + weighted spawn"
```

---

### Task 8: Points scoring + `+N` toast

**Files:**
- Modify: `apps/hiren/src/components/BugGame.astro`

**Interfaces:**
- Consumes: `pointsFor`, `pickTaunt`.
- Produces: a points `score` shown in the readout; `floatToast` shows the taunt line + `+N`.

- [ ] **Step 1: Add a points accumulator**

Near the other game state (`let squashed = 0;`), add:

```ts
let score = 0;
```

In `openGame`, reset it alongside `squashed`:

```ts
squashed = 0;
score = 0;
scoreVal.textContent = "0";
```

- [ ] **Step 2: Award points and show `+N` on squash**

In `squash`, replace the score-count block:

```ts
      squashed++;
      scoreVal.textContent = String(squashed);
```

with:

```ts
      squashed++;
      score += pointsFor(b.type.severity);
      scoreVal.textContent = String(score);
```

- [ ] **Step 3: Pass the taunt + points into the toast**

Change the toast call in `squash` from:

```ts
      if (b.type.flavor) floatToast(b.x, b.y, b.type.name, b.type.flavor);
```

to:

```ts
      floatToast(b.x, b.y, b.type.name, pickTaunt(b.type.severity), pointsFor(b.type.severity));
```

Update `floatToast`'s signature and markup:

```ts
    function floatToast(x: number, y: number, name: string, line: string, points: number) {
      const node = document.createElement("div");
      node.className = "game__toast";
      node.style.left = `${x}px`;
      node.style.top = `${y - 24}px`;
      node.innerHTML = `<b>${name} <i>+${points}</i></b><span>${line}</span>`;
      el!.appendChild(node);
      // (keep the existing .animate(...) block unchanged)
```

- [ ] **Step 4: Style the `+N`**

In the component `<style>`, add near the `.game__toast` rules:

```css
  .game__toast b i {
    font-style: normal;
    color: var(--coral);
    font-variant-numeric: tabular-nums;
  }
```

- [ ] **Step 5: Build**

Run: `pnpm --filter hiren build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/hiren/src/components/BugGame.astro
git commit -m "feat(hiren): severity-scaled points and +N toast"
```

---

### Task 9: System-health HUD, drain/restore loop, and lose sequence

**Files:**
- Modify: `apps/hiren/src/components/BugGame.astro` (HUD markup near the score element, `<style>`, game state, the loop, `openGame`, and a new `loseGame`)

**Interfaces:**
- Consumes: `drainHealth`, `restoreHealth`, `isLost`, `healthColor`, `HEALTH_MAX`, `Severity`.
- Produces: a live "System health" bar; a `loseGame()` that reveals the site.

- [ ] **Step 1: Add the HUD markup**

In the game overlay markup, beside the score readout, add the health bar (match the existing `data-*` query style — check the score element's markup and mirror it):

```html
<div class="game__health" data-health>
  <span class="game__health-label">System health</span>
  <span class="game__health-track"><span class="game__health-fill" data-health-fill></span></span>
</div>
```

- [ ] **Step 2: Style the bar**

In `<style>`:

```css
  .game__health {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 9rem;
  }
  .game__health-label {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .game__health-track {
    height: 0.5rem;
    border-radius: 999px;
    background: oklch(0.3 0.02 60 / 0.5);
    overflow: hidden;
  }
  .game__health-fill {
    display: block;
    height: 100%;
    width: 100%;
    border-radius: 999px;
    background: oklch(0.72 0.17 150);
    transition: width 0.2s linear, background-color 0.4s linear;
  }
  .game__health.is-critical .game__health-fill {
    animation: healthflash 0.6s steps(2, end) infinite;
  }
  @keyframes healthflash { 50% { opacity: 0.4; } }
```

- [ ] **Step 3: Wire health state**

Grab the elements next to the other `querySelector` calls:

```ts
const healthEl = el!.querySelector<HTMLElement>("[data-health]")!;
const healthFill = el!.querySelector<HTMLElement>("[data-health-fill]")!;
```

Add state near `let score = 0;`:

```ts
let health = HEALTH_MAX;
```

Add a render helper:

```ts
function renderHealth() {
  healthFill.style.width = `${health}%`;
  healthFill.style.backgroundColor = healthColor(health);
  healthEl.classList.toggle("is-critical", health < 45);
}
```

In `openGame`, reset and paint it:

```ts
health = HEALTH_MAX;
renderHealth();
```

- [ ] **Step 4: Drain in the loop**

In the loop's `if (!scattering) { … }` block (where bugs are live), after the spawn logic, add the drain:

```ts
        if (bugs.length) {
          health = drainHealth(health, bugs.map((b) => b.type.severity) as Severity[], dt);
          renderHealth();
          if (isLost(health)) {
            loseGame();
            return;
          }
        }
```

(`dt` is the loop's per-frame delta in ms — confirm the local name and reuse it.)

- [ ] **Step 5: Restore on squash**

In `squash`, after `score += …`, add:

```ts
      health = restoreHealth(health, b.type.severity);
      renderHealth();
```

- [ ] **Step 6: Add `loseGame`**

Beside `killSwitch`, add:

```ts
    function loseGame() {
      if (scattering) return;
      showPrompt("SYSTEM DOWN — the bugs won", 1600);
      // Reuse the kill-switch scatter+reveal so the site always loads.
      killSwitch();
    }
```

- [ ] **Step 7: Build**

Run: `pnpm --filter hiren build`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add apps/hiren/src/components/BugGame.astro
git commit -m "feat(hiren): system-health bar with drain/restore and lose state"
```

---

### Task 10: Cosmetic-and-up taunt behaviour (pause, face cursor, float a line)

**Files:**
- Modify: `apps/hiren/src/components/BugGame.astro`

**Interfaces:**
- Consumes: `pickTaunt`; the `tauntAt` field added to `Bug` in Task 7; the pointer position the game already tracks.

- [ ] **Step 1: Track the pointer (if not already stored)**

Confirm there's a tracked cursor position (the swatter uses one). If a `px`/`py` (pointer x/y) pair already exists, reuse it. Otherwise add near the pointer handlers:

```ts
let px = -1, py = -1;
el!.addEventListener("pointermove", (e) => {
  const r = canvas!.getBoundingClientRect();
  px = e.clientX - r.left;
  py = e.clientY - r.top;
});
```

- [ ] **Step 2: Occasionally taunt in the update step**

In the per-bug update loop (where position integrates), add a low-probability taunt with a cooldown:

```ts
      // Stop, face the cursor, and float a line — rare, with a 6s per-bug cooldown.
      if (t - b.tauntAt > 6000 && Math.random() < 0.0006 * (dt / 16.7)) {
        b.tauntAt = t;
        if (px >= 0) {
          const ang = Math.atan2(py - b.y, px - b.x);
          b.vx = Math.cos(ang) * 0.02;
          b.vy = Math.sin(ang) * 0.02; // near-freeze, still faces the cursor
        }
        floatToast(b.x, b.y, b.type.name, pickTaunt(b.type.severity), 0);
      }
```

- [ ] **Step 3: Hide `+0` for taunts**

So a taunt doesn't show "+0", make the points span conditional in `floatToast`:

```ts
      const pts = points > 0 ? ` <i>+${points}</i>` : "";
      node.innerHTML = `<b>${name}${pts}</b><span>${line}</span>`;
```

- [ ] **Step 4: Build**

Run: `pnpm --filter hiren build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/components/BugGame.astro
git commit -m "feat(hiren): bugs pause to taunt with culture lines"
```

---

### Task 11: Copy pass, full build, and manual verification

**Files:**
- Modify: `apps/hiren/src/components/BugGame.astro` (top comment + any stale flavor text)

- [ ] **Step 1: Refresh the intro comment**

Update the file-top comment so it describes severities + health rather than the old single-ladybug framing. Example:

```ts
// The bug game. On the enhanced path it starts on page load and IS the entry:
// squash bugs (six silhouettes across Sev 0-4) before they drain System health.
// The red KILL SWITCH still ends it early; letting health hit red loses but
// still reveals the site. Re-openable from the hub ("Squash bugs").
// Pure enhancement — fired by `game:open`, never shown when motion is reduced.
```

- [ ] **Step 2: Run the logic tests and the build together**

Run: `pnpm --filter hiren test && pnpm --filter hiren build`
Expected: all unit tests pass; build completes.

- [ ] **Step 3: Manual verification in the browser**

Run: `pnpm --filter hiren dev`, open the site, and in the console clear the gate: `localStorage.removeItem("hiren:played")`, then reload. Confirm:
- Distinct silhouettes appear per tier (gnat/moth/wasp/mosquito/spider/roach), not ladybugs.
- Bugs occasionally stop, face the cursor, and float a culture line; high-severity bugs sometimes use an evasive line.
- Higher-severity bugs take more hits and show a bigger `+N`; the score sums points.
- The "System health" bar drains while bugs are alive, restores on squash (more for tougher bugs), and shifts green → yellow → red.
- Letting health fall below 35 plays "SYSTEM DOWN — the bugs won" and then reveals the portfolio.
- A Blocker shows up only occasionally and reads as the boss.
- The kill switch still reveals the site; a reduced-motion profile still shows no game.

- [ ] **Step 4: Final commit (if the copy pass changed anything)**

```bash
git add apps/hiren/src/components/BugGame.astro
git commit -m "docs(hiren): refresh bug-game intro comment for severity/health"
```

---

## Self-Review notes

- **Spec coverage:** silhouettes (Tasks 6–7), severity roster (Task 2), weighted spawn + rare blocker (Task 3), points + `+N` (Task 8), System-health drain/restore/colour/lose (Tasks 4, 9), taunts on all severities + evasive for high (Tasks 5, 10), lose-still-reveals-site (Task 9 `loseGame` → `killSwitch`), reduced-motion untouched (verified Task 11). All spec sections map to a task.
- **Types:** `pickType`, `pointsFor`, `drainHealth`, `restoreHealth`, `isLost`, `healthColor`, `pickTaunt`, `SHAPES`, and the `BugType`/`Severity`/`Shape` types are defined once (Tasks 2–6) and consumed with the same names in Tasks 7–10.
- **Tunables:** all severity numbers live as named constants in `bugGame.ts`, per the global constraints.
