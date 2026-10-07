# XXXIA STUDIO — Output Archive Contract

## Purpose
Every generated still or motion asset must be traceable from source references to public usage.

## Canonical output path
```
xxxia-studio/projects/<project-slug>/04_outputs/
  boards/
  stills/
  motion/
  thumbs/
```

## File naming
```
<ID>_<slug>_vNNN.<ext>
<ID>_<slug>_thumb_vNNN.<ext>
<ID>_<slug>_poster_vNNN.<ext>
```

Example:
`SC01_BUILDING_OVERVIEW_v001.mp4`

## Required metadata per output
- project
- piece id
- version
- classification
- provider
- provider job id
- model
- source references
- prompt/storyboard version
- created at
- duration / dimensions when available
- archive path or remote result URL
- QA status
- public-embed status

## Classification
- `DOCUMENTED_REFERENCE`: user-provided or verified project evidence.
- `GENERATED_CONCEPT`: generated still derived from real references.
- `GENERATED_MOTION`: generated motion asset derived from real references.
- `VERIFIED_DRAWING`: only when a drawing is explicitly verified as project documentation.
- `VERIFIED_FINAL_PHOTO`: only when a real final photograph is verified.

## Binary policy
GitHub is the preferred archive for reasonably sized web assets. If a provider result is temporarily remote-only, store the provider URL and job id first, then ingest the binary later without changing its logical asset id/version.

Never claim a planned archive path already contains a binary. Use `archiveStatus`:
- `PLANNED`
- `REMOTE_ONLY`
- `ARCHIVED`
- `REJECTED`

## Public policy
Generated content must remain visibly distinguishable from verified drawings and real photographs in metadata and captions.
