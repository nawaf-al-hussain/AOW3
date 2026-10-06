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

Do not:

* redistribute proprietary game assets outside the intended project
* commit passwords, tokens, credentials or private keys
* add unrelated copyrighted material
* upload personal data
* circumvent protections for unauthorized access
* implement multiplayer/server functionality unless explicitly requested

Do not remove attribution or provenance information from reverse-engineering artifacts.

---

# 4. Repository Structure

Important areas:

```text
AOW3/
├── assets/
│   └── extracted/original game assets
│
├── docs/
│   ├── index.html
│   └── game.js
│
├── reverse/
│   ├── README.md
│   ├── dump.cs.zip
│   ├── stringliteral.json.zip
│   ├── notes/
│   └── other reverse-engineering evidence
│
├── pipeline/
│   └── extraction/conversion tooling
│
├── worklog.md
└── README.md
```

`docs/` is the browser client.

`reverse/` is the evidence base.

`assets/` contains extracted source assets.

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

# 7. Deterministic Simulation

The simulation must run independently from rendering FPS.

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

* simulation timing is not yet fully independent of render FPS
* some live balance numbers are unavailable from the APK
* multiplayer/backend behavior is not implemented
* some map/water/walkability behavior remains approximate
* some gameplay state machines require deeper reconstruction
* some AI behavior remains approximate
* some movement/pathfinding behavior remains approximate

Do not hide these limitations.

---

# 32. Current Strategic Priority

Prioritize gameplay correctness over visual polish.

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
