---
brief: 03-builder
role: builder
status: queued
---
# Brief: Publish reviewed analytics commits to matching remote branches

Read this file top to bottom, then execute under your routing table. Start only after `02-reviewer` has archived an explicit APPROVE verdict; on REDO or missing approval, STOP without pushing and ask the orchestrator.

## Inputs (read in order)
- .memory/preferences.md
- .memory/specs/analytics-tag.md

## Expected output
- Matching remote branches `origin/main`, `origin/hiren`, `origin/pravritti`, `origin/tithi`, `origin/chikitsalay` each point to the commit independently reviewed for the corresponding local branch.
- `.memory/handoffs/archive/03-builder--builder.md` with before/after remote commit IDs, push results and any deployment caveat.

## Done criteria
- [ ] Read `.memory/handoffs/archive/02-reviewer--reviewer.md` and require APPROVE; confirm all five reviewed local commits and their parent/base IDs are unchanged. No source edits, new commits, merge, cherry-pick, rebase, or force-push.
- [ ] Before ANY push, confirm `git ls-remote --heads origin <branch>` equals the recorded pre-change base for EVERY branch. If any branch advanced/diverged or approval is absent, push none and raise a blocking clarification.
- [ ] Push each local branch to its same-named remote branch with ordinary fast-forward `git push origin refs/heads/<branch>:refs/heads/<branch>` only. On any failure stop immediately, report which refs succeeded and which did not; never force or reconcile histories.
- [ ] Verify `git ls-remote --heads origin <branch>` equals the reviewed local commit on all five remote branches, report hashes, and do not claim a deployment without separate evidence.

## Context
This is a publication-only brief following one independently reviewed batch. The root checkout has unrelated dirty/untracked files; never stage or modify them. Local commits are independent per branch, even where `main` and `hiren` started at the same remote tip. The user explicitly wants pushes to the existing respective branches and NO cross-branch merges. If a remote changes before publication, do not try to catch it up without a new orchestrator decision.

## Intake
- spec: `.memory/specs/analytics-tag.md` (matching-branch publication and safety contract).
- test command: from root, for EACH of `main hiren pravritti tithi chikitsalay` run `git rev-parse refs/heads/<branch>`, `git rev-list --parents -n 1 refs/heads/<branch>`, and `git ls-remote --heads origin <branch>` before ANY push; compare results to `.memory/handoffs/archive/02-reviewer--reviewer.md` and the recorded remote base. Repeat `git ls-remote --heads origin <branch>` after every successful `git push origin refs/heads/<branch>:refs/heads/<branch>`; verify final remote hash equals the reviewed local hash for all five branches.
- done criteria: the four checkboxes above.
- files in scope: no source file changes; ONLY the five corresponding remote branch refs via ordinary fast-forward push and this role's handoff/clarifications. No other remote refs.
- platform doc: none exists yet
