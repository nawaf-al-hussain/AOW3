# R12 — Native announcer/voice trigger system (decoded, offline)

**Version of record**: 6.9.18 — `libil2cpp.so` sha256 `8ace05bb…`, `dump.cs` `0050e67d…`
**Method**: dump.cs class/enum recovery + whole-binary BL xref (2,671,952 call sites scanned)
**Converts**: audit §6 **M1** (7 announcer cues loaded but untriggered → triggers decoded + wired),
**I10** (announcer events → wired), partially **M3** context (shoot-sound effector located)
**Evidence**: `reverse/evidence/audio/r12-voice-trigger-xref.txt`,
`r12-battleui-event-xref.txt`, `r12-flag-capture-decode.txt`
**Tools**: `reverse/tools/r12_voice_trigger_xref.py`, `r12_battleui_event_xref.py`,
`r12_flag_capture_decode.py` (harness lineage: `r6_bitname_crossref.py`)
**Fold-in**: `docs/game.js` ANNOUNCER block (UI-layer observer; audio-only, zero sim-state
writes) + per-frame snapshot feed in `loop()`; test `reverse/evidence/tests/announcer.test.js`
(10 vectors, extracts the shipped class verbatim); cache `v=60 -> v=61`.

---

## 1. Architecture: two announcer systems

The native client separates **what plays** from **what triggers it**:

1. **`AudioBattleVoicesPlayer`** (dump.cs:80813, MonoBehaviour) — per-unit-category radio
   voices. Voice pools are `Dictionary<VoiceCategory, AudioFile.BattleVoice>` fields,
   keyed by **VoiceCategory** flags (dump.cs:80390: `Inf=1, Nav=2, Veh=4, Air=8`,
   `HeroWasp=16 … HeroCryoTank=65536` — one bit per hero) and crossed with
   **DamageFrom** (Mine/Artillery/Air/Fire/GasGranade/Any/Missiles, dump.cs:80409),
   **DestroyedEnemyType** (Inf/Nav/Veh/Air/Bld) and **SpottedEnemyType**
   (Inf/Nav/Veh/Air/Bld/**Sniper=5**/**Mine=6**, dump.cs:80450).
2. **`BattleUIEventHelper`** (dump.cs:296691, static) — global strategic announcements
   as **AudioFile.BattleEvent** ids (dump.cs:81440), the register our browser `ann_*`
   cues map to.

Supporting enums: **VoiceType** (dump.cs:83222) numbers every voice event:
`Select=1, StopAction=31, HoldPosition=32, Patrol=33, Attack=34, MoveInFlagArea=42,
Move=43, MoveSpecHide=44, Damage=45, FlagCaptured=59, ContainerDetected=61,
FogDetected=62, ShieldDetected=63, EnemySpotted=72, UnderAttack=73, EnemyDestroyed=79,
ZombieSpotted=80…82, SiegeMode=83, ActivateShield=84, ScanningMines=85, ActivateFog=86,
DeployingMines=87, CriticalDamage=88, AviaHit=90, AviaLowFuel=91, AviaChangingLocation=92,
AviaBomberAfterBombing=93, ActiveCD=94, ActiveReady=95, ActiveShoot=96,
ActiveOutOfRange=97, PassiveStart=98, Produced=99, Died=100, ToSpecMode=101,
FromSpecMode=102, MeleeAttack=103, Special=104`.

**AudioFile.BattleGUI** (dump.cs:~82221) numbers the global UI jingles:
`ItemIntTimerBattleStart=20, ItemIntVictory=24, ItemIntDefeat=25, ItemHeroActivate=26` etc.
**AudioFile.BattleEvent** (dump.cs:81440): `ItemMsgInsRes=0, ItemMsgInsEnergy=1,
ItemMsgOurBaseUnderAttack=2, ItemMsgOurUnitUnderAttack=3, ItemMsgMineExploded=4,
ItemMsgAlliedBaseUnderAttack=5, ItemMsgAlliedUnitUnderAttack=6, ItemMsgOurBldDestroyed=7,
ItemMsgEnemyDetected=8, ItemMsgHiddenEnemy=9, ItemMsgHiddenOur=10, ItemMsgMinefield=11,
ItemMsgFlagCaptured=12, ItemMsgFlagLost=13, ItemMsgBldComplete=14, ItemMsgUpgComplete=15,
ItemMsgContDetected=16, ItemMsgResReceived=17, ItemMsgYouControlFlags=18,
ItemMsgEnemyControlsFlags=19, ItemMsgSpaceReady=20, ItemMsgNuclearReady=21,
ItemMsgSpaceDetected=22, ItemMsgNuclearDetected=23, ItemMsgNeedCP=24,
ItemMsgDeployBegin=25, ItemMsgPlaceBuilding=26, ItemMsgBoostActivated=27,
ItemMsgTroopActivated=28, ItemMsgTroopArrived=29, ItemMsgPrimaryObjComplete=30,
ItemMsgPrimaryObjFailed=31, ItemMsgSecondaryObjComplete=32, ItemMsgSecondaryObjFailed=33,
ItemMsgNotEnothCredits=34, ItemMsgObjNew=35, ItemMsgPointCaptured=36, ItemMsgPointLost=37`.

## 2. Trigger wiring — AudioBattleVoicesPlayer [DECOMP]

Whole-binary BL xref of all 46 `TryPlay*`/`Play*` entry points
(`r12-voice-trigger-xref.txt`). The voice system rides the **same LC logic-command
stream R7 decoded for fog** — server events drive voices directly:

| Voice event (TryPlay*) | Native trigger site(s) |
|---|---|
| UnderDamageVoice | `LCUnitDamage.Execute` +0x4f0 |
| ExplodedOnMineVoice | `LCUnitDamage.Execute` +0x410 (mine branch) |
| EnemyDestroyedVoice | `LCBuildingDestroy.Execute` +0x30c; `LCUnitDie.Execute` +0x4a0 |
| AviaHitVoice | `LCUnitDie.Execute` +0x5ec (avia branch) |
| FogDetectedVoice | `LCUnitFogVisibleChanged.Execute` +0x3e4; `LCUnitFoggerOn.Execute` +0x1c4 |
| ShieldDetectedVoice | `LCUnitFogVisibleChanged.Execute` +0x2d0; `LCUnitShieldOn.Execute` +0x190 |
| ZombieSpottedVoice | `LCUnitFogVisibleChanged.Execute` +0x3b4 |
| ZombieMoveVoice | `LCUnitMove.Execute` +0x210 |
| ZombieImpactVoice | `LCBulletExplode.Execute` +0x694 |
| HeroMeleeAttack | `LCUnitShoot.Execute` +0x29c |
| HeroShootActiveAbility | `LCHeroAbilityActiveActivate.Execute` +0x34c |
| HeroPassiveAbilityStarted | `LCHeroAbilityPassiveActivate.Execute` +0x3b8 |
| HeroSpecTo/FromVoice | `LCUnitSpecialTo.Execute` +0x4b4 / `LCUnitSpecialFrom.Execute` +0x324 |
| HeroUnitCreated | `ClientUnit.Birth(trainer)` +0x5b8 |
| HeroUnitDied | `ClientUnit.Kill(deathType)` +0x1ec |
| FlagCapturedVoice | `LCFlagCaptured.Execute` +0x2b8 |
| UnitOutOfFuelVoice | `LCUnitOutOfFuel.Execute` +0x164 |

Player-gesture (GH) triggers — command acknowledgements fire on INPUT, not LC echo:
`GHUnitAircraftsRebase.OnBattleMapClick` → AircraftRebase;
`GHUnitTakePositions.OnBattleMapClick` → UnitMoveVoice (R6's takepos consumer!);
`GHUnitPatrolTargeting.OnTapEnded`/`GHUnitMultiplePointPatrolTargeting.TapHandler` → Patrol;
`GHUnitBombardTargeting.OnBattleMapClick` → AttackAreaVoice;
`GHUnitDemining.OnBattleMapClick` → ScanningMines;
`GUIBattleUnitMiningOk.OnClick` → DeployingMines;
`GUIBattleActionUnitSpecHoldPosition.OnButtonClick` → HoldPosition;
`AICommandVisualizerHelper.SendSelectedUnitsAttackToUnit/ToBuilding` → AttackVoice.

Zero-BL-caller entry points (delegate/vtable dispatch, sites not statically resolvable):
UnderAttack, EnemySpotted, MineSpotted, ContainerDetected, MoveVoiceToSelectedUnits,
Stop/Select/Bombard/SiegeMode/ActivateShield/ActivateFog(sel), BomberAfterBombing,
HeroCD/ReadyActiveAbility, HeroOutOfRange, BeholderSpecial.

**Anti-spam machinery** [DECOMP logic, values RUNTIME]:
`CheckEventTimeouts` splits events into Light vs Hard lanes via
`AudioBattleVoicesUtils.GetUnitCombatType`; per-lane random timeouts
(`m_timeoutMin/MaxLight/Hard` ms, `m_timeoutMin/MaxHard`) + a command-voice timeout
(`m_timeoutCommandVoice`) + last-voice dedup (`m_lastPlayingVoiceType`). Serialized in a
scene/prefab — the ms values are `[RUNTIME]`, not statically recoverable.

**Voice-utils consumers** (xref): `GetVoiceCategoriesForGroup` (11 sites — every group
command voice), `GetRandomCategoryFromSet` (9), `GetVoiceCategoryForSingleUnit` (9),
`IsUnitsGroupHideInForest` → `MoveSpecHide` variant (move + infantry-select voices change
when the group is forest-hidden — R7 forest semantics reaching the audio layer),
`IsPointNearFlag` → flag-area move/attack variants, `IsPointInShotDistanceToGroup` →
out-of-area attack variant, `GetSpotterUnit` → spotted/container voices.

## 3. Trigger wiring — BattleUIEventHelper (global announcements) [DECOMP]

BL xref of all 37 public methods (`r12-battleui-event-xref.txt`):

| Announcement (BattleEvent id) | Native trigger site |
|---|---|
| OurBuildingIsDestroyed (7) | `LCBuildingDestroy.Execute` +0x244 |
| BuildingComplete (14) | `LCBuildingProcessCompleted.Execute` +0x120 |
| BuildingUpgradeComplete (15) | `LCBuildingProcessCompleted.Execute` +0x174 |
| ResourceContainerIsDetected (16) | `LCBonusBoxCreate.Execute` +0x298 |
| ResourceReceived (17) | `LCBonusBoxTake.Execute` +0x17c |
| FlagIsCaptured (12) | `ClientFlag.Capture(side)` +0x148 |
| FlagIsLost (13) | `ClientFlag.Capture(side)` +0x154 |
| PlayerControlsFlags (18) | `LCCommonMessage.Execute` +0x1c |
| EnemyControlsFlags (19) | `LCCommonMessage.Execute` +0x28 |
| EnemyDetected (8) | `GUIBattleMinimapRenderer.EnemyDetected` +0x158 |
| EnemyHiddenDetected (9) | `GUIBattleMinimapRenderer.EnemyDetected` +0x148 |
| OurHiddenUnitDetected (10) | `GUIBattleMinimapRenderer.OurHiddenUnitDetected` +0xcc |
| OurUnitIsUnderAttack (3) | `GUIBattleMinimapRenderer.UnitAttacked` +0x9c |
| AlliedUnitIsUnderAttack (6) | `GUIBattleMinimapRenderer.UnitAttacked` +0xa8 |
| OurBaseIsUnderAttack (2) | `GUIBattleMinimapRenderer.BuildingAttacked` +0x98 |
| AlliedBaseIsUnderAttack (5) | `GUIBattleMinimapRenderer.BuildingAttacked` +0xa4 |
| OurUnitExplodedOnMine (4) | minimap `InternalUnitExplodedOnMine` +0x94 |
| MineDetected (11) | minimap `InternalMineDetected` +0x98 |
| SpaceSystemIsReadyForStrike (20) | `LCBuildingSuperWeaponReady.Execute` +0x13c |
| NuclearMissileIsReadyForLaunch (21) | `LCBuildingSuperWeaponReady.Execute` +0x148 |
| SpaceStrikeIsDetected (22) | `LCBuildingSuperWeaponLaunchDetected.Execute` +0x264 |
| NuclearLaunchIsDetected (23) | `LCBuildingSuperWeaponLaunchDetected.Execute` +0x270 |
| Space/NuclearStrikeIsRejected | `LCBuildingSuperWeaponLaunchRejected.Execute` |
| DeployBegin (25) | `LCSideDeployMode.<DeployBeginCoroutine>` +0x1a4 |
| BoostAdded/Apply/Reject (27) | `LCSideBoostAdd/Apply/Reject.Execute` |
| ContractCompleted | `LCSideDailyUpdate.Execute` +0x1a8 |
| InsufficientResources (0) | GUI production/upgrade click handlers (5 sites) |
| InsufficientEnergy (1) | `GUIBattleListUpgradeItem.OnClick` +0xe8 |

Under-attack feed decode (`r12-flag-capture-decode.txt` §2-3):
`GUIBattleMinimapRenderer.UnitAttacked` 0x82064F4 / `BuildingAttacked` 0x82065BC =
`CreateEntityAction` filter gate (0x82061C0) → per-channel time throttle
(`now = TimeUtils.GetMilliTicks 0x8D355C8`; skip if `now < nextAllowed`;
`nextAllowed = now + delay` — delay int + nextAllowed long are instance fields
@0x198/0x1C0 (units) / 0x1C8 (buildings), prefab-serialized `[RUNTIME]`) →
`BattleEntityUtils.IsOwnEntity` 0x82739CC split → Our*/Allied* variants.
Flags (ClientFlag) are NOT ClientBuildings — depots never hit this path.

## 4. Flag-capture polarity [DECOMP]

`ClientFlag.Capture(ClientBattleSide side)` 0x8072CBC (`r12-flag-capture-decode.txt` §1):

1. `m_side == side` → return (no-op re-capture, silent).
2. `m_inProgress == false` (flag byte @0x75) → skip announcement (init-time ownership
   grants / non-progress captures are silent).
3. `BattleEntityUtils.IsAllySide(side)` (0x8261618) → `FlagIsCaptured()`; else
   `FlagIsLost()`. **Prior owner is not consulted** — a progress-completed capture of a
   NEUTRAL flag announces "lost" from the enemy-capture perspective.
4. Continuation: `ShowCapture/HideCapture` UI state + `GUIBattleMinimapRenderer.
   FlagChange(flag)` (0x8204794, minimap recolor).

## 5. Browser fold-in (v=61)

`docs/game.js` ANNOUNCER block — UI-layer observer (`Announcer` class + per-frame
snapshot feed after the sim-step loop). Maps the 7 previously-silent cues:

| Browser cue | Native event | Trigger in browser | Label |
|---|---|---|---|
| ann_captured | ItemMsgFlagCaptured=12 | allied depot capture completes | [DECOMP] |
| ann_flag_lost | ItemMsgFlagLost=13 | hostile depot capture completes | [DECOMP] |
| ann_flags_lost | ItemMsgEnemyControlsFlags=19 | every flag hostile after a capture | [INFERRED] (LCCommonMessage payload opaque) |
| ann_enemy | ItemMsgEnemyDetected=8 | enemy entity NEW cell-visible transition | [DECOMP] chain |
| ann_base_attack | ItemMsgOurBaseUnderAttack=2 | allied non-flag building hp drop, per-channel throttle | [DECOMP logic] |
| ann_arrived | ItemMsgTroopArrived=29 | dormant — transports out of browser scope | decoded, unwired |
| ann_achievement | ContractCompleted ← LCSideDailyUpdate | dormant — no contracts in browser scope | decoded, unwired |

Throttles `[BROWSER]` (native delays are prefab ints, unmeasured): base 20 s,
enemy 15 s, enemy-flags 30 s; flags have **no** throttle (native calls the helper
directly per capture). Spectator/replay gate [DECOMP] mirrors
`get_IsSpectator/get_IsReplay`. Kernel untouched — zero hash impact
(commands-determinism 57/57 and all suites green).

## 6. Reproduction

```bash
python3 reverse/tools/r12_voice_trigger_xref.py  > reverse/evidence/audio/r12-voice-trigger-xref.txt
python3 reverse/tools/r12_battleui_event_xref.py > reverse/evidence/audio/r12-battleui-event-xref.txt
python3 reverse/tools/r12_flag_capture_decode.py > reverse/evidence/audio/r12-flag-capture-decode.txt
node --test reverse/evidence/tests/announcer.test.js
```

## 7. Residuals

- Voice/BattleEvent audio **clip inventory + prefab delay values**: `[RUNTIME]`
  (serialized in scene/asset bundles; audio bundle catalog is R11-adjacent).
- `TryPlayEnemySpottedVoice` call site: delegate-driven (no static BL); semantics
  pinned by the SpottedEnemyType xref + GetSpotterUnit consumers.
- Per-unit radio voices (VoiceType register): decoded wiring only — the browser kernel
  has no per-unit voice layer; a future V/M-series item can consume §2's table.
- M3 weapon→sound mapping: native shoot-sound path located
  (`UnitShootSoundEffector.ToShoot(int weaponIndex)` 0x80D12EC → PlayLimitedSoundById);
  per-weapon-id table still bundle-bound — left open in the registry.
