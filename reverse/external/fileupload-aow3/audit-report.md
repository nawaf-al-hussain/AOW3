# FileUpload/AOW3 External Collection — Audit Report

Audit date: 2026-10-06
Scope: 7 archives (~144 MB compressed, 106,214 files extracted) from `FileUpload/AOW3/`
Reference evidence: this repository's v6.9.18 evidence chain (`dump.cs` Il2CppDumper 6.7.46,
`stringliteral.json`, `reverse/notes/combat-stats.md`, pipeline asset indexes).

---

## Executive Summary

The collection is **not** source code and **not** a balance-data trove. It is the workspace
snapshot of a **prior AI-assisted analysis session** ("phase 12") targeting a **different game
version than the one this repository analyzes**: the embedded APK is `com.geargames.aow`
**6.5.22 (versionCode 38820)**, while this repository's evidence chain is built on **6.9.18**.

Concretely, the collection contains four things (each duplicated 2–3× under different filenames):

1. A **jadx decompilation of the Android Java layer** of the 6.5.22 APK — 99% ad/analytics/AndroidX
   SDK boilerplate; 20 game-specific files (logging, ANR watchdog, push). **No gameplay code exists
   in Java** — AOW3 gameplay is IL2CPP native, so the filename `artofwar3_source_code.zip` is
   misleading. This is classification D/J at best; mostly noise.
2. **IL2CPP name lists** for 6.5.22 (1,247 curated method names in 9 categories, 25,017 type names,
   9,552 game types with namespaces, 753 GAI-command names/constants) — the highest-value material:
   a **cross-version structural reference** for how the codebase changed 6.5.22 → 6.9.18.
3. **Identifier-derived documentation** (23–37 markdown files) — plausible structural analysis
   (architectures, pipelines, class taxonomies) with **no numeric balance tables and no hard
   formulas**. Every "formula" is pseudocode reconstruction. Useful as a lead database; not evidence.
4. **Raw metadata-derived exports** (`string_table.txt`, `type_definitions.json`, curated identifier
   lists) — 6.5.22-specific, superseded in authority by our own 6.9.18 dump.

**No conflict with the current combat model was found** — because the collection contains no
numeric combat claims at all. Its combat content is name-level only, and names overwhelmingly
verify against 6.9.18 (below).

## Verification against the current 6.9.18 binary

Method: programmatic cross-match of external names against method/class name sets extracted from
our `dump.cs` (Il2CppDumper 6.7.46, v6.9.18), plus targeted greps for the docs' specific claims.
Representation differences (compiler lambdas, interface-explicit implementations, generic arity
suffixes) were classified separately before counting a name as genuinely absent. Full table:
`evidence/6.5.22/methods-vs-6.9.18-verification.txt`.

| Check | Result | Verdict |
|---|---|---|
| `CalculateWeaponArmorDamage` (external methods_damage.txt) | Present in 6.9.18, dump.cs:168923 — same signature we already recovered constants 0.1/0.9 for | **CONFIRMED** |
| 1,247 curated method names | 913 exact match (73.2%), 81 compiler artifacts, 9 interface-explicit → effective structural agreement ≈ 80.5%; 244 not found | **HIGH (structure)** |
| `GAI_COMMAND_*` constants (external gai_commands.txt) | 146/146 names match the 6.9.18 constants block (`public const int GAI_COMMAND_… = NNNN`; 6.9.18 has 147 — one addition) | **CONFIRMED** |
| GAICommand class families (753 names incl. Component/STSerializer/STDeserializer) | 603 exact class-name matches; remainder are enum-constant names, base-name and generic-arity representation forms | **CONFIRMED** |
| Command layer: `UnitsMove/UnitsStop/UnitsHoldPosition/UnitsBombard/UnitsPsionic/BuSet` | 6.9.18 has `AICommUnitsMove`, `AICommUnitsStop`, `AICommUnitsHoldPosition`, `AICommBuSet`, `AICommUnitsBombard`(const 5307), `AICommUnitsPsionic`(const 5310) | **CONFIRMED** |
| `Multiplayer_Architecture.md` claim: RSA/DES network crypto | 6.9.18 dump contains `AbstractNetworkCryptoProvider`, `DESNetworkCryptoProvider`, `RSANetworkCryptoProvider`, `EmptyNetworkCryptoProvider`, `CSCryptographyInitializer : …<RsaDesPacketAnswer>` | **CONFIRMED** |
| `Multiplayer_Architecture.md` claim: per-match battle hosts + desync tooling | `CSPingBattleHosts`, `CSPingBattleHostsOnMain`, `AICommandsAtTick` + serializer/deserializer pairs (1,529 message classes) | **CONFIRMED** |
| Weapon architecture claims (`AbstractClientWeapon`, `AbstractWeaponEngine`, `AdditionalWeaponSettings`, `BurstWeaponSettings`) | All present (66 / 7 / 2 / 2 hits) | **CONFIRMED** |
| Combat helpers claimed by docs: `ArmorStatHelper`, `SafeSetDamageStat`, `HitToGround`, `HitToVehicle`, `RailgunArmorPiercing`, `BeholderSightDamageDelay`, hero types Atlant/CoilTank/Beholder/Seraphim/Leviathan/Typhoon/Cerber/Firebat | All present in 6.9.18 dump | **CONFIRMED** |
| Super-weapon / nuclear subsystem claimed by docs | `SuperWeapon` (114 hits), `NuclearMissile` (6) in 6.9.18 | **CONFIRMED** |
| External constants `AttackCoeffCalculating`, `ARMOR_COEFF` | **0 hits in 6.9.18** dump | **CONFLICTING/UNVERIFIED** (see Conflicts) |
| 6.5.22-only methods: `calcBasicDamage`, `generateBasicDamage`, `generateMineDamage`, `calcCoilTankArmorBonusFrontal`, `calcDamageByCommandoJump`, `calcGatlingWeaponMax`, `calcFireDistanceMisc`, `addCommand*` facade (~120 names), `get_Bat*` battle-stats getters, `addCommandHeroAbility*` family | Absent from 6.9.18 dump under these names | **CONFIRMED version drift** (see Conflicts) |
| VFX asset names (`fire_rifle1_s1`, `bul_rifle1_s2`, `expl_rocket1`, …) | Checked twice 2026-10-07: extracted-zip pass (`fire_` audio family) then the **full Addressables-catalog pass** on the 6.9.18 XAPK — `fire_rifle1_s1.prefab` and `bul_rifle1_s2.prefab` exist **verbatim**; `bul_`=51, `fire_`=24, `expl_`=0 (explosions are `boom_expl*_s*`; rockets are `bul_rocket*`) | **CONFIRMED (HIGH)** — `reverse/notes/vfx-asset-prefix-check.md` |
| Doc claim: three armor types only | Consistent with 6.9.18 `ArmorType {Light, Medium, Heavy}` (our combat-stats.md) | **CONFIRMED** |
| Doc claim: balance numbers in docs' stat tables | The collection contains **no numeric unit/weapon stat tables at all** — consistent with our finding that live balance is backend-delivered, not APK-embedded | **CONSISTENT** |

## Highest-Value Findings

1. **Cross-version command-layer mapping.** 6.5.22 exposed battle commands as an event facade
   (`addCommandUnitMove`, `addCommandBuildingStartTrain`, `addCommandBuildingNuclearLaunch`, …).
   6.9.18 represents the same domain as first-class message types (`AICommUnitsMove`, …) plus the
   `GAICommand*` family and `GAI_COMMAND_*` constant table. The external lists give us the
   **older network-command vocabulary** — useful when reading older replays/tools and for
   identifying which mechanics existed already in 6.5.22 (nuclear launch, siege, gatling,
   seraphim flight, coil-tank frontal armor, commando jump damage, mine damage, hero abilities,
   tutorial finish-conditions, redeploy/supply construction).
2. **Confirmation that our recovered combat core is version-stable.** The damage pipeline names
   (`CalculateWeaponArmorDamage`, `SafeSetDamageStat`, `CreateDamageForMediumArmor`,
   `GetDamageForMediumArmor`, `GetSuperWeaponDamageForHeavyArmor`, `WeaponDamage{Light,Medium,Heavy}Value`)
   exist in **both** versions, supporting MEDIUM-HIGH confidence that the 0.9/0.1 mitigation curve
   we recovered is not a 6.9.18-local artifact (constants themselves still need native verification
   in 6.5.22 — not possible without that binary).
3. **A 9,552-entry game-type inventory with namespaces for 6.5.22** (`game_types.json`) — a clean
   map of the older codebase's system boundaries (AOW_Assets.Scenes.Battle.* GUI taxonomy,
   com.geargames.aow.entities/scenes/services), useful for scoping future IL2CPP work.

## Verified Findings

See the verification table above. In short: **every checkable structural claim in the external
documentation that we tested against 6.9.18 held up** (armor triad, weapon-engine classes,
RSA/DES crypto, battle-host connection model, GAI command system, command vocabulary,
super-weapon/nuclear subsystem, hero roster names). The external docs show no fabricated
subsystems — their weakness is **unquantified inference**, not invention.

## Unverified Findings (leads, not evidence)

| Claim (source file) | Why unverified | How to verify |
|---|---|---|
| Weapon VFX/asset naming scheme `fire_rifle1_s1…`, `bul_…`, `expl_…` (Combat_System.md) | ~~Asset-bundle paths; absent from stringliteral.json~~ **CONFIRMED 2026-10-07** via the 6.9.18 Addressables catalog: 2 of 3 example names verbatim, `expl_` real as the `boom_expl*` variant token | CLOSED — full pass in `reverse/notes/vfx-asset-prefix-check.md` + `reverse/evidence/vfx-catalog-families-6.9.18.txt` |
| `DamageAfterArmor = BaseDamage * ArmorCoeff(ArmorType, WeaponType)` "ArmorStatHelper" formula shape (Combat_System.md) | Pseudocode reconstruction; constants `AttackCoeffCalculating`/`ARMOR_COEFF` absent from 6.9.18 | Native analysis of `ArmorStatHelper` in 6.9.18 (`dump.cs` hit exists); runtime observation |
| Multiplayer server topology (3 server roles, auth/tick/desync flow details) (Multiplayer_Architecture.md) | Derived from class names + speculation; server-side behavior not in APK | Runtime observation (Frida) or traffic capture; low priority for the offline tribute |
| `ATTACK_INTERVAL_{LAND,WATER,FIGHTER,BOMBER,NUCLEAR}` enum semantics (Combat_System.md) | Enum names not located in 6.9.18 dump under these names; **EStat extraction 2026-10-07 shows the 6.9.18 representation**: single `WeaponFireRate/60` stat + per-weapon balance rows | ~~Locate the real enum~~ RESOLVED AS REPRESENTATION DRIFT — `reverse/notes/units/estat-stat-models.md` §5 |
| Economy constants and "energy/supply" model details (Economy_System.md) | ~~Doc gives structure, no numbers, and 6.5.22-era naming~~ **Structure checked 2026-10-07**: 6.9.18 `EStat` enum confirms the whole energy/supply vocabulary (SupplyIncome/14, EnergyProduction/15, EnergyNeed/16, EnergyReserve/24, EnergyConsumption/25, EnergyRegeneration/28) plus dedicated stat classes | ~~Recover `EStat`-linked stat models~~ DONE — full 78-value EStat taxonomy + 45 IStatModel classes in `reverse/notes/units/estat-stat-models.md` |

## Incorrect / Rejected Findings

- **"source_code" / "artofwar3_source_code.zip" as original source** — REJECTED as mislabeled:
  it is a jadx Java-layer decompile of SDK boilerplate. No original C# source exists anywhere in
  the collection (consistent with IL2CPP: no C# source ships in the APK).
- **"Complete_Analysis" / "complete" / "phase12" completeness claims** — REJECTED: the docs omit
  every numeric system (no damage values, no costs, no production times, no speeds) and contain
  zero binary-anchored references (no addresses, no offsets, no function hashes). They are
  structural sketches, not a complete analysis.
- Any implied authority of the docs over the current binary evidence — REJECTED per the
  source-of-truth hierarchy; nothing in the collection outranks even our weakest direct evidence.

## Conflicting Findings

No conflicts with recovered **formulas or values** (the collection asserts none). Name-level
conflicts are **version drift, not contradiction**, and are recorded in
`reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`:
`addCommand*` facade vs `AIComm*`/`GAICommand*` message layer; ~120 renamed/removed methods
(`calcBasicDamage`, `generateMineDamage`, `calcCoilTankArmorBonusFrontal`, `seraphim*`, `get_Bat*`,
`addCommandHero*`, tutorial-finish-condition commands, etc.); `AttackCoeffCalculating`/`ARMOR_COEFF`
constants present in 6.5.22-era material but absent from the 6.9.18 dump (status UNRESOLVED —
could be renamed, moved to native, or doc-author inference; requires 6.9.18 `ArmorStatHelper`
native analysis).

## Version Differences

| Dataset | Version | Evidence |
|---|---|---|
| jadx Java tree + raw_extract (both archives) | 6.5.22 (38820), compileSdk 35, Billing 8.0.0 | Decoded AndroidManifest.xml ×2 |
| IL2CPP name lists, gai_commands, game_types(.json) | 6.5.22 (derived from that APK's metadata) | Same-session provenance + drift profile vs 6.9.18 |
| All documentation | Written against 6.5.22 evidence | Naming matches 6.5.22 lists; no 6.9.18-only names (e.g. no `AIComm*` class names) |
| This repository's evidence | 6.9.18 | `reverse/README.md`, manifest hash chain |

Cross-version stability observed: GAI command system 100% stable at constant-name level
(146 shared names; +1 in 6.9.18); combat pipeline names stable; network/messaging layer
restructured (facade → message classes); battle-stats and hero-ability command surface expanded.

## New Reverse-Engineering Leads

1. `ArmorStatHelper` (6.9.18, 1 dump hit) — native analysis would resolve the
   `AttackCoeffCalculating`/`ARMOR_COEFF` UNRESOLVED conflict and confirm whether the external
   "ArmorCoeff" shape has any reality in 6.9.18.
2. `CreateDamageForMediumArmor` / `GetDamageForMediumArmor` / `GetSuperWeaponDamageForHeavyArmor` —
   present in both versions; not yet analyzed natively by us; may reveal how the per-armor-type
   damage ints map to `CalculateWeaponArmorDamage` inputs.
3. `MineDamageFor{Light,Medium,Heavy}ArmorStat` IStatModel classes (6.9.18 dump, TypeDefIndex
   399–401) — the external lists confirm mines existed in 6.5.22 too; candidate for a
   hazards/damage-cause model in the tribute.
4. `addCommandBuildingRedeploy*`, `adjustRedeploySupplyConstruction` (6.5.22) — redeploy mechanic
   never analyzed by us; check whether 6.9.18 has an equivalent under a new name.
5. Tutorial command surface (`addCommandTutorialFinishCondition*`, 6.5.22) vs 6.9.18
   `LCTutorialFinishCondition*`/`GUIBattleTutorialQuestFinishCondition*` — naming evolution
   confirms tutorial engine; not gameplay-critical but useful for campaign-mode planning.

## Imported Evidence

Under `reverse/external/fileupload-aow3/evidence/6.5.22/` (see `evidence/README.md` for provenance):

- `methods-vs-6.9.18-verification.txt` — all 1,247 external method names with per-name verdict
  (MATCH / COMPILER_ARTIFACT / INTERFACE_EXPLICIT / NOT_FOUND) against the 6.9.18 dump.
- `version-drift-methods.txt` — the 244 names not found, pre-classified (facade family vs
  genuine drift candidates).
- `methods_{damage,unit,weapon,building,battle,economy,hero,network}.txt` — original 6.5.22
  lists, unmodified.
- `gai-commands-6.5.22.txt` + `gai-commands-vs-6.9.18.md` — original list + 100%-match
  verification note.
- `game-types-6.5.22.json` — 9,552 game-namespace types with namespaces (from phase12
  `game_types.json`, filtered of compiler-artifact entries? No: retained as-is, unmodified).
- `game-identifiers.json`, `namespaces.json` — original metadata-derived groupings, unmodified.

Analysis records: `audit-report.md` (this file), `reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`,
`reverse/versions/6.5.22-fileupload-collection.md`, `reverse/external/fileupload-aow3/manifest.md`.

## Rejected Evidence (excluded from import, with reasons)

- 105,822 jadx `.java` files — third-party SDK boilerplate, no gameplay evidence, legal exposure
  disproportionate to value. The 20 game-specific Java files are documented by name in the
  manifest (logger + nativeplugins: `GGNativeUtils`, `ANRWatchDog*`, `PushUtils`,
  `AdvertisingInfoReader`, …) and can be fetched from the original archive if ever needed.
- `string_table.txt` (100,000 strings), `type_definitions.json` (29,334 index-based records),
  `game_strings.txt` (15,364 identifiers), `geargames_identifiers.txt` (334) — raw/superseded;
  our 6.9.18 `dump.cs` + `stringliteral.json` are strictly stronger for current work; the 6.5.22
  originals remain in the preserved archive and in FileUpload.
- Generated visualizations (PNG/graphviz/HTML dashboard/cypher/CSV exports) — regenerable.
- `knowledge_graph*.json/graphml` — derivative of the same name lists; no independent evidence value.

## Tools Assessment (§29)

Four Python scripts found (`generate_pngs.py`, `generate_system_map.py` ×2 locations each).
Inspected before execution decision: pure visualization generators (graphviz, matplotlib), no
network I/O, no subprocess, no filesystem deletion, hardcoded output paths. **Not executed**
(no need — their outputs ship in the archive). Classified SAFE-UNUSED.

## Browser Implementation Impact

**None authorized at this stage** (audit-only task; `docs/game.js` untouched).

For the implementation team, later eligible items (pending their own verification per
`docs/AOW3_DEVELOPMENT_PLAN.md` Phase 27 workflow):

1. No balance-value imports are possible (collection has none) — no gameplay-tuning changes
   justified from this collection.
2. The confirmed command vocabulary (`AIComm*` names + `GAI_COMMAND_*` constants) can inform
   **naming** of the planned `simulation/` command layer (Phase 4 of the dev plan) — cosmetic,
   zero behavioral authority.
3. If Phase 5 (Combat Reconstruction) takes up lead #2 above
   (`CreateDamageForMediumArmor` native analysis), that work was *motivated* but not *enabled*
   by this collection.
4. Hazards (mines) and the redeploy mechanic (lead #3/#4) are candidate features for later
   passes; the external material is only evidence that they existed in 6.5.22.

## Remaining Unknowns

- Whether 6.5.22's `CalculateWeaponArmorDamage` used the same 0.9/0.1 constants (needs the
  6.5.22 binary or a runtime probe — out of scope here).
- Whether `AttackCoeffCalculating`/`ARMOR_COEFF` exist in 6.9.18 under different names.
- ~~Whether the doc's VFX naming scheme matches our extracted asset catalog.~~ **Settled
  2026-10-07 (CONFIRMED HIGH)** via the 6.9.18 Addressables catalog — verbatim agreement on
  two of three claimed examples (`reverse/notes/vfx-asset-prefix-check.md`).
- The producing session's own tooling and any filtering it applied to the name lists
  (the curated 1,247-name subset looks keyword-derived; absence of a name from the list is
  weak evidence of absence from the game).

## Recommended Next Investigations (ranked)

1. ~~**Native analysis of `ArmorStatHelper` in 6.9.18**~~ — **DONE 2026-10-06**: claim REJECTED,
   conflict RESOLVED. See `reverse/notes/armor-stat-helper-native-analysis.md` and the §C Resolution
   in `reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`. No coefficient exists outside
   `CalculateWeaponArmorDamage`; the analysis also natively covered the item-2 wrappers below.
2. **Native analysis of `CreateDamageForMediumArmor` / `GetDamageForMediumArmor`** (completes the
   damage-pipeline reconstruction beyond `CalculateWeaponArmorDamage`).
3. ~~**Check the asset catalog** for `fire_*`/`bul_*`/`expl_*` prefixes~~ — **DONE 2026-10-07,
   upgraded same day**: CONFIRMED (HIGH). Full XAPK pass: 7 APKs unpacked, 6.9.18 Addressables
   catalog parsed (832 asset addresses) — `fire_rifle1_s1.prefab` + `bul_rifle1_s2.prefab`
   exist verbatim, 41 `bul_` + 18 `fire_` VFX prefabs, explosions are `boom_expl*_s*`
   (incl. nuke). See `reverse/notes/vfx-asset-prefix-check.md`.
4. ~~**Extract EStat-linked IStatModel stat list from 6.9.18 dump**~~ — **DONE 2026-10-07 +
   native pinning same day**: full 78-value `EStat` taxonomy + 45 `IStatModel` classes in
   `reverse/notes/units/estat-stat-models.md` + `estat-classes.tsv`; **all 9 previously
   ambiguous bindings natively pinned** (6 constant `get_Stat` returns, both armor stats
   routed via `ArmorStatHelper.GetArmorMeta`, `SpecialStat` enumerated by 42 call sites;
   `MineCostStat`→WeaponMineCost/66, not MinePrice/71). Evidence:
   `reverse/evidence/estat/estat-native-pinning.txt`; tool:
   `reverse/tools/pin_estat_bindings.py`. Resolves the Economy_System.md and ATTACK_INTERVAL
   rows above.
5. Only if a 6.5.22 binary ever becomes available: re-dump and diff against these lists to turn
   the drift file into a precise changelog.

---

## FileUpload/AOW3 Audit — Required Handoff (§42)

### Archives Audited
7 of 7 (list + hashes in `manifest.md`): ArtOfWar3_Complete_Analysis.zip, artofwar3_complete_phase12.zip,
artofwar3_phase12_visualization_package.zip, artofwar3_source_code.zip, aow3_documentation.zip,
aow3_java_sources.zip, aow3_source_data.zip.

### Files Extracted
106,214 (754 MB). No nested archives. No executables. Full JSON inventory preserved at audit
workspace `manifests/file-inventory.json` (outside repo; summarized in manifest.md).

### Game Versions Found
6.5.22 (versionCode 38820) — the only version present, across all datasets.

### Highest-Value Discoveries
Cross-version command-layer vocabulary (6.5.22 `addCommand*` facade vs 6.9.18 `AIComm*`),
100%-stable `GAI_COMMAND_*` constant table, confirmation that the combat pipeline names are
version-stable, and a clean 9,552-type 6.5.22 codebase map.

### Newly Recovered Systems
None fully new; leads opened: mines (per-armor-type mine damage stat models), redeploy/supply
construction, coil-tank frontal armor bonus, commando jump damage, seraphim landing behavior,
hero ability command surface (6.5.22 form).

### Verified Findings
See verification table (all structural claims tested → held; GAI constants 146/146; ~80% effective
method-name agreement after representation differences).

### Unverified Findings
VFX naming scheme, ArmorCoeff formula shape, server topology details, attack-interval enum
semantics, economy details — table above with verification paths.

### Incorrect/Rejected Findings
"source_code" as original source; "Complete/Definitive" completeness of the docs; any authority
of the docs over direct binary evidence.

### Conflicts
Only version drift (recorded as conflict record — **now RESOLVED**: native analysis 2026-10-06
rejected the `AttackCoeffCalculating`/`ARMOR_COEFF` claim; see §C Resolution in
`reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`).

### Imported Files
Listed under "Imported Evidence" above — 14 files added under `reverse/`, all ≤ ~2.5 MB total,
each with provenance in `evidence/README.md`.

### Provenance
Prior AI-assisted analysis session ("phase 12", workspace paths `/home/z/my-project/project/…`),
tooling jadx + Il2CppDumper-style enumeration, against APK 6.5.22 (38820). Exact dump tool/version
not recorded by the producing session — noted as provenance gap.

### Binary Validation
All validation performed against this repository's own 6.9.18 `dump.cs` (Il2CppDumper 6.7.46,
metadata v31) and `stringliteral.json` — per source-of-truth hierarchy levels 5 (same-version IL2CPP
dump) and above; external material never allowed to outrank it.

### Runtime Validation
None — the original Android game was not instrumented in this audit. Nothing imported carries
runtime-verified status.

### Browser Impact
Zero immediate changes to `docs/game.js` (audit-only mandate). Four later-stage, verification-gated
impacts recorded under "Browser Implementation Impact".

### Remaining Unknowns / Next Investigations
See the two sections above.
