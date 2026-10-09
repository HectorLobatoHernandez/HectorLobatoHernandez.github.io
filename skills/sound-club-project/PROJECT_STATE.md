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
- Detailed low-memory analysis: 53,670,334 vertices / 31,137,869 triangles / 191,986 mesh instances.
- Confirmed specific heavy families include vegetation, decorative fruit basket assets, woven bamboo lamps, repeated 2D acoustic diffuser plates, threaded rods and drill-press clamp/bolt detail.
- Classifier v3 now completes successfully with syntax preflight and parser self-tests. Reliable top-level groups include `TECHO_ENTERO`, `CORTINAS`, sofa furniture, threaded rods, woven bamboo lamps, `DRILL_PRESS_CLAMP`, `MESA_ACSUTICA_2`, vegetation, `TECHNICS_SL-1200_MK_2` and `FOCOS`.
- Some semantic/leaf buckets remain generic (`COMPONEN`, `COMPO`, `COMPON`); they are ignored for automatic optimization decisions. The dry-run web plan is based on high-confidence top-level groups and explicit family rules.
- Optimization policy: preserve private SKP master; optimize only a derived web GLB using KEEP / INSTANCE / PROXY / REMOVE_WEB_DECOR decisions.
- Promotion status: **NOT PROMOTED**.
- Public model status: **PENDING_GLB**.
- Optimization plan generated locally: `venue-master.optimization-plan.json` + CSV.
- Safe streaming trim dry-run completed: 169 nodes removable, estimated BIN reduction 8.22%, leaving ~688.5 MB BIN and 191,817 meshes. This is far from the web target, so `-Build` remains blocked.
- Exact buffer-ownership scenarios completed: safe delete = 8.22% BIN reduction; proxy/instance candidates = 44.77%; proxy/instance + simplifiable architecture/acoustics = 90.79%, leaving ~65.88 MiB BIN before replacement payload.
- The source file still has ~118.5 MiB of JSON/header overhead because of 191,986 nodes/meshes, so node/mesh fragmentation must also be reduced.
- Exact byte-identical dedupe completed: 973 duplicate pairs, only ~0.566 MiB recoverable (~0.079% BIN), therefore exact dedupe is not a meaningful optimization path.
- Translation-equivalent analysis completed: 12,727 equivalence sets, 32,703 duplicate mesh definitions beyond representatives, ~47.33 MiB recoverable BIN, ~6.62% BIN reduction and ~17.03% mesh-definition reduction (estimated 159,283 mesh definitions after reuse).
- Translation reuse alone is helpful but still insufficient for the web target. The diagnostic phase is now considered complete enough to proceed.
- **V1 BUILD COMPLETED LOCALLY:** `venue-web-v1.glb` and `venue-web-v1.build-report.json` exist. Re-running `BUILD_WEB_V1.ps1` is now idempotent: it reports the existing V1 status instead of treating the protected existing output as an error.
- V1 measured locally: 715.61 MiB, 609.48 MiB BIN, 191,817 nodes and 159,114 meshes; 14.19% file reduction and 17.12% mesh-definition reduction from the master-derived candidate.
- **CURRENT PRODUCTION STEP:** `tools/sound-club/BUILD_WEB_V2.ps1` builds `venue-web-v2.glb` from V1. It replaces only classified heavy P1 groups with clustered world-space technical proxies while preserving all unclassified geometry, then measures the ≤95 MiB / ≤20,000 mesh / venue-bounds gate.
- V2 built successfully: 76.03 MiB total, 63.73 MiB BIN, 21,063 nodes, 17,636 meshes and 881 proxy nodes. Size and mesh-count gates pass.
- V2 still fails only the world-bounds gate: 381.69 × 94.55 × 245.18 m. This indicates retained remote/site-context geometry, not a payload problem.
- V2 bounds analysis confirmed two independent context problems: remote small mesh clusters hundreds of metres from the venue plus very large `ROOT` meshes crossing the dense venue core and remote context. Large `ROOT` meshes therefore cannot be removed wholesale.
- **V3 BUILD COMPLETED LOCALLY:** `venue-web-v3.glb` passes all numeric gates: 69.62 MiB, 15,465 meshes, 18,757 nodes and 64.08 × 13.09 × 45.53 m extent. Seven partial meshes were triangle-cropped; 3,376 triangles were retained and 1,519 removed. Public promotion remains blocked.
- **CURRENT STEP:** visual QA. `tools/sound-club/START_V3_VISUAL_QA.ps1` verifies the V3 SHA/report, starts/reuses localhost:8000 and opens `projects/sound-club-palma.html?candidate=v3`. The React Spatial Explorer now routes local V3 explicitly and shows a V3 QA checklist.
- If V3 visually matches the private SketchUp master for venue envelope, architecture, acoustics, DJ, lighting, suspended structure, scale and clipping, then connect V3 as the approved interactive geometry candidate and continue to verified zones + matched-camera V-Ray stills.
- Visual QA against the private SketchUp master remains mandatory before any public promotion.
- Next visual check: localhost V3 viewer (`?candidate=v3`); do not load the 874 MB master unless a source-level comparison is specifically required.

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
http://localhost:8000/projects/sound-club-palma.html?candidate=v3
```

## Next decision gates

1. Run V3 visual QA locally with `START_V3_VISUAL_QA.ps1`.
2. Compare venue envelope, principal architecture, acoustics, DJ, lighting/suspended structure, scale and clipping against the private SketchUp master.
3. If QA passes, register V3 as the approved interactive geometry candidate and connect verified zone/system views.
4. Verify DWG/SKP alignment.
5. Export matched-camera V-Ray stills for BEFORE/AFTER render evidence.
6. Only after visual + origin QA, run the public promotion gate.
7. Continue the architect / engineer / designer-facing dossier.


## Render molds / image-first decomposition (2026-10-09)

Visual QA showed that the 69.62 MiB V3 GLB is still too slow for primary storytelling and does not reproduce the supplied glazing/transparency or lighting quality well enough. The project presentation therefore changes priority:

- **Primary visual layer:** lightweight render molds built from user-supplied finished renders.
- **Technical 3D:** V3 remains available, but is now **manual-load only** for geometry/orbit/scale QA.
- New mold chapters: whole venue, interior DJ booth, lighting, glazing/envelope, restaurant/lounge, terrace/exterior.
- Each mold exposes staged states (base → integration → systems → result) and a before/after comparison.
- Supplied renders are classified as render/reference evidence, **not verified as-built photography**.
- Expected optimized assets live under `assets/visuals/sound-club-renders/`.
- Asset manifest: `xxxia-studio/projects/sound-club-palma/05_metadata/render-molds.json`.
- Installer: `tools/sound-club/INSTALL_RENDER_MOLDS.ps1`.

Current priority: install the optimized render asset pack locally, review the molds, then refine each mold with more specific before/construction/final frames. Do not spend more time making the browser GLB imitate V-Ray.
