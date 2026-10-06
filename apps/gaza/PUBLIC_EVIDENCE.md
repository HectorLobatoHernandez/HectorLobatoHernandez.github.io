# GAZA — Public Evidence / Simulation Boundary

## Confirmed public anchors
- Leche Gaza publishes **80+ own farms**.
- Current plant: **P.I. El Pinar, Parcela 10, 49530 Coreses (Zamora)**.
- Public reporting describes the Coreses site as approximately **12,000 m² of facilities on a 60,000 m² plot**.
- GAZACONTROL is publicly described by Leche Gaza as automation and monitoring of production and logistics for Industry 4.0 / productivity improvement.
- Esnova publicly describes a Leche Gaza automated warehouse with **9 storage levels**, operated with Signode StorFast shuttle carts.
- Veolia publicly describes steam/energy, water treatment, EDARI and waste-management services at the Coreses plant.
- DGT NAP publishes real-time road incidents in DATEX2 v3.7 with a stated update frequency of 1 minute.
- Open-Meteo is used for current weather at the public plant coordinate.
- OpenStreetMap + OSRM are used for map/routing geometry in the demonstrator.

## Explicitly simulated until authorised discovery
- Exact internal floor plan and building geometry.
- Exact location/identity of individual Gaza farms.
- Milk tanker fleet, collection slots and collection quantities.
- Dock count/assignment, truck IDs, customer destinations and schedules.
- ERP/PLC/MES interfaces and internal data contracts.
- OTIF, dwell, utilisation, throughput and cost values.
- Traffic congestion factor when not sourced from a traffic-aware provider.
- AI recommendations and what-if outcomes.

## Application surfaces
- `/apps/gaza/` — Operations Control Tower / warehouse twin.
- `/apps/gaza/plant-3d.html` — farm → reception → process → warehouse → staging → docks → transport 3D functional model.
- `/apps/gaza/territory.html` — real map, plant location, <50 km catchment reference, live weather and road routing.

## Missing evidence required for a true as-built 3D twin
To replace the functional 3D model with an as-built twin we need at least one authoritative geometry source: DWG/DXF/IFC/PDF floor plans, an authorised survey, or sufficiently complete georeferenced aerial/building data. Public sources currently confirm scale and systems but not the exact internal layout.


## Live-public adapters
- Strategy Twin queries Open-Meteo directly for the public Coreses coordinate; the UI shows **LIVE PUBLIC** only after a successful response.
- Territory now attempts a read-only DGT NAP CKAN → DATEX2 v3.7 pull and filters georeferenced `situationRecord` entries within 120 km of Coreses. The DGT dataset is public and states a 1-minute update frequency.
- Browser CORS/feed availability is not assumed: on failure the UI reports **NO DISP.** and does not substitute synthetic traffic as live data.
- Manual ×1.00 / ×1.15 / ×1.30 congestion controls remain explicitly synthetic what-if factors.
