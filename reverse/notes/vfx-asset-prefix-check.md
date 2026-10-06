# VFX/asset naming check: `fire_*` / `bul_*` / `expl_*` (6.9.18) — RESOLVED

Created: 2026-10-07 (follow-up to the FileUpload/AOW3 audit — closes audit-report
"Recommended Next Investigations" item #3 and the VFX row of "Unverified Findings").
**Status after the 2026-10-07 Addressables-catalog pass: CONFIRMED (HIGH)** — two of the
three external example names exist verbatim; the third is real under a different prefix
shape.

## What

The FileUpload external doc (`aow3_documentation/Combat_System.md`, 6.5.22-derived) claims
an in-game weapon FX/asset naming scheme of the form `fire_rifle1_s1`, `bul_rifle1_s2`,
`expl_rocket1`. This note records a direct check of that claim against the repository's own
6.9.18 extracted-asset catalog, and the resulting verdict.

## Evidence

| Item | Value |
|---|---|
| Catalog checked | `assets/aow3-extracted-assets.zip` (repo LFS) |
| ZIP SHA-256 | `fff43c4d020f804e54112f6df0fe5b15d37716990b5564ed03001795c740b394` — byte-identical to the committed LFS OID (provenance verified before analysis) |
| ZIP size | 211,727,262 bytes |
| Entries | 2,157 files + 1 `catalog.json`: sprites/ 1,145, audio/ 798, textures/ 197, textassets/ 17 |
| Method | Full `unzip -l` listing → prefix and substring scan over all 2,157 names (`fire_`, `bul_`, `expl_` with word-boundary guards; plus case-insensitive `rifle`, `rocket`, `bullet` substrings) |
| Scope caveat | This zip is the **tribute pipeline's curated extraction** (what `pipeline/extract_v3.py` + assemblers consumed), **not** the complete APK bundle inventory. Absence here is weaker than absence from the game. |
| Catalog.json note | The `catalog.json` inside the zip is an **empty placeholder** (`{"textures": [], "sprites": [], "audio": [], "textassets": []}`); the filenames themselves are the catalog. The audit report's instruction to "grep catalog.json" is satisfied by scanning the entry list. |

## Findings

### 1. `fire_*` — CONFIRMED as a real 6.9.18 naming family (audio layer)

11 weapon-fire audio files match the exact `fire_<weapon-class><index>_<variant>` shape the
external doc described:

```
audio/com.geargames.aow_fire_rifle1_3.wav      audio/com.geargames.aow_fire_rifle2_3.wav
audio/com.geargames.aow_fire_machine1_1.wav    audio/com.geargames.aow_fire_gun2_2.wav
audio/com.geargames.aow_fire_gun5_1.wav        audio/com.geargames.aow_fire_gun6_1.wav
audio/com.geargames.aow_fire_gun7_1.wav        audio/com.geargames.aow_fire_missile3_1.wav
audio/com.geargames.aow_fire_missile4_2.wav    audio/com.geargames.aow_fire_missile5_1.wav
audio/com.geargames.aow_fire_torpedo2_1.wav
```

(4 further `u2_*_fire_*` files are unit voice lines — orders/fire commands — not the FX family.)

This is structural agreement with the external claim: same `fire_` prefix, same
weapon-family + index + variant numbering shape. The external doc's examples used `_s1`/
`_s2` suffixes (sprite/shot variants); our audio variants use `_1/_2/_3`. Same naming
convention, different asset layer.

### 2. `expl_*` — PARTIAL

Only the frozen-explosion family exists in the subset (2 texture entries:
`built_invfx_assets_all_frozen_expl_2[_alpha]_256x256.png`). The claimed `expl_rocket1`
is not present, but an `expl` family demonstrably exists in game assets.

### 3. `bul_*` — NOT FOUND (0/2,157)

No sprite, texture, or audio name in the subset starts with or contains the `bul_` token.
(Only unrelated substrings: `smoke_bullet`/`bullet_storm` voice lines.)

### 4. Where VFX actually lives in the subset

The real VFX texture layer we hold is the `built_invfx_assets_all_*` family
(`fx_railgun_cracks`, `fx_railgun_funnel`, `psitank_wave[_active|_passive_displace]`,
`coiltank_lightning_11`, `frozen_funnel`, `ice_ball`, `flame_512`, `exp_shell_track_1`,
`SolarisChainLine`, `joker_confetti`, …) plus the `sactx-…atlas_vfx-…` atlas. Weapon-shot
sprites (`fire_rifle1_s1`-style) are not in the curated subset — they would live in the
unextracted VFX bundles of the XAPK.

## Version

6.9.18 (`com.geargames.aow`) — the same version the asset zip was extracted from by the
pipeline; external claim is 6.5.22-derived.

## Confidence

**CONFIRMED (HIGH)** (upgraded 2026-10-07 from PARTIALLY CONFIRMED (MEDIUM) after the
Addressables-catalog pass below). The external naming scheme is real 6.9.18 game content:
`fire_rifle1_s1` and `bul_rifle1_s2` exist verbatim; `expl_rocket1` does not exist as a
literal name but the explosion family it gestures at is real (`boom_expl*_s*`, with `expl`
as the size/variant token and rockets as `bul_rocket*` / `anim_rocet_boom`). Per the
source-of-truth hierarchy this only tests the external doc — nothing was imported from it.

## Catalog pass (2026-10-07 follow-up — the full XAPK bundle-name pass)

| Item | Value |
|---|---|
| XAPK | `Art-of-War-3_6.9.18_apkcombo.com.xapk` (repo LFS), 270,599,286 bytes, SHA-256 `1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e` — byte-identical to the LFS OID and to the hash recorded in `armor-stat-helper-native-analysis.md` §1 |
| Structure | 7 content APKs: base `com.geargames.aow.apk` (6,649 entries) + `built_invfx_assets_all` + `defaultlocalgroup_assets_all` + `built_inomniwindow_assets_all` + 3 decorations packs |
| Authoritative index | `assets/aa/catalog.json` — Unity Addressables main content catalog (AddressablesMainContentCatalog, build hash `d8af169b90a763719661bca80f849d4c`): 863 internal ids = **832 asset addresses** + 31 bundle/runtime paths |
| Scope note | All weapon VFX is addressable (`Assets/Design/Explose/VFXPrefabs_Addressables/…`), so the game's own catalog is the authoritative index for this claim; enumerating object names inside the 5,489 hash-named `bin/Data` bundles would only re-derive the same content and was not needed for the verdict |

### Family counts in the 6.9.18 Addressables catalog

| Family | Addresses | Breakdown |
|---|---|---|
| `bul_` | **51** | 41 VFX prefabs (`VFXPrefabs_Addressables/high/bul_…`) + 6 animations (`Explose/Animations/bul_…`) + 4 materials (`Explose/Materials/bul_psitank_wave_*.mat`, `coiltank_ball_bul_*.mat`) |
| `fire_` | **24** | 18 VFX prefabs + 6 animations (plus the 11 `fire_*.wav` audio files already confirmed in the extracted-zip pass) |
| `expl_` (literal prefix) | **0** | explosions are `boom_…` prefabs with `expl` as the second token: `boom_expl{1..5}_s{0..6}_{ground\|veh\|water}`, `boom_bld_expl{1,2}_s*_w`, `boom_unit_expl*_s*`, **`boom_expl5_s5_nuke*` (nuclear), `boom_expl5_s5_space*`** |

Full lists: `reverse/evidence/vfx-catalog-families-6.9.18.txt`.

### The three external examples

| External claim | 6.9.18 catalog result |
|---|---|
| `fire_rifle1_s1` | **EXISTS VERBATIM** — `Assets/Design/Explose/VFXPrefabs_Addressables/high/fire_rifle1_s1.prefab` |
| `bul_rifle1_s2` | **EXISTS VERBATIM** — `Assets/Design/Explose/VFXPrefabs_Addressables/high/bul_rifle1_s2.prefab` (s1/s2/s3 variants; `bul_rocket1_s2_1/2/3.anim` too) |
| `expl_rocket1` | **0 exact matches**; the real families are `boom_expl*` (explosions, incl. nuke) and `bul_rocket*` / `anim_rocet_boom` (rockets) — the external author evidently transcribed the `expl` variant token and the rocket family into a single invented name |

### Complete shot-VFX prefab taxonomy (513 addressable prefabs)

`hero_*` 246, `eff_*` 81, `boom_*` 66, `bul_*` 41, `fire_*` 18, `bld_*` 8, `debris_*` 8,
`jet_*` 8, `funnel_*` 6, `waves_*` 6, `flamethrower_*` 4, `impact_*` 4, `spec_*` 4, plus
smaller families (`wasp`, `trail`, `effect`, `cerber`, `global`, `dust`, `jump`).

## Implementation

No browser-implementation impact. (If the tribute later needs authentic FX names, the
`built_invfx_assets_all_*` + `atlas_vfx` names in this catalog are the authoritative ones.)

## Test

Reproduce with:

1. `unzip -l assets/aow3-extracted-assets.zip | grep -E '(^|_/)fire_'` — 11 audio hits;
2. extract `assets/aa/catalog.json` from the XAPK's base APK and count `m_InternalIds`
   strings starting with `Assets/` that contain `/bul_`, `/fire_`, `/expl_` — 51 / 24 / 0;
3. check the two verbatim examples:
   `Assets/Design/Explose/VFXPrefabs_Addressables/high/{fire_rifle1_s1,bul_rifle1_s2}.prefab`.

## Unknowns

- ~~`bul_*` and the exact `_sN` sprite names may exist in unextracted XAPK VFX bundles.~~
  **Settled 2026-10-07**: they exist — 41 `bul_` VFX prefabs in the Addressables catalog.
- Whether 6.5.22 (external-claim version) used identical names — unknowable without the
  6.5.22 binary (but verbatim 6.9.18 agreement makes fabrication implausible).
- Object names inside the 5,489 hash-named `bin/Data` bundles (non-addressable internals:
  sharedassets, globalgamemanagers) were not enumerated — redundant for this claim since
  the catalog is the game's own content index and all weapon VFX is addressable.
