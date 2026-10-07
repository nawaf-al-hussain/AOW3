# Phase 5 — missions & minimum range + Phase D replay harness (v=23)

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
- Not reconstructed (documented): native Defend/Bombard task nuances (hold
  reconstructed below, v=25).

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
- Not reconstructed (documented): native Defend/Bombard task nuances (Bombard
  = targeted shelling order; Defend = default-stance variant), DontShoot/
  TakePositions, and aircraft-hold orbit specifics (ItemAviaAttackHoldPosition
  suggests attack-from-orbit; the tribute holds aircraft hovering in place).

## Coverage
- `reverse/evidence/tests/phase5.test.js` — 93 vectors (min-range gates, patrol
  oscillation/engagement/resume/journal, garrison enter/protect/crew-fire/exit/
  capacity/death/rejections, hold stance entry/window-fire/no-pursuit/
  retaliation/minRange-aggro/building/melee/warn-join/interplay/release,
  cross-feature determinism).
- `reverse/evidence/tests/replay.test.js` — 34 vectors (bit-exact reproduction,
  baseline, cross-issuer ordering, tamper detection seed/drop/alter/terrain,
  540-command journal vs 512 ring, live-shaped build+patrol+garrison run, JSON
  round-trip).
- Regressions: unit-fsm 29, accuracy 13, data-model 379 (fixture regenerated after
  the minRange data change; `minRange` added to WEAPON_FIELD_MAP as
  m_distanceMin/0x2C), commands-determinism 50.
