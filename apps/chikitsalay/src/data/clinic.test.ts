import { describe, expect, it } from "vitest";
import { clinic, treatments, credentialChips } from "./clinic";

describe("clinic facts", () => {
  it("names the clinic and doctor in both scripts", () => {
    expect(clinic.name).toBe("Pravritti Chikitsalay");
    expect(clinic.nameGu.length).toBeGreaterThan(0);
    expect(clinic.doctor.name).toContain("Vala");
    expect(clinic.doctor.nameGu.length).toBeGreaterThan(0);
  });

  it("keeps the real Google Maps link (not a placeholder)", () => {
    expect(clinic.mapsUrl).toMatch(/^https:\/\/maps\.app\.goo\.gl\//);
  });

  it("exposes contact + social slots", () => {
    for (const key of ["phone", "whatsapp", "instagram", "instagramBooking", "email"] as const) {
      expect(typeof clinic[key]).toBe("string");
      expect(clinic[key].length).toBeGreaterThan(0);
    }
  });

  it("lists exactly three treatments, each bilingual and non-empty", () => {
    expect(treatments).toHaveLength(3);
    for (const tr of treatments) {
      for (const field of ["slug", "titleEn", "titleGu", "blurbEn", "blurbGu"] as const) {
        expect(tr[field].trim().length, `${tr.slug}.${field}`).toBeGreaterThan(0);
      }
    }
  });

  it("provides credential chips in both languages", () => {
    expect(credentialChips.length).toBeGreaterThan(0);
    for (const chip of credentialChips) {
      expect(chip.en.trim().length).toBeGreaterThan(0);
      expect(chip.gu.trim().length).toBeGreaterThan(0);
    }
  });
});
