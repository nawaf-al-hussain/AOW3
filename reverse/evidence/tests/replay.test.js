#!/usr/bin/env node
// Phase D test — replay playback harness: a replay record (seed + full command
// journal + terrain fingerprint + 1 Hz state-hash journal) rebuilt by
// Replay.play() must reproduce the captured sim bit-for-bit (hashState equal,
// zero divergences); tampering with seed, commands, or terrain is detected.
// Native analog: AICommandLogWriter/Reader + CRCRequest/Verify desync detection.
// Extracts the SHIPPED sim kernel verbatim from docs/game.js.
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
const kernel = src.slice(start, end) +
  '\n;globalThis.__K = { Sim, Commands, Replay, mulberry32, fnv1a, Pathfinder, UNITS, BLD, ECONOMY, PRODUCER_OF, rankTier, hitChance, effectiveDamage, FSM_DEFAULTS, GARRISON_CAP, angleWrap, MAP_W, MAP_H };\n';

function loadKernel(seed = 777) {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.console = console;
  sandbox.Math = Object.create(Math);
  let s = 42 >>> 0;
  sandbox.Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  vm.createContext(sandbox);
  const ctx = { filename: 'data' };
  for (const f of ['stats.js', 'weapons.js', 'units.js', 'buildings.js', 'factions.js', 'index.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'data', f), 'utf8'), sandbox, ctx);
  vm.runInContext(kernel, sandbox, { filename: 'sim-kernel.js' });
  return { sim: new sandbox.__K.Sim(seed), K: sandbox.__K, sandbox };
}

const TICK = 0.05;
function run(sim, steps) {
  for (let i = 0; i < steps; i++)
    sim.step(TICK);
}

let fail = 0, total = 0;
const check = (name, got, want) => {
  total++;
  const ok = typeof want === 'function' ? want(got) : Object.is(got, want);
  if (!ok) { fail++; console.log(`  FAIL ${name}: got ${String(got).slice(0, 160)}`); }
  else console.log(`  ok   ${name}`);
};
const section = (t) => console.log(`\n== ${t} ==`);

// ---- scripted live run helper: player commands issued between steps ----
function liveRun(seed, steps, script) {
  const { sim, K } = loadKernel(seed);
  const cmd = new K.Commands(sim);
  const at = {}; // tick -> commands issued there (script fills it)
  script(sim, cmd, at);
  let nextTick = 0;
  const pending = [];
  for (let i = 0; i < steps; i++) {
    const q = at[nextTick];
    if (q)
      for (const c of q)
        cmd.issue(c);
    sim.step(TICK);
    nextTick = sim.tick;
  }
  return { sim, cmd, K };
}

section('replay: player commands — bit-exact reproduction');
{
  const script = (sim, cmd, at) => {
    (at[0] = at[0] || []).push(
      { type: 'move', ids: sim.units.filter((u) => u.owner === 1).map((u) => u.id), x: 30, y: 84 },
      { type: 'select', mode: 'set', ids: [sim.units[0].id] }
    );
  };
  const live = liveRun(31415, 600, script);
  const rec = live.K.Replay.capture(live.sim, [{ ownerTag: 1, full: live.cmd.full }]);
  check('record shape', rec.v === 1 && rec.seed === 31415 && rec.tickRate === 20 && rec.finalTick === 600, true);
  check('commands journaled', rec.commands.length >= 2, true);
  const out = live.K.Replay.play(rec);
  check('zero divergences', out.divergences.length, 0);
  check('all commands applied', out.applied, rec.commands.length);
  check('final hash reproduced', out.sim.hashState(), live.sim.hashState());
  check('final tick reproduced', out.sim.tick, live.sim.tick);
  check('rngState reproduced', out.sim.rngState, live.sim.rngState);
  check('unit count reproduced', out.sim.units.length, live.sim.units.length);
}

section('replay: deterministic baseline (no commands)');
{
  const { sim, K } = loadKernel(777);
  run(sim, 400);
  const rec = K.Replay.capture(sim, []);
  const out = K.Replay.play(rec);
  check('zero divergences (empty journal)', out.divergences.length, 0);
  check('baseline hash reproduced', out.sim.hashState(), sim.hashState());
}

section('replay: cross-issuer ordering (player + AI journals)');
{
  const { sim, K } = loadKernel(90210);
  const player = new K.Commands(sim);
  const aiCmd = new K.Commands(sim); // stands in for the AI's own Commands instance
  // interleaved issues at controlled ticks, both issuers sharing sim.cmdSeq;
  // only always-valid commands (rejected commands are never journaled by design)
  const f1 = sim.units.filter((u) => u.owner === 1).map((u) => u.id);
  const f2 = sim.units.filter((u) => u.owner === 2).map((u) => u.id);
  const plan = [
    [0, player, { type: 'move', ids: f1, x: 34, y: 80 }],
    [0, aiCmd, { type: 'move', ids: f2, x: 120, y: 80 }],
    [100, player, { type: 'move', ids: [f1[0]], x: 40, y: 70, attackMove: true }],
    [100, aiCmd, { type: 'move', ids: [f2[0]], x: 110, y: 90 }],
    [260, player, { type: 'stop', ids: f1 }],
    [260, aiCmd, { type: 'stop', ids: f2 }]
  ];
  let pi = 0;
  for (let i = 0; i < 400; i++) {
    while (pi < plan.length && plan[pi][0] <= sim.tick) {
      plan[pi][1].issue(plan[pi][2]);
      pi++;
    }
    sim.step(TICK);
  }
  const rec = K.Replay.capture(sim, [{ ownerTag: 1, full: player.full }, { ownerTag: 2, full: aiCmd.full }]);
  check('both issuers captured', rec.commands.length, plan.length);
  const out = K.Replay.play(rec);
  check('zero divergences (cross-issuer)', out.divergences.length, 0);
  check('hash reproduced with mixed journals', out.sim.hashState(), sim.hashState());
  check('sorted by (tick, seq)', rec.commands.every((c, i) => i === 0 || rec.commands[i - 1].tick < c.tick || (rec.commands[i - 1].tick === c.tick && rec.commands[i - 1].seq < c.seq)), true);
}

section('replay: tamper detection');
{
  const script = (sim, cmd, at) => {
    (at[0] = at[0] || []).push({ type: 'move', ids: sim.units.filter((u) => u.owner === 1).map((u) => u.id), x: 30, y: 84 });
    (at[120] = at[120] || []).push({ type: 'move', ids: [sim.units[0].id], x: 60, y: 60 });
  };
  const live = liveRun(31415, 400, script);
  const rec = live.K.Replay.capture(live.sim, [{ ownerTag: 1, full: live.cmd.full }]);

  const seedTampered = live.K.Replay.play({ ...rec, seed: (rec.seed + 1) >>> 0 });
  check('seed tamper detected', seedTampered.divergences.length > 0, true);
  check('seed tamper diverges from first 1 Hz mark', seedTampered.divergences.some((d) => d.why && d.why.includes('hash') || d.why && d.why.includes('final')), true);

  const dropped = live.K.Replay.play({ ...rec, commands: rec.commands.slice(1) });
  check('dropped command detected', dropped.divergences.length > 0, true);

  const movedCmd = live.K.Replay.play({
    ...rec,
    commands: rec.commands.map((c, i) => i === 0 ? { ...c, cmd: { ...c.cmd, x: 90, y: 90 } } : c)
  });
  check('altered command detected', movedCmd.divergences.length > 0, true);

  const terrain = live.K.Replay.play({ ...rec, terrain: 12345 });
  check('terrain mismatch flagged at tick 0', terrain.divergences.some((d) => d.tick === 0 && /terrain/.test(d.why)), true);

  const clean = live.K.Replay.play(rec);
  check('control: unmodified record still clean', clean.divergences.length, 0);
}

section('replay: full journal survives the 512-entry debug ring');
{
  const { sim, K } = loadKernel(555);
  const cmd = new K.Commands(sim);
  const ids = sim.units.filter((u) => u.owner === 1).map((u) => u.id);
  for (let i = 0; i < 540; i++)
    cmd.issue({ type: 'move', ids, x: 24 + (i % 3), y: 80 + (i % 2) });
  check('ring capped at 512', cmd.log.length, 512);
  check('full journal uncapped', cmd.full.length, 540);
  run(sim, 100);
  const rec = K.Replay.capture(sim, [{ ownerTag: 1, full: cmd.full }]);
  check('capture includes all 540', rec.commands.length, 540);
  const out = K.Replay.play(rec);
  check('replay applies all 540', out.applied, 540);
  check('hash reproduced after 540-command storm', out.sim.hashState(), sim.hashState());
}

section('replay: live-shaped run — build command + patrol + garrison through the harness');
{
  // mirrors a live capture exactly: constructor state + journaled commands only.
  // build (bunker) -> patrol -> garrison (after build completes)
  const { sim, K } = loadKernel(4711);
  const cmd = new K.Commands(sim);
  let built = false, garrisoned = false;
  for (let i = 0; i < 800; i++) {
    if (!built && sim.tick === 0) {
      cmd.issue({ type: 'build', defId: 'bunker', owner: 1, x: 10, y: 84 });
      const inf = sim.units.find((u) => u.owner === 1 && u.def.kind === 'infantry');
      cmd.issue({ type: 'patrol', ids: [inf.id], x: 22, y: 84 });
      built = true;
    }
    if (!garrisoned && sim.tick === 300) {
      const bunker = sim.buildings.find((b) => b.defId === 'bunker' && b.owner === 1);
      if (bunker && bunker.built) {
        const inf = sim.units.find((u) => u.owner === 1 && u.def.kind === 'infantry' && u.garrison === undefined);
        cmd.issue({ type: 'garrison', ids: [inf.id], buildingId: bunker.id });
      }
      garrisoned = true;
    }
    sim.step(TICK);
  }
  check('live run: bunker built', sim.buildings.some((b) => b.defId === 'bunker' && b.owner === 1), true);
  check('live run: garrison happened', sim.units.some((u) => u.garrison !== undefined), true);
  const rec = K.Replay.capture(sim, [{ ownerTag: 1, full: cmd.full }]);
  const out = K.Replay.play(rec);
  check('zero divergences with build/patrol/garrison commands', out.divergences.length, 0);
  check('hash reproduced (features)', out.sim.hashState(), sim.hashState());
  check('garrison state reproduced', out.sim.units.filter((u) => u.garrison !== undefined).length, sim.units.filter((u) => u.garrison !== undefined).length);
  check('bunker reproduced in replay', out.sim.buildings.some((b) => b.defId === 'bunker' && b.owner === 1), true);
}

section('replay: JSON round-trip (serialize -> parse -> play)');
{
  const script = (sim, cmd, at) => {
    (at[0] = at[0] || []).push({ type: 'move', ids: sim.units.filter((u) => u.owner === 1).map((u) => u.id), x: 30, y: 84 });
  };
  const live = liveRun(31415, 300, script);
  const rec = live.K.Replay.capture(live.sim, [{ ownerTag: 1, full: live.cmd.full }]);
  const json = JSON.stringify(rec);
  check('json under 256 KB', json.length < 262144, true);
  const out = live.K.Replay.play(JSON.parse(json));
  check('zero divergences after JSON round-trip', out.divergences.length, 0);
  check('hash reproduced', out.sim.hashState(), live.sim.hashState());
}

console.log(`\nreplay: ${total - fail}/${total} PASS${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
