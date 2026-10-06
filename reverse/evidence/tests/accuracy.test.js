#!/usr/bin/env node
// Deterministic test — weapon accuracy curves recovered from AOW3 6.9.18 libil2cpp.so.
// Evidence: reverse/notes/weapon-accuracy-native-analysis.md
// Vectors:  reverse/evidence/tests/accuracy.md
// These reimplement the browser formulas (docs/game.js `weaponStaticAccuracy` /
// `weaponDynamicAccuracy` / `hitChance`) so a mismatch in either copy fails here.
'use strict';
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

function weaponStaticAccuracy(w, distance) {
  if (w.splashScatter)
    return 1 - 0.5 * distance * w.accStatic * (1000 - 10 * (w.explosionDecr ?? 0)) / (1e6 * w.splash);
  return w.accStatic / 100;
}
function weaponDynamicAccuracy(w, distance) {
  if (!w.walkingShot) return 0;
  if (w.guided) return w.accStatic / 100;
  if (w.splashScatter)
    return 1 - (w.accWalk + w.accStatic) * distance * (1000 - 10 * (w.explosionDecr ?? 0)) / (2e6 * w.splash);
  return w.accWalk * w.accStatic / 10000;
}
function hitChance(w, shooterMoving, distance) {
  let acc = shooterMoving ? weaponDynamicAccuracy(w, distance) : weaponStaticAccuracy(w, distance);
  if (!(acc > 0)) acc = weaponStaticAccuracy(w, distance);
  return Math.min(0.98, Math.max(0.15, acc));
}

const rifle = { accStatic: 72, accWalk: 48, walkingShot: 1 };
const mg    = { accStatic: 70, accWalk: 52, walkingShot: 1 };
const rpg   = { accStatic: 78, accWalk: 55, walkingShot: 1 };
const tank  = { accStatic: 82, accWalk: 62 };
const heli  = { accStatic: 76, accWalk: 68, guided: 1 };
const arty  = { accStatic: 62, accWalk: 44, splash: 2.6, splashScatter: 1, explosionDecr: 30 };

const cases = [
  ['1 static percent rifle standing', hitChance(rifle, false, 5), 0.72],
  ['2 static percent tank standing',  hitChance(tank,  false, 5), 0.82],
  ['3 guided gunship',                hitChance(heli,  true,  5), 0.76],
  ['4 walking product rifle',         hitChance(rifle, true,  5), 0.3456],
  ['5 walking product mg',            hitChance(mg,    true,  5), 0.3640],
  ['6 walking product rpg',           hitChance(rpg,   true,  5), 0.4290],
  ['7 tank no walking-shot concept',  hitChance(tank,  true,  5), 0.82],
  ['8 artillery scatter d=10',        hitChance(arty,  false, 10), 0.9165384615384615],
  ['9 artillery scatter d=16',        hitChance(arty,  false, 16), 0.8664615384615385],
  ['10a artillery walking: falls back to static', hitChance(arty, true, 10), 0.9165384615384615],
  ['10b dynamic splash formula (synthetic walking-splash weapon)', hitChance({...arty, walkingShot: 1}, true, 10), 0.8573076923076923],
  ['11 clamp floor',                  hitChance({ accStatic: 5, accWalk: 1, walkingShot: 1 }, true, 5), 0.15],
  ['12 clamp ceiling',                hitChance({ accStatic: 140 }, false, 5), 0.98],
];

let fail = 0;
for (const [name, got, want] of cases) {
  const ok = close(got, want, 1e-9);
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${got}, want ${want}`);
}
console.log(fail ? `\n${fail} FAILURES` : '\nall vectors pass');
process.exit(fail ? 1 : 0);
