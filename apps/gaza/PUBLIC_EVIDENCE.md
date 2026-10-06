## 2026-10-06 evidence expansion

### Roads / territory
- Public plant anchor used by the prototype: **41.525162564246195, -5.604126176771143**.
- Polígono Industrial El Pinar is an OSM industrial area around 41.52472, -5.59993.
- Public road context used for the model includes **N-122** (Zamora–Coreses–Toro), **A-11 / E-82** access context, and provincial Coreses references **ZA-P-1303 / ZA-711 / ZA-710**.
- Exact Three.js sign/road placement remains contextual until imported from georeferenced OSM or an authorised survey.

### Farm network
- Gaza publicly states **80+ farms** and milk travelling **less than 50 km** to the factory.
- **SAT ROTE / Toro** is currently the only individually named supplier relationship promoted into the model from public research. Public reporting confirms the supply relationship; the model deliberately uses a municipality-level reference rather than an exact farm pin.
- Other farm nodes remain synthetic/anonymized.

### Public systems / suppliers
- **Solmicro ERP**: Leche Gaza is publicly listed as an ERP customer; this does not by itself prove Solmicro is the ERP currently running in 2026. Current product, version, modules and interfaces remain unknown.
- **WAU Technologies**: currently lists Leche Gaza among clients, but the public page does not identify which WAU/Microsoft/Siemens products are deployed. Do not infer Business Central, Opcenter or EMI Suite at Gaza.
- **Tetra Pak**: 2022 public reporting identifies Tetra Pak Hispania as principal supplier of production equipment for the new installations; exact line models and automation software remain unknown.
- **Esnova + Signode StorFast**: public evidence supports a 9-level automated warehouse with Esnova racks and StorFast shuttle carts; WCS/WMS details remain unknown.
- **Veolia**: public case material supports steam/energy, water treatment, EDARI and waste-management services.

### Official water concession
BOE 2025 public values:
- 380,390 m3/year maximum annual volume.
- 25.20 l/s maximum instantaneous flow.
- 12.06 l/s mean equivalent flow.
- groundwater body 400038 Tordesillas–Toro.
- 25-year concession term.

### Public leadership roles
Textual role references only; never live-location tracking:
- **José Sánchez** — announced as president in July 2026.
- **Saúl Alonso Miñambres** — manager/gerente registered from 18 December 2025 and referenced by company communications in 2026.
- **Gustavo Andrés Martín** — public professional affiliation in commercial/international activity.
- **Roberto Vizán** — publicly described as marketing manager/responsible in September 2026.

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


## Reconstruction / environment coupling update — 2026-10-06
- The Coreses exterior in `plant-3d.html` is explicitly a **public-evidence reconstruction**, not an as-built model.
- Public visual reference includes the 2022 press photo gallery of the Coreses factory; it is used only to guide architectural massing/facade language, not to infer hidden dimensions.
- The 9-level ASRS anchor is public; rack bay geometry, shuttle paths, lift sequence, occupancy and cycle counts in the twin remain simulated.
- Internal forklifts/AGVs now use a discrete lane-cell reservation/look-ahead model to demonstrate collision avoidance. Vehicle count, routes and tasking remain synthetic.
- `territory.html` publishes a same-origin environment state containing Open-Meteo observations and DGT incidents filtered by distance to Coreses.
- DGT proximity is **not** treated as route congestion. The 3D/strategy twins convert fresh weather/DGT context into a clearly labelled heuristic simulation factor only.
- Freshness guards: weather state expires after 15 minutes; DGT state after 5 minutes in the twins. Stale data is not displayed as live.


## Evidence expansion — 2026-10-06 evening pass
- **INTERGAZA** is an official 2022 Industria Conectada project for interconnecting Leche Gaza's value chain with its environment. The public grant resolution supports the project and budget, but does not identify the deployed software product, API, database or protocol.
- **2026 operating reference:** a February 2026 interview reports approximately 150,000 L/day cow milk and 6,000–14,000 L/day sheep milk, with 55M L/year cow milk and 3M L/year sheep milk commercialized. Treat these as public operating references, not live telemetry.
- **Farm-count discrepancy is preserved:** the corporate website says 80+ own farms; the 2026 interview says 70 shareholder/member farms. The twin must show source/date context rather than silently choosing one.
- **SAT ROTE** is a publicly documented Gaza-linked dairy farm in the Toro area. Public DeLaval material documents DelPro management-software activity at SAT ROTE. This is evidence for a farm-level digital-management example, not evidence that DelPro is Gaza's central ERP/MES.
- **Solmicro:** current Zucchetti/Solmicro public customer material lists Leche Gaza among ERP customers. This supports a Solmicro ERP customer relationship, but does not establish the exact current product/version/modules/interfaces at Coreses.
- **Road signage:** a public exterior photograph shows a 20 km/h sign at/near the Gaza access. The 3D sign can therefore be labelled public-reference, but its exact reconstructed coordinate remains contextual until georeferenced evidence or survey is available.
- **Truck heading:** vehicle local forward axis is explicitly declared and aligned to road tangent by quaternion. Truck routes remain synthetic/contextual until yard/access geometry is surveyed.
