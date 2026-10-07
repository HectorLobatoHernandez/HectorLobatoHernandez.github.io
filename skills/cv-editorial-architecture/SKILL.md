---
name: cv-editorial-architecture
description: Design elegant, typographically rigorous technical curricula and engineering portfolios inspired by architectural publishing, the Swiss Style and software documentation. Prefer semantic HTML/CSS/vanilla JS; select motion only where it improves reading. Use when the user asks for an architecture-oriented CV, an engineering presentation, a portfolio design review or several visual design alternatives.
---

# CV Editorial · Architecture × Software

## Intent

Design a portfolio that a serious architecture studio, engineering director or software team could read. This **supersedes neon / glitch / terminal spectacle as the default CV art direction**. Keep the prior React Bits experiments as archival options, not the user's selected professional identity.

## Source of truth

Reuse the existing portfolio and case studies for factual content. Do not invent degrees, employment dates, metrics, clients, deployment status or certifications. Separate executed projects from prototypes, public data, simulated data and proposed systems. Support Spanish first with bilingual structure only when already present.

## Three typographic art directions

- **Architecture / Atelier**: Instrument Serif + DM Sans + IBM Plex Mono; paper and graphite; a portrait treated as an editorial plate; asymmetrical composition, generous whitespace, quiet rules and material colour.
- **International Typographic Style**: Archivo + Manrope + IBM Plex Mono; strict visible grid, left-aligned hierarchy, large compact headlines, numbered projects, one restrained pigment accent and obvious information density.
- **Technical Monograph**: Instrument Serif + IBM Plex Mono on deep desaturated green; precision typography, technical schematics, version metadata, evidence tags and architecture/source-system notes, without pretending UI is real telemetry.

## Scroll storytelling integration

Use vendored `../scroll-world/SKILL.md` for full video generation **only after verifying budget, providers and obtaining authorisation**. Use its framework-agnostic `references/scrub-engine.js` when an actual scroll-scrub world is desired. A zero-cost storyboard may use SVG still images and no videos; it must be labeled **storyboard**, not cinematic seamless camera flight. Preserve original MIT notice and identify synthetic drawings as conceptual.

## Delivery and QA gates

1. Design 3+ materially distinct directions, not just colour variants.
2. Typography first, no stock-looking templates, no gratuitous microanimations.
3. Responsive and keyboard usable, accessible focus states, logical heading order, contrast, reduced motion.
4. An easy selector page and no dead-end links. Preserve classic CV and the archived React experiment.
5. Lighthouse/performance constraints: fonts can fail gracefully, lazy-load large images where appropriate, avoid React build/dependency unless a feature requires it.
6. Print-friendly or exportable CV is a separate deliverable; do not pretend a marketing webpage is an ATS CV.
7. Always capture screenshots and Chromium checks on desktop and mobile before merging.
8. Version through GitHub PR and merge only on green QA and a current base.
9. Do not change unrelated GAZA production surfaces as part of CV styling.

## Files

- `cv/index.html`: editorial chooser.
- `cv/atelier.html`: architecture edition.
- `cv/swiss.html`: Swiss edition.
- `cv/monograph.html`: code/engineering edition.
- `cv/world.html`: scroll narrative storyboard.
- `skills/scroll-world/`: MIT upstream skill, references and engine.
