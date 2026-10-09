# Portfolio / Project System Architecture

## Decision

Keep **one public monorepo** as the canonical portfolio and demo surface:

`HectorLobatoHernandez.github.io`

Do **not** create one GitHub repository per case study by default. That would fragment navigation, media, styles, CI and project history.

Split a project into a separate repository only when it needs its own release lifecycle, backend, secrets, package publishing, private source or a deployment model that does not fit GitHub Pages.

## Repository layers

```text
/
├─ index.html                     # professional dossier / landing
├─ projects/
│  ├─ index.html                  # canonical React project hub
│  ├─ sound-club-palma.html       # case study
│  ├─ gaza-logistics-ia.html      # case study
│  ├─ rhb-studio.html             # case study
│  └─ ...
├─ apps/
│  ├─ gaza/                       # running public GAZA demonstrator
│  ├─ rhb/                        # running public RHB STUDIO demonstrator
│  └─ presentation-lab/
├─ assets/
│  ├─ data/project-registry.json  # one canonical public project index
│  ├─ visuals/                    # shared lightweight public visuals
│  └─ projects/<slug>/            # project-specific optimized media
├─ xxxia-studio/projects/<slug>/  # visual/story manifests and production state
├─ docs/projects/<slug>/          # engineering notes/checkpoints
├─ skills/<slug>/                 # project-specific skills/instructions
└─ tools/<slug>/                  # build/QA utilities
```

## Public navigation contract

Every important project gets up to three public surfaces:

1. **Project card** in `projects/index.html`.
2. **Case study** in `projects/<slug>.html`.
3. **Live app** in `apps/<app>/` when the project is software/demo-capable.

Examples:

- SOUND CLUB → case study; 3D/media loaded only inside the case.
- GAZA Operations → case study + live Mission Control/Plant/GIS surfaces.
- RHB STUDIO → case study + live public demo.
- Casa NOAH / Las Dalias / private residence → case study only until a real public app exists.

## Performance rule

The dossier and project hub must remain lightweight.

- Do not preload large GLB/video assets from the home page.
- Use responsive WebP/AVIF/JPEG previews and React/CSS carousels.
- Load Three.js / GLB only after explicit project entry or user action.
- Use project manifests for media so carousels can grow without rewriting page structure.
- Private CAD/SKP/raw reference video remains outside public web delivery.

## React carousel rule

Carousels are presentation components, not data stores.

Project/media data should live in JSON manifests. React components read those manifests and render:

- featured work carousel;
- live apps carousel;
- project archive carousel;
- per-project render carousel(s);
- technical drawing/detail carousel(s);
- before/after pairs where source evidence supports them.

This keeps the same UI component reusable across SOUND CLUB, RHB STUDIO, GAZA and future projects.

## Next migration

1. Use `assets/data/project-registry.json` as the public project index.
2. Make `projects/index.html` the canonical project browser.
3. Fix home-page project links to canonical case-study names.
4. Move SOUND CLUB from a single heavy viewer to multiple lightweight render/media carousels plus optional 3D.
5. Apply the same case-study shell to GAZA Operations and RHB STUDIO without merging their app code into the case pages.
