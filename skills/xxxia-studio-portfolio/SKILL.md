---
name: xxxia-studio-portfolio
description: Build and maintain the public XXXIA STUDIO portfolio/production case as a creative-technical system for visual generation, storyboards, motion, provenance and project media without confusing generated concepts with verified project evidence.
---

# XXXIA STUDIO — Public Portfolio Skill

## Mission

Present **XXXIA STUDIO** as the visual production layer used by the portfolio to turn controlled project information into:

- architectural boards;
- exploded views;
- technical visualizations;
- storyboards;
- motion masters;
- project galleries;
- media manifests;
- provenance-aware public assets.

Public page:

- `projects/xxxia-studio.html`

Technical production console:

- `xxxia-studio/index.html`

Production-engine contract:

- `../xxxia-visual-production/SKILL.md`

React component patterns:

- `../reactbits-portfolio-components/SKILL.md`

## Identity

- Name: **XXXIA STUDIO**
- Type: visual / AI production studio
- Role: reusable production engine across multiple projects
- Current canonical live project: **MAR SALADA — CLUB DEL MAR PALMA**
- Legacy archive slug `sound-club-palma` may remain internally until controlled migration.

Do not publicly revert the project to “Sound Club, Palma”.

## Two surfaces, two jobs

### Public studio page
Creative/editorial presentation:
- selected projects;
- visual language;
- pipeline;
- approved outputs;
- project navigation.

### Production console
Operational/provenance presentation:
- briefs;
- storyboards;
- prompts;
- generation jobs;
- media registry;
- archive status;
- QA.

Do not combine both into a single overloaded page.

## Required public narrative

1. Studio identity
2. What XXXIA produces
3. Production pipeline
4. Current project — MAR SALADA
5. Approved boards / Bounce Cards gallery
6. SC08 / motion architecture
7. Provider-independent production model
8. Archive / provenance
9. Future project slots

## React Bits composition

### Bounce Cards
Primary gallery interaction for approved visual outputs.

### Logo Loop
Use for actual production/runtime stack when useful:
- React
- GSAP
- GitHub
- provider adapters
- image/video generation engines that are actually registered

Do not show a provider logo merely because it is theoretically supported.

### Model Viewer
Use only when XXXIA presents a generated/verified 3D asset itself. Project-owned 3D viewing normally belongs on the project page.

### Particles / Tech Text
Use only as a subtle studio identity accent; do not clone the personal CV hero.

## Provenance contract

Every public asset must keep:

- stable media ID;
- project ID;
- classification;
- publicSafe flag;
- provider/model/job metadata when applicable;
- archive status;
- source/reference policy.

Allowed classes include:

- GENERATED_CONCEPT
- GENERATED_DIAGRAM
- GENERATED_MOTION
- DOCUMENTED_REFERENCE
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

Never silently upgrade a generated concept into verified evidence.

## Privacy

Original private source videos/photos are references only unless explicitly approved for public publication.

For MAR SALADA specifically:

- original supplied videos remain `PRIVATE_REFERENCE_ONLY`;
- current public story uses generated boards/diagrams;
- SC08 derives from approved/verified assets;
- raw CAD/SKP remains private.

## Project onboarding contract

Each new XXXIA project should have:

```
projects/<project-slug>/
  01_briefs/
  02_storyboards/
  03_prompts/
  04_outputs/
  05_metadata/
```

Metadata should include project media and, where relevant:

- motion manifest;
- model manifest;
- generation jobs;
- asset index.

## Future portfolio projects

Akasha / Las Dalias and Casa NOAH should receive their **own project skills and evidence manifests** once their photographs, project facts and publication boundaries are supplied.

Do not invent their scope while evidence is pending.

## QA

1. canonical project names correct;
2. publicSafe filtering enforced;
3. no private source path exposed;
4. generated/verified classes visible;
5. current project counts match manifests;
6. no dead links to retired Sound Club route except intentional redirect/archive compatibility;
7. mobile/reduced-motion usable;
8. visual output has provenance;
9. production console and public studio page remain distinct.
