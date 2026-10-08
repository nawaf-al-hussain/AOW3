/*
 * Task 38 / Build G2 — Obfuz const-pool Frida dump (AOW3 6.9.18, arm64).
 *
 * Captures the $Obfuz$ConstFieldHolder$0 pool segments straight out of the
 * running game — finish path (a) of reverse/notes/obfuz-pool-emulation.md §7.
 * The static path is CLOSED (zero 2048-B field-default-value blocks in
 * global-metadata v31; no Obfuz data resources; v31 has no usage tables), so
 * the ciphertext only exists in memory: both as the InitializeArray source
 * (copied into the fresh byte[2048]) and as the decrypted segment after the
 * in-place byte cipher.
 *
 * Hooks (all offsets are libil2cpp.so static VAs):
 *   0x5264EA8  $mOA wrapper (arr=x0, keyA=w1, salt=w2, vm=x3)
 *              onEnter  -> array holds the CIPHERTEXT (post-InitializeArray)
 *              onLeave  -> array holds the PLAINTEXT segment (post-cipher)
 *              returnAddress-4 identifies the builder call site
 *   0x77122DC  $qk canary  $qk(0x12345678, K) — the game's own integrity check;
 *              seeing it with a=0x12345678 and no abort proves the VM booted
 *   0x08E5ABDC RuntimeHelpers::InitializeArray(arr=x0, fldHandle=x1)
 *              onLeave  -> ciphertext bytes + the FieldInfo* (name readable)
 *
 * After the hooks are installed the script RE-INVOKES both builder .cctors
 * (0x497F474, 0x497F82C) so the segments are captured even when Frida attaches
 * after the boot-time ObfuzRuntimeBootstrap. The re-run is idempotent: the
 * builder allocates a fresh byte[2048], InitializeArray copies the same
 * ciphertext and the same cipher re-encrypts it into the same plaintext, then
 * the arrays are re-stored into the same statics slots.
 *
 * Usage (rooted device / emulator with frida-server):
 *   frida -U -f com.geargames.aow -l obfuz_frida_dump.js -o obfuz_pool_dump.jsonl --runtime=v8
 *   # if attaching to a running game instead, use: frida -U -n AOW3 -l ...
 * Wait for the main menu, then Ctrl-C. Feed the JSONL to the emulator:
 *   python3 reverse/tools/obfuz_pool_emulator.py --dump obfuz_pool_dump.jsonl
 *
 * Every captured record is one line: [OBFUZ]{"ev":...}
 */
'use strict';

var LIB = 'libil2cpp.so';
var VA_WRAPPER = 0x5264EA8;   // $mOA segment-cipher wrapper
var VA_QK      = 0x77122DC;   // $qk canary compare
var VA_INITARR = 0x08E5ABDC;  // RuntimeHelpers::InitializeArray
var VA_CCTOR1  = 0x497F474;   // pool-manager builder .cctor #1 (6 segments)
var VA_CCTOR2  = 0x497F82C;   // pool-manager builder .cctor #2 (2+ segments)

var CALLSITES = {            // builder bl sites -> (manager, statics slot)
    0x497F5F8: ['mgr1', 0x800],
    0x497F650: ['mgr1', 0x1008],
    0x497F6A8: ['mgr1', 0x1810],
    0x497F700: ['mgr1', 0x2018],
    0x497F758: ['mgr1', 0x2820],
    0x497F7B0: ['mgr1', 0x3028],
    0x497F964: ['mgr2', 0x800],
    0x497F9BC: ['mgr2', 0x1008]
};

var g_base = null;
var g_seq = 0;

function emit(obj) {
    console.log('[OBFUZ]' + JSON.stringify(obj));
}

function readArr(ptrArr) {
    // Il2CppArray (arm64 v31): klass 0x0, monitor 0x8, bounds 0x10,
    // max_length 0x18 (uptr), vector 0x20
    var len = ptrArr.add(0x18).readU64().toNumber();
    var data = ptrArr.add(0x20);
    return { len: len, data: data };
}

function b64(ptr, n) {
    var bytes = Memory.readByteArray(ptr, n);
    return IonicB64(bytes);
}

// minimal base64 (no imports beyond frida runtime)
function IonicB64(buf) {
    var u8 = new Uint8Array(buf);
    var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var out = '';
    for (var i = 0; i < u8.length; i += 3) {
        var b0 = u8[i], b1 = i + 1 < u8.length ? u8[i + 1] : 0, b2 = i + 2 < u8.length ? u8[i + 2] : 0;
        out += CH[b0 >> 2] + CH[((b0 & 3) << 4) | (b1 >> 4)];
        out += i + 1 < u8.length ? CH[((b1 & 15) << 2) | (b2 >> 6)] : '=';
        out += i + 2 < u8.length ? CH[b2 & 63] : '=';
    }
    return out;
}

function installHooks(base) {
    g_base = base;

    Interceptor.attach(base.add(VA_WRAPPER), {
        onEnter: function (args) {
            this.arr = args[0];
            this.keyA = args[1].toUInt32 ? args[1].toUInt32() : (this.context.x1 >>> 0);
            this.salt = args[2].toUInt32 ? args[2].toUInt32() : (this.context.x2 >>> 0);
            this.vm = args[3];
            var a = readArr(this.arr);
            this.cipher = b64(a.data, a.len);
            this.clen = a.len;
            this.cs = this.returnAddress.sub(4).sub(base).toUInt32();
        },
        onLeave: function (retval) {
            var a = readArr(this.arr);
            var plain = b64(a.data, a.len);
            var cs = this.cs >>> 0;
            var tag = CALLSITES[cs] || ['?', 0];
            emit({
                ev: 'seg', seq: g_seq++, cs: '0x' + cs.toString(16),
                mgr: tag[0], slot: '0x' + tag[1].toString(16),
                keyA: '0x' + (this.keyA >>> 0).toString(16),
                salt: '0x' + (this.salt >>> 0).toString(16),
                clen: this.clen, cipher: this.cipher, plain: plain
            });
        }
    });

    Interceptor.attach(base.add(VA_QK), {
        onEnter: function (args) {
            emit({
                ev: 'qk',
                a: '0x' + (this.context.x0 >>> 0).toString(16),
                b: '0x' + (this.context.x1 >>> 0).toString(16)
            });
        }
    });

    Interceptor.attach(base.add(VA_INITARR), {
        onEnter: function (args) {
            this.arr = args[0];
            this.fi = args[1];
        },
        onLeave: function (retval) {
            try {
                var a = readArr(this.arr);
                var name = '?';
                try { name = this.fi.readPointer().readCString(); } catch (e) { }
                emit({
                    ev: 'initarr', fi: this.fi.toString(),
                    fname: name, len: a.len, data: b64(a.data, Math.min(a.len, 4096))
                });
            } catch (e) {
                emit({ ev: 'initarr_err', msg: String(e) });
            }
        }
    });

    emit({ ev: 'hooks', base: base.toString(), lib: LIB });
}

function forceCctors() {
    // Re-run both builder cctors: void(*)(void) at the ABI level the implicit
    // MethodInfo* arg register is ignored by these generated cctors.
    [VA_CCTOR1, VA_CCTOR2].forEach(function (va) {
        try {
            var f = new NativeFunction(g_base.add(va), 'void', ['pointer']);
            f(ptr(0));
            emit({ ev: 'cctor_rerun', va: '0x' + va.toString(16) });
        } catch (e) {
            emit({ ev: 'cctor_rerun_err', va: '0x' + va.toString(16), msg: String(e) });
        }
    });
}

function pollForLib(tries) {
    var base = Module.findBaseAddress(LIB);
    if (base) {
        installHooks(base);
        // give the runtime a beat, then force the builds
        setTimeout(forceCctors, 250);
        setTimeout(function () {
            emit({ ev: 'status', note: 'if no seg events seen, reach the main menu (bootstrap runs the cctors)' });
        }, 4000);
    } else if (tries > 0) {
        setTimeout(function () { pollForLib(tries - 1); }, 25);
    } else {
        emit({ ev: 'fatal', msg: LIB + ' not loaded' });
    }
}

emit({ ev: 'start', game: 'com.geargames.aow', ver: '6.9.18' });
pollForLib(4000);   // ~100 s budget
