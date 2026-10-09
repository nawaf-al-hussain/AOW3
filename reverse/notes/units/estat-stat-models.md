# EStat taxonomy & IStatModel stat-model inventory (6.9.18) — bindings natively pinned

Created: 2026-10-07 (follow-up to the FileUpload/AOW3 audit — closes audit-report
"Recommended Next Investigations" item #4 and the Economy_System.md row of
"Unverified Findings"). **Follow-up the same day: all 9 previously ambiguous class→EStat
bindings were pinned by native disassembly of `libil2cpp.so` (§6) — 0 ambiguities remain;
§6.7 (same day) additionally resolved the MinePrice/71 consumer** (max-tier cap key of
`MineCostStat.CalculateProgress`).

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
- MinePrice/71 consumer: **CONFIRMED (native)** — interface tail-call in
  `MineCostStat.CalculateProgress` (§6.7); whole-binary direct-literal scans returned
  zero competing sites.
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
dump-name guess `MinePrice` was wrong as a *value-channel* key. EStat **MinePrice / 71**'s
real role was pinned natively the same day (§6.7): it is the **max-tier cap key** consumed
by `MineCostStat.CalculateProgress`.

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

### 6.7 MinePrice/71 resolved — the max-tier cap key of the mine-cost stat (2026-10-07)

The last Unknown from the pinning pass: EStat 71 appears in no `get_Stat` constant, no
direct-BL call site, and no UI icon/name/color logic (whole-binary scans: 0 hits in
every EStat-taking method's call sites, 0 `cmp #0x47` after any `get_Stat`, 0 literal
71 inside the icon/color/parsing pipeline — `reverse/evidence/damage-pipeline/mineprice71-xref.txt`).
The single literal-71 instruction in the entire mine surface is an **indirect interface
tail-call** inside `MineCostStat.CalculateProgress` (VA 0x80e8e5c):

```
0x80e8e90: ldr  x19, [x19, #0x18]   ; m_max (IMaxStatValueProvider)
...                          ; resolve IMaxStatValueProvider.Get vtable slot
0x80e8f00: mov  w1, #0x47           ; EStat.MinePrice = 71
0x80e8f08: br   x3                  ; tail: m_max.Get(value, 71)
```

A sweep of all six mine stat classes' `CalculateProgress` bodies
(`reverse/tools/mine_getkey_sweep.py` → `reverse/evidence/damage-pipeline/mine-capkey-sweep.txt`)
shows each normalizes progress against the max provider under a fixed key:

| Class (get_Stat value channel) | CalculateProgress cap key |
|---|---|
| MineDamageForLightArmorStat (61) | 61 WeaponArmorLight (0x80e9818) |
| MineDamageForMediumArmorStat (62) | 62 WeaponArmorMedium (0x80e9ca0) |
| MineDamageForHeavyArmorStat (63) | 63 WeaponArmorHeavy (0x80e9390) |
| MineExplosionRadiusStat (64) | 64 WeaponExplosionRadius (0x80ea138) |
| MineSetTimeStat (67) | 67 WeaponMineTime (0x80ea5cc) |
| **MineCostStat (66)** | **71 MinePrice (0x80e8f08)** — the only class whose cap key ≠ its value key |

**Verdict: `EStat.MinePrice/71` is the `MaxStatValueProvider` tier-cap key under which
mine-cost caps (BaseMax/FirstMax?/MegaMax) are registered; it is consumed exclusively by
`MineCostStat.CalculateProgress` via interface dispatch, has no dedicated IStatModel
class, no icon (`ico_stat_weapon_mine_cost` exists; no `ico_stat_*mine_price*` literal in
stringliteral.json), and no direct call-site references.** The enum name is accurate —
it is the mine's *price/cost cap* identity — but it is a cap-tier pseudo-key, not a
displayable stat. 45/45 class bindings unchanged; the 78-value EStat taxonomy now has a
native consumer account for all 78 values' usage surfaces.

## 7. Tier thresholds extracted natively — StatInfo {BaseMax, FirstMax?, MegaMax?} per EStat (2026-10-07)

Method: linear-disassembly parse of `MaxStatValueProvider..ctor(ILogger)` (VA 0x7CC0C00,
end 0x7CC1640) — the constructor that populates `m_statInfos : Dictionary<EStat, StatInfo>`
(field 0x10). Entry shapes observed: (a) float literals -> s0[/s1[/s2]] -> `bl StatInfo.Max1/2/3`
(0x7CC1640/0x7CC16F0/0x7CC1650, sret via x8) -> Add; (b) direct struct build
(`str wN,[sp,#0xC]` = BaseMax bits, `stp xzr,xzr,[sp,#0x10]` = nullables). Dictionary.Add
helper 0x7181154 (x0=dict, w1=key, x2=&StatInfo). Tool: `reverse/tools/extract_maxstat_tiers.py`;
full output: `reverse/evidence/estat/estat-tiers.txt`.

| EStat | BaseMax | FirstMax | MegaMax |
|---|---|---|---|
| Health / 1 | 8000 | 25000 | 45000 |
| Price / 2 | 1000 | 2600 | - |
| PriceUranum / 3 | 5 | - | - |
| CommandPoints / 4 | 15 | - | - |
| TrainTime / 5 | 150 | - | - |
| Speed / 6 | 100 | 450 | - |
| ArmorLight / 7 | 80 | 530 | - |
| ArmorMedium / 8 | 80 | 530 | - |
| ArmorHeavy / 9 | 80 | 530 | - |
| View / 10 | 20 | - | - |
| ConstructionRadius / 11 | 11 | - | - |
| ConstructionTime / 12 | 140 | - | - |
| CommandPointsProduce / 13 | 10 | - | - |
| SupplyIncome / 14 | 250 | - | - |
| EnergyProduction / 15 | 250 | - | - |
| EnergyNeed / 16 | 300 | - | - |
| BuildingSize / 17 | 9 | - | - |
| HealthRegeneration / 18 | 2000 | - | - |
| JumpRange / 19 | 7 | - | - |
| TransitionToMarchModeTime / 20 | 2.2 | - | - |
| TransitionToSiegeModeTime / 21 | 2.2 | - | - |
| MineDeactivationTime / 22 | 2 | - | - |
| DeminingSpeed / 23 | 100 | 450 | - |
| EnergyReserve / 24 | 300 | - | - |
| EnergyConsumption / 25 | 200 | - | - |
| ShieldStrength / 26 | 100 | - | - |
| ShieldRadius / 27 | 5 | - | - |
| EnergyRegeneration / 28 | 400 | - | - |
| ShieldActivationTime / 29 | 2 | - | - |
| ShieldDeactivationTime / 30 | 2 | - | - |
| FogRadius / 31 | 5 | - | - |
| FogActivationTime / 32 | 2 | - | - |
| FogDeactivationTime / 33 | 2 | - | - |
| MineDetection / 34 | 4 | - | - |
| ForestUnitDetection / 35 | 5 | - | - |
| SubmarineDetection / 36 | 10 | - | - |
| FuelReserve / 37 | 300 | - | - |
| FuelConsumption / 38 | 200 | - | - |
| RefuelingSpeed / 39 | 400 | - | - |
| CerberusWeaponSwitchTime / 40 | 2 | - | - |
| SeraphimGroundModeTransitionTime / 41 | 2 | - | - |
| SeraphimAirModeTransitionTime / 42 | 2 | - | - |
| WorkshopRepairRadius / 43 | 4.5 | - | - |
| WorkshopRepairSpeed / 44 | 150 | - | - |
| WorkshopModeTransitionTime / 45 | 2 | - | - |
| DeploymentTime / 46 | 60 | - | - |
| InitialResourceReserve / 47 | 2500 | - | - |
| SpaceStrikePreparationTime / 48 | 20 | - | - |
| LaunchPreparationTime / 49 | 20 | - | - |
| MissileFlightTime / 50 | 19 | - | - |
| MaxViewReachTime / 51 | 20 | - | - |
| PsiAttackSpeedReduction / 52 | 100 | - | - |
| PsiSlowdownDuration / 53 | 2.5 | - | - |
| WolverineMachineGunMaxAccelerationTime / 54 | 10 | - | - |
| CoilTankMaxTargets / 55 | 10 | - | - |
| CoilTankFrontalArmor / 56 | 530 | - | - |
| AtlasImmortalityTime / 57 | 10 | - | - |
| WeaponDistance / 58 | 16 | - | - |
| WeaponAccuracy / 59 | 100 | - | - |
| WeaponExplosionRadius / 64 | 2.5 | - | - |
| WeaponBombCount / 65 | 5 | - | - |
| WeaponMineTime / 67 | 7.5 | - | - |
| MinePrice / 71 | **30** | - | - |
| WeaponArmorLight / 61 | 300 | 4000 | 20000 |
| WeaponArmorMedium / 62 | 300 | 4000 | 20000 |
| WeaponArmorHeavy / 63 | 300 | 4000 | 20000 |
| WeaponSuperWeaponArmorLight / 72 | 300 | 4000 | 55000 |
| WeaponSuperWeaponArmorMedium / 73 | 300 | 4000 | 55000 |
| WeaponSuperWeaponArmorHeavy / 74 | 300 | 4000 | 55000 |
| WeaponSuperWeaponCommandPoints / 75 | 40 | - | - |
| WeaponSuperWeaponDistance / 76 | 100 | - | - |
| WeaponSuperWeaponExplosionRadius / 77 | 12 | - | - |

Findings:

- **72 of 78 EStats are registered** with an explicit cap. Unregistered: 0 (None —
  the prebuilt `{BaseMax 1.0}` placeholder entry is registered under key 0 first),
  **60 WeaponFireRate, 66 WeaponMineCost, 70 WeaponSuperWeaponCP** — these three run
  uncapped (or are capped elsewhere); consistent with 66 being the mine-cost VALUE
  channel while its cap key is 71 (§6.7, now with the value: **MinePrice/71 cap = 30**).
- Three-tier (base/first/mega) caps exist only for Health (8000/25000/45000) and the
  six+three weapon-armor damage keys (61/62/63 = 300/4000/20000; 72/73/74 =
  300/4000/55000) — the veterancy/mega-upgrade surfaces. Two-tier caps: Price,
  Speed, the armor triad (80/530), DeminingSpeed.
- The 0.9/0.1 mitigation curve (armor note §3.2) consumes `Get(value, EStat)` BEFORE
  tier clamping for keys 61-63/72-74; these caps are the progress-bar maxima for the
  UI stat panels, i.e. the display normalization domain, not additional sim math.

Classification: **CONFIRMED (native, literal extraction)** — the table is a direct
read-out of constructor literals, not inference. Reproduce with
`python3 reverse/tools/extract_maxstat_tiers.py`.

## Implementation

Tribute mapping guidance (Phase 5+ / Phase 26 consumers):

1. Model unit stats as the 78-entry EStat taxonomy (or the tribute-relevant subset:
   Health, Speed, Armor triad, View, Price, TrainTime, CommandPoints at minimum).
2. Weapon damage must remain per-target-armor (61/62/63 keys), not a single damage scalar —
   matches the already-recovered 0.9/0.1 mitigation curve.
3. Mines (if implemented) need three per-armor damage channels + cost + fire-rate (set
   interval) + explosion radius, mirroring `MineStatsFactory`; the cost stat's progress
   bar caps read from a separate `MinePrice/71` cap key, not from its value key 66.
4. Stat caps should use the three-tier `StatInfo {BaseMax, FirstMax?, MegaMax?}` shape
   where upgrades/veterancy push stats beyond base. **DONE (v=32, commit dcb393a):**
   the full 72-entry table is ported VERBATIM into the tribute sim kernel as
   `AOW3_MAX_STAT_TIERS` + `maxStatCap`/`maxStatGet` (the `IMaxStatValueProvider.Get`
   analog, rank-tier fallback chain, unregistered 0/60/66/70 pass through); the
   selection panel renders a CAP BASE/FIRST/MEGA progress bar (the native
   display-normalization domain). Tests: `reverse/evidence/tests/stat-caps.test.js`
   (37 vectors).

## Test

- `python3 reverse/tools/extract_estat_stats.py` regenerates the extraction log from
  `dump.cs` — line numbers and counts (45 classes, 78 enum values) must reproduce.
- `python3 reverse/tools/pin_estat_bindings.py` (point SO at the extracted
  `lib/arm64-v8a/libil2cpp.so`) must print the six `mov w0, #imm; ret` constants and
  42 SpecialStat call sites — matches `reverse/evidence/estat/estat-native-pinning.txt`.
- `python3 reverse/tools/mine_getkey_sweep.py` must print the six CalculateProgress cap
  keys (61/62/63/64/67 and 71 for MineCostStat) — matches
  `reverse/evidence/damage-pipeline/mine-capkey-sweep.txt`.
- Spot-check: `sed -n '168776,168860p' dump.cs` shows the enum; `estat-classes.tsv` row
  `WeaponDamage` must show the 6-factory DIRECT binding.

## Unknowns

- ~~Native bodies of the 45 `get_Stat()`/ctor implementations~~ **Resolved 2026-10-07** —
  see §6; `estat-classes.tsv` confidence column now carries NATIVE_* labels for the 9
  previously ambiguous classes.
- ~~**MinePrice/71 has no dedicated IStatModel class** (MineCostStat is WeaponMineCost/66);
  it is likely consumed by a non-IStatModel code path (mine placement cost UI/logic).
  Candidate for a targeted xref scan if ever needed.~~ **Resolved 2026-10-07** — §6.7:
  MinePrice/71 is the max-tier cap key consumed by `MineCostStat.CalculateProgress`
  (interface tail-call `m_max.Get(value, 71)`, VA 0x80e8f08); no other consumer exists.
- The numeric balance values behind every stat (backend-delivered; out of APK scope, as
  established by the audit).
- ~~`MaxStatValueProvider` tier thresholds (BaseMax/FirstMax/MegaMax values) — native data.~~ **Resolved 2026-10-07** — §7: full 72-entry table extracted from the ctor literals (`estat-tiers.txt`); MinePrice/71 cap = 30; only WeaponFireRate/60, WeaponMineCost/66, WeaponSuperWeaponCP/70 run unregistered.

## 8. Get/Calculate semantics decoded — Get returns a normalized fraction, not a clamp; factory column labels corrected (2026-10-09, Build J)

Evidence: `reverse/evidence/estat/estat-get-decode.txt` (full disasm of Get
0x7CC176C..0x7CC1A94, Calculate 0x7CC1A94..0x7CC1C18,
CalculateWeaponArmorDamage 0x7CC1C18..0x7CC1D94, StatInfo.Max1/2/3, binary-wide
BL caller scan, the §6.7 tail-call window). Full analysis:
`reverse/notes/maxstat-tier-band-decode.md` (Build J).

- **Get(value, stat) = Math.Min(fraction, 1.0)** — routing: `(1 << (stat-61)) & 0x3807`
  selects {61,62,63,72,73,74} → CalculateWeaponArmorDamage, everything else →
  Calculate. The v=32 tribute comment ("Get … clamp the value to the stat's tier
  cap") mis-describes the native contract: native Get is the stat-panel progress-bar
  FILL FRACTION in [0,1]. Over-cap values still return 1.0; the >1.0 intermediate
  only drives the NeedLogStatWithOverMaxValue telemetry (ClientEventPairList with
  the raw value, EStat name and caps — return value unaffected).
- **Calculate (non-armor), piecewise with extracted literals 0.8/0.15/0.05/0.95:**
  unregistered → v/BaseMax; v<=FirstMax → v/FirstMax*0.8; FirstMax<v<=BaseMax →
  (v-FirstMax)/(BaseMax-FirstMax)*0.15+0.8; v>BaseMax →
  (v-BaseMax)/(MegaMax??BaseMax-BaseMax)*0.05+0.95 (two-tier: div0 → inf → 1.0 via
  Get). Continuous 0→0.8→0.95→1.0.
- **CalculateWeaponArmorDamage (the six armor-damage keys), the native "0.9/0.1":**
  v<=BaseMax → 0.9*(v/(FirstMax??Base+v) + v/(Base*(1+Base/(First??Base)))) — a
  smooth curve hitting exactly 0.9 at v=BaseMax; v>BaseMax →
  0.9+(v-Base)*0.1/(Mega-Base) → 1.0 at MegaMax. 90% of the bar covers
  [0..BaseMax], the last 10% [BaseMax..MegaMax].
- **Factory mapping CORRECTED (bodies, not call sites):** Max1(v) → BaseMax=v;
  Max2(v1,v2) → FirstMax=v1, BaseMax=v2; Max3(v1,v2,v3) → FirstMax=v1, BaseMax=v2,
  MegaMax=v3. Verified at call sites: Health Max3(8000,25000,45000) →
  First=8000/Base=25000/Mega=45000; Price Max2(1000,2600) → First=1000/Base=2600.
  §7's table VALUES are untouched — the literals and their ascending order are
  correct; only the column LABELS BaseMax↔FirstMax swap for Max2/Max3 entries
  (Max1 entries were labeled correctly). The tribute's tier ladder (ascending
  rungs with fallback) is numerically unaffected.
- **Nullable<float> binary layout: { bool hasValue @+0; float value @+4 }** —
  has-value FIRST (Calculate's presence tests take the low byte of each 8-byte
  Nullable block and the value from the high word). Non-standard vs C# field
  order; matters for raw-struct reads.
- Hex correction to the Build I note: Value3/Value4 = 2197149770/2197149771 =
  **0x82F5D84A/0x82F5D84B** (Build I's §1.2 printed 0x82E23D2A/B — typo; decimals
  and XOR=1 were correct; re-verified from obfuz-pool-values.json this build).
- Get has ZERO direct BL callers (interface-map-walk dispatch; confirmed shape at
  the MineCostStat.CalculateProgress tail-call 0x80e8f08, `mov w1, #0x47`).
