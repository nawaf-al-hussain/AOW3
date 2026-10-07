# The 10 remaining heroes wired into the tribute (v=17) — evidence & stand-in record

Created: 2026-10-07. Task: "the 10 remaining hero prefabs" — extend the hero pass
(Task 16: Cerber/Seraphim, v=15) to the full hero roster.

## 1. The roster (native ground truth)

`HeroTextureAbilityInfos.HeroTypes` (dump.cs:247448-247464, TDI 6249) enumerates exactly
12 heroes: `Cerber=1, Wasp=2, Seraphim=3, Mole=4, Leviaphan=5, Solaris=6, Beholder=7,
Gatling=8, Psitank=9, Salamander=10, Atlas=11, Coiltank=12` (plus `None=0`). Task 16
shipped Cerber + Seraphim; this pass wires the remaining 10 (plus the card-icon evidence
for `codomash`, which has NO HeroTypes entry — recorded below, not implemented).

## 2. Blocking fact: hero model prefabs are NOT in the package

The 1:1 model pass for the remaining heroes is **blocked by the package itself**:

- All UnityFS content in the 6.9.18 XAPK = 10 asset-pack bundles (base APK `assets/aa/Android/*`
  = shaders/maps/minimaps; `assets/bin/Data` = 3,794 null-padded files + 1,677 FSB5 FMOD
  banks — **zero** UnityFS unit content). Verified by full magic-scan of all 5,502 bin/Data files.
- Scene-graph scan of all bundles: the only hero-related meshes/objects are **VFX**
  (`built_invfx_assets_all`: 266 hero-named VFX objects — `hero_bul_*`, `hero_fire_*`,
  `hero_boom_*`, `hero_impact_*` per hero) and 4 hero model UV **textures**
  (`f1_hero_atlant`, `f2_hero_gatling`, `f2_hero_leviaphan`, `f2_hero_salamander`).
- No hero chassis prefabs/meshes exist anywhere in the package — consistent with the
  standing conclusion (Task "Gameplay 1:1 pass") that model/stat content is
  **server-delivered at runtime** (Addressables RuntimePath is local-only; the live
  resource loader is `LoadResourceSource Web/Cache`).

Therefore the 10 heroes are implemented with **chassis-faithful stand-in models** from the
existing authentic unit GLBs, exactly as the roster pass did for unreproduced mechanics —
with every stand-in documented per-def. When hero model bundles ever become available
(device cache / CDN dump), the `UNIT_MODEL` entries are the only swap points.

## 3. Authentic hero card art (shipped in the package) — extracted & wired

The `sprites/com.geargames.aow_hero_card_ico_*` family in `assets/aow3-extracted-assets.zip`
(LFS, SHA-256 `fff43c4d…`) provides authentic in-game hero card icons:

| Card file (docs/assets/) | Source sprite | Hero |
|---|---|---|
| card-hero-wasp.png | hero_card_ico_wasp | Wasp |
| card-hero-gatling.png | hero_card_ico_gatling | Gatling |
| card-hero-leviaphan.png | hero_card_ico_leviaphan | Leviaphan |
| card-hero-beholder.png | hero_card_ico_beholder | Beholder |
| card-hero-psitank.png | hero_card_ico_psitank | Psi Tank |
| card-hero-solaris.png | hero_card_ico_solaris | Solaris |
| card-hero-salamander.png | hero_card_ico_salamander | Salamander |
| card-hero-coiltank.png | hero_card_ico_coiltank | Coil Tank |
| card-hero-mech-f1.png | ico_mech_heroes_f1 (512-wide banner) | Atlas (blue mech render) |
| card-mech.png (legacy) | — | Mole (procedural-era fallback; no hero icon ships for Mole) |

Also present in the zip: `hero_card_ico_atlant` + `hero_card_ico_codomash`. The Atlas def
uses the `ico_mech_heroes_f1` render; note the game-asset naming drift: enum `Atlas=11`
(with `AtlasImmortalityTime/57`) vs asset name `f1_hero_atlant`/`hero_card_ico_atlant` —
the artillery-hover and the siege-mech reads in community material are reconciled here as
ONE enum entry with the immortality ability (the enum is the native ground truth; the
icon is wired to the siege-mech render). `codomash` (workshop stats factory
`CreateStatsKodomash` + card icon + `f2_hero_codomash_and_turret` texture) is a
13th hero-like unit with no HeroTypes slot — left for a future pass.

## 4. Implementation (docs/game.js, additive)

- **Defs**: 10 new `UNITS` entries (`kind:"hero"`, per-faction), each with native anchors
  in its `desc` (HeroTypes id, ability EStats, VFX names) and documented stand-ins.
- **HERO_ORDER** = all 12; player build bar filters `faction === 1` (f2 heroes are AI-side).
- **PRODUCER_OF**: all heroes → `herobld` (existing Hero Building producer).
- **UNIT_MODEL** stand-ins (authentic GLBs):
  wasp→f1_avia_helicopter (rotor-aircraft evidence: `eff_fan_helicopter_wasp`),
  gatling→f2_veh_porcupine (rotary AA walker), atlas→f1_veh_fortress (heavy hull),
  mole→f1_veh_shield (support chassis), leviaphan→f2_veh_mammoth (large hull),
  beholder→f2_veh_jaguar, psitank→f2_veh_coyote, solaris→f1_veh_zeus (tesla walker;
  `swapTint` re-tints it red for the f2 owner), salamander→f2_veh_typhoon (MLRS),
  coiltank→f2_veh_armadillo.
- **Ability hooks (natively anchored)**:
  - Atlas `immortality:{dur:3,cd:22}` — periodic invulnerability window
    (`AtlasImmortalityTime/57`, `CreateStatsAtlas`).
  - Coiltank `frontal:0.3` + `chain` — frontal-arc damage reduction
    (`CoilTankFrontalArmor/56`) and 2-target arc (`CoilTankMaxTargets/55`).
  - Psitank `slowOnHit` — −28% target fire-rate for 3s
    (`PsiAttackSpeedReduction/52` + `PsiSlowdownDuration/53`).
  - Gatling `spinUp` — fire-rate ramps to 1.8× while continuously firing
    (`WolverineMachineGunMaxAccelerationTime/54`).
  - Solaris `chain` — lightning arcs to 2 extra ground targets.
  - Salamander `burnOnHit` — 3s burn DoT (documented stand-in mechanic).
  - Mole `mineLayer` — seeds proximity mines (max 6, arm 1.5s, splash 85) mirroring the
    native `MineStatsFactory` per-armor damage channels (`reverse/notes/units/estat-stat-models.md` §3).
  - Beholder — stat-level only: highest view in the field (`MaxViewReachTime/51` anchor).
  - Leviaphan — air battleship with splash broadsides (gun_front/side/air VFX evidence).
- **AI**: builds Hero Building after 200s; produces a random f2 hero when its hero slot is empty.
- **QA hook**: `window.__aow3sim` exposes the live sim (debug-only, try/catch-guarded).

## 5. QA (headless, fresh session)

- node --check clean; battle start → all 12 heroes spawned via sim (6 f1 + 6 f2), alive
  and rendering, **0 page errors** across the session.
- Hero slot rule: enqueue of a 2nd hero while one is queued correctly rejected.
- Direct ability tests (sim-level): slow ✓, burn (dps 9) ✓, immortality blocks damage ✓,
  frontal armor 70 front vs 100 rear (exact 30%) ✓, chain 18 = 40×0.45 exact ✓ (and
  correctly skips aircraft), mines laid ✓ (proximity detonation armed), gatling heat
  observed rising live (0.38 mid-fire) ✓.
- Build bar shows the 6 f1 hero cards with authentic card art; f2 heroes excluded.

## 6. Unknowns / follow-ups

- Hero chassis models: blocked on server-delivered bundles (§2). `UNIT_MODEL` is the swap point.
- `codomash` hero (no HeroTypes slot): card icon + texture + workshop-stats factory exist;
  mechanics unresolved — future pass.
- Mole: no card icon, no VFX names, no ability EStat in the package — weakest-evidence
  hero; currently a minelayer with documented stand-ins.
- Balance values remain documented approximations (server-side tables), consistent with
  every prior combat pass.
