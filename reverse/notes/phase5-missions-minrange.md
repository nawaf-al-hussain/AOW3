# Phase 5 — missions & minimum range + Phase D replay harness (v=23) + stances: defend/bombard/dontshoot/takepos (v=28) + acts siege/hide/reset-speed (v=30)

Native anchors (dump.cs 6.9.18, sha256 0050e67d…):

## Weapon minimum range
- `WEAPON_DISTANCE_MIN = "distance_min"` (dump.cs:17303) — stat key string constant.
- `WeaponTypeMapEditorConfig` (dump.cs:256556): `m_distance // 0x28` immediately
  followed by `m_distanceMin // 0x2C` — minimum range is a first-class weapon field
  beside max range. Also present in `reverse/evidence/data-model/weapon-schema.json`.
- Reconstruction: `minRange` on the named weapon configs (data module), value
  gameplay-tuned (native balance is backend-delivered, not in APK):
  - `w_typhoon` (MLRS): range 15, minRange 5 (~1/3)
  - `w_fortress` (siege walker): range 14, minRange 4 (~2/7)
- Sim gates (all inside the sim kernel):
  - `findTarget`: targets with `d < minRange` are not acquirable (no dead-zone lock).
  - engaged-unit branch: `d < minRange` -> dead-zone hold (path cleared, hull turns
    to the target, NO release). Artillery vulnerability is preserved — screen with
    escorts, exactly the native tactical role.
  - burst shells (`shot_tick[]` offsets) re-check the window.
  - building target: acquisition + release use `d ± building radius` symmetric with
    the unit gate (`d >= minRange + b.radius`).
  - `walkingShot` opportunity fire re-checks the window (both call sites).

## Patrol mission
- `ClientUnitTaskType` (dump.cs:271209): Undefined=-1, None=0, **Patrol=1**, Defend=2,
  HoldPosition=3, Hide=4, Bombard=5, Mining=6, Demining=7, DontShoot=8,
  LoadOnTransport=9, UnloadFromTransport=10, Berserk=11.
- Voice evidence: ItemInfPatrol=10 / ItemVehPatrol=66 / ItemNavPatrol=113 /
  ItemAviaPatrol=150 / per-hero patrol voices (AudioFile.BattleVoice) — patrol is a
  full first-class order in the native game.
- Reconstruction: `commandPatrol(ids, x, y)` — anchor A = issue position, far point B
  = clicked tile; `order = {kind:"patrol", x, y, ax, ay, back}`. Route legs flip at
  arrival (and mid-leg repaths use the CURRENT leg target, not always B). Patrol has
  attackMove semantics: acquisition allowed (`updateTargeting` + building-target
  branch), aggro warn-joins include patrollers. P arms the order (next right-click /
  minimap right-click issues it); Escape disarms.
- Not reconstructed (documented): native Defend/Bombard task nuances —
  resolved below (v=28).
- Erratum (v=28): the v=25 note claimed `Stop = 2^30` is excluded from the
  `All` mask `0x5FFFFFFF`. Bit arithmetic says otherwise: `0x5FFFFFFF` has bit
  30 SET (bits 0–28 + bit 30; bits 29/31 unassigned are the excluded ones),
  so Stop IS a member of `All`. The stop-is-one-shot / hold-is-a-stance
  semantics stand unchanged on the button-structure evidence below.

## Garrison mission
- `ClientBuildingTypeEditor.Bunker = 14` (dump.cs:266093); `BU_CATEGORY_BUNKER = 3`,
  `BU_TYPE_BUNKER = 14` (dump.cs:378204/378219).
- `ClientBunkerWeapon : AbstractClientWeapon` (dump.cs:275667) with
  `ClientWeaponMuzzleGroup[]` — the bunker's weapon is a distinct crew-served weapon.
- Reconstruction:
  - `commandGarrison(ids, buildingId)`: infantry only (`def.kind === "infantry"`),
    friendly + built bunker, capacity `GARRISON_CAP = 3` (tuned; no native constant
    recovered). Order `{kind:"garrison", depotId}` reuses the serialized depotId slot.
  - Entering (dist <= radius + 1.1) sets `u.garrison = bunkerId`: inert (skipped in
    `updateUnits`), untargetable (`findTarget`/target validation/preferred drop),
    no vision contribution, hidden in the renderer (`syncUnits` visibility gate),
    excluded from box/click selection.
  - Crew-served fire: the bunker's own weapon (`w_bld_bunker`) fires ONLY while
    `crew > 0` (empty bunker = silent).
  - Exits: `commandUngarrison` (V key when selected units are inside; otherwise V
    stays the hero land/depart ability), move/attack/capture/patrol on a garrisoned
    unit auto-unload first (native `UnloadFromTransport = 10` analog), and bunker
    death scrambles the surviving crew to free adjacent tiles (`freeTileNear`).

## Determinism & replay
- `stateString()` U-line extended with `garrison`, `order.ax/ay/back` — all
  behavior-affecting state stays inside the hash.
- `sim.cmdSeq`: global issue counter shared by every Commands issuer; journals sort
  by (tick, seq) so cross-issuer order is reproduced exactly.
- `Commands.full`: uncapped journal beside the 512-entry debug ring (replay record).
- `Replay` class (kernel): `capture(sim, issuers)` -> `{v, seed, tickRate, terrain,
  commands[], hashes[], finalHash, finalTick}`; terrain fingerprint = FNV-1a over a
  position-mixed sampling of a FRESH constructor sim's occupancy grid (the
  capture-time grid would embed player-built structures — replay compares against
  the constructor baseline). `play(rec, {untilTick})` rebuilds from seed, applies
  commands at recorded tick boundaries, verifies the 1 Hz hash journal + final hash.
- Native analog: `AICommandLogWriter/Reader` (command journal) + `CRCRequest/Verify/
  SyncTest` (state-hash desync detection).
- Live probe: `window.__aow3Replay.capture()/save()/run(rec)`; `Replay` also exposed
  on `window.__aow3()`.

## Hold position
- `ClientUnitTaskType.HoldPosition = 3` (dump.cs:271217) — and, more telling,
  `ClientUnitStateSpecType.HoldPosition = 65536` (dump.cs:271185): hold is a
  persistent STATE spec (a member of the `All` mask `0x5FFFFFFF`), unlike
  `Stop = 1073741824` (2^30) which is excluded from `All` — stop is a one-shot
  command, hold is a stance you stay in.
- Instant, non-targeting entry: `GUIBattleActionUnitSpecHoldPosition :
  MonoBehaviour, IKeyboardHotkeyButton` (dump.cs:309542) is a plain button, NOT
  an `AbstractGUIBattleActionUnitSpecTargeting` subclass (compare
  `...UnitSpecLoadOnTransport`); `SendSelectedUnitsHoldPosition()` takes no cell
  (dump.cs:337757) while every targeting order (patrol/bombard/mine) does.
- Sim entry: `AICommUnitsHoldPosition : AIComm` (dump.cs:433481) carries `int[]`
  unit ids and executes against `Battle` — first-class deterministic command,
  parallel to patrol. AI can issue it; the player hotkey bar has
  `HotkeyAction.UnitSpecHoldPosition = 24` (dump.cs:255733) between ForceAttack
  = 23 and TakePosition = 25.
- Full command surface around it: `VoiceType.HoldPosition = 32` sits between
  StopAction = 31 and Patrol = 33 (dump.cs:83230); per-chassis ack voices
  ItemInf = 9 / Veh = 67 / Nav = 114 / AviaAttackHoldPosition = 152 + all 12
  heroes (dump.cs:81502–82094); selection aggregate
  `EntitySelectionHelper.isSelectAllHoldPosition` (dump.cs:254040); task HUD icon
  `m_taskHoldPositionSpriteName` in `GUIBattleUnitContextMenuUpdater`
  (dump.cs:322939); usage counter `UIBattleStatistics.HoldPositionCount /
  IncrementHoldPositionCount` (dump.cs:252817/253119); tutorial condition
  `ClientGAITFCUnitStateSpecType.HoldPosition = 9` (dump.cs:311609).
- Reconstruction (v=25): `commandHold(ids)` — order `{kind:"hold"}` with NO
  x/y (the movement branch keys on order.x/y and must stay dormant); guard
  anchored at the hold spot; path/dest cleared; instant float ack.
  - Engage in place: acquisition gate (`updateTargeting`), building gate and
    warn-join all accept hold; the FSM stand branches fire only inside the
    weapon window [minRange, range] and otherwise clear path + track the hull
    toward the target — never `moveToward`. Melee strikes still land in
    contact; burst shells re-check the window via the existing shot gates.
  - Release: any move/attackMove/patrol/attack/capture/garrison command, or
    stop (which reverts to the idle default that chases again).
  - garrisoned units reject hold (already inert inside the bunker).
  - Invariant extended: findTarget refuses dead-zone targets; aggro now
    refuses them too (`minRange` check in `joins()`), so a minRange unit under
    fire from inside its dead zone cannot lock an unfireable obj and starve
    every valid target. Explicit commandAttack stays sticky (native
    objPreferred is a player order).
- Not reconstructed (documented): native Defend/Bombard task nuances
  (Bombard = targeted shelling order; Defend = default-stance variant),
  DontShoot/TakePositions, and aircraft-hold orbit specifics
  (ItemAviaAttackHoldPosition suggests attack-from-orbit; the tribute holds
  aircraft hovering in place) — ALL resolved below (v=28).

## Defend / Bombard / DontShoot / TakePositions / aircraft-hold (v=28)

The remaining documented Phase 5 unknowns, closed against dump.cs 6.9.18
(sha256 0050e67d…) + native disassembly (`reverse/evidence/combat/
specmode-native.txt`, tool `reverse/tools/specmode_native_analysis.py`).

### The stance dispatch: one sim command, one act byte
- `GAICommandSpecMode : GAICommand` (dump.cs:410916, namespace
  `com.geargames.aow.entities.gai.gaicomm`) — the sim-side spec-mode command:
  `ACT_STOP = 0, ACT_HOLD = 1, ACT_SIEGE_TO = 2, ACT_SIEGE_FROM = 3,
  ACT_HIDE = 4, ACT_DEFEND = 5, ACT_RESET_SPEED = 6, ACT_DONT_SHOOT = 7`
  (field `act // 0x30`, sbyte). Stop/hold/hide/defend/dont-shoot are ONE
  command family dispatched by the act byte; `execute(Battle)` RVA 0x45F61E0,
  `verifyVariables(Battle)` 0x45F6158.
- Native shape of `execute()` (disassembly): null-checks the Battle, iterates
  the command's unit list, loads `act` at [this+0x30], and switches; the
  ACT_DEFEND (5) arm has a DEDICATED gate — a Battle virtual is called and
  AND-ed with `act == 5` before the defend path (0x45F6358–0x45F6384), i.e.
  defend executes through an extra battle-level check the other acts do not.
- Server mirrors: `UnitTaskType` consts {NONE=0, PATROL=1, DEFEND=2,
  HOLD_POSITION=3, HIDE=4, BOMBARD=5, MINE=6, DEMINE=7, DONT_SHOOT=8,
  LOADING=9, UNLOADING=10, BERSERK=11} (dump.cs:395395) — identical to
  `ClientUnitTaskType` (271209); `UnitStateSpecType` SPEC_* consts identical
  to `ClientUnitStateSpecType` (394943 vs 271164). Stances are task AND spec.
- Network surface: only Bombard / HoldPosition / LoadTransport / Move /
  PatrolTargeting / Psionic / **Spec** / Stop / UnloadTransport have
  AICommUnits*ST serializer pairs (dump.cs:341228–341432). There is NO
  AICommUnitsDefend/DontShoot/TakePositions — those orders ride the generic
  `AICommUnitsSpec` {int[] unitIds, int specValue} (433780).
- Voices: `VoiceType` has NO Defend/DontShoot/TakePositions entries — stance
  acks are the generic `ToSpecMode = 101` / `FromSpecMode = 102` (dump.cs:83222),
  unlike Move(43)/Patrol(33)/HoldPosition(32) which have per-chassis voices.

### Defend (task 2 / spec 1024 / ACT 5)
- Instant, no target point: `SendUnitsDefend(IList<ClientUnit> units)` /
  `SendSelectedUnitsDefend()` take no cell (dump.cs:337730/337733); hotkey
  `HotkeyAction.UnitSpecDefend = 33` (255741); tutorial condition
  `ClientGAITFCUnitStateSpecType.Defend = 1` (311597) — taught first.
- Position anchor: sim `Unit` carries a SECOND patrol route
  `patrol_defend // 0x158` beside `patrol // 0x150` (dump.cs:393336/393338) —
  defend is anchored, not free-floating.
- Reconstruction (`commandDefend`, v=28): order `{kind:"defend"}` + anchor at
  the issue spot; acquisition + fire in the weapon window (idle-like);
  pursuit TETHERED — chase only while unit and target stay within
  `DEFEND_TETHER = 4` of the anchor, else break off and re-anchor (the anchor
  persists). A target pulled beyond leash + 2-tile grace drops its lock
  (same starvation class the v=25 dead-zone invariant removed). Tether value
  gameplay-tuned (no native constant recoverable — server-delivered).

### Bombard (task 5 / spec 4) — targeted point shelling
- `SendUnitsBombard(IList<ClientUnit> units, Point2i point)` (dump.cs:337736)
  → `AICommUnitsBombard` {int[] ids, short x, short y} (433431) — a POINT
  order. Per-weapon predicate `WeaponType.canBombard()` (VA 0x45B6268;
  shell-type semantics — `canBombard = type & 1`, weapon-type note §3.1);
  client filters the selection (`GetBombardUnitsOnly`, 81118) and shows an
  area-radius cursor (`UnitBombardRadius`, 283999; BombardTap/Line, 257350).
  Sim-side denial log literal: "GetBombardWeaponType::Unit does not have
  bombard weapon (unitId=…" (stringliteral).
- Reconstruction (`commandBombard`, v=28): only artillery-family weapons
  accept — mapped as `minRange > 0` (the native distance_min signature:
  typhoon/fortress); shells land at the POINT blind (no target lock; the
  splash projectile branch is already a point-impact model); the unit keeps
  the [minRange, range] band around the point (no retreat below minRange —
  documented choice); release by any other order. Point-denial DURATION
  (native `task_until_tick` 0x104?) unresolved — tribute shells until
  released.

### DontShoot / CanShoot (task 8 / specs 1048576 | 2097152) — fire discipline
- Paired state specs `DontShoot = 1048576` / `CanShoot = 2097152`
  (dump.cs:271188/271189), task 8 (271222), `ACT_DONT_SHOOT = 7` (410916),
  hotkeys `UnitSpecDontShoot = 26` / `UnitSpecCanShoot = 32` (255734/255740),
  tutorial condition 12 (311609).
- Reconstruction (`commandDontShoot`/`commandCanShoot`, v=28): `u.fireHold`
  flag — units still acquire/track/aim but every fire path is gated
  (`shoot`/`fireShell` incl. burst releases/`meleeStrike`/`shootBuilding`);
  explicit commandAttack does NOT bypass it. Spec-pair toggle model (sticky
  until CanShoot); whether the native TASK form is exclusive with later
  orders remains unresolved (task 8 vs spec bit duality).

### TakePositions (spec 4194304) — per-unit placement
- Targeting layout `GUIBattleLayoutUnitTakePositions` (dump.cs:304597) whose
  serialized tooltip reads (RU) "layout deactivation delay after ALL units
  are placed"; `ShowString(int unitsCount)` (304640s) counts the remaining
  units down; cursor markers `PointTakePosition`/`...Invalid` (257345/257346)
  + `PointTakePositionAction` with a finish-delay coroutine (254946); sim
  state `Unit.TakePosition : Coordinate` (393544); hotkey
  `UnitSpecTakePosition = 25` (255733). NOT a instant stance — a placement
  flow.
- Reconstruction (`commandTakePositions(ids, spots)`, v=28): each unit walks
  to ITS assigned spot (per-index; extra units ring around the last spot)
  and on arrival converts to hold semantics at the taken position (window
  fire, no chase). Client T-key arms a placement mode where each right-click
  assigns the next spot and the command issues when all selected units are
  placed (mirrors the native count-down layout).

### Aircraft-hold orbit (was: "aircraft hover in place")
- `AudioFile.BattleVoice.ItemAviaAttackHoldPosition = 152` (dump.cs:81645)
  reads as attack-from-orbit; the air frame carries `flight_radius`
  (`UnitStateType // 0x7C`) and occupations split AIR_HELICOPTER(1) /
  AIR_FIGHTER(3) / AIR_BOMBER(4) (`Unit.OCCUPATION_*`, 393220 region);
  `SPEC_FIGHTERS_GUARD = 16384` + `SendSelectedUnitFightersGuard()` (dump.cs:337766,
  instant) are the fighter-side cousin.
- Reconstruction (v=28, VISUAL ONLY): held/defending airborne units circle
  their anchor in the renderer (slow orbit, per-unit phase). Sim state and
  the replay hash are untouched — the sim holds aircraft stationary, which
  remains an approximation (orbit kinematics + attack passes UNRESOLVED).

### Acts siege/hide/reset-speed + bombard duration + defend anchor (v=30 native pass)

Native method: full decode of `GAICommandSpecMode.execute(Battle)` arms (VA 0x45F61E0;
evidence `reverse/evidence/combat/phase5-adjacent-native.txt`, tools
`reverse/tools/phase5_adjacent_native_analysis.py` + `field_access_scan.py`); Unit
vtable calls resolved by call-shape + dataflow (the dump.cs Slot annotations do not
map 1:1 onto the runtime vtable in the 249-256 region — get_X/get_Y sit two slots
earlier than annotated; every used slot was verified by disassembling the method body
or by its call-shape, e.g. get_Task at [klass+0x1008] is confirmed inside $Hi where the
byte result is compared against the task argument).

- **ACT_SIEGE_TO / ACT_SIEGE_FROM (2/3)** — one arm for both: `specBit = (act==2 ?
  ToSiege 16 : FromSiege 32)`; mask = `specBit | (act==2 ? ToShield|ToFog :
  FromShield|FromFog)` (0x140 = 64|256, 0x280 = 128|512); the arm requires
  `(unitType.specs & mask) != 0` — i.e. the command applies WHICHEVER transform the
  type supports (siege/shield/fog — the Seraphim/Kodomash/Beholder family), not a
  siege-only toggle. Chassis byte check via the type's interface (23 -> proceed,
  else 22 -> w24, else alternate path); flag 32 added; target dropped (set_Obj(null)),
  `forced` cleared, position/fog helper `$Gi`, `caravan` set true, task cleared to 0
  (transform is a STATE, not a task), chassis-22/23 units get a final `$Yh(Battle,
  Unit, int)` call. Client surface: `ClientUnitStateSpecType.ToSiege/FromSiege = 16/32`
  (271176/271177), `Unit.SIEGE_STAGE_*` consts {SEIZE_FIRE=0, ROTATE_WEAPONS=1,
  TRANSFORM=2} + `siege_stage/siegeTick/siegeAfterWalkTick/siege_blocked` fields
  (393225 region), `SeraphimTurbo/SeraphimSiege/TypeAutoSiege/StateAutoSiege`
  properties. NOT reconstructed in the tribute (no transform units modeled; the
  Seraphim land/depart ability already covers its transform).
- **ACT_HIDE (4)** — capability = type-spec bit 17 (Hide 131072); skip if
  `get_Task() == 4`; clear `forced`; `$he(Battle, Unit, -1)` notify; drop target;
  fog/position sync; `caravan` true; `$ki`/`$ji` cleanup; `$Hi(Battle, Unit, 4)` = set
  task Hide. A TARGETED order (`GUIBattleActionUnitSpecHide :
  AbstractGUIBattleActionUnitSpecTargeting` 309519, hotkey `UnitSpecHide = 39`
  255747, task icon 322941, "enemy spotted while hidden" voice
  `ItemInfEnemySpottedSpecHide = 35` 81528). Visibility consts
  `VISIBLE_HIDDEN = 1` / `VISIBLE_DETECTED = 3` (393226).
- **ACT_RESET_SPEED (6)** — a single helper `$ii(Battle, Unit, true)` (0x47F1DFC)
  switching on the game-mode static then normalizing speed — the cancellation arm of
  the SameSpeed march (`SameSpeed {sbyte speed, Coordinate coord}` 390948 stored at
  `Unit.sameSpeed // 0x260`; `ClientUnitStateSpecType.SameSpeed = 8388608` 271191;
  hotkey `UnitSpecSameSpeed = 49` 255757; `UnitSpeedMoveStyle.SameSpeed = 1` 337636;
  own ST serializer pair 368192/368207; group-gate `IsSelectedGroopCanMoveWithSameSpeed`
  253820). The SameSpeed SET order + per-tick coordinator (`Battle.$HL`, 40
  sameSpeed reads) were the last document-only piece — RECONSTRUCTED v=33:
  `commandSameSpeed(ids, x, y)` (group cap = slowest member's speed, each member
  stores `u.sameSpeed`, `followPath` applies `min(own, cap)`; cancel on any other
  order / stop / arrival = the ACT_RESET_SPEED arm; M key arms, hotkey analog 49;
  "samespeed" rides LOCKSTEP_NET_TYPES; U-line ss field hash-covered).
- **Bombard duration** — `AICommUnitsBombard.$CMA` (0x4906390) is a 37-state jump-table
  machine: it computes the shell POINT with an LCG-scatter around the ordered
  coordinates (constants 0x852906a7 / 0x9fe0597f), repositions via `$Gi`, and drives
  the unit across ticks — there is NO single duration constant; `task_until_tick`
  (Unit field 0x104) is written at only 6 call sites, 5 of them in
  `BattleAct.$uA(Battle, PvPBattleResults, ...)` (battle-finish freeze), NOT by the
  bombard executor. The tribute's "shell until released" model is consistent with the
  native structure (duration = task lifetime, terminated by the next order).
- **Defend anchor CONFIRMED natively** — the execute() act-5 arm allocates a
  `PatrolRoute` (ctor 0x459F740), adds ONE `Coordinate(unit.x*100, unit.y*100)`
  (Coordinate ctor 0x4593100, the x100 tile->pixel scale), and stores it via
  `set_PatrolDefend` (vtable pair [klass+0xD38]) — the v=28 `commandDefend` anchor +
  `patrol_defend // 0x158` reading is exact. The chase/leash logic lives in
  `UnitAct.$Pg(Battle, Unit)` (0x483C244, ~44 KB, 99 route-touching sites) and
  `UnitAct.$sH` (0x47F3F10); the leash VALUE is not a compile-time literal (server
  balance) — the tuned `DEFEND_TETHER = 4` stands, now with the mechanism proven.
  The act-5 battle gate = `battle.$gm()` (vtable [0x508]) reading a flags int at
  [Battle+0x80] AND-ed with act==5 — a battle-mode permission check.

### Hide reconstruction (v=30, tribute)

`commandHide(ids, x, y)` — infantry-only (per-type spec-mask analog), TARGETED order
(G key arms, right-click picks the ambush spot; hotkey analog UnitSpecHide = 39):
walk to the spot, then `u.hiding = true` anchored. Hidden units: untargetable beyond
`HIDE_DETECT = 2.5` (VISIBLE_HIDDEN -> VISIBLE_DETECTED transition; detect radius
server-side, tuned), still acquire and fire from cover; FIRING REVEALS
(`shoot`/`fireShell`/`meleeStrike`/`shootBuilding` clear hiding — the flag_shoot
analog); any non-hide order or stop releases; no aggro-join while hiding; state
covered by the U-line hash (hiding bit before fireHold). `Commands` type "hide" rides
LOCKSTEP_NET_TYPES. Tests: phase5.test.js 128 -> 146 vectors (capability gate,
walk+entry, detect gate far/near, fire-from-cover reveal, move/stop release, re-hide,
determinism + hash coverage).

### Feature-sized builds from the extracted data (v=32..34)

- **Stat tier caps (v=32)** — the §7 72-entry table ported VERBATIM into the sim
  kernel (`AOW3_MAX_STAT_TIERS` + `maxStatCap`/`maxStatGet`, the
  `IMaxStatValueProvider.Get` analog with the rank-tier fallback chain;
  unregistered 0/60/66/70 pass through). Consumer = the native display domain
  (caps are UI stat-panel progress-bar maxima): the selection panel renders a
  CAP BASE/FIRST/MEGA bar normalizing weapon damage to the tier cap.
  Tests: `stat-caps.test.js` 37 vectors.
- **SameSpeed march (v=33)** — see the ACT_RESET_SPEED bullet above.
- **Multi-point patrol (v=34)** — native `PatrolRoute.points : List<Coordinate>`
  (dump.cs:386963; `SendSelectedUnitsPatrolTargeting(List<Vector3>)` 337727):
  `commandPatrol(ids, x, y, pts)` walks a CYCLIC route (per-unit ring-spread on
  every leg, `order.pts`/`leg` hashed via rt/lg tokens; legacy two-leg flip
  preserved verbatim for no-pts calls; shift+right-click stages waypoints).

### Remaining unknowns (documented, after v=34)

- Defend leash VALUE and the full `$Pg` chase micro-logic (44 KB state machine; the
  anchor mechanism + task flow are proven, the numeric leash is server-side).
- Native TakePositions formation algorithm (how the sim distributes per-unit
  Coordinates when the player places a group).
- Siege transform stage timings (SIEGE_STAGE_* progression inside the Unit tick) and
  the chassis-byte identities (22/23/31 via the UnitType interface).
- DontShoot task-vs-spec exclusivity nuance (sticky toggle vs task replacement).

## Coverage
- `reverse/evidence/tests/phase5.test.js` — 176 vectors (min-range gates, patrol
  oscillation/engagement/resume/journal, garrison enter/protect/crew-fire/exit/
  capacity/death/rejections, hold stance entry/window-fire/no-pursuit/
  retaliation/minRange-aggro/building/melee/warn-join/interplay/release,
  defend anchor/engage/tether/break-off/lock-drop/re-anchor/release,
  bombard filter/point-shells/area-damage/band/dead-zone/release,
  fire-discipline track/no-fire/restore/melee+building gating,
  takepos per-unit spots/arrival-hold/no-pursuit, hide capability/walk-entry/
  detect-gate/fire-reveal/release/determinism, cross-feature determinism incl.
  fireHold + hiding + sameSpeed in the hash, samespeed cap/control/release/
  command-surface/determinism, multipoint-patrol route-shape/cyclic-legs/
  legacy-compat/pts-gate/determinism).
- `reverse/evidence/tests/replay.test.js` — 45 vectors (bit-exact reproduction,
  baseline, cross-issuer ordering, tamper detection seed/drop/alter/terrain,
  540-command journal vs 512 ring, live-shaped build+patrol+garrison run, JSON
  round-trip; v=26 boundary flush).
- Native: `reverse/evidence/combat/specmode-native.txt` (annotated ARM64
  disassembly of GAICommandSpecMode.execute/verifyVariables/ToString,
  AICommUnitsSpec/Bombard/HoldPosition executors, WeaponType.canBombard,
  Unit stance accessors; sha256 8ace05bb…), tool
  `reverse/tools/specmode_native_analysis.py`.
- Regressions: unit-fsm 29, accuracy 13, data-model 379, commands-determinism 50.
