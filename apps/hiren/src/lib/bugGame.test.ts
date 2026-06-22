import { describe, expect, it } from "vitest";
import { TYPES, POINTS, pointsFor } from "./bugGame";

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
