import { describe, expect, it } from "vitest";
import { agentColor, BG, cellAlpha, cellColor, cellRadius, FAMILIES, mix, type Rgb, ZEALOT_PIN } from "./palette";

function dist(a: Rgb, b: Rgb): number {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

describe("mix", () => {
  it("hits both endpoints and the midpoint", () => {
    const a: Rgb = { r: 0, g: 100, b: 200 };
    const b: Rgb = { r: 100, g: 0, b: 0 };
    expect(mix(a, b, 0)).toEqual(a);
    expect(mix(a, b, 1)).toEqual(b);
    expect(mix(a, b, 0.5)).toEqual({ r: 50, g: 50, b: 100 });
  });
});

describe("cellColor", () => {
  it("stays heavily washed toward the cream background for every trait combo", () => {
    const bgSpan = dist({ r: 0, g: 0, b: 0 }, BG);
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      for (let soc = 0; soc < 6; soc++) {
        const c = cellColor(rel, soc, 6);
        // Quiet wash: every cell color sits much nearer BG than its family base.
        expect(dist(c, BG)).toBeLessThan(dist(FAMILIES[rel], BG) * 0.45);
        expect(dist(c, BG)).toBeLessThan(bgSpan); // sanity: valid, near-bg color
      }
    }
  });

  it("higher societal shade moves the color closer to the background", () => {
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      const deep = cellColor(rel, 0, 6);
      const airy = cellColor(rel, 5, 6);
      expect(dist(airy, BG)).toBeLessThan(dist(deep, BG));
    }
  });

  it("keeps hue families distinguishable at the same shade", () => {
    const seen = new Set(
      Array.from({ length: FAMILIES.length }, (_, rel) => {
        const c = cellColor(rel, 2, 6);
        return `${c.r},${c.g},${c.b}`;
      }),
    );
    expect(seen.size).toBe(FAMILIES.length);
  });
});

describe("cellAlpha / cellRadius", () => {
  it("alpha is monotonic in the logical trait and bounded", () => {
    let prev = 0;
    for (let l = 0; l < 5; l++) {
      const a = cellAlpha(l, 5);
      expect(a).toBeGreaterThanOrEqual(0.55);
      expect(a).toBeLessThanOrEqual(1);
      expect(a).toBeGreaterThan(prev);
      prev = a;
    }
    expect(cellAlpha(4, 5)).toBe(1);
  });

  it("radius is monotonic in the economical trait and fits the cell slot", () => {
    let prev = 0;
    for (let e = 0; e < 5; e++) {
      const r = cellRadius(e, 5, 14);
      expect(r).toBeGreaterThan(prev);
      expect(r).toBeLessThan(7); // must never overflow a 14px slot
      prev = r;
    }
    expect(cellRadius(0, 5, 14)).toBeCloseTo(0.24 * 14, 5);
    expect(cellRadius(4, 5, 14)).toBeCloseTo(0.38 * 14, 5);
  });
});

describe("agentColor / ZEALOT_PIN", () => {
  it("is far more saturated than the washed cell color", () => {
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      for (let soc = 0; soc < 6; soc++) {
        const agent = agentColor(rel, soc, 6);
        const cell = cellColor(rel, soc, 6);
        expect(dist(agent, BG)).toBeGreaterThan(dist(cell, BG) * 2);
      }
    }
  });

  it("keeps families distinguishable and fades with societal shade", () => {
    const seen = new Set(
      Array.from({ length: FAMILIES.length }, (_, rel) => {
        const c = agentColor(rel, 2, 6);
        return `${c.r},${c.g},${c.b}`;
      }),
    );
    expect(seen.size).toBe(FAMILIES.length);
    for (let rel = 0; rel < FAMILIES.length; rel++) {
      expect(dist(agentColor(rel, 5, 6), BG)).toBeLessThan(dist(agentColor(rel, 0, 6), BG));
    }
  });

  it("pins are the logo deep brown #472c1f", () => {
    expect(ZEALOT_PIN).toEqual({ r: 71, g: 44, b: 31 });
  });
});
