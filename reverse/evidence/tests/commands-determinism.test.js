#!/usr/bin/env node
// Deterministic Phase 4 test — unified command layer + determinism gaps:
//   Commands (select/move/attack/stop/capture/build/produce/special/cancel)
//   seeded PRNG (mulberry32 in Sim + AI), state hashing (stateString/hashState),
//   1 Hz hash journal, command journal.
// Like unit-fsm.test.js this suite extracts the SHIPPED sim kernel verbatim from
// docs/game.js (SIM KERNEL markers) and drives it in a vm sandbox — a mismatch
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
  '\n;globalThis.__K = { Sim, Commands, mulberry32, fnv1a, Pathfinder, UNITS, BLD, ECONOMY, PRODUCER_OF, rankTier, hitChance, effectiveDamage, FSM_DEFAULTS, angleWrap, MAP_W, MAP_H };\n';

function loadKernel(seed = 777) {
  const sandbox = {};
  sandbox.window = sandbox; // data modules attach here; genTerrain guard sees no __realMap
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

const TICK = 0.05; // 1/TICK_RATE
function run(sim, steps) {
  for (let i = 0; i < steps; i++)
    sim.step(TICK);
}

let fail = 0, total = 0;
const check = (name, got, want) => {
  total++;
  const ok = typeof want === 'function' ? want(got) : Object.is(got, want);
  if (!ok) { fail++; console.log(`  FAIL ${name}: got ${String(got).slice(0, 120)}`); }
  else console.log(`  ok   ${name}`);
};
const section = (t) => console.log(`\n== ${t} ==`);

// ================= 1. determinism: same seed -> identical hashes =================
section('same seed + same script -> identical state hashes');
{
  const a = loadKernel(31415), b = loadKernel(31415);
  check('tick-0 stateString equal', a.sim.stateString() === b.sim.stateString(), true);
  check('tick-0 hash equal', a.sim.hashState() === b.sim.hashState(), true);
  const script = (sim, K) => {
    const ids = sim.units.filter((u) => u.owner === 1).map((u) => u.id);
    K.__cmd(ids, 24, 70);
  };
  a.K.__cmd = (ids, x, y) => a.sim.commandMove(ids, x, y);
  b.K.__cmd = (ids, x, y) => b.sim.commandMove(ids, x, y);
  script(a.sim, a.K); script(b.sim, b.K);
  run(a.sim, 400); run(b.sim, 400);
  check('tick-400 hash equal', a.sim.hashState() === b.sim.hashState(), true);
  check('rngState equal after 400 draws', a.sim.rngState, b.sim.rngState);
  check('hash journal populated (1 Hz)', a.sim.hashes.length >= 19, true);
  check('journal entries monotonic', a.sim.hashes.every((e, i) => i === 0 || e.tick > a.sim.hashes[i - 1].tick), true);
  check('journal hash at tick 200 stable', a.sim.hashes[9] && a.sim.hashes[9].tick === 200 ? a.sim.hashes[9].h === b.sim.hashes[9].h : false, true);
}

// ================= 2. different seeds -> divergent streams =================
section('different seeds -> divergent rng state and hash');
{
  const a = loadKernel(111), b = loadKernel(222);
  check('rngState differs at construction', a.sim.rngState !== b.sim.rngState, true);
  check('hash differs at construction', a.sim.hashState() !== b.sim.hashState(), true);
  const h1 = a.sim.hashState();
  a.sim.rng(); a.sim.rng();
  check('rng draws advance rngState', a.sim.rngState !== ((111 ^ 0x9E3779B9) >>> 0), true);
  check('rng output in [0,1)', (() => { const r = a.sim.rng(); return r >= 0 && r < 1; })(), true);
  check('hash catches state change', a.sim.hashState() !== h1, true);
}

// ================= 3. command sensitivity: one different command -> divergence =================
section('one differing command -> hash divergence');
{
  const a = loadKernel(9001), b = loadKernel(9001);
  a.sim.commandMove([a.sim.units[0].id], 30, 70);
  b.sim.commandMove([b.sim.units[0].id], 30, 90);
  run(a.sim, 200); run(b.sim, 200);
  check('hashes diverge after differing order', a.sim.hashState() !== b.sim.hashState(), true);
}

// ================= 4. Commands layer: order routing =================
section('Commands layer routes orders to sim');
{
  const { sim, K } = loadKernel(5);
  const cmd = new K.Commands(sim);
  const u = sim.units[0];
  cmd.issue({ type: 'move', ids: [u.id], x: 30, y: 60 });
  check('move sets order kind', u.order.kind, 'move');
  check('move sets dest', u.dest ? Math.round(u.dest.x) : -1, 30);
  cmd.issue({ type: 'stop', ids: [u.id] });
  check('stop -> idle', u.order.kind, 'idle');
  check('stop clears path', u.path.length, 0);
  check('stop sets guard', !!u.guard, true);
  run(sim, 20);
  check('guard-return keeps unit alive', u.hp > 0, true);

  // attack stickiness through the layer (native objPreferred)
  const foe = sim.spawn('iheavy', 2, 30, 78);
  cmd.issue({ type: 'attack', ids: [u.id], targetId: foe.id });
  check('attack sets preferredId (sticky)', u.preferredId, foe.id);
  check('attack sets targetId', u.targetId, foe.id);
  run(sim, 30);
  check('preferredId persists while target lives', u.preferredId, foe.id);

  // capture through the layer
  const cap = sim.units.find((v) => v.owner === 1 && v.def.captures);
  const depot = sim.buildings.find((b) => b.defId === 'depot');
  const okCap = cmd.issue({ type: 'capture', ids: [cap.id], buildingId: depot.id });
  check('capture command handled', okCap, true);
  check('capture sets order', cap.order.kind, 'capture');

  // special (land/depart) on the aircraft hero
  const hero = sim.spawn('seraphim', 1, 20, 80);
  const wasGrounded = !!hero.grounded; // aircraft spawn airborne (grounded unset)
  cmd.issue({ type: 'special', ids: [hero.id] });
  check('special toggles grounded', hero.grounded, !wasGrounded);
  cmd.issue({ type: 'special', ids: [hero.id] });
  check('special toggles back', hero.grounded, wasGrounded);
}

// ================= 5. Commands layer: selection semantics =================
section('Commands layer selection modes');
{
  const { sim, K } = loadKernel(5);
  const cmd = new K.Commands(sim);
  const ids = sim.units.filter((u) => u.owner === 1).map((u) => u.id);
  cmd.issue({ type: 'select', mode: 'set', ids: ids.slice(0, 2) });
  check('set selects exactly the ids', cmd.sel.size, 2);
  cmd.issue({ type: 'select', mode: 'add', ids: [ids[2]], keep: true });
  check('add with keep extends selection', cmd.sel.size, 3);
  cmd.issue({ type: 'select', mode: 'add', ids: [ids[3]], keep: true });
  check('add with keep preserves', cmd.sel.size, 4);
  cmd.issue({ type: 'select', mode: 'add', ids: [ids[4]] });
  check('add without keep replaces', cmd.sel.size, 1);
  cmd.issue({ type: 'select', mode: 'type', defId: 'ilight' });
  check('type-select picks all of def', [...cmd.sel].every((id) => sim.units.find((u) => u.id === id).def.id === 'ilight'), true);
  cmd.issue({ type: 'select', mode: 'clear' });
  check('clear empties selection', cmd.sel.size, 0);
}

// ================= 6. Commands layer: build/produce validation + journal =================
section('build/produce validation and command journal');
{
  const { sim, K } = loadKernel(5);
  const cmd = new K.Commands(sim);
  sim.players[0].funds = 0;
  const before = sim.players[0].queue.length;
  const rejected = cmd.issue({ type: 'produce', defId: 'iheavy', owner: 1 });
  check('produce without funds rejected', rejected, false);
  check('rejected command not journalled', cmd.log.length, 0);
  sim.players[0].funds = 5000;
  sim.addBuilding('barracks', 1, 12, 88); // producer for infantry lines (away from build spot)
  const ok = cmd.issue({ type: 'produce', defId: 'iheavy', owner: 1 });
  check('produce with funds accepted', ok, true);
  check('queue grew', sim.players[0].queue.length, before + 1);
  check('journal records tick + type', cmd.log.length === 1 && cmd.log[0].tick === sim.tick && cmd.log[0].cmd.type === 'produce', true);
  const badBuild = cmd.issue({ type: 'build', defId: 'turret', owner: 1, x: 150, y: 150 });
  check('build out of bounds rejected', badBuild, false);
  sim.grid[74 * K.MAP_W + 14] = 0; // seed-random rock may block the spot; validation ≠ terrain
  const goodBuild = cmd.issue({ type: 'build', defId: 'turret', owner: 1, x: 14, y: 74 });
  check('build near base accepted', goodBuild, true);
  check('build spent funds', sim.players[0].funds < 5000, true);
  check('journal has 2 entries', cmd.log.length, 2);
  // unattached layer rejects sim orders
  const dead = new K.Commands(null);
  check('move without sim rejected', dead.issue({ type: 'move', ids: [1], x: 1, y: 1 }), false);
  check('unknown type rejected', dead.issue({ type: 'teleport', ids: [1] }), false);
  check('unknown type not journalled', dead.log.length, 0);
  // cancel
  cmd.placing = 'turret';
  cmd.issue({ type: 'select', mode: 'set', ids: [1] });
  cmd.issue({ type: 'cancel' });
  check('cancel clears placing', cmd.placing, null);
  check('cancel clears selection', cmd.sel.size, 0);
}

// ================= 7. combat determinism (hit/crit rolls through seeded rng) =================
section('combat outcomes deterministic under same seed');
{
  const fight = (seed) => {
    const { sim } = loadKernel(seed);
    const a = sim.spawn('iheavy', 1, 40, 80);
    const b = sim.spawn('iheavy', 2, 44, 80);
    sim.commandAttack([a.id], b.id);
    sim.commandAttack([b.id], a.id);
    run(sim, 600);
    return { hpA: Math.round(a.hp), hpB: Math.round(b.hp), rng: sim.rngState };
  };
  const r1 = fight(2024), r2 = fight(2024), r3 = fight(8080);
  check('same seed -> identical duel result', r1.hpA === r2.hpA && r1.hpB === r2.hpB && r1.rng === r2.rng, true);
  check('different seed -> different rng end-state', r3.rng !== r1.rng, true);
}

// ================= 8. AI seeds derived from sim seed =================
section('mulberry32 seed derivation');
{
  const { K } = loadKernel(1);
  const r1 = K.mulberry32((1 ^ Math.imul(2, 0x9E3779B9)) >>> 0);
  const r2 = K.mulberry32((1 ^ Math.imul(2, 0x9E3779B9)) >>> 0);
  const seq1 = [r1(), r1(), r1()];
  const seq2 = [r2(), r2(), r2()];
  check('AI rng reproducible from seed', seq1.every((v, i) => v === seq2[i]), true);
  check('AI rng differs across owners', K.mulberry32((1 ^ Math.imul(1, 0x9E3779B9)) >>> 0)() !== seq1[0], true);
}

// ================= 9. H1 hash coverage: mines / unit timers / cmdSeq =================
section('H1 hash coverage (mines M-lines, unit behavior timers, cmdSeq)');
{
  const { K } = loadKernel(4242);
  const mk = () => {
    const sim = new K.Sim(4242);
    const mole = sim.spawn('mole', 1, 30, 80); // mineLayer hero (HeroTypes.Mole=4, lay cd 9)
    const foe = sim.spawn('ilight', 2, 31.2, 80); // mine trigger fodder (1.2 tiles away)
    return { sim, mole, foe };
  };
  const a = mk(), b = mk();
  check('cmdSeq serialized in the T-line', /,cs\d+$/.test(a.sim.stateString().split('|')[0]), true);
  check('U-line carries the H1 field block (cols 31..41 well-formed)',
    a.sim.stateString().split('|').filter((l) => l.startsWith('U')).every((l) => {
      const c = l.split(',');
      return c.length >= 42
        && c.slice(31, 39).every((t) => t === '-' || /^-?\d+$/.test(t))
        && ['gun', 'melee', '-'].includes(c[39])
        && /^-?\d+$/.test(c[40])
        && [0, 1].includes(+(c[41][0]));
    }), true);
  run(a.sim, 700); run(b.sim, 700); // 35 s: mole lays mines every 9 s, armed mines seek foes
  const lines = a.sim.stateString().split('|');
  const mines = lines.filter((l) => l.startsWith('M'));
  check('mine entities serialized as M-lines (owner,x,y,arm)',
    mines.length > 0 && mines.every((l) => /^M\d+,-?\d+,-?\d+,\d+$/.test(l)), true);
  check('mole abilCd ticking in the U-line (col 36 numeric after a lay)',
    lines.some((l) => l.startsWith('U') && l.split(',')[1] === 'mole' && /^\d+$/.test(l.split(',')[36])), true);
  check('mine-laying sim deterministic (hash equal across two seeds-same runs)',
    a.sim.hashState() === b.sim.hashState(), true);
  check('mine entities reproduced identically (M-line byte equality)',
    lines.filter((l) => l.startsWith('M')).join('|')
      === b.sim.stateString().split('|').filter((l) => l.startsWith('M')).join('|'), true);
  // blind-spot probe: a mined field must move the hash (pre-H1 it could not)
  check('M-lines actually feed the hash (removing them changes the digest)',
    (() => {
      const full = a.sim.hashState();
      const stripped = lines.filter((l) => !l.startsWith('M')).join('|');
      return K.fnv1a(stripped) !== full;
    })(), true);
}

console.log(`\n${total - fail}/${total} assertions PASSED${fail ? ` — ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
