# Phase 2 — Data-Model Extraction (6.9.18)

Created: 2026-10-07 (Task 17). Delivers `docs/AOW3_DEVELOPMENT_PLAN.md` **Phase 2 —
Extract the Game's Data Model**: a machine-readable representation of AOW3 gameplay
data, extracted from the IL2CPP evidence and wired into the tribute as structured
data modules instead of hardcoded tables in `game.js`.

## 1. What shipped (v=16)

### 1.1 Native-side, machine-readable (`reverse/evidence/data-model/`)

Regenerate with `python3 reverse/tools/extract_data_model.py` (input:
`/home/z/my-project/aow3-work/dump/dump.cs`, sha256 `0050e67d…24714b`,
63,922,449 bytes — the same file chain as `estat-stat-models.md` and the
armor/accuracy notes).

| File | Content |
|---|---|
| `estat.json` | complete `EStat` enum — 78 values, None=0..WeaponSuperWeaponExplosionRadius=77 (dump.cs:168776), plus `EStatCategory` {None/Base/Produce/Cost/Special} (dump.cs:168861) |
| `weapon-schema.json` | `WeaponTypeMapEditorConfig` — all 27 serialized fields with offsets 0x10..0x60 (dump.cs:256556): `m_weaponTableId, m_type, m_damageLight/0x18, m_damageMedium/0x1C, m_damageHeavy/0x20, m_hitBonus/0x24, m_distance/0x28, m_distanceMin/0x2C, m_explosionRadius/0x30, m_explosionDecr/0x34, m_velocity/0x38, m_bulletTrajectoryType/0x3C, m_gravity/0x3E, m_shotStart/0x40, m_shotInt/0x42, m_shotCount/0x44, m_flarePrepare/0x46, m_roundLen/0x48, m_coneAngle/0x4A, m_coneBaseline/0x4C, m_accuracyStatic/0x4E, m_accuracyDynamic/0x50, m_accuracyWalk/0x52, m_rotateDiap/0x54, m_rotateSpeed/0x56, m_aiming/0x58, m_fireType/0x60` |
| `unit-type-ids.json` | 43 `UnitType.UNIT_ID_*` constants + `UNIT_CATEGORY_*`/`SPEC_*` (dump.cs:395418) + the `HeroTypes` enum, 13 values None=0..Coiltank=12 (Cerber=1, Wasp=2, Seraphim=3, …, dump.cs:247449) |

### 1.2 Tribute-side, structured data modules (`docs/data/`)

Loaded by `index.html` before `game.js` (order: `stats` → `weapons` → `units` →
`buildings` → `factions` → `index`), assembled into `window.AOW3_DATA`.
Each module is also node-loadable (`globalThis`), which is what the test uses.

| Module | Export into `AOW3_DATA` |
|---|---|
| `stats.js` | `estat` (78, verbatim from dump), `estatCategory`, `fieldEstat` (tribute field → EStat), `weaponFieldMap` (tribute key → native field+offset), `tributeLocal` (documented non-native fields) |
| `weapons.js` | 19 named weapon configs (`w_<unit>` ×16, `w_bld_turret`, `w_bld_bunker`, `m_cerber_blades`); single source of truth, referenced by id |
| `units.js` | 18 unit defs (weapon/melee as `*Id` refs), per-unit native-id comment |
| `buildings.js` | `hq`, `depot`, 7 `buildings` (turret/bunker weapons as `weaponId` refs) |
| `factions.js` | `factions` (f1 Confederation build+hero orders, f2 Resistance build order), `producers`, `buildingsOrder`, `economy` |
| `index.js` | version marker, `nativeUnits` (evidence map, not consumed by sim), weapon-ref resolution so `def.weapon`/`def.melee` keep the pre-refactor runtime shape |

`game.js` no longer hardcodes any of these tables: lines 15-409 of the pre-patch
file (395 lines of literals) became a 19-line consumer block assigning
`UNITS/BUILD_ORDER_F1/F2/BUILD_ORDER/HERO_ORDER/HQ/DEPOT/BLD/BUILDINGS_ORDER/
PRODUCER_OF/ECONOMY` from `AOW3_DATA` (same names, same values). The two hardcoded
`power * 2` economy bonuses (pre-patch game.js:853-854) became
`ECONOMY.powerIncome` / `ECONOMY.powerCP` (values 2/2, numerically identical) —
they are the tribute's stand-in for the native `EnergyProduction/15` conversion.

## 2. Field ↔ native mapping (summary)

Full mapping lives as data in `docs/data/stats.js` (`fieldEstat`,
`weaponFieldMap`, `tributeLocal`); the load-bearing points:

- **Units:** health→`Health/1`, price→`Price/2`, cp→`CommandPoints/4`,
  trainTime→`TrainTime/5`, speed→`Speed/6`, armor.light/medium/heavy→`Armor
  Light/Medium/Heavy = 7/8/9`, view→`View/10`, regen→`HealthRegeneration/18`;
  armorClass→`ArmorType` enum (0/1/2, dump.cs:166696); kind→`UNIT_CATEGORY_*`.
- **Weapons:** damage.light/medium/heavy→`m_damage{Light,Medium,Heavy}`
  (EStat 61/62/63 through the `WeaponDamage` factories), range→`m_distance`
  (`WeaponDistance/58`), cooldown→`WeaponFireRate/60` as 1/rate,
  accStatic→`m_accuracyStatic/0x4E` (`WeaponAccuracy/59`), accWalk→
  `m_accuracyWalk/0x52`, splash→`m_explosionRadius/0x30`, explosionDecr→
  `m_explosionDecr/0x34`, projectileSpeed→`m_velocity/0x38`; `walkingShot` is the
  native `walking_shot` flag; `guided` is the native guided branch; `splashScatter`
  keys the native weaponType-27 scatter branch (approximation, see
  `weapon-accuracy-native-analysis.md`); `hitBonus`/`accDynamic` are recovered but
  unused in the tribute (Task 15 finding).
- **Buildings:** health→`Health/1`, price→`Price/2`, buildTime→
  `ConstructionTime/12`, view→`View/10`.
- **Economy:** baseIncome→`SupplyIncome/14` (`HqSupplyIncomeStat`),
  depotIncome→`SupplyDepotIncomeStat` (stat class, no dedicated EStat id),
  baseCP/depotCP→`CommandPointsProduce/13`, powerIncome/powerCP→
  `EnergyProduction/15` conversion.
- **Tribute-local (no native EStat; documented approximations/stand-ins):**
  captures, radius (collision), aura (Shield stand-in — native keys
  `ShieldStrength/26`/`ShieldRadius/27` exist but the browser implements a heal
  aura), Cerber melee crit/critMul, captureTimeNeutral/Enemy, presentation fields
  (card/tint/desc).

## 3. Value policy (unchanged, restated)

The APK ships **structure only**. Per-unit/per-weapon balance numbers are
delivered by the developer's live balance backend at runtime (established by the
FileUpload audit and consistent with `estat-stat-models.md` §Unknowns). Every
numeric value in `docs/data/*.js` remains a **gameplay-tuned approximation**,
documented here and in `combat-stats.md` §7. The extraction makes the *schema*,
*taxonomy*, and *identifier* surfaces machine-readable and verifiable; it does not
invent native values.

## 4. Behavior-neutrality guarantee

Pre-refactor tables were snapshotted to
`reverse/evidence/tests/data-model-fixture.json` (game.js v=15, lines 15-409,
evaluated via `vm`). The test suite
`reverse/evidence/tests/data-model.test.js` (265 assertions, all passing) verifies:

1. **Fixture equivalence** — resolved `AOW3_DATA` deep-equals the fixture for
   UNITS, BLD, HQ, DEPOT, PRODUCER_OF, BUILDINGS_ORDER, build orders, hero order,
   and all legacy ECONOMY keys; `powerIncome`/`powerCP` == 2.
2. **Taxonomy** — `estat` matches `estat.json` name-for-name, id-for-id (78/78);
   weapon schema anchors present; EStat spot anchors (7/9/10/18/40/41/59/60/61).
3. **Coverage** — every unit/weapon/melee field is EStat-mapped or explicitly
   listed tribute-local; armor + damage triads present everywhere.
4. **Native ids** — `nativeUnits` matches `unit-type-ids.json` (ilight 0/100,
   iheavy 1/101, sniper 102, hammer 11, jaguar 115, coyote 110, torrent 16,
   porcupine 112, typhoon 12, armadillo 111, zeus 15, mammoth 116, fortress
   10/24, shield 17, chameleon(FOG) 117, seraphim UNIT_ID_SERAPHIM=71 +
   HeroTypes.Seraphim=3, cerber HeroTypes.Cerber=1).
5. **Referential integrity** — every weapon/melee id resolves; every producer
   row resolves to a building; build orders reference existing units.

The pre-existing accuracy vectors (`accuracy.test.js`, 13) still pass — the
accuracy curves were untouched.

## 5. Known gaps / next steps

- `m_hitBonus` (0x24), `m_distanceMin` (0x2C), `m_accuracyDynamic` (0x50),
  burst fields (`m_shotStart/m_shotInt/m_shotCount`), `m_roundLen`,
  cone/rotate/aiming fields: schema extracted, not yet modeled in the tribute.
- `MaxStatValueProvider` tier thresholds (BaseMax/FirstMax/MegaMax) remain
  unknown native data (see `estat-stat-models.md` §Unknowns).
- Upgrade/mega-tier stat growth is not modeled; stat caps are flat.
- Weapon table ids (`m_weaponTableId`) are server-assigned; the tribute keeps
  per-unit weapon configs keyed by unit id instead (documented approximation).
- FACTION color palettes and `UNIT_MODEL` GLB mapping remain in the render layer
  (presentation data, out of Phase 2's gameplay-data scope).
