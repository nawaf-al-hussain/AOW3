# Asset extraction pipeline (APK -> playable GLB models)

1. `extract_v3.py` — unpacks every Unity bundle from the XAPK (base APK
   `assets/bin/Data` + split asset-pack APKs) and exports:
   - Texture2D -> PNG (1920)
   - Sprite -> PNG w/ cross-bundle atlas resolution (3816)
   - Mesh -> npz (multi-stream Unity 2022 vertex layout, 16-byte stream
     alignment, rigid ch13 bone-index + weighted ch12/ch13 skin data) (1045)
   - per-bundle scene-graph JSON (GameObject/Transform/Renderer links) (5507)
2. `assemble_glb.py` — v1 assembler: prefab -> static bind-pose GLB
   (kept for reference).
3. `assemble_v2.py` — v2 assembler (current):
   - **Skeletal units**: exports the full Transform hierarchy as glTF nodes,
     SkinnedMeshRenderers as skins (JOINTS_0/WEIGHTS_0 +
     `IBM = conv(W_bone^-1 @ W_SMH @ bindPose)`, bindPose=identity when the
     rig ships without m_BindPose), and converts the game's real
     **AnimationClips** (idle1/move/move_shoot/w1_round/w2_round/die_bullet/
     rotate_cw...) to glTF animations (quaternion B-conjugation, per-channel
     samplers, sign continuity). Vehicles get tower/muzzle channels stripped
     so gameplay turret-aim owns the bone; helicopters get wing channels
     stripped (rotor spun procedurally).
   - **Decorations**: walks `decorations_jungle`/`decorations_desert` groups,
     exports ~130 tree/palm/bush/rock/grass props as GLBs with per-prop
     UV-region atlas crops (256px), world-orientation baked into the root,
     + `decor/index.json` manifest.
   Output: `docs/assets/models/*.glb` (26 units + HQ/buildings) and
   `docs/assets/models/decor/` (130 props).

Run with `python3.13` + UnityPy 1.25 + numpy.
