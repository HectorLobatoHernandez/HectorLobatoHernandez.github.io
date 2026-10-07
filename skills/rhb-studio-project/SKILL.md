# RHB STUDIO — Project Skill

## Mission

Project-specific operating skill for **RHB STUDIO**, the local-first engineering / fabrication / AI operations platform.

Use before changing `projects/rhb-studio.html`, RHB architecture diagrams, project-state documents, CAD-agent material or public showcase content.

## Identity

- Canonical title: **RHB STUDIO**
- Public case: `projects/rhb-studio.html`
- Base: Zamora
- Type: engineering platform / project operations / fabrication / CAD / AI agents
- Public site is a showcase; the full runtime remains local.

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

## Next development pass

1. inventory current local modules and launchers;
2. establish the current RHB architecture as source of truth;
3. separate public-safe vs local-only information;
4. redesign `projects/rhb-studio.html` as its own React case;
5. add model/gallery manifests;
6. add project QA workflow.
