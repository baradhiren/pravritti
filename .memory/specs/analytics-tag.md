# Analytics tag rollout — approved scope

Measurement ID: `G-YSWNYMZ3JX`. Place this exact Google-provided tag inside `<head>` once per rendered page (Astro may require `is:inline` on script tags to keep the literal external URL and unprocessed initializer):

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YSWNYMZ3JX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-YSWNYMZ3JX');
</script>
```

Do not install a new package or add a consent flow, extra events, domain-specific IDs, or unrelated page edits.

## Branch matrix (the remote-tracking refs observed at intake)

| branch | deployed site app(s) requiring coverage | shared head file(s) |
| --- | --- | --- |
| `main` | `hiren` | `apps/hiren/src/layouts/BaseLayout.astro` |
| `hiren` | `hiren` | `apps/hiren/src/layouts/BaseLayout.astro` |
| `pravritti` | `hiren`, `pravritti` | `apps/hiren/src/layouts/BaseLayout.astro`, `apps/pravritti/src/layouts/BaseLayout.astro` |
| `tithi` | `hiren`, `tithi` | `apps/hiren/src/layouts/BaseLayout.astro`, `apps/tithi/src/layouts/BaseLayout.astro` |
| `chikitsalay` | `hiren`, `tithi`, `chikitsalay` | `apps/hiren/src/layouts/BaseLayout.astro`, `apps/tithi/src/layouts/BaseLayout.astro`, `apps/chikitsalay/src/layouts/BaseLayout.astro` |

Inspected remote tips at plan time: `main` and `hiren` = `58986141bc7db3d28fe61bfa61af1cf36b61f257`; `pravritti` = `193484188d7eef5316fc0ab8923e6ad16cd06cbb`; `tithi` = `03d4b88bb43b1297e6c5ac3df6dddbd1fce29b1f`; `chikitsalay` = `3c844a5a9b488073599966ad46ce8926baa94e3a`. Fetch/check again before building; these are safety baselines, not permission to overwrite an advanced remote.

Pages under these apps (including 404, support/legal, clinic locale/blog routes and nested `DocLayout`/`PostLayout`) use `BaseLayout` directly or transitively. Verify actual built HTML in each branch, including generated blog pages. No tag should appear twice on a page. If a branch has advanced or the layout assumption is false, stop and raise a blocking clarification rather than silently skip coverage. Do not modify unrelated apps/routes or already-unrelated dirty files.

## Safe branch workflow

The root checkout is `main` and has pre-existing non-source work (`.gitignore`, `.memory/`, `.claude/`, `.pi/`). Do not reset, stash, switch, or clean it. Work on the existing `main` checkout for `main`; use separate ignored worktrees under `.memory/artifacts/01-builder/worktrees/` rooted at remote refs `origin/hiren`, `origin/pravritti`, `origin/tithi`, `origin/chikitsalay`, each on its corresponding local branch. If a local branch/worktree exists already, inspect it; never overwrite it. Before editing, fetch each remote branch and record its exact tip; if it has advanced beyond the inspected snapshot, stop and ask for re-planning rather than merging. Independently edit and commit only in-scope layout changes on each corresponding local branch. No merge, cherry-pick, rebase, force-push, or transfer of commits between branches: identical layout content on different branches should be edited and committed separately. Leave local commits and worktrees for independent review; builder does not push. Report each branch's base tip and new commit ID. Because `.memory/` lives only in the root checkout, execute role handoffs/brief updates there, not inside a worktree.

After the reviewer issues APPROVE, a separate publish brief pushes each local branch to the same-named remote branch, and no other ref. Before each push, fetch/check the remote's exact tip against the recorded base tip and the reviewed commit's parent; if it advanced or diverged, stop and escalate rather than merge, rebase or force. Push normally (fast-forward only), then verify `git ls-remote --heads origin <branch>` equals the reviewed local commit for all five branches. A successful push does not prove live deployment; report push evidence and any deployment status separately.

## Verification contract

On each branch, install using its `pnpm-lock.yaml` (`pnpm install --frozen-lockfile` if dependencies are missing), then build EVERY app in its row via `pnpm --filter <app> build`. From the branch worktree root (root checkout for `main`), execute this exact HTML check with all app names in its matrix row (for example `python3 - hiren tithi` on `tithi`):

```bash
python3 - hiren <<'PY'
import pathlib, sys
for app in sys.argv[1:]:
    pages = sorted(pathlib.Path('apps', app, 'dist').rglob('*.html'))
    assert pages, f'no built HTML for {app}'
    for page in pages:
        html = page.read_text()
        assert html.count('gtag/js?id=G-YSWNYMZ3JX') == 1, f'loader count: {page}'
        assert html.count("gtag('config', 'G-YSWNYMZ3JX')") == 1, f'config count: {page}'
    print(f'{app}: {len(pages)} pages with exactly one loader and config')
PY
```

If Astro outputs equivalent minified/quoted syntax, adapt only the check, not the required behavior. Include generated blog pages and 404 output where emitted. For a global sanity check, `git grep -n 'G-YSWNYMZ3JX' -- 'apps/**/src/**'` on each branch must only hit the matrix's layout files. Record counts, builds and commit IDs in the builder handoff so a reviewer can re-run them from scratch.
