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

Default public-web promotion limits:
- horizontal X/Z extent: 120 m;
- vertical Y extent: 40 m;
- maximum GLB size: 95 MiB;
- maximum geometry count: 20,000.

These are **web-delivery gates**, not claims about the physical venue envelope. Exceeding them blocks promotion and indicates that the candidate still needs spatial cleanup, merging, instancing, simplification or other optimization.

## Candidate geometry analysis

Run:

```powershell
.\tools\sound-club\ANALYZE_GLB_CANDIDATE.ps1
```

This creates two local/gitignored files:
- `venue-master.analysis.json`
- `venue-master.top-geometry.csv`

The analyzer now runs in **GLB JSON-only low-memory mode**: it reads the GLB JSON chunk, node transforms and accessor min/max bounds without loading binary vertex buffers. This is specifically intended for very large candidates such as the current ~874 MiB Sound Club model. The report identifies the largest node/mesh instances and densest X/Z spatial cells so terrain, remote objects, site context and other outliers can be identified before destructive cleanup. It also ranks node instances by referenced buffer bytes and reports vertex/index/triangle counts, so optimization can target the heaviest geometry first without loading binary buffers. The analyzer exposes three independent hierarchy views: semantic family, top-level SketchUp group and leaf family. Classifier v3 also self-tests the mesh-prefix, generic-group and `Component_*` parsing rules before reading the large GLB, preventing silent regressions such as `MESH_####_ROOT` or truncated `COMPO/COMPON` buckets. Non-destructive actions such as KEEP, INSTANCE, PROXY or REMOVE_WEB_DECOR apply only to the derived web GLB and never modify the private SketchUp master.


## Non-destructive web optimization plan

After `ANALYZE_GLB_CANDIDATE.ps1` succeeds, generate a dry-run optimization plan:

```powershell
.\tools\sound-club\BUILD_WEB_OPTIMIZATION_PLAN.ps1
```

Outputs:
- `assets/models/sound-club/_candidate/venue-master.optimization-plan.json`
- `assets/models/sound-club/_candidate/venue-master.optimization-plan.csv`

The planner does **not** modify the SKP master or the current candidate GLB. It classifies top-level groups into actions such as:
- `KEEP_MERGE_ARCHITECTURE`
- `KEEP_SIMPLIFY_ACOUSTIC`
- `INSTANCE_SIMPLIFY_HARDWARE`
- `INSTANCE_PROXY_LIGHTING`
- `PROXY_OR_REMOVE_DECOR`
- `REVIEW_MANUALLY`

Any actual geometry mutation must occur later in a separate derived file (planned name: `venue-web-v1.glb`). Never overwrite `venue-master.glb` during optimization experiments.


## Streaming web derivative — safe trim stage

Once the dry-run optimization plan exists, estimate a first safe reduction without loading full vertex buffers into RAM:

```powershell
.\tools\sound-club\PREPARE_WEB_DERIVATIVE.ps1
```

Default mode is **DRY-RUN**. It does not write a GLB. It reads the existing GLB JSON, the optimization plan, and unique referenced `bufferView` ranges to estimate the size retained after dropping only high-confidence groups.

Current automatic drop set is intentionally narrow:
- `PROXY_OR_REMOVE_DECOR`
- `REMOVE_OR_PROXY_MINOR_HARDWARE`
- `REMOVE_WEB_DECOR`

Architecture, acoustics, lighting-system geometry, DJ geometry, furniture proxies and all manual-review groups remain untouched in this stage.

If the dry-run projection is acceptable, build a separate derivative:

```powershell
.\tools\sound-club\PREPARE_WEB_DERIVATIVE.ps1 -Build
```

Output:
- `assets/models/sound-club/_candidate/venue-web-v1.glb`
- `assets/models/sound-club/_candidate/venue-web-v1.trim-report.json`

The script repacks only referenced binary ranges by streaming them from the source GLB. It never overwrites `venue-master.glb` and never modifies the private SKP.


## Exact buffer ownership + scenario analysis

The safe-delete dry-run only removes a small number of high-confidence groups. Before building any derivative, calculate **exclusive vs shared BIN bytes** by top-level group:

```powershell
.\tools\sound-club\ANALYZE_WEB_SCENARIOS.ps1
```

Output:
- `assets/models/sound-club/_candidate/venue-master.buffer-ownership.json`

This analysis is JSON-only / low-memory and does not modify either GLB.

It reports:
- exact unique buffer bytes referenced by each top-level group;
- bytes exclusive to one group;
- bytes shared with other groups;
- three non-mutating scenarios:
  - `safeDeleteOnly`;
  - `replaceProxyAndInstanceCandidates`;
  - `replaceProxyInstanceAndSimplifiableArchitectureAcoustics`.

Scenario reductions represent **payload that could be removed before replacement**. They are not final GLB sizes and do not include the future proxy/instance payload.
