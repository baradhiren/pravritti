# Bug Game — Severity-Based Roster & Scoring

**Date:** 2026-06-22
**Component:** `apps/hiren/src/components/BugGame.astro`
**Status:** Design — approved roster/severity/scoring, pending spec review

## Goal

Today the intro bug game has 7 behaviourally-distinct types, but `drawBug`
renders every one as the same recoloured **ladybug**, so they all read as
harmless. Make the bugs feel like a real, varied threat by:

1. Giving them **distinct procedural silhouettes** (no longer all ladybugs).
2. Organising every type under a single **severity** axis (Sev 0–4) — the same
   scale a QA team triages with — that drives look, toughness, powers, and worth.
3. Changing the score so **tougher (higher-severity) squashes are worth more**.

Software-bug puns stay — they're the point of a QA portfolio. Severity makes the
naming richer (Cosmetic "Typo" vs Critical "Memory Leak").

## Non-goals

- No new damage/penalty mechanics against the player or the page. Gameplay stays
  **squash-only** — "harmful" means *looks/feels* dangerous, plus higher payout.
  ("Powers" = the disruption behaviours that already exist: teleport, flicker,
  grow, extra HP.)
- No combo/multiplier scoring (just summed points).
- No art-asset pipeline — everything is drawn on the existing `<canvas>`.

## Severity model

Severity is the one knob. Each tier sets HP, size, palette, behaviour intensity,
points, and spawn frequency. Lower severities are common; higher are rare.

| Sev | Label | HP | Look | Behaviour | Points | Spawn weight |
|-----|-------|----|----|-----------|--------|--------------|
| 4 | Cosmetic | 1 | tiny, pale, almost cute | wanders; **stops to stare & taunt** | +1 | common |
| 3 | Minor | 1 | small | mildly evasive | +2 | common |
| 2 | Major | 2 | medium, saturated | disruptive (fast / flickers) | +5 | uncommon |
| 1 | Critical | 3 | large, angry red, armoured/leggy | strong disruption (teleport / grows) | +10 | rare |
| 0 | Blocker | 5 | biggest | the boss — combines powers | +25 | very rare |

## Roster

`name` = the software-bug pun (shown in the float toast). `silhouette` is the
creature drawn. **Several names share one silhouette** — variety is cheap via
name + colour + taunt; new drawing code is not. Six silhouettes total.

- **Sev 4 · Cosmetic** *(gnat — soft, googly-eyed)*: Typo, Cosmetic Bug,
  Lorem Ipsum, Whitespace
- **Sev 3 · Minor** *(moth)*: Off-by-One, Magic Number, Tooltip Typo
- **Sev 2 · Major** *(wasp = fast/erratic, mosquito = flickers)*: Race Condition,
  Heisenbug, Flaky Test
- **Sev 1 · Critical** *(spider = teleports, cockroach = tanky, tick = grows)*:
  Null Pointer, Regression, Memory Leak, Deadlock
- **Sev 0 · Blocker** *(scaled-up spider/roach)*: Segfault, Kernel Panic, Prod Outage

### Six silhouettes (procedural canvas)

Each is a small `drawX(ctx, s, …)` routine sharing the current conventions
(translate/rotate to heading, dark body + light-rim head so it reads on the dark
bg, animated leg swing via `b.phase`/`b.legSpeed`). Distinctive features:

- **gnat** — tiny round body, oversized googly eyes, 2 stubby wings. Reads cute.
- **moth** — broad fuzzy triangular wings, feathery antennae.
- **wasp** — segmented striped abdomen, pointed stinger, blurred fast wings.
- **mosquito** — thin body, long proboscis, long dangling legs, faint wings.
- **spider** — round abdomen + cephalothorax, **8** splayed scuttling legs, fangs.
- **roach/tick** — flat glossy oval carapace, long antennae; the **tick** variant
  is the same body that visibly **swells** when `grows` is set. Boss = this/spider
  scaled up with a darker shell.

`drawBug` becomes a dispatcher: `SHAPES[b.type.shape](c, s, b, t)`. The current
ladybug routine is removed (or retained only if a type maps to it — it does not).

## Data model

Extend `BugType` (in `BugGame.astro`):

```ts
type Severity = 0 | 1 | 2 | 3 | 4;
type Shape = "gnat" | "moth" | "wasp" | "mosquito" | "spider" | "roach";

type BugType = {
  name: string;
  flavor: string;        // existing — threat/taunt line in the toast
  severity: Severity;    // new — drives HP/points/spawn
  shape: Shape;          // new — which silhouette to draw
  points: number;        // new — score awarded (derived from severity: 1/2/5/10/25)
  hp: number;
  sizeMul: number;
  speedMul: number;
  color: string;
  spot: string;          // accent (stripes/markings/legs) per shape
  grows?: boolean;
  dodges?: boolean;
  flickers?: boolean;
  taunts?: boolean;      // new — Cosmetic tier stop-and-stare behaviour
};
```

`hp`/`sizeMul`/`points` follow from severity but stay explicit per type so a
designer can nudge a single bug without touching the tier. The `TYPES` array is
rewritten to the roster above.

## Spawn weighting & difficulty

- Replace the uniform `spawnBug(TYPES[random])` with a **severity-weighted**
  pick: early game favours Sev 3–4; as `squashed` (or elapsed time) climbs, the
  weight shifts toward Sev 1–2. The **Blocker** has a tiny flat chance that only
  unlocks after N squashes, and at most one Blocker alive at a time.
- Keep the existing pacing ramp (`spawnEvery` tightening per squash) unchanged.
- The two seeded opening bugs become low-severity (a Cosmetic + a Minor) so the
  game opens gently.

## Scoring

- Add a running `score` (points) alongside the existing `squashed` **count**.
- On squash: `score += b.type.points`; the score readout shows `score`, and the
  float toast gains a `+N` line next to the name/flavor.
- **Kill-switch reveal stays on bug *count*** (`squashed >= needToReveal`), so
  timing/feel of the intro is unchanged — only the displayed number is points.
- `+N` styling scales subtly with magnitude (a +25 Blocker pops bigger) for game-feel.

## Cosmetic taunt behaviour

When `taunts` is set, a bug occasionally (low probability per second, with a
cooldown) **pauses, rotates to face the cursor**, and floats a mocking line from
its `flavor`/a small taunt pool ("nice margins 🙄", "ship it, nobody'll notice").
High-severity bugs keep a threatening `flavor` line shown on squash as today.
This is cheap: a per-bug `tauntAt` timestamp + a brief velocity freeze; no new
systems.

## Files touched

- `apps/hiren/src/components/BugGame.astro` — the whole change lives here: type
  defs, `TYPES`, the six shape routines + `drawBug` dispatch, weighted spawn,
  score/points, taunt behaviour, `+N` toast. The intro copy comment at the top
  and any "Squash bugs"/flavor text that references specific old types gets a
  light pass.

No other files change (the launch button, localStorage gating, and photos work
are untouched).

## Verification

- `npm run build` passes.
- Manual: clear `localStorage["hiren:played"]`, load, and confirm — distinct
  silhouettes per tier; Cosmetic bugs taunt; higher-severity bugs take more hits
  and award more points (`+N` floats, score sums); a Blocker appears rarely and
  is clearly the boss; reduced-motion still shows no game.

## Out of scope / future

- Per-name unique silhouettes (currently shared within a tier/shape).
- Combo multipliers, leaderboards, sound-per-severity.
- Player-damage mechanics.
