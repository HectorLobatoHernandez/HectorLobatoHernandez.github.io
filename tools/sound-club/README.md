# SOUND CLUB · private SKP → web GLB

This tool converts the private SketchUp master locally. The raw `.skp` is never copied into the public repository.

## Candidate conversion

The default web candidate exports **geometry + material colours without embedded texture images**. This is deliberate: the interactive GLB stays lightweight while V-Ray/material-lighting appearance remains in the matched-camera render pipeline.

```powershell
.\tools\sound-club\CONVERT_SKP_TO_GLB.ps1 -SkpPath "C:\path\to\master.skp"
```

For diagnostics only on smaller models:

```powershell
.\tools\sound-club\CONVERT_SKP_TO_GLB.ps1 -SkpPath "C:\path\to\master.skp" -WithTextures
```

If a textured export exhausts memory, the Python exporter retries automatically without embedded textures.

Output:
- `assets/models/sound-club/_candidate/venue-master.glb`
- `assets/models/sound-club/_candidate/venue-master.qa.json`

The candidate is **not** automatically treated as verified geometry.

## Explicit promotion after visual + origin QA

```powershell
.\tools\sound-club\CONVERT_SKP_TO_GLB.ps1 -SkpPath "C:\path\to\master.skp" -Promote
```

Promotion:
- copies the candidate to `assets/models/sound-club/venue-master.glb`;
- records SHA-256 and file size;
- changes the architecture master to `APPROVED / VERIFIED_GEOMETRY`;
- makes DESIGN and RENDER use the same GLB.

## Runtime contract

One verified GLB is authoritative.

- **DESIGN**: Three.js applies neutral technical materials + edge overlay.
- **RENDER**: Three.js uses the verified GLB geometry with presentation lighting; photorealistic V-Ray appearance is shown through matched-camera render stills.
- Camera, transforms and geometry are identical in both modes.

Blender remains optional for later material authoring/baking. It must not change authoritative geometry.

## OpenSKP

Pinned conversion engine: `openskp==1.3.0`.

OpenSKP reads modern SketchUp VFF files and exports GLB. The exporter uses glTF Y-up and numeric millimetres. Textures are **not embedded by default** in this project pipeline. V-Ray/material appearance belongs to the matched-camera render pipeline; GLB is the interactive geometry source.


## Local candidate inspection

Before promotion, serve the repository locally:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/projects/sound-club-palma.html?candidate=1
```

Candidate mode is intentionally restricted to localhost / 127.0.0.1. It loads:

```text
assets/models/sound-club/_candidate/venue-master.glb
```

and marks it **LOCAL CANDIDATE · NOT VERIFIED**. GitHub Pages never activates this mode.

## Geometry bounds gate

A syntactically valid GLB is not necessarily a valid venue model.

The converter records:
- world bounds;
- X/Y/Z extent in millimetres;
- X/Y/Z extent in metres;
- a venue-bounds plausibility gate.

Default promotion limits:
- horizontal X/Z extent: 500 m;
- vertical Y extent: 150 m.

Exceeding these values blocks promotion and normally indicates terrain, geolocation, remote components or stray geometry that must be isolated before public use.
