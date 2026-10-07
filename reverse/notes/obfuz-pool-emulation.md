# Obfuz Const-Pool Emulation — the encryption VM cracked open, secret key
# extracted and validated by the game's own integrity check (Build G)

Game: AOW3 6.9.18 (libil2cpp.so sha256 8ace05bb…, dump.cs sha256 0050e67d…,
global-metadata.dat sha256 d2e8dd0d…, metadata v31).
Session evidence: reverse/evidence/obfuz/pool-emulation.txt (full chain:
self-test transcript, thunk/VM/builder disassembly excerpts, triple table,
segment key inventory, negative-sweep log). Companion notes:
attack-path-fire-discipline.md (Build E) and siege-stage-boundary-split.md
(Build F) — both documented this pool as their residual.
Tool: reverse/tools/obfuz_pool_emulator.py (self-contained; unicorn 2.1.4).

## Question

Can the `$Obfuz$ConstFieldHolder$0` const pool be decoded statically — the
barrier that left Build E's numeric task literals and Build F's stage-band
fractions (DEN = pool[0x364]×pool[0x368], the 30%-boundary analog) at
UNRESOLVED/MEDIUM?

## 1. The obfuscator surface (CONFIRMED)

Image 98 = Obfuz.Runtime.dll (dump.cs:99); metadata build string
`philosophy.obfuz@5932a6f9a6ec`. Per-assembly holders `$Obfuz$ConstFieldHolder$N`
(game instance: TypeDefIndex 12781, dump.cs:463232, statics `$Obfuz$RVA_Value0…`
= the pool slots); accessor generics `$d<T>` in namespace `$a` (`$gK`→int
@0x5265B74, `$GK`→long, `$hK`→float, `$HK`→double, `$iK`/`$FK`→string,
`$fK` string-encrypt, `$IK` byte[], `$jK` array-init); abstract encryptor
`$D : $E` (slots 20-35 = OpCodeCount/int/long/float/double/byte[]/string
encrypt+decrypt pairs + the InitializeArray helper `$nOA`); the concrete VM
`Obfuz.EncryptionVM.GeneratedEncryptionVirtualMachine : $D` (dump.cs:1693218):
`kOpCodeBits = 8` (256 ops), `_secretKey int[]` @0x10, private
`ExecuteEncrypt` @0x3DCC854 (12,080 B) / `ExecuteDecrypt` @0x3DCF7D0
(12,668 B) — 256-case jump tables @0x1B09D64/0x1B09F64, every case a short
ALU chain over (value, salt, immediates, `_secretKey[i]`).

## 2. The int decrypt pipeline (CONFIRMED)

Call sites embed a per-value triple (blobStart, keyA, salt) as immediates:
`$gK(blob, start, keyA, salt)` → `BitConverter.ToInt32(blob, start)` →
class-init chain to the VM singleton → interface walk (slot idx 4) →
**`$GOA(raw, keyA, salt)`** (the vtable slot math [klass+0x298] = (0x298−
0x138)/16 = slot 22 pins the impl). `$GOA` consumes keyA's bytes LSB-first as
up to four opcodes (keyA = 0 → identity) and pipes the value through
`ExecuteDecrypt(value, op, salt)`. All 255 non-zero opcodes appear across the
pool's keys — the op set is fully exercised.

## 3. The secret key (CONFIRMED — extracted)

`ObfuzRuntimeBootstrap.SetUpStaticSecretKey` (@0x3DCC5EC,
RuntimeInitializeOnLoadMethod(2), namespace com.geargames.aow.client.obfuz)
loads `Resources.Load("Obfuz/defaultStaticSecretKey", TextAsset)` (path
recovered from the metadata error literals; null → LogError and a dead VM) →
`TextAsset.bytes` → `$JK` (BlockCopy, raw LE) → `_secretKey`. The asset is in
the base APK at `assets/bin/Data/0f159d0d59e64604b196175cc4fd2f85`
(1,200 B; m_Script = 1,024 B @0xB0 = **256 LE u32**, entry sha256
81f07f62…683a4); the VM's per-case bounds checks (`cmp len, #0xFC` against
`_secretKey[252]`) independently confirm a 256-int key.

## 4. Self-test — the game validates the emulation (CONFIRMED, strongest)

Both pool builders open with a boot-time canary: `K = $GOA(0x720BA23E,
0x545EE170, 0x98705298)` then `$qk(0x12345678, K)` where `$qk(a,b)`
(@0x77122DC) is `cmp w0,w1; b.ne throw` — the game refuses to boot unless the
decryption yields exactly 0x12345678. Running the REAL native `$GOA` code in
Unicorn (whole libil2cpp.so mapped, fake VM object, extracted key) produces
**exactly 0x12345678 — PASS**. The VM, the key, the argument convention and
the opcode pipeline are thereby proven against the game's own assertion; any
pool value is now just `$GOA` + its triple.

## 5. The .cctor triple inventory (CONFIRMED)

The holder's .cctor (@0x4975844, 39,984 B, 9,996 ins) fully parses into **697
pool values** (629 int / 66 string / 2 float), each (thunk, blobStart, keyA,
salt, staticsTarget); int sources = pool segments at statics+0x1008 (×334)
and +0x1810 (×283) of the holder's own provider class. Key anchors in the
table (full JSON: obfuz_cctor_triples.json): +0x04/+0x08 = the Build E task-id
product pair, +0x14 = the $ce task threshold, +0x64 = the DontShoot
idempotence constant, +0x364/+0x368 = the Build F DEN factors, +0x374 = the
set_FlagShoot value. A same-session name-table builder independently loads
statics+4/+8 and uses their PRODUCT as an array index — bounding it to a
task-id range exactly as Build E inferred.

## 6. Segment construction and the byte cipher (CONFIRMED)

Pool segments are `byte[2048]` arrays at pool-manager statics slots
(0x800/0x1008/0x1810/0x2018/0x2820/0x3028/0x3830, one pool manager per
assembly). Builder cctors (0x497F474, 0x497F82C — adjacent to the holder
.cctor) build each: `newarr byte[0x800]` → `InitializeArray(arr,
RuntimeFieldHandle)` → in-place byte-cipher (wrapper 0x5264EA8 → interface
slot 2 → `$mOA`/`$MOA` @0x7712FE4/0x7712AFC) → store. The cipher is CBC-style
over u32 words: `plain_i = $GOA(cipher_i ^ cipher_{i-1}, keyA, salt)`
(prev starts 0; tail bytes XOR salt) — reusing the SAME validated `$GOA`.
All ten captured segment key pairs are in the evidence file.

## 7. Residual (UNRESOLVED, precisely bounded)

The 8×2048-B **ciphertext blocks** behind the `InitializeArray` handles were
not found in global-metadata: exhaustive negative sweeps covered all 486
`__StaticArrayInitTypeSize` arrays, all 28,749 fieldDefaultValues offsets
(CBC heads × 7 key pairs × swapped variants × header-inclusive offsets), and
1,257 usage-token-resolved FieldInfo blobs — zero anchor hits (anchors: the
sim's own (0x1C, 0x3D, 0x27428CBF) single-op triple, V1×V2 task bound, V5/DEN
bounds). The handles are runtime-filled usage slots (file value 0). Finish
paths, cheapest first: (a) Frida one-shot dumping the pool-manager statics
after boot — with §4's validated crypto this instantly yields all 697 values;
(b) resolve `Il2CppCodeGenModule.metadataUsages` for the game assembly
(token → FieldInfo → data) once the exact v31 module struct layout is
confirmed; (c) full-system Unicorn of the builders with a stubbed il2cpp
runtime. Note: the two large arrays adjacent to the holder in dump.cs
(472,129/293,863 B @ metadata 0xD00BA0/0xD73FE8) are MonoScript path tables,
NOT pool data — earlier assumptions tying them to the pool are corrected
here.

## 8. Tribute impact (no code change)

No game.js change in this build: the v=36/v=37 reconstruction constants (30%
stage band, task-replacement semantics, fireHold orderedEngagement) are
observationally equivalent models and stay; the pool decode converts them to
CONFIRMED the moment the segment blocks are dumped (§7a). AOW3_VFX_TAXONOMY
untouched.

## Verdict

- CONFIRMED: full Obfuz const-pool architecture (holder → `$d<T>` accessors →
  interface-dispatched `$GOA` on `GeneratedEncryptionVirtualMachine`), the
  256-op decrypt VM, the secret key (256 ints, extracted from the APK
  TextAsset), the `.cctor` triple grammar with 697 values inventoried, the
  segment/byte-cipher layer with ten key pairs, and — via the game's own
  `$qk` canary — end-to-end correctness of the emulated decryptor.
- UNRESOLVED (bounded): the on-disk location of the eight 2048-B segment
  ciphertext blocks (not in metadata fdv; runtime-resolved handles) — with
  three documented finish paths; the emulator is complete up to that input.
