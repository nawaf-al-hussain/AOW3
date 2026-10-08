/*
 * R1-CAM — camera angulation capture for the consolidated single device pass
 * (AOW3 6.9.18, arm64; V1-b calibration, visual-fidelity-audit §8/§22).
 *
 * Recovers the serialized numbers the browser camera model currently guesses
 * ([SPEC] band 38..66 deg over dist 6.5..46):
 *   - AbstractBattlefieldCamera.m_angulationMin / m_angulationMax (0x38/0x3C)
 *     — the angulation band endpoints; UNITS UNKNOWN (radians vs degrees is
 *     decided by the raw values: >2.0 => radians, <2.0 => degrees; the script
 *     records raw floats and both interpretations);
 *   - CameraDistanceData distance table (DistanceMin/DistanceMax/
 *     DefaultDistanceMax/StartDistance + the tablet/spectator/overscroll
 *     factors) — replaces the browser CAM_DIST_MIN/CAM_DIST_MAX clamps;
 *   - live (CurrentDistance, m_rotationY) samples while the operator zooms /
 *     orbits — verifies the distance range and the yaw wrap range the browser
 *     models as yaw-in-[0,2pi).
 *
 * Hook/poll design (no method-signature guessing beyond RVAs):
 *   H1 get_CurrentDistance  (Offset 0x8279A2C) — fires every battle frame;
 *      first `this` lands the camera instance, then a 500 ms poller emits
 *      `cam` snapshots reading the fields directly (no setter storm).
 *   H2 InternalApply        (Offset 0x8279754) — camera state applied; emits a
 *      `camapply` marker with the current field values (frame-accurate pair).
 *   H3 EnsureRangeRotationY (Offset 0x8279F90, static) — arg0 rotationY in,
 *      retval clamped; every observed (in, out) pair bounds the yaw range.
 *
 * IL2CPP layout notes (metadata v31): field offsets are dump.cs instance
 * offsets (0x10 header included); CameraDistanceData pointer at 0x40 ->
 *   m_startDistance 0x10, DistanceMin 0x2C, DistanceMax 0x30,
 *   DefaultDistanceMax 0x34, StartDistance 0x38, MinTabletAspectRatio 0x3C,
 *   TabletAspectRatioThreshold 0x40, TabletMaxAdditionalDistanceFactor 0x44,
 *   MaxDistanceSettingsFactor 0x48, MaxDistanceSpectatorFactor 0x4C,
 *   MaxDistanceOverscrollFactor 0x50.
 * RVAs pinned to libil2cpp.so sha256 8ace05bb... (dump.cs 326030/326640) —
 * same pin as r1_dictionary_dump.js; any other game version -> STOP, re-pin.
 *
 * Usage (second -l of the consolidated session, see on-device-run.md):
 *   frida -U -f com.geargames.aow \
 *     -l reverse/tools/r1_dictionary_dump.js \
 *     -l reverse/tools/r1_camera_angulation_dump.js \
 *     -o r1_session.jsonl --runtime=v8
 * Camera events print as [R1-CAM]{...}; they may share the transcript with
 * [R1] events (grep separates them). No personal data in this stream; the
 * runbook sanitization pass still applies to the whole transcript.
 */
'use strict';

var LIB = 'libil2cpp.so';

var VA_GET_CURDIST   = 0x8279A2C;   // AbstractBattlefieldCamera.get_CurrentDistance
var VA_INTERNAL_APPLY= 0x8279754;   // AbstractBattlefieldCamera.InternalApply
var VA_ENSURE_ROTY   = 0x8279F90;   // static AbstractBattlefieldCamera.EnsureRangeRotationY

// AbstractBattlefieldCamera instance fields (dump.cs 326088)
var ABC = { rotationY: 0x34, angulationMin: 0x38, angulationMax: 0x3C,
            distanceData: 0x40, cachedCamera: 0x48 };
// CameraDistanceData instance fields (dump.cs 326640)
var CDD = { startDistance0: 0x10, distanceMin: 0x2C, distanceMax: 0x30,
            defaultDistanceMax: 0x34, startDistance: 0x38,
            minTabletAspectRatio: 0x3C, tabletAspectRatioThreshold: 0x40,
            tabletMaxAdditionalDistanceFactor: 0x44,
            maxDistanceSettingsFactor: 0x48, maxDistanceSpectatorFactor: 0x4C,
            maxDistanceOverscrollFactor: 0x50 };

var g_base = null;
var g_seq = 0;
var g_cam = null;            // AbstractBattlefieldCamera instance (first seen)
var g_lastSnap = 0;

function emit(obj) {
    obj.seq = ++g_seq;
    obj.t = (Date.now() / 1000).toFixed(3);
    console.log('[R1-CAM]' + JSON.stringify(obj));
}

function f32(p, off) {
    try { return p.add(off).readFloat(); } catch (e) { return null; }
}

// read the full snapshot off a camera instance; angulation raw + interpreted
function snap(cam, tag) {
    var dd = cam.add(ABC.distanceData).readPointer();
    var aMin = f32(cam, ABC.angulationMin), aMax = f32(cam, ABC.angulationMax);
    var out = { ev: tag || 'cam',
                rotationY: f32(cam, ABC.rotationY),
                angulationMin: aMin, angulationMax: aMax };
    if (aMin !== null && aMax !== null) {
        // units disambiguation (see header): record both readings
        out.angulationMin_deg_ifRad = aMin * 180 / Math.PI;
        out.angulationMax_deg_ifRad = aMax * 180 / Math.PI;
        out.angulationMin_rad_ifDeg = aMin * Math.PI / 180;
        out.angulationMax_rad_ifDeg = aMax * Math.PI / 180;
    }
    if (!dd.isNull()) {
        out.distance = {
            startDistance: f32(dd, CDD.startDistance0),
            distanceMin: f32(dd, CDD.distanceMin),
            distanceMax: f32(dd, CDD.distanceMax),
            defaultDistanceMax: f32(dd, CDD.defaultDistanceMax),
            startDistanceProp: f32(dd, CDD.startDistance),
            minTabletAspectRatio: f32(dd, CDD.minTabletAspectRatio),
            tabletAspectRatioThreshold: f32(dd, CDD.tabletAspectRatioThreshold),
            tabletMaxAdditionalDistanceFactor: f32(dd, CDD.tabletMaxAdditionalDistanceFactor),
            maxDistanceSettingsFactor: f32(dd, CDD.maxDistanceSettingsFactor),
            maxDistanceSpectatorFactor: f32(dd, CDD.maxDistanceSpectatorFactor),
            maxDistanceOverscrollFactor: f32(dd, CDD.maxDistanceOverscrollFactor)
        };
    }
    return out;
}

function pollLoop() {
    setInterval(function () {
        if (!g_cam || g_cam.isNull()) return;
        var now = Date.now();
        if (now - g_lastSnap < 480) return;
        g_lastSnap = now;
        try { emit(snap(g_cam, 'cam')); } catch (e) { /* transient GC motion */ }
    }, 500);
}

function main() {
    var base = Module.findBaseAddress(LIB);
    if (!base) { console.log('[R1-CAM]' + JSON.stringify({ ev: 'err', msg: 'libil2cpp.so not found' })); return; }
    g_base = base;
    emit({ ev: 'attached', base: base.toString(),
           pins: { get_CurrentDistance: VA_GET_CURDIST, internalApply: VA_INTERNAL_APPLY, ensureRotY: VA_ENSURE_ROTY } });

    // H1: every-frame getter -> instance capture
    Interceptor.attach(base.add(VA_GET_CURDIST), {
        onEnter: function (args) {
            if (!g_cam || g_cam.isNull()) {
                var self = args[0];
                if (!self.isNull()) {
                    g_cam = self;
                    emit({ ev: 'instance', ptr: self.toString() });
                    try { emit(snap(self, 'cam_first')); } catch (e) {}
                }
            }
        }
    });

    // H2: InternalApply -> applied-state marker
    Interceptor.attach(base.add(VA_INTERNAL_APPLY), {
        onEnter: function (args) {
            var self = args[0];
            if (self.isNull()) return;
            if (!g_cam || g_cam.isNull()) g_cam = self;
            try { emit(snap(self, 'camapply')); } catch (e) {}
        }
    });

    // H3: static yaw clamp -> (in, out) pairs bound the yaw range
    Interceptor.attach(base.add(VA_ENSURE_ROTY), {
        onEnter: function (args) { this.inR = args[0].readFloat ? args[0].readFloat() : null; },
        onLeave: function (retval) {
            var out = retval.readFloat ? retval.readFloat() : null;
            if (this.inR === null || out === null) return;
            // only emit when clamping actually changed something (noise filter)
            if (Math.abs(this.inR - out) > 1e-4) emit({ ev: 'roty_clamp', in: this.inR, out: out });
        }
    });

    pollLoop();
}

setImmediate(function () {
    try { main(); } catch (e) {
        console.log('[R1-CAM]' + JSON.stringify({ ev: 'err', msg: String(e) }));
    }
});
