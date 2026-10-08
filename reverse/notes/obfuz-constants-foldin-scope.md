# Fold-In Task Scope — R2-decoded Obfuz constants into the Build E/F browser models

Created: 2026-10-09 (Task 44, scoping only — no code change).
**STATUS: EXECUTED as Task 45 (2026-10-09)** — W1 outcomes: (a) statics+0x14 = 3 is
HOLD_POSITION at an EQUALITY gate (R2 "threshold" label corrected), plus DEFEND=2 /
BOMBARD=5 / MINE=6 accessor arms and the mod-3 phase comparison; (b) band numerators
are runtime-derived formulas, NOT static fractions — 300/1000 stays as the labeled
reconstruction; (c) no browser behavior change was evidence-gated (instant siege
release kept, now precisely documented). Evidence: `ce-constants-decode.txt`;
kernel fold-in: `nativeTask` + constants + per-mille accumulator; 877/877 tests. Owner directive
(2026-10-09, post-R2): fold the decoded constants into the Build E/F-derived browser
models (fire-discipline task semantics, per-mille siege accumulator) in a **future
implementation task**; R1's on-device dictionary dump remains the sole blocked capture
for 1:1 balance. This note is that future task's scope of record; audit
`1-to-1-fidelity-audit.md` §10 step 3 references it.

Evidence bases: R2 decode (Task 42 — `obfuz-pool-values.json`, 697/697, matrix HIGH),
`attack-path-fire-discipline.md` §R2 (Build E addendum), `siege-stage-boundary-split.md`
§R2 (Build F addendum), committed traces (`siege-ce-full-trace.txt`, `attack-unitsmove-decode.txt`).
Version pins unchanged: libil2cpp `8ace05bb…`, dump.cs `0050e67d…`, metadata `d2e8dd0d…`.

## 1. Objective

Replace the two remaining reconstruction-shaped surfaces of the browser combat model
with the now-native-confirmed semantics, upgrading them from "observationally
equivalent (MEDIUM)" to "native-shaped (CONFIRMED)":

1. **Build E — fire-discipline task semantics**: the DontShoot flow stops being a bare
   boolean and carries the native task semantics (task ids, idempotence, threshold,
   flag_shoot value) — without adding serialized lockstep state.
2. **Build F — per-mille siege accumulator**: the float `f = t/T` stage ladder becomes
   the native integer per-mille accumulator shape (DEN = 1000, band comparisons at
   N/1000 of the window).

Non-objectives (hard boundaries):
- **No balance values** — `SIEGE_TICK_TO/FROM` (1.6/1.2) stay reconstruction constants;
  the native durations are `UnitType.tick_to_spec` 0x4D / `tick_from_spec` 0x4E =
  server-dictionary data (R1-blocked, Task 41). The fold-in makes the accumulator
  shape native, not the durations.
- **No device work** — the Obfuz device run stays optional cross-checking (matrix row 12).
- **No browser behavior change without a committed evidence anchor** — every delta
  traces to a decoded value or a disassembly line; anything else stays as-is.

## 2. Current state (verified this session, docs/game.js v=46 line refs)

| Surface | Browser today | Native (R2-confirmed) |
| --- | --- | --- |
| Fire discipline state | `u.fireHold` boolean (U-line serialized, spec-bit-20 analog) + `orderedEngagement(u)` predicate (1778) gating 5 fire gates (1802/1823/1854/1898/1933) | task 8 (DONT_SHOOT) driven by persistent spec bit 20; attack order application writes task = NONE (`(V1*V2) mod 2^32 = 0`) + `set_FlagShoot(-1)` + set_Forced; spec re-asserts task 8 after the engagement |
| DontShoot toggle | `commandDontShoot` sets `fireHold = true` unconditionally | `$Hi` idempotence: current task (8) checked against statics+0x64 = 8 BEFORE the write |
| $ce task gate | not modeled (siege driver runs while `order.kind === "siege"` only) | `$ce` gates on task vs statics+0x14 = 3 (polarity = W1-a below) |
| Siege progression | `t += dt; f = t/T; st = f >= 1 ? 2 : f >= 0.3 ? 1 : 0` (1349-1354); T = 1.6/1.2 s float | siege_stage = per-mille fractional-tick accumulator; mode-8 carry `siegeTick += stage/DEN; stage %= DEN` (DEN = pool[0x364]×pool[0x368] mod 2^32 = **1000**); bands compare at N/1000 of the window |
| Siege serialization | `sg{dir}.{stage}` token (686), stage ∈ {0,1,2} | native streams the stage REMAINDER sbyte (ST serializer 0x44A4D9C); browser streams the quantized band — equivalent output, keep |
| mode-10 pattern | — | pool[4]×pool[8] mod 2^32 = 0: constant-zero compare, **no browser impact** (obfuscation artifact, recorded only) |

## 3. Work breakdown

### W1 — Bounded RE pre-step (offline desk work, uses only committed evidence)

Three precise questions, each answerable from already-committed traces + the decoded
pool; each produces an addendum row in its note before any game.js edit:

- **W1-a ($ce task-gate polarity)**: in `siege-ce-full-trace.txt`, resolve the branch
  polarity of the get_Task compare against statics+0x14 = 3. Candidates: (i) task < 3
  (driver runs under NONE/PATROL/DEFEND), (ii) task <= 3 (HOLD included), (iii) an
  equality/inequality on a specific arm. Consequence: whether the browser must PRESERVE
  `u.siege` under defend/bombard orders (currently any non-siege order clears it,
  1347-1348) — a real, evidence-gated fidelity fix candidate.
- **W1-b (stage-band numerators)**: enumerate the ten `get_TickFromSpec`-bound
  comparisons in $ce, resolve their accessor statics offsets, look them up in
  `obfuz-pool-values.json`. Output: the band numerators N (or a statement that the
  bounds are runtime-derived formulas, in which case the 300/1000 reconstruction
  constant stays and is labeled precisely). Converts siege §4 MEDIUM → CONFIRMED or
  bounds it exactly.
- **W1-c (spec-applier vs siege state)**: confirm from the writer scan (set_SiegeStage
  writers = $sC init, $xh ×2, GAICommandRound, ST pair — spec applier absent) that
  GAICommandSpecMode arms never reset the accumulator; check GAICommandRound's stage
  write for relevance to player-order flows.

Effort: bounded — one session segment, zero new tooling (extend `siege_ce_fe_disasm.py`
/ `ce_full_trace.py` outputs; pool lookup is a JSON query).

### W2 — Build E fold-in: fire-discipline task semantics (fold semantics, not state)

Decision of record: **do NOT add a serialized `u.task` field.** The browser's
(order.kind, fireHold, targetId, preferredId) tuple already carries everything the
native task field encodes — v=37 live QA proved the equivalence — and a second
serialized source of truth would create a new desync class for zero fidelity gain
(AGENTS.md §7 determinism [NOW]). Instead:

1. **Native-shaped constants block** (kernel, next to the SIEGE_* consts):
   `TASK_NONE=0 … TASK_DONT_SHOOT=8 … TASK_BERSERK=11` (dump.cs:395395-395410),
   `CE_TASK_THRESHOLD=3` (statics+0x14), `FLAG_SHOOT_FREE=-1` (statics+0x374),
   each commented with its pool offset + decoded value + evidence path.
2. **Derived task getter** `nativeTask(u)` (single source of truth): maps the current
   order/engagement/stance state onto the 0..11 enum — attackMove-with-target →
   TASK_NONE (the `(V1*V2)=0` write), hold → 3, defend → 2, bombard → 5,
   fireHold → TASK_DONT_SHOOT, else TASK_NONE. Used by the fire gates and left as the
   anchor for R5/R6 folds ($Pg statics).
3. **Idempotence**: `commandDontShoot`/`commandCanShoot` become no-ops (no float text,
   no state touch) when `nativeTask(u)` already equals the target task — the $Hi
   compare-before-write semantics.
4. **Fire gates** re-expressed as `nativeTask(u) === TASK_DONT_SHOOT &&
   !this.orderedEngagement(u)` (behavior identical to today's `fireHold && !…`;
   the diff is that the gate now reads the native-shaped predicate, and
   `orderedEngagement` gains the task=NONE + FlagShoot(-1) rationale comments with the
   decoded values inline).
5. `fireHold` remains the serialized spec-bit mirror, unchanged U-line token.

### W3 — Build F fold-in: per-mille siege accumulator

1. Replace the float integrator with an integer tick counter: `u.siege.tk += 1` per
   sim step (dt is fixed at 20 Hz — `t += dt` is exactly tick counting; zero
   determinism change), `T_ticks = dir > 0 ? 32 : 24` at the current reconstruction
   durations.
2. Band evaluation in native shape: `milli = floor(tk * 1000 / T_ticks)`;
   `stage = milli >= 1000 ? 2 : milli >= SIEGE_BAND1_MILLI ? 1 : 0`, where
   `SIEGE_BAND1_MILLI` comes from W1-b (fallback: 300, labeled "reconstruction
   numerator of the confirmed /1000 denominator"). DEN = 1000 becomes a named
   constant `SIEGE_DEN` with the pool proof (pool[0x364]×pool[0x368] mod 2^32) in the
   comment; the mode-8 carry equivalence (browser keeps the rolled-up form; native
   rolls stage into siegeTick) is documented at the constant.
3. Release completion `t >= T && dir < 0` → `tk >= T_ticks`; all other consumers
   (fire-gate `stage < 2` at 1386, `siegeRange` stage >= 2 at 882, `sg` token at 686)
   unchanged.
4. **Boundary-equivalence fixture**: table proving float and integer boundaries
   coincide at current durations (T=32: band-1 at tick 10 → 312/1000 vs f=0.3125;
   T=24: tick 8 → 333 vs 0.333; completion ticks identical) — committed as test
   vectors so the integerization is provably behavior-preserving.

### W4 — Tests (all suites must stay green; baseline 854/854)

- `phase5.test.js`: extend the siege sections — per-mille boundary vectors (stage
  transitions at exact ticks, both directions), release timing via `tk`, DEN constant
  proof (1000) asserted from the committed pool JSON, and — if W1-a/c produce a
  preserve-under-defend change — the new siege/defend interaction vectors.
- `unit-fsm.test.js`: task-semantics vectors — `nativeTask` mapping table, DontShoot
  idempotence no-op, orderedEngagement → TASK_NONE + fire-through + re-assert after
  target death, CanShoot → TASK_NONE.
- `replay.test.js` / `lockstep-jip.test.js`: re-run unchanged — explicit assertion
  that the U-line/hash formats did not move (zero divergence expected and required).
- `node --check` + full suite run; the commit message reports the new honest total.

### W5 — QA + deploy (per AGENTS.md §35)

`?v=N` bump → push → 75 s → curl → live QA: siege a Fortress (ladder timing vs 1.6 s,
band extension, un-siege reverse ladder), dontShoot + explicit attack order (fires
during engagement, resumes holding fire after the kill), 4-tab lockstep checkpoint
hash agreement, zero console errors. Screenshots into `scripts/` as usual.

## 4. Determinism / serialization impact (reviewed against §7)

- No new serialized state: `nativeTask` is derived; `u.siege.tk` is an integer counter
  advanced once per fixed step from already-serialized order state — recomputable by
  any peer/JIP replay; the `sg` token and `stateString()` are byte-identical.
- No float leaves the kernel: the only float removed (f = t/T) was never hashed.
- Commands journal: no new command types; DontShoot idempotence changes UI float
  emission only (non-sim).
- Risk accepted: `tk` advances only inside the siege branch — identical to today's
  `t += dt` gating; no ordering hazard.

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| W1-a polarity changes siege/defend interaction (behavior delta) | Change lands only with the disassembly line in the addendum; otherwise current instant-release stays and is labeled MEDIUM with the polarity question recorded |
| W1-b numerators not statically recoverable (runtime-derived bounds) | Keep 300/1000 with the confirmed denominator; record the exact formula shape found; no invention |
| Integer boundary off-by-one vs float | Boundary-equivalence fixture (W3-4) committed before the swap lands |
| Task getter drifts from order mutations | Single getter + mapping-table vectors; fire gates are its only consumers |

## 6. Definition of Done

- [ ] W1 addenda committed (a/b/c), MEDIUM rows upgraded or precisely bounded
- [ ] Constants block + `nativeTask` + idempotence in game.js, evidence-anchored comments
- [ ] Per-mille accumulator in game.js with `SIEGE_DEN`/`SIEGE_BAND1_MILLI` proven/named
- [ ] New vectors green; full suite honest total reported (854 + delta); replay/lockstep
      zero divergence asserted
- [ ] Live QA per §35 with screenshots; `?v=N` bumped; Pages verified
- [ ] Audit §10 step 3 + both Build E/F notes marked "folded (task 45)"; worklog entry
- [ ] No R1-scope values touched; device run still optional-only

Effort estimate: one implementation session (W1 desk half + W2-W5), assuming W1-a/b
resolve from the committed trace; if W1-b requires new disassembly enumeration, +0.5
session still bounded by the existing $ce trace.
