# Pravritti Scaffold + Hiren Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the pnpm monorepo + light shared layer, then build `hiren.pravritti.org` — a single-page, designer-minimal personal portfolio with subtle scroll reveals, accessible accordions, a photo swap, and editable content — and deploy it on Cloudflare Pages.

**Architecture:** `apps/*` (one Astro static site per subdomain) + `packages/*` (shared layer). The hiren app is static HTML (SSG) with progressive-enhancement scripts (scroll reveals, disclosures, photo swap) that degrade gracefully — all content is present without JS. Subdomains are resolved by Cloudflare, not a client router.

**Tech Stack:** pnpm workspaces, Astro 5 (static), Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, Cloudflare Pages.

**Specs:** [scaffold](../specs/2026-06-20-pravritti-platform-scaffold-design.md) · [portfolio](../specs/2026-06-20-hiren-portfolio-design.md)

## Global Constraints

- Node.js >= 20; package manager is **pnpm** (never npm/yarn).
- All sites are **static** (`output: 'static'`). No SSR adapter.
- Cross-package imports use the workspace protocol: `"@pravritti/config": "workspace:*"`.
- **Design tokens** (hiren app, exact values — Tailwind `@theme`, utility name in parens):
  - canvas/bg `#FAFAFA` (`bg-canvas`), heading fg `#09090B` (`text-fg`), primary text `#18181B` (`text-ink`), secondary `#3F3F46` (`text-soft`), accent `#2563EB` (`text-accent`/`bg-accent`), fill `#E8ECF0` (`bg-fill`), hairline `#E4E4E7` (`border-line`).
  - Heading font Archivo (`font-heading`), body font Space Grotesk (`font-body`).
- **Motion:** reveals animate transform/opacity only (fade + `translateY(22px)`), ~620ms ease-out; **must** respect `prefers-reduced-motion: reduce` (final state, no transition).
- **Accessibility:** WCAG AA contrast; visible focus rings; disclosures are real `<button>`s with `aria-expanded`/`aria-controls`; touch targets ≥44px; accent never the sole signal (pair with text/underline); SVG/text only, no emoji icons; single `<h1>`, `<h2>` per section.
- **Progressive enhancement:** all hover-based interactions (photo swap, "things" reveal) also work on tap and render full content without JS.
- **Exclusive disclosure:** within a section, opening one row closes any other open row.

**Note on testing:** these are static pages with no business logic, and the Playwright/CI quality gate was explicitly deferred. The verification cycle per task is: `astro build` passes + rendered HTML contains expected content + (for interactive pieces) a manual dev-server check. That is intentional.

---

### Task 1: Initialize the pnpm monorepo root

**Files:**
- Create: `pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`, `.nvmrc`
- Modify: `.gitignore` (already exists with `.superpowers/`)

**Interfaces:**
- Produces: a pnpm workspace recognizing `apps/*` and `packages/*`; root `tsconfig.base.json` that app tsconfigs extend.

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "pravritti",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "pnpm --filter hiren dev",
    "build": "pnpm -r build",
    "hiren:dev": "pnpm --filter hiren dev",
    "hiren:build": "pnpm --filter hiren build"
  }
}
```

- [ ] **Step 3: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ESNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true
  }
}
```

- [ ] **Step 4: Create `.nvmrc`**

```
20
```

- [ ] **Step 5: Append build artifacts to `.gitignore`**

Ensure `.gitignore` contains (append any missing lines):

```
node_modules/
dist/
.astro/
.DS_Store
*.log
.env
.env.*
.superpowers/
```

- [ ] **Step 6: Verify the workspace installs**

Run: `pnpm install`
Expected: completes without error; creates `pnpm-lock.yaml`.

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.base.json .nvmrc .gitignore pnpm-lock.yaml
git commit -m "chore: initialize pnpm monorepo root"
```

---

### Task 2: Create the shared config package

The light shared layer: brand-agnostic CSS base (reset, smooth scroll, reduced-motion + focus-visible defaults) and a shared Prettier config. Per-site design tokens live in each app, not here.

**Files:**
- Create: `packages/config/package.json`, `packages/config/base.css`, `packages/config/prettier.config.mjs`

**Interfaces:**
- Produces: `@pravritti/config/base.css` (importable reset/base) and `@pravritti/config/prettier` (shared formatting).

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@pravritti/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./base.css": "./base.css",
    "./prettier": "./prettier.config.mjs"
  }
}
```

- [ ] **Step 2: Create `packages/config/base.css`**

```css
/* Pravritti shared, brand-agnostic base. Per-site tokens layer on top. */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { min-height: 100dvh; line-height: 1.5; -webkit-font-smoothing: antialiased; }
img, picture, svg, video { display: block; max-width: 100%; }
button, input, select, textarea { font: inherit; color: inherit; }
a { color: inherit; text-decoration: none; }

:where(a, button, [tabindex]):focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Create `packages/config/prettier.config.mjs`**

```js
export default {
  printWidth: 100,
  singleQuote: false,
  semi: true,
  trailingComma: "all",
  plugins: ["prettier-plugin-astro"],
  overrides: [{ files: "*.astro", options: { parser: "astro" } }],
};
```

- [ ] **Step 4: Verify it resolves**

Run: `pnpm install`
Expected: `@pravritti/config` symlinked into the workspace; no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/config pnpm-lock.yaml
git commit -m "feat(config): add shared base.css and prettier config"
```

---

### Task 3: Scaffold the hiren Astro app

**Files:**
- Create: `apps/hiren/package.json`, `apps/hiren/astro.config.mjs`, `apps/hiren/tsconfig.json`
- Create: `apps/hiren/src/styles/global.css`
- Create: `apps/hiren/src/layouts/BaseLayout.astro`
- Create: `apps/hiren/src/pages/index.astro` (placeholder, replaced in Task 10)
- Create: `apps/hiren/src/pages/404.astro`
- Create: `apps/hiren/public/favicon.svg`

**Interfaces:**
- Consumes: `@pravritti/config/base.css`.
- Produces: buildable static site; `BaseLayout` component, props `{ title: string; description: string }`, with `<slot />`. Global token utilities (`bg-canvas`, `text-fg`, `text-ink`, `text-soft`, `text-accent`, `bg-accent`, `bg-fill`, `border-line`, `font-heading`, `font-body`).

- [ ] **Step 1: Create `apps/hiren/package.json`**

```json
{
  "name": "hiren",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "@pravritti/config": "workspace:*",
    "astro": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create `apps/hiren/astro.config.mjs`**

```js
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://hiren.pravritti.org",
  output: "static",
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Create `apps/hiren/tsconfig.json`**

```json
{
  "extends": ["astro/tsconfigs/strict", "../../tsconfig.base.json"],
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Create `apps/hiren/src/styles/global.css`**

```css
@import "tailwindcss";
@import "@pravritti/config/base.css";

@theme {
  --color-canvas: #fafafa;
  --color-fg: #09090b;
  --color-ink: #18181b;
  --color-soft: #3f3f46;
  --color-accent: #2563eb;
  --color-fill: #e8ecf0;
  --color-line: #e4e4e7;

  --font-heading: "Archivo", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  html { background: var(--color-canvas); color: var(--color-ink); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-heading); color: var(--color-fg); letter-spacing: -0.01em; }
}

/* scroll reveal (progressive enhancement; see Task 5) */
.reveal { opacity: 0; transform: translateY(22px);
  transition: opacity 0.62s cubic-bezier(0.2, 0.7, 0.2, 1), transform 0.62s cubic-bezier(0.2, 0.7, 0.2, 1); }
.reveal.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 5: Create `apps/hiren/src/layouts/BaseLayout.astro`**

```astro
---
import "../styles/global.css";
interface Props { title: string; description: string; }
const { title, description } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Space+Grotesk:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
  </head>
  <body class="bg-canvas text-ink">
    <slot />
  </body>
</html>
```

- [ ] **Step 6: Create `apps/hiren/src/pages/index.astro` (temporary placeholder)**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Hiren Barad" description="Personal portfolio of Hiren Barad.">
  <main class="mx-auto max-w-2xl px-6 py-24">
    <h1 class="text-5xl">Hiren Barad</h1>
    <p class="mt-4 text-soft">Scaffold online. Sections arrive in later tasks.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 7: Create `apps/hiren/src/pages/404.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Not found — Hiren Barad" description="Page not found.">
  <main class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6">
    <p class="text-7xl">404</p>
    <p class="mt-4 text-soft">That page doesn't exist.</p>
    <a href="/" class="mt-8 text-accent underline">Back home →</a>
  </main>
</BaseLayout>
```

- [ ] **Step 8: Create `apps/hiren/public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#fafafa"/><rect x="9" y="9" width="14" height="14" fill="#2563eb"/></svg>
```

- [ ] **Step 9: Install and build**

Run: `pnpm install && pnpm --filter hiren build`
Expected: build succeeds; `apps/hiren/dist/index.html` and `404.html` written.

- [ ] **Step 10: Verify dev server serves the page**

Run: `pnpm --filter hiren dev` (background), then `curl -s http://localhost:4321/ | grep -c "Hiren Barad"`
Expected: ≥1. Stop the dev server.

- [ ] **Step 11: Commit**

```bash
git add apps/hiren pnpm-lock.yaml
git commit -m "feat(hiren): scaffold Astro app with tokens, layout, 404"
```

---

### Task 4: Content data module

All copy lives in typed data files so Hiren edits words without touching markup. Copy is the draft from the portfolio spec.

**Files:**
- Create: `apps/hiren/src/data/profile.ts`, `apps/hiren/src/data/projects.ts`, `apps/hiren/src/data/experience.ts`

**Interfaces:**
- Produces:
  - `profile`: `{ name, headline, subline, contactCtaLabel, bio: string[], tools: string[], contact: { email, whatsapp, whatsappHref, linkedin, github } }`
  - `projects`: `Project[]` where `Project = { name: string; kind: string; blurb: string; href?: string }`
  - `experience`: `Job[]` where `Job = { company: string; role: string; period: string; location: string; logo?: string; points: string[] }`

- [ ] **Step 1: Create `apps/hiren/src/data/profile.ts`**

```ts
export const profile = {
  name: "Hiren Barad",
  headline: "Software Entomologist",
  subline:
    "QA lead turned builder. Ten years industry experience. Now building my own products under Pravritti.",
  contactCtaLabel: "Say 'કેમ છો?' →",
  bio: [
    "A Kshatriya by caste, Farmer by heritage and an Engineer by experience. More than once I've been privileged to be the first dedicated QA hire — walking into a company with no quality process and leaving behind the frameworks, CI pipelines, and triage workflows that outlasted me.",
    "My work runs from manual testing to Playwright automation, CI/CD on-prem and in the cloud, and lately incorporating AI agents that help me write and maintain tests.",
    "Outside of QA, I build things.",
  ],
  tools: [
    "TypeScript", "Python", "Playwright", "Cypress", "Selenium", "REST API",
    "Agents", "CI/CD", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Flutter",
  ],
  contact: {
    email: "baradhiren@hotmail.com",
    whatsapp: "+91 83475 50409",
    whatsappHref: "https://wa.me/918347550409",
    linkedin: "https://www.linkedin.com/in/baradhiren/",
    github: "https://github.com/baradhiren",
  },
} as const;
```

- [ ] **Step 2: Create `apps/hiren/src/data/projects.ts`**

```ts
export interface Project {
  name: string;
  kind: string;
  blurb: string;
  href?: string;
}

export const projects: Project[] = [
  {
    name: "Tithi",
    kind: "Android / iOS app",
    blurb:
      "My take on a calendar app that is more India-centric — an attempt to build a tool that enables and gives power to a specific belief system. I started it for my father, but I'm hoping it can help more people.",
    href: "https://tithi.pravritti.org",
  },
  {
    name: "Saptapar",
    kind: "Open-world action-adventure game",
    blurb:
      "I grew up playing games, and recently got an idea to build a GTA-style open world around my village's culture. Still in the learning-Blender and building-the-game-world phase.",
    href: "https://saptapar.pravritti.org",
  },
  {
    name: "Pravritti AI Lab",
    kind: "The flagship",
    blurb: "My learnings and experiments on AI.",
    href: "https://pravritti.org",
  },
  {
    name: "Cold Storage Monitoring System",
    kind: "Raspberry Pi",
    blurb:
      "A real-time cold-storage monitor on a Raspberry Pi with camera, motion, and thermal sensors — live temperature alerts and entrance motion capture.",
  },
  {
    name: "Telegram Bot",
    kind: "Python",
    blurb:
      "Interactive messaging workflows built on the Telegram Bot API. Helped me fetch excerpts from Wikipedia before the AI age.",
  },
  {
    name: "VM Deployer",
    kind: "vSphere helper",
    blurb:
      "A helper to manage vSphere VMs hosting a web app that a Selenium automation framework had to validate. Before it, our team manually deployed VMs before triggering automation (oh, the irony).",
  },
];
```

- [ ] **Step 3: Create `apps/hiren/src/data/experience.ts`**

```ts
export interface Job {
  company: string;
  role: string;
  period: string;
  location: string;
  logo?: string;
  points: string[];
}

export const experience: Job[] = [
  {
    company: "Vividly",
    role: "QA Lead",
    period: "Apr 2024 – Apr 2026",
    location: "Remote",
    points: [
      "First dedicated QA engineer; built the quality processes, entry/exit criteria, and bug-triage workflows adopted across all engineering teams.",
      "Co-built a Playwright end-to-end automation framework from scratch, wired into CI.",
      "Pioneered AI in QA — agents that auto-generate and maintain tests, cutting authoring time and lifting regression coverage.",
    ],
  },
  {
    company: "TestGorilla",
    role: "Senior Quality Engineer",
    period: "Sep 2021 – Mar 2023",
    location: "Remote",
    points: [
      "Standalone QA at first; drafted the QA framework from scratch and grew the function as the org scaled.",
      "Took the core platform to 40% automated coverage with Playwright in CI/CD.",
      "Stood up TestRail for central, real-time release-quality visibility.",
    ],
  },
  {
    company: "Blackhawk Network",
    role: "SDET II",
    period: "Jun 2020 – Sep 2021",
    location: "Bengaluru",
    points: [
      "Built an automation framework from scratch to 84% coverage across critical flows.",
      "Embedded automated tests into deployment pipelines, cutting regression cycle time.",
      "Led and mentored a team of 4 QA engineers.",
    ],
  },
  {
    company: "Technicolor",
    role: "Automation Test Engineer",
    period: "Mar 2019 – Jun 2020",
    location: "Bengaluru",
    points: [
      "Built a Python/Django app to visualise performance-test data across teams.",
      "Standardised Linux GUI test automation after evaluating open-source tooling.",
      "Set up CI/CD with Git + Jenkins; supported VCS migrations.",
    ],
  },
  {
    company: "UST Global",
    role: "Software Test Engineer",
    period: "May 2018 – Feb 2019",
    location: "Bengaluru",
    points: [
      "Added 20% automation coverage with PowerShell + AutoIt; ran SIT as a SCRUM engineer.",
    ],
  },
  {
    company: "Capgemini",
    role: "Associate Consultant",
    period: "Jul 2015 – Feb 2018",
    location: "India",
    points: [
      "Selenium WebDriver automation across client engagements; drove coverage to 85%; authored test specs.",
    ],
  },
];
```

- [ ] **Step 4: Verify it type-checks via build**

Run: `pnpm --filter hiren build`
Expected: build succeeds (data files compile; not yet imported anywhere is fine).

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/data
git commit -m "feat(hiren): add content data (profile, projects, experience)"
```

---

### Task 5: Scroll-reveal component + script

**Files:**
- Create: `apps/hiren/src/components/Reveal.astro`
- Create: `apps/hiren/src/scripts/reveal.ts`
- Modify: `apps/hiren/src/layouts/BaseLayout.astro` (load the script once)

**Interfaces:**
- Consumes: `.reveal`/`.reveal.in` CSS from `global.css` (Task 3).
- Produces: `<Reveal delay?={number} class?={string}>` wrapper that fades+floats its slot in on scroll; `reveal.ts` runs the IntersectionObserver globally.

- [ ] **Step 1: Create `apps/hiren/src/components/Reveal.astro`**

```astro
---
interface Props { delay?: number; class?: string; }
const { delay = 0, class: cls = "" } = Astro.props;
const style = delay ? `transition-delay:${delay}ms` : undefined;
---

<div class:list={["reveal", cls]} style={style}><slot /></div>
```

- [ ] **Step 2: Create `apps/hiren/src/scripts/reveal.ts`**

```ts
// Reveals .reveal elements as they enter the viewport. Reduced-motion users
// (and no-JS) get final state immediately — see global.css.
function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

if (document.readyState !== "loading") initReveal();
else document.addEventListener("DOMContentLoaded", initReveal);
```

- [ ] **Step 3: Load the script in `BaseLayout.astro`**

Add this just before the closing `</body>` (after `<slot />`):

```astro
    <slot />
    <script>
      import "../scripts/reveal.ts";
    </script>
  </body>
```

- [ ] **Step 4: Smoke-test with a temporary Reveal in the placeholder index**

Temporarily wrap the placeholder `<h1>` in `index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Reveal from "../components/Reveal.astro";
---

<BaseLayout title="Hiren Barad" description="Personal portfolio of Hiren Barad.">
  <main class="mx-auto max-w-2xl px-6 py-24">
    <Reveal><h1 class="text-5xl">Hiren Barad</h1></Reveal>
    <Reveal delay={120}><p class="mt-4 text-soft">Scaffold online.</p></Reveal>
  </main>
</BaseLayout>
```

- [ ] **Step 5: Build and verify**

Run: `pnpm --filter hiren build`
Expected: build succeeds; `grep -c "reveal" apps/hiren/dist/index.html` returns ≥1.

- [ ] **Step 6: Manual check**

Run dev server; reload `/` — the heading fades/floats in. Toggle OS "reduce motion" and confirm it appears instantly. Stop server.

- [ ] **Step 7: Commit**

```bash
git add apps/hiren/src/components/Reveal.astro apps/hiren/src/scripts/reveal.ts apps/hiren/src/layouts/BaseLayout.astro apps/hiren/src/pages/index.astro
git commit -m "feat(hiren): scroll-reveal component and observer"
```

---

### Task 6: Accessible disclosure (accordion) component

Used by both Projects and Experience. Exclusive within a `group`.

**Files:**
- Create: `apps/hiren/src/components/Disclosure.astro`
- Create: `apps/hiren/src/scripts/disclosure.ts`
- Modify: `apps/hiren/src/layouts/BaseLayout.astro` (load the script)

**Interfaces:**
- Produces: `<Disclosure group={string} title={string} meta?={string}>` with a default slot for the body. Header is a `<button>` with `aria-expanded`/`aria-controls`; a logo can be passed via a named slot `logo`. `disclosure.ts` wires exclusive open/close per `data-group` and animates panel height.

- [ ] **Step 1: Create `apps/hiren/src/components/Disclosure.astro`**

```astro
---
interface Props { group: string; title: string; meta?: string; }
const { group, title, meta } = Astro.props;
const uid = "disc-" + Math.random().toString(36).slice(2, 9);
---

<div class="disc border-b border-line">
  <button
    type="button"
    class="disc-head flex w-full items-center justify-between gap-4 py-4 text-left"
    aria-expanded="false"
    aria-controls={uid}
    data-group={group}
  >
    <span class="flex items-center gap-3">
      <slot name="logo" />
      <span class="font-heading text-lg text-fg">{title}</span>
    </span>
    <span class="flex items-center gap-4">
      {meta && <span class="text-sm text-soft">{meta}</span>}
      <span class="disc-plus text-2xl leading-none text-accent transition-transform duration-300" aria-hidden="true">+</span>
    </span>
  </button>
  <div id={uid} class="disc-panel" role="region" hidden>
    <div class="disc-inner pb-5 text-soft"><slot /></div>
  </div>
</div>
```

- [ ] **Step 2: Create `apps/hiren/src/scripts/disclosure.ts`**

```ts
// Accessible, exclusive-per-group disclosure rows with animated height.
function setOpen(head: HTMLButtonElement, open: boolean) {
  const panel = document.getElementById(head.getAttribute("aria-controls")!);
  const plus = head.querySelector<HTMLElement>(".disc-plus");
  if (!panel) return;
  head.setAttribute("aria-expanded", String(open));
  if (plus) plus.style.transform = open ? "rotate(45deg)" : "";
  if (open) {
    panel.hidden = false;
    const inner = panel.firstElementChild as HTMLElement;
    panel.style.maxHeight = inner.scrollHeight + "px";
  } else {
    panel.style.maxHeight = "0px";
    const done = () => { if (head.getAttribute("aria-expanded") === "false") panel.hidden = true; panel.removeEventListener("transitionend", done); };
    panel.addEventListener("transitionend", done);
  }
}

function initDisclosure() {
  const heads = Array.from(document.querySelectorAll<HTMLButtonElement>(".disc-head"));
  heads.forEach((head) => {
    head.addEventListener("click", () => {
      const open = head.getAttribute("aria-expanded") === "true";
      if (!open) {
        const group = head.dataset.group;
        heads
          .filter((h) => h !== head && h.dataset.group === group && h.getAttribute("aria-expanded") === "true")
          .forEach((h) => setOpen(h, false));
      }
      setOpen(head, !open);
    });
  });
}

if (document.readyState !== "loading") initDisclosure();
else document.addEventListener("DOMContentLoaded", initDisclosure);
```

- [ ] **Step 3: Add panel transition CSS to `global.css`**

Append to `apps/hiren/src/styles/global.css`:

```css
.disc-panel { max-height: 0; overflow: hidden; transition: max-height 0.38s ease; }
@media (prefers-reduced-motion: reduce) { .disc-panel { transition: none; } }
```

- [ ] **Step 4: Load the script in `BaseLayout.astro`**

Update the script block before `</body>`:

```astro
    <script>
      import "../scripts/reveal.ts";
      import "../scripts/disclosure.ts";
    </script>
```

- [ ] **Step 5: Build**

Run: `pnpm --filter hiren build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/hiren/src/components/Disclosure.astro apps/hiren/src/scripts/disclosure.ts apps/hiren/src/styles/global.css apps/hiren/src/layouts/BaseLayout.astro
git commit -m "feat(hiren): accessible exclusive disclosure component"
```

---

### Task 7: Intro section (hero + about + tools + photo swap)

**Files:**
- Create: `apps/hiren/src/components/PhotoSwap.astro`, `apps/hiren/src/scripts/photoswap.ts`
- Create: `apps/hiren/src/components/IntroSection.astro`
- Create: `apps/hiren/public/photos/portrait-1.svg`, `apps/hiren/public/photos/portrait-2.svg` (placeholders Hiren replaces)
- Modify: `apps/hiren/src/layouts/BaseLayout.astro` (load photoswap script)

**Interfaces:**
- Consumes: `profile` (Task 4), `Reveal` (Task 5).
- Produces: `<IntroSection />` rendering hero headline/subline, contact CTA, bio paragraphs, tools strip, and a `<PhotoSwap photos={string[]} alt={string} />` that swaps image on hover/click (tap on mobile), defaulting to first image without JS.

- [ ] **Step 1: Create placeholder portraits**

`apps/hiren/public/photos/portrait-1.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#e8ecf0"/><text x="200" y="250" font-family="sans-serif" font-size="20" fill="#3f3f46" text-anchor="middle">portrait 1</text></svg>
```

`apps/hiren/public/photos/portrait-2.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#d9dee6"/><text x="200" y="250" font-family="sans-serif" font-size="20" fill="#3f3f46" text-anchor="middle">portrait 2</text></svg>
```

- [ ] **Step 2: Create `apps/hiren/src/components/PhotoSwap.astro`**

```astro
---
interface Props { photos: string[]; alt: string; }
const { photos, alt } = Astro.props;
---

<div class="photoswap relative aspect-[4/5] w-full overflow-hidden bg-fill" data-count={photos.length}>
  {photos.map((src, i) => (
    <img
      src={src}
      alt={i === 0 ? alt : ""}
      width="400"
      height="500"
      loading={i === 0 ? "eager" : "lazy"}
      class="ps-img absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500"
      data-i={i}
      style={i === 0 ? "opacity:1" : undefined}
    />
  ))}
</div>
```

- [ ] **Step 3: Create `apps/hiren/src/scripts/photoswap.ts`**

```ts
// Swaps photos on hover/click (and tap). No-JS: first image stays visible.
function initPhotoSwap() {
  document.querySelectorAll<HTMLElement>(".photoswap").forEach((box) => {
    const imgs = Array.from(box.querySelectorAll<HTMLImageElement>(".ps-img"));
    if (imgs.length < 2) return;
    let i = 0;
    const show = (n: number) => {
      imgs[i].style.opacity = "0";
      i = (n + imgs.length) % imgs.length;
      imgs[i].style.opacity = "1";
    };
    box.addEventListener("mouseenter", () => show(i + 1));
    box.addEventListener("click", () => show(i + 1));
    box.style.cursor = "pointer";
    box.setAttribute("role", "button");
    box.setAttribute("tabindex", "0");
    box.setAttribute("aria-label", "Next photo");
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(i + 1); }
    });
  });
}

if (document.readyState !== "loading") initPhotoSwap();
else document.addEventListener("DOMContentLoaded", initPhotoSwap);
```

- [ ] **Step 4: Create `apps/hiren/src/components/IntroSection.astro`**

```astro
---
import { profile } from "../data/profile.ts";
import Reveal from "./Reveal.astro";
import PhotoSwap from "./PhotoSwap.astro";

const photos = ["/photos/portrait-1.svg", "/photos/portrait-2.svg"];
---

<section id="intro" class="py-20 md:py-28">
  <div class="grid items-center gap-10 md:grid-cols-[1fr_300px]">
    <div>
      <Reveal><p class="text-sm uppercase tracking-[0.14em] text-accent">{profile.name}</p></Reveal>
      <Reveal delay={80}><h1 class="mt-4 text-5xl leading-[1.04] md:text-6xl">{profile.headline}</h1></Reveal>
      <Reveal delay={160}><p class="mt-6 max-w-xl text-lg text-soft">{profile.subline}</p></Reveal>
      <Reveal delay={240}>
        <a href="#contact" class="mt-7 inline-block bg-accent px-5 py-3 text-sm font-medium text-white">{profile.contactCtaLabel}</a>
      </Reveal>
    </div>
    <Reveal delay={200} class="mx-auto w-full max-w-[300px]">
      <PhotoSwap photos={photos} alt="Hiren Barad" />
    </Reveal>
  </div>

  <div class="mt-16 max-w-2xl space-y-4">
    {profile.bio.map((p, idx) => (
      <Reveal delay={idx * 80}><p class="text-base leading-relaxed text-ink">{p}</p></Reveal>
    ))}
  </div>

  <Reveal class="mt-10 block">
    <ul class="flex flex-wrap gap-2">
      {profile.tools.map((t) => (
        <li class="border border-line px-3 py-1 text-xs text-soft">{t}</li>
      ))}
    </ul>
  </Reveal>
</section>
```

- [ ] **Step 5: Load photoswap script in `BaseLayout.astro`**

```astro
    <script>
      import "../scripts/reveal.ts";
      import "../scripts/disclosure.ts";
      import "../scripts/photoswap.ts";
    </script>
```

- [ ] **Step 6: Temporarily render IntroSection to verify**

Replace `index.astro` body with:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import IntroSection from "../components/IntroSection.astro";
---

<BaseLayout title="Hiren Barad — Software Entomologist" description="QA lead turned builder.">
  <main class="mx-auto max-w-3xl px-6">
    <IntroSection />
  </main>
</BaseLayout>
```

- [ ] **Step 7: Build and verify**

Run: `pnpm --filter hiren build`
Then: `grep -c "Software Entomologist" apps/hiren/dist/index.html`
Expected: build succeeds; grep ≥1.

- [ ] **Step 8: Manual check**

Dev server: hero reveals on load; hover/click the portrait swaps the image; tools chips wrap; layout collapses to one column at 375px. Stop server.

- [ ] **Step 9: Commit**

```bash
git add apps/hiren/src/components/PhotoSwap.astro apps/hiren/src/components/IntroSection.astro apps/hiren/src/scripts/photoswap.ts apps/hiren/public/photos apps/hiren/src/layouts/BaseLayout.astro apps/hiren/src/pages/index.astro
git commit -m "feat(hiren): intro section with photo swap and tools strip"
```

---

### Task 8: Projects section

**Files:**
- Create: `apps/hiren/src/components/ProjectsSection.astro`

**Interfaces:**
- Consumes: `projects` (Task 4), `Disclosure` (Task 6), `Reveal` (Task 5).
- Produces: `<ProjectsSection />` — a heading + a Disclosure row per project (group `"projects"`), blurb + optional link in the body.

- [ ] **Step 1: Create `apps/hiren/src/components/ProjectsSection.astro`**

```astro
---
import { projects } from "../data/projects.ts";
import Disclosure from "./Disclosure.astro";
import Reveal from "./Reveal.astro";
---

<section id="projects" class="py-20 md:py-28">
  <Reveal><p class="text-sm uppercase tracking-[0.14em] text-accent">Projects</p></Reveal>
  <Reveal delay={80}><h2 class="mt-3 text-3xl">Things I'm building.</h2></Reveal>

  <Reveal delay={140} class="mt-8 block border-t border-line">
    {projects.map((p) => (
      <Disclosure group="projects" title={p.name} meta={p.kind}>
        <p class="max-w-2xl">{p.blurb}</p>
        {p.href && (
          <a href={p.href} class="mt-3 inline-block text-accent underline" target="_blank" rel="noopener">
            Visit {p.name} →
          </a>
        )}
      </Disclosure>
    ))}
  </Reveal>
</section>
```

- [ ] **Step 2: Render it in `index.astro` (append after IntroSection)**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import IntroSection from "../components/IntroSection.astro";
import ProjectsSection from "../components/ProjectsSection.astro";
---

<BaseLayout title="Hiren Barad — Software Entomologist" description="QA lead turned builder.">
  <main class="mx-auto max-w-3xl px-6">
    <IntroSection />
    <ProjectsSection />
  </main>
</BaseLayout>
```

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter hiren build`
Then: `grep -c "Saptapar" apps/hiren/dist/index.html`
Expected: build succeeds; grep ≥1.

- [ ] **Step 4: Manual check**

Dev server: click a project row — it expands; opening another closes the first; `+` rotates; keyboard Enter/Space works. Stop server.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/components/ProjectsSection.astro apps/hiren/src/pages/index.astro
git commit -m "feat(hiren): projects section with exclusive disclosures"
```

---

### Task 9: Experience section

**Files:**
- Create: `apps/hiren/src/components/ExperienceSection.astro`

**Interfaces:**
- Consumes: `experience` (Task 4), `Disclosure` (Task 6), `Reveal` (Task 5).
- Produces: `<ExperienceSection />` — heading + a Disclosure row per job (group `"experience"`), role/period/location + points in the body; optional logo via the `logo` slot (text fallback when `job.logo` is absent).

- [ ] **Step 1: Create `apps/hiren/src/components/ExperienceSection.astro`**

```astro
---
import { experience } from "../data/experience.ts";
import Disclosure from "./Disclosure.astro";
import Reveal from "./Reveal.astro";
---

<section id="experience" class="py-20 md:py-28">
  <Reveal><p class="text-sm uppercase tracking-[0.14em] text-accent">Experience</p></Reveal>
  <Reveal delay={80}><h2 class="mt-3 text-3xl">Where I've worked.</h2></Reveal>

  <Reveal delay={140} class="mt-8 block border-t border-line">
    {experience.map((job) => (
      <Disclosure group="experience" title={job.company} meta={job.period}>
        {job.logo && (
          <img slot="logo" src={job.logo} alt="" width="24" height="24" class="h-6 w-6 object-contain" />
        )}
        <p class="text-sm text-fg">{job.role} · {job.location}</p>
        <ul class="mt-3 list-disc space-y-2 pl-5">
          {job.points.map((pt) => <li>{pt}</li>)}
        </ul>
      </Disclosure>
    ))}
  </Reveal>
</section>
```

- [ ] **Step 2: Render it in `index.astro` (after ProjectsSection)**

Add the import and component:

```astro
import ExperienceSection from "../components/ExperienceSection.astro";
```

and inside `<main>`, after `<ProjectsSection />`:

```astro
    <ExperienceSection />
```

- [ ] **Step 3: Build and verify**

Run: `pnpm --filter hiren build`
Then: `grep -c "Vividly" apps/hiren/dist/index.html`
Expected: build succeeds; grep ≥1.

- [ ] **Step 4: Manual check**

Dev server: experience rows expand exclusively; bullet points render; reveals fire on scroll. Stop server.

- [ ] **Step 5: Commit**

```bash
git add apps/hiren/src/components/ExperienceSection.astro apps/hiren/src/pages/index.astro
git commit -m "feat(hiren): experience section with disclosures"
```

---

### Task 10: Contact, header, and final assembly

**Files:**
- Create: `apps/hiren/src/components/Header.astro`, `apps/hiren/src/components/ContactSection.astro`
- Modify: `apps/hiren/src/pages/index.astro` (final composition)

**Interfaces:**
- Consumes: `profile` (Task 4), all section components, `Reveal`.
- Produces: final homepage with top nav, all sections, contact.

- [ ] **Step 1: Create `apps/hiren/src/components/Header.astro`**

```astro
---
const links = [
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];
---

<header class="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
  <a href="/" class="font-heading text-base text-fg">Hiren Barad</a>
  <nav class="flex gap-6 text-sm text-soft">
    {links.map((l) => <a href={l.href} class="hover:text-accent">{l.label}</a>)}
  </nav>
</header>
```

- [ ] **Step 2: Create `apps/hiren/src/components/ContactSection.astro`**

```astro
---
import { profile } from "../data/profile.ts";
import Reveal from "./Reveal.astro";
const c = profile.contact;
---

<section id="contact" class="py-20 md:py-28">
  <Reveal><p class="text-sm uppercase tracking-[0.14em] text-accent">Contact</p></Reveal>
  <Reveal delay={80}><h2 class="mt-3 text-3xl">Let's talk.</h2></Reveal>
  <Reveal delay={140}>
    <p class="mt-6 max-w-xl text-soft">
      If you're building something and want a second set of eyes on quality — or just want to talk shop — reach out.
    </p>
  </Reveal>
  <Reveal delay={200} class="mt-8 block">
    <ul class="flex flex-col gap-3 text-accent">
      <li><a class="underline" href={`mailto:${c.email}`}>{c.email} →</a></li>
      <li><a class="underline" href={c.whatsappHref} target="_blank" rel="noopener">WhatsApp {c.whatsapp} →</a></li>
      <li><a class="underline" href={c.linkedin} target="_blank" rel="noopener">LinkedIn →</a></li>
      <li><a class="underline" href={c.github} target="_blank" rel="noopener">GitHub →</a></li>
    </ul>
  </Reveal>
</section>
```

- [ ] **Step 3: Final `apps/hiren/src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import Header from "../components/Header.astro";
import IntroSection from "../components/IntroSection.astro";
import ProjectsSection from "../components/ProjectsSection.astro";
import ExperienceSection from "../components/ExperienceSection.astro";
import ContactSection from "../components/ContactSection.astro";

const title = "Hiren Barad — Software Entomologist";
const description =
  "QA lead turned builder. Ten years in software quality engineering, now building his own products under Pravritti.";
---

<BaseLayout title={title} description={description}>
  <Header />
  <main class="mx-auto max-w-3xl px-6">
    <IntroSection />
    <ProjectsSection />
    <ExperienceSection />
    <ContactSection />
  </main>
  <footer class="mx-auto max-w-3xl px-6 py-10 text-sm text-soft">
    <p>© {new Date().getFullYear()} Hiren Barad · pravritti.org</p>
  </footer>
</BaseLayout>
```

- [ ] **Step 4: Build and verify content**

Run: `pnpm --filter hiren build`
Then: `for s in "Software Entomologist" "Things I'm building" "Where I've worked" "Let's talk" baradhiren@hotmail.com; do grep -c "$s" apps/hiren/dist/index.html; done`
Expected: build succeeds; each grep ≥1.

- [ ] **Step 5: Manual full-page review**

Dev server: scroll top→bottom — reveals fire per section; nav anchors smooth-scroll; all disclosures work exclusively; photo swaps; check 375 / 768 / 1024 / 1440 widths for no horizontal scroll; tab through with keyboard for visible focus; toggle reduce-motion. Stop server.

- [ ] **Step 6: Commit**

```bash
git add apps/hiren/src/components/Header.astro apps/hiren/src/components/ContactSection.astro apps/hiren/src/pages/index.astro
git commit -m "feat(hiren): contact, header, and final homepage assembly"
```

---

### Task 11: Cloudflare Pages deployment runbook

Operational (Cloudflare dashboard + DNS), performed by Hiren. Produces a committed runbook and results in `hiren.pravritti.org` serving the site.

**Files:**
- Create: `DEPLOY.md`

- [ ] **Step 1: Push the repo to GitHub**

```bash
git remote -v   # if no remote, create the GitHub repo and add it
git push -u origin main
```

- [ ] **Step 2: Create `DEPLOY.md`**

```markdown
# Deployment — Cloudflare Pages

Each subdomain is its own Cloudflare Pages project, all connected to this one
GitHub repo, each pointed at a different subfolder.

## One-time: move DNS to Cloudflare
1. Cloudflare dashboard → Add a site → `pravritti.org`.
2. At your registrar, replace nameservers with the two Cloudflare provides.
   Wait until Cloudflare shows the zone "Active".

## Per site: create the Pages project (hiren)
1. Workers & Pages → Create → Pages → Connect to Git → select this repo, branch `main`.
2. Build settings:
   - Framework preset: Astro
   - Root directory: `apps/hiren`
   - Build command: `pnpm install && pnpm build`
   - Build output directory: `dist`
   - Environment variable: `PNPM_VERSION` = `9`
3. Deploy; confirm the `*.pages.dev` URL serves the site.
4. Custom domains → set up `hiren.pravritti.org` (Cloudflare creates the CNAME).
5. Settings → Builds → Build watch paths: include `apps/hiren/*` and
   `packages/config/*` so this project only rebuilds when relevant code changes.

## Adding future sites
Repeat with a new project, root directory `apps/<name>`, domain
`<name>.pravritti.org`. The game (`saptapar`) lives in its own repo.
```

- [ ] **Step 3: Perform deployment**

Follow `DEPLOY.md` steps 1–5 in the Cloudflare dashboard.

- [ ] **Step 4: Verify the live site**

Run: `curl -sI https://hiren.pravritti.org/ | head -1` and `curl -s https://hiren.pravritti.org/ | grep -c "Software Entomologist"`
Expected: `HTTP/2 200`; grep ≥1.

- [ ] **Step 5: Commit**

```bash
git add DEPLOY.md
git commit -m "docs: add Cloudflare Pages deployment runbook"
git push
```

---

## Self-Review

**Spec coverage (portfolio spec):**
- Designer-minimal aesthetic + exact tokens/fonts → Task 3 (`global.css` `@theme`) ✓
- Single column, max-width, smooth scroll, mobile-first → Tasks 3 (base.css), 10 (layout), manual checks ✓
- Sections Intro(+about+tools+photo) / Projects / Experience / Contact → Tasks 7, 8, 9, 10 ✓
- Subtle fade+float reveal, transform/opacity only, reduced-motion → Task 5 ✓
- Exclusive accessible disclosures (Projects & Experience) → Tasks 6, 8, 9 ✓
- Photo swap on hover/click + tap, no-JS fallback → Task 7 ✓
- Editable content data model (profile/projects/experience/tools) → Task 4 ✓
- Contact with email/WhatsApp/LinkedIn/GitHub → Task 10 ✓
- Assets-from-Hiren with text/placeholder fallbacks (portraits, logos) → Tasks 7 (placeholders), 9 (optional logo slot) ✓
- A11y: focus rings, aria, ≥44px, single h1/h2, no emoji → base.css + Disclosure + sections ✓

**Spec coverage (scaffold spec):** pnpm workspace (T1), packages/config light layer (T2), Astro static + Tailwind v4 (T3), packages/ui deferred (not created), Cloudflare per-subdomain + DNS + build watch paths (T11), Playwright/CI deferred (omitted, noted) ✓

**Deferred from portfolio spec (intentional, not gaps):** the "things" hover→icons micro-interaction is simplified to plain text in Task 7's bio (the icon set isn't defined yet); add as a follow-up when project icons exist. Real portraits/company logos are placeholders/text until Hiren supplies assets.

**Placeholder scan:** No TODO/TBD left in code. SVG placeholders in Task 7 are intentional, labeled, and replaced by real assets later.

**Type consistency:** `Disclosure` props `{ group, title, meta? }` + named `logo` slot — defined Task 6, used identically in Tasks 8 & 9. `profile`/`projects`/`experience` shapes defined in Task 4 and consumed unchanged. Token utility names (`bg-canvas`, `text-fg`, `text-ink`, `text-soft`, `text-accent`, `bg-accent`, `bg-fill`, `border-line`, `font-heading`, `font-body`) defined in Task 3 and used consistently.
