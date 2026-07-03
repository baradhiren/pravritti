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
