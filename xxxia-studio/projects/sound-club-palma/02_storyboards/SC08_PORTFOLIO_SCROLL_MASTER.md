# SC08 — PORTFOLIO SCROLL MASTER

## Status

**BRIEF_READY / PENDING_VERIFIED_GEOMETRY**

Target public surface:
`projects/mar-salada.html`

The React page is already motion-ready. Until a master MP4 is approved, it falls back to the current public-safe still/diagram story.

## Purpose

SC08 is the single motion spine for the MAR SALADA case study. It must explain the project as **architecture + systems + fabrication + as-built engineering**, not as a music-video montage.

## Source hierarchy

1. VERIFIED CAD/SKP master geometry.
2. Verified technical drawings and dimensions.
3. Approved generated boards/diagrams.
4. Private source photos/videos only as non-public visual reference.

Original user-supplied photos/videos are `PRIVATE_REFERENCE_ONLY`: never publish, commit, embed or link them.

Recovered/autosave CAD files are not authoritative until QA promotes them.

## Master format

- ID: `SC08-MASTER`
- Classification: `GENERATED_MOTION`
- Desktop: 16:9
- Target duration: ~36 s
- Audio: muted by default
- Page behaviour: scroll-scrub
- Motion architecture: one continuous architectural journey, or frame-locked legs assembled into one master
- Current page manifest: `05_metadata/motion-manifest.json`

## Timeline / story mapping

| Time | Story media | Sequence |
|---|---|---|
| 00–04 s | SC-BOARD-01 | Architecture / venue overview |
| 04–08 s | SC-BOARD-02 | Building separates into technical layers |
| 08–11 s | SC-PLAN-01 | Lighting / hospitality zoning |
| 11–15 s | SC-BOARD-04 | Central DJ booth exploded |
| 15–18 s | SC-DETAIL-04 | Documented DJ booth dimensions |
| 18–22 s | SC-BOARD-05 | 2300 K portfolio lighting transition |
| 22–26 s | SC-PLAN-02 | Audio distribution / Interior vs Exterior |
| 26–29 s | SC-PLAN-03 | KNX + DALI control topology |
| 29–33 s | SC-DETAIL-07 | Spring isolator / threaded rod / clamp / Ø48.3 mm tube |
| 33–36 s | SC-SYS-01 | Systems converge and venue reassembles |

## Camera grammar

Preferred camera once geometry is verified:

- continuous architectural glide;
- forward continuity at every seam;
- restrained crane / lateral / orbit only inside a leg;
- final ~1 s of every leg settles into the same slow forward drift used by the next leg;
- preserve real scale and room proportions;
- no jump cuts;
- no aggressive gaming orbit;
- no fake people;
- no invented logos/signage;
- no impossible wall/ceiling deformation unless explicitly used to explain an exploded layer.

For multi-clip generation, every handoff must be frame-locked or crossfaded only after QA.

## Visual language

- architecture/editorial;
- warm timber;
- dark metal;
- mineral/concrete surfaces;
- muted brass technical linework;
- restrained cyan/teal external contrast;
- 2300 K only as **portfolio visualization language**;
- technical/as-built CCT values remain separate.

## Technical overlays allowed

Only factual overlays already supported by the project data:

- Ecler MIMO88;
- Lynx GTX DSP;
- Gira X1;
- KNX + DALI;
- Interior / Exterior zones;
- Restaurant / Club presets;
- suspended structural pipe Ø48.3 mm as current documented priority;
- spring anti-vibration suspension;
- threaded rod / clamp;
- DJ booth documented base dimensions.

Do not show Ø63 mm as the final installed value; retain it only as a documented preliminary conflict.

## Promotion gate

SC08 cannot move to `APPROVED` until:

1. DWG/SKP units, origin and alignment are checked;
2. master geometry is identified;
3. generated technical labels are reviewed;
4. scroll-scrub timing is checked on desktop and mobile fallback;
5. public media registry gets an explicit `publicSafe: true` entry.

## Output contract

When rendered and approved:

- H.264 MP4 desktop master;
- poster frame;
- stable media ID;
- provider/model/job provenance;
- exact duration;
- no original private media embedded;
- add master URL to `motion-manifest.json`;
- add public-safe asset to `project-media.json`;
- run MAR SALADA React Case QA before merge.
