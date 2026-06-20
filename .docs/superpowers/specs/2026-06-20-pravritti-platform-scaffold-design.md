# Pravritti Platform Scaffold + Hiren Portfolio — Design

**Date:** 2026-06-20
**Status:** Approved (design), pending spec review
**Scope of this spec:** The multi-site monorepo scaffold (pnpm workspace + shared config layer + Cloudflare Pages deployment wiring) **plus the `hiren.pravritti.org` portfolio live on its subdomain.** Each later site (`www`, `tithi`, `saptapar`) gets its own separate spec.

---

## Goal

Serve multiple independent sites under `pravritti.org`:

- `pravritti.org` — AI lab homepage *(later)*
- `hiren.pravritti.org` — personal portfolio *(this spec — first site)*
- `tithi.pravritti.org` — mobile app landing page *(later)*
- `saptapar.pravritti.org` — open-world game *(later, separate repo — see below)*

…with a single repo for the web sites, a light shared layer, and per-subdomain independent deploys.

## Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| Hosting | **Cloudflare Pages**, one project per subdomain, all from this one repo | Multiple Pages projects can target different subfolders of the same repo; free tier; handles large static assets |
| Framework | **Astro** (static/SSG output) | Content-first, ~zero JS by default → fast + great SEO; React available as islands when needed |
| Styling | **Tailwind**, with a shared preset that carries design tokens | Velocity + consistency; each site can override freely |
| Repo strategy | **Monorepo for web sites** (`hiren`, `www`, `tithi`) + shared layer; **`saptapar` (game) in its own repo** later | Monorepo makes the shared layer trivial (workspace symlinks, atomic changes); the game's large binary assets + different toolchain (likely Git LFS) would bloat the monorepo, so it stays separate |
| Monorepo tool | **pnpm workspaces** (no Turborepo) | Lightweight; Turborepo is overkill for a few static sites |
| Sharing | **Light shared layer** — populate `packages/config` now; **defer `packages/ui`** until a 2nd site needs a shared component | Honors "light shared layer" without building abstractions ahead of a real consumer (YAGNI) |
| Quality gate (Playwright + CI) | **Deferred** — not in this spec | Revisit once more than one site exists |

---

## Architecture

### Repo structure

```
pravritti/
├─ pnpm-workspace.yaml          # workspace globs: apps/*, packages/*
├─ package.json                 # root scripts + dev tooling
├─ tsconfig.base.json
├─ apps/
│  └─ hiren/                    # → hiren.pravritti.org  (this spec)
│     ├─ package.json
│     ├─ astro.config.mjs
│     ├─ tailwind.config.mjs    # extends shared preset
│     ├─ tsconfig.json          # extends tsconfig.base.json
│     ├─ public/
│     └─ src/
│        ├─ pages/
│        │  ├─ index.astro
│        │  └─ 404.astro
│        ├─ layouts/
│        ├─ components/
│        └─ styles/
└─ packages/
   └─ config/                   # shared layer (populated now)
      ├─ package.json           # name: @pravritti/config
      └─ tailwind-preset.mjs    # design tokens: colors, type scale, EB Garamond, spacing
# shared TS base lives in the root tsconfig.base.json; apps extend it directly
# apps/www, apps/tithi  → added in their own specs
# packages/ui           → added when a 2nd site needs a shared component
# saptapar (game)       → separate repo, created later
```

### Component boundaries

- **`packages/config`** — the shared layer. Exposes a Tailwind preset (design tokens) and shared TS config. Consumed via workspace import (`@pravritti/config`). One purpose: keep cross-site design/config consistent without duplication. Depends on nothing.
- **`apps/hiren`** — a self-contained Astro static site. Imports the Tailwind preset; otherwise independent. Builds to `apps/hiren/dist`.
- Each app is independently buildable and deployable; no app imports another app.

### Data flow

Static site generation only. `astro build` renders `apps/hiren/src/pages/**` to static HTML/CSS/JS in `apps/hiren/dist`. Cloudflare Pages serves that directory. No server runtime, no database.

---

## Deployment (Cloudflare Pages)

1. Move `pravritti.org` nameservers to Cloudflare (DNS managed by Cloudflare).
2. Create a Pages project per app, connected to this GitHub repo. For `hiren`:
   - **Root directory:** `apps/hiren`
   - **Build command:** `pnpm install && pnpm --filter hiren build`
   - **Output directory:** `apps/hiren/dist` (or `dist` relative to root dir)
   - **Custom domain:** `hiren.pravritti.org`
3. Set **build watch paths** so the project only rebuilds when `apps/hiren/**` or `packages/config/**` change.
4. Push to `main` → the affected subdomain redeploys. Each site deploys independently.

---

## Local development

- `pnpm install` at root.
- `pnpm --filter hiren dev` runs the portfolio locally on its own port.
- Editing `packages/config` is reflected immediately in consuming apps via workspace symlink.

---

## First site: hiren.pravritti.org

- Content adapted from the existing `index.html` (consulting/QA material). Note: this content now lives on the `hiren` subdomain, not the apex — the apex becomes the AI lab homepage later.
- Detailed visual/content design is a focused pass done **when building the site**, not part of this scaffold spec.
- Ships its own `404.astro`.

## Error handling

- Per-site `404.astro` for not-found routes.
- Build failures surface in the Cloudflare Pages dashboard / deploy logs; a failed build does not publish, so the live site stays on the last good deploy.

## Out of scope (this spec)

- `www`, `tithi` sites (own specs).
- `saptapar` game (own repo + spec).
- `packages/ui` shared component library (added when a 2nd site needs it).
- Playwright smoke tests + GitHub Actions CI (deferred).
- SSR / `@astrojs/cloudflare` adapter (only if a future site needs server rendering).

---

## Prerequisites

- Node.js + `pnpm` installed locally.
- Access to `pravritti.org` at its registrar to repoint nameservers to Cloudflare.
- A Cloudflare account.
