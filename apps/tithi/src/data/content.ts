/**
 * Single source of truth for all Tithi-site copy, links, and the contact email.
 * Launch-day edits (real store URLs, contact email) happen here only.
 * Items prefixed TODO_ are intentional placeholders — safe for the build,
 * must be filled before go-live.
 */

export const app = {
  name: "Tithi",
  nameGu: "તિથિ",
  tagline: "ગુજરાતી વિક્રમ સંવત પંચાંગ — તહેવાર અને ચોઘડિયા",
  taglineEn: "Today's panchang",
  subtitle: "Gujarati panchang calendar",
  shortDescription:
    "Gujarati Vikram Samvat panchang — tithi, festivals, choghadiya.",
  description:
    "Tithi is a Gujarati panchang for your phone. It brings the authority of the printed tithi-patra into a calm, modern, Gujarati-first app — built for daily tithi and vrat checks, festivals, and choghadiya.",
  closingLine:
    "A quiet morning and evening companion for tithi, festival, and muhurat checks.",
} as const;

export const features: string[] = [
  "Vikram Samvat and Gregorian dates side by side.",
  "Today's tithi at a glance, with the lunar month and paksha.",
  "Festivals and holidays highlighted across the month.",
  "Choghadiya and muhurat timing for day and night, by city.",
  "Moon phases rendered as a hand-drawn diya moon.",
  "Gujarati-first typography in a restful, dark design.",
  "Works offline. No account, no ads, and no personal data collected.",
];

export const stores = {
  // Listings submitted/imminent — flip comingSoon to false and paste real URLs.
  comingSoon: true,
  android: "TODO_PLAY_STORE_URL",
  ios: "TODO_APP_STORE_URL",
} as const;

// TODO: replace with the real support inbox before go-live.
export const contactEmail = "tithi@pravritti.org";

export const docDates = {
  privacy: "2026-06-25",
  support: "2026-06-25",
  dataDeletion: "2026-06-25",
} as const;
