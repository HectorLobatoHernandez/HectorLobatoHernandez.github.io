# SOUND CLUB — Resume after restart

This file is the restart checkpoint for the current **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca** work.

## Current status

- Private SketchUp master: `CLUB_DEL_MAR_12_02_2026_3.skp`
- Master SHA-256: `ae95307c724ec36a3887c3660f4e53e6dbe31ffa1b28701d9888c81217685665`
- Master remains private and unchanged.
- Local source candidate: `assets/models/sound-club/_candidate/venue-master.glb`
- Candidate SHA-256: `0fc257b69448ed23739dceada7798113cc4dcdc457ec86efd8661902b9604135`
- Candidate size: 874,502,436 bytes; 191,986 nodes/meshes.
- Public promotion: **NOT performed**.
- Candidate remains local / gitignored.

## Diagnostics completed

The diagnostic phase is sufficiently complete. Do not restart the analysis chain unless a build validation exposes a specific problem.

- Low-memory structure analysis complete.
- Optimization plan complete.
- Safe trim dry-run: ~8.22% BIN reduction only.
- Ownership scenarios:
  - safe delete: ~8.22%;
  - proxy/instance candidates: ~44.77%;
  - proxy/instance + controlled architecture/acoustic simplification: ~90.79% BIN reduction before replacement payload.
- Exact byte-identical mesh dedupe: negligible (~0.566 MiB / 0.079% BIN).
- Translation-equivalent mesh analysis:
  - 12,727 equivalence sets;
  - 32,703 duplicate mesh definitions beyond representatives;
  - ~47.33 MiB potential BIN recovery;
  - ~6.62% BIN reduction;
  - ~17.03% mesh-definition reduction;
  - estimated ~159,283 mesh definitions after reuse.

## Decision

**We are moving to production, not another diagnostic pass.**

Next artifact:

```text
assets/models/sound-club/_candidate/venue-web-v1.glb
```

It must be a separate derivative. Never overwrite `venue-master.glb`.

Optimization order:

1. safe removal of decorative vegetation / minor imported hardware;
2. translation-equivalent mesh reuse where transform recovery is verified;
3. proxy / instancing / controlled simplification of the heavy P1 groups:
   - `TECHO_ENTERO`;
   - `CORTINAS`;
   - sofa furniture;
   - threaded rods;
   - woven/bamboo luminaires and other repeated lighting fixtures;
4. validate size, geometry count, world bounds and visual fidelity;
5. connect the approved optimized derivative to the Spatial Explorer;
6. export matched-camera V-Ray BEFORE/AFTER stills.

Web gate remains:

- ≤95 MiB hard;
- preferably 25–50 MiB;
- ≤20,000 geometries;
- horizontal X/Z ≤120 m;
- vertical Y ≤40 m.

## Resume commands after Windows restart

```powershell
cd "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"

git pull origin main

git log -1 --oneline

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Get-Item ".\assets\models\sound-club\_candidate\venue-master.glb" |
  Select-Object Length, LastWriteTime
```

Do **not** run `CONVERT_SKP_TO_GLB.ps1` again and do **not** use `-Promote`.

After restart, continue directly with the **venue-web-v1 derivative build**:

```powershell
.\tools\sound-club\BUILD_WEB_V1.ps1
```

Wait for the final JSON summary and keep `venue-web-v1.build-report.json`. Do not run `-Promote`.
