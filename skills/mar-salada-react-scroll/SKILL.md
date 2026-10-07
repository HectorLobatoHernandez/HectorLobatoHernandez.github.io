# MAR SALADA React Scroll Case — Project Page Skill v2.1

## Mission

Build and maintain the public **MAR SALADA — CLUB DEL MAR PALMA** case study as a React-first, architecture/editorial, long-scroll technical narrative.

Use this skill before changing:

- `projects/mar-salada.html`
- `assets/js/mar-salada-case-v2.js`
- `assets/css/mar-salada-case-v2.css`
- `xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/motion-manifest.json`

## Canonical identity

- Project ID: `MAR_SALADA_CDM`
- Public title: **MAR SALADA — CLUB DEL MAR PALMA**
- Canonical page: `projects/mar-salada.html`
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
3. Audio architecture
4. Lighting + KNX/DALI
5. Suspended structure / as-built
6. DJ booth / technical furniture
7. Scroll World visual story
8. Dossier / provenance / XXXIA

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
10. `motion-manifest.json` parses and its `projectId` is `MAR_SALADA_CDM`.
11. Pending motion exposes no public video element.
12. Canonical page title remains **MAR SALADA — CLUB DEL MAR PALMA**.
