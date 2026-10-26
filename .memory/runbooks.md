# Runbooks

How to work this project. Builder and ops keep this current.

## Setup
- Run `/path/to/stratum/scripts/stratum-init.sh` once to scaffold `.memory/`.
- For pi, run `/path/to/stratum/scripts/stratum-init.sh --harness pi`, fill the user-owned `.pi/stratum.json` model candidates, then trust the project in pi.
- Autonomous execution is opt-in: create `.memory/runs/<run-id>/manifest.json` only after interactive planning and local human approval. Init never creates an approved manifest or notification target.

## Run
- Default interactive queue: `scripts/stratum-next` (or `scripts/stratum-next --harness pi`). If no approved run manifest exists, keep using this path.
- Autonomous pi owner: `STRATUM_AUTONOMOUS_RUN_ID=<run-id> pi`. Start it locally; Telegram replies are not approvals, resumes, or cancellations.
- Resume after crash: rerun the same owner command. The controller replays `.memory/runs/<run-id>/events.jsonl` and `notifications.jsonl`; `commit-unknown` notification outcomes require local reconciliation, never blind resend.
- Exact notifications: the approved manifest names `profile`, numeric `chat_id`, and optional `thread_id`. The pi bridge revalidates that target/profile through the public delivery membrane on every send.
- Claude fallback: Claude autonomous runs may use the normalized adapter, but without an authorized sender they report notification unavailable instead of using Telegram.

## Test
- Run project tests named by the approved manifest before approval and after recovery.
- For Stratum itself, run every `bash tests/test_*.sh`; `scripts/stratum-evals` reports autonomous completion, quota, pause, notification, and intervention metrics from `.memory/runs/`.

- For site branches, from each checkout run `pnpm install --frozen-lockfile`, then `pnpm --filter <app> build` for every deployed app: main/hiren → hiren; pravritti → hiren, pravritti; tithi → hiren, tithi; chikitsalay → hiren, tithi, chikitsalay. Generated HTML is under `apps/<app>/dist/` (including `404.html`); the exact once-per-page Google-tag assertion is in `.memory/specs/analytics-tag.md` §Verification contract. Inspect the built routes, not just the source layouts (clinic generates locale-specific blog posts).

## Deploy
- Rollback autonomous operations by stopping the pi owner and disabling/removing the controller extension from `.pi/settings.json`. Do not delete `.memory/runs/<run-id>/` manifests, events, or notification journals; they are the audit and resume record.
