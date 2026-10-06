---
name: gaza-strategy-digital-twin
description: Build and refine the GAZA Operations Intelligence demonstrator as a branded isometric strategy-game digital twin. Use for GAZA UI, Three.js/WebGL, farm-to-factory logistics, warehouse simulation, territory/routing, scenario design, visual QA, interview demo preparation, and launch/demo media.
---

# GAZA Strategy Digital Twin

## Contract
Build an operations product, not a decorative dashboard. The primary surface is a living spatial model. Tables and charts explain the world; they never replace it.

Always distinguish:
- **PUBLIC**: supported by public Leche Gaza / supplier / government sources.
- **LIVE PUBLIC**: queried from a public live API such as weather when the request succeeds.
- **SYNTHETIC**: invented operational values, geometry, farms, vehicles, orders or scenarios.
- **TO VALIDATE**: hypotheses that require authorised internal discovery.

Never present synthetic telemetry, farm coordinates, customer data, floor plans, fleet IDs, production volumes, KPIs or AI recommendations as internal GAZA facts.

## Reference grammar
The supplied warehouse-management reference video is the visual benchmark:
- bright low-poly/isometric world on white and very pale blue-grey ground;
- true strategy-game camera, not a dark engineering viewer;
- blue industrial buildings with clear dock doors;
- white branded trucks, yellow/black forklifts, tan pallets, green trees;
- top navigation + compact KPI cards;
- right-side context inspector for the selected asset;
- bottom operational strip for docks / vehicles / tasks;
- location pins, route traces and status chips embedded in the 3D world;
- camera pans smoothly to the selected operation;
- assets keep moving while UI remains calm and legible.

Do not copy the reference product's brand, copy or proprietary UI. Rebuild the interaction grammar for GAZA.

## GAZA visual system
Use the GAZA public brand as the identity anchor.
- Brand blue: #123A78 / #1554A3.
- Green accent: #87B83F.
- Red accent: #D91F36.
- World background: #F4F7FB.
- Roads: #E5ECF6.
- Panels: white with 1px #DDE5EF borders.
- Text: #172033; secondary #6D7A8D.
- Forklifts/safety: #F4B942.
- Risk: #D94A4A.
- Radius: 10–14px; shadows restrained.
- Typography: compact operational sans; strong numeric hierarchy.

Use the project logo asset at `apps/gaza/assets/gaza-logo.svg`. It is a public-brand reference lockup; replace it atomically if an official vector is supplied.

## Spatial model
Maintain one state graph across views:
`farm -> cold tank -> tanker -> road -> reception/quality -> silos -> process/CIP -> packaging -> ASRS -> staging -> dock -> outbound truck -> road/customer demo`.

Minimum selectable entities:
- farm node;
- tanker;
- reception;
- process;
- utilities;
- ASRS;
- staging lane;
- dock;
- forklift;
- pallet/order;
- outbound truck.

Each entity has: id, type, status, position, current task, provenance, timestamps, and relevant KPIs.

## Three.js implementation
Prefer Three.js with an **OrthographicCamera** for the strategy view. Use perspective only for optional inspect mode.

Defaults:
- azimuth ≈45°, elevation ≈35.264°;
- ACES/sRGB output where supported;
- DPR capped at 2;
- soft directional shadows with a hemisphere fill;
- low-poly geometry and flat/simple PBR materials;
- `InstancedMesh` for repeated pallets, cows, racks, trees and markers;
- raycast selection;
- smooth camera target interpolation;
- fixed-step simulation state separated from render interpolation;
- ResizeObserver or robust resize handling;
- dispose textures/materials/geometries on teardown.

Keep simulation time independent from frame rate.

## Game loop
A useful demo is a deterministic vertical slice:
1. farm tank becomes ready;
2. tanker is assigned;
3. tanker travels to Coreses;
4. reception slot is reserved;
5. quality gate passes or raises a synthetic exception;
6. milk enters process;
7. finished pallets enter ASRS;
8. an order requests pallets;
9. forklift/staging/dock tasks are generated;
10. outbound truck is loaded;
11. road/weather incident can change ETA;
12. human approves a replan;
13. event log records the decision.

Every scenario must be resettable and reproducible.

## Territory
Use public map/routing sources for geometry only when their response is available.
- OSM: map.
- OSRM: base road route/time.
- Open-Meteo: current weather.
- DGT DATEX2: road incidents when the adapter is actually connected and parsed.

Until DATEX2 is integrated, congestion controls must say SYNTHETIC.

The 80+ farm network may be visualised only as anonymised/synthetic nodes unless exact farms are authorised and validated.

## UI anatomy
Desktop:
- 56–64px top bar;
- KPI cards directly below;
- world fills the remaining viewport;
- right inspector 300–340px;
- bottom operations rail 54–72px;
- floating zoom/layer controls.

Inspector changes by entity type and shows only useful fields. Do not show fake precision.

Mobile/tablet:
- preserve the world;
- inspector becomes bottom sheet;
- KPIs horizontally scroll;
- touch selection and pinch/zoom remain usable.

## Motion
- trucks: lane-following paths, not arbitrary linear slides;
- forklifts: task paths with pickup/drop dwell states;
- pallets: attach to forklift forks during transport;
- dock doors/status lights react to state;
- route/pin markers pulse only for active tasks;
- camera focus uses ease-in-out, 450–800ms;
- no constant decorative animation that obscures state.

Respect `prefers-reduced-motion`.

## Brand realism
Use GAZA branding on:
- top-left product identity;
- factory facade;
- tankers and outbound trailers;
- pallet/order labels where appropriate.

Do not brand third-party carriers as GAZA unless the scenario explicitly says the vehicle is synthetic.

## Launch / demo video
When the request is to present, pitch, publish or demonstrate the build as a short video, delegate the media workflow to the vendored `brag-slim` skill.

For GAZA/RHB outputs:
- use the real app UI, real project assets and deterministic scenario rather than generic mockups;
- preserve PUBLIC / LIVE PUBLIC / SYNTHETIC / TO VALIDATE provenance in any claim that appears on screen;
- never invent factory KPIs, fleet counts, savings, production throughput, customer names or internal claims for marketing impact;
- prefer a 18–22 s vertical or landscape sequence showing: territory/factory reveal -> one live operational flow -> incident/replan -> branded operational overview;
- keep the GAZA visual system and logo unchanged;
- output `brag.mp4`, `brag.jpg`, `share-copy.txt` and `brag-plan.md` under `brag-output*/`;
- treat generated media as an export artifact, not source-of-truth project data.

The full Hyperframes-backed `/brag` plugin is not part of the canonical GAZA stack yet. Use `brag-slim` unless the project explicitly adopts and validates Hyperframes.

## Verification gate
Before calling a build testable:
1. no JS syntax errors;
2. desktop and mobile render;
3. WebGL canvas resizes without distortion;
4. selectable entities update inspector;
5. pause/speed/reset work;
6. one complete deterministic scenario runs end-to-end;
7. PUBLIC/SYNTHETIC labels remain visible;
8. no claim of live data without a successful live source;
9. FPS remains usable with DPR <=2;
10. capture screenshots at overview, selected truck, selected dock, incident, and mobile.

For visual matching, compare screenshots against the supplied video: camera angle, whitespace, blue/white balance, panel density, object scale, shadow softness and inspector proportions.

## Anti-patterns
- dark cyberpunk control room as the main experience;
- giant charts before the spatial world;
- generic purple AI gradients;
- floating objects with no operational meaning;
- random motion disconnected from state;
- fake live badges;
- exact internal floor-plan claims without authoritative geometry;
- 80 named/located farms invented from public counts;
- rebuilding local RHB/NEXO/XXXIA systems inside this skill.

## Delivery
Prefer small versioned commits. Preserve a backup branch before structural changes. Update `README.md`, acceptance tests and evidence boundary when behavior or evidence changes.
