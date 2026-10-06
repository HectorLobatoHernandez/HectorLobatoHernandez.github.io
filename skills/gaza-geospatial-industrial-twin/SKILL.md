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
