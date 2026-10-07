# Mar Salada — Project Skill

## Mission

Be the project-specific operating skill for **Mar Salada**, with **Sound Club, Palma** used only as the public portfolio alias, and for its XXXIA STUDIO visual-production pipeline.

Use this skill whenever an agent edits, generates, documents, visualises or publishes material for this project.

## Project identity

- Internal / project name: **Mar Salada**
- Public portfolio alias: **Sound Club, Palma**
- Public location: **Puerto Deportivo de Palma**
- Project type: hospitality / professional audio / lighting / control / custom fabrication
- Never expose any former/private client-facing project name in public files, UI, generated captions or filenames.

## Project facts

### Audio

- Matrix / DSP: Ecler MIMO88.
- Interior DJ inputs: IN1 / IN2.
- Exterior DJ inputs: IN3 / IN4.
- User control: Pulse 9 wall panel; Pulse 4 used for tests.
- Interior amplification:
  - 2 × Lynx GTX 14K DSP for 8 × 18-inch subwoofers.
  - 2 × Lynx GTX 5K DSP for 8 × 12-inch tops.
- Interior subs distributed in four tower groups.
- Exterior mobile DJ furniture:
  - 2 × 8-inch tops.
  - 2 × 15-inch subs.
  - GTX 14K DSP integrated.
- DJ mixer: Pioneer V10.
- Operating presets include Restaurant and Club.
- Interior / Exterior grouping is part of the documented operating logic.

### Lighting / control

- KNX supervision / visualisation: Gira X1.
- Lighting integration: KNX + DALI + conventional dimming.
- 15 decorative pendant luminaires with DALI drivers:
  - Large bar: 3.
  - Small bar: 1.
  - Right tables: 4.
  - Left tables: 5.
  - Remaining pendants belong to the documented project inventory; only assign geometry when a verified plan is available.
- Dance-floor spots:
  - Front of DJ: 10 spots on 2 × 5 lines.
  - VIP / rear-DJ area: 10 spots on 2 × 5 lines.
- DJ strip: 24 V, DALI DT8 dimmer, 5 × 5 A, 300 W power supply.
- Scene control exists at wall keypad / touch visualisation / tablet level.

### Documentation / commissioning

- Project includes routing, zones, scenes, presets, rack architecture, lighting groups and commissioning.
- Municipal / acoustic documentation is separate from generated visual storytelling.
- Never turn a generated plan or render into a claim of measured/as-built geometry.

## Evidence classes

Use these exact classes in metadata:

- DOCUMENTED_REFERENCE
- GENERATED_DIAGRAM
- GENERATED_CONCEPT
- GENERATED_MOTION
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

A generated diagram must remain **GENERATED_DIAGRAM / NOT AS-BUILT** until replaced by a verified CAD/PDF drawing.

## Visual language

- Classical / architectural / editorial rather than futuristic gaming UI.
- Warm timber.
- Dark metal and glass.
- Hospitality lighting centred on 2300 K.
- Restrained blue-violet secondary ambience.
- Fine ivory / muted-brass technical linework.
- Calm exploded axonometrics and real-space-to-plan transitions.
- No invented logos, dimensions, hidden construction details or software versions.

## Canonical GitHub paths

- Public case: `projects/sound-club-palma.html`
- React visual lab: `projects/sound-club-visuals.html`
- System diagram: `assets/visuals/sound-club-system.svg`
- Project skill: `skills/sound-club-project/`
- XXXIA project: `xxxia-studio/projects/sound-club-palma/`
- Media registry: `xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json`
- Visual story: `xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json`
- Scroll-story runtime: `assets/js/sound-club-story.js`

## Visual-production workflow

```
verified references
  -> project skill
  -> plan / diagram layer
  -> storyboard
  -> provider adapter
  -> generated output
  -> QA
  -> media registry
  -> React Visuals
  -> public case study
```

## Current React Visuals deliverables

The public visual system currently exposes **8 classified assets**:

1. 4 × GENERATED_CONCEPT boards:
   - SC01 architecture overview.
   - SC02 building exploded.
   - SC04 DJ booth exploded.
   - SC05 lighting / 2300K atmosphere.
2. 3 × GENERATED_DIAGRAM schematic plans:
   - zoning / lighting.
   - audio distribution.
   - KNX / DALI control.
3. 1 × GENERATED_DIAGRAM AV / control system architecture.

The public case contains a metadata-driven **8-scene React scroll story** built only from generated boards and technical diagrams.

User-supplied photos and videos are **PRIVATE_REFERENCE_ONLY**. They must not be published, linked from the portfolio, uploaded to a generation provider, or used as motion references unless the user explicitly approves it.

## Rules for agents

1. Read this skill before modifying Sound Club files.
2. Preserve public identity.
3. Do not infer physical dimensions from photographs.
4. Prefer SVG for diagrams so changes remain diffable in GitHub.
5. Keep user-supplied source photos/videos private. Do not publish or upload them to generation providers without explicit approval. Generated outputs may be tracked in project-media.json.
6. Any new provider output must receive a stable logical asset id.
7. Update React Visuals and the public case whenever a new verified media item is promoted.
8. Run Sound Club visual QA before merging.
