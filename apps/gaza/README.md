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
- `plant-3d.html`: Coreses campus 3D with detailed trucks, N-122 contextual access, process, ASRS, utilities and docks. Farms are hidden from the campus by default.
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
