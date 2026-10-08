# R2 — Obfuz artifact inventory (AOW3 6.9.18)

Created: 2026-10-08 (Task 42, R2). Everything Obfuz-related, inventoried. Version pins:
libil2cpp.so sha256 `8ace05bb…`, dump.cs sha256 `0050e67d…`, global-metadata.dat sha256
`d2e8dd0d…` (re-verified from the XAPK this session), secret-key asset sha256
`81f07f62…683a4`, m_Script key blob sha256 `885f4d0c…1ffe0`, XAPK sha256 `1a41e033…`.

## The resolution in one line

The `$Obfuz$ConstFieldHolder$0` const pool (629 int / 66 string / 2 float = 697 values)
is **fully decoded statically** — no device — by `reverse/tools/obfuz_static_decode.py`;
output: `obfuz-pool-values.json` (this directory). The ciphertext blocks WERE on disk all
along (fdv data blob of global-metadata.dat); Build G2's structural closure (§5/§7 of the
note) was a false negative.

## Artifacts

### Committed tools

- Artifact: static decoder (NEW, R2)
  Path: reverse/tools/obfuz_static_decode.py
  Game version: 6.9.18 (offsets pinned)
  Source: written this session from native disassembly (see note §9)
  SHA-256: see git blob
  Format: python3; inputs libil2cpp.so + global-metadata.dat + 1024-B key blob
  Purpose: full offline 697-value decode; embeds the four semantic self-checks
  Known plaintext: game canary `$GOA(0x720BA23E,0x545EE170,0x98705298)=0x12345678`
  Unknown: none (0 CIPHER_UNSURE)
  Confidence: HIGH

- Artifact: device-transcript consumer (Build H; superseded for recovery, kept for
  optional on-device verification)
  Path: reverse/tools/obfuz_pool_emulator.py (+ obfuz_frida_dump.js, obfuz_synth_dump.py)
  Game version: 6.9.18
  Source: Builds G/G2/H
  Format: python3 + unicorn; consumes obfuz_frida_dump.js JSONL transcripts
  Purpose: re-execute the real native `$GOA`; decode from device dumps
  Confidence: HIGH (its Unicorn `$GOA` harness is the same primitive the static decoder
  uses; canary-validated)

- Artifact: committed secret key
  Path: reverse/tools/obfuz_secret_key.bin
  Game version: 6.9.18
  Source: base APK asset `assets/bin/Data/0f159d0d59e64604b196175cc4fd2f85`, m_Script
  blob @0xB0 (1,024 B = 256 LE u32); re-extracted and byte-compared this session — match
  SHA-256: 885f4d0c3ccc13e2cb6f706b32c401adb9db61b909e25373cd58713c72c1ffe0
  Purpose: `$GOA`/`$gOA` VM key (`_secretKey int[256]`)
  Confidence: HIGH (4 scattered ints independently pinned by the canary opcode chain)

### Evidence (this directory)

- Artifact: decoded pool values (NEW, R2 — the deliverable)
  Path: reverse/evidence/obfuz/obfuz-pool-values.json
  Game version: 6.9.18
  Source: obfuz_static_decode.py over the pinned binaries
  Format: JSON array, 697 records {idx, thunk, start, keyA, salt, keyC, src_slot,
  target, seg, raw, value|float, via, status}
  Purpose: the authoritative Obfuz plaintext (code-level constants)
  Known plaintext: statics+0x64 = 8 (DONT_SHOOT task id), statics+0x14 = 3 ($ce
  threshold), statics+0x374 = -1 (set_FlagShoot), pool[0x364]*pool[0x368] mod 2^32 =
  1000 (siege DEN), 66 coherent log-format strings ('PathSchedError: version=', 'SId ',
  'income ', " doesn't exist on client, " …)
  Unknown: none; every value carries its triple + provenance
  Confidence: HIGH

- Artifact: builder chain decode (Build G2)
  Path: reverse/evidence/obfuz/builder-chain-decode.txt
  Purpose: per-segment builder callsite -> (manager, slot, keyA, salt) table
  Confidence: HIGH for the 8 callsite key pairs (superseded only in WHICH manager the
  holder reads — see below)

- Artifact: builder slot keys (Build G2)
  Path: reverse/evidence/obfuz/builder-slot-keys.json — same content as above, JSON
  Confidence: HIGH

- Artifact: .cctor triple inventory (Build G2; refreshed by R2's parser)
  Path: reverse/evidence/obfuz/pool-cctor-triples.json
  Purpose: 697 accessor triples {thunk, start, keyA, salt, keyC, staticsTarget, src_slot}
  Unknown (fixed by R2): src_slot `0xb8` entries were the static_fields indirection; R2
  re-parses per-callsite segment loads (`ldr x0/x8, [x8, #slot]`, slot != 0xb8)
  Confidence: HIGH (R2 refresh); MEDIUM for the committed G2-era src_slot column

- Artifact: synthetic consumer validation (Build G2/H)
  Path: reverse/evidence/obfuz/synthetic_pool_dump.jsonl + synthetic_expectations.json
  Purpose: plumbing proof of the --dump consumer without a device (identity-keyA CBC)
  Confidence: HIGH for what it claims (plumbing only; no real data)

- Artifact: clean-sandbox portability validation (Build H)
  Path: reverse/evidence/obfuz/build-h-validation.txt
  Purpose: two-command decode reproducibility from a fresh environment
  Confidence: HIGH

- Artifact: pool emulation session log (Build G)
  Path: reverse/evidence/obfuz/pool-emulation.txt
  Purpose: full chain transcript — self-test, thunk/VM/builder disassembly excerpts
  Confidence: HIGH

- Artifact: on-device runbook (Build H; R2-updated)
  Path: reverse/evidence/obfuz/on-device-run.md
  Purpose: OPTIONAL device verification (CBC re-verify on real device bytes + canary
  witness); no longer required for recovery
  Confidence: HIGH

### Correction register (G2 -> R2)

1. "The 8x2048-B ciphertext blocks exist ONLY in device memory" — FALSE. They are in
   the metadata fdv data blob at absolute offsets 0xDBBBD0 + N*0x808 (RVA$0.Data0..6)
   and 0xDBF408 + N*0x808 (RVA$1.Data0..2); the delta-inference over dataIndex entries
   missed them because fdv blocks carry 8-byte alignment padding (span 2056, not 2048).
2. "The holder reads mgr1 segments 0x1008/0x1810" — WRONG MANAGER. The holder reads
   `$Obfuz$RVA$1` (builder .cctor 0x497F82C): segment 0x1008 = RVA1.Data1 @0xDBFC10
   (keyA 0x5B300BF1, salt 0x8952D5F4), segment 0x1810 = RVA1.Data2 @0xDC0418
   (keyA 0xF91F0C58, salt 0x9A457001). RVA$0's segments serve other consumers.
3. String accessor semantics: `$FK(data, start, len, salt, keyC)` — $kK subrange with
   $GOA keyA=salt, salt=keyC (NOT (keyC, salt)); per-string cipher confirmed.
4. Int accessor confirmed: `$gK` -> BitConverter.ToInt32(seg, start) -> `$GOA(raw,
   keyA, salt)` — no CBC chaining at accessor level (0x8EA82F8 disassembled).
