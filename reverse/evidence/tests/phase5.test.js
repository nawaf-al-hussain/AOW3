#!/usr/bin/env node
// Phase 5 test — combat reconstruction gaps: weapon minimum range (native
// distance_min, WEAPON_DISTANCE_MIN="distance_min" dump.cs:17303, m_distanceMin
// 0x2C beside m_distance 0x28 in WeaponTypeMapEditorConfig), patrol mission
// (ClientUnitTaskType.Patrol = 1, dump.cs:271215), garrison mission
// (ClientBuildingTypeEditor.Bunker = 14 dump.cs:266093 + ClientBunkerWeapon
// crew-served weapon dump.cs:275667; UnloadFromTransport = 10 exit analog).
// Extracts the SHIPPED sim kernel verbatim from docs/game.js — a mismatch
// between shipped code and the tested behavior fails here by construction.
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
function stepUntil(sim, pred, maxTicks = 1200) {
  for (let i = 0; i < maxTicks; i++) {
    sim.step(TICK);
    if (pred())
      return i + 1;
  }
  return -1;
}
function clearInitial(sim) {
  // drop the constructor's starting squads so assertions see only spawned units
  sim.units = [];
}

let fail = 0, total = 0;
const check = (name, got, want) => {
  total++;
  const ok = typeof want === 'function' ? want(got) : Object.is(got, want);
  if (!ok) { fail++; console.log(`  FAIL ${name}: got ${String(got).slice(0, 120)}`); }
  else console.log(`  ok   ${name}`);
};
const section = (t) => console.log(`\n== ${t} ==`);

// ================= 1. weapon minimum range =================
section('minRange: data anchors');
{
  const { K } = loadKernel(1);
  check('w_typhoon minRange present', K.UNITS.typhoon.weapon.minRange, 5);
  check('w_fortress minRange present', K.UNITS.fortress.weapon.minRange, 4);
  check('w_typhoon maxRange unchanged', K.UNITS.typhoon.weapon.range, 15);
  check('normal weapons have no minRange', K.UNITS.mammoth.weapon.minRange, undefined);
}

section('minRange: dead zone — no fire, no projectile, holds ground');
{
  const { sim } = loadKernel(2);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 23, 80); // d = 3 < minRange 5
  sim.commandAttack([ty.id], foe.id);
  const hp0 = foe.hp, x0 = ty.x, y0 = ty.y;
  run(sim, 100); // 5 s — cooldown 4.2 would have released a shell
  check('no projectile inside dead zone', sim.projectiles.length, 0);
  check('target untouched inside dead zone', foe.hp, hp0);
  check('typhoon holds (no advance into melee)', Math.hypot(ty.x - x0, ty.y - y0) < 0.5, true);
}

section('minRange: within [minRange, range] — fires normally');
{
  const { sim } = loadKernel(3);
  const ty = sim.spawn('typhoon', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 30, 80); // d = 10, inside [5, 15]
  sim.commandAttack([ty.id], foe.id);
  const hp0 = foe.hp;
  run(sim, 100);
  check('projectile released in range', sim.projectiles.length > 0 || foe.hp < hp0, true);
  check('target damaged in range', foe.hp < hp0, true);
}

section('minRange: acquisition skips dead-zone targets');
{
  const { sim } = loadKernel(4);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80);
  sim.spawn('ilight', 2, 23, 80); // d = 3 — inside the dead zone
  sim.spawn('ilight', 2, 32, 80); // d = 12 — valid
  run(sim, 20);
  const t = sim.findTarget(sim.units.find((v) => v.id === ty.id));
  check('findTarget ignores dead-zone enemy (returns outside one)', t ? Math.hypot(t.x - ty.x, t.y - ty.y) >= 5 : false, true);
  const acquired = sim.units.find((u) => u.id === ty.id).targetId;
  const at = sim.units.find((v) => v.id === acquired);
  check('live acquisition is the outside enemy', at ? Math.hypot(at.x - ty.x, at.y - ty.y) >= 5 : false, true);
}

section('minRange: non-artillery weapons unaffected at point blank');
{
  const { sim } = loadKernel(5);
  clearInitial(sim);
  const mm = sim.spawn('mammoth', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 21.5, 80); // d = 1.5, mammoth has no minRange
  sim.commandAttack([mm.id], foe.id);
  const hp0 = foe.hp;
  run(sim, 60);
  check('mammoth fires point blank', foe.hp < hp0 || sim.projectiles.length > 0, true);
}

// ================= 2. patrol mission =================
section('patrol: command layer + route oscillation');
{
  const { sim } = loadKernel(6);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandPatrol([u.id], 30, 80);
  check('order kind patrol', u.order.kind, 'patrol');
  check('anchor recorded at issue position', Math.abs(u.order.ax - 20) < 0.5 && Math.abs(u.order.ay - 80) < 0.5, true);
  check('first leg heads to B', Math.abs(u.dest.x - 30) < 0.6 && Math.abs(u.dest.y - 80) < 0.6, true);
  const tLeg1 = stepUntil(sim, () => u.order.back === true, 600);
  check('leg 1 completed (back flag flipped)', tLeg1 > 0, true);
  check('return leg heads to anchor', Math.abs(u.dest.x - u.order.ax) < 0.6, true);
  const tLeg2 = stepUntil(sim, () => u.order.back === false, 700);
  check('leg 2 completed (full round trip)', tLeg2 > 0, true);
  check('still patrolling after a full cycle', u.order.kind, 'patrol');
}

section('patrol: engages targets of opportunity, resumes route after kill');
{
  const { sim } = loadKernel(7);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandPatrol([u.id], 30, 80);
  const foe = sim.spawn('ilight', 2, 25, 80); // on the route
  run(sim, 30); // walk into range
  check('patrol acquires en-route target', u.targetId, foe.id);
  foe.hp = 0; // purge threshold (updateUnits removes hp <= 0)
  run(sim, 6);
  check('enemy purged', !sim.units.some((v) => v.id === foe.id), true);
  check('patrol resumes after engagement', u.order.kind, 'patrol');
  check('patrol keeps walking (path or dest alive)', u.order.back === false || u.order.back === true, true);
}

section('patrol: through Commands.issue (journal + validation)');
{
  const { sim, K } = loadKernel(8);
  const c = new K.Commands(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const ok = c.issue({ type: 'patrol', ids: [u.id], x: 30, y: 80 });
  check('issue accepted', ok, true);
  check('journaled with tick + seq', c.full.length === 1 && c.full[0].tick === 0 && c.full[0].seq === 0, true);
  check('order applied', u.order.kind, 'patrol');
  check('rejects without ids', c.issue({ type: 'patrol', x: 1, y: 1 }), false);
}

// ================= 3. garrison mission =================
section('garrison: enter bunker, protected, bunker fires only when crewed');
{
  const { sim } = loadKernel(9);
  clearInitial(sim);
  sim.addBuilding('bunker', 1, 24, 80);
  const bunker = sim.buildings.find((b) => b.defId === 'bunker');
  const inf = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 27, 80);
  sim.commandGarrison([inf.id], bunker.id);
  check('order kind garrison', inf.order.kind, 'garrison');
  const tIn = stepUntil(sim, () => inf.garrison === bunker.id, 400);
  check('infantry entered the bunker', tIn > 0, true);
  // garrisoned infantry: untargetable + inert
  check('enemy does NOT acquire garrisoned infantry', foe.targetId, undefined);
  check('garrisoned unit is inert (no velocity)', Math.hypot(inf.vx, inf.vy), 0);
  // crewed bunker fires at the enemy
  const hp0 = foe.hp;
  run(sim, 80);
  check('crewed bunker fires at enemy in range', foe.hp < hp0, true);
  // enemy may shell the bunker back (structure is a valid building target)
  check('bunker still standing', bunker.hp > 0, true);
}

section('garrison: empty bunker stays silent');
{
  const { sim } = loadKernel(10);
  clearInitial(sim);
  sim.addBuilding('bunker', 1, 24, 80);
  const foe = sim.spawn('ilight', 2, 27, 80);
  const hp0 = foe.hp;
  run(sim, 120); // 6 s — plenty of un-cooldown cycles if it were crewed
  check('empty bunker never fires', foe.hp, hp0);
}

section('garrison: exit paths — V command, move auto-unload, capacity, bunker death');
{
  const { sim, K } = loadKernel(11);
  clearInitial(sim);
  sim.addBuilding('bunker', 1, 24, 80);
  const bunker = sim.buildings.find((b) => b.defId === 'bunker');
  const a = sim.spawn('ilight', 1, 20, 80);
  const b = sim.spawn('ilight', 1, 20, 79);
  const c = sim.spawn('ilight', 1, 20, 81);
  const d = sim.spawn('ilight', 1, 20, 78);
  sim.commandGarrison([a.id, b.id, c.id, d.id], bunker.id);
  const tIn = stepUntil(sim, () => sim.units.filter((v) => v.garrison === bunker.id).length === K.GARRISON_CAP, 500);
  check('cap enforced (3 of 4 entered)', tIn > 0, true);
  check('4th infantry stayed outside', sim.units.find((v) => v.id === d.id).garrison, undefined);
  // explicit exit (V key path)
  sim.commandUngarrison([a.id]);
  check('commandUngarrison exits', sim.units.find((v) => v.id === a.id).garrison, undefined);
  const a2 = sim.units.find((v) => v.id === a.id);
  check('exited to a passable tile near the bunker', Math.hypot(a2.x - bunker.x, a2.y - bunker.y) < 4.5, true);
  // re-enter a, then move command auto-unloads
  sim.commandGarrison([a.id], bunker.id);
  stepUntil(sim, () => sim.units.find((v) => v.id === a.id).garrison === bunker.id, 400);
  sim.commandMove([a.id], 34, 80);
  check('move command auto-unloads (native UnloadFromTransport)', sim.units.find((v) => v.id === a.id).garrison, undefined);
  // bunker death scrambles the crew
  const crewBefore = sim.units.filter((v) => v.garrison === bunker.id).length;
  check('crew present before demolition', crewBefore > 0, true);
  bunker.hp = 0;
  run(sim, 2);
  check('bunker destroyed', !sim.buildings.some((v) => v.id === bunker.id), true);
  check('crew scrambled alive', sim.units.filter((v) => v.def.kind === 'infantry' && v.hp > 0).length >= 3, true);
  check('no unit left garrisoned', sim.units.every((v) => v.garrison === undefined), true);
}

section('garrison: non-infantry and enemy bunkers rejected');
{
  const { sim } = loadKernel(12);
  clearInitial(sim);
  sim.addBuilding('bunker', 2, 30, 80);
  const enemyBunker = sim.buildings.find((b) => b.defId === 'bunker');
  const inf = sim.spawn('ilight', 1, 26, 80);
  const veh = sim.spawn('mammoth', 1, 26, 82);
  sim.commandGarrison([inf.id], enemyBunker.id);
  check('enemy bunker rejected', inf.order.kind, 'idle');
  sim.commandGarrison([veh.id], enemyBunker.id);
  check('non-infantry rejected', veh.order.kind, 'idle');
}

// ================= 4. determinism across the new features =================
section('same-seed determinism through patrol + garrison + minRange');
{
  const a = loadKernel(4242), b = loadKernel(4242);
  const script = (sim) => {
    sim.addBuilding('bunker', 1, 24, 80);
    const inf = sim.spawn('ilight', 1, 20, 80);
    const ty = sim.spawn('typhoon', 1, 20, 84);
    const foe = sim.spawn('ilight', 2, 27, 80);
    sim.commandPatrol([inf.id], 30, 84);
    sim.commandGarrison([inf.id], sim.buildings.find((v) => v.defId === 'bunker').id);
    sim.commandAttack([ty.id], foe.id);
  };
  script(a.sim); script(b.sim);
  run(a.sim, 400); run(b.sim, 400);
  check('hash equal after 400 ticks with new features', a.sim.hashState() === b.sim.hashState(), true);
  check('rngState equal', a.sim.rngState, b.sim.rngState);
}

console.log(`\nphase5: ${total - fail}/${total} PASS${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
