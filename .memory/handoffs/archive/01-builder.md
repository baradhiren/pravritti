---
brief: 01-builder
role: builder
status: queued
---
# Brief: Add the Google tag independently on each site branch

Read this file top to bottom, then execute under your routing table.

## Inputs (read in order)
- .memory/preferences.md
- .memory/specs/analytics-tag.md

## Expected output
- Five local branch commits (`main`, `hiren`, `pravritti`, `tithi`, `chikitsalay`) editing only their matrix-listed `BaseLayout.astro` files.
- `.memory/handoffs/archive/01-builder--builder.md` recording each remote base tip, local commit ID and fresh verification results.

## Done criteria
- [ ] On all five branches, every rendered HTML page of every site app in the matrix contains exactly one async loader and one config for `G-YSWNYMZ3JX` in the document head, including nested-layout/404 pages where generated.
- [ ] Build and inspect every app in the branch matrix; report page counts and any missing expected route. No duplicate tag or unrelated code edit.
- [ ] Commit only matrix-listed layout paths independently on each matching local branch; preserve existing root dirty/untracked files. No merge, cherry-pick, rebase, push or force-push; leave worktrees for independent review.

## Context
Ongoing maintenance of separate deployed site branches. This brief makes local commits only; the later brief `03-builder` pushes after `02-reviewer` approves. Work from the existing dirty `main` checkout plus separate ignored worktrees for other branches. All site pages, including clinic blog and Tithi document pages, use the relevant app's shared base layout directly or through a nested layout. If a remote tip advances or a page bypasses that layout, add a blocking clarification rather than guessing.

## Intake
- spec: `.memory/specs/analytics-tag.md` (exact user snippet, branch matrix, remote baselines, worktree/verification contract).
- test command: in EACH branch worktree run `pnpm install --frozen-lockfile` if needed; run `pnpm --filter hiren build` on every branch, `pnpm --filter pravritti build` on `pravritti`, `pnpm --filter tithi build` on `tithi` and `chikitsalay`, and `pnpm --filter chikitsalay build` on `chikitsalay`. Then run the spec's exact `python3 - <apps> <<'PY' ... PY` HTML-check command with that branch's app names, plus `git grep -n 'G-YSWNYMZ3JX' -- 'apps/**/src/**'`; check `git show --format=fuller --stat HEAD` and `git status --short`.
- done criteria: three checkboxes above plus the spec's verification contract.
- files in scope: matrix-listed `apps/<app>/src/layouts/BaseLayout.astro` on each matching branch, ignored `.memory/artifacts/01-builder/worktrees/` for other checkouts, dependency/build outputs and this role's handoff/clarifications. Do not stage unrelated root files.
- platform doc: none exists yet
