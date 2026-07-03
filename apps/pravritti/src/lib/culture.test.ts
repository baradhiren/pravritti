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
