# SOUND CLUB Technical Deconstruction — React Project Skill v3.0

## Mission

Build and maintain the public **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca** dossier as a technical deconstruction of a multidisciplinary hospitality project.

The page is not a generic portfolio gallery. It must read like a hybrid of:
- architectural monograph;
- engineering design review;
- systems-integration dossier;
- construction-development sequence;
- interactive spatial model.

Primary audiences:
- architects;
- engineers;
- interior designers;
- lighting designers;
- KNX / DALI / control integrators;
- acoustic consultants;
- audio professionals;
- custom furniture / wood / metal fabrication studios;
- hospitality developers and technical clients.

The page must demonstrate **how the project was developed**, not only what the final space looks like.

## Canonical identity

- Project ID: `SOUND_CLUB_CDM`
- Public title: **SOUND CLUB and restaurant (CLUB del MAR) Palma de Mallorca**
- Canonical page: `projects/sound-club-palma.html`
- Runtime: React 18 + GSAP + Three.js
- Source CAD/SKP: private masters
- Public model: verified derived GLB only

## Narrative principle

The public story follows this order:

```
SITE
→ CAD
→ SPATIAL MODEL
→ ZONES
→ DEVELOPMENT PHASES
→ SYSTEMS
→ BUILD / INTEGRATION
→ FINAL ATMOSPHERE
→ AS-BUILT / DOCUMENTATION
```

Do not start with equipment lists.

The spatial problem comes first. Technical systems are explained as layers applied to the space.

## Required page chapters

1. **Project Identity / Hero**
2. **CAD Depth / Existing Space**
3. **Spatial Model / SketchUp**
4. **Development Phases**
5. **Systems Deconstruction**
6. **Audio / Electroacoustics**
7. **Lighting / KNX / DALI / Control**
8. **Acoustics / Isolation / Decoupling**
9. **Custom Fabrication / Wood / Metal / DJ Booth**
10. **Render Build / Material + Light Evolution**
11. **As-Built / Commissioning / Documentation**
12. **Technical Dossier / Evidence**

## Hero / CAD depth

The hero must feel like entering a working technical drawing.

Required:
- derived CAD plan fixed behind the page;
- layered depth, not a flat wallpaper;
- restrained pointer parallax;
- CAD crosshair cursor on fine-pointer devices;
- horizontal / vertical datum lines;
- small reference readout;
- technical grid and drawing annotation language;
- dark mineral architectural background;
- content remains readable above the drawing.

Never present viewport X/Y as real dimensions until calibrated vector CAD exists.

The hero copy should communicate multidisciplinary coordination:

**Architecture · Audio · Lighting · Control · Acoustics · Fabrication**

Avoid generic marketing language.

## Spatial Model / SketchUp

Immediately after the CAD/existing-space chapter, show the 3D model.

Runtime:
- Three.js;
- OrbitControls;
- one authoritative verified GLB;
- one camera and one geometry.

Modes:
- `DESIGN`: neutral technical material + edge overlay;
- `ZONES`: zoning overlays / isolation of functional areas;
- `SYSTEMS`: system overlays when coordinates are verified;
- `RENDER`: original/final materials + warm lighting treatment.

Until the verified GLB is promoted:
- use the real SKP-derived line preview;
- never invent substitute geometry;
- local development may use `?candidate=1` only on localhost.

## Zone model

Target spatial zones:
- Restaurant;
- Main bar;
- Secondary bar;
- DJ booth;
- Dance floor;
- VIP / rear floor;
- Exterior;
- Rack / technical control;
- suspended structure;
- lighting axes.

Hotspots become interactive only after coordinates are verified against the master model.

Each zone may expose:
- function;
- systems affecting it;
- drawing / detail;
- equipment;
- control logic;
- relevant render / final image;
- commissioning notes.

## Development phases

The project must be explained as a sequence of decisions.

Required phases:

### P01 — Existing space / survey
Existing architecture, constraints, access, ceiling, services, public/private areas.

### P02 — Spatial zoning
Restaurant, bars, DJ, dance floor, VIP, exterior, technical positions.

### P03 — Acoustic / electroacoustic strategy
Coverage, LF strategy, zoning, vibration paths, isolation constraints.

### P04 — Lighting / atmosphere
Decorative lighting, track lighting, scene logic, dimming architecture.

### P05 — Control / systems architecture
DSP, KNX, DALI, Gira X1, user interfaces, presets, feedback and future expansion.

### P06 — Fabrication / integration
DJ booth, technical furniture, structural suspension, cable routes, custom details.

### P07 — Programming / commissioning
DSP routing, presets, lighting scenes, dimming, control verification, troubleshooting.

### P08 — As-built / operational handover
Installed configuration, evidence, documentation, maintenance and future roadmap.

Each phase must state:
- objective;
- inputs;
- technical decisions;
- outputs;
- verification / evidence status.

## Systems deconstruction

The project is shown as coordinated layers.

Required disciplines:

### Architecture / interior
Spatial organization, circulation, geometry, integration with interior design.

### Audio / electroacoustics
Ecler MIMO88, Lynx DSP amplification, TSI systems, zoning, presets and limit strategy.

### Lighting
Decorative DALI pendants, track spots, DJ lighting strip, scene hierarchy and future DMX path.

### Automation / control
KNX, DALI, Gira X1, wall control, iPad/user interaction, states and commissioning.

### Acoustic control / isolation
Suspension decoupling, vibration paths, curtains / treatment where documented, boundary with formal sound-insulation evidence.

### Structure / fabrication
Suspended tube, threaded rods, clamps, DJ booth, wood / metal / custom technical furniture.

### Network / serviceability
Where supported by evidence: IP control, maintainability, diagnostics and expansion.

Systems must be shown as related layers, not unrelated cards.

## Render-build sequence

The visual sequence should communicate **construction of the design**:

```
wireframe
→ architectural massing
→ technical systems
→ material assignment
→ lighting
→ finished render
```

Rules:
- original project renders may be used only when approved for public use;
- source photos/videos remain private unless explicitly promoted;
- generated render stages must be labelled `GENERATED_*`;
- never imply a generated image is an as-built photograph;
- DESIGN and RENDER use the same authoritative geometry whenever geometry is shown.

The scroll interaction should allow the viewer to understand how the final atmosphere emerges from technical layers.

## Visual language

Desired:
- architectural;
- technical;
- deconstructed;
- editorial;
- sober;
- material-aware;
- construction-oriented.

Palette:
- dark mineral / charcoal;
- off-white drawing paper;
- muted steel / cyan linework;
- warm brass / timber accent;
- restrained 2300 K amber for final-lighting moments.

Typography:
- elegant serif for architectural chapter titles;
- neutral technical sans for body copy;
- mono for drawing IDs, phases, coordinates, system tags and QA state.

Avoid:
- cyberpunk;
- gaming HUD;
- neon interfaces;
- generic SaaS cards;
- decorative animation with no technical meaning.

## React component responsibilities

Maintain / evolve these conceptual components:
- `CADBlueprintLayer`
- `ChapterRail`
- `SpatialExplorer`
- `DevelopmentPhases`
- `DisciplineMatrix`
- `SystemLayer`
- `RenderBuild`
- `Figure`
- `Story`
- `MotionStage`
- `TechnicalDossier`

The architecture may change internally, but page modules stay React-controlled.

## Local candidate model mode

Local QA is allowed through:

`http://localhost:<port>/projects/sound-club-palma.html?candidate=1`

Contract:
- candidate mode activates only for `localhost` or `127.0.0.1`;
- it loads `assets/models/sound-club/_candidate/venue-master.glb`;
- it never changes `model-manifest.json`;
- it never runs on GitHub Pages;
- it is clearly marked `LOCAL CANDIDATE / NOT VERIFIED`.

This is the required inspection path before `-Promote`.

## Source / evidence boundary

Raw assets:
- DWG = private reference;
- SKP = private reference;
- original private photos/video = private reference unless explicitly approved.

Public:
- derived CAD/SVG;
- approved technical diagrams;
- approved original renders;
- verified GLB;
- generated concept/render assets with correct labels;
- final photos only when explicitly approved.

Evidence classes:
- `PRIVATE_REFERENCE_ONLY`
- `DOCUMENTED_REFERENCE`
- `GENERATED_DIAGRAM`
- `GENERATED_CONCEPT`
- `GENERATED_MOTION`
- `VERIFIED_DRAWING`
- `VERIFIED_GEOMETRY`
- `VERIFIED_FINAL_PHOTO`

## Model promotion gate

Before public GLB promotion:
1. selected SKP hash matches the registered master;
2. GLB parses;
3. geometry count is non-zero;
4. bounding box is plausible for the venue;
5. remote / geolocation / terrain geometry is removed or isolated;
6. DWG/SKP origin relationship is understood;
7. visual inspection passes;
8. public file size is acceptable;
9. DESIGN / RENDER show identical geometry;
10. zone coordinates are verified.

A valid GLB file is **not automatically a valid venue master**.

## Current technical facts allowed

### Geometry
- interior area approx. 326.23 m²;
- exterior area approx. 137.08 m²;
- main ceiling height 3.545 m;
- upper window-profile height 3.421 m.

### Audio
- Ecler MIMO88;
- 8 × TSI Hexagon Top 12";
- 8 × TSI Megatron Sub 18";
- 2 × Lynx GTX 5K DSP;
- 2 × Lynx GTX 14K DSP interior;
- 1 × Lynx GTX 14K DSP exterior;
- Interior / Exterior zoning;
- Restaurant / Club presets.

### Lighting / control
- Gira X1;
- KNX + DALI;
- 15 decorative pendants;
- 20 track spots;
- 24 V DJ strip via DALI DT8;
- future DMX readiness.

### Structure
- documented/as-built priority Ø48.3 mm structural pipe;
- spring anti-vibration suspension;
- threaded rod + clamp;
- Ø63 mm remains a conflicting preliminary value until evidence resolves it.

### DJ booth
- Ø2570 exterior;
- Ø1200 interior;
- access 990 mm;
- lateral step 490 mm;
- nominal height 1000 mm.

## QA before shipping

- React mounts with no console errors.
- CAD layer is visible but subordinate to content.
- Fine-pointer cursor behaves like a technical crosshair.
- Mobile falls back to readable non-CAD cursor behaviour.
- Local candidate mode cannot activate on public host.
- Public model is never loaded from `_candidate`.
- Current public GLB bounds are plausible for the venue.
- Phases appear before equipment-heavy sections.
- Systems are grouped by discipline.
- Original private media remain private.
- Generated assets are never mislabelled.
- Reduced-motion remains readable.
- Canonical public title remains unchanged.
