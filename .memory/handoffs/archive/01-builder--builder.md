# Handoff: 01-builder — builder — 2026-10-25
status: DONE

## Did
- Added the exact `G-YSWNYMZ3JX` Google tag (Astro `is:inline` to retain the literal loader and initializer) inside the shared document head. Each branch was edited and committed independently; only these paths were committed:

| Branch | Remote base tip = commit parent | Local commit | Layouts (`apps/<app>/src/layouts/BaseLayout.astro`) |
| --- | --- | --- | --- |
| main | `58986141bc7db3d28fe61bfa61af1cf36b61f257` | `d5786ad88ae25b44c487377586f0f17413692fc1` | hiren |
| hiren | `58986141bc7db3d28fe61bfa61af1cf36b61f257` | `fcd7243ba77d218ce246a32382bbfd519f98726f` | hiren |
| pravritti | `193484188d7eef5316fc0ab8923e6ad16cd06cbb` | `b1ee39a41d6c8bef61eb1be51cca0edcfcb0047c` | hiren, pravritti |
| tithi | `03d4b88bb43b1297e6c5ac3df6dddbd1fce29b1f` | `7a11c7a6d02771e597d3c7d4155f40dd25a3709c` | hiren, tithi |
| chikitsalay | `3c844a5a9b488073599966ad46ce8926baa94e3a` | `3066bfc1f8a5aa5c0eeb2756c8840a960da56555` | hiren, tithi, chikitsalay |

- Other branches remain in `.memory/artifacts/01-builder/worktrees/<branch>/` for independent review. The dirty root `.gitignore` and untracked `.claude/`, `.memory/`, `.pi/` were not staged or altered by the commits. No remote was pushed.

## Verification evidence
- `git fetch origin main hiren pravritti tithi chikitsalay` before edits: all five remote-tracking tips matched the approved snapshot above. Each local commit's parent equals its remote base tip.
- TDD red: after `pnpm install --frozen-lockfile` and baseline builds, the spec's `python3 - <apps> <<'PY' ... PY` HTML assertion failed as expected on `apps/hiren/dist/404.html` in each branch (`AssertionError: loader count`); running it separately for pravritti, tithi, and chikitsalay failed on their own `404.html` as well. Only then were layouts edited.
- Fresh after commits: removed each app's `dist`, ran `pnpm --filter <app> build` for every matrix app in every checkout, then ran the **exact** spec Python assertion with that branch's app list. Output:

```
main:          hiren build PASS; hiren: 2 pages with exactly one loader and config
hiren:         hiren build PASS; hiren: 2 pages with exactly one loader and config
pravritti:     hiren, pravritti builds PASS; hiren: 2 pages with exactly one loader and config; pravritti: 3 pages with exactly one loader and config
tithi:         hiren, tithi builds PASS; hiren: 2 pages with exactly one loader and config; tithi: 5 pages with exactly one loader and config
chikitsalay:   hiren, tithi, chikitsalay builds PASS; hiren: 2 pages with exactly one loader and config; tithi: 5 pages with exactly one loader and config; chikitsalay: 11 pages with exactly one loader and config
```

- Extra `html.parser` validation of all 2/2/5/11 generated pages (as appropriate per app) confirmed one async loader and one config **inside `<head>`** and confirmed `404.html` for each app. Built route inspection found no missing expected route: hiren index+404 (2); pravritti index+blog+404 (3); tithi index+support+privacy+data-deletion+404 (5); chikitsalay root/en index, root/en blog indexes, three generated root and three generated en blog posts, and 404 (11). This exercises nested document and blog layouts through the built output.
- `git grep -n 'G-YSWNYMZ3JX' -- 'apps/**/src/**'` on each branch returned only its matrix-listed layouts, two hits per layout (loader and config). `git show --format=fuller --stat HEAD` reported respectively 1/1/2/2/3 layout files and 9/9/18/18/27 inserted lines; `git status --short` was empty in all four added worktrees and showed only the pre-existing root dirty/untracked files on main. `git diff --check` passed.

## Didn't / cut
- No unrelated edits, merge, cherry-pick, rebase, push, force-push, or deployment claim.

## Open questions
- None.

## Suggested next
- Have `02-reviewer` independently rebuild and inspect these local commits before authorizing the separate publish brief.

## Memory writes
- decisions.md: none (the tag and scope were specified by the brief)
- runbooks.md: updated with per-branch build commands and generated-HTML location
- notebook: none
