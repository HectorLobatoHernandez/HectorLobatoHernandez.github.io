# React Visuals — Technical Project Explorer Skill

## Purpose

Create a React-based visual explorer for technical / architectural projects using a versioned media registry rather than hard-coded gallery markup.

Use when a project needs interactive navigation across:
- plans;
- system diagrams;
- photos;
- videos;
- generated concepts;
- generated motion;
- evidence / provenance states.

## Architecture

```
project-media.json
  -> React state
  -> filter rail
  -> visual stage
  -> provenance badges
  -> metadata panel
  -> project / XXXIA links
```

## Data-first rule

The UI never decides whether an asset is real, generated or verified. It reads the classification from the project media registry.

Required fields:
- id
- title
- kind
- classification
- archiveStatus
- publicSafe

Optional:
- src
- provider
- providerMediaId
- providerJobId
- model
- durationSec
- dimensions
- note

## Evidence classes

Support:
- DOCUMENTED_REFERENCE
- GENERATED_DIAGRAM
- GENERATED_CONCEPT
- GENERATED_MOTION
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

## Visual behaviour

- Large central viewer.
- Asset rail / filters.
- Full-size SVG plan display.
- HTML5 video controls for MP4.
- Never autoplay audio.
- `preload="metadata"` for project video.
- Obvious NOT AS-BUILT warning for generated diagrams.
- Responsive down to mobile.
- Keep architecture/editorial visual language; avoid generic gaming dashboards unless the project requires it.

## React delivery

For GitHub Pages without a build pipeline, a buildless React page is acceptable:
- React ESM import.
- ReactDOM createRoot.
- htm or createElement rather than runtime JSX transpilation.

If the repository later adopts Vite/React, preserve the same media contract and migrate the UI component without changing project metadata.

## QA

Before merge verify:
1. media registry loads;
2. expected number of public assets renders;
3. all local SVG URLs return 200;
4. video asset has controls and no autoplay;
5. generated plans show evidence warning;
6. no horizontal overflow at desktop/mobile;
7. no console/page errors;
8. public project and XXXIA links resolve.
