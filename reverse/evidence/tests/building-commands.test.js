#!/usr/bin/env node
// Building/production command suite tests (G1-G4 / I4) — Task 62.
// Native decode: reverse/notes/building-commands-native-decode.md
//   G1 produceCancel  <- AICommCancelBuyUnit(buildingId, unitPrototype)
//                        / LCBuildingUnitTrainingCancel{m_buildingId, m_unitType}
//   G2 rally          <- AICommBuildingRallyPoint (Coordinate[] waypoints)
//                        / LCBuildingRallyPoint{m_buildingId, m_cells}
//   G3 repair         <- AICommBuildingRepair(buildingId, price)
//                        / LCBuildingRepairInitiate (server-delivered duration)
//   G4 upgrade        <- AICommBuildingUpgrade(buildingId)
//                        / LCBuildingStartUpgrade + ProcessCompleted(m_upgradeLevel, m_health)
// Like commands-determinism.test.js this suite extracts the SHIPPED sim kernel
// verbatim from docs/game.js (SIM KERNEL markers) and drives it in a vm sandbox.
// Repair/upgrade are config-gated (dormant until R1 per-level prototype data):
// dormancy itself is asserted, then behavior is driven through sandbox-local
// config injection (BLD mutation inside the vm — shipped data untouched).
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
  '\n;globalThis.__K = { Sim, Commands, UNITS, BLD, ECONOMY, PRODUCER_OF, PRODUCER_SET, LOCKSTEP_NET_TYPES, RALLY_MAX_CELLS, REPAIR_DURATION_FULL_S, MAP_W, MAP_H };\n';

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
  if (!ok) { fail++; console.log(`  FAIL ${name}: got ${String(got).slice(0, 140)}`); }
  else console.log(`  ok   ${name}`);
};
const section = (t) => console.log(`\n== ${t} ==`);

// ================= G1: production cancel (AICommCancelBuyUnit) =================
section('G1 produceCancel — queue removal + refund [INFERRED 100%] + journal');
{
  const { sim, K } = loadKernel();
  sim.addBuilding('barracks', 1, 12, 12); // producer must exist (enqueue producer gate)
  const price = K.UNITS['ilight'].price;
  const f0 = sim.players[0].funds;
  check('enqueue ilight x2', sim.enqueue('ilight', 1) && sim.enqueue('ilight', 1), true);
  check('funds dropped by 2x price', Math.round((f0 - sim.players[0].funds) / price), 2);
  check('queue length 2', sim.players[0].queue.length, 2);
  check('cancel when queued', sim.produceCancel('ilight', 1), true);
  check('queue length 1 after cancel', sim.players[0].queue.length, 1);
  check('full refund applied (funds = f0 - 1x price)', Math.round((sim.players[0].funds - f0) / price), -1);
  check('cancel second entry', sim.produceCancel('ilight', 1), true);
  check('cancel with empty matching queue', sim.produceCancel('ilight', 1), false);
  check('cancel unknown defId', sim.produceCancel('nosuchunit', 1), false);
  check('funds fully restored', Math.round(sim.players[0].funds), Math.round(f0));
  // journal path: rejected commands are NOT journaled (validate-before-journal)
  const cmd = new K.Commands(sim);
  check('re-enqueue for journal check', sim.enqueue('ilight', 1), true);
  check('issue produceCancel journaled', cmd.issue({ type: 'produceCancel', defId: 'ilight', owner: 1 }), true);
  check('journal last entry type', cmd.log[cmd.log.length - 1].cmd.type, 'produceCancel');
  const logLen = cmd.log.length;
  check('rejected cancel not journaled', cmd.issue({ type: 'produceCancel', defId: 'nosuchunit', owner: 1 }), false);
  check('journal unchanged after reject', cmd.log.length, logLen);
}

// ================= G2: rally point (AICommBuildingRallyPoint) =================
section('G2 rally — production-scoped, validated, hash-covered, spawn follows');
{
  const { sim, K } = loadKernel();
  sim.addBuilding('barracks', 1, 12, 12);
  const bar = sim.buildings.find((b) => b.defId === 'barracks');
  check('rally set on own built barracks', sim.commandRally(bar.id, [{ x: 20, y: 8 }], 1), true);
  check('rally stored', bar.rally && bar.rally.length === 1 && bar.rally[0].x === 20, true);
  check('rally state in stateString', sim.stateString().includes(',ra' + Math.round(20 * 100) + '.' + Math.round(8 * 100)), true);
  check('rally rejected on neutral depot (owner gate)', (() => {
    const dep = sim.buildings.find((b) => b.defId === 'depot');
    return sim.commandRally(dep.id, [{ x: 5, y: 5 }], 1);
  })(), false);
  sim.addBuilding('turret', 1, 16, 12);
  const tur = sim.buildings.find((b) => b.defId === 'turret');
  check('rally rejected on non-production (turret)', sim.commandRally(tur.id, [{ x: 5, y: 5 }], 1), false);
  check('rally rejected out-of-map cell', sim.commandRally(bar.id, [{ x: K.MAP_W - 1, y: 8 }], 1), false);
  check('rally rejected > RALLY_MAX_CELLS', sim.commandRally(bar.id, Array.from({ length: K.RALLY_MAX_CELLS + 1 }, (_, i) => ({ x: 5 + i * 0.1, y: 5 })), 1), false);
  check('rally rejected empty cells', sim.commandRally(bar.id, [], 1), false);
  check('rally rejected NaN cell', sim.commandRally(bar.id, [{ x: NaN, y: 5 }], 1), false);
  // spawn follows rally: queue a unit with a near-zero remaining time
  sim.players[0].queue.push({ defId: 'ilight', t: 0.01, total: 1 });
  run(sim, 1);
  // NOTE: the Sim constructor spawns a starting force — take the LAST ilight
  // (the freshly spawned one), not the first match
  const spawned = sim.units.filter((v) => v.def && v.def.id === 'ilight').pop();
  check('spawned unit exists', !!spawned, true);
  check('spawn order targets rally cell', spawned && Math.round(spawned.order.x) === 20 && Math.round(spawned.order.y) === 8, true);
  // determinism surface: rally changes the hash
  const { sim: s2 } = loadKernel();
  s2.addBuilding('barracks', 1, 12, 12);
  const hBefore = s2.hashState();
  s2.commandRally(s2.buildings.find((b) => b.defId === 'barracks').id, [{ x: 20, y: 8 }], 1);
  check('hash changes when rally set', s2.hashState() !== hBefore, true);
}

// ================= G3: repair (AICommBuildingRepair, config-gated) =================
section('G3 repair — dormancy without config, full cycle with injected repairPrice');
{
  const { sim, K } = loadKernel();
  sim.addBuilding('barracks', 1, 12, 12);
  const bar = sim.buildings.find((b) => b.defId === 'barracks');
  bar.hp = bar.maxHp * 0.5;
  check('dormant: repair rejected without repairPrice data', sim.commandRepair(bar.id, 1), false);
  K.BLD.barracks.repairPrice = 20; // sandbox-local injection (R1 data placeholder)
  const f0 = sim.players[0].funds;
  check('repair accepted with config', sim.commandRepair(bar.id, 1), true);
  const price = Math.ceil(20 * 0.5);
  check('escrow deducted [INFERRED upfront]', Math.round(f0 - sim.players[0].funds), price);
  check('repairT started', bar.repairT === 0 && bar.repairTotal > 0, true);
  check('repair progress hashed', sim.stateString().includes(',rp'), true);
  check('reject full-hp repair', sim.commandRepair(bar.id, 1) || bar.repairT !== 0, false);
  check('reject concurrent upgrade while repairing', (K.BLD.barracks.upg = { price: 10, time: 1 }, sim.commandUpgrade(bar.id, 1)), false);
  const t0 = bar.repairTotal;
  run(sim, Math.ceil(t0 / TICK) + 2);
  check('hp restored to max after duration', Math.round(bar.hp), Math.round(bar.maxHp));
  check('repair state cleared', bar.repairT === undefined && bar.repairPaid === undefined, true);
  // escrow refund on destruction mid-repair [INFERRED] — drive ONE
  // updateBuildings pass directly (sim.step would add income to funds)
  const { sim: s2, K: K2 } = loadKernel();
  s2.addBuilding('barracks', 1, 12, 12);
  const bar2 = s2.buildings.find((b) => b.defId === 'barracks');
  bar2.hp = bar2.maxHp * 0.5;
  K2.BLD.barracks.repairPrice = 20;
  s2.commandRepair(bar2.id, 1);
  const fMid = s2.players[0].funds;
  const refund = Math.ceil(20 * 0.5);
  bar2.hp = 0;
  s2.updateBuildings(TICK);
  check('escrow refunded on mid-repair destruction', Math.round(s2.players[0].funds), Math.round(fMid + refund));
}

// ================= G4: upgrade (AICommBuildingUpgrade, config-gated) =================
section('G4 upgrade — dormancy without config, level bump with injected upg');
{
  const { sim, K } = loadKernel();
  sim.addBuilding('barracks', 1, 12, 12);
  const bar = sim.buildings.find((b) => b.defId === 'barracks');
  check('dormant: upgrade rejected without upg data', sim.commandUpgrade(bar.id, 1), false);
  check('level starts at 1', bar.level, 1);
  K.BLD.barracks.upg = { price: 100, time: 2 };
  const f0 = sim.players[0].funds;
  check('upgrade accepted with config', sim.commandUpgrade(bar.id, 1), true);
  check('cost deducted', Math.round(f0 - sim.players[0].funds), 100);
  check('upgrade progress hashed', sim.stateString().includes(',ug'), true);
  run(sim, Math.ceil(2 / TICK) + 2);
  check('level bumped to 2', bar.level, 2);
  check('upgrade state cleared', bar.upgT === undefined, true);
  check('level serialized in stateString', sim.stateString().includes(',lv2'), true);
  const { sim: s2, K: K2 } = loadKernel();
  s2.addBuilding('barracks', 1, 12, 12);
  const bar2 = s2.buildings.find((b) => b.defId === 'barracks');
  K2.BLD.barracks.upg = { price: 100, time: 2 };
  s2.commandUpgrade(bar2.id, 1);
  check('reject concurrent repair while upgrading', (K2.BLD.barracks.repairPrice = 20, bar2.hp = bar2.maxHp * 0.5, s2.commandRepair(bar2.id, 1)), false);
}

// ================= lockstep parity + determinism =================
section('lockstep routing + same-seed determinism with the new commands');
{
  const { sim, K } = loadKernel();
  check('LOCKSTEP_NET_TYPES include produceCancel/rally/repair/upgrade',
    ['produceCancel', 'rally', 'repair', 'upgrade'].every((t) => K.LOCKSTEP_NET_TYPES.has(t)), true);
  // full-cycle determinism: same seed + same command script -> identical hash
  const script = (sim, cmd) => {
    sim.addBuilding('barracks', 1, 12, 12);
    const bar = sim.buildings.find((b) => b.defId === 'barracks');
    cmd.issue({ type: 'rally', buildingId: bar.id, cells: [{ x: 20, y: 8 }], owner: 1 });
    cmd.issue({ type: 'produce', defId: 'ilight', owner: 1 });
    cmd.issue({ type: 'produce', defId: 'ilight', owner: 1 });
    cmd.issue({ type: 'produceCancel', defId: 'ilight', owner: 1 });
    sim.players[0].queue[0].t = 0.01;
    run(sim, 5);
  };
  const a = loadKernel(4242), b = loadKernel(4242);
  script(a.sim, new K.Commands ? new a.K.Commands(a.sim) : null);
  script(b.sim, new b.K.Commands(b.sim));
  check('same seed + same script -> identical hash', a.sim.hashState() === b.sim.hashState(), true);
  const c = loadKernel(4242);
  c.sim.addBuilding('barracks', 1, 12, 12);
  const barC = c.sim.buildings.find((x) => x.defId === 'barracks');
  c.sim.commandRally(barC.id, [{ x: 22, y: 9 }], 1); // different rally cell
  check('different script -> different hash', c.sim.hashState() !== a.sim.hashState(), true);
}

console.log(`\n${total - fail}/${total} checks passed`);
process.exit(fail ? 1 : 0);
