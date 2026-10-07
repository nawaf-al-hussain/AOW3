# AOW3 Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: Browser-playable Art of War 3 — asset-fidelity pass (walk/fire anims, rotors, decorations, 1:1 strategy)

Work Log:
- Environment was reset between sessions (workspace + extraction folders lost). Recovered
  everything from the AOW3 GitHub repo: re-cloned, pulled XAPK (259MB) + extraction zip via LFS.
- Answered the 1:1 strategy question: Unity WebGL rebuild is impossible without the original
  editor project (APK ships only compiled ARM64 IL2CPP + assets); deeper native decompilation
  cannot rebuild a game. The max-fidelity path = asset-level remake (extracted models/skeletons/
  clips/atlases rendered by Three.js + recovered damage formulas) — already the architecture here.
- Diagnosed why the game still didn't look 1:1 (live QA + screenshots):
  1) Decor props rendered as opaque dark cards -> the GLB assembler's per-prop atlas crops were
     wrong AND alpha was flattened. Root cause: ETC1 split-alpha (materials use _MainTex +
     _MaskTex; previous pipeline ignored _MaskTex and mis-cropped).
  2) Fog of war was hard-edged (NearestFilter + alpha 232).
  3) Lighting washed out (sun 2.7 + ACES + exposure 1.12) and canopy undersides near-black.
  4) Unit animation state machine never started idle clips (v.loco initialized "idle").
  5) 5 GLBs carried skin references without JOINTS_0/WEIGHTS_0 -> "skinning disabled" warnings.
- Rebuilt the whole decoration pipeline (pipeline/tools/fix_decor.py):
  * unpack_bundles.py — XAPK -> 30 Unity bundles (incl. decorations_jungle/desert/common)
  * Merged shared RGBA atlases from _MainTex + _MaskTex pairs (jungle, jungle2, desert, war,
    jungleground, jungleground2) -> docs/assets/models/atlas-*.png
  * Exported ALL 688 props (vs 130 before) as tiny untextured GLBs with ORIGINAL UVs;
    index.json now carries per-prop mat->atlas routing (renderers ship Default-Material,
    so routing follows group/bundle like the original game).
  * game.js preloadDecor: loads shared atlases once, assigns maps by material name, alphaTest
    0.45 cutout (exactly how the original renders its cutout foliage).
- Fixed fog of war: LinearFilter + softer alphas (explored 92, unexplored 212).
- Fixed lighting (verified live via debug hook): hemi 0.9->1.5, sun 2.7->1.85, exposure 1.12->1.0.
- Fixed unit animations: loco init "idle" -> null so idle1 loop starts at spawn; verified live
  that real clips play (current: "idle1" when standing, "move" when walking; fire/oneshot paths
  intact: move_shoot / w1_round / w2_round / die_bullet).
- Helicopter rotors verified wired: f1 matches b_wing1-6, f2 matches "fan", spin 30 rad/s.
- Stripped dead skin refs from f1_bld_bunker, f1_bld_power, f1_veh_hammer, f1_veh_zeus,
  f2_avia_helicopter (rigid render, no more GLTFLoader warnings).
- Full local QA via agent-browser: zero page errors, screenshots confirm authentic cutout jungle
  decor, working walk/idle animations, soft fog, correct exposure.

Stage Summary:
- Deliverable: updated docs/ (game.js + 688 decor GLBs + 6 shared atlases) deployed from main:/docs.
- All 656 jungle prop meshes (plus desert/common) now exported and shipped; game scatters a themed
  subset per map. Unit skeletal clips (idle/move/move_shoot/w1_round/w2_round/die) play from the
  game's real AnimationClips; helicopter rotors spin procedurally.
- Strategy answer on record: 1:1 in-browser = asset-level remake (this), not Unity WebGL (needs
  original project) or full native decompile (months, still no visuals).

---
Real map pass (0d1566f) + oneshot guard (6de3b0d)
- docs/ now runs the real extracted jungle map: map.json (6,371 placements),
  124 extra GLBs incl. 26 land_chunk terrain meshes, heightmap.png/json,
  water.png, real minimap, real fx textures, 44 curated sfx WAVs.
- pipeline/tools/: export_map.py, export_missing.py, export_heightmap.py,
  scan_map_prefab.py, surgery_realmap.py (repeatable full rebuild).
- Audio recipe: clips = assets/bin/Data/<hash>.resource (FSB5) in base APK;
  decode with fmod_toolkit.raw_to_wav(bytes, name, channels, freq) -> WAV.
- Live QA (fresh session, github.io): 0 page errors, 393/393 templates,
  battle at enemy HQ verified, minimap + water + announcer working.

---
Task ID: 3
Agent: Super Z (main)
Task: "A lot of thing is left" — base-building gameplay pass (play like the real game)

Work Log:
- Live QA of deployed build found the core gameplay gap: sim had only HQ + depot;
  all production was abstract (units popped from HQ). Non-HQ buildings were
  procedural boxes/cylinders even though original f1_bld_* GLBs existed.
- surgery2.py (40 verified edits, scripts/surgery2.py):
  * Data: BLD defs (barracks 400 / factory 550 / heavy factory 850 / power 300 /
    turret 450 / bunker 350, build times 10-24s), BUILDINGS_ORDER, PRODUCER_OF.
  * Sim: addBuilding(instant) + buildT progress; canPlace/tryPlace (near own base,
    clear of buildings/units, walkable); enqueue gated by producer building;
    production spawns AT the producing building with rally; updateBuildings
    (construction progress, turret/bunker weapon fire w/ RE'd damage+hitChance,
    building destruction -> boom + removal); power plant = +2 income +2 CP cap;
    vision per-building view radius; buildings carry radius (fixes NaN spawn and
    silently-broken unit-vs-building range checks).
  * AI: maybeBuild() golden-angle slot scan around HQ (barracks -> power ->
    factory -> heavyfactory@100s -> turret@150s -> turret#2 -> bunker), producer-
    filtered unit choices, has() counts under-construction (no double-build).
  * Renderer: swapRedBlue helper + buildGlbBuilding (owner 1 = blue-shifted R/B
    swap, enemy = original red); depot uses f1_bld_supply; construction visuals
    (Y-scale grow + progress ring + dust puffs + completion flash + bld_end /
    ann_built sfx); building HP/progress bars; turret head aims at b.aim; enemy
    buildings hidden while unexplored; placement ghost (green/red validity);
    texture anisotropy 8 pass on first render; fog pushed 170-560.
  * UI: building card row (emoji icons, cost, disabled by funds), placement mode
    (armed highlight, hint bar, shift = multi-place, right-click/ESC cancels),
    unit cards disabled + tooltip until producer exists; camera default 12.5,
    zoom clamp 6.5-46; unit HP bars always-on for own units, bigger sprites;
    unit scale up (infantry 0.9->1.32, vehicle x3->x4, aircraft x3.6->x4.6).
- Fixed post-surgery bugs: HQ view missing hpSprite (guard), missing radius on
  building objects (NaN spawn), AI double-build, turret emoji icon (1F3FC->1F5FC).
- Verified locally (headless): build/place/produce loop, turret kills infantry
  (RE'd damage), AI builds barracks+power+factories on accelerated clock.
- Commit 5267a50 pushed (LFS ok); GitHub Pages rebuilt; live QA fresh session:
  0 page errors, placement + construction + AI base verified on production URL.

Stage Summary:
- Live: https://nawaf-al-hussain.github.io/AOW3/ (main:/docs)
- Battle is now a real base-building skirmish: build producers, units spawn from
  them, defend with turret/bunker, power plant economy bonus, AI mirrors it.
- Known limits: sim clock tied to render fps (steps<8 catch-up cap) — slow
  machines run slower than realtime; sand-area props near enemy HQ still use
  fallback colors; water/walkability still procedural under the real map.

---
Task ID: 4
Agent: Super Z (main)
Task: "Textures, models and gameplay issues" — live-QA-driven fidelity pass 3

Work Log:
- Served docs/ locally (port 8777) and ran full browser QA with agent-browser:
  menu, battle, zoom/pan, placement, production, march, enemy contact.
- Root-caused concrete defects:
  1) ACESFilmic tone mapping crushed the dark jungle atlases -> murky/black foliage.
  2) setClearColor(0xA8A89C) + missing off-map fade = beige void beyond terrain.
  3) Walkability grid was 90 RANDOM blobs -> invisible walls, placement refused
     near HQ, units detouring nothing (real map ignored).
  4) Building blob shadows were fixed 10-unit slabs; foliage props floated above
     terrain; card art used object-fit:cover (cropped portraits); camera default
     12.5/min 6.5 was far closer than the original RTS framing.
- surgery3.py (14 verified string edits) + 3 follow-up patches:
  * Lighting: LinearToneMapping exp 1.14, hemi 1.95 (sky E5F4FF/ground 99A173),
    sun 2.0 @ (-22,68,-15), +0.55 fill light -> bright, saturated, soft shadows.
  * Clear color now fog color (0xCFC3A2); off-map blends into haze.
  * preloadDecor: exposes window.__decorIndex; cutout foliage color x1.3,
    ground decals x1.2 + opacity 0.62/depthWrite false (seamless blending);
    prop placements snapped to heightAtWorld (no more floaters).
  * Grid: real-map derived — only rock decor with w>=1.1 blocks (br = max(.9, w*.5)),
    fallback to old random blobs when real map absent. Placement verified via
    sim.canPlace probe (valid spots return true; near-HQ refusals were genuinely
    blocked tiles + units).
  * Building shadow sprite = radius*3.1 @ 0.85 opacity; camera clamp 9..64,
    default dist 20 (strategic framing like the original).
  * Card art object-fit:contain on gradient; construction rise starts 0.45.
- Verified in-browser: barracks place->build->queue rifle/MG->march (walk anim
  frames differ), enemy AI defended and killed 4 units (combat math active),
  gunship rotor spins (frame delta), ground decal blending fixed, zero console errors.
- Committed 9965119 and pushed to main (Pages build queued/stuck "building"
  at time of writing — GitHub-side; commit content verified in repo).

Stage Summary:
- Live code: main @ 9965119 (docs/). URL: https://nawaf-al-hussain.github.io/AOW3/
- Visuals now: bright saturated jungle, visible foliage/props, blended decals,
  soft shadows, no black silhouettes, no beige void, correct-ish RTS camera.
- Gameplay now: real-rock obstacles only, placement/production/march/AI-defense
  all functional.
- Next candidates: mortar/tank shell arcs, AA flak vs gunship, minimap tap-to-move
  polish, desert-side prop density (real map is sparse mid-map), sound mixing.

---
Task ID: 5
Agent: Super Z (main)
Task: "I am not satisfied. Please keep on working" — original-HUD reskin + FX fidelity pass 4

Work Log:
- Environment was reset again; full recovery from repo (clone + git lfs pull of XAPK + extraction zip).
- Live QA of deployed pass 3 found the UI gap: generic dark panels, emoji building icons,
  emoji-adjacent credits/CP glyphs, oversized plain green selection rings, flat shell tracers,
  plain menu. Original battle-HUD sprites were already sitting in the extraction (1,144 sprites).
- prep_ui_assets.py: extracted 15 original UI sprites into docs/assets/ui/ —
  career_background_f1 (menu art), f1_persons (officers), ico_battle_points (CP),
  unit_select_1 + WayPoint_Ring (rings), Grin_Ligter (move flash), and 8 f1_bld_* building
  icons R/B-swapped to red to match the player faction (same transform the 3D models use).
- alpha_key_rings.py: unit_select/WayPoint sprites ship as white-on-black; converted
  luminance -> alpha so they composite cleanly.
- surgery4.py (15 verified edits, all matched exactly once):
  * BLD_ICON emoji -> <img> original red building icons; .bico/.bimg CSS.
  * .panel reskin to dark steel-blue with light top edge (original panel look).
  * resbar CP icon; menu overlay now career art + officers; .menu-inner scrim for readability.
  * Selection rings -> textured PlaneGeometry with team tint (player #ffb060, enemy #6aa8ff),
    scale radius*1.26+0.32 (was 1.5+0.45 — oversized); fallback to old ring if texture pending.
  * mark() -> original WayPoint ring sprite (green move / red attack / orange capture) +
    additive Grin flash; marker update honors per-marker grow curve.
  * Lobbed shells (splash>0.6 || speed<20) now fly real ballistic arcs (sin(k*pi) * arcMax,
    arcMax = min(5.5, 0.9 + dist*0.3)) and pitch along velocity; bullets stay flat tracers.
  * Selection box white dashed like the original.
- Local QA (agent-browser, port 8777): menu art + scrim OK; building cards show red icons;
  CP icon OK; rings tight & team-colored; right-click orders work w/ waypoint ring + flash;
  injected lobbed shell flies visible arc and lands; tryPlace/canPlace verified (probe loop
  accidentally built a real barracks — tryPlace has side effects, funds math consistent);
  barracks builds -> unit cards enable -> enqueue spawns rifle at barracks. 0 page errors.
- node --check game.js OK. Pushing docs/ + assets/ui to main.

Stage Summary:
- Battle HUD now uses the game's own iconography and panel style; orders/selection feedback
  matches original sprites; shells arc. Menu uses real faction art with officers.
- Live: https://nawaf-al-hussain.github.io/AOW3/ (main:/docs)
- Next candidates: damaged-building states (f1_bld_*_1/_2 icons exist), AA flak vs gunship,
  minimap frame sprite, unit info panel when selecting, victory/defeat screens with art.

---
Task ID: 6
Agent: Super Z (main)
Task: Pass 5 — damage feedback, unit info panel, verdict art

Work Log:
- surgery5.py (6 verified edits) + 3 follow-up patches:
  * Building HP bars now also on the HQ (were non-HQ only).
  * Damaged buildings (<55%) emit thick dark smoke (tinted 0x2e2e2e, rising, big puffs);
    <30% adds fire glow flickers. addFx gained optional tint param.
  * Destroyed buildings leave a scorch decal + smoke burst (were removed instantly).
  * #selinfo panel above the minimap: selected unit name + count, HP bar,
    RE'd stats (DMG light/medium/heavy · RNG · ARM) — updates every minimap tick.
  * Verdict (victory/defeat) screen uses the faction art background.
- Local QA: selinfo shows "Rifle Squad ×3" + green bar + stats; HQ damaged to 25% shows
  red HP bar + dark smoke plumes; zero page errors; node --check OK.

Stage Summary:
- Damage feedback loop complete: hit -> HP bar -> smoke -> wreck scorch.
- Pushing to main; next candidates: AA flak, minimap frame art, damaged building
  icon states, sound mixing (positioned volume already partial).

---
Task ID: 7
Agent: Super Z (main)
Task: Live deploy verification of passes 4+5

Work Log:
- Pages built ab56bbe (pass 4) and 3fc697a (pass 5); live QA on production URL with fresh
  cache-busted session (?v= param — browser had cached old game.js, note for future QA).
- Live verified: menu faction art, red building icons + CP icon in HUD, selinfo panel,
  team-colored selection rings, building HP bars (HQ included), damage smoke, production
  gating (MBT/Rocket Artillery via factory), queue badges on cards, assault march across
  the real map, artillery scorch decals + debris impacts at the enemy base, blue enemy
  buildings vs red player forces.
- Staged full combined-arms assault via debug API (funds+factory+enqueue) — battle loop
  intact end to end, zero page errors.

Stage Summary:
- Live: https://nawaf-al-hussain.github.io/AOW3/ @ 3fc697a
- Remaining candidates: AA flak vs gunship, damaged-building icon states, minimap frame
  art, ambient birds/wind loop, unit veterancy/battle report.
---
Task ID: 8
Agent: Super Z (main)
Task: Pass 6 — AA flak vs gunships, damaged-building states, minimap frame art, richer sound mixing

Work Log:
- Environment was wiped mid-session; recovered by cloning nawaf-al-hussain/AOW3 (XAPK + docs build inside repo).
- Added "Flak AA" unit (f2_veh_armadillo / f1_veh_zeus models, 340¤ CP1, factory-built), card-flak.png generated with PIL.
- AA rules: def.antiAir gates aircraft targeting in findTarget + building turret AI + commandAttack manual orders; aircraft can't target aircraft; flak/turret get -3 target priority vs air.
- Flak projectiles tagged airburst -> sim.pops -> renderer airburst fx (flash + smoke + b_med3 pop).
- AI builds flak and hard-counters player helicopters.
- Building damage stages: per-instance material cloning + charring (lit 0.45-1.0 by hp frac), smoke stages (>60%/slow, <60%/fast), roofline fire sprites (texFlame tinted, additive) + glow + flash at <30%, creak sfx loop.
- Minimap frame: bezel/corner brackets/rivets/TACTICAL RADAR + SECTOR 7 plates (CSS), radar sweep wedge in drawMinimap.
- Sfx rewrite: master->compressor->destination, sfx/ui/amb buses, StereoPanner from camera right vector, distance low-pass + exp falloff, 28-voice cap, distant echo layering, layered explosion hook (boom + half-rate tail + metal debris), procedural ambient (wind bandpass loop + LFO, rumble bed, random bird chirps) started on first gesture.
- QA via agent-browser headless: flak killed gunship in ~4s with airburst; rifle (non-AA) never targeted aircraft; factory at 15% shows charring+smoke+roof fire; minimap frame renders; node --check OK; zero page errors.
- Live verified on production URL @ 78722ba (AA duel + damage states + frame art confirmed via screenshot).

Stage Summary:
- Commit 78722ba pushed; live: https://nawaf-al-hussain.github.io/AOW3/
- Scripts: /home/z/my-project/scripts/{patch_v3.py,make_card_flak.py}
- Candidates for next pass: flak tracer elevation toward airborne targets, veterancy/battle report, unit death animations, per-building smoke tint variety.

---
Task ID: 9+10
Agent: Super Z (main)
Task: Pass 7 (1:1 look) + Pass 8 (veterancy, battle report, death anims, pond fix, portraits)

Work Log (pass 7, recovered from wiped session — commits 6447d88..5b8365d):
- Ocean world: clear/fog color tan -> sea haze, apron hidden on real map, water 900x900 animated.
- Waving team flags (8x4 cloth + animateFlags), GLB unit portraits (makeUnitPortraits,
  offscreen renderer, matched tone; card data-URL ?v=2 bug fixed; index.html cache-bust v=7).
- Smooth fog (2x blur composite), CSS color pop, portrait polish.

Work Log (pass 8, patch_v5.py 30 edits + 3 fixes):
- Veterancy: sim.stats per player, u.kills + lastHitBy/srcId tracking through every damage
  path (direct, airburst, splash, single-target, building hits); rankTier 1/3/6 kills ->
  Veteran/Elite/Ace; damage x(1+0.08*tier), incoming x(1-0.05*tier); kill/loss credit on
  unit + building death blocks.
- Rank UI: gold chevron sprite (paintRank, 48x18 canvas) above units, selinfo shows
  "VETERAN/ELITE/ACE · N kills".
- Battle report: #report table on the verdict screen (Units fielded / Enemy kills /
  Units lost / Buildings razed / Buildings lost / Battle time, YOU vs ENEMY).
- Death animations: all deaths now route through syncDying with modes — aircraft crash
  (spin + tilt + descend + smoke trail, explode on impact), infantry fall (rotate to
  ground + material fade), vehicle tip (tip over + charred clone materials + smoke),
  GLB die_bullet/die_explosion clips still honored; finishDeath -> wreck FX.
- West-cliff blue artifact: was TWO things — (a) translucent waterfall/lagoon sheets
  sampling flat blue atlas region: re-materialled with animated sea-matching water
  material (pondMat, bb+opacity filter); (b) a blue shipping-container base prop:
  placeBaseProps now snaps props to heightAtWorld and skips underwater spots.
- Fog plane enlarged +90 margin with UV remap + clamp so unexplored dark extends over sea.
- Infantry portraits brighter (key 4.4 / rim 2.0 for infantry).
- FIX: unit HP bars were scene children (never followed units) -> parented to model group;
  rank sprite likewise.
- Local QA (headless): chevrons + ACE panel verified, crash/tip aftermath verified,
  report table verified (10 kills / 10 losses), lagoons blend, no page errors.

Stage Summary:
- Push BLOCKED this session: GitHub credentials helper (/home/z/bin) lost in environment
  wipe; commits exist locally on main (pass 8 + fixes). Deliverable copied to
  /home/z/my-project/download/ for manual deploy; re-push when credentials restored.

---
Task ID: 10
Agent: main (Super Z)
Task: Restore GitHub credentials (user-provided token), push pass 8, live QA

Work Log:
- User supplied fresh GitHub PAT; remote set-url + ls-remote auth OK.
- Push initially rejected: remote had 3 new doc-only commits (AGENTS.md,
  reverse/AGENTS.md, docs/AOW3_DEVELOPMENT_PLAN.md). Rebased pass 8 onto
  origin/main cleanly (no source conflicts), pushed 8143cd3..66bbe0e.
- Pages verified: index 200, serves game.js?v=8b, rankTier/syncDying/paintRank present.
- Live QA (agent-browser session p8live, fresh cache):
  * Load + skirmish start: zero console/page errors.
  * Veterancy: stats[kills/losses] tracked through real combat (P1 2/2, P2 2/2);
    chevron sprites visible on veteran tanks (4/16 views), per-unit kills=1 tier=1.
  * Death animations: 8 forced deaths (hp=0) routed through syncDying (observed
    mode "anim"), losses 3->11, queue drained to wreck FX.
  * Lagoons: 26 meshes on pondMat (color 507dd0, opacity .93, animated offset map).
  * Battle report: enemy HQ hp=0 -> VICTORY verdict + full YOU/ENEMY report table
    (7 rows: fielded/kills/lost/razed/lost/time) rendered live.
  * Infantry portraits brighter in build bar (rifle/MG/AT readable).
  * Reload: zero errors.

Stage Summary:
- Pass 8 fully deployed and live-verified on GitHub Pages. main = 66bbe0e.

---
Task ID: FileUpload-Audit
Agent: Super Z (main)
Task: External Reverse-Engineering Collection Audit — FileUpload/AOW3 (7 archives)

Work Log:
- Inventoried FileUpload/AOW3 via GitHub API: 7 archives (~144 MB). Downloaded all, SHA-256 recorded (manifest.md), zip integrity verified, extracted 106,214 files. No nested archives, no executables; 4 Python scripts inspected (benign viz generators, not executed).
- Identified version: ALL material derives from com.geargames.aow 6.5.22 (versionCode 38820) — decoded from binary AndroidManifest.xml; current repo evidence is 6.9.18. MISMATCH recorded.
- Duplicate detection: jadx trees byte-identical between artofwar3_source_code and artofwar3_complete_phase12 (35,274/35,274); 14 docs byte-identical across 3 archives; name lists identical across 2. Collection = 1 APK decompile + 1 name-list set + 1 doc set + 1 metadata dataset, repackaged.
- Classification: "source_code" = jadx Java layer (SDK boilerplate + 20 game files), NOT C#/gameplay source. Docs = identifier-derived analysis, zero numeric balance tables, no formulas with constants. aow3_source_data = raw global-metadata.dat exports (6.5.22).
- Verification vs 6.9.18 dump.cs: 1,247 curated method names -> 913 MATCH (73.2%), 81 compiler artifacts, 9 interface-explicit, 244 NOT_FOUND (~120 genuine drift: addCommand* facade, calcBasicDamage, generateMineDamage, calcCoilTankArmorBonusFrontal, get_Bat*, addCommandHeroAbility*...). GAI_COMMAND_* constants 146/146 (100%). AICommUnitsMove/Stop/HoldPosition/Bombard/Psionic confirmed. RSA/DES crypto claim confirmed (DESNetworkCryptoProvider, RSANetworkCryptoProvider, RsaDesPacketAnswer). VFX naming (fire_rifle1_s1 etc.) UNVERIFIED (asset paths; stringliteral.json n/a).
- Conflicts: no value-level conflicts possible (no numbers exist in collection). Name-level conflicts = version drift; AttackCoeffCalculating/ARMOR_COEFF UNRESOLVED (absent from 6.9.18 dump; native ArmorStatHelper analysis required). docs/game.js NOT touched.
- Imported (curated, with provenance): reverse/external/fileupload-aow3/{manifest.md,audit-report.md,evidence/6.5.22/*} (14 files, ~3.6 MB), reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md, reverse/versions/6.5.22-fileupload-collection.md; reverse/README.md contents table extended.
- Rejected: 105k jadx .java files, string_table.txt, type_definitions.json, generated visualizations (reasons in audit-report).

Stage Summary:
- Audit complete per Definition of Done: all archives inventoried+hashed, versions identified (6.5.22 vs 6.9.18), provenance documented, claims verified independently, conflicts recorded, duplicates detected (single-source rule applied), curated imports with provenance + confidence levels, browser implementation untouched.
- New leads: ArmorStatHelper native analysis (resolves UNRESOLVED conflict), CreateDamageForMediumArmor pipeline, MineDamageFor*ArmorStat stat models, redeploy mechanic, asset-catalog VFX check.

---
Task ID: 11
Agent: main (Super Z)
Task: Fix "everything is grey" map regression

Work Log:
- Reproduced on live v=8b fresh session: flat grey terrain around base; units/HP bars normal.
- Binary search: hid fog plane -> still grey; raycast screen -> top hit = pondMat sheets at
  y=1.6 covering terrain near base; hid 26 pondMat meshes -> terrain lush again (causality).
- Root cause: pass 8 R12 lagoon re-material iterated ALL scatterMeshes and applied opaque-ish
  pondMat (opacity .93) to every flat translucent sheet (26 stacked waterfall/mist/lagoon
  overlay sheets, cnt:1 each, one site) -> giant grey-blue slab over the base area.
- Fog-of-war verified intact (alpha histogram 0/74/195 = revealed/explored/unexplored;
  sim.visible=1 + canvas alpha 0 at unit positions; R11 UV remap re-derived = correct).
- Remaining dark flat areas = ocean (by design) + unexplored fog (correct).
- Fix: R12 block now sets im.visible=false on those stacked overlay sheets instead of
  re-materialling them; pondMat creation removed (syncFx guard handles undefined).
  index.html cache-bust ?v=9. Stashed unrelated .gitattributes renormalization noise
  from remote audit commit; rebased; pushed 37945d0..2cd8b1c.
- Live QA v9: base terrain lush (trees, HQ, props), fog reveal works, ocean dark, zero errors.

Stage Summary:
- Grey map regression fixed and live (main = 2cd8b1c). Lagoon site now renders as plain
  terrain (sheets hidden); if a water look is wanted there later, needs per-sheet alpha
  textures rather than a uniform material.

---
Task ID: 12
Agent: main (Super Z)
Task: Fix "map looks underwater / textures ruined" feedback

Work Log:
- Diagnosed: Pass 7 "ocean world" color scheme read as submerged — pale grey-cyan clear/fog
  (12571336) tinting every surface, 900-unit dark steel-blue water plane dominating views,
  warm ground apron hidden.
- Reverted to original warm scheme (pre-pass-7 values recovered from git history):
  setClearColor(13616034) tan, Fog(13616034, 170, 560), water 560x560 repeat 26
  roughness .32 metalness .08 opacity .92 y -0.42 (kept this.water ref + wave anim),
  apron visible again. Kept: fog margin R11, hidden overlay sheets, portraits, etc.
- index.html ?v=10; pushed 5fdf487; live verified.
- QA v10: warm sand/jungle palette, bright explored zone, natural haze; zero page errors.

Stage Summary:
- Underwater tint removed; scene matches original warm desert-coast look (main = 5fdf487).

---
Task ID: 13
Agent: main (Super Z)
Task: Fix "wrong assets mapped to models" — faction swap correction

Work Log:
- Rendered all 19 unit GLBs in a local three.js grid viewer + compared with APK card art
  (card-infantry = BLUE soldier, card-tank = BLUE tank) and bld-*.png UI icons.
- Root cause: player (owner 1) was assigned f2 (RED faction) models; enemy got f1 (BLUE).
  The real game's player is the blue faction. Also "tank" for f2 mapped to f2_veh_coyote
  (scout armored car) instead of f2_veh_jaguar (actual MBT); enemy AT used f2_inf_sniper
  instead of the rocket-tube f2_inf_heavy.
- UNIT_MODEL reordered to [f1, f2] with pair[owner-1]; tank->jaguar, rpg->f2_inf_heavy,
  mg->f2_inf_sniper. buildGlbHq/buildGlbBuilding red-tint now applies to owner 2.
- Team colors corrected everywhere: FACTION fallback, sel ring (player green / enemy red),
  minimap dots (player blue / enemy red), enemy HP bars always red, flags per owner,
  HUD emblem -> blue, depot-capture float colors.
- v=11 pushed (61ccfb4). Live QA: blue player lineup (Torrent/Fortress/Zeus/heli), red enemy
  lineup with Jaguar MBT, blue HQ + blue flag, red enemy HQ + red flag, blue build cards,
  minimap correct, combat kills tracked (P1 2/1), zero page errors.

Stage Summary:
- Faction identity now matches the original: blue player, red enemy (main = 61ccfb4, v=11).

---
Task ID: 14
Agent: Super Z (main)
Task: Assess AGENTS.md, then fix assessment findings — document redistribution rationale, correct repo map, add rule-status legend + phase note, add deploy/verify workflow

Work Log:
- Read AGENTS.md (1,300 lines) and reverse/AGENTS.md (1,274 lines); cross-checked claims
  against the actual tree (git ls-files, LFS stubs, docs/assets contents).
- Assessment verdict: strong doctrine (evidence hierarchy, confidence levels, anti-rewrite
  guardrails) but 4 issues: (1) §3 banned asset redistribution while the public repo hosts the
  270MB XAPK + 212MB asset zip via LFS — self-contradiction; (2) §4 tree did not match reality;
  (3) deploy/QA loop (?v=N, probes, Pages) undocumented; (4) NOW-vs-TARGET rules unmarked.
- Repo hygiene found during pre-check: 981 files showed modified — pure file-mode churn
  (100644->100755, 0 insertions/deletions). Fixed locally with `git config core.fileMode false`;
  tree now clean. Nothing committed for mode noise.
- AGENTS.md §3 rewrite: added §3.1 "Redistribution Decision" — owner's documented rationale
  (non-commercial research; publicly distributed free-to-play source package; verifiability of
  the evidence base; no misrepresentation/attribution preserved; no competing multiplayer
  service; takedown policy via GitHub issues) with explicit "not approval, not legal advice"
  disclaimer; added §3.2 "Still Forbidden" (repo-internal-only redistribution; no selling/
  reuploading/moving assets; credentials; provenance removal).
- AGENTS.md §4 rewrite: real tree — AGENTS.md files, root XAPK (LFS), assets/aow3-extracted-
  assets.zip (LFS), docs/ as Pages root with assets/{models,decor,ui,fx,sfx}, reverse/ with
  notes/evidence/versions/external, pipeline/ with tools/ + map JSONs.
- AGENTS.md new §1.1 Rule Status Legend ([NOW]/[TARGET]); §7 retagged [TARGET] with honest
  current-status note (sim still partly render-coupled per §31).
- AGENTS.md §32: added Current Phase Note (Oct 2026) — visual passes are legitimate
  owner-directed work items; must not deepen render-coupled state, must pass live QA per §35.
- AGENTS.md new §35 "Deploy & Verify Workflow [NOW]": Pages from main, ?v=N cache-bust rule
  (currently v=11), push->wait 75s->curl verify->fresh-session QA, runtime probe reference
  (__aow3, __DBG.cam, __DBG.fog*, r3d.unitViews/dying/water, S.spawn/S.commandMove/S.stats/
  S.visible, MAP_W=160 fog 1:1 probe rule), worklog append protocol.
- docs/game.js and docs/index.html untouched — no cache-bump needed for doc-only commits.

Stage Summary:
- AGENTS.md now documents the owner's redistribution decision (§3.1), matches the real repo
  layout (§4), tags rule status (§1.1, §7), reconciles priority vs visual phase (§32), and
  captures the de-facto deploy/QA loop (§35). AGENTS.md + worklog committed together; docs/
  unchanged (v=11 live).

---
Task ID: 15
Agent: Super Z (main)
Task: Gameplay work — recover native weapon-accuracy formulas (6.9.18) and replace the browser hitChance model; also dedupe reverse/AGENTS.md

Work Log:
- Deduped reverse/AGENTS.md against root AGENTS.md (1274 -> 631 lines): precedence table
  (root wins on doctrine), repeated hierarchy/confidence/commit/engine sections replaced by
  references; all RE-specific procedures kept. Rebased over remote 00c562a (armor evidence);
  pushed 2de3fa3.
- Audited sim loop: fixed-timestep accumulator ALREADY implemented (TICK_RATE=20 @ game.js:399,
  0.25s frame clamp, 8-step catch-up cap, sim.step(stepDt)+ai.step(stepDt) only inside the
  accumulator; damage/hp mutations all within sim.step) — root AGENTS.md §31's
  "sim not render-independent" limitation is stale; left doc update for a doc pass.
- Gameplay gap chosen (§32 #6 weapon behavior / §13 checklist): hitChance used an invented
  0.35 distance falloff, keyed the walk penalty on TARGET movement (semantic inversion),
  and never used accuracyDynamic/hitBonus/distanceMin.
- Found the native accuracy surface in dump.cs: WeaponStaticAccuracy @0x7FCEFF8 /
  WeaponDynamicAccuracy @0x7FCF0B8 (GUIMainUpgradeHelperFunctions, same class as the
  verified damage triad) + entity WeaponType schema (accuracy_static/dynamic/walk @0x8E/90/92,
  guided @0x94, walking_shot @0x8A, distance_min @0x58, explosion_decr @0x84).
- Pulled the LFS XAPK via GitHub LFS batch API (git-lfs missing in env; PAT auth), extracted
  libil2cpp.so (sha256 8ace05bb... == armor-note provenance), wrote
  reverse/tools/accuracy_native_analysis.py (capstone 5.0.7, self-test = documented
  WeaponDamageLightValue body — machinery validated).
- Recovered formulas: percent branches (acc/100), walking product accWalk*accStatic/1e4
  (rodata 10000.0 @0x1b09d28), guided->static, scatter type 27 (1-acc/1000, 0.9+(acc-100)/-308),
  default splash branch 1-0.5*d*acc*(1000-10*decr)/(1e6*R), dynamic splash with (accW+accS).
- Implemented in docs/game.js: weaponStaticAccuracy/weaponDynamicAccuracy/hitChance(w,
  shooterMoving, distance); call sites updated (shooter-side movement semantics; turret
  static); def fields added — walkingShot for rifle/mg/rpg, guided for helicopter,
  splashScatter+explosionDecr:30 for artillery (documented approximations). Veterancy and
  clamps kept as gameplay layer.
- Evidence: reverse/notes/weapon-accuracy-native-analysis.md,
  reverse/evidence/tests/accuracy.md + accuracy.test.js (13 vectors, all pass; one md
  arithmetic slip caught and fixed by the test itself), combat-stats.md §6,
  reverse/AGENTS.md §13 checklist updated.
- v=12 pushed; live QA pending at push time of this entry.
- QA v12 (fresh session, skirmish, zero page errors): standing rifle-vs-rifle duel hit
  rate 0.778 (n=9) vs expected 0.72 (binomial noise OK); shots/sim-sec 0.90 == 1/1.1s
  cooldown exactly (headless rAF throttling only slows wall-clock, not the ratio).
- Walk-fire gap found: units ALWAYS stop to shoot (u.path=[] before shoot()) and the
  move-order branch never targets — the recovered dynamic branch would be dead code.
  Native walking_shot semantics = fire on the move. Implemented: walkingShot weapons
  under move orders acquire targets of opportunity and shoot without stopping
  (updateUnits move branch); vehicles/buildings unchanged. v=13 pushed (da8e4a8).
- QA v13 (same fresh session reloaded): perpetual-move rifle hit rate blend 0.556
  vs predicted 0.43*0.346 + 0.57*0.72 = 0.559 — dynamic curve confirmed live; bucketed
  spot checks directionally correct (small n due to headless throttle; deterministic
  vectors remain the authoritative math check, 13/13 pass).
- Long-window confirmation: mvN=17/stN=6, blend 0.435 vs predicted 0.443 (mvShare 0.74).
- Headless artifact note: p12 session reported ~40 EMPTY-message pageerror events
  (no window.onerror capture, no unhandledrejection, menu clean, sim healthy, not
  reproducible when instrumented in a fresh session p13 = zero errors) — environmental,
  not a v12/v13 regression; flagged for future passes to watch on real browsers.

Stage Summary:
- Browser accuracy model now matches the recovered 6.9.18 native curves (HIGH CONFIDENCE
  formula shapes; branch selection + explosionDecr documented as approximations). Old
  invented falloff removed; shooter-vs-target movement semantics fixed.

---
Task ID: ArmorStatHelper-Native
Agent: Super Z (main)
Task: Native analysis of ArmorStatHelper to close the UNRESOLVED conflict (external ARMOR_COEFF / AttackCoeffCalculating claim)

Work Log:
- Re-fetched the repo's own 6.9.18 XAPK via the LFS media endpoint; SHA-256 1a41e033cce3f7e8595a0aa1dac07e90799d21a92793faaebbc13d3378b32c3e — byte-identical to the committed LFS OID (provenance intact).
- Extracted config.arm64_v8a.apk → lib/arm64-v8a/libil2cpp.so (164,646,104 bytes, SHA-256 8ace05bbaa2cdfda156e377cfbcb0c0a6fb223fa68188fa3df49f677f10e90c5).
- Wrote Capstone ARM64 disassembler with ELF64 PT_LOAD vaddr mapping + rodata float annotation (reverse/tools/armor_native_analysis.py); rodata sanity: 0.1f@0x1b09b9c (0x3DCCCCD0), 0.9f@0x1b099f0 (0x3F666666) — matches combat-stats.md.
- Disassembled the entire armor-damage surface: ArmorStatHelper.GetArmorMeta (0x7cb6b30 — zero FP instructions; ArmorType(0..2) → (EStat 7/8/9, display-string enum); pure UI metadata), MaxStatValueProvider.Get (routes only EStat 61–63 WeaponArmor{L,M,H} + 72–74 WeaponSuperWeaponArmor{L,M,H} into the curve), CalculateWeaponArmorDamage (only float constants: 0.1f/0.9f/1.0f; no per-armor-type table, no switch), WeaponDamage{L,M,H}Value (int triad 0x28/0x2c/0x30 + int8 level scale @0x6a when layout tag==40), six WeaponStatsFactory 16-byte tail-call thunks → builders differing only in baked EStat id (61/62/63, 72/73/74), three MineStatsFactory.CreateDamageFor* (arithmetic-free delegation).
- Metadata sweeps: 0 hits for ArmorCoeff/AttackCoeff in dump.cs (audit) AND stringliteral.json (this pass); only 6 armor strings, all UI icons/labels.
- Verdict: no ArmorCoeff(ArmorType,WeaponType) multiplier exists in 6.9.18 metadata, string literals, or native code. External claim REJECTED; conflict RESOLVED. Browser 0.9/0.1 curve stands (native-confirmed). docs/game.js untouched.

Stage Summary:
- Conflict record status UNRESOLVED → RESOLVED with §C Resolution subsection (reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md).
- New: reverse/notes/armor-stat-helper-native-analysis.md (full evidence), reverse/tools/armor_native_analysis.py (repro script); combat-stats.md §1 addendum (EStat routing 61–63/72–74 + surface closure); audit-report next-investigation #1 marked DONE, §42 Conflicts updated; reverse/README.md contents extended.
- Audit "Recommended Next Investigations" #1 and #2 (damage-pipeline wrappers) are both natively covered by this pass; remaining: #3 asset-catalog VFX prefixes, #4 EStat stat-list extraction, #5 (blocked: no 6.5.22 binary).

---
Task: FileUpload audit follow-up — items #3 (VFX prefix check) and #4 (EStat stat-list extraction)

Work Log:
- Item #4: extracted the full EStat enum (dump.cs:168776-168858, 78 values, 0-77), EStatCategory (168861-168870), IStatModel contract (20773-20810, incl. EStat Stat property), and all 45 IStatModel implementors (22 weapon/mine TDI 396-418 in Domains.Workshop.Impl.Models.Weapon; 23 building/unit TDI 4407-4431 in com.geargames.aow.ugui.army.models.info.Stats).
- Item #4: dump-direct proof that WeaponDamage (TDI 414) is EStat-keyed via 6 static Create*Damage factories (WeaponArmor{L,M,H} 61-63, WeaponSuperWeaponArmor{L,M,H} 72-74). MineStatsFactory.CreateList builds damage-for-3-armors + cost + fire-rate + radius. MaxStatValueProvider.StatInfo = 3-tier caps {BaseMax, FirstMax?, MegaMax?}.
- Item #4: class->EStat mapping: 24 MATCH, 10 MATCH_STRIPPED (Building*/Unit* prefix), 8 INFERRED, 0 unresolved. Icon corroboration: 66 ico_stat_* literals (40 unique-family).
- Item #3: pulled assets/aow3-extracted-assets.zip via LFS media endpoint, SHA-256 verified against committed OID (fff43c4d...). catalog.json inside is an empty placeholder — the 2,157 filenames are the catalog. Scanned all names: fire_ = 11 audio files with the exact fire_<weapon><n>_<v> shape (CONFIRMED at audio layer), expl = partial (frozen_expl_2 x2), bul_ = 0/2,157. Real VFX layer in subset = built_invfx_assets_all_* + atlas_vfx.
- Deliverables: reverse/notes/units/estat-stat-models.md (Phase 26 format) + estat-classes.tsv + reverse/evidence/estat/estat-extraction.txt + reverse/tools/extract_estat_stats.py; reverse/notes/vfx-asset-prefix-check.md; audit-report.md rows (VFX -> PARTIALLY CONFIRMED MEDIUM; Economy -> structure CONFIRMED at enum level; ATTACK_INTERVAL -> representation drift via WeaponFireRate/60) and next-investigations #3/#4 marked DONE.

Stage Summary:
- Audit "Recommended Next Investigations" #3 and #4 are closed; only #5 remains (blocked: no 6.5.22 binary).
- New canonical 6.9.18 stat taxonomy available for tribute Phase 5/26 work: 78 EStats, per-armor damage keys, mine model, 3-tier stat caps.
- docs/game.js untouched. Commits: 9362b47 (item 4), fa6d62a (item 3), + this report update.
Task ID: 16
Agent: Super Z (main)
Task: Gameplay 1:1 pass — replace invented 7-unit roster with the native-verified 6.9.18 roster (§32 priority 2: unit/building data fidelity); fix stale §7/§31 docs

Work Log:
- Verified dead end (evidence-grade): prototype stat tables are server-delivered, NOT in
  the 6.9.18 package. Scanned all 30 Unity bundles via UnityPy (Unity 6000.0.80f1) — only
  decor/VFX/UI/map assets; byte-grepped all 3,803 bin/Data files for UnitType/WeaponType/
  BuildingType/etc — only global-metadata.dat hits; localization dictionary loads via
  LoadResourceSource Web/Cache (CSMainLocalization resource loader), not local.
- Recovered the REAL roster instead: AudioControllerCommonSounds select-sound keys
  (ItemF1*/ItemF2*) enumerate both factions' units; UnitType.UNIT_ID_* constants confirm
  ids and faction blocks (f1: Fortress 10, Hammer 11, Typhoon 12, Zeus 15, Torrent 16,
  Shield 17; f2: Coyote 110, Armadillo 111, Porcupine 112, Jaguar 115, Mammoth 116,
  Fog 117 = chameleon model; infantry Ilight 0/100, Iheavy 1/101, Sniper 102).
  Roles cross-checked per model: typhoon b_rocket1+radars (MLRS), torrent twin guns (AA),
  porcupine rotary mount (AA), fortress siege hull, zeus/armadillo dual w1+w2 rounds,
  shield/chameleon NO weapon clips (support/stealth).
- Rewrote docs/game.js roster: 15 native units (UNITS), per-faction BUILD_ORDER_F1/F2
  (player=f1 blue, AI=f2 red), extended PRODUCER_OF, identity-faithful UNIT_MODEL (old
  mapping showed "MBT Coyote" label over Torrent model, "Mammoth" over Fortress model,
  "Flak" over Zeus, "Rocket Artillery" over Porcupine — all corrected), initial spawns,
  AI build tables + counters, sfx pools, fallback meshes.
- New sim capability: weaponless units supported (guards in updateUnits/findTarget/
  walkingShot); Shield drone = friendly heal aura (2/s, r6, documented stand-in for
  UNIT_TYPE_SHIELD); Chameleon = unarmed fast scout (native stealth documented as not
  reproduced); Zeus chain-lightning shell not reproduced (documented).
- Regression caught by QA: first splice broke the braceless `for` regen loop →
  `ReferenceError: u is not defined` in Sim.step EVERY frame (sim advanced, render/HUD/AI
  dead, ~180 EMPTY pageerrors). Root-caused via window error listener stack capture; fixed
  with braces. NOTE added to §35 probes: EMPTY pageerrors must be stack-verified, not
  assumed environmental (v12 session note may be same class).
- Local QA v=14 (fresh sessions): 0 page errors in 15s gameplay; all 15 units spawn/render
  both factions; combat fast-forward: kills/losses/veterancy tracked, shield aura healed
  probes (+9/+8 hp), torrent acquires helicopter @3 tiles and kills at 4.2s; AI produced
  full f2 roster in 60s; player production verified (tryPlace → producer/CP-gated enqueue
  → training → spawn); HQ destruction → VICTORY + report intact.
- Docs: reverse/notes/unit-roster-native-analysis.md (full evidence chain);
  combat-stats.md §7 (roster + stand-ins); AGENTS.md §7 retagged [TARGET]→[NOW] with
  implementation specifics (TICK_RATE=20, 0.25s clamp, 8-step cap) — stale "render-coupled"
  limitation removed from §31; §1.1 legend line updated. XAPK working-tree copy restored
  to LFS pointer (materialized copy kept in scripts/aow3-bin/).
- index.html ?v=14 pushed as 92298eb (rebased over remote audit commits 9362b47..75c6e4d,
  worklog conflict merged keeping both entries).
- Live QA v=14 (fresh session, github.io): 0 page errors; 6 starters (ilight x2 + iheavy
  per faction); all 14 additional roster unit types spawned and rendered (17 views,
  f1 missing = 0); build bar shows the f1 roster; HUD/economy/minimap ticking.

Stage Summary:
- Browser roster now matches the native 6.9.18 faction rosters in names, ids, models,
  faction assignment, and build structure; stat values remain documented approximations
  (server-only data). Fixed-timestep docs brought in line with reality. Deployed and
  live-verified: main = 92298eb, live game.js?v=14, zero page errors.

---
Task: audit follow-ups (a) full XAPK bundle-name pass for bul_ + (b) native pinning of the 9 ambiguous EStat bindings

Work Log:
- (a) Downloaded the 6.9.18 XAPK via LFS (270,599,286 B; SHA-256 1a41e033… matches the armor-note provenance chain). Unpacked all 7 content APKs (base 6,649 entries + 6 asset packs).
- (a) Parsed assets/aa/catalog.json — Unity Addressables main content catalog (build d8af169b…): 863 internal ids = 832 asset addresses + 31 bundle paths. Families: bul_ = 51 (41 VFX prefabs + 6 anims + 4 mats), fire_ = 24 (18 prefabs + 6 anims), expl_ = 0 — explosions are boom_expl{1..5}_s{0..6}_{ground|veh|water} incl. boom_expl5_s5_nuke; rockets are bul_rocket* / anim_rocet_boom. fire_rifle1_s1.prefab and bul_rifle1_s2.prefab exist VERBATIM. Verdict upgraded PARTIALLY CONFIRMED (MEDIUM) → CONFIRMED (HIGH). Evidence: reverse/evidence/vfx-catalog-families-6.9.18.txt.
- (b) Extracted lib/arm64-v8a/libil2cpp.so (164,646,104 B; SHA-256 8ace05bb… verified). Wrote reverse/tools/pin_estat_bindings.py (Capstone + numpy whole-file BL scan + 150,721-method dump.cs RVA index).
- (b) Six mine/weapon stat classes: get_Stat() is mov w0,#imm;ret → MineCostStat=WeaponMineCost/66 (NOT MinePrice/71), MineDamageFor{L,M,H}ArmorStat=61/62/63, MineExplosionRadiusStat=64, MineSetTimeStat=67.
- (b) BuildingArmorStat..ctor and UnitArmorStat.TryCreate both call ArmorStatHelper.GetArmorMeta (0x7cb6b30) → ArmorLight/Medium/Heavy (7/8/9) per armor type — cross-confirms the armor-note UI-mapper chain.
- (b) SpecialStat..ctor takes caller-supplied EStat; 42 call sites found, all in BuildingSpecialStatsFactory/UnitSpecialStatFactory iterators, enumerating the full unique-EStat set (19-22, 24, 25, 27-40, 41-47, 51, 56, 57). Evidence: reverse/evidence/estat/estat-native-pinning.txt. TSV now 26 MATCH / 9 MATCH_STRIPPED / 6 NATIVE_CONST / 2 NATIVE_ROUTED / 1 NATIVE_ENUM_WRAPPER / 1 DIRECT = 45/45 resolved.

Stage Summary:
- Both follow-ups closed and pushed (893c4bb, 5c25608) after rebase onto the concurrent v=14 roster pass (fa603a3).
- Open detail noted: EStat.MinePrice/71 has no IStatModel class (likely non-UI code path).
- Audit next-investigations: #1-#4 all closed with native/catalog evidence; only #5 remains (blocked: no 6.5.22 binary). docs/game.js untouched.

---
Task ID: 16
Agent: Super Z (main)
Task: Per-unit card art + hero units (Cerber/Seraphim) — 1:1 pass (v=15)

Work Log:
- RE: hero surface pinned from dump.cs/stringliterals — HeroTypes enum (Cerber=1,
  Wasp=2, Seraphim=3, ...12 total), EStat.CerberusWeaponSwitchTime=40,
  Seraphim{Ground,Air}ModeTransitionTime=41/42, ClientUnitStateSpecType
  SeraphimLand/Depart, hotkeys 44/45, hero buy/training/slot/uranium methods.
  Balance numbers remain documented approximations (server-side tables).
- Re-fetched XAPK + extracted-assets.zip via LFS batch API (sha256 verified).
  Recovered the prior extraction tree; extracted ALL base-APK assets (5540 files)
  into bundles_all; assembled hero GLBs with the proven pipeline:
  f1_hero_cerber (move/w1/die clips), f1_hero_seraphim (rotate/w1/w2), f1_bld_hero.
- Card art: authentic aow_f1_* icon sprites + hero_card_ico_{cerber,seraphim}
  wired per def; hammer/shield cropped from int_ico_heroes_f1 atlas.
- Discovered concurrent roster pass on origin/main (92298eb, 15 units, v=14).
  Rebased; replayed the hero/card feature as patch_v8/v8b adapted to the
  native roster (ids ilight/iheavy/torrent/zeus/typhoon/fortress/hammer/shield).
- Sim: hero slot rule (1 living hero, queue-dup guard), Cerber meleeStrike
  (area splash + crit x2 + weapon-switch penalty), Seraphim commandLandDepart
  (grounded: +25% dmg, 45% speed, ground-targetable, airburst/AA retargeting
  via (kind===aircraft||def.aircraft) && !grounded), Hero Building producer.
- UI: gold hero cards in build bar, Hero Building card (bld-hero icon), selinfo
  HERO badge + blades stats + LAND/DEPART button (delegated click), authentic
  card art wins over GLB portraits (portraits now fallback-only).
- Render: grounded-aware altitude with smooth airY lerp, seraphim crash-death,
  ground shadow, hero fire anims, seraphim sfx pool.
- Live QA: production cycle (enqueue -> 24s -> spawn at Hero Building), slot
  gating incl CP cap, air immunity vs ground units / AA targeting, melee mode,
  altitude 2.15 <-> 0.01, zero page errors (local + live).
- Git: two forced-sync rounds vs concurrent pushes; final main = 7f1dbd8 (v=15).

Stage Summary:
- Per-unit authentic card art + 2 native hero units with Hero Building live on
  Pages (v=15). Follow-ups: remaining 10 heroes (prefabs already built: wasp,
  codomash, gatling...), f2 hero building, hero active abilities, torrent/typhoon
  model-role cross-check vs icon art.

---
Task ID: 17
Agent: Super Z (main)
Task: Read owner-updated plan docs; align AGENTS.md with the two governing plans

Work Log:
- Read docs/AOW3_DEVELOPMENT_PLAN.md (updated: architecture dependency order,
  companion-roadmap pointer, current priority restated) and the new
  docs/AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md (396 lines: Rust/Wasm core,
  authoritative multiplayer, accounts, persistence, replays; phases A-L).
- Mapped plan phases to actual repo status: Phase 0 DONE; Phase 1 stepping DONE
  (accumulator), interpolation/determinism NOT (Math.random in sim paths,
  no seeded PRNG, no state hashes/replay fixtures); Phase 2 partial (roster
  data native-verified, still inline in game.js); Phases 5/6 strong/partial
  (native accuracy + accuracy.test.js); Phases 7-15 simplified implementations;
  Phase 16 not started (single-file client); Phase 17 strong (assets 1:1).
- AGENTS.md: added roadmap to the tree, marked both docs as governing plans in
  §32 Current Phase Note, recorded precedence rules + honest phase status.

Stage Summary:
- Plans internalized; next highest-leverage work per both docs = determinism
  (seeded sim PRNG + state hashes/replay fixtures) and data-model extraction,
  NOT Wasm/multiplayer yet.

Task: audit item #2 (damage pipeline) + MinePrice/71 xref + VFX taxonomy fold-in

Work Log:
- Rebuilt the native workspace (LFS download of the 6.9.18 XAPK; SHA-256 1a41e033… chain intact; libil2cpp.so SHA-256 8ace05bb… verified) and wrote reverse/tools/damage_pipeline_native_analysis.py (Capstone + numpy BL xref over 2,982,071 BLs + 150,721-method dump.cs index) + mine_getkey_sweep.py + pipeline_followup_scan.py.
- Audit item #2 CLOSED: WeaponDamage.CreateMediumDamage (0x80ede50) builds the stat model with baked EStat=62 + name/hint ids 630/720; full 6-factory table extracted (61/62/63/72/73/74, ids 629-631/719-721); ctor field layout natively confirmed (Stat→0x40, Category=Base(1) constant); Calculate = 3 modification-collection dispatches + #0x28-guard combine; CalculateProgress interface-tail-calls m_max.Get(value, ownStat). Mine leg: CreateDamageForMediumArmor → MineDamageForMediumArmorStat..ctor (0x80e9948); Calculate is a mine-prototype-keyed modification adapter. Xref: CalculateWeaponArmorDamage has exactly ONE native caller (MaxStatValueProvider.Get); all Get calls are interface-dispatched (7 indirect sites proven). Note: reverse/notes/damage-pipeline-native-analysis.md; evidence: reverse/evidence/damage-pipeline/.
- MinePrice/71 RESOLVED natively: whole-binary scans (0 direct literal-71 call sites, 0 get_Stat==71 compares, 0 hits in UI icon/color pipeline) left exactly one literal — an indirect interface tail-call in MineCostStat.CalculateProgress (mov w1,#0x47 @0x80e8f00 → m_max.Get(value,71)). Sweep of all six mine CalculateProgress: cap keys 61/62/63/64/67 + MineCost→71 (only class with cap key ≠ value key). Verdict: MinePrice/71 = the MaxStatValueProvider tier-cap key for mine cost; no icon, no IStatModel class. estat-stat-models.md §6.7 + Unknowns closed; TSV MineCostStat row updated.
- Audit report: item #2 struck DONE (Recommended Next Investigations + leads + browser-impact sections).
- Tribute FX taxonomy fold-in (docs/game.js): added frozen AOW3_VFX_TAXONOMY registry (7 authentic Addressables families with verbatim counts/examples, evidence-cited) exposed as window.__vfxTaxonomy; tagged the four FX emitters with taxonomy tokens — muzzle flash → fire_{rifle|gun|missile} (def-kind heuristic), tracers → bul_ / bul_rocket_, explosions → boom_expl{1|3|5}_s{0..6}_{ground|water} (water plane y=-0.42), pops → impact_. Additive only (48 insertions, 6 deletions); sim untouched.
- QA: node --check clean; headless browser run (fresh load → skirmish → 30 s combat): 0 page errors, 0 console errors, __vfxTaxonomy live (7 families); index.html cache-buster bumped v=14 → v=16 (v=15 was taken by the concurrent hero/card pass).

Stage Summary:
- Damage pipeline now reconstructed end-to-end with native evidence at every hop; the only damage math remains the 0.9/0.1 curve + counter-triangle int triad + level scaling.
- EStat MinePrice/71 consumer account complete (78/78 stat usage surfaces accounted).
- Tribute FX naming now anchored to the confirmed 6.9.18 Addressables taxonomy; battle verified error-free.

---
Task ID: 17
Agent: Super Z (main)
Task: Phase 2 — data-model extraction (AOW3_DEVELOPMENT_PLAN Phase 2), v=17

Work Log:
- dump.cs re-extracted from reverse/dump.cs.zip after env reset (sha256 0050e67d
  matches recorded provenance; 63,922,449 B).
- reverse/tools/extract_data_model.py: parse dump.cs -> reverse/evidence/data-model/
  {estat.json (78 EStat + EStatCategory), weapon-schema.json (27 fields 0x10..0x60),
  unit-type-ids.json (43 UNIT_ID_* + categories + HeroTypes 13)}. All counts match
  the established evidence (estat-stat-models.md, roster note).
- Fixture guard: pre-refactor data tables (game.js v=15 lines 15-409) snapshotted via
  vm to reverse/evidence/tests/data-model-fixture.json (18 units / 7 buildings /
  16 armed units / 19 weapon configs incl. cerber melee).
- docs/data/ (6 modules -> window.AOW3_DATA, node-loadable): stats.js (estat 78 +
  fieldEstat + weaponFieldMap + tributeLocal), weapons.js (19 named configs),
  units.js (18 defs, weapon refs), buildings.js (hq/depot/7), factions.js
  (rosters/producers/economy + powerIncome/powerCP), index.js (resolution + version +
  nativeUnits evidence map). Values generator-transcribed from fixture (no hand-copy).
- game.js: lines 15-409 (395 lines of literals) -> 19-line AOW3_DATA consumer block
  (same var names/values); power*2 hardcodes -> ECONOMY.powerIncome/powerCP (2/2).
  37,229 -> 36,853 lines. index.html: 6 data script tags + game.js?v=17.
- reverse/evidence/tests/data-model.test.js: 265 assertions PASSED (fixture deep-eq,
  estat vs estat.json 78/78, schema anchors, field coverage, UnitType/HeroTypes ids,
  referential integrity); accuracy.test.js 13 vectors still pass; node --check clean.
- reverse/notes/data-model-extraction.md written (mapping + value policy + gaps);
  AGENTS.md §32 updated: Phase 2 DONE.

Stage Summary:
- Phase 2 live as v=17 (v=16 collided with the concurrent remote FX pass 2f0bd7f;
  bumped per §35): gameplay data is machine-readable and separated from engine
  code; schema evidence reproducible; behavior fixture-verified neutral. Next per
  plan: Phase 3 unit state machines, or determinism gaps (seeded PRNG, state hashes).

---
Task ID: 18
Agent: Super Z (main)
Task: Phase 3 — unit state machines (idle/move/attack/acquire/rotate/shoot/reload/stop/die), v=18

Work Log:
- RE: dump.cs Unit fields (task/think/orient/orient_dest/flag_shoot/obj/objPreferred/
  obj_close/idled/last_action_tick/die_tick/walk_state), UnitStateType stat-state
  (rotate/aiming/sight/approach/die_time/damage_priority), WeaponType fire cycle
  (aiming/shot_start/shot_count/shot_int/shot_tick[]/round_len/distance_min/
  rotate_speed/priority), runtime Weapon mini-FSM (turret orient/ready_to_shoot/
  index/tick), WARNED_BY_NEARBY_FRIENDS=1, StopOnEnemyNearby -> note
  reverse/notes/unit-state-machines-native-analysis.md. Sim is server-side in the
  native game: structure-level reconstruction, values remain tuned.
- Sim (docs/game.js): explicit FSM — updateRotation (hull turns at rotate rad/s,
  orient_dest from target/waypoint), updateTargeting (objPreferred stickiness,
  acquisition, aim reset on engagement switch), fire gate (facingOk fireArc +
  aimT), burst structure (shotCount/shotInt; single-shot neutral), damage_priority
  acquisition weighting (dmgVs/health), retaliate + warn propagation in applyHit
  (aggro()), idle guard-return, commandStop (TASK_WAIT, hotkey S), die state
  (sim.corpses with die_time, render dying pipeline untouched), followPath vx/vy
  zero. FSM_DEFAULTS per kind (infantry/vehicle/aircraft; hero->aircraft if
  def.aircraft); per-def overrides reserved.
- Kernel markers: SIM KERNEL BEGIN/END around the DOM-free sim region (data consts
  through Sim class); unit-fsm.test.js extracts the SHIPPED kernel verbatim into a
  vm sandbox (data modules loaded, seeded LCG Math.random) and drives it — 29
  vectors PASS (rotation gate, aim reset, retaliation+warn, preferred stickiness,
  damage_priority both ways, chase+guard-return, corpse die_time purge, burst 3
  shells, stop freeze, walking-shot-on-move, building attack through gate).
- accuracy.test.js (13 vectors) + data-model.test.js (265) regression PASS;
  node --check clean; index.html bumped to v=18.

Stage Summary:
- Phase 3 live as v=18: unit behavior is an explicit native-shaped state machine,
  deterministically covered against the shipped code. Known gaps: server-side path
  micro-management (wait_for_moving/forced) and min-range data not reconstructed
  (documented); seeded PRNG + state hashes remain backlog. Next per plan: Phase 4
  command system, or determinism gaps.

Live QA (Pages v=18, agent-browser fresh session):
- FSM fields present on live units; rotate sample 10 (infantry). commandStop via
  sim + S hotkey through the real keyboard path both halt correctly (idle,
  path empty, guard in place); commandAttack sets sticky objPreferred.
- Retaliation + WARNED_BY_NEARBY_FRIENDS verified live (victim + nearby friend
  target the attacker). Combat: facing turned, engagement + wounds observed.
- Corpse lifecycle: created on death with dieT 0.9 (infantry), purged after
  die_time; roster removal unchanged (6->5). Zero page errors (only the
  pre-existing GLTF skinning warning). 16:9 desktop + iPhone 14 layouts intact.
Task: the 10 remaining hero prefabs (Wasp, Mole, Leviaphan, Solaris, Beholder, Gatling, Psitank, Salamander, Atlas, Coiltank)

Work Log:
- Roster ground truth: HeroTypes enum (dump.cs:247448) = 12 heroes; Task 16 shipped Cerber/Seraphim.
- Blocking fact established: hero chassis prefabs are NOT in the package (full magic-scan of all 5,502 bin/Data files = null-pad + FSB5 only; scene-graph scan of all 10 bundles = hero VFX + 4 hero model UV textures only) — model content is server-delivered; documented per the standing roster-pass conclusion.
- Authentic card art extracted from the curated zip: hero_card_ico_{wasp,gatling,leviaphan,beholder,psitank,solaris,salamander,coiltank} + ico_mech_heroes_f1 (Atlas) — 10 new docs/assets/card-hero-*.png. Naming drift recorded (enum Atlas=11 vs asset f1_hero_atlant); codomash (no enum slot) recorded for a future pass.
- Wired 10 hero defs (native anchors in descs), HERO_ORDER=12, faction-filtered build bar, PRODUCER_OF→herobld, chassis-faithful stand-in UNIT_MODEL entries (solaris swapTint), ability hooks natively anchored: Atlas immortality (57), Coiltank frontal (56) + chain (55), Psitank slow (52/53), Gatling spin-up (54), Solaris chain, Salamander burn, Mole minelaying (MineStatsFactory mirror); AI builds Hero Building + f2 heroes.
- QA (headless, 0 page errors): 12/12 heroes spawn+render; slot rule enforced; ability unit-tests exact (slow/burn/immortal/frontal 70-vs-100/chain 18=40x0.45/aircraft-skip correct); mines laid+armed; gatling heat live; 6 f1 hero cards with authentic art in bar. window.__aow3sim QA hook added. Rebased over the concurrent Phase 2 data-model extraction (5680dc2): hero defs/heroOrder/producers/natives ported into docs/data/{units,factions,index}.js, weapons w_* added, fixture regenerated via reverse/tools/gen_data_fixture.js (28 units), data-model test whitelisted the natively-anchored hero ability fields — 379/379 assertions pass. Cache-buster v=18 (v=17 taken by Phase 2).

Stage Summary:
- Full 12-hero roster live (v=18) in the Phase 2 data-module structure; only the chassis GLBs remain stand-ins (documented swap points in UNIT_MODEL). Note: reverse/notes/hero-prefabs-10-remaining.md.
---
Task ID: 20
Agent: Super Z (main)
Task: Phase 4 — unified command system + determinism gaps (seeded PRNG / state hashes), v=19 (shipped v=20 after colliding with the concurrent hero-roster pass v=19)

Work Log:
- RE: dump.cs AIComm* protocol (com.geargames.aow.entities.battle.aicomm) — 45
  command messages (UnitsMove/UnitsStop/Squad/BuyUnit/BuSet/AircraftRebase/CRC*)
  with tick-stamped ctor (senderTick+side); AICommandLogWriter/Reader = native
  command journal; CRCRequest/Verify/SyncTest = native state-hash desync
  detection -> reverse/notes/command-system-native-analysis.md (mapping table).
- Kernel: Commands class (issue() routes select/move/attack/stop/capture/build/
  produce/special/cancel; validation BEFORE journal; 512-entry tick-stamped ring
  per issuer); mulberry32 + fnv1a helpers; Sim.seed/rngState/hashes fields;
  Sim.rng() (inline mulberry32) replaces all 6 sim Math.random draws;
  stateString()/hashState() (FNV-1a over quantized state; floats/booms/pops
  excluded); 1 Hz hash journal in step() (600-entry ring).
- AI: own Commands instance + own seeded rng; produce/capture/escort/defense/
  wave all via command layer (direct u.order mutations removed, incl. dead
  threat[...] line); AI rng = mulberry32(seed ^ imul(owner, 0x9E3779B9)).
- Input: mouse/keyboard/touch/minimap adapters emit typed commands (orderAt
  gained ctrl+right-click attack-move; minimap right-click = move command;
  card clicks = produce; build placement = build command; S/Escape via layer);
  #seed=N URL override; seed logged; __aow3 probe exposes cmd + ai.
- Tests: commands-determinism.test.js 50/50 PASS (same-seed hash equality incl.
  journal, seed divergence, single-command divergence, routing/selection/journal
  semantics, seeded combat duel, AI seed derivation); regressions PASS: unit-fsm
  29, accuracy 13, data-model 265; node --check clean; index.html v=19.
- Docs: AGENTS.md §32 updated (Phase 4 + determinism DONE; remaining Phase D:
  replay playback harness, lockstep networking).

Stage Summary:
- Phase 4 + determinism live (v=19 -> v=20 cache-bust after collision): one authoritative command layer fed by
  every input source (plan's Phase 4 architecture diagram realized), fully
  seeded sim+AI randomness, state hashing + command journals as Phase D
  groundwork. Next per plan: Phase 5 combat reconstruction gaps (min-range,
  patrol/hold tasks) or replay playback harness.

Live QA (Pages v=22, agent-browser fresh sessions):
- Command layer through real input paths: click-select/drag-box (select journal),
  right-click move (order set + journal), ctrl+right-click attack-move (order
  attackMove + journal), S stop via keyboard (idle + guard + journal),
  minimap right-click move (journal), build card -> click (tryPlace + journal,
  correct HQ-proximity rejection at 3.2 tiles), produce card -> queue + funds
  deduct (correct rejection: no producer / producer still under construction),
  AI's own Commands instance live (produce/capture entries logged, hero pass
  AI intact: enemy barracks+power built).
- Determinism LIVE: two independent loads with #seed=424242 -> identical h0
  (885305a6) AND h1 (efd54a2b); hash journal advancing 1 Hz; seed logged.
- QA fixes shipped: setPointerCapture guarded (stale pointer ids were killing
  the whole input path -> NotFoundError); S hotkey now works while a UI button
  holds focus (v=21, v=22).
- Zero page errors on all sessions (desktop 16:9 + iPhone 14); mobile HUD/cards
  intact. Regressions: unit-fsm 29, accuracy 13, data-model 379 PASS;
  node --check clean. main = 1eb0572.

---
Task ID: 21
Agent: Super Z (main)
Task: RE — WeaponType combat-surface completion (reverse/AGENTS.md §13 remaining rows: hitBonus, target restrictions/AA, explosionDecr falloff role, critical/special effects)

Work Log:
- Re-read all updated docs first (estat-stat-models.md incl. §6.7 MinePrice, damage-pipeline-native-analysis.md, vfx-asset-prefix-check.md CONFIRMED(HIGH), armor/accuracy/state-machines/command notes, reverse/AGENTS.md §13, FileUpload audit report — all 4 ranked investigations CLOSED); identified §13 as the standing open surface.
- Re-fetched LFS chain fresh: XAPK 270,599,286B sha256 1a41e033… (== LFS OID) → libil2cpp.so 164,646,104B sha256 8ace05bb… (== armor note §1); dump.cs sha256 0050e67d… (== extraction log).
- dump.cs recon: full WeaponType entity table (TDI 11545) — hit_bonus is 0x48 NOT 0x24; 0x24 = `type` (short) = shell-type id; EWeaponTarget enum (None/Bomber/Fighter/Helicopter/Marine/Submarine/LandForce/Infantry); WeaponTarget : IWeaponTarget {Type, Hint, NegativeHint, GetState}; 7 compiled predicates b__0..b__6; no crit system (only DebugLevel.Critical); hit_bonus absent from WEAPON_* serialization schema.
- Native (3 new tools, all committed): weapon_type_surface_native_analysis.py (getter bodies + CreateTargets + lambdas + WeaponTarget ctors + whole-file BL xref, 150,721-method index / 2,982,071 BL — totals reproduce); weapon_type_followup_scan.py (.rela.dyn 1,158,475 R_AARCH64_RELATIVE, slot table 0x96ef918..0x948 runtime-filled; HasAiming body; MineStatsFactory.CreateTargets bool-state list); weapon_type_aa_mask_writer_scan.py (strict ADRP+LDR slot scan → Unit..cctor writer).
- Findings: aiming (0x8B) = 6-bit target-class mask (1 ground, 2 heli, 4 marine, 8 fighter, 0x10 bomber, 0x20 submarine); HasAiming = (bit & (int)statValue) != 0 through the stat-modification pipeline; get_AntiAirOnly = (Unit.OCCUPATION_FOR_AIR & aiming) == aiming; Unit..cctor (0x45b1e88) natively writes OCCUPATION_FOR_AURA=0x05 / OCCUPATION_FOR_MINES=0x25 (non-air) / OCCUPATION_FOR_AIR=0x1A (air) — three-way corroboration of the bit taxonomy; canBombard = type&1 (odd shell types 21/23/27/31 = bombard variants); accuracy dispatch {10,40}/27 = SHELL_TYPE_BULLET/FIRE vs NUCLEAR_MISSILE (resolves accuracy-note APPROXIMATION); mines: air targets hard-false with hint=-1, ground/sea states from balance data; hit_bonus client-inert (0 BL sites, not serialized client-side); explosion_decr has no damage-falloff consumer (accuracy scatter only — §13 row closed); no crit system; WeaponType.init callers = BuildingLevelType.init / UnitStateType.init / UnitType.abilityWeaponInit.
- reverse/notes/weapon-type-surface-native-analysis.md written (Phase 26 format, CONFIRMED-native/HIGH classifications, honesty notes on the runtime-filled delegate slots and the source-order lambda pairing); reverse/AGENTS.md §13 all rows struck with pointers; combat-stats.md §5 corrected + new §8.

Stage Summary:
- reverse/AGENTS.md §13 combat checklist is now fully closed (all 6 rows recovered or closed with native evidence). The combat knowledge base: damage triad + 0.9/0.1 curve (armor note), accuracy curves (accuracy note), pipeline end-to-end (damage-pipeline note), target-class masks + AA + shell-type semantics (this pass). Balance values remain server-side (standing). No game.js change required — doc-only findings; implementation guidance recorded in the note §5.
---
Task ID: 22
Agent: Super Z (main)
Task: Phase 5 gaps (patrol/garrison missions, weapon minimum range) + Phase D replay playback harness (consumes seed + log), v=23

Work Log:
- RE (dump.cs 6.9.18): WEAPON_DISTANCE_MIN="distance_min" (dump.cs:17303);
  WeaponTypeMapEditorConfig m_distance/0x28 + m_distanceMin/0x2C;
  ClientUnitTaskType enum (dump.cs:271209: Patrol=1, Defend=2, HoldPosition=3,
  LoadOnTransport=9, UnloadFromTransport=10); ClientBuildingTypeEditor.Bunker=14
  (dump.cs:266093); ClientBunkerWeapon crew-served muzzles (dump.cs:275667);
  patrol voice taxonomy (ItemInfPatrol=10 ... per-hero). Note written:
  reverse/notes/phase5-missions-minrange.md.
- minRange (data): w_typhoon minRange 5 (range 15), w_fortress minRange 4
  (range 14), values gameplay-tuned (native balance server-delivered); anchor
  comments on each weapon; minRange added to WEAPON_FIELD_MAP in stats.js as
  m_distanceMin/0x2C; fixture regenerated (28 units).
- minRange (kernel): findTarget skips dead-zone targets; engaged branch holds
  ground (path cleared, no release) when d < minRange; burst shells re-check
  the window; building acquisition/fire gates use d ± b.radius symmetric with
  the unit gate; both walkingShot call sites re-check. Non-artillery weapons
  unaffected (minRange undefined -> 0).
- Patrol (kernel): commandPatrol(ids,x,y) — anchor A at issue position, far
  point B; order {kind:"patrol",x,y,ax,ay,back}; legs flip at arrival; mid-leg
  repath uses the CURRENT leg target; attackMove semantics (acquisition in
  updateTargeting + building-target branch, aggro warn-joins include patrollers).
- Garrison (kernel): commandGarrison (infantry only, friendly+built bunker,
  GARRISON_CAP=3), order {kind:"garrison",depotId}; entering sets u.garrison ->
  inert (updateUnits skip), untargetable (findTarget + target/preferred
  validation), no vision, renderer-hidden (syncUnits gate), unselectable
  (box+click); crew-served bunker weapon fires only while crewed; exits:
  commandUngarrison, auto-unload on move/attack/capture, bunker death scrambles
  crew via freeTileNear; non-infantry/enemy/unbuilt bunkers rejected.
- Phase D replay harness (kernel): Commands gains uncapped `full` journal +
  tick/seq stamping (shared sim.cmdSeq); Replay class — capture() = seed + full
  journals (player+AI) + terrain fingerprint (FRESH-constructor probe grid, not
  capture-time) + 1 Hz hash journal + finalHash/finalTick; play() rebuilds from
  seed, re-feeds commands at recorded tick boundaries sorted by (tick, seq),
  verifies hashes per journal mark + final -> divergences localized to a tick.
  Live probe __aow3Replay.{capture,save,run} (save downloads JSON);
  Replay exposed on __aow3().
- Input wiring: P arms patrol (hint text; right-click/minimap right-click issue
  patrol; Escape disarms); right-click own bunker with infantry = garrison;
  V = ungarrison when garrisoned units selected, else hero land/depart.
- stateString U-line extended (garrison, patrol ax/ay/back) — hash format
  changed; all tests compare relative hashes (no literal vectors) — safe.
- Tests: NEW phase5.test.js 47/47 (min-range gates/acquisition/hold, patrol
  oscillation+engagement+resume+journal, garrison enter/protect/crew-fire/
  silence-when-empty/exits/capacity/death/rejections, cross-feature
  determinism); NEW replay.test.js 34/34 (bit-exact reproduction, baseline,
  cross-issuer ordering, tamper detection seed/drop/alter/terrain, 540-command
  journal vs 512 ring, live-shaped build+patrol+garrison run, JSON round-trip).
  Regressions: unit-fsm 29, accuracy 13, data-model 379, commands-determinism
  50 — ALL PASS. node --check clean; index.html bumped v=23.
- Harness bug found by tests and fixed: terrain fingerprint must come from a
  fresh constructor probe sim (capture-time grid embeds player-built structures).
- Live QA (v=23) found a patrol defect: a mid-route chase drags u.dest to the
  chase point; on target death the stale dest faked arrivals and the leg repath
  could find zero path at the leg target -> patrol silently cancelled to idle.
  FIX: patrol orders re-sync dest/path to the CURRENT leg target every tick
  (patrol-only guard; move/attackMove behavior untouched). 6 regression vectors
  added (chase-interruption) -> phase5 53/53. Shipped as v=24.
- Live replay end-to-end then DIVERGED at tick 60 (headless repro: AI barracks
  B12 in live state, absent in replay; player funds -400). ROOT CAUSE: AI
  maybeBuild called sim.tryPlace DIRECTLY — unjournaled sim mutation outside
  the command layer (Phase 4 QA had only verified produce/capture). FIX: routed
  through this.cmd.issue({type:'build'}) — the ONLY unjournaled AI mutation
  found (full AI class scan clean). replay.test.js now extracts the REAL AI
  class alongside the kernel and runs the shipped game-loop shape (sim.step +
  ai.step + player commands) end-to-end: capture -> play -> zero divergences,
  7 new vectors -> replay 41/41. Shipped as v=25. Desync lesson recorded:
  every sim mutation must be reachable ONLY through Commands.issue.
- Deeper live replay (584 ticks, attack command included) exposed a SECOND
  harness edge: a command recorded at exactly finalTick was dropped by play()
  (loop exits at sim.tick === finalTick before flushing it) while the capture-
  time finalHash already included its effect -> final-hash mismatch with ALL
  1 Hz marks clean. FIX: boundary flush of commands with tick <= sim.tick after
  the loop, before the final comparison. Regression vector added -> replay 45/45.
  Shipped as v=26. Live re-verified: divergences [], hashMatch true.

Live QA (Pages v=26, agent-browser fresh sessions, seed 231123):
- Phase 5 live: patrol order routes anchor<->far (order.kind patrol, legs flip);
  typhoon dead zone (d=3 < 5) -> 0 projectiles + hold, fires once the target
  transits the legal band; garrison: infantry enters bunker (garrison set,
  inert, renderer view hidden), crewed bunker fires (120 -> 52 hp), empty
  bunker silent (kernel-verified), commandUngarrison exits to a free tile.
- Replay harness LIVE end-to-end: __aow3Replay.capture() -> run() reproduces
  the battle bit-exactly (7/7 commands incl. AI build/build/capture + a
  boundary-tick attack, zero divergences, finalHash match). P hotkey arms
  patrol via the real keyboard path (prodhint), Escape disarms. Two real bugs
  + one harness gap were found BY the harness during QA and fixed (v=24
  patrol dest-resync, v=25 AI unjournaled build, v=26 boundary flush).
- Zero page errors on desktop 16:9 + iPhone 14 emulation; screenshots saved.
  Regressions at ship time: phase5 53, replay 45, unit-fsm 29, accuracy 13,
  data-model 379, commands-determinism 50. main = c67f72f (v=26).

Stage Summary:
- v=23: Phase 5 combat-reconstruction gaps closed (minRange/patrol/garrison,
  all natively anchored, tuned values documented) + Phase D replay playback
  harness live (seed + full command journal = replay, hash-verified, tamper-
  detected). Remaining Phase D: lockstep networking only.

---

Task ID: 23
Agent: Super Z (main)
Task: Phase 5 combat gaps — hold position (ClientUnitTaskType.HoldPosition = 3): natively anchored reconstruction, tests, note update

Work Log:
- Read updated docs at 504a48d: v=23 closed minRange/patrol/garrison + Phase D replay harness; v=24 patrol QA fix. phase5-missions-minrange.md explicitly deferred "Defend/HoldPosition/Bombard task nuances" — hold was the open half of the Phase 5 gap.
- Native evidence (dump.cs 6.9.18, sha256 0050e67d…): HoldPosition = task 3 (271217) AND state spec 65536 (271185) — a member of the All mask 0x5FFFFFFF while one-shot Stop = 2^30 is excluded; instant non-targeting entry (GUIBattleActionUnitSpecHoldPosition is a plain IKeyboardHotkeyButton 309542, SendSelectedUnitsHoldPosition() takes no cell 337757); sim command AICommUnitsHoldPosition : AIComm carries int[] ids against Battle (433481); hotkey UnitSpecHoldPosition = 24 (255733); VoiceType.HoldPosition = 32 between StopAction = 31 and Patrol = 33 (83230); per-chassis + 12-hero voices (81502–82094); isSelectAllHoldPosition (254040); task HUD sprite (322939); UIBattleStatistics.HoldPositionCount (252817/253119); tutorial condition HoldPosition = 9 (311609).
- Kernel: commandHold(ids) — order {kind:"hold"} with NO x/y (movement branch keys on order.x/y and must stay dormant), guard anchored, path/dest cleared, HOLD float ack; garrisoned units reject. FSM: hold-aware stand branches for unit targets (fire in [minRange, range], otherwise clear path + hull-track, never moveToward) and the building branch; acquisition gate (updateTargeting), building gate and aggro warn-join all accept "hold".
- Invariant fix found by tests: a held minRange unit shot from inside its dead zone locked the unfireable attacker through aggro and starved every valid target. joins() now refuses dead-zone attackers (findTarget's "no dead-zone lock" rule extended to warn-join; explicit commandAttack stays sticky = objPreferred player order).
- Tests: phase5.test.js 53 -> 93 vectors (hold entry/no-x-y, window fire without movement, acquired-out-of-window stand+hull-track, window re-entry, stop release, window-only retaliation, dead-zone aggro refusal + ranged engagement, building gate, melee hero contact/no-chase, warn-join without movement, patrol/move interplay, hold-in-hash determinism). Test-geometry lessons: idle foes walk into the window (pin with commandHold), acquire band is eff-boosted (d=9 acquires at range 6.5), projectile weapons set lastHitBy WITHOUT aggro (warn-join needs an instant weapon like w_ilight, projectileSpeed 0), addBuilding returns void.
- Regressions: unit-fsm 29, accuracy 13, data-model 379, commands-determinism 50, replay 34 — ALL PASS. node --check clean; index.html bumped v=25.
- Note updated: reverse/notes/phase5-missions-minrange.md gains a "Hold position" section (native surface + reconstruction + remaining unknowns); coverage counts refreshed.

Stage Summary:
- v=25: Phase 5 combat gap "hold" closed — held units acquire + fire strictly inside [minRange, range] and never pursue; melee/garrison/minRange/aggro interplay all natively anchored and hash-covered. Remaining Phase 5 documented unknowns: Defend/Bombard task variants, DontShoot/TakePositions, aircraft-hold orbit. Remaining Phase D: lockstep networking only.

---
Task ID: 24
Agent: Super Z (main)
Task: Phase 5 remaining documented unknowns — Defend / Bombard / DontShoot / TakePositions / aircraft-hold orbit (native analysis + reconstruction + tests)

Work Log:
- Read updated docs at e8dff1f; the documented Phase 5 unknown list (phase5-missions-minrange.md v=25 + worklog Task 23): Defend/Bombard task variants, DontShoot/TakePositions, aircraft-hold orbit.
- Native analysis (dump.cs 6.9.18 sha256 0050e67d…): ROSSETTA = GAICommandSpecMode (410916) — one sim command with act byte {STOP=0, HOLD=1, SIEGE_TO=2, SIEGE_FROM=3, HIDE=4, DEFEND=5, RESET_SPEED=6, DONT_SHOOT=7}; server mirrors UnitTaskType (395395) + UnitStateSpecType SPEC_* (394943) identical to client enums. Network surface: only Bombard/Hold/Load/Move/Patrol/Psionic/Spec/Stop/Unload have ST serializers (341228-341432) — Defend/DontShoot/TakePositions ride generic AICommUnitsSpec {ids, spec} (433780). Defend: SendUnitsDefend no cell (337730/337733), patrol_defend second route (393338), hotkey 33 (255741), tutorial 1. Bombard: SendUnitsBombard(units, Point2i) (337736) + AICommUnitsBombard {ids, short x, short y} (433431), WeaponType.canBombard VA 0x45B6268 (type&1), GetBombardUnitsOnly (81118), UnitBombardRadius (283999), sim denial log literal. DontShoot/CanShoot: paired specs 1048576/2097152 (271188/271189), ACT 7, hotkeys 26/32, tutorial 12. TakePositions: spec 4194304, hotkey 25 (255733), layout tooltip (RU) "after all units are placed" + ShowString(unitsCount) (304597), PointTakePositionAction (254946), Unit.TakePosition Coordinate (393544). Voices: no dedicated Defend/DontShoot/TakePositions — generic ToSpecMode/FromSpecMode = 101/102 (83222). Aircraft: ItemAviaAttackHoldPosition = 152 (81645), flight_radius UnitStateType 0x7C, occupations AIR_FIGHTER/BOMBER.
- Native disassembly: reverse/tools/specmode_native_analysis.py (capstone, ELF PT_LOAD mapping, string-literal annotation) -> reverse/evidence/combat/specmode-native.txt (2831 lines); GAICommandSpecMode.execute (VA 0x45F61E0) iterates units, loads act [this+0x30], ACT_DEFEND arm behind a dedicated Battle-virtual gate (0x45F6358-0x45F6384). libil2cpp.so sha256 8ace05bb….
- Kernel (v=28): commandDefend (anchor + DEFEND_TETHER=4 tethered pursuit, break-off drops unfireable locks beyond leash+2 grace, re-anchor persists), commandBombard (artillery-family = minRange>0 only; point-impact splash shells, no target lock; [minRange, range] band), commandDontShoot/commandCanShoot (fireHold gates shoot/fireShell bursts/meleeStrike/shootBuilding; explicit attack does NOT bypass), commandTakePositions (per-index spots, arrival -> hold at the taken spot), fireBombard (point-impact round via the existing splash branch), stateString U-line + fireHold bit; Commands cases defend/bombard/dontshoot/canshoot/takepos; controls H/D/X/T/F/P/V (D = pan conflict tolerated like S), Escape disarms; aircraft hold/defend orbit in the renderer (visual only, hash untouched).
- Tests: phase5.test.js 93 -> 128 vectors (defend anchor/engage/tether-pinned-geometry/break-off/lock-drop/re-anchor/release; bombard filter/point-shells/area-damage/band/dead-zone/release; fire-discipline track/no-fire/restore/melee+building gating; takepos per-unit spots/arrival-hold/no-pursuit; determinism incl. fireHold hash). Test-geometry lessons: idle foes walk back into the band (pin with commandHold); findTarget threshold is eff < range+2.5 (a 10-tile foe is NOT acquired at range 6.5 — use 9); stateString joins with '|', not '\n'.
- Regressions: unit-fsm 29, accuracy 13, data-model 379, commands-determinism 50, replay 45 — ALL PASS. node --check clean; index.html v=28.
- Note updated: phase5-missions-minrange.md gains the v=28 section (stance dispatch + 4 reconstructions + aircraft orbit + remaining unknowns incl. multipoint-route patrol erratum) and an All-mask/Stop bit erratum fix (0x5FFFFFFF HAS bit 30 set — the v=25 exclusion claim was arithmetically wrong; semantics unchanged). AGENTS.md Phase 5 record extended.

Stage Summary:
- v=28: all remaining documented Phase 5 unknowns closed — Defend (tethered anchored stance), Bombard (targeted point shelling, artillery only), DontShoot/CanShoot (fire discipline toggle), TakePositions (per-unit placement -> hold), aircraft-hold orbit (visual). Remaining Phase 5 adjacents (siege/hide/same-speed acts, bombard duration, defend leash value) documented as unknowns in the note. Remaining Phase D: lockstep networking only.

---
Task ID: 25
Agent: Super Z (main)
Task: Lockstep networking (2P) — per-tick command exchange over the Phase 4 determinism stack (the last open Phase D item)

Work Log:
- Divergence recovery: this line of work was built on a stale base (v=13). Remote had meanwhile landed Phases 2-5 + determinism + replay harness through v=28 (8ab83ed..e15f301), including its own mulberry32 PRNG, hashState/stateString, Commands.issue() journals and the Replay class — the same scope this session had prototype-built (preserved on local branch backup/lockstep-v14, not merged; its BroadcastChannel/PeerJS/session design carried over). Reset to origin/main and rebuilt lockstep on the remote architecture.
- Commands gained an outbound hook: issue() forwards LOCKSTEP_NET_TYPES (move/patrol/garrison/ungarrison/attack/stop/hold/defend/bombard/dontshoot/canshoot/takepos/capture/build/produce/special) to the session scheduler instead of applying locally; select/cancel stay issuer-local; execute() + applyRemote() preserve the (tick, seq) journal semantics so MP command journals remain replay-faithful.
- LockstepSession: input delay 3 ticks; scheduleTick = max(tick+delay, sentUpTo+1) so a command never lands in an already-published packet; per-tick input packets from both slots; ready-gated accumulation (network stall = freeze, never divergence); checkpoint-20 hashState() checksum exchange with desync callback; buffer/hash-map pruning; reset() for rematch over a live transport; close() sends bye.
- Transports: BroadcastTransport (BroadcastChannel, same-browser two tabs, zero infra) and PeerTransport (PeerJS 1.5.4 CDN lazy-load, public PeerServer signaling only, P2P reliable+ordered DataChannel, 4-char room codes "AOW3LS-<CODE>").
- startGame(opts {seed, lockstep, slot}) replaces start(): #seed= override applies to solo only; ai=null and cmd.outbound wired in lockstep; sim.viewSlot + Net.mySlot drive slot-aware selection (owner filters), orderAt targeting, produce/build owners, HUD players/cp/queue, hero card gating, fog (updateFog), minimap (vis + unit colors), syncUnits visibility/rank/HP, selRing colors, HQ camera + home button; faction-color sites (b.owner === 1 tinting) intentionally untouched (global, not view-dependent).
- MP menu UI (multiplayer panel: transport select, HOST, code input, JOIN, status), START SKIRMISH -> START MULTIPLAYER when a peer hellos, guest auto-launch on start packet (menu hides, P2 GUEST badge), mp-live badge (green/yellow stall/red desync + DESYNC banner), rematch re-uses the session (host relaunches with a fresh seed, guest waits), protocol version gate on hello/start.
- Loop: lockstep branch pumps the session, applies scheduled commands for tick T, steps, then afterStep checkpoint; guard accepts ai==null in lockstep; stall dot reflects ready() state.
- Tests: replay.test.js 45/45 and phase5.test.js 128/128 PASS on the refactored Commands (outbound defaults null -> issue()==execute()).
- QA (localhost + live): solo 600-tick in-page run -> __aow3Replay.capture/run zero divergences; 2-tab BroadcastChannel match — host/join/start handshake, guest auto-launch slot 2, guest cmd.issue move replicated on host sim (attackMove@60), both peers drove to checkpoint 20 with IDENTICAL hash b6e850a3, zero desync flags; live site v=29 smoke: MP panel renders, solo starts, no page errors.

Stage Summary:
- v=29 (a41cd9f): lockstep networking live — the Phase D plan is now fully closed (determinism, replay harness, lockstep multiplayer). Known limits (documented): 2 players only, no join-in-progress/spectator, no late-catchup save sync, BC = same-browser only, PeerJS depends on the public broker; background-tab rAF throttling stalls a peer's pump until refocused (correct freeze, not divergence).

---
Task ID: 26
Agent: Super Z (main)
Task: Verify the queued batch (1) CreateDamageForMediumArmor native analysis, (2) MinePrice/71 xref, (3) VFX taxonomy -> tribute FX naming — all landed at 0e4c4b2; post-refactor integrity re-check

Work Log:
- Re-verified every deliverable of the 0e4c4b2 batch on main @ 80e02d9 after the v=17..v=29 refactor wave:
  (1) reverse/notes/damage-pipeline-native-analysis.md (audit item #2 CLOSED, CONFIRMED native; 6-factory table, ctor layout, Calculate/CalculateProgress, mine leg, sole-consumer xref) + reverse/evidence/damage-pipeline/damage-pipeline-native.txt + pipeline-xref-followup.txt — present;
  (2) estat-stat-models.md §6.7 (MinePrice/71 = MaxStatValueProvider tier-cap key consumed solely by MineCostStat.CalculateProgress, mov w1,#0x47 @0x80e8f08) + evidence mineprice71-xref.txt (B2/B3 empty = zero competing sites) + mine-capkey-sweep.txt (six cap keys 61/62/63/64/67/71) — present; TSV MineCostStat row updated;
  (3) vfx-asset-prefix-check.md (CONFIRMED HIGH; 41 bul_ / 18 fire_ / 0 literal expl_, boom_expl* taxonomy) + docs/game.js AOW3_VFX_TAXONOMY registry (line ~35421, window.__vfxTaxonomy) + emitter tags (muzzle fire_*, tracer bul_/bul_rocket_, explosion boom_expl{1|3|5}_s{0..6}_{ground|water}, impact_ pops) — all survived the v=17 data-model refactor and v=28/29 Phase-5/lockstep edits intact.
- node --check on current game.js (v=29, 38,663 lines): clean.
- No code or note changes were needed; this entry records the verification only.

Stage Summary:
- The three queued audit items are confirmed COMPLETE and pushed (commit 0e4c4b2 + later refactor-proof re-verification). FileUpload audit ranked list: items #1-#4 all CLOSED, #5 remains blocked on a 6.5.22 binary.

---
Task ID: 27
Agent: Super Z (main)
Task: User report "models are rotated perpendicular to the ground. trees and stuff" — diagnose and fix real-map decor orientation

Work Log:
- Reproduced on live (v=29): screenshots showed trees/palms lying flat as foliage carpets; probe of scatter instance quats returned raw map.json values incl. pure (0.71,0,0,0.71) = +90degX.
- Root cause: map.json placement quats are authored-space (Unity, Z-up source art) — every quat carries the +90degX Z-up->Y-up correction (verified: post-multiplying by inv(+90X) reduces all samples to pure yaw). The decor GLB conversion baked that same correction into root nodes for a SUBSET of files (stats over 391 unique files: tree 34/34, palm 41/41, bush 66/69, prop 67/71, rock 23/35, grass 20/26, ground 0/115). The template bake step (geo.applyMatrix4(mesh.matrixWorld)) already absorbed the root rotation into geometry, so applyRealMap() applying the raw placement quat double-rotated every baked template by 90deg — trees perpendicular to the ground. Un-baked templates (all ground decals) NEED the quat's +90X to lie flat; a blanket strip would have stood ground decals vertically.
- Fix (docs/game.js, +13/-2): capture first mesh's matrixWorld rotation during template bake -> template.qfix = inverse quaternion; in applyRealMap() post-multiply it out of each placement quat (q_final = q_map * qfix). Per-template correction handles the mixed bake population; positions/scales untouched. Fallback DecorScatter (no map.json) unaffected.
- QA (local smoke, then live): 6024 instances / 359 meshes — 264 upright (Y-up geom), 93 flat ground decals (Z-up geom, normal up), 0 hard-90 tip-overs, 2 borderline ~33deg (legitimate leaning props/bent trees); before/after screenshots of the same dense cluster show standing canopies with volume + shadows vs flat carpets; unchanged orange/blue slab props (un-baked, raw quat kept) match previous renders — correct by construction. Suites: replay 45/45, phase5 128/128, commands-determinism 50/50, unit-fsm all, data-model 379/379. node --check OK. Console: only pre-existing GLTFLoader skinning warnings. v=29 -> v=30.

Stage Summary:
- Decor orientation restored to native: baked-template quats stripped of the double Z-up correction, un-baked (ground decals) untouched — one unified per-template mechanism (t.qfix), zero data regeneration needed for 813 decor GLBs / 6371 placements.
- Commit 6d1ed03 (code, v=30) + this worklog commit; push + live verify pending at time of writing.

---
Task ID: 28
Agent: Super Z (main)
Task: Phase 5 adjacents natively anchored + reconstructed (siege/hide/reset-speed acts, bombard duration, defend anchor) + MaxStatValueProvider tier thresholds extracted (v=30/31)

Work Log:
- Rebuilt the native workspace from LFS (XAPK 1a41e033… -> libil2cpp.so 8ace05bb…; dump.cs 0050e67d…) and decoded GAICommandSpecMode.execute() arms beyond v=28: ACT_SIEGE_TO/FROM (2/3) = one arm gated on (type.specs & (ToSiege|ToShield|ToFog)) / (FromSiege|FromShield|FromFog) — the Seraphim-family triple transform, task cleared to 0; ACT_HIDE (4) = spec-bit-17 capability + drop target (set_Obj(null)) + clear forced + caravan + $Hi(task=4); ACT_RESET_SPEED (6) = $ii(Battle,Unit,true) cancelling the SameSpeed march (SameSpeed {speed, coord} @Unit+0x260, Battle.$HL coordinator located). vtable slots resolved by call-shape + body disasm (dump.cs Slot annotations drift by 2 in the 249-256 region — get_X/get_Y verified via the defend-arm Coordinate(x*100, y*100) ctor).
- Bombard duration: AICommUnitsBombard.$CMA is a 37-state jump-table machine with an LCG scatter (0x852906a7/0x9fe0597f) — NO duration literal; task_until_tick (0x104) written at only 6 sites, 5 in BattleAct.$uA (battle-finish freeze). "Shell until released" model stands.
- Defend anchor CONFIRMED: execute() act-5 arm builds a 1-point PatrolRoute at Coordinate(unit.x*100, unit.y*100) and stores it via set_PatrolDefend ([klass+0xD38]) — patrol_defend//0x158 mechanism exact; chase/leash lives in UnitAct.$Pg (0x483C244, 99 route sites) + $sH; leash value not a literal (server-side); act-5 gate = battle.$gm() flags int at [Battle+0x80].
- MaxStatValueProvider tier thresholds EXTRACTED (ctor 0x7CC0C00 literal parse, tool extract_maxstat_tiers.py -> evidence estat/estat-tiers.txt): 72/78 EStats registered — Health 8000/25000/45000, armor triad 80/530, WeaponArmor{L,M,H} 300/4000/20000, SuperWeaponArmor 300/4000/55000, MinePrice/71 cap = 30; only 60/66/70 unregistered (66 capped via 71 per §6.7). CONFIRMED (native literal read-out).
- Tribute reconstruction (v=30/31): commandHide(ids, x, y) — infantry-only targeted ambush order (G arm + right-click; native hotkey 39): walk to spot, hide (u.hiding), untargetable beyond HIDE_DETECT=2.5 (VISIBLE_HIDDEN->DETECTED analog), fires from cover, firing reveals (shoot/fireShell/meleeStrike/shootBuilding), any non-hide order/stop releases, no aggro-join while hiding, U-line hash bit (hiding before fireHold), LOCKSTEP_NET_TYPES + Commands "hide" case. node --check clean.
- Tests: phase5.test.js 128 -> 146 vectors (capability gate, walk+entry, detect gate far/near, fire-from-cover reveal, release paths, re-hide, determinism + hash coverage). Regressions: replay 45/45, commands-determinism 50/50, unit-fsm all, data-model 379, accuracy all — PASS. index.html v=31.
- Notes: phase5-missions-minrange.md gains the v=30 section (acts decode + bombard duration + defend anchor + hide reconstruction + refreshed unknowns); units/estat-stat-models.md gains §7 (full tier table) + Unknown closed. New tools: extract_maxstat_tiers.py, phase5_adjacent_native_analysis.py, field_access_scan.py; evidence: estat/estat-tiers.txt, combat/phase5-adjacent-native.txt.

Stage Summary:
- v=31: all documented Phase 5 adjacents except the $Pg micro-logic/SameSpeed coordinator/TakePositions formation are now natively anchored; hide is implemented and hash-covered; the stat-cap table (task b) is a complete native literal extraction. FileUpload audit list stays closed; open surfaces are now gameplay-feature-sized (SameSpeed march, transform units) rather than knowledge gaps.

---
Task ID: 29
Agent: Super Z (main)
Task: Feature-sized builds — land the extracted native knowledge as three discrete playable builds: (1) MaxStatValueProvider tier caps, (2) SameSpeed march, (3) multi-point patrol

Work Log:
- Build 1 (v=32, dcb393a) — native stat tier caps: the 72-entry StatInfo {BaseMax, FirstMax?, MegaMax?} table (estat-tiers.txt, ctor VA 0x7CC0C00) ported VERBATIM into the sim kernel as AOW3_MAX_STAT_TIERS + maxStatCap/maxStatGet (IMaxStatValueProvider.Get analog, dump.cs:168886; rank-tier fallback chain: tier0->BaseMax, tier1->FirstMax ?? BaseMax, tier2/3->MegaMax ?? chain; unregistered keys 0/60/66/70 pass through). Consumer per the native display domain (caps = UI stat-panel progress-bar maxima): selinfo gains a CAP BASE/FIRST/MEGA bar normalizing the unit's weapon damage (armor-mirror class) to the tier cap of its rank. New test file stat-caps.test.js — 37/37 (table integrity incl. three-tier keys exactly {1,61,62,63,72,73,74}, MinePrice/71=30, fractional literals 2.2/4.5/7.5, clamp semantics, data sanity: no unit def exceeds Health BaseMax 8000).
- Build 2 (v=33, 8a33096) — SameSpeed march: the v=30 document-only unknown (set-order + Battle.$HL coordinator) reconstructed. commandSameSpeed(ids,x,y): group cap = slowest member's speed, each member stores u.sameSpeed, followPath applies min(own, cap) (cap in final velocity space; grounded-aircraft 0.45 factor respected). Cancel = ACT_RESET_SPEED analog: every other order command (move/attack/patrol/stop/hold/defend/bombard/hide/takepos/capture/garrison) and arrival clear the cap; fire discipline does NOT cancel it. UI: M arms (native UnitSpecSameSpeed = 49), right-click/minimap issues; "samespeed" rides LOCKSTEP_NET_TYPES; U-line gains an ss field (hash-covered). Test-geometry lesson: ground chassis factor is 1 (the 0.45 factor is the grounded-AIRCRAFT case) — coyote 4.4 vs fortress 2.1 -> cap 2.1. phase5 163/163.
- Build 3 (v=34, db63fa8) — multi-point patrol: the v=23 documented simplification (anchor<->B flip vs native PatrolRoute.points List<Coordinate> 386963 + SendSelectedUnitsPatrolTargeting(List<Vector3>) 337727) closed. commandPatrol(ids,x,y,pts): cyclic route through the waypoints, per-unit ring-spread applied to EVERY leg at issue, order.pts/leg stored; arrival advances leg = (leg+1) % len and re-syncs x/y = current leg; dest re-sync block and chase-resume read pts[leg]; legacy no-pts call keeps the v=23 flip byte-for-byte. UI: P arms, shift+right-click STAGES a waypoint (stays armed), unshifted right-click issues the whole route; empty pts array rejected at the Commands gate. U-line gains rt (route) + lg (leg) tokens when pts is present — legacy U-lines unchanged. phase5 176/176.
- Regressions after each build (run before every push): replay 45/45, unit-fsm all, accuracy all, commands-determinism 50/50, data-model 379/379, stat-caps 37/37. node --check clean at each step; index.html bumped v=32 -> v=34. Two pre-existing U-line format assertions (fireHold tail bit, hiding tail bit) were updated for the appended sameSpeed field (their intent preserved).
- Notes updated: phase5-missions-minrange.md (SameSpeed + multi-point patrol reconstruction entries; remaining-unknowns list reduced), estat-stat-models.md Implementation section (caps ported, v=32).

Stage Summary:
- Three feature-sized builds shipped as separate commits (dcb393a / 8a33096 / db63fa8): stat tier caps (data live in the sim kernel + stat panel), SameSpeed march (movement-kernel feature, M key), multi-point patrol (cyclic routes, shift-staging). Remaining Phase 5 surfaces are now: defend $Pg chase micro-logic + leash VALUE (server-side), native TakePositions formation algorithm, siege transform stage timings (no transform unit modeled), DontShoot task-vs-spec nuance.

---
Task ID: 30
Agent: Super Z (main)
Task: Lockstep v=29 follow-ups — join-in-progress (JIP) + spectator over the 2P lockstep stack (PROTO 2, host-as-hub)

Work Log:
- Protocol design: transports now envelope every message with sender rid (f) + optional target (to); BroadcastChannel serves N tabs, PeerTransport keeps a per-peer conn map (rid = PeerJS peer id) with drop events. PROTO 1 -> 2 (old pages are rejected by the version gate by design).
- Hub model: host answers in-match hellos with welcome{seed, tick W, sparse input archive 0..W, checkpoint hashes (both slots), match gen} and from then on feeds the joiner a per-tick full input frame (cf) — the exact per-tick composition the host applied — plus relayed checkpoint hashes (ch). The joiner re-simulates from tick 0 (fast-forward, 90-step/frame budget while replaying), verifies hashes at every checkpoint against BOTH players, then settles into the live cf stream. Spectators never publish; role:player joiners reclaim a vacant P2 seat and announce live at the catch-up edge, after which the host gates on them like the original guest.
- Correctness details that mattered: fed clients must ignore raw c packets (they duplicate cf content and poison buf with single-slot shapes); fed players publish from an own[] map independent of the cf-fed buf (echo dedupe) and schedule beyond cfUpTo (never target a composed tick); host gates only on a LIVE slot-2 player so a vacant seat never stalls the match; lost-peer watchdog vacates the seat after 6s of continuous host-side stall (BC background-tab freeze no longer freezes the whole match — the stale peer flags its own divergence and can rejoin via JIP); rematch carries a gen counter so stale cross-match buffers are dropped; guest session resets on start; pre-game third joiners wait as spectators and get a tick-0 welcome at launch.
- Spectator UX: sim.spectate floods visible/explored once per step (all existing vision consumers — renderer culling, fog, minimap, click-select — observe full map with zero per-site edits); gameplay commands rejected via outbound (issue false), selection stays issuer-local; badges SPEC CATCH-UP / JIP CATCH-UP / SPECTATOR (LIVE) / LOCKSTEP P2 (JIP); spectator end-screen shows "PLAYER n WINS".
- Tests: new reverse/evidence/tests/lockstep-jip.test.js (kernel-verbatim extraction + synchronous loopback bus): 36/36 — baseline 2P hash agreement, spectator JIP catch-up + dual hash verification, tampered-archive detection (desync @20), player seat reclaim incl. freeze/resume gating semantics, lost-peer vacate + continue, rematch with a spectator across generations. All five existing suites green.
- Browser smoke (same-browser BC, 3 tabs, local): 2P lockstep live; backgrounding the guest tab froze its pump -> host watchdog vacated after 6s (PEER LOST badge) -> third tab joined and reclaimed the seat as a JIP player, caught up 59/63 -> live edge, zero desyncs. Caveat learned: headless background tabs throttle rAF, so only the focused tab pumps — QA choreography must account for it (this is the documented v=29 limitation, now self-healing on the host side).

Stage Summary:
- The two documented Phase D limits "no join-in-progress / no spectator" are closed on the lockstep stack; late-catchup save sync (the third documented limit) is implicitly solved by the seed+archive welcome path. 2P remains the player-count cap (spectators are unlimited). Rebased onto origin/main post-v=34 (feature builds); version re-bumped v=34 -> v=35.

---
Task ID: 31
Agent: Super Z (main)
Task: Feature-sized build A — siege transform: chassis identities + stage machine + timings (native extraction) + commandSiege reconstruction (v=36)

Work Log:
- Rebuilt the native workspace from LFS (XAPK 1a41e033… verified byte-exact -> libil2cpp.so 8ace05bb…; dump.cs 0050e67d…) and re-ran the full analysis stack against 6.9.18.
- Chassis identities CLOSED (CONFIRMED): the v=30 bytes 22/23/31 are UnitType consts — UNIT_TYPE_SHIELD = 22, UNIT_TYPE_FOG = 23, UNIT_TYPE_FIGHTER = 31 (dump.cs:395427-395445); the act-2/3 arm's cmp #0x17 @0x45f685c is the FOG-chassis check of the Seraphim triple transform. Full chassis taxonomy (10..90) + spec bytes (SPEC_SIEGE=1…) captured.
- Stage machine data CONFIRMED: Unit.SIEGE_STAGE_SEIZE_FIRE/ROTATE_WEAPONS/TRANSFORM = 0/1/2 (393233-393235); Unit fields siege_stage 0xA1, siegeTick 0xA4, siegeAfterWalkTick 0xA8, siege_blocked 0x1C4; durations = UnitType.tick_to_spec 0x4D / tick_from_spec 0x4E (EStat 20/21 TransitionToMarchModeTime / TransitionToSiegeModeTime are the display names); Fraction.siege_hp 0xA4 / autoSiegeDelay 0xF4 / fireRadiusInc 0xF6. Stage + tick are server-simulated and streamed (serializer reads siege_stage @0x44a4d9c; ST deserializer = the single direct set_SiegeTick BL site @0x4553444).
- Unit vtable blob located in-file at 0x138A480 (anchored on the verified get_Task = [klass+0x1008] pair); UnitType slots anchored on get_Type = [klass+0x4D8] from the act-2/3 arm. Derived: siege accessors 0xDC8..0xE70; UnitType get_Spec 0x3B8 / TickFromSpec 0x418 / TickToSpec 0x448. Documented caveat: klass-relative offsets are not globally unique — whole-binary scans on them are noise-dominated (siege-vt-scan/untype-vt-scan runs kept as tools, findings weighted by call-shape).
- Sim driver located: $ce(Battle, Unit) @0x47501f0 (20 956 B — calls the v=30 siege helper $hi @0x4831fe4, ×10 UnitType-duration-shaped reads, siegeTick writes); $fe(Battle, Unit) @0x475afa4 = after-walk/auto-siege timers. HIGH confidence on identification, MEDIUM on the exact per-stage tick split (documented as the residual).
- Tribute reconstruction (v=36): commandSiege(ids, on) — artillery-family gate (minRange > 0), R-key toggle (native hotkeys 27/28), SIEGE_STAGE ladder over SIEGE_TICK_TO=1.6s / SIEGE_TICK_FROM=1.2s (reconstruction constants; per-type sbyte data is server-side), movement lock at issue, fire blocked while stage < 2, TRANSFORM extends the band +SIEGE_FIRE_RADIUS_INC=2 (fireRadiusInc analog via siegeRange(u)), task-replacement release, U-line sg token, Commands "siege" case + LOCKSTEP_NET_TYPES. AOW3_VFX_TAXONOMY untouched (node --check clean).
- Tests: phase5.test.js 176 -> 199 vectors. Regressions after the change: replay 45/45, commands-determinism 50/50, unit-fsm all, data-model 379/379, stat-caps 37/37, accuracy all — PASS. docs/index.html game.js?v=36.
- Notes: phase5-missions-minrange.md gains the v=36 siege section (chassis CLOSED, stage data CONFIRMED, vtable maps, $ce/$fe, reconstruction) + refreshed unknowns (siege stage-boundary SPLIT replaces the closed timings/chassis items; TakePositions entry updated with the client-surface decode). New evidence: combat/siege-native.txt, combat/siege-ce-fe-windows.txt, combat/siege-stage-scan.txt (attribution tables); new tools: siege_stage_scan.py, siege_native_analysis.py, siege_vt_scan.py, untype_vt_scan.py, siege_ce_fe_disasm.py.

Stage Summary:
- v=36: the siege transform unknown is closed at the data level (chassis + stage ladder + duration fields, all CONFIRMED literals) and shipped as a playable feature-sized build (R-key siege with the three-stage ladder and fire-radius bonus). Remaining surfaces: defend $Pg leash VALUE, TakePositions client-side formation nuances, the tick_to_spec internal split (MEDIUM), DontShoot task-vs-spec nuance.

---
Task ID: 32
Agent: Super Z (main)
Task: Feature-sized build B — TakePositions formation algorithm decoded (UnitTakePositionsManager) + tribute nearest-match upgrade (v=36)

Work Log:
- Decoded all seven UnitTakePositionsManager methods by direct disassembly (evidence combat/takepos-native.txt, tool takepos_disasm.py): static occupancy masks All=0x215F / HelicopterBehaviour=0xFEE0 / Land=0xFEFD (exact complements, .cctor 0x81D4DF4); GetUnitOccupancyMask 0x81D43BC keys on the type's UNIT_CATEGORY byte (INFANTRY=1/VEHICLE=2/AIRCRAFT=3/SHIP=4, dump.cs:395462-395465) — aircraft are mask-0 (never placeable) unless IsHelicopterBehaviour 0x8011840, ships get 0xFFEF with the UNIT_TYPE 42 amphibian special 0xFFE5; CalculateCellsMask 0x81D4780 ANDs the remaining group's masks (init 0x7FFF); SendNearestUnitToCell 0x81D4954 = nearest unsent unit by DistanceSqr(unit.Cell, cell) 0x8d3047c with per-cell mask gate, sent as SendUnitsMove([unit], cell, UnitMoveStyle.Forced = 1, ...) 0x82d4a50 (Assault=0/Forced=1, 337622-337627); Update 0x81D4CC4 purges eligibility per frame.
- VERDICT: there is NO server formation solver — placement is player-driven per cell with capability-masked cells and nearest-unit matching. This answers the "native TakePositions formation algorithm" unknown at CONFIRMED level for mechanism + masks + matching; the per-bit semantics of the 15 cell classes stay inferential (documented residual).
- Tribute (v=36): commandTakePositions upgraded from index-order to native nearest-match in tile space; category gate = aircraft-excluded-unless-helicopter; leftovers stay unsent; Forced maps to the engagement-free takepos order with hold-at-spot arrival.
- Tests: phase5.test.js 199 -> 208. The v=28 index-order expectation was updated to the decoded semantics (noted in the vector). Regressions: replay 45/45, commands-determinism 50/50, unit-fsm all, data-model 379/379, stat-caps 37/37, accuracy all — PASS. node --check clean; AOW3_VFX_TAXONOMY untouched.
- Note updated: v=36 TakePositions section + refreshed unknowns.

Stage Summary:
- The TakePositions unknown is closed (mechanism CONFIRMED, tribute behavior aligned); phase5 coverage now 208 vectors. Remaining: defend $Pg leash VALUE + micro-logic, siege stage-boundary split (MEDIUM), DontShoot task-vs-spec nuance, TakePositions 15-bit cell-class semantics (inferential).

---
Task ID: 33
Agent: Super Z (main)
Task: Feature-sized builds C+D — defend $Pg leash SOURCE pinned (44,684-byte end-to-end scan) + DontShoot task-vs-spec nuance resolved (act-7 arm decode) (v=36 notes/evidence)

Work Log:
- Build C: $Pg(Battle, Unit) 0x483C244..0x48470D0 disassembled end-to-end (44,684 B, 11,171 ins). CONFIRMED at full coverage: NO leash literal (nine cmp-immediates total, all init/0/1). Leash SOURCE pinned: the int arg of $UG (0x481ED28) and $yG (0x480CB44) is composed at 0x483EFF8 as ldp w9,w8,[UnitAct statics+0xC]; eor; + distance local — two UnitAct STATIC balance fields XOR-combined + local band; the client only reads the value (server balance data). Helper inventory captured (weapon/path/teardown/geometry helpers; anchor Coordinate ctor re-verified at 0x4840068). DEFEND_TETHER = 4 stands as the documented tuned stand-in.
- Build D: the ACT_DONT_SHOOT arm (0x45F6700..0x45F6824) fully decoded with all call targets resolved: finalizes $Hi(Battle, Unit, 8) — 0x48178FC is the set-task helper (HIDE arm calls it with 4) — DontShoot is TASK 8 (ClientUnitTaskType.DontShoot 271222), i.e. TASK REPLACEMENT, not a sticky spec; entry idempotent (cmp task,#8 skip); the paired specs DontShoot=1048576 / CanShoot=2097152 are per-TYPE capability gates (tbz bit 20 test); entry teardown = clear target + $he(-1) + set_Obj(null) + $Gi at the current position + a 0xFFFF indefinite short marker (slot [0x4B8] flagged unverified).
- Tribute fidelity note recorded as an explicit model choice: v=28 fireHold is sticky; native entry is task replacement — whether an attack task re-asserts discipline natively (attack path) is the documented residual. F-toggle UX and vectors unchanged this pass.
- Evidence: combat/pg-leash-native.txt, combat/dontshoot-native.txt; tools pg_constants_scan.py, pg_ug_windows.py. No code changes (both builds are knowledge-delivery); suites were green at the last run and game.js is untouched since 208/208.

Stage Summary:
- The two oldest documented unknowns are now closed or reduced to precisely-bounded residuals: the defend leash is external balance data with its load site pinned; DontShoot is task replacement with capability gating. Remaining surfaces: $Pg branch enumeration, siege stage-boundary split, attack-path re-assertion check, TakePositions 15-bit cell-class semantics.

---
Task ID: 34
Agent: Super Z (main)
Task: Feature-sized build E — attack-path decode: native fire discipline vs an attack order; fireHold fidelity fix (v=37)

Work Log:
- Question settled: does native fire discipline (DontShoot) survive an attack order? Pinned the full command surface first: AICommandHelper.SendUnitsAttack @0x82D4FF8 disassembled end-to-end — it constructs the SAME message as SendUnitsMove via shared factory 0x4EF4548, writes targetId/prototypeId/category/cell + moveStyle slot = 1, then the shared send epilogue; dump.cs:431773-433991 has NO AICommUnitsAttack — an explicit attack order IS an AICommUnitsMove with a target.
- Sim-side task enums pinned: UnitTaskType (dump.cs:395395-395410) = ClientUnitTaskType (271207-271237) 1:1, NONE=0..BERSERK=11, no Attack member — attacking is the default; discipline is the exception.
- $Hi(Battle, Unit, sbyte) @0x48178FC fully disassembled (400 B): set-task helper with idempotence check + tail-call set_Task; 33 direct BL callers, task-id histogram 2/3/4/8 = the four spec arms inside GAICommandSpecMode.execute @0x45F61E0 (tbz #17 Hide / #20 DontShoot spec gates before task checks) — pins spec bit 20 -> task 8.
- Virtual call convention decoded (new evidence): static vtable blob = 24-byte {0x403, fn, mi} records; live code uses compacted pairs — getter fn [klass+X], setter fn [klass+X-8]. Anchors: get_Task 0x1008 (82 sites), set_Task 0x1018 (599 sites/252 fns), get_FlagShoot 0x258 (609/370), set_FlagShoot 0x268 (475/341), set_Forced 0x388 (529/256). Whole-binary vectorized ldr+blr confirmation scan.
- AICommUnitsMove application decoded: $CMA 0x4909950 (~20 KB computed state machine, ~174 codes, dispatcher 0x490A614) + per-unit $Pk 0x490E864 (formation geometry, tail-calls Battle vt 0x1638). Task-surface mutation inventory: get_Task idempotence gates 0x490AC5C/0x490CB04 (vs Obfuz pool consts), set_Task 0x490C500/0x490C954, $Hi 0x490DC48, set_FlagShoot 0x490C610, set_Forced x3 — the attack order REPLACES the task.
- flag_shoot semantics: written by 8 order-command types, read 609+ times incl. the fire decision ($eg 0x482A4E0 30-case can-fire predicate + $se 0x475757C, both test ==0). Negative result (CONFIRMED): the UnitsMove path never writes the spec stream (AICommUnitsSpec 0x49130C8 is a separate command) — the DontShoot spec bit survives the attack order.
- Obfuz barrier documented: numeric literals live in $Obfuz$ConstFieldHolder$0 (statics +4/+8/+0x14/+0x64/+0x374...) decrypted at runtime through the 0x5265B74 trampoline -> runtime-resolved delegate -> 0x5265090; static recovery needs IL2CPP-init emulation (residual).
- VERDICT (CONFIRMED structure): fireHold does NOT suppress an ordered engagement (task replaced while the ordered target lives) and discipline RESUMES after the kill (spec bit re-asserts task 8). Tribute fix (v=37): orderedEngagement(u) = attackMove + x undefined + live preferredId (native objPreferred = player order; autonomous acquisitions set targetId only) bypasses fireHold in all five fire gates (shoot/fireShell/bombard shell/meleeStrike/shootBuilding); stickiness preserved. Determinism-safe: predicate inputs already in the U-line hash.
- Tests: phase5.test.js 208 -> 213 vectors (ordered attack fires through hold-fire; lock tracks the ordered foe only; fireHold survives the attack; no autonomous re-engagement after the kill; weapons-free re-enables fire). Regressions: replay 45/45, commands-determinism 50/50, unit-fsm all, data-model 379/379, stat-caps 37/37, accuracy all — PASS. node --check clean; AOW3_VFX_TAXONOMY untouched (5 anchors).
- Notes: reverse/notes/attack-path-fire-discipline.md (new, full evidence chain); phase5-missions-minrange.md — v=37 section replaces the v=28 fidelity model-choice note, DontShoot re-assertion unknown CLOSED, coverage/evidence lists updated. Evidence: combat/attack-path-hi-xref.txt, attack-vt-setters.txt, attack-unitsmove-decode.txt, attack-aicomm-map.txt, attack-eg-se-spec.txt; tools attack_path_scan.py, field_mutation_scan.py, vt_call_scan.py, aicomm_map.py, eg_se_decode.py, pk_disasm.py.

Stage Summary:
- v=37: the fireHold fidelity question is settled at the structural level (CONFIRMED): attack order = AICommUnitsMove(target), task replaced during the engagement, spec bit 20 re-asserts task 8 afterwards — ordered fire flows, discipline resumes. Shipped as the orderedEngagement bypass in the five fire gates. Remaining surfaces: $Pg branch enumeration, siege stage-boundary split (build F), Obfuz pool values, TakePositions 15-bit cell-class semantics.

---
Task ID: 35
Agent: Super Z (main)
Task: Feature-sized build F — siege stage-boundary split decode ($xh fixed-point carry, corrected vtable map, $ce full trace) (v=37 notes/evidence, no code change)

Work Log:
- Full annotation trace of $ce(Battle, Unit) 0x47501F0..0x47553CC (5,240 ins → combat/siege-ce-full-trace.txt): all TEN duration vtable calls are get_TickFromSpec (0x418) — every siege behaviour gate (fire windows at 0x4750F78/0x47516BC/0x4751700/0x4752E9C/0x4752FDC/0x4753218/0x47534D0/0x475359C/0x4753CF4/0x4753F64) compares the siege state against TickFromSpec-derived bounds; calls $se for the flag_shoot fire-control check.
- New scan: set_SiegeStage live slot = 0xDD8 (setter convention fn = blob − 8). Writers: $sC(Battle) 0x46FDCBC (init path), $xh(Battle, Unit) 0x488B9FC ×2, GAICommandRound 0x45F2AF8, ST serializers. siegeTick has ZERO vtable callers — direct field accesses only: $he 1w/5r, $fe 1w/7r, $Ie 2w, $cg 2w/3r, $ig 3w, $yG 1w, $UG 1w, $Pg 6w/2r, $mG 3w/12r.
- CORRECTION to build A's siege accessor map: the vtable blob is 24-byte {0x403, fn, mi} records; live code loads compacted {fn, mi} pairs. Live slots: get_SiegeStage 0xDC8, set_SiegeStage 0xDD8, get_SiegeTick 0xDE8, set_SiegeTick 0xDF8, get/set_SiegeAfterWalkTick 0xE08/0xE18, get/set_SiegeBlocked 0xE28/0xE38. Build A's 0xDF8/0xE10 read was one record late.
- THE SPLIT DECODED (structural, CONFIRMED): $xh mode-8 arm (0x488BAE0..0x488BC18) is the fixed-point carry — DEN = pool[0x364] × pool[0x368]; `set_SiegeTick(siegeTick + stage/DEN)` (sdiv) then `set_SiegeStage(stage mod DEN)` (msub). siege_stage is NOT the 0/1/2 stage enum — it is a fractional-tick accumulator in 1/DEN-tick units; whole ticks roll into siegeTick; the ST serializer streams the remainder byte. The SIEGE_STAGE_* consts name behaviour bands evaluated against the accumulator + tick, not stored state. Mode 10 uses the same pool-multiplier pattern (pool[4]×pool[8]).
- Obfuz barrier precisely bounded: pool values decrypt via .cctor 0x4975844 → trampoline 0x5265B74 → runtime-resolved delegate → 0x5265090; {offset, keyA, keyB} triples visible (e.g. statics+0x130 ← 0x6E09FF7F/0x31C54641) but the final keystream lives in runtime-initialized IL2CPP structures — Unicorn emulation of class init is the follow-up. Numeric stage-band fractions stay MEDIUM (the v=36 30% reconstruction constant stands).
- Tribute: no code change — the float-fraction model (f = t/T, bands at 30%/100%) is observationally equivalent to the native fixed-point accumulator; sg token unchanged; 213/213 phase5 vectors and all suites were green at the last run and game.js is untouched since v=37.
- Notes: reverse/notes/siege-stage-boundary-split.md (new); phase5-missions-minrange.md siege unknown reduced to Obfuz pool VALUES + evidence list updated. Evidence: combat/siege-ce-full-trace.txt, siege-xh-mg-decode.txt; tools ce_full_trace.py, xh_mg_decode.py.

Stage Summary:
- The siege stage-boundary mechanism is closed at CONFIRMED level (fixed-point accumulator + carry, corrected vtable map, writer/reader inventory); the residual is exactly the Obfuz-encrypted pool constants. Open surfaces: $Pg branch enumeration, Obfuz pool values (Unicorn), TakePositions 15-bit cell-class semantics.

---
Task ID: 36
Agent: Super Z (main)
Task: Feature-sized build G — Obfuz const-pool emulation: EncryptionVM cracked, secret key extracted + validated by the game's own $qk canary (v=37 notes/evidence, no code change)

Work Log:
- Obfuz surface pinned: Image 98 Obfuz.Runtime.dll; per-assembly holder $Obfuz$ConstFieldHolder$0 (TypeDefIndex 12781); accessor generics $d<T> ($gK int 0x5265B74, $GK/$hK/$HK, $iK/$FK strings, $IK bytes, $jK/$nOA array-init); abstract $D : $E encryptor (slots 20-35); concrete VM = Obfuz.EncryptionVM.GeneratedEncryptionVirtualMachine (dump.cs:1693218): kOpCodeBits=8/256 ops, _secretKey int[] @0x10, ExecuteEncrypt 0x3DCC854 (12,080 B) / ExecuteDecrypt 0x3DCF7D0 (12,668 B), 256-case jump tables 0x1B09D64/0x1B09F64.
- Int pipeline CONFIRMED: call sites embed (blobStart, keyA, salt); $gK -> ToInt32 -> interface walk (slot 4) -> $GOA(raw, keyA, salt) — vtable slot math [klass+0x298] = (0x298-0x138)/16 = slot 22 pins the impl; $GOA consumes keyA bytes LSB-first as up to 4 opcodes; all 255 opcodes exercised pool-wide (native Unicorn emulation chosen over transcription).
- SECRET KEY extracted: ObfuzRuntimeBootstrap.SetUpStaticSecretKey (@0x3DCC5EC) -> Resources.Load("Obfuz/defaultStaticSecretKey", TextAsset) (path from metadata error literals) -> TextAsset.bytes -> $JK BlockCopy -> int[256]; asset = base-APK entry assets/bin/Data/0f159d0d59e64604b196175cc4fd2f85 (1,200 B, m_Script 1,024 B @0xB0, entry sha256 81f07f62…683a4); VM per-case bounds checks (max _secretKey[252], cmp len #0xFC) independently confirm 256 ints.
- SELF-TEST PASS — the game validates the emulation: builders open with K = $GOA(0x720BA23E, 0x545EE170, 0x98705298) then $qk(0x12345678, K) where $qk (@0x77122DC) throws unless equal; native $GOA in Unicorn (whole .so mapped, fake VM object, extracted key) yields EXACTLY 0x12345678. Crypto chain (VM + key + arg convention + opcode order) proven against the game's own assertion.
- .cctor grammar decoded: 697 pool values (629 int / 66 string / 2 float) parsed from the 39,984-B .cctor @0x4975844, each (thunk, blobStart, keyA, salt, staticsTarget); int sources = segments statics+0x1008 (x334) / +0x1810 (x283); anchors inventoried (+4/+8 task-id product pair, +0x14 task threshold, +0x64 DontShoot idempotence, +0x364/+0x368 DEN factors, +0x374 flag_shoot) -> obfuz_cctor_triples.json. Independent cross-check: a name-table builder uses the statics+4/+8 PRODUCT as an array index (bounds it to task range).
- Segment layer CONFIRMED: per-assembly pool managers, byte[2048] segments at statics 0x800/0x1008/0x1810/0x2018/...; builders 0x497F474/0x497F82C (newarr -> InitializeArray -> $mOA/$MOA byte cipher -> store); cipher = CBC per u32: plain_i = $GOA(ciph_i ^ prev, keyA, salt), prev starts 0, tail bytes ^= salt; ten segment key pairs captured.
- Residual (UNRESOLVED, precisely bounded): the 8x2048-B segment ciphertext blocks — NOT in global-metadata fdv (exhaustive negatives: 486 __StaticArrayInitTypeSize arrays raw; all 28,749 fdv offsets x CBC heads x key pairs x swaps; 1,257 usage tokens -> 129 FieldInfo blobs; zero anchor hits vs the sim's own (0x1C, 0x3D, 0x27428CBF) triple). Handles are runtime-filled usage slots. Finish paths documented: (a) Frida statics dump after boot (instant with the validated crypto), (b) Il2CppCodeGenModule.metadataUsages resolution, (c) full-system Unicorn of the builders. Correction recorded: the 472,129/293,863-B arrays next to the holder are MonoScript path tables, not pool data.
- Tribute: no code change — v=36/v=37 reconstruction constants stand until the segment dump converts them to CONFIRMED; AOW3_VFX_TAXONOMY untouched (game.js not opened this build).
- Notes: reverse/notes/obfuz-pool-emulation.md (new); evidence reverse/evidence/obfuz/pool-emulation.txt + pool-cctor-triples.json; tools reverse/tools/obfuz_pool_emulator.py (consolidated emulator + self-test + sweep harness), obfuz_probe.py, obfuz_probe2.py, obfuz_vm_disasm.py, obfuz_parse_cctor.py, obfuz_noa_scan.py, obfuz_arrnew_scan.py, obfuz_blob_hunt.py, obfuz_fdv_hunt.py, obfuz_find_key.py.

Stage Summary:
- The Obfuz barrier is cracked at the crypto level (CONFIRMED): VM + key + pipeline validated by the game's own boot canary; 697-value triple inventory complete; the only residual is the on-disk location of the eight 2048-B segment ciphertext blocks, with three documented finish paths — a Frida statics dump converts every remaining MEDIUM/UNRESOLVED pool-dependent constant (Build E task ids, Build F stage fractions, flag_shoot, DEN) to CONFIRMED in one step. Open surfaces: segment-block location, $Pg branch enumeration, TakePositions 15-bit cell-class semantics.

---
Task ID: 37
Agent: Super Z (main)
Task: 3-4 player lockstep seats (PROTO 3) + self-hosted PeerJS signaling (v=38..43, live-verified)

Work Log:
- Rebased onto 0774f6c first: the parallel session's build E had clobbered the v=37 stranded-joiner fix (onHubHello/onWelcomeRemote reverted to pre-fix; the lockstep-jip section-7 vectors caught it). The fix was restored as part of the N-seat restructure rather than as a separate revert.
- N-seat kernel: Sim(seed, seatCount 2..4) — players/visible/stats/economy/production/funds loops seat-indexed; SEAT_SPAWN puts seats 3/4 at top/bottom mid (1/2 keep the legacy duel HQs; 2P initial state bit-identical); winner = last-HQ-standing (FFA) with the 2P tie-break preserved. stateString/hashState generalize automatically (players.length-driven).
- LockstepSession (PROTO 2 -> 3): opts.seats + helloQueue (pre-game hellos seated as slots 2..seats in order; start/welcome carry slot+seats); onLiveHello assigns the lowest vacant seat and re-runs the live join for registered re-hellos; cf frames now carry a per-slot map `fr` (renamed from `f` — it collided with the transport envelope's sender-rid field and leaked a rid string into buf); 'h' hashes are slot-tagged with per-seat peerHashes (fed clients verify against EVERY seat); ready() gates on all live seats; the watchdog vacates ANY lagging live seat (per-rid stall timers); fed players publish under their own slot; raw seated peers compose from cf; the arch stores full frame maps.
- UI: seat-count select (2/3/4) + launch gating ("waiting for players k/n", rematch-safe), badges LOCKSTEP P2/P3/P4 (+JIP slot), end screen seat-relative verdict + seat colors; SEAT_COLOR/SEAT_HEX accents across minimap/rings/flags/HP/depot floats; factionVariant() reuses faction-1/2 model variants for seats 3/4 (2-faction art pipeline, documented).
- Self-hosted signaling: PeerTransport(cfg {host, port, path, secure}); MP panel gains an optional broker field ("npx peer --port 9000" -> localhost:9000); empty = public cloud. Signaling only; game traffic stays P2P. For https pages the broker must serve WSS (TLS) — plain ws://localhost is blocked as mixed content by Chrome; the E2E test ran the game from a local http origin to exercise the real path.
- Live QA found and fixed four real defects the kernel tests could not see (all browser-layer): (1) the panel HTML edit was lost when a non-atomic patch script aborted pre-write (JS referenced $("mp-seats") that did not exist) — v=39; (2) Mp.launch() reset the session BEFORE beginMatch, wiping helloQueue — nobody was ever seated, all guests fell into JIP; reset() no longer touches the queue — v=40; (3) Mp.begin did not pass seats, so the host sim had 2 players vs the joiners' 4 — hashState covers the players array, every checkpoint diverged (evidence: trio agreed with each other, host differed @20) — v=40; onGuestStart startGame-failure now retries (self-healing like the welcome path); (4) PeerJS binarypack decodes the envelope's to:undefined as null, so the targeted-delivery gate dropped EVERY P2P message (P2P never worked in deep flow; BC was immune via structured clone) — both transports now omit `to` for broadcast — v=42; (5) the joiner's session captured transport.rid at construction, but PeerJS assigns its id on open — session.rid stayed null and the gate dropped all start/welcome; the session rid is now a live getter — v=43.
- Tests: lockstep-jip 44 -> 65 vectors (new: 3P pre-game seating + full-mesh hash agreement + spectator verification vs all three seats; 4P with two mid-match JIP reclaims + seat-3 watchdog vacate + continuation). Test-suite gotchas recorded: fed consumers must run slot-2 sessions (slot 1 = hub, the cf handler is hub-gated); section 7's consumer must attach its session on the JOINER's own transport (cf targets the registered rid).
- Regressions: lockstep-jip 65/65, replay 45/45, phase5 213/213, commands-determinism 50/50, data-model 379/379, stat-caps 37/37, accuracy all, unit-fsm all. node --check clean. index.html game.js?v=43.
- Live verification (v=40..43): BC 4P — host + 3 guests seated as P2/P3/P4, all four sims seatCount=4, bit-exact tick-60 hash fa3927a3 across all four tabs, zero desync through a watchdog vacate. P2P over the self-hosted broker (npx peer on :9000, local http origin): broker logs both registrations, host arms, start seats the guest as LOCKSTEP P2, zero desync, identical lastHash 50b9e895 on both peers. CDN verified per version bump.

Stage Summary:
- v=43: lockstep multiplayer now supports 2-4 player seats (FFA, last HQ standing) with unlimited spectators/JIP, and PeerJS signaling can be self-hosted to drop the public broker. The PROTO 3 gate rejects old pages by design. Known limits: seats 3/4 reuse faction-1/2 model variants (distinct 2D seat accents only); https pages need a WSS-terminating broker; the launch gate requires all seats filled pre-start (JIP still covers late joiners).
