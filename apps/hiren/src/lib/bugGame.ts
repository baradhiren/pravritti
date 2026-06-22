export type Severity = 0 | 1 | 2 | 3 | 4;
export type Shape = "gnat" | "fly" | "moth" | "wasp" | "mosquito" | "spider" | "roach" | "centipede";

export type BugType = {
  name: string;
  severity: Severity;
  shape: Shape;
  hp: number;
  sizeMul: number;
  speedMul: number;
  color: string; // body
  spot: string; // markings / legs accent
  grows?: boolean;
  dodges?: boolean;
  flickers?: boolean;
  ignoresHit?: boolean; // sometimes shrugs off the first hit (Flaky Test)
};

export const POINTS: Record<Severity, number> = { 4: 1, 3: 2, 2: 5, 1: 10, 0: 25 };
export const pointsFor = (sev: Severity): number => POINTS[sev];

// Sev 4 Cosmetic (gnat) · 3 Minor (moth/fly) · 2 Major (wasp/mosquito)
// · 1 Critical (spider/roach/centipede) · 0 Blocker (scaled spider/roach)
export const TYPES: BugType[] = [
  // Sev 4 — Cosmetic
  { name: "Typo",         severity: 4, shape: "gnat", hp: 1, sizeMul: 0.7,  speedMul: 0.8, color: "oklch(0.82 0.05 95)",  spot: "oklch(0.62 0.05 95)" },
  { name: "Cosmetic Bug", severity: 4, shape: "gnat", hp: 1, sizeMul: 0.72, speedMul: 0.85, color: "oklch(0.8 0.06 110)", spot: "oklch(0.6 0.05 110)" },
  { name: "i11n issue",  severity: 4, shape: "gnat", hp: 1, sizeMul: 0.7,  speedMul: 0.8, color: "oklch(0.83 0.04 80)",  spot: "oklch(0.62 0.04 80)" },
  { name: "Source Code Leakage",   severity: 4, shape: "gnat", hp: 1, sizeMul: 0.68, speedMul: 0.9, color: "oklch(0.85 0.03 100)", spot: "oklch(0.64 0.03 100)" },
  // Sev 3 — Minor (moth + fly)
  { name: "Off-by-One",     severity: 3, shape: "moth", hp: 1, sizeMul: 0.9,  speedMul: 1.1, color: "oklch(0.74 0.07 70)",  spot: "oklch(0.5 0.06 60)" },
  { name: "Magic Number",   severity: 3, shape: "moth", hp: 1, sizeMul: 0.88, speedMul: 1.0, color: "oklch(0.72 0.08 60)",  spot: "oklch(0.48 0.06 55)" },
  { name: "Console Warning", severity: 3, shape: "fly", hp: 1, sizeMul: 0.95, speedMul: 1.2, color: "oklch(0.6 0.03 150)",  spot: "oklch(0.4 0.03 150)" },
  { name: "Tooltip Typo",   severity: 3, shape: "fly",  hp: 1, sizeMul: 0.92, speedMul: 1.15, color: "oklch(0.62 0.04 160)", spot: "oklch(0.42 0.03 160)" },
  // Sev 2 — Major
  { name: "Race Condition", severity: 2, shape: "wasp",     hp: 2, sizeMul: 0.95, speedMul: 1.7, color: "oklch(0.82 0.15 75)", spot: "oklch(0.32 0.04 60)" },
  { name: "Heisenbug",      severity: 2, shape: "mosquito", hp: 2, sizeMul: 0.9,  speedMul: 1.3, color: "oklch(0.76 0.13 300)", spot: "oklch(0.5 0.12 300)", flickers: true },
  { name: "Flaky Test",     severity: 2, shape: "mosquito", hp: 2, sizeMul: 0.95, speedMul: 1.0, color: "oklch(0.76 0.11 196)", spot: "oklch(0.46 0.1 200)", ignoresHit: true },
  // Sev 1 — Critical
  { name: "Null Pointer", severity: 1, shape: "spider", hp: 3, sizeMul: 1.15, speedMul: 1.0, color: "oklch(0.62 0.2 28)",  spot: "oklch(0.35 0.13 25)", dodges: true },
  { name: "Regression",   severity: 1, shape: "roach",  hp: 3, sizeMul: 1.25, speedMul: 0.8, color: "oklch(0.5 0.08 45)",  spot: "oklch(0.3 0.05 40)" },
  { name: "Memory Leak",  severity: 1, shape: "roach",  hp: 3, sizeMul: 0.95, speedMul: 0.7, color: "oklch(0.6 0.18 22)",  spot: "oklch(0.36 0.14 20)", grows: true },
  { name: "Deadlock",     severity: 1, shape: "spider", hp: 3, sizeMul: 1.2,  speedMul: 0.85, color: "oklch(0.58 0.16 300)", spot: "oklch(0.34 0.12 300)", dodges: true },
  { name: "Cascading Failure", severity: 1, shape: "centipede", hp: 3, sizeMul: 1.0, speedMul: 0.95, color: "oklch(0.55 0.14 35)", spot: "oklch(0.34 0.1 30)" },
  // Sev 0 — Blocker (boss)
  { name: "Segfault",     severity: 0, shape: "spider", hp: 5, sizeMul: 1.7, speedMul: 0.75, color: "oklch(0.5 0.22 25)", spot: "oklch(0.28 0.14 22)", dodges: true },
  { name: "Kernel Panic", severity: 0, shape: "roach",  hp: 5, sizeMul: 1.75, speedMul: 0.7, color: "oklch(0.46 0.12 35)", spot: "oklch(0.26 0.08 30)" },
  { name: "Prod Outage",  severity: 0, shape: "spider", hp: 5, sizeMul: 1.8, speedMul: 0.72, color: "oklch(0.48 0.2 18)",  spot: "oklch(0.26 0.13 18)", dodges: true, grows: true },
];

const EARLY_W: Record<Severity, number> = { 4: 5, 3: 4, 2: 1.5, 1: 0.4, 0: 0 };
const LATE_W: Record<Severity, number> = { 4: 1.5, 3: 2, 2: 3, 1: 2, 0: 0 };

export function severityWeights(progress: number): Record<Severity, number> {
  const p = Math.max(0, Math.min(1, progress));
  const lerp = (a: number, b: number) => a + (b - a) * p;
  return {
    4: lerp(EARLY_W[4], LATE_W[4]),
    3: lerp(EARLY_W[3], LATE_W[3]),
    2: lerp(EARLY_W[2], LATE_W[2]),
    1: lerp(EARLY_W[1], LATE_W[1]),
    0: 0,
  };
}

export function pickType(opts: { squashed: number; hasBlocker: boolean; rng?: () => number }): BugType {
  const rng = opts.rng ?? Math.random;
  // Rare boss: only after a warmup, never more than one alive.
  if (opts.squashed >= 12 && !opts.hasBlocker && rng() < 0.04) {
    const blockers = TYPES.filter((t) => t.severity === 0);
    return blockers[Math.floor(rng() * blockers.length)];
  }
  const w = severityWeights(Math.min(1, opts.squashed / 20));
  const tiers: Severity[] = [4, 3, 2, 1];
  const total = tiers.reduce((sum: number, t) => sum + w[t], 0);
  let r = rng() * total;
  let sev: Severity = 4;
  for (const t of tiers) {
    r -= w[t];
    if (r <= 0) {
      sev = t;
      break;
    }
  }
  const pool = TYPES.filter((t) => t.severity === sev);
  return pool[Math.floor(rng() * pool.length)];
}

export const HEALTH_MAX = 100;
export const LOSE_AT = 35;
export const HEALTH_DRAIN: Record<Severity, number> = { 4: 0, 3: 0, 2: 0.05, 1: 2, 0: 3 };
export const HEALTH_RESTORE: Record<Severity, number> = { 4: 1, 3: 1, 2: 2, 1: 7, 0: 20 };

export const clampHealth = (h: number): number => Math.max(0, Math.min(HEALTH_MAX, h));

export function drainHealth(health: number, severities: Severity[], dtMs: number): number {
  const perSec = severities.reduce((sum: number, sev) => sum + HEALTH_DRAIN[sev], 0);
  return clampHealth(health - perSec * (dtMs / 1000));
}

export const restoreHealth = (health: number, sev: Severity): number =>
  clampHealth(health + HEALTH_RESTORE[sev]);

export const isLost = (health: number): boolean => health < LOSE_AT;

// Green (high) -> red (low). oklch hue 150=green .. 30=red, mapped across
// [LOSE_AT, HEALTH_MAX] so the bar reads fully red right at the fail floor.
export function healthColor(health: number): string {
  const frac = Math.max(0, Math.min(1, (clampHealth(health) - LOSE_AT) / (HEALTH_MAX - LOSE_AT)));
  const hue = Math.round(30 + frac * 120);
  return `oklch(0.72 0.17 ${hue})`;
}

// Deadpan artifacts of a culture that never prioritised these bugs.
export const CULTURE_TAUNTS: string[] = [
  "I am here because a deadline had higher priority.",
  "Marked 'won't fix' three sprints ago.",
  "Still P3. Always P3.",
  "Closed as 'works on my machine.'",
  "Filed under 'known issues.'",
  "Triaged to 'later.' Later never came.",
  "Nobody owns this module.",
  "Repro steps: 'sometimes.'",
  "Cut from scope, not from the build.",
  "There's a // TODO with my name on it.",
  "I survived two reorgs.",
  "Acceptance criteria were aspirational.",
];

// Higher severities also brag about hiding.
export const EVASIVE_TAUNTS: string[] = [
  "Catch me if you can.",
  "I hide in the darkness of checkout.",
  "I live in the auth flow.",
  "I've been in production since launch.",
  "You'll never find my repro.",
  "Roll back — I'll wait.",
  "I scale with your traffic.",
];

export function pickTaunt(severity: Severity, rng: () => number = Math.random): string {
  const pool = severity <= 2 ? [...CULTURE_TAUNTS, ...EVASIVE_TAUNTS] : CULTURE_TAUNTS;
  return pool[Math.floor(rng() * pool.length)];
}
