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

## Sound Club reference implementation
`xxxia-studio/projects/sound-club-palma/`

The public identity is **Sound Club, Palma**. Do not expose the private/client-facing historical project name.

## Visual rules for Sound Club
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
1. Public identity is correct.
2. Generated content is labelled.
3. No confidential name appears.
4. No invented dimensions/specifications.
5. Lighting/material language matches the brief.
6. File naming and version are stable.
7. Generation job provenance is stored.
8. Public project page links to the correct case.
