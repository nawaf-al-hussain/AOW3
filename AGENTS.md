# AOW3 Agent Instructions

## 1. Mission

This repository is a browser-based recreation of the Android game **Art of War 3: Global Conflict (AOW3)**.

The objective is **not** to create an RTS inspired by AOW3.

The objective is to reproduce the Android game's:

* gameplay rules
* unit behavior
* building behavior
* combat
* economy
* movement
* targeting
* pathfinding
* AI
* UI
* camera behavior
* controls
* animations
* visual presentation
* timing
* map behavior
* match lifecycle

as accurately as possible in the browser.

The Android game is the source of truth.

When the browser implementation conflicts with the original Android behavior, the browser implementation is considered wrong unless there is strong evidence that the Android behavior cannot be reproduced.

## 1.1 Rule Status Legend

Rules in this document are tagged:

* **[NOW]** — enforced on every change, starting today.
* **[TARGET]** — architectural direction. Follow for all new code; do not deepen violations; do not rewrite working code solely to comply retroactively.

The simulation-timestep rule (§7) is **[NOW]** and implemented (fixed 20 Hz accumulator with bounded catch-up). Never add render-coupled gameplay code.

Untagged rules are **[NOW]** by default.

---

# 2. Source-of-Truth Hierarchy

When multiple sources disagree, use this priority:

1. Direct observation of the Android game.
2. Reverse-engineered Android/native runtime behavior.
3. Decompiled/reconstructed IL2CPP code.
4. Original extracted Unity assets, prefabs, animation clips, textures, audio and map data.
5. Existing reverse-engineering notes and evidence.
6. Existing browser implementation.
7. Reasonable approximation only when the original behavior cannot yet be recovered.

Never assume that the existing browser implementation represents the original game's behavior.

The existing browser implementation is evidence of what has already been implemented, not evidence of what AOW3 actually does.

---

# 3. Legal / Asset Handling

Use only legally obtained APK/XAPK files, binaries, assets and game data.

This project may use extracted game assets for private/non-commercial compatibility/research purposes as permitted by the project owner's rights and applicable law.

## 3.1 Redistribution Decision

The original **Art of War 3: Global Conflict** game, its name, and all of its assets remain the property of their respective rights holders. This project claims no ownership of them.

The project owner has reviewed this repository's asset posture and has decided to allow redistribution of extracted game assets **within this repository** (including via Git LFS), based on the following documented rationale:

1. **Non-commercial purpose.** This is a private research and fan-recreation project. It carries no ads, no payments, no monetization, and does not sell or license any of the original game's content.
2. **Publicly distributed source.** The source package (AOW3 XAPK 6.9.18) was obtained from a public app-distribution channel where the publisher distributes the game free-to-play. Assets are extracted for research and interoperability study, not to bypass purchase or access controls.
3. **Verifiability of the research.** The repository's value is that claims about the original game can be checked against its actual assets and binary. Keeping the evidence base (dump.cs, string literals, extracted models, notes) together with the implementation is what makes the reverse engineering reproducible rather than anecdotal.
4. **No misrepresentation.** The project is clearly labeled a recreation. Extracted assets are never presented as original work of this project, and attribution/provenance information in reverse-engineering artifacts is preserved.
5. **No competing service.** The original multiplayer/backend is not reimplemented. The browser build is a single-player fidelity study that depends on and points back to the original game.
6. **Takedown policy.** If the rights holders object to any material in this repository, it will be removed promptly upon request (open a GitHub issue on this repository).

This rationale documents the owner's decision and risk acceptance. It is not a claim that the rights holders have approved this project, and it is not legal advice.

## 3.2 Still Forbidden

Redistribution is allowed **within this repository only**. Do not:

* sell, sublicense, or reupload the assets to asset stores, mirrors, or standalone asset dumps
* move assets to any other project or repository outside the intended project
* commit passwords, tokens, credentials or private keys
* add unrelated copyrighted material
* upload personal data
* circumvent protections for unauthorized access beyond what interoperability research requires
* implement multiplayer/server functionality unless explicitly requested

Do not remove attribution or provenance information from reverse-engineering artifacts.

---

# 4. Repository Structure

Actual layout (verify with `git ls-files` rather than assuming):

```text
AOW3/
├── AGENTS.md                       # implementation agent instructions (this file)
├── README.md
├── worklog.md                      # implementation + QA log (append-only)
│
├── Art-of-War-3_6.9.18_apkcombo.com.xapk
│                                   # source APK package (Git LFS, ~270 MB)
│
├── assets/
│   └── aow3-extracted-assets.zip   # raw extracted Unity assets (Git LFS, ~212 MB)
│
├── docs/                           # the browser client (GitHub Pages root)
│   ├── index.html                  # entry point; cache-bust via game.js?v=N
│   ├── game.js                     # the entire browser game (single file)
│   ├── AOW3_DEVELOPMENT_PLAN.md    # gameplay-fidelity + RE plan (governing)
│   ├── AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md  # Wasm/multiplayer/accounts target (companion)
│   └── assets/                     # browser-facing assets actually served
│       ├── models/                 # unit/building GLBs, atlases, heightmap, map.json
│       │   └── decor/              # extracted map-decoration GLBs (hundreds)
│       ├── ui/                     # HUD/build-card/selection sprites
│       ├── fx/                     # explosion/smoke/flame/glow sprites
│       └── sfx/                    # weapon/UI/announcement audio
│
├── reverse/                        # the evidence base
│   ├── AGENTS.md                   # reverse-engineering agent instructions
│   ├── README.md
│   ├── dump.cs.zip                 # IL2CPP dump (Git LFS)
│   ├── stringliteral.json.zip      # IL2CPP string literals (Git LFS)
│   ├── notes/                      # e.g. combat-stats.md
│   ├── evidence/                   # e.g. conflicts/version-drift-6.5.22-vs-6.9.18.md
│   ├── versions/                   # per-version notes (6.5.22 …)
│   └── external/                   # externally supplied evidence collections
│
└── pipeline/                       # repeatable extraction/conversion tooling
    ├── *.py                        # unpack/assemble/export scripts
    ├── tools/                      # map export, GLB surgery, bundle unpacking
    └── *.json                      # map indices/extractions
```

`docs/` is the browser client and is what GitHub Pages serves.

`reverse/` is the evidence base.

`assets/` and the root XAPK are LFS-stored originals; they are not unpacked into the tree — the browser-facing copies already live under `docs/assets/`.

`pipeline/` contains repeatable extraction/conversion tooling.

`worklog.md` records important discoveries and implementation progress.

---

# 5. Existing Technology Decision

## Keep Three.js

The browser renderer should remain based on:

* Three.js
* WebGL2
* standard browser APIs

Do not replace the project with:

* Unity WebGL
* Babylon.js
* Phaser
* another rendering/game engine

merely because another engine has more built-in features.

### Why

The difficult part of this project is not rendering.

The difficult part is reconstructing AOW3's actual:

* simulation
* gameplay rules
* unit state machines
* combat
* economy
* movement
* AI
* map logic
* production
* objectives

Changing the renderer does not recover any of that behavior.

The current project already contains substantial Three.js work, original extracted models, animations, map data, effects and gameplay code.

Therefore:

**Improve the existing Three.js implementation incrementally. Do not perform a wholesale engine rewrite.**

---

# 6. Target Architecture

The long-term architecture should become:

```text
AOW3 Browser
│
├── Input
│   ├── Mouse
│   ├── Keyboard
│   ├── Touch
│   └── Camera gestures
│
├── Command Layer
│   ├── Select
│   ├── Move
│   ├── Attack
│   ├── Stop
│   ├── Build
│   ├── Produce
│   └── Special commands
│
├── Simulation
│   ├── Units
│   ├── Buildings
│   ├── Combat
│   ├── Weapons
│   ├── Movement
│   ├── Pathfinding
│   ├── Economy
│   ├── Production
│   ├── Energy
│   ├── Command Points
│   ├── AI
│   ├── Objectives
│   └── Match lifecycle
│
├── State
│   ├── Authoritative game state
│   ├── Selection state
│   ├── Orders
│   └── deterministic simulation state
│
└── Renderer
    └── Three.js
        ├── Terrain
        ├── Units
        ├── Buildings
        ├── Effects
        ├── Animations
        ├── HUD
        ├── Minimap
        └── Camera
```

The important dependency direction is:

```text
Input
  ↓
Commands
  ↓
Simulation
  ↓
Game State
  ↓
Three.js Renderer
```

Not:

```text
Input
  ↓
Three.js Object3D
  ↓
Gameplay
```

Gameplay state must not depend on rendered objects.

---

# 7. Deterministic Simulation [NOW]

The simulation must run independently from rendering FPS.

**Status (October 2026): implemented.** The main loop runs a fixed-timestep accumulator:
`TICK_RATE = 20` (docs/game.js `src/game` loop), frame delta clamped to 0.25 s, catch-up
capped at 8 substeps of `1/20 s` per frame; `sim.step()` and `ai.step()` run only inside
the accumulator. The renderer smooths unit positions/yaw per frame on top of the fixed
steps. Slow machines drop render frames, not simulation correctness. Keep all new
gameplay state mutations inside `sim.step`; never advance game state from a render hook.

Do not use:

```js
position.x += speed;
```

inside a render loop.

Use a fixed simulation timestep.

Target:

```text
20 Hz simulation
50 ms simulation step
```

Rendering may run at:

```text
30 FPS
60 FPS
90 FPS
120 FPS
144 FPS
```

without changing the speed of the simulation.

Conceptually:

```text
Real Time
    ↓
Fixed Simulation Clock
    ↓
Game State
    ↓
Interpolated Renderer
```

A slow machine must render fewer frames, but it must not cause the game itself to run slower than realtime unless the machine is genuinely unable to keep up.

Avoid an unbounded catch-up loop.

If a catch-up limit is necessary, document it and monitor it.

---

# 8. Rendering vs Simulation Separation

Three.js objects are presentation.

They are not authoritative gameplay state.

For example:

```text
Unit simulation:
{
    id,
    position,
    velocity,
    hp,
    target,
    order,
    state,
    cooldown,
    armor,
    weapon
}
```

The renderer reads this state and updates:

```text
THREE.Object3D
```

Do not store critical gameplay state only on:

```js
mesh.userData
```

or another rendering object.

---

# 9. Reverse Engineering Workflow

Before implementing uncertain behavior:

### Step 1

Search:

```text
reverse/
reverse/notes/
dump.cs
stringliteral.json
pipeline/
```

### Step 2

Search the IL2CPP dump for:

* classes
* enums
* methods
* fields
* constants
* state machines
* configuration structures
* weapon definitions
* unit definitions
* building definitions

### Step 3

Inspect native code where required.

Use:

* Il2CppDumper
* IDA
* Ghidra
* Rizin/radare2
* REA where useful

### Step 4

Use runtime instrumentation where static analysis is insufficient.

Possible tooling:

* Frida
* frida-il2cpp-bridge
* controlled runtime logging

### Step 5

Compare against actual Android behavior.

### Step 6

Implement only the behavior supported by evidence.

### Step 7

Create a deterministic test/probe.

### Step 8

Record the result in:

```text
reverse/notes/
```

or:

```text
worklog.md
```

---

# 10. reverse-skill Usage

The `zhaoxuya520/reverse-skill` methodology should be treated as a **reverse-engineering workflow/router**, not as a magic automatic converter.

Relevant routing:

```text
APK / Android
    ↓
apk-reverse

Unity / IL2CPP
    ↓
reverse-engineering / Unity IL2CPP methodology

Native .so
    ↓
IDA / Ghidra / Rizin / REA

Runtime behavior
    ↓
Frida / frida-il2cpp-bridge
```

For AOW3 specifically:

```text
AOW3 APK/XAPK
    ↓
IL2CPP
    ↓
Il2CppDumper
    ↓
dump.cs + script.json
    ↓
native libil2cpp.so
    ↓
IDA/Ghidra/REA when necessary
    ↓
runtime verification with Frida when necessary
    ↓
evidence
    ↓
browser implementation
```

Do not blindly install/use every skill in `reverse-skill`.

Only use the parts relevant to:

* Android
* Unity
* IL2CPP
* native reverse engineering
* binary analysis
* runtime instrumentation
* binary comparison

---

# 11. REA Usage

`morluto/rea` should be considered an optional agent-oriented native binary analysis layer.

REA can help an agent investigate:

* functions
* callers
* callees
* references
* disassembly
* symbols
* cross-references
* native control flow
* binary relationships

It does **not** replace Il2CppDumper.

Use:

```text
Il2CppDumper
```

for IL2CPP metadata reconstruction and:

```text
REA / IDA / Ghidra / Rizin
```

for deeper native analysis when necessary.

---

# 12. Evidence Dossier

Reverse-engineering knowledge should gradually be organized as:

```text
reverse/
├── apk/
├── il2cpp/
│   ├── dump.cs
│   ├── script.json
│   └── metadata
│
├── ida/
├── ghidra/
├── rea/
│
├── evidence/
│
└── notes/
    ├── combat-stats.md
    ├── units/
    ├── buildings/
    ├── weapons/
    ├── movement/
    ├── economy/
    ├── ai/
    ├── maps/
    └── ui/
```

A recovered fact should ideally contain:

```text
Feature:
Source:
APK version:
Method/class:
Address if relevant:
Evidence:
Observed behavior:
Confidence:
Unknowns:
Browser implementation:
Test:
```

Example:

```text
Feature: Weapon vs Armor damage

Source: IL2CPP native disassembly
APK: 6.9.18

Method:
CalculateWeaponArmorDamage(float dmg, EStat armorStat)

Evidence:
Recovered from native disassembly.

Confidence:
High

Browser implementation:
combat damage module

Test:
Numerical deterministic test against recovered values.
```

---

# 13. Combat Fidelity

Do not invent a generic RTS combat system.

AOW3's actual combat rules must be reconstructed.

Known reverse-engineering evidence includes:

```text
CalculateWeaponArmorDamage(float dmg, EStat armorStat)
```

and:

```text
WeaponDamageLightValue
WeaponDamageMediumValue
WeaponDamageHeavyValue
```

Armor types:

```text
Light
Medium
Heavy
```

Weapon configuration includes fields such as:

```text
damageLight
damageMedium
damageHeavy
hitBonus
distance
distanceMin
explosionRadius
explosionDecr
velocity
shotStart
shotInt
shotCount
roundLen
accuracyStatic
accuracyDynamic
accuracyWalk
rotateSpeed
```

Do not replace recovered formulas with formulas that merely "feel better".

Where exact values are unavailable, explicitly mark the value as an approximation.

---

# 14. Current Combat Formula Evidence

A recovered branch of the damage/armor calculation is approximately:

```text
armor < damage:

out =
    (damage - armor) * 0.1 / (reference - armor)
    + 0.9

armor >= damage:

out =
    0.9 *
    (
        1
        - 1 / (1 + damage / scale)
        + damage / (armor * (1 + armor / scale))
    )
```

The browser currently contains a continuous reconstruction.

Do not silently change this formula.

If better native evidence is found:

1. document it
2. add numerical tests
3. update the implementation
4. record the source

---

# 15. Unit and Building Data

Never invent statistics when they can be recovered.

Recover:

* health
* armor
* speed
* cost
* uranium cost
* command points
* train time
* attack range
* minimum range
* weapon
* weapon cooldown
* projectile speed
* accuracy
* vision
* construction time
* production requirements
* energy production
* energy consumption
* command point production
* regeneration
* size
* construction radius
* faction restrictions

Known `EStat` values include:

```text
Health
Price
PriceUranum
CommandPoints
TrainTime
Speed
ArmorLight
ArmorMedium
ArmorHeavy
View
ConstructionRadius
ConstructionTime
CommandPointsProduce
SupplyIncome
EnergyProduction
EnergyNeed
BuildingSize
HealthRegeneration
```

---

# 16. Movement and Pathfinding

The extracted map is authoritative whenever available.

Do not use random procedural walkability as the primary map representation when real map data exists.

Movement should eventually derive from:

* extracted terrain
* height
* obstacles
* bridges
* water
* building footprints
* unit collision
* map restrictions
* actual pathfinding behavior

If an approximation is temporarily required, clearly mark it.

---

# 17. Map Fidelity

Preserve:

* original terrain
* object placements
* decoration positions
* water
* height
* bridges
* map boundaries
* important gameplay objects
* minimap representation

The current project already contains thousands of extracted map placements.

Do not replace real extracted map data with generic procedural terrain merely because procedural terrain is easier.

---

# 18. Buildings

Buildings must eventually reproduce:

* placement rules
* construction
* construction radius
* construction time
* prerequisites
* cost
* power/energy
* command points
* production
* upgrades if applicable
* damage
* destruction
* occupation/capture behavior where applicable
* selection
* health bars
* effects
* animations

Construction and production should be simulation systems, not render-only effects.

---

# 19. Economy

Reconstruct the actual AOW3 resource model.

This includes:

```text
Credits
Uranium where applicable
Energy / power
Command points
Income
Supply
Production costs
Construction costs
Production timing
Resource restrictions
```

Do not assume conventional RTS formulas.

If live balance data is backend-delivered and unavailable from the APK, mark the values as approximate until they can be recovered through legitimate observation or data sources.

---

# 20. AI

AI should be reconstructed from observed behavior and reverse-engineered evidence.

Potential state categories include:

```text
Idle
Build
Produce
Defend
Attack
Retreat
Respond to enemy
Respond to aircraft
Use turret
Acquire target
Move
Reposition
```

Do not create sophisticated generic RTS AI and call it AOW3 AI.

The objective is behavioral similarity.

---

# 21. Input

Desktop and mobile input must feed the same command system.

Inputs include:

```text
Mouse
Keyboard
Touch
Camera gestures
Minimap
Selection drag
Right click
Long press
Double tap
WASD
Edge pan
Wheel zoom
Pinch zoom
```

Input should produce gameplay commands.

Example:

```text
Touch gesture
    ↓
Move command
    ↓
Simulation
```

not:

```text
Touch gesture
    ↓
directly move Three.js object
```

---

# 22. UI Fidelity

Use original extracted UI assets whenever available.

Do not substitute:

* emoji
* generic icons
* fabricated buttons
* arbitrary colors
* placeholder art

when the original asset can be recovered.

Preserve:

* HUD structure
* minimap
* unit information
* building information
* selection indicators
* health bars
* command controls
* resource displays
* notifications
* menus

---

# 23. Performance

Performance optimization must not reduce gameplay fidelity.

Measure first.

Use:

* Chrome DevTools
* Performance profiler
* memory profiler
* FPS measurements
* simulation timing diagnostics

Avoid:

```text
per-frame DOM rebuilding
repeated GLTF loading
repeated texture decoding
unnecessary raycasts
garbage-heavy temporary objects
duplicate geometry
duplicate materials
duplicate textures
FPS-dependent simulation
```

Reuse:

```text
geometry
materials
textures
animation resources
object pools
```

Use instancing/batching only when visual behavior remains equivalent.

Do not perform architectural rewrites based on intuition alone.

---

# 24. Simulation Performance

The target is smooth real-time gameplay with substantial unit counts.

The simulation should eventually support profiling such as:

```text
Simulation:
  Units: X ms
  Combat: X ms
  Pathfinding: X ms
  AI: X ms
  Economy: X ms
  Buildings: X ms
  Total: X ms

Rendering:
  Update: X ms
  Draw: X ms
```

CPU-heavy systems may eventually be moved to Web Workers, but only after profiling proves that this is useful.

Do not introduce workers merely for architectural fashion.

---

# 25. Testing

A feature is not complete merely because:

```text
the page loads
```

Every meaningful gameplay change should be tested for:

### Desktop

* Chrome
* normal 16:9 display
* different window sizes

### Low performance

* CPU throttling
* low FPS
* large unit counts

### Mobile

* touch input
* orientation
* viewport resizing
* camera gestures

### Simulation

* fixed timestep
* deterministic behavior
* no FPS-dependent gameplay

### Reverse-engineered rules

Use deterministic numerical tests whenever possible.

Example:

```text
damage = X
armor = Y

expected result = Z
```

---

# 26. 16:9 and Mobile Regression Rule

Every significant change must avoid breaking:

* 16:9 desktop layouts
* mobile layouts
* portrait/landscape handling
* minimap
* HUD
* camera
* canvas sizing

Never fix one aspect ratio by breaking another.

---

# 27. Git Workflow

Agents must:

1. Inspect current repository state.
2. Inspect recent commits.
3. Inspect relevant files.
4. Understand existing behavior.
5. Make the smallest appropriate change.
6. Test it.
7. Inspect the diff.
8. Remove temporary/debug artifacts.
9. Update documentation/worklog when appropriate.
10. Commit with a clear message.

Do not rewrite unrelated code.

Do not create huge unrelated commits.

Do not commit:

* secrets
* credentials
* temporary dumps
* generated junk
* debug screenshots unless intentionally required
* local environment files

---

# 28. Agent Handoff Rule

Before beginning substantial work, an agent must report:

```text
Current state:
Relevant files:
Relevant evidence:
Known limitations:
Planned change:
Expected files changed:
Testing plan:
```

After completing work, report:

```text
Implemented:
Evidence used:
Files changed:
Tests performed:
Known limitations:
Commit:
```

Do not say "complete" if only the page loads.

---

# 29. Reverse-Engineering Confidence Levels

Use:

```text
CONFIRMED
```

when directly observed or strongly recovered from code/native analysis.

Use:

```text
HIGH CONFIDENCE
```

when multiple independent pieces of evidence agree.

Use:

```text
MEDIUM CONFIDENCE
```

when evidence exists but behavior is not fully confirmed.

Use:

```text
LOW CONFIDENCE
```

when based mainly on observation or analogy.

Use:

```text
APPROXIMATION
```

when the original behavior is currently unavailable.

Never present an approximation as confirmed AOW3 behavior.

---

# 30. Cross-Version Analysis

If legitimately obtained AOW3 APKs from different versions are available, compare them.

Useful targets:

```text
libil2cpp.so
global-metadata.dat
assets
configuration
string literals
method structures
weapon values
unit values
building values
AI behavior
```

Use binary comparison to identify:

* changed functions
* changed constants
* changed data structures
* changed balance
* changed mechanics

This can help determine which behavior belongs to which game version.

Always record the exact APK/game version.

---

# 31. Current Known Repository Limitations

The existing project has substantial functionality but is not yet a true 1:1 recreation.

Known limitations include:

* per-unit balance numbers (hp/price/damage) come from the developer's server-side
  tables and cannot be recovered from the APK; browser values are documented
  approximations (see reverse/notes/unit-roster-native-analysis.md)
* multiplayer/backend behavior is not implemented
* some map/water/walkability behavior remains approximate
* some gameplay state machines require deeper reconstruction (native shell types such
  as chain lightning, stealth/fog, and hero abilities are not reproduced)
* some AI behavior remains approximate
* some movement/pathfinding behavior remains approximate

Do not hide these limitations.

---

# 32. Current Strategic Priority

Prioritize gameplay correctness over visual polish.

### Current Phase Note (October 2026)

Work currently alternates between gameplay-fidelity passes and visual-fidelity passes at the project owner's direction, and the owner's live feedback (screenshots, look complaints) currently makes visual parity an active work item — recent examples: ocean-scheme revert (v10), faction asset-mapping correction (v11). This does not suspend §32: within a gameplay pass the ordering below governs. Visual passes must not deepen render-coupled gameplay state (§8), must preserve extracted map data (§17), and must be QA-verified on the live site per §35 before being called done.

Governing plans (read before scoping any pass): `docs/AOW3_DEVELOPMENT_PLAN.md`
(what AOW3 actually does — phases 0-28) and `docs/AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md`
(how the verified simulation becomes Wasm/multiplayer/accounts — phases A-L).
Precedence: confirmed AOW3 behavior wins over architecture convenience; architecture
stages must not skip the evidence/boundary/determinism stages beneath them; neither
plan justifies a wholesale rewrite of docs/game.js. Implementation status against
these plans: Phase 0 (evidence pipeline), Phase 1 fixed-timestep stepping,
Phase 2 data-model extraction, and Phase 3 unit state machines are DONE.
Phase 4 (unified command system) and the determinism gaps (seeded PRNG, state
hashes) are DONE as of v=19.
Phase 2 (v=17, bumped from v=16 after colliding with the concurrent remote FX pass 2f0bd7f): gameplay data lives in
`docs/data/*.js` (`AOW3_DATA`: stats/weapons/units/buildings/factions) instead of
hardcoded tables in game.js — schema machine-extracted to
`reverse/evidence/data-model/*.json` (EStat 78, weapon 27-field schema, UnitType
ids, HeroTypes), fixture-verified byte-identical values
(`reverse/evidence/tests/data-model.test.js`, 265 assertions). Native balance
VALUES remain server-delivered (not in APK) — per-unit numbers are documented
gameplay-tuned approximations. Phase 3 (v=18): the sim runs an explicit
native-shaped unit FSM (rotate/aim/fire-gate/burst/acquire-priority/
retaliate+warn/guard-return/commandStop/die-state) — evidence and clone mapping
in `reverse/notes/unit-state-machines-native-analysis.md`, deterministic
coverage in `reverse/evidence/tests/unit-fsm.test.js` (29 vectors, runs the
SHIPPED sim kernel extracted between the game.js SIM KERNEL markers). The sim
kernel region is DOM-free by rule — keep it that way. Phase 4 (v=19): one
authoritative command layer — `Commands.issue()` in the kernel routes
select/move/attack/stop/capture/build/produce/special/cancel from EVERY input
source (mouse, keyboard, touch, minimap, AI); AI issues the same command types
as the player through its own Commands instance (no direct u.order mutation
remains); commands journal (per issuer, 512-entry ring, tick-stamped,
failures-not-journalled) = seed + journal = replay. Determinism: all sim+AI
randomness flows through mulberry32 (Sim.rng() with inspectable rngState;
AI stream derived from sim.seed ⊕ owner), `#seed=N` URL override for
reproducible maps, `sim.stateString()`/`hashState()` (FNV-1a over quantized
behavior-affecting state, 1 Hz ring journal `sim.hashes`) — coverage in
`reverse/evidence/tests/commands-determinism.test.js` (50 vectors, same-shipped
kernel extraction method as Phase 3). Remaining roadmap Phase D items:
lockstep networking — the replay playback harness is DONE (v=23, see below).
Phase 5 combat-reconstruction gaps (v=23): weapon minimum range
(`minRange` -> native m_distanceMin/0x2C, stat key WEAPON_DISTANCE_MIN=
"distance_min" dump.cs:17303; values gameplay-tuned on w_typhoon 5 / w_fortress 4)
gates fire, burst and acquisition (dead-zone targets are skipped, units hold
inside the dead zone); patrol mission (native ClientUnitTaskType.Patrol = 1,
dump.cs:271215 — commandPatrol routes anchor<->far point, engages targets of
opportunity en route, P hotkey arms it, minimap supported); garrison mission
(native ClientBuildingTypeEditor.Bunker = 14 dump.cs:266093 + ClientBunkerWeapon
dump.cs:275667 — infantry enter friendly bunkers via right-click, protected/
untargetable/inert inside, crew-served bunker weapon fires only while crewed,
cap 3, move/attack/capture auto-unload (UnloadFromTransport = 10 analog), V
exits, bunker death scrambles the crew); stateString extended (garrison,
patrol anchor/leg). Coverage: `reverse/evidence/tests/phase5.test.js`
(47 vectors, shipped-kernel extraction).
Phase 5 remaining documented unknowns (v=28): hold position
(HotkeyAction.UnitSpecHoldPosition = 24, AICommUnitsHoldPosition — instant
stance, window-fire, never pursues; v=25) and the stance family Defend /
Bombard / DontShoot / TakePositions + aircraft-hold orbit (v=28, natively
anchored via GAICommandSpecMode ACT_* dispatch dump.cs:410916 + native
disassembly `reverse/evidence/combat/specmode-native.txt`): defend = anchored
tethered-pursuit stance (commandDefend, SendSelectedUnitsDefend no-cell,
patrol_defend second route 393338); bombard = targeted POINT shelling for
artillery-family weapons only (commandBombard, AICommUnitsBombard ids+x/y,
WeaponType.canBombard 0x45B6268, GetBombardUnitsOnly filter); dont-shoot/
can-shoot = fire-discipline toggle pair (commandDontShoot/commandCanShoot,
specs 1048576/2097152, hotkeys 26/32) gating every fire path; take-positions
= per-unit placement then hold at the taken spot (commandTakePositions,
spec 4194304, hotkey 25, Unit.TakePosition Coordinate); held/defending
aircraft orbit their anchor (renderer-only). Hotkeys: H hold, D defend,
X bombard, T positions, F hold-fire, P patrol, V garrison. Coverage:
`reverse/evidence/tests/phase5.test.js` (128 vectors, shipped-kernel
extraction).
Phase D replay playback harness (v=23): `Replay` class in the kernel —
capture() = seed + full command journals (player AND AI, tick/seq stamped via
shared sim.cmdSeq) + terrain fingerprint (fresh-constructor probe, NOT the
capture-time grid) + 1 Hz hash journal; play() rebuilds the sim from the seed,
re-feeds commands at their recorded tick boundaries (sort key (tick, seq)),
compares state hashes at the journal marks and the final hash — divergences
localize desyncs to a tick (native analog: AICommandLogWriter/Reader +
CRCRequest/Verify). Commands now keep an uncapped `full` journal beside the
512-entry debug ring. Live probe: `window.__aow3Replay.{capture,save,run}`.
Coverage: `reverse/evidence/tests/replay.test.js` (34 vectors incl. tamper
detection seed/command/terrain). Renderer interpolation between sim
states is approximated by per-frame smoothing.

Recommended order:

1. Fixed deterministic simulation clock.
2. Unit/building data fidelity.
3. Unit state machines.
4. Orders and command processing.
5. Target acquisition.
6. Weapon behavior.
7. Damage/armor calculations.
8. Projectile behavior.
9. Movement.
10. Collision.
11. Pathfinding.
12. Construction.
13. Production.
14. Economy.
15. Energy/power.
16. Command points.
17. Capture/depot/objective systems.
18. Vision/fog of war.
19. AI behavior.
20. Victory/defeat.
21. Match lifecycle.
22. Input fidelity.
23. HUD/UI fidelity.
24. Visual polish.
25. Performance optimization.

Do not spend a major development cycle improving lighting while core gameplay rules are still wrong.

---

# 33. Definition of Done

A feature is complete only when:

1. The behavior is implemented.
2. The source/evidence is identified.
3. The simulation is not unintentionally dependent on render FPS.
4. Existing assets/runtime systems continue to work.
5. Browser testing has been performed.
6. Relevant mobile/desktop behavior has been tested.
7. Important limitations are documented.
8. No unrelated behavior was broken.
9. 16:9 desktop and mobile layouts still work.
10. The implementation is consistent with the highest-confidence AOW3 evidence available.

---

# 34. Core Principle

The project should follow:

```text
Evidence
   ↓
Reverse Engineering
   ↓
Recovered Rule
   ↓
Implementation
   ↓
Deterministic Test
   ↓
Android Comparison
   ↓
Documentation
```

Never:

```text
Guess
   ↓
Implement
   ↓
Assume it is AOW3
```

The goal is not to make the browser version "feel like" AOW3.

The goal is to make the browser version **behave like AOW3**.

**Owner disposition (2026-10-09, post-R2):** R2 (Task 42) closed the Obfuz question
without a device — pool decoded statically 697/697 (`reverse/evidence/obfuz/`,
`reverse/tools/obfuz_static_decode.py`): Obfuz protects code-level behavior/AI/
verification constants (task ids, thresholds, flags, fixed-point factors, log
formats), NOT balance, and is NOT part of the R1 resource pipeline. The owner
directed that the decoded constants be folded into the Build E/F-derived browser
models (fire-discipline task semantics per `attack-path-fire-discipline.md` §R2 —
DontShoot=8 idempotence constant, $ce=3 task threshold, attack-order task=NONE
write, set_FlagShoot=-1; per-mille siege accumulator per
`siege-stage-boundary-split.md` §R2 — DEN=1000 milli-tick fixed point) in a
**future implementation task**, with its own evidence-diff, QA, and test-vector
delta — R2 completion alone does not authorize immediate browser changes.
(Executed as Task 45 the same day: scoped per
`reverse/notes/obfuz-constants-foldin-scope.md`, W1 decode committed, fold-in
shipped with tests 854 -> 877; no serialized-state or gate-behavior change.) R1's
on-device dictionary dump (Task 41 runbook, `BLOCKED — DEVICE REQUIRED`) remains
the **sole** blocked capture for 1:1 balance values; every other capture is either
resolved statically or optional verification.

---

# 35. Deploy & Verify Workflow [NOW]

`docs/` is served by GitHub Pages from `main`. There is no build step: what is committed to `docs/` is what runs.

## 35.1 Cache busting

Any change to `docs/game.js` MUST bump the version query in `docs/index.html`:

```html
<script src="game.js?v=N"></script>
```

Increment N by exactly 1 each time (currently v=11). Skipping this serves stale cached code and produces false regression reports.

## 35.2 Push and verify

1. `git add <only the relevant files>` → commit with a clear message.
2. `PATH=/home/z/bin:$PATH git push origin main` (the remote is already configured locally with credentials; never embed credentials in docs or scripts).
3. Wait ~75 seconds for Pages to rebuild.
4. Verify the served version:

```bash
curl -s https://nawaf-al-hussain.github.io/AOW3/index.html | grep -o 'game.js?v=[0-9]*'
```

5. Open the live site in a **fresh browser session** (bypassing cached game.js) and QA the specific change plus the regression checklist (§26).

## 35.3 Runtime probes

The browser build exposes debug handles for QA (never use them as gameplay state):

* `__aow3()` → `{ sim, r3d }` — simulation and renderer instances
* `__DBG.cam.{x,y,dist,yaw}` — camera control; `__DBG.fogCanvas` / `__DBG.fogTex` — fog debug
* `r3d.unitViews` (Map of unit → view, `.rankSprite`), `r3d.dying` (`.dieMode`), `r3d.water`, `r3d.raycaster`
* `S.spawn(defId, owner, x, y)` / `S.commandMove(...)` — spawn units and issue orders for tests
* `S.stats[owner]` — live kill/loss tracking; `S.visible[0]` — fog Uint8Array; `rankTier(u)` — global

**Fog probes:** `MAP_W = 160`; fog tile coordinates map 1:1 onto fog-canvas pixels. Never divide fog coordinates by another constant — this once produced a false "units don't reveal fog" bug report.

## 35.4 Worklog

After each verified change, append a section to `worklog.md` (Task ID, agent, task, work log, stage summary) and commit it. Never overwrite or reorder prior entries.
