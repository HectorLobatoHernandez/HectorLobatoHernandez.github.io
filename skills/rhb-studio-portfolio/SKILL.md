---
name: rhb-studio-portfolio
description: Build and maintain the public RHB STUDIO case as a technical engineering-platform story covering local-first architecture, CAD/fabrication, project operations and AI-agent orchestration without exposing private runtime credentials or overstating deployment status.
---

# RHB STUDIO — Public Portfolio Skill

## Mission

Present **RHB STUDIO** as a real engineering/operations platform in active development: a system that connects survey, CAD, fabrication, documentation, project state, local services and specialist AI agents.

This skill owns the public page:

- `projects/rhb-studio.html`

and composes:

- `../reactbits-portfolio-components/SKILL.md`
- `../cv-editorial-architecture/SKILL.md` for typography/evidence discipline

It does **not** own the private local runtime.

## Identity

- Product: **RHB STUDIO**
- Context: internal engineering / fabrication / operations platform
- Base: Zamora
- Status: active development
- Runtime principle: local-first, modular, auditable, human-in-the-loop

Do not rename RHB STUDIO or revive retired names such as INGENIA HUB.

## Evidence boundary

The public page may explain architecture and show approved demos, but must never imply that browser visitors can control the local system.

Keep these boundaries visible:

- `PUBLIC_SHOWCASE`
- `LOCAL_RUNTIME`
- `DEMO`
- `PLANNED`
- `VERIFIED_OUTPUT`

Never publish:

- API keys
- local secrets
- private customer files
- unrestricted local endpoints
- credentials
- private project folders
- unreviewed CAD source

## Required narrative

1. **Identity / problem**
   - one operating system for projects, fabrication and AI-assisted engineering.

2. **System architecture**
   - Project Core
   - OmniRoute
   - OpenClaw
   - NEXO
   - specialist agents
   - local services
   - human approval / QA

3. **Photo → CAD**
   - survey/photo input
   - geometry extraction
   - manual verification
   - CAD master
   - derived drawings / BOM / fabrication

4. **Fabrication**
   - gates
   - tables / furniture
   - metal structures
   - acoustic / AV integration where relevant

5. **Project operations**
   - project state
   - decisions
   - versions
   - BOM
   - budgets
   - documentation
   - commissioning / handover

6. **Runtime / health**
   - service status
   - ports / process health
   - logs
   - observability
   - read-only public representation only

7. **Roadmap**
   - more agents
   - CAD automation
   - visual generation
   - manufacturing workflow
   - controlled external integrations

## React / interaction grammar

RHB STUDIO must feel like an **engineering studio / architecture office / fabrication system**, not a cyberpunk dashboard.

Approved React Bits patterns:

### Model Viewer
Use for:
- fabricated gate;
- table base;
- structural assemblies;
- verified Photo→CAD outputs.

Pipeline:

`PRIVATE SOURCE → VERIFIED CAD → GLB/glTF → public viewer`

### Bounce Cards
Use for:
- project-family gallery;
- before / CAD / fabrication / final sequence;
- small curated groups only.

### Logo Loop
Use for the runtime/toolchain:
- OmniRoute
- OpenClaw
- NEXO
- AutoCAD
- SketchUp
- Python
- GitHub
- React / Three.js where actually used

Typography fallback is preferred over fabricated brand marks.

### Tech Text / Particles
Use sparingly. RHB should remain calmer and more architectural than the personal CV.

## Page architecture

Preferred React component responsibilities:

- `RhbHero`
- `SystemArchitecture`
- `ProjectFlow`
- `ModelViewer`
- `FabricationGallery`
- `RuntimeMap`
- `Roadmap`
- `EvidenceBadge`

The current static page may be migrated incrementally to buildless React 18 before any future Vite migration.

## Visual language

- dark graphite / iron / warm off-white;
- architectural grid;
- restrained rust / brass accent;
- real fabrication photography when available;
- CAD linework;
- exploded technical objects;
- no fake terminal rain;
- no gratuitous telemetry;
- no neon gaming aesthetic.

## QA

Before merge:

1. public page remains usable without local runtime;
2. no localhost URL is exposed as a public service;
3. private secrets absent;
4. local/demo/planned states are distinguishable;
5. mobile has no horizontal overflow;
6. reduced-motion fallback works;
7. 3D model requires approved GLB/glTF;
8. project examples do not invent dimensions or client details;
9. Playwright screenshots are captured desktop + mobile.
