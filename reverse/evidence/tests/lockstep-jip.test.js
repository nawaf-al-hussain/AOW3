#!/usr/bin/env node
// Lockstep multi-party test — join-in-progress (JIP) + spectator + N seats
// + 2v2 team mode (PROTO 4).
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
if (!K.LockstepSession || K.PROTO !== 4) {
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
function attachGame(ep, seed, slot, spec, seats = 2, mode = 'ffa') {
  ep.sim = new Sim(seed >>> 0, seats, mode);
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
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
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
    const a = spec.sess.myHash.get(t);
    const b1 = spec.sess.peerHashes.get(1) && spec.sess.peerHashes.get(1).get(t);
    const b2 = spec.sess.peerHashes.get(2) && spec.sess.peerHashes.get(2).get(t);
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
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
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
  const victim = welcomed.arch.find((e) => e.f && e.f[1] && e.f[1].length > 0);
  if (victim) victim.f[1] = [];
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
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
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
  ok(host.sess.activeSeats().length === 0, 'seat vacant after guest bye');
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
  host.sess.stallSince[guest.tr.rid] = performance.now() - (K.STALL_VACATE_MS + 1000); // backdate watchdog
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
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
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
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
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

// ---- 8. three-player match: pre-game seating, cross-seat input, full-mesh
// hash verification (every peer verifies against EVERY seat's checkpoint)
{
  NET.length = 0; // isolate
  const host = makeEndpoint('host', 1, {
    seats: 3,
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
    })
  });
  const p2 = makeEndpoint('p2', 2);
  const p3 = makeEndpoint('p3', 3);
  attachGame(host, 555000111, 1, false, 3);
  attachGame(p2, 0, 2, false, 3);
  attachGame(p3, 0, 3, false, 3);
  p2.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  p3.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(host.sess.helloQueue.length === 2, '3P: both pre-game hellos queued');
  host.sess.beginMatch(13571357);
  attachGame(host, 13571357, 1, false, 3);
  attachGame(p2, 13571357, 2, false, 3);
  attachGame(p3, 13571357, 3, false, 3);
  ok(host.sim.seatCount === 3 && host.sim.hq(3) !== undefined, '3P: seat 3 has an HQ');
  for (let f = 0; f < 220; f++) {
    stepEP(host); stepEP(p2); stepEP(p3);
    const t = host.sim.tick;
    if (t % 41 === 0) { const u = host.sim.units.find((u) => u.owner === 1 && u.garrison === undefined); if (u) host.cmds.issue({ type: 'move', ids: [u.id], x: (u.x + 3) | 0, y: (u.y + 2) | 0 }); }
    if (t % 43 === 0) { const u = p2.sim.units.find((u) => u.owner === 2 && u.garrison === undefined); if (u) p2.cmds.issue({ type: 'produce', defId: 'ilight', owner: 2 }); }
    if (t % 47 === 0) { const u = p3.sim.units.find((u) => u.owner === 3 && u.garrison === undefined); if (u) p3.cmds.issue({ type: 'move', ids: [u.id], x: (u.x + 1) | 0, y: (u.y - 3) | 0 }); }
  }
  ok(host.sim.tick >= 200 && p2.sim.tick >= 200 && p3.sim.tick >= 200, '3P: all three peers advanced (t=' + host.sim.tick + '/' + p2.sim.tick + '/' + p3.sim.tick + ')');
  let agree = true;
  for (let ct = CHECKPOINT; ct <= 200; ct += CHECKPOINT) {
    const hs = [host, p2, p3].map((ep) => ep.sess.myHash.get(ct));
    if (hs[0] !== undefined && (hs[0] !== hs[1] || hs[0] !== hs[2])) { agree = false; break; }
  }
  ok(agree, '3P: checkpoint hashes agree across all three peers');
  ok(!host.sess.desynced && !p2.sess.desynced && !p3.sess.desynced, '3P: no desync');
  while (host.sim.tick < p3.sim.tick) stepEP(host); // equalize the drive-order skew
  ok(host.sim.hashState() === p3.sim.hashState(), '3P: live state hash equal host vs seat 3');
  ok(p3.sim.units.some((u) => u.owner === 3), '3P: seat 3 owns units');
  // mid-match spectator verifies against ALL THREE seats (session slot 2 =
  // hub=false — fed consumers never run a hub session; the sim views as slot 1)
  const spec = makeEndpoint('spec', 2, {
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
    })
  });
  let specWelcomed = null;
  spec.sess.onWelcome = (m) => { specWelcomed = m; };
  spec.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!specWelcomed && specWelcomed.role === 'spec' && specWelcomed.slot === 0, '3P: full room -> joiner downgraded to spectator');
  ok(specWelcomed.seats === 3, '3P: welcome carries the seat count');
  attachGame(spec, specWelcomed.seed, 1, true, 3);
  spec.sess.beginFed(specWelcomed);
  for (let f = 0; f < 500 && spec.sim.tick < host.sim.tick + 40; f++) { stepEP(host); stepEP(p2); stepEP(p3); stepEP(spec); }
  ok(!spec.sess.desynced, '3P: spectator verifies against every seat (no desync)');
  ok(spec.sim.hashState() === host.sim.hashState(), '3P: spectator hash == host live hash');
}

// ---- 9. four-player match: seat-4 JIP reclaim mid-match + lost-seat watchdog ----
{
  NET.length = 0; // isolate
  const host = makeEndpoint('host', 1, {
    seats: 4,
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
    })
  });
  const p2 = makeEndpoint('p2', 2);
  attachGame(host, 888000222, 1, false, 4);
  attachGame(p2, 0, 2, false, 4);
  p2.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  host.sess.beginMatch(24682468); // seats only p2 (queue length 1 < 3): match launches as-is
  attachGame(host, 24682468, 1, false, 4);
  attachGame(p2, 24682468, 2, false, 4);
  for (let f = 0; f < 140; f++) { stepEP(host); stepEP(p2); }
  // p3 joins mid-match: the seat-3 slot is vacant pre-launch too -> JIP path
  let w3 = null;
  const p3 = makeEndpoint('p3', 3, { onWelcome: (m) => { w3 = m; } });
  p3.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!w3 && w3.role === 'player' && w3.slot === 3, '4P: JIP joiner claimed the lowest vacant seat (3)');
  attachGame(p3, w3.seed, 3, false, 4);
  p3.sess.beginFed(w3);
  for (let f = 0; f < 600 && !p3.sess.liveSent; f++) { stepEP(host); stepEP(p2); stepEP(p3); }
  ok(p3.sess.liveSent, '4P: seat-3 JIP player reached the live edge');
  // seat 4 joins as JIP while the match runs
  let w4 = null;
  const p4 = makeEndpoint('p4', 4, { onWelcome: (m) => { w4 = m; } });
  p4.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!w4 && w4.role === 'player' && w4.slot === 4, '4P: second JIP joiner took seat 4');
  attachGame(p4, w4.seed, 4, false, 4);
  p4.sess.beginFed(w4);
  for (let f = 0; f < 900 && !p4.sess.liveSent; f++) { stepEP(host); stepEP(p2); stepEP(p3); stepEP(p4); }
  ok(p4.sess.liveSent, '4P: seat-4 JIP player reached the live edge');
  for (let f = 0; f < 80; f++) { stepEP(host); stepEP(p2); stepEP(p3); stepEP(p4); }
  ok(host.sim.hashState() === p4.sim.hashState(), '4P: live hash equal host vs seat 4');
  ok(!host.sess.desynced && !p3.sess.desynced && !p4.sess.desynced, '4P: no desync across the four seats');
  // seat 3 goes silent -> host stalls, watchdog vacates seat 3, match continues
  p3.tr.dead = true;
  const h0 = host.sim.tick;
  for (let f = 0; f < 6; f++) { stepEP(host); stepEP(p2); stepEP(p4); }
  ok(host.sim.tick > h0 && host.sim.tick <= h0 + host.sess.delay + 1, '4P: host advances only through the horizon after seat 3 went silent');
  host.sess.stallSince[p3.tr.rid] = performance.now() - (K.STALL_VACATE_MS + 500);
  for (let f = 0; f < 10; f++) { stepEP(host); stepEP(p2); stepEP(p4); }
  ok(host.sess.activeSeats().every(([, cl]) => cl.slot !== 3), '4P: watchdog vacated seat 3');
  const h1 = host.sim.tick;
  for (let f = 0; f < 60; f++) { stepEP(host); stepEP(p2); stepEP(p4); }
  ok(host.sim.tick > h1 + 50, '4P: match continues after vacate (t=' + host.sim.tick + ')');
  ok(!host.sess.desynced && !p2.sess.desynced && !p4.sess.desynced, '4P: remaining seats still desync-free');
}

// ---- 10. team mode 2v2 (PROTO 4): adjacency spawns, ally hostility rules,
// team win with both seats alive, full-mesh hash agreement, fed JIP carries
// the mode ----
{
  NET.length = 0; // isolate
  let startP2 = null;
  const host = makeEndpoint('host', 1, {
    seats: 4, mode: '2v2',
    isLive: () => !!(host.sim && host.sim.tick > 0),
    snapshot: () => ({
      seed: host.sim.seed, tick: host.sim.tick,
      arch: [...host.sess.arch].map(([t, f]) => ({ t, f })),
      hashes: [...host.sess.hashArch].flatMap(([t, h]) =>
        Object.keys(h).map((s) => ({ t, h: h[s], s: +s })))
    })
  });
  const p2 = makeEndpoint('p2', 2, { onGuestStart: (m) => { startP2 = m; } });
  const p3 = makeEndpoint('p3', 3);
  const p4 = makeEndpoint('p4', 4);
  attachGame(host, 424242424, 1, false, 4, '2v2');
  attachGame(p2, 0, 2, false, 4, '2v2');
  attachGame(p3, 0, 3, false, 4, '2v2');
  attachGame(p4, 0, 4, false, 4, '2v2');
  p2.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  p3.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  p4.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(host.sess.helloQueue.length === 3, '2v2: all three pre-game hellos queued');
  host.sess.beginMatch(777123);
  ok(!!startP2 && startP2.mode === '2v2' && startP2.slot === 2 && startP2.seats === 4, '2v2: start packet carries slot + seats + mode');
  attachGame(host, 777123, 1, false, 4, '2v2');
  attachGame(p2, 777123, 2, false, 4, '2v2');
  attachGame(p3, 777123, 3, false, 4, '2v2');
  attachGame(p4, 777123, 4, false, 4, '2v2');
  const S = host.sim;
  ok(S.mode === '2v2' && S.teams === true && S.winTeam === null, '2v2: sim is in team mode');
  ok(S.hq(1).x === 8 && S.hq(2).x === K.MAP_W / 2 && S.hq(3).x === K.MAP_W - 8 && S.hq(4).x === K.MAP_W / 2, '2v2: adjacent-pair spawns (left+top vs right+bottom)');
  ok(S.teamOf(1) === 1 && S.teamOf(2) === 1 && S.teamOf(3) === 2 && S.teamOf(4) === 2, '2v2: team mapping {1,2} vs {3,4}');
  ok(!S.hostile(1, 2) && !S.hostile(2, 1) && S.hostile(1, 3) && S.hostile(2, 4) && S.hostile(1, 0), '2v2: allies not hostile, other team + neutral are');
  const ffa = new Sim(777123, 4);
  ok(ffa.mode === 'ffa' && ffa.hostile(1, 2) && ffa.hq(2).x === K.MAP_W - 8, 'FFA fallback: 4P spawn table + hostility unchanged');
  // live 4-way match with orders from every seat
  for (let f = 0; f < 220; f++) {
    stepEP(host); stepEP(p2); stepEP(p3); stepEP(p4);
    const t = host.sim.tick;
    if (t % 37 === 0) host.cmds.issue({ type: 'produce', defId: 'ilight', owner: 1 });
    if (t % 41 === 0) { const u = p2.sim.units.find((u) => u.owner === 2 && u.garrison === undefined); if (u) p2.cmds.issue({ type: 'move', ids: [u.id], x: (u.x + 2) | 0, y: (u.y - 3) | 0 }); }
    if (t % 43 === 0) p3.cmds.issue({ type: 'produce', defId: 'iheavy', owner: 3 });
    if (t % 47 === 0) { const u = p4.sim.units.find((u) => u.owner === 4 && u.garrison === undefined); if (u) p4.cmds.issue({ type: 'move', ids: [u.id], x: (u.x - 1) | 0, y: (u.y + 3) | 0 }); }
  }
  ok(host.sim.tick >= 200 && p4.sim.tick >= 200, '2v2: all four peers advanced (t=' + host.sim.tick + '/' + p4.sim.tick + ')');
  let agree = true;
  for (let ct = CHECKPOINT; ct <= 200; ct += CHECKPOINT) {
    const hs = [host, p2, p3, p4].map((ep) => ep.sess.myHash.get(ct));
    if (hs[0] !== undefined && hs.some((h) => h !== hs[0])) { agree = false; break; }
  }
  ok(agree, '2v2: checkpoint hashes agree across all four seats');
  ok(!host.sess.desynced && !p2.sess.desynced && !p3.sess.desynced && !p4.sess.desynced, '2v2: no desync');
  while (host.sim.tick < p4.sim.tick) stepEP(host); // equalize the drive-order skew
  while (p4.sim.tick < host.sim.tick) stepEP(p4);
  ok(host.sim.hashState() === p4.sim.hashState(), '2v2: live state hash equal host vs seat 4');
  // fed JIP into the live 2v2 match: the welcome carries the mode, catch-up
  // verifies against every seat
  const spec = makeEndpoint('spec', 2);
  let specWelcome = null;
  spec.sess.onWelcome = (m) => { specWelcome = m; };
  spec.tr.send({ a: 'hello', proto: PROTO, role: 'player' });
  ok(!!specWelcome && specWelcome.mode === '2v2' && specWelcome.role === 'spec', '2v2: JIP welcome carries the team mode (room full -> spec)');
  attachGame(spec, specWelcome.seed, 1, true, 4, '2v2');
  spec.sess.beginFed(specWelcome);
  for (let f = 0; f < 600 && spec.sim.tick < host.sim.tick; f++) { stepEP(host); stepEP(p2); stepEP(p3); stepEP(p4); stepEP(spec); }
  ok(!spec.sess.desynced && spec.sim.hashState() === host.sim.hashState(), '2v2: fed spectator caught up, hash == host');
  // ally hostility micro-vectors (fresh deterministic sims)
  const S2 = new Sim(999, 4, '2v2');
  const hunt = S2.spawn('ilight', 1, 40, 40);
  hunt.order = { kind: 'idle' };
  const ally = S2.spawn('ilight', 2, 42, 40); // nearer than the foe
  const foe = S2.spawn('ilight', 3, 44, 40);
  S2.step(1 / 20);
  ok(hunt.targetId === foe.id, '2v2: findTarget skips the nearer ally and locks the enemy');
  const prefBefore = hunt.preferredId;
  S2.commandAttack([hunt.id], ally.id);
  ok(hunt.preferredId === prefBefore, '2v2: explicit attack on an ally is a no-op');
  const v = S2.spawn('ilight', 1, 50, 50);
  const a2 = S2.spawn('ilight', 2, 51, 50);
  S2.aggro(a2, v);
  ok(v.targetId === undefined, '2v2: ally hit does not trigger aggro');
  S2.aggro(foe, v);
  ok(v.targetId === foe.id, '2v2: enemy hit triggers aggro');
  S2.mines.push({ x: 60, y: 60, owner: 1, arm: 0, dead: false });
  const a3 = S2.spawn('ilight', 2, 60, 60);
  S2.step(1 / 20);
  ok(S2.mines.length === 1, '2v2: mine ignores the ally sitting on it');
  S2.spawn('ilight', 3, 60, 60);
  S2.step(1 / 20);
  ok(S2.mines.length === 0, '2v2: mine triggers on an enemy');
  // team win: both enemy HQs die (identically on every peer) -> team 1 wins
  // even with BOTH of its seats alive; whole team flagged alive
  ok(S.winner === null, '2v2: match still live before the kill vector');
  for (const ep of [host, p2, p3, p4]) {
    ep.sim.hq(3).hp = 0;
    ep.sim.hq(4).hp = 0;
    stepEP(ep);
  }
  ok(S.winTeam === 1 && S.winner === 1, '2v2: last team standing wins (both seats alive)');
  ok(p4.sim.winTeam === 1 && p4.sim.winner === 1, '2v2: all peers agree on the team win');
  ok(S.players[0].alive === true && S.players[1].alive === true && S.players[2].alive === false && S.players[3].alive === false, '2v2: whole winning team flagged alive, losers not');
}

console.log('\nlockstep-jip: ' + pass + ' assertions passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
