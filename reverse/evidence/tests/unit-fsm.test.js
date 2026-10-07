#!/usr/bin/env node
// Deterministic Phase 3 test — unit state machines (idle/move/attack/acquire/
// rotate/shoot/reload/stop/die), reconstructed from native evidence:
//   reverse/notes/unit-state-machines-native-analysis.md
// Unlike accuracy.test.js / data-model.test.js (parallel reimplementations), this
// suite extracts the SHIPPED sim kernel verbatim from docs/game.js (between the
// SIM KERNEL BEGIN/END markers) and drives it in a vm sandbox — a mismatch
// between shipped code and the recovered behavior fails here by construction.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..', '..');
const src = fs.readFileSync(path.join(ROOT, 'docs', 'game.js'), 'utf8');

// ---- extract the sim kernel ----
const bIdx = src.indexOf('// ---- SIM KERNEL BEGIN');
const eIdx = src.indexOf('// ---- SIM KERNEL END');
if (bIdx < 0 || eIdx < 0 || eIdx < bIdx) {
  console.error('SIM KERNEL markers missing in docs/game.js');
  process.exit(1);
}
const start = src.indexOf('\n', bIdx) + 1;
const end = src.lastIndexOf('\n', eIdx) + 1;
const kernel = src.slice(start, end) +
  '\n;globalThis.__K = { Sim, Pathfinder, UNITS, BLD, ECONOMY, rankTier, hitChance, effectiveDamage, weaponStaticAccuracy, weaponDynamicAccuracy, FSM_DEFAULTS, angleWrap, MAP_W, MAP_H };\n';

function loadSim(seed = 7) {
  const sandbox = {};
  sandbox.window = sandbox; // data modules attach here; genTerrain guard sees no __realMap
  sandbox.console = console;
  sandbox.Math = Object.create(Math);
  let s = seed >>> 0;
  sandbox.Math.random = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  vm.createContext(sandbox);
  const ctx = { filename: 'data' };
  for (const f of ['stats.js', 'weapons.js', 'units.js', 'buildings.js', 'factions.js', 'index.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'data', f), 'utf8'), sandbox, ctx);
  vm.runInContext(kernel, sandbox, { filename: 'sim-kernel.js' });
  return { sim: new sandbox.__K.Sim(1), K: sandbox.__K, sandbox };
}

// synthetic defs (test-local; never shipped into docs/data)
function registerDefs(sb) {
  vm.runInContext(`
    UNITS.t_gun = { id: "t_gun", name: "TGun", kind: "infantry", armorClass: "light",
      armor: { light: 6, medium: 4, heavy: 2 }, health: 100, price: 1, cp: 1, trainTime: 1,
      speed: 3, view: 9, radius: 0.45,
      weapon: { damage: { light: 20, medium: 10, heavy: 2 }, range: 6, cooldown: 0.5,
        accStatic: 100, accWalk: 50, splash: 0, projectileSpeed: 0, walkingShot: 1 } };
    UNITS.t_at = { id: "t_at", name: "TAT", kind: "infantry", armorClass: "light",
      armor: { light: 6, medium: 4, heavy: 2 }, health: 100, price: 1, cp: 1, trainTime: 1,
      speed: 3, view: 9, radius: 0.45,
      weapon: { damage: { light: 6, medium: 20, heavy: 60 }, range: 6, cooldown: 0.5,
        accStatic: 100, accWalk: 50, splash: 0, projectileSpeed: 0, walkingShot: 1 } };
    UNITS.t_tank = { id: "t_tank", name: "TTank", kind: "vehicle", armorClass: "heavy",
      armor: { light: 30, medium: 24, heavy: 18 }, health: 200, price: 1, cp: 1, trainTime: 1,
      speed: 3, view: 9, radius: 0.8,
      weapon: { damage: { light: 30, medium: 30, heavy: 30 }, range: 6, cooldown: 1,
        accStatic: 100, accWalk: 60, splash: 0, projectileSpeed: 0 } };
    UNITS.t_burst = { id: "t_burst", name: "TBurst", kind: "infantry", armorClass: "light",
      armor: { light: 6, medium: 4, heavy: 2 }, health: 100, price: 1, cp: 1, trainTime: 1,
      speed: 3, view: 9, radius: 0.45, aimTime: 0,
      weapon: { damage: { light: 10, medium: 5, heavy: 1 }, range: 6, cooldown: 1,
        accStatic: 100, accWalk: 50, splash: 0, projectileSpeed: 0, walkingShot: 1,
        shotCount: 3, shotInt: 0.15 } };
  `, sb, { filename: 'test-defs' });
}

const run = (sim, seconds, step = 0.016) => {
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++)
    sim.updateUnits(step);
};

let fail = 0;
const check = (name, got, want) => {
  const ok = typeof want === 'function' ? want(got) : Object.is(got, want);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `: got ${String(got)}, want ${typeof want === 'function' ? '(predicate)' : String(want)}`}`);
};

// 1 — rotation gate: a vehicle facing away must turn before its first shot
{
  const { sim, K, sandbox } = loadSim();
  registerDefs(sandbox);
  const shooter = sim.spawn("t_tank", 1, 20, 20);   // vehicle rotate 3.2 rad/s, fireArc 0.6
  const victim = sim.spawn("t_gun", 2, 20, 24);     // north of shooter: angle +PI/2
  shooter.facing = 0;
  shooter.orientDest = 0;
  run(sim, 0.2);
  check('1a rotation gate: no shot while hull is off-target', victim.hp, 100);
  run(sim, 2.5);
  check('1b first shot lands after rotating + aiming', victim.hp < 100, true);
  check('1c hull faced the target', Math.abs(K.angleWrap(shooter.facing - Math.PI / 2)) < 0.61, true);
}

// 2 — aim time: new engagement restarts the fire solution
{
  const { sim, sandbox } = loadSim();
  registerDefs(sandbox);
  const shooter = sim.spawn("t_gun", 1, 20, 20);
  const a = sim.spawn("t_gun", 2, 23, 20); // east: angle 0
  shooter.facing = shooter.orientDest = 0;
  run(sim, 0.016);
  check('2a acquisition starts aiming', shooter.aimT > 0, true);
  run(sim, 1.2);
  check('2b shot fires once aim elapses', a.hp < 100, true);
  const b = sim.spawn("t_gun", 2, 17, 20); // west: angle PI
  shooter.preferredId = b.id;
  run(sim, 0.016);
  check('2c target switch re-aims', shooter.aimT > 0, true);
}

// 3 — retaliation + WARNED_BY_NEARBY_FRIENDS
{
  const { sim } = loadSim();
  const victim = sim.spawn("ilight", 1, 20, 20);
  const friend = sim.spawn("ilight", 1, 22, 20);
  const attacker = sim.spawn("iheavy", 2, 31, 20); // outside acquire radius (range 7.5+2.5)
  sim.applyHit(attacker, 20, 20, victim, 5, 1);
  check('3a struck unit targets its attacker', victim.targetId, attacker.id);
  check('3b nearby idle friend joins (warned)', friend.targetId, attacker.id);
}

// 4 — objPreferred stickiness: command-attack target wins over proximity
{
  const { sim, sandbox } = loadSim();
  registerDefs(sandbox);
  const u = sim.spawn("t_gun", 1, 20, 20);
  const near = sim.spawn("t_gun", 2, 22, 20);
  const far = sim.spawn("t_gun", 2, 40, 40);
  sim.commandAttack([u.id], far.id);
  run(sim, 0.05);
  check('4 command target is sticky (objPreferred)', u.targetId, far.id);
  check('4b proximity target not chosen', u.targetId === near.id, false);
}

// 5 — damage_priority weighting in acquisition
{
  const { sim, sandbox } = loadSim();
  registerDefs(sandbox);
  const rifle = sim.spawn("t_gun", 1, 20, 20);   // strong vs light, weak vs heavy
  const inf = sim.spawn("t_gun", 2, 25, 20);     // d=5, light
  const tank = sim.spawn("t_tank", 2, 20, 26);   // d=6, heavy
  const best = sim.findTarget(rifle);
  check('5a rifle prefers the target its damage table favors', best, inf);
  tank.y = 25; // d=5: close enough that the anti-tank bias flips the pick
  const at = sim.spawn("t_at", 1, 20, 20);
  const best2 = sim.findTarget(at);
  check('5b anti-tank weapon flips the preference', best2, tank);
}

// 6 — idle guard return: after the fight, walk back to the post
{
  const { sim } = loadSim();
  const g = sim.spawn("ilight", 1, 20, 20);
  const e = sim.spawn("ilight", 2, 28, 20); // d=8: acquired (<= 9) but beyond range 6.5 -> chase
  run(sim, 4);
  const chased = Math.hypot(g.x - 20, g.y - 20) > 0.5;
  check('6a idle unit chased the acquired enemy', chased, true);
  e.hp = 0;
  run(sim, 0.05);
  check('6b dead target removed, corpse recorded', sim.corpses.length >= 1, true);
  run(sim, 30);
  const back = Math.hypot(g.x - 20, g.y - 20) < 1.2;
  check('6c unit returned to its guard position', back, true);
  check('6d guard cleared on arrival', g.guard === undefined || (g.guard.x === 20 && g.guard.y === 20), true);
}

// 7 — die state: corpse bookkeeping with die_time, then purge
{
  const { sim } = loadSim();
  const u = sim.spawn("ilight", 1, 20, 20);
  u.hp = 0;
  sim.updateUnits(0.016);
  check('7a unit removed from the roster', sim.units.some((v) => v.id === u.id), false);
  check('7b corpse recorded with die_time', sim.corpses.length, 1);
  check('7c infantry die_time ~0.9', Math.abs(sim.corpses[0].dieT - 0.9) < 1e-9, true);
  for (let i = 0; i < 5; i++)
    sim.step(0.25);
  check('7d corpse purged after die_time', sim.corpses.length, 0);
}

// 8 — burst fire: shotCount/shotInt ride inside one round
{
  const { sim, K, sandbox } = loadSim();
  registerDefs(sandbox);
  const shooter = sim.spawn("t_burst", 1, 20, 20);
  const victim = sim.spawn("t_gun", 2, 23, 20);
  shooter.facing = shooter.orientDest = 0; // east toward the victim
  const hp0 = victim.hp;
  run(sim, 0.9); // one round: shell 1 now, shells 2-3 at +0.15 offsets; cooldown 1.0 blocks round 2
  const dmgPer = Math.round(10 * 0.94); // armorFactor(6, 10) = 0.94 -> 9
  const hits = Math.round((hp0 - victim.hp) / dmgPer);
  check('8a three burst shells landed in one round', hits, 3);
  check('8b round cooldown holds afterwards', shooter.cd > 0 || victim.hp <= hp0 - 3 * dmgPer, true);
}

// 9 — commandStop halts and drops targets (native TASK_WAIT)
{
  const { sim } = loadSim();
  const u = sim.spawn("ilight", 1, 20, 20);
  sim.commandMove([u.id], 60, 60, true);
  run(sim, 1);
  check('9a unit was moving', u.path.length > 0 || u.order.kind !== 'idle', true);
  sim.commandStop([u.id]);
  check('9b order -> idle', u.order.kind, 'idle');
  check('9c path cleared', u.path.length, 0);
  check('9d guard set in place', Math.hypot(u.guard.x - u.x, u.guard.y - u.y) < 1e-6, true);
  const x0 = u.x, y0 = u.y;
  run(sim, 0.5);
  check('9e position frozen', Math.hypot(u.x - x0, u.y - y0) < 0.01, true);
}

// 10 — walking_shot regression: infantry fires on the move under move orders
{
  const { sim } = loadSim();
  const u = sim.spawn("ilight", 1, 12, 20);
  const e = sim.spawn("ilight", 2, 18, 20); // inside range 6.5 while passing
  sim.commandMove([u.id], 26, 20, false);
  run(sim, 2);
  check('10 fire-on-move still works', e.hp < e.def.health, true);
}

// 11 — building attack still works through the rotation/aim gate
{
  const { sim } = loadSim();
  const u = sim.spawn("iheavy", 1, 20, 20);
  const hq = sim.buildings.find((b) => b.defId === 'hq' && b.owner === 2);
  u.order = { kind: 'attackMove' };
  u.x = hq.x + 6;
  u.y = hq.y;
  u.facing = u.orientDest = Math.PI; // facing the HQ
  for (let i = 0; i < 60; i++)
    sim.step(0.05); // full step so projectiles fly (updateProjectiles)
  check('11 enemy HQ damaged via attack-move', hq.hp < hq.maxHp, true);
}

console.log(fail ? `\n${fail} FAILURES` : '\nall unit-fsm vectors pass');
process.exit(fail ? 1 : 0);
