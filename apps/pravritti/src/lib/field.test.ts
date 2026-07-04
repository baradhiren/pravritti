import { describe, expect, it } from "vitest";
import { createGrid, FEATURES, mulberry32, TYPE_OPEN, TYPE_ZEALOT, TYPE_STUBBORN } from "./culture";
import { setCell, testConfig } from "./fixtures";
import {
  createField,
  defaultFieldConfig,
  randomVector,
  stampPatch,
  stepField,
  type FieldConfig,
  type FieldState,
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
