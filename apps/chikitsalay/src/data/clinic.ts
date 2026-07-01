/**
 * Single source of truth for all Chikitsalay clinic FACTS. Every value marked
 * TODO_ is an intentional placeholder — valid for the build, must be filled
 * before go-live. UI/interface copy lives in ../i18n/ui.ts, not here.
 */

export const clinic = {
  name: "Pravritti Chikitsalay",
  nameGu: "પ્રવૃત્તિ ચિકિત્સાલય",
  wordmark: "pravritti",

  taglineEn: "Rooted care for lasting wellbeing",
  taglineGu: "પ્રકૃતિ સાથે, સ્વસ્થ જીવન",

  doctor: {
    name: "Dr. Durgaben Vala",
    nameGu: "ડૉ. દુર્ગાબેન વાળા",
    credentials: "BAMS · Ayurvedic Physician", // TODO_CONFIRM real credentials
    credentialsGu: "BAMS · આયુર્વેદિક ચિકિત્સક",
  },

  city: "Sutrapada, Gujarat",
  cityGu: "સૂત્રાપાડા, ગુજરાત",
  addressLines: ["TODO_ADDRESS_LINE_1", "Sutrapada, Gir Somnath, Gujarat"],
  // Real Google Maps link supplied by the clinic — keep as-is.
  mapsUrl: "https://maps.app.goo.gl/Md1bxccuyyCq6FYp8",

  phone: "TODO_PHONE", // e.g. "+91 90000 00000"
  whatsapp: "https://wa.me/TODO_WHATSAPP_NUMBER", // digits only, incl. country code
  instagram: "https://instagram.com/TODO_INSTAGRAM_HANDLE",
  instagramBooking: "https://instagram.com/TODO_INSTAGRAM_HANDLE", // booking via DM
  email: "TODO_EMAIL", // e.g. "clinic@pravritti.org"

  hoursShort: "Mon–Sat · 9:30–1:30, 4–7", // TODO_CONFIRM hours
  hoursShortGu: "સોમ–શનિ · 9:30–1:30, 4–7",

  yearsPractice: "15+", // TODO_CONFIRM
  qualification: "BAMS", // TODO_CONFIRM
  rating: "4.9★", // TODO_CONFIRM / remove if no public rating
} as const;

export const treatments = [
  {
    slug: "panchakarma",
    titleEn: "Panchakarma",
    titleGu: "પંચકર્મ",
    blurbEn: "Deep detoxification and rejuvenation therapies, tailored and supervised end to end.",
    blurbGu: "ઊંડી શુદ્ધિ અને પુનર્યૌવન ચિકિત્સા — વ્યક્તિગત અને સંપૂર્ણ દેખરેખ હેઠળ.",
  },
  {
    slug: "chronic",
    titleEn: "Chronic conditions",
    titleGu: "દીર્ઘકાલીન રોગ",
    blurbEn: "Joint pain, skin, digestion, and lifestyle disorders addressed at the root.",
    blurbGu: "સાંધાનો દુખાવો, ત્વચા, પાચન અને જીવનશૈલીના રોગોની મૂળથી સારવાર.",
  },
  {
    slug: "womens-wellness",
    titleEn: "Women's wellness",
    titleGu: "સ્ત્રી આરોગ્ય",
    blurbEn: "Menstrual health, fertility support, and pre- and post-natal Ayurvedic care.",
    blurbGu: "માસિક આરોગ્ય, પ્રજનન સહાય અને ગર્ભાવસ્થા પૂર્વે-પછીની આયુર્વેદિક સંભાળ.",
  },
] as const;

export const credentialChips = [
  { en: "Panchakarma specialist", gu: "પંચકર્મ નિષ્ણાત" },
  { en: "Herbal formulation", gu: "ઔષધ નિર્માણ" },
  { en: "Diet & lifestyle", gu: "આહાર અને જીવનશૈલી" },
] as const;
