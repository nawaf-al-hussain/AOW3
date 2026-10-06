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
