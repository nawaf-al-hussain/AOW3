# VFX/asset naming check: `fire_*` / `bul_*` / `expl_*` in the extracted-asset catalog (6.9.18)

Created: 2026-10-07 (follow-up to the FileUpload/AOW3 audit — closes audit-report
"Recommended Next Investigations" item #3 and the VFX row of "Unverified Findings").

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

**PARTIALLY CONFIRMED — MEDIUM.** The external naming scheme is not fabricated: the `fire_`
family is real with matching weapon-index-variant structure (CONFIRMED at audio layer), and
an `expl` family exists (partial). The specific claimed sprite names and the `bul_` prefix
remain unverified because the subset does not include weapon-shot VFX sprites. Per the
source-of-truth hierarchy this check can never PROMOTE the external doc — it only tests it.

## Implementation

No browser-implementation impact. (If the tribute later needs authentic FX names, the
`built_invfx_assets_all_*` + `atlas_vfx` names in this catalog are the authoritative ones.)

## Test

Reproduce with: `unzip -l assets/aow3-extracted-assets.zip | grep -E '(^|_|/)fire_'` (11
audio hits) and the same for `bul_` (0 hits) / `expl_` (2 hits).

## Unknowns

- `bul_*` and the exact `_sN` sprite names may exist in unextracted XAPK VFX bundles.
  Definitive closure requires a full UnityPy pass over `assets/bin/Data` bundle names
  (the 6.9.18 XAPK in this repo's LFS) — cheap to run inside the existing pipeline when
  next opened.
- Whether 6.5.22 (external-claim version) used identical names — unknowable without the
  6.5.22 binary.
