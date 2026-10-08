# Sound Club React Scroll Case — Project Page Skill v2.4

## Mission

Build and maintain the public **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca** case study as a React-first, architecture/editorial, long-scroll technical narrative.

Compose this skill with `../reactbits-portfolio-components/SKILL.md` for Model Viewer, Bounce Cards and project technology/vendor rails.

Use this skill before changing:

- `projects/sound-club-palma.html`
- `assets/js/sound-club-case-v2.js`
- `assets/css/sound-club-case-v2.css`
- `xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/motion-manifest.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/model-manifest.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/source-ingest.json`
- `assets/visuals/sound-club-cad-blueprint.svg`
- `assets/visuals/sound-club-skp-line-preview.svg`

## Canonical identity

- Project ID: `SOUND_CLUB_CDM`
- Public title: **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca**
- Canonical page: `projects/sound-club-palma.html`
- Legacy archive slug: `sound-club-palma`

## Required frontend stack

This page remains React-controlled.

Current buildless GitHub Pages stack:

- React 18 UMD
- ReactDOM `createRoot`
- GSAP
- ScrollTrigger
- metadata-driven Scroll World narrative
- plain CSS
- no JSX transpilation required

Do not regress the page to a hand-written static gallery.

If the portfolio later moves to Vite, migrate the same component responsibilities rather than redesigning the information architecture.

## React component responsibilities

The page must keep these conceptual components:

- `ChapterRail`
- `Metric`
- `Card`
- `Figure`
- `CADBlueprintLayer`
- `SpatialExplorer`
- `Story`
- `MotionStage`
- project `App`

New page modules should be added as components or metadata, not by inserting unrelated DOM fragments after React mounts.

## Scroll behaviour

Use scroll as information architecture, not decoration.

Required:

1. top progress line;
2. active chapter rail;
3. intersection-driven section state;
4. GSAP/ScrollTrigger reveal motion;
5. restrained parallax/depth motion;
6. sticky Scroll World visual stage;
7. mobile fallback with no sticky trap;
8. `prefers-reduced-motion` support.

Avoid:
- gratuitous scroll hijacking;
- long blank pinning regions;
- mouse-wheel lock;
- neon HUD / gaming UI;
- animation that hides technical content.

## Page grammar

Required chapters:

1. Hero / identity
2. Project overview
3. Spatial model explorer / CAD background
4. Audio architecture
5. Lighting + KNX/DALI
6. Suspended structure / as-built
7. DJ booth / technical furniture
8. Curated Bounce Cards gallery
9. Scroll World visual story
10. Dossier / public evidence

## Visual language

- architectural / editorial
- classical and technical rather than futuristic
- dark mineral background
- warm timber and muted brass
- serif display typography
- technical sans/mono secondary layer
- controlled amber lighting
- restrained cyan / teal contrast
- dense information, but generous rhythm and hierarchy

## CAD background + CAD cursor

The public case may use a **derived** visual preview from the private DWG as a fixed React background layer.

Rules:
- raw DWG is never committed;
- raster/derived preview is visual navigation only until authoritative vector geometry is exported;
- crosshair/cursor may show viewport reference coordinates, but must not label them as metres or fabrication dimensions;
- real dimensions require calibrated vector geometry;
- keep the CAD layer behind content and reduce it on mobile / coarse pointer devices.

## Spatial Explorer / Three.js

The web runtime is Three.js. Blender may be used as an authoring / material / lighting stage, but it is not the browser runtime.

The primary model uses **one authoritative verified GLB**. The browser never swaps geometry between visual modes:
- `DESIGN`: Three.js applies neutral technical materials plus an edge overlay at runtime;
- `RENDER`: Three.js restores the GLB's original materials/textures and applies warm presentation lighting.

Both modes therefore share the exact same mesh, transforms, scale and camera state. Never publish a fake 3D placeholder as verified geometry. Until GLB exists, use the SKP-derived line preview with `GLB PENDING`.

## Model Viewer and gallery

The project page must be ready to display verified geometry without publishing raw CAD.

Model runtime contract:
- source CAD/SKP stays private;
- browser assets are optimized GLB/glTF;
- `model-manifest.json` controls model status and public source;
- `PENDING_GLB` renders a poster/fallback, never a fake 3D object;
- viewer is React-controlled;
- `source-ingest.json` records source hash/version/unit facts without publishing raw files;
- `model-manifest.json` promotes one authoritative GLB;
- `tools/sound-club/CONVERT_SKP_TO_GLB.ps1` creates a candidate locally and only promotes with an explicit `-Promote` flag;
- Three.js OrbitControls preserve one camera across mode changes.

Gallery contract:
- Bounce Cards consume only `publicSafe: true` project media;
- reduced-motion collapses to a static grid;
- generated assets retain their classification labels.

## Public / internal navigation boundary

The public case must not expose implementation-only buttons or navigation to:
- React Visuals;
- XXXIA Production Console;
- project skills;
- internal project state files.

Those surfaces remain available inside the repository for development/QA, but the client/recruiter-facing case should present the project itself, the interactive model layer, gallery, story and public technical evidence.

## Evidence contract

Only render public media where `publicSafe === true`.

Evidence classes:

- DOCUMENTED_REFERENCE
- GENERATED_DIAGRAM
- GENERATED_CONCEPT
- GENERATED_MOTION
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

Original user photos/videos remain **PRIVATE_REFERENCE_ONLY** and must never be committed or linked publicly.

Generated imagery may communicate supported facts, but it must not be labelled as verified geometry.

## Current project facts allowed on the public page

### Audio
- Ecler MIMO88
- 8 × TSI Hexagon Top 12"
- 8 × TSI Megatron Sub 18"
- 2 × Lynx GTX 5K DSP
- 2 × Lynx GTX 14K DSP interior
- 1 × Lynx GTX 14K DSP exterior
- Interior / Exterior zoning
- Restaurant / Club presets

### Lighting / control
- Gira X1
- KNX + DALI
- 15 decorative pendants
- 20 track spots
- 24 V DJ strip via DALI DT8
- future DMX readiness

### Structure
- current installed/documented priority: Ø48.3 mm structural pipe
- spring anti-vibration suspension
- threaded rod + clamp
- Ø63 mm retained only as a conflicting preliminary value pending CAD validation

### DJ booth
- Ø2570 exterior
- Ø1200 interior
- access 990 mm
- lateral step 490 mm
- nominal height 1000 mm

## XXXIA motion rule

Do not publish the original reference videos.

The correct sequence is:

`CAD/SKP master → verified geometry → stills / diagrams → frame-locked XXXIA sequence → Scroll World scrub integration`

SC08 is the portfolio scroll master and is declared in `motion-manifest.json`.

Runtime rule:
- while `master.status !== APPROVED` or `master.src` is empty, `MotionStage` must show the public-safe still/diagram fallback;
- once `APPROVED`, the same React story stage scrubs the master video against scroll position;
- reduced-motion mode must never depend on video playback.

Do not launch paid render merely because the page supports it. Render only when motion is explicitly approved and geometry/evidence status is appropriate.

## QA before shipping

1. React root mounts without console errors.
2. GSAP and ScrollTrigger load without blocking core content.
3. Metadata JSON returns 200.
4. All rendered media are `publicSafe`.
5. Desktop story stage remains sticky and usable.
6. Mobile becomes one-column and non-sticky.
7. Reduced-motion path remains fully readable.
8. No original private media paths exist in public HTML/JS/CSS/JSON.
9. No generated concept is labelled `VERIFIED_DRAWING`.
10. `motion-manifest.json` parses and its `projectId` is `SOUND_CLUB_CDM`.
11. Pending motion exposes no public video element.
12. Canonical page title remains **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca**.
13. CAD cursor readout is explicitly reference-only until vector calibration.
14. DESIGN/RENDER are runtime treatments of one GLB and cannot diverge.
15. Raw DWG/SKP paths or binaries are absent from public assets.
