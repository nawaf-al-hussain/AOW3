# Visual Fidelity Audit — AOW3 browser tribute vs Art of War 3 v6.9.18

Created: 2026-10-09 (Task 45 — visual-fidelity reconstruction, Phase 2 deliverable).
Baseline verified immediately before this audit: **854/854 assertions, 8/8 suites green**
(accuracy 13, commands-determinism 50, data-model 379, lockstep-jip 88, phase5 213,
replay 45, stat-caps 37, unit-fsm 29). HEAD at audit time: `92f7a15`.

Every significant claim below carries an evidence label per root `AGENTS.md` §29/§12:

| Label | Meaning |
|---|---|
| `[NATIVE]` | directly supported by native binary/decompiled evidence |
| `[DECOMP]` | supported by decompilation (dump.cs, IL2CPP metadata) |
| `[EXT]` | extracted directly from game assets (GLB/PNG/JSON in `docs/assets/`) |
| `[INFER]` | strong inference from evidence |
| `[BROWSER]` | current browser implementation behavior (NOT evidence of AOW3) |
| `[SPEC]` | proposed reconstruction/calibration, not proven original behavior |

Core discipline (root §2): the browser implementation is evidence of what is
*implemented*, not of what AOW3 *does*. Everything marked `[BROWSER]` is a candidate
for correction, not a source of truth.

Line references `game.js:NNNN` refer to `docs/game.js` at HEAD `92f7a15` (39,913 lines).

---

## 1. Current renderer architecture

- Single-file client `docs/game.js` (1.56 MB). Layout: sim kernel (lines 1–3263,
  DOM-free, between `SIM KERNEL BEGIN/END` markers), `AI` class (3266), bundled
  Three.js r163 (≈3690–35600, incl. GLTFLoader, WebGLRenderer, AnimationMixer,
  SkinnedMesh), game renderer `Renderer3D` (36383–~38100), input/HUD/lockstep/
  bootstrap (38100–39913). `docs/data/*.js` loaded before game.js (Phase 2 data
  model). `[BROWSER]`
- WebGL2 via three r163 (`WebGLRenderer`, antialias, high-performance).
  `outputColorSpace = SRGBColorSpace`, `toneMapping = LinearToneMapping`,
  `toneMappingExposure = 1.14`, clear color `#CFC3A2` (game.js:36423-36429). `[BROWSER]`
  - No original-matching evidence for tone mapping or exposure — Unity's color
    pipeline (likely linear lighting + custom post or default gamma pipeline) is not
    recovered. The values are visual-calibration results from earlier passes
    (worklog Tasks 1/4/11/12). `[SPEC]`
- Fixed-timestep sim (20 Hz) with renderer-side exponential smoothing of positions/
  yaw (`k = 1 - exp(-16*dt)`, game.js:37205-37214). AGENTS.md §32 records that
  interpolation between sim states is approximated by smoothing. `[BROWSER]`
  - Original: `BattleTimeTickProvider` + `BattlefieldCameraEngineTiming.ByLogicTick`
    shows the original also separates logic ticks from presentation
    (dump.cs:326380+). `[DECOMP]` The original's unit visual smoothing method is
    not recovered. `[INFER]` likely lerped presentation.
- Debug/probe surface: `__aow3()`, `__DBG.cam`, `__aow3Replay`, `__vfxTaxonomy`
  (game.js:38401-38432). `[BROWSER]`

## 2. Existing visual assets (verified inventory, HEAD 92f7a15)

| Asset class | Count | Where | Evidence |
|---|---|---|---|
| Unit/building/hero GLBs | **30** | `docs/assets/models/*.glb` | `[EXT]` |
| Decor GLBs | **812** (+`index.json`) | `docs/assets/models/decor/` | `[EXT]` |
| Map placements | **6,371** entries, 392 unique mesh names | `docs/assets/models/map.json` | `[EXT]` |
| Heightmap | 256×256, JSON params + PNG | `docs/assets/models/heightmap.{json,png}` | `[EXT]` |
| Texture atlases (merged RGBA) | 7 (`atlas-{jungle,jungle2,jungleground,jungleground2,jungleterrain,desert,war}.png`) | `docs/assets/models/` | `[EXT]` |
| Terrain ground texture | 1 (`ground-jungle.png`, 1.26 MB) | `docs/assets/` | `[EXT]` |
| Water texture | 1 (`models/water.png`) | `[EXT]` |
| Minimap | 1 (`minimap-jungle.png`) | `[EXT]` |
| FX sprites | 6 (`fx/{expl,flame,glow,part,ring,smoke}.png`) | `[EXT]` |
| UI sprites | 16 (`ui/{bld-*,flash-green,ico-cp,menu-bg,menu-persons,panel-tile,sel-ring,waypoint-ring}.png`) | `[EXT]` |
| Production cards / emblems / icons | 42 root PNGs (unit cards incl. 12 hero cards, emblem-blue/red, ico-*, ground/objects/war-objects decals) | `[EXT]` |
| SFX | 44 WAV (announcements, weapon fire incl. `fire_*` family, UI, impacts) | `[EXT]` |
| Gameplay data (Phase 2 model) | 6 JS modules (stats/weapons/units/buildings/factions/index) | `[EXT]`+`[DECOMP]` schema |
| Full extracted-asset archive | `assets/aow3-extracted-assets.zip` (LFS, 211,727,262 B, 2,157 files: sprites 1,145 / audio 798 / textures 197 / textassets 17) | `[EXT]` |

Provenance note: the jungle map extraction (`map.json`, `heightmap.*`, decor GLBs,
atlases) is byte-identical to the source extraction run and must remain so; this
audit proposes **no** regeneration of these files. `[EXT]`

## 3. Models

- **30 GLBs** at `models/` root: 2×infantry f1/f2, sniper (f2), 12 vehicles
  (f1: hammer/torrent/typhoon/zeus/fortress/shield; f2: jaguar/coyote/porcupine/
  armadillo/mammoth/chameleon), 2 helicopters (f1/f2), 2 heroes with own models
  (f1_hero_cerber, f1_hero_seraphim), 9 buildings (`f1_bld_{hq,barracks,bunker,
  factory_light,factory_heavy,power,supply,tower,hero}`). `[EXT]`
- Verified GLB internals (`f1_inf_light.glb`): generator `aow3-assembler-v2`;
  23 nodes; 2 meshes; **2 skins**; 1 material (`inf_light`, baseColorTexture,
  `alphaMode: MASK`, `doubleSided: true`, metallic 0.0, roughness 0.9);
  **8 AnimationClips: `idle1, move, w1_round, w2_round, move_shoot, die_bullet,
  idle2, die_explosion`** — the original clip names, straight from the APK's
  AnimationClips. `[EXT]`
- **Team-color regions**: none identifiable in GLB materials — the original paints
  faction via separate model variants per faction (f1_*/f2_*), not material tints.
  Faction selection is per-owner via `UNIT_MODEL[def][factionVariant(owner)-1]`
  (game.js:35726-35735). Seats 3/4 reuse faction 1/2 variants (2-faction art
  pipeline; distinguished by seat accents). `[BROWSER]` + `[EXT]` (assets are
  faction-split) + `[INFER]` (original also ships per-faction prefabs; seat 3/4
  reuse is a browser decision consistent with the 2-faction asset set).
- **Stand-in mappings** (game.js:35993 `UNIT_MODEL`): 10 heroes mapped onto
  chassis-faithful authentic GLBs (wasp→f1_avia_helicopter, gatling→porcupine,
  atlas→fortress, mole→shield, leviaphan→mammoth, beholder→jaguar, psitank→coyote,
  solaris→zeus, salamander→typhoon, coiltank→armadillo). This is **documented,
  justified substitution**, not a gap introduced by the browser: hero chassis
  prefabs are **`[PROVEN MISSING]` from the package** — full magic-scan of all
  5,502 `bin/Data` files + all UnityFS bundles found only 4 hero UV textures and
  266 hero VFX objects; model/stat content is server-delivered
  (`reverse/notes/hero-prefabs-10-remaining.md`). `[EXT]` + `[NATIVE]` (R1 pipeline
  proof, Task 41)
- **`[NOT FOUND LOCALLY]`**: f2 model variants for the six f1-only vehicles
  (hammer/torrent/typhoon/zeus/fortress/shield) and f1 sniper; the browser maps
  those slots to the f1 GLB for both factions. Whether the original delivers
  distinct f2 prefabs server-side is unproven — the f2 infantry/vehicles that DO
  ship locally prove faction-splitting exists; assume f2 variants exist
  (`[INFER]`), mark visuals as stand-ins.
- **Pivots/origin**: non-ground decor GLBs are re-centered (geometry translated by
  bbox center/min-Y at load, game.js:36254-36260); unit GLBs keep assembler
  root with baked Z-up→Y-up correction, compensated by `qfix` at placement
  (game.js:36741-36748). Scale: original authoring units — no uniform rescale of
  unit GLBs (decor gets `scaleTo` only in the procedural scatter path). `[EXT]`
  + `[BROWSER]`
- **LODs**: none in GLBs; none in browser. `[EXT]` absent. `[INFER]` original
  likely used LOD groups (standard for mobile Unity RTS) — not recovered.
- **Buildings**: GLB path with sprite fallback (`bld-sprite.png` planes for HQ
  when GLB missing, game.js:37099). Depot uses `f1_bld_supply` for both factions
  (game.js:37134). `[BROWSER]`

## 4. Textures

- **Merged RGBA atlases** (7): ETC1 split-alpha resolved by merging `_MainTex` +
  `_MaskTex` into RGBA PNGs during the pipeline fix (worklog Task 1 — the
  "opaque dark cards" regression). Correctness is provenance-pinned. `[EXT]`
- **No normal maps, no specular/metallic maps, no emissive maps** ship for unit/
  building/decor models in the extracted set — the original materials are
  Standard-shader style with albedo only (verified in GLB: single baseColor
  texture). `[EXT]` Any spec/normal behavior in the original comes from shader
  constants/scene lighting, not textures. `[INFER]`
- **`fx/*.png`** (6): authentic explosion/smoke/flame/glow/ring/particle sprites
  extracted from the game's VFX assets; wired as the tribute's FX textures
  (game.js:36793-36809 overrides the procedural canvas gradients when loaded). `[EXT]`
- **UI sprites** (16): sel-ring, waypoint-ring, flash-green wired as world-space
  indicators (game.js:36810-36818); building panel icons + menu bg wired in HUD. `[EXT]`
- **`ground-jungle.png`** (real terrain albedo, 1.26 MB): used only as a decal
  stamp source — 150 random stamps + 26 road-edge stamps composited over a
  procedural sand base in `bakeGround` (game.js:36465, bake fn at 35400-ish).
  **Not** a 1:1 terrain texture mapping. `[BROWSER]` — see §6/§7: this is
  acceptable in real-map mode only because the baked ground is hidden.
- **`water.png`**, **`minimap-jungle.png`**: extracted, wired directly. `[EXT]`
- Mipmap/filtering: three defaults (trilinear + mips for pow2), anisotropy 8
  ground/portraits path, 4 for atlases, global top-up to max(8) on first frame
  (game.js:36906-36917). Original texture filtering (Unity QualitySettings
  anisotropic filtering level) not recovered. `[INFER]` 2x–4x typical mobile.

## 5. Materials

- **GLB PBR baseline**: metallic 0.0, roughness 0.9, MASK alpha, doubleSided —
  assembler conversion of Unity Standard-ish materials. `[EXT]` (as-authored by
  `pipeline/assemble_v2.py`)
- **Browser overrides on unit spawn** (`cloneScaled`, game.js:35710-35725):
  `roughness = min(1, rough*0.9+0.1)`, `metalness = min(0.5, metal)`, castShadow
  on, receiveShadow off. `[BROWSER]` calibration.
- **Decor materials**: atlas routing from `index.json` `mats` field → one of 7
  atlas textures; `alphaTest` 0.45 (0.05 ground), `metalness = 0`, DoubleSide,
  **brightness multiplier color ×1.3 (ground ×1.2)** (game.js:36225-36243). `[BROWSER]`
- **Ground decals**: `transparent = true, opacity = 0.62, depthWrite = false`
  (game.js:36239-36243). `[BROWSER]` — this washes the extracted terrain decals
  toward whatever is beneath (apron/other decals); the original terrain decals are
  opaque albedo. High-priority correction candidate (§21/V2).
- **Building damage tint**: per-building cloned materials darkened by HP fraction
  (`lit = frac>=0.75 ? 1 : 0.45+0.55*frac/0.75`) (game.js:37004-37019). `[BROWSER]`
  `[INFER]` original has damaged-building states (Task 8 shipped damaged states);
  exact original method (smoke + swap textures?) not recovered.
- **No original Unity shader source or .mat files recovered** — shader names
  (e.g. `war_cutout`) survive only as routing keys in `index.json`. `[EXT]`

## 6. Terrain

- **Heightmap**: 256×256 samples, world bounds x −84..86, z −85..55, hscale 1.0,
  loaded from `heightmap.png` red channel (game.js:36820-36840); bilinear
  `heightAtWorld(x,z)` with fixed **shift (shx −1.58, shz +14.75)** aligning
  authoring space to the sim grid (game.js:36337-36350). `[EXT]` bounds/params +
  `[BROWSER]` shift constant (calibrated; provenance note in file comments).
- **Terrain surface = 115 extracted `ground`-category decal GLBs**
  (`land_chunk_*` up to 22×20 units, `index.json` w/l) placed by `applyRealMap`
  at `y = heightAtWorld(center)` — flat planes, one height sample per chunk,
  no vertex-level height conforming (game.js:36738-36740). `[EXT]` data +
  `[BROWSER]` presentation.
  - **Consequence**: on slopes, chunk interiors deviate from the heightfield;
    chunk borders can show seams/steps; props standing on `heightAtWorld` can
    float above or sink under decal planes between samples. This is the single
    largest terrain-geometry gap. `[BROWSER]` defect (vs its own data)
- The procedural `groundMesh` (MAP_W×MAP_H plane, baked sand texture) is **hidden**
  in real-map mode (game.js:36758-36759); the 560×560 `apron` plane (#B9A87E,
  y −0.08) remains visible beyond the map. `[BROWSER]`
- **No cliff/road/waterline meshes** exist as separate extracted geometry — roads
  appear only inside ground decals. `[EXT]` absence. The procedural roads painted
  in `bakeGround` are invisible in real-map mode. `[BROWSER]`
- Terrain shadows: decals are `castShadow = false` (cat "ground"/"grass"),
  receiveShadow = true. `[BROWSER]`

## 7. Maps (placement fidelity)

- `map.json`: 6,371 placements `{n, m, mat, p[3], q[4], s[3]}` — authentic
  GameObject/Transform extraction (name, mesh ref, world pos, world quat, scale). `[EXT]`
- **Coverage: 6,360/6,371 (99.8%) of placements resolve to a shipped decor
  template by name** (11 `m:null` group nodes skipped — correct). 392 unique
  mesh names used; 671 templates matched by name (812 GLB files, duplicate names
  deduped at load: `byName` keeps first). Quantified by this audit (see §20
  method note). `[EXT]`
- Rotation handling: placements carry authored-space quats including the
  Z-up→Y-up correction; GLBs that baked the same correction get exactly the
  baked rotation stripped (`qfix = inverse of first mesh's world rotation`),
  un-baked templates (ground decals) keep the raw quat (game.js:36741-36748).
  This fixed the Task 27 "trees perpendicular to ground" regression. `[BROWSER]`
  + `[EXT]`
- Position handling: non-ground props placed at `max(p.y − 0.05, heightAtWorld)`;
  ground decals at `heightAtWorld` only; p.y from the extraction is otherwise
  ignored. `[BROWSER]`
- Placement culling: after placement, large transparent flat decor (bb.y<1.2,
  width>9) is hidden (game.js:36760-36768) — hides oversized ground planes that
  would double-draw the terrain. `[BROWSER]`
- Decor load set: only map-referenced templates (+3 tree +2 rock spread picks)
  are fetched (game.js:36176-36201) — ~392 of 812 GLBs downloaded. Reasonable;
  keeps the other 420 as inventory for other maps. `[BROWSER]`

## 8. Camera

- **Browser model** `[BROWSER]` (game.js:36430, 36927-36934, 38394, 39167, 39289):
  - `PerspectiveCamera(FOV 38°, near 1, far 500)`
  - position = focus + `(0, dist*0.98, dist*0.44)`, lookAt(focus) → **fixed
    elevation 65.82°**, fixed yaw 0 (no rotation feature at all)
  - zoom: `dist` clamp **9..64** (wheel, ×1.09/0.92 steps) and **6.5..46** (pinch)
    — the two clamps disagree
  - start dist 12.5; pan via WASD/edge-drag/minimap; no inertia/friction
- **Original model** `[DECOMP]` (dump.cs:326030-326700):
  - `AbstractBattlefieldCamera : MonoBehaviour` — serialized fields `m_position
    (Vector3)`, `m_rotationY (float)`, **`m_angulationMin`, `m_angulationMax`
    (float pitch clamps)**, `m_distanceData (CameraDistanceData)`,
    `m_clippingFarCameraNormal`; properties `RotationX`, `RotationY`,
    `StartDistance`, `CurrentDistance`, `DistanceMin/Max`,
    `DistanceMaxWithAllFactors`, `Friction`, `MaxVelocity`.
  - `CameraDistanceData`: `m_startDistance`, `DistanceMin/Max`,
    `DefaultDistanceMax`, tablet aspect-ratio additional distance factor,
    settings factor, spectator factor, **overscroll factor** (pinch past max).
  - `BattlefieldCameraDistanceService`: `CalculateDistanceByPinch(...)`,
    `EnsureRangeDistance`, `GetTabletAdditionalDistanceFactor(aspectRatio)`,
    `OnAspectRatioUpdate` — zoom limits are aspect-ratio-dependent.
  - `CameraMovementDispatcher` + `CameraEngineFactory`: Lerp/Friction/Route/
    ReduceDistance camera engines, `TIME_MOVE_UPDATE_DISTANCE_CAMERA = 400` ms —
    the original pans with friction/inertia and scripted routes.
  - `CameraShakeController` exists (dump.cs:260968) — screen shake on events.
- **Numeric values** (angulation min/max, FOV, start/min/max distance) live in a
  serialized scene/prefab inside the Addressables content — **`[NOT FOUND
  LOCALLY]`**; recovering them needs the device cache dump (same R1 blocker) or
  an on-device observation pass. **Do not hard-code guesses as original.**
- **Gaps**: (1) no yaw rotation in browser vs `RotationY` original; (2) fixed
  pitch vs `angulationMin/Max` (original reads as distance-dependent angulation —
  `[INFER]`); (3) no friction/inertia vs `Friction/MaxVelocity` + friction engine;
  (4) no camera shake; (5) zoom clamp inconsistency browser-internal.

## 9. Lighting

- Browser rig `[BROWSER]` (game.js:36432-36451): HemisphereLight(#E5E5DF sky,
  #996373 ground, ×1.95); DirectionalLight sun #FFF2D8 ×2.0 at focus+(−22, 68,
  −15) (follows camera focus every frame, game.js:36931-36933); fill directional
  #CCCCCC ×0.55 from (70, 62, 84); explosion PointLight #FFB060 (distance 20,
  decay 1.6).
- Original Unity lighting (LightingSettings: ambient source/intensity, skybox,
  sun elevation/azimuth/color, shadow mask settings) — **`[NOT FOUND LOCALLY]`**
  (scene/lighting assets not in the extracted set; no `[NATIVE]` evidence either).
  The current rig is a calibrated approximation from live-QA passes
  (worklog Tasks 1/4/11/12: "lighting washed out" fix history). `[SPEC]`
- Tone mapping: browser LinearToneMapping ×1.14 `[BROWSER]`; original unknown —
  likely Unity default (no tone mapping on the legacy render pipeline, or the
  mobile pipeline's fixed sRGB encoding) `[INFER]`.
- Directional convention: browser sun azimuth is fixed NW-ish; original sun
  direction unknown — cross-check opportunity: the **blob shadow offset** and
  **minimap/ground texture shading** in extracted art imply a consistent light
  azimuth; derive it from the extracted shadow-decal direction. `[INFER]`
  (proposed V4 task, not yet done)

## 10. Shadows

- Browser `[BROWSER]`: PCFShadowMap (hard-ish PCF, not PCFSoft/VSM), 2048² map,
  ortho ±46 around camera focus, near 5 far 180, bias −0.0005, normalBias 0.03
  (game.js:36427-36445). Units cast, do not receive; decor instances cast
  (except grass/ground) and receive; ground/apron receive; buildings cast.
- Aircraft use a **blob sprite shadow** (radial gradient canvas, offset +0.7,+0.6,
  game.js:37575-37580, 37291) instead of shadow-map casting `[BROWSER]` `[SPEC]`
  (original: unknown — Unity shadow map would cover aircraft too; blob shadow is
  a browser choice, likely perf-motivated).
- Original shadow tech (Unity: hard/soft shadows, distance, cascade config) —
  `[NOT FOUND LOCALLY]`. Current settings are calibrated. `[SPEC]`

## 11. Fog (atmospheric + fog of war)

- Atmospheric: `scene.fog = new Fog(#CFC3A2, 170, 560)` linear, matched to clear
  color (game.js:36429-36431). `[BROWSER]` `[SPEC]` — original has map-edge
  distance haze (visible in extracted minimap/screenshots as light horizon) but
  no recovered parameters.
- Fog of war `[BROWSER]` (game.js:36491-36512 + drawMinimap):
  - sim-side visibility grid (MAP_W=160×160) → ImageData canvas (unexplored
    opaque dark, explored 0.35 alpha, visible transparent), blurred onto 2×
    canvas, LinearFilter texture, drawn as a UV-expanded plane at y=0.18 with
    90-unit margin, renderOrder 30.
  - Visual = soft dark veil over unexplored/explored area. Original AOW3 fog
    presentation (its exact colors/alpha/edge softness) `[NOT RECOVERED]` — needs
    screenshot comparison (`[INFER]` from gameplay footage: unexplored is near-
    black, explored slightly dimmed, hard-ish edges; current implementation is
    close in structure but unmeasured).
- Minimap fog: 2-px-step rect overlay on extracted minimap image with proper
  RMAP-aligned draw of `minimap-jungle.png` (game.js drawMinimap). `[EXT]` image +
  `[BROWSER]` mapping.

## 12. Water

- Extracted `water.png` tiled ×26 on a 560×560 plane at **y = −0.42**, color
  #507DD0 ×map, roughness 0.32, metalness 0.08, opacity 0.92 (game.js:36770-36786).
  Texture offset scrolls at (0.011, 0.006+sin swing) per second (game.js syncFx). `[EXT]`
  texture + `[BROWSER]` material/motion.
- Single infinite ocean plane; shoreline exists only where ground decals overlap
  it. No depth-based color, no reflection/refraction, no normal-map animation,
  no shoreline foam. `[BROWSER]`
- Original: Unity water on the jungle map with animated normals + shoreline
  blending (visible in the extracted `minimap-jungle.png` and ground decals) —
  implementation `[NOT FOUND LOCALLY]` (no water shader/normal assets extracted;
  `water.png` is the only water asset). `[INFER]` modest animated-normal water.
- Explosion surface token uses `heightAtWorld < −0.4` as the water test
  (game.js:37706) — consistent with the −0.42 plane. `[BROWSER]`

## 13. Environment / decorations

- Real-map path is active and 99.8% complete (§7). Decor categories placed on the
  jungle map: prop 91, tree 34, bush 117, rock 46, grass 26, palm 41, ground 115
  (= the 6,360 resolved). `[EXT]`
- `placeBaseProps` (game.js:36857-36902): **procedural containers/sandbags/barrels
  at four fixed map spots** — invented content with no extraction source. `[SPEC]`
  — flagged: either evidence-justify (they exist on the real map as props within
  the 6,371 placements, making this pass redundant) or remove in a visual pass.
  **RESOLVED (V3 landed, f6aef63; post-merge live-verified on v=48/bbdfb6b)**:
  `applyTerrainGrid` drops `this.baseProps` when the real map applies — invented
  props survive only behind the pre-battle menu overlay and are removed before the
  battle scene renders; no-map fallback keeps them by design. Live check (skirmish
  on the jungle map): `__realMap=true`, `baseProps=null`, decor = 1177 authentic
  `InstancedMesh` from `__realMap` placements (`applyRealMap`), 0 primitive-fallback
  geometries. Evidence: `scripts/p16_v3_realmap_verified.png`.
- Procedural fallbacks (only when map.json/decor fetch fails): `applyDecorScatter`
  (random category-weighted scatter on walkability==1 tiles) and primitive-geometry
  scatter (cylinder/cone/dodecahedron trees/rocks) (game.js:36516-36698). `[BROWSER]`
  — acceptable degradation path, never active in normal operation.
- Background/sky: clear color + fog only; **no skybox** (original mobile RTS uses
  a fixed skybox or gradient — `[NOT FOUND LOCALLY]`, no skybox asset extracted). `[INFER]`
- Environmental particles: none (no ambient dust/leaves). Original: unknown. `[SPEC]` gap.

## 14. Units (presentation)

- Model: authentic GLB per §3; faction via model variant; spawn scale-in
  0.3→1.0 over 0.2 s (game.js:37286-37290). `[BROWSER]`
- Orientation: yaw = −sim facing, smoothed ×12/s; turret bone aims with ×7/s +
  recoil kick ×0.06; rotor blades spun ×30/s around Y with base-quaternion
  composition (game.js:37209-37280). `[BROWSER]` (bones `[EXT]`, motion `[BROWSER]`)
- Animation selection `[BROWSER]`: locomotion loop `move`/`idle1`(fallback
  `idle2`); on-shot `move_shoot` (if moving) else `w1_round`/`w2_round` by weapon
  slot; death oneshot `die_bullet` (fallback `die_explosion`), then wreck/scorch.
  Clip names `[EXT]`; selection logic `[BROWSER]` (original unit-anim controller
  not recovered; clip set implies exactly these states — `[INFER]` sound mapping).
- Ground contact: `y = heightAtWorld(pos)` (aircraft 2.1 + bob ±0.09, hold/
  defend orbit radius 0.55 — visual-only, sim untouched) (game.js:37215-37234). `[BROWSER]`
- Health bars: canvas 64×10 sprite above unit (green/yellow/red by fraction,
  red for enemies) `[BROWSER]` `[SPEC]`; rank chevrons: canvas-drawn gold stars
  by veterancy tier `[BROWSER]` `[SPEC]` (original rank icons not extracted).
- Selection: extracted `ui/sel-ring.png` quad (pulse scale 1±0.05), green
  friendly / seat-color enemy; capture progress `capRing` arc. `[EXT]` texture +
  `[BROWSER]` behavior.
- Portraits: production cards are authentic extracted PNGs; `makeUnitPortraits`
  can also render GLB snapshots offscreen (game.js:37797+). `[EXT]`

## 15. Buildings

- Authentic GLBs (9 models) placed at footprint, rotation from sim. Depot shares
  `f1_bld_supply` for both factions. `[EXT]` models + `[BROWSER]` sharing decision.
- Construction: vertical scale 0.45+0.55×progress, build-ring arc, dust puffs
  every 0.4 s, completion flash + `ann_built` (game.js:36960-36990). `[BROWSER]` `[SPEC]`
  (original construction presentation — scaffold/progress bar — not recovered).
- Damage: HP-tint darkening (§5), smoke puffs at <60%/<30% stages (game.js:37020-37026),
  explosion + burners + scorch on destruction. `[BROWSER]` `[SPEC]`
- HQ flag / ownership flags: procedural waving colored planes (animateFlags). `[BROWSER]`
  `[SPEC]` (original flags are textured sprites in the sprite atlas — opportunity:
  use extracted flag sprites).
- Capture ring: radius+0.05..0.35 arc by captureT. `[BROWSER]`
- Turret buildings (tower) aim via GLB turret bone. `[EXT]` bone + `[BROWSER]` aim.

## 16. Animation (inventory)

- Clip inventory verified for `f1_inf_light` (representative): `idle1, idle2,
  move, move_shoot, w1_round, w2_round, die_bullet, die_explosion` — with
  assembler notes that vehicles carry `tower/muzzle` channels (stripped; gameplay
  owns those bones) and helicopters carry wing channels (stripped; rotor spun
  procedurally). `[EXT]` (`pipeline/README.md`, assembler v2)
- Playback: `UnitAnim` wrapper — loop() with 0.18 s crossfade, oneshot() with
  clamp + finished-fadeout; mixer updated per render frame with render dt
  (presentation-only). `[BROWSER]`
- Building models: no clips expected/used (static). Decor: no clips. `[EXT]`
- Missing: no `construction` clip in the extracted set (buildings animate via
  scale); no hero-specific clips (stand-in chassis clips play instead). `[EXT]`

## 17. Visual effects

- Textures: extracted `fx/*` wired over procedural gradients at load
  (glow→flash+glow, smoke, flame, expl). `[EXT]`
  **ATLAS CORRECTION (V6b, 2026-10-09)**: `flame.png` is the original game's
  **1024×1024 FX particle ATLAS** (hundreds of per-frame shapes — explosions,
  smoke, rings, bolts, tracers; this is how the original's particle prefabs
  sampled frames), not a single sprite. Rendering it whole stretched the entire
  sheet — caught in V6 live visual QA; the pre-existing siege-burn consumer had
  the same defect since its introduction. `part.png` (64×64) is a genuine
  single soft particle. Fix: derived single-frame `fx/flame-l.png` (48×80 flame
  tongue cropped from the extracted atlas, black bg + additive blending =
  fx pipeline convention); point-emitter flame consumers use `texFlameL`; the
  atlas stays loaded (`texFlame`) with zero whole-render consumers for future
  per-frame work.
- Emitters (all sprite-quads with additive/normal blending) `[BROWSER]` `[SPEC]`
  structure with `[EXT]` textures:
  - muzzle flash at the unit's `muzzle*` bone world position, class token from
    def-kind heuristic (game.js:37460+, `fireEvent`)
  - tracers: procedural stretched box + glow sprite; rockets lob with sine arc +
    smoke trail puffs (game.js:37626-37670)
  - explosions: flash + glow + extracted expl sprite + ground ring + 5 smoke
    puffs + debris + scorch decal + orange point light; authentic-family token
    `boom_expl{1|3|5}_s{0..6}_{ground|water}` bucketed from radius (game.js:37690-37730)
  - unit pops (infantry death): flash + smoke + pitched SFX (game.js:37724-37733)
  - scorches: persistent radial dark decals (`spitScorch`, capped set)
- **VFX taxonomy** (game.js:36360-36381, `AOW3_VFX_TAXONOMY`): authentic family
  counts from the 6.9.18 Addressables catalog — `bul_` 41 (51 catalog rows incl.
  materials/anims), `fire_` 18, `boom_` 66, `hero_` 246, `eff_` 81, `debris_` 8,
  `impact_` 4. Per-unit FX assignment is balance/server data — emitters are
  family-accurate, sub-variant heuristic. `[EXT]` (catalog) — documented, honest.
- Missing vs original: real particle-system prefabs (multi-particle, curves,
  lights, animated textures) are server-delivered/not extractable locally — the
  sprite emulation is the documented gap. `[PROVEN MISSING]` (prefab content) —
  same evidence chain as hero prefabs (§3).

## 18. UI / presentation

- HUD is DOM-based (resbar, clock, minimap-wrap, prodwrap, hint line; game.js:38782+)
  with extracted panel/menu/icon sprites (`ui/menu-bg.png`, `panel-tile.png`,
  `ico-cp.png`, card PNGs, building icons). `[EXT]` art + `[BROWSER]` layout.
- Typography: `font-family: system-ui, Segoe UI, Roboto, sans-serif`
  (game.js:38291) — **not** the original font (original font asset not extracted;
  candidate in the 1,145-sprite archive or as a system TTF in the APK — needs a
  targeted extraction pass). `[BROWSER]` + `[NOT FOUND LOCALLY]`
- Menus: lobby/hub uses extracted `menu-bg.png`/`menu-persons.png`. Victory/
  defeat: text + announcements (`ann_victory/defeat`). `[BROWSER]` `[SPEC]`
- Minimap: extracted `minimap-jungle.png` with correct RMAP-aligned mapping +
  radar sweep + fog overlay (game.js drawMinimap). `[EXT]` + `[BROWSER]`

## 19. Missing / uncertain assets (explicit)

**`[PROVEN MISSING]` from the package (server-delivered; do not expect local recovery):**
- 10 hero chassis model prefabs (+ their clips) — only 4 hero UV textures + 266
  hero VFX objects ship locally (hero-prefabs note, full-bundle scan)
- Runtime VFX prefab content (particle systems, curves) beyond the extracted
  sprite textures
- Per-unit FX/weapon/armor assignments (balance tables — R1, Task 41)
- Camera angulation/distance/FOV serialized values (in Addressables scene content
  served/validated at runtime — recovery needs device run, R1-class blocker)

**`[NOT FOUND LOCALLY]` (may exist in the APK's remaining unextracted content or
in `assets/aow3-extracted-assets.zip` — needs a targeted extraction/scan pass):**
- f2 unit-model variants for f1-only vehicles (+ f1 sniper); f1 sniper variant
- Original HUD font (TTF or sprite-font)
- Skybox / sky gradient asset
- LightingSettings / quality settings (shadow distance, anisotropy level)
- Water normal/foam assets
- Original flag sprites, veterancy/rank icons, original selection indicators
  (beyond sel-ring/waypoint-ring already wired)

**Unknowns (no evidence either way yet):** exact original fog-of-war colors/edge
profile; sun azimuth/elevation; unit visual smoothing constants; camera friction
values; UI layout metrics (measure from screenshots per Phase 24 of the dev plan).

## 20. Evidence sources

- `reverse/dump.cs.zip` → `dump.cs` (63.9 MB, IL2CPP dump v6.9.18): camera
  cluster (`AbstractBattlefieldCamera`/`BattlefieldCamera`/
  `CameraDistanceData`/`BattlefieldCameraDistanceService`/
  `CameraMovementDispatcher`/`CameraEngineFactory` at dump.cs:326030-326900,
  `CameraShakeController` at 260968), `BattleTimeTickProvider` timing.
  Method: this audit's own grep of the unzipped dump (hashes pinned in R1/R2).
  `[DECOMP]`
- `docs/assets/models/{map.json, heightmap.json, heightmap.png}` + `decor/index.json`
  + GLB headers (parsed directly for this audit). `[EXT]`
- `reverse/notes/hero-prefabs-10-remaining.md` (package content proof),
  `reverse/notes/vfx-asset-prefix-check.md` +
  `reverse/evidence/vfx-catalog-families-6.9.18.txt` (Addressables catalog),
  `reverse/notes/1-to-1-fidelity-audit.md` (Task 40 — 210-row fidelity matrix;
  visual rows here go deeper, not wider), worklog Tasks 1/3–13/27 (visual-pass
  history and regressions), `pipeline/README.md` (extraction pipeline), R1/R2
  evidence (server-delivery proof). `[EXT]`/`[DECOMP]`
- Quantification method (§7 coverage): local script joining `map.json` `m` values
  against `decor/index.json` `n` values — reproducible one-liner, no
  provenance-affecting tooling added to the repo.
- Live renderer behavior: read from `docs/game.js` at HEAD (line refs above) and
  the running site (v=46). `[BROWSER]`

## 21. Recommended implementation order (V1–V8)

> Ordering rule (root §32): evidence-first, smallest-change-first, renderer-only;
> gameplay/sim/networking untouched; every step re-runs the 854-test baseline and
> respects the §35 cache-bust (`game.js?v=N` +1 per change) and deploy-QA flow.

- **V1 — Coordinate/camera model.** (a) Fix the wheel/pinch zoom-clamp
  inconsistency (single clamp table); (b) add distance-dependent angulation +
  yaw rotation matching the `AbstractBattlefieldCamera` field model, values
  calibrated from side-by-side gameplay footage until the device run recovers
  serialized numbers — **labeled `[SPEC]` calibration in code comments**; (c)
  document the RMAP shift derivation in one comment block. No sim changes.
- **V2 — Terrain surface.** Rebuild the real-map terrain as a **heightmapped
  mesh** sampled from `heightAtWorld` (the data already exists) instead of flat
  22×20 decal planes at center height; keep the extracted decal GLBs as
  texture/visual source (vertex-conform or project them onto the height mesh);
  restore decal opacity toward 1.0 with alphaTest cutout instead of 0.62
  transparency wash. Eliminates seams/floaters (§6). Verify with a
  screenshot-vs-heightmap overlay probe (`__DBG`-style, dev-only).
- **V3 — Environment truth-out.** Remove/replace `placeBaseProps` invented
  props (§13) — the real map already places its own props; add nothing
  procedural in real-map mode. Keep fallback scatter paths for no-map mode only.
  **DONE** (f6aef63; verified §13, live on v=48).
- **V4 — Materials + lighting calibration pass.** Decal opacity, ground color
  multiplier ×1.2/×1.3 review (likely compensating for the transparency wash —
  re-tune after V2), tone-mapping/exposure re-check after ground change, sun
  azimuth cross-check against extracted shadow-decal direction (§9), consider
  PCFSoft + shadow radius within calibrated bounds. All `[SPEC]`-labeled.
- **V5 — Units/buildings presentation.** Building flags from extracted sprite
  art instead of procedural planes; rank icons from extracted art if located
  (else keep canvas, documented); damage-state review vs original screenshots;
  keep visuals out of sim state per §8.
- **V6 — VFX depth.** Within the sprite framework: use `flame.png`/`part.png`
  (currently extracted but unwired — verify `texFlame` consumers) for muzzle/
  burning; per-family sprite variants from the archive's 197 textures where
  identifiable; keep family-token tagging (already honest).
- **V7 — UI presentation.** Font extraction/identification pass; measure HUD
  metrics from original screenshots (dev-plan Phase 24 method) instead of
  eyeballed DOM; victory/defeat presentation with extracted art.
- **V8 — Reference validation.** Repeatable compare harness: fixed-seed
  scenario (`#seed=N` exists), headless screenshot of the browser build vs
  original-device capture of the same scenario (device required — combine with
  the R1 device run to share cost); store side-by-sides under
  `reverse/evidence/visual/` with scenario manifests.

**Highest-value single next task: V2 (terrain surface)** — it corrects the
renderer's largest self-inflicted deviation from its own authentic data, is
fully executable without a device, and de-risks V4's calibration pass.

---

*Verification note: this audit introduced no code changes. Test baseline
854/854 recorded before and unchanged after (docs-only commit).*

## 22. Status addendum (execution log — sections above stay point-in-time)

- **V2 follow-up (2026-10-09)**: ground decal chunks now vertex-conform to the
  heightfield — per-placement geometry clones baked to world space, each vertex
  displaced by `heightAtWorld(x,z) − heightAtWorld(center)` (same sampler as
  `buildRealTerrain`), so chunk borders meet at identical heights and the
  §6 seam/step defect is closed. Relative displacement preserves baked decal
  relief; +0.03 lift + polygonOffset remain the coplanarity guard. Verified
  before/after at the steepest interior slope (grad 0.151 @ world −58.1,−38.1,
  `reverse/evidence/visual/` scenarios `slope-detail*`): floating grass-chunk
  rectangle and cliff-terrace steps eliminated. `[EXT]`+`[BROWSER]`.
- **V1-b (2026-10-09)**: distance-dependent angulation + yaw orbit implemented
  per the §8 [DECOMP] field model. Angulation band 38°..66° linear over dist
  6.5..46 is **[SPEC]** (serialized values still [NOT FOUND LOCALLY]; max pitch
  ≈ old fixed 65.8° for framing continuity). Yaw via Q/E at 2.2 rad/s is
  **[SPEC]** binding (original control unrecovered); WASD pan made
  yaw-relative; minimap pans clamp at source. Known interaction filed for V4:
  at low pitch the sun-away unit sides read near-black (pre-existing rig
  behavior, confirmed identical on the pre-change build at the same pose —
  `tactical-close` scenario).
- **V8 (2026-10-09)**: reference-validation harness shipped
  (`reverse/tools/visual_harness.mjs` + `reverse/evidence/visual/`) — fixed-seed
  headless captures driven through the §35.3 probes, 8×8 average hashes,
  side-by-side composition ready for the R1 device references (protocol in
  `reverse/evidence/visual/README.md`). Browser side of all 6 manifest
  scenarios captured at v=49; device refs [AWAITING R1].
- **V4 (2026-10-09)**: the §22/V1-b filing "sun-away unit sides read near-black"
  is ROOT-CAUSED and it was never the §9 lighting rig — it is a texture-UV
  convention defect in the assembler's unit path. `unpack_mesh` reads Unity
  TEXCOORD_0 raw (V-up) and `assemble_v2.py` wrote it unconverted, while
  GLTFLoader samples V-down (`flipY=false`); every unit/building template
  therefore sampled the vertical MIRROR of its atlas region. Usually masked
  (mirrored content is still panel art), fatal for f1/f2 `inf_heavy`, whose UVs
  sit in one quadrant: the mirror lands on the page's pure-black filler —
  black silhouette under ANY light (per-light ablation probe). Evidence chain
  in `reverse/evidence/visual/`: `probe_inventory.json` (materials were white
  diffuse M=0 — metalness hypothesis ruled out via the §5 GLB PBR audit:
  30/30 authored metallic 0.0), `probe2_texture_uv.json` (UV quadrant ranges +
  texture black-corner stats), `probe6-A-baseline.png` vs
  `probe6-B-iheavy-flipped.png` (live V-negation restores the authored blue
  armor). Fixes: (a) runtime compensation in `preloadGlbModels` (marker
  `V4-UV-FLIP`; template path only — decor GLBs already remap); (b) assembler
  source fix in `assemble_v2.py` `get_mesh` (`V_gltf = 1 − V_unity`) so future
  regenerations are correct — **regenerating the GLBs requires deleting the
  runtime block or the two flips cancel**. §9 sun-azimuth cross-check EXECUTED
  with a negative result: Lambert fit of minimap luminance vs heightfield
  normals gives R²=0.001 (equal to the shuffled-target control) — the extracted
  minimap carries no measurable directional shading; azimuth stays [SPEC] and
  re-anchors from device reference frames at the R1 pass. §5 decor brightness
  multipliers ×1.3/×1.2 REMOVED (they compensated the pre-V2 0.62-opacity
  wash); measured post-V2 effect negligible (tonemap clamp absorbs it — kept
  on provenance grounds, not for a visible win). Rendered-vs-minimap luma
  ratio 1.267 and B-chroma excess +0.31 are recorded but NOT corrected: the
  minimap's saturation grade is unverified, and the rig (hemi/sun/fill/
  exposure) is UNCHANGED pending device refs. PCFSoft considered and HELD —
  no local evidence of the original's shadow softness. Tests 8/8 suites green;
  v=50; all six V8 aHashes shift (units now render authored colors — explained
  shift, expected per the README interpretation rules).
- **V4 closure (2026-10-09, later)**: the GLB regeneration + runtime-block
  removal pair EXECUTED. (1) Template GLBs (30) now carry glTF V-down
  TEXCOORD_0 natively: 22 roster units re-exported by the fixed assembler;
  the remaining 8 (`f1_bld_bunker`, `f1_bld_power`, `f1_veh_hammer`,
  `f1_veh_zeus`, `f2_avia_helicopter`, `f1_hero_cerber`,
  `f1_hero_seraphim`, `f1_bld_hero`) received the mathematically identical
  in-place `V'=1−V` bake instead — for the first five the current assembler
  output drifted beyond the UV fix (extra skins/nodes vs the committed
  post-processed files; the `fix_empty_skins.py` pass was never folded into
  `assemble_v2.py` — flagged for future pipeline alignment), and the hero
  GLBs' Task-16 assembly script was never committed. Verification
  (accessor-level, all 30): TEXCOORD_0 is the ONLY differing attribute
  (`committed_v == 1 − new_v` elementwise), every other accessor
  byte-identical, JSON semantically equal (modulo UV min/max). (2) The
  runtime `V4-UV-FLIP` block is DELETED from `preloadGlbModels`; v=51.
  (3) V8 harness re-capture: all six scenario aHashes IDENTICAL to the v=50
  baseline — the baked flip and the removed block cancel exactly, i.e. zero
  visual drift from the whole operation. Sandbox for this pass rebuilt the
  extraction chain from the LFS XAPK (sha256 `1a41e033…` re-verified);
  device pass attempted first per plan but no device/frida exists in the
  sandbox — R1 remains BLOCKED-DEVICE-REQUIRED with the S1–S4 runbook
  verified ready (both hook scripts `node --check` clean).
- **V6 (2026-10-09)**: `part.png`/`flame.png` wired into muzzle/burning VFX —
  `texPart` loader added (part.png was extracted-but-never-loaded): 2 additive
  muzzle sparks per shot at the muzzle bone (fireCls token kept), 2 impact
  sparks per sim-pop event (impact token kept), flame licks on burning wrecks
  alongside smoke puffs (same 0.3s cadence, warm tint). All emitters guarded on
  async texture arrival; family-token tagging unchanged; renderer-only.
  Live QA caught that `flame.png` is the per-frame FX ATLAS → **V6b** derived
  `flame-l.png` single-frame flame (also fixing the pre-existing siege-burn
  whole-atlas render, §17). Natural-path verification: vehicle combat death →
  `finishDeath → spawnWreck → burners.push` → flame licks emitting continuously
  (scene census flame:1–2 across 24s of polls); texPart sparks rendered and
  verified live; textures byte-verified on the CDN. Tests 877/877 at v=52 and
  v=53; visual evidence `scripts/p16_v6b_flame_final.png`,
  `scripts/p16_v6b_flame_clean.png` (atlas-grid defect + fix chain:
  p16_v6_flame_framed2.png shows the pre-fix grid).
- **V5 (2026-10-09)**: units/buildings presentation wired from the extracted
  sprite art. Building flags: the procedural seat-color planes now carry
  **authentic-art cloth** — the factions' white line-art emblems
  (`ico_emblem_conf`/`ico_emblem_res`, byte-verbatim from the provenance-verified
  curated extraction zip, sha256 `fff43c4d…` per the vfx-asset-prefix-check note)
  composited onto the seat-color field per the `factionVariant` pairing
  (seats 1/3 conf globe, 2/4 res fist; neutral seat 0 = plain gray cloth — no
  evidence neutral flags carry an emblem). The original's `other/flag_*` sprite
  addresses exist in the 6.9.18 string literals but the sprites themselves are
  [NOT EXTRACTED] — the emblem-on-field cloth is the closest [EXT]-derived
  representation, flagged for swap when the originals are pulled. Unit rank
  insignias: the procedural canvas chevrons are replaced by the **authentic
  veterancy art** (`f1/f2_insignias_01..03` — silver vs olive chevrons,
  1/2/3 per tier), faction keyed off the unit's GLB model pair
  (`UNIT_MODEL[def.id][factionVariant(owner)-1]`); procedural chevrons kept as
  load-failure fallback. Damage-state review: buildings already run the
  2-stage smoke/fire chain (§22 V6 consumer chain) + frac-based material
  darkening; units have NO damage presentation beyond HP bars — no local
  evidence of the original's damaged-unit look, filed [AWAITING R1 device
  refs] rather than speculatively coded. Placement note (pre-existing, not
  V5-introduced): the HQ pole/flag stand ~2.5 units above the GLB HQ roof
  (sprite-HQ-era tuning never re-derived after the GLB migration); visible in
  normal framing, exact placement calibration joins the R1 session. QA:
  8/8 suites green; flag cloths probed pixel-level (seat field + white emblem
  + dark underlay); all four seat cloths + neutral rendered and screenshotted;
  rank chevrons painted through the live `paintRank` path at tiers 1–3 both
  factions (`reverse/evidence/visual/v5-*.png`); V8 harness v53-vs-v54 A/B via
  HEAD worktree — identical per-scenario hash SETS across repeated runs
  (per-run flicker between two rasterization states exists in this sandbox's
  headless Chromium and appears in BOTH builds — no V5-caused hash shift at
  8×8 aHash resolution; the emblem detail is sub-cell at harness poses).
  Renderer-only; sim/network/replay untouched; v=54.
- **V7 (2026-10-09)**: UI presentation closed — the §19 "[NOT FOUND LOCALLY]"
  original HUD font is now FOUND, EXTRACTED and WIRED. (1) Font
  identification: the 6.9.18 IL2CPP string literal `Fonts/MainFont.asset` +
  TMP materials 'RefrigeratorDeluxe-Bold Material' /
  'RefrigeratorDeluxe-Bold_Fallback' pointed the hunt; the Unity `Font`
  object 'MainFont' in bundle `e3ef60f1…` carries the actual TTF in
  m_FontData — byte-verbatim extraction (14,177,104 B,
  sha256 `53380e7a…`) = **Refrigerator Deluxe Bold** (51,432 glyphs;
  unitsPerEm 1024, capHeight 717 = 0.700em, xHeight 481 = 0.470em,
  typoAsc/Desc 844/−180). TMP atlases ('MainFont Atlas',
  'RefrigeratorDeluxe-Bold_Fallback Atlas', 1024×1024) extracted as
  evidence PNGs. Deployed as `docs/assets/ui/mainfont-font.ttf` and wired
  via @font-face "AOW3 MainFont" (font-display:swap; system-ui fallback
  chain kept) — every HUD/menu/result string now renders in the authentic
  face. (2) HUD metrics: the §19/§22 "UI layout metrics" unknown remains
  [AWAITING R1] (no original screenshot exists in the sandbox — Phase-24
  measurement joins the device session); what IS now evidence-anchored is
  the typographic layer itself (the font + its design metrics, recorded in
  the game.js CSS comment block), replacing the biggest eyeballed [BROWSER]
  guess. (3) Victory/defeat presentation now uses extracted art:
  `head_back_win.png` (48×85, yellow header rules) frames the verdict,
  `back_player_panel.png` (381×134, diagonal hatch + angled edge) backs the
  scoreboard rows at native resolution — both byte-verbatim from the
  provenance-verified curated zip (sha256 `fff43c4d…`); verdict/report laid
  out as a stacked column (previous flex-row was an eyeballed [BROWSER]
  artifact). Live QA: font load verified through `document.fonts`
  (`AOW3 MainFont/loaded`), menu + battle HUD + victory/defeat screens
  captured (`reverse/evidence/visual/v7-*.png`); the close-set "AT" pair in
  "DEFEAT" is the font's authentic kerning (−27px at 52px, TTF-verified),
  not a clipping defect. Tests 8/8 suites green (877/877 baseline).
  V8 harness v54-vs-v55 A/B: per-scenario hash sets differ only in the
  low-order bytes mapped to the DOM HUD rows (the intentional font swap) —
  scene bytes identical where flicker state matched (tactical-close
  SAME-SET; slope-detail-cross scene bytes equal) — and the sandbox's
  rasterizer bimodality QUANTIFIED for the record: v54-vs-itself across its
  two states diffs 54.8% of pixels (same-state self-diff 0.04%), an
  envelope larger than any observed v54-vs-v55 delta (≤42.9%), i.e. no
  V7-caused canvas change; `v8-ab-v54-v55.json` +
  `results.json` re-captured at v=55. Renderer-only; sim/network/replay
  untouched.
