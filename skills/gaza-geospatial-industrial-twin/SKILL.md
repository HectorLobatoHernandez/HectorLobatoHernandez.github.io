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

## LIVE OPS · operator-first experience (2026-10-12)

This section supersedes earlier instructions naming Plant 3D as the active campus entry.

### Canonical workspace
- `mission-control.html` is the integrated operator workspace. `view=plant` is a compatibility alias to `view=site` and the current `site-real-preview.html`. The earlier `plant-3d.html` is retained only as historical source/regression coverage, never loaded by active navigation or Matrix.
- Use five primary concepts in Spanish: Planta, Granja, Laboratorio, Flujo/Calidad and Territorio. Keep diagnostic/GIS/integration detail secondary. Never add a separate application for a visual refinement.
- Put the shared lot, clock, run/pause, day/night and staffing controls above the maps. Make scope (working or isolated demo), simulation provenance and pending quality reviews visible. Preserve keyboard navigation and touch targets.

### One time and material system
- The validated Process Ledger V2 remains the ONLY writer of litres, genealogy, samples and decisions. Scenes project it read-only. All views share a scope-specific selected lot, clock and illumination configuration.
- `LIVING_SETTINGS` may change the lighting preview and the staffing policy, never quantities, the clock epoch or approvals. The operational epoch belongs to scenario creation. Previewing night does not move the operation to another shift: label it as a lighting preview.
- Shift windows and staff roles are synthetic configurable scenario inputs, not GAZA attendance records. Optional staffing policy gates NEW tasks/assays/quality reviews. Already-running operations are completed/handed over; do not stop heating or a moving truck merely because the employee shift ends. Holds/equipment/quality restrictions remain authoritative.
- Maintain both species, exact mass conservation and exclusive equipment booking. No auto-release in the company presentation. Simulation durations stay compressed until an authorized timing dataset exists; do not label them measured production cycle times.

### Visual craft
- Darken ambient illumination at night. Use physical PointLights with a fixed small budget, emissive fixture meshes and bounded light-pool approximations. Preserve topographic/building coordinates. No claims of lux compliance, real lamp locations or electrical design.
- Upgrade existing worker and vehicle objects rather than spawning duplicates. Reuse anatomy and uniform assets; staff identities remain fictitious roles, never inferred real employees.
- GAZA cartons must appear only against the corresponding stock, process sample or authorized shipment. A raw-milk tanker does not transport retail cartons. Visible packs are glyphs; factors and quantities are explicit. Do not duplicate the same inventory between rack, dock and truck.
- Keep logos facing outwards. Treat carton graphics, dimensions, colours and truck capacity as illustrated unless backed by a product/manufacturer source. Do not fabricate nutritional labels or claim an official packaging artwork.
- Keep the cattle cubicle alignment correction, independently oriented pasture sheep/cows, species separation and shared bookkeeping.

### Proof of completion
- Test legacy-state loading, common clock/lot propagation, midnight/shift boundaries, no new off-shift task start, no mid-operation abandonment, light-preview immutability, shipping mass and quantity-derived glyphs.
- Screenshot actual WebGL for plant night, farm night, laboratory night, operator controls and loaded trailer. Verify that no request loads the old active plant. Check mobile overflow and draw budget.
- Merge only after CI and visual review. Separately verify the public Pages deployment. A successful build or a generated image does not prove the user's application renders.
