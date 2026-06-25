# Tithi site (tithi.pravritti.org) — Design

**Date:** 2026-06-25
**Status:** Design — pending spec review
**Scope:** A new `apps/tithi` Astro static site serving as the **official web presence + app-store compliance home** for the Tithi mobile app, deployed to `tithi.pravritti.org` as its own Cloudflare Pages project. This is a deliberately **lean** site: a compact landing page plus the legal/support documents the app stores require, faithful to the Tithi app's own brand.

This builds on the platform scaffold spec ([2026-06-20-pravritti-platform-scaffold-design.md](2026-06-20-pravritti-platform-scaffold-design.md)); `apps/tithi` is the second site in the monorepo after `apps/hiren`.

---

## Goal

Tithi's v1 mobile app (Android live/imminent, iOS submitted/imminent) needs a public website that:

1. **Satisfies store requirements** — a publicly reachable **Privacy Policy** URL, a **Support** URL, a **data-deletion** route, and an Android **Digital Asset Links** file for App Links / Play App Signing verification.
2. **Is the app's public face** — a short, devotional landing page describing what Tithi is, with store badges (shown "coming soon," swappable to real links the moment listings go live).
3. **Feels like the app** — a visitor arriving from the app should feel brand continuity: diya-on-dark, gold + vermilion, serif Gujarati type, the Diya Moon.

Non-goal: marketing funnels, blog, testimonials, waitlist/email capture, accounts, or any backend. Static SSG only.

---

## What Tithi is (for copy)

Tithi (**તિથિ**) is a warm, devotional **Gujarati Vikram Samvat panchang** for the phone. It brings the authority of the printed *tithi-patra* into a calm, modern, Gujarati-first app — built for daily tithi and vrat checks, festivals, and choghadiya.

- **App name / title:** Tithi
- **Apple subtitle (≤30):** Gujarati panchang calendar
- **Play short description (≤80):** Gujarati Vikram Samvat panchang — tithi, festivals, choghadiya.
- **Tagline:** *આજનું પંચાંગ* ("Today's panchang")

**Feature list (verbatim source for the landing page):**
- Vikram Samvat + Gregorian dates side by side.
- Today's tithi at a glance, with the lunar month and paksha.
- Festivals & holidays highlighted across the month.
- Choghadiya & muhurat timing for day and night, by city.
- Moon phases rendered as a hand-drawn diya moon.
- Gujarati-first typography in a restful, devotional dark design.
- Works offline. No account, no ads, and no personal data collected.

---

## Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Site scale | **Lean compliance site** — compact landing + legal/support docs | Store needs a web home; v1 doesn't need a marketing site |
| Visual identity | **Tithi app's own design system** (diya-on-dark, gold/vermilion, Noto Serif/Sans Gujarati, Diya Moon), not the Pravritti espresso palette | A visitor from the app should feel continuity; the app brand is the truth |
| Token architecture | **App brand on the shared *mechanism*** — a `apps/tithi`-local token layer authored the same way as `packages/config` (`tokens.css` of CSS custom properties → Tailwind theme mapping → `global.css` imports tokens then `@tailwind` layers, `applyBaseStyles:false`) | Honors "shared design system" as the authoring pattern while keeping the espresso palette untouched for `hiren`/apex |
| Language | **English spine + real Gujarati content** | Store reviewers + diaspora can navigate; Gujarati script carries identity (app name, tithi/festival names, tagline) |
| Waitlist / email | **None** | App is shipping; the site is a compliance/presence home, not a teaser |
| Backend | **None** (static SSG on Cloudflare Pages) | Same model as `apps/hiren` |
| Store badges | **"Coming soon" now, swappable** | Listings submitted/imminent; badges become real links via one content-file edit |

---

## Architecture

A self-contained Astro static site mirroring `apps/hiren`'s setup, with a **Tithi-local brand token layer** instead of the espresso tokens.

```
apps/tithi/
├─ package.json            # name: tithi; astro, @astrojs/tailwind, tailwindcss,
│                          #   @pravritti/config, @fontsource/noto-serif-gujarati,
│                          #   @fontsource/noto-sans-gujarati
├─ astro.config.mjs        # site: https://tithi.pravritti.org; tailwind applyBaseStyles:false;
│                          #   compressHTML:true; prefetch:false
├─ tailwind.config.mjs     # tithi-local theme: maps brand CSS vars → utilities; Gujarati fonts
├─ tsconfig.json           # extends ../../tsconfig.base.json
├─ public/
│  ├─ .well-known/
│  │  └─ assetlinks.json   # Android Digital Asset Links — placeholder (see Content dependencies)
│  ├─ screenshots/         # real app screenshots (placeholders until supplied)
│  ├─ og.png               # social card
│  └─ favicon.svg          # waxing-crescent diya-moon mark
└─ src/
   ├─ layouts/
   │  ├─ BaseLayout.astro  # <head>, meta/OG/canonical, fonts, global.css, skip-link
   │  └─ DocLayout.astro   # shared frame for privacy/support/data-deletion (prose column + header/footer)
   ├─ styles/
   │  ├─ tokens.css        # TITHI brand tokens (this site's design system; see below)
   │  └─ global.css        # @import "./tokens.css" + base reset + @tailwind layers
   ├─ data/
   │  └─ content.ts        # single source: app meta, feature list, store links, contact email, doc dates
   ├─ components/
   │  ├─ SiteHeader.astro  # wordmark (તિથિ / tithi) + minimal nav
   │  ├─ Hero.astro        # Diya Moon + wordmark + tagline + description + store badges
   │  ├─ DiyaMoon.astro    # SVG crescent-phase moon with gold glow halo (the signature)
   │  ├─ PhoneMock.astro   # device frame holding a screenshot
   │  ├─ Features.astro    # the 7 feature bullets as gold-hairline-ruled list
   │  ├─ StoreBadges.astro # Play / App Store badges; "coming soon" or real per content.ts
   │  └─ Footer.astro      # trust line + links to privacy/support/data-deletion
   └─ pages/
      ├─ index.astro
      ├─ privacy.astro
      ├─ support.astro
      ├─ data-deletion.astro
      └─ 404.astro
```

### Component boundaries
- **`tokens.css`** — the Tithi brand's single source of truth (CSS custom properties). Depends on nothing.
- **`tailwind.config.mjs`** — maps those tokens to utilities. Does **not** import the espresso preset (semantic color names differ); it follows the same *pattern* as `packages/config/tailwind-preset.mjs`. The `@pravritti/config` workspace dependency is retained for shared structural reference and consistency, but brand colors/fonts are tithi-local.
- **`content.ts`** — all copy, links, and the contact email in one place, so launch-day edits (store URLs, email) are one-file changes.
- Each component does one thing; `DiyaMoon` is isolated so the signature can be reused (hero, favicon, wordmark dot) without duplication.

### Data flow
Static site generation only. `astro build` renders `src/pages/**` to static HTML/CSS in `apps/tithi/dist`. Cloudflare Pages serves it. No runtime, no database.

---

## Design system (Tithi brand — encoded in `apps/tithi/src/styles/tokens.css`)

Faithful to the app's MASTER design system. **Diya on dark, dark only by design.** Depth comes from warm tone steps + gold hairlines; **no drop shadows, glass, or gradients** — the only glow is the moon.

### Color tokens (exact app values)
| Token (`--…`) | Hex | Use on web |
|---|---|---|
| `surface` | `#1A1413` | Page background (deep ember charcoal) |
| `surface-elevated` | `#251D1A` | Header, cards, doc panels |
| `surface-variant` | `#312622` | Chips, raised areas, the "today" date card |
| `gold` | `#E0A93B` | Primary: links, active state, focus ring, gold hairline rules, diya glow |
| `gold-deep` | `#B8862B` | Pressed/hover gold, deeper rules |
| `vermilion` | `#C1372E` | **Fill/marker only** (tilak dot, festival fills) — never small text on dark |
| `on-gold` | `#1A100C` | Text/icon on a filled gold/status surface |
| `on-surface` | `#F3E9D8` | Primary text (warm ivory, ~15:1) |
| `on-surface-secondary` | `#C2B2A0` | Labels, subtitles (~7:1) |
| `on-surface-muted` | `#8C7A6E` | Disabled/large captions only (~3.3:1) |
| `auspicious` | `#8FBF6F` | Choghadiya good band (if shown in mock) |
| `inauspicious` | `#D98C7A` | Choghadiya bad band |
| `neutral-band` | `#D9B86A` | Choghadiya neutral band |
| `holiday` | `#E5645A` | Sunday/holiday day numbers (legible as text) |
| `moon-lit` | `#F7EAC9` | Illuminated limb of the Diya Moon |
| `moon-dark` | `#2A1D1C` | Shadowed disk |
| `hairline` | `#E0A93B2E` (gold @ 18%) | Dividers, card edges — the *tithi-patra* ruled-line motif |
| `moon-glow` | gold @ 22–45% | Warm aarti-diya halo around the hero moon |

Accessibility guardrails carried over from the app: vermilion is a fill/dot only (contrast ~2.6:1, fails as text on dark); festival *text* uses gold or `on-surface`; text on status fills uses `on-gold`.

### Typography — serif gravity, Gujarati-first
- **Display / headings:** **Noto Serif Gujarati** (w600/w700) — wordmark, hero tithi headline, section heads.
- **Body / UI:** **Noto Sans Gujarati** (w400/w500) — paragraphs, lists, captions, legal docs.
- Both faces cover Latin, so English uses the same families (metric-compatible Noto superfamily).
- **Gujarati-first rule:** where both scripts appear, Gujarati leads (larger / first), English is secondary (~75–80% size, `on-surface-secondary`, beneath or trailing). Never the reverse.
- Self-hosted via `@fontsource/noto-serif-gujarati` + `@fontsource/noto-sans-gujarati` (subset to gujarati + latin; weights 400/500/600/700). `tabular-nums` for any numerals/times.

### Scale & motion (from the app system)
- **Spacing (4/8):** `xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 48`. Page gutter `lg` (→24 on ≥600px).
- **Radius:** `sm 8 · md 12 · lg 20 · xl 28 · full 999`.
- **Motion:** `fast 150 · base 200 · slow 300`; exit < enter. **One expressive animation only** — the Diya Moon's gold halo breathes (~4s) in the hero; under `prefers-reduced-motion` it renders a static warm halo. Everything else stays quiet.

### Wordmark & motifs
- **Wordmark:** lowercase `tithi`; the **dot of the "i" is a waxing crescent moon**. Gujarati lockup leads with **તિથિ**, Latin "Tithi" set smaller beneath.
- **Diya Moon (signature):** an SVG crescent-phase moon (`moon-lit`/`moon-dark`) with a warm `moon-glow` halo — the hero's focal object and the favicon mark. The website uses the **flat hand-drawn** rendering (not the app's bundled Blender frames, which are native assets); the app system itself specifies the flat moon as the small-size/fallback rendering, so this is brand-correct.
- **Kumkum tilak dot:** a small `vermilion` dot may mark "today"/auspicious accents.
- **Gold hairline rules:** `hairline` dividers echo the printed *tithi-patra* ruled lines.
- **No overt religious icons** (no Om/Swastik/kalash). Warmth + serif type + these motifs carry the devotion. No emoji.

### Voice & copy
Warm, respectful, plain — like a knowledgeable elder, not a marketer. Gujarati leads; English mirrors. Use real terms in Gujarati where they're the true names: *તિથિ, પંચાંગ, ચોઘડિયા, મુહૂર્ત, સૂર્યોદય/સૂર્યાસ્ત, વ્રત, પર્વ*. Festivals by real names (દિવાળી / Diwali). Sentence case, plain verbs, no filler.

---

## Pages

### `/` — Landing (compact single scroll)
1. **Header** — wordmark (તિથિ / tithi with crescent dot); links to Privacy / Support (right-aligned, minimal).
2. **Hero** — the **Diya Moon** (glowing halo, the focal object), wordmark lockup, tagline *આજનું પંચાંગ* ("Today's panchang"), a 1–2 line description, and **StoreBadges** (Android prominent; both "coming soon" until links land). Optional single **PhoneMock** beside/below the moon showing the unified date card concept: lunar tithi in ivory `on-surface`, Gregorian date in `gold`, Diya Moon centered between them.
3. **Features** — the seven feature bullets as a calm list separated by `hairline` gold rules (the tithi-patra motif), not boxy cards.
4. **Trust line** — *Works offline · No account · No ads · No data collected.*
5. **Footer** — small print, copyright, links to Privacy / Support / Data deletion.

No long marketing scroll; this is one focused screen-plus.

### `/privacy` — Privacy Policy (`DocLayout`)
Drafted from the app's actual stance (the implementer drafts; **user verifies against real app behavior**):
- Tithi works **offline**, requires **no account**, shows **no ads**, and **collects no personal data**; nothing is sent to a server.
- City selection for choghadiya is stored **on-device** only.
- States explicitly what is **not** collected (no analytics/identifiers/contacts/location-tracking — adjust to truth during review).
- Children's privacy / no data sale boilerplate as applicable.
- "Last updated" date (from `content.ts`) and a contact email for questions.

### `/support` — Support / Feedback (`DocLayout`)
- Contact **email** (from `content.ts`) as the primary support path.
- A short FAQ in the app's voice: how to read today's tithi, what choghadiya means, requesting a city, reporting an issue, where festival data comes from.
- A clear "send feedback" line (mailto). No form/backend.

### `/data-deletion` — Data deletion (`DocLayout`)
- States that because Tithi stores everything **on-device** and collects **no account or personal data**, deleting your data = **uninstalling the app** (or clearing app storage), with platform-specific one-liners.
- Provides the contact email for any residual request.
- Satisfies the Play Console data-deletion URL expectation.

### `404.astro`
Own not-found page in the same diya-on-dark style, with a link home.

---

## Assets

- **`public/.well-known/assetlinks.json`** — Android Digital Asset Links, served at `/.well-known/assetlinks.json` (Astro copies `public/` verbatim; Cloudflare serves `.json` correctly). Scaffolded with a clearly-marked placeholder `package_name` and `sha256_cert_fingerprints` (see Content dependencies).
- **Screenshots** — real app screenshots dropped into `public/screenshots/`; `PhoneMock` references them. Until supplied, a tasteful placeholder image stands in (clearly marked).
- **`og.png` + `favicon.svg`** — social card and the crescent diya-moon favicon.

---

## Deployment (Cloudflare Pages)

A new Pages project (independent of `hiren`), connected to this repo:
- **Root directory:** `apps/tithi`
- **Build command:** `pnpm install && pnpm --filter tithi build`
- **Output directory:** `apps/tithi/dist` (or `dist` relative to root)
- **Custom domain:** `tithi.pravritti.org`
- **Build watch paths:** `apps/tithi/**` and `packages/config/**`
- Root `package.json` scripts gain tithi equivalents where useful; `apps/tithi` is a normal pnpm workspace member (already globbed by `apps/*`).

---

## Error handling

- Per-site `404.astro`.
- Build failures surface in the Cloudflare Pages dashboard; a failed build doesn't publish, so the live site stays on the last good deploy.
- `assetlinks.json` placeholder is syntactically valid JSON so the build never breaks; the TODO is content, not code.

---

## Content dependencies (stubbed with obvious TODOs; do not block the build)

1. **Support/contact email** — used on `/privacy`, `/support`, `/data-deletion`. Stubbed in `content.ts` as `TODO_CONTACT_EMAIL`.
2. **Android `assetlinks.json`** — needs the app's `package_name` and the release signing **SHA-256 cert fingerprint**. Stubbed with placeholders + inline comment.
3. **Real store URLs** — Play/App Store listing links; `content.ts` holds `comingSoon: true` until provided, then flip to real URLs.
4. **Real screenshots** — drop into `public/screenshots/`, replacing placeholders.

---

## Out of scope (this spec)

- Email/waitlist capture, accounts, any backend or serverless function.
- iOS `apple-app-site-association` (not requested; add later if Universal Links are needed).
- Terms of Service page (not requested).
- Marketing extras: blog, testimonials, FAQ accordion, animated hero beyond the single diya-glow.
- Promoting Tithi's tokens into shared `packages/config` (kept tithi-local).
- Playwright/CI (deferred platform-wide).

---

## Prerequisites

- Existing monorepo (`pnpm` workspace) and `@pravritti/config` — present.
- A Cloudflare Pages project for `tithi.pravritti.org` (created at deploy time).
- The content dependencies above, supplied before/at launch.
