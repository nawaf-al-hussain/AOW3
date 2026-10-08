# R1 — prototype/balance data pipeline, natively reconstructed (6.9.18)

Created: 2026-10-08 (Task 41). Closes the static half of audit R1
(`1-to-1-fidelity-audit.md` §7 row R1 / blocker B1): *what are the actual per-unit/
per-weapon balance numbers and where do they enter the client?* Data files live in
`reverse/evidence/prototype-data/` (`inventory.md` = full inventory, `inventory.json`,
`schema.json`, `browser-comparison.md`, `on-device-run.md` = device runbook).

## Verdict

1. **No balance values are embedded in the APK** — proven by full-file byte scan (all
   5,502 `assets/bin/Data` entries + Addressables catalog + Unity Resources index), not
   by absence-of-search: dictionary markers (`weaponTypes`, `unitTypes`,
   `com.geargames.aow.entities.BuildingType`) occur **only** in `global-metadata.dat`
   (IL2CPP names/log strings). The only built-in data TextAssets are the login-server
   `gs.xml` (103 B), a dev leftover `gs.louken`, and a test-stub `xml/remoteconfig`.
2. **The values are server-delivered at every login** over the game socket, then cached
   locally. Positive evidence (native disassembly), not inference:
   - logon states 17 → 19–21 (`CSMainLogonManager.States`) negotiate resource versions
     (`ClientResourceConfiguration`, **Type 22 / RequestType 20**, categories =
     `{name, {id → ClientResourceVersion{minor, path}}}`) and load the dictionaries;
   - `ResourceRequest` (**Type 110**) → `ResourceAnswer` (**Type 111**, RequestType 110)
     carries `{ResourceInfo{path, zipped, crc, computeLocalCrc, type}, sbyte[] Data}` —
     the dictionary bytes travel inline in `Data` (or via CRC-versioned, possibly zipped
     web download from repository URLs);
   - load order natively: cache (CRC compare) → network answer → web repositories →
     built-in (which is **empty** for dictionaries — see 1);
   - ingestion: `CSMainBattleBaseDictionaryReceiver.DoResourceLoaded` (0x7DBA3B4) →
     `ProcessDictionary` (0x7DBA420) → `AuthorizationCache.SerializeDictionary<T>` +
     `BattleBaseDictionaryDataSource.SetData` (0x7D24844);
   - cache: `AuthorizationCache` file **`rbi`** at `FileUtils.CombinePaths(
     ResourceHelper.GetPersistentDataPath(), "rbi")` (GetFilename 0x7D76F44, disassembled) —
     Android path `/data/data/com.geargames.aow/files/rbi`; holds ST-serialized
     `{int→byte[]}` messages + `{string→byte[]}` dictionary resources.
3. **Transport crypto**: raw TCP to the login server (built-in fallback
   `31.41.157.154:10398` from the APK TextAsset), `RsaDesPacketRequest/Answer` handshake →
   `DESNetworkCryptoProvider.Encrypt/Decrypt` per packet (`ReleaseProtocol.PROTOCOL_VERSION
   = 235`). The dictionary payload itself is GearGames **ST binary** (class-name-keyed
   serializer registry, `GearGamesByteBuffer`) — **not** Obfuz-encrypted (R2 boundary:
   `inventory.md` §8).

## Native evidence (all at dump.cs RVAs, sha-pinned binary `8ace05bb…`)

| Fact | Method | Anchor |
|---|---|---|
| `ClientResourceConfiguration.get_Type = 22`, RequestType = 20 | disasm `mov w0,#imm; ret` | 0x4953FB4/0x4953FBC |
| `ResourceRequest.get_Type = 110` | disasm | 0x4973CB8 |
| `ResourceAnswer.get_Type = 111`, RequestType 110 | disasm | 0x4973AEC/0x4973AF4 |
| `LoadSerializableResourceAsync` chain: connector required → CRC check → cache try → coroutine (network/web) | disasm of generic impls | 0x5047E48/0x5047EB4 |
| `LoadResourceSource {Web=1, Cache=2, BuiltIn=3, Test=4}` | dump.cs enum | 1731098 |
| Logon state machine order 17→19→20→21→22 (config→battle→shared→base→dictionaries) | dump.cs enum | 196290 |
| Cache filename = `"rbi"` + `GetPersistentDataPath()` | disasm + `AuthorizationCache.Filename` const | 0x7D76F44 |
| Built-in `config/gs` = login server XML | UnityPy TextAsset extraction from APK | f69241a5… |
| DES/RSA crypto + ST registry | dump.cs classes + stringliterals | `CSCryptographyInitializer`, `objectDeserializers.get(...)` |

## What one device session yields (schema surface — `schema.json`, 20 classes)

`BattleBaseDictionary` = weaponTypes + unitTypes + buildingTypes + mineTypes + fractions
+ boosts + troops + heroParam, with the live numeric fields:
`UnitType` (46 fields: life/lifeInt, price, cp, time_train(+init), upkeep, spec+tick_to/
from_spec, tier, transport, …) + per-state `UnitStateType` (46 fields: armor(+type/bonus),
speed(+init), sight/radar, rotate, regen, flight, en_max/en_waste/en_regen, …);
`WeaponType` (63 fields: damage triads(+init), distance(s), velocity, shot_start/int/
count/tick[], shell_type, explosion_*, accuracy_*, rotate_*, walking_shot, aiming bitmask,
guided*, cone*, bulletTrajectoryType, gravity, dmg_un/bld_modificator[], …);
`BuildingType`/`BuildingLevelType` (48 fields), `Fraction` (82 — the economy table),
`MineType` (18), `HeroParam` (38), `BoostType`/`TroopType` (21).

EStat mapping and the zero-captured-value honesty table: `inventory.md` §7.

## Capture (device required — blocked here)

No adb/frida/emulator/KVM exists in this environment → **zero values captured**; R1 =
`BLOCKED — DEVICE REQUIRED` with everything staged. The runbook
(`reverse/evidence/prototype-data/on-device-run.md`) + hook script
(`reverse/tools/r1_dictionary_dump.js`, RVAs pinned to the same binary) reduce the device
portion to: install frida-server → one spawn command → reach the main menu → send back
the sanitized `r1_session.jsonl` (+ optional `rbi` pull). Hooks: DeserializeMessage (flow),
SerializableResourceLoaderAsync.TryLoadResourceFromByteBuffer (full payload),
DoResourceLoaded (ingestion proof + quick scalar head-table), resource-config receiver,
ResourceInfo path/CRC getters, cache save; DES stream capture flag-gated off.

## Scope notes

- Browser untouched (evidence-only task); `browser-comparison.md` is the scaffold the
  post-capture implementation task fills (with R3 tick-rate dependency for tick-domain
  fields: `shot_tick[]`, `time_train`, `rotate`, `regen`).
- R2 boundary respected: no second Obfuz pipeline; one shared Frida session possible.
- The prior "values are backend-delivered" policy statement (data-model-extraction §3,
  combat-stats note) is now upgraded from consistency-argument to a proven, reproducible
  pipeline result.
