# Phase 4 — Command system + determinism (native analysis & clone mapping)

Shipped: v=19. Evidence: dump.cs (6.9.18, sha256 0050e67d) — `com.geargames.aow.entities.battle.aicomm`
message hierarchy, `AICommandLog*` infrastructure, unit task enums (Phase 3 note).
Level of confidence: STRUCTURE-level (names/shapes/roles pinned); wire formats and
sim values remain server-delivered and are gameplay-tuned approximations.

## Native command protocol (AIComm : Message)

Every player/AI intent is a `Message` subclass sent through `SendCommand(AIComm)`
(0x48DF0CC ctor carries `senderTick` + `side` — commands are tick-stamped, exactly
like our journal entries). The reconstructed mapping:

| Native AIComm*                       | Clone Commands type            | Notes |
|--------------------------------------|--------------------------------|-------|
| `AICommSquad` (GAIUnitSet[])         | `select` (set/add/type/clear)  | selection & control groups |
| `AICommUnitsMove` (int[] ids, x, y, flags) | `move` (+`attackMove` flag) | flags include attack-move semantics |
| `AICommUnitsStop` (int[] ids)        | `stop`                         | native TASK_WAIT (Phase 3) |
| `AICommUnitsHoldPosition`            | (folded into `stop`+guard)     | distinct native task; gap |
| `AICommUnitsPatrolTargeting`         | — (gap)                        | patrol not reconstructed |
| `AICommBuyUnit` / `CancelBuyUnit`    | `produce` / (`cancel`)         | queue purchase |
| `AICommBuSet`                        | `build`                        | building placement |
| `AICommBuildingRallyPoint/Remove/Repair/Upgrade` | — (gaps)          | building-side commands |
| `AICommAircraftRebase`               | `special` (land/depart)        | hero aircraft rebase ≈ land/depart |
| `AICommHeroAbilityActive`/`UnitsPsionic`/`UnitsBombard`/`NuclearLaunch` | (future abilities) | Phase 3 hotkey evidence |
| `AICommCRCRequest`/`CRCAnswer`/`Verify`/`SyncTest` | `hashState()` + `sim.hashes` | native desync detection |
| `AICommandLogWriter`/`Reader`        | `Commands.log` (512 ring)      | native command journal/replay |

Key structural finding: the original game is server/lockstep-authoritative — the
client only PRODUCES commands; the simulation consumes them deterministically.
`CRCRequest` (int checksum payload) proves the native sim hashes its state and
exchanges digests between peers to catch divergence. Our `stateString()`/`hashState()`
(FNV-1a over quantized behavior-affecting state) reconstructs that verification
surface; `sim.hashes` is the 1 Hz ring analogue of the native CRC log.

## Clone architecture (per AOW3_DEVELOPMENT_PLAN Phase 4)

    Mouse ─────┐
    Keyboard ──┤
    Touch ─────┼──> Commands.issue() ──> Simulation (kernel)
    Minimap ───┤        (journal)
    AI ────────┘

- `Commands` lives INSIDE the sim-kernel markers (DOM-free): constructor(sim, sel),
  `issue(cmd)` → routes to sim.commandMove/Attack/Stop/Capture/LandDepart/enqueue/tryPlace,
  updates `sel` (ids only) or `placing` (build preview) for select/cancel.
- Validation happens BEFORE journalling: a rejected command (no funds, no producer,
  bad placement) returns false and is NOT recorded — the journal is a faithful
  replay record (seed + journal = replay, roadmap Phase D groundwork).
- Input adapters only resolve WHAT was clicked (raycast/visibility/pick radius are
  presentation) and emit typed commands; `orderAt()` gained ctrl+right-click
  attack-move; minimap right-click is a move-command source (left-click still pans).
- AI holds its own `Commands` instance and its own seeded rng
  (mulberry32(sim.seed ^ imul(owner, 0x9E3779B9))); all direct `u.order = ...`
  mutations were removed — AI issues the same `produce`/`capture`/`move`
  (attack-move) commands as the player. This is the plan's "AI should issue the
  same command types as the player" requirement.

## Determinism

- `Sim.rng()` — inline mulberry32 with inspectable `this.rngState`; constructor
  derives it from `seed` (default 12345; live uses random seed, overridable via
  `#seed=N` URL hash for reproducible QA). All six sim random draws (production
  jitter, hero crit, entrench/building hit roll, direct hit, both projectile
  resolve rolls) flow through it; render-side FX keep Math.random (presentation only).
- `Sim.stateString()` — canonical quantized (1/100 tile) serialization: tick, time,
  nextId, winner, rngState, players (funds/income/cp/queue), every unit (position,
  hp, facing, order, targets, path length, dest/guard, burst/aim/cd, state, kills),
  buildings, projectiles, corpses. floats/booms/pops excluded (presentation).
- `Sim.hashState()` — FNV-1a 32-bit of the state string; sampled 1 Hz into
  `sim.hashes` (600-entry ring).
- Coverage: `reverse/evidence/tests/commands-determinism.test.js` (50 vectors)
  drives the SHIPPED kernel (same vm-extraction as Phase 3): same-seed equality
  (tick-0 and tick-400, journal stability), different-seed divergence, single-command
  divergence, routing/selection/journal semantics, seeded combat (identical duel
  outcome from identical seed), AI seed derivation. Regression: unit-fsm (29),
  accuracy (13), data-model (265) all pass.

## Known gaps (documented, backlog)

- Patrol (`UnitsPatrolTargeting`) and hold-position as distinct tasks.
- Building-side commands: rally point, repair, remove, upgrade.
- Replay PLAYBACK harness (consume seed + journal to reproduce a game) — the
  recording half is shipped; native `AICommandLog` equivalent.
- Lockstep networking (roadmap Phase D/L) — out of scope for the web clone pass.
