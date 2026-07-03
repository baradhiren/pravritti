/**
 * Axelrod culture-dissemination model (v1: uniform rules for every agent).
 *
 * Pure logic — no DOM, no Date, no Math.random. All randomness flows through
 * an injectable RNG so tests are deterministic. Every rate lives in
 * CultureConfig so Phase 2 (agent categories) and Phase 3 (user influence)
 * tune and extend this module rather than rewrite it; CultureGrid.types is
 * the reserved per-cell agent-category byte (all zero in v1).
 *
 * Spec: .docs/superpowers/specs/2026-07-03-pravritti-landing-page-design.md
 */

/** Uniform random in [0, 1). */
export type Rng = () => number;

/** Feature order everywhere: religious, logical, economical, societal. */
export const FEATURES = 4;

export interface CultureConfig {
  /** Trait count q per feature. */
  traitCounts: readonly number[];
  /** Similarity weight per feature; must sum to 1. */
  weights: readonly number[];
  /** Interaction attempts per stepBatch call. */
  batchSize: number;
  /** Chance an accepted interaction invents a novel trait instead of copying. */
  innovationRate: number;
  /** Average random single-feature mutations per stepBatch (may be < 1). */
  driftPerTick: number;
  /** Batches run before first paint so regions exist on frame one. */
  warmupTicks: number;
}

export const defaultConfig: CultureConfig = {
  traitCounts: [4, 5, 5, 6],
  weights: [0.4, 0.15, 0.2, 0.25],
  batchSize: 96,
  innovationRate: 0.01,
  driftPerTick: 0.4,
  warmupTicks: 2000,
};

export interface CultureGrid {
  cols: number;
  rows: number;
  /** cols × rows cells × FEATURES traits, row-major. */
  cells: Uint8Array;
  /** Reserved for Phase 2 agent categories; all zero in v1. */
  types: Uint8Array;
}

/** Deterministic 32-bit RNG (mulberry32). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fresh grid with uniformly random traits per feature. */
export function createGrid(
  cols: number,
  rows: number,
  cfg: CultureConfig,
  rng: Rng,
): CultureGrid {
  const cells = new Uint8Array(cols * rows * FEATURES);
  for (let i = 0; i < cols * rows; i++) {
    for (let f = 0; f < FEATURES; f++) {
      cells[i * FEATURES + f] = Math.floor(rng() * cfg.traitCounts[f]);
    }
  }
  return { cols, rows, cells, types: new Uint8Array(cols * rows) };
}

/** Weighted fraction of features on which cells a and b agree. */
export function similarity(
  grid: CultureGrid,
  a: number,
  b: number,
  cfg: CultureConfig,
): number {
  let s = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[a * FEATURES + f] === grid.cells[b * FEATURES + f]) {
      s += cfg.weights[f];
    }
  }
  return s;
}

/** Torus von Neumann neighbor of `cell` in direction d (0=L,1=R,2=U,3=D). */
export function neighborIndex(grid: CultureGrid, cell: number, d: number): number {
  const { cols, rows } = grid;
  const x = cell % cols;
  const y = (cell / cols) | 0;
  if (d === 0) return y * cols + ((x + cols - 1) % cols);
  if (d === 1) return y * cols + ((x + 1) % cols);
  if (d === 2) return ((y + rows - 1) % rows) * cols + x;
  return ((y + 1) % rows) * cols + x;
}

/** A trait in [0, q) guaranteed different from `not`. */
function differentTrait(q: number, not: number, rng: Rng): number {
  return (not + 1 + Math.floor(rng() * (q - 1))) % q;
}

/**
 * One homophily-gated influence attempt from `nbr` onto `cell`.
 * Returns the feature index that changed, or -1 if nothing happened.
 * RNG draw order: acceptance, differing-feature pick, innovation, [novel trait].
 */
export function interact(
  grid: CultureGrid,
  cell: number,
  nbr: number,
  cfg: CultureConfig,
  rng: Rng,
): number {
  if (cell === nbr) return -1;
  const sim = similarity(grid, cell, nbr, cfg);
  if (sim >= 1) return -1; // identical — nothing to exchange
  if (rng() >= sim) return -1; // homophily gate; always rejects at sim 0

  // Pick uniformly among differing features without allocating.
  let nDiff = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] !== grid.cells[nbr * FEATURES + f]) nDiff++;
  }
  let k = Math.floor(rng() * nDiff);
  let feature = 0;
  for (let f = 0; f < FEATURES; f++) {
    if (grid.cells[cell * FEATURES + f] !== grid.cells[nbr * FEATURES + f] && k-- === 0) {
      feature = f;
      break;
    }
  }

  const at = cell * FEATURES + feature;
  grid.cells[at] =
    rng() < cfg.innovationRate
      ? differentTrait(cfg.traitCounts[feature], grid.cells[at], rng)
      : grid.cells[nbr * FEATURES + feature];
  return feature;
}

/**
 * Advance one tick: cfg.batchSize interaction attempts plus cultural drift.
 * Drift keeps the grid out of Axelrod's absorbing (frozen) state forever.
 * Changed cell indices are pushed into `changed` (duplicates possible).
 */
export function stepBatch(
  grid: CultureGrid,
  cfg: CultureConfig,
  rng: Rng,
  changed: number[],
): number {
  const n = grid.cols * grid.rows;
  let count = 0;
  for (let i = 0; i < cfg.batchSize; i++) {
    const cell = Math.floor(rng() * n);
    const nbr = neighborIndex(grid, cell, Math.floor(rng() * 4));
    if (interact(grid, cell, nbr, cfg, rng) >= 0) {
      changed.push(cell);
      count++;
    }
  }
  let drifts = Math.floor(cfg.driftPerTick);
  if (rng() < cfg.driftPerTick - drifts) drifts++;
  for (let i = 0; i < drifts; i++) {
    const cell = Math.floor(rng() * n);
    const f = Math.floor(rng() * FEATURES);
    const at = cell * FEATURES + f;
    grid.cells[at] = differentTrait(cfg.traitCounts[f], grid.cells[at], rng);
    changed.push(cell);
    count++;
  }
  return count;
}
