# Chikitsalay Site (chikitsalay.pravritti.org) Design Spec

**Goal:** Build `apps/chikitsalay`, an Astro static site for **Pravritti Chikitsalay** — the Ayurvedic clinic of **Dr. Durgaben Vala** in Sutrapada, Gujarat. It promotes the clinic, hosts a long-form blog, and drives bookings to Instagram. Fully bilingual (Gujarati default + English) with routed i18n. Faithful to the clinic's logo-derived brand.

**Architecture:** A new Astro SSG app in the existing pnpm monorepo, mirroring `apps/tithi` / `apps/hiren`, with its own brand-local token layer (`src/styles/tokens.css`) carrying the logo palette. Brand tokens map to Tailwind utilities via a local `tailwind.config.mjs`. Clinic facts + UI strings live in typed content modules. Blog is Markdown/MDX content collections. No backend; static output served by Cloudflare Pages watching the `chikitsalay` branch.

**Tech stack:** Astro 5, `@astrojs/tailwind` 5 + Tailwind 3, Astro content collections + MDX for the blog, `@fontsource` for the four font families, vitest 4 for the content module(s) with logic.

---

## Global Constraints

- **Branch:** all work happens on the `chikitsalay` branch (Cloudflare Pages watches it). Already created and checked out.
- **Node:** `>=20`; package manager `pnpm@11.8.0`.
- **Light only by design.** Warm cream paper, no dark theme. Depth comes from warm tone steps, soft hairlines, and restrained shadows — no glass, no heavy gradients, no neon.
- **Token discipline:** components reference token names / Tailwind utilities, never raw hex. Brand values live only in `apps/chikitsalay/src/styles/tokens.css`. Do **not** modify `packages/config` (espresso platform palette belongs to `hiren`/apex) and do **not** import the shared preset — this brand is local.
- **Bilingual, routed i18n:** Gujarati is the default locale at `/`; English lives under `/en/`. A header toggle swaps locale while preserving the current page. UI strings come from per-locale dictionaries.
- **Blog rule (option B):** posts may be single-language. Each post declares its own `lang` in frontmatter; the blog index lists all posts together, each card tagged with its language. No obligation to translate every article.
- **Accessibility target:** "Accessible & Ethical" healthcare baseline — WCAG AA minimum (aim AAA on body text), 16px+ body, visible focus rings, keyboard nav, `prefers-reduced-motion` respected, no color-only meaning, ≥44px touch targets.
- **Mobile-first, phone-critical:** most traffic arrives from WhatsApp/Instagram on phones, so mobile is the primary target, not an afterthought. Every page must work flawlessly on small screens — see the Responsive Behavior section.
- **Green-as-text discipline:** `sage` (`#8C9A63`) is a fill/button/marker color; it fails contrast as small text on cream. Any green *text* uses `sage-deep` (`#5F6B3C`). Espresso does the heavy lifting for body/headings.
- **All clinic facts are placeholders** (clearly marked) until the user supplies real values — credentials, experience, hours, address, phone, WhatsApp number, Instagram handle, treatments, ratings, photos, real logo asset. Placeholders must be valid and never block the build. Swapping to real values must be a one-file (content module) edit wherever possible.
- **No Ayurveda clichés:** no mandala/lotus/Om watermarks, no "herbs on a spoon" stock hero, no emoji. Warmth from paper tone, serif headings, space, and a hand-drawn leaf/twig motif derived from the logo tree.
- **Commit prefix:** use `task:` (project convention).

---

## Brand & Design System (logo-derived)

**Palette** (extracted from the clinic logo — espresso brown caduceus/tree, sage-olive wordmark, leaf greens, on paper):

| Token | Hex | Role |
|---|---|---|
| `--espresso` | `#3B2A1E` | ink / primary text / headings / logo |
| `--bark` | `#6B4E3B` | secondary brown — icons, muted headings, ghost-button border |
| `--sage` | `#8C9A63` | brand green — button fills, active fills, markers |
| `--sage-deep` | `#5F6B3C` | accessible green — green *text*, links, hovers (passes 4.5:1 on cream) |
| `--leaf` | `#9DB36A` | fresh accent — tags, highlights, motif |
| `--paper` | `#FAF6EC` | page background (warm cream) |
| `--card` | `#FFFFFF` | card/surface |
| `--card-warm` | `#F3EDDF` | warmer surface tint (alt sections, icon chips) |
| `--muted` | `#6F6154` | secondary body text |
| `--line` | `#E4DAC6` | hairlines / dividers / borders |
| on-espresso footer text | `#EEE6D6` / `#C9BCA8` | text on the espresso footer |

Semantic status colors (forms/toasts) derive from the same family: success = `sage-deep`, error/destructive = a warm terracotta (`#C0553D`), each paired with icon+text (never color alone).

**Typography — bilingual pairing:**
- **Gujarati locale:** Noto Serif Gujarati (headings, w600/700) + Noto Sans Gujarati (body, w400/500).
- **English locale:** Lora (headings, w500/600/700) + Nunito Sans (body, w400/600/700).
- Both serifs read as siblings — calm, literary, non-clinical. Latin body = Nunito Sans; Gujarati body = Noto Sans Gujarati. The active locale sets the font stack on `<html>`.

**Radii:** sm 10 · md 14 · lg 18 · xl 22 · full 999. **Spacing:** Tailwind 4/8 defaults.
**Shadows:** one soft, warm, long shadow token for card hover only (`0 20px 44px -28px rgba(59,42,30,.4)`); no ambient shadows elsewhere.
**Motion:** fast 150 · base 200 · slow 300ms; hover lifts (`translateY(-3px)`) and color transitions only; all disabled under `prefers-reduced-motion`. No decorative/looping animation.
**Icons:** one stroke icon set (Lucide-style, 1.8 stroke), inline SVG. No emoji.

---

## Information Architecture

New app `apps/chikitsalay`, deployed to `chikitsalay.pravritti.org`, Cloudflare Pages on the `chikitsalay` branch.

**Locales:** `gu` (default, `/`) and `en` (`/en/`). Astro i18n config with `defaultLocale: "gu"`, `prefixDefaultLocale: false`. Header language toggle links to the same logical page in the other locale.

**Pages (each rendered per locale unless noted):**

| Page | Gujarati | English |
|---|---|---|
| Home / landing | `/` | `/en/` |
| Blog index | `/blog/` | `/en/blog/` |
| Blog post | `/blog/<slug>/` | `/en/blog/<slug>/` |
| 404 | `/404` (branded) | — |

**Blog index behaviour:** lists **all** posts (both languages) together, newest first, each card showing the post's own language tag + read time. Optional simple language/topic filter later; not required for v1.

**Blog posts:** Markdown/MDX content collection at `src/content/blog/`. One file per post. Frontmatter schema (Zod, validated at build): `title`, `date`, `lang` ("gu" | "en"), `summary`, `tags: string[]`, `cover?` (image path), `draft?` (bool). Each post is generated at BOTH `/blog/<slug>/` and `/en/blog/<slug>/`. **UI locale (chrome) and content language are independent:** the header/nav/footer/toggle follow the URL's UI locale, while the article body always renders in the language it was *written* in (`lang`) — with that language's font stack applied via `[lang]` rules, so a Gujarati article reads correctly under English chrome and vice-versa. Index/teaser cards link within their own UI locale; the on-post toggle switches only the chrome, keeping the reader on the same article. `hreflang` alternates mark the two URLs as UI variants (not duplicate content).

---

## Landing Page Layout (approved mockup)

Top-to-bottom, matching the approved `landing-v1.html`:

1. **Header** (sticky, blur, hairline bottom): logo mark + `pravritti` wordmark (Lora, sage-deep) with `ચિકિત્સાલય` subline (Noto Serif Gujarati, bark); nav (About / Treatments / Blog / Contact); **GU/EN toggle**; sage "Book on Instagram" CTA.
2. **Hero** (2-col → 1-col on mobile): eyebrow (`Ayurvedic Clinic · Sutrapada, Gujarat`); bilingual headline (English serif line + large Gujarati serif line); lead; two CTAs — **Book on Instagram** (filled sage, links to Instagram) and **WhatsApp us** (ghost, links to `wa.me`); trust row (years / qualification / rating — all placeholder); portrait card with an "Open today · hours" badge and a leaf motif.
3. **Treatments**: centered section head + 3 cards, each Gujarati + English labelled (placeholder set: Panchakarma, Chronic conditions, Women's wellness — swappable in content module).
4. **About Dr. Vala**: warm (`card-warm`) strip, photo + bio + credential chips (all placeholder).
5. **Blog teaser**: section head + 3 latest posts (pulls real posts once they exist; mixed languages per option B).
6. **Footer** (espresso): wordmark + one-line mission; **WhatsApp + Instagram** social links; clinic column (About / Treatments / Blog / Book); visit column (Sutrapada address / Get directions → Google Maps link / hours / phone). Copyright line, bilingual.

Primary CTA on every screen is a single "Book on Instagram" action; WhatsApp is the consistent secondary.

---

## Responsive Behavior (mobile-first — hard requirement)

Every page is designed mobile-first and must be fully usable and visually correct on phones. Verified at **375px (small phone), 768px (tablet), 1024px, 1440px**; portrait and landscape.

- **Breakpoints:** Tailwind defaults (`sm 640 · md 768 · lg 1024 · xl 1280`). Layouts are single-column by default and progressively enhance upward.
- **Header on mobile:** the desktop nav collapses into a hamburger → a full-width menu/sheet containing the nav links + the GU/EN toggle. The "Book on Instagram" CTA stays visible (in the bar or pinned), since it's the primary action. Language toggle must be reachable at every breakpoint.
- **Hero:** 2-col → single column on mobile; text first, portrait card below; headline sizes scale down (Gujarati serif must not overflow — use fluid/`clamp` sizing and `text-wrap: balance`); CTAs stack full-width and are ≥44px tall.
- **Treatments / blog grids:** 3-col → 2-col (sm/tablet) → 1-col (mobile). Cards are full-width and tap-friendly.
- **About strip:** side-by-side → stacked (photo above text) on mobile.
- **Footer:** multi-column → stacked single column; social icons remain ≥44px touch targets with spacing.
- **Blog post (long-form):** comfortable reading measure on mobile (line length ~35–60 chars), 16px+ body, images/embeds never cause horizontal scroll.
- **No horizontal scroll at any width.** `overflow-x: clip` on body; media and long Gujarati/English strings wrap. Respect safe-area insets on notched devices. `viewport` meta set, zoom not disabled.
- Bilingual note: Gujarati and English render at different visual widths — both locales must be checked at every breakpoint, not just one.

---

## Content & i18n Model

- **`src/data/clinic.ts`** — single source of truth for clinic facts, all placeholders marked `TODO_`: `name`, `nameGu`, `tagline`/`taglineGu`, `city`, `addressLines`, `mapsUrl` (the provided Google Maps link), `phone`, `whatsapp` (wa.me URL), `instagram` (profile + booking URL), `hours`, `email`, `credentials`, `yearsPractice`, `rating`, `treatments[]` (each `{ slug, titleGu, titleEn, blurbGu, blurbEn }`), `credentialChips[]`. Typed `as const`; unit-tested for shape.
- **`src/i18n/ui.ts`** — per-locale UI string dictionaries (`gu`, `en`) for nav, buttons, section heads, labels, footer, 404. Helper `t(locale, key)` + `getLocale(url)` + `switchLocalePath(url)`. Unit-tested (both locales expose the same keys; toggle path derivation is correct).
- **Blog content** — `src/content/config.ts` defines the `blog` collection + Zod schema. Posts author placeholders: 2–3 seed posts (mixed `gu`/`en`) so the index and teaser render, clearly marked as sample content.

---

## Out of Scope (v1)

- Native/site-level booking or forms (booking is Instagram-only for now; a `mailto`/WhatsApp is the only direct contact). The design leaves room to add a booking page later without restructuring.
- CMS / admin. Posts are files on the branch.
- Newsletter, comments, search, testimonials carousel, multi-author.
- Real logo raster/SVG asset, real photos, real OG image — placeholders now, dropped in before go-live.
- Dark theme.

---

## Deployment (manual, by the user — reference)

- New Cloudflare Pages project → **Root** `apps/chikitsalay`, **Build** `pnpm install && pnpm --filter chikitsalay build`, **Output** `apps/chikitsalay/dist`.
- **Production branch:** `chikitsalay`. **Watch paths:** `apps/chikitsalay/**`, `packages/config/**`.
- **Custom domain:** `chikitsalay.pravritti.org`.
- Before go-live, fill the `clinic.ts` placeholders (credentials, hours, address, phone, WhatsApp, Instagram, treatments), replace the logo/photos/OG image, and write real blog posts.

---

## Success Criteria

- `pnpm --filter chikitsalay build` produces a static site; both locales reachable (`/` and `/en/`), toggle preserves the page.
- Landing page matches the approved mockup in the logo-derived palette + bilingual type.
- Blog index lists mixed-language posts; individual posts render long-form in the correct font stack; frontmatter is schema-validated.
- Footer carries working WhatsApp + Instagram links; "Book on Instagram" is the primary CTA sitewide.
- Placeholders are valid, isolated to content modules, and never block the build.
- Accessibility: AA contrast throughout (green-as-text uses `sage-deep`), visible focus, reduced-motion respected, keyboard-navigable.
- Responsive: every page verified at 375 / 768 / 1024 / 1440px in **both locales** with no horizontal scroll, a working mobile nav + reachable language toggle, and ≥44px touch targets.
- Espresso platform tokens in `packages/config` untouched; brand is fully local.
