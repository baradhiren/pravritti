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
