# GAZA Operations Intelligence

Synthetic Logistics Control Tower · Digital Twin · AI Decision Support demonstrator.

## Current MVP
- Isometric operational twin with ASRS, staging, docks, trucks, forklifts and pallet flow.
- OPERATIONS / FLOW / RISK visual layers.
- Simulation clock, pause/resume and speed control.
- Guided end-to-end demo with operational phase rail.
- Orders and expeditions table with search/filter and synthetic order injection.
- Scenario Lab for missing pallets, carrier delay, dock blockage and incomplete documentation.
- Current-vs-proposed KPI comparison.
- Human approval / rejection.
- Event audit trail and JSON export.
- Interactive asset selection and inspector.
- Responsive desktop/tablet/mobile layout.
- Fullscreen presentation mode, keyboard controls and `?demo=1` auto-play URL.

## Canonical demo
`Order → Gate → Exception → Optimise → Human approval → Replan/load → Dispatch`

The default scenario reproduces a synthetic 18-pallet expedition where two pallets are missing while the truck is already on site. The system evaluates an alternative, proposes D4, waits for human approval, updates the synthetic twin and records the decision.

## Governance
This is a concept demonstrator grounded in public evidence. Public location/road/system facts, inferred reconstruction and simulated operations are tagged separately. It does not contain authorised internal Leche GAZA telemetry and does not control PLCs, MES or ASRS equipment. A real deployment must begin with validated data contracts and read-only integration.

See `TEST_PLAN.md` for acceptance tests.

## Presentation controls
- `D`: run guided demo.
- `Space`: pause/resume simulation.
- `1 / 2 / 3`: Operations / Flow / Risk layers.
- `R`: reset.
- `?demo=1`: automatically starts the guided sequence after load.

## Current surfaces
- `plant-3d.html`: Coreses campus 3D with articulated tractor/semi vehicles, contextual access, process, ASRS, utilities and docks. Farms are hidden from the campus by default.
- `campus-gis.html`: real-coordinate OSM/Overpass campus context around Parcela 10, plus OSRM corridor calculations. This is the road/position authority until surveyed CAD/GIS arrives.
- `territory.html`: OSM/OSRM territory and routing + live Open-Meteo + DGT route-corridor context.
- `farm-network.html`: separate <50 km milk-collection network with real-road OSRM candidate circuits and explicit confirmed/anonymized node classes.
- `systems.html`: verified public software/OT evidence, public leadership roles and read-only coupling architecture.
- `PUBLIC_EVIDENCE.md`: source/simulation boundary and requirements for an as-built twin.
- `GEO_RECONSTRUCTION_PLAN.md`: georeferenced Blender/OSM reconstruction plan for replacing contextual massing.


## Strategy Twin
`game.html` is the reference-video-oriented strategy view. The current vertical slice is deterministic and spatial: anonymised farm node → tanker route → reception/quality → forklift pallet task → animated dock → outbound truck. Vehicle/task values remain synthetic; the public anchors are the 80+ farm network, Coreses site identity and documented systems listed in `PUBLIC_EVIDENCE.md`.


## v9 geospatial + systems fidelity
- `territory.html` is the public-data environment producer: Open-Meteo + OSRM + DGT DATEX2 + synthetic what-if traffic.
- DGT incidents are matched geometrically against the OSRM demo-route corridors. `routeRisk` is a spatial heuristic, not official confirmation of impact or measured congestion.
- `plant-3d.html` now includes a detailed synthetic process layer, CIP/process tanks, pasteurisation reference, packaging, conveyors, palletising/wrapping, product-flow state, 9-level ASRS, lane-reserved agents, PPE workforce, detailed tractor-trailers, tanker reception/weighbridge, docks and inferred exterior context.
- Truck orientation follows path tangents instead of fixed headings.
- N-122/A-11 context and traffic signage are separated from exact OSM geometry; `territory.html` remains the road-geometry authority.
- Public technical facts now include the 2025 industrial-water concession, Solmicro ERP reference, GAZACONTROL, Tetra Pak equipment reference, Esnova/Signode StorFast ASRS and Veolia utilities.
- `data/integration-adapters.json` defines a read-only discovery contract; unverified products/protocols remain explicitly unknown.
- `game.html` adds an x-ray process view while retaining the deterministic guided farm-to-dispatch presentation.
- `runtime/asset-registry.js` provides the production GLB/glTF promotion path with license/provenance enforcement and procedural fallback.
- Both WebGL twins publish machine-readable state through `window.__GAZA_TWIN_STATE__` and render metrics through `window.__GAZA_RENDER_STATS__`.
- `?camera=...&freeze=1&qa=1&debug=1` enables deterministic review surfaces.
- GitHub Actions runs Playwright visual QA with screenshots, GLB/telemetry checks and conservative WebGL render budgets.

See `ARCHITECTURE.md` for runtime contracts and the read-only-first industrial integration boundary.


## v10 GIS + integration contract
- Added `campus-gis.html` so exact public OSM geometry is no longer conflated with the conceptual 3D parcel.
- Plant trucks use an explicit -X forward-axis contract, quaternion tangent alignment and a separately articulated semitrailer tangent.
- Farm Network adds an OSRM Trip optimization scenario across the demo nodes. It is labelled calculated/synthetic and never presented as an actual collection schedule.
- Systems surface exposes the discovery checklist and canonical IDs needed to correlate ERP/MES/quality/ASRS/docks/routes/utilities.
- Public evidence includes INTERGAZA and the SAT ROTE / DeLaval DelPro farm-management reference with scope restrictions.
- `data/geospatial-baseline.json` is the machine-readable GIS provenance manifest.
- `skills/gaza-geospatial-industrial-twin/SKILL.md` and `GIS_AGENT_STACK.md` define the GIS/3D agent discipline and selected external skill stack.
- Visual QA now covers Campus GIS, the articulated truck contract and the integration discovery contract.


## v11 campus access reality pass
- `data/campus-operations-contract.json` separates regulatory HGV design envelopes from any claim about the real GAZA fleet.
- `campus-gis.html` now calculates the nearest point on loaded OSM highway geometry to the canonical plant anchor and labels it explicitly as an access candidate, never as the confirmed gate.
- The GIS view renders a 12.50 m / 5.30 m manoeuvrability envelope for preliminary swept-path sanity checking and exports the calculated candidate with provenance.
- `plant-3d.html` delegates access authority to Campus GIS and keeps the real gate status UNKNOWN until authorised CAD/topography is available.
- Domain and visual QA lock these boundaries so later visual work cannot silently turn contextual access geometry into an as-built claim.


## v12 environmental field
- Territory and Plant 3D now request temperature, humidity, pressure, cloud cover, precipitation, wind speed, wind direction and gust from Open-Meteo.
- Plant 3D renders a live wind-vector field using the public weather grid and publishes `window.__GAZA_ENV_FIELD__`.
- Eight `WX-PROP-01…08` perimeter sensor positions are visualised as proposed instrumentation only; they do not impersonate installed sensors.
- The vector field is explicitly `UNIFORM_VECTOR_FIELD_NOT_CFD`: no building-wake physics, terrain CFD, plume model or safety control is claimed.
- `data/environment-field-contract.json` defines the future path for calibrated on-site instrumentation and read-only gateway ingestion.


## v13 GIS 3D alignment lab
- `gis-3d-overlay.html` is a dedicated Three.js spatial-alignment surface for public OSM context.
- `runtime/public-gis-overlay.js` requests roads, buildings and industrial land-use around the canonical plant anchor and converts WGS84 to local metric X-east / Z-north coordinates.
- Major OSM roads are rendered separately from contextual building extrusions; GAZA-tagged OSM candidates are highlighted but remain `NOT AS-BUILT`.
- A deterministic local QA fixture makes visual tests independent of Overpass availability.
- This page is intentionally separate from the production Plant 3D until public GIS alignment is reviewed; after approval, the same runtime can replace contextual road/building geometry incrementally.

## Seguimiento de flota SIM (2026-10-15)

`mission-control.html?view=fleet` abre `fleet-tracking.html`. Las rutas públicas se calculan con OSRM cuando responde; el trazado alternativo es esquemático y se marca así. Identidades, coordenadas instantáneas, paradas, combustible, peajes, pagos y retrasos son eventos de demostración, sin conexión GPS ni prueba de peajes o restricciones HGV. La vista de Site Real ofrece Día, Noche + luces y Horario SIM independientemente del reloj real. El tráfico escénico continúa cuando no hay una tarea de transporte activa en el ledger, sin alterar el estado del lote.

## Flota SIM · vista 3D, respaldo y Blender (v8)

La vista Flota funciona sin WebGL: el Canvas 2D respalda una escena Three.js tridimensional cuando hay GPU. Ambas usan ocho trayectos sintéticos y los ejes OSRM públicos cacheados del 15/10/2026; la aplicación intenta actualizar esos ejes cuando responde el servicio con paradas sincronizadas. El botón OSM 2D usa Leaflet como capa opcional. Si OSRM o Leaflet no responden, los ejes restantes se marcan como esquemáticos; nunca se presentan como carreteras validadas. Planta Site Real abre una representación isométrica operativa de respaldo cuando no hay WebGL. La selección Día/Noche y el movimiento funcionan también en este modo.

Para preparar una escena editable en Blender, abre Flota SIM, espera a que las rutas indiquen OSRM y pulsa «Exportar rutas para Blender». Con Blender 4.x: `blender -b --python apps/gaza/tools/blender/generate_fleet_scene.py -- apps/gaza/data/fleet-routes-osrm-20261015.json gaza-fleet-scene.blend`. También puedes sustituir el JSON por la exportación actualizada desde la página. El script crea vías a partir del JSON exportado, diez camiones de maqueta, animación y cámara ortográfica. También se incluye `assets/models/gaza-fleet-routes-20261015.glb`, un modelo GLB importable en Blender con los diez ejes OSRM y vehículos animados. Puedes regenerarlo con `python apps/gaza/tools/blender/export_fleet_glb.py apps/gaza/data/fleet-routes-osrm-20261015.json apps/gaza/assets/models/gaza-fleet-routes-20261015.glb`. Las geometrías escénicas son inferidas; no representan datos internos de GAZA.

## Escenas conectadas y horario de España (v12)

El control «Luz real · España» usa la hora civil Europe/Madrid para el aspecto de planta, granja, laboratorio y flota; «Horario SIM» conserva la hora del proceso comprimido. Día, atardecer y noche son vistas manuales independientes de la hora. La iluminación y las rondas visuales no escriben cantidades ni ensayos. Si el registro local antiguo es incompatible, la escena sigue visible y se ofrece archivar el JSON original antes de iniciar un escenario SIM nuevo. La vista de flota añade Fresno de la Ribera y Morales de Toro como trayectos sobre subtramos OSRM conservados; terminan a 267 y 852 m aproximadamente del centro municipal citado, por lo que no constituyen acceso exacto a una granja. Otros puntos de municipio son contexto cartográfico sin identidad de explotación.

### Escena v13 · flota y granja

En Flota SIM, «Seguir vehículo» acerca el corredor 3D/Canvas a la carretera OSRM y «OSM 2D» permite cotejar la ruta. Los letreros son recreaciones contextuales; una referencia de vía aparece solo cuando OSRM devuelve el `ref` de los pasos. El enlace «Avisos DGT en Territorio» abre el estado oficial cuando está disponible. En Granja, «Vida SIM» anima los rebaños y dos vehículos de acceso propuestos aun si el proceso está en pausa. El movimiento visual no altera el registro de lotes ni supone telemetría.

**v14:** la flota lee el estado inicial de «Vida SIM» del control principal al arrancar. El botón ya no puede mostrar «Reanudar» mientras el control principal indica animación activa. Las marcas discontinuas del corredor WebGL se agrupan en una sola geometría para limitar draw calls. Sin WebGL, el selector dice «Isométrico 2D».

**v15:** el fallback Canvas de granja retira rótulos/estado de carga del visor WebGL fallido; deja visible su propia cabecera y la procedencia SIM.
