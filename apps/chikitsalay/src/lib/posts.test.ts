import { describe, expect, it } from "vitest";
import { readingMinutes, sortByDateDesc } from "./posts";

describe("readingMinutes", () => {
  it("returns at least 1 minute for short text", () => {
    expect(readingMinutes("a few words here")).toBe(1);
  });

  it("scales with word count (~200 wpm)", () => {
    const text = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readingMinutes(text)).toBe(3);
  });
});

describe("sortByDateDesc", () => {
  it("orders posts newest first without mutating input", () => {
    const input = [
      { data: { date: new Date("2026-01-01") } },
      { data: { date: new Date("2026-03-01") } },
      { data: { date: new Date("2026-02-01") } },
    ];
    const out = sortByDateDesc(input);
    expect(out.map((p) => p.data.date.getMonth())).toEqual([2, 1, 0]);
    expect(input[0].data.date.getMonth()).toBe(0); // input unchanged
  });
});
