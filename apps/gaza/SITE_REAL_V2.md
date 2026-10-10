# Site Real v2 — Coreses exterior and GIS

## Navigation
Open Mission Control and select **9 · SITE REAL**, or use `mission-control.html?view=site`. Plant 3D, the original process simulation, Farm, Labs and Workflow remain separate existing surfaces. Site Real reads the canonical `gaza:operations-thread:v1` ledger and does not overwrite it.

## Implemented
- Modular Three.js scene: longitudinal grey cladding, elevated red volume, office projection/window band, red annex, white perimeter fence with two openings, roads, sidewalks, lighting, trees, signage, timber pavilion reference, cooling tanks, docks and parking.
- Two synthetic vehicle tasks: tanker via Access 2, weighbridge, reception; truck via Access 1 and dock waiting. Tractor/load orientation follows path tangents. Vehicles use +X forward. Paths, speeds, stops and capacities are scenario assumptions, not measured traffic or engineering swept-path results.
- Eight synthetic workers with articulated arms/legs on a separate walkway. No real identity or tracking.
- Camera presets, tanker follow, pause, speed, day/evening illumination, simulated rain/clouds and cutaway with proposed process areas.
- Read-only Workflow coupling: a synthetic HOLD stops the two scene vehicles; no vehicle animation writes material balances or releases a batch.
- OSM query on demand, GeoJSON import/export, per-object source and inferred-height/width inspection. Correct shared axis convention: **X east, Y up, Z south**. Original road centerlines are not spline-smoothed; roads are flat ribbons, not tubes. Polygons keep interior rings.
- Explicit error behavior: failed provider/import keeps the previous valid scene; no synthetic map silently replaces public geometry.

## What this is NOT
The photographic exterior study is **not georeferenced** and is not shown on top of OSM as though its footprint were measured. The two modes remain separate until authoritative geometry is available. The user photographs establish appearance and signage functions; they do not establish facade dimensions, entrance GPS, hidden laboratory location, dock count, routing clearances or current construction status.

No cadastral parcel, IGN ortho or LiDAR has been downloaded in this implementation. No actual OSM snapshot is bundled. Live Overpass availability and local completeness need checking from the deployed browser. No production GAZA volume is asserted.

## Data / licenses
Uses the existing `assets/gaza-logo.svg` reference asset; its metadata does not claim it is an original official vector. No Street View images are committed as textures. Three.js remains pinned to 0.180.0 with the same CDN as the existing project; browser QA serves that version from the pinned npm package. OSM output retains attribution and WGS84 geometry. Local imported files are labelled source-to-validate, not automatically official OSM.

## Reproducible QA
From `apps/gaza`:

```sh
npm install --no-audit --no-fund
npm run dev
# separate terminal
npm run qa:site
```

Core unit tests: projection/round-trip, source classifications, polygon holes, malformed geometry, radius filtering, Overpass conversion, flat roads, vehicle heading, task dwell, synthetic ledger validation.

Browser QA: actual import map, WebGL boot, draw budget, camera presets, cutaway, motion/pause, Workflow HOLD, coordinate alignment, provider failure, malformed file import, responsive width. Evidence is uploaded under `apps/gaza/.qa/site-real/`: six PNG screenshots and `report.json`. CI also keeps the previous GAZA visual and farm navigation tests.

## Next promotion gates
1. Inspect CI screenshots, not just exit code.
2. Load actual geodata and validate each footprint against authorised orthophotos/parcel data.
3. Register the red/grey model to verified coordinates; until then do not merge study geometry into OSM mode.
4. Obtain real internal circulation and dimensions before a turning-radius/clearance claim.
5. Extend per-department motion only through shared domain events, never independent fabricated production totals.
