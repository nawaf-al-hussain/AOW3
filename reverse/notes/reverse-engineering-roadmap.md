# AOW3 Reverse-Engineering Roadmap (prioritized)

**Routing layer — not a second inventory.** The implementation-gap source of truth is
[`1-to-1-fidelity-audit.md`](1-to-1-fidelity-audit.md) (§6 Gap Priority Register,
§7 "RE Needed Next", §8 "Browser Implementation Needed Next"). This roadmap tracks
investigation status, sequencing and rationale; machine-readable state lives in
[`../evidence/registry.json`](../evidence/registry.json). Update both together.

Game version of record: **6.9.18** (`libil2cpp.so` sha256 `8ace05bb…`, metadata `d2e8dd0d…`,
dump.cs `0050e67d…`). Evidence labels per AGENTS.md §9 / mission vocabulary:
`[NATIVE] [DECOMP] [RUNTIME] [ASSET] [SERVER-DATA] [BROWSER] [INFERRED] [SPECULATIVE]`.

## Status snapshot (2026-10-09, Build J + this session)

| Audit ID | Question | Status | Evidence anchor | Next concrete action |
|---|---|---|---|---|
| R1 | Per-unit/weapon balance values | **BLOCKED** (device) | `evidence/prototype-data/on-device-run.md`; schema + caps recovered offline | user-run `tools/r1_dictionary_dump.js` Frida session; offline import path ready (`notes/r1-prototype-data-pipeline.md`) |
| R2 | Obfuz pool plaintexts | **DONE** (697/697, static) | `evidence/obfuz/obfuz-pool-values.json` | keep decoder reproducible; use values to pin new branch constants |
| R3 | Native tick rate | BLOCKED (device) | B6 note | on-device tick instrumentation |
| R4 | Damage application semantics | BLOCKED (device/live server) | damage-pipeline note §3.5 | Phase 24 controlled scenarios |
| R5 | `$Pg` branch micro-logic | **LARGELY DONE** (Builds I/J) | `evidence/combat/pg-branches-decode.txt`, `band-dataflow{,-2,-3}.txt`, `notes/maxstat-tier-band-decode.md` | only if join-arm values ever matter numerically: `$Pg` jump-table case map (bounded residual) |
| R6 | TakePositions per-bit cell names | PARTIAL (masks CONFIRMED, bit names INFERRED) | `evidence/combat/takepos-cells-decode.txt` | cell-class bit naming via map-prefab cross-ref (offline) |
| R7 | Native visibility/sight rules | OPEN (offline-startable) | sight fields exist (`UnitStateType`) | xref scan of sight consumers in client code |
| R8 | Trajectory type / gravity semantics | OPEN (offline-startable) | `weapon-schema.json` fields 0x3C/0x3E | consumer xref scan in weapon/spawn code (G10) |
| R9 | Client↔server battle protocol | BLOCKED (device) | AIComm class names | TLS-unpin + capture, or Frida hooks |
| R10 | Camera/UI metrics | BLOCKED (device captures) | V8 A/B harness exists | record device gameplay; calibrate v2 pitch ramp |
| R11 | Addressables DLC scan (naval/air prefabs) | BLOCKED (device storage) | APK-side absence proven | pull catalog+bundles from device, re-run `unpack_bundles.py` |

## Priorities (mission §6 mapped to sequencing)

### Priority A — Authoritative gameplay data (R1; unblocks B1, I1/I4/I7/I8 numbers)
* All offline-preparable work is DONE: schema (`evidence/prototype-data/schema.json`),
  ST registry notes, dictionary decode plan, browser import pipeline design.
* Sole blocker: a legitimate device/session run. Do not fake it; do not substitute wiki
  values silently (any substitution stays labeled `BROWSER`/approximation).
* **While blocked**: keep improving the *structure* fidelity that R1 will fill (G11 burst
  plumbing dormant-ready, G12 aiming mask, I2 hash coverage) so captured values drop in
  without new code paths.

### Priority B — Native simulation semantics (offline-startable now)
Ranked by fidelity impact per audit §7 and current residuals:
1. **R7 sight/visibility rules** — converts H4 from design to evidence; needed for MP fog.
2. **R8 trajectory/gravity consumers** — converts G10 (artillery arcs) with `[DECOMP]` facts.
3. **G11 burst wire-up** — `shot_count/shot_int` machinery exists; values arrive with R1;
   ensure sim paths are burst-ready and hash-covered (audit I2/I7).
4. **H1 hash blind spots** — extend `stateString()` to mines + `_chain`; re-baseline goldens.
5. **B7 path-slot system** — only after R5/R6-derived semantics; highest determinism risk;
   keep last in this priority.

### Priority C — Rendering/visual presentation (continues in parallel, V-series)
* V1–V7 shipped (camera angulation, UV root-cause, lighting calibration, flags/insignias,
  FX sprites, original font + result screens). V8 (device refs) blocked with R10.
* Remaining offline: V5 unit damage-state art chain (`[AWAITING R1]` noted in audit §22),
  per-frame FX atlas work (`texFlame` frames now available), announcer cue triggers (I10).
* Never import AOW2-era values; sun/camera calibrations pin to the V8 captures when they land.

### Priority D — Missing content
* R11 is the only path to naval/fixed-wing/hero prefabs beyond the 10 already identified
  (`notes/hero-prefabs-10-remaining.md`); blocked on device storage.
* Map pool (B3): EXT leads noted in audit; offline-resumable via `pipeline/` when any
  second map prefab surfaces.

### Priority E — Networking/determinism
* Lockstep + JIP + replay harness DONE (tests: replay 45/45, lockstep-jip 88/88).
* Next: I12 kernel module extraction + versioned command schemas (prep for Rust/Wasm
  roadmap Phases C–G); R9 wire evidence when device available. Do not replace working
  multiplayer behavior.

## Execution rules (binding)

1. One investigation at a time; produce a note + evidence file + (when behavioral) a
   fold-in + test vector; commit coherently (AGENTS.md §27).
2. A finding is DONE only with stable-ID registry entry + reproduction command.
3. Comment/provenance corrections from decoded evidence are first-class fold-ins
   (they prevent future mis-implementation) but never ride along with behavior changes.
4. Blocked ≠ idle: finish preparatory work, record the exact missing prerequisite in
   the registry, move to the next unblocked item.
5. Never overwrite a working component another workstream is modifying (renderer V-series
   vs sim kernel are disjoint regions; keep it that way).

## Immediate next queue (post-session)

1. **R7 sight/visibility consumer scan** (offline, `[DECOMP]`-startable) → H4.
2. **R8 trajectory/gravity consumer scan** (offline) → G10 artillery arcs.
3. **H1 hash-coverage extension** (offline, small, determinism-protective).
4. **R6 bit-name cross-ref** (offline, map-prefab correlation).
5. R1 device run when the user can supply the session (highest total value; converts B1).
