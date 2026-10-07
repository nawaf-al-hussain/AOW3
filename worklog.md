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
