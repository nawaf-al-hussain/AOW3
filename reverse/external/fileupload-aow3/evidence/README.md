# Imported Evidence — FileUpload/AOW3 (6.5.22)

Curated imports from the external `FileUpload/AOW3` collection. **Every file here is
version-specific evidence for AOW3 6.5.22 (versionCode 38820)**, not for the current
6.9.18 evidence chain. Read `../../audit-report.md` before using any of this.

## Provenance (applies to every file in this directory)

```text
External source:
  github.com/nawaf-al-hussain/FileUpload, directory AOW3/
  (primary: Folder-1/ArtOfWar3_Complete_Analysis.zip; gai_commands/game_identifiers/namespaces:
  aow3_source_data.zip; game_types.json: Folder-1/artofwar3_complete_phase12.zip)

Archive SHA-256:
  ArtOfWar3_Complete_Analysis.zip   3dc82ba5e4f996a8141191db7875eb0f66e3de2191a24e3f995b467ccc90701b
  artofwar3_complete_phase12.zip    6bfdf3574ff0a977f4f09d9e81afec3f2799e7fee9f8ea6323fb9c9e46dd5fd6
  aow3_source_data.zip              e3a7df2da4ebdfb1d1d91258997dd2ea075520ebd14e2578b3dd9ce3fae4d8f2

Original author/source: unrecorded (prior AI-assisted analysis session; tooling: Il2CppDumper-style
enumeration + metadata parsing of APK 6.5.22). Producing session's exact tool/version: not recorded.

Game version: com.geargames.aow 6.5.22 (versionCode 38820, compileSdk 35, Billing 8.0.0)

Downloaded: 2026-10-06 (audit)
Validation: cross-matched against this repository's 6.9.18 dump.cs (Il2CppDumper 6.7.46)
Validation result: per-file, see table below
Confidence: per-file, see table below
```

## Files

| File | What it is | Original file | Validation vs 6.9.18 | Confidence |
|---|---|---|---|---|
| `methods_damage.txt` | 6.5.22 method names, damage category (curated list) | `ArtOfWar3_Complete_Analysis/decompiled/methods_damage.txt` (unmodified) | `CalculateWeaponArmorDamage` present @dump.cs:168923; `CreateDamageForMediumArmor`, `GetDamageForMediumArmor`, `GetSuperWeaponDamageForHeavyArmor`, `SafeSetDamageStat` present; `calcBasicDamage`, `generateMineDamage`, `calcCoilTankArmorBonusFrontal` absent | UNVERIFIED as completeness; HIGH as 6.5.22 structural record |
| `methods_unit.txt` | 6.5.22 method names, units | same pattern | 74–80% exact-name agreement (see verification file) | same |
| `methods_weapon.txt` | 6.5.22 method names, weapons | same | `WeaponDamage{Light,Medium,Heavy}Value` present | same |
| `methods_building.txt` | 6.5.22 method names, buildings | same | partial (drift in train/redeploy commands) | same |
| `methods_battle.txt` | 6.5.22 method names, battle | same | partial (drift: `get_Bat*`, facade commands) | same |
| `methods_economy.txt` | 6.5.22 method names, economy | same | partial | same |
| `methods_hero.txt` | 6.5.22 method names, heroes | same | hero names verified (Atlant, CoilTank, Beholder, Seraphim, Leviathan, Typhoon, Cerber, Firebat present in 6.9.18) | same |
| `methods_network.txt` | 6.5.22 method names, network | same | crypto/connection classes verified | same |
| `methods-vs-6.9.18-verification.txt` | **Audit-generated**: all 1,247 external names + per-name verdict vs 6.9.18 dump | produced by this audit (script: `scripts/gen_verification.py` in audit workspace) | — | CONFIRMED as comparison record |
| `version-drift-methods.txt` | **Audit-generated**: the 244 not-found names | produced by this audit | — | CONFIRMED as comparison record |
| `gai-commands-6.5.22.txt` | 753 GAI command system names (classes + `GAI_COMMAND_*` constants) | `aow3_source_data/source_original/gai_commands.txt` (unmodified) | 146/146 constant names match; 603/753 exact class matches (remainder = enum names/base/generic forms) | CONFIRMED (name level) |
| `game-types-6.5.22.json` | 9,552 game-namespace types with namespace field | `artofwar3_complete_phase12/.../decompiled/game_types.json` (unmodified) | spot-checks pass; full diff not performed | UNVERIFIED as completeness; HIGH as 6.5.22 record |
| `game_identifiers.json` | 10 grouped identifier lists (NetworkMessages/Units/Buildings/Combat/AI/…) | `aow3_source_data/source_original/game_identifiers.json` (unmodified) | spot-checks pass | same |
| `namespaces.json` | 98 namespaces with type counts | `aow3_source_data/source_original/namespaces.json` (unmodified) | spot-checks pass | same |

## Usage rules

1. These are **leads and cross-version references**, never overrides of direct 6.9.18 evidence.
2. Before using any name here as a fact about 6.9.18, re-verify against `dump.cs`
   (the verification file is the fast path).
3. Never cite these lists as evidence of *absence* of a mechanism — the lists are curated subsets.
4. Legal note (mirrors repo README): personal study only; derived from Gear Games' APK;
   do not redistribute extracted assets or wholesale decompilation dumps.
