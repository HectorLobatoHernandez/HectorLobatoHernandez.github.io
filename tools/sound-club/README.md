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


## Lossless exact-mesh duplicate analysis

Before replacing geometry with proxies, test whether the GLB contains byte-identical duplicated meshes that can share one representative geometry without visual loss:

```powershell
.\tools\sound-club\ANALYZE_EXACT_MESH_DUPLICATES.ps1
```

Output:
- `assets/models/sound-club/_candidate/venue-master.exact-dedupe.json`

The analyzer:
- hashes every GLB `bufferView` by streaming from disk;
- fingerprints each mesh from accessor content, primitive structure and material content;
- groups only exact duplicate meshes;
- estimates duplicate BIN bytes that could be recovered by standard glTF mesh reuse;
- does not write or mutate any GLB.

This is a **lossless-analysis stage only**. If exact duplicates are substantial, a later build step may remap duplicate nodes to one representative mesh and repack unused accessors/bufferViews. If duplicates are small, optimization proceeds through proxies, instancing and controlled simplification.


## Translation-equivalent mesh analysis

Exact byte-for-byte deduplication recovered only a negligible amount of payload, so the next lossless-oriented test checks whether repeated SketchUp components were exported as the same mesh shape with positions baked at different translations.

Run:

```powershell
.\tools\sound-club\ANALYZE_TRANSLATION_INSTANCES.ps1
```

Output:
- `assets/models/sound-club/_candidate/venue-master.translation-instances.json`

The analyzer:
- first groups meshes by topology/accessor layout/material and metric extents;
- then hashes POSITION data after subtracting the first vertex, using a strict 0.001 mm tolerance;
- requires indices, non-position attributes and material content to match;
- reports translation-equivalent sets, potential mesh-definition reduction and recoverable BIN payload;
- does not modify either GLB.

This is intended to detect repeated components that OpenSKP exported with transforms baked into vertex positions. A future build step may reuse one representative mesh and move nodes by the measured translation, but no remapping is authorized until this analysis is reviewed.


## Production build: venue-web-v1

The diagnostic phase is closed. Build the first real optimized derivative with:

```powershell
.\tools\sound-club\BUILD_WEB_V1.ps1
```

This production step:

- verifies the protected source SHA-256 before doing anything;
- never overwrites `venue-master.glb`;
- removes only groups already classified as safe decor/minor-hardware drops;
- recomputes translation-equivalent mesh reuse at 0.001 mm tolerance;
- only reuses a representative mesh when every primitive shares one consistent translation;
- applies that translation to the node matrix so world placement is preserved;
- repacks only retained accessors/bufferViews by streaming from disk;
- writes a separate local `venue-web-v1.glb`;
- validates the written GLB and records source/derived bounds, size, mesh counts and SHA-256.

Outputs:

- `assets/models/sound-club/_candidate/venue-web-v1.glb`
- `assets/models/sound-club/_candidate/venue-web-v1.build-report.json`

This is an **intermediate production derivative**, not a public model. It is expected to remain above the final web gate. The following stage will apply controlled P1 merge/proxy/simplification to architecture, acoustic treatments, furniture, threaded hardware and repeated lighting.

Do not run `-Promote` after this build.


### Re-running BUILD_WEB_V1.ps1

The wrapper is idempotent. If `venue-web-v1.glb` and its build report already exist, running:

```powershell
.\tools\sound-club\BUILD_WEB_V1.ps1
```

does **not** rebuild or overwrite the derivative. It prints the existing V1 size, node/mesh counts, reduction percentages and web-gate status, then exits successfully.

Use `-Force` only when intentionally replacing the existing V1 after its report has been reviewed.


## Production build: venue-web-v2

After V1 is complete, build the controlled P1 proxy derivative:

```powershell
.\tools\sound-club\BUILD_WEB_V2.ps1
```

V2 reads `venue-web-v1.glb`, verifies it against `venue-web-v1.build-report.json`, and writes a separate:

- `assets/models/sound-club/_candidate/venue-web-v2.glb`
- `assets/models/sound-club/_candidate/venue-web-v2.build-report.json`

V2 replaces only groups already classified for controlled merge/proxy/simplification:

- ceiling / architecture merge candidates;
- acoustic curtains and acoustic fabrication groups;
- furniture proxy candidates;
- repeated threaded hardware;
- repeated lighting / rail fixtures;
- DJ equipment already classified for proxy use.

The replacement is a technical spatial proxy, not a claim of fabrication-level geometry. Each source mesh node contributes its world-space AABB; boxes are clustered by group/category in an adaptive metric grid and represented by a shared unit-cube mesh. All unclassified geometry remains untouched.

The adaptive clustering targets at most 6,000 proxy nodes. V2 then repacks only retained source bufferViews plus one reusable proxy cube. The report records source-node replacement counts, proxy counts, file/BIN/mesh/node reductions, world bounds and the web gate.

Even if V2 meets the ≤95 MiB / ≤20,000-mesh gate, public promotion remains blocked until visual QA against the private SketchUp master.


## V2 bounds isolation

V2 now meets the hard web payload and mesh-count gates but still carries remote/site-context geometry that keeps the world bounds far beyond the venue envelope.

Run:

```powershell
.\tools\sound-club\ANALYZE_V2_BOUNDS.ps1
```

Output:

- `assets/models/sound-club/_candidate/venue-web-v2.bounds-analysis.json`

This focused pass does not alter V2. It reports:

- the exact mesh node/group responsible for min/max X, Y and Z;
- the densest 25 m XZ cells and 10 m Y bands;
- a diagnostic 100 m × 36 m × 100 m core envelope centered on the densest contiguous venue cluster;
- outlier groups by node count;
- farthest mesh nodes;
- meshes whose own bounds already violate the 120 m horizontal / 40 m vertical web gate.

This is the final isolation gate before building a separate venue-only V3. Do not promote V2.


## Production build: venue-web-v3 — venue-only crop

V2 already meets the payload and mesh-count gates. V3 solves the remaining world-bounds problem without deleting large `ROOT` meshes blindly.

Run:

```powershell
.\tools\sound-club\BUILD_WEB_V3.ps1
```

V3 derives a metric venue core from the densest contiguous V2 mesh-node cluster, then uses a conservative 100 m × 36 m × 100 m envelope:

- mesh nodes fully inside the envelope are retained byte-for-byte;
- mesh nodes fully outside are removed;
- partial TRIANGLES meshes are decoded only where necessary;
- for partial meshes, only triangles whose three world-space vertices are inside the venue envelope are retained;
- all retained vertex attributes are copied and indices are rebuilt;
- hierarchy, transforms and materials are compacted into a separate derived GLB.

Outputs:

- `assets/models/sound-club/_candidate/venue-web-v3.glb`
- `assets/models/sound-club/_candidate/venue-web-v3.build-report.json`

The script verifies V2 against its build-report SHA before building and never modifies V2, V1, the master GLB or the private SketchUp source.

If V3 passes size, mesh-count and bounds gates, the next step is **visual QA**, not another optimization pass. Public promotion remains blocked until that QA is approved.


## V3 visual QA

V3 has passed all numeric gates. Start the local QA session with:

```powershell
.\tools\sound-club\START_V3_VISUAL_QA.ps1
```

The launcher:
- verifies the local V3 SHA against `venue-web-v3.build-report.json`;
- refuses to proceed unless all numeric gates passed;
- starts or reuses a local HTTP server on port 8000;
- opens `projects/sound-club-palma.html?candidate=v3`;
- prints the visual QA checklist.

Local candidate routing now supports:
- `?candidate=v3` — current QA target;
- `?candidate=v2` — previous optimized reference;
- `?candidate=master` — source GLB comparison only, very large;
- `?candidate=1` — backwards-compatible alias for V3.

V3 must be checked visually for venue envelope, principal architecture, acoustic treatments, DJ booth/technical furniture, lighting and suspended structure, scale, clipping and absence of remote context. Passing the numeric gate does not authorize public promotion by itself.
