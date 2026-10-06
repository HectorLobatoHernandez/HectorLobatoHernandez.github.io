# GAZA APP — Simulation / Digital Twin Specification

## Reference analysis
The supplied videos converge on two complementary interaction models:

1. **Operational digital twin / strategy-game UI**
   - Isometric site view is the primary interface.
   - Vehicles, forklifts, pallets, docks and buildings are operational entities, not decoration.
   - KPI cards stay visible while the user navigates the scene.
   - Selecting an entity opens a contextual inspector.
   - Shipment progress and dock/vehicle queues remain visible at the edge of the viewport.
   - Status is encoded spatially and with restrained semantic colour.

2. **Cinematic 3D logistics site**
   - Smooth movement between warehouse, road, port/airport and office contexts.
   - The environment explains the logistics network before text does.
   - UI is lightweight; the scene remains dominant.
   - Camera transitions create a premium product/website feel.

## Product direction for GAZA
GAZA APP should combine both ideas: a spatial operations interface first, with Control Tower data overlaid on the Digital Twin. It must not become a conventional dashboard with a decorative 3D background.

## V2 acceptance criteria
- [x] Isometric animated warehouse scene.
- [x] ASRS, staging, docks, pallets, forklifts and trucks.
- [x] Pan / zoom / reset camera.
- [x] Clickable operational entities and inspector.
- [x] KPI HUD.
- [x] Dock and vehicle queue.
- [x] Shipment tracker.
- [x] Synthetic order intake.
- [x] Incident injection.
- [x] Scenario comparison.
- [x] AI Decision Support explanation.
- [x] Human approval before applying a plan.
- [x] Event/audit log.
- [x] Automated end-to-end demo sequence.
- [x] Responsive layout.
- [x] No PLC/ASRS control and no internal GAZA data.

## Next integration layer
When real access exists:
1. Read-only adapters for ERP / GAZACONTROL / ASRS / transport.
2. Canonical order-pallet-dock-vehicle event model.
3. Timestamped event bus and reconciliation.
4. Real KPI definitions agreed with operations.
5. OR-Tools / SimPy scenario engine.
6. Role-based access, IT/OT separation and auditability.
7. Only after validation: controlled write-back workflows with explicit approval.

## Test sequence
Run **Ejecutar demo** and verify:
1. TR-204 enters the site.
2. GZ-260602 changes to risk.
3. Missing two-pallet exception is visible spatially and in alerts.
4. Scenario engine recommends D4.
5. Scenario Lab shows current/proposed KPI values.
6. Human approval is required.
7. GZ-260602 is reassigned to D4.
8. KPIs and queue update.
9. Dispatch is logged.
10. Export JSON contains synthetic=true and the final state.


## Strategy Twin fidelity update — 2026-10-06
Implemented in `game.html`:
- deterministic fixed-step simulation clock separated from rendering;
- route-following tanker and outbound truck;
- task-path forklift with physical pallet pickup/carry/drop;
- animated dock shutter and semantic dock state;
- smooth camera focus tween on selection;
- repeatable Reset → Execute demo vertical slice;
- richer low-poly truck/forklift geometry while preserving the bright isometric reference grammar.

Implemented next:
- public-evidence exterior reconstruction layer, explicitly marked not as-built;
- animated 9-level ASRS racks, shuttle carts and lift;
- multi-agent forklift/AGV lane-cell reservation with look-ahead avoidance;
- shared same-origin environment state from Open-Meteo + DGT proximity;
- weather/DGT heuristic coupling with freshness guards while preserving deterministic guided-demo timing.

Implemented in the 2026-10-06 fidelity pass:
- DGT incidents are geometrically matched to OSRM demo-route corridors (1.5 km threshold) and published separately as `routeRisk`; this is explicitly a spatial match, not an official causal/traffic claim.
- Strategy and Plant twins prefer fresh `routeRisk` and fall back to proximity risk only for compatibility.
- deterministic `?camera=<preset>&freeze=1` views for screenshot QA;
- Playwright high-DPI checks and frozen multi-camera captures for Strategy/Plant/Territory/mobile;
- improved GAZA branding texture path, evidence legend, industrial roof/pipe/dock detail, PPE workforce and correct tanker geometry;
- controlled `assets/3d/manifest.json` boundary for future local GLB assets;
- manifest-driven GLB runtime loader with license/provenance validation, target groups, selection metadata and AnimationMixer playback;
- machine-readable `window.__GAZA_TWIN_STATE__` snapshots and `gaza-twin-state` events for agent/devtool inspection;
- deterministic `qa=1` environment fixtures and GitHub Actions visual QA;
- conservative WebGL budgets for draw calls, triangles, geometries and textures;
- dedicated Strategy + Plant process cameras;
- synthetic process/CIP/pasteurisation/packaging/conveyor/palletising/wrapping layer and visible product-flow state;
- instanced ASRS occupancy/racks and repeated exterior/process geometry to reduce draw-call growth;
- richer inferred exterior context (parking, lighting and landscaping), still explicitly non-surveyed.

Still pending for higher fidelity: authorised/as-built geometry, calibrated vehicle kinematics, real WMS/MES/ASRS task feeds, first vendored/validated rigged GLB workforce and vehicles, Blender-authored LOD assets, and review of the generated screenshot baselines on the target Windows/GPU environment.
