# Asset extraction pipeline (APK -> playable GLB models)

1. `extract_v3.py` — unpacks every Unity bundle from the XAPK (base APK
   `assets/bin/Data` + split asset-pack APKs) and exports:
   - Texture2D -> PNG (1920)
   - Sprite -> PNG w/ cross-bundle atlas resolution (3816)
   - Mesh -> npz (multi-stream Unity 2022 vertex layout, 16-byte stream
     alignment, rigid ch13 bone-index + weighted ch12/ch13 skin data) (1045)
   - per-bundle scene-graph JSON (GameObject/Transform/Renderer links) (5507)
2. `assemble_glb.py` — resolves prefab -> dep bundles (mesh/material/texture),
   walks the Transform hierarchy, bakes bind-pose skinning
   (`skin = bindPose` for rigid ch13 / weighted ch12 blend), converts
   Unity(left-handed) -> glTF(right-handed) via 180deg-Y conjugation, embeds
   PNG textures, writes GLB (27 models: both factions' infantry, vehicles,
   helicopters + HQ/barracks/factories/etc).

Run with `python3.13` + UnityPy 1.25 + numpy.
