# AOW3 Technical Architecture Roadmap
## Deterministic Simulation, WebAssembly, Online Multiplayer, Accounts, and Persistence

**Status:** Proposed target architecture  
**Repository:** `nawaf-al-hussain/AOW3`  
**Relationship to existing plan:** Supplements `docs/AOW3_DEVELOPMENT_PLAN.md`; does not replace its gameplay-fidelity and reverse-engineering phases.

> This document describes a target, not existing functionality. Implement it incrementally and verify each phase. Keep the current Three.js browser game playable throughout migration.

## 1. Goals

Plan a path toward:
- evidence-backed AOW3 gameplay behavior
- fixed 20 Hz simulation independent of rendering FPS
- Rust simulation core compiled to WebAssembly for the browser
- reuse of the same simulation source on an authoritative server
- real-time online multiplayer
- accounts and player profiles
- matchmaking, match history, and persistent results
- deterministic replay and desync diagnostics
- a free/open-source-first toolchain and provider-independent game core

## 2. Principles

1. The original Android game and validated reverse-engineering evidence define gameplay rules.
2. Do not rewrite everything at once. Preserve the working Three.js client.
3. Do not port unverified gameplay assumptions into Rust/Wasm.
4. Use one simulation implementation for browser and server wherever practical.
5. The server is authoritative online; clients submit commands, never trusted outcomes.
6. Rendering objects, DOM, audio, and camera are presentation—not authoritative game state.
7. Fixed ticks, seeded randomness, stable processing order, versioned commands, and state hashes are required.
8. Determinism is tested, not assumed merely because the core is Rust/Wasm.
9. Free tiers have quotas and can change; never promise free operation at arbitrary scale.
10. Isolate provider integrations behind adapters. The game core must not depend on Cloudflare, Supabase, SQL, HTTP, or WebSocket APIs.
11. Never place privileged secrets in browser code, public environment variables, or Wasm.
12. Each phase must leave the existing single-player build usable.

## 3. Current plan relationship

`docs/AOW3_DEVELOPMENT_PLAN.md` already covers reverse engineering, fixed-timestep goals, simulation/render separation, combat, movement, economy, AI, performance, Android comparisons, and release readiness. Keep that document as the gameplay-fidelity plan. This roadmap adds the cross-cutting architecture for Wasm, networking, identity, persistence, and deployment.

Before acting, agents must inspect the current branch, `AGENTS.md`, worklog, development plan, and actual code. Do not assume that this proposal describes the current implementation.

## 4. Recommended stack

| Layer | Initial recommendation | Qualification |
|---|---|---|
| Renderer | Three.js / WebGL2 | Keep; no wholesale renderer rewrite. |
| Client | TypeScript introduced incrementally | Do not mass-convert `docs/game.js` as a prerequisite. |
| Simulation | Rust | Testable native and Wasm builds. |
| Browser core | Rust compiled to `wasm32-unknown-unknown` | Use a narrow, versioned JS/Wasm interface. |
| Tick | Fixed 20 Hz / 50 ms target | Validate against AOW3 and current performance. |
| Networking | WebSocket | Versioned commands, events, snapshots, reconnect rules. |
| Match hosting candidate | Cloudflare Workers + SQLite-backed Durable Objects | Must pass a realistic continuous-simulation benchmark. |
| Identity candidate | Supabase Auth | Integrate behind an application-owned auth adapter. |
| Persistent records | Choose **one** primary DB: Supabase Postgres or Cloudflare D1 | Avoid duplicate sources of truth. |
| Tests | Rust tests, browser tests, protocol tests, replay tests | Shared test vectors across native/Wasm. |
| CI | GitHub Actions | Format, test, build, smoke test. |
| RE tooling | Il2CppDumper, Ghidra, REA, Frida | Evidence drives game rules. |

### Database choice

Do not automatically use both D1 and Supabase Postgres for the same records. A possible arrangement is Supabase Auth plus one chosen database for profiles, match history, and statistics; Durable Object SQLite holds room-local state/recovery metadata. Choose after a proof of concept evaluating authentication integration, quotas, migrations, backups/export, and complexity.

Recheck free-tier limits, billing behavior, verification requirements, and regional latency at implementation time. A free plan may reject requests or stop operations when quotas are exceeded.

## 5. Target architecture

```text
Browser
  Input (mouse / keyboard / touch)
        |
  Typed Command Layer
        |
  +-----+----------------------+
  |                            |
  v                            v
Local single-player         Online client
Rust -> Wasm                commands + snapshots
  |                            |
  v                            v
Game state                Authoritative match room
  |                            |
  v                            v
Three.js renderer          Same Rust simulation rules
                               |
                         Validated match result
                               |
                     Authenticated persistent API
                               |
                  Profiles / results / replays
```

This is the destination, not a description of today's code. Migrate subsystem by subsystem.

## 6. Simulation contract

Define a small core interface before porting significant logic. Conceptually:

```text
create_match(config, seed) -> state
submit_command(state, command) -> accepted/rejected
step(state, tick) -> ordered events
read_snapshot(state, viewer) -> serializable view
state_hash(state) -> deterministic hash
```

Use stable entity IDs and explicit `GameState`, `Command`, `Event`, `Tick`, `Seed`, `Snapshot`, and `StateHash` concepts. Actual APIs should follow the inspected code rather than forcing this exact pseudo-interface.

Keep Three.js meshes, animation mixers, materials, DOM nodes, camera objects, and audio handles outside simulation state.

## 7. Determinism

- Use an integer simulation tick and fixed-step updates.
- Use an explicit seeded PRNG for gameplay randomness.
- Use stable entity processing and command ordering.
- Do not use wall-clock time, `Math.random()`, render delta, packet arrival order, or render callbacks to determine gameplay.
- Define numeric precision/rounding rules for sensitive calculations.
- Version simulation rules, command schemas, and replay formats.
- Add state hashes and first-divergence diagnostics.
- Test native Rust and Wasm outputs against shared scenarios.
- Do not silently skip ticks to conceal overload; measure backlog and document catch-up behavior.

**Gate:** same core version, initial configuration, seed, and ordered tick-assigned commands must produce identical tested state hashes in native and Wasm builds. Floating-point determinism is not automatic; test it and use fixed-point/integer arithmetic selectively if needed.

## 8. Migration to Rust/Wasm

### Step A — Audit current code
Map simulation clock, entities, movement, targeting, combat, production, economy, AI, pathfinding, match lifecycle, rendering, input, effects, and audio. Record coupling points without changing behavior.

### Step B — Separate pure logic
Extract logic from Three.js/render loops incrementally and add tests around current behavior.

### Step C — Define schemas
Create typed, versioned command/state/event formats and serialization tests.

### Step D — Fix timestep
Implement/test the 20 Hz boundary, render interpolation, pause/resume, 30/60/120 FPS, and throttled rendering.

### Step E — Rust proof of concept
Port one small, stable, evidence-backed function or subsystem. Compare with existing JS using shared test vectors.

### Step F — Wasm proof of concept
Test browser loading, input/output, numeric parity, errors, memory lifetime, compatibility, and representative performance. Do not assume Wasm is faster for every workload.

### Step G — Incremental migration
Move stable systems one at a time. Keep JS/Rust parity tests until each old path can safely be removed. Keep UI, DOM, Three.js rendering, camera, and browser APIs in JS/TS.

### Step H — Server build
Compile the same core natively for the server where practical. If a hosting runtime requires a different target, prove that deployment path rather than implementing a second independent simulation.

## 9. Multiplayer

Use an authoritative server. Clients send intent, for example:

```text
MOVE(units=[12,13], destination=(x,y))
ATTACK(unit=12, target=42)
BUILD(type=Factory, location=(x,y))
PRODUCE(producer=8, type=Tank)
```

The server validates identity, room membership, ownership, entity state, map bounds, prerequisites, resources, cooldowns, visibility/target eligibility, schema, message size, and rate limits. The server calculates damage, movement, production, resources, victory, and results.

Never trust client-supplied positions, health, damage, resources, hidden enemy state, winners, or rating changes.

### Snapshot replication vs lockstep

Do not commit prematurely to pure lockstep. Prototype:
1. authoritative server with snapshots/events (simpler initial correctness, more bandwidth), and
2. command lockstep with state hashes (potentially less bandwidth, stricter determinism and latency requirements).

Start with the simplest reliable two-player match. Design versioned commands, tick assignment, sequence numbers, duplicate/late-command policy, reconnect rules, snapshot cadence, and desync recovery.

### Fog of war

The server holds full state but sends only player-authorized information. Do not send hidden enemy positions/orders to the browser and merely hide them in the UI. Test network payloads for hidden-state leakage.

## 10. Match hosting

Cloudflare Workers + SQLite-backed Durable Objects are a candidate for match rooms because they support stateful coordination and WebSockets. Review current official [pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) and [limits](https://developers.cloudflare.com/durable-objects/platform/limits/) before implementation. Free-tier quotas are real and exceeding them can cause operations to fail.

Each room owns one match: membership, WebSocket sessions, command queue, tick, authoritative state, reconnect/forfeit state, hashes, and final result. Avoid one global room for every match.

Before committing, benchmark realistic simulation load, tick time, CPU limits, memory, WebSocket behavior, reconnects, hibernation/sleep behavior, and quota consumption. If the host cannot sustain continuous ticks reliably, document alternatives and costs.

## 11. Accounts and identity

Supabase Auth is a candidate; review current [billing and plan details](https://supabase.com/docs/guides/platform/billing-on-supabase). Keep it behind an application-owned interface such as `verifySession(token) -> trustedPrincipal`.

Requirements:
- register/login/logout and secure session handling
- server-side token verification
- unique/normalized usernames
- rate limits and abuse prevention
- account/profile separation
- no privileged service-role key in the client
- no trust in client-supplied `user_id`
- minimum necessary personal data
- documented account deletion/export behavior

If auth and match hosting are separate services, explicitly document how the match service validates token issuer, audience, signature, expiry, and user identity. Never accept a user ID simply because the client sent it.

## 12. Persistent data

Persist long-lived records, not every simulation tick. Candidate records: profiles, player stats, matches, match players, replays, ratings (later), and moderation records (if needed).

Only server-authorized paths can write competitive results, ratings, and wins/losses. Make result finalization idempotent so retries cannot award the same result twice. Define access control, migrations, backups/export, and retention. Avoid storing unnecessary personal data.

## 13. Matchmaking and ranked progression

Build in this order:
1. private room/direct invitation for two authenticated users
2. ready check and match start
3. disconnect/reconnect and forfeit policy
4. basic queue for one mode/map
5. validated result persistence
6. basic statistics/history
7. rating algorithm
8. leaderboards/seasons

Do not build ranking before match results are trustworthy.

## 14. Replays

A replay should record:
- replay format version
- simulation/core and rules/data version
- map/configuration identifier
- seed or reproducible initial state
- ordered accepted commands with player and tick/sequence
- final result and periodic hashes where useful

Replay through the same simulation core, not a video recording. Replays help reproduce bugs, test regressions, and diagnose desyncs. Do not treat client-generated replay data as authoritative unless the server validates it.

## 15. Security requirements

Before public multiplayer:
- server-side command validation and room membership enforcement
- token/session verification
- rate limits and bounded message sizes
- WebSocket origin/session checks
- duplicate/replayed command protection
- server-side result finalization
- database access controls
- no secrets in public client files or Wasm
- logs must not contain tokens or private credentials
- tests for hidden-state leakage and forged results
- abuse monitoring and documented quotas

## 16. Testing gates

**Simulation:** fixed-step tests; deterministic replay; same-input state hashes; native/Wasm parity; evidence-backed combat tests; Android comparison fixtures.

**Client:** single-player still launches; mouse/keyboard/touch use the same command path; render FPS does not determine simulation time; pause/resume and refresh behavior tested.

**Multiplayer:** two clients join one room; invalid commands rejected; duplicate commands handled safely; reconnect works; results cannot be forged; state stays consistent; jitter/late packets tested; hidden state never leaks.

**Accounts/data:** unauthorized writes rejected; users cannot edit others' records; match results persist exactly once; migrations and export/recovery are documented.

## 17. Phased roadmap

### Phase A — Architecture audit
Inspect current branch, `AGENTS.md`, worklog, development plan, and code. Map actual boundaries and status. No mass rewrite.

**Exit:** committed architecture map and small-step migration proposal.

### Phase B — Reverse-engineering evidence
Continue the existing evidence-first plan; audit external collections skeptically; record versions, provenance, confidence, and conflicts.

**Exit:** a first target subsystem has credible evidence and test vectors.

### Phase C — Simulation boundary and fixed timestep
Define state/command/event/tick; separate simulation from renderer; establish 20 Hz stepping and interpolation; test variable render FPS.

**Exit:** tested scenarios are independent of render FPS.

### Phase D — Deterministic reference and diagnostics
Seed randomness, stabilize ordering, add fixtures, hashes, and first-divergence reports.

**Exit:** identical test inputs produce identical repeat-run results.

### Phase E — Rust/Wasm proof of concept
Port one stable subsystem; test native/Wasm parity and benchmark it.

**Exit:** measured correctness and value, not just successful compilation.

### Phase F — Incremental core migration
Port systems one at a time with parity tests; keep single-player playable.

**Exit:** selected core runs in Wasm with regression coverage.

### Phase G — Server-compatible core/protocol
Build same core for server target; version command/event/snapshot protocol.

**Exit:** local server test validates command and state flow.

### Phase H — Two-player private online match
Authoritative match room, WebSockets, validation, reconnect/forfeit rules, rate limits, load test.

**Exit:** repeatable two-player matches without unresolved divergence in test scenarios.

### Phase I — Accounts/profiles
Integrate auth through an adapter; verify sessions server-side; protect profile writes.

**Exit:** authenticated users can join private matches securely.

### Phase J — Match results and matchmaking
Idempotent result persistence, simple queue, history, statistics.

**Exit:** completed matches create correct durable records.

### Phase K — Replays/ranked/hardening
Versioned replays, replay validation, rating/leaderboards only after integrity tests, security review.

**Exit:** reproducible replay and documented operational/security limits.

### Phase L — Scale when measured usage requires it
Measure CPU, tick time, bandwidth, memory, storage, errors, queue time, and quota consumption. Optimize measured bottlenecks. Add regions or paid capacity only when required and approved.

## 18. Proposed repository layout

Do not create everything at once. Add directories when real code migrates.

```text
AOW3/
├── docs/
│   ├── AOW3_DEVELOPMENT_PLAN.md
│   └── AOW3_TECHNICAL_ARCHITECTURE_ROADMAP.md
├── engine/       # future Rust core
├── client/       # future renderer/input/network modules
├── server/       # future API/matchmaking/match rooms
├── shared/       # future versioned protocol
├── tests/        # simulation/parity/multiplayer/replay tests
├── reverse/
└── pipeline/
```

The existing `docs/game.js` remains the working client until each migration is proven. A target directory structure is not a reason for a mass file move.

## 19. Decisions requiring proof of concept

Do not treat these as settled until tested:
- Rust/Wasm bindings and serialization
- JS/Wasm call granularity and snapshot format
- native server versus server-side Wasm
- Durable Objects suitability for continuous authoritative ticks
- auth integration with match hosting
- D1 versus Supabase Postgres for persistent records
- snapshot replication versus lockstep
- numeric determinism and hash algorithm
- replay compression/storage

For each decision, document alternatives, a minimal experiment, results, quota/free-tier implications, and migration cost.

## 20. Agent workflow

Every agent must:
1. Inspect the current branch, recent changes, `AGENTS.md`, and relevant docs.
2. Distinguish implemented functionality from proposed architecture.
3. Choose the smallest safe scope.
4. Cite evidence for gameplay behavior.
5. Make incremental changes and run relevant tests.
6. Inspect the final diff for unrelated changes.
7. Update worklog/docs with results and unknowns.
8. Never claim Wasm, accounts, multiplayer, or persistence exists unless implemented and tested.
9. Never silently introduce paid services or recurring costs.

## 21. Definition of success

- The current browser game remains playable during migration.
- The simulation uses a tested fixed timestep independent of rendering.
- Recovered AOW3 rules have regression tests.
- Selected core systems run in Rust/Wasm with native parity.
- Browser/server share the same simulation source wherever practical.
- Online matches are authoritative and validate commands.
- Identity is verified server-side.
- Clients cannot forge results, resources, or ratings.
- Replays/state hashes help reproduce bugs.
- Free-tier limits and failure behavior are documented.
- Provider-specific code is isolated behind adapters.
- Unverified external claims never silently override validated evidence.

## 22. Official references to recheck

- WebAssembly specifications: https://webassembly.org/specs/
- Rust and WebAssembly: https://rustwasm.github.io/docs/book/
- Cloudflare Durable Objects pricing: https://developers.cloudflare.com/durable-objects/platform/pricing/
- Cloudflare Durable Objects limits: https://developers.cloudflare.com/durable-objects/platform/limits/
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase

Recheck official documentation before deployment; prices, quotas, and service capabilities change.

## Final principle

**Reverse engineer the original game, define and test the simulation boundary, prove determinism, then migrate stable systems to Wasm, and only then build authoritative multiplayer and accounts around it.**
