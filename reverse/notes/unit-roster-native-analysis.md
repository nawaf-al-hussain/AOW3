# Unit Roster — Native Recovery (6.9.18)

Status: HIGH CONFIDENCE structure (ids, names, faction assignment, roles via model evidence);
stat VALUES remain approximations (see combat-stats.md §7).

## 1. The prototype tables are NOT in the package (verified dead end)

The serialized prototype tables (UnitType/WeaponType/BuildingType instances) are
**server-delivered at runtime**, not shipped in the 6.9.18 XAPK. Verification performed
2026-10-06 (this pass):

- All 30 Unity bundles extracted from the XAPK (pipeline/tools/unpack_bundles.py) scanned
  with UnityPy 1.25.4 (Unity 6000.0.80f1, FALLBACK_UNITY_VERSION): contents = decorations
  (jungle/desert/common meshes), VFX particle prefabs, NGUI/UI components (UISprite/UILabel/
  UIButton/TMP fonts), map prefabs, minimaps, shaders. Zero TextAssets, zero prototype-class
  MonoBehaviours. (`/home/z/my-project/scripts/scan_bundles.py`, scan_scripts.py)
- All 3,803 non-resource `assets/bin/Data/` files byte-grepped for `UnitType`, `WeaponType`,
  `BuildingType`, `BuildingLevelType`, `UnitStateType`, `Prototype`, `EntityList`, `GearGames`:
  the ONLY hit is `global-metadata.dat` (class names in IL2CPP metadata, not data).
  (`grep_bindata.py`)
- Localization string table also not local: `LocalizationStringsLoader` loads
  `IDictionary<int,string>` via `LoadResourceSource {Unknown, Web, Cache, BuiltIn, Test}`
  and `CSMainLocalization` fetches it through `CSAbstractSerializableResourceLoader` —
  matching the server-resource flow. No `.st` files or dictionary blobs found by
  byte-level Cyrillic/ASCII sweeps (`find_textfiles.py`); top hit was a UI sprite atlas.
- Consequence per AGENTS.md §3.2: the game's servers are off-limits, so per-unit numeric
  stats (hp/price/damage/speed tables) CANNOT be recovered from binaries. The browser
  roster's numbers stay documented approximations; everything else about the roster
  (below) is binary-verifiable.

## 2. Verified faction rosters (AudioController select-sound keys)

`assets/bin/Data/5d3bf6b975c6253429cd79804babcff2` = `AudioControllerCommonSounds`
(GameObject with `CatUnitsSelectSounds` category). Its `Item*` keys enumerate the exact
unit roster per faction (`extract_voicekeys.py`):

| f1 (Confederation) | f2 (Resistance) |
|---|---|
| ItemF1InfLight | ItemF2InfLight |
| ItemF1InfHeavy | ItemF2InfHeavy |
| ItemF1InfFlame | ItemF2InfSniper |
| ItemF1VehHammer | ItemF2VehCoyote |
| ItemF1VehTorrent | ItemF2VehArmadillo |
| ItemF1VehZeus | ItemF2VehPorcupine |
| ItemF1VehTyphoon | ItemF2VehJaguar |
| ItemF1VehShield | ItemF2VehMammoth |
| ItemF1VehSpec | ItemF2VehChameleon |
| ItemF1AviaHelicopter | ItemF2AviaHelicopter |
| ItemF1AviaFighter | ItemF2AviaFighter |
| ItemF1AviaBomber | ItemF2AviaBomber |
| ItemF1NavLight | ItemF2NavAlligator |
| ItemF1NavHeavy | ItemF2NavBarracuda |
| ItemF1NavAmphibian | ItemF2NavCayman |

`ItemF1VehSpec`/heroes (Cerber, Seraphim, Solaris, Beholder, Atlas, PsiTank, Cryotank,
Wasp, Kodomash, Leviathan, Gatling, Salamander, CoilTank, Railgun per WeaponType SHELL_ID
constants and ItemHero* voice keys in BattleVoicesConf/Resist) are hero/special units —
out of base-roster scope.

## 3. Verified unit ids (dump.cs UnitType constants)

`UNIT_ID_*` constants map 1:1 onto the rosters above; numeric adjacency blocks match the
two vehicle lineups:

- f1 infantry: `ILIGHT_CONF=0`, `IHEAVY_CONF=1`, `FIREBAT=2` (= InfFlame; no model
  extracted from the maps we ship)
- f2 infantry: `ILIGHT_RES=100`, `IHEAVY_RES=101`, `SNIPER=102` (CONF/RES suffixes confirm
  faction naming: f1=Confederation, f2=Resistance)
- f1 vehicles: `FORTRESS=10, HAMMER=11, TYPHOON=12, ZEUS=15, TORRENT=16, SHIELD=17`
- f2 vehicles: `COYOTE=110, ARMADILLO=111, PORCUPINE=112, JAGUAR=115, MAMMOTH=116, FOG=117`
  (FOG = `f2_veh_chameleon` model; UNIT_TYPE_FOG=23 stealth)
- aircraft: `FIGHTER=21, BOMBER=22` (no models extracted); helicopter models
  `f1/f2_avia_helicopter` exist
- naval: `AMPHIBIAN=25, DESTROYER=26, CRUISER=27` (f1 NavLight/NavHeavy/NavAmphibian),
  `CAYMAN=125, ALLIGATOR=126, SUBMARINE=127` (f2 NavCayman/NavAlligator + Barracuda);
  no naval models extracted

## 4. Role evidence per unit (model node/clip inventory)

Rendered/inspected all 17 unit GLBs (`model_grid.html`, node+clip dump; visual: v13
lineup `p13_models.png`):

- `typhoon`: nodes `b_rocket1`, `b_radar1/2`, `b_weapon1` → rocket MLRS ( bombard class)
- `torrent`: `b_gun1`, `b_gun2` twin guns, only `die_bullet` → AA gun vehicle
- `porcupine`: rotary multi-barrel mount (visible in lineup) → AA flak vehicle
- `fortress`: `b_weapon1`+`b_gun`, wide siege hull, UNIT_TYPE_FORTRESS=24 exists → siege
- `zeus`, `armadillo`: `w1_round`+`w2_round` (two firing rounds) → dual-weapon platforms
- `hammer`, `jaguar`: single `w1_round`, tank hull → MBT class
- `mammoth`: huge multi-track hull → super-heavy
- `coyote`: small fast hull → scout
- `shield`: NO weapon nodes, NO fire clips → support (UNIT_TYPE_SHIELD=22 exists)
- `chameleon`: NO weapon nodes, NO clips at all → stealth (UNIT_ID_FOG=117, UNIT_TYPE_FOG=23)
- `iheavy`: `w1/w2_round`, `die_explosion`, shoulder tube → rocket/AT infantry
- `ilight`: `b_gun` rifle, `die_bullet` → rifle infantry
- `sniper`: `b_gun`, long-range stance → marksman

Confidence: names/ids/faction = HIGH (binary constants + shipped assets). Role classes
(AA/siege/MBT/…) = MEDIUM-HIGH (model geometry + native type constants; no server table).

## 5. Implementation (docs/game.js, v=14)

- `UNITS` rewritten to the 15-unit verified roster (both factions' shared units use one
  def; faction-exclusive defs: sniper/hammer/torrent/typhoon/zeus/fortress/shield (f1),
  coyote/jaguar/armadillo/porcupine/mammoth/chameleon (f2)).
- `BUILD_ORDER_F1`/`BUILD_ORDER_F2` per-faction build lists (player=f1, AI=f2);
  `BUILD_ORDER` alias kept for the player UI. `PRODUCER_OF` extended (barracks: infantry;
  factory: medium vehicles; heavyfactory: heavy/special + helicopter).
- `UNIT_MODEL` remapped identity-faithful — every extracted unit GLB now maps to its
  native unit (old mapping showed Torrent model under "MBT Coyote" label, Fortress under
  "Mammoth", Zeus under "Flak", Porcupine under "Rocket Artillery" — all fixed).
- Stat values distributed by role class from the previous documented approximations;
  shield = unarmed + friendly heal aura (aura.regen 2/s, radius 6 — browser-only stand-in
  for UNIT_TYPE_SHIELD, documented); chameleon = unarmed fast scout (native stealth NOT
  reproduced, documented).
- Sim guards for weaponless units (`updateUnits` buildingTarget guard, walkingShot guard,
  `findTarget` early return).
- Initial spawns/AI build tables/sfx pools/fallback meshes updated to new ids.

## 6. QA (local, v=14, agent-browser)

- Fresh session: 0 page errors in 15s of gameplay (pre-fix session: 182 — see §7).
- All 15 roster units spawn both factions; GLB views created; fog culling correct.
- Combat fast-forward (18s): kills/losses/veterancy tracked; shield aura healed probe
  units (+9/+8 hp); AA kill: torrent acquires helicopter @3 tiles, kills at 4.2s.
- AI produced full f2 roster within 60s (jaguar, porcupine, armadillo, mammoth, sniper,
  chameleon, helicopter, ilight×4).
- Player production: tryPlace barracks → enqueue gated by built producer + CP cap;
  training completes and spawns.
- HQ destruction → VICTORY verdict + battle report intact.

## 7. Incident: splice regression caught by QA

The first splice inserted the shield-aura code without bracing the surrounding
braceless `for` statement → `ReferenceError: u is not defined` inside `Sim.step`
EVERY frame. Symptom chain: sim.time still advanced (step body ran up to the throw),
render/HUD/AI never ran, HUD frozen at 0:00, and ~180-250 EMPTY-message pageerror
events per session. Root-caused via `window.addEventListener('error')` stack capture.
NOTE for §35 probes: recurring EMPTY pageerror events are NOT environmental noise to
ignore by default — instrument with an error listener and read the stack before
dismissing; the v12 session's "~40 EMPTY pageerror events" note in worklog Task 15 may
have been the same class of real exception.
