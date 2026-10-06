# EStat taxonomy & IStatModel stat-model inventory (6.9.18)

Created: 2026-10-07 (follow-up to the FileUpload/AOW3 audit — closes audit-report
"Recommended Next Investigations" item #4 and the Economy_System.md row of
"Unverified Findings").

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
- Class→EStat name bindings: **CONFIRMED by name-match** for 24 classes (`MATCH`),
  **MATCH_STRIPPED** for 10 (Building*/Unit* prefix stripping), **INFERRED** for 8
  (mine-damage trio, mine cost/radius/set-time variants, armor pair, SpecialStat) — every
  binding ultimately set in native ctors via the `m_stat` field and only observable at
  runtime for the ambiguous cases.
- Damage-through-EStat flow: **CONFIRMED** (factories) + **HIGH** (native, from the
  ArmorStatHelper note).

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

- `python3 scripts/extract_estat_stats.py` (workspace copy) regenerates the TSV and
  extraction log from `dump.cs` — line numbers and counts (45 classes, 78 enum values)
  must reproduce.
- Spot-check: `sed -n '168776,168860p' dump.cs` shows the enum; `estat-classes.tsv` row
  `WeaponDamage` must show the 6-factory DIRECT binding.

## Unknowns

- Native bodies of the 45 `get_Stat()`/ctor implementations (which of the INFERRED
  candidates each ambiguous class actually returns) — resolvable with Capstone disassembly
  of ~8 short methods, reusing `reverse/tools/armor_native_analysis.py` machinery.
- The numeric balance values behind every stat (backend-delivered; out of APK scope, as
  established by the audit).
- `MaxStatValueProvider` tier thresholds (BaseMax/FirstMax/MegaMax values) — native data.
