---
name: cv-editorial-architecture
description: Design elegant, typographically rigorous technical curricula and engineering portfolios inspired by architectural publishing, the Swiss Style and software documentation. Prefer semantic HTML/CSS/vanilla JS; select motion only where it improves reading. Use when the user asks for an architecture-oriented CV, an engineering presentation, a portfolio design review or several visual design alternatives.
---

# CV Editorial · Architecture × Software v5

## Intent

Design a portfolio that a serious architecture studio, engineering director or software team could read. This **supersedes neon / glitch / terminal spectacle as the default CV art direction**. Keep the prior React Bits experiments as archival options, not the user's selected professional identity.

## Source of truth

Reuse the existing portfolio and case studies for factual content. Do not invent degrees, employment dates, metrics, clients, deployment status or certifications. Separate executed projects from prototypes, public data, simulated data and proposed systems. Support Spanish first with bilingual structure only when already present.

## Canonical dossier composition

The professional default is `cv/dossier.html`, and the public site root must **serve that dossier directly** rather than redirecting to or retaining a separate principal portfolio. **Atelier** supplies identity and editorial tone, **Swiss Grid** supplies information architecture, **Technical Monograph** supplies evidence/technical metadata, and Scroll World remains an optional narrative layer. Compose the interactive layer with `../reactbits-portfolio-components/SKILL.md`. Do not turn the four studies into four competing canonical CVs.

The dossier must preserve the seven documented project routes, distinguish executed / active-development / demonstrator / confidential states, reuse only documented visuals, remain printable, and expose a small QA contract in `window.__CV_DOSSIER__`.

## Canonical dossier art direction

The selected dossier direction is now **IVORY ATLAS × React Tech**: true black as the structural canvas, editorial high-contrast serif typography, and a four-colour accent system sampled from the user-approved reference.

Canonical palette:

- black: `#000000`;
- burgundy: `#370001`;
- ivory: `#E2DFCF`;
- ice blue: `#BCD0D1`;
- olive: `#93884B`;
- supporting sage-gray: `#A5A999`.

Typography:

- **Instrument Serif** for `Héctor Lobato`, major section titles, project titles and large editorial statements;
- **DM Sans** for descriptive/body copy;
- **IBM Plex Mono** for technical labels, states, captions and React interaction metadata.

The colour system must be visible, not merely implied: use four-colour rules, selected card accents, interaction frames and labels. Keep the page predominantly black so the colour and React layers remain deliberate rather than decorative.

The React `TechText` treatment on **Héctor Lobato** and all major dossier titles is a primary capability demonstration. It must be visibly active at idle and become stronger under pointer interaction.

## Three typographic art directions

- **Architecture / Atelier**: Instrument Serif + DM Sans + IBM Plex Mono; paper and graphite; a portrait treated as an editorial plate; asymmetrical composition, generous whitespace, quiet rules and material colour.
- **International Typographic Style**: Archivo + Manrope + IBM Plex Mono; strict visible grid, left-aligned hierarchy, large compact headlines, numbered projects, one restrained pigment accent and obvious information density.
- **Technical Monograph**: Instrument Serif + IBM Plex Mono on deep desaturated green; precision typography, technical schematics, version metadata, evidence tags and architecture/source-system notes, without pretending UI is real telemetry.

## Approved React Bits layer

The canonical dossier uses the curated React Bits skill as a **visible capability demonstration**:
- Tech Text on **Héctor Lobato** and all major section/project titles;
- Tech Text behavior should expose letter reveal, selection frame, technical labels, specks, idle sweep and controlled drag/spring interaction;
- Particles and Waves remain visible across the full dossier and react to the pointer;
- Dither Veil on the portrait keeps the visible **normal photo / React viewer** toggle;
- Logo Loop remains a live technology/systems band below the skills section.

The React layer must be conspicuous enough to demonstrate front-end/interaction capability without reducing readability, accessibility, print fallback or reduced-motion behavior. A static screenshot should still show clear TechText evidence through outlines/selection framing; pointer movement then increases reveal intensity.

### Presentation Route

`cv/present.html` shares the canonical IVORY ATLAS identity but uses a more cinematic evidence-route layout. Compose it with `../cv-presentation-route/SKILL.md` and `../reactbits-portfolio-components/SKILL.md`.

Required:
- Instrument Serif for hero and major titles;
- DM Sans for explanatory copy;
- IBM Plex Mono for navigation, timing, labels and CTAs;
- React Bits Threads as the full-page background;
- no duplicated navigation links;
- five evidence steps / five-minute target;
- keep evidence states accurate.

## Scroll storytelling integration

Use vendored `../scroll-world/SKILL.md` for full video generation **only after verifying budget, providers and obtaining authorisation**. Use its framework-agnostic `references/scrub-engine.js` when an actual scroll-scrub world is desired. A zero-cost storyboard may use SVG still images and no videos; it must be labeled **storyboard**, not cinematic seamless camera flight. Preserve original MIT notice and identify synthetic drawings as conceptual.

## Delivery and QA gates

1. Design 3+ materially distinct directions, not just colour variants.
2. Typography first, no stock-looking templates, no gratuitous microanimations.
3. Responsive and keyboard usable, accessible focus states, logical heading order, contrast, reduced motion.
4. An easy selector page and no dead-end links. Preserve the editorial CV variants as studies, but do not restore the old principal portfolio.
5. Lighthouse/performance constraints: fonts can fail gracefully, lazy-load large images where appropriate, avoid React build/dependency unless a feature requires it.
6. Print-friendly or exportable CV is a separate deliverable; do not pretend a marketing webpage is an ATS CV.
7. Always capture screenshots and Chromium checks on desktop and mobile before merging.
8. Version through GitHub PR and merge only on green QA and a current base.
9. Do not change unrelated GAZA production surfaces as part of CV styling.

## Files

- `cv/dossier.html`: canonical integrated professional dossier.
- `cv/index.html`: editorial chooser / design studies.
- `cv/atelier.html`: architecture edition.
- `cv/swiss.html`: Swiss edition.
- `cv/monograph.html`: code/engineering edition.
- `cv/world.html`: scroll narrative storyboard.
- `cv/present.html`: 5-minute IVORY ATLAS + Threads evidence route.
- `skills/scroll-world/`: MIT upstream skill, references and engine.
