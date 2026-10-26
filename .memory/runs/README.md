# Autonomous run records

This directory is the opt-in Stratum autonomous execution contract. It is committed project memory and never contains secrets, credentials, raw prompts/logs, hidden reasoning, or Telegram bot tokens.

Initialization only creates this empty guidance file; it does not approve a run, create a manifest, choose a notification target, or grant scheduling authority. A real run lives at `.memory/runs/<run-id>/` only after an interactive orchestrator/human planning phase seals and approves its manifest.

Per-run files:
- `manifest.json` — immutable approved scope, model policy, brief hashes, exact notification target, and local human approval digest.
- `events.jsonl` — append-only durable controller journal.
- `notifications.jsonl` — append-only delivery outbox and outcomes.
- `README.md` — recovery notes and human actions for that run.

Existing run directories are audit records. Do not clobber or edit them in place; approve a successor manifest for scope changes.
