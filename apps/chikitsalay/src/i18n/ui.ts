/**
 * Bilingual UI strings + pure locale helpers for the Chikitsalay site.
 * Gujarati is the default locale (served at /); English lives under /en/.
 * Clinic FACTS live in ../data/clinic.ts; only interface copy lives here.
 */

export type Locale = "gu" | "en";
export const locales: readonly Locale[] = ["gu", "en"];
export const defaultLocale: Locale = "gu";

export const ui = {
  gu: {
    "nav.about": "પરિચય",
    "nav.treatments": "સારવાર",
    "nav.blog": "લેખ",
    "nav.contact": "સંપર્ક",
    "nav.menu": "મેનૂ",
    "lang.switch": "English માં જુઓ",
    "cta.book": "ઇન્સ્ટાગ્રામ પર બુક કરો",
    "cta.whatsapp": "વૉટ્સએપ કરો",
    "hero.eyebrow": "આયુર્વેદિક ચિકિત્સાલય · સૂત્રાપાડા, ગુજરાત",
    "hero.leadEn": "Rooted care for lasting wellbeing",
    "hero.lead":
      "ડૉ. દુર્ગાબેન વાળા સાથે શાસ્ત્રોક્ત આયુર્વેદિક પરામર્શ, પંચકર્મ અને વ્યક્તિગત ઔષધ-ઉપચાર — લક્ષણ નહીં, મૂળ કારણની સારવાર.",
    "hero.openToday": "આજે ખુલ્લું",
    "trust.years": "વર્ષનો અનુભવ",
    "trust.qual": "લાયકાત ધરાવતા વૈદ્ય",
    "trust.rating": "દર્દી રેટિંગ",
    "treat.label": "અમે શું સારવાર કરીએ છીએ",
    "treat.head": "શાસ્ત્રોક્ત આયુર્વેદમાંથી ઉપચાર",
    "treat.sub": "દરેક ઉપચાર તમારી પ્રકૃતિ સમજવાથી શરૂ થાય છે.",
    "about.label": "તમારા વૈદ્યને મળો",
    "about.body":
      "ડૉ. વાળા સૂત્રાપાડામાં શાસ્ત્રોક્ત આયુર્વેદની પ્રેક્ટિસ કરે છે — સમય-ચકાસાયેલ શાસ્ત્ર સાથે હૂંફાળો, દર્દી-કેન્દ્રિત અભિગમ. આહાર, દિનચર્યા અને પ્રકૃતિ — સમગ્ર વ્યક્તિને સમજ્યા પછી જ ઉપચાર.",
    "blog.label": "લેખ-સંગ્રહ",
    "blog.head": "રોજિંદા જીવન માટે આયુર્વેદ",
    "blog.sub": "આહાર, ઋતુ અને સરળ ઉપચાર પરના વિસ્તૃત લેખ — ગુજરાતી અને English માં.",
    "blog.viewAll": "બધા લેખ જુઓ",
    "blog.readtime": "મિનિટ વાંચન",
    "blog.back": "← બધા લેખ",
    "blog.empty": "હાલમાં કોઈ લેખ નથી. ટૂંક સમયમાં પાછા આવો.",
    "footer.mission":
      "સૂત્રાપાડા, ગુજરાતમાં શાસ્ત્રોક્ત આયુર્વેદિક સારવાર. મૂળ કારણની, હળવાશથી અને સંપૂર્ણ સારવાર.",
    "footer.clinic": "ચિકિત્સાલય",
    "footer.visit": "મુલાકાત",
    "footer.directions": "દિશા મેળવો",
    "footer.rights": "સર્વ હક્ક સ્વાધીન.",
    "nf.head": "આ પાનું મળ્યું નથી",
    "nf.body": "તમે શોધી રહ્યા છો તે પાનું અહીં નથી.",
    "nf.home": "મુખ્ય પાનાં પર પાછા જાઓ",
  },
  en: {
    "nav.about": "About",
    "nav.treatments": "Treatments",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.menu": "Menu",
    "lang.switch": "ગુજરાતીમાં જુઓ",
    "cta.book": "Book on Instagram",
    "cta.whatsapp": "WhatsApp us",
    "hero.eyebrow": "Ayurvedic Clinic · Sutrapada, Gujarat",
    "hero.leadEn": "પ્રકૃતિ સાથે, સ્વસ્થ જીવન",
    "hero.lead":
      "Classical Ayurvedic consultation, panchakarma, and personalised herbal care with Dr. Durgaben Vala — treating the cause, not just the symptom.",
    "hero.openToday": "Open today",
    "trust.years": "Years of practice",
    "trust.qual": "Qualified Vaidya",
    "trust.rating": "Patient rating",
    "treat.label": "What we treat",
    "treat.head": "Care drawn from classical Ayurveda",
    "treat.sub": "Every plan begins with understanding your prakruti — your unique constitution.",
    "about.label": "Meet your vaidya",
    "about.body":
      "Dr. Vala practises classical Ayurveda in Sutrapada, blending time-tested shastra with a warm, patient-first approach. Her focus is on understanding the whole person — diet, routine, and constitution — before prescribing.",
    "blog.label": "From the journal",
    "blog.head": "Ayurveda for everyday life",
    "blog.sub": "Long-form notes on food, seasons, and simple remedies — in Gujarati and English.",
    "blog.viewAll": "View all articles",
    "blog.readtime": "min read",
    "blog.back": "← All articles",
    "blog.empty": "No articles yet. Check back soon.",
    "footer.mission":
      "Classical Ayurvedic care in Sutrapada, Gujarat. Treating the cause, gently and thoroughly.",
    "footer.clinic": "Clinic",
    "footer.visit": "Visit",
    "footer.directions": "Get directions",
    "footer.rights": "All rights reserved.",
    "nf.head": "Page not found",
    "nf.body": "The page you are looking for isn't here.",
    "nf.home": "Back to home",
  },
} as const;

export function t(locale: Locale, key: string): string {
  return ui[locale][key as keyof (typeof ui)[Locale]] ?? ui.gu[key as keyof typeof ui.gu] ?? key;
}

export function getLocale(pathname: string): Locale {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "gu";
}

export function stripLocale(pathname: string): string {
  if (pathname === "/en" || pathname === "/en/") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

export function localizePath(locale: Locale, canonicalPath: string): string {
  const path = canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`;
  if (locale === "gu") return path;
  if (path === "/") return "/en/";
  return `/en${path}`;
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === "gu" ? "en" : "gu";
}

export function switchLocalePath(pathname: string): string {
  return localizePath(oppositeLocale(getLocale(pathname)), stripLocale(pathname));
}
