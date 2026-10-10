# AOW3 — 1:1 Fidelity Gap Audit

Created: 2026-10-08 (Task 40; rebased on top of Build H — the portable Obfuz decode, Task 39).
Baseline audited: `docs/game.js` **v=46** (39,912 lines),
`docs/data/*` **v19**, PROTO 4 lockstep (2–4 seats + 2v2 + spectators/JIP), worklog Task 38.

This document is the formal gap analysis between the browser recreation and the original
**Art of War 3: Global Conflict** (Gear Games, `com.geargames.aow`, **v6.9.18**, IL2CPP ARM64,
metadata v31). It contains no implementation work. Every claim below is classified with the
source-of-truth legend from `AGENTS.md` §2:

| Tag | Meaning |
|---|---|
| **[NATIVE]** | Recovered from the 6.9.18 binary (dump.cs / ARM64 disassembly / Addressables catalog). Hash-pinned chain: XAPK `1a41e033…` → `libil2cpp.so 8ace05bb…` → `dump.cs 0050e67d…`. |
| **[DECOMP]** | Decompiler/reconstructed code or structure-level decode (dump.cs signatures, Capstone traces). Not original source. |
| **[EXT]** | External FileUpload/AOW3 collection (6.5.22-era). Leads only; never overrides native evidence (see §14). |
| **[INFER]** | Inferred behavior (documented reasoning, not direct evidence). |
| **[BROWSER]** | Present in `docs/game.js` / `docs/data/` (implementation is the truth for what exists in the browser). |
| **[SPEC]** | Speculation — flagged explicitly, never load-bearing. |

Status vocabulary (per audit charter): **CONFIRMED / PARTIALLY CONFIRMED / APPROXIMATE /
MISSING / UNKNOWN**. Confidence: **HIGH / MEDIUM / LOW**. A browser implementation existing is
never itself evidence that the original behaves the same way; "UNKNOWN" is left "UNKNOWN".

No completion percentage is asserted anywhere in this document (charter §31). Tallies of
statuses are given in §12 with the exact counting rule.

---

## 1. Scope inspected (audit basis)

- **Implementation (source of truth for the browser):** `docs/game.js` (39,912 lines; sim
  kernel L211–3416, embedded three.js r186 L3418–32850, renderer L36334–38189, UI/net/input
  L38193–39912), `docs/data/{stats,weapons,units,buildings,factions,index}.js` (v19),
  `docs/index.html`, `docs/broker.html`, `docs/assets/` (30 unit/building GLBs, 813 decor
  GLBs, 42 WAVs, atlas/UI/fx textures, real-map `models/map.json` 6,371 placements,
  `models/heightmap.json`).
- **Reverse-engineering evidence (source of truth for the original):** all 16 notes in
  `reverse/notes/` (5 core + 11 peripheral), `reverse/evidence/{combat,damage-pipeline,estat,
  obfuz,data-model,tests,conflicts}/`, `reverse/evidence/vfx-catalog-families-6.9.18.txt`,
  `reverse/versions/6.5.22-fileupload-collection.md`, `reverse/external/fileupload-aow3/`
  (audit-report, manifest, `evidence/6.5.22/`), `reverse/tools/` (34 analysis scripts).
  `reverse/ghidra/`, `reverse/ida/`, `reverse/decompiled/` do **not exist** — all disassembly
  was produced by the committed Capstone/Unicorn tools and retained as evidence `.txt` files.
- **Planning docs:** `AGENTS.md`, `README.md`, `reverse/README.md`,
  `docs/AOW3_DEVELOPMENT_PLAN.md` (Phases 0–28), `docs/AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md`.
- **Pipeline:** `pipeline/README.md`, `extract_v3.py`, `assemble_v2.py`, `tools/export_map.py`,
  `tools/export_heightmap.py`, `tools/surgery_realmap.py` (provenance of GLBs/map/heightmap).
- **Not inspectable in this environment:** repo-root XAPK and `assets/aow3-extracted-assets.zip`
  are Git-LFS pointer stubs locally (git-lfs absent); the on-disk `libil2cpp.so` and `dump.cs`
  were re-hashed and **match** the documented chain, so native claims remain reproducible here.
- **External collection:** `FileUpload/AOW3` is **not present on this machine** (probed
  `/home/z/FileUpload`, `/home/z/my-project/FileUpload`, `/data`, `/opt`, `/mnt`, `/media`,
  `/srv`); its contents were already ingested as the audited 6.5.22 dataset in-repo (§14).

---

## 2. Current 1:1 Blockers

Priority order. "P0 — Critical 1:1 blocker": incorrect/absent core behavior that prevents the
game from being considered a faithful recreation. Status/confidence refer to the *gap*.

### B1 — Every gameplay number is an approximation; native balance is server-delivered [NATIVE]

- **Blocker:** health, price, damage ints, speeds, ranges, cooldowns, accuracy inputs,
  economy rates — every numeric value in `docs/data/*.js` is gameplay-tuned
  (`docs/data/stats.js` "TRIBUTE_LOCAL" policy; `data-model-extraction.md` §3).
- **Why it matters:** 1:1 means an AOW3 player observing the same scenario sees the same
  result. With tuned numbers, TTK, build order timing, and econ curves cannot match.
- **Current state:** schema/taxonomy layer is fully recovered (EStat 78/78, weapon fields
  27/27, 43 unit ids, 12 heroes) and verified by tests; the value layer is declared
  approximate and guarded by `data-model` fixture tests.
- **Original evidence:** `unit-roster-native-analysis.md` — prototype tables are
  server-delivered; 30 bundles + 3,803 bin files byte-grepped, only metadata hits;
  `weapon-schema.json` header: "Balance values are backend-delivered at runtime; APK ships
  structure only."
- **Browser evidence:** `docs/data/*.js`; `combat-stats.md` §"Note on numeric values".
- **Status:** APPROXIMATE (by provable necessity). **Confidence:** HIGH.
- **Required work:** on-device runtime capture of the prototype tables (Frida hooks on
  `WeaponStatsFactory.<CreateStats>` / prototype loading, or HTTPS traffic inspection), then
  a value-import pass + test-vector refresh. This is the single highest-value action for 1:1
  and it is *not* achievable from the APK alone.

### B2 — Missing unit classes: naval, fixed-wing, and 8 further concepts [NATIVE]

- **Blocker:** of the 43 recovered `UNIT_ID_*` concepts (+13 HeroTypes), the browser fields
  28 defs (16 base + 12 heroes). Missing: **FIREBAT(2), CYCLONE(20), FIGHTER(21), BOMBER(22),
  AMPHIBIAN(25), DESTROYER(26), CRUISER(27), NUCLEAR(50), COMMANDO(70), KODOMASH(171),
  DRAGONFLY(120), HAWK(121), ALBATROSS(122), CAYMAN(125), ALLIGATOR(126), SUBMARINE(127)**
  — i.e. the entire naval line, fixed-wing aircraft, the nuclear superweapon, and two
  infantry/vehicle specials. Audio-roster corroboration: f1/f2 select-sound keys list 15 base
  units per faction; browser builds 9/10 (roster note).
- **Why it matters:** a match without naval maps/units, fighters/bombers and the nuclear
  command is not AOW3's game; the aiming bitmask (`aiming` 0x8B: marine/fighter/bomber/sub
  classes) is natively CONFIRMED — the browser can only exercise the ground/heli bits.
- **Current state:** no models extracted (zero UnityFS unit content for these; verified in
  `unit-roster-native-analysis.md`); no sim or UI representation.
- **Status:** MISSING. **Confidence:** HIGH (absence both native-side-evidenced and
  browser-verified).
- **Required work:** asset re-scan for Addressables-delivered models (they may not ship in
  the APK at all — server/Addressables delivery), then roster extension; interim: honest
  "not implemented" marking in UI.

### B3 — Map/mode variety: one extracted skirmish map vs the original's map pool [NATIVE]

- **Blocker:** the browser ships exactly one real map (jungle, byte-identical extraction
  `370ca7ac…`) plus one fixed spawn layout per seat count. The original has a map pool,
  mission/phase content (`phase5-missions-minrange.md` documents mission-side evidence),
  and naval maps implied by the naval roster.
- **Status:** MISSING (as a system; the single map itself is CONFIRMED extraction).
  **Confidence:** HIGH for the gap, MEDIUM for the original map-pool shape (no map-list
  evidence recovered yet).
- **Required work:** locate map manifest/pool in Addressables catalog (`assets/aa/catalog.json`
  is on-device data — the vfx note proves catalog access works); export additional maps via
  the proven `export_map.py` pipeline.

### B4 — Live-sim damage application semantics are unverifiable from the client [NATIVE]

- **Blocker:** the binary contains **no live-sim consumer** of the mitigation curve — the
  only consumer surface is the UI stat pipeline (`damage-pipeline-native-analysis.md` §3.5:
  `CalculateWeaponArmorDamage` has exactly 1 direct caller, `MaxStatValueProvider.Get`;
  7 indirect vtable sites, all `CalculateProgress`). Tick-level application (per-hit rolls,
  order of operations, rounding) lives server-side.
- **Why it matters:** the browser's per-tick application (`applyHit`, splash falloff,
  building 0.6 factor, veterancy mods) is a reconstruction that cannot be checked against
  the original by static means.
- **Status:** UNKNOWN (original), the browser side is APPROXIMATE. **Confidence:** HIGH that
  it is unverifiable from this APK.
- **Required work:** same as B1 — runtime capture of live damage events on device; controlled
  scenario comparison (dev plan Phase 24).

### B5 — Invented mechanics that contradict confirmed native behavior [NATIVE]

- **Blocker:** the browser ships mechanics the original provably does not have (client-side):
  - **Melee crit** (`m_cerber_blades.crit/critMul`, `docs/data/weapons.js:53`) — "No
    critical-hit system in the client" (`combat-stats.md` §8; `weapon-type-surface-native-analysis.md`).
  - **Splash damage falloff** (linear 0–50%, game.js L2071) — native `explosionDecr` has **no
    damage-falloff role** in the client (accuracy scatter only); no falloff evidence exists.
  - **Veterancy damage modifiers** (±8%/−5%, game.js L1826) — no native veterancy evidence.
  - **Shield unit as heal aura** (`aura.regen`) vs native `ShieldStrength/26`+`ShieldRadius/27`
    mechanic keys (`data-model-extraction.md` §2 documents the divergence).
- **Why it matters:** these change combat outcomes in ways the original does not; they are
  also false-confidence magnets (§4).
- **Status:** the *divergence* is CONFIRMED for crit (native absence is evidence); APPROXIMATE
  for falloff/veterancy (native behavior unknown, browser invented). **Confidence:** HIGH.
- **Required work:** remove/flag invented mechanics; implement Shield natively when its
  behavior is recovered (native keys exist; semantics need runtime capture).

### B6 — Native tick rate and timing grid not recovered [NATIVE]

- **Blocker:** the browser assumes 20 Hz (`TICK_RATE=20`, game.js L414). The native client
  anchors the *existence* of a tick grid (`FIRE_TICK_LENGTH = 4`, `shot_tick[]`,
  `senderTick` on commands) but its rate was never recovered; it is server-side.
- **Why it matters:** rates drive every timing-dependent behavior (aim, bursts, capture
  decay, income cadence). 20 Hz is an assumption, not a recovered fact.
- **Status:** UNKNOWN (native). **Confidence:** HIGH that it is unverified.
- **Required work:** on-device tick instrumentation, or timing analysis of native network
  traffic; cross-check `FIRE_TICK_LENGTH` semantics.

### B7 — No unit–unit collision / path-slot micro-management [NATIVE fields, INFER behavior]

- **Blocker:** browser units overlap freely (no pairwise push-out; only static-grid blocking,
  `passable` L1297). The native `Unit` carries `wait_for_moving 0xB9`, `forced 0xB8`,
  `walk_state 0xE4` + cross-tile `walk_dx/dy` bookkeeping — a path-slot system whose
  internals were explicitly not reconstructed (`unit-state-machines-native-analysis.md` §"Not
  reconstructed"); `UnitTakePositionsManager` decodes occupancy masks/cells proving the
  original reasons about *who stands where*.
- **Why it matters:** crowd behavior, chokes, and surround dynamics visibly differ.
- **Status:** MISSING (browser) vs APPROXIMATE-need (native behavior partially evidenced).
  **Confidence:** HIGH (fields CONFIRMED; semantics [INFER]).
- **Required work:** RE the slot system (likely `$Pg`-adjacent, Obfuz-encumbered), then a
  deterministic browser equivalent.

### B8 — Water is render-only; no naval domain in the sim [BROWSER + NATIVE roster]

- **Blocker:** the sim grid blocks only rock decor + border (`genTerrain` L500–545); the
  visual ocean is not a sim constraint, so ground units walk on water. Tied to B2 (no naval
  units).
- **Status:** MISSING. **Confidence:** HIGH.
- **Required work:** water/walkability layers in the terrain grid once naval scope is real.

---

## 3. Confirmed Strengths (evidence-backed only)

1. **Hash-pinned, reproducible evidence chain.** XAPK → `libil2cpp.so` → `dump.cs` SHA-256s
   re-verified on disk during this audit; every note restates the chain; raw disassembly
   `.txt` substrates sit next to every conclusion (auditable, e.g. `siege-ce-full-trace.txt`
   5,240 instructions behind the siege decode).
2. **Damage/armor math is native, not invented.** The 0.9/0.1 mitigation curve with both
   branch constants, the per-armor damage triad (EStat 61/62/63), integer level scaling, and
   the closure proof that no second multiplier exists
   (`armor-stat-helper-native-analysis.md`; `damage-pipeline-native-analysis.md` end-to-end).
   The browser implements exactly this shape (game.js L41–55) with vectors in
   `accuracy.test.js`.
3. **Accuracy formulas recovered verbatim and shipped.** `WeaponStaticAccuracy`/`WeaponDynamicAccuracy`
   branch structure, constants 100/1000/10000/(1000−10·decr)/10⁶, walking-product semantics
   keyed on the *shooter*, scatter branch — implemented v=12, still passing 13 vectors.
4. **Stat taxonomy fully extracted.** EStat 78/78, EStatCategory 5/5, 45 IStatModel classes
   with 45/45 natively pinned bindings, 72-entry BaseMax/FirstMax/MegaMax tier table ported
   into the sim (37 stat-caps vectors).
5. **Mechanism-level command/stance decodes with shipped equivalents.** Spec-mode acts 0–7,
   DontShoot = task 8 + capability bit 20 (fire-discipline resume-after-kill semantics),
   siege as a fractional-tick accumulator, TakePositions occupancy decode, defend leash as
   data, bombard = task lifetime with LCG scatter — each CONFIRMED native and represented in
   the browser with regression coverage (phase5: 213 vectors).
6. **Deterministic command architecture with real verification surfaces.** Unified Commands
   layer (AI issues player commands through it), seeded mulberry32 with hashed `rngState`,
   canonical quantized `stateString` → fnv1a 1 Hz journal, full replay capture/playback
   (45/45 vectors incl. tamper detection), live 1 Hz hash exchange in lockstep — the
   structural analog of the native `AICommCRC*`/`AICommandLog*` pair, whose existence is
   CONFIRMED in dump.cs.
7. **The sim/render split is real, not aspirational.** Fixed 20 Hz accumulator with bounded
   catch-up (proof in §5.1 below); the renderer is a read-only consumer; `Math.random()`
   inventory (66 hits) contains zero sim-affecting call sites; all six sim RNG draws route
   through `Sim.rng()`.
8. **Extracted original assets, correctly wired.** 30 skeletal GLBs with the game's own
   AnimationClips + muzzle/turret bone wiring; 813 decor props; the jungle map is a
   byte-identical Transform-hierarchy extraction (6,371 placements, 392 meshes); terrain
   decals, card art, emblems, building icons, 42 original WAVs.
9. **Real-map rendering pipeline.** Per-template InstancedMesh for ~6,400 props, extracted
   heightmap driving Y placement, land-chunk GLBs replacing the procedural ground — the
   provenance is documented and re-derivable (`pipeline/tools/export_map.py`).
10. **Lockstep multiplayer actually works and is regression-covered.** PROTO 4, 2–4 seats,
    2v2 with team hostility/spawns/shared vision, unlimited spectators, JIP via input-archive
    catch-up, seat reclaim, stall vacate; 88 lockstep vectors including 4-way live hash
    agreement and team-kill winner agreement; live 4-tab QA with bit-identical checkpoints
    (worklog Task 38).
11. **The Obfuz obfuscation barrier is characterized, not hand-waved.** VM + 256-int key
    extracted, the game's own boot canary validates the emulator, 697/697 constant triples
    inventoried, the one-command Frida finish path is built and its consumer validated 26/26
    on synthetic transcripts (honest: synthetic, device run outstanding).
12. **External evidence handled with discipline.** 6.5.22 collection isolated by version,
    every checkable claim verified against 6.9.18 (~80.5% name match), the false
    `ARMOR_COEFF` claim natively REJECTED and documented, usage rules codified.
13. **Executable regression net (~820 assertions, all green at audit time — see §15).**
    Tests extract the *shipped* kernel verbatim into a sandbox, so notes↔code drift fails
    by construction.

---

## 4. False Confidence Risks (appearance ≠ fidelity)

The audit charter requires this section. Each item is a place where the current build
*looks* more 1:1 than the evidence supports.

1. **Original asset present ≠ original rendering reproduced.** Materials are
   MeshStandardMaterial with approximated lighting (hemi+dir+fill, Linear tone mapping,
   exposure 1.14); the original's Unity pipeline (shaders, color space, post stack) is
   unknown. The game looks right; nobody has verified it *renders* right.
2. **A unit moves and fights ≠ original movement/combat semantics.** Pathfinding is a
   browser A*; the original's pathfinding is server-side and unrecoverable. Crowd/slot
   behavior (B7) and water crossing (B8) are outright different.
3. **Damage formula "looks like" the native curve ≠ native damage output.** The curve and
   triad are native; the *inputs* (damage ints, armor values) and the application cadence
   are not (B1, B4). Identical formula × wrong numbers = wrong TTK with the right shape.
4. **AI attacks in plausible waves ≠ AOW3 AI.** The browser AI is one difficulty-less
   scripted skirmish bot; the native GAI vocabulary (753 command names) is recovered but no
   runtime AI logic is client-visible. Any statement "the AI behaves like AOW3" is
   unsupported (mark: APPROXIMATE/UNKNOWN).
5. **Deterministic browser sim ≠ the original's deterministic sim.** Determinism is proven
   *internally* (replay, hashes); parity with the original's tick semantics (B6), RNG
   usage points, and ordering is not established.
6. **Correct-looking HUD ≠ original UI behavior.** Layout, fonts (system-ui), panel
   chrome, menu, and scaling are hand-built CSS; only icons/cards/emblems are original.
   No measured reconstruction (dev plan Phase 18 "measure, don't eyeball") has happened.
7. **`shotInt` burst machinery exists ≠ bursts fire.** No weapon sets `shotCount`
   (data dormant); all current weapons are single-shot. The structure is CONFIRMED, the
   behavior is absent.
8. **Two-state fog + minimap ≠ AOW3 visibility rules.** Sight radii are tuned; the native
   sight/visibility rule set (and its interaction with aircraft/submarines) is unknown.
9. **2v2 exists ≠ native team semantics.** Team hostility truth table, spawns, and win
   rules are browser-designed (documented in worklog Task 38); native team/mode data is
   server-delivered. `aura/regen stays own-only in teams — native behavior unknown`.
10. **Heroes fight with ability params ≠ hero balance.** Ability *hooks* are natively
    anchored (EStat keys 51–57); every parameter (immortality 3 s/22 s, slow 28%/3 s, chain
    ×0.45) is tuned. Ten hero chassis are documented stand-in models.
11. **Audio plays original WAVs ≠ original sound design.** Weapon→sound mapping is
    heuristic pools; music is absent; ambient is procedural wind/birds; 7 announcer cues
    are loaded but triggered by nothing.
12. **Positional WebAudio ≠ native mix.** Distance curves, pan law, echo, and voice caps
    are browser-engineered with no native reference.
13. **Multiplayer "works" in tabs ≠ production netcode.** rAF-coupled pump means a
    backgrounded tab freezes all peers (freeze-not-desync, by design); desync handling is
    banner-only; every client holds the full sim state (hidden info is memory-readable);
    there is no authoritative server (the original is server-authoritative).
14. **Test suites green ≠ fidelity proven.** They prove internal consistency and note↔code
    sync against *reconstructed* semantics; they cannot validate server-side original
    behavior (B1/B4/B6).

---

## 5. Formal Audit Matrix

Row statuses judge *"does the browser reproduce the original?"*. "Evidence" cites the
strongest source. Confidence is the auditor's confidence in the row verdict.

### 5.A Simulation architecture

Special proof item first — the charter asks explicitly: **is simulation timing still coupled
to rendering?** It is not. Proof from current code (v=46):

- `TICK_RATE = 20` and the accumulator live in the sim kernel (game.js L414, L39507–39550):
  `acc += dt2` (frame dt, capped 0.25 s) → `while (acc >= 1/20 && steps < maxSteps)`,
  `maxSteps` 8 (90 during JIP catch-up) — bounded catch-up; `AGENTS.md` §7 rule satisfied.
- Lockstep ticks gate on input availability and are applied *inside* the accumulator
  (`Net.session.apply(sim.tick); sim.step(stepDt); Net.session.afterStep(...)`); local mode
  steps `sim.step()` + `ai.step()` once per sim tick, not per frame.
- `Renderer3D.render` (L36903–36926) only reads sim and writes `v.*` view proxies; a grep of
  the whole renderer block finds zero writes to `sim.*`/`u.*` fields. Camera pan/zoom uses
  frame dt but is input-only. HUD/minimap refresh on a 0.16 s sub-accumulator.
- `Math.random()` (66 call sites) never appears inside `Sim`/`Commands`/`LockstepSession`/
  `Replay`/`AI`; sim draws go through the seeded, hash-covered `Sim.rng()`.
- Regression proof: `unit-fsm`/`commands-determinism` tests extract the shipped kernel and
  verify same-seed hash equality; `replay` 45/45 reproduces full matches from journal only.

| System | Original behavior | Browser implementation | Status | Evidence | Confidence | Remaining gap |
|---|---|---|---|---|---|---|
| Sim tick rate | Tick grid exists (`FIRE_TICK_LENGTH=4` [NATIVE], `senderTick` [DECOMP]); rate server-side | 20 Hz accumulator, bounded catch-up (8/frame; 90 JIP) [BROWSER] | PARTIALLY CONFIRMED | combat-stats/unit-state-machines notes; game.js L414,L39507 | HIGH (code) / LOW (rate parity) | Native rate unknown (B6) |
| Sim/render separation | Client carries state fields, no sim bodies [DECOMP] | Clean read-only renderer; accumulator loop [BROWSER] | CONFIRMED | game.js L36903–36926 vs L39507–39550; renderer grep | HIGH | — |
| Determinism discipline | Commands tick-stamped; CRC exchange exists [DECOMP] | Seeded mulberry32, hashed rngState, quantized stateString, 1 Hz fnv1a journal [BROWSER] | PARTIALLY CONFIRMED | command-system note; game.js L440–443,L670–697 | HIGH (internal) / LOW (native parity) | Native RNG/algorithm unknown |
| Command ordering | `AICommandLog*` journal [DECOMP]; ordering server-side | (tick,seq) journal; lockstep: per-slot frames applied slot-ascending, sorted keys [BROWSER] | PARTIALLY CONFIRMED | dump.cs via command-system note; game.js L2435–2441,L2893–2903 | MEDIUM | Native wire order unknown |
| State hashing / desync | `AICommCRCRequest/Answer/Verify/SyncTest` [DECOMP] | fnv1a over quantized state, 1 Hz per-slot exchange, `#desync` banner; **mines & `_chain` not hashed** [BROWSER] | PARTIALLY CONFIRMED | command-system note; game.js L670–697,L2756–2768 | HIGH (names) / LOW (algorithm) | Native fields/algorithm; browser hash blind spots |
| Rejected commands | Server validates (SendCommand) [INFER] | Validate-before-journal; no funds/producer/placement rejected, not journaled [BROWSER] | APPROXIMATE | command-system note §Clone | MEDIUM | Native validation rule set unknown |
| Replay | `AICommandLogWriter/Reader` [DECOMP] | seed+journal+terrain fingerprint+hash journal; capture/save/run; 45/45 vectors [BROWSER] | PARTIALLY CONFIRMED | replay tests; game.js L3191–3261 | HIGH (internal) | Native format unknown |
| Tick ownership / authority | Server-authoritative original [DECOMP: client has no sim bodies] | Every peer runs full sim; hub sequences inputs; P2P lockstep [BROWSER] | APPROXIMATE | unit-state-machines note §1 preamble | HIGH | Different trust topology by design; see §5.Q |
| AI command path | Clients/GAI emit `AIComm*` messages [DECOMP] | AI issues same command types via own Commands + seeded rng [BROWSER] | PARTIALLY CONFIRMED | game.js L3276–3280 | HIGH (principle) | AI content itself: §5.H |
| Match lifecycle | Missions/phases + skirmish exist [EXT, leads] | Skirmish FFA/2v2, last-HQ(-team)-standing; no missions [BROWSER] | PARTIALLY CONFIRMED | worklog Task 38; phase5 note | MEDIUM | Mission/campaign mode missing |

### 5.B Commands / lockstep

Command-family audit. "UI button ≠ implemented" rule applied: a family counts only if the
simulation behavior exists (all rows below were verified in `Commands.execute` L2296–2433 and
the sim handlers they call).

| Command family (native analog) | Browser | Status | Evidence | Confidence | Gap |
|---|---|---|---|---|---|
| Squad selection (`AICommSquad` GAIUnitSet[]) | `select` set/add/type/clear; drag/box/double-tap; **no control groups** [BROWSER] | PARTIALLY CONFIRMED | command-system note table | HIGH | Control groups missing |
| Move (`AICommUnitsMove`) | `move` with deterministic ring formation [BROWSER] | CONFIRMED (semantics) | command-system note; $Hi/$CMA decode | HIGH | Path internals approximated (§5.G) |
| Attack-move (`AICommUnitsMove` + flags) | `move` attackMove flag; acquire-while-idle [BROWSER] | CONFIRMED (semantics) | attack-path-fire-discipline.md: attack = move-with-target | HIGH | — |
| Explicit attack | attack = move-with-sticky-target (`preferredId`≈`objPreferred`) [BROWSER] | CONFIRMED | native decode: no `AICommUnitsAttack` class exists; `SendUnitsAttack` shares move factory | HIGH | — |
| Stop (`AICommUnitsStop`) | `stop` → TASK_WAIT analog [BROWSER] | CONFIRMED | command-system note | HIGH | hold-vs-stop native distinction (spec 65536 vs 2^30) approximated by two commands |
| Hold position (`AICommUnitsHoldPosition`) | `hold` [BROWSER] | PARTIALLY CONFIRMED | phase5 vectors | MEDIUM | native one-shot vs sticky semantics partially decoded |
| Patrol (`AICommUnitsPatrolTargeting`) | multipoint cyclic patrol (v=34) [BROWSER] | PARTIALLY CONFIRMED | phase5-missions note; phase5 vectors | MEDIUM | native executor only partially decoded |
| Production (`AICommBuyUnit`) | `produce`, queue max 8, CP-gated [BROWSER] | CONFIRMED (structure) | command-system note | HIGH | values tuned (B1) |
| Production cancellation (`AICommCancelBuyUnit`) | **none** — no cancel/refund path [BROWSER] | MISSING | agent pass E (grep) | HIGH | — |
| Building placement (`AICommBuSet`) | `build` + ghost preview + `canPlace` radius rule [BROWSER] | PARTIALLY CONFIRMED | command-system note | MEDIUM | radius/footprint rules tuned vs native `ConstructionRadius/BuildingSize` |
| Building rally point (`AICommBuildingRallyPoint`) | **none** [BROWSER] | MISSING | command-system note gap list | HIGH | — |
| Repair (`AICommBuildingRepair`) | **none** [BROWSER] | MISSING | command-system note gap list | HIGH | — |
| Upgrade (`AICommBuildingUpgrade`) | **none** [BROWSER] | MISSING | command-system note gap list | HIGH | — |
| Aircraft rebase (`AICommAircraftRebase`) | hero land/depart only (`special`) [BROWSER] | APPROXIMATE | command-system note (≈ mapping) | MEDIUM | no airfield/rebase network |
| Hero abilities (`AICommHeroAbilityActive/UnitsPsionic`) | 12 heroes with ability fields (immortality/slow/burn/chain/frontal/mines/spinUp) as weapon/aura modifiers [BROWSER] | PARTIALLY CONFIRMED | hero-prefabs note (EStat anchors 51–57) | MEDIUM | ability *commands* not modeled; params tuned |
| Bombardment (`AICommUnitsBombard`) | `bombard` with min-range + scatter [BROWSER] | CONFIRMED (structure) | specmode note; $CMA decode | HIGH | duration semantics = task lifetime (implemented) |
| Nuclear (`NuclearLaunch`) | **none** [BROWSER] | MISSING | command-system note | HIGH | tied to B2 (NUCLEAR=50) |
| CRC/sync (`AICommCRC*`) | 1 Hz hash exchange + banner [BROWSER] | PARTIALLY CONFIRMED | command-system note | MEDIUM | algorithm/fields unknown; no resync |
| Garrison (`ClientBunkerWeapon`/Bunker=14) | `garrison/ungarrison`, cap 3, crew-served weapon [BROWSER] | PARTIALLY CONFIRMED | phase5-missions note | MEDIUM | cap 3 tuned |
| Spec-mode family (`GAICommandSpecMode` acts 0–7) | `hide`/`siege`/`samespeed`/`dontshoot`/`canshoot`/`takepos`/`defend`/`bombard` [BROWSER] | PARTIALLY CONFIRMED | specmode + dontshoot + pg-leash notes; phase5 vectors | HIGH (semantics) | pool-encrypted literals pending (one Frida run) |
| Lockstep transport | BroadcastChannel + PeerJS (public or self-hosted [wss://]), PROTO 4, seats 2–4 + spectators/JIP [BROWSER] | APPROXIMATE (vs original netcode) | worklog Tasks 37–38; broker.html | HIGH (works) | original client↔server protocol unrecovered |

### 5.C Combat

| System | Original behavior | Browser implementation | Status | Evidence | Confidence | Remaining gap |
|---|---|---|---|---|---|---|
| Damage-vs-armor curve | `CalculateWeaponArmorDamage` 0.1f/0.9f two-branch, [0.1..1.0] [NATIVE] | Continuous reconstruction, continuous at r=1, same constants [BROWSER] | CONFIRMED (constants+shape) | combat-stats §1; armor note; game.js L41–50 | HIGH | exact `ref` normalization of native branch 1 vs browser dmg-normalization is documented-equivalent, not bit-proven |
| Damage triad | `m_damageLight/Medium/Heavy` 0x28/2c/30 [NATIVE] | `damage{light,medium,heavy}` on all 29 weapons [BROWSER] | CONFIRMED (structure); values UNKNOWN | weapon-schema.json | HIGH | native ints server-side (B1) |
| Armor classes | `ArmorType` L/M/H; unit armor triad EStat 7/8/9 [NATIVE] | `armorClass` + `armor{}` triad [BROWSER] | CONFIRMED (structure) | combat-stats §4 | HIGH | values tuned |
| Static accuracy | `WeaponStaticAccuracy` percent/scatter/nuclear branches [NATIVE] | Verbatim implementation incl. scatter + guided [BROWSER] | CONFIRMED | weapon-accuracy note; accuracy.test 13 vectors | HIGH | per-weapon `explosionDecr`/type ids approximated |
| Walking accuracy | `WeaponDynamicAccuracy` = accWalk·accStatic/10⁴, shooter-keyed [NATIVE] | Implemented; hitChance uses shooter-moving [BROWSER] | CONFIRMED | weapon-accuracy note §semantic fix | HIGH | — |
| Hit resolution | Server-side application [INFER] | `applyHit`: rng roll per shot at tick boundaries [BROWSER] | APPROXIMATE | damage-pipeline §3.5 (no live consumer in binary) | LOW | cadence/ordering unverifiable (B4) |
| Chance clamps | Not recovered | clamp [0.15, 0.98] [BROWSER, tuned] | APPROXIMATE | game.js L125,153 | MEDIUM | native clamps unknown |
| Min range | `m_distanceMin` first-class field [NATIVE] | Dead-zone hold + acquisition/burst/building gates; values tuned [BROWSER] | CONFIRMED (mechanism) | phase5-missions note | HIGH | values tuned |
| Burst (shot_count/shot_int/shot_tick) | Native round structure CONFIRMED [NATIVE] | `burstLeft/burstT` machinery; **no weapon data → dormant** [BROWSER] | PARTIALLY CONFIRMED | unit-state-machines §3; game.js L1381–1389 | HIGH (structure) | burst data (B1) |
| Round length / cooldown | `round_len 0x66` [NATIVE] | `cooldown` per weapon [BROWSER] | CONFIRMED (field) / values tuned | weapon-schema | HIGH | — |
| Projectile travel | `m_velocity`, `m_bulletTrajectoryType`, `m_gravity` fields [NATIVE] | Simulated travel; speed=0 instant; **no trajectory-type/gravity modeling**; artillery arc is render-only [BROWSER] | PARTIALLY CONFIRMED | weapon-schema.json; game.js L2046–2110 | MEDIUM | trajectory semantics unknown |
| Splash radius | `m_explosionRadius` [NATIVE] | `splash` used for radius + multi-target [BROWSER] | CONFIRMED (field) / values tuned | weapon-schema | HIGH | — |
| Splash damage falloff | **No client-side falloff evidence**; `explosionDecr` = accuracy scatter only [NATIVE] | Linear 0–50% falloff [BROWSER] | APPROXIMATE (invented shape) | weapon-type-surface note | MEDIUM | native behavior unknown; flag B5 |
| Multi-target damage | not recovered | splash hits all units in radius; buildings 0.6× [BROWSER] | APPROXIMATE | game.js L2071–2079 | LOW | — |
| Retaliation + ally warn | `WARNED_BY_NEARBY_FRIENDS=1` [NATIVE] | victim acquires attacker; idle friends in sight join; min-range & hidden exemptions [BROWSER] | CONFIRMED | unit-state-machines §1; game.js L2014–2045 | HIGH | — |
| Attack interruption / aim reset | `think`/`flag_shoot` gating [NATIVE] | new target resets aimT/burst; order replaces task [BROWSER] | PARTIALLY CONFIRMED | unit-state-machines §4 | MEDIUM | native transition numbers unknown |
| Fire arc / rotation gate | gradual orient + `flag_shoot` [NATIVE] | `facingOk(fireArc)` gate + `updateRotation` rad/s [BROWSER] | PARTIALLY CONFIRMED | unit-state-machines §4.1 | MEDIUM | turret slew (`rotate_diap/speed`) render-only; hull-arc stand-in |
| Target priority | `priority 0x8D` + `damage_priority[]` [NATIVE] | weighted score dmgVs/health + AA bias [BROWSER] | PARTIALLY CONFIRMED | unit-state-machines §3 | MEDIUM | native per-weapon priorities unknown; no full 6-class `aiming` mask (marine/fighter/bomber/sub absent with roster) |
| Anti-air | `AntiAirOnly ⇔ mask ⊆ OCCUPATION_FOR_AIR 0x1A` [NATIVE] | `antiAir` boolean + air mask in findTarget/turret [BROWSER] | PARTIALLY CONFIRMED | weapon-type-surface note | HIGH (semantic) | boolean stands in for the 6-bit mask |
| Mines | Mine stat classes + `OCCUPATION_FOR_MINES 0x25`; air never targeted [NATIVE] | Mole mineLayer + updateMines damage; **not in state hash** [BROWSER] | PARTIALLY CONFIRMED | estat-stat-models §6.7 | MEDIUM | hash blind spot; mine cost/radius keys native, values tuned |
| Buildings as shooters | not recovered (values server) | fixed armor table {30,24,18} + acc 0.85 [BROWSER] | APPROXIMATE | game.js L1939,1955 | LOW | — |
| Veterancy | no native evidence | kill-rank damage mods ±8/5% + chevrons [BROWSER] | APPROXIMATE (invented) | game.js L56–59,L1826 | LOW | B5 flag |
| Melee | hero melee (Cerber blades) [INFER from model] | melee weapon + **crit invented** [BROWSER] | APPROXIMATE | weapons.js:53 vs combat-stats §8 | HIGH (crit absence native) | remove crit (B5) |
| Death / destruction | `die_tick`/`die_time` explicit death state [NATIVE] | dying state + corpse bookkeeping; building removal sweep + FX [BROWSER] | PARTIALLY CONFIRMED | unit-state-machines §1 | HIGH | destruction debris/hazard rules unknown |
| Superweapons | `WeaponSuperWeaponArmor*` EStats 72–74; NUCLEAR_MISSILE type 27 [NATIVE] | none [BROWSER] | MISSING | combat-stats §1,§8 | HIGH | B2 |

### 5.D Units — coverage table

Native roster from `unit-type-ids.json` (43 `UNIT_ID_*`) + `HeroTypes` (12) + the
13th hero-like `codomash`. Browser roster from `docs/data/units.js` (28 defs) resolved
against `nativeUnits`. The table lists every evidence concept and its browser state.

| Native concept (UNIT_ID) | Faction | Browser def | Model in browser | Status | Notes |
|---|---|---|---|---|---|
| ILIGHT 0 / 100 | f1/f2 | `ilight` (shared) | f1_inf_light / f2_inf_light GLB, original clips | CONFIRMED (identity) | stats tuned |
| IHEAVY 1 / 101 | f1/f2 | `iheavy` (shared) | f1/f2_inf_heavy GLB | CONFIRMED (identity) | stats tuned |
| FORTRESS 10 (24?) | f1 | `fortress` | f1_veh_fortress GLB | CONFIRMED (identity) | minRange 4 tuned |
| HAMMER 11 | f1 | `hammer` | f1_veh_hammer GLB | CONFIRMED | — |
| TYPHOON 12 | f1 | `typhoon` | f1_veh_typhoon GLB | CONFIRMED | MLRS role from clip inventory |
| ZEUS 15 | f1 | `zeus` | f1_veh_zeus GLB | PARTIALLY CONFIRMED | native LIGHTNING_CHAIN(70) shell not reproduced (documented stand-in) |
| TORRENT 16 | f1 | `torrent` | f1_veh_torrent GLB | CONFIRMED | AA role |
| SHIELD 17 | f1 | `shield` | f1_veh_shield GLB | PARTIALLY CONFIRMED | implemented as heal aura; native ShieldStrength/26+ShieldRadius/27 mechanic NOT reproduced (B5) |
| FIREBAT 2 | f1 | — | — | MISSING | — |
| CYCLONE 20 | f1 | — | — | MISSING | — |
| FIGHTER 21 / BOMBER 22 | f1/f2 | — | — | MISSING | fixed-wing line |
| AMPHIBIAN 25 / DESTROYER 26 / CRUISER 27 | f1 | — | — | MISSING | naval |
| NUCLEAR 50 | shared | — | — | MISSING | superweapon |
| COMMANDO 70 | shared | — | — | MISSING | — |
| SERAPHIM 71 + HeroTypes 3 | f1 | `seraphim` | f1_hero_seraphim GLB | PARTIALLY CONFIRMED | chassis provenance unrecorded (§5.D note below) |
| SNIPER 102 | f2 | `sniper` | f2_inf_sniper GLB | CONFIRMED | — |
| COYOTE 110 | f2 | `coyote` | f2_veh_coyote GLB | CONFIRMED | — |
| ARMADILLO 111 | f2 | `armadillo` | f2_veh_armadillo GLB | CONFIRMED | — |
| PORCUPINE 112 | f2 | `porcupine` | f2_veh_porcupine GLB | CONFIRMED | AA |
| JAGUAR 115 | f2 | `jaguar` | f2_veh_jaguar GLB | CONFIRMED | — |
| MAMMOTH 116 | f2 | `mammoth` | f2_veh_mammoth GLB | CONFIRMED | — |
| FOG (chameleon) 117 | f2 | `chameleon` | f2_veh_chameleon GLB | PARTIALLY CONFIRMED | native stealth (UNIT_TYPE_FOG) not reproduced; unarmed scout stand-in |
| DRAGONFLY 120 / HAWK 121 / ALBATROSS 122 | f2 | — | — | MISSING | aircraft |
| CAYMAN 125 / ALLIGATOR 126 / SUBMARINE 127 | f2 | — | — | MISSING | naval |
| WASP 170, LEVIATHAN(KODOMASH-id 172 slot) 172, GATLING 173, SALAMANDER 174, COIL_TANK 175 | f2 heroes | `wasp`,`leviaphan`,`gatling`,`salamander`,`coiltank` | stand-in chassis (10 of 12) | PARTIALLY CONFIRMED | hero prefabs provably absent from package (server-delivered); `salamander` maps to missing `f2_veh_typhoon.glb` → silent procedural fallback (**asset bug**) |
| HeroTypes: CERBER 1 | f1 | `cerber` | f1_hero_cerber GLB | PARTIALLY CONFIRMED | melee + invented crit (B5) |
| HeroTypes: ATLAS 4, MOLE 5, BEHOLDER 6, PSITANK 7, SOLARIS 8, CODOMASH(—) | f1/f2 | `atlas`,`mole`,`beholder`,`psitank`,`solaris` / — | stand-ins | PARTIALLY CONFIRMED / MISSING (codomash) | Mole = weakest-evidence hero; codomash recorded "future pass" |
| (audio roster) InfFlame, VehSpec, AviaFighter/Bomber, NavLight/Heavy/Amphibian, NavAlligator/Barracuda/Cayman | f1/f2 | — | — | MISSING | corroborates 15-per-faction base roster |

Chassis provenance note: `f1_hero_cerber.glb`/`f1_hero_seraphim.glb` are recorded in worklog
Task 17 as pipeline-assembled, while `hero-prefabs-10-remaining.md` states no hero chassis
prefabs exist in the package; the exact source of these two GLBs is not recorded in
`pipeline/` — treat their 1:1 status as **unverified**.

Non-roster unit behaviors:

| Behavior | Status | Evidence / gap |
|---|---|---|
| Order/task layer (idle/move/attackMove/capture + spec tasks) | PARTIALLY CONFIRMED | field-level mapping (`task/obj/objPreferred/orient/flag_shoot`) [DECOMP]; transition numbers tuned |
| Gradual hull rotation | CONFIRMED (semantics) | `orient/orient_dest` + `UnitStateType.rotate` |
| Aim-on-new-target reset | PARTIALLY CONFIRMED | `aiming` field native; aim times tuned (0.25/0.4/0.3 s) |
| Guard return-to-post | PARTIALLY CONFIRMED | `idled/last_action_tick` semantics; tether 4.0 tuned |
| Garrison (bunker) | PARTIALLY CONFIRMED | Bunker=14 task [DECOMP]; cap 3 tuned |
| Vehicle transport | MISSING | no native analog implemented |
| Aircraft hover/orbit | PARTIALLY CONFIRMED | hold-orbit is VISUAL-ONLY in browser; kinematics unknown |
| Aircraft rebase/airfield | MISSING | §5.B |
| Capture (depots) | PARTIALLY CONFIRMED | capture task exists; times 5 s/9 s have **no native evidence at all** |
| Upgrades/research | MISSING | — |
| Faction differences | PARTIALLY CONFIRMED | roster split CONFIRMED; per-faction stat/bonus differences unknown (server) |

### 5.E Buildings

No native `BuildingType` id/roster table exists in the evidence (only stat classes and
method names — `methods_building.txt`), so the browser's 9 building entries are
**model-evidenced but id-evidence-absent**: neither "missing" nor "invented" can be
established against the original roster.

| Building | Browser | Status | Evidence / gap |
|---|---|---|---|
| HQ | `hq` (4200 hp) — never removed on death (win check) | PARTIALLY CONFIRMED | field map Health/Price/View native; numbers tuned |
| Depot (capture point) | neutral×3, income+CP | PARTIALLY CONFIRMED | SupplyDepotIncomeStat class [NATIVE]; values tuned |
| Barracks / Factory / Heavy factory | build+produce chain | PARTIALLY CONFIRMED | GLBs authentic; prereq chain is browser-designed (native prereqs unknown); times tuned |
| Power plant | income/CP bonus stand-in (`powerIncome/CP=2`) | APPROXIMATE | native `EnergyProduction/15` + **`EnergyNeed/16` unmodeled — no power drain/shortage** |
| Turret | weapon + AA targeting + rotating bone | PARTIALLY CONFIRMED | mechanics present; stats tuned |
| Bunker | garrison + crew weapon | PARTIALLY CONFIRMED | `ClientBunkerWeapon` [DECOMP] |
| Hero building | `herobld` | APPROXIMATE | native analog unrecovered |
| Construction | instant-pay + timed build (10–26 s), scale-grow + progress ring, `bld_start/end` | PARTIALLY CONFIRMED | `ConstructionTime/12`, `ConstructionRadius/11`, `BuildingSize/17` native fields exist; browser radius rule `br+10.5` tuned; **no builder units, no cancellation** |
| Placement rules | `canPlace`: own-built radius + grid/unit clear + bounds | APPROXIMATE | native rules unknown |
| Rally / repair / upgrade | — | MISSING | §5.B |
| Damage states / smoke / fire | frac<0.3 → fire + creak; scorch on removal | APPROXIMATE | presentation-level; native damage-state model unknown |
| Faction variants | f1 buildings only (9 `f1_bld_*.glb`); f2 reuses | UNKNOWN | no evidence either way |

### 5.F Economy

| System | Original behavior | Browser implementation | Status | Evidence | Confidence | Gap |
|---|---|---|---|---|---|---|
| Currency model | Credits + Uranium (`PriceUranum/3`) + InitialResourceReserve/47 cap 2500 [NATIVE keys] | single `funds` pool; no uranium; no initial-reserve modeling [BROWSER] | PARTIALLY CONFIRMED (keys) | estat.json; estat-stat-models §7 | HIGH | resource types missing |
| Income | `SupplyIncome/14` via HqSupplyIncomeStat + SupplyDepotIncomeStat [NATIVE classes] | `income = 14 + depots·11 + power·2` per second [BROWSER] | PARTIALLY CONFIRMED | stat classes CONFIRMED; values tuned; cap 250 recovered | MEDIUM | cadence/quantization native unknown |
| Command points | `CommandPointsProduce/13`, cap 10 [NATIVE] | `cpCap = 10 + depots·4 + power·2`; cpUsed = units+queued [BROWSER] | PARTIALLY CONFIRMED | baseCP=cap coincidence unverifiable | MEDIUM | — |
| Energy | `EnergyProduction/15`, `EnergyNeed/16` [NATIVE] | power plant flat bonus; **no consumption/shortage** [BROWSER] | APPROXIMATE | estat keys | HIGH | EnergyNeed unmodeled |
| Production costs/refunds | server tables | deduct-on-accept; **no refunds/cancel** [BROWSER] | APPROXIMATE | queue max 8 rejection only | LOW | — |
| Capture income | depot ownership → income/CP [BROWSER design] | depots captured by units, decay while contested | PARTIALLY CONFIRMED (structure) | captureTimeNeutral/Enemy 5/9 s: **no native evidence** | LOW | — |
| Victory economy | unknown | last HQ(-team) standing [BROWSER] | APPROXIMATE | FFA + 2v2 rules documented; native win rules for modes unknown | LOW | — |
| Stat caps | 72-entry BaseMax/FirstMax/MegaMax tier table [NATIVE] | ported verbatim (`maxStatCap`), 37 vectors [BROWSER] | CONFIRMED | estat-tiers.txt | HIGH | upgrade/mega-tier growth not modeled |

### 5.G Movement & pathfinding

| System | Original behavior | Browser implementation | Status | Evidence | Confidence | Gap |
|---|---|---|---|---|---|---|
| Pathfinding | server-side; client fields (`walk_state`, cross-tile `walk_dx/dy`, `wait_for_moving`, `forced`) prove tile-walking + slot system [NATIVE fields] | A* 8-dir octile + binary heap + corner-cut prevention + LOS string-pulling + nearestFree retarget (60k node budget) [BROWSER] | APPROXIMATE | unit-state-machines §"Not reconstructed"; takepos occupancy decode | MEDIUM (structure) / LOW (parity) | original algorithm unrecoverable from client |
| Steering & avoidance | unknown | per-tick move, waypoint pop < 0.25 tile, axis-sliding + re-path fallback (0.5 s cd) [BROWSER] | APPROXIMATE | game.js L1740–1777 | LOW | — |
| Unit–unit collision / slots | slot micro-management CONFIRMED present [NATIVE fields] | **none** — units overlap [BROWSER] | MISSING | B7 | HIGH | — |
| Formation | server slots (`SendUnitsMove` slots) [INFER] | deterministic ring spread at issue time (8/ring) [BROWSER] | APPROXIMATE | game.js L704–706 | LOW | — |
| Speed | `speed/speed_init/accelerate` fields [NATIVE] | constant per def ×0.45 grounded-air; **no acceleration curve** [BROWSER] | PARTIALLY CONFIRMED | fields native; values tuned; accelerate unmodeled | MEDIUM | — |
| Rotation | gradual at `rotate` rad/s [NATIVE] | `updateRotation` 10/3.2/4.5 rad/s by kind; movement NOT gated on facing [BROWSER] | PARTIALLY CONFIRMED | semantics native; movement-gating difference documented | MEDIUM | — |
| Terrain constraints | bridges/water/walkability exist (naval roster) [INFER] | grid blocks rock decor ≥1.1w + border only; **water non-blocking**; no slope limits [BROWSER] | APPROXIMATE | genTerrain L500–545 | HIGH (gap) | B8 |
| Attack-move / guard / patrol / forced | `AIComm` family + `Forced=1` dispatch [DECOMP] | all implemented with tuned radii; forced-move used by takepos dispatch [BROWSER] | PARTIALLY CONFIRMED | takepos-native.txt | MEDIUM | — |
| Aircraft movement | fly-over terrain [INFER] | airborne bypasses grid; hover altitude visual; grounded 0.45× [BROWSER] | APPROXIMATE | — | LOW | — |
| Stop behavior / move-cancellation | TASK_WAIT [DECOMP] | stop clears order/path [BROWSER] | PARTIALLY CONFIRMED | — | MEDIUM | — |

### 5.H AI

The native AI (GAI) is server-side; the client carries only the command vocabulary (753
`GAI_*`/`AIComm*` names recovered [EXT→verified]). No runtime AI decision logic is visible
in the binary. Every browser AI behavior is therefore a design, not a recovery.

| System | Original | Browser | Status | Confidence | Gap |
|---|---|---|---|---|---|
| Construction decisions | UNKNOWN (server) | scripted ladder: barracks→power→factory→heavy(t>100)→turret(t>150/280)→bunker(t>340)→hero(t>200), spiral placement [BROWSER] | APPROXIMATE | MEDIUM | no native reference |
| Production decisions | UNKNOWN | weighted roster + counter-responses (anti-vehicle→iheavy/mammoth; anti-inf→sniper; anti-heli→porcupine) [BROWSER] | APPROXIMATE | MEDIUM | — |
| Defense | UNKNOWN | HQ-threat radius 14 recall / 40 release [BROWSER] | APPROXIMATE | LOW | — |
| Attack waves | UNKNOWN | idle-army ≥ waveSize (5→+2/cycle, cap 14) → attackMove HQ [BROWSER] | APPROXIMATE | LOW | — |
| AI via command layer | GAI emits AIComm messages [DECOMP] | AI issues player commands through own Commands (deterministic; journal-verified after live-QA fix) [BROWSER] | CONFIRMED (architecture) | HIGH | — |
| AI RNG | unknown | mulberry32(seed ^ imul(me,0x9E3779B9)) [BROWSER] | PARTIALLY CONFIRMED (internal determinism) | HIGH | native RNG unknown |
| Difficulty | native difficulty settings unknown | none [BROWSER] | UNKNOWN + MISSING | MEDIUM | — |
| Anti-air / aircraft response | unknown | emerges from targeting weights only | APPROXIMATE | LOW | — |
| GAI vocabulary | 753 command names [EXT, 146/146 constants verified] | not implemented as interpreter; used as documentation map | UNKNOWN (behavior) | MEDIUM | server-side; likely observation-only |

### 5.I Maps / terrain

| System | Original | Browser | Status | Evidence | Confidence | Gap |
|---|---|---|---|---|---|---|
| Map geometry & objects | extracted jungle map prefab | `map.json` 6,371 placements / 392 meshes, byte-identical to pipeline export (`370ca7ac…`) [NATIVE asset] | CONFIRMED (this map) | export_map.py; sha-verified | HIGH | single map only (B3) |
| Terrain meshes | land_chunk instances | 26 land_chunk GLBs; procedural ground hidden when real map loads [BROWSER] | CONFIRMED | applyRealMap L36703–36768 | HIGH | — |
| Heightmap | derived from extracted land chunks | 256² rasterization (`export_heightmap.py`), bilinear `heightAtWorld`, Y placement only (sim stays 2D grid) [BROWSER-derived] | PARTIALLY CONFIRMED | meta {x0:-84…, hscale:1.0} | MEDIUM | not a sim constraint |
| Decor | original decorations_jungle/desert/common | 813 GLBs incl. per-mesh variants; 124 `map_real` extras | CONFIRMED | pipeline provenance | HIGH | — |
| Water | native water domain (naval) [INFER] | render-only plane 560×560, animated UVs, no reflections; **not in sim grid** [BROWSER] | APPROXIMATE | L36770–36785 | HIGH (gap) | B8 |
| Walkability/collision | native walkability rules unknown | rock decor + border + building footprints only [BROWSER] | APPROXIMATE | — | MEDIUM | bridges decor-only |
| Spawns / capture points | unknown | fixed per-seat layouts + 3 depots at center/edges [BROWSER] | APPROXIMATE | SEAT_SPAWN_TEAM documented | LOW | — |
| Camera bounds | unknown | map-clamped pan [BROWSER] | APPROXIMATE | — | LOW | — |
| Map pool / missions | map list + missions exist [EXT leads] | one skirmish map | MISSING | B3 | MEDIUM | — |

### 5.J Visual fidelity

| Area | Original | Browser | Status | Evidence | Confidence | Gap |
|---|---|---|---|---|---|---|
| Asset availability | original APK | 30 skeletal GLBs + clips, 813 decor, atlases, card art, emblems, WAVs [NATIVE assets] | CONFIRMED | pipeline/README; GLB inventory | HIGH | hero chassis ×10 stand-ins; 2 GLB provenance unrecorded |
| Asset selection | per-unit prefabs | `UNIT_MODEL` map; salamander→missing GLB → **silent fallback** (bug) [BROWSER] | PARTIALLY CONFIRMED | game.js L35597 | HIGH | fix mapping |
| Placement | real map transform hierarchy | per-placement InstancedMesh w/ Unity→GLB quaternion fix (double-rotation fixed, worklog:1040) | CONFIRMED | map.json | HIGH | — |
| Materials | Unity shaders (unknown) | MeshStandardMaterial, sRGB out, Linear tone ×1.14 | APPROXIMATE | renderer L36420–36457 | LOW | original shader graph unknown |
| Lighting | unknown | hemi 1.95 + sun 2.0 + fill 0.55 + boom PointLight | APPROXIMATE | — | LOW | — |
| Shadows | unknown | PCF 2048², ortho ±46, follows camera | APPROXIMATE | — | LOW | — |
| Post-processing | unknown (Unity stack) | **none** | UNKNOWN (native) / MISSING (browser) | grep: no EffectComposer | MEDIUM | — |
| Water rendering | unknown | animated-UV standard material, transparent 0.92 | APPROXIMATE | — | LOW | no reflections/refraction |
| Sky | unknown | none (clear color + FogExp2-style linear fog 170–560) | UNKNOWN / MISSING | — | LOW | — |
| VFX | 513 shot-VFX prefabs, families bul_/fire_/boom_/hero_/eff_ [NATIVE catalog] | generic sprite system with **family-accurate tokens** (`boom_expl{1..5}_s{n}_{ground|water}`), heuristic sub-variants [BROWSER] | PARTIALLY CONFIRMED | vfx-catalog-families; AOW3_VFX_TAXONOMY L36353 | MEDIUM | per-family prefabs not rendered; smoke/flash composites approximated |
| Animation | original AnimationClips | mixers per unit, fire/move-shoot/death wiring, rotor spin; **no blend trees, per-frame update all units** | PARTIALLY CONFIRMED | clips native; playback strategy browser | MEDIUM | blending/timing fidelity unverified |
| Camera | original camera params unknown | fixed steep ~65° pitch, no rotation, zoom 9–64, WASD/edge-clamp pan | APPROXIMATE | L36927–36933 | LOW | original angle/rotation/edge-scroll unknown |
| Minimap | original minimap unknown | 172² canvas @6 Hz, fog, radar sweep, frustum quad, click-jump, right-click order | APPROXIMATE | L38092–38175 | LOW | original behavior unknown |
| Resolution / aspect | original fixed mobile orientation | free aspect, FOV 38, DPR cap 2; **no 4:3/16:9 letterboxing** | APPROXIMATE | index.html viewport | MEDIUM | presentation parity unverified |
| Scorch/decals | unknown | scorch pool cap 46, 24 s fade | APPROXIMATE | — | LOW | — |

### 5.K UI / HUD

| Element | Browser | Status | Gap |
|---|---|---|---|
| Main menu | recreated (menu-bg/persons art + CSS) [BROWSER] | APPROXIMATE | original layout unmeasured |
| Battlefield HUD (resources, CP, clock) | recreated with original icons (`ico-credits`, `ico-cp`) | PARTIALLY CONFIRMED (assets) | layout/behavior recreated |
| Production UI | per-faction card PNGs (original art) + procedural hero portraits; producer gating; MaxStat tier bar in selection panel | PARTIALLY CONFIRMED | queue interaction (cancel) missing |
| Selection info | name/veteran chevrons/hp/DMG-RNG-ARM + tier-cap bar | PARTIALLY CONFIRMED | veterancy labels invented |
| Notifications | floating world text + hints | APPROXIMATE | no toast queue/ping system |
| Victory/defeat | verdict + stats table; team-aware (2v2) | PARTIALLY CONFIRMED | — |
| Pause / settings / volume | **none** | MISSING | — |
| Control groups | **none** | MISSING | — |
| Fonts/icons | system-ui fonts; icons/cards original PNGs | PARTIALLY CONFIRMED | original font not shipped |
| MP lobby | #mp panel: xp/seats/mode/broker/code/status; desync banner; live dot | APPROXIMATE | functional, not original (original netcode UI unknown) |
| Mobile UI | same HUD; @media 820 px tweaks; scrollable cards | APPROXIMATE | no dedicated mobile HUD |

### 5.L Audio

| Area | Browser | Status | Gap |
|---|---|---|---|
| Weapon/impact/explosion SFX | 42 original WAVs (`w_cannon*`, `b_big*`, …) via heuristic pools [NATIVE assets] | PARTIALLY CONFIRMED | per-weapon native mapping unknown |
| Construction/UI/build SFX | original files wired to build/click events | PARTIALLY CONFIRMED | — |
| Announcer | `ann_victory/defeat/built/ready` wired; **7 cues loaded-but-untriggered** (`ann_enemy`, `ann_base_attack`, `ann_captured`, `ann_flag_lost`, `ann_flags_lost`, `ann_arrived`, `ann_achievement`) | PARTIALLY CONFIRMED | missing trigger wiring |
| Music | **none** | MISSING | original music not extracted/reproduced |
| Ambient | procedural wind + birds [BROWSER substitute] | APPROXIMATE | original ambient not used |
| Positional mixing | distance vol^1.35, stereo pan, lowpass, >30 m echo, 28-voice cap [BROWSER-engineered] | APPROXIMATE | native mix unknown |

### 5.M Fog of war / visibility

| System | Browser | Status | Evidence / gap |
|---|---|---|---|
| Visibility model | per-seat `visible[]` + `explored[]` discs from unit/building view radii; team-shared OR; spectate flood | APPROXIMATE | native visibility rules unknown (server); disc model is a design |
| Sight radius | `def.view` per entity, tuned | PARTIALLY CONFIRMED (field `sight` native in UnitStateType) | values tuned |
| Hidden units / detection | hide (spec bit 17) + `HIDE_DETECT=2.5` | PARTIALLY CONFIRMED | radius tuned |
| Fog rendering | blurred canvas overlay (unexplored α195 / explored α74) + minimap darkening + input gating | APPROXIMATE | presentation |
| Aircraft visibility | treated as normal visibles | APPROXIMATE | native air-visibility rules unknown |
| AI visibility | AI reads full sim (no fog constraint) | APPROXIMATE | native AI sight unknown |
| Network visibility | **full sim state present in every lockstep client; `visible[]` is view-side only** | PARTIALLY CONFIRMED (desync-safe) | hidden information leaks to memory inspection; server-authoritative fog is the original model (§5.Q) |

### 5.N Data fidelity — classification

The charter's five-way split, per data surface:

| Data surface | Structurally recovered | Numerically recovered | Backend supplied (absent) | Browser tuned | Unknown |
|---|---|---|---|---|---|
| EStat enum + categories | 78/78 ids+names, 5/5 categories | — | all *values* | — | — |
| Weapon schema | 27/27 fields + offsets | — | all weapon numbers | browser fills all 29 configs | — |
| Unit ids / factions | 43 UNIT_IDs, HeroTypes 13, f1/f2 ranges | — | prototype tables | 28 defs' ~10 stats each | — |
| Stat models | 45/45 class→EStat bindings | 72-entry tier table (BaseMax/FirstMax/MegaMax) | live balance | — | — |
| Accuracy constants | branch structure + 100/1000/10⁴/10⁶/decr | formula constants themselves | per-weapon inputs | `explosionDecr:30`, clamps 0.15/0.98 | — |
| Buildings | field map only (Health/Price/CT/View) | — | roster ids | all 9 defs' numbers | native roster |
| Economy | EStat keys 13/14/15/47 + caps 10/250/250/2500 | caps only | income/CP values | all 8 econ numbers | cadence |
| Heroes | 13 HeroTypes, ability EStat keys 51–57 | tier caps | chassis prefabs, ability params | all ability numbers | codomash mechanics |

**Verdict:** the identifier/schema/taxonomy layer is essentially fully recovered and
test-locked (data-model 379 assertions, byte-identical fixture); the numeric layer is
100% browser-tuned with the exception of the native *caps* table. This is the cleanest
possible statement of B1.

### 5.O Rendering / performance

| Area | Finding | Status / risk |
|---|---|---|
| Loop architecture | single rAF; sim accumulator 8-step budget; HUD 6 Hz; fog 5 Hz refresh | CONFIRMED healthy |
| Unit draw cost | one cloned mesh hierarchy per unit + 4–5 helper sprites; **no unit instancing** | scale risk beyond ~100 units |
| Animation cost | `mixer.update(dt)` for every visible unit every frame (dying included); no LOD/throttle | scale risk |
| Particles | `fxSprites` unbounded (booms/pops capped 500; scorch 46); float sprites spawn per-frame without dedup (L38004) | leak-ish churn risk |
| Sim complexity | O(n²) scans (findTarget, aggro, projectiles) at 20 Hz | scale risk |
| Decor/map | per-template InstancedMesh, frustumCulled=false | CONFIRMED strong |
| Shadows | 2048² PCF single cascade | acceptable; mobile cost untested |
| Loading | 14-concurrency GLB batches + `#baking` progress | healthy |
| Mobile perf | DPR cap 2; no measurement exists | UNKNOWN — no stress data (dev plan Phase 23 not run) |

### 5.P Mobile / input

| Area | Browser | Status | Gap |
|---|---|---|---|
| Mouse/keyboard | L-drag select, R-click order, ctrl+R attack-move, S stop, V land/depart, WASD pan, wheel zoom, double-tap type-select | PARTIALLY CONFIRMED (functional; original bindings unknown) | — |
| Touch | Pointer Events + capture; long-press 420 ms order; pinch zoom 6.5–46; drag 12 px box select; conflict handling | PARTIALLY CONFIRMED | one-finger pan absent (pan = middle/shift only) |
| Minimap input | click jump; right-click order | PARTIALLY CONFIRMED | — |
| Building placement | ghost preview + validity + click-place | PARTIALLY CONFIRMED | — |
| Mobile presentation | responsive-lite; no orientation handling; no 4:3 letterbox | APPROXIMATE | original mobile UX unmeasured |
| Touch hitboxes | pick-radius based | APPROXIMATE | — |

### 5.Q Multiplayer readiness (audit only — no implementation)

The charter's chain *client → commands → authoritative simulation → validated state →
replication*, checked against v=46 reality:

| Check | Verdict |
|---|---|
| Deterministic simulation | **YES, proven** — 88 lockstep vectors, replay 45/45, live 4-tab bit-identical checkpoints (Task 38 QA: `20:8f374f2f, 40:0395f566, 60:d5f8d659, 200:7b229af5, 220:36e2fe76` across 4 tabs) |
| Command serialization | JSON per-slot frames; PROTO 4 gate; (tick,seq) journaling; INPUT_DELAY=3 scheduling |
| State hashing | 1 Hz per-slot fnv1a exchange, every peer vs every seat; **blind spots: mines, `_chain`** |
| Authoritative boundaries | **NONE — P2P lockstep; the original is server-authoritative.** No server validation; clients are trusted |
| Hidden information | **LEAK** — full sim state lives in every client; `visible[]` is view-side; a cheating client can read enemy positions/orders from memory |
| Client trust | inputs validated only against local sim rules (funds/producer/placement); no identity, no rate limits |
| RNG | shared seeded mulberry32, hash-covered — lockstep-safe |
| Replayability | full (journal + hashes + terrain fingerprint) |
| Snapshot possibility | JIP input-archive replay already implemented (welcome → 90-step/frame catch-up → live) |
| Lockstep | implemented: 2–4 seats, unlimited spectators, team modes, seat reclaim, stall vacate (6 s), rematch via matchGen |
| Simulation isolation | sim kernel marker-isolated (L211–3416), DOM-free, vm-extractable (tests prove it) |
| Renderer isolation | proven read-only |
| Blockers to production MP | rAF-coupled pump (background tab freezes all peers — freeze-not-desync), banner-only desync (no resync/rollback), PeerJS P2P only, no server authority/validation/identity, hidden-info leak, hash blind spots |

### 5.R Rust / Wasm readiness (audit only)

| Coupling check | Verdict |
|---|---|
| Renderer deps inside sim | none — kernel writes no view state; FX timers ride the tick but are hash-excluded |
| DOM/browser globals in sim | none in kernel (tests run it in a bare `vm` sandbox with `globalThis` shims) |
| Nondeterminism | `Math.random` absent from sim; no wall-clock reads in sim (sim.time advanced by fixed dt) |
| Float sensitivity | all positions/quantities are JS doubles; hash quantizes at 1/100 tile (detection, not prevention). **No fixed-point/rounding policy exists** — the roadmap §7 gate (native/Wasm parity) is not yet satisfiable |
| Timing deps | bounded catch-up is defined behavior; `acc` carries over (documented) |
| State coupling | `sim.viewSlot/spectate/visible[]/explored[]` are per-client fields living inside the sim object (hash-excluded) — mild impurity to clean before porting |
| UI coupling | input adapters → typed commands only; selection is id-lists |
| Asset coupling | `docs/data/*` are node-loadable (`globalThis`); sim consumes plain objects |
| Command schema versioning | commands are ad-hoc JS objects with string types; PROTO gates transport, but **no versioned command/state schemas** (roadmap Step C outstanding) |
| Smallest practical first PoC | the pure formulas block (game.js L1–209: `armorFactor`, `effectiveDamage`, `weaponStaticAccuracy`, `weaponDynamicAccuracy`, `hitChance`, `rankTier`) — already evidence-locked and covered by 13 test vectors; port + parity-test those first, then the stat-cap table (37 vectors) |

---

## 6. Gap Priority Register

P0 = critical 1:1 blocker · P1 = major fidelity gap · P2 = medium · P3 = minor/polish ·
P4 = future/platform work.

| ID | Pri | Gap | Category | Status | Evidence anchor |
|---|---|---|---|---|---|
| B1 | **P0** | All gameplay numbers tuned; native balance server-delivered | data/economy/combat | APPROXIMATE | unit-roster note; data-model-extraction §3 |
| B2 | **P0** | Naval, fixed-wing, Firebat, Cyclone, Nuclear, Commando, Kodomash absent (16 concepts) | units | MISSING | unit-type-ids.json; roster note |
| B3 | **P0** | Single map; no map pool/missions | maps | MISSING | export_map.py; EXT leads |
| B4 | **P0** | Live damage application unverifiable (no client consumer of curve) | combat | UNKNOWN→APPROXIMATE | damage-pipeline §3.5 |
| B5 | **P0** | Invented mechanics vs confirmed native absence (crit; falloff; veterancy mods; heal-aura-Shield) | combat | APPROXIMATE/CONFIRMED-divergence | combat-stats §8; weapon-type-surface |
| B6 | **P0** | Native tick rate/timing grid unrecovered (20 Hz is an assumption) | simulation | UNKNOWN | FIRE_TICK_LENGTH=4 anchor |
| B7 | **P0→P1** | No unit–unit collision/path-slot system | movement | MISSING | unit-state-machines §Not-reconstructed |
| B8 | **P1** | Water non-blocking; no naval domain | movement/maps | MISSING | genTerrain; naval roster |
| G1 | **P1** | Production cancellation/refunds missing | commands | MISSING | Commands.execute |
| G2 | **P1** | Building rally point missing | commands/buildings | MISSING | command-system note |
| G3 | **P1** | Repair missing | commands/buildings | MISSING | command-system note |
| G4 | **P1** | Building/unit upgrade systems missing | commands/units | MISSING | command-system note |
| G5 | **P1** | Aircraft rebase/airfield network missing (land/depart only) | commands/units | APPROXIMATE | command-system note |
| G6 | **P1** | Energy need/consumption unmodeled (power has no downside) | economy/buildings | APPROXIMATE | EStat 16 |
| G7 | **P1** | Uranium / second resource + initial reserve unmodeled | economy | MISSING | EStat 3, 47 |
| G8 | **P1** | Vehicle transport missing | units | MISSING | roster/behavior audit |
| G9 | **P1** | Acceleration curves unmodeled (instant velocity) | movement | APPROXIMATE | `accelerate` field |
| G10 | **P1** | Trajectory types/gravity unmodeled (artillery arc fake) | combat | PARTIALLY CONFIRMED | weapon-schema fields |
| G11 | **P1** | Burst data dormant (no shotCount anywhere) | combat | PARTIALLY CONFIRMED | weapons.js |
| G12 | **P1** | Full `aiming` 6-class target mask reduced to antiAir boolean | combat | PARTIALLY CONFIRMED | weapon-type-surface note |
| H1 | **P2** | Hash blind spots: `sim.mines`, `u._chain` not in stateString | simulation | PARTIALLY CONFIRMED | stateString L670–694 |
| H2 | **P2** | Hold-vs-stop native distinction approximated | commands | PARTIALLY CONFIRMED | phase5-missions note |
| H3 | **P2** | Capture times 5 s/9 s have zero native evidence | economy/units | UNKNOWN | factions.js |
| H4 | **P2** | Fog/visibility rules a design (radii tuned) | fog | PARTIALLY CONFIRMED | sight-visibility-native-analysis (R7 pass 2: 3-state fog, packed bitmaps, fogLines row-extent tables; table bytes pending pass 3) |
| H5 | **P2** | Turret slew (`rotate_diap/speed`) render-only; hull-arc fire gate stand-in | combat | PARTIALLY CONFIRMED | unit-state-machines §3 |
| H6 | **P2** | Building prereq chain browser-designed | buildings | APPROXIMATE | factions.js |
| H7 | **P2** | Post-processing/sky/material/lighting parity unknown | rendering | UNKNOWN | — |
| H8 | **P2** | Camera behavior (angle/rotation/edge-scroll) unmeasured | rendering/input | APPROXIMATE | — |
| H9 | **P2** | UI layout unmeasured vs original (fonts, panels, scaling) | UI | APPROXIMATE | dev plan Phase 18 |
| H10 | **P2** | Difficulty settings absent | AI | MISSING | AI audit |
| H11 | **P2** | Veterancy/upgrade growth (mega tiers) unmodeled | units/economy | MISSING | estat tiers |
| M1 | **P3** | 7 announcer cues loaded but untriggered | audio | PARTIALLY CONFIRMED | Sfx load list |
| M2 | **P3** | Music missing | audio | MISSING | — |
| M3 | **P3** | Weapon→sound mapping heuristic | audio | APPROXIMATE | Sfx pools |
| M4 | **P3** | Salamander → missing GLB silent fallback (bug) | assets | PARTIALLY CONFIRMED | game.js L35597 |
| M5 | **P3** | Control groups / pause / settings / volume missing | UI | MISSING | — |
| M6 | **P3** | One-finger camera pan absent on touch | input | APPROXIMATE | input audit |
| M7 | **P3** | Per-frame float-sprite churn (no dedup) | rendering | risk | L38004 |
| P1r | **P4** | No authoritative server; hidden info in every client; client trust model absent (multiplayer) | multiplayer | MISSING (by scope) | §5.Q |
| P2r | **P4** | No fixed-point/parity policy; no versioned command schemas (Wasm prep) | architecture | MISSING | roadmap §7/Step C |
| P3r | **P4** | Perf headroom (unit instancing, mixer throttle, O(n²) scans) unproven at scale | rendering/sim | UNKNOWN | §5.O |
| P4r | **P4** | Accounts/persistence/matchmaking/ranked — not started (out of offline-1:1 scope) | platform | MISSING | roadmap Phases I–K |

---

## 7. Reverse Engineering Needed Next (ranked)

| # | Question | Why it matters | Likely evidence | Relevant native classes/functions | Existing evidence | Missing evidence | Recommended method |
|---|---|---|---|---|---|---|---|
| R1 | What are the actual per-unit/per-weapon balance numbers? | Converts B1; makes damage/TTK/econ 1:1-checkable | Live prototype tables at runtime | `WeaponStatsFactory.<CreateStats>d__18.MoveNext`, `MineStatsFactory.CreateList`, prototype/UnitType loaders | schema + caps only (estat-tiers) | every value | **Frida runtime hooks** on the factories/prototype init on-device; or HTTPS MITM of the balance backend; dump → JSON → re-import `docs/data` |
| R2 | Obfuz pool plaintext values (task ids, `$ce` threshold, siege DEN/stage fractions, `set_FlagShoot` value) | Converts last MEDIUM pool-dependent decodes to CONFIRMED | Pool ciphertext exists only in device memory | `$GOA/$mOA`, builders 0x497F474/0x497F82C, wrapper 0x5264EA8 | VM+key cracked; 697/697 triples; **Build H (Task 39): portable two-command decode — committed key `reverse/tools/obfuz_secret_key.bin`, runbook `reverse/evidence/obfuz/on-device-run.md`, clean-sandbox re-validated** | ~~the one device run~~ **RESOLVED by R2 (Task 42): static decode complete — 697/697 values, 0 device** — `reverse/tools/obfuz_static_decode.py` -> `reverse/evidence/obfuz/obfuz-pool-values.json` (DEN=1000, DontShoot=8, $ce=3, set_FlagShoot=-1; see obfuz-pool-emulation.md §9) |
| R3 | What is the native tick rate? | Anchors all timing (B6); validates 20 Hz | Client tick pacing / network cadence | `FIRE_TICK_LENGTH=4`, `shot_tick[]`, `senderTick` | tick-grid existence | rate + phase | on-device frame/tick instrumentation; or statistical analysis of native match network traffic |
| R4 | How is damage applied per hit (cadence, ordering, rounding)? | Validates `applyHit` reconstruction (B4) | live-sim events (server) | damage pipeline consumers | pipeline ends at UI (§3.5) | application semantics | controlled device experiments (Phase 24 scenarios A/B), frame-stepped video vs browser replay |
| R5 | `$Pg` per-branch micro-logic (44,684 B) | Exact leash/defend/return behavior | full disasm exists | `$Pg`, UnitAct statics +0xC/+0x10 | 9 cmp-immediates; data-not-literal finding | branch-by-branch semantics | continue Capstone branch enumeration (Obfuz pool values now available — Task 42 — use them to pin branch constants) |
| R6 | TakePositions 15-bit cell-class per-bit semantics | Exact formation/placement rules | `UnitTakePositionsManager` decode | occupancy masks 0x215F/0xFEE0/0xFEFD | masks + category rules CONFIRMED | per-bit cell meanings | targeted disasm + on-device observation of placement orders |
| R7 | Native visibility/sight rules | Fog 1:1 (H4); matters for MP | `UnitStateType.sight/sight_curr` consumers | **pass 2 DONE (Task 54)**: 3-state fog, packed int[][] per-alliance bitmaps, fogLines row-extent tables, `$Ik`/`$ec` membership, drivers mapped (`evidence/vision/`) | architecture CONFIRMED `[DECOMP]` | fogLines table byte values | pass 3: Obfuz method-bridge emulation of `BattleSide.$iu` (offline; R2 technique family) |
| R8 | `m_bulletTrajectoryType` / `m_gravity` semantics | Real projectile arcs (G10) | weapon schema consumers | `WeaponType` fields 0x3C/0x3E | schema extracted | consumer logic | xref scan of field offsets in weapon/spawn code |
| R9 | Native client↔server battle protocol | informs authoritative-MP design (P4) | `AIComm*` serialization, connection classes | `SendCommand`, message factories, CRC flow | names + structure | wire format | on-device TLS-unpinning + traffic capture (if plain), or Frida message hooks |
| R10 | Original camera/UI metrics | measured UI/camera reconstruction (H8/H9) | device screenshots/video | — | none | measurements | screen-record device gameplay; measure HUD proportions/camera pitch per dev plan Phase 18/20 |
| R11 | Do naval/aircraft/hero prefabs exist in downloadable Addressables content? | B2 asset acquisition | `assets/aa/catalog.json` on device | catalog entries (vfx note proves access pattern) | APK-side absence proven | content-catalog presence | pull catalog + bundles from device storage; re-run `unpack_bundles.py` |

---

## 8. Browser Implementation Needed Next (ranked; **not implemented in this audit**)

| # | Verified original behavior | Current browser behavior | Implementation change (when approved) | Dependencies | Risk |
|---|---|---|---|---|---|
| I1 | No crit system; no splash damage falloff; no veterancy mods; Shield = shield mechanic | crit ×mul; linear falloff; ±8/5% mods; heal aura (B5) | remove/gate inventions; implement ShieldStrength/Radius when semantics known | R1 (values) | low (removal), medium (Shield) |
| I2 | (internal) hash should cover all gameplay state | mines + `_chain` unhashed | extend `stateString()`; re-baseline golden hashes | none | hash-churn across suites |
| I3 | — | salamander → missing `f2_veh_typhoon.glb` fallback | fix `UNIT_MODEL` mapping | none | none |
| I4 | production cancel/refund; rally; repair; upgrade exist as native commands | all missing (G1–G4) | add command types + sim handlers + UI; journal from day one | R1 for numbers | medium (determinism care) |
| I5 | water/naval walkability | water non-blocking (B8) | water layer in terrain grid; bridge walkability | B3/R11 for naval scope | medium |
| I6 | path-slot micro-management | units overlap (B7) | deterministic slot/separation system per recovered semantics | R5/R6 | high (determinism + perf) |
| I7 | burst rounds (`shot_count/shot_int`) | dormant machinery | wire values when captured | R1 | low |
| I8 | EnergyProduction/**EnergyNeed** | flat bonus, no shortage (G6) | consumption + brownout rules | R1/R7 for rules | medium |
| I9 | control groups, pause/settings | missing (M5) | UI + command plumbing | none | low |
| I10 | announcer events (enemy sighted, base attacked, flag lost…) | 7 cues silent (M1) | wire triggers to sim events | none | low |
| I11 | unknown (perf target) | per-unit clones, per-frame mixers, O(n²) scans | instancing/throttle/spatial index — **only after stress data** (Phase 23) | measurements | medium (behavior-neutral requirement) |
| I12 | (architecture) versioned schemas + clean boundary | ad-hoc command objects in monolith | extract kernel to own module; version commands/state | none | medium (mechanical) |
| I13 | server-authoritative MP with fog (P4 scope) | P2P lockstep, full state everywhere | server build of the same core (roadmap Phases G–H) | I12, R9 | high |

---

## 9. System Coverage Summary

Counting rule: every §5 matrix row counted once, under its **first-listed** status;
performance-risk rows (§5.O) are excluded from the five-status tally; compound rows
("UNKNOWN (native) / MISSING (browser)") count under the first-listed status.

| Category | Confirmed | Partial | Approximate | Missing | Unknown | Biggest blocker |
|---|---:|---:|---:|---:|---:|---|
| Simulation | 1 | 7 | 2 | 0 | 0 | B6 native tick rate; authority topology differs by design |
| Commands | 6 | 8 | 2 | 5 | 0 | production-cancel/rally/repair/upgrade missing |
| Combat | 7 | 10 | 7 | 1 | 0 | B1 values + B4 application + B5 inventions |
| Units | 13 | 14 | 0 | 11 | 0 | B2 roster holes; stats server-side |
| Buildings | 0 | 6 | 4 | 1 | 1 | no native roster evidence; EnergyNeed |
| Economy | 1 | 4 | 3 | 0 | 0 | B1 (all 8 numbers tuned) |
| Movement | 0 | 3 | 6 | 1 | 0 | B7 slots/collision; B8 water |
| AI | 1 | 1 | 5 | 0 | 2 | whole GAI behavior server-side |
| Maps | 3 | 1 | 4 | 1 | 0 | B3 single map; walkability |
| Rendering | 2 | 1 | 8 | 0 | 2 | pipeline parity unknown |
| Animation | 0 | 1 | 0 | 0 | 0 | blending/timing unverified |
| VFX | 0 | 1 | 0 | 0 | 0 | per-family prefabs not rendered |
| Audio | 0 | 3 | 2 | 1 | 0 | music missing; announcer wiring |
| UI | 0 | 5 | 4 | 2 | 0 | unmeasured reconstruction |
| Fog of war | 0 | 3 | 4 | 0 | 0 | native rules unknown |
| Mobile / input | 0 | 4 | 2 | 0 | 0 | mobile UX parity unmeasured |
| Multiplayer readiness | 8 | 2 | 0 | 3 | 0 | server authority + hidden-info leak (P4) |
| Rust/Wasm readiness | 7 | 1 | 0 | 2 | 0 | no parity policy; schemas unversioned |
| **Total** | **49** | **75** | **53** | **28** | **5** | (210 matrix rows) |

Plain-language reading: the project's *structural* reproduction (what systems exist and how
they behave mechanically) is far ahead of its *numeric* reproduction (what the numbers are)
and its *unverifiable* surfaces (everything the original keeps server-side). The 53
APPROXIMATE rows are dominated by tuned-value dependencies and by surfaces where the
original's parameters are simply not in the APK.

---

## 10. Recommended Execution Order

Adjusted from the charter's default sequence; the evidence justifies three changes:
(a) the deterministic regression suite already exists (step 11) — it must simply be kept
green and extended with each change; (b) runtime capture (R1) must precede combat
"value verification" that depends on balance values — R2 is no longer a runtime
dependency (resolved statically, Task 42: Obfuz pool 697/697 values, behavior
constants only, no device); (c) the simulation-boundary extraction
(12) is cheap and should precede the Rust PoC rather than follow UI polish.

1. **Fix/verify simulation architecture** — done and proven (§5.A); keep the accumulator,
   hash, and replay invariants under test with every change.
2. **Close critical reverse-engineering gaps** — R1 (runtime balance capture — the sole
   remaining device-blocked capture), R2 (Obfuz pool) DONE statically (Task 42: 697/697
   values, no device — behavior constants, NOT balance, NOT in the R1 pipeline),
   R3 (tick rate).
3. **Verify combat** — re-import native values when R1 lands; remove inventions (I1);
   validate application against device footage (R4). Owner-directed follow-up
   (2026-10-09): fold the R2-decoded constants into the Build E/F-derived browser models
   in a **future implementation task** — fire-discipline task semantics (DontShoot=8
   idempotence constant, $ce=3 task threshold, attack-order task=NONE write,
   set_FlagShoot=-1) and the per-mille siege accumulator (DEN=1000 milli-tick fixed
   point) — each fold-in carrying its own evidence diff, QA and test-vector delta.
   **Scoped (Task 44)**: full work breakdown, W1 bounded RE pre-step (task-gate
   polarity, band numerators, spec-applier interaction), determinism/serialization
   review and DoD in `reverse/notes/obfuz-constants-foldin-scope.md`.
   **FOLDED (Task 45)**: W1 resolved (0x14=3 HOLD_POSITION equality gate corrected;
   band numerators are runtime-derived formulas — 300/1000 kept as labeled
   reconstruction; no evidence-gated behavior change); `nativeTask` derived task +
   decoded-constants block + per-mille siege accumulator (SIEGE_DEN=1000) shipped;
   $Hi idempotence in the fire-discipline toggles; evidence
   `ce-constants-decode.txt`; tests 854 -> 877 (all suites green, replay/lockstep
   zero divergence).
4. **Verify unit/building state machines** — R5/R6 decodes → phase5-style vectors.
5. **Verify movement/pathfinding** — slot/collision system (I6), water (I5).
6. **Verify economy/production** — cancel/refunds/rally/repair/upgrade (I4), EnergyNeed (I8).
7. **Verify AI** — device observation baselines; difficulty; document as approximation until
   evidence exists.
8. **Verify maps/collision/fog** — map pool (R11/B3), walkability, sight rules (R7).
9. **Close visual/rendering gaps** — materials/lighting comparison vs device footage (R10).
10. **Close UI/audio gaps** — measured HUD reconstruction; announcer wiring; music.
11. **Deterministic regression suite** — exists (~820 assertions, green); extend per change,
    add native-value vectors when R1 arrives, fix hash blind spots (I2) first.
12. **Extract simulation boundary** — kernel module split + versioned command/state schemas (I12).
13. **Rust proof of concept** — formulas block (L1–209) + stat-cap table with parity vectors.
14. **Wasm parity** — only after a fixed-point/rounding policy exists (P2r).
15. **Server-compatible simulation** — same core natively (roadmap Step H).
16. **Authoritative multiplayer** — requires hidden-info fix and server validation (I13).
17. **Accounts/persistence** — roadmap Phases I–J.
18. **Matchmaking** — roadmap Phase J.
19. **Replays/ranked** — replay format versioning then rating (roadmap Phase K).

---

## 11. External FileUpload/AOW3 collection — provenance & verdict

The archives are **not accessible in this environment** (probed plausible roots; not found;
`git-lfs` absent so the in-repo XAPK is a pointer stub). Their contents were previously
downloaded from `github.com/nawaf-al-hussain/FileUpload` (directory `AOW3`), SHA-256'd,
extracted, inventoried, and audited in-repo:

- Inventory + per-archive hashes: `reverse/external/fileupload-aow3/manifest.md`
- Trust audit: `reverse/external/fileupload-aow3/audit-report.md`
- Verification vs 6.9.18: `reverse/external/fileupload-aow3/evidence/6.5.22/methods-vs-6.9.18-verification.txt`
- Version dossier: `reverse/versions/6.5.22-fileupload-collection.md`
- Conflict resolution: `reverse/evidence/conflicts/version-drift-6.5.22-vs-6.9.18.md`

Summary of that standing audit (restated, unchanged by this pass): all 7 archives derive
from **6.5.22 (versionCode 38820)** — a different version than this repo's 6.9.18; the
"source_code" label is rejected (jadx Java layer, no gameplay code); IL2CPP name lists
verified ~80.5% effective against 6.9.18; GAI constants 146/146; **no numeric balance data
anywhere in the collection**; provenance gap recorded (producing tool unrecorded). One
high-value cross-check worked exactly as designed — provenance block reproduced from the
conflict record:

```text
Source:         FileUpload/AOW3 (Curated analysis docs, 6.5.22-era)
Archive SHA-256: see manifest.md (all archives integrity-OK)
Extracted path: reverse/external/fileupload-aow3/evidence/6.5.22/
Game version:   6.5.22 (38820)
Finding:        "AttackCoeffCalculating / ARMOR_COEFF — DamageAfterArmor = Base × ArmorCoeff"
Cross-check:    0 hits in 6.9.18 dump.cs + stringliteral; native disassembly of the full
                armor surface shows a single 0.9/0.1 curve and arithmetic-free thunks
Confidence:     HIGH (claim REJECTED for 6.9.18)
```

Handling rule (unchanged): [EXT] material is leads and cross-version reference only; it never
overrides direct 6.9.18 native evidence and is never cited as evidence of absence.

---

## 12. Validation (tests actually executed during this audit)

Command: `node --test <suite>` in `reverse/evidence/tests/`, run 2026-10-08 against the
v=46 working tree. No code was modified during the audit; results are as observed:

| Suite | Result | Covers |
|---|---|---|
| `lockstep-jip.test.js` | **88/88 assertions passed, 0 failed** | 2P hashes, JIP catch-up, tamper detection, seat reclaim, stall vacate, rematch, 2v2 (PROTO 4) |
| `replay.test.js` | **45/45 PASS** (zero divergences after JSON round-trip) | bit-exact replay, tamper detection, 540-cmd journal vs 512 ring |
| `phase5.test.js` | **213/213 PASS** | min-range, patrol, garrison, hold, defend, bombard, fire discipline, takepos, hide, samespeed, siege, hash determinism |
| `commands-determinism.test.js` | **50/50 assertions PASSED** | unified Commands, seeded RNG, stateString/hash, journal |
| `data-model.test.js` | **379 assertions passed, 0 failed** | fixture equivalence, taxonomy 78/78, native ids, referential integrity |
| `stat-caps.test.js` | **37/37 vectors passed** | native tier table port |
| `accuracy.test.js` | **13/13 vectors PASS** ("all vectors pass") | recovered accuracy curves + clamps |
| `unit-fsm.test.js` | **29/29 vectors PASS** | shipped-kernel FSM behavior |

All eight suites green. Total observed: **854 assertions/vectors passing, 0 failing.**
These validate internal consistency and note↔code sync; per §4 item 14 they do not validate
parity with server-side original behavior.

---

## 13. Use of this document

- Treat §2 (blockers) as the working backlog's source of truth; §6 as the indexed register;
  §7/§8 as the ranked next investigations/changes; §10 as the sequencing.
- Update row statuses only with new evidence (a note file or a native decode), never with
  vibes. New evidence → new note in `reverse/notes/`, then re-grade the affected rows.
- This audit deliberately ships no code changes; its only artifacts are this file and the
  worklog entry (Task 40).


