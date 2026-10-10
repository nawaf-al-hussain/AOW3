# Art of War 3 — Reverse-Engineering Kit & Central Index

Artifacts recovered from **Art of War 3 v6.9.18** (`com.geargames.aow`, Gear Games),
IL2CPP ARM64 build with **unencrypted** `global-metadata.dat` (metadata v31, Unity 2022.3-line).

This file is the **central reverse-engineering index**: what has been recovered, which
tools reproduce each result, where evidence lives, which tasks are blocked, how findings
reach the browser build, and what is next. Prioritized planning lives in
[`notes/reverse-engineering-roadmap.md`](notes/reverse-engineering-roadmap.md); the
implementation-gap source of truth is
[`notes/1-to-1-fidelity-audit.md`](notes/1-to-1-fidelity-audit.md) (§6 gap register,
§7 ranked RE questions). Machine-readable registry: [`evidence/registry.json`](evidence/registry.json).

## Provenance (pin these for every finding)

| Artifact | sha256 | Note |
|---|---|---|
| `Art-of-War-3_6.9.18_apkcombo.com.xapk` (repo root, LFS) | `1a41e033…` (270,599,286 B) | original package, apkcombo mirror |
| `libil2cpp.so` (ARM64, from `config.arm64_v8a.apk`) | `8ace05bb…` | native code under analysis |
| `global-metadata.dat` (v31, unencrypted) | `d2e8dd0d…` | from `com.geargames.aow.apk` |
| `dump.cs` (Il2CppDumper v6.7.46 output) | `0050e67d…` | 63.9 MB, complete managed dump |

Never mix findings across versions. The one alternate dataset (external 6.5.22 name
lists) is quarantined under `external/fileupload-aow3/` with its own audit and
cross-version verification against 6.9.18 (`evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`).

## Pipeline (how artifacts are produced)

```
XAPK ──unzip──> config.arm64_v8a.apk ──> lib/arm64-v8a/libil2cpp.so ─┐
     └────────> com.geargames.aow.apk ──> …/global-metadata.dat ─────┤
                                                                     ▼
                            Il2CppDumper v6.7.46 ──> dump.cs (+ script.json/il2cpp.h, regen)
                                                                     │
        ┌────────────────────────────────────────────────────────────┤
        ▼                                                            ▼
  Capstone ARM64 disassembly                          UnityPy bundle unpacking
  (tools/*_native_analysis.py, tools/*_decode.py)     (pipeline/tools/unpack_bundles.py)
        │                                                            │
        ▼                                                            ▼
  evidence/*.txt + notes/*.md                        GLB models / atlases / audio / map JSON
        │                                                            │
        └──────────────> fold-in protocol <──────────────────────────┘
              (verified rule -> smallest game.js/data change -> regression test -> v bump)
```

## What has been recovered (by area)

| Area | Status | Key facts | Primary evidence / note |
|---|---|---|---|
| Damage-vs-armor curve | CONFIRMED | `CalculateWeaponArmorDamage` 0x7cc1c18: mitigation ∈ [0.1, 1.0], 0.9/0.1 constants; sole mitigation site (surface re-verified) | `notes/combat-stats.md` §1, `notes/armor-stat-helper-native-analysis.md` |
| Weapon counter-triad | CONFIRMED | three damage ints (0x28/0x2c/0x30) vs Light/Medium/Heavy armor triad (EStat 7/8/9) | `notes/combat-stats.md` §2 |
| EStat schema (78 stats) | CONFIRMED | full enum + 45 IStatModel classes pinned; tier caps extracted 72/78 | `notes/units/estat-stat-models.md`, `evidence/data-model/estat.json` |
| MaxStat tier caps | CONFIRMED | constructor literals → `AOW3_MAX_STAT_TIERS` (Health 8000/25000/45000 etc.); Build J: factory labels corrected (Max2/Max3 store FirstMax=v1, BaseMax=v2) | `notes/maxstat-tier-band-decode.md`, `evidence/estat/estat-tiers.txt` |
| MaxStatValueProvider.Get | CONFIRMED (Build J) | Get = min(piecewise fraction, 1.0): 0.8/0.15/0.05 non-armor rungs, 0.9/0.1 armor-damage keys; NOT a clamp | `notes/maxstat-tier-band-decode.md`, `evidence/estat/estat-get-decode.txt` |
| Weapon accuracy | CONFIRMED | static/dynamic curves, constants 100/1000/10000/(1000−10·decr)/10⁶; dynamic keyed on shooter walking | `notes/weapon-accuracy-native-analysis.md` |
| Weapon surface (shell types, aiming mask, AA) | CONFIRMED | type 0x24 = SHELL_TYPE_*, `aiming` 0x8B 6-class bitmask, OCCUPATION_FOR_AIR 0x1A, hit_bonus client-inert, no crit system | `notes/weapon-type-surface-native-analysis.md` |
| Unit FSM | CONFIRMED (shape) | rotate/aim/fire-gate/burst/acquire/retaliate+warn/guard-return/die state machine | `notes/unit-state-machines-native-analysis.md` |
| Command/stance family | CONFIRMED | defend/bombard/dont-shoot/take-positions/hold/patrol/garrison dispatch (GAICommandSpecMode 410916); hotkeys 24-26/32 | `notes/phase5-missions-minrange.md`, `notes/defend-chase-takepos-decode.md` |
| Defend leash | CONFIRMED mechanism (Build I) | leash = client-computed band + 1 inside `$Pg` (NOT server-delivered); band dataflow classified Build I/J; join-arm values bounded residual | `notes/defend-chase-takepos-decode.md`, `notes/maxstat-tier-band-decode.md` |
| TakePositions cell masks | CONFIRMED | 0x215F/0xFEE0/0xFEFD masks, AND-reduce 15-bit clamp, per-hero partition; bit space = ClientBattleCell.m_passMask with 13/15 bits NAMED (Task 59), CheckByMask = blocked-state test | `evidence/combat/takepos-cells-decode.txt`, `notes/r6-bitname-crossref.md` |
| Obfuz constant pool | CONFIRMED (R2) | **697/697 values statically decoded, 0 device runs needed** (629 int, 66 string, 2 float) | `evidence/obfuz/inventory.md`, `tools/obfuz_static_decode.py` |
| Damage pipeline (client side) | PARTIAL | pipeline traced to UI boundary; live application semantics need device (B4) | `notes/damage-pipeline-native-analysis.md` |
| Unit roster | STRUCTURE CONFIRMED, values approximate | ids/roles from `UnitType.UNIT_ID_*` + audio keys; per-unit hp/price/damage are server-delivered (absent from APK) | `notes/unit-roster-native-analysis.md` |
| Visual assets | EXTRACTED & WIRED | 26 skeletal GLBs, 688 props, real map (6,371 placements), fonts (Refrigerator Deluxe Bold), flags/insignias, FX sprites | `notes/visual-fidelity-audit.md`, `pipeline/` |

## Tool → result map (reproduce any result)

| Tool | Reproduces | Output |
|---|---|---|
| `tools/obfuz_static_decode.py` (+ `obfuz_secret_key.bin`) | full Obfuz pool decode from `libil2cpp.so`+metadata | `evidence/obfuz/obfuz-pool-values.json` (697/697) |
| `tools/extract_data_model.py` / `gen_data_fixture.js` | EStat/weapon/unit schema → `docs/data/*.js` fixture | `evidence/data-model/*.json`, `evidence/tests/data-model.test.js` |
| `tools/extract_maxstat_tiers.py` | tier-cap literals from ctor bytes | `evidence/estat/estat-tiers.txt` |
| `tools/maxstat_get_decode.py` / `maxstat_literals.py` | Get/Calculate/CalcWeaponArmorDamage bodies (Build J) | `evidence/estat/estat-get-decode.txt` |
| `tools/band_dataflow*.py` | `$Pg` band store classification (Build I/J) | `evidence/combat/band-dataflow{,-2,-3}.txt` |
| `tools/pg_ug_windows.py` / `pg_constants_scan.py` | `$Pg` branch enumeration, `$UG/$yG` chains | `evidence/combat/pg-branches-decode.txt` |
| `tools/takepos_disasm.py` | TakePositions masks/cell classes | `evidence/combat/takepos-cells-decode.txt` |
| `tools/specmode_native_analysis.py` | stance dispatch (ACT_* family) | `evidence/combat/specmode-native.txt` |
| `tools/armor_native_analysis.py` | armor-damage surface closure | `evidence/` + `notes/armor-stat-helper-native-analysis.md` |
| `tools/weapon_type_surface_native_analysis.py` | shell-type/aiming/AA decode | `evidence/combat/weapon-type-*.txt` |
| `tools/r1_dictionary_dump.js` | (device) runtime prototype-dictionary capture | `evidence/prototype-data/` — **blocked on device** |
| `pipeline/tools/unpack_bundles.py` → `assemble_glb.py` | asset GLB/atlas extraction | `docs/assets/models/`, `pipeline/map_jungle.json` |
| `pipeline/tools/export_map.py` / `export_heightmap.py` | real map data for the browser | `docs/assets/models/map.json` etc. |

Disassembly scripts share the Capstone ARM64 harness in `tools/armor_native_analysis.py`
(vaddr↔file-offset ELF map, rodata float annotation) — reuse it before adding new deps.

## How the browser consumes verified findings

1. **Fold-in protocol** (code rules): a decoded rule becomes the smallest appropriate
   `docs/game.js` / `docs/data/*.js` change inside the SIM KERNEL or data layer, tagged
   with its native anchor (address, dump.cs line, sha256). Cache-bump `game.js?v=N` per
   AGENTS.md §35.1. Regression vectors go to `evidence/tests/*.test.js` (extraction of
   the shipped kernel — tests must not restate the implementation).
2. **Data pipeline**: schema-level facts go through `tools/extract_data_model.py` →
   `docs/data/*.js` (`AOW3_DATA`), fixture-verified. Per-unit VALUES stay
   gameplay-tuned approximations until R1 delivers server tables.
3. **Asset pipeline**: extracted GLBs/atlases/audio land in `docs/assets/` via
   `pipeline/`; provenance recorded in `notes/visual-fidelity-audit.md`.
4. **Comments as provenance**: misleading comments are corrected in the next fold-in
   (example: v=56 corrects DEFEND_TETHER leash provenance, Get fraction contract,
   tier rung labels per Build I/J).

## Blocked tasks (exact missing prerequisites)

| Task | Blocker | What would unblock it |
|---|---|---|
| R1 runtime balance capture | no compatible device / installed client / authenticated session in this environment | user-run Frida session per `evidence/prototype-data/on-device-run.md` (`tools/r1_dictionary_dump.js` is ready) |
| R3 native tick rate | same device dependency | on-device frame/tick instrumentation |
| R4 live damage application | live-server semantics not observable client-side | controlled device experiments (dev plan Phase 24 scenarios) |
| R9 battle wire protocol | traffic capture needs device + (un)pinning decision | TLS-unpin + capture, or Frida message hooks |
| R10 camera/UI metrics | device screen recordings absent | record gameplay per dev plan Phase 18/20 |
| R11 Addressables DLC scan | device storage / remote catalogs not reachable | pull `assets/aa/catalog.json` + bundles, re-run `unpack_bundles.py` |

Offline-resumable state for R1 (schema parsing, dictionary decode, browser import) is
built: `notes/r1-prototype-data-pipeline.md`, `evidence/prototype-data/schema.json`.

## Not included (regenerable, large)

`script.json` (177 MB address→name map for Ghidra/IDA), `il2cpp.h` (168 MB) and
`DummyDll/` (~150 assemblies) are produced by the same dump run and were omitted
to keep the repo light.

## Regenerate the dump

```bash
# inputs are inside the XAPK (repo root):
#   config.arm64_v8a.apk      -> lib/arm64-v8a/libil2cpp.so
#   com.geargames.aow.apk     -> assets/bin/Data/Managed/Metadata/global-metadata.dat
dotnet Il2CppDumper.dll libil2cpp.so global-metadata.dat out_dir
# tool: Il2CppDumper v6.7.46 (net6) — https://github.com/Perfare/Il2CppDumper
```

Verified run (this repo):

```
Metadata Version: 31
Il2Cpp Version: 31
CodeRegistration  : 0x8fdcfd0
MetadataRegistration: 0x935ec88
```

## Key entry points recovered

- `CalculateWeaponArmorDamage(float dmg, EStat armorStat)` — dump.cs:168923
- `MaxStatValueProvider.Get/Calculate` — 0x7CC176C/0x7CC1A94 (Build J decode)
- `WeaponDamageLightValue / WeaponDamageMediumValue / WeaponDamageHeavyValue` — ~0x7fcf14c
- `EStat` enum (Health, Price, CommandPoints, SupplyIncome, …) — dump.cs:168776
- `ArmorType` enum (Light/Medium/Heavy) — dump.cs:166696
- `WeaponTypeMapEditorConfig` (m_damageLight/Medium/Heavy, m_distance, m_accuracyStatic/Walk, …) — dump.cs:256556
- `GAICommandSpecMode` ACT_* stance dispatch — dump.cs:410916
- `$Pg` UnitAct (Obfuz) — 0x483C244..0x48470D0 (Builds I/J)

The game ships Obfuz.Runtime obfuscation, but the metadata is not encrypted, so
the dump succeeds cleanly and the pool decodes statically (R2).

## Legal

For personal study and the private browser-tribute project only. Art of War 3 and
all associated assets are © Gear Games.
