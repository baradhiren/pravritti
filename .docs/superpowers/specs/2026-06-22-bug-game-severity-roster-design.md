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
4. Adding a **System Health** bar with a real lose condition: living bugs drain
   health, squashes restore it (more for higher severity), and letting health
   fall into the red ends the run (but still reveals the site).

Software-bug puns stay — they're the point of a QA portfolio. Severity makes the
naming richer (Cosmetic "Typo" vs Critical "Memory Leak").

## Non-goals

- No combo/multiplier scoring (just summed points).
- No art-asset pipeline — everything is drawn on the existing `<canvas>`.
- "Powers" are the disruption behaviours that already exist (teleport, flicker,
  grow, extra HP) — no brand-new bug abilities beyond those plus the health drain.
- Losing never traps the visitor: a lost run still reveals the portfolio (the same
  exit as the voluntary kill switch). The site is always reachable.

## Severity model

Severity is the one knob. Each tier sets HP, size, palette, behaviour intensity,
points, and spawn frequency. Lower severities are common; higher are rare.

| Sev | Label | HP | Look / behaviour | Points | Drain/s | Restore | Spawn |
|-----|-------|----|------------------|--------|---------|---------|-------|
| 4 | Cosmetic | 1 | tiny, pale; wanders, **stops to stare & taunt** | +1 | 0.5 | +2 | common |
| 3 | Minor | 1 | small; mildly evasive | +2 | 1 | +3 | common |
| 2 | Major | 2 | medium, saturated; disruptive (fast / flickers) | +5 | 2 | +6 | uncommon |
| 1 | Critical | 3 | large, angry red, armoured/leggy; teleport / grows | +10 | 3.5 | +12 | rare |
| 0 | Blocker | 5 | biggest; the boss — combines powers | +25 | 6 | +25 | very rare |

*Points* = score awarded. *Drain/s* = health each living bug subtracts per second.
*Restore* = health regained when squashed. All values are tunable starting points.

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
};
```

`hp`/`sizeMul`/`points` follow from severity but stay explicit per type so a
designer can nudge a single bug without touching the tier. The `TYPES` array is
rewritten to the roster above. All bugs can taunt (see Taunts & flavor), so no
per-type flag is needed.

Health drain/restore are derived from severity via small maps, not per-type
fields:

```ts
const HEALTH_DRAIN   = { 4: 0.5, 3: 1, 2: 2, 1: 3.5, 0: 6 }; // per second, per bug
const HEALTH_RESTORE = { 4: 2,   3: 3, 2: 6, 1: 12,  0: 25 }; // on squash
```

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

## Taunts & flavor

Any bug can occasionally (low per-second chance, per-bug cooldown) **pause, turn
to face the cursor, and float a line**; the same line shows on squash. Cheap to
do: a per-bug `tauntAt` timestamp + a brief velocity freeze, no new systems.

The lines are deadpan artifacts of a culture that never prioritised these bugs —
not the bug mocking the player, but the bug explaining why it's still alive.

**All severities** draw from the culture pool:

- "I am here because a deadline had higher priority."
- "Marked 'won't fix' three sprints ago."
- "Still P3. Always P3."
- "Closed as 'works on my machine.'"
- "Filed under 'known issues.'"
- "Triaged to 'later.' Later never came."
- "Nobody owns this module."
- "Repro steps: 'sometimes.'"
- "Cut from scope, not from the build."
- "There's a // TODO with my name on it."
- "I survived two reorgs."
- "Acceptance criteria were aspirational."

**Major / Critical / Blocker** also draw from an evasive/threat pool:

- "Catch me if you can."
- "I hide in the darkness of checkout."
- "I live in the auth flow."
- "I've been in production since launch."
- "You'll never find my repro."
- "Roll back — I'll wait."
- "I scale with your traffic."

Feature names stay generic ("checkout", "auth", …) — not Hiren's project names.
Both line lists above are final.

## System health (lose condition)

A **"System health"** bar sits in the game HUD near the score. It starts at **100**
and its fill colour interpolates continuously **green → yellow → red** as it falls
(green near 100, yellow around 55, fully red by ~40).

- **Drain:** during active play, every living bug subtracts its severity's
  `Drain/s` from health each second (summed across all bugs). A crowded board — or
  a lone Blocker — visibly eats the bar.
- **Restore:** squashing a bug adds its severity's `Restore`, capped at 100.
  Clearing the tough ones is how you recover.
- **Lose:** when health drops **below 35**, the run is lost — the bar pins red and
  flashes, a brief **"SYSTEM DOWN — the bugs won"** beat plays, then the portfolio
  is revealed via the existing `game:cleared` → scatter → reveal path. The visitor
  is never blocked from the site.

Drain only runs during active play (not during the opening prompt, not after
scatter/loss). Thresholds and rates are tunable constants.

This is the first mechanic that can be *failed*. The voluntary kill switch still
appears after a few squashes as the "I'm done" exit, so there are two ways out —
**win by bailing** or **lose by neglect** — both leading to the site.

## Files touched

- `apps/hiren/src/components/BugGame.astro` — the whole change lives here: type
  defs, `TYPES`, the six shape routines + `drawBug` dispatch, weighted spawn,
  score/points, taunt behaviour, `+N` toast, the **"System health" bar** (HUD
  markup + CSS + the drain/restore loop + lose sequence). The intro copy comment
  at the top and any flavor text referencing specific old types gets a light pass.

No other files change (the launch button, localStorage gating, and photos work
are untouched).

## Verification

- `npm run build` passes.
- Manual: clear `localStorage["hiren:played"]`, load, and confirm — distinct
  silhouettes per tier; bugs taunt with culture lines (high-sev with evasive
  ones); higher-severity bugs take more hits and award more points (`+N` floats,
  score sums); a Blocker appears rarely and is clearly the boss; the health bar
  drains while bugs live, restores on squash (more for higher severity), shifts
  green→yellow→red, and dropping below 35 plays the "SYSTEM DOWN" beat then
  reveals the site; the kill switch still reveals the site; reduced-motion still
  shows no game.

## Out of scope / future

- Per-name unique silhouettes (currently shared within a tier/shape).
- Combo multipliers, leaderboards, sound-per-severity.
- A persisted high score or win screen.
