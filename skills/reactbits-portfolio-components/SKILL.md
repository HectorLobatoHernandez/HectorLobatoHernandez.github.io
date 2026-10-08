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
- Waves — https://reactbits.dev/backgrounds/waves
- Pixel Trail — https://reactbits.dev/animations/pixel-trail
- Threads — https://reactbits.dev/backgrounds/threads

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

### Waves

Approved as the full-viewport animated background for:
- the personal dossier;
- the browser version of the ATS/PDF CV.

Use the current React Bits Waves interaction model: layered lines plus pointer-driven deformation. For the IVORY ATLAS palette, use ice blue as the dominant line colour and olive as the accent. Keep opacity subordinate to content and disable/reduce animation under reduced-motion preferences.

### Pixel Trail

Approved as a restrained pointer trail for the ATS/PDF CV browser view and future technical UI surfaces.

Rules:
- use a single palette accent per surface; ATS/PDF uses olive `#93884B`;
- trail canvas is pointer-transparent;
- do not cover or replace text;
- decay quickly;
- cap DPR and density on mobile;
- no trail in print;
- if the exact upstream Three/Fiber/Drei runtime is disproportionate for a static GitHub Pages page, a lightweight 2D adaptation may be used, but document this in the page runtime contract.

### Threads

Approved as the primary full-viewport background for the **5-minute Presentation Route**.

Use the current React Bits Threads visual model:
- WebGL/shader-generated layered thread field;
- ice blue `#BCD0D1` as the principal thread colour;
- amplitude around `1.15`;
- distance around `0.34`;
- pointer/mouse interaction enabled;
- fixed full-viewport background behind semantic content;
- capped internal render resolution;
- static/frozen fallback under reduced motion.

For GitHub Pages, a direct WebGL adaptation of the upstream shader is allowed to avoid adding an OGL build/runtime dependency. Preserve the upstream visual behavior and document the source in `window.__CV_PRESENT_REACT__`.

### Logo Loop

Use as a restrained rail for technologies/vendors **where context supports them**.

Examples:
- CV skills: KNX, DALI, Crestron, AutoCAD, Python, GitHub, React, Three.js;
- MAR SALADA: Ecler, Lynx Pro Audio, TSI, Gira, KNX, DALI.

Prefer real SVG/image marks when a project-owned/licensed asset exists. Otherwise use typographic wordmark fallbacks rather than inventing a fake logo.

Never imply sponsorship, certification or partnership merely by showing a technology logo.

## Project-specific composition

### 5-minute Presentation Route

Compose with `skills/cv-presentation-route/SKILL.md`.

Required:
- same IVORY ATLAS palette as the dossier;
- Instrument Serif / DM Sans / IBM Plex Mono hierarchy;
- Threads across the full viewport;
- no duplicate Dossier navigation item;
- palette accents in header, route rows, timing labels, CTAs and final evidence cards;
- Threads remains decorative and pointer-transparent.

### ATS / PDF browser surface

Compose with `skills/cv-ats-pdf/SKILL.md`.

Required:
- same IVORY ATLAS palette as the dossier;
- Waves across the entire viewport;
- Pixel Trail in olive;
- palette details in toolbar, title rules, tags and project cards;
- all effects behind semantic document content;
- print mode strips the interactive layer and returns to a high-contrast document.

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
