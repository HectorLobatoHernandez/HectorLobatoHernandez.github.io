# GAZA Strategy Twin — runtime architecture

Updated: 2026-10-06

## Purpose

Browser demonstrator for public-evidence exploration, synthetic operations and future read-only industrial integration. It is not an as-built model and it does not control plant equipment.

## Surfaces

- `territory.html` — public environment/routing producer. Open-Meteo, OSRM and DGT DATEX2 are kept separate from synthetic what-if traffic.
- `plant-3d.html` — detailed plant/farm/logistics scene with process, ASRS, lanes, workforce, vehicles and inferred exterior context.
- `game.html` — presentation-oriented Strategy Twin with deterministic guided demo and x-ray process/ASRS views.

## Shared runtime contracts

### Environment bus
Browser key: `gaza:environment:v1`.

Freshness guards:
- weather: 15 min;
- DGT: 5 min.

DGT publishes both broad proximity fields and route-corridor fields. `routeRisk` is based on a geometric match to OSRM demo routes; it is not official confirmation of route impact or measured congestion.

### Production asset registry
Files:
- `assets/3d/manifest.json`
- `assets/3d/manifest.schema.json`
- `runtime/asset-registry.js`

Only local GLB/glTF paths are accepted for production runtime entries. Each asset requires source URL, license and provenance. Loaded assets can target named scene groups, receive transforms/shadows, become selectable and play a declared or first available animation clip.

Procedural geometry remains the fallback until a binary asset passes the promotion gate.

### Machine-readable twin telemetry
Files:
- `runtime/twin-telemetry.js`
- `runtime/twin-state.schema.json`

Both WebGL twins publish `window.__GAZA_TWIN_STATE__` and the browser event `gaza-twin-state`. This is intended for QA, Three.js DevTools and local agents. It exposes simulation/environment/assets/render state without requiring pixel inference.

### Render telemetry
Both WebGL surfaces expose `window.__GAZA_RENDER_STATS__` from Three.js renderer information.

## Provenance model

Every claim or asset must remain in one of these classes:

1. `PUBLIC_REFERENCE` — supported by a public source.
2. `INFERRED_RECONSTRUCTION` — visible/exterior reconstruction from public evidence; never described as surveyed/as-built.
3. `SIMULATED` — operations, workers, routes, equipment topology, task states and telemetry invented for the demonstrator.

Public evidence can justify the existence of a system such as CIP, GAZACONTROL, utilities or a 9-level automated warehouse. It does not justify hidden geometry, capacities, PLC tags, control sequences or real employee tracking.

## Deterministic QA mode

WebGL pages support:
- `?camera=<preset>`
- `&freeze=1`
- `&qa=1`
- `&debug=1`

`qa=1` injects a stable environment fixture and avoids live weather requests in the WebGL surfaces. `freeze=1` stops simulation motion while preserving deterministic object placement.

`tests/visual-qa.mjs` checks:
- backing-store DPR;
- local brand SVG;
- WebGL render telemetry;
- conservative render budgets;
- GLB registry health;
- machine-readable twin telemetry;
- route-aware DGT UI;
- screenshots for Strategy/Plant process, ASRS, docks, farm, overview and mobile.

GitHub Actions workflow: `.github/workflows/gaza-visual-qa.yml`.

## Future industrial integration boundary

Real integration must be adapter-based and read-only first:

```
WMS / MES / ASRS / historian / approved APIs
                ↓
        validation + mapping
                ↓
      canonical twin snapshot
                ↓
  browser visualisation / analytics
```

No browser surface should write directly to PLC, safety, ASRS or production-control systems. Any later write path requires a separate authenticated service, explicit authorization, audit trail, interlocks and plant-owner approval.

## Asset promotion gate

A GLB is production-ready only after:
1. source/license/provenance recorded;
2. local binary committed;
3. Blender/glTF validation;
4. Three.js load test;
5. deterministic camera screenshots;
6. render-budget review;
7. procedural fallback retained until acceptance.


## Farm ↔ Labs ↔ Mission Control (experimental training extension)

- `mission-control.html` owns navigation and a read-only Quality Training status display. The established Plant 3D, Control Tower, GIS, Territory, Systems and Matrix views are unchanged.
- `farm-labs.html?mode=farm|labs` owns selectable training stations, a synthetic lot and procedural WebGL representations (not as-built).
- Shared same-origin demo key: `localStorage['gaza:quality-training:v1']`. Separate open tabs synchronize through `BroadcastChannel('gaza-quality-training')`. Embedded iframe updates notify their same-origin parent via `postMessage({type:'GAZA_QUALITY_STATE_V1',provenance:'SIMULATED',lotId:'SIM-LOT-001',revision})`; the parent reads the validated local key, never trusts payload values as operational telemetry.
- `__GAZA_TWIN_STATE__` / `gaza-twin-state` follows schema v1 with `surface='farm'|'labs'`, `simulation`, `environment`, `provenance`. Existing schema enum currently covers only strategy/plant and must be extended before strict validation of these new surfaces.
- Integration is **simulation-only**; Plant 3D is NOT yet driven by this shared lot. No WMS/MES/PLC write, real employee tracking, or real quality release.
- QA: `tests/farm-labs-qa.mjs` includes cross-tab and cold-chain hold cases, requiring Playwright + local server. It must be run before merging.
