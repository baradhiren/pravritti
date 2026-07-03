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
