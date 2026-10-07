# MAR SALADA — CLUB DEL MAR PALMA

## Public technical dossier · repository summary

**Project ID:** `MAR_SALADA_CDM`  
**Status:** consolidated technical case study / as-built documentary layer  
**Public page:** `/projects/mar-salada.html`

## Scope

Integrated professional audio, lighting, KNX/DALI control, technical furniture, suspended structure, anti-vibration measures and commissioning documentation for a hospitality / club venue in Palma.

### Documented venue metrics

- Interior area: **326.23 m²**
- Exterior area: **137.08 m²**
- Main ceiling height: **3.545 m**
- Use: hospitality / restaurant / club / DJ / terrace

## Audio architecture

- Ecler MIMO88 matrix / DSP
- 8 × TSI Hexagon Top 12"
- 8 × TSI Megatron Sub 18"
- 2 × Lynx GTX 5K DSP
- 2 × Lynx GTX 14K DSP for interior subs
- 1 × Lynx GTX 14K DSP for exterior system
- Interior / Exterior zoning
- Restaurant / Club operating presets
- Dual limiter concept: interior + exterior

## Lighting and control

- Gira X1
- KNX + DALI
- 15 decorative pendants
- 20 track spots
- 24 V DJ strip via DALI DT8
- future DMX integration path

## Suspended structure / anti-vibration

Current documentary priority:

- structural pipe **Ø48.3 mm**
- spring anti-vibration suspension
- threaded rod / clamp suspension
- tube-compatible clamps in the 48–51 mm family

A preliminary document referenced Ø63 mm. That value is retained as a conflict until CAD/SKP master geometry is verified.

## DJ booth

Documented base dimensions:

- exterior diameter: **2570 mm**
- interior void: **1200 mm**
- access: **990 mm**
- lateral step: **490 mm**
- nominal height: **1000 mm**

Generated geometry is not promoted as fabrication/as-built geometry until checked against the master CAD/SKP files.

## Evidence policy

Original user-supplied photos and videos are **PRIVATE_REFERENCE_ONLY**.

They must not be:
- committed to GitHub;
- embedded in the public site;
- exposed through public metadata;
- reused as final public media.

The public page uses only:
- documented facts;
- generated technical diagrams;
- generated concept boards;
- future verified drawings / verified final photography.

## Canonical visual pipeline

`DWG + SKP → geometry QA → verified master → drawings → web model → exploded components → 2300 K portfolio visualization → XXXIA sequences → approved GitHub release`

2300 K is a **portfolio visualization target**. It is not silently substituted for technical/as-built lighting values.

## React / Scroll implementation

The public case is a buildless React 18 page enhanced with GSAP + ScrollTrigger and a metadata-driven Scroll World story.

Operating skill:

`skills/mar-salada-react-scroll/SKILL.md`

Project state:

`skills/mar-salada-project/PROJECT_STATE.md`
