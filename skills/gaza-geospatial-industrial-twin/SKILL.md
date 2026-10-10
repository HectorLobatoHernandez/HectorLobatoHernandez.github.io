---
name: gaza-geospatial-industrial-twin
description: Build and validate the GAZA Coreses geospatial/industrial digital twin using public evidence, OSM/OSRM/DGT, Blender/glTF/Three.js and read-only industrial integration.
---

# GAZA Geospatial + Industrial Twin

## Mission
Turn public geospatial/industrial evidence into a reproducible twin without inventing as-built geometry, private farm locations, OT tags, employee tracking or vendor software.

## Evidence classes
- PUBLIC_REFERENCE: directly supported by a cited public source.
- INFERRED_RECONSTRUCTION: geometry reconstructed from public imagery/maps; never call it surveyed/as-built.
- SIMULATED: people, vehicle tasks, internal routes, process states, KPIs, schedules and topology not publicly documented.
- REAL_AUTHORIZED: reserved for future customer-authorized feeds.

## GIS workflow
1. Prefer authoritative/open sources: official company/government, OSM, DGT NAP, IGN/CNIG when usable.
2. Record source URL, retrieval date, CRS and precision.
3. Use WGS84 for interchange; use a metric CRS for distance/area analysis.
4. Route vehicles on road graph geometry, not straight lines.
5. Never publish an exact farm pin unless it is publicly confirmed and necessary. Municipality-level references are preferred.
6. Keep the public '<50 km' milk proximity claim separate from calculated route distance.
7. Traffic-sign placement in 3D is contextual unless a georeferenced survey/photo confirms the exact sign position.

## Vehicle orientation
- Every vehicle asset declares its local forward axis.
- Align that axis to the normalized road tangent using a quaternion.
- Test heading at start, turns and reverse route.
- Tractor/trailer articulation is a future enhancement; do not fake it as measured kinematics.

## Industrial systems workflow
Publicly supported anchors currently include GAZACONTROL, INTERGAZA, Solmicro customer reference, Tetra Pak equipment reference, Esnova + Signode StorFast ASRS and Veolia utilities.
Do not infer product versions, PLC/SCADA/MES/WMS software or protocols without evidence.

## Integration boundary
Real systems -> read-only adapter -> canonical event -> quality/provenance -> twin.
Browser must never receive PLC/DB credentials or direct safety/control write endpoints.
Writes remain disabled until a separately authorized, audited control project exists.

## Visual acceptance
Required cameras: exterior, roads/access, process, ASRS, docks, farm-network/territory.
Check road-following headings, labels, provenance legend, mobile UI, render budget and deterministic QA.


## Farm master scene + in-plant laboratory (2026-10-09)

- Campus 3D `apps/gaza/plant-3d.html` is the canonical entry point. Virtual farm node expands to `mission-control.html?view=farm` and the laboratory (physically in the plant campus **only as a proposed location until validated**) expands to `?view=labs`. Never relocate the laboratory to the Zamora virtual farm.
- The Zamora farm is a **fictional consolidation of the dairy procurement network**. The old site, Zamora castle, cathedral and historical buildings are reference context, not confirmation of a current farm. Treat facade/photo impressions as inferred without surveying their dimensions or orientation.
- Use `runtime/master-farm-contract.js` for aggregate training parameters. No real GAZA production throughput, number of active farms per period or raw volumes are available; require scenario inputs and label outputs `SIMULATED`.
- One canonical lot lifecycle: animal/welfare → milking → bulk cold tank → collection → tanker → plant reception → quality lab → production → warehouse → dispatch. Only allow simulated decisions; never infer an authorization to release a real batch.
- Visual targets: station-level cutaway, named equipment, staff avatars as fictional roles, animals with non-identifying states, tankers following valid route geometry, quality incidents, weather sourced separately, castle/cathedral silhouette with geometry provenance and explicit conceptual status.
- Scene asset gates: source and license; glTF validation; performant LOD/instancing; procedural fallback; deterministic camera + screenshots; trainable interaction smoke QA. Avoid expensive generative-video services by default.
- Public weather must not be labelled as on-site instrumentation; synthetic traffic must remain distinct from DGT road events.
- Do not merge a new feature PR before browser QA is green, including original Plant 3D and Mission Control regressions.
