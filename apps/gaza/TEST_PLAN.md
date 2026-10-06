# GAZA Operations Intelligence — Acceptance Test Plan

## Scope
Synthetic demonstrator only. No internal Leche GAZA data and no PLC/ASRS control.

## P0 — Interview demo
1. Open `/apps/gaza/`.
2. Confirm Digital Twin renders ASRS, staging, docks, trucks, forklifts and pallets.
3. Press **Ejecutar demo**.
4. Verify phase rail advances: Order → Gate → Exception → Optimise → Approve → Load → Dispatch.
5. At Exception, verify **2 PALLETS MISSING** is visible in the twin and GZ-260602 is at risk.
6. At Scenario Lab, verify current/proposed KPIs are shown.
7. Approve the recommendation.
8. Verify GZ-260602 is replanned to D4, the incident clears, KPIs change and HUMAN_APPROVAL is logged.
9. Verify dispatch completes and the order becomes delivered.

## P0 — Interaction
- OPERATIONS / FLOW / RISK layers switch without page reload.
- Pause/resume freezes and resumes simulation time and motion.
- Speed cycles 1× → 2× → 0.5× → 1×.
- Zoom +/− and Home camera work.
- Clicking a truck, forklift, dock, staging or ASRS updates Selected Asset.
- Orders search and state filter work.
- Synthetic order injection adds an order.
- Event Log exports JSON.
- Fullscreen Presentation button enters/exits browser fullscreen.
- `D`, `Space`, `1/2/3`, `R` keyboard controls work.
- `?demo=1` starts the guided sequence automatically.

## P1 — Responsive
- Desktop ≥ 1100 px: twin + right operations rail.
- Tablet: operations rail collapses below twin.
- Mobile ≤ 700 px: navigation becomes horizontal and map remains usable.

## Safety / governance acceptance
- Visible synthetic-data notice.
- No claim of live plant telemetry.
- No direct PLC/ASRS control.
- Recommendations require human approval.
- Event log records simulation and decision events.

## Current limitation
The plant geometry and operational values are synthetic. Real integration requires an internal audit, validated plant layout, data contracts and read-only connectors before any operational conclusion is made.


## P0 — Strategy Twin (`/apps/gaza/game.html`)
- **Ejecutar demo** starts deterministic seed `GAZA-DEMO-01`.
- Tanker follows the farm → plant route instead of translating arbitrarily.
- FL-01 follows a staging → dock task path, physically carries PAL-201, and drops it at D3.
- D3 shutter opens as the pallet arrives; dock state remains selectable.
- GZ-TR-204 follows the outbound yard/road path after loading.
- Clicking an entity eases the orthographic camera to that asset and updates the inspector.
- **Reset** restores tanker, pallet, forklift, truck, dock, KPI and incident state.
- **Incidencia** remains visibly labelled synthetic and changes risk state without claiming live DGT telemetry.
- Repeating Reset → Ejecutar demo produces the same sequence.


## P0 — Public context adapters
- Strategy Twin weather chip shows `LIVE PUBLIC` only after successful Open-Meteo response; failure shows `NO DISPONIBLE`.
- Territory attempts DGT NAP DATEX2 v3.7 load; success shows `LIVE`, count and query time, with nearby georeferenced records mapped.
- If DGT CKAN/XML/CORS fails, status is `NO DISP.` and no traffic incident is presented as live.
- Congestion multiplier buttons remain labelled `What-if` and must not be described as DGT traffic.
