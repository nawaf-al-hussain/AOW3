#!/usr/bin/env node
// Lockstep multi-party test — join-in-progress (JIP) + spectator (PROTO 2).
//   baseline 2P lockstep hash agreement,
//   spectator JIP catch-up (welcome archive replay -> live cf stream),
//   tampered archive detected via checkpoint hashes,
//   player seat reclaim (guest leaves, JIP player catches up, gates the host),
//   lost-peer stall vacate (host continues, seat opens),
//   rematch with a spectator over the live session.
// Like the other suites this extracts the SHIPPED kernel verbatim from
// docs/game.js (SIM KERNEL markers) and drives it in a vm sandbox.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'docs', 'game.js'), 'utf8');

const bIdx = src.indexOf('// ---- SIM KERNEL BEGIN');
const eIdx = src.indexOf('// ---- SIM KERNEL END');
if (bIdx < 0 || eIdx < 0 || eIdx < bIdx) {
  console.error('SIM KERNEL markers missing in docs/game.js');
  process.exit(1);
}
const start = src.indexOf('\n', bIdx) + 1;
const end = src.lastIndexOf('\n', eIdx) + 1;
let kernel = src.slice(start, end);
kernel += '\n;globalThis.__K = { Sim, Commands, LockstepSession, PROTO, INPUT_DELAY, CHECKPOINT, STALL_VACATE_MS, Net, TICK_RATE, MAP_W, MAP_H };\n';

const sandbox = { console, performance, setTimeout, clearTimeout, setInterval, clearInterval };
sandbox.window = sandbox;
sandbox.Math = Object.create(Math);
{
  let s = 42 >>> 0;
  sandbox.Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
{
  const ctx = { filename: 'data' };
  for (const f of ['stats.js', 'weapons.js', 'units.js', 'buildings.js', 'factions.js', 'index.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'data', f), 'utf8'), sandbox, ctx);
}
vm.runInContext(kernel, sandbox, { filename: 'kernel.js' });
const K = sandbox.__K;
if (!K.LockstepSession || K.PROTO !== 2) {
  console.error('kernel extraction failed (LockstepSession/PROTO missing)');
  process.exit(1);
}
const { Sim, Commands, LockstepSession, PROTO, CHECKPOINT } = K;
const DT = 1 / 20;

// ---- synchronous loopback transports with envelope addressing ----
let TRID = 0;
class FakeTr {
  constructor(net) {
    this.rid = 'tr' + (++TRID);
    this.net = net;           // shared message bus (list of transports)
    net.push(this);
    this.dead = false;
    this._msg = null;
  }
  onMsg(fn) { this._msg = fn; }
  onClose() {}
  send(m) { this.deliver(Object.assign({}, m, { f: this.rid, to: undefined })); }
  sendTo(rid, m) { this.deliver(Object.assign({}, m, { f: this.rid, to: rid })); }
  deliver(m) {
    if (globalThis.__dbg) console.log("[wire]", this.rid, "->", m.a, "to", m.to);
    if (this.dead) return;
    for (const tr of this.net)
      if (tr !== this && !tr.dead)
        tr._msg && tr._msg(m);
  }
  drop() { this.dead = true; }
}

// ---- a driven endpoint: session + sim + commands, mirrors the rAF loop ----
function makeEndpoint(name, slot, opts = {}) {
  const tr = new FakeTr(NET);
  const sess = new LockstepSession(tr, slot, null, opts);
  const ep = { name, sess, sim: null, cmds: null, tr };
  return ep;
}
const NET = [];
function attachGame(ep, seed, slot, spec) {
  ep.sim = new Sim(seed >>> 0);
  ep.sim.spectate = !!spec;
  ep.sim.viewSlot = slot;
  ep.cmds = new Commands(ep.sim);
  ep.cmds.outbound = spec ? () => false : (c) => ep.sess.local(c, ep.sim.tick);
  ep.sess.cmds = ep.cmds;
}
// one rAF-equivalent frame; fed clients catch up at the production budget (90)
function stepEP(ep) {
  const catching = ep.sess.fed && !ep.sess.liveSent && ep.sim.tick < ep.sess.catchupUntil;
  const budget = catching ? 90 : 1;
  for (let k = 0; k < budget; k++) {
    const t = ep.sim.tick;
    ep.sess.pump(t);
    if (!ep.sess.ready(t)) break;
    ep.sess.apply(t);
    ep.sim.step(DT);
    ep.sess.afterStep(t, ep.sim);
    if (catching && ep.sim.tick >= ep.sess.catchupUntil)
      ep.sess.markLive();
  }
}
function drive(eps, frames) {
  for (let i = 0; i < frames; i++)
    for (const ep of eps) stepEP(ep);
}
// occasional orders from both players (mixed types, deterministic choice)
function issueOrders(host, guest, jip) {
  const t = host.sim.tick;
  if (t % 37 === 0) host.cmds.issue({ type: 'produce', defId: 'ilight', owner: 1 });
  if (t % 41 === 0) host.cmds.issue({ type: 'produce', defId: 'iheavy', owner: 1 });
  if (t % 53 === 0) {
    const u = host.sim.units.find((u) => u.owner === 1 && u.garrison === undefined);
    if (u) host.cmds.issue({ type: 'move', ids: [u.id], x: (u.x + 3) | 0, y: (u.y + 2) | 0 });
  }
  if (t % 43 === 0) guest.cmds.issue({ type: 'produce', defId: 'ilight', owner: 2 });
  if (t % 59 === 0) {
    const u = guest.sim.units.find((u) => u.owner === 2 && u.garrison === undefined);
    if (u) guest.cmds.issue({ type: 'move', ids: [u.id], x: (u.x - 2) | 0, y: (u.y + 3) | 0 });
  }
  if (jip && jip.sim && jip.sim.tick > jip.sess.catchupUntil && t % 47 === 0) {
    const u = jip.sim.units.find((u) => u.owner === 2 && u.garrison === undefined);
    if (u) jip.cmds.issue({ type: 'move', ids: [u.id], x: (u.x + 1) | 0, y: (u.y - 3) | 0 });
  }
}

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  ok - ' + label); }
  else { fail++; console.log('  FAIL - ' + label); }
}

// ===========================================================================
console.log('lockstep-jip: PROTO', PROTO);

// ---- 1. baseline 2P lockstep still agrees (regression guard) ----
{
  const host = makeEndpoint('host', 1);
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 424242, 1, false);
  attachGame(guest, 0, 2, false); // seed comes from the start packet
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' }); // pre-game arm
  const seed = 987654321;
  host.sess.beginMatch(seed);
  // Mp.launch/begin parity: BOTH sides rebuild their sim with the match seed
  attachGame(host, seed, 1, false);
  attachGame(guest, seed, 2, false);
  drive([host, guest], 400);
  for (let f = 0; f < 400; f++) { stepEP(host); stepEP(guest); issueOrders(host, guest, null); }
  ok(host.sim.tick >= 380 && guest.sim.tick >= 380, 'baseline: both peers advanced (t=' + host.sim.tick + '/' + guest.sim.tick + ')');
  let agree = true;
  for (let t = CHECKPOINT; t <= 380; t += CHECKPOINT) {
    const a = host.sess.myHash.get(t), b = guest.sess.myHash.get(t);
    if (a && b && a !== b) agree = false;
  }
  ok(agree, 'baseline: checkpoint hashes agree host vs guest');
  ok(!host.sess.desynced && !guest.sess.desynced, 'baseline: no desync');
}

// ---- 2. spectator JIP mid-match: catch-up archive -> live cf stream ----
{
  const host = makeEndpoint('host', 1, {
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f1: f[1], f2: f[2] })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) => [
        ...(h[1] !== undefined ? [{ t, h: h[1], s: 1 }] : []),
        ...(h[2] !== undefined ? [{ t, h: h[2], s: 2 }] : [])
      ])
    })
  });
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 111222333, 1, false);
  attachGame(guest, 0, 2, false);
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(555444333);
  attachGame(host, 555444333, 1, false);
  attachGame(guest, 555444333, 2, false);
  // run 220 frames of 2P battle
  for (let f = 0; f < 220; f++) { stepEP(host); stepEP(guest); issueOrders(host, guest, null); }
  const W = host.sim.tick;
  ok(W >= 200, 'mid-match tick reached (W=' + W + ')');
  // spectator joins
  let welcomed = null;
  const spec = makeEndpoint('spec', 2, { onWelcome: (m) => { welcomed = m; } });
  spec.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!welcomed, 'spectator received welcome');
  ok(welcomed.role === 'spec', 'joiner downgraded to spectator (P2 occupied)');
  ok(welcomed.seed === 555444333 && welcomed.tick === W, 'welcome carries seed + host tick');
  ok(welcomed.arch.length > 0 && welcomed.hashes.length > 0, 'welcome carries archive frames + hashes');
  attachGame(spec, welcomed.seed, 1, true);
  spec.sess.beginFed(welcomed);
  // drive all three; host must NOT stall while the spec catches up
  let hostStalledMidCatchup = false;
  for (let f = 0; f < 400 && spec.sim.tick < W + 60; f++) {
    if (spec.sim.tick < W && !host.sess.ready(host.sim.tick)) hostStalledMidCatchup = true;
    for (const ep of [host, guest, spec]) stepEP(ep);
    issueOrders(host, guest, null);
  }
  ok(spec.sim.tick >= W + 60, 'spectator caught up and ran live (t=' + spec.sim.tick + ' vs W=' + W + ')');
  ok(!hostStalledMidCatchup, 'host never gated on the catching-up spectator');
  ok(spec.sess.liveSent, 'spectator marked live (no packets to publish)');
  let agree1 = true, agree2 = true;
  for (let t = CHECKPOINT; t <= spec.sim.tick - (spec.sim.tick % CHECKPOINT); t += CHECKPOINT) {
    const a = spec.sess.myHash.get(t), b1 = spec.sess.peerHash.get(t), b2 = spec.sess.peerHash2.get(t);
    if (a && b1 && a !== b1) agree1 = false;
    if (a && b2 && a !== b2) agree2 = false;
  }
  ok(agree1, 'spectator hash == host hash at every verified checkpoint');
  ok(agree2, 'spectator hash == guest hash at every verified checkpoint');
  ok(!spec.sess.desynced, 'spectator: no desync');
  ok(host.sim.hashState() === spec.sim.hashState(), 'spectator state hash == host live hash at the same tick');
}

// ---- 3. tampered archive is detected by the spectator ----
{
  const host = makeEndpoint('host', 1, {
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f1: f[1], f2: f[2] })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) => [
        ...(h[1] !== undefined ? [{ t, h: h[1], s: 1 }] : []),
        ...(h[2] !== undefined ? [{ t, h: h[2], s: 2 }] : [])
      ])
    })
  });
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 777888999, 1, false);
  attachGame(guest, 0, 2, false);
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(123123123);
  attachGame(host, 123123123, 1, false);
  attachGame(guest, 123123123, 2, false);
  for (let f = 0; f < 180; f++) { stepEP(host); stepEP(guest); issueOrders(host, guest, null); }
  let welcomed = null;
  const spec = makeEndpoint('spec', 2, { onWelcome: (m) => { welcomed = m; } });
  spec.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!welcomed, 'tamper: welcome received');
  // corrupt one archived frame (drop a host command)
  const victim = welcomed.arch.find((e) => e.f1.length > 0);
  if (victim) victim.f1 = [];
  attachGame(spec, welcomed.seed, 1, true);
  spec.sess.beginFed(welcomed);
  let desyncAt = -1;
  spec.sess.onDesync = (t) => { desyncAt = t; };
  for (let f = 0; f < 400 && spec.sim.tick < welcomed.tick + 20; f++)
    for (const ep of [host, guest, spec]) stepEP(ep);
  ok(desyncAt > 0, 'tampered archive detected via checkpoint hash (desync @' + desyncAt + ')');
}

// ---- 4. player seat reclaim (guest leaves, JIP player catches up + gates) ----
{
  const host = makeEndpoint('host', 1, {
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f1: f[1], f2: f[2] })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) => [
        ...(h[1] !== undefined ? [{ t, h: h[1], s: 1 }] : []),
        ...(h[2] !== undefined ? [{ t, h: h[2], s: 2 }] : [])
      ])
    })
  });
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 444555666, 1, false);
  attachGame(guest, 0, 2, false);
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(321321321);
  attachGame(host, 321321321, 1, false);
  attachGame(guest, 321321321, 2, false);
  for (let f = 0; f < 160; f++) { stepEP(host); stepEP(guest); issueOrders(host, guest, null); }
  // guest leaves (bye)
  guest.tr.send({ a: 'bye' });
  ok(!host.sess.activeP2(), 'seat vacant after guest bye');
  // host must NOT stall with an empty seat
  const hBefore = host.sim.tick;
  drive([host], 60);
  ok(host.sim.tick > hBefore + 50, 'host keeps ticking with a vacant seat (t=' + host.sim.tick + ')');
  // JIP player arrives
  let welcomed = null;
  const jip = makeEndpoint('jip', 2, { onWelcome: (m) => { welcomed = m; } });
  jip.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!welcomed && welcomed.role === 'player', 'JIP joiner claimed the vacant player seat');
  ok(welcomed.slot === 2, 'JIP seat is slot 2');
  attachGame(jip, welcomed.seed, 2, false);
  jip.sess.beginFed(welcomed);
  const W2 = welcomed.tick;
  let hostGatedDuringCatchup = false;
  for (let f = 0; f < 500 && jip.sim.tick < W2 + 80; f++) {
    if (!jip.sess.liveSent && !host.sess.ready(host.sim.tick)) hostGatedDuringCatchup = true;
    for (const ep of [host, jip]) stepEP(ep);
    issueOrders(host, guest, jip);
  }
  ok(jip.sess.liveSent, 'JIP player reached the live edge and announced it');
  ok(!hostGatedDuringCatchup, 'host did not gate while the JIP player was catching up');
  ok(jip.sim.hashState() === host.sim.hashState(), 'JIP player state hash == host live hash');
  // JIP player now gates the host: cut its packets -> host freezes, not diverges
  const tJ = host.sim.tick;
  jip.tr.dead = true; // silence the JIP player
  drive([host], 30);
  ok(host.sim.tick > tJ && host.sim.tick <= tJ + host.sess.delay + 1, 'host advances only through the published horizon, then freezes (t=' + host.sim.tick + ')');
  const tFrozen = host.sim.tick;
  drive([host], 20);
  ok(host.sim.tick === tFrozen, 'host fully frozen while the live JIP player is silent');
  jip.tr.dead = false;
  drive([host, jip], 80);
  ok(host.sim.tick > tJ, 'host resumes when the JIP player publishes again');
  let divAt = -1;
  for (let ct = CHECKPOINT; ct <= Math.min(host.sim.tick, jip.sim.tick); ct += CHECKPOINT) {
    const a = host.sess.myHash.get(ct), b = jip.sess.myHash.get(ct);
    if (a && b && a !== b) { divAt = ct; break; }
  }
  // a resumed catch-up client legitimately trails the hub by the cf pipeline
  // depth (~2 ticks); correctness = checkpoint hashes at co-ticks, not raw
  // live-hash equality at unequal ticks
  ok(divAt === -1, 'hashes agree at every co-tick checkpoint after resume');
}

// ---- 5. lost-peer stall vacate (BC tab close: no bye) ----
{
  const host = makeEndpoint('host', 1);
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 999000111, 1, false);
  attachGame(guest, 0, 2, false);
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(654654654);
  attachGame(host, 654654654, 1, false);
  attachGame(guest, 654654654, 2, false);
  for (let f = 0; f < 100; f++) { stepEP(host); stepEP(guest); }
  // guest tab dies silently (BC has no close event)
  guest.tr.drop();
  let peerLeft = false;
  host.sess.onPeerLeave = () => { peerLeft = true; };
  const h0 = host.sim.tick;
  drive([host], 5);
  ok(host.sim.tick > h0 && host.sim.tick <= h0 + host.sess.delay + 1, 'host advances through the horizon only (t=' + host.sim.tick + ')');
  const h0b = host.sim.tick;
  drive([host], 10);
  ok(host.sim.tick === h0b, 'host stalls while the peer is merely silent');
  host.sess.stallSince = performance.now() - (K.STALL_VACATE_MS + 1000); // backdate watchdog
  drive([host], 10);
  ok(peerLeft, 'watchdog vacated the lost seat');
  const h1 = host.sim.tick;
  drive([host], 60);
  ok(host.sim.tick > h1 + 50, 'host continues after vacate (t=' + host.sim.tick + ')');
}

// ---- 6. rematch with a spectator on the live session ----
{
  const host = makeEndpoint('host', 1, {
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f1: f[1], f2: f[2] })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) => [
        ...(h[1] !== undefined ? [{ t, h: h[1], s: 1 }] : []),
        ...(h[2] !== undefined ? [{ t, h: h[2], s: 2 }] : [])
      ])
    })
  });
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 246813579, 1, false);
  attachGame(guest, 0, 2, false);
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(192837465);
  attachGame(host, 192837465, 1, false);
  attachGame(guest, 192837465, 2, false);
  for (let f = 0; f < 120; f++) { stepEP(host); stepEP(guest); }
  let welcomed = null;
  const spec = makeEndpoint('spec', 2, { onWelcome: (m) => { welcomed = m; } });
  spec.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  attachGame(spec, welcomed.seed, 1, true);
  spec.sess.beginFed(welcomed);
  for (let f = 0; f < 200; f++) { for (const ep of [host, guest, spec]) stepEP(ep); }
  ok(spec.sim.hashState() === host.sim.hashState(), 'rematch-pre: spectator in sync');
  // host relaunches (rematch): fresh seed over the same session
  const seed2 = 555777999;
  host.sess.reset();
  host.sess.beginMatch(seed2);
  ok(!!welcomed && welcomed.tick === 0 && welcomed.seed === seed2, 'spectator received fresh tick-0 welcome for the rematch');
  attachGame(host, seed2, 1, false);
  attachGame(spec, seed2, 1, true);
  spec.sess.beginFed(welcomed);
  // guest re-begins too (start packet -> Mp.onGuestStart resets the session)
  guest.sess.reset();
  attachGame(guest, seed2, 2, false);
  for (let f = 0; f < 240; f++) { for (const ep of [host, guest, spec]) stepEP(ep); }
  let rdiv = -1;
  const minT = Math.min(host.sim.tick, guest.sim.tick, spec.sim.tick);
  for (let ct = CHECKPOINT; ct <= minT; ct += CHECKPOINT) {
    const a = host.sess.myHash.get(ct), b = guest.sess.myHash.get(ct), c = spec.sess.myHash.get(ct);
    if (a && b && c && (a !== b || a !== c)) { rdiv = ct; break; }
  }
  ok(rdiv === -1, 'rematch: host, guest and spectator agree at every co-tick checkpoint');
  ok(!host.sess.desynced && !spec.sess.desynced, 'rematch: no desync anywhere');
}

// ---- 7. welcome-lost retry: a re-hello from a registered client while the
// match is live must be answered with a FRESH welcome (the joiner's page was
// still baking assets, so its startGame discarded the first payload; the
// stranded-forever regression). Host-side contract: re-run the live join path
// (role re-decided, client entry overwritten, up-to-date snapshot).
{
  NET.length = 0; // isolate: sections 1-6 endpoints share the bus and their
                  // still-live hosts would answer this section's hellos too
  const host = makeEndpoint('host', 1, {
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f1: f[1], f2: f[2] })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) => [
        ...(h[1] !== undefined ? [{ t, h: h[1], s: 1 }] : []),
        ...(h[2] !== undefined ? [{ t, h: h[2], s: 2 }] : [])
      ])
    })
  });
  const guest = makeEndpoint('guest', 2);
  attachGame(host, 888111222, 1, false);
  attachGame(guest, 0, 2, false);
  guest.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(737373);
  attachGame(host, 737373, 1, false);
  attachGame(guest, 737373, 2, false);
  for (let f = 0; f < 120; f++) { stepEP(host); stepEP(guest); issueOrders(host, guest, null); }
  // joiner whose assets are still baking: a bare transport with a welcome
  // collector and NO session/game (startGame would fail, payload discarded)
  const welcomes = [];
  const joiner = new FakeTr(NET);
  joiner._msg = (m) => { if (m.a === 'welcome') welcomes.push(m); };
  joiner.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(welcomes.length === 1, 'retry: live join answered with welcome #1');
  // the joiner discards welcome #1 (!ready) and keeps its hello timer alive
  for (let f = 0; f < 40; f++) { stepEP(host); stepEP(guest); issueOrders(host, guest, null); }
  joiner.send({ a: 'hello', proto: PROTO, role: 'player' }); // the retry
  ok(welcomes.length === 2, 'retry: re-hello answered with a SECOND welcome (was: stranded)');
  ok(welcomes[1].tick > welcomes[0].tick, 'retry: welcome #2 carries a fresher snapshot (t=' + welcomes[0].tick + ' -> ' + welcomes[1].tick + ')');
  ok(welcomes[1].role === 'spec' && welcomes[1].slot === 0, 'retry: seat still occupied -> downgraded to spectator');
  ok(welcomes[1].gen === host.sess.matchGen, 'retry: welcome gen matches the live match');
  // full consumer path on welcome #2: the joiner finally "becomes ready" —
  // attach the session + game ON the joiner's own transport (its rid is the
  // registered client the host's targeted cf stream addresses). Session slot 2
  // (hub=false, like Mp.makeSession(2)); the spectator's sim views as slot 1.
  const spec = { name: 'late-spec', tr: joiner, sess: null, sim: null, cmds: null };
  spec.sess = new LockstepSession(joiner, 2, null, {});
  const sessMsg = joiner._msg;
  joiner._msg = (m) => { if (m.a === 'welcome') welcomes.push(m); sessMsg(m); };
  attachGame(spec, welcomes[1].seed, 1, true);
  spec.sess.beginFed(welcomes[1]);
  for (let f = 0; f < 600 && spec.sim.tick < welcomes[1].tick + 60; f++) {
    stepEP(host); stepEP(guest); stepEP(spec);
    issueOrders(host, guest, null);
  }
  ok(spec.sess.liveSent, 'retry: consumer reached the live edge on welcome #2');
  ok(spec.sim.hashState() === host.sim.hashState(), 'retry: late spectator hash == host live hash');
  // seat upgrade: the guest leaves, the SAME re-hello now reclaims the seat
  guest.tr.send({ a: 'bye' });
  for (let f = 0; f < 10; f++) stepEP(host);
  const welcomesN = welcomes.length;
  joiner.send({ a: 'hello', proto: PROTO, role: 'player' });
  const up = welcomes[welcomes.length - 1];
  ok(welcomes.length === welcomesN + 1 && up.role === 'player' && up.slot === 2, 'retry: vacant seat -> re-hello upgraded the joiner to a player');
}

console.log('\nlockstep-jip: ' + pass + ' assertions passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
