# Version Drift: FileUpload collection (6.5.22) vs current binary (6.9.18)

Created: 2026-10-06 (FileUpload/AOW3 audit)
Status: **UNRESOLVED** (for the two constants listed in §C); the remainder is classified version drift, not contradiction.

## Context

- External side: name lists derived from `com.geargames.aow` **6.5.22** (versionCode 38820),
  provenance `FileUpload/AOW3/*` (see `reverse/external/fileupload-aow3/manifest.md`).
- Current side: `dump.cs` of **6.9.18** (Il2CppDumper 6.7.46, metadata v31), this repository.
- Rule applied: external material never overrides direct evidence; conflicts are recorded, not merged.

## A. Command-layer restructuring (EXPLAINED — architecture change, not error)

| 6.5.22 (external) | 6.9.18 (current dump) |
|---|---|
| Event-facade methods `addCommandUnitMove`, `addCommandUnitDamage`, `addCommandBuildingStartTrain`, `addCommandBuildingNuclearLaunch`, `addCommandHeroAbilityActiveTargeting`, … (~120 names) | First-class message types `AICommUnitsMove`, `AICommUnitsStop`, `AICommUnitsHoldPosition`, `AICommBuSet`, `AICommUnitsBombard` (=5307), `AICommUnitsPsionic`(=5310), plus `GAICommand*` class families and `GAI_COMMAND_*` constants (146/146 names shared) |
| `AICommandsAtTick`-style tick command stream | Present in both (`AICommandsAtTick`, `AICommandsAtTickST{Serializer,Deserializer}`) |

Interpretation: the 6.5.22 facade methods were event-add accessors over the command bus; by 6.9.18
the same domain is expressed as explicit message classes. Domain coverage (move, damage, shoot,
train, nuclear, hero abilities, tutorial, redeploy) is conserved.

## B. Renamed / removed methods (CONFIRMED DRIFT — 6.5.22 names absent from 6.9.18 dump)

Verified by exact + fuzzy search over the full 6.9.18 `dump.cs` (case-insensitive, substring):

`calcBasicDamage`, `generateBasicDamage`, `generateMineDamage`, `calcCoilTankArmorBonusFrontal`,
`calcDamageByCommandoJump`, `calcGatlingWeaponMax`, `calcFireDistanceMisc`, `calcFireOrientBu`,
`calcEnergySupply`, `calcAtlasActiveAbilityShotDistanceAndAngle`, `seraphimMovesToLandingPlace`,
`flySeraphimTurbo`, `get_Bat*` family (≈25 battle-statistic getters incl. `get_BatCerberKnifeKill`,
`get_BatTyphoonKillHero`), `addCommandTutorialFinishCondition*` family, `addCommandSideHeroSlot*`,
`setPvEBattleResults`/`setPvPBattleResults`, `adjustRedeploySupplyConstruction`,
`addCommandBuildingRedeploy*`, `seizeFire`, `stopSiegeUnit`, `tryGatlingPassiveShoot`, and others.

Full list with per-name verdicts: `reverse/external/fileupload-aow3/evidence/6.5.22/methods-vs-6.9.18-verification.txt`.

Caveat: the external lists are a **curated subset** (keyword-derived by the producing session);
absence of a name from that list is weak evidence of absence from 6.5.22, and presence in 6.5.22
does not imply presence in 6.9.18. The 6.9.18-side search, however, was exhaustive (full dump).

Related domain continuity (6.9.18 equivalents exist for most *concepts*): `CoilTank*` stats
(`CoilTankMaxTargetsStat` TypeDefIndex 396, `CreateStatsCoilTank`), `MineDamageFor{Light,Medium,Heavy}ArmorStat`
(399–401), `WeaponStatsFactory`, tutorial `LCTutorialFinishCondition*`/`GUIBattleTutorialQuestFinishCondition*`,
nuclear (`NuclearMissile`), siege (89 hits), gatling (109 hits), seraphim (107 hits).

## C. Constants claimed externally but absent from 6.9.18 (UNRESOLVED)

External claim (`aow3_documentation/Combat_System.md`, identifier-derived):
- `AttackCoeffCalculating` — "attack coefficient computation"
- `ARMOR_COEFF` — "armor coefficient for damage reduction"
- Formula shape: `DamageAfterArmor = BaseDamage * ArmorCoeff(ArmorType, WeaponType)`

Current binary: **0 hits** for both names in the 6.9.18 `dump.cs` (case-insensitive). The
per-armor-type damage triad we recovered (`WeaponDamage{Light,Medium,Heavy}Value` +
`CalculateWeaponArmorDamage`, constants 0.9/0.1) fully covers the observable behavior, so the
external "ArmorCoeff" shape is **redundant at best and unsupported at worst**.

Possible explanations:
1. renamed/moved between versions (e.g. inlined into `ArmorStatHelper`, which does exist in 6.9.18);
2. doc-author inference from VFX/asset naming rather than metadata (the doc cites constants
   elsewhere that do verify, so this one stands out);
3. string-based artifact of the producing session's keyword extraction.

Required next step: **native analysis of `ArmorStatHelper`** in 6.9.18 (`libil2cpp.so`,
function identified from dump.cs) to confirm whether any armor-coefficient multiplier exists
outside `CalculateWeaponArmorDamage`. Until then, the browser implementation must keep using the
recovered 0.9/0.1 mitigation curve — no change.

## D. No value-level conflicts

The collection contains **no numeric balance values** (no HP/damage/cost/speed tables), so no
value-level conflict is possible. All balance remains backend-delivered per current knowledge;
this audit found nothing that changes that conclusion.
