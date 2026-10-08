# SOUND CLUB and restaurant — Project Skill

## Mission

Project-specific operating skill for **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca** and its technical / visual archive.

Use this skill whenever an agent edits, generates, documents, visualises or publishes material for this project.

## Identity

- Project ID: `SOUND_CLUB_CDM`
- Canonical public title: **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca**
- Location label: **Club del Mar Palma / Palma de Mallorca**
- Canonical case page: `projects/sound-club-palma.html`
- Legacy page: `projects/sound-club-palma.html` redirects to the canonical case.
- Legacy XXXIA archive slug: `xxxia-studio/projects/sound-club-palma/` (keep until controlled migration).

## Source-of-truth pipeline

```
CAD/SKP master
  -> verified geometry
  -> drawings
  -> web model
  -> exploded components
  -> 2300 K portfolio visualization
  -> XXXIA sequences
  -> QA
  -> GitHub public release
```

Original source photos/videos and raw CAD/SKP are private references. Do not commit, link or publish them.

### Current master-source ingest
- DWG: AC1032, ingested as private master; public background uses only a derived preview. DWG units are not asserted from the binary preview.
- SKP: SketchUp 24.0.594, unit = Meter, ingested as private master.
- SKP archive inspection: 499 materials, 83 component thumbnails, 110 texture assets; browser geometry remains pending verified GLB export.
- DESIGN and RENDER web variants must derive from the same verified geometry and origin.

## Confirmed / documented project facts

### Geometry / venue
- Interior area approx.: 326.23 m².
- Exterior area approx.: 137.08 m².
- Main ceiling height: 3.545 m.
- Upper window-profile height: 3.421 m.

### Audio
- Matrix / DSP: Ecler MIMO88.
- Interior DJ inputs: IN1 / IN2.
- Exterior DJ inputs: IN3 / IN4.
- User control: Pulse 9 wall panel; Pulse 4 used for tests.
- Interior: 8 × TSI Hexagon Top 12" + 8 × TSI Megatron Sub 18".
- Interior amplification: 2 × Lynx GTX 5K DSP + 2 × Lynx GTX 14K DSP.
- Exterior amplification: 1 × Lynx GTX 14K DSP.
- DJ mixer: Pioneer V10.
- Operating presets include Restaurant and Club.
- Interior / Exterior grouping is part of the operating logic.

### Lighting / control
- Gira X1.
- KNX + DALI + conventional dimming.
- 15 decorative pendant luminaires with DALI drivers.
- Dance floor: 10 front-DJ spots + 10 VIP/rear-DJ spots.
- DJ strip: 24 V, DALI DT8, 5 × 5 A, 300 W PSU.
- Future DMX integration is an expansion path.

### Suspended structure
- Installation report / as-built priority: structural steel pipe Ø48.3 mm, 2.5–3 mm wall, black finish.
- Clamp family compatible with 48–51 mm pipe.
- Threaded rod M8 suspension.
- Spring / anti-vibration isolation between ceiling and suspended structure.
- Preliminary memory value Ø63 mm is conflicting legacy data and must not override the installed/as-built value unless CAD/field measurement proves otherwise.

### DJ booth documented base
- Outer diameter 2570 mm.
- Inner void diameter 1200 mm.
- Access 990 mm.
- Lateral step development 490 mm.
- Nominal height 1000 mm.
- These dimensions remain subject to CAD/SKP master verification before fabrication/as-built geometric assertion.

## Evidence classes

Use:
- DOCUMENTED_REFERENCE
- GENERATED_DIAGRAM
- GENERATED_CONCEPT
- GENERATED_MOTION
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

Generated diagrams remain diagrammatic. A CAD/PDF drawing becomes `VERIFIED_DRAWING` only after evidence review.

## Public media boundary

- User-supplied photos and videos: `PRIVATE_REFERENCE_ONLY`.
- Recover/autosave CAD: never promote automatically to MASTER.
- Public page may use approved generated boards, diagrams and future generated motion.
- Never expose original private video.
- 2300 K is a portfolio visualization target; preserve separately documented technical lighting values.

## Canonical GitHub paths

- Case: `projects/sound-club-palma.html`
- Legacy case redirect: `projects/sound-club-palma.html`
- React visual explorer: `projects/sound-club-visuals.html`
- React case runtime: `assets/js/sound-club-case-v2.js`
- React case styling: `assets/css/sound-club-case-v2.css`
- Page-specific skill: `skills/sound-club-react-scroll/SKILL.md`
- Source ingest metadata: `xxxia-studio/projects/sound-club-palma/05_metadata/source-ingest.json`
- Model manifest: `xxxia-studio/projects/sound-club-palma/05_metadata/model-manifest.json`
- Derived CAD background: `assets/visuals/sound-club-cad-blueprint.svg`
- Derived SKP preview: `assets/visuals/sound-club-skp-line-preview.svg`
- Media registry: `xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json`
- Story: `xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json`
- XXXIA archive: `xxxia-studio/projects/sound-club-palma/`

## Rules for agents

1. Read this skill plus `skills/sound-club-react-scroll/SKILL.md` before changing the public case.
2. Understand existing code/data before modifying it.
3. Keep React as the page component/runtime layer.
4. Preserve evidence/provenance labels.
5. Do not publish original user media.
6. Prefer SVG for technical diagrams.
7. Resolve technical contradictions explicitly instead of silently choosing whichever value looks convenient.
8. Do not start paid XXXIA/Scroll World motion rendering without explicit user approval.
9. Run the Sound Club and restaurant QA checklist after every media/story promotion.
10. Never present viewport cursor coordinates as real CAD dimensions before vector calibration.
11. Preserve one camera/origin across DESIGN and RENDER model variants.
