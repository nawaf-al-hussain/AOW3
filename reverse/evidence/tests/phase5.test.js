#!/usr/bin/env node
// Phase 5 test — combat reconstruction gaps: weapon minimum range (native
// distance_min, WEAPON_DISTANCE_MIN="distance_min" dump.cs:17303, m_distanceMin
// 0x2C beside m_distance 0x28 in WeaponTypeMapEditorConfig), patrol mission
// (ClientUnitTaskType.Patrol = 1, dump.cs:271215), garrison mission
// (ClientBuildingTypeEditor.Bunker = 14 dump.cs:266093 + ClientBunkerWeapon
// crew-served weapon dump.cs:275667; UnloadFromTransport = 10 exit analog),
// hold position stance (ClientUnitTaskType.HoldPosition = 3 dump.cs:271217 +
// ClientUnitStateSpecType.HoldPosition = 65536 dump.cs:271185; instant
// no-target entry: SendSelectedUnitsHoldPosition dump.cs:337757,
// AICommUnitsHoldPosition sim command dump.cs:433481).
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

section('patrol: survives chase interruptions (QA-found: dest dragged by pursuit)');
{
  const { sim } = loadKernel(13);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandPatrol([u.id], 34, 80);
  const foe = sim.spawn('ilight', 2, 26, 88); // off-route: pulls the unit into a chase
  run(sim, 60); // acquire + chase away from the route
  check('chase happened (unit pulled off route)', Math.hypot(u.x - 20, u.y - 80) > 2, true);
  check('dest was dragged to the chase point', u.dest && Math.hypot(u.dest.x - foe.x, u.dest.y - foe.y) < 3, true);
  foe.hp = 0; // target dies mid-pursuit
  run(sim, 40);
  check('still patrolling after the chase', u.order.kind, 'patrol');
  check('dest re-synced to the current leg target', u.dest && (Math.abs(u.dest.x - u.order.x) < 1.2 || Math.abs(u.dest.x - u.order.ax) < 1.2), true);
  const tFlip = stepUntil(sim, () => u.order.back === true, 900);
  check('route completes after interruption (leg 1 flip)', tFlip > 0, true);
  check('no idle-cancel of the patrol order', u.order.kind, 'patrol');
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

// ================= 4b. hold position (ClientUnitTaskType.HoldPosition = 3) =================
section('hold: instant stance — no target point, order carries no x/y');
{
  const { sim } = loadKernel(21);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandHold([u.id]);
  check('order.kind = hold', u.order.kind, 'hold');
  check('order has no x (movement branch stays dormant)', u.order.x, undefined);
  check('path cleared', u.path.length, 0);
  check('dest cleared', u.dest, undefined);
  check('guard anchored at the hold spot', Math.hypot(u.guard.x - 20, u.guard.y - 80) < 0.01, true);
  check('garrisoned unit rejects hold', (() => {
    const { sim: s2 } = loadKernel(22);
    clearInitial(s2);
    s2.addBuilding('bunker', 1, 24, 80);
    const inf = s2.spawn('ilight', 1, 22, 80);
    s2.commandGarrison([inf.id], s2.buildings.find((b) => b.defId === 'bunker').id);
    run(s2, 200);
    if (inf.garrison === undefined) return 'not-garrisoned';
    s2.commandHold([inf.id]);
    return inf.order.kind;
  })(), 'garrison');
}

section('hold: fires inside the window without moving');
{
  const { sim } = loadKernel(23);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 24, 80); // d = 4 < range 6.5
  sim.commandHold([u.id]);
  const hp0 = foe.hp, x0 = u.x, y0 = u.y;
  run(sim, 120); // 6 s — cooldown 1.1 releases multiple rounds
  check('target damaged', foe.hp < hp0, true);
  check('holder never moved', Math.hypot(u.x - x0, u.y - y0) < 0.01, true);
}

section('hold: acquired but out-of-window — stands, does not chase or fire');
{
  const { sim } = loadKernel(24);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 28, 80); // d = 8: inside acquire band (range+2.5 = 9), outside window (6.5)
  sim.commandHold([u.id]);
  sim.commandHold([foe.id]); // pin the foe — an idle foe would walk into the window
  const hp0 = foe.hp, x0 = u.x, y0 = u.y;
  run(sim, 140);
  check('target acquired', u.targetId, foe.id);
  check('holder stands (no pursuit)', Math.hypot(u.x - x0, u.y - y0) < 0.01, true);
  check('no fire outside the window', foe.hp, hp0);
  check('hull tracks the out-of-window target', Math.abs(Math.atan2(foe.y - u.y, foe.x - u.x) - u.facing) < 0.6, true);
}

section('hold: window re-entry fires the moment the foe crosses range');
{
  const { sim } = loadKernel(25);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 30, 80); // d = 10: eff = 9.67 > band 9 -> ignored
  sim.commandHold([u.id]);
  run(sim, 60);
  check('far foe ignored', u.targetId, undefined);
  sim.commandMove([foe.id], 25, 80); // walk into the window (d = 5)
  const hp0 = foe.hp;
  const fired = stepUntil(sim, () => foe.hp < hp0, 400);
  check('fires on window entry', fired > 0, true);
  check('still never moved', Math.hypot(u.x - 20, u.y - 80) < 0.01, true);
}

section('hold: stop releases the stance — idle chases again');
{
  const { sim } = loadKernel(26);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 28, 80);
  sim.commandHold([u.id]);
  sim.commandHold([foe.id]); // pin the foe at d = 8 — out of window while holding
  run(sim, 60);
  const x0 = u.x, y0 = u.y;
  sim.commandStop([u.id]);
  run(sim, 200);
  check('stop resumes pursuit (idle default)', Math.hypot(u.x - x0, u.y - y0) > 1, true);
  check('order reverted to idle', u.order.kind, 'idle');
}

section('hold: retaliation is window-only — struck from range, holds fire');
{
  const { sim } = loadKernel(27);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('mammoth', 2, 28.5, 80); // d = 8.5: foe shoots (mammoth range), holder cannot answer
  const foeW = foe.def.weapon ? foe.def.weapon.range : 6.5;
  check('foe outranges holder', foeW > 8, true);
  sim.commandHold([u.id]);
  const hp0 = u.hp, foeHp0 = foe.hp, x0 = u.x;
  run(sim, 200); // 10 s — mammoth lands hits, holder keeps discipline
  check('holder took damage', u.hp < hp0, true);
  check('holder stands under fire', Math.abs(u.x - x0) < 0.01, true);
  check('holder never damages the outranging foe', foe.hp, foeHp0);
}

section('hold: minRange artillery — dead-zone attacker refuses to lock, ranged foe engaged');
{
  const { sim } = loadKernel(28);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80); // minRange 5, range 15
  const close = sim.spawn('ilight', 2, 23, 80); // d = 3 < minRange: shoots the typhoon, cannot be locked back
  sim.commandHold([ty.id]);
  const closeHp0 = close.hp, x0 = ty.x;
  run(sim, 120);
  check('dead-zone attacker never locked (no dead-zone aggro)', ty.targetId, undefined);
  check('dead-zone attacker untouched', close.hp, closeHp0);
  const far = sim.spawn('ilight', 2, 30, 80); // d = 10, inside [5, 15]
  const farHp0 = far.hp;
  const fired = stepUntil(sim, () => far.hp < farHp0 || sim.projectiles.length > 0, 400);
  check('ranged foe engaged under hold', fired > 0, true);
  check('artillery still stands', Math.abs(ty.x - x0) < 0.01, true);
}

section('hold: building gate — fires at an enemy building without advancing');
{
  const { sim } = loadKernel(29);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.addBuilding('bunker', 2, 25, 80); // d = 5 <= range 6.5 + radius
  const b = sim.buildings.find((v) => v.defId === 'bunker');
  sim.commandHold([u.id]);
  const hp0 = b.hp, x0 = u.x;
  run(sim, 150);
  check('building damaged', b.hp < hp0, true);
  check('holder never advanced', Math.abs(u.x - x0) < 0.01, true);
}

section('hold: melee hero — strikes contact, never chases');
{
  const { sim } = loadKernel(30);
  clearInitial(sim);
  const hero = sim.spawn('cerber', 1, 20, 80); // melee range 2.1
  const foe = sim.spawn('ilight', 2, 21, 80); // d = 1 < 2.1
  sim.commandHold([hero.id]);
  const foeHp0 = foe.hp, x0 = hero.x, y0 = hero.y;
  run(sim, 120);
  check('melee strike lands in contact', foe.hp < foeHp0, true);
  check('hero holds position', Math.hypot(hero.x - x0, hero.y - y0) < 0.01, true);
  sim.commandMove([foe.id], 30, 80); // break contact — out of melee window
  run(sim, 80);
  check('hero does not chase the retreated foe', Math.hypot(hero.x - x0, hero.y - y0) < 0.01, true);
}

section('hold: aggro warn-join sets the target without movement');
{
  // warn-join fires on the DIRECT hit path (applyHit) — instant weapons only
  // (w_ilight projectileSpeed 0); projectile weapons set lastHitBy without aggro.
  const { sim } = loadKernel(31);
  clearInitial(sim);
  const held = sim.spawn('ilight', 1, 20, 80);
  const friend = sim.spawn('ilight', 1, 21.5, 80);
  const foe = sim.spawn('ilight', 2, 27, 80); // d(friend) = 5.5 <= 6.5: fires; d(held) = 7: outside holder window
  sim.commandHold([held.id]);
  sim.commandHold([friend.id]); // friend stays put and soaks the fire
  sim.commandHold([foe.id]); // foe stands and shoots
  run(sim, 40); // let the foe open fire on the friend
  check('foe actually engaged the friend', friend.hp < 120, true);
  const x0 = held.x, y0 = held.y;
  run(sim, 120);
  check('warn-joined the attacker', held.targetId, foe.id);
  check('joined without leaving the hold spot', Math.hypot(held.x - x0, held.y - y0) < 0.01, true);
}

section('hold: interplay — patrol/move overrides, hold overrides patrol');
{
  const { sim } = loadKernel(32);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandPatrol([u.id], 30, 80);
  check('patrol set first', u.order.kind, 'patrol');
  sim.commandHold([u.id]);
  check('hold cancels the patrol route', u.order.kind, 'hold');
  check('route legs gone', u.order.ax, undefined);
  sim.commandMove([u.id], 25, 80);
  check('move overrides hold', u.order.kind, 'move');
  run(sim, 200);
  check('move completes normally', Math.hypot(u.x - 25, u.y - 80) < 1, true);
}

section('hold: determinism — stance inside the state hash');
{
  const a = loadKernel(9090), b = loadKernel(9090);
  const script = (sim) => {
    const u = sim.spawn('ilight', 1, 20, 80);
    const foe = sim.spawn('ilight', 2, 26, 80);
    sim.commandHold([u.id]);
    sim.commandAttack([foe.id], u.id);
  };
  script(a.sim); script(b.sim);
  run(a.sim, 300); run(b.sim, 300);
  check('hash equal with hold orders', a.sim.hashState() === b.sim.hashState(), true);
  check('hold kind serialized in stateString', a.sim.stateString().includes(',hold,'), true);
}

console.log(`\nphase5: ${total - fail}/${total} PASS${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
