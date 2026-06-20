# Hiren Portfolio (hiren.pravritti.org) — Design

**Date:** 2026-06-20
**Status:** Reviewed with Hiren; final design decisions locked. Copy is a draft Hiren will keep refining.
**Relationship to other specs:** This refines the styling/content of the `hiren` app introduced in [2026-06-20-pravritti-platform-scaffold-design.md](2026-06-20-pravritti-platform-scaffold-design.md). It supersedes that spec's placeholder styling (the EB Garamond / ember tokens). The scaffold/deployment decisions there still stand.

---

## Goal

A credibility-focused personal portfolio for Hiren Barad — QA automation lead (10+ years) who is now also building his own products. Visitors (employers, collaborators, peers) should quickly grasp who he is, the depth of his track record, and what he's building, then have an easy way to reach him.

Not a lead-gen/sales page. No pricing, no hard CTA funnel — credibility over conversion.

## Design system (decided via visual companion)

**Aesthetic: "Designer-minimal" (option B).** Monochrome with a single blue accent, clean and contemporary.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#FAFAFA` | page canvas |
| `--color-fg` | `#09090B` | headings |
| `--color-ink` | `#18181B` | primary text |
| `--color-secondary` | `#3F3F46` | body/secondary text |
| `--color-accent` | `#2563EB` | links, kickers, CTA, the `+` expand icon |
| `--color-muted` | `#E8ECF0` | subtle fills |
| `--color-border` | `#E4E4E7` | hairlines, dividers, row borders |
| `--font-heading` | `"Archivo"` (700/600) | headings, names |
| `--font-body` | `"Space Grotesk"` (400/500) | body, UI |

- Border radius: 0 on structural elements (pill radius only on small chips/buttons if used).
- No heavy shadows. Hairline borders for structure.
- Accent (`#2563EB`) used sparingly — kickers, links, CTA, expand icon only. (`color-not-only`: never the sole signal; pair with text/underline.)
- Contrast: body `#18181B`/`#3F3F46` on `#FAFAFA` meets WCAG AA (≥4.5:1). Verify accent links.

**Token location:** hiren's tokens live in the hiren app (`apps/hiren/src/styles/`), not in `packages/config`. Shared design tokens are deferred until a second site needs them (YAGNI — consistent with the scaffold spec). `packages/config` holds only shared tooling for now.

## Layout

- **Single column**, centered, generous whitespace. Content max-width ~`680–720px`; comfortable line length (60–75 chars).
- Smooth scrolling (`scroll-behavior: smooth`; in-page anchors for nav).
- Mobile-first; verified at 375 / 768 / 1024 / 1440. Body text ≥16px. No horizontal scroll.
- A minimal top bar (name left, section anchors right) — non-sticky, or quietly sticky; refined during implementation.

## Sections (in order)

1. **Intro** (hero + about) — name kicker, large headline, one-line positioning, the bio paragraph, and a compact tools strip. A **photo container beside the text** showing a portrait that **swaps to the next photo on hover/click** (tap on mobile; respects reduced-motion). Makes the opening personal.
2. **Projects** (expandable) — the things he's building under Pravritti, each an accordion row.
3. **Experience** (expandable) — career history, reverse-chronological, **disclosure rows** (company name + role + dates + small logo); click a row to expand details.
4. **Contact** — short line + email / WhatsApp / LinkedIn / GitHub.

**Inspiration:** [chekromul.dev](https://chekromul.dev/) — single-page, text-forward, conversational voice, personal photography humanizing the professional narrative, low-key "say hello" contact. Restraint over flash; our subtle motion should preserve that tone.

## Scroll animation (scrollytelling)

- **Effect:** elements fade in and float up into place as they enter the viewport ("subtle" intensity, chosen in the demo): `opacity 0→1` + `translateY(~22px)→0`, ~`600–650ms`, ease-out. **Transform/opacity only — no blur, no width/height animation** (perf + the v1 blur was unreadable).
- **Trigger:** `IntersectionObserver` (threshold ~0.12) adds an `in` class; staggered `transition-delay` per child (~60–120ms steps).
- **Accessibility (required):** wrap in `@media (prefers-reduced-motion: reduce)` — when set, elements render in final state with no transform/transition. Content must be fully present without JS (animations are progressive enhancement; SSG ships real HTML).
- Intensity and exact timings refined during implementation.

## Interaction: expandable rows (Projects & Experience)

- Same disclosure pattern for both sections. Experience rows additionally show a small company logo in the header.
- Each row: header (title + meta + optional logo + `+` icon) always visible; body collapsed by default.
- Click/tap (or keyboard Enter/Space) toggles open; `+` rotates to `×` (45°); body height animates open.
- Built as accessible disclosure: real `<button>` header, `aria-expanded`, `aria-controls`; focus-visible ring; touch target ≥44px.
- **Exclusive: one row open at a time** — opening a row closes any other open row (per section).

## Interaction: hover/tap reveals (progressive enhancement)

- The word "things" in the About copy expands on hover to reveal small icons of what he's building; on touch it toggles on tap (no hover-only behavior).
- The intro portrait swaps on hover/click, with a tap fallback on mobile.
- All such enhancements degrade gracefully: full content/state is present without JS and without a pointer.

## Content model

Content lives in editable data files (so Hiren edits words without touching markup):

- `projects`: `{ name, kind, blurb, href? }[]`
- `experience`: `{ company, role, start, end, location, logo?, points: string[] }[]`
- `tools`: `{ label, icon? }[]` (icon = path to provided/Simple-Icons SVG; text-only for non-brands like REST API, Agents, CI/CD)
- Singletons: hero headline, hero subline, bio paragraph, intro photos list, contact links.

## Assets needed from Hiren

- **Intro portraits** — 2+ photos for the hover/click swap (web-optimized; we'll set explicit dimensions).
- **Company logos** — Hiren provides official logo files (Vividly, TestGorilla, Blackhawk, Technicolor, UST Global, Capgemini); text fallback where not provided.
- **Tool logos** — provided assets where available; otherwise Simple Icons SVGs; text chips for non-brands.

---

### Intro
- Kicker: `Hiren Barad`
- Headline : **"Software Entomologist"**
  - Alternatives: "Building, Breaking, and Rethinking" / "Squashing bugs in the matrix"
- Subline: "QA lead turned builder. Ten years industry experience. Now building my own products under Pravritti."
- Primary link: `Say 'કેમ છો?' →` (jumps to Contact)

### About 
> A Kshatriya by caste, Farmer by heritage and an Engineer by experience. More than once I've been privileged to be first dedicated QA hire — walking into a company with no quality process and leaving behind the frameworks, CI pipelines, and triage workflows that outlasted me.
>
> My work involves manual testing to Playwright automation, CI/CD on-prem and in the cloud, and lately incorporating AI agents that help me write and maintain tests.
>
> Outside of QA, I build things(Hovering over things should expand it and show icons of things that I am working on).

- Tools Logo strip (): TypeScript · Python · Playwright · Cypress · Selenium · REST API · Agents · CI/CD · Docker · Kubernetes · AWS · Azure · GCP · Flutter 

### Projects 
- **Tithi** — *Android/iOS app.* About : Tithi is my take on a calendar app that is more India centric. An attempt to build a tool that enables and gives power to a specific belief system. My primary motivation was to build it for my father but I am hoping that it can help more people. (If you try it out, Please give me (feedback)[Link to the app site.].) → `tithi.pravritti.org`
- **Saptapar** — *Open-world action-adventure game.* About : I grew up playing games and recently got an idea to build a GTA style open world game around my village's culture. Still at learning Blender and building the game-world phase. If interested in the idea, Waitlist yourself (here)[Link to the game site]. → `saptapar.pravritti.org`
- **Pravritti AI Lab** — *The flagship.* About : Placeholder for my learnings and experiments on AI. → `pravritti.org`
- **Cold Storage Monitoring System** — A real-time cold-storage monitor on a Raspberry Pi with camera, motion, and thermal sensors; live temperature alerts and entrance motion capture.
- **Telegram Bot (Python)** — Interactive messaging workflows built on the Telegram Bot API. Helped me fetch excerpts from Wikipedia before the AI age.
- **VM Deployer** - A helper function to manage vSphere VMs that hosted a web app that needed to be validated by a selenium based test automation framework. Before this, our team's efforts were dependant on manually deploying VMs before triggering automation(Ohh! the irony).

### Experience (reverse-chronological, from resume) — disclosure rows: company name + role + dates + small logo; click a row to expand the points below.
1. **Vividly** — *QA Lead* · Apr 2024 – Apr 2026 · Remote
   - First dedicated QA engineer; built the quality processes, entry/exit criteria, and bug-triage workflows adopted across all engineering teams.
   - Co-built a Playwright end-to-end automation framework from scratch, wired into CI.
   - Pioneered AI in QA — agents that auto-generate and maintain tests, cutting authoring time and lifting regression coverage.
2. **TestGorilla** — *Senior Quality Engineer* · Sep 2021 – Mar 2023 · Remote
   - Standalone QA at first; drafted the QA framework from scratch and grew the function as the org scaled.
   - Took the core platform to 40% automated coverage with Playwright in CI/CD.
   - Stood up TestRail for central, real-time release-quality visibility.
3. **Blackhawk Network** — *SDET II* · Jun 2020 – Sep 2021 · Bengaluru
   - Built an automation framework from scratch to 84% coverage across critical flows.
   - Embedded automated tests into deployment pipelines, cutting regression cycle time.
   - Led and mentored a team of 4 QA engineers.
4. **Technicolor** — *Automation Test Engineer* · Mar 2019 – Jun 2020 · Bengaluru
   - Built a Python/Django app to visualise performance-test data across teams.
   - Standardised Linux GUI test automation after evaluating open-source tooling.
   - Set up CI/CD with Git + Jenkins; supported VCS migrations.
5. **UST Global** — *Software Test Engineer* · May 2018 – Feb 2019 · Bengaluru
   - Added 20% automation coverage with PowerShell + AutoIt; ran SIT as a SCRUM engineer.
6. **Capgemini** — *Associate Consultant* · Jul 2015 – Feb 2018 · India
   - Selenium WebDriver automation across client engagements; drove coverage to 85%; authored test specs.

- Education footnote (optional): B.Tech, Computer Science — Dharmsinh Desai Institute of Technology (2011–2015).

### Contact
- Line: "If you're building something and want a second set of eyes on quality — or just want to talk shop — reach out."
- `baradhiren@hotmail.com` · WhatsApp `+91 83475 50409` (`https://wa.me/918347550409`) · [LinkedIn](https://www.linkedin.com/in/baradhiren/) · [GitHub](https://github.com/baradhiren)

---

## Accessibility & quality (from ui-ux-pro-max review)

- Contrast ≥4.5:1 for text; accent links also carry underline/affordance (not color-only).
- Visible focus rings on all interactive elements (nav anchors, expand buttons, links).
- Expandable rows are real buttons with `aria-expanded`/`aria-controls`; keyboard operable.
- `prefers-reduced-motion` fully respected.
- SVG icons only (no emoji) — the `+`/`×` and any arrows as inline SVG or text glyphs.
- Images (if added later): explicit dimensions / `aspect-ratio` to avoid layout shift; lazy-load below the fold.
- Semantic heading hierarchy (single `h1` in hero, `h2` per section).

## Out of scope (this spec)

- A separate "Writing" section (dropped for now; can add later).
- The other subdomains' sites (Tithi, Saptapar, AI lab) — this links to them; building them is separate.
- Final asset delivery (portraits, official company/tool logos) — Hiren supplies during implementation; text fallbacks until then.
