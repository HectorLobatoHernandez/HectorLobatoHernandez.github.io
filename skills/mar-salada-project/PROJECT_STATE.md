# MAR SALADA — Current Project State

## Canonical identity

- Project ID: `MAR_SALADA_CDM`
- Public title: **MAR SALADA — CLUB DEL MAR PALMA**
- Public case: `projects/mar-salada.html`
- Legacy route: `projects/sound-club-palma.html`
- XXXIA legacy archive slug retained: `sound-club-palma`

## Public implementation v2.2

- React 18 long-form case page.
- GSAP + ScrollTrigger enhancement layer.
- Scroll progress + active chapter rail.
- Scroll World-style sticky visual story.
- SC08 motion-ready story stage with still fallback.
- `motion-manifest.json` controls promotion from stills to scroll-scrub master video.
- React Bits-inspired Bounce Cards gallery is public-safe and metadata-driven.
- Model Viewer shell is wired to `model-manifest.json`; 4 model slots remain `PENDING_GLB` until verified geometry is exported.
- Project technology/vendor rail uses a restrained Logo Loop pattern.
- Metadata-driven public media registry.
- Architecture/editorial visual system.
- Mobile and reduced-motion fallback.
- Public technical dossier summary under `docs/projects/mar-salada/`.
- Page-specific skill: `skills/mar-salada-react-scroll/SKILL.md`.

## Public technical content

- Venue: 326.23 m² interior / 137.08 m² exterior / 3.545 m main ceiling.
- Audio: Ecler MIMO88, 8 × TSI Hexagon 12", 8 × TSI Megatron 18", Lynx GTX DSP amplification.
- Control: Gira X1 + KNX + DALI.
- Lighting: 15 pendants, 20 track spots, 24 V DT8 DJ strip.
- Suspended structure: Ø48.3 mm installed/documented priority; Ø63 mm retained as conflicting preliminary value.
- DJ booth base dimensions: Ø2570 / Ø1200 / access 990 / step 490 / nominal height 1000 mm.

## Evidence and privacy

- Original user photos/videos: PRIVATE_REFERENCE_ONLY.
- They are not published or promoted.
- Public story only resolves `publicSafe: true` media.
- Generated boards and diagrams remain explicitly classified.
- 2300 K remains a portfolio visualization target.

## Interactive model status

- Venue / master architecture: PENDING_GLB.
- Central DJ booth: PENDING_GLB.
- Technical counter / furniture: PENDING_GLB.
- Suspended structure / decoupling: PENDING_GLB.
- Browser delivery target: GLB/glTF only; raw SKP/DWG remains private.

## Geometry status

DWG material exists, including architecture, suspended structure, anti-vibration support and DJ booth drawings.

Recover/autosave files are not authoritative by default.

SKP master: pending ingestion.

Promotion path:

`DWG + SKP → units / origin / alignment QA → verified master → drawings → web model → exploded → XXXIA`

## XXXIA

- Existing visual boards and technical diagrams are registered.
- SC08 portfolio scroll master is now wired into the React runtime.
- Current status: `PENDING_VERIFIED_GEOMETRY`; no public motion URL is set.
- Target master: ~36 s, 16:9, muted, scroll-scrub.
- No original source videos are to be uploaded.
- Motion must derive from approved generated/verified assets.

## Next implementation pass

- ingest SKP;
- verify CAD/SKP alignment;
- promote verified geometry;
- replace conceptual exploded assets where appropriate;
- render SC08 only after geometry promotion;
- set the approved SC08 URL in the motion manifest;
- let the existing React `MotionStage` activate it without restructuring the page.
