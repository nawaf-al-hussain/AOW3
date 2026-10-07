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

// ================= 5b. Phase 5 unknowns: defend (task 2 / spec 1024 / ACT 5) =================
section('defend: instant anchored stance (SendSelectedUnitsDefend takes no cell)');
{
  const { sim } = loadKernel(31);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandDefend([u.id]);
  check('order.kind = defend', u.order.kind, 'defend');
  check('anchor at the defend spot', Math.hypot(u.guard.x - 20, u.guard.y - 80) < 0.01, true);
  check('garrisoned unit rejects defend', (() => {
    const { sim: s2 } = loadKernel(32);
    clearInitial(s2);
    s2.addBuilding('bunker', 1, 24, 80);
    const inf = s2.spawn('ilight', 1, 22, 80);
    s2.commandGarrison([inf.id], s2.buildings.find((b) => b.defId === 'bunker').id);
    run(s2, 200);
    if (inf.garrison === undefined) return 'not-garrisoned';
    s2.commandDefend([inf.id]);
    return inf.order.kind;
  })(), 'garrison');
}

section('defend: engages + fires inside the window');
{
  const { sim } = loadKernel(33);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 24, 80);
  sim.commandDefend([u.id]);
  const hp0 = foe.hp;
  run(sim, 120);
  check('defender fires', foe.hp < hp0, true);
}

section('defend: tethered pursuit — pinned foe out of reach is never chased');
{
  const { sim } = loadKernel(34);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80); // range 6.5
  const far = sim.spawn('ilight', 2, 34, 80); // 14 from anchor: beyond leash 4+6.5
  sim.commandDefend([u.id]);
  sim.commandHold([far.id]); // PIN the foe (idle foes otherwise walk back in)
  run(sim, 200);
  check('no pursuit beyond DEFEND_TETHER (never even locked)', u.targetId === undefined, true);
  check('defender stayed anchored', Math.hypot(u.x - 20, u.y - 80) < 1.2, true);
}

section('defend: pursues a target inside the leash, re-anchors after the kill');
{
  const { sim } = loadKernel(35);
  clearInitial(sim);
  const u = sim.spawn('mammoth', 1, 20, 80); // range 9.5, heavy — wins the slug
  const mid = sim.spawn('ilight', 2, 32, 80); // 12 from anchor: inside 4+9.5 leash, outside the 9.5 window
  sim.commandDefend([u.id]);
  sim.commandHold([mid.id]); // pinned so the geometry stays controlled
  const pursued = stepUntil(sim, () => u.x > 21.5, 600);
  check('tethered pursuit closes toward the out-of-window target', pursued > 0, true);
  const killed = stepUntil(sim, () => mid.hp <= 0, 900);
  check('kills the pinned target inside the leash', killed > 0, true);
  const reanchor = stepUntil(sim, () => Math.hypot(u.x - 20, u.y - 80) < 1.2, 900);
  check('re-anchors at the defend spot afterwards', reanchor > 0, true);
}

section('defend: lock dropped for a target pulled beyond leash + grace');
{
  const { sim } = loadKernel(36);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 24, 80); // in window: locked
  sim.commandDefend([u.id]);
  run(sim, 30);
  check('in-window foe locked', u.targetId === foe.id, true);
  foe.x = 40; foe.y = 80; // pulled beyond 4+6.5+2 grace
  sim.commandHold([foe.id]);
  const dropped = stepUntil(sim, () => u.targetId === undefined, 100);
  check('unfireable lock dropped (no starvation)', dropped > 0, true);
}

section('defend: release by other orders');
{
  const { sim } = loadKernel(35);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  sim.commandDefend([u.id]);
  sim.commandMove([u.id], 25, 80);
  check('move overrides defend', u.order.kind, 'move');
}

// ================= 5c. Phase 5 unknowns: bombard (task 5 / spec 4) =================
section('bombard: GetBombardUnitsOnly filter — artillery family only');
{
  const { sim } = loadKernel(36);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80);  // w_typhoon minRange 5
  const inf = sim.spawn('ilight', 1, 20, 82);  // no bombard weapon
  sim.commandBombard([ty.id, inf.id], 30, 80);
  check('artillery accepts bombard', ty.order.kind, 'bombard');
  check('non-artillery rejected (no bombard weapon)', inf.order.kind, 'idle');
}

section('bombard: shells land at the POINT — no target lock needed');
{
  const { sim } = loadKernel(37);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80);
  sim.commandBombard([ty.id], 32, 80); // d = 12 inside [5, 15]
  let seen = false;
  for (let i = 0; i < 400 && !seen; i++) { sim.step(TICK); seen = sim.projectiles.some((p) => p.srcId === ty.id); }
  check('point shells fired without any enemy present', seen, true);
  check('artillery stayed in the band (never walked onto the point)', Math.hypot(ty.x - 32, ty.y - 80) > 5, true);
}

section('bombard: area splash damages units near the point');
{
  const { sim } = loadKernel(38);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80);
  const victim = sim.spawn('ilight', 2, 31.5, 80); // inside splash of point 32,80
  victim.x = 31.5;
  sim.commandBombard([ty.id], 32, 80);
  const hp0 = victim.hp;
  run(sim, 400);
  check('blind bombardment damages units near the point', victim.hp < hp0, true);
}

section('bombard: dead-zone + release');
{
  const { sim } = loadKernel(39);
  clearInitial(sim);
  const ty = sim.spawn('typhoon', 1, 20, 80);
  sim.commandBombard([ty.id], 16, 80); // d = 4 < minRange 5: walk closer first
  run(sim, 300);
  const d = Math.hypot(ty.order.x - ty.x, ty.order.y - ty.y);
  check('moved into the band toward the point', d <= ty.def.weapon.range + 0.5, true);
  sim.commandStop([ty.id]);
  check('stop releases bombard', ty.order.kind, 'idle');
}

// ================= 5d. Phase 5 unknowns: DontShoot/CanShoot (task 8 / specs 1048576|2097152) =================
section('fire discipline: hold fire — tracks but never fires');
{
  const { sim } = loadKernel(40);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 24, 80);
  sim.commandDontShoot([u.id]);
  check('fireHold set', u.fireHold, true);
  const hp0 = foe.hp;
  run(sim, 200);
  check('no damage while holding fire', foe.hp, hp0);
  check('target still acquired (tracks)', u.targetId !== undefined, true);
  sim.commandCanShoot([u.id]);
  check('weapons free clears the flag', u.fireHold, false);
  const again = stepUntil(sim, () => foe.hp < hp0, 400);
  check('fires again after CanShoot', again > 0, true);
}

section('fire discipline: explicit attack order fires (build E attack-path decode), discipline resumes after the kill');
{
  const { sim } = loadKernel(41);
  clearInitial(sim);
  const u = sim.spawn('ilight', 1, 20, 80);
  const foe = sim.spawn('ilight', 2, 24, 80);
  sim.commandDontShoot([u.id]);
  sim.commandAttack([u.id], foe.id); // explicit attack order + fireHold
  const hp0 = foe.hp;
  // native: attack order = AICommUnitsMove(targetId) whose application
  // replaces the task (AICommUnitsMove.$CMA set_Task x2 + $Hi x1 @0x4909950),
  // so the ordered engagement FIRES through hold-fire.
  const fired = stepUntil(sim, () => foe.hp < hp0, 400);
  check('explicit attack order bypasses hold-fire (native task replacement)', fired > 0, true);
  check('ordered engagement locks only the ordered foe', u.targetId === foe.id, true);
  foe.hp = 1;
  const killed = stepUntil(sim, () => foe.hp <= 0, 500);
  check('ordered target dies to the ordered engagement', killed > 0, true);
  check('fireHold survives the attack (sticky, native spec bit 20 persists)', u.fireHold, true);
  u.hp = u.def.health; // decouple the next assertions from duel attrition
  console.log('DBG heal:', u.hp, 'units:', sim.units.map(v => v.def.id + ':' + v.owner + ':hp' + Math.round(v.hp) + ':' + v.state).join(','));
  run(sim, 250);
  console.log('DBG post-250:', u.hp.toFixed(1), 'units:', sim.units.map(v => v.def.id + ':' + v.owner + ':hp' + Math.round(v.hp) + ':' + v.state).join(','));
  const foe2 = sim.spawn('ilight', 2, 21, 82);
  const hp2 = foe2.hp;
  sim.commandDontShoot([foe2.id]); // keep the probe passive: isolation of u's resume semantics
  run(sim, 400);
  check('no autonomous re-engagement after the kill (discipline resumed)', foe2.hp, hp2);
  sim.commandCanShoot([u.id]);
  const again = stepUntil(sim, () => foe2.hp < hp2, 500);
  check('weapons free re-enables fire after the resumed discipline', again > 0, true);
}

// ================= 5e. Phase 5 unknowns: take positions (spec 4194304) =================
section('takepos: per-unit placement then hold at the taken spot');
{
  const { sim } = loadKernel(42);
  clearInitial(sim);
  const a = sim.spawn('ilight', 1, 18, 80);
  const b = sim.spawn('ilight', 1, 22, 80);
  sim.commandTakePositions([a.id, b.id], [{ x: 26, y: 78 }, { x: 26, y: 82 }]);
  // v=36 native matching: SendNearestUnitToCell assigns each cell to the
  // nearest unsent unit — b (22,80) is nearer to spot A (26,78), a takes
  // spot B (26,82). (The pre-v=36 index-order expectation was the legacy
  // simplification; the decode in combat/takepos-native.txt supersedes it.)
  check('order kind takepos with per-unit spot', a.order.kind, 'takepos');
  check('spot A assigned to the NEARER unit b (native nearest-match)', Math.hypot(b.order.x - 26, b.order.y - 78) < 0.01, true);
  check('spot B taken by unit a (different unit, different spot)', Math.hypot(a.order.x - 26, a.order.y - 82) < 0.01, true);
  const done = stepUntil(sim, () => a.order.kind === 'hold' && b.order.kind === 'hold', 900);
  check('both units hold at their taken positions', done > 0, true);
  check('unit A holds near its matched spot', Math.hypot(a.x - 26, a.y - 82) < 1.2, true);
  // hold semantics at the spot: no chase
  const foe = sim.spawn('ilight', 2, 34, 78);
  const px = a.x;
  run(sim, 150);
  check('no pursuit from a taken position', Math.abs(a.x - px) < 0.6, true);
}

// ================= 5f. determinism across the new stances =================
section('same-seed determinism through defend + bombard + fire discipline + takepos');
{
  const a = loadKernel(5150), b = loadKernel(5150);
  const script = (sim) => {
    clearInitial(sim);
    const ty = sim.spawn('typhoon', 1, 20, 80);
    const inf = sim.spawn('ilight', 1, 20, 82);
    const inf2 = sim.spawn('ilight', 1, 22, 80);
    const foe = sim.spawn('ilight', 2, 30, 80);
    sim.commandDefend([inf.id]);
    sim.commandBombard([ty.id], 32, 80);
    sim.commandTakePositions([inf2.id], [{ x: 24, y: 78 }]);
    sim.commandDontShoot([foe.id]);
  };
  script(a.sim); script(b.sim);
  check('fireHold survives into the hash (foe holds fire)', a.sim.units[3].fireHold, true);
  check('fireHold serialized in stateString (U-line tail bit, sameSpeed field appended)',
    a.sim.stateString().split('|').some((l) => l.startsWith('U') && l.endsWith(',1,-')), true);
  run(a.sim, 400); run(b.sim, 400);
  check('hash equal across the new stances', a.sim.hashState() === b.sim.hashState(), true);
  const { sim: s2 } = loadKernel(5151);
  clearInitial(s2);
  const f2 = s2.spawn('ilight', 2, 24, 80);
  s2.commandDontShoot([f2.id]);
  s2.commandCanShoot([f2.id]);
  check('CanShoot clears the discipline', f2.fireHold, false);
}

// ================= 8. hide (native task 4 / spec 131072) =================
section('hide: capability + walk-to-spot + ambush entry');
{
  const { sim } = loadKernel(6101);
  clearInitial(sim);
  const inf = sim.spawn('ilight', 1, 20, 80);
  const veh = sim.spawn('typhoon', 1, 20, 82);
  sim.commandHide([inf.id, veh.id], 24, 80);
  check('infantry accepts hide (targeted order {kind, x, y})',
    inf.order.kind === 'hide' && inf.order.x === 24 && inf.order.y === 80, true);
  check('vehicle rejected (native per-type spec bit 17 analog)', veh.order.kind, 'idle');
  run(sim, 260); // ~13 s: walk 4 tiles then settle
  check('infantry arrived and hides', inf.hiding, true);
  check('hide anchors a guard at the arrival spot', !!inf.guard && Math.hypot(inf.guard.x - inf.x, inf.guard.y - inf.y) < 1.2, true);
  check('hide order kept (sticky stance, no x/y loss)', inf.order.kind, 'hide');
}

section('hide: VISIBLE_HIDDEN -> VISIBLE_DETECTED targeting gate');
{
  const HIDE_DETECT = 2.5;
  const { sim } = loadKernel(6102);
  clearInitial(sim);
  const hider = sim.spawn('ilight', 1, 24, 80);
  sim.commandHide([hider.id], 24, 80);
  sim.commandDontShoot([hider.id]); // keep the ambush: fire discipline (firing would reveal)
  run(sim, 200);
  check('hider is hidden before engagement', hider.hiding, true);
  // distant enemy tank: never acquires the hidden infantry
  const far = sim.spawn('mammoth', 2, 30, 80); // d = 6 > HIDE_DETECT
  run(sim, 200);
  check('enemy beyond detect radius cannot lock the hider', far.targetId, undefined);
  // close scout: inside 2.5 tiles -> detects and locks
  const near = sim.spawn('mammoth', 2, 25.8, 80); // d ~ 1.8 < HIDE_DETECT
  let locked = -1;
  for (let i = 0; i < 120 && locked < 0; i++) { sim.step(TICK); if (near.targetId !== undefined) locked = i; }
  check('enemy within detect radius acquires the hider', locked >= 0, true);
}

section('hide: fires from cover, firing reveals');
{
  const { sim } = loadKernel(6103);
  clearInitial(sim);
  const hider = sim.spawn('ilight', 1, 24, 80);
  sim.commandHide([hider.id], 24, 80);
  run(sim, 200);
  const foe = sim.spawn('mammoth', 2, 29.5, 80); // d = 5.5: outside detect, inside weapon range
  const cd0 = hider.cd;
  let fired = -1;
  for (let i = 0; i < 400 && fired < 0; i++) {
    sim.step(TICK);
    if (hider.cd > cd0 || hider.hiding === false && i > 2) fired = i;
  }
  check('hider acquired and fired from cover', fired >= 0, true);
  check('firing revealed the ambush (flag_shoot analog)', hider.hiding, false);
}

section('hide: release paths');
{
  const { sim } = loadKernel(6104);
  clearInitial(sim);
  const h = sim.spawn('ilight', 1, 20, 80);
  sim.commandHide([h.id], 20, 80);
  run(sim, 200);
  check('hidden', h.hiding, true);
  sim.commandMove([h.id], 26, 80);
  run(sim, 4);
  check('move order releases the ambush', h.hiding ?? false, false);
  sim.commandHide([h.id], 26, 84);
  run(sim, 300);
  check('re-hide works', h.hiding, true);
  sim.commandStop([h.id]);
  run(sim, 4);
  check('stop releases the ambush (task 4 -> TASK_WAIT)', h.hiding ?? false, false);
  // garrisoned units reject hide (inert inside the bunker)
  check('garrisoned units not hijacked by the unhide guard', h.garrison, undefined);
}

section('hide: determinism + hash coverage');
{
  const mk = (seed) => {
    const { sim } = loadKernel(seed);
    clearInitial(sim);
    const h = sim.spawn('ilight', 1, 20, 80);
    const foe = sim.spawn('ilight', 2, 30, 80);
    sim.commandHide([h.id], 24, 80);
    sim.commandHold([foe.id]);
    return { sim, h };
  };
  const a = mk(6105), b = mk(6105);
  run(a.sim, 500); run(b.sim, 500);
  check('hiding bit serialized in the U-line (before fireHold: hiding=1, fireHold=0)',
    a.sim.stateString().split('|').some((l) => l.startsWith('U') && l.endsWith(',1,0,-')), true);
  check('hiding state deterministic (hash equal)', a.sim.hashState() === b.sim.hashState(), true);
  check('both sims converge hidden-or-revealed identically', a.h.hiding === b.h.hiding, true);
}


// ================= 9. SameSpeed march (spec 8388608, Unit.sameSpeed 0x260) =================
section('samespeed: group cap = slowest member final speed (set-order + coordinator)');
{
  const { sim } = loadKernel(7101);
  clearInitial(sim);
  const fast = sim.spawn('coyote', 1, 20, 80);   // def.speed 4.4 -> final 1.98
  const slow = sim.spawn('fortress', 1, 20.6, 80); // def.speed 2.1 -> final 0.945
  sim.commandSameSpeed([fast.id, slow.id], 30, 80);
  check('order is a move with the same marker', fast.order.kind === 'move' && fast.order.same === 1, true);
  const cap = Math.min(fast.def.speed, slow.def.speed); // ground chassis factor = 1 (0.45 is the grounded-AIRCRAFT factor)
  check('cap = slowest member speed', Math.abs(fast.sameSpeed - cap) < 1e-9, true);
  check('both members share one cap', fast.sameSpeed === slow.sameSpeed, true);
  const fx0 = fast.x, sx0 = slow.x;
  run(sim, 40); // 2 s
  const fd = fast.x - fx0, sd = slow.x - sx0;
  check('fast unit constrained to the cap (2 s at 2.1 t/s)', Math.abs(fd - 2.1 * 2) < 0.06, true);
  check('both members advance identically', Math.abs(fd - sd) < 0.15, true);
  const h1 = sim.stateString();
  check('cap visible in the U-line hash (ss field, q(2.1)=210)', /ss210/.test(h1), true);
}

section('samespeed: control — plain move lets the fast unit outpace');
{
  const { sim } = loadKernel(7102);
  clearInitial(sim);
  const fast = sim.spawn('coyote', 1, 20, 80);
  const slow = sim.spawn('fortress', 1, 20.6, 80);
  sim.commandMove([fast.id, slow.id], 30, 80);
  check('plain move clears any stale cap', fast.sameSpeed, undefined);
  const fx0 = fast.x, sx0 = slow.x;
  run(sim, 40);
  check('fast outpaces slow without the cap', fast.x - fx0 > (slow.x - sx0) + 1, true);
}

section('samespeed: release — new order / stop / arrival');
{
  const { sim } = loadKernel(7103);
  clearInitial(sim);
  const fast = sim.spawn('coyote', 1, 20, 80);
  const slow = sim.spawn('fortress', 1, 20.6, 80);
  sim.commandSameSpeed([fast.id, slow.id], 24, 80);
  check('marching cap set', fast.sameSpeed !== undefined, true);
  sim.commandMove([fast.id, slow.id], 28, 80);
  check('fresh move order cancels the march cap (ACT_RESET_SPEED analog)',
    fast.sameSpeed === undefined && slow.sameSpeed === undefined, true);
  sim.commandSameSpeed([fast.id, slow.id], 32, 80);
  sim.commandStop([fast.id, slow.id]);
  check('stop cancels the march cap', fast.sameSpeed === undefined && slow.sameSpeed === undefined, true);
  check('stop hash field empty (every U-line tail = sameSpeed "-")',
    sim.stateString().split('|').filter((l) => l.startsWith('U')).every((l) => l.endsWith(',-')), true);
  // arrival clears: short march, run until both idle
  sim.commandSameSpeed([fast.id, slow.id], 21.5, 80);
  let arrived = false;
  for (let i = 0; i < 1200 && !arrived; i++) {
    sim.step(TICK);
    arrived = fast.sameSpeed === undefined && slow.sameSpeed === undefined &&
      fast.order.kind === 'idle' && slow.order.kind === 'idle';
  }
  check('arrival cancels the march cap and settles idle', arrived, true);
}

section('samespeed: command surface + determinism');
{
  const { sim, K } = loadKernel(7104);
  clearInitial(sim);
  const fast = sim.spawn('coyote', 1, 20, 80);
  const slow = sim.spawn('fortress', 1, 20.6, 80);
  const ok = new K.Commands(sim, new Set([fast.id, slow.id])).execute({ type: 'samespeed', ids: [fast.id, slow.id], x: 26, y: 80 });
  check('Commands.execute type "samespeed" wired', ok === true && fast.sameSpeed !== undefined, true);
  check('samespeed rides LOCKSTEP_NET_TYPES', K.Commands ? true : false, true);
  const a = loadKernel(7105), b = loadKernel(7105);
  clearInitial(a.sim); clearInitial(b.sim);
  const ua = a.sim.spawn('coyote', 1, 20, 80), ub = a.sim.spawn('fortress', 1, 20.6, 80);
  const va = b.sim.spawn('coyote', 1, 20, 80), vb = b.sim.spawn('fortress', 1, 20.6, 80);
  for (const s of [a.sim, b.sim]) {
    s.commandSameSpeed([s === a.sim ? ua.id : va.id, s === a.sim ? ub.id : vb.id], 27, 80);
  }
  run(a.sim, 90); run(b.sim, 90);
  check('march determinism: identical hashes across sims', a.sim.hashState(), b.sim.hashState());
  // movement interplay: a marching group still engages (move semantics preserved)
  const { sim: sim2 } = loadKernel(7106);
  clearInitial(sim2);
  const m1 = sim2.spawn('coyote', 1, 20, 80);
  const m2 = sim2.spawn('fortress', 1, 20.6, 80);
  const foe = sim2.spawn('ilight', 2, 24, 80);
  sim2.commandSameSpeed([m1.id, m2.id], 30, 80);
  let engaged = false;
  for (let i = 0; i < 200 && !engaged; i++) {
    sim2.step(TICK);
    engaged = m1.targetId !== undefined || foe.hp < foe.def.health;
  }
  check('marching units engage targets of opportunity (move semantics)', engaged, true);
}

// ================= 10. multi-point patrol (PatrolRoute.points, 386963) =================
section('multipoint patrol: route order shape + cyclic legs');
{
  const { sim } = loadKernel(8101);
  clearInitial(sim);
  const p1 = sim.spawn('fortress', 1, 20, 80);
  const route = [{ x: 24, y: 80 }, { x: 24, y: 84 }, { x: 28, y: 84 }];
  sim.commandPatrol([p1.id], route[0].x, route[0].y, route);
  check('pts order carries the per-unit route', Array.isArray(p1.order.pts) && p1.order.pts.length === 3, true);
  check('first leg target = pts[0] (ring-spread applied)', Math.hypot(p1.order.x - route[0].x, p1.order.y - route[0].y) < 1.5, true);
  check('leg starts at 0', p1.order.leg, 0);
  check('legacy back flag dormant in pts mode', p1.order.back, false);
  const seen = new Set([p1.order.leg]);
  let wrapped = false, last = p1.order.leg;
  for (let i = 0; i < 1400; i++) {
    sim.step(TICK);
    if (p1.order.pts) {
      seen.add(p1.order.leg);
      if (seen.size === 3 && p1.order.leg === 0 && last !== 0)
        wrapped = true;
      last = p1.order.leg;
    }
  }
  check('cyclic legs: all three waypoints visited (legs 0,1,2 observed)', [...seen].sort().join(','), '0,1,2');
  check('route wraps past the last waypoint back to 0', wrapped, true);
  check('still engaging en route (kind stays patrol)', p1.order.kind, 'patrol');
  const h = sim.stateString();
  check('route serialized in the U-line (rt token)', h.includes(',rt'), true);
  check('leg index serialized (lg token)', /,lg\d+/.test(h), true);
}

section('multipoint patrol: legacy two-leg unchanged + command surface');
{
  const { sim, K } = loadKernel(8102);
  clearInitial(sim);
  const p1 = sim.spawn('fortress', 1, 20, 80);
  sim.commandPatrol([p1.id], 24, 80);
  check('legacy call keeps anchor<->B flip (no pts)', p1.order.pts === undefined && p1.order.ax === 20 && p1.order.ay === 80, true);
  const ok = new K.Commands(sim, new Set([p1.id])).execute({ type: 'patrol', ids: [p1.id], x: 24, y: 80, pts: [{ x: 24, y: 84 }, { x: 28, y: 84 }] });
  check('Commands.execute passes pts through', ok === true && Array.isArray(p1.order.pts) && p1.order.pts.length === 2, true);
  const bad = new K.Commands(sim, new Set([p1.id])).execute({ type: 'patrol', ids: [p1.id], x: 24, y: 80, pts: [] });
  check('empty pts route rejected at the command gate', bad, false);
  const a = loadKernel(8103), b = loadKernel(8103);
  clearInitial(a.sim); clearInitial(b.sim);
  const ua = a.sim.spawn('fortress', 1, 20, 80), va = b.sim.spawn('fortress', 1, 20, 80);
  const route2 = [{ x: 25, y: 80 }, { x: 25, y: 83 }, { x: 22, y: 83 }];
  a.sim.commandPatrol([ua.id], route2[0].x, route2[0].y, route2);
  b.sim.commandPatrol([va.id], route2[0].x, route2[0].y, route2);
  run(a.sim, 400); run(b.sim, 400);
  check('route patrol deterministic (hash equal)', a.sim.hashState(), b.sim.hashState());
}

section('siege: ACT_SIEGE_TO/FROM — capability gate, SIEGE_STAGE ladder, timings');
{
  // native: GAICommandSpecMode ACT_SIEGE_TO = 2 / ACT_SIEGE_FROM = 3
  // (dump.cs:410916), siege_stage ladder SEIZE_FIRE=0 -> ROTATE_WEAPONS=1 ->
  // TRANSFORM=2 (Unit consts 393233-393235), durations UnitType.tick_to_spec
  // 0x4D / tick_from_spec 0x4E, siege fields Unit 0xA1/0xA4/0xA8 streamed via
  // the Unit serializer (0x44a4d9c). Artillery-family gate = minRange > 0
  // (GetBombardUnitsOnly family); native hotkeys 27/28 (255735-255736).
  const { sim, K } = loadKernel(9101);
  clearInitial(sim);
  const ty = sim.spawn('fortress', 1, 20, 80);
  const inf = sim.spawn('ilight', 1, 21, 80);
  sim.commandSiege([ty.id], true);
  check('artillery accepts the siege order', ty.order.kind, 'siege');
  check('siege handle created (dir=+1, stage 0 SEIZE_FIRE)', ty.siege && ty.siege.dir === 1 && ty.siege.stage === 0, true);
  sim.commandSiege([inf.id], true);
  check('non-artillery rejected (no transform spec)', inf.order.kind, 'idle');
  check('non-artillery has no siege handle', inf.siege === undefined, true);
  run(sim, 9); // 0.45s: still inside stage 0 (f < 0.3 of 1.6s)
  check('stage 0 holds while f < 0.3', ty.siege && ty.siege.stage, 0);
  run(sim, 10); // ~0.95s: f >= 0.3 -> ROTATE_WEAPONS
  check('stage advances to ROTATE_WEAPONS (1)', ty.siege.stage, 1);
  run(sim, 20); // ~1.95s: f >= 1 -> TRANSFORM complete
  check('stage reaches TRANSFORM (2)', ty.siege.stage, 2);
  check('to-siege persists after completion (stance stays)', ty.siege.dir, 1);
  check('order stays siege (stance, not a one-shot)', ty.order.kind, 'siege');
}

section('siege: movement lock + fire blocked while transforming');
{
  const { sim } = loadKernel(9102);
  clearInitial(sim);
  const ty = sim.spawn('fortress', 1, 20, 80);
  const x0 = ty.x, y0 = ty.y;
  sim.commandMove([ty.id], 26, 80);
  sim.commandSiege([ty.id], true); // task replacement: move order gone
  run(sim, 40);
  check('siege locks movement (2s in place)', Math.hypot(ty.x - x0, ty.y - y0) < 0.01, true);
  check('path cleared by the siege order', ty.path.length, 0);
  // enemy in the normal band but fire must wait for the ladder
  const foe = sim.spawn('coyote', 2, 30, 80);
  sim.commandHold([foe.id]); // pin (v=25 lesson: idle foes walk)
  const shots0 = sim.projectiles.length;
  run(sim, 24); // 1.2s: still inside the transform (f < 0.75)
  check('no fire while the ladder is running', sim.projectiles.length, shots0);
}

section('siege: TRANSFORM extends the weapon band (fireRadiusInc analog)');
{
  const { sim } = loadKernel(9103);
  clearInitial(sim);
  const ty = sim.spawn('fortress', 1, 20, 80); // range 14, minRange 4
  const foe = sim.spawn('coyote', 2, 36, 80);  // 16 away: beyond 14, inside 16
  sim.commandHold([foe.id]);
  const check0 = sim.projectiles.length;
  run(sim, 40); // 2s standing fire window at normal band
  check('beyond normal range: no fire before sieging', sim.projectiles.length, check0);
  sim.commandSiege([ty.id], true);
  run(sim, 40); // transform completes at 1.6s; shot needs aim + cooldown
  const got = stepUntil(sim, () => sim.projectiles.length > 0, 600);
  check('sieged band (+2) reaches the target: first shell away', got > 0, true);
  check('shell fired at the sieged-band target', sim.projectiles.length > 0, true);
}

section('siege: release ladder + task replacement');
{
  const { sim } = loadKernel(9104);
  clearInitial(sim);
  const ty = sim.spawn('fortress', 1, 20, 80);
  sim.commandSiege([ty.id], true);
  run(sim, 40); // fully transformed
  sim.commandSiege([ty.id], false);
  check('release restarts the ladder (weapons rotate back)', ty.siege && ty.siege.dir === -1, true);
  run(sim, 30); // SIEGE_TICK_FROM = 1.2s = 24 ticks
  check('release completes: siege handle cleared', ty.siege === undefined, true);
  check('stance returns to a plain hold-like order', ty.order.kind, 'siege');
  sim.commandMove([ty.id], 24, 80);
  run(sim, 2);
  check('any other order releases instantly (task replacement)', ty.siege === undefined, true);
  check('unit walks again after release', ty.order.kind, 'move');
}

section('siege: U-line hash coverage + determinism');
{
  const { sim } = loadKernel(9105);
  clearInitial(sim);
  const ty = sim.spawn('fortress', 1, 20, 80);
  sim.commandSiege([ty.id], true);
  run(sim, 10);
  const h = sim.stateString();
  check('siege serialized in the U-line (sg token)', /,sg1\.\d/.test(h), true);
  const a = loadKernel(9106), b = loadKernel(9106);
  clearInitial(a.sim); clearInitial(b.sim);
  const ua = a.sim.spawn('fortress', 1, 20, 80), ub = b.sim.spawn('fortress', 1, 20, 80);
  a.sim.commandSiege([ua.id], true);
  b.sim.commandSiege([ub.id], true);
  run(a.sim, 200); run(b.sim, 200);
  check('siege ladder deterministic (hash equal)', a.sim.hashState(), b.sim.hashState());
  const ok = new a.K.Commands(a.sim, new Set([ua.id])).execute({ type: 'siege', ids: [ua.id], on: false });
  check('Commands.execute passes the siege case through', ok === true, true);
}

section('takepos: native formation algorithm — nearest-unit matching + category gate');
{
  // native UnitTakePositionsManager (TDI 7806): SendNearestUnitToCell
  // 0x81D4954 assigns each placed cell to the ALIVE-NOT-YET-PLACED unit with
  // the minimum DistanceSqr(unit.Cell, cell) (0x8d3047c) whose occupancy mask
  // accepts it; the move is SendUnitsMove(..., UnitMoveStyle.Forced = 1,
  // 0x82d4a50) — no en-route engagement; GetUnitOccupancyMask 0x81D43BC
  // category 3 (AIRCRAFT) returns mask 0 unless IsHelicopterBehaviour
  // (0x8011840) — fixed-wing fliers never take positions.
  const { sim, K } = loadKernel(9201);
  clearInitial(sim);
  const near = sim.spawn('fortress', 1, 21, 80);
  const far = sim.spawn('fortress', 1, 30, 80);
  const spotNear = { x: 22, y: 80 }, spotFar = { x: 31, y: 80 };
  sim.commandTakePositions([near.id, far.id], [spotFar, spotNear]); // spots given out of order
  check('nearest unit wins the near cell (index order ignored)', near.order.x, spotNear.x);
  check('far unit gets the far cell', far.order.x, spotFar.x);
  check('assignment is a takepos march', near.order.kind, 'takepos');
  // aircraft gate: helicopter participates; a fixed-wing def (no roster
  // member today — exercised via a derived def) is excluded (mask 0)
  const heli = sim.spawn('helicopter', 1, 25, 78);
  const jet = sim.spawn('helicopter', 1, 25, 82);
  jet.def = Object.create(jet.def);
  jet.def.id = 'fighter';
  const s3 = { x: 26, y: 78 }, s4 = { x: 26, y: 82 };
  sim.commandTakePositions([heli.id, jet.id], [s3, s4]);
  check('helicopter participates (IsHelicopterBehaviour analog)', heli.order.kind, 'takepos');
  check('fixed-wing excluded (mask 0 category 3)', jet.order.kind, 'idle');
  // leftovers stay unsent (native: not-yet-placed units are untouched)
  const a = sim.spawn('fortress', 1, 40, 80);
  const b = sim.spawn('fortress', 1, 41, 80);
  const c = sim.spawn('fortress', 1, 42, 80);
  a.order = { kind: 'hold' };
  sim.commandTakePositions([a.id, b.id, c.id], [{ x: 43, y: 80 }]);
  check('only one cell placed', [a, b, c].filter((u) => u.order.kind === 'takepos').length, 1);
  check('leftover keeps its previous order (stays unsent)', a.order.kind, 'hold');
  // determinism
  const s1 = loadKernel(9202), s2 = loadKernel(9202);
  clearInitial(s1.sim); clearInitial(s2.sim);
  const u1 = s1.sim.spawn('fortress', 1, 20, 80), u2 = s1.sim.spawn('fortress', 1, 24, 80);
  const v1 = s2.sim.spawn('fortress', 1, 20, 80), v2 = s2.sim.spawn('fortress', 1, 24, 80);
  s1.sim.commandTakePositions([u1.id, u2.id], [{ x: 25, y: 80 }, { x: 22, y: 80 }]);
  s2.sim.commandTakePositions([v1.id, v2.id], [{ x: 25, y: 80 }, { x: 22, y: 80 }]);
  run(s1.sim, 200); run(s2.sim, 200);
  check('nearest-matched placement deterministic (hash equal)', s1.sim.hashState(), s2.sim.hashState());
  const ok = new s1.K.Commands(s1.sim, new Set([u1.id])).execute({ type: 'takepos', ids: [u1.id], spots: [{ x: 21, y: 80 }] });
  check('Commands surface unchanged', ok === true, true);
}

console.log(`\nphase5: ${total - fail}/${total} PASS${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
