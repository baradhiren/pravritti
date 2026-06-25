import { describe, expect, it } from "vitest";
import { app, contactEmail, docDates, features, stores } from "./content";

describe("content", () => {
  it("names the app in both scripts", () => {
    expect(app.name).toBe("Tithi");
    expect(app.nameGu).toBe("તિથિ");
  });

  it("lists exactly the seven product features as non-empty strings", () => {
    expect(features).toHaveLength(7);
    for (const f of features) {
      expect(typeof f).toBe("string");
      expect(f.trim().length).toBeGreaterThan(0);
    }
  });

  it("exposes both store slots and a coming-soon flag", () => {
    expect(typeof stores.comingSoon).toBe("boolean");
    expect(stores).toHaveProperty("android");
    expect(stores).toHaveProperty("ios");
  });

  it("provides a contact email and document dates", () => {
    expect(typeof contactEmail).toBe("string");
    expect(contactEmail.length).toBeGreaterThan(0);
    expect(docDates).toHaveProperty("privacy");
    expect(docDates).toHaveProperty("support");
    expect(docDates).toHaveProperty("dataDeletion");
  });
});
