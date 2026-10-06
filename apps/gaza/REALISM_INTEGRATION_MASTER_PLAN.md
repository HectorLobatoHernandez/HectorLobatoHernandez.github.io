# GAZA Strategy Twin — realism + integration master plan

Updated: 2026-10-06

## Target architecture

### Scale A — Coreses campus
High-detail 3D plant. Public/inferred exterior, synthetic internal process until authoritative plans arrive.
Required: access roads, signage, truck turning, reception, process, packaging, ASRS, utilities, docks, parking, office/lab context.

### Scale B — farm collection network
Separate GIS surface. Plant + public <50 km planning envelope + confirmed municipality-level supplier references + anonymized scenario nodes. Road geometry/time via OSM/OSRM. Never claim scenario loops are actual collection schedules.

### Scale C — regional distribution
N-122 / A-11 and other calculated corridors, DGT incidents, weather and future TMS/GPS. Customer destinations/schedules remain synthetic until authorized.

## Realism backlog

### R1 road/vehicle fidelity
- quaternion heading from declared local forward axis;
- tractor/trailer articulation;
- vehicle wheel rotation;
- lane centerlines and turning envelopes;
- speed/sign/stop/yard markings from georeferenced evidence;
- GLB tanker, rigid truck, tractor+semi, forklift and yard tractor with LODs;
- road-surface elevation only when terrain data is introduced.

### R2 campus geometry
- replace contextual parcel with authorized DWG/DXF/IFC or surveyed footprint;
- align gate, parking, office, process hall, ASRS, utilities and docks;
- attach evidence confidence per building/asset;
- preserve a public-only mode for portfolio use.

### R3 process fidelity
- equipment register: tag, function, vendor/model only where authorized;
- milk reception/quality -> storage -> thermal treatment/UHT -> filling -> secondary packaging -> palletising -> ASRS -> dispatch;
- CIP state model;
- utility meters for steam/water/EDARI;
- lot/order/pallet lineage.

### R4 people/organization
Public role cards only: president, manager, commercial/international and marketing references.
No live employee positioning. Future internal mode may show role/shift/task pseudonyms only with authorization and privacy controls.

## Systems discovery

Public anchors:
- GAZACONTROL — production/logistics automation + monitoring.
- INTERGAZA — value-chain interconnection project.
- Solmicro — public ERP customer reference; exact current version/modules unknown.
- WAU Technologies — public customer relationship; deployed product at Gaza unknown.
- Tetra Pak — production equipment supplier reference; exact models/software unknown.
- Esnova + Signode StorFast — 9-level automated storage/shuttle system.
- Veolia — steam/energy, water treatment, EDARI, waste.
- SAT ROTE / DeLaval DelPro — farm-level digital-management reference, not central Gaza software.

## Read-only integration implementation

Phase 0: inventory + owners + versions + interfaces + network zones + time sync + IDs.
Phase 1: server-side read adapters; no browser credentials; no writes.
Phase 2: canonical entities/events + source/quality/provenance.
Phase 3: correlate ERP order ↔ production batch ↔ pallet ↔ ASRS task ↔ dock ↔ shipment ↔ route.
Phase 4: predictive ETA/capacity/energy/maintenance.
Phase 5: recommendations with human approval.
Any control/write project is separate and requires authorization, audit, interlocks and safety review.

## Canonical IDs
farm_id, collection_run_id, milk_lot_id, quality_sample_id, production_order_id, batch_id, sku_id, pallet_id, asrs_task_id, dock_id, shipment_id, vehicle_id, asset_id, utility_meter_id, alarm_id.

## Acceptance gates
1. Evidence/provenance complete.
2. Geometry source declared.
3. No synthetic value labelled real.
4. Route geometry follows road network.
5. Vehicles face path tangent.
6. Desktop/mobile visual QA.
7. WebGL budget passes.
8. Integration adapters read-only.
9. Credentials absent from repo/browser.
10. Authorized data can be removed without breaking public demo.


## Implemented 2026-10-06 — campus access reality pass
- Canonical plant anchor remains 41.52355, -5.59993 (user-confirmed approximate; not surveyed).
- Campus GIS derives a nearest-public-road access candidate directly from OSM geometry.
- Real gate coordinates remain explicitly unknown.
- Preliminary HGV manoeuvre overlay uses regulatory reference circles: outer 12.50 m, inner 5.30 m.
- Spanish design classes recorded for 12.00 m rigid, 16.50 m articulated and 18.75 m road-train envelopes.
- Plant 3D now treats Campus GIS as access authority and is prohibited by QA from presenting contextual access geometry as as-built.
- Next geometry gate: authorised gate/kerb/building/dock coordinates or DWG/DXF/IFC, then vehicle-specific swept-path analysis.


## Implemented 2026-10-06 — environmental field pass
- Open-Meteo base state expanded to temperature, RH, surface pressure, cloud cover, precipitation, wind speed/direction and gust.
- Plant 3D adds a wind vector field and eight proposed perimeter weather nodes.
- Current field remains a public-grid operational visualisation, explicitly NOT CFD.
- Proposed sensor nodes are design positions only; future real mode requires calibrated instruments, siting review, gateway ingestion, time synchronisation and commissioning.
- Environmental data is read-only context. No automatic HVAC/process/safety actuation is permitted in this phase.
