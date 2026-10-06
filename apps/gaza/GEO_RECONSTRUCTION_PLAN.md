# GAZA Coreses — geospatial reconstruction plan

Updated: 2026-10-06

## Objective

Replace the current contextual campus massing progressively with georeferenced, editable geometry while preserving the evidence boundary.

There is currently **no authoritative DWG/DXF/IFC/as-built plan in the project**. Until one is supplied, the browser model must not be described as matching an as-built plant plan.

## Canonical public anchor

- Plant: P.I. El Pinar, Parcela 10, 49530 Coreses (Zamora)
- WGS84 anchor: 41.525162564246195, -5.604126176771143
- Public scale references: ~60,000 m2 plot, ~12,000 m2 facilities
- OSM industrial context: Polígono Industrial El Pinar

Suggested geospatial capture boxes around the canonical plant anchor:

- 800 m context: south 41.5179761, west -5.6137253, north 41.5323491, east -5.5945271
- 1.5 km context: south 41.5116879, west -5.6221244, north 41.5386372, east -5.5861279
- 3 km context: south 41.4982132, west -5.6401227, north 41.5521119, east -5.5681296

## Reconstruction pipeline

1. Use the installed/project-selected GeoBlender skill to acquire normalized OSM roads, areas and building footprints for the 800 m context.
2. Preserve WGS84 source coordinates and transform to a local metric origin at the canonical plant coordinate.
3. Build editable Blender collections:
   - `BLK_ROADS_PUBLIC`
   - `BLK_PARCEL_CONTEXT`
   - `BLK_BUILDINGS_OSM`
   - `BLK_SIGNAGE_CONTEXT`
   - `BLK_PLANT_INFERRED`
4. Compare public exterior photographs only as reference; never paste imagery or photogrammetry as construction geometry.
5. Keep plant buildings `INFERRED_RECONSTRUCTION` unless an authorised plan provides dimensions/footprints.
6. Export LOD0/LOD1 GLB assets through the repository manifest gate.
7. Preserve current procedural model as fallback until deterministic screenshots and render budgets pass.

## Road hierarchy to preserve

Public context currently modelled:
- N-122: Zamora ↔ Coreses ↔ Toro.
- A-11 / E-82: motorway corridor; public Coreses references identify exit 447 connection.
- ZA-P-1303: Coreses / Algodre context.
- ZA-711: Coreses / Molacillos context.
- ZA-710: Coreses / N-122 connection context.

The browser `territory.html` and `farm-network.html` remain the authority for real road geometry because they calculate/display OSM/OSRM geometry. Any Three.js road that is not derived from those coordinates must remain labelled contextual.

## Vehicle rule

All trucks must orient to the tangent of the road/path. The current procedural truck forward axis is `-X`; heading is `Math.atan2(dz,-dx)`.

## Farm scale

Do not model farms inside the campus.

Use `farm-network.html` for the <50 km collection area. Only supplier relationships supported by public evidence may be named. Exact farm pins are not inferred from municipality-level references.

## Authoritative-plan promotion

When a DWG/DXF/IFC/PDF plan is supplied:
1. archive original + checksum;
2. establish units, north, origin and revision;
3. identify authoritative layers;
4. compare against OSM/public massing;
5. rebuild plant footprint from plan;
6. mark source/revision in every exported GLB;
7. rerun all QA cameras.
