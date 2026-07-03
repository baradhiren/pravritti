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

/** Agent categories stored in CultureGrid.types (Phase 2). */
export const TYPE_NORMAL = 0;
export const TYPE_HUB = 1;
export const TYPE_ZEALOT = 2;
export const TYPE_OPEN = 3;
export const TYPE_STUBBORN = 4;

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
}

export const defaultConfig: CultureConfig = {
  traitCounts: [4, 5, 5, 6],
  weights: [0.4, 0.15, 0.2, 0.25],
  batchSize: 96,
  innovationRate: 0.01,
  driftPerTick: 0.4,
  warmupTicks: 2000,
  openRate: 1.6,
  stubbornRate: 0.45,
  hubRadius: 3,
  hubPulses: 2,
  zealotFraction: 0.004,
  openFraction: 0.08,
  stubbornFraction: 0.08,
};

export interface CultureGrid {
  cols: number;
  rows: number;
  /** cols × rows cells × FEATURES traits, row-major. */
  cells: Uint8Array;
  /** Reserved for Phase 2 agent categories; all zero in v1. */
  types: Uint8Array;
  /** Hub cell indices, filled by seedTypes (empty in v1 mode). */
  hubs: number[];
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
  return { cols, rows, cells, types: new Uint8Array(cols * rows), hubs: [] };
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

/** A trait in [0, q) guaranteed different from `not`. */
function differentTrait(q: number, not: number, rng: Rng): number {
  return (not + 1 + Math.floor(rng() * (q - 1))) % q;
}

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
  return influence(grid, cell, grid.cells, nbr * FEATURES, cfg, rng);
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

  let drifts = Math.floor(cfg.driftPerTick);
  if (rng() < cfg.driftPerTick - drifts) drifts++;
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
  return count;
}

/** Run cfg.warmupTicks batches so the first painted frame shows regions. */
export function warmup(grid: CultureGrid, cfg: CultureConfig, rng: Rng): void {
  const scratch: number[] = [];
  for (let i = 0; i < cfg.warmupTicks; i++) {
    scratch.length = 0;
    stepBatch(grid, cfg, rng, scratch);
  }
}

/** Mean similarity over each cell's right and down neighbors (torus). */
export function meanNeighborSimilarity(grid: CultureGrid, cfg: CultureConfig): number {
  const n = grid.cols * grid.rows;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += similarity(grid, i, neighborIndex(grid, i, 1), cfg);
    sum += similarity(grid, i, neighborIndex(grid, i, 3), cfg);
  }
  return sum / (2 * n);
}
