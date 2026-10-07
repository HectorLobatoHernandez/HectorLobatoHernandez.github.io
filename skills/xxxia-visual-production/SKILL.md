# XXXIA Visual Production Skill

## Mission
Turn verified project references into controlled generative visual assets and motion pieces while preserving provenance and public-claim boundaries.

## Canonical pipeline
```
REFERENCES
  -> MASTER BRIEF
  -> VISUAL LANGUAGE
  -> STORYBOARD / SHOT LIST
  -> GENERATION JOB
  -> VISUAL QA
  -> ARCHIVE
  -> PROJECT EMBED
```

## Required inputs
- project public title
- real source references
- source classification
- material / lighting / architectural language
- facts that may be stated publicly
- facts that must not be invented
- target aspect ratio / duration / output kind

## Output classes
- GENERATED_CONCEPT
- GENERATED_MOTION
- DOCUMENTED_REFERENCE
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

Never relabel GENERATED_CONCEPT as VERIFIED_DRAWING or VERIFIED_FINAL_PHOTO.

## Provider adapters
XXXIA owns the brief, storyboard, prompt and archive contract. A provider is replaceable.

### Higgsfield adapter
Use for image-to-video, motion transfer, cinematic sequences and future provider jobs when connected.
Before paid generations, estimate or obtain explicit cost approval. For a user-requested free-only job, use only a confirmed free entitlement and record creditsSpent=0.
Store provider job id, model, resolution, references, status and result URL when available.

## Reference implementation

Current reference archive:

`xxxia-studio/projects/sound-club-palma/`

The archive slug is legacy/internal. The canonical public identity is **MAR SALADA — CLUB DEL MAR PALMA**.

XXXIA is project-agnostic: do not hard-code one project identity into the engine. Project-specific naming, evidence and privacy rules belong in that project's skill/metadata.

## Visual rules for MAR SALADA
- architecture first
- classical / elegant
- warm timber
- professional 2300K lighting
- muted brass technical annotations
- restrained blue-violet ambience
- exploded axonometrics
- real-to-plan transitions
- no invented equipment, dimensions or hidden construction details

## GitHub archive contract
Each project should contain:
- `01_briefs/`
- `02_storyboards/`
- `03_prompts/`
- `04_outputs/`
- `05_metadata/manifest.json`
- `05_metadata/asset-index.json`
- `05_metadata/generation-jobs.json`

## QA checklist
1. Canonical project identity is correct and legacy archive slugs are not mistaken for the public title.
2. Generated content is labelled.
3. No confidential name appears.
4. No invented dimensions/specifications.
5. Lighting/material language matches the brief.
6. File naming and version are stable.
7. Generation job provenance is stored.
8. Public project page links to the correct case.


## Public studio composition

The visual-production engine is distinct from the public XXXIA STUDIO portfolio surface.

For public studio/page work compose with:

`../xxxia-studio-portfolio/SKILL.md`

For MAR SALADA page work compose additionally with:

`../mar-salada-react-scroll/SKILL.md`
