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
This is a concept demonstrator. All operational data and geometry are synthetic. It does not contain internal Leche GAZA information and does not control PLCs or ASRS equipment. A real deployment must begin with validated data contracts and read-only integration.

See `TEST_PLAN.md` for acceptance tests.

## Presentation controls
- `D`: run guided demo.
- `Space`: pause/resume simulation.
- `1 / 2 / 3`: Operations / Flow / Risk layers.
- `R`: reset.
- `?demo=1`: automatically starts the guided sequence after load.

## Restored simulation layers
- `plant-3d.html`: 3D farm-to-dispatch functional model.
- `territory.html`: OSM/OSRM territory and routing + live Open-Meteo + DGT road-state source links.
- `PUBLIC_EVIDENCE.md`: source/simulation boundary and requirements for an as-built twin.
