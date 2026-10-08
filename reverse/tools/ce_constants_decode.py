#!/usr/bin/env python3
"""W1 — $ce runtime-constant decode (Task 45 fold-in, step 1).

R2 decoded the 697 .cctor-initialized ConstFieldHolder values (mgr2 segments).
$ce additionally reads values ON DEMAND via $gK accessor calls whose triples live
inline at the callsites and whose segment source is $Obfuz$RVA$0 (mgr1) —
a segment family R2 never decrypted. This script:

  1. rebuilds the GOA unicorn harness from the committed key (canary self-test);
  2. CBC-decrypts the mgr1 blocks (Data0..Data5, keys from builder-chain-decode.txt)
     plus the mgr2 blocks for cross-validation;
  3. VALIDATES the harness by recomputing every stored int triple of
     obfuz-pool-values.json (697-entry cross-check);
  4. parses siege-ce-full-trace.txt for every $gK callsite
     (roles per obfuz_static_decode.parse_cctor: w1=start, w2=keyA, w3=salt;
     segment slot from the preceding `ldr x0,[x8,#imm]`),
     decodes each value, and prints the surrounding control flow;
  5. dumps +-14-line contexts around every statics+0x14 / +0x374 direct read
     (the task-gate and flag_shoot-write sites).

Output: reverse/evidence/obfuz/ce-constants-decode.txt
"""
import os, sys, json, struct, re

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from obfuz_static_decode import load_so, make_uc, moa_decrypt  # noqa: E402

SO = "/home/z/my-project/scripts/aow3-bin/lib/arm64-v8a/libil2cpp.so"
MD = "/tmp/my-project/scripts/il2cpp/global-metadata.dat"
KEY = os.path.join(HERE, "obfuz_secret_key.bin")
TRACE = os.path.join(HERE, "..", "evidence", "combat", "siege-ce-full-trace.txt")
POOL = os.path.join(HERE, "..", "evidence", "obfuz", "obfuz-pool-values.json")
OUT = os.path.join(HERE, "..", "evidence", "obfuz", "ce-constants-decode.txt")

# slot-in-statics -> (name, metadata offset, keyA, salt)  [builder-chain-decode.txt §2]
SEGS = {
    0x0800: ("mgr1.V0", 0xDBBBD0, 0x6E5EF7E2, 0xA4BA9CCE),
    0x1008: ("mgr1.V1", 0xDBC3D8, 0xC0FB1F9E, 0xD649BD34),
    0x1810: ("mgr1.V2", 0xDBCBE0, 0x1C1B6537, 0x5A586297),
    0x2018: ("mgr1.V3", 0xDBD3E8, 0x354680C3, 0xFBA322BF),
    0x2820: ("mgr1.V4", 0xDBDBF0, 0xC1A1C8CC, 0x44A79BB9),
    0x3028: ("mgr1.V5", 0xDBE3F8, 0x49CF984F, 0xCA71695E),
}
# mgr2 segments (R2) for cross-validation + slot-ambiguity resolution
MGR2 = {
    "mgr2.V0": (0xDBF408, 0x98643925, 0xD993A3D1),
    "mgr2.V1": (0xDBFC10, 0x5B300BF1, 0x8952D5F4),
    "mgr2.V2": (0xDC0418, 0xF91F0C58, 0x9A457001),
}
out_lines = []


def emit(s=""):
    print(s)
    out_lines.append(s)


def main():
    so, segs = load_so(SO)
    goa = make_uc(so, segs, open(KEY, "rb").read())
    md = open(MD, "rb").read()
    canary = goa(0x720BA23E, 0x545EE170, 0x98705298)
    emit("## W1 — $ce runtime-constant decode (Task 45)")
    emit(f"so sha {__import__('hashlib').sha256(open(SO,'rb').read()).hexdigest()[:8]}…  "
         f"md sha {__import__('hashlib').sha256(open(MD,'rb').read()).hexdigest()[:8]}…")
    emit(f"canary $GOA(0x720ba23e,0x545ee170,0x98705298) = {canary:#x} "
         f"{'PASS' if canary == 0x12345678 else 'FAIL'}")
    assert canary == 0x12345678

    S = {name: moa_decrypt(goa, md[off:off + 2048], ka, sa)
         for name, off, ka, sa in SEGS.values()}
    S.update({name: moa_decrypt(goa, md[off:off + 2048], ka, sa)
              for name, (off, ka, sa) in MGR2.items()})
    slot2seg = {slot: S[name] for slot, (name, *_r) in SEGS.items()}

    # -- harness cross-validation against all 697 known values --------------
    pool = json.load(open(POOL))
    ok = bad = 0
    for e in pool:
        if e["thunk"] not in ("int", "float"):
            continue
        seg = S["mgr2.V1"] if e.get("seg") == "0x1008" else S["mgr2.V2"]
        if e.get("start") + 4 > len(seg):
            bad += 1
            continue
        raw = struct.unpack_from("<I", seg, e["start"])[0]
        v = goa(raw, e["keyA"], e["salt"])
        if v == e["value"]:
            ok += 1
        else:
            bad += 1
    emit(f"harness cross-check vs obfuz-pool-values.json: {ok}/{ok + bad} int+float "
         f"triples reproduce {'PASS' if bad == 0 else 'FAIL'}")
    emit()

    # -- parse the $ce trace ------------------------------------------------
    lines = open(TRACE).read().splitlines()
    insns = []
    for i, ln in enumerate(lines):
        m = re.match(r"\s*(0x[0-9a-f]+):\s+(.*?)(?:\s*;.*)?$", ln)
        if m:
            insns.append((i, int(m.group(1), 16), m.group(2).strip()))

    def find_before(n, pat, limit=16):
        for j in range(n - 1, max(0, n - limit), -1):
            m = re.match(pat, insns[j][2])
            if m:
                return j, m
        return None, None

    def ctx(idx, back=14, fwd=8):
        lo = max(0, idx - back)
        return [lines[k].rstrip() for k in range(lo, min(len(lines), idx + fwd))]

    emit("## A. statics+0x14 direct-read sites (task gate / threshold)")
    for n, (idx, addr, ins) in enumerate(insns):
        m = re.match(r"ldr\s+w\d+,\s*\[x\d+, #0x14\]", ins)
        if not m:
            continue
        emit(f"\n--- site {addr:#x} ---")
        emit("\n".join(ctx(idx)))
    emit()

    emit("## B. statics+0x374 direct-read sites (flag_shoot value -1)")
    for n, (idx, addr, ins) in enumerate(insns):
        m = re.match(r"ldr\s+w\d+,\s*\[x\d+, #0x374\]", ins)
        if not m:
            continue
        emit(f"\n--- site {addr:#x} ---")
        emit("\n".join(ctx(idx)))
    emit()

    emit("## C. $gK accessor callsites -> decoded values")
    resolved = []
    for n, (idx, addr, ins) in enumerate(insns):
        if not re.match(r"bl\s+#0x5265b74", ins):
            continue
        start = keyA = salt = slot = None
        lo, hi = {}, {}
        for j in range(n - 1, max(0, n - 16), -1):
            _, a2, i2 = insns[j]
            if slot is None:
                ms = re.match(r"ldr\s+x0,\s*\[x\d+, #(0x[0-9a-f]+)\]", i2)
                if ms:
                    slot = int(ms.group(1), 16)
            mm = re.match(r"mov(?:z)?\s+(w[123]),\s+#(0x[0-9a-f]+|\d+)$", i2)
            if mm:
                lo[mm.group(1)] = int(mm.group(2), 0)
            mk = re.match(r"movk\s+(w[123]),\s+#(0x[0-9a-f]+|\d+),\s*lsl\s+#16", i2)
            if mk:
                hi[mk.group(1)] = int(mk.group(2), 0) << 16
            if len(lo) >= 3 and slot is not None:
                break
        def comp(r):
            return None if r not in lo else hi.get(r, 0) | lo[r]
        start, keyA, salt = comp("w1"), comp("w2"), comp("w3")
        flow = []
        for j in range(n + 1, min(len(insns), n + 8)):
            _, a2, i2 = insns[j]
            if re.match(r"(cmp|b\.|tbz|tbnz|cbz|cbnz)", i2):
                flow.append(f"{a2:#x}: {i2}")
            if len(flow) >= 2:
                break
        near = [f"{insns[j][1]:#x}" for j in range(max(0, n - 30), min(len(insns), n + 30))
                if "VT.get_TickFromSpec" in insns[j][2] or "VT.get_Task" in insns[j][2]
                or "VT.set_FlagShoot" in insns[j][2]]
        if slot is None or start is None or keyA is None or salt is None:
            emit(f"@{addr:#x} slot={slot} start={start} keyA={keyA} salt={salt} -> PARAM MISS")
            continue
        seg = slot2seg.get(slot)
        if seg is None:
            emit(f"@{addr:#x} slot={slot:#x} -> SLOT NOT IN MGR1 MAP")
            continue
        raw = struct.unpack_from("<I", seg, start)[0]
        v = goa(raw, keyA, salt)
        sv = v - 2**32 if v >= 2**31 else v
        resolved.append((addr, slot, start, keyA, salt, v))
        emit(f"@{addr:#x} slot={slot:#x} start={start:#x} keyA={keyA:#x} salt={salt:#x} "
             f"raw={raw:#010x} -> value={v} (signed {sv})")
        emit(f"   flow: {' | '.join(flow) if flow else '-'}")
        if near:
            emit(f"   near: {','.join(near)}")
    emit()
    emit(f"resolved {len(resolved)} accessor sites")

    open(OUT, "w").write("\n".join(out_lines) + "\n")
    print(f"\n-> {OUT}")


if __name__ == "__main__":
    main()
