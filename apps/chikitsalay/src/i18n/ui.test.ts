import { describe, expect, it } from "vitest";
import {
  ui,
  t,
  getLocale,
  stripLocale,
  localizePath,
  oppositeLocale,
  switchLocalePath,
} from "./ui";

describe("ui dictionaries", () => {
  it("has identical key sets for gu and en", () => {
    const gu = Object.keys(ui.gu).sort();
    const en = Object.keys(ui.en).sort();
    expect(en).toEqual(gu);
  });

  it("has non-empty strings for every key", () => {
    for (const locale of ["gu", "en"] as const) {
      for (const [key, val] of Object.entries(ui[locale])) {
        expect(val.trim().length, `${locale}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("t() returns the localized string", () => {
    expect(t("en", "nav.blog")).toBe(ui.en["nav.blog"]);
    expect(t("gu", "nav.blog")).toBe(ui.gu["nav.blog"]);
  });
});

describe("locale helpers", () => {
  it("detects locale from pathname", () => {
    expect(getLocale("/")).toBe("gu");
    expect(getLocale("/blog/")).toBe("gu");
    expect(getLocale("/en")).toBe("en");
    expect(getLocale("/en/")).toBe("en");
    expect(getLocale("/en/blog/")).toBe("en");
  });

  it("strips the locale prefix to the gu-canonical path", () => {
    expect(stripLocale("/")).toBe("/");
    expect(stripLocale("/blog/")).toBe("/blog/");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/en/")).toBe("/");
    expect(stripLocale("/en/blog/")).toBe("/blog/");
  });

  it("localizes a canonical path", () => {
    expect(localizePath("gu", "/")).toBe("/");
    expect(localizePath("gu", "/blog/")).toBe("/blog/");
    expect(localizePath("en", "/")).toBe("/en/");
    expect(localizePath("en", "/blog/")).toBe("/en/blog/");
  });

  it("gives the opposite locale", () => {
    expect(oppositeLocale("gu")).toBe("en");
    expect(oppositeLocale("en")).toBe("gu");
  });

  it("switches a pathname to the other locale", () => {
    expect(switchLocalePath("/")).toBe("/en/");
    expect(switchLocalePath("/en/")).toBe("/");
    expect(switchLocalePath("/blog/")).toBe("/en/blog/");
    expect(switchLocalePath("/en/blog/")).toBe("/blog/");
  });
});
