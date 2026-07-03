import { describe, expect, it } from "vitest";
import {
  createGrid,
  defaultConfig,
  FEATURES,
  interact,
  meanNeighborSimilarity,
  mulberry32,
  neighborIndex,
  seedTypes,
  similarity,
  stepBatch,
  TYPE_HUB,
  TYPE_OPEN,
  TYPE_STUBBORN,
  TYPE_ZEALOT,
  warmup,
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
  openRate: 1,
  stubbornRate: 1,
  hubRadius: 3,
  hubPulses: 0,
  zealotFraction: 0,
  openFraction: 0,
  stubbornFraction: 0,
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

const GOLDEN_V1_HASH = 1748424110; // captured from unmodified v1 code (Task 1 Step 1)

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
