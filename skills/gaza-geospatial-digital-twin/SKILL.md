---
name: gaza-geospatial-digital-twin
description: Build and audit the GAZA Coreses geospatial/industrial twin across real roads, plant context, farm collection network, routing, trucks, signage and evidence-aware system integration.
---

# GAZA Geospatial Digital Twin

Use this skill when editing GAZA plant/territory/farm-network geometry, road context, routing, logistics vehicles, public technical evidence or integration architecture.

## Non-negotiable evidence classes

Every spatial or operational element is one of:

- `PUBLIC_REFERENCE`: supported by a public source.
- `INFERRED_RECONSTRUCTION`: reconstructed from public exterior evidence or spatial context; never call it surveyed/as-built.
- `SIMULATED`: invented operational topology, anonymous farm nodes, workers, tasks, schedules or telemetry.

Never convert an approximate municipality reference into an exact farm pin. Never infer employee live location. Public leadership can be shown by role only.

## Spatial architecture

Keep three scales separate:

1. **Plant / campus** — Coreses industrial site, reception, process, ASRS, utilities, yards and access.
2. **Territory / roads** — OSM/Leaflet/OSRM/DGT/Open-Meteo and public road names.
3. **Farm collection network** — public <50 km boundary, confirmed supplier references only where supported, otherwise anonymized synthetic nodes.

Do not place demo farms beside the factory to imply physical adjacency.

## Coordinate discipline

Canonical plant coordinate:
- lat 41.525162564246195
- lon -5.604126176771143

For browser GIS, retain WGS84 lat/lon. For local Three.js scenes, convert geodetic geometry to a local metric frame only when the source geometry is known. Preserve the source coordinate and conversion metadata.

If local road geometry is contextual rather than derived from OSM geometry, label it contextual in `userData` and UI.

## Road/routing rules

- Prefer OSM geometry and OSRM routes for public demo routing.
- Truck/HGV restrictions are not guaranteed by the public OSRM car profile. Mark HGV-specific routing as pending until a truck-capable router is configured.
- DGT route matching is geometric proximity, not official causal impact or measured congestion.
- Real road references around the current model include N-122 and A-11/E-82; use additional provincial road references only when supported by public evidence.
- Traffic signs may use real road names but must be labelled contextual unless exact sign placement is sourced.

## Vehicle orientation

Never hard-code a heading when a vehicle follows a path.

For the current truck model the authored local forward axis is `-X`. Given a normalized world tangent `(dx,dz)`, heading is:

```js
vehicle.rotation.y = Math.atan2(dz, -dx)
```

For curves, sample `curve.getTangentAt(u)` and orient every frame. Add regression QA from at least two camera angles.

## Farm network

Public statement: Gaza reports 80+ farms and milk travelling less than 50 km to the factory.

Only one currently modelled supplier reference is individually confirmed in public research:
- SAT ROTE / Toro — relationship confirmed; exact farm pin not asserted.

All other collection nodes remain synthetic/anonymized unless a source explicitly ties the farm to Gaza. Candidate collection loops are calculations, not real schedules.

## Systems discovery

Confirmed public anchors include:
- GAZACONTROL production/logistics monitoring project.
- Solmicro ERP customer reference; current product/version/modules unknown.
- Tetra Pak production-equipment supplier reference; software/interface unknown.
- Esnova + Signode StorFast 9-level ASRS.
- Veolia steam/water/EDARI/waste services.
- Official 2025 industrial-water concession: 380390 m3/year max, 25.20 l/s instantaneous max, 12.06 l/s mean equivalent.

WAU Technologies currently lists Gaza as a client and currently sells Microsoft/Siemens industrial products. Do **not** infer that Gaza uses Dynamics 365 Business Central, Opcenter APS/X, EMI Suite, Power BI or any other WAU product without project-specific evidence.

## Integration boundary

Start read-only.

```
ERP / GAZACONTROL / production / ASRS / utilities / fleet
                         ↓
               server-side adapters
                         ↓
             validation + normalization
                         ↓
              canonical twin events
                         ↓
         browser twin / analytics / agents
```

No PLC, ASRS, MES, safety or production-control writes from browser code. No credentials in the repo. Any future write path requires authorization, audit, interlocks, FAT/SAT and human approval.

## QA

For every spatial change:
- run static syntax checks;
- run manifest QA;
- use deterministic `?qa=1&freeze=1` surfaces;
- add/maintain Playwright acceptance cameras;
- inspect render budgets;
- confirm vehicle orientation visually;
- preserve procedural fallback until GLB replacement passes QA.
