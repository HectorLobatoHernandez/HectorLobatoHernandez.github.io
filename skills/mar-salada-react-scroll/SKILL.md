# MAR SALADA React Scroll Case — Project Page Skill

## Mission

Build and maintain the public **MAR SALADA — CLUB DEL MAR PALMA** case-study page as a React-first, architecture/editorial, long-scroll technical narrative.

This skill composes:
1. `skills/mar-salada-project/SKILL.md`
2. `skills/react-visuals/SKILL.md`
3. `skills/scroll-world/SKILL.md`
4. `skills/xxxia-visual-production/SKILL.md`

Use it before changing `projects/mar-salada.html`, `assets/js/mar-salada-case.js`, `assets/css/mar-salada-case.css`, or the case-study media/story metadata.

## Canonical identity

- Project ID: `MAR_SALADA_CDM`
- Public title: **MAR SALADA — CLUB DEL MAR PALMA**
- Canonical page: `projects/mar-salada.html`
- Legacy route: `projects/sound-club-palma.html` → canonical page
- XXXIA archive slug remains `sound-club-palma` until a controlled migration is performed.

## React rule

The public case is React-controlled. Do not add a parallel hand-written gallery or duplicate static component tree.

GitHub Pages currently runs buildless React:
- React 18 UMD
- ReactDOM `createRoot`
- `React.createElement` rather than runtime JSX transpilation
- metadata loaded from versioned JSON

If the repository later moves to Vite/React, preserve component responsibilities and metadata contracts.

## Page grammar

The page is a long-form architectural case study, not a generic dashboard.

Required chapters:
1. Hero / identity
2. Project overview
3. Audio architecture
4. Lighting + KNX/DALI
5. Suspended structure / as-built
6. DJ booth / technical furniture
7. Scroll World visual story
8. Dossier / provenance / XXXIA

Visual language:
- classical / architectural / editorial
- dark mineral background
- warm timber / muted brass
- warm hospitality lighting; 2300 K is a **portfolio visualization target**, not automatically an as-built lighting claim
- restrained cyan/teal contrast only
- no neon-gaming UI, glitch, fake telemetry or decorative HUD overload
- serif display typography + technical sans/mono secondary layer

## Scroll behaviour

Until a frame-locked XXXIA motion chain exists, use the zero-cost React still/diagram implementation:
- sticky visual stage
- intersection-driven scene activation
- scroll progress
- chapter navigation
- generated concept boards and SVG technical diagrams
- `prefers-reduced-motion` support

When verified CAD/SKP geometry is available, the upgrade path is:
`CAD/SKP master → verified geometry → frame-locked XXXIA sequence → Scroll World scrub engine → same React chapter shell`.

Do not start paid video rendering merely because the page supports it. Render only when the user explicitly wants the motion output and the budget/backend has been approved.

## Evidence contract

The page may display only media with `publicSafe: true` from the canonical registry.

Evidence classes remain:
- DOCUMENTED_REFERENCE
- GENERATED_DIAGRAM
- GENERATED_CONCEPT
- GENERATED_MOTION
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

Original user-supplied photos and videos are **PRIVATE_REFERENCE_ONLY**:
- never commit them to GitHub;
- never place them in public markup or JSON;
- never use direct source-file URLs in the public site;
- generated diagrams may encode supported technical facts without reproducing the original media.

## Current technical facts exposed

Audio:
- Ecler MIMO88
- 8 × TSI Hexagon Top 12"
- 8 × TSI Megatron Sub 18"
- 2 × Lynx GTX 5K DSP
- 2 × Lynx GTX 14K DSP interior
- 1 × Lynx GTX 14K DSP exterior
- Interior / Exterior zoning
- Restaurant / Club operating presets

Lighting / control:
- Gira X1
- KNX + DALI
- 15 decorative pendants
- 20 track spots
- 24 V DJ strip via DALI DT8
- future DMX readiness

Structure:
- installed/documented structural tube: Ø48.3 mm
- spring anti-vibration suspension
- threaded rod M8
- clamp compatible with 48–51 mm tube
- Ø63 mm is retained only as a conflicting preliminary-document value until CAD validation

DJ booth documented base dimensions:
- Ø exterior 2570 mm
- Ø interior 1200 mm
- access 990 mm
- lateral step 490 mm
- nominal height 1000 mm

## Media/data sources

- `xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json`
- `xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json`
- `assets/visuals/mar-salada-suspension-detail.svg`
- `assets/visuals/mar-salada-dj-booth-plan.svg`

All physical-layout diagrams remain diagrammatic until promoted through verified CAD/PDF evidence.

## Performance / responsive QA

Before shipping:
1. React root mounts without console errors.
2. Both metadata JSON files return 200.
3. All `publicSafe` media used by the story resolve.
4. Desktop sticky story works without horizontal overflow.
5. Mobile collapses to one column; no sticky trap.
6. Reduced-motion path remains usable.
7. Original private media is absent from HTML, JS, CSS and public JSON.
8. Legacy route resolves to the canonical project.
9. Home project card links to the canonical project.
