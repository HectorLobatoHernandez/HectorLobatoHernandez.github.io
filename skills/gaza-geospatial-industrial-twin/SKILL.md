---
name: gaza-geospatial-industrial-twin
description: Build GAZA LIVE OPS as one intuitive operator workspace: geospatial scenes, traceable material, simulated staffing, day/night environments and verified browser delivery.
---

# GAZA LIVE OPS · Architecture and experience contract

Revision: 2026-10-12. This document replaces earlier instructions that named the historical Plant 3D scene or training counters as the canonical workspace.

## 1. Product and primary navigation

Work inside the existing GAZA app and repository. Never answer an implementation request with a generated image, disconnected mock-up or replacement application. Read the current branch and open PRs before editing. Preserve concurrent portfolio/avatar work.

`apps/gaza/mission-control.html` is the integrated operator workspace. The detailed campus is `site-real-preview.html` (`view=site`). `view=plant` is a compatibility alias to the same current campus, including Matrix. The older `plant-3d.html` remains historical/regression source only and must not load in active navigation.

Primary concepts: **Planta y logística, Granja, Laboratorio, Flujo y calidad**. Keep Territorio, GIS, references and diagnostics secondary. Use short Spanish action labels, labelled selects, visible selected lot and scope, keyboard access and touch targets. Put the shared clock, run/pause, speed, lighting and staffing drawer above the maps. Provide loading, first-real-frame and failure states; never leave an unexplained blank viewport.

Stable presentation entry: `apps/gaza/demostracion.html`, linked from `start/gaza.html`. The company presentation and working ledger have distinct storage/lock/channel identities. Never clear normal work to make a demo look active.

## 2. One time and material model

Process Ledger V2 is the ONLY writer of litres, samples, genealogy, tasks and quality decisions. Farm, Labs, campus, stock, trucks, documents, GIS context and UI are projections of that state, not independent ledgers.

- Preserve mass, species, origin ancestry, partial pallets and exclusive equipment use.
- Preserve separate decisions for receipt acceptance, manufacturing eligibility and finished-product dispatch. No auto-release to keep an animation moving.
- Adverse results and audit events are retained. Retesting needs justification; correction is not the same as release.
- Camera moves, cutaways, animal counts, day/night previews and frame rates never produce milk, complete a test or approve a shipment.
- `LIVING_SETTINGS` changes only supported display/staffing policy, not the epoch, amounts or approvals. Scenario creation determines the epoch.
- Shared selected lot, clock and illumination propagate within the current scope. Record elapsed simulation time independently from render frequency.
- The clock is a browser simulation with compressed durations. No server process runs when all clients are closed. Do not describe it as actual GAZA telemetry or measured production cycle time.

## 3. Staffing and operations

Role identities, uniforms and shift windows are synthetic proposals. A role is not proof of an individual employee or contractual schedule. Show working, available, off-shift, held and handover states with readable explanations.

Optional scheduling gates the start of new tasks/assays/reviews. Already-running operations must not abandon heating, refrigeration, incubation or a moving vehicle just because the shift changes. Holds, equipment validity and quality remain authoritative. Test midnight, shift boundaries, queues, continuous coverage and handover.

Sub-process choreography is explanatory, not a veterinary, microbiological or industrial SOP. A label and state should identify what is moving and why. Avoid arbitrary motion unrelated to the selected lot.

## 4. Realism and evidence

Classify source-backed content separately:

- `PUBLIC_REFERENCE`: directly supported by a named, dated public source.
- `INFERRED_RECONSTRUCTION`: traced or inferred geometry, never surveyed/as-built.
- `SIMULATED`: people, shifts, equipment, routing, process inputs or scene content not publicly verified.
- `REAL_AUTHORIZED`: reserved for future customer-approved read-only feeds.

Record URL, retrieval date, source date when known, CRS and limits. Prefer official company/government/manufacturer sources. A direct interview may support its dated quotation, not current operation. Preserve disagreements rather than silently reconciling them.

Public milk collection references and their caveats are recorded in `runtime/farm/life/herd-model.mjs`. Do not replace dated declarations with invented live amounts, nor claim all throughput is unknown. Rendering hundreds of group-weighted animals does not establish the true census, animal yield, site capacity or land-use authorization.

GAZACONTROL, INTERGAZA, Solmicro client reference, Tetra Pak equipment references, Esnova/Signode and Veolia are evidence anchors, not proof of installed software versions, APIs or control protocols. The laboratory is associated with Coreses functionally; its exact room remains proposed.

The Zamora farm is a fictional consolidation of the procurement network in the historical factory parcel. Roofs and roads use the recorded PNOA trace and photographs. Do not move geographic footprints to solve a visual problem. The castle/cathedral relief and vertical dimensions are simplified, not LiDAR. Failed OSM queries must never be labelled successful geometry imports. Keep metre coordinates for calculations and WGS84 for interchange.

## 5. Scene craft

Improve the existing animals, workers, machinery and vehicles, not duplicate fleets or employees. Keep stable scene IDs and task bindings. Reuse licensed/attributed geometry and the same-origin Three r180 assets. Use original procedural assets where appropriate and identify illustrative branding; do not invent official uniforms or exact packaging artwork.

Cattle must occupy the common cubicle geometry with correct heading and clearances. Pasture orientations are independent. The number of representative symbols and their weights remain explicit; it is not a livestock accommodation calculation.

Vehicles declare a local forward axis and follow route tangents. Test bends, reversals, holds and cargo placement. Local routes remain proposed until surveyed/routed evidence exists. Never claim validated turning envelopes from a rough visual spline.

GAZA carton glyphs belong on compatible finished-product pallets or authorized outbound cargo, not in raw-milk tankers. Quantities derive from stock/shipping registers. Avoid representing the same inventory twice in rack, dock and truck. Carton labels must not fabricate nutritional data, exact commercial artwork or vehicle capacity.

## 6. Night and performance

Night should have low ambient light with readable silhouettes and localized street/interior lighting. Use a bounded count of real lights, emissive fixtures and explicitly illustrative light pools. No claim of measured lux, electrical installation or exact lamp placement.

Use instancing/LOD and dirty-frame rendering. Static maps must not repaint continuously while another department compiles its shaders. Invalidate on actual state, camera, viewport, loaded textures or font changes. Suspend hidden views while preserving ledger observers. Maintain one logical clock across views.

Prepare shader compilation where supported, show its real status, and only publish ready after a successful real frame. Report startup timings/render counts to diagnose slow devices; do not mark a mock renderer as ready. Keep quality and inventory logic independent of any rendering budget.

## 7. Verification and publication

Before merge: unit invariants, exact upstream vendor integrity, browser WebGL of each changed scene, cross-map lot/time/hold behavior, default and night views, cargo inspection, mobile overflow, preserved cubicle fix and navigation with no old active plant requests.

Retain deterministic regression criteria. Diagnose failed tests with their reports and captures; do not delete assertions or simulate successful graphics to make CI pass. A changed artistic camera may require a deliberate screenshot update, not a false claim about real geometry.

After merge: verify GitHub Pages head AND actual browser navigation against the public domain through the dossier. Confirm the release, visible animals, new campus, Labs, night mode and protected normal ledger. A successful build alone is not proof of working public graphics. No installer is required when repository write tools are available.

## 8. Future real integrations

Customer-authorized systems → read-only adapter → canonical provenance-tagged events → validation → twin. Never expose PLC/DB secrets in the browser or infer authority to send commands. Any future write/control path needs separate explicit authorization, audit and safety design. Today's scenario does not constitute OT/ERP integration or a multiuser operational server.
