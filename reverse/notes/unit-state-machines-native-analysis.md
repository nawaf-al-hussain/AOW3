# Unit State Machines — native analysis (Phase 3)

Source: `reverse/dump.cs` (6.9.18, sha256 0050e67d…). The battle simulation is
server-authoritative in the original; the client carries the sim **state fields**
for prediction/replay but **no sim method bodies**. Reconstruction below is
therefore *structure-level* (fields, constants, prototypes are CONFIRMED);
transition *numbers* stay gameplay-tuned unless a constant is named here.

## 1. Unit-level state fields (class `Unit` — dump.cs 393220)

| Native field | Type | Meaning (recovered) | Clone mapping (Phase 3) |
|---|---|---|---|
| `task` 0x6A | sbyte | order layer: `TASK_WAIT=0, TASK_PATROL=1, TASK_MINE_LAYING=2, TASK_IMPLOSION=3, TASK_MINE_DETECTING=4, TASK_HERO_ABILITY_ACTIVE=5, TASK_LOADING=6` | `u.order.kind` (idle/move/attackMove/capture) |
| `state` 0x6B | sbyte | stat-state index (which `UnitStateType` prototype is active) + life cycle | `u.state` ("alive"/"dying") + `sim.corpses` |
| `think` 0x9D | sbyte | combat-engage layer | target presence + `u.lastTargetId` (aim reset on switch) |
| `orient` 0xB4 / `orient_dest` 0xB6 | short | hull facing / desired facing — **rotation is gradual**, driven at `UnitStateType.rotate` | `u.facing` / `u.orientDest` at `u.rotate` rad/s |
| `flag_shoot` 0xA0 | sbyte | release-to-fire flag (facing/aim satisfied) | fire gate: `facingOk && aimT<=0` |
| `obj` 0x88 / `obj_id` | Dynamic | current combat target | `u.targetId` |
| `objPreferred` 0x90 | Dynamic | command-attack target — sticky until dead | `u.preferredId` |
| `obj_close` 0x9C | bool | target in strike range | in-range branch |
| `walk_state` 0xE4 + `walk_state_tick` | sbyte/int | walk anim/state machine | render-side (unchanged) |
| `wait_for_moving` 0xB9, `forced` 0xB8 | sbyte | slot/wait micro-management (server) | not reconstructed (note only) |
| `idled` 0xF4, `last_action_tick` 0xF0 | bool/int | idle bookkeeping → **units return to guard position after a chase** | `u.guard` return-to-post |
| `die_tick` 0x188 | int | death timestamp; `UnitStateType.die_time` = death duration | `sim.corpses[i].dieT` |
| `StopOnEnemyNearby` | bool | some units (siege/artillery) halt when enemies come close | not in current roster; reserved via `def.stopOnEnemyNearby` |
| `undergo` 0x7C, `calcUndergoByState(st, occ)` | | damage taken per (weapon category, occupation) | existing armor table |
| `WARNED_BY_NEARBY_FRIENDS = 1` (UnitStateType const) | | when a unit is struck, nearby idle allies are **warned** and join the fight | aggro propagation in `applyHit` |

## 2. Stat-state prototype (`UnitStateType` — dump.cs 394983)

`rotate` 0x5A (hull turn rate), `aiming` 0x61 (aim time), `sight` 0x4C /
`sight_curr`, `approach` 0x48, `speed`/`speed_init`, `accelerate`,
`die_time` 0x90, `damage_priority[]` 0x40, `armor`/`armor_type`, `weapons[]`.
→ `UnitStateType` is the *stat-state* of a unit (normal/siege/…), not the
behavior FSM; the behavior FSM = task + think + orient + weapon rounds.

## 3. Weapon fire cycle (`WeaponType` — dump.cs 396871; runtime `Weapon` — 396730)

Round structure (all CONFIRMED field names):

- `aiming` 0x8B (+`air_aiming`) — fire-solution time on a new target.
- `shot_start` 0x60 — windup before first shell.
- `shot_count` 0x6A, `shot_int` 0x64, `shot_tick[]` 0x70 — burst shells and
  their tick offsets inside one round (`FIRE_TICK_LENGTH = 4`).
- `round_len` 0x66 — full round length (= clone `cooldown`).
- `distance` 0x4C / `distance_min` 0x58 — max/min range (min range: artillery
  cannot fire point-blank). Clone has no min-range data yet — reserved.
- `rotate_diap`/`rotate_speed` 0x86/0x88 — turret slew (render-side turret
  smoothing already present; sim gate uses hull arc for now).
- `priority` 0x8D + `damage_priority[]` 0x40 — target-selection weight
  (prefer targets the weapon is strong against). Clone maps this to
  damage-vs-target-armorClass / target-health weighting in `findTarget`.
- `accuracy_static`/`accuracy_dynamic`/`accuracy_walk` — already reconstructed
  (Phase: accuracy, v=13). `walking_shot` 0x8A — fire on the move (v=13).

Runtime `Weapon` instance = per-weapon mini-FSM: `orient`/`orient_dest` (turret),
`tick` (position in round), `ready_to_shoot`, `state`, `index` (burst shell
index), `roundLenAdd`. Each weapon carries its own `obj` — multi-weapon units
(hero Cerber blades/gun) track targets per weapon.

## 4. Clone mapping (Phase 3, v=18)

New sim fields on spawn: `state, orientDest, rotate, aimT, burstLeft, burstT,
lastTargetId, preferredId, guard, dieT`. Kind defaults (rotate/aimTime/fireArc/
dieTime) in `FSM_DEFAULTS` — per-def overrides via `def.rotate/aimTime/dieTime`
(promote to `docs/data/units.js` in a later data pass).

Behaviors reconstructed:

1. **Rotate**: hull turns toward `orientDest` at `rotate` rad/s; firing requires
   `|angle(facing→target)| <= fireArc` (native `flag_shoot` gating).
2. **Aim**: acquiring a *new* target resets `aimT = aimTime`; fire only at 0.
3. **Burst**: `shotCount/shotInt` structure (single-shot for all current
   weapons → behavior-neutral; structure ready for native burst data).
4. **Acquire**: idle/attack-move acquire in radius (range+2.5, tuned; native
   `sight` noted) weighted by `damageVs/health` (native `damage_priority`),
   air bias kept.
5. **Retaliate + warn**: struck unit (idle/attack-move, unarmed-ordered)
   targets its attacker; idle allies within the victim's view join
   (`WARNED_BY_NEARBY_FRIENDS`).
6. **Guard return**: idle units remember their post and walk back after the
   fight (`idled`/`last_action_tick` semantics).
7. **Stop**: `sim.commandStop` (task → wait), hotkey `S` (full command UI is
   Phase 4).
8. **Die**: death is an explicit state (`state="dying"`, `die_time`-driven
   `sim.corpses` bookkeeping); render dying pipeline unchanged.

Not reconstructed (server-side, no client evidence): path slot micro-management
(`wait_for_moving`, `forced`, `walk_dx/dy` cross tiles), mine/implosion task
internals, psionic catch. Backlog for the multiplayer/wasm stages.
