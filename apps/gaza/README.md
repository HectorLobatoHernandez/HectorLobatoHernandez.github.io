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

## Canonical demo
`Order → Gate → Exception → Optimise → Human approval → Replan/load → Dispatch`

The default scenario reproduces a synthetic 18-pallet expedition where two pallets are missing while the truck is already on site. The system evaluates an alternative, proposes D4, waits for human approval, updates the synthetic twin and records the decision.

## Governance
This is a concept demonstrator. All operational data and geometry are synthetic. It does not contain internal Leche GAZA information and does not control PLCs or ASRS equipment. A real deployment must begin with validated data contracts and read-only integration.

See `TEST_PLAN.md` for acceptance tests.
