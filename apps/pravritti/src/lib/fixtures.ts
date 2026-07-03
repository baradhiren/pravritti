import { FEATURES, type CultureConfig } from "./culture";

/**
 * Shared test fixtures — not part of the shipped bundle.
 * Imported only by *.test.ts files; never collected by vitest itself.
 */

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

/** RNG stub that replays a fixed sequence (cycles if exhausted). */
export function seqRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}
