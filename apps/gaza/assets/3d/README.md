# GAZA 3D asset boundary

This folder is the controlled interchange point for production GLB/glTF assets used by the GAZA demonstrator.

## Rules

- Runtime production assets must be stored locally; do not make the public demo depend on a paid session or an external asset CDN.
- Every binary must have a source URL, license, provenance category and optimization note before it is referenced by the runtime.
- Provenance categories are `PUBLIC_REFERENCE`, `INFERRED_RECONSTRUCTION` and `SIMULATED`.
- Public photographs may guide an explicitly inferred exterior reconstruction, but must not be used to claim hidden/as-built geometry.
- Synthetic characters are fictional operational roles. They must not reconstruct or track real employees.
- Export target: GLB/glTF 2.0, baked/packed materials where practical, compressed textures, bounded triangle counts, sensible origins/scales, and LOD where repeated at distance.

## Verified candidate sources — not yet vendored

### Quaternius — Universal Base Characters
Official source: https://quaternius.com/packs/universalbasecharacters.html

Official page states humanoid rig, game-ready topology, glTF/FBX formats and CC0 use. Candidate for fictional plant personnel after local import, PPE adaptation and visual QA.

### Quaternius — Universal Animation Library
Official source: https://quaternius.com/packs/universalanimationlibrary.html

Official page states 120+ humanoid animations, GLB/FBX/Blend formats and CC0 use. Candidate for locomotion/idle/task clips after retargeting and QA.

## Promotion gate

An asset is not considered installed because it appears in this document. Promotion to runtime requires:
1. local binary committed under this folder;
2. manifest entry with source/license/provenance;
3. Blender or glTF validation;
4. Three.js load test;
5. deterministic Playwright screenshots;
6. performance check before replacing the procedural fallback.
