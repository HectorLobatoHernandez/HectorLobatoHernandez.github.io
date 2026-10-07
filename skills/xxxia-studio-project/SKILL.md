# XXXIA STUDIO — Project Skill v1.1

## Mission

Project-specific operating skill for **XXXIA STUDIO**, the visual-production system used to turn project references and verified geometry into controlled boards, exploded views, storyboards and motion.

Use before changing:
- `projects/xxxia-studio.html`
- `assets/js/xxxia-studio-case.js`
- `assets/css/xxxia-studio-case.css`
- `xxxia-studio/metadata/public-manifest.json`
- `xxxia-studio/`
- project production manifests
- storyboards / prompts / visual-production QA.

## Identity

- Canonical title: **XXXIA STUDIO**
- Public case: `projects/xxxia-studio.html`
- Production console: `xxxia-studio/`
- Type: visual-production / AI / motion / project communication.

## Public React implementation

Current public page stack:
- React 18 UMD
- GSAP + ScrollTrigger
- manifest-driven selected-case data
- React Bits-inspired Bounce Cards / Logo Loop patterns
- explicit motion-state surface for SC08
- responsive/reduced-motion fallbacks
- Playwright QA in `xxxia-studio/tests/public-case-qa.mjs`

The public page must not link the production console by default. The console remains an internal production/development surface.

## Core pipeline

`references → brief → storyboard → generate → QA → archive → project embed`

Where geometry matters:
`CAD/SKP master → verified geometry → controlled visual production`

## Public / internal boundary

The public XXXIA page explains the studio and selected outcomes.

The production console, provider metadata, private source references and job internals are development/production surfaces. Do not expose them in unrelated public project pages unless there is a strong reason.

## Evidence / provenance

Always distinguish:
- PRIVATE_REFERENCE_ONLY
- GENERATED_CONCEPT
- GENERATED_DIAGRAM
- GENERATED_MOTION
- VERIFIED_DRAWING
- VERIFIED_FINAL_PHOTO

Never publish an original user-supplied private video merely because it was used as production reference.

## Visual direction

XXXIA may be more expressive than the technical project pages, but must remain controlled:
- editorial;
- cinematic;
- provenance-aware;
- asset/version oriented;
- no random AI-gallery look.

Compose with:
- React Bits gallery / motion patterns;
- Scroll World for frame-locked narrative;
- project-specific skills for technical truth.

## Current public case

The selected public case is **MAR SALADA — CLUB DEL MAR PALMA** and consumes its `publicSafe` media registry.

Current SC08 status remains `PENDING_VERIFIED_GEOMETRY`. No public motion video should appear until the master is promoted to `APPROVED`.

## Next development pass

1. turn SC08 into the first full Scroll World master when verified geometry is ready;
2. add additional project lots without mixing their evidence or visual languages;
3. expose curated archive history without leaking provider secrets or private references;
4. preserve provider independence, cost/provenance metadata and reproducibility;
5. add motion comparison / version review only when useful to the public story.
