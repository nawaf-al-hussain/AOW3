/*
 * R1 — live prototype/balance dictionary capture (AOW3 6.9.18, arm64, Task 41).
 *
 * Captures the server-delivered prototype dictionaries (BattleBaseDictionary /
 * SharedBaseDictionary / BaseDictionary) as they enter the client, post-DES,
 * plus the resource-configuration version metadata and cache events.
 * Pipeline + hook provenance: reverse/evidence/prototype-data/inventory.{md,json}
 * Runbook: reverse/evidence/prototype-data/on-device-run.md
 *
 * Hooks (libil2cpp.so static VAs, pinned to sha256 8ace05bb...):
 *   0x79209D0 ThreadSafeSerializationManager.DeserializeMessage(int, GearGamesByteBuffer)
 *             -> flow marker: which message types are deserialized (111 = ResourceAnswer)
 *   0x602BA6C ResourceManager.SerializableResourceLoaderAsync<object>.TryLoadResourceFromByteBuffer(MemoryStream, LoadResourceSource)
 *             -> the complete dictionary ST payload (post-unzip MemoryStream buffer)
 *   0x7DBA3B4 CSMainBattleBaseDictionaryReceiver.DoResourceLoaded(result, BattleBaseDictionary)
 *             -> ingestion proof + quick scalar table (counts + per-unit id/price/cp/life/time_train + state0 armor/speed/sight)
 *   0x7DBAA10 CSMainClientResourceConfigurationReceiver.DoMessageReceived(ClientResourceConfiguration)
 *             -> resource-category/version metadata event
 *   0x45A70D0 ResourceInfo.get_Path / 0x45A70F0 get_Crc
 *             -> server-side resource paths + CRCs
 *   0x7D76FE4 AuthorizationCache.Save
 *             -> cache write marker (pull '<persistentDataPath>/rbi' separately)
 *   optional (CAPTURE_DES=true): 0x79875FC DESNetworkCryptoProvider.Decrypt — full plaintext stream (noisy)
 *
 * IL2CPP layout notes (metadata v31): arrays: max_length +0x18, vector +0x20;
 * System.String: length +0x10 (i32), chars +0x14 (UTF-16); List<T>: _items +0x10, _size +0x18.
 * Field offsets below are dump.cs instance offsets (already include the 0x10 header).
 *
 * Usage:
 *   frida -U -f com.geargames.aow -l reverse/tools/r1_dictionary_dump.js -o r1_session.jsonl --runtime=v8
 * Reach the main menu (logon states 17/19-21 fire), optionally run one controlled
 * battle experiment, then Ctrl-C. Sanitize before committing (runbook §6).
 */
'use strict';

var LIB = 'libil2cpp.so';
var CAPTURE_DES = false;

var VA_DESERMSG   = 0x79209D0;
var VA_TRYLOAD    = 0x602BA6C;
var VA_DORLOADED  = 0x7DBA3B4;
var VA_RESCFG     = 0x7DBAA10;
var VA_RI_PATH    = 0x45A70D0;
var VA_RI_CRC     = 0x45A70F0;
var VA_CACHE_SAVE = 0x7D76FE4;
var VA_DES_DECR   = 0x79875FC;

// BattleBaseDictionary instance fields (dump.cs 461699)
var BBD = { weaponTypes: 0x10, unitTypes: 0x18, buildingTypes: 0x20, mineTypes: 0x28,
            fractions: 0x30, boosts: 0x38, troops: 0x40, heroParam: 0x48 };
// UnitType fields (dump.cs 395418)
var UT = { states: 0x18, category: 0x30, type: 0x31, life: 0x32, lifeInt: 0x34,
           time_train: 0x38, upkeep: 0x40, cp: 0x44, price: 0x48, spec: 0x4C, tier: 0xB0 };
// UnitStateType fields (dump.cs 394983)
var UST = { armor: 0x22, armor_type: 0x26, sight: 0x4C, speed: 0x58, rotate: 0x5A,
            radar: 0x5C, regen: 0x72, invisible: 0x70 };

var g_base = null;
var g_seq = 0;

function emit(obj) {
    obj.seq = ++g_seq;
    obj.t = (Date.now() / 1000).toFixed(3);
    console.log('[R1]' + JSON.stringify(obj));
}

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

function readIl2CppArray(arrPtr, maxCap) {
    if (arrPtr.isNull()) return null;
    var len = arrPtr.add(0x18).readU64().toNumber();
    var data = arrPtr.add(0x20);
    var n = Math.min(len, maxCap || (1 << 24));
    return { len: len, data: data, bytes: Memory.readByteArray(data, n) };
}

function readIl2CppString(strPtr) {
    if (strPtr.isNull()) return null;
    try {
        var len = strPtr.add(0x10).readS32();
        if (len <= 0 || len > 4096) return '';
        return strPtr.add(0x14).readUtf16String(len);
    } catch (e) { return null; }
}

function listCount(listPtr) {
    if (listPtr.isNull()) return 0;
    try { return listPtr.add(0x18).readS32(); } catch (e) { return -1; }
}

function listItems(listPtr) {
    return listPtr.isNull() ? ptr(0) : listPtr.add(0x10).readPointer();
}

function readS16(p, off) { return p.add(off).readS16(); }
function readS32(p, off) { return p.add(off).readS32(); }
function readS8(p, off)  { return p.add(off).readS8(); }

function snapDictionary(dict, tag) {
    var out = { ev: 'setdata', what: tag, dict: dict.toString() };
    try {
        out.counts = {
            weaponTypes: listCount(dict.add(BBD.weaponTypes).readPointer()),
            unitTypes: listCount(dict.add(BBD.unitTypes).readPointer()),
            buildingTypes: listCount(dict.add(BBD.buildingTypes).readPointer()),
            mineTypes: listCount(dict.add(BBD.mineTypes).readPointer()),
            fractions: listCount(dict.add(BBD.fractions).readPointer()),
            boosts: listCount(dict.add(BBD.boosts).readPointer()),
            troops: listCount(dict.add(BBD.troops).readPointer())
        };
        // quick scalar table, first 64 units (full decode happens host-side from msg payload)
        var items = listItems(dict.add(BBD.unitTypes).readPointer());
        var n = Math.min(listCount(dict.add(BBD.unitTypes).readPointer()), 64);
        var rows = [];
        for (var i = 0; i < n; i++) {
            var u = items.add(0x20 + i * 8).readPointer();
            if (u.isNull()) continue;
            var row = {
                id: readS32(u, 0x10),          // Entity.id
                category: readS8(u, UT.category),
                type: readS8(u, UT.type),
                life: readS16(u, UT.life),
                lifeInt: readS32(u, UT.lifeInt),
                time_train: readS32(u, UT.time_train),
                upkeep: readS32(u, UT.upkeep),
                cp: readS8(u, UT.cp),
                price: readS32(u, UT.price),
                spec: readS8(u, UT.spec),
                tier: readS32(u, UT.tier)
            };
            try {
                var st = listItems(u.add(UT.states).readPointer());
                if (!st.isNull()) {
                    var s0 = st.add(0x20).readPointer();
                    if (!s0.isNull()) {
                        row.state0 = {
                            armor: readS16(s0, UST.armor), armor_type: readS8(s0, UST.armor_type),
                            sight: readS32(s0, UST.sight), speed: readS8(s0, UST.speed),
                            rotate: readS16(s0, UST.rotate), radar: readS32(s0, UST.radar),
                            regen: readS16(s0, UST.regen), invisible: readS8(s0, UST.invisible)
                        };
                    }
                }
            } catch (e) { row.state0_err = String(e); }
            rows.push(row);
        }
        out.units_head = rows;
    } catch (e) {
        out.err = String(e);
    }
    emit(out);
}

function installHooks(base) {
    g_base = base;

    Interceptor.attach(base.add(VA_DESERMSG), {
        onEnter: function (args) {
            this.type = args[1].toInt32 ? args[1].toInt32() : (this.context.x1 >>> 0);
        },
        onLeave: function (retval) {
            if (this.type === 111 || this.type === 22 || this.type === 110 || this.type === 20) {
                emit({ ev: 'desermsg', type: this.type });
            }
        }
    });

    Interceptor.attach(base.add(VA_TRYLOAD), {
        onEnter: function (args) {
            this.ms = args[1];
            this.src = args[2].toInt32 ? args[2].toInt32() : (this.context.x2 >>> 0);
        },
        onLeave: function (retval) {
            try {
                if (this.ms.isNull()) return;
                var buf = this.ms.add(0x10).readPointer();   // MemoryStream._buffer
                if (buf.isNull()) return;
                var len = buf.add(0x18).readU64().toNumber();
                if (len < 512) return;                        // skip noise
                var a = readIl2CppArray(buf, 1 << 25);
                emit({ ev: 'payload', source: this.src, size: a.len,
                       data_b64: IonicB64(a.bytes) });
            } catch (e) {
                emit({ ev: 'payload_err', msg: String(e) });
            }
        }
    });

    Interceptor.attach(base.add(VA_DORLOADED), {
        onEnter: function (args) {
            var dict = args[2];
            if (dict.isNull()) { emit({ ev: 'setdata_null' }); return; }
            snapDictionary(dict, 'BattleBaseDictionary');
        }
    });

    Interceptor.attach(base.add(VA_RESCFG), {
        onEnter: function (args) {
            try {
                var cfg = args[1];
                if (cfg.isNull()) return;
                // ClientResourceConfiguration.categories: List at 0x20
                var cnt = listCount(cfg.add(0x20).readPointer());
                var items = listItems(cfg.add(0x20).readPointer());
                var names = [];
                for (var i = 0; i < Math.min(cnt, 32); i++) {
                    var cat = items.add(0x20 + i * 8).readPointer();
                    if (cat.isNull()) continue;
                    names.push(readIl2CppString(cat.add(0x10).readPointer()));
                }
                emit({ ev: 'rescfg', categories: cnt, names: names });
            } catch (e) { emit({ ev: 'rescfg_err', msg: String(e) }); }
        }
    });

    [VA_RI_PATH, VA_RI_CRC].forEach(function (va, idx) {
        try {
            Interceptor.attach(base.add(va), {
                onLeave: function (retval) {
                    var s = readIl2CppString(retval);
                    if (s) emit({ ev: idx === 0 ? 'respath' : 'rescrc', value: s });
                }
            });
        } catch (e) { emit({ ev: 'hook_err', va: va, msg: String(e) }); }
    });

    Interceptor.attach(base.add(VA_CACHE_SAVE), {
        onEnter: function () { emit({ ev: 'cache_save' }); }
    });

    if (CAPTURE_DES) {
        Interceptor.attach(base.add(VA_DES_DECR), {
            onEnter: function (args) { this.inB = args[1]; this.outB = args[2]; this.cnt = args[3].toInt32(); },
            onLeave: function (retval) {
                try {
                    var n = retval.toInt32();
                    if (n <= 0 || this.outB.isNull()) return;
                    // ClientExpandableByteBuffer layout is version-specific; emit raw ptr + count only.
                    emit({ ev: 'des', count: n, out: this.outB.toString() });
                } catch (e) { }
            }
        });
    }

    emit({ ev: 'hooks', base: base.toString(), lib: LIB, des: CAPTURE_DES });
}

function pollForLib(tries) {
    var base = Module.findBaseAddress(LIB);
    if (base) {
        installHooks(base);
        setTimeout(function () {
            emit({ ev: 'status', note: 'waiting for logon states 17/19-21; keep the game on the main menu until setdata + payload events appear' });
        }, 4000);
    } else if (tries > 0) {
        setTimeout(function () { pollForLib(tries - 1); }, 25);
    } else {
        emit({ ev: 'fatal', msg: LIB + ' not loaded' });
    }
}

emit({ ev: 'start', game: 'com.geargames.aow', ver: '6.9.18', task: 'R1 dictionary capture' });
pollForLib(4000);
