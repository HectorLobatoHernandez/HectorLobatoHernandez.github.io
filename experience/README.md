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


## V0.2 — GAZA / Zamora spatial world

The GAZA chapter now contains a procedural Three.js set-piece instead of a flat project card.

Narrative layers:

- historic Zamora entrance / fortified stone walls;
- Romanesque-inspired church silhouettes and old urban fabric;
- Duero river + bridge;
- green plains and vineyards;
- GAZA plant as a conceptual 3D industrial volume;
- traditional farm complex;
- free-grazing cows and sheep;
- tractor and workers;
- direct transition into `/experience/gaza/`.

The dedicated GAZA island provides free orbit / zoom / pan and hotspot camera views for:

- Zamora historic core;
- Duero;
- GAZA plant;
- GAZA farm;
- fields / vineyards.

Important provenance rule: the current plant/farm placement and historic-city composition are **conceptual world design**, not georeferenced or as-built geometry. Later versions should replace or align these volumes with verified GIS / plant geometry where available.


## V0.3 — GAZA becomes a continuous journey

The main immersive dossier no longer treats GAZA as one stop. The scroll path now travels through:

1. GAZA / ARRIVAL — approach to a walled Zamora;
2. GAZA / ZAMORA — historic walls, churches and stone fabric;
3. GAZA / DUERO — river and bridge as territorial spine;
4. GAZA / LAND — plains, vineyards and rural landscape;
5. GAZA / PLANT — conceptual industrial plant and logistics;
6. GAZA / FARM — farm, animals, workers and tractor;
7. transition out toward Club del Mar.

The GAZA set remains visible across the entire sequence and the global environment shifts toward a brighter green/golden tone while crossing the GAZA segment.

The right-side project panel becomes smaller and image-free during GAZA so the 3D world remains visible.

`ENTER GAZA WORLD` is always available during this segment to switch from guided cinematic scroll to the free-navigation island at `/experience/gaza/`.

The stable dossier at `/index.html` is still unchanged.
