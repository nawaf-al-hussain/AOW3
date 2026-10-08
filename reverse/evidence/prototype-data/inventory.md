# R1 — Prototype / balance data inventory & pipeline (AOW3 6.9.18)

Task 41 (R1). Evidence-only: **no browser implementation change is authorized or made by
this work**. Companion files: `schema.json` (live entity field tables), `inventory.json`
(machine-readable), `browser-comparison.md` (field-by-field comparison), `on-device-run.md`
(the device runbook). Note copy: `reverse/notes/r1-prototype-data-pipeline.md`.

## 0. Verdict (honest, one paragraph)

The original client **does not embed any per-unit/per-weapon/per-building balance numbers**
in the APK — proven here by a full-file byte scan (not by "we didn't find it"), §4. The
authoritative values are **server-delivered**: at every login the client negotiates
dictionary versions (`ClientResourceConfiguration`, msg type 22) and downloads the
dictionaries as `ResourceAnswer` (msg 111) `sbyte[] Data` payloads over the game socket
(or as a CRC-versioned, possibly zipped web resource), deserializes them with the in-house
GearGames **ST binary protocol**, caches them to `<persistentDataPath>/rbi`, and feeds the
deserialized `BattleBaseDictionary` (weaponTypes/unitTypes/buildingTypes/mineTypes/
fractions/boosts/troops/heroParam) into `BattleBaseDictionaryDataSource`. **Zero balance
values were captured in this task** because no AOW3 runtime/device is available in this
environment (§9). R1 status: **BLOCKED — DEVICE REQUIRED**, with the pipeline, schemas,
hook targets and runbook now fully prepared so a single device session can capture
everything.

## 1. Source-of-truth ladder used here

| Level | Items used |
|---|---|
| 1. Direct runtime observation | **none available** (no device/emulator in this environment) |
| 2. Runtime instrumentation data | none (runbook prepared, not executed) |
| 3. Native libil2cpp behavior | disassembly of 20+ pipeline methods (RVA-attributed, `reverse/tools/prototype_pipeline_disasm.py`) |
| 4. IL2CPP metadata / dump | `dump.cs` 6.9.18 (sha256 `0050e67d…24714b`), `stringliteral.json` (31,091 literals) |
| 5. Original assets/configuration | full XAPK byte scans; Addressables catalog (863 internal ids); Unity Resources index (870 entries) + TextAsset extraction via UnityPy |
| 6. Existing RE notes | audit `1-to-1-fidelity-audit.md` (R1 row), `estat-stat-models.md`, `damage-pipeline-native-analysis.md`, `combat-stats.md`, FileUpload audit |
| 7. Browser implementation | used ONLY as the comparison side (`docs/data/*.js`), never as evidence of original values |
| 8. Inference/speculation | explicitly marked; every A–H classification below carries evidence |

Binary pins (all verified before analysis): `libil2cpp.so` sha256 `8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5`;
XAPK sha256 `1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e`.

## 2. The actual data pipeline (reconstructed end-to-end, CONFIRMED native)

```
DEV BACKEND (balance tables live here — NOT in the APK)
     │  authoritative source of every UnitType/WeaponType/BuildingType/... int
     ▼
login server (raw TCP, built-in fallback address 31.41.157.154:10398 from APK TextAsset 'config/gs')
     │  handshake: RsaDesPacketRequest/Answer  → DES session key (ReleaseProtocol.PROTOCOL_VERSION = 235)
     │  stream crypto: DESNetworkCryptoProvider.Encrypt/Decrypt per packet
     ▼
CSMainLogonManager state machine (logon sequence, States enum):
     9 GetPrivateServerAddress → 10 ConnectToPrivateServer → 11 Registration → 12 Login
  → 16 ReceiveGeneralConfiguration → 17 ReceiveClientResourceConfiguration
  → 18 CheckToNeedGoToUpdateClient → 19 LoadBattleBaseDictionary → 20 LoadSharedBaseDictionary
  → 21 LoadBaseDictionary → 22 LoadDictionaries → 23 OnlineProfile → 24 ReceiveChangeEntities
  → 25 ReceiveUserConfiguration → 27 Localization → 28 TimeSynchronization → 29 PingBattleHosts
  → 30 LoginToChat → 31 LoadRemoteCatalog → 32 Completed
     │
     ├─ state 17: client → ClientResourceConfiguration (Type 22, RequestType 20)
     │            {Categories: [ {name, {id → ClientResourceVersion{minor, path}}} ]}
     │   server → fresh ResourceInfo{path, zipped, crc, computeLocalCrc, type} per stale category
     │            (statics Game.BattleBaseDictionaryInfo / SharedBaseDictionaryInfo /
     │             ConfederationBaseDictionaryInfo / ResistanceBaseDictionaryInfo / DictionariesResourceInfos)
     │
     ├─ states 19–21: CSMain{Battle,Shared,Base}DictionaryReceiver : CSAbstractSerializableResourceLoader<T>
     │            ctor(ResourceInfo, AuthorizationCache, onCompleted, onFailed)
     │   → ResourceManager.LoadSerializableResourceAsync<T> (generic impls 0x5047E48 / 0x5047EB4):
     │        1) EnsureLoadCacheInfo()
     │        2) requires AbstractClientNetworkConnector (field 0x20)
     │        3) CheckResourceInfo(resource, compareCrc=true)  → else BadResourceInfo
     │        4) IResourceManagerCache.TryLoadResource(resource, compareCrc, out buffer)   [source Cache=2]
     │        5) miss → StartLoaderResourceCoroutine → network ResourceRequest (Type 110)
     │                 → server ResourceAnswer (Type 111, RequestType 110) {ResourceInfo, sbyte[] Data}
     │                 and/or IterativeWebResourceLoader over ResourceRepositories (CRC-versioned URLs,
     │                 ResourceInfo.Zipped → ResourceLoaderHelper.TryUnzip)   [source Web=1]
     │        built-in fallback [source BuiltIn=3] exists for serializable resources (log string
     │        'ResourceManager::The serializable resource loaded from built-in resources') —
     │        for the dictionaries the APK contains no built-in payload (§4), so in practice
     │        BattleBaseDictionary arrives via cache or network/web.
     ▼
deserialization: ThreadSafeSerializationManager.DeserializeMessage(111, GearGamesByteBuffer)
     │  ST binary protocol: per-class generated *STSerializer/*STDeserializer (ConvertedAssembly),
     │  class-name-keyed registry (stringliteral 'objectDeserializers.get(com.geargames.aow.…)==null')
     ▼
CSMainBattleBaseDictionaryReceiver.DoResourceLoaded → ProcessDictionary
     │  ├─ AuthorizationCache.SerializeDictionary<T>(dictionary, resourceInfo) → Save() → '<persistentDataPath>/rbi'
     │  └─ BattleBaseDictionaryDataSource.SetData(BattleBaseDictionary)   (RVA 0x7D24844)
     ▼
BattleBaseDictionary { List<WeaponType> weaponTypes; List<UnitType> unitTypes;
                       List<BuildingType> buildingTypes; List<MineType> mineTypes;
                       List<Fraction> fractions; List<BoostType> boosts;
                       List<TroopType> troops; HeroParam heroParam; }
     │
     ├─ ArmyRepository : IPrototypeRepository (workshop/UI stat models — the pipeline the
     │  damage-pipeline note already reconstructed: prototype ints → WeaponDamage stat models)
     └─ battle scene entities (UnitType/BuildingType/WeaponType objects consumed by sim code)
```

Key message-type ids pinned by disassembly (constant `mov w0,#imm; ret`):
`ClientResourceConfiguration` Type=22 / RequestType=20 (0x4953FB4/0x4953FBC);
`ResourceRequest` Type=110 (0x4973CB8); `ResourceAnswer` Type=111 / RequestType=110 (0x4973AEC/0x4973AF4).

Cache file pinned by disassembly: `AuthorizationCache.GetFilename` (0x7D76F44) =
`FileUtils.CombinePaths(ResourceHelper.GetPersistentDataPath(), "rbi")` — on Android
`/data/data/com.geargames.aow/files/rbi`. The cache holds `Dictionary<int, byte[]> m_storedMessages`
+ `Dictionary<string, byte[]> m_storedDictionaryResourceInfo` (ST-serialized payloads, keyed by
message type id / ResourceInfo). On Android the app-private file is readable without root via
`run-as com.geargames.aow` (debuggable builds) or root (release builds).

## 3. When each request occurs (§9 mapping)

| Request | When | Answer | Encoding |
|---|---|---|---|
| `ClientResourceConfiguration` (22) | logon state 17, immediately after Login/GeneralConfiguration | server-side fresh `ResourceInfo`s | ST binary over DES socket |
| `ResourceRequest` (110) for BattleBaseDictionary | logon state 19 (loading status 39) | `ResourceAnswer` (111) with `sbyte[] Data` | ST binary (zipped flag per ResourceInfo) over DES socket |
| same for SharedBaseDictionary / BaseDictionary | states 20 / 21 (statuses 42 / 45) | same | same |
| dictionary web download | only when the server answers with URL-only ResourceInfo (or cache CRC mismatch recovery) | HTTP(S) GET from repository URLs (Selectel/gearwap hosts among literals) | zipped binary + CRC check |
| `ClientRemoteParamsUpdate` | post-login config | remote params | ST binary |
| Addressables remote catalog | logon state 31 (LoadRemoteCatalog) | `catalog_{major}_{minor}.json` | JSON (visual/audio assets only, no balance) |

Note for capture planning: the prototype payload is expected at **every login** (version
negotiation may answer "up to date" and the client then uses the `rbi` cache — capture both a
first-run/clean-cache session and a warm session to distinguish F from E per §16-D).

## 4. Where the values are NOT (APK-embedded? — conclusively no)

Reproducible scans over the exact 6.9.18 XAPK (hash above):

1. **Full base-APK `assets/bin/Data` byte scan** (all 5,502 entries): markers
   `weaponTypes` / `unitTypes` / `com.geargames.aow.entities.BuildingType` occur **only**
   in `global-metadata.dat` (IL2CPP class/name metadata and log strings — e.g. the
   `'BattleBaseDictionary{weaponTypes.size='` log format). Zero hits in any Unity
   serialized file, scene, resource or bundle payload.
2. **Addressables catalog** (`assets/aa/catalog.json`, 863 `m_InternalIds`): the only
   config-ish entry is `Assets/Design/Configs/ButtonColors.asset` — everything else is
   sprites/audio/VFX/prefabs/maps (consistent with `vfx-catalog-families-6.9.18.txt`).
3. **Unity Resources index** (`globalgamemanagers` ResourceManager container, 870 keys):
   data-ish assets are `config/gs`, `config/gs.louken`, `xml/remoteconfig`,
   `walkablemap(…)`, `datacolors/*`, `questbuildings/*`, `other/event_cryptodata_box`,
   `battlepassviewconfig`, `careerviewconfig`, `factionselectconfig`, HMS plugin settings —
   extracted via UnityPy and inspected:
   - `config/gs` (TextAsset, 103 B): `<gs><loginServers><server ip="31.41.157.154" port="10398"/></loginServers></gs>`
   - `config/gs.louken` (dev leftover, 91 B): `<gs><loginServers><server ip="192.168.10.37" port="10098"/></loginServers></gs>`
   - `xml/remoteconfig` (141 B): test stub `<value key="test1">test</value>…` — the real
     remote params arrive via `ClientRemoteParamsUpdate` messages.
   **No dictionary/balance payload exists among the built-in resources.**
4. Split/config APKs of the XAPK are visual-only (Addressables bundles, already indexed).

This upgrades the prior "APK ships structure only" policy statement from
*absence-of-static-search* to a **proven, reproducible full-scan result** (classification
"not A" is now positive evidence, not assumption).

## 5. Per-value classification (A–H per task §5)

Legend: A embedded APK / B embedded+encrypted / C generated / D asset bundle / E local cache /
F server-delivered / G derived / H unknown.

| Value group | Class | Evidence |
|---|---|---|
| All `UnitType` ints (life, price, cp, time_train, upkeep, tier, uraniumToActivate, …) + `UnitStateType` stat blocks (armor, speed, sight, rotate, regen, flight, en_*, …) | **F** (first login) → **E** (subsequent launches, `rbi` cache) | §2 pipeline (native); §4 proves not-A; `BattleBaseDictionary.unitTypes` is the container |
| All `WeaponType` ints (damage triads + `_init`, distance(s), velocity, shot_*, shell_type, explosion_*, accuracy_*, rotate_*, cone*, gravity, dmg_*_modificator, …) | **F** → **E** | same container (`weaponTypes`); schema in `schema.json` |
| `BuildingType`/`BuildingLevelType` ints (train_delay, w/h, colliders, level stats) | **F** → **E** | `buildingTypes` container |
| `MineType` ints (damage triad, explosion_radius, price, set_time, life) | **F** → **E** | `mineTypes`; matches MineStatsFactory surface (estat note §3) |
| Faction economy: `income_sc_base/inc_hq/inc`, `supply_limit`, `hq_radius`, `hq_units_base/inc`, `constr_radius`, `regeneration_delay`, `shield_fog_*`, `repair_hp_per_tick` | **F** → **E** | `Fraction` entity (82 fields) inside the same dictionary |
| Hero ability numbers (`HeroParam`: solaris jump, kodomash, commando jump, beholder sight, gatling intervals, …) | **F** → **E** | `HeroParam` entity |
| Upgrade/mega-tier growth | **F** (BaseDictionary upgradeUnits/upgradeBuildings/upgradeLevels) → **E** | separate meta dictionary, same loading path (state 21) |
| Stat display caps `StatInfo{BaseMax,FirstMax?,MegaMax?}` (72 EStat keys) | **A** — embedded in native code, already extracted verbatim | `estat-stat-models.md` §7 (`extract_maxstat_tiers.py`); these are UI normalization domains, **not** the balance values |
| Damage mitigation curve (0.9/0.1), accuracy dispatch, `FIRE_TICK_LENGTH=4`, shell constants, OCCUPATION masks | **A** — native code | armor/accuracy/weapon-type notes |
| Login server address | **A** (built-in `config/gs`) + **F** (web `gs*.xml` refresh from CDN hosts) | §4 extraction + `ResourceHelper.GS_XML_POSTFIX_*` |
| Remote params (`ClientRemoteParams`) | **F** (built-in stub is a test placeholder) | §4 `xml/remoteconfig` |
| Visual/audio assets | **D** (Addressables bundles, APK + CDN `catalog_{major}_{minor}.json`) | catalog scan |
| `rbi` cache file format | ST-serialized payload store (post-crypto; `AuthorizationCache` uses its own `ThreadSafeSerializationManager`) | §2 |
| Obfuz pools (task-id factors, $ce threshold, DEN, FlagShoot) | **B** (APK-embedded, Obfuz-encrypted) — **R2 scope, handed off** | `obfuz-pool-emulation.md`; these are code constants, not the balance dictionary — see §8 |

Anti-assumption note (task §5): "server-delivered" is **not** inferred from static absence —
it is positively established by the native load chain (§2): the client *asks* (110), the
*server answers* (111) with bytes, and a *cache file* is written/read. The DES/RSA layer is
documented; the dictionary payload itself is ST-binary (optionally zipped), **not** Obfuz-encrypted.

## 6. Prototype data inventory (what one capture yields)

Capture point: one `ResourceAnswer` (111) payload per dictionary, post-deserialization object
graph, or the `rbi` cache file. Field counts below are **schema counts from `schema.json`**
(6.9.18) — i.e. the capture surface; zero numeric values are filled in this task.

### Units (`UnitType`, 46 fields + N×`UnitStateType` 46 fields)
unit id (`Prototype.id`), fraction, category/type consts (INFANTRY=11, VEHICLE=20, HELICOPTER=30,
SHIP=40, NUCLEAR_MISSILE=50, COMMANDO=60, …), life/lifeInt, time_train(+init), upkeep, cp, price,
spec + tick_to_spec/tick_from_spec (siege/march), barracks (producer ref), weapon_priority, score,
flags, torpedo, model_name/visualId, desc/name/name_long (localization ids), order, demine_*,
cross, bulletShooter, antiAir, botHireProb[], botHireCategory, ability[], heroClass, upgCount,
uraniumToActivate, heroSlot, tier, transport(+size), feature toggles.
Per state (`UnitStateType`): weapons[], pass, armor, armor_bonus, armor_type, armed, undergo[3],
undergo_original[3], undergo_original_init[3], damage_priority[], approach, sight(+init),
min_undergo, speed(+init), rotate, radar, occupation, aiming, weapon_immobile, area_cover, moving,
open_ground/water/air + opens[], invisible, regen(+init), accelerate, jump_dist, flight(+init),
flight_radius, altitude, spec, size, flags, en_max/en_waste/en_regen(+init), die_time, mesh[], vertical.

### Weapons (`WeaponType`, 63 fields)
weapon id, name/name_add, shell `type` + category, damage_light/medium/heavy (+ `_init` triad),
damage_priority[], hit_bonus (client-inert), distance (+original+init), distance_min, velocity,
shot_start, flarePrepare, shot_int, round_len, shot_length, shot_count, shot_tick[], shell_type,
explosion_radius(+init), explosion_decr, rotate_diap, rotate_speed, walking_shot, aiming,
air_aiming, priority, accuracy_static/dynamic/walk, guided(+rotate_speed, rocket_life), coneAngle/
coneDuration/coneBaseLine, bulletTrajectoryType, gravity, accelerating, bul_type, boom_type,
pvp_bld_points, dmg_un_modificator[], dmg_bld_modificator[], icon, visual (FireType).

### Buildings (`BuildingType` 17 fields + `BuildingLevelType` 31 fields)
building id, category (FACTORY=2, BUNKER=3, QUEST=9), w/h + w_collider/h_collider, type
(HQ=1, POWER_STATION=2, SUPPLY_DEPOT=3, CONSTR_YARD=4, BARRACKS=5, SPECIAL_BARRACKS=6,
ASSAULT_FACTORY=7, ADVANCED_FACTORY=8, AIR_FACTORY=9, AIRPORT=10, SHIPYARD=11, NUCLEAR_SILO=12,
WALL=13, BUNKER=14, TOWER=15, AIR_DEFENCE=16, NAVAL_TURRET=17, HERO=18), train_acc, train_delay,
model_name, exit[], desc/name, order, quest, flags (VISIBLE_IN_WORKSHOP), CONSTR_* modes,
CONSTR_ARMOR_DIVIDER=4; per level: full stat block incl. life, weapons, production
(BuildingLevelType fields in schema.json).

### Economy (`Fraction` 82 fields + `Goods`/meta dictionaries)
income_sc_base, income_sc_decr, income_hq_base, income_hq_inc, supply_limit, hq_radius,
hq_units_base, hq_units_inc, constr_radius, regeneration_delay, shield_fog_radius/bonus/
act_energy, gai_interval, repair_hp_per_tick, flight_accelerate_len, jump_velocity,
airfield_{dx,dy,rot}×4+; initial reserves (EStat InitialResourceReserve/47 surface),
upgrade costs (BaseDictionary), mines price (EStat MinePrice/71 cap surface),
 uranium pricing (PriceUranum/3), command points (CommandPointsProduce/13).

### Also captured by the same payload
`BoostType` (12 fields), `TroopType` (9), `HeroParam` (38) — plus the meta dictionaries
(`SharedBaseDictionary`: unitModificationTypes — the workshop modification table that scales
weapon damage; `BaseDictionary`: upgrade units/buildings/levels).

## 7. EStat ↔ native field ↔ browser field mapping (evidence comparison only)

The recovered EStat taxonomy (`reverse/evidence/data-model/estat.json`) maps onto the live
entity fields discovered here (selection — full table in `inventory.json` `estat_map`):

| EStat | Native meaning (dump) | Runtime source (live entity field) | Captured value | Browser value | Status |
|---|---|---|---|---|---|
| Health/1 | unit/building HP | `UnitType.life/lifeInt`, `BuildingLevelType.life` | NOT CAPTURED | tuned (e.g. ilight 120) | values UNKNOWN; schema CONFIRMED |
| Price/2 | credit cost | `UnitType.price` | NOT CAPTURED | tuned (120) | same |
| PriceUranum/3 | uranium cost | `UnitType.uraniumToActivate` (hero activation surface) | NOT CAPTURED | n/a | schema CONFIRMED |
| CommandPoints/4 | CP cost | `UnitType.cp` | NOT CAPTURED | tuned (1) | same |
| TrainTime/5 | production time | `UnitType.time_train(_init)` | NOT CAPTURED | tuned (4 s) | same |
| Speed/6 | movement speed | `UnitStateType.speed/speed_init` (sbyte) | NOT CAPTURED | tuned (3.4) | same |
| Armor{L,M,H}/7-9 | armor triad | `UnitStateType.armor` + `armor_type` (+armor_bonus) per state | NOT CAPTURED | tuned triad | same |
| View/10 | sight | `UnitStateType.sight/sight_init`, `radar` | NOT CAPTURED | tuned (9) | same |
| ConstructionRadius/11 | build radius | `Fraction.constr_radius` surface | NOT CAPTURED | tuned | same |
| ConstructionTime/12 | build time | `BuildingLevelType` timing fields | NOT CAPTURED | tuned | same |
| CommandPointsProduce/13 | CP income | building level production fields | NOT CAPTURED | baseCP 10 / depotCP 4 | same |
| SupplyIncome/14 | credit income | `Fraction.income_hq_base/inc`, `income_sc_base` | NOT CAPTURED | baseIncome 14 / depot 11 | same |
| EnergyProduction/15, EnergyNeed/16 | power | `BuildingLevelType` energy fields | NOT CAPTURED | powerIncome 2 (flat) | same |
| HealthRegeneration/18 | regen | `UnitStateType.regen(_init)` | NOT CAPTURED | tuned (0.6/s) | same |
| TransitionTo{March,Siege}ModeTime/20-21 | spec transitions | `UnitType.tick_to_spec/tick_from_spec` (tick domain!) | NOT CAPTURED | approximated | same |
| Shield*/26-30, Fog*/31-33, Energy*/24-25,28 | subsystem stats | `UnitStateType.en_max/en_waste/en_regen`, shield/fog surfaces | NOT CAPTURED | aura stand-in | same |
| WeaponDistance/58 | weapon range | `WeaponType.distance(_original/_init)`, `distance_min` | NOT CAPTURED | tuned (6.5…) | same |
| WeaponAccuracy/59 | accuracy | `WeaponType.accuracy_static/dynamic/walk` | NOT CAPTURED | tuned (72…) | same |
| WeaponFireRate/60 | fire rate | `WeaponType.shot_int/round_len/shot_count/shot_tick[]` (tick domain) | NOT CAPTURED | cooldown seconds (1.1) | same |
| WeaponArmor{L,M,H}/61-63 | per-armor damage | `WeaponType.damage_light/medium/heavy(_init)` | NOT CAPTURED | tuned triads | same |
| WeaponExplosionRadius/64 | splash | `WeaponType.explosion_radius(_init)/explosion_decr` | NOT CAPTURED | tuned | same |
| MinePrice/71 (cap key), WeaponMineCost/66, WeaponMineTime/67 | mines | `MineType.price/set_time` | NOT CAPTURED | not implemented | same |
| Super-weapon 68-77 | nuke | `BuildingLevelType`/WeaponType super surfaces | NOT CAPTURED | not implemented | same |

Do **not** read the browser column as anything but the current tuned placeholder — the
comparison protocol and difference accounting live in `browser-comparison.md`.

## 8. Relationship to R2 (Obfuz) — handoff note

The Obfuz pool (R2) encrypts **code-level constants** (task-id factors, `$ce` threshold, DEN
factors, `set_FlagShoot`), addressed by Build H's portable decoder +
`reverse/evidence/obfuz/on-device-run.md`. The balance dictionary travels as **ST-binary
protocol payloads** over the DES socket / `rbi` cache — a different layer. R1 does not need
the Obfuz key and does not create a second Obfuz pipeline; the only operational overlap is
that **both device captures can share one Frida session** (spawn-mode script concatenation),
which the runbook exploits. If any captured dictionary blob turns out to be additionally
transformed (unexpected), that finding goes to R2 with provenance — not handled ad-hoc here.

## 9. Runtime availability & capture status (§25 honesty block)

- Environment check (this machine): `adb` absent, `frida` absent, no emulator, no `/dev/kvm`
  → **no AOW3 runtime available**; no runtime experiment of §12 could be executed.
- Captured datasets: **none**. Captured fields: **0** (schema field counts are not captures).
- What IS complete: pipeline reconstruction (native-CONFIRMED), APK non-embedding proof
  (full-scan), schema extraction (20 classes → `schema.json`), hook-target table with dump
  RVAs + native addresses, runbook (`on-device-run.md`), classification table (§5).
- What remains blocked: every numeric value. They convert to evidence only via the device
  run in `on-device-run.md` (one session, two commands).

## 10. Field-count summary (schema surface per §25-D, actual numbers)

| Group | Classes | Fields (incl. per-state/per-level repeats where applicable) |
|---|---|---|
| Units | UnitType 46, UnitStateType 46 (per state), Prototype/Entity base | 92 + state blocks |
| Weapons | WeaponType 63 | 63 |
| Buildings | BuildingType 17, BuildingLevelType 31 | 48 |
| Economy/faction | Fraction 82, Goods 42 | 124 |
| Mines | MineType 18 | 18 |
| Heroes | HeroParam 38 | 38 |
| Boosts/troops | BoostType 12, TroopType 9 | 21 |
| Upgrades (meta) | UpgradeUnit/Building (base Upgrade 7), UpgradeLevel 12 | 26+ |
| Transport/protocol | ResourceInfo 5, ClientResourceVersion 2, ResourceAnswer 2, ClientResourceConfiguration 1 | 10 |
