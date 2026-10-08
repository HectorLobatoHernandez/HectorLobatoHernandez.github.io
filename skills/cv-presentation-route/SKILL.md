---
name: cv-presentation-route
description: Build and maintain Héctor Lobato's 5-minute presentation route in cv/present.html. Use for presentation typography, IVORY ATLAS palette, React Bits Threads background, evidence ordering, timing blocks, CTA/navigation cleanup and presentation-specific QA.
---

# CV Presentation Route · 5 min

## Purpose

This skill governs `cv/present.html`, the short presentation route used to explain Héctor Lobato's profile in approximately five minutes.

The page is **not** a duplicate dossier and not an ATS CV. It is a guided evidence route:
1. profile / dossier;
2. executed integration project;
3. software / operations demonstrator;
4. local-first engineering platform;
5. ATS / GitHub / evidence.

Keep the route concise and presentation-ready.

## Canonical visual language

Use the same **IVORY ATLAS × React Tech** identity as the dossier.

Palette:
- black: `#000000`;
- burgundy: `#370001`;
- ivory: `#E2DFCF`;
- ice blue: `#BCD0D1`;
- olive: `#93884B`;
- sage-gray: `#A5A999`.

Typography:
- **Instrument Serif** for hero and major titles;
- **DM Sans** for explanatory text;
- **IBM Plex Mono** for navigation, numbers, timing, labels and buttons.

The page should look related to the dossier, but more cinematic and presentation-oriented.

## React Bits background

The entire page uses **React Bits Threads** as the background surface.

Required behavior:
- fixed, full-viewport WebGL/canvas layer behind all content;
- derived from the current React Bits Threads shader language;
- primary thread colour: ice blue `#BCD0D1`;
- amplitude around `1.15`;
- distance around `0.34`;
- mouse interaction enabled;
- internal render size capped for large/high-DPI displays;
- reduced-motion mode freezes/reduces animation;
- background never intercepts pointer events.

Use `window.__CV_PRESENT_REACT__` to expose the runtime contract:
- React engine;
- palette;
- component name;
- source;
- amplitude;
- distance;
- mouse interaction;
- mount state.

## Layout

### Header
Keep it minimal:
- HL. identity;
- Dossier;
- ATS / PDF;
- Mapa.

Do not duplicate links. In particular, never render two separate `Dossier` items.

### Hero
The hero must communicate:
- presentation mode;
- 5-minute constraint;
- “Systems. / Field to / software.” editorial statement;
- short description of the route;
- recommended-use panel.

Use the IVORY / ICE / OLIVE hierarchy so the typography visibly demonstrates the selected identity.

### Five evidence blocks
Each row contains:
- index number;
- title;
- concise evidence statement;
- relevant CTA(s);
- approximate duration.

Avoid long copy. The live project pages contain the detail.

### Final cards
Keep two final messages:
- integration across tools/systems;
- evidence boundary between executed, demonstrator, local and confidential work.

## Evidence rules

Do not change factual status for presentation impact.

Preserve:
- MAR SALADA as executed/documented case;
- GAZA as public demonstrator/read-only surface;
- RHB STUDIO as public browser demo + private/local advanced runtime;
- confidential work as anonymized;
- ATS/GitHub as evidence destinations.

## Interaction and menus

Use palette details in:
- header underline;
- section rules;
- numbered rows;
- CTA hover states;
- final cards;
- timing labels.

Keep interactions restrained. Threads is the primary ambient React demonstration on this page.

## Accessibility / performance

- semantic headings and links;
- keyboard-visible controls;
- no critical content in canvas;
- canvas pointer-transparent;
- reduced motion supported;
- no horizontal overflow;
- mobile route remains readable;
- background content remains decorative only.

## QA contract

`window.__CV_PRESENT__` must expose:
- schema version;
- 5 steps;
- 5 target minutes;
- dossier / ATS / proof links;
- `palette: "IVORY_ATLAS"`;
- typography family list;
- `background: "Threads"`;
- `duplicateDossierNav: false`.

Playwright QA should verify:
- five route rows;
- Threads mounted;
- Instrument Serif is actually computed on hero/row headings;
- no duplicate Dossier navigation;
- body is black;
- Threads canvas exists and has non-zero dimensions;
- desktop/mobile have no horizontal overflow.
