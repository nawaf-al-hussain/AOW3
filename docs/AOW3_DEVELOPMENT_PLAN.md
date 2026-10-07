## Technical Architecture & Online Infrastructure

The gameplay-development plan in this document remains the primary roadmap for reproducing AOW3's gameplay, systems, mechanics, and behavior from the original Android game.

The long-term technical architecture required to support the browser version—including deterministic simulation, Rust/WebAssembly, online multiplayer, accounts, matchmaking, persistence, replays, and deployment—is documented separately in:

**`docs/AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md`**

That document is a companion to this development plan, not a replacement for it.

### Architecture dependency order

The architecture work must follow the gameplay/reverse-engineering work rather than bypass it:

```text
Original AOW3 reverse engineering
          ↓
Evidence-backed gameplay rules
          ↓
Clean simulation boundary
          ↓
Fixed 20 Hz deterministic simulation
          ↓
Deterministic tests + replay fixtures
          ↓
Rust simulation core
          ↓
WebAssembly browser build
          ↓
Shared browser/server simulation
          ↓
Authoritative online multiplayer
          ↓
Accounts + persistent player data
          ↓
Matchmaking + replays + ranked systems
```

Do not implement later stages merely because the infrastructure is available. Each stage must have a working, tested foundation underneath it.

### Important architectural rule

The current Three.js browser implementation must remain playable during this migration.

Do **not** perform a wholesale rewrite of `docs/game.js` simply to introduce the new architecture. Migrate systems incrementally and preserve behavior unless a reverse-engineering finding justifies a change.

The Rust/Wasm simulation must eventually become independent of:

* Three.js
* DOM/UI
* browser rendering
* animation systems
* audio
* camera logic
* mouse/keyboard/touch APIs
* WebSocket implementation
* authentication providers
* databases
* hosting providers

These belong to the client/server integration layers, not the authoritative simulation.

### Relationship between the two plans

**This document (`AOW3_DEVELOPMENT_PLAN.md`) answers:**

> How do we reproduce the actual behavior of AOW3?

**`AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md` answers:**

> How do we turn that verified simulation into a maintainable browser engine with Wasm, authoritative multiplayer, accounts, persistence, matchmaking, and replays?

Neither document should override the other.

If a proposed architecture conflicts with confirmed AOW3 behavior, AOW3 behavior wins.

If reverse engineering reveals that an existing implementation is incorrect, update the gameplay implementation and its evidence here first; then update the architecture where necessary.

### Current priority

The immediate priority remains:

1. Reverse engineer and verify the original AOW3 behavior.
2. Resolve unknown or approximate gameplay rules.
3. Separate simulation state from rendering state.
4. Establish a genuinely fixed simulation timestep.
5. Build deterministic regression tests.
6. Only then begin substantial Rust/Wasm migration.
7. Use the resulting deterministic core as the foundation for authoritative multiplayer.

**Do not treat WebAssembly, multiplayer, accounts, or hosting as reasons to postpone reverse engineering or gameplay correctness.**


AOW3 — Complete Development and Reverse-Engineering Plan
Objective

Build a browser version of Art of War 3: Global Conflict that reproduces the Android game's behavior and presentation as closely as technically and legally possible.

The existing Three.js implementation already solves a large portion of the visual/asset problem.

The next phase should therefore focus heavily on reconstructing the actual game simulation.

Phase 0 — Establish the Evidence Pipeline
Goal

Turn the project from an implementation-first project into an evidence-first reconstruction project.

Tasks
Organize APK/XAPK evidence.
Organize IL2CPP artifacts.
Preserve:
dump.cs
script.json
global-metadata.dat
libil2cpp.so
string literals
Create organized reverse-engineering notes.
Record exact game/APK versions.
Record hashes where useful.
Establish repeatable extraction procedures.
Tooling

Use:

Il2CppDumper
reverse-skill methodology
IDA/Ghidra/Rizin where appropriate
REA where useful
Frida where runtime observation is necessary
Deliverable

A reproducible AOW3 reverse-engineering evidence repository.

Phase 1 — Simulation Clock
Goal

Remove the biggest architectural correctness problem: gameplay tied to render FPS.

Implement
Fixed timestep:
20 Hz
50 ms

Separate:

simulation time

from:

render time

Renderer interpolates between simulation states.

Test

Run identical scenarios at:

30 FPS
60 FPS
120 FPS
CPU throttled

The gameplay outcome should remain equivalent.

Deliverable

Deterministic fixed-step simulation framework.

Phase 2 — Extract the Game's Data Model
Goal

Build a machine-readable representation of AOW3 gameplay data.

Investigate:

Units
Buildings
Weapons
Armor
Stats
Production
Costs
Energy
Command points
Vision
Movement
Construction

Search IL2CPP for:

stat enums
configuration classes
weapon configuration
unit configuration
building configuration
faction configuration
production configuration
Deliverable

Create structured data files/modules such as:

units
buildings
weapons
factions
stats

Do not hardcode hundreds of unrelated values throughout game.js.

Phase 3 — Unit State Machines
Goal

Reconstruct how individual units actually behave.

Investigate:

Idle
Move
Attack
Acquire target
Rotate
Shoot
Reload
Stop
Die
Retreat
Special behavior

Recover:

transition conditions
target selection
attack timing
movement interruption
turning
firing states
death states
Deliverable

Simulation-side unit state machines independent of Three.js.

Phase 4 — Command System
Goal

Create one authoritative command layer for every input method.

Commands:

Select
Move
Attack
Stop
Build
Produce
Special
Cancel

Architecture:

Mouse ─────┐
Keyboard ──┤
Touch ─────┼──> Commands ──> Simulation
Minimap ───┤
AI ────────┘

AI should issue the same command types as the player whenever possible.

Deliverable

Unified command system.

Phase 5 — Combat Reconstruction
Goal

Reproduce AOW3 combat mathematically.

Investigate:

armor
weapon damage
weapon type
hit chance
accuracy
movement accuracy
range
minimum range
projectile speed
shot interval
burst count
explosion radius
explosion damage falloff
rotation speed
target selection
attack cooldown

Known evidence:

CalculateWeaponArmorDamage
WeaponDamageLightValue
WeaponDamageMediumValue
WeaponDamageHeavyValue
WeaponTypeMapEditorConfig
Deliverable

A dedicated combat simulation module.

Phase 6 — Deterministic Combat Tests

Create numerical tests.

Examples:

Light armor vs light weapon
Light armor vs heavy weapon
Medium armor vs each weapon type
Heavy armor vs each weapon type

Test:

damage
armor mitigation
hit probability
range
cooldown
burst behavior

Compare recovered native behavior against browser output.

Deliverable

Regression suite protecting reverse-engineered combat rules.

Phase 7 — Movement and Pathfinding
Goal

Replace approximated movement with map-aware AOW3 behavior.

Investigate:

walkability
terrain costs
unit radius
collision
obstacles
bridges
water
buildings
movement speed
turning
formation behavior
path recalculation

Use extracted map data wherever possible.

Deliverable

Authoritative navigation representation.

Phase 8 — Construction

Reconstruct:

Building placement
Placement restrictions
Construction radius
Construction time
Builder behavior
Construction progress
Construction cancellation
Construction completion

Ensure construction is simulation state.

Rendering should only visualize the state.

Phase 9 — Production

Reconstruct:

Producer requirements
Queue
Production duration
Resource consumption
Command point consumption
Energy requirements
Production cancellation
Spawn location
Spawn behavior
Deliverable

Authoritative production system.

Phase 10 — Economy

Recover the actual resource model.

Investigate:

Credits
Uranium
Energy
Supply
Command points
Income
Production
Resource generation
Resource consumption

Do not assume standard RTS behavior.

Phase 11 — Building Behavior

Reconstruct:

Turrets
Bunkers
Factories
Barracks
Power structures
Depots
HQ
Heavy factories

Each building should have its own simulation definition.

Phase 12 — Objectives and Capture

Investigate:

depots
capture points
strategic objectives
ownership
neutral structures
resource structures
victory conditions

Recover actual Android behavior.

Phase 13 — Vision and Fog of War

Investigate:

Vision radius
Detection
Enemy visibility
Fog
Buildings
Aircraft
Minimap visibility

Do not implement generic fog if AOW3's actual rules can be recovered.

Phase 14 — AI Reconstruction

Study Android AI behavior.

Create state machines for:

Construction
Production
Defense
Attack
Target acquisition
AA response
Aircraft response
Turret use
Resource management

Start with observed behaviors rather than generic RTS intelligence.

Phase 15 — Match Lifecycle

Implement:

Match initialization
Player setup
AI setup
Map initialization
Resource initialization
Victory
Defeat
Restart
Game over

Make lifecycle deterministic.

Phase 16 — Renderer Separation

Gradually break the monolithic runtime into:

simulation/
render/
input/
ui/
data/
map/
audio/
effects/

Do this incrementally.

Do not rewrite the entire game at once.

Existing game.js should continue functioning while systems are extracted.

Phase 17 — Asset Fidelity

Preserve extracted:

models
textures
animations
effects
audio
terrain
decorations
UI assets

Avoid replacing original content with approximations.

Phase 18 — UI Reconstruction

Compare Android screenshots/gameplay to browser implementation.

Reconstruct:

HUD
Resource bars
Minimap
Unit panel
Building panel
Commands
Selection
Health bars
Notifications
Menus

Measure relative positions and proportions rather than eyeballing them.

Phase 19 — Input Fidelity

Desktop:

Mouse
Keyboard
WASD
Right click
Selection
Minimap
Wheel

Mobile:

Touch
Drag
Tap
Long press
Pinch
Camera gestures

Both should produce the same underlying command structures.

Phase 20 — Camera Fidelity

Recover:

zoom limits
camera angle
pan speed
edge scrolling
rotation if applicable
minimap camera movement
mobile camera gestures

Camera behavior should be independent from simulation timing.

Phase 21 — Audio

Preserve extracted sounds where available.

Investigate:

attack sounds
hit sounds
construction
production
building destruction
alerts
UI
ambient sounds

Tie audio to simulation events rather than arbitrary render frames.

Phase 22 — Performance Pass

Only after the simulation is sufficiently correct.

Profile:

Simulation
Rendering
Animation
Pathfinding
AI
Particles
Audio
Memory
Asset loading

Optimize the actual bottlenecks.

Possible optimizations:

object pooling
instancing
texture reuse
material reuse
spatial partitioning
reduced raycasting
cached queries
Web Workers if proven necessary
Phase 23 — Large-Scale Stress Testing

Test:

10 units
50 units
100 units
250 units
500+ units

where practical.

Measure:

simulation ms
render ms
memory
FPS
GC
input latency

Verify that increasing unit count does not destabilize simulation timing.

Phase 24 — Android Comparison

Create repeatable comparison scenarios.

Examples:

Scenario A

One unit moves across the map.

Compare:

speed
turning
path
animation
Scenario B

Two units fight.

Compare:

target acquisition
attack timing
damage
death time
Scenario C

Building construction.

Compare:

cost
construction time
visual stages
completion
Scenario D

Production.

Compare:

queue
cost
time
spawn
Scenario E

Large battle.

Compare:

AI
movement
combat
camera
effects
Phase 25 — Cross-Version Analysis

If multiple legitimate APK versions are available:

Version A
Version B
Version C

Compare:

IL2CPP
metadata
assets
strings
native functions
constants
configuration

Determine:

balance changes
mechanics changes
bug fixes
state-machine changes

Record every result by version.

Phase 26 — Documentation

Every major recovered mechanic gets documentation.

Recommended:

reverse/notes/
├── combat-stats.md
├── units/
├── buildings/
├── weapons/
├── movement/
├── economy/
├── ai/
├── maps/
├── objectives/
└── ui/

Each document should state:

What:
Evidence:
Version:
Confidence:
Implementation:
Test:
Unknowns:
Phase 27 — Continuous Agent Workflow

Every agent begins with:

1. Inspect repository.
2. Inspect recent commits.
3. Read AGENTS.md.
4. Locate relevant evidence.
5. Determine confidence.
6. Plan smallest implementation.
7. Implement.
8. Test.
9. Inspect diff.
10. Document.
11. Commit.

For uncertain behavior:

Search evidence
    ↓
Static analysis
    ↓
Runtime observation
    ↓
Android comparison
    ↓
Implementation
Phase 28 — Release Readiness

Before calling the project production-ready:

Gameplay
deterministic simulation
accurate combat
accurate movement
accurate production
accurate economy
accurate buildings
accurate AI
accurate objectives
accurate victory/defeat
Visual
original models
original animations
original terrain
original UI
original effects
correct camera
Technical
stable 16:9
stable mobile
no FPS-dependent gameplay
no major memory leaks
no repeated asset loading
acceptable large-unit performance
Testing
desktop
mobile
low FPS
large battles
repeated matches
regression tests
Strategic Priority

The entire project should follow this priority:

                 AOW3 Fidelity
                       │
             ┌─────────┴─────────┐
             │                   │
        Gameplay             Presentation
             │                   │
       Simulation            Rendering
             │                   │
       Reverse Engineering    Assets/UI
             │                   │
       Deterministic Tests     Visual QA

Gameplay correctness comes first.

Final Development Philosophy

Do not ask:

"What would a normal RTS do here?"

Ask:

"What does AOW3 actually do?"

Do not ask:

"What implementation is easiest?"

Ask:

"What implementation best reproduces the recovered behavior?"

Do not ask:

"Does the browser version look convincing?"

Ask:

"Would an AOW3 player observing the same scenario see the same result?"

The project should continuously move from:

Approximation

toward:

Evidence-backed recreation

with every development cycle.
