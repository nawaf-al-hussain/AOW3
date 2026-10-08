# R2 — Obfuz evidence matrix

Created: 2026-10-08 (Task 42). Every row carries its evidence anchor. Binary pins:
libil2cpp.so `8ace05bb…`, global-metadata.dat `d2e8dd0d…` (both re-verified this session).

| Question | Evidence | Result | Confidence |
| --- | --- | --- | --- |
| Obfuz exists | dump.cs image 98 = Obfuz.Runtime.dll; metadata build string `philosophy.obfuz@5932a6f9a6ec`; `Obfuz.EncryptionVM.GeneratedEncryptionVirtualMachine` (dump.cs:1693218) | Present, version-identifiable | HIGH |
| What Obfuz protects | 3,163 accessor call sites / 120 classes (whole-binary BL scan -> dump.cs index); pool = 629 int / 66 string / 2 float | **Code-level constants** of behavior/AI/verification/log systems; NOT resource data, NOT scripts, NOT balance | HIGH |
| Encrypted pools identified | builder .cctors 0x497F474 (mgr `$Obfuz$RVA$0`, 7 segments) + 0x497F82C (`$Obfuz$RVA$1`, 3 segments); fdv blocks at 0xDBBBD0+0x808*N / 0xDBF408+0x808*N | 10 ciphertext blocks, statically located (fdv data blob) | HIGH |
| Pool ciphertext on disk | fdv chain: usage slot (.rela.dyn) -> token cell (0x9931050+) -> fieldRefs (hdr[46]) -> $Obfuz$RVA$0/1 fields -> fdv (hdr[16]) -> dataIndex -> data blob (hdr[18]); dump.cs "Metadata offset" annotations agree; Roslyn content-SHA field names verify the same mechanism on sibling fields | YES (G2's "device-memory-only" claim corrected) | HIGH |
| Cipher identified | `$MOA` -> `$kK` @0x7712FE4: `plain_i = $GOA(ciph_i ^ ciph_{i-1}, keyA, salt)`, tail ^= salt; `$GOA` @0x3DCF784 = 4-round 256-op VM over `_secretKey int[256]`; encrypt twin `$gOA`/`$mOA` (inverse verified: round-trip 0xDEADBEEF) | CBC over the validated VM | HIGH |
| Key recovered | committed `obfuz_secret_key.bin` (m_Script blob, sha 885f4d0c…), re-extracted from the APK this session; canary `$qk(0x12345678, K)` PASS; 4 key ints pinned by hand-decoded canary opcode chain (0x70/0xE1/0x5E/0x54 -> key[219/58/176/2]) | YES (static) | HIGH |
| Plaintext recovered | `obfuz_static_decode.py`: **697/697 OK, 0 CIPHER_UNSURE** — 629 ints, 66 strings, 2 floats | YES — fully, offline | HIGH |
| Decoded values semantically verified | (1) statics+0x64 = 8 = DONT_SHOOT task id (`UnitTaskType` enum, Build E); (2) statics+0x14 = 3 = $ce task threshold (0..11 range); (3) set_FlagShoot = -1; (4) pool[0x364]*pool[0x368] mod 2^32 = **1000** = siege fixed-point DEN (Build F); (5) (pool[4]*pool[8]) mod 2^32 = 0 = valid task id; (6) 66 strings are coherent game log formats | 6 independent semantic proofs | HIGH |
| Contains gameplay data | consumers: UnitAct 487, PathAct 140, FlightAct 119, BattleAct 114, ShotAct 102, BuildingAct 93, CheckAndCalc 81, GAIAct 55, AIComm* ~150, statistics classes — code constants (task ids, thresholds, flags, timing scalars, log formats) | YES — behavior constants (fire discipline, siege fixed-point, desync-log labels, path scheduling) | HIGH |
| Contains balance data | pool = flat constants (no per-unit/weapon/building arrays; no damage/health/speed/price values); balance schema fields absent from the 66 strings; `BattleBaseDictionary` stats are server-delivered (R1) | **NO** | HIGH |
| Part of ResourceAnswer path (R1) | BL scan of DoResourceLoaded 0x7DBA3B4, ProcessDictionary 0x7DBA420, SetData 0x7D24844, ResourceAnswer.get_Type 0x4973AEC, LoadSerializableResourceAsync 0x5047E48: **zero** accessor calls; R1 note §8 boundary upheld | **NO — Obfuz is NOT part of the prototype-data pipeline** | HIGH |
| Static recovery possible | achieved this session (was "one device run away" per Build G2/H) | YES — complete | HIGH |
| Runtime still required? | device run now OPTIONAL: CBC re-verify on real device bytes + canary witness only (cross-check of an already-proven model) | No — optional verification only | HIGH |
| Browser changes | none (evidence-only task; `docs/game.js` untouched) | none | HIGH |

## Mission questions (final answers)

- **Q1 (what does Obfuz protect?):** compile-time constants of obfuscated game code —
  ints (task ids, thresholds, flags, fixed-point factors), strings (log/desync formats),
  2 floats — decrypted at class-init/accessor time by the 256-op EncryptionVM with a
  256-int key shipped as a TextAsset.
- **Q2 (contents):** gameplay *behavior* constants (fire discipline, siege accumulator,
  achievements, path scheduling, AI-command CRC/verification, client-vs-server desync
  checks). NOT unit/weapon/building stats, NOT maps, NOT localization tables, NOT
  scripts, NOT resource metadata.
- **Q3 (plaintext creation):** in memory at class initialization — builder .cctors
  CBC-decrypt the fdv-resident segments (`$MOA`); per-value accessors decrypt on demand
  (`$gK`/`$FK`/`$hK`).
- **Q4 (plaintext consumption):** 3,163 call sites / 120 classes (see matrix row 6);
  anchors: `$Hi` task writes, `$ce` siege gates, `set_FlagShoot`, mode-10 compare.
- **Q5 (static recovery):** YES — complete, reproducible, committed.
- **Q6 (runtime hook if needed):** moot for recovery; optional verification = existing
  `obfuz_frida_dump.js` (wrapper enter/leave = (cipher, plain) pair).
- **Q7 (one-device-session tooling):** existed (Build H) and remains valid as the
  verification path; superseded for recovery by the static decoder.
