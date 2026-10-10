#!/usr/bin/env node
// R12 announcer test — extracts the SHIPPED Announcer class verbatim from
// docs/game.js (ANNOUNCER markers) and drives it with deterministic snapshots.
// A mismatch between shipped code and the decoded native announcer semantics
// (reverse/evidence/audio/r12-*.txt) fails here by construction.
//
// Native contract being pinned (6.9.18, libil2cpp.so 8ace05bb…):
//   [DECOMP] ClientFlag.Capture 0x8072CBC — announce completed progress
//   captures only; capturer IsAllySide -> FlagIsCaptured else FlagIsLost;
//   prior owner not consulted (neutral capture announces too); no throttle.
//   [DECOMP] UnitAttacked/BuildingAttacked 0x82064F4/0x82065BC — per-channel
//   next-allowed-time throttle (nextAllowed = now + delay).
//   [DECOMP] BattleUIEventHelper spec/replay gate — spectators hear nothing.
//   [DECOMP] EnemyDetected — announced on NEW fog-detection transitions.
//   [INFERRED] EnemyControlsFlags — all flags owned by the hostile side.
//   [BROWSER] throttle values (native delays are prefab ints, unmeasured).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const test = require('node:test');
const assert = require('node:assert');

const ROOT = path.join(__dirname, '..', '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'docs', 'game.js'), 'utf8');

const bIdx = src.indexOf('// ---- ANNOUNCER BEGIN');
const eIdx = src.indexOf('// ---- ANNOUNCER END');
if (bIdx < 0 || eIdx < 0 || eIdx < bIdx) {
  console.error('ANNOUNCER markers missing in docs/game.js');
  process.exit(1);
}
const start = src.indexOf('\n', bIdx) + 1;
const end = src.lastIndexOf('\n', eIdx) + 1;
const block = src.slice(start, end) +
  '\n;globalThis.__A = { Announcer, COOLDOWN_REF: new Announcer().COOLDOWN };\n';

function load() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(block, sandbox, { filename: 'announcer.js' });
  return sandbox.__A;
}

// snapshot factory: 2 flags, 2 buildings (own hq + enemy hq), 1 enemy unit
function world(over = {}) {
  return Object.assign({
    now: 100000,
    spectator: false,
    me: 1,
    viewSlot: 1,
    hostile: (a, b) => a !== b && a !== 0 && b !== 0,
    mapW: 96,
    flags: [{ id: 1, owner: 1 }, { id: 2, owner: 2 }],
    buildings: [
      { id: 10, owner: 1, hp: 1000, defId: "hq", x: 10, y: 10 },
      { id: 11, owner: 2, hp: 1000, defId: "hq", x: 80, y: 80 },
    ],
    units: [{ id: 100, owner: 2, x: 80, y: 80, garrison: undefined }],
    visible: (function () {
      const v = new Array(96 * 96).fill(0);
      for (let i = 0; i < 96 * 96; i++) v[i] = 1;
      return [v];
    })(),
  }, over);
}

function make() {
  const A = load();
  const a = new A.Announcer();
  const played = [];
  a.play = (name, opts) => played.push({ name, opts, t: null });
  return { a, played };
}

test('first update only primes state (no announcements)', () => {
  const { a, played } = make();
  a.update(world());
  assert.equal(played.length, 0);
});

test('flag polarity [DECOMP]: allied capture -> ann_captured, hostile capture -> ann_flag_lost', () => {
  const { a, played } = make();
  a.update(world());
  played.length = 0;
  a.update(world({ now: 100100, flags: [{ id: 1, owner: 1 }, { id: 2, owner: 1 }] }));
  assert.deepEqual(played.map((p) => p.name), ["ann_captured"]);
  played.length = 0;
  a.update(world({ now: 100200, flags: [{ id: 1, owner: 2 }, { id: 2, owner: 1 }] }));
  assert.deepEqual(played.map((p) => p.name), ["ann_flag_lost"]);
});

test('flag capture of NEUTRAL flag announces too; prior owner not consulted [DECOMP]', () => {
  const { a, played } = make();
  a.update(world({ flags: [{ id: 1, owner: 0 }, { id: 2, owner: 0 }] }));
  played.length = 0;
  a.update(world({ now: 100100, flags: [{ id: 1, owner: 1 }, { id: 2, owner: 0 }] }));
  assert.deepEqual(played.map((p) => p.name), ["ann_captured"]);
  played.length = 0;
  a.update(world({ now: 100200, flags: [{ id: 1, owner: 1 }, { id: 2, owner: 2 }] }));
  assert.deepEqual(played.map((p) => p.name), ["ann_flag_lost"]);
});

test('flags have no throttle [DECOMP]: back-to-back captures each announce', () => {
  const { a, played } = make();
  a.update(world());
  played.length = 0;
  // flag1 1->2->1: two real captures in consecutive updates; any ann_flags_lost
  // (all-flags condition) is orthogonal and filtered out here
  a.update(world({ now: 100050, flags: [{ id: 1, owner: 2 }, { id: 2, owner: 2 }] }));
  a.update(world({ now: 100100, flags: [{ id: 1, owner: 1 }, { id: 2, owner: 2 }] }));
  assert.deepEqual(
    played.filter((p) => p.name !== "ann_flags_lost").map((p) => p.name),
    ["ann_flag_lost", "ann_captured"]
  );
});

test('all flags hostile -> ann_flags_lost once (INFERRED trigger, [BROWSER] cooldown)', () => {
  const { a, played } = make();
  a.update(world());
  played.length = 0;
  a.update(world({ now: 100100, flags: [{ id: 1, owner: 2 }, { id: 2, owner: 2 }] }));
  assert.ok(played.some((p) => p.name === "ann_flags_lost"));
  const n = played.length;
  a.update(world({ now: 100200, flags: [{ id: 1, owner: 2 }, { id: 2, owner: 2 }] }));
  assert.equal(played.length, n); // cooldown blocks repeat
});

test('base under attack: allied building hp drop -> ann_base_attack, throttled per channel [DECOMP logic]', () => {
  const { a, played } = make();
  a.update(world());
  played.length = 0;
  a.update(world({ now: 100100, buildings: [
    { id: 10, owner: 1, hp: 990, defId: "hq", x: 10, y: 10 },
    { id: 11, owner: 2, hp: 1000, defId: "hq", x: 80, y: 80 },
  ] }));
  assert.deepEqual(played.map((p) => p.name), ["ann_base_attack"]);
  played.length = 0;
  // second drop inside the [BROWSER] 20s window -> silent
  a.update(world({ now: 110000, buildings: [
    { id: 10, owner: 1, hp: 980, defId: "hq", x: 10, y: 10 },
    { id: 11, owner: 2, hp: 1000, defId: "hq", x: 80, y: 80 },
  ] }));
  assert.equal(played.length, 0);
  // after the window -> plays again
  a.update(world({ now: 121000, buildings: [
    { id: 10, owner: 1, hp: 970, defId: "hq", x: 10, y: 10 },
    { id: 11, owner: 2, hp: 1000, defId: "hq", x: 80, y: 80 },
  ] }));
  assert.deepEqual(played.map((p) => p.name), ["ann_base_attack"]);
});

test('depots do not trigger base-attack; enemy building damage is silent [DECOMP: flags are not ClientBuilding]', () => {
  const { a, played } = make();
  a.update(world({ buildings: [
    { id: 10, owner: 1, hp: 1000, defId: "hq", x: 10, y: 10 },
    { id: 20, owner: 1, hp: 500, defId: "depot", x: 40, y: 40 },
  ] }));
  played.length = 0;
  a.update(world({ now: 100100, buildings: [
    { id: 10, owner: 1, hp: 1000, defId: "hq", x: 10, y: 10 },
    { id: 20, owner: 1, hp: 490, defId: "depot", x: 40, y: 40 },
  ] }));
  assert.equal(played.length, 0);
});

test('enemy detected on NEW visibility transition only [DECOMP]; cooldown applies', () => {
  const { a, played } = make();
  const dark = world();
  dark.visible[0] = new Array(96 * 96).fill(0);
  a.update(dark);
  played.length = 0;
  a.update(world({ now: 100100 })); // enemy becomes visible
  assert.deepEqual(played.map((p) => p.name), ["ann_enemy"]);
  played.length = 0;
  a.update(world({ now: 100200 })); // still visible, no new transition
  assert.equal(played.length, 0);
});

test('spectator gate [DECOMP]: no announcements and state reset while spectating', () => {
  const { a, played } = make();
  a.update(world());
  played.length = 0;
  a.update(world({ now: 100100, spectator: true, flags: [{ id: 1, owner: 2 }, { id: 2, owner: 2 }] }));
  assert.equal(played.length, 0);
  // leaving spectator re-primes (no burst of stale transitions)
  a.update(world({ now: 100200, flags: [{ id: 1, owner: 2 }, { id: 2, owner: 2 }] }));
  assert.equal(played.length, 0);
});

test('shipped cooldown constants match the documented [BROWSER] defaults', () => {
  const A = load();
  assert.deepEqual(A.COOLDOWN_REF, { base: 20000, enemy: 15000, flags: 30000 });
});
