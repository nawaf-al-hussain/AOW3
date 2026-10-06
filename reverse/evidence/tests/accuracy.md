# Deterministic test vectors — weapon accuracy (6.9.18)

Evidence: `reverse/notes/weapon-accuracy-native-analysis.md`.
Run: `node reverse/evidence/tests/accuracy.test.js` (recomputes every vector from the
recovered constants and asserts equality).

| # | Case | Inputs | Expected (fraction) |
|---|------|--------|---------------------|
| 1 | static percent | rifle standing (acc 72) | 0.72 |
| 2 | static percent | tank standing (acc 82) | 0.82 |
| 3 | guided | gunship (acc 76, guided) | 0.76 |
| 4 | walking product | rifle walking (accW 48, accS 72) | 0.3456 |
| 5 | walking product | mg walking (accW 52, accS 70) | 0.3640 |
| 6 | walking product | rpg walking (accW 55, accS 78) | 0.4290 |
| 7 | no walking concept | tank "walking" (walkingShot=0) | 0 → falls back to 0.82 |
| 8 | artillery scatter d=10 | acc 62, decr 30, R 2.6 | 0.91653846… |
| 9 | artillery scatter d=16 | acc 62, decr 30, R 2.6 | 0.86646153… |
| 10 | artillery walking d=10 | accW 44 + accS 62 | 0.85730769… |
| 11 | clamp floor | weapon yielding acc < 0.15 | 0.15 |
| 12 | clamp ceiling | weapon yielding acc > 0.98 | 0.98 |

Derivations:

```
#4  48*72/10000                       = 0.3456
#8  1 - 0.5*10*62*(1000-300)/(1e6*2.6) = 1 - 217000/2600000 = 0.91653846…
#9  1 - 0.5*16*62*700/(1e6*2.6)        = 1 - 347200/2600000 = 0.86646153…
#10 1 - 106*10*700/(2e6*2.6)           = 1 - 742000/5200000 = 0.85730769…
```

Vector #8/#9/#10 depend on the browser's `explosionDecr: 30` approximation (server
balance value unrecovered); the formula shape itself is CONFIRMED.
