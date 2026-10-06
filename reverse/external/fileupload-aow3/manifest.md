# FileUpload/AOW3 External Collection Audit — Manifest

Audit date: 2026-10-06
Auditor: AOW3 Reverse-Engineering Audit Agent (Super Z)
Source: github.com/nawaf-al-hussain/FileUpload, directory `AOW3/` (7 archives, ~144 MB compressed)
Method: full download → SHA-256 → integrity test → full extraction → recursive archive scan → file inventory → cross-verification against current `reverse/` evidence (v6.9.18 `dump.cs`, `stringliteral.json`, pipeline indexes)

## Archives discovered and downloaded

| Archive (path in FileUpload/AOW3) | Size (B) | SHA-256 | Zip integrity | Files |
|---|---|---|---|---|
| `Folder-1/ArtOfWar3_Complete_Analysis.zip` | 336,744 | `3dc82ba5e4f996a8141191db7875eb0f66e3de2191a24e3f995b467ccc90701b` | OK | 25 |
| `Folder-1/artofwar3_complete_phase12.zip` | 51,685,006 | `6bfdf3574ff0a977f4f09d9e81afec3f2799e7fee9f8ea6323fb9c9e46dd5fd6` | OK | 37,529 |
| `Folder-1/artofwar3_phase12_visualization_package.zip` | 9,306,339 | `fa55f57890da0c2444e9e68c4556e01d0897c5522260eabce2b38414163fc9ef` | OK | 87 |
| `Folder-1/artofwar3_source_code.zip` | 42,378,689 | `0f97acaed8182f81c2f53ca8a8be2635defc1a928634f99bbc1509f687cca0e7` | OK | 37,442 |
| `aow3_documentation.zip` | 773,845 | `d44bf32f702b20fa638c880809aefce80765b21343b91951095ffdf2ed0387a6` | OK | 37 |
| `aow3_java_sources.zip` | 37,088,648 | `d77779d006b9b057eda42bdee736c07c17ad45d87b80a3c233a051a7eaba2c0d` | OK | 35,274 |
| `aow3_source_data.zip` | 2,259,559 | `e3a7df2da4ebdfb1d1d91258997dd2ea075520ebd14e2578b3dd9ce3fae4d8f2` | OK | 8 |

Downloaded: 2026-10-06, via GitHub raw/LFS endpoints with authenticated API access.
Originals preserved unmodified; extraction performed into isolated workspace
(`/…/aow3-audit/{original,extracted,analysis,manifests}`). No archive contents were edited.

## Totals

- Extracted files inventoried: **106,214** (≈ 754 MB extracted / 754 MB on disk)
- Nested archives inside the 7 archives: **0** (verified by extension scan across all 106,214 files)
- Executable payloads (.exe/.bat/.ps1/.sh/.cmd/.scr/.msi): **0**
- Python scripts found: 4 (all visualization generators, manually inspected — benign: graphviz/matplotlib only, no network, no filesystem deletion; see audit-report §Tools)

## Inventory by archive

| Archive | Files | Extracted size | Contents |
|---|---|---|---|
| `aow3_java_sources` | 35,274 | 134.7 MB | jadx decompilation of the AOW3 Android APK **Java layer** (`sources/`): 99%+ third-party SDKs (AndroidX, Kotlin, OkHttp, AppLovin, yads, gatewayprotocol, Unity ads). Game-specific: 20 files under `com/geargames/aow/` (logger, nativeplugins: ANR watchdog, push utils, GGNativeUtils logcat bridge). No gameplay logic (gameplay is IL2CPP native, absent from DEX). |
| `artofwar3_source_code` | 35,358 | 135.9 MB | Same jadx tree (byte-identical, 35,274/35,274 files) + APK `raw_extract` (AndroidManifest.xml, META-INF, billing.properties). **Despite the filename: NOT original source, NOT C#/IL2CPP code.** |
| `artofwar3_complete_phase12` | 35,436 | 151.7 MB | Same jadx tree (byte-identical) + same `raw_extract` + the 10 IL2CPP name-list files (below) + the 14 documentation files (below) + visualizations (2 generator scripts + generated PNG/graph outputs) + 2 extra files: `all_types.txt` (≈ duplicate of `all_type_names.txt`), `game_types.json` (9,552 game-namespace types with namespace field). |
| `artofwar3_phase12_visualization_package` | 78 | 15.8 MB | The same 14 documentation files (byte-identical) + dependency graphs, system map, knowledge-graph exports (graphml/CSV/cypher), dashboard HTML. |
| `ArtOfWar3_Complete_Analysis` | 24 | 2.1 MB | The 10 IL2CPP name-list files + the 14 documentation files (byte-identical to the other two archives' copies). |
| `aow3_documentation` | 37 | 1.1 MB | Superset documentation set (23 markdown + diagrams + 3 PNGs + knowledge-graph exports). Same analytical style; includes `Combat_System.md`, `Multiplayer_Architecture.md`, `Units.md`, `Buildings.md`, `Economy_System.md`, `AI_System.md`, `Art_of_War_3_Master_Documentation.md`, `Recreation_Blueprint.md` etc. |
| `aow3_source_data` | 7 | 23.7 MB | Raw `global-metadata.dat`–derived exports of the same APK: `string_table.txt` (100,000 strings), `type_definitions.json` (29,334 raw TypeDefinition records, index-based), `namespaces.json` (98 namespaces + counts), `game_identifiers.json` (10 grouped identifier lists), `gai_commands.txt` (753 GAI command names/constants), `game_strings.txt` (15,364 identifiers), `geargames_identifiers.txt` (334). |

## The 10 IL2CPP name-list files (present in Complete_Analysis, complete_phase12; identical)

`all_type_names.txt` (25,017 type names incl. BCL), `game_types.txt` (607,130 B game-type list),
`methods_damage.txt`, `methods_unit.txt`, `methods_weapon.txt`, `methods_building.txt`,
`methods_battle.txt`, `methods_economy.txt`, `methods_hero.txt`, `methods_network.txt`
(1,247 curated method names total), plus phase12-only `game_types.json` (9,552 entries with namespace).

## Game version identified for every major dataset

**All datasets derive from ONE APK: `com.geargames.aow`, versionCode 38820, versionName 6.5.22**
(AndroidManifest.xml of `raw_extract`, decoded independently for both `artofwar3_source_code` and
`artofwar3_complete_phase12`; identical values). Supporting markers: `billing.properties` → Billing
Client 8.0.0; compileSdk 35 (Android 15). This is **NOT** the version the current repository analyzes
(**6.9.18**). All values/name-lists are therefore recorded as version-specific evidence for 6.5.22.

## Duplicates detected (SHA-256)

1. `artofwar3_source_code.zip` jadx_output == `artofwar3_complete_phase12.zip` jadx_output — **35,274/35,274 files byte-identical**.
2. The 14 documentation files — **byte-identical** across `ArtOfWar3_Complete_Analysis`, `artofwar3_complete_phase12`, `artofwar3_phase12_visualization_package` (3 copies of the same analysis).
3. The 10 decompiled name lists — **byte-identical** between `ArtOfWar3_Complete_Analysis` and `artofwar3_complete_phase12`.
4. `all_types.txt` (phase12) duplicates `all_type_names.txt`.
5. Several `aow3_documentation` files are near-duplicates (same titles/structure) of the Complete_Analysis documentation, generated by the same tooling (knowledge_graph.json identical in role, not byte-identical).

Consequence: the collection effectively contains **one** Java decompile, **one** IL2CPP name-list set, **one** documentation set, **one** metadata-derived dataset — packaged 2–3× under different names. Repetition of a claim across these archives must NOT be counted as independent confirmation (single-source, see audit-report §Circularity).

## Provenance

- Internal paths (`home/z/my-project/project/…`) and the generator scripts indicate the collection is a **workspace snapshot of a prior AI-assisted analysis session** (self-described "phase 12" artifacts). Treat tool-produced names as derived data, and all prose documents as analysis, not evidence.
- Producing tool for Java: **jadx** (sources/ layout). Producing data for IL2CPP lists: Il2CppDumper-style type/method enumeration of 6.5.22 (exact tool/version not recorded in the collection — unrecorded provenance).
- No APK, no `libil2cpp.so`, no `global-metadata.dat` binaries are included in the collection (only derived text). Version identification therefore rests on the decoded manifest.

## Rejected material (not imported)

- 105,000+ jadx `.java` files (third-party SDK boilerplate; no gameplay evidence; legal exposure).
- `type_definitions.json` (raw index-based metadata records; meaningless without the string table; supersedable by a fresh dump).
- `string_table.txt` (100k generic metadata strings incl. BCL; only the curated game-relevant subsets were retained).
- Generated PNG/HTML/graphviz visual outputs (regenerable, no new information).
- The jadx `raw_extract` APK shell files (AndroidManifest, META-INF signatures) — evidence recorded in this manifest instead.

## Imported material (curated, with provenance)

See `evidence/README.md`. Imports live under `reverse/external/fileupload-aow3/evidence/6.5.22/`
and the analysis conclusions under `reverse/external/fileupload-aow3/audit-report.md`,
`reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`, and
`reverse/versions/6.5.22-fileupload-collection.md`.
