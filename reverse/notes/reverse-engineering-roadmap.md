# AOW3 Reverse-Engineering Roadmap (prioritized)

**Routing layer — not a second inventory.** The implementation-gap source of truth is
[`1-to-1-fidelity-audit.md`](1-to-1-fidelity-audit.md) (§6 Gap Priority Register,
§7 "RE Needed Next", §8 "Browser Implementation Needed Next"). This roadmap tracks
investigation status, sequencing and rationale; machine-readable state lives in
[`../evidence/registry.json`](../evidence/registry.json). Update both together.

Game version of record: **6.9.18** (`libil2cpp.so` sha256 `8ace05bb…`, metadata `d2e8dd0d…`,
dump.cs `0050e67d…`). Evidence labels per AGENTS.md §9 / mission vocabulary:
`[NATIVE] [DECOMP] [RUNTIME] [ASSET] [SERVER-DATA] [BROWSER] [INFERRED] [SPECULATIVE]`.

## Status snapshot (2026-10-10, R6 closed / Task 59)

| Audit ID | Question | Status | Evidence anchor | Next concrete action |
|---|---|---|---|---|
| R1 | Per-unit/weapon balance values | **BLOCKED** (device) | `evidence/prototype-data/on-device-run.md`; schema + caps recovered offline | user-run `tools/r1_dictionary_dump.js` Frida session; offline import path ready (`notes/r1-prototype-data-pipeline.md`) |
| R2 | Obfuz pool plaintexts | **DONE** (697/697 static + 8/8 live-pool materialized, Task 55) | `evidence/obfuz/obfuz-pool-values.json`, `evidence/obfuz/obfuz-livepool-values.json` | keep both decoders reproducible; use values to pin new branch constants |
| R3 | Native tick rate | BLOCKED (device) | B6 note | on-device tick instrumentation |
| R4 | Damage application semantics | BLOCKED (device/live server) | damage-pipeline note §3.5 | Phase 24 controlled scenarios |
| R5 | `$Pg` branch micro-logic | **LARGELY DONE** (Builds I/J) | `evidence/combat/pg-branches-decode.txt`, `band-dataflow{,-2,-3}.txt`, `notes/maxstat-tier-band-decode.md` | only if join-arm values ever matter numerically: `$Pg` jump-table case map (bounded residual) |
| R6 | TakePositions per-bit cell names | **CONFIRMED** (13/15 bits named; bit space = ClientBattleCell.m_passMask, CheckByMask blocked-state semantics; bits 7/14 reserved) | `notes/r6-bitname-crossref.md`, `evidence/combat/r6-checkbymask-decode.txt` | CLOSED at the statically-reachable limit; per-cell empirical overlay rides the R1 device session |
| R7 | Native visibility/sight rules | **PARTIALLY_CONFIRMED** (pass 1: server-authoritative command stream + calcSightCurr; pass 2: client-core kernel + shape mechanism; pass 3: membership CONTRACT decoded — \|dx\| ≤ (sbyte)fogLines[r][\|dy\|]/2, D=2 half-cell fixed-point, $ec R=15/S=31/M=0xFF/N=3, $iu producer claim corrected; fogLines byte VALUES blocked-static: virtual-setter producer needs script.json/device) | `notes/sight-fog-native-analysis.md`, `evidence/fog/*`, `evidence/vision/*` (incl. `ik-ec-constants-decode.txt`), `notes/sight-visibility-native-analysis.md` | CLOSED at the statically-reachable limit; optional re-open with script.json (vtable closure → table bytes); dynamic sight terms (in_forest provider, boosts) remain audit items |
| R8 | Trajectory type / gravity semantics | **PARTIAL** (structure offline 2026-10-10; numeric arc math needs .so) | `evidence/combat/trajectory-gravity-consumer-scan.txt`, `notes/r8-trajectory-gravity-consumers.md` | numeric .so pass at the 392 recorded RVAs; browser arc model structurally buildable now (values drop in with R1) |
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
1. **R7 pass 3 — membership contract DECODED (Task 57)** — `$Ik` D=2 (inclusive,
2. **R8 trajectory/gravity consumers** — STRUCTURE RECOVERED (engine taxonomy Linear0..UpAndSelfDirected6, gravity/100, duration-triple sim timing); converts G10's structure now, numerics wait for .so.
3. **G11 burst wire-up** — `shot_count/shot_int` machinery exists; values arrive with R1;
   ensure sim paths are burst-ready and hash-covered (audit I2/I7).
4. ~~**H1 hash blind spots**~~ — **DONE (Task 58, v=59)**: mines (M-lines) + `_chain` + behavior-timer block + cmdSeq serialized; golden structure assertions re-baselined; exposed + fixed the JIP clientless-window archive hole (lockstep-jip).
5. ~~**B7 path-slot system** — only after R5/R6-derived semantics~~ — R6 semantics now CLOSED (Task 59); B7 remains highest determinism risk, keep last in this priority.

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

1. ~~R7 sight/visibility consumer scan~~ — **DONE (passes 1–3, Tasks 54–57)**;
   CLOSED at the statically-reachable limit, optional re-open gated on script.json.
2. ~~R8 trajectory/gravity consumer scan~~ — **DONE (structural) 2026-10-10**;
   numeric .so pass queued on APK re-acquisition (392 RVA anchors ready).
3. ~~**H1 hash-coverage extension**~~ — **DONE (Task 58, 2026-10-10)**; mined fields, chain guard, behavior timers and cmdSeq now hash-covered; JIP snapshot hole found + fixed on the way.
4. ~~**R6 bit-name cross-ref**~~ — **DONE (Task 59, 2026-10-10)**; 13/15 bits named from
   ClientBattleCell.m_passMask consts + terrain LUT + writer census; takepos masks are
   blocked-state masks (CheckByMask); prefab scan proves the cell grid is server data.
5. R1 device run when the user can supply the session (highest total value; converts B1;
   can carry the R6 per-cell overlay dump).
6. R7 re-open (optional, tooling-gated): Il2CppDumper script.json for vtable closure
   ($ZM/$Pn/$HS callers) → fogLines bytes → reveal-shape fold-in if hand-tuned.
