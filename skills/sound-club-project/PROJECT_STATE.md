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
- Size result: exceeds 95 MiB; optimization required before public commit
- Promotion status: **NOT PROMOTED**
- Public model status: **PENDING_GLB**
- Next required check: read QA report for geometry count, bounds and extents.
- Next required visual check: localhost candidate viewer.

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

1. Inspect `venue-master.qa.json`.
2. Confirm geometry count and X/Y/Z extents.
3. Inspect the candidate visually in Three.js.
4. Determine whether terrain/geolocation/remote geometry must be removed.
5. Optimize candidate below public delivery target.
6. Verify DWG/SKP alignment.
7. Export matched-camera V-Ray stills.
8. Only then run `-Promote`.
9. Add verified zone hotspots.
10. Continue refining the architect / engineer / designer-facing project dossier.
