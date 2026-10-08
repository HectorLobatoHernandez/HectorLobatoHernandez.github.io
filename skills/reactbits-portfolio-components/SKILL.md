---
name: reactbits-portfolio-components
description: Apply selected React Bits interaction patterns to Hector's technical portfolio without sacrificing evidence boundaries, accessibility, performance or the architecture/editorial visual language. Use for 3D model viewing, technical galleries, animated name typography, particle backgrounds and technology/vendor logo rails.
---

# React Bits · Portfolio Components

## Source

Upstream: `DavidHDev/react-bits` at `63a008de65732d73010bd219d25d15c47739bb31`.

Current upstream license: **MIT + Commons Clause License Condition v1.0**. Use inside the portfolio/application is permitted; do not sell, sublicense or redistribute the React Bits components themselves as a component bundle/ported library.

Requested component references:

- Model Viewer — https://reactbits.dev/components/model-viewer
- Bounce Cards — https://reactbits.dev/components/bounce-cards
- Tech Text — https://reactbits.dev/text-animations/tech-text
- Particles — https://reactbits.dev/backgrounds/particles
- Logo Loop — https://reactbits.dev/animations/logo-loop

This is a **curated portfolio integration skill**, not a wholesale vendor copy. In the personal dossier, React Bits is intentionally used as a visible front-end capability demonstration while preserving readability and evidence boundaries.

## Component policy

### Model Viewer

Use for verified/project models such as:

- complete venue / architectural model;
- DJ booth;
- technical furniture;
- suspended structure / support assembly;
- future RHB STUDIO fabricated parts.

Browser delivery format must be `.glb` / `.gltf`.

**Never point the browser directly at a raw `.skp` or `.dwg`.**

Required pipeline:

`SKP/DWG source → geometry QA → verified master → GLB/glTF export → optimization → web viewer`

Until a verified GLB exists, render a clearly labelled poster/fallback state and keep the viewer manifest entry as `PENDING_GLB`.

Current static GitHub Pages compatibility adapter may wrap `<model-viewer>` inside a React component. When the site moves to Vite/React, prefer the upstream React Bits / Three.js implementation and preserve the same model manifest contract.

### Bounce Cards

Use for **small, curated visual sets**, normally 3–6 assets:

- generated project boards;
- verified drawings;
- final photography;
- material/detail studies.

Cards must remain clickable/focusable and expose an accessible caption outside the animation.

Do not use Bounce Cards for:
- large archives;
- evidence tables;
- technical text;
- mobile layouts where overlap makes content unreadable.

On reduced motion, render a static grid.

### Tech Text

Primary approved use:

- **Héctor Lobato** in the main dossier hero;
- all major dossier section/project titles, but never paragraph copy or metadata.

For the personal dossier, align behavior with the current React Bits Tech Text controls:

- `reveal: 'letter'`;
- reach ≈ `200px`;
- softness ≈ `0.7`;
- dashed technical selection language;
- dash length ≈ `4px`, gap ≈ `2px`, stroke ≈ `1.5px`;
- visible specks;
- selection frame + labels;
- draggable letters with spring return;
- idle sweep enabled.

The effect must remain obvious in a static frame: a low-level outline/reveal state is allowed at rest, while pointer proximity and the sweep intensify the selected letter. The accessible heading/name remains plain semantic text.

### Particles

Approved as the ambient background layer for the personal dossier.

Rules:
- moderate density for the personal dossier demonstration;
- clearly visible but subordinate to text;
- no gaming/starfield aesthetic;
- do not reduce text contrast;
- pause/reduce motion for `prefers-reduced-motion`;
- canvas must be pointer-transparent.

### Logo Loop

Use as a restrained rail for technologies/vendors **where context supports them**.

Examples:
- CV skills: KNX, DALI, Crestron, AutoCAD, Python, GitHub, React, Three.js;
- MAR SALADA: Ecler, Lynx Pro Audio, TSI, Gira, KNX, DALI.

Prefer real SVG/image marks when a project-owned/licensed asset exists. Otherwise use typographic wordmark fallbacks rather than inventing a fake logo.

Never imply sponsorship, certification or partnership merely by showing a technology logo.

## Project-specific composition

### Personal dossier

Compose with `skills/cv-editorial-architecture/SKILL.md`.

Required:
- Tech Text on the main name **and major titles**;
- Particles/Waves as a clearly visible ambient interactive background;
- Logo Loop under the skills/capability area;
- keep the dossier printable: all animated layers disappear in print.

### MAR SALADA

Compose with `skills/mar-salada-react-scroll/SKILL.md`.

Required:
- Bounce Cards for curated project media;
- Model Viewer driven by `model-manifest.json`;
- project-specific vendor/technology loop where useful;
- no raw private source media.

## Performance and accessibility

1. lazy-load model runtime and heavy media;
2. do not load 3D until the viewer approaches the viewport when practical;
3. cap DPR / particle count on mobile;
4. keyboard-focus all interactive cards;
5. always provide still fallback for 3D and motion;
6. support reduced motion;
7. preserve semantic headings and alt text;
8. run Playwright desktop/mobile QA before merge.

## Evidence boundary

React Bits changes **presentation only**.

They must not change:
- project facts;
- geometry status;
- generated/verified classification;
- privacy policy;
- as-built claims;
- CAD/SKP promotion rules.
