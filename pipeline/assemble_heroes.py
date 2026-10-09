#!/usr/bin/env python3.13
"""AOW3 hero GLB assembler — commits the Task-16 ad-hoc hero pass (the
Task-45/49 pipeline flag: "commit a hero assembly script"). Assembles the
three hero templates missing from ROSTER through the exact assemble_v2 unit
path: same GLB2 writer, same CLIP_PRIORITY clip filter, same V-down UV
convention, same Task-53 empty-skins fold-in in save2.

  f1_hero_cerber    bundle 2bc937c0374516e4 (clips move/w1_round/die_*)
  f1_hero_seraphim  bundle 75eeec1c949ff5d4 (clips rotate_cw/w1/w2_round)
  f1_bld_hero       bundle 50dddfac84029684 (Hero Building producer)

Prefixes verified by scripts/hunt2.py (Material/GameObject name hunt over
all 5,515 bundles_all files): the prefab GameObjects and their materials
(hero_cerber / hero_seraphim / bld_hero) live in these bundles. The _meta
companion bundles hold unit stat sheets — not needed for GLB assembly.

Run:    python3.13 pipeline/assemble_heroes.py [name ...]
Output: $OUT/<name>.glb (same OUT as assemble_v2.py units).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import assemble_v2  # noqa: E402  (imports wire A.OUT + err log)

HERO_ROSTER = {
    "f1_hero_cerber":   "2bc937c0374516e4",
    "f1_hero_seraphim": "75eeec1c949ff5d4",
    "f1_bld_hero":      "50dddfac84029684",
}

if __name__ == "__main__":
    only = set(sys.argv[1:]) or None
    for name, prefix in HERO_ROSTER.items():
        if only and name not in only:
            continue
        print(assemble_v2.assemble_v2(name, prefix), flush=True)
