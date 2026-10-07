# RHB STUDIO — Project Skill v1.1

## Mission

Project-specific operating skill for **RHB STUDIO**, the local-first engineering / fabrication / AI operations platform.

Use before changing `projects/rhb-studio.html`, `assets/js/rhb-studio-case.js`, `assets/css/rhb-studio-case.css`, `rhb-studio/metadata/*`, RHB architecture diagrams, project-state documents, CAD-agent material or public showcase content.

## Identity

- Canonical title: **RHB STUDIO**
- Public case: `projects/rhb-studio.html`
- Base: Zamora
- Type: engineering platform / project operations / fabrication / CAD / AI agents
- Public site is a showcase; the full runtime remains local.

## Public React implementation

Current public case stack:
- React 18 UMD
- GSAP + ScrollTrigger
- project manifest + model manifest
- React Bits-inspired Model Viewer / Bounce Cards / Logo Loop patterns
- responsive mobile fallback
- `prefers-reduced-motion` compatible behaviour
- dedicated Playwright QA in `rhb-studio/tests/rhb-studio-qa.mjs`

Public runtime contract is exposed as `window.__RHB_STUDIO_CASE__` for QA only.

## Current architecture

Publicly supported modules:
- Photo → CAD
- Project Core / project state
- Agent Routing
- Documentation / BOM / budgets
- Health / Ops
- Visual / AI

Current local platform references may include:
- OmniRoute
- OpenClaw
- NEXO
- specialist agents
- scripts / local services

Do not publish secrets, API keys, local credentials, private client files or private project folders.

## Visual direction

RHB STUDIO must remain architecture / engineering oriented:
- restrained dark editorial system;
- exact RHB STUDIO brand/logo;
- technical diagrams;
- CAD / fabrication content;
- project flows;
- real deliverables and state;
- avoid generic sci-fi dashboards.

Compose with:
- `skills/reactbits-portfolio-components/SKILL.md`
- Three.js skills when interactive geometry is justified.

Good component candidates:
- Model Viewer for fabricated objects / CAD-derived GLB;
- Bounce Cards for 3–6 project boards;
- Logo Loop only for actual tools/platforms used;
- Scroll narrative for process explanation, not decorative motion.

## Evidence contract

Clearly separate:
- LOCAL_RUNTIME
- PUBLIC_SHOWCASE
- DOCUMENTED_ARCHITECTURE
- GENERATED_CONCEPT
- VERIFIED_MODEL
- VERIFIED_PROJECT_OUTPUT

Do not present a conceptual UI or generated render as a deployed production module.

## Model promotion rule

Raw CAD/SKP remains private. Public interactive geometry must be promoted through:

`authoritative source → units/origin check → verified geometry → optimization → GLB/glTF → visual QA → APPROVED`

`PENDING_GLB` must render a schematic/poster fallback rather than invented 3D.

## Current public references

- Sliding gate / Encomienda: schematic public reference; geometry pending verified CAD.
- Glass table base: documented brief (1400 × 800 mm glass, 750 mm target height); final fabrication geometry still requires validated drawing.

## Next development pass

1. inventory the latest local RHB modules/launchers against the public architecture;
2. ingest verified CAD/SKP for gate/table/reference fabricated parts;
3. export first approved GLB;
4. connect real fabrication outputs, BOM and documentation examples;
5. evolve the public case without exposing local secrets or private client data.
