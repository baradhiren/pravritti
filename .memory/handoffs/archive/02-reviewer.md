---
brief: 02-reviewer
role: reviewer
status: queued
---
# Brief: Review every branch before publishing analytics

Read this file top to bottom, then execute under your routing table. Wait until `01-builder` completes and archives its brief and handoff.

## Inputs (read in order)
- .memory/preferences.md
- .memory/specs/analytics-tag.md

## Expected output
- `.memory/handoffs/archive/02-reviewer--reviewer.md` with explicit APPROVE or REDO and independent per-branch evidence.

## Done criteria
- [ ] On all five branches, every rendered HTML page of every site app in the matrix contains exactly one async loader and one config for `G-YSWNYMZ3JX` in the document head, including nested-layout/404 pages where generated.
- [ ] Build and inspect every app in the branch matrix; report page counts and any missing expected route. No duplicate tag or unrelated code edit.
- [ ] Only matrix-listed layout paths were committed independently on each matching local branch; existing root dirty/untracked files were preserved. No merge, cherry-pick, rebase, push or force-push; worktrees remain available.
- [ ] Check each builder criterion above from fresh evidence and render APPROVE or REDO; report all five local commit IDs and their exact base tips for the publisher.

## Context
One review batch covers one logical rollout over five branches. At execution time read `.memory/handoffs/archive/01-builder.md` (the brief under review) and `.memory/handoffs/archive/01-builder--builder.md` (its evidence); neither exists until builder completion. Verify directly, never accept self-report. The later publisher must not run on REDO, so state the verdict unambiguously. No remote push or live-deployment claim belongs to this review.

## Intake
- brief under review: `.memory/handoffs/archive/01-builder.md`; completed builder handoff at `.memory/handoffs/archive/01-builder--builder.md`.
- done criteria: all three builder criteria reproduced above, plus the independent verdict and base-tip/commit evidence in the fourth checkbox.
- verification commands: in EACH branch worktree run `pnpm install --frozen-lockfile` if needed, `pnpm --filter hiren build` everywhere, `pnpm --filter pravritti build` on `pravritti`, `pnpm --filter tithi build` on `tithi` and `chikitsalay`, and `pnpm --filter chikitsalay build` on `chikitsalay`; execute the exact `python3 - <apps> <<'PY' ... PY` built-HTML checker in the spec for all apps in that branch. Independently run `git grep -n 'G-YSWNYMZ3JX' -- 'apps/**/src/**'`, `git show --format=fuller --stat HEAD`, `git rev-list --parents -n 1 HEAD`, `git status --short`, and compare parent commit to the branch's recorded remote base. Never equate the remote-tracking ref with an already-published commit.
- platform doc: none exists yet
