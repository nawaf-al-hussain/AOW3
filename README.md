# Art of War 3 — Browser Tribute & RE Archive

Private research / fan project around **Art of War 3: Global Conflict** (Gear Games, `com.geargames.aow`, v6.9.18).

Two things live in this repo:

1. **`game/` — a browser-native 3D skirmish tribute.** Real-time RTS you can open in any
   browser: produce units, capture depots, fight AI waves, destroy the enemy HQ.
   - Combat math (damage-vs-armor curve, weapon counter-triads, hit chances, EStat
     economy schema) was **reverse-engineered from the game binary** (see `reverse/`).
   - The battlefield is dressed with **the game's own extracted art**: desert terrain
     decals, HQ building sprite, faction emblems, production card art.
   - Units are procedural low-poly 3D models styled after the genuine card art
     (infantry squads, MBT, heavy tank, rocket artillery, gunship).
2. **`reverse/` + `assets/` — the RE evidence & extracted assets** used to build it.

## Run the game

```bash
cd game
python3 -m http.server 8000     # or: npx serve .
# open http://localhost:8000
```

Controls: drag = select · right-click / long-press = move-attack-capture ·
double-tap = select all of type · WASD / edge-drag = pan · wheel / pinch = zoom ·
minimap click = jump view. Destroy the enemy HQ to win.

## Repo layout

```
Art-of-War-3_6.9.18_apkcombo.com.xapk   original XAPK (Git LFS)
reverse/
  dump.cs.zip                           full IL2CPP C# dump (63.9 MB raw)
  stringliteral.json.zip                all string literals + addresses
  notes/combat-stats.md                 recovered damage/armor model & stat schema
  README.md                             how to regenerate script.json/DummyDll
assets/
  aow3-extracted-assets.zip             textures / UI sprites / audio / text assets
                                        extracted with UnityPy (+ catalog.json)
game/
  index.html, game.js, assets/          the playable browser tribute (static, no build step)
```

## How the tribute was built (pipeline)

```
XAPK → unzip → libil2cpp.so + global-metadata.dat
     → Il2CppDumper v6.7.46 (metadata v31) → dump.cs (63.9 MB) → combat formulas
     → constants ported to TypeScript (see reverse/notes/combat-stats.md)
XAPK → UnityPy → terrain decals, HQ sprite, unit cards, emblems, audio
     → Three.js battlefield (steep ~65° camera, desert biome, fog of war)
     → deterministic 20 Hz sim: pathfinding, capture points, economy, AI waves
```

Not included by design: multiplayer (PvP/clans/chat run on Gear Games' servers),
and exact live balance numbers (delivered by their backend, not in the APK).

## Legal

Private, non-commercial fan project for study. **Art of War 3, its assets and art
are © Gear Games.** Support the original on Google Play / App Store. Do not
redistribute the extracted assets publicly.
