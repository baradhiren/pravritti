/**
 * Phase 3 visitor influence: the cursor as a local "media field" and
 * click-stamped culture patches. Pure logic — injected RNG, no DOM.
 * Field attempts route through culture.influence and the stamp preserves
 * zealot anchors, so the Phase 2 rulebook holds against the visitor too.
 * Spec: .docs/superpowers/specs/2026-07-04-culture-sim-phase3-user-influence-design.md
 */
import {
  FEATURES,
  TYPE_ZEALOT,
  type CultureConfig,
  type CultureGrid,
  type Rng,
} from "./culture";

export interface FieldConfig {
  /** Chebyshev cell radius of the media field. */
  radius: number;
  /** Influence attempts per sim tick while the field is active. */
  attempts: number;
  /** Euclidean cell radius of a stamped patch. */
  patchRadius: number;
}

export const defaultFieldConfig: FieldConfig = {
  radius: 4,
  attempts: 3,
  patchRadius: 2.5,
};

export interface FieldState {
  /** Pointer position in cell units (float). */
  x: number;
  y: number;
  /** False when idle, off-window, or on touch-only input. */
  active: boolean;
  /** The visitor's culture — FEATURES traits, fixed per visit. */
  vector: Uint8Array;
}

/** Uniform random culture vector within cfg.traitCounts. */
export function randomVector(cfg: CultureConfig, rng: Rng): Uint8Array {
  const v = new Uint8Array(FEATURES);
  for (let f = 0; f < FEATURES; f++) v[f] = Math.floor(rng() * cfg.traitCounts[f]);
  return v;
}

/** Inactive field at the origin with a fresh per-visit culture. */
export function createField(cfg: CultureConfig, rng: Rng): FieldState {
  return { x: 0, y: 0, active: false, vector: randomVector(cfg, rng) };
}

/**
 * Overwrite every cell within Euclidean patchRadius of the base cell
 * (floor(cx), floor(cy)) — torus-wrapped — with `vector`. Zealots keep
 * their immutable religious feature (index 0); no cell's type changes.
 * Touched cells are pushed into `changed`; returns how many were stamped.
 * Assumes 2 * ceil(patchRadius) + 1 <= cols/rows (true for every
 * production grid), so distinct offsets never wrap onto the same cell.
 */
export function stampPatch(
  grid: CultureGrid,
  cx: number,
  cy: number,
  vector: Uint8Array,
  fieldCfg: FieldConfig,
  changed: number[],
): number {
  const r = fieldCfg.patchRadius;
  const ir = Math.ceil(r);
  const bx = Math.min(grid.cols - 1, Math.floor(cx));
  const by = Math.min(grid.rows - 1, Math.floor(cy));
  let stamped = 0;
  for (let dy = -ir; dy <= ir; dy++) {
    for (let dx = -ir; dx <= ir; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = (((bx + dx) % grid.cols) + grid.cols) % grid.cols;
      const y = (((by + dy) % grid.rows) + grid.rows) % grid.rows;
      const cell = y * grid.cols + x;
      const f0 = grid.types[cell] === TYPE_ZEALOT ? 1 : 0;
      for (let f = f0; f < FEATURES; f++) {
        grid.cells[cell * FEATURES + f] = vector[f];
      }
      changed.push(cell);
      stamped++;
    }
  }
  return stamped;
}
