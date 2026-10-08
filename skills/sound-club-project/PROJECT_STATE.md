# SOUND CLUB and restaurant — Current Project State

## Checkpoint

- Checkpoint date: 2026-10-08
- Public project: **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca**
- Canonical page: `projects/sound-club-palma.html`
- Public case runtime: technical deconstruction v3.1
- Backup purpose: safe restart / immediate continuation

## Current private masters

### CAD
- Format: DWG AC1032
- Raw DWG: PRIVATE_REFERENCE_ONLY
- Public derivative: `assets/visuals/sound-club-cad-blueprint.svg`
- CAD background / crosshair / technical-depth layer is implemented.
- Real metric cursor remains blocked until vector calibration.

### SketchUp
- Current master: `CLUB_DEL_MAR_12_02_2026_3.skp`
- Selected explicitly as the current finished project source.
- SketchUp: 24.0.594
- Unit: Meter
- Size: 251,178,212 bytes
- SHA-256: `ae95307c724ec36a3887c3660f4e53e6dbe31ffa1b28701d9888c81217685665`
- Archive entries: 6,928
- Material definitions: 2,488
- V-Ray-named material families detected.
- V-Ray light/render settings are NOT yet asserted as verified.
- Raw SKP remains private and is not committed.

## Local GLB conversion — latest result

The new registered master has now been converted successfully using the memory-safe web pipeline.

- Candidate path (local only): `assets/models/sound-club/_candidate/venue-master.glb`
- QA report (local only): `assets/models/sound-club/_candidate/venue-master.qa.json`
- Candidate policy: geometry + material colours, no embedded texture images by default
- Source SHA-256: `ae95307c724ec36a3887c3660f4e53e6dbe31ffa1b28701d9888c81217685665`
- GLB SHA-256: `0fc257b69448ed23739dceada7798113cc4dcdc457ec86efd8661902b9604135`
- Candidate size: 874,502,436 bytes (~834 MiB).
- Geometry count: 191,986.
- Candidate extent: 381.688 m × 94.552 m × 245.181 m.
- Previous 500 m / 150 m sanity gate was too permissive for web delivery and has been replaced.
- Current web gate target: ≤120 m horizontal extent, ≤40 m height, ≤95 MiB, ≤20,000 geometries.
- Current classification: **SOURCE VALID / WEB NOT READY**.
- Promotion status: **NOT PROMOTED**.
- Public model status: **PENDING_GLB**.
- Next required check: run `tools/sound-club/ANALYZE_GLB_CANDIDATE.ps1` to identify largest meshes and spatial outliers.
- Next visual check: localhost candidate viewer only if the browser can handle the current 874 MB file.

The candidate directory remains gitignored. Restarting Windows does not remove these local files.

## Web / portfolio state

Current narrative:

```
CAD / EXISTING SPACE
→ SPATIAL MODEL
→ BEFORE / AFTER · RENDER DEVELOPMENT
→ DEVELOPMENT PHASES
→ SYSTEMS DECONSTRUCTION
→ AUDIO
→ LIGHTING / KNX / DALI / CONTROL
→ ACOUSTICS / STRUCTURE
→ FABRICATION / DJ BOOTH
→ BUILD / FINAL / AS-BUILT
→ DOCUMENTATION
```

Implemented:
- deep CAD background;
- CAD-style crosshair cursor;
- Three.js Spatial Explorer;
- localhost-only `?candidate=1` mode;
- DESIGN / RENDER runtime concept;
- Development Phases;
- Systems Deconstruction;
- before/after render-development block;
- registered master provenance;
- V-Ray matched-camera export placeholder.

## Render strategy

The interactive GLB and V-Ray output are intentionally separate.

### Interactive
- authoritative geometry = one verified optimized GLB;
- DESIGN = technical runtime material / edges;
- RENDER = presentation-lighting view of same geometry;
- no geometry divergence between modes.

### Photorealistic / V-Ray
- exported stills remain the photorealistic evidence layer;
- before/after must use matched camera positions;
- current 2300 K atmosphere image is an interim labelled study;
- replace with matched-camera V-Ray exports from the registered master.

## Evidence / privacy

- Raw DWG: private.
- Raw SKP: private.
- Original private photos/videos: private unless explicitly promoted.
- Candidate GLB: local / gitignored / not public.
- Public page only exposes derived or approved assets.

## Immediate continuation after reboot

From PowerShell:

```powershell
cd "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
git pull origin main
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```

Check local candidate:

```powershell
Get-Item ".\assets\models\sound-club\_candidate\venue-master.glb" |
  Select-Object Length, LastWriteTime

Get-Content ".\assets\models\sound-club\_candidate\venue-master.qa.json" -Raw
```

Start local viewer:

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000/projects/sound-club-palma.html?candidate=1
```

## Next decision gates

1. Run `ANALYZE_GLB_CANDIDATE.ps1`.
2. Inspect `venue-master.analysis.json` and `venue-master.top-geometry.csv`.
3. Identify terrain/geolocation/site-context/remote geometry before deletion.
4. Build a cleaned venue-only candidate.
5. Reduce geometry count and file size below the public web gate.
6. Verify DWG/SKP alignment.
7. Export matched-camera V-Ray stills.
8. Only then run `-Promote`.
9. Add verified zone hotspots.
10. Continue refining the architect / engineer / designer-facing project dossier.
