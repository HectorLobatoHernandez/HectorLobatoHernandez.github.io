# Application Delivery Status

| Application | State | Test target | Current blocker / next gate |
|---|---|---|---|
| GAZA Operations Intelligence | LIVE MVP | GitHub Pages | Continue simulation fidelity and validate against real workflow only if authorised data becomes available |
| Technical Portfolio | LIVE | GitHub Pages | Content/media expansion, secondary priority |
| RHB STUDIO V6 | LOCAL RUNTIME | Windows workstation | Canonical source is not yet available in connected GitHub; run LOCAL_APP_READINESS and sync the existing V6 source, do not rebuild |
| Photo2CAD / CAD Agent / Elevation Editor | LOCAL / RHB V6 | Windows workstation | Same canonical-source gate as RHB STUDIO |
| NEXO CORE | LOCAL READ-ONLY | localhost:20800 | Source/runtime must be synced from workstation |
| XXXIA Studio Core | LOCAL | Windows workstation | Source/runtime must be synced from workstation |

## Delivery rule
Do not create parallel replacements for existing local runtimes. First establish the canonical source, health, version and Git history; then repair and test that source.

## Current priority
1. GAZA: testable end-to-end simulation.
2. RHB STUDIO V6 + Photo2CAD/CAD: recover/sync canonical runtime and test.
3. NEXO CORE: health + integration contract.
4. XXXIA: source sync + agent/runtime QA.
5. Portfolio: presentation layer after applications are stable.
