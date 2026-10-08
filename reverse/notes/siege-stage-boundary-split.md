# Siege Stage-Boundary Split — native decode inside $xh/$mG/$ce (Build F)

Game: AOW3 6.9.18 (libil2cpp.so sha256 8ace05bb…, dump.cs sha256 0050e67d…).
Session evidence: reverse/evidence/combat/siege-ce-full-trace.txt ($ce full 5,240-ins trace),
siege-xh-mg-decode.txt ($xh + $mG head). Companion: reverse/notes/attack-path-fire-discipline.md
(vtable live-slot convention), siege-native.txt (build A).

## Question

How does `UnitType.tick_to_spec` divide across SIEGE_STAGE_SEIZE_FIRE(0)/ROTATE_WEAPONS(1)/
TRANSFORM(2)? Build A left the per-stage tick split at MEDIUM (v=36).

## 1. Corrected Unit siege vtable slots (CONFIRMED — supersedes build A's siege accessor map)

Build A read the vtable blob at 0x138A480 as flat slots; the blob is 24-byte records
{0x403, fn, MethodInfo}. The live code loads compacted {fn, mi} pairs, so every SETTER's
live slot is its blob slot − 8, and each subsequent getter shifts one record earlier than
build A's map:

| accessor               | blob (static) | live call slot |
|------------------------|---------------|----------------|
| get_SiegeStage         | 0xDC8         | 0xDC8          |
| set_SiegeStage         | 0xDE0         | 0xDD8          |
| get_SiegeTick          | 0xDF8         | 0xDE8          |
| set_SiegeTick          | 0xE10         | 0xDF8          |
| get_SiegeAfterWalkTick | 0xE28         | 0xE08          |
| set_SiegeAfterWalkTick | 0xE40         | 0xE18          |
| get_SiegeBlocked       | 0xE58         | 0xE28          |
| set_SiegeBlocked       | 0xE70         | 0xE38          |

Call-site scan (13 get_SiegeStage / 8 set_SiegeStage sites): writers = $sC(Battle)
@0x46FDCBC (0x46FE73C — init), $xh(Battle, Unit) @0x488B9FC ×2, GAICommandRound
@0x45F2AF8 ×1, plus the ST serializer/deserializer pair. siegeTick (0xA4) is touched
by DIRECT field accesses in $he (1w/5r), $fe (1w/7r), $Ie (2w), $cg (2w/3r), $ig (3w),
$yG (1w), $UG (1w), $Pg (6w/2r), $mG (3w/12r) — no vtable callers at all.

## 2. $xh mode-8 — the stage accumulator carry (CONFIRMED)

$xh(Battle, Unit) @0x488B9FC (1,968 B) is a 10-way mode dispatch on a statics int.
Mode 8 (0x488BAE0..0x488BC18) is the carry/normalization step:

```
w21 = vt[0x8E8](unit)                      ; companion getter
vt[0x908](unit, staticsXor + w21)          ; companion setter
set_SiegeStage(get_SiegeStage() + 0)       ; (w29 = 0 this mode)
w21 = get_SiegeTick()                      ; vt 0xDE8
w0  = get_SiegeStage()
DEN = pool[0x364] * pool[0x368]            ; two Obfuz-pool constants, multiplied
set_SiegeTick(w21 + w0 / DEN)              ; sdiv — integer carry
set_SiegeStage(w0 % DEN)                   ; msub — remainder stays
```

**siege_stage is NOT the 0/1/2 stage enum — it is a fixed-point fractional-tick
accumulator.** Each driver pass adds the pass's fraction (in 1/DEN tick units) into
siege_stage; the mode-8 carry rolls whole ticks into siegeTick and leaves the remainder.
The streamed sbyte (ST serializer 0x44A4D9C) is this remainder byte. The 0/1/2
SIEGE_STAGE_* consts are the SIM-side names for the three behaviour bands evaluated
against the accumulator + tick (see §3), not stored state.

Mode 10 (0x488BCAC) compares a weapon-derived value against pool[4] * pool[8] — the
same multiplier pattern, so the DEN-sized fixed-point scaling recurs across the sim.

## 3. Where the stage bands are evaluated (CONFIRMED structure)

- `$ce(Battle, Unit)` @0x47501F0 (20,956 B; full trace): TEN get_TickFromSpec (vt 0x418)
  calls — every siege behaviour gate (fire windows at 0x4750F78, 0x47516BC/0x4751700,
  0x4752E9C, 0x4752FDC, 0x4753218, 0x47534D0, 0x475359C, 0x3CF4, 0x3F64) compares the
  accumulator/tick state against TickFromSpec-derived bounds; calls $se (0x475757C) for
  the flag_shoot fire-control check and the $hi siege helper.
- `$mG(Battle, Unit)` @0x48609D4 (13,156 B): 12 direct siegeTick reads / 3 writes +
  get_SiegeStage — the auto-siege/after-walk driver; its stage read at 0x486161C
  compares against $Nc(Battle, ·, ·) 0x46D3A60 (tick-math helper), its writes spill
  through stack slots around the siege block.
- `$fe(Battle, Unit)` @0x475AFA4: after-walk timers (1 siegeTick write / 7 reads).
- `$he(Battle, Unit, int)` @0x4758128 (the task-entry teardown helper from build D):
  1 siegeTick write / 5 reads — task entry/exit touches the siege accumulator too.

## 4. The numeric split — Obfuz barrier (residual, precisely bounded)

The boundary fractions (the analog of the tribute's 30% guess) are products/quotients of
`$Obfuz$ConstFieldHolder$0` pool values (statics +0x364, +0x368, +4, +8, +0x14, +0x64,
+0x374 …). The pool is decrypted at runtime by the Obfuz chain: .cctor @0x4975844 →
trampoline 0x5265B74 → runtime-resolved delegate → 0x5265090; the delegate lives in
runtime-initialized IL2CPP class structures, so static recovery requires emulating
IL2CPP class init (Unicorn follow-up). 39,984-byte .cctor fully disassemblable; the
{offset, keyA, keyB} triples are visible per value (e.g. statics+0x130 ← keys
0x6E09FF7F / 0x31C54641) — the crypto is the only missing step.

## 5. Tribute impact (no code change)

The v=36 tribute models the transform as a float fraction (`f = siege.t / T; st =
f >= 1 ? 2 : f >= 0.3 ? 1 : 0`) — observationally equivalent to the native fixed-point
accumulator (both integrate progression and threshold it into three bands), with the
30% boundary remaining the documented reconstruction constant (MEDIUM). The v=36
`sg` U-line token (dir + stage) stays deterministic. No game.js change in this build;
the corrected native model is recorded for the Obfuz-value follow-up.

## Verdict

- CONFIRMED: siege_stage = fixed-point fractional-tick accumulator (mod DEN carry into
  siegeTick; DEN = pool product); corrected live vtable slots for all eight siege
  accessors; writer/reader inventory; $ce as the TickFromSpec-bound behaviour driver.
- MEDIUM (unchanged): the numeric stage-band fractions — Obfuz-encrypted pool values,
  precisely bounded residual (§4).

## R2 addendum (Task 42) — DEN is CONFIRMED = 1000 (per-mille fixed point)

pool[0x364] = 654786763, pool[0x368] = 2863142584 (decoded statically —
`reverse/evidence/obfuz/obfuz-pool-values.json`): **DEN = (A x B) mod 2^32 = 1000**.
siege_stage is a per-mille fractional-tick accumulator (1/1000 tick units); each
driver pass adds its fraction in milli-ticks and the mode-8 carry rolls whole ticks
into siegeTick. The "30%-boundary analog" bands are comparisons at N/1000 of a tick
window. Build E's multiplier pattern at mode 10 (pool[4]*pool[8]) evaluates to 0
(constant-zero obfuscation).

## Task 45 addendum — W1 decode lands; band numerators stay reconstruction (precisely bounded)

The $ce on-demand accessor layer is now decoded too (`ce-constants-decode.txt`; mgr1
segment `$Obfuz$RVA$0.$RVA_Value3` @0xDBD3E8, keys per builder-chain-decode.txt;
harness cross-checked 631/631 against the R2 697-value decode). Outcomes:

1. **The $ce accessor constants are task ids, not band fractions**: (keyA 0x3d,
   salt 0x27428cbf) -> **2 = DEFEND**; (0x11, 0x2927ab7e) -> **5 = BOMBARD**;
   (0xb0, 0xfa9eb6cb) -> **6 = MINE**; (0x2, 0x359e6cf8) -> **-1** (sentinel, the
   flag_shoot-free value). The TickFromSpec gates compare == these constants —
   weapon-variant dispatch, not N/1000 thresholds.
2. **statics+0x14 = 3 is HOLD_POSITION** (equality gate at the get_Task compare
   @0x4750668: `cmp 3, task; b.ne -> state +0x8c8`) and is REUSED as a literal 3
   divisor in the mod-3 phase comparison @0x4751998
   (`sdiv w9, w22, sxtb(vt[0xf08]()); ... msub -> (X/3)%3 vs (unit[0x10])%3; b.eq`).
   The stage bands are therefore runtime-derived formulas (getter quotients + mod-3
   phase + TickFromSpec equality), NOT statically stored N/1000 fractions.
3. **Browser fold-in**: the accumulator is now integer per-mille in the shipped
   kernel (`SIEGE_DEN = 1000`, `tk` tick counter, bands at
   `floor(tk*1000/T)` vs 300/1000) — boundary-equivalent to the former float model
   at the current durations (tick 10 -> 312, tick 32 -> 1000; vectors in
   phase5.test.js). `SIEGE_BAND1_MILLI = 300` remains the reconstruction numerator,
   now labeled with the precise reason: the native band shape is formula-derived
   (item 2), and its parameters are TickFromSpec-dependent (R1-adjacent runtime
   data), not static pool values.
