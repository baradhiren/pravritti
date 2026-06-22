import { describe, expect, it } from "vitest";
import {
  TYPES, POINTS, pointsFor, severityWeights, pickType,
  drainHealth, restoreHealth, isLost, healthColor, clampHealth, HEALTH_MAX, LOSE_AT,
  CULTURE_TAUNTS, EVASIVE_TAUNTS, pickTaunt,
} from "./bugGame";

describe("roster", () => {
  it("covers every severity tier 0..4", () => {
    const sevs = new Set(TYPES.map((t) => t.severity));
    expect([...sevs].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("only references the eight known shapes", () => {
    const shapes = new Set(["gnat", "fly", "moth", "wasp", "mosquito", "spider", "roach", "centipede"]);
    for (const t of TYPES) expect(shapes.has(t.shape)).toBe(true);
  });

  it("maps points by severity", () => {
    expect(pointsFor(4)).toBe(1);
    expect(pointsFor(2)).toBe(5);
    expect(pointsFor(0)).toBe(25);
    expect(POINTS[1]).toBe(10);
  });
});

describe("spawn weighting", () => {
  it("favours low severity early, higher severity late", () => {
    const early = severityWeights(0);
    const late = severityWeights(1);
    expect(early[4]).toBeGreaterThan(early[1]);
    expect(late[2] + late[1]).toBeGreaterThan(late[4]);
  });

  it("never spawns a blocker from the weighted path", () => {
    expect(severityWeights(0)[0]).toBe(0);
    expect(severityWeights(1)[0]).toBe(0);
  });

  it("rng=0 early picks a Cosmetic (sev 4) type", () => {
    const t = pickType({ squashed: 0, hasBlocker: false, rng: () => 0 });
    expect(t.severity).toBe(4);
  });

  it("spawns a blocker only after warmup, one at a time", () => {
    expect(pickType({ squashed: 12, hasBlocker: false, rng: () => 0 }).severity).toBe(0);
    expect(pickType({ squashed: 12, hasBlocker: true, rng: () => 0 }).severity).not.toBe(0);
    expect(pickType({ squashed: 5, hasBlocker: false, rng: () => 0 }).severity).not.toBe(0);
  });
});

describe("system health", () => {
  it("drains by summed severity rate over time", () => {
    // Critical drains 2/s -> 100 - 2 = 98 after 1s
    expect(drainHealth(100, [1], 1000)).toBeCloseTo(98, 5);
    // Critical (2) + Cosmetic (0.005) = 2.005/s for 0.5s -> ~1.0025 damage
    expect(drainHealth(100, [1, 4], 500)).toBeCloseTo(98.9975, 4);
  });

  it("never drains below zero", () => {
    expect(drainHealth(1, [0], 5000)).toBe(0);
  });

  it("restores by severity and caps at max", () => {
    expect(restoreHealth(50, 1)).toBe(62);
    expect(restoreHealth(95, 0)).toBe(HEALTH_MAX);
  });

  it("loses strictly below the threshold", () => {
    expect(isLost(LOSE_AT)).toBe(false);
    expect(isLost(LOSE_AT - 0.01)).toBe(true);
  });

  it("clamps and colours from green (high) to red (low)", () => {
    expect(clampHealth(140)).toBe(100);
    expect(clampHealth(-3)).toBe(0);
    expect(healthColor(100)).toContain("150");
    expect(healthColor(LOSE_AT)).toContain("30");
  });
});

describe("taunts", () => {
  it("low severity draws only from the culture pool", () => {
    expect(pickTaunt(4, () => 0)).toBe(CULTURE_TAUNTS[0]);
    for (let i = 0; i < 50; i++) {
      const line = pickTaunt(3, Math.random);
      expect(CULTURE_TAUNTS).toContain(line);
    }
  });

  it("high severity can draw from the evasive pool too", () => {
    const line = pickTaunt(1, () => 0.999999);
    expect(EVASIVE_TAUNTS).toContain(line);
  });
});
