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
  { name: "Lorem Ipsum",  severity: 4, shape: "gnat", hp: 1, sizeMul: 0.7,  speedMul: 0.8, color: "oklch(0.83 0.04 80)",  spot: "oklch(0.62 0.04 80)" },
  { name: "Whitespace",   severity: 4, shape: "gnat", hp: 1, sizeMul: 0.68, speedMul: 0.9, color: "oklch(0.85 0.03 100)", spot: "oklch(0.64 0.03 100)" },
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
