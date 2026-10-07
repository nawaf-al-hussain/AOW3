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

### Siege transform build (v=36, native chassis + timings + tribute reconstruction)

- **Chassis identities CLOSED (CONFIRMED, enum literals)** — the v=30 "chassis bytes
  22/23/31" are `UnitType` consts (dump.cs:395418+): **22 = UNIT_TYPE_SHIELD,
  23 = UNIT_TYPE_FOG, 31 = UNIT_TYPE_FIGHTER** — the Seraphim-family triple
  transform targets (ToSiege/ToShield/ToFog); the act-2/3 arm's `cmp #0x17` at
  0x45f685c is the FOG-chassis check. Full chassis taxonomy 10..90 captured in
  `reverse/evidence/combat/siege-native.txt` (MARINE 10 … KODOMASH_TOWER 90),
  spec bytes SPEC_SIEGE=1 / SPEC_SNIPER=2 … SPEC_KODOMASH=5.
- **Stage machine data CONFIRMED** — `Unit.SIEGE_STAGE_SEIZE_FIRE = 0 /
  ROTATE_WEAPONS = 1 / TRANSFORM = 2` (393233-393235) with Unit fields
  `siege_stage` 0xA1 / `siegeTick` 0xA4 / `siegeAfterWalkTick` 0xA8 /
  `siege_blocked` 0x1C4; durations = `UnitType.tick_to_spec` 0x4D /
  `tick_from_spec` 0x4E sbytes (display-domain names: EStat 20/21
  TransitionToMarchModeTime / TransitionToSiegeModeTime, 168800-168801);
  faction defaults on `Fraction`: `siege_hp` 0xA4, `autoSiegeDelay` 0xF4,
  `fireRadiusInc` 0xF6. Stage + tick are server-simulated and STREAMED
  (Unit serializer reads siege_stage @0x44a4d9c; the ST deserializer is the
  single direct `set_SiegeTick` BL site @0x4553444).
- **Vtable maps derived (anchored)** — Unit property slots: siege stage
  0xDC8/0xDE0, siegeTick 0xDF8/0xE10, afterWalk 0xE28/0xE40, blocked
  0xE58/0xE70 (base anchored on get_Task = 0x1008, the specmode act-7 arm
  pair); UnitType slots: get_Spec 0x3B8, get_TickFromSpec 0x418,
  get_TickToSpec 0x448, get_Type 0x4D8 (anchored on the act-2/3 arm pair).
  Caveat: offsets are klass-relative, not globally unique — whole-binary
  scans on them alone are noise (documented in the evidence file).
- **Sim driver located** — `$ce(Battle, Unit)` @0x47501f0 (20 956 B) is the
  per-tick siege machine (calls the v=30 siege helper `$hi` @0x4831fe4, reads
  the UnitType duration shape ×10, writes siegeTick); `$fe(Battle, Unit)`
  @0x475afa4 carries the after-walk/auto-siege timers. Confidence HIGH for
  the identification, MEDIUM for the exact per-stage tick split (full
  20 KB-state decode not completed; the split is reconstructed, not read).
- **Tribute reconstruction (v=36)** — `commandSiege(ids, on)`:
  artillery-family gate (`minRange > 0`, the GetBombardUnitsOnly family — the
  roster has no Seraphim/shield/fog chassis), R-key toggle (native hotkeys
  UnitSpecTo/FromSiegeMode = 27/28, 255735-255736), stage ladder
  SEIZE_FIRE(0) -> ROTATE_WEAPONS(1) -> TRANSFORM(2) over
  `SIEGE_TICK_TO = 1.6s`, release over `SIEGE_TICK_FROM = 1.2s` (both
  reconstruction constants — per-type sbyte data lives in server files, not
  client literals); movement locked at once, weapons rotate (no fire) while
  stage < 2, TRANSFORM extends the band `+SIEGE_FIRE_RADIUS_INC = 2`
  (fireRadiusInc analog, `siegeRange(u)`), any other order releases (task
  replacement), U-line `sg<dir>.<stage>` hash token, Commands case "siege"
  rides LOCKSTEP_NET_TYPES.
  Tests: phase5.test.js 176 -> 199 vectors (capability gate, ladder
  progression/timing, movement lock, fire-block during transform, band
  extension reach, release ladder, task replacement, U-line + determinism).

### TakePositions formation build (v=36, native decode + tribute nearest-match)

The "native TakePositions formation algorithm" is DECODED — there is NO server
formation solver; placement is PLAYER-driven per cell through
`UnitTakePositionsManager` (TDI 7806), all CONFIRMED by direct disassembly
(`reverse/evidence/combat/takepos-native.txt`, tool `takepos_disasm.py`):
- Static occupancy masks (.cctor 0x81D4DF4): **All = 0x215F,
  HelicopterBehaviour = 0xFEE0, Land = 0xFEFD** (the latter two are the exact
  bit-complements of All).
- `GetUnitOccupancyMask` 0x81D43BC keys the mask on the type's
  **UNIT_CATEGORY byte** (INFANTRY = 1 / VEHICLE = 2 / AIRCRAFT = 3 / SHIP = 4,
  dump.cs:395462-395465): infantry -> All (with a Land & ~0x4 refinement for a
  sub-type flag), vehicles -> Land, aircraft -> HelicopterBehaviour & All only
  when `IsHelicopterBehaviour` (0x8011840) else **mask 0 — fixed-wing fliers
  can never take positions**, ships -> 0xFFEF with the UNIT_TYPE 42 amphibian
  special-case 0xFFE5. `GetHeroUnitOccupancyMask` 0x81D4568 is the hero variant.
- `CalculateCellsMask` 0x81D4780: the drawable grid = AND of the remaining
  unsent units' masks (init 0x7FFF).
- `SendNearestUnitToCell` 0x81D4954: coarse `CheckByMask(m_cellsMask)` gate,
  then the cell goes to the **nearest unsent unit by DistanceSqr(unit.Cell,
  cell)** (0x8d3047c) whose own mask accepts it, sent as
  **SendUnitsMove([unit], cell, UnitMoveStyle.Forced = 1, ...)** (0x82d4a50;
  `UnitMoveStyle {Assault = 0, Forced = 1}` 337622-337627) — a strict forced
  march with no en-route engagement; `Unit.set_TakePosition(Coordinate)`
  0x45B16B8 stores the taken cell server-side.
- Tribute (v=36): `commandTakePositions(ids, spots)` upgraded from index-order
  to the native nearest-match in tile space, the category gate modeled as
  aircraft-excluded-unless-helicopter, leftovers stay unsent (native: simply
  never sent); Forced maps to the takepos order (already engagement-free, hold
  at the taken spot). Tests: phase5.test.js 199 -> 208 (nearest-match out of
  order, helicopter participates / fixed-wing excluded via a derived def,
  leftovers untouched, determinism; the v=28 index-order expectation updated
  to the decoded semantics with a note).

### Defend leash build (v=36, native source pinned — Build C)

The `$Pg` leash question is CLOSED at the mechanism level with full-coverage
evidence (`reverse/evidence/combat/pg-leash-native.txt`, tools
`pg_constants_scan.py` + `pg_ug_windows.py`):
- `$Pg(Battle, Unit)` = 0x483C244..0x48470D0, 44,684 bytes / 11,171
  instructions disassembled end-to-end. **The leash is not a literal** — the
  whole machine contains nine cmp-immediates, all class-init/0/1 tests.
- The leash VALUE arrives as DATA: the int argument of the
  `$UG(Battle, Unit, int)` gate (0x481ED28, 3 sites) and the
  `$yG(Battle, Unit, int)` reposition (0x480CB44, 3 sites) is composed at
  0x483EFF8..0x483F014 as `ldp w9, w8, [UnitAct statics + 0xC]; eor w8, w8,
  w9; ldr w9, [sp, #0x134]; add w2, w8, w9` — **two UnitAct STATIC balance
  fields XOR-combined, offset by the local distance band**. The client only
  reads the value; per-scenario server data supplies it. The tuned
  `DEFEND_TETHER = 4` stands as the documented stand-in.
- Helper inventory of the machine (call histogram): weapon selection
  ($fI/$qg/$fh/$yg/$AG/$wg), path machinery ($Qc, the anchor Coordinate ctor
  re-verified at 0x4840068), target teardown ($he/$ii), distance probes
  $dC x3, geometry gates $ZG/$PA. The per-branch micro-logic enumeration of
  the 44 KB remains the residual (structure + data flow documented).

### DontShoot nuance resolved (v=36 — Build D)

The act-7 (ACT_DONT_SHOOT) arm of `GAICommandSpecMode.execute`
(0x45F6700..0x45F6824) is fully decoded with every call target named
(`reverse/evidence/combat/dontshoot-native.txt`):
- **Runtime state = TASK 8, not a sticky spec** — the arm finalizes with
  `$Hi(Battle, Unit, 8)` (0x48178FC, the same set-task helper the HIDE arm
  calls with 4); task 8 = `ClientUnitTaskType.DontShoot` (271222). Entering
  fire discipline is TASK REPLACEMENT like any other order.
- **Entry is idempotent** — `cmp w8, #8; b.eq exit`: a unit already in task
  8 skips the arm.
- **The paired specs are per-TYPE capability gates** — `tbz w0, #0x14`
  tests bit 20 (= 0x100000 = ClientUnitStateSpecType.DontShoot 1048576) of
  the unit type's spec mask; a type without the capability ignores the
  order. CanShoot = 2097152 is the complementary gate on its own toggle
  path (hotkey 32).
- Entry teardown: clear target ([+0x798] setter w1 = 0),
  `$he(Battle, Unit, -1)` 0x4758128, set_Obj(null) ([+0xAB8]),
  `$Gi(Battle, Unit, (short)X, (short)Y)` 0x4809330 (halt at the CURRENT
  position), and a short-field setter with 0xFFFF (indefinite marker;
  slot [0x4B8] not in the verified map — flagged, not guessed).
- **Tribute fidelity note (explicit model choice)**: v=28 keeps fireHold
  sticky (explicit attack does NOT bypass). Native enters via task
  replacement, so a subsequent attack task would end discipline natively
  unless the server re-asserts it (attack path not decoded this pass). The
  F-toggle UX and vectors stand; a fidelity fix would clear fireHold on
  task-carrying orders and update the fire-discipline vectors.

### Remaining unknowns (documented, after v=36)

- Defend `$Pg` per-branch micro-logic enumeration (44 KB; the anchor, task
  flow, helper inventory and the leash DATA SOURCE are all pinned, the
  branch-by-branch semantics are not).
- Siege stage-boundary SPLIT inside `tick_to_spec` (how the duration divides
  across SEIZE_FIRE/ROTATE_WEAPONS/TRANSFORM — the fields and ladder are
  CONFIRMED, the per-stage tick math inside `$ce` is MEDIUM).
- DontShoot: whether a subsequent attack task RE-ASSERTS discipline
  (attack-command path not decoded; entry semantics CONFIRMED as task
  replacement). TakePositions 15-bit cell-class SEMANTICS (masks + rules
  CONFIRMED, per-bit meaning inferential).

## Coverage
- `reverse/evidence/tests/phase5.test.js` — 208 vectors (min-range gates, patrol
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
  legacy-compat/pts-gate/determinism, siege capability/ladder-timing/
  move-lock/fire-block/band-extension/release/task-replacement/hash-
  determinism, takepos nearest-match/category-gate/leftovers/determinism).
- `reverse/evidence/tests/replay.test.js` — 45 vectors (bit-exact reproduction,
  baseline, cross-issuer ordering, tamper detection seed/drop/alter/terrain,
  540-command journal vs 512 ring, live-shaped build+patrol+garrison run, JSON
  round-trip; v=26 boundary flush).
- Native: `reverse/evidence/combat/specmode-native.txt` (annotated ARM64
  disassembly of GAICommandSpecMode.execute/verifyVariables/ToString,
  AICommUnitsSpec/Bombard/HoldPosition executors, WeaponType.canBombard,
  Unit stance accessors; sha256 8ace05bb…), tool
  `reverse/tools/specmode_native_analysis.py`.
- Siege native (v=36): `reverse/evidence/combat/siege-native.txt`
  (chassis table, stage consts, field map, vtable slot maps, $ce/$fe
  identification, serializer proof) + `siege-ce-fe-windows.txt`
  (annotated disasm) + `siege-stage-scan.txt` (field-access attribution),
  tools `reverse/tools/siege_stage_scan.py` / `siege_native_analysis.py`.
- TakePositions native (v=36): `reverse/evidence/combat/takepos-native.txt`
  (occupancy masks, category rules, nearest-match, Forced move style —
  annotated disasm of all seven UnitTakePositionsManager methods), tool
  `reverse/tools/takepos_disasm.py`.
- Defend leash native (v=36): `reverse/evidence/combat/pg-leash-native.txt`
  (44,684-byte $Pg end-to-end scan, static-XOR leash source at 0x483EFF8,
  helper inventory), tools `reverse/tools/pg_constants_scan.py` /
  `pg_ug_windows.py`.
- DontShoot native (v=36): `reverse/evidence/combat/dontshoot-native.txt`
  (act-7 arm 0x45F6700..0x45F6824 with resolved call targets:
  $Hi(…,8) task replacement, capability bit 20, idempotent entry,
  $he/$Gi teardown).
- Regressions: unit-fsm 29, accuracy 13, data-model 379, commands-determinism 50.
