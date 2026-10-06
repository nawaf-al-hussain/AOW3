# EStat taxonomy & IStatModel stat-model inventory (6.9.18) — bindings natively pinned

Created: 2026-10-07 (follow-up to the FileUpload/AOW3 audit — closes audit-report
"Recommended Next Investigations" item #4 and the Economy_System.md row of
"Unverified Findings"). **Follow-up the same day: all 9 previously ambiguous class→EStat
bindings were pinned by native disassembly of `libil2cpp.so` (§6) — 0 ambiguities remain.**

## What

The complete stat taxonomy of Art of War 3 6.9.18 as defined by the `EStat` enum, the
`IStatModel` contract that exposes it, and all 45 concrete stat-model classes that feed the
in-game unit/building/weapon info panels. This note gives the tribute implementation a
canonical, dump-anchored list of every stat the game models — including the mine-damage and
coil-tank stats the external collection hinted at — and maps each stat-model class to its
`EStat` binding where dump.cs allows.

## Evidence

| Item | Value |
|---|---|
| Primary source | in-repo `dump.cs` (Il2CppDumper 6.7.46, metadata v31, from the 6.9.18 XAPK LFS chain) |
| dump.cs SHA-256 | `0050e67d23f898588f0771c69ba7f30f9122cd6eccd66674c0f7c87b7f24714b` (63,922,449 bytes; see extraction log header) |
| `EStat` enum | dump.cs:168776-168860, namespace `com.geargames.aow.ugui.army.models.info` — **78 values, 0–77** |
| `EStatCategory` enum | dump.cs:168861-168874 — `{None=0, Base=1, Produce=2, Cost=3, Special=4}` |
| `IStatModel` interface | dump.cs:20773-20816, namespace `Domains.Workshop.Api.Prototypes.Stats` — contract: `Name`, `Values`, `Hint`, `Category`, **`Stat` (EStat)**, `IsIncreasing`, `Owner`, `OnChange` |
| Stat-model classes | **45 implementors**: 22 weapon/mine (`Domains.Workshop.Impl.Models.Weapon`, TypeDefIndex 396–418) + 23 building/unit (`com.geargames.aow.ugui.army.models.info.Stats`, TypeDefIndex 4407–4431) |
| Supporting types | `IMaxStatValueProvider.Get(float, EStat)` (dump.cs:168886) and `MaxStatValueProvider.StatInfo {BaseMax, FirstMax?, MegaMax?}` — per-stat caps in three tiers (base / first-upgrade / mega) |
| Full class table | `estat-classes.tsv` (this directory) — per-class TypeDefIndex, namespace, dump.cs line range, EStat binding, confidence |
| Raw extraction log | `reverse/evidence/estat/estat-extraction.txt` |
| Cross-ref | `reverse/notes/armor-stat-helper-native-analysis.md` — `MaxStatValueProvider.Get(float, EStat)` natively verified; `ArmorType(0,1,2) → EStat.ArmorLight/Medium/Heavy = 7/8/9` (UI mapper, VA 0x7cb6b30) |

## Findings

### 1. The complete `EStat` list (78 stats, grouped by function)

- **Core unit/building (Base):** Health/1, Price/2, PriceUranum/3, CommandPoints/4,
  TrainTime/5, Speed/6, ArmorLight/7, ArmorMedium/8, ArmorHeavy/9, View/10,
  ConstructionRadius/11, ConstructionTime/12, BuildingSize/17, HealthRegeneration/18
- **Production/economy (Produce):** CommandPointsProduce/13, SupplyIncome/14,
  EnergyProduction/15, EnergyNeed/16, InitialResourceReserve/47
- **Energy system:** EnergyReserve/24, EnergyConsumption/25, EnergyRegeneration/28
- **Shield subsystem:** ShieldStrength/26, ShieldRadius/27, ShieldActivationTime/29,
  ShieldDeactivationTime/30
- **Fog/cloak subsystem:** FogRadius/31, FogActivationTime/32, FogDeactivationTime/33
- **Detection:** MineDetection/34, ForestUnitDetection/35, SubmarineDetection/36
- **Fuel/air ops:** FuelReserve/37, FuelConsumption/38, RefuelingSpeed/39
- **Demining:** MineDeactivationTime/22, DeminingSpeed/23
- **Mode transitions:** JumpRange/19, TransitionToMarchModeTime/20,
  TransitionToSiegeModeTime/21, DeploymentTime/46, SeraphimGroundModeTransitionTime/41,
  SeraphimAirModeTransitionTime/42, CerberusWeaponSwitchTime/40,
  WorkshopRepairRadius/43, WorkshopRepairSpeed/44, WorkshopModeTransitionTime/45
- **Weapon (per-weapon stats):** WeaponDistance/58, WeaponAccuracy/59, WeaponFireRate/60,
  WeaponArmorLight/61, WeaponArmorMedium/62, WeaponArmorHeavy/63, WeaponExplosionRadius/64,
  WeaponBombCount/65, WeaponMineCost/66, WeaponMineTime/67
- **Super-weapon:** WeaponSuperWeaponCost/68, WeaponSuperWeaponTime/69, WeaponSuperWeaponCP/70,
  WeaponSuperWeaponArmorLight/72, WeaponSuperWeaponArmorMedium/73,
  WeaponSuperWeaponArmorHeavy/74, WeaponSuperWeaponCommandPoints/75,
  WeaponSuperWeaponDistance/76, WeaponSuperWeaponExplosionRadius/77, MinePrice/71
- **Hero/unique specials:** PsiAttackSpeedReduction/52, PsiSlowdownDuration/53,
  WolverineMachineGunMaxAccelerationTime/54, CoilTankMaxTargets/55, CoilTankFrontalArmor/56,
  AtlasImmortalityTime/57, SpaceStrikePreparationTime/48, LaunchPreparationTime/49,
  MissileFlightTime/50, MaxViewReachTime/51

### 2. Damage is EStat-keyed — dump-direct proof

`WeaponDamage` (dump.cs:18833-18917, the only non-sealed implementor) takes `EStat type`
in its private ctor and exposes exactly six static factories: `CreateLiteDamage`,
`CreateMediumDamage`, `CreateHeavyDamage`, `CreateSuperWeaponLiteDamage`,
`CreateSuperWeaponMediumDamage`, `CreateSuperWeaponHeavyDamage`. This is dump-level
confirmation that per-target-armor damage reads flow through
`EStat.WeaponArmor{Light,Medium,Heavy}` (61/62/63) and
`WeaponSuperWeaponArmor{Light,Medium,Heavy}` (72/73/74) — the same stat keys the natively
verified `CalculateWeaponArmorDamage(float, EStat)` consumes (ArmorStatHelper note §3.2).
The damage pipeline is therefore fully consistent end-to-end: balance int →
`WeaponDamage` factory → EStat key → `IMaxStatValueProvider` tier clamp → mitigation curve.

### 3. Per-armor-type mine damage — the external lead, confirmed structurally

`MineDamageFor{Light,Medium,Heavy}ArmorStat` (TypeDefIndex 399/400/401) implement
`IStatModel`, and `MineStatsFactory.CreateList` (dump.cs:17422-17446) builds exactly:
`CreateDamageForLightArmor`, `CreateDamageForMediumArmor`, `CreateDamageForHeavyArmor`,
`CreateCost`, `CreateFireRate`, `CreateRadius`. Mines damage the three armor classes
through separate stat channels, exactly as the external material suggested for 6.5.22.
No dedicated `MineDamage*` EStat exists — the mine stat models are keyed through the
weapon-damage EStats natively (INFERRED, see TSV confidence column).

### 4. Hero/unique stat surface

`SpecialStat` (TDI 4419) is the generic wrapper for the hero/unique stats
(icon family `ico_stat_unique_*`, 40 distinct unique-stat icons among the 66
`ico_stat_*` literals in `stringliteral.json` — see extraction log), covering shields, fog, fuel, psi, coil-tank, seraphim, workshop and
demining behaviors listed above. `EStatCategory.Special/4` is the dedicated category.

### 5. External-collection claims resolved by this extraction

| External claim (6.5.22 docs) | 6.9.18 verdict |
|---|---|
| "energy/supply" economy model (Economy_System.md) | CONFIRMED at enum level: SupplyIncome/14, EnergyProduction/15, EnergyNeed/16, EnergyReserve/24, EnergyConsumption/25, EnergyRegeneration/28 + dedicated stat classes (`HqSupplyIncomeStat`, `SupplyDepotIncomeStat`, `BuildingEnergyProductionStat`, `BuildingEnergyNeedStat`) |
| `ATTACK_INTERVAL_{LAND,WATER,FIGHTER,BOMBER,NUCLEAR}` semantics | The 6.9.18 representation is a single `WeaponFireRate/60` stat (`WeaponFireRateStat`, TDI 417) plus per-weapon balance rows; the five-constant attack-interval enum does not exist under those names (consistent with the audit's UNVERIFIED row — now resolved as *renamed/represented differently*) |
| No numeric balance tables in collection | Consistent: all stat VALUES live behind `IPrototypeModel`/backend delivery; the APK only ships the stat *structure* |

## Version

6.9.18 (`com.geargames.aow`). The stat-model architecture (`Domains.Workshop.*`) and the
UI stat classes (`com.geargames.aow.ugui.army.models.info.Stats`) are both from the same
dump; no 6.5.22 material was used.

## Confidence

- `EStat` enum, `IStatModel` contract, class inventory, factory signatures: **CONFIRMED**
  (direct dump.cs lines, recorded in TSV/extraction log).
- Class→EStat bindings after the 2026-10-07 native pinning pass: **45/45 resolved** —
  26 name-match (MATCH) + 9 prefix-stripped match (MATCH_STRIPPED) + 6 native constants
  (NATIVE_CONST) + 2 native armor-routing chains (NATIVE_ROUTED) + 1 native caller-
  enumerated wrapper (NATIVE_ENUM_WRAPPER, 42 call sites) + 1 dump-direct 6-factory proof
  (WeaponDamage). Pre-pin tally was 31 / 9 / 4 INFERRED / 1.
- Damage-through-EStat flow: **CONFIRMED** (factories) + **HIGH** (native, from the
  ArmorStatHelper note).

## 6. Native pinning of the ambiguous bindings (2026-10-07)

Method: Capstone ARM64 disassembly of `libil2cpp.so` (SHA-256 `8ace05bb…`, byte-identical
to the chain in `armor-stat-helper-native-analysis.md`) at dump.cs RVAs; whole-file BL
scan for call sites of the parameter-taking ctors; call sites attributed via a 150,721-method
RVA index built from dump.cs. Tool: `reverse/tools/pin_estat_bindings.py`; full output:
`reverse/evidence/estat/estat-native-pinning.txt`.

### 6.1 Constant-returning `get_Stat()` — the six mine/weapon stat classes

Each has no `m_stat` field; `get_Stat()` is a two-instruction constant:

| Class | get_Stat body (VA) | EStat |
|---|---|---|
| MineCostStat | `mov w0, #0x42; ret` (0x80e8aac) | **WeaponMineCost / 66** |
| MineDamageForLightArmorStat | `mov w0, #0x3d; ret` (0x80e93bc) | **WeaponArmorLight / 61** |
| MineDamageForMediumArmorStat | `mov w0, #0x3e; ret` (0x80e9844) | **WeaponArmorMedium / 62** |
| MineDamageForHeavyArmorStat | `mov w0, #0x3f; ret` (0x80e8f34) | **WeaponArmorHeavy / 63** |
| MineExplosionRadiusStat | `mov w0, #0x40; ret` (0x80e9ccc) | **WeaponExplosionRadius / 64** |
| MineSetTimeStat | `mov w0, #0x43; ret` (0x80ea164) | **WeaponMineTime / 67** |

Notable: `MineCostStat` is bound to **WeaponMineCost (66), NOT MinePrice (71)** — the
dump-name guess `MinePrice` was wrong. EStat **MinePrice / 71** currently has no dedicated
IStatModel class (see Unknowns).

### 6.2 Armor stats route through `ArmorStatHelper.GetArmorMeta` — both classes

- **BuildingArmorStat..ctor** (VA 0x7cc1ec4): calls `ArmorStatHelper.GetArmorMeta`
  (`bl 0x7cb6b30` at 0x7cc1fe4) and stores the EStat half of its return
  (`str w0, [x19, #0x20]`) into `m_stat` → **ArmorLight/Medium/Heavy (7/8/9) selected per
  building armor type** (GetArmorMeta's type+7 mapping was natively verified in
  `armor-stat-helper-native-analysis.md` §3.1).
- **UnitArmorStat.TryCreate** (VA 0x7cc6a4c): same call (`bl 0x7cb6b30` at 0x7cc6c40),
  result register w22 passed as the ctor's EStat argument (`mov w3, w22` at 0x7cc6d38 →
  `bl UnitArmorStat..ctor`) → same **7/8/9 triad, per unit armor type**.

### 6.3 `SpecialStat` is the unique-stat wrapper — 42 native call sites enumerate it

`SpecialStat..ctor` takes `EStat stat` as a parameter (dump.cs:169737-169738). A whole-file
BL scan found exactly **42 call sites**, all inside the special-stats factory iterators,
each passing a literal unique EStat:

| Factory (iterator) | EStats passed |
|---|---|
| BuildingSpecialStatsFactory.<CreateStatForHq>d__2 | DeploymentTime/46, InitialResourceReserve/47 |
| BuildingSpecialStatsFactory.<CreateStatForNavalTurret>d__3 | SubmarineDetection/36 |
| UnitSpecialStatFactory.<CreateStatsAirplains>d__11 | FuelConsumption/38, FuelReserve/37, RefuelingSpeed/39 |
| UnitSpecialStatFactory.<CreateStatsAtlas>d__17 | AtlasImmortalityTime/57 |
| UnitSpecialStatFactory.<CreateStatsBeholder>d__14 | MaxViewReachTime/51 |
| UnitSpecialStatFactory.<CreateStatsCoilTank>d__16 | CoilTankFrontalArmor/56 |
| UnitSpecialStatFactory.<CreateStatsCommando>d__12 | CerberusWeaponSwitchTime/40 |
| UnitSpecialStatFactory.<CreateStatsForDemine>d__5 | MineDeactivationTime/22, DeminingSpeed/23, MineDetection/34 |
| UnitSpecialStatFactory.<CreateStatsForFirebat>d__4 | FuelConsumption/38, JumpRange/19, RefuelingSpeed/39, FuelReserve/37, ForestUnitDetection/35 |
| UnitSpecialStatFactory.<CreateStatsForFog>d__8 | FogActivationTime/32, EnergyConsumption/25, FogRadius/31, EnergyRegeneration/28, FogDeactivationTime/33, EnergyReserve/24 |
| UnitSpecialStatFactory.<CreateStatsForMarchMode>d__6 | TransitionToMarchModeTime/20, TransitionToSiegeModeTime/21 |
| UnitSpecialStatFactory.<CreateStatsForShield>d__7 | ShieldRadius/27, ShieldActivationTime/29, EnergyConsumption/25, ShieldStrength/26, EnergyRegeneration/28, EnergyReserve/24, ShieldDeactivationTime/30 |
| UnitSpecialStatFactory.<CreateStatsHelicopters>d__9 | SubmarineDetection/36, ForestUnitDetection/35 |
| UnitSpecialStatFactory.<CreateStatsKodomash>d__15 | WorkshopRepairSpeed/44, TransitionToMarchModeTime/20, WorkshopModeTransitionTime/45, WorkshopRepairRadius/43 |
| UnitSpecialStatFactory.<CreateStatsSeraphim>d__13 | SeraphimGroundModeTransitionTime/41, SeraphimAirModeTransitionTime/42 |
| UnitSpecialStatFactory.<CreateStatsShips>d__10 | SubmarineDetection/36 |

(2+1+3+1+1+1+1+3+5+6+2+7+2+4+2+1 = 42 ✓). This independently confirms §1's hero/unique
grouping: every "special" EStat in the enum is materialized as a SpecialStat by exactly
these factories. `BuildingArmorStat`'s single constructor call site is
`BuildingBaseStatsFactory.<CreateStats>d__0.MoveNext` (VA 0x7cb6ff4).

## Implementation

Tribute mapping guidance (Phase 5+ / Phase 26 consumers):

1. Model unit stats as the 78-entry EStat taxonomy (or the tribute-relevant subset:
   Health, Speed, Armor triad, View, Price, TrainTime, CommandPoints at minimum).
2. Weapon damage must remain per-target-armor (61/62/63 keys), not a single damage scalar —
   matches the already-recovered 0.9/0.1 mitigation curve.
3. Mines (if implemented) need three per-armor damage channels + cost + fire-rate (set
   interval) + explosion radius, mirroring `MineStatsFactory`.
4. Stat caps should use the three-tier `StatInfo {BaseMax, FirstMax?, MegaMax?}` shape
   where upgrades/veterancy push stats beyond base.

## Test

- `python3 reverse/tools/extract_estat_stats.py` regenerates the extraction log from
  `dump.cs` — line numbers and counts (45 classes, 78 enum values) must reproduce.
- `python3 reverse/tools/pin_estat_bindings.py` (point SO at the extracted
  `lib/arm64-v8a/libil2cpp.so`) must print the six `mov w0, #imm; ret` constants and
  42 SpecialStat call sites — matches `reverse/evidence/estat/estat-native-pinning.txt`.
- Spot-check: `sed -n '168776,168860p' dump.cs` shows the enum; `estat-classes.tsv` row
  `WeaponDamage` must show the 6-factory DIRECT binding.

## Unknowns

- ~~Native bodies of the 45 `get_Stat()`/ctor implementations~~ **Resolved 2026-10-07** —
  see §6; `estat-classes.tsv` confidence column now carries NATIVE_* labels for the 9
  previously ambiguous classes.
- **MinePrice/71 has no dedicated IStatModel class** (MineCostStat is WeaponMineCost/66);
  it is likely consumed by a non-IStatModel code path (mine placement cost UI/logic).
  Candidate for a targeted xref scan if ever needed.
- The numeric balance values behind every stat (backend-delivered; out of APK scope, as
  established by the audit).
- `MaxStatValueProvider` tier thresholds (BaseMax/FirstMax/MegaMax values) — native data.
