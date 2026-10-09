#!/usr/bin/env node
// Stat tier caps test — MaxStatValueProvider three-tier thresholds (FirstMax /
// BaseMax / MegaMax) ported verbatim from the native ctor literal extraction.
// Evidence: MaxStatValueProvider..ctor(ILogger) VA 0x7CC0C00..0x7CC1640 populates
// m_statInfos : Dictionary<EStat, StatInfo {FirstMax, BaseMax?, MegaMax?}> — rung
// labels per Build J factory decode (estat-stat-models.md §8); values unchanged.
// (dump.cs 6.9.18, sha256 0050e67d...); tool reverse/tools/extract_maxstat_tiers.py;
// full table reverse/evidence/estat/estat-tiers.txt; analysis
// reverse/notes/units/estat-stat-models.md sections 7-8 (CONFIRMED, literal extraction).
// The tribute port (AOW3_MAX_STAT_TIERS + maxStatCap/maxStatGet) lives inside the
// SIM KERNEL — extracted verbatim here so a shipped-code mismatch fails by
// construction.
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
  '\n;globalThis.__K = { AOW3_MAX_STAT_TIERS, maxStatCap, maxStatGet, UNITS };\n';

function loadKernel() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.console = console;
  sandbox.Math = Object.create(Math);
  vm.createContext(sandbox);
  const ctx = { filename: 'data' };
  for (const f of ['stats.js', 'weapons.js', 'units.js', 'buildings.js', 'factions.js', 'index.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'docs', 'data', f), 'utf8'), sandbox, ctx);
  vm.runInContext(kernel, sandbox, { filename: 'sim-kernel.js' });
  return sandbox.__K;
}

let fail = 0, total = 0;
const check = (name, got, want) => {
  total++;
  const ok = typeof want === 'function' ? want(got) : Object.is(got, want);
  if (!ok) { fail++; console.log(`  FAIL ${name}: got ${JSON.stringify(got).slice(0, 160)}`); }
  else console.log(`  ok   ${name}`);
};
const section = (t) => console.log(`\n== ${t} ==`);

const K = loadKernel();

// ================= 1. table integrity (native literals) =================
section('table integrity: 72 registered EStats, verbatim ctor literals');
{
  const keys = Object.keys(K.AOW3_MAX_STAT_TIERS).map(Number).sort((a, b) => a - b);
  check('72 of 78 EStats registered', keys.length, 72);
  check('unregistered keys absent (None/FireRate/MineCost/SuperWeaponCP)',
    [0, 60, 66, 70].every((k) => K.AOW3_MAX_STAT_TIERS[k] === undefined), true);
  check('Health/1 three-tier', JSON.stringify(K.AOW3_MAX_STAT_TIERS[1]), JSON.stringify([8000, 25000, 45000]));
  check('Price/2 two-tier', JSON.stringify(K.AOW3_MAX_STAT_TIERS[2]), JSON.stringify([1000, 2600, null]));
  check('Speed/6 two-tier', JSON.stringify(K.AOW3_MAX_STAT_TIERS[6]), JSON.stringify([100, 450, null]));
  check('ArmorLight/7 = ArmorMedium/8 = ArmorHeavy/9 two-tier',
    JSON.stringify(K.AOW3_MAX_STAT_TIERS[7]) === JSON.stringify([80, 530, null]) &&
    JSON.stringify(K.AOW3_MAX_STAT_TIERS[8]) === JSON.stringify([80, 530, null]) &&
    JSON.stringify(K.AOW3_MAX_STAT_TIERS[9]) === JSON.stringify([80, 530, null]), true);
  check('WeaponArmorLight/61 three-tier', JSON.stringify(K.AOW3_MAX_STAT_TIERS[61]), JSON.stringify([300, 4000, 20000]));
  check('WeaponArmorHeavy/63 three-tier', JSON.stringify(K.AOW3_MAX_STAT_TIERS[63]), JSON.stringify([300, 4000, 20000]));
  check('WeaponSuperWeaponArmorLight/72 mega 55000', JSON.stringify(K.AOW3_MAX_STAT_TIERS[72]), JSON.stringify([300, 4000, 55000]));
  check('WeaponSuperWeaponArmorHeavy/74 mega 55000', JSON.stringify(K.AOW3_MAX_STAT_TIERS[74]), JSON.stringify([300, 4000, 55000]));
  check('MinePrice/71 cap 30 (mine-cost stat cap key, estat note 6.7)',
    JSON.stringify(K.AOW3_MAX_STAT_TIERS[71]), JSON.stringify([30, null, null]));
  check('three-tier keys are exactly Health + six weapon-armor',
    Object.keys(K.AOW3_MAX_STAT_TIERS).filter((k) => K.AOW3_MAX_STAT_TIERS[k][2] !== null).sort((a, b) => a - b).join(','),
    '1,61,62,63,72,73,74');
  check('fractional literals survive (TransitionToMarchModeTime/20 = 2.2)',
    K.AOW3_MAX_STAT_TIERS[20][0], 2.2);
  check('fractional literals survive (WorkshopRepairRadius/43 = 4.5)',
    K.AOW3_MAX_STAT_TIERS[43][0], 4.5);
  check('fractional literals survive (WeaponMineTime/67 = 7.5)',
    K.AOW3_MAX_STAT_TIERS[67][0], 7.5);
}

// ================= 2. tier resolution =================
section('tier resolution: rank tier -> cap with fallback chain');
{
  check('FirstMax (lowest rung) at tier 0', K.maxStatCap(1, 0), 8000);
  check('BaseMax at tier 1', K.maxStatCap(1, 1), 25000);
  check('MegaMax at tier 2', K.maxStatCap(1, 2), 45000);
  check('MegaMax at tier 3 (ACE maps onto mega)', K.maxStatCap(1, 3), 45000);
  check('Speed/6 tier 2 falls back to BaseMax (no mega tier)', K.maxStatCap(6, 2), 450);
  check('Price/2 tier 2 falls back to BaseMax', K.maxStatCap(2, 2), 2600);
  check('single-tier stat ignores tier entirely (MinePrice/71 tier 2 = 30)', K.maxStatCap(71, 2), 30);
  check('unregistered EStat -> null (uncapped domain)', K.maxStatCap(60, 1), null);
  check('unregistered EStat -> null (WeaponMineCost/66)', K.maxStatCap(66, 0), null);
  check('unregistered EStat -> null (WeaponSuperWeaponCP/70)', K.maxStatCap(70, 2), null);
  check('unknown key -> null', K.maxStatCap(999, 1), null);
}

// ================= 3. Get() clamp semantics =================
section('maxStatGet: IMaxStatValueProvider.Get analog (dump.cs:168886)');
{
  check('below cap passes through', K.maxStatGet(5000, 1, 0), 5000);
  check('above cap clamps to FirstMax (tier-0 cap)', K.maxStatGet(99999, 1, 0), 8000);
  check('above cap clamps to BaseMax at tier 1', K.maxStatGet(99999, 1, 1), 25000);
  check('above cap clamps to MegaMax at tier 2', K.maxStatGet(99999, 1, 2), 45000);
  check('exact cap unchanged', K.maxStatGet(8000, 1, 0), 8000);
  check('weapon-armor damage clamp at base (61)', K.maxStatGet(500, 61, 0), 300);
  check('weapon-armor damage clamp at mega (61)', K.maxStatGet(50000, 61, 2), 20000);
  check('super-weapon mega domain (72)', K.maxStatGet(60000, 72, 2), 55000);
  check('unregistered passes through unchanged (60)', K.maxStatGet(1234, 60, 1), 1234);
  check('negative values pass through', K.maxStatGet(-5, 1, 0), -5);
}

// ================= 4. data sanity: tribute defs inside the cap domain ======
section('data sanity: unit health values inside native Health tier-cap domain');
{
  let worst = null;
  for (const id of Object.keys(K.UNITS)) {
    const d = K.UNITS[id];
    if (!d || d.health === undefined)
      continue;
    if (d.health > 8000 && (!worst || d.health > worst.v))
      worst = { id, v: d.health };
  }
  check('no unit def exceeds Health FirstMax 8000 (tuned scale sits in the lowest-rung domain)',
    worst, null);
}

console.log(`\n${total - fail}/${total} vectors passed`);
process.exit(fail ? 1 : 0);
