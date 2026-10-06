# AOW3 Reverse Engineering Agent Instructions

## 0. Relationship to the Root AGENTS.md (read it first)

The root `AGENTS.md` is the project doctrine: mission, source-of-truth hierarchy, rule-status legend, combat/data fidelity rules, confidence levels, evidence dossier format, git workflow, handoff template, and definition of done.

This file adds only **reverse-engineering-specific procedure**.

* **Precedence:** if this file conflicts with the root AGENTS.md on doctrine, the root wins. This file is authoritative only on RE tooling procedure (Il2CppDumper, Ghidra, REA, Frida specifics).
* **Referenced from root, not repeated here:**

| Topic | Root section |
|---|---|
| Source-of-truth hierarchy | §2 |
| Combat fidelity + recovered damage formula | §13, §14 |
| Recovered weapon fields and EStat values | §13, §15 |
| Evidence dossier layout + recovered-fact template | §12 |
| Confidence levels (CONFIRMED … APPROXIMATION) | §29 |
| Git workflow + what not to commit | §27, §3.2 |
| Agent handoff report format | §28 |
| Definition of done | §33 |
| Engine policy (keep Three.js, no rewrite) | §5 |
| Deploy & verify workflow | §35 |

Core rule (unchanged):

```text
Evidence → Reverse Engineering → Recovered Rule
        → Implementation Guidance → Deterministic Test
        → Android Comparison → Documentation
```

Do not invent gameplay behavior when the original behavior can be investigated.

Do not replace unknown behavior with a generic RTS implementation simply because it is easier.

---

## 1. Primary Objective

Recover enough of the original game's implementation and behavior to allow the browser project to reproduce AOW3 as closely as possible.

Prioritize:

```text
Gameplay rules            Unit behavior             Weapon behavior
Combat                    Movement/pathfinding      Buildings
Economy                   Production                AI
Objectives                Vision/fog of war         Match lifecycle
Input/commands            UI behavior               Animation/state transitions
Audio/FX triggers         Performance-related behavior
```

Visual reconstruction is important, but behavioral correctness takes priority over visual approximation.

---

## 2. Evidence Order for RE Work

Use the root §2 hierarchy. Concretely, when investigating a mechanic, work down this stack and stop at the first level that answers the question:

1. **Direct Android observation** — run the original game; controlled experiments; exact inputs/outputs; repeat; edge cases; screenshots/video; timing.
2. **Runtime instrumentation** — Frida, frida-il2cpp-bridge, method hooks, memory/state inspection. Confirms or refutes uncertain static analysis.
3. **Native binary analysis** — Ghidra / IDA / Rizin / REA on `lib/arm64-v8a/libil2cpp.so`.
4. **IL2CPP metadata** — Il2CppDumper → `dump.cs`, `script.json`, `global-metadata.dat`; names, classes, fields, addresses.
5. **Original assets/data** — extracted Unity assets, prefabs, clips, textures, audio, serialized config.
6. **Existing RE notes** — `reverse/notes/`; verify important claims against stronger evidence when available.
7. **Browser implementation** — the *lowest* source of truth. Never assume an existing browser behavior is correct merely because it exists.

---

## 3. Do Not Destroy Evidence

This is extremely important.

Never modify or overwrite original reverse-engineering artifacts merely to make analysis easier.

Keep original artifacts separate from generated artifacts:

```text
reverse/
├── apk/          │ original/ + generated/   (if tooling produces copies, keep both)
├── il2cpp/       │ dump.cs, script.json, metadata/
├── ghidra/
├── ida/
├── rea/
├── frida/
├── decompiled/
├── evidence/
└── notes/
```

Never silently replace the original.

---

## 4. Ghidra Workflow

Ghidra is the primary deep static-analysis environment for the native IL2CPP binary.

```text
libil2cpp.so → Ghidra auto analysis → apply IL2CPP metadata
→ locate known functions → rename → recover signatures/types
→ analyze callers/callees → decompile → document behavior
```

Do not simply open Ghidra and randomly browse functions. Start from known evidence.

---

## 5. Importing libil2cpp.so

When setting up Ghidra:

* Import the exact `libil2cpp.so` belonging to the investigated AOW3 APK/version.
* Record the APK/game version and architecture.
* Record SHA-256 hashes of important binaries.
* Run appropriate ARM64 analysis; preserve the Ghidra project.

Document the setup in `reverse/ghidra/README.md`:

```text
Game version:
APK/XAPK:
Architecture:
libil2cpp.so SHA-256:
global-metadata.dat SHA-256:
Ghidra version:
Il2CppDumper version:
Analysis date:
```

If the project is too large for normal Git storage, document exactly how to reproduce it and store exported analysis artifacts instead.

---

## 6. IL2CPP + Ghidra

Il2CppDumper and Ghidra serve different purposes and must be used together.

**Il2CppDumper** recovers: classes, methods, fields, method addresses, type information, metadata relationships.

**Ghidra** recovers: native implementation, control flow, callers, callees, branches, constants, data flow, native structures, surrounding behavior.

If Il2CppDumper says `CalculateWeaponArmorDamage` and gives an address, locate that address in Ghidra, rename the native function, then investigate callers, callees, referenced fields, constants, and related functions.

---

## 7. Store Decompiled Output in the Repository

This is mandatory.

Do not leave important decompilation only inside your local Ghidra session.

When a function is important enough to influence the browser implementation, export/store its decompiled representation under `reverse/decompiled/`, organized by system:

```text
reverse/decompiled/
├── combat/       CalculateWeaponArmorDamage.cpp, ApplyDamage.cpp, ExplosionDamage.cpp …
├── units/        UnitAttack.cpp, UnitMove.cpp, UnitTargetSelection.cpp, UnitDeath.cpp …
├── buildings/    BuildingConstruction.cpp, BuildingProduction.cpp, BuildingDestruction.cpp …
├── economy/      CalculateIncome.cpp, CommandPoints.cpp …
├── ai/           SelectTarget.cpp, UpdateAI.cpp …
└── movement/     FindPath.cpp, CalculateMovement.cpp …
```

Use `.c`, `.cpp`, or `.txt` depending on the output. These are decompiler reconstructions, not original source code.

Every file must carry a header making that explicit:

```c
/*
 * AOW3 Reverse Engineering Artifact
 *
 * Original binary:  libil2cpp.so
 * Game version:     6.9.18
 * Architecture:     ARM64
 * Function:         CalculateWeaponArmorDamage
 * Address:          0x7cc1c18
 * Decompiled with:  Ghidra
 * Status:           Decompiled approximation of native code.
 * IMPORTANT:        This is NOT original source code.
 */
```

---

## 8. Do Not Pretend Decompiled Code Is Exact Source

Ghidra output is an interpretation of native machine code. It may contain incorrect variable names, guessed types, wrong structures, compiler artifacts, optimized control flow, and inaccurate signatures.

Classify every finding with the root §29 confidence levels (CONFIRMED / HIGH / MEDIUM / LOW / APPROXIMATION). Never label a decompiler guess as confirmed behavior.

---

## 9. Evidence Files

Store one document per recovered mechanic under `reverse/evidence/<system>/` (combat, units, weapons, buildings, movement, ai, runtime).

Use the recovered-fact template from root §12 (Feature / Source / APK version / Method / Address / Evidence / Observed behavior / Confidence / Unknowns / Browser implementation / Test).

---

## 10. Function Investigation Procedure

Whenever investigating a function:

1. **Identify it** — find the method in `dump.cs` or another reliable source.
2. **Locate its native address** — via Il2CppDumper/script metadata.
3. **Find it in Ghidra** — confirm the address corresponds to the expected function.
4. **Rename it** — use a meaningful name.
5. **Recover the signature** — arguments, return value, likely structures, relevant object pointers.
6. **Decompile it** — save the result (§7).
7. **Inspect the graph** — branches, loops, early exits, conditions, constants.
8. **Inspect callers** — why and when it is invoked.
9. **Inspect callees** — what behavior it depends on.
10. **Inspect fields/data** — what game state it reads/writes.
11. **Compare with runtime** — if uncertainty remains, instrument the original Android game (§18).
12. **Document the recovered rule** — store under `reverse/evidence/`.
13. **Update implementation guidance** — explain exactly what the browser engine should reproduce (§26).

---

## 11. Always Investigate Callers

Do not stop when you find the interesting function.

`CalculateWeaponArmorDamage()` alone is not enough. Find: who calls it? why? when? with what parameters? what happens to its return value?

The surrounding call graph may reveal rules the function itself does not:

```text
Attack() → CheckRange() → CheckAccuracy() → CalculateWeaponArmorDamage()
        → ApplyDamage() → CheckDeath() → CreateDeathEffect()
```

That entire chain may be required to accurately reproduce combat.

---

## 12. Investigate State Machines

AOW3 is not merely a collection of formulas. Units and buildings have state machines.

Unit states to look for:

```text
Idle  Moving  Attacking  MovingToAttack  Retargeting
TakingDamage  Dying  Dead  Disabled  Transported
```

Building states:

```text
Constructing  Active  Producing  Damaged  Disabled  Destroyed
```

For each state determine: entry/exit conditions, transitions, timers, animations, sound effects, commands allowed, attacks allowed, movement allowed.

Store findings in `reverse/notes/state-machines/`.

---

## 13. Combat Investigation

Combat is a major priority. The recovered damage formula and weapon field list live in root §13–§14 — do not restate or modify them here.

RE-specific investigation checklist (fields whose behavior is **not yet fully recovered**):

* ~~hit chance and the three accuracy fields (`accuracyStatic/Dynamic/Walk`)~~ — **RECOVERED 2026-10-06**: `reverse/notes/weapon-accuracy-native-analysis.md`, implemented in browser v=12. Remaining unknown: native `weaponType` id→unit-class mapping and `explosionDecr` values (server-side).
* ~~burst behavior: `shotStart`, `shotInt`, `shotCount`, `roundLen`~~ — schema confirmed (`WeaponShotsPerMin` @0x7FCEFB0, `WeaponType` consts); live burst timing still approximate.
* explosion falloff: `explosionRadius` × `explosionDecr` — `explosionDecr` confirmed in the accuracy curve; its damage-falloff role still unrecovered.
* target restrictions and AA behavior
* critical/special effects
* `hitBonus` semantics (field exists at `WeaponType` @0x24 — not seen in the accuracy surface)

Do not assume the fields behave independently. Trace how they interact in native code (§10–§11).

---

## 14. Movement Investigation

Movement deserves dedicated analysis:

```text
pathfinding, terrain costs, walkable areas, building collision, unit collision,
formation movement, turning, acceleration, deceleration, stopping distance,
attack movement, retarget movement, aircraft movement
```

If a pathfinding algorithm can be identified, document it. If it cannot, document what is known and what remains unknown.

Do not replace unknown pathfinding behavior with an arbitrary algorithm without recording that it is an approximation.

---

## 15. AI Investigation

Do not design a new RTS AI unless necessary. First determine how much of the original AI can be recovered.

Investigate: target selection, threat evaluation, attack/defense decisions, base construction, production decisions, AA response, retreat, objective behavior, reaction radius, enemy prioritization.

Look for: priority values, scoring functions, thresholds, timers, state transitions, target filters.

Document the actual recovered decision logic.

---

## 16. Building Investigation

Recover: construction, construction time, construction radius, placement restrictions, footprint, production, queues, power/energy, command points, destruction, repair/regeneration, prerequisites, dependencies.

Investigate how building state affects other systems.

---

## 17. Economy Investigation

Investigate: credits, income, energy production/consumption, command points and their production, unit/building costs, production/construction timing, resource updates.

If a value comes from the server/backend and is not embedded in the APK, apply root §19's rule: do not fabricate a false "exact" value — record source as backend/live configuration, mark the browser value as approximation.

---

## 18. Runtime Verification

When static analysis is ambiguous, use runtime investigation:

```text
Frida, frida-il2cpp-bridge, controlled gameplay experiments, logging,
method hooks, parameter capture, return-value capture
```

Do not use runtime instrumentation as a substitute for understanding the code — use it to answer specific questions.

Example:

```text
Question:  Does movement reduce weapon accuracy?
Static:    Likely yes.
Runtime:   Attack while stationary; attack while moving; capture behavior.
Conclusion: Confirmed.
```

Store experiments under `reverse/evidence/runtime/`.

---

## 19. Version Tracking

AOW3 changes between versions. Never assume `v6.9.18 == current version`. Record the version for every important finding under `reverse/versions/`:

```text
reverse/versions/
├── 6.9.18/
├── 6.5.22/
└── comparisons/
```

When comparing versions, explicitly identify: added / removed / changed / unchanged / unknown.

---

## 20. Binary Hashes

For every important APK/native artifact, record SHA-256 in `reverse/evidence/binaries.md`:

```text
AOW3 Version: 6.9.18
libil2cpp.so       SHA-256: …
global-metadata.dat SHA-256: …
APK                SHA-256: …
```

This prevents accidentally analyzing a different version and confusing the results.

---

## 21. Search Strategy

When looking for a system, search multiple ways. For combat:

```text
damage, weapon, armor, attack, hit, accuracy, shot, projectile,
explosion, range, target
```

Also search class names, enum names, field names, strings, method names, constants, callers, and related systems.

Do not assume the function name will literally contain the mechanic name.

---

## 22. Generated Artifacts Must Be Committed

Important reverse-engineering results must become persistent repository artifacts. At minimum commit:

```text
reverse/
├── decompiled/   evidence/   notes/
├── ghidra/       rea/        frida/
└── versions/
```

Do not leave important findings only in chat, agent memory, terminal output, the Ghidra UI, or temporary files. If it matters to the recreation, put it in the repository. (Commit hygiene itself: root §27.)

If an artifact is too large for normal Git, document its location and reproducible generation procedure; use Git LFS where already supported.

---

## 23. What NOT to Commit

Root §27 and root §3.2 govern. In RE work specifically: never commit credentials, unrelated personal information, temporary crash dumps, or tool-generated junk. Do commit useful reverse-engineering evidence.

---

## 24. Decompilation Naming

Use stable, meaningful names — `CalculateWeaponArmorDamage`, `ApplyDamage`, `FindTarget`, `CalculateHitChance`, `UpdateUnitState` — not `FUN_00123456`.

Keep the original address in the documentation:

```text
Name:                CalculateWeaponArmorDamage
Address:             0x7cc1c18
Original Ghidra name: FUN_007cc1c18
```

Never lose the original address.

---

## 25. Avoid False Certainty

Every important conclusion must answer: **how do we know this?**

Good:

```text
HIGH CONFIDENCE
Evidence: dump.cs signature + Ghidra control flow + caller analysis + runtime verification
```

Bad:

```text
"This is probably how the game works."
```

If you don't know: `UNKNOWN` is a valid result. An explicit unknown is much more valuable than a fabricated rule. (Confidence scale: root §29.)

---

## 26. Browser Implementation Guidance

The reverse-engineering agent does not need to rewrite the browser engine for every discovery. Provide precise implementation guidance:

```text
Recovered Rule:
  When a moving unit fires: accuracy uses accuracyWalk, not accuracyStatic.

Evidence:
  CalculateHitChance @ 0x…   Caller: AttackController @ 0x…

Confidence: HIGH

Browser requirement:
  Combat simulation must select accuracyWalk while movement state != Idle.
```

This allows the implementation agent to make the change safely.

---

## 27. Deterministic Tests

Whenever a recovered rule can be tested without Android, define a deterministic test:

```text
Input:  damage = 100, armor = 50
Expected: damage multiplier = X
```

Store test vectors under `reverse/evidence/tests/`. The browser implementation should eventually consume these tests where practical.

---

## 28. Ghidra Export Policy

For every high-value function, save:

```text
function name, native address, decompiled output, relevant pseudocode,
callers, callees, important constants, relevant structures,
evidence interpretation, confidence, browser implementation implication
```

Do not dump thousands of irrelevant functions into the repository. Prioritize functions that affect actual game behavior.

---

## 29. Priority Order

When starting from an unexplored binary, investigate in this order:

```text
P0 — Core combat        damage, armor, accuracy, hit chance, weapon behavior,
                        projectiles, death
P1 — Unit behavior      state machine, target selection, attack, movement,
                        orders
P2 — Buildings          construction, production, destruction, prerequisites
P3 — Economy            credits, energy, command points, income, costs
P4 — Movement           terrain, collision, path selection, formation
P5 — AI                 target selection, attack, defense, production,
                        construction, objectives
P6 — Match systems      objectives, victory, defeat, capture, vision, fog
P7 — Presentation       animation, audio, FX, UI, camera
```

---

## 30. Do Not Rewrite the Engine

The browser project already uses Three.js; root §5 governs. Reverse engineering recovers game behavior — it never triggers a renderer rewrite.

The current problem is primarily behavioral fidelity, not the renderer.

---

## 31. Work in Small, Traceable Units

Do not spend days investigating an enormous subsystem and then produce a vague report.

Prefer:

```text
Task:    Recover weapon hit calculation.
Output:  1. Ghidra function          2. decompiled file
         3. caller list              4. recovered formula
         5. runtime verification     6. evidence note
         7. browser implementation guidance
```

Then move to the next mechanic.

---

## 32. Expected Output of a Successful Investigation

A completed investigation should leave behind something like:

```text
reverse/
├── decompiled/combat/CalculateWeaponArmorDamage.cpp
├── evidence/combat/damage-calculation.md
├── notes/combat-stats.md
├── ghidra/README.md
└── versions/6.9.18.md
```

The repository should become a persistent reverse-engineering knowledge base, not merely a browser implementation repository.

---

## 33. Agent Handoff

Use the root §28 handoff format, extended with the RE-specific fields:

```text
## Task                       what was investigated
## Game Version               version analyzed
## Binary                     binary and SHA-256
## Functions Investigated     functions and addresses
## Recovered Behavior         what was determined
## Evidence                   files created/updated
## Confidence                 CONFIRMED / HIGH / MEDIUM / LOW / APPROXIMATION
## Runtime Verification       whether Android/runtime behavior was tested
## Browser Impact             what the implementation agent should change
## Unknowns                   what remains unresolved
## Recommended Next Investigation
```

---

## 34. Definition of Done

A reverse-engineering task is complete only when:

* the relevant function has been identified
* the native implementation has been investigated
* callers/callees have been considered
* important constants/fields have been documented
* decompiled output has been stored when useful
* evidence has been stored in `reverse/`
* confidence has been assigned
* runtime verification has been performed when necessary
* browser implementation implications are documented
* unresolved questions are explicitly listed

A chat response alone is not considered completion.

---

## 35. Core Rule

Always remember:

Do not reverse engineer to produce interesting decompiled code. Reverse engineer to recover the actual rules of AOW3.

The final goal is not: "We found this function."

The final goal is:

```text
"We know what the original game does,
 why we know it,
 where the evidence is,
 how confident we are,
 and exactly how the browser implementation should reproduce it."
```

The ultimate pipeline:

```text
Android Game → APK / Native Binary → Il2CppDumper
→ Ghidra / REA → Frida Runtime Verification → Evidence
→ Recovered Rule → Deterministic Test → Browser Implementation
→ Android Comparison → Improved AOW3 Recreation
```

Never skip the evidence stage.
