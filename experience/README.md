# HL Portfolio World

Prototype path:

`/experience/`

This is an isolated experimental layer. The stable public dossier at `/index.html` is intentionally untouched.

## V0.1

The first prototype establishes the navigation grammar:

```text
ENTRY
  ↓
RHB STUDIO
  ↓
GAZA OPERATIONS
  ↓
CLUB DEL MAR
  ↓
OPEN REAL PROJECT
```

The page uses:

- Three.js world canvas;
- scroll-driven camera path;
- low-cost procedural terrain / path / particles;
- project portals using existing repository visuals;
- fixed React-free DOM overlays for minimum boot cost;
- deep links into the already-built case studies and live apps;
- no heavy project GLB preloading.

Current project links:

- RHB STUDIO → `/projects/rhb-studio.html` + `/apps/rhb/`
- GAZA Operations → `/projects/gaza-logistics-ia.html` + `/apps/gaza/mission-control.html?guide=1`
- Club del Mar → `/projects/sound-club-palma.html`

## Performance rule

The world is a narrative router, not a container for every heavy asset.

Large models, videos and application bundles load only after entering a project / interactive island.

## Character

V0.1 uses a neutral scale figure only.

A character representing the portfolio owner must not be created from guesswork. When the character phase starts, provide a current reference photo and build the avatar from that reference.

## Planned phases

### V0.2 — visual language
- improve terrain / lighting / project silhouettes;
- replace generic project frames with project-specific spatial landmarks;
- add typography transitions and camera easing inspired by the supplied portfolio references;
- add mobile choreography.

### V0.3 — cinematic transitions
- integrate Scroll World-style frame-locked transitions between selected chapters;
- preload only the next chapter;
- unload prior cinematic assets after crossing a memory gate.

### V0.4 — interactive islands
- Club del Mar technical model island;
- GAZA operations island;
- RHB STUDIO engineering-system island.

### V0.5 — character
- reference-based avatar;
- walk cycle / idle / camera-follow;
- avatar hidden automatically inside technical project modes.

## Test locally

From repository root:

```powershell
python -m http.server 8000
```

Open:

```text
http://localhost:8000/experience/
```
