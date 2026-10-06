# Art of War 3 — Reverse-Engineering Kit

Artifacts recovered from **Art of War 3 v6.9.18** (`com.geargames.aow`, Gear Games),
IL2CPP ARM64 build with **unencrypted** `global-metadata.dat` (metadata v31, Unity 2022.3-line).

## Contents

| File | Size | What it is |
|---|---|---|
| `dump.cs.zip` | 63.9 MB raw | Complete C# class/method/field dump — every type, method signature and field offset of the game assembly |
| `stringliteral.json.zip` | 2.7 MB raw | All string literals with their il2cpp addresses |
| `notes/combat-stats.md` | — | Recovered combat model: damage/armor function, weapon triads, EStat schema |
| `external/fileupload-aow3/` | — | Audited external collection (6.5.22-era name lists + cross-version verification). Start at `external/fileupload-aow3/audit-report.md` |
| `versions/6.5.22-fileupload-collection.md` | — | Version dossier for the external 6.5.22 dataset |
| `evidence/conflicts/` | — | Conflict/drift records (external claims vs current binary) |

## Not included (regenerable, large)

`script.json` (177 MB address→name map for Ghidra/IDA), `il2cpp.h` (168 MB) and
`DummyDll/` (~150 assemblies) are produced by the same dump run and were omitted
to keep the repo light.

## Regenerate everything

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
- `WeaponDamageLightValue / WeaponDamageMediumValue / WeaponDamageHeavyValue` — ~0x7fcf14c
- `EStat` enum (Health, Price, CommandPoints, SupplyIncome, …) — dump.cs:168776
- `ArmorType` enum (Light/Medium/Heavy) — dump.cs:166696
- `WeaponTypeMapEditorConfig` (m_damageLight/Medium/Heavy, m_distance, m_accuracyStatic/Walk, …) — dump.cs:256556

The game ships Obfuz.Runtime obfuscation, but the metadata is not encrypted, so
the dump succeeds cleanly.

## Legal

For personal study and the private browser-tribute project only. Art of War 3 and
all associated assets are © Gear Games.
