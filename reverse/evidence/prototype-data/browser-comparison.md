# R1 — captured-vs-browser comparison report (AOW3 6.9.18)

Task 41 (R1). **No browser value was modified by this task** — this file is the
comparison scaffold that the post-capture work fills in. Evidence-only mandate:
the browser column is documentation of current state, never a source of truth.

## 0. Capture status

| Item | Status |
|---|---|
| Runtime-captured values | **0** (no AOW3 runtime/device available in this environment — see `inventory.md` §9) |
| Schema (capture surface) | CONFIRMED (20 classes, `schema.json`) |
| Data pipeline | CONFIRMED (native, `inventory.md` §2) |
| This report | scaffold + schema-anchored field map; every `Original runtime` cell reads **NOT CAPTURED** |

Rows are grouped by browser data module (`docs/data/*.js`). `Native field` = the live
entity field that carries the value (offsets per `schema.json`); `Runtime source` = where
the value enters the client (`inventory.md` §2). Confidence of the *mapping* is HIGH
(dump.cs offsets + disassembly); confidence of any *value equality claim* is
**UNKNOWN until the device run lands** — deliberately not graded.

## 1. Units (`docs/data/units.js` → `UnitType` + `UnitStateType`)

| Field | Native field (offset) | Original runtime | Browser | Difference | Confidence |
|---|---|---|---:|---|---|
| health | `UnitType.life`(0x32, short)/`lifeInt`(0x34) | NOT CAPTURED | tuned (ilight 120 …) | UNKNOWN | mapping HIGH / value UNKNOWN |
| price | `UnitType.price`(0x48) | NOT CAPTURED | tuned (120 …) | UNKNOWN | same |
| cp | `UnitType.cp`(0x44, sbyte) | NOT CAPTURED | tuned (1) | UNKNOWN | same |
| trainTime | `UnitType.time_train`(0x38) (+`_init` 0x3C) | NOT CAPTURED | tuned seconds (4 …) | UNKNOWN (native unit-of-measure unverified: s vs ticks) | same |
| speed | `UnitStateType.speed`(0x58, sbyte)/(+`speed_init` 0x59) | NOT CAPTURED | tuned (3.4 …) | UNKNOWN (native scale factor unverified) | same |
| view | `UnitStateType.sight`(0x4C)/`radar`(0x5C) | NOT CAPTURED | tuned (9 …) | UNKNOWN | same |
| regen | `UnitStateType.regen`(0x72, short) | NOT CAPTURED | tuned (0.6/s …) | UNKNOWN (tick domain) | same |
| armor triad | `UnitStateType.armor`(0x22)+`armor_type`(0x26)+`armor_bonus`(0x24) per state | NOT CAPTURED | tuned triads | UNKNOWN | same |
| armorClass | `UnitStateType.armor_type` (0/1/2) | NOT CAPTURED | light/medium/heavy consts | UNKNOWN | mapping CONFIRMED |
| spec mode | `UnitType.spec`(0x4C)+`tick_to_spec/from_spec`(0x4D/0x4E) | NOT CAPTURED | approximated | UNKNOWN (native is tick-domain) | same |
| kind | `UnitType.category/type` (UNIT_TYPE_* consts) | NOT CAPTURED | infantry/vehicle/… mapping | UNKNOWN | mapping CONFIRMED |
| captures | `UnitType.flags`(0x58) bits (bit semantics = §16-R6-style work) | NOT CAPTURED | bool per unit | UNKNOWN | mapping MEDIUM |
| veterancy growth | `UnitType.upgCount`(0xA4)+BaseDictionary upgrade rows | NOT CAPTURED | not modeled | — | — |
| transport | `UnitType.transport`(0xB8)+`transportSize`(0xC0) | NOT CAPTURED | not modeled | — | — |
| turret rotate | `UnitStateType.rotate`(0x5A, short) | NOT CAPTURED | render-only stand-in | UNKNOWN | same |
| invisible/stealth | `UnitStateType.invisible`(0x70) | NOT CAPTURED | not implemented (chameleon scout) | — | — |
| energy shield | `UnitStateType.en_max/en_waste/en_regen`(0x88–0x8E) | NOT CAPTURED | aura stand-in | — | — |

## 2. Weapons (`docs/data/weapons.js` → `WeaponType`)

| Field | Native field (offset) | Original runtime | Browser | Difference | Confidence |
|---|---|---|---:|---|---|
| damage.light/medium/heavy | `damage_light/medium/heavy`(0x28/0x2C/0x30) + `_init` triad | NOT CAPTURED | tuned triads | UNKNOWN | mapping HIGH |
| range | `distance`(0x4C) (+`distance_original`/`_init`/`distance_min` 0x50/0x54/0x58) | NOT CAPTURED | tuned (6.5 …) | UNKNOWN (scale unverified) | same |
| minRange | `distance_min`(0x58) | NOT CAPTURED | tuned fraction (5 …) | UNKNOWN | same |
| cooldown | `shot_int`(0x64)/`round_len`(0x66)/`shot_tick[]`(0x70) — tick domain (`FIRE_TICK_LENGTH=4`) | NOT CAPTURED | seconds (1.1 …) | UNKNOWN — tick↔s conversion needs R3 | mapping HIGH |
| burst (shot_count) | `shot_count`(0x6A) | NOT CAPTURED | dormant | — | mapping CONFIRMED |
| accStatic/accWalk | `accuracy_static/dynamic/walk`(0x8E/0x90/0x92) | NOT CAPTURED | tuned (72/48 …) | UNKNOWN | mapping HIGH |
| splash | `explosion_radius`(0x7C)+`explosionRadiusInit`(0x80) | NOT CAPTURED | tuned (0 …) | UNKNOWN | same |
| explosionDecr | `explosion_decr`(0x84, sbyte) | NOT CAPTURED | tuned (20/30) | UNKNOWN (client role = accuracy scatter, not falloff) | same |
| hitBonus | `hit_bonus`(0x48) | NOT CAPTURED | unused (client-inert) | — | mapping CONFIRMED |
| walkingShot | `walking_shot`(0x8A) | NOT CAPTURED | flag per weapon | UNKNOWN | mapping HIGH |
| guided | `guided`(0x94)+`guided_rotate_speed`(0x95)+`guided_rocket_life`(0x96) | NOT CAPTURED | flag (helicopter) | UNKNOWN | same |
| projectileSpeed | `velocity`(0x5C) | NOT CAPTURED | tuned (14 …) | UNKNOWN | same |
| priority | `priority`(0x8D) | NOT CAPTURED | not modeled | — | mapping CONFIRMED |
| allowed targets | `aiming`(0x8B bitmask) + `air_aiming`(0x8C) | NOT CAPTURED | role-based heuristics | UNKNOWN | mapping CONFIRMED (bitmask semantics native-verified) |
| trajectory | `bulletTrajectoryType`(0x9E)+`gravity`(0xA0)+`accelerating`(0xA2) | NOT CAPTURED | not modeled (R8) | — | mapping CONFIRMED |
| unit/building damage mods | `dmg_un_modificator[]`(0xB0)/`dmg_bld_modificator[]`(0xB8) | NOT CAPTURED | not modeled | — | mapping CONFIRMED |
| shell type | `shell_type`(0x78)/`type`(0x24) SHELL_TYPE_* | NOT CAPTURED | partial (browser key names) | UNKNOWN | mapping CONFIRMED |

## 3. Buildings (`docs/data/buildings.js` → `BuildingType`/`BuildingLevelType`)

| Field | Native field (offset) | Original runtime | Browser | Difference | Confidence |
|---|---|---|---:|---|---|
| footprint | `BuildingType.w/h`(0x29/0x2A) + colliders(0x2C/0x2E) | NOT CAPTURED | tuned (2×2 …) | UNKNOWN | mapping HIGH |
| buildTime | `BuildingLevelType` construction fields (+CONSTR_* mode) | NOT CAPTURED | tuned | UNKNOWN | same |
| cost | `BuildingLevelType.price` surface | NOT CAPTURED | tuned | UNKNOWN | same |
| health | `BuildingLevelType.life` | NOT CAPTURED | tuned | UNKNOWN | same |
| production | `BuildingType.train_acc/train_delay`(0x31/0x34) + level queue fields | NOT CAPTURED | producers map | UNKNOWN | mapping HIGH |
| prereqs | not a `BuildingType` field — server/profile-side (audit B-finding retained) | NOT CAPTURED | browser-designed chain | — | structure evidence |

## 4. Economy (`docs/data/factions.js` → `Fraction` + meta dictionaries)

| Field | Native field (offset) | Original runtime | Browser | Difference | Confidence |
|---|---|---|---:|---|---|
| baseIncome | `Fraction.income_hq_base`(0x28)+`income_hq_inc`(0x2C) | NOT CAPTURED | 14 | UNKNOWN | mapping HIGH |
| depotIncome | supply-depot building-level income surface | NOT CAPTURED | 11 | UNKNOWN | mapping MEDIUM |
| baseCP/depotCP | CP-produce surface (EStat 13 / building levels) | NOT CAPTURED | 10 / 4 | UNKNOWN | mapping MEDIUM |
| supply limit | `Fraction.supply_limit`(0x30) | NOT CAPTURED | not modeled | — | mapping HIGH |
| hq radius/units | `Fraction.hq_radius`(0x34)/`hq_units_base/inc`(0x38/0x39) | NOT CAPTURED | partial | UNKNOWN | mapping HIGH |
| constr radius | `Fraction.constr_radius`(0x3C) | NOT CAPTURED | tuned | UNKNOWN | mapping HIGH |
| repair | `Fraction.repair_hp_per_tick`(0x54) | NOT CAPTURED | not modeled | — | mapping HIGH |
| regen delay | `Fraction.regeneration_delay`(0x40) | NOT CAPTURED | not modeled | — | mapping HIGH |
| power | building energy fields (EStat 15/16) | NOT CAPTURED | powerIncome 2 (flat, no shortage) | UNKNOWN | mapping MEDIUM |
| capture times | capture command timing (server/profile side candidate) | NOT CAPTURED | 5 s / 9 s (zero native evidence — audit H3) | — | mapping LOW |
| upgrades | `BaseDictionary.upgradeUnits/upgradeBuildings/upgradeLevels` | NOT CAPTURED | not modeled | — | mapping HIGH |

## 5. What would change nothing in the browser even after capture

Per task §22: values are re-imported **only** by a later implementation task that (a) re-runs
the fixture snapshot, (b) re-baselines golden hashes, and (c) converts tick-domain fields
with the verified tick rate (R3 dependency: `shot_tick[]`/`time_train`/`rotate`/`regen` are
tick- or frame-domain natives; seconds-based browser fields need that conversion factor
pinned before import). This report intentionally does not propose numbers.

## 6. Post-capture workflow (for the implementation task, not this one)

1. Decode `msg111` payloads (ST registry decode, host-side) → JSON per dictionary.
2. Bind rows to `UnitType` ids (43 UNIT_ID_* consts) and weapon indices (per-unit
   `UnitStateType.weapons[]` order).
3. Fill the `Original runtime` column above; compute differences; assign per-row
   confidence per task §16 (A–D methods).
4. Convert tick-domain fields (R3), then re-import via the documented data pipeline with
   fixture + hash re-baselining.
