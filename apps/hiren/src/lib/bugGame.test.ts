import { describe, expect, it } from "vitest";
import { TYPES, POINTS, pointsFor, severityWeights, pickType } from "./bugGame";

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
