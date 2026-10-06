# GAZA Strategy Twin — Reference Video Specification

Source: user-supplied ~30 s vertical video showing a warehouse-management product presented as a strategy game.

## What the reference actually shows
The embedded product view is a bright isometric warehouse yard. The camera stays elevated and oblique while it pans/focuses between operations. Blue warehouse buildings dominate the world. White trucks and vans move through pale-blue road/yard surfaces. Yellow/black forklifts operate around dock doors and pallets. Tan pallets and blue location pins create task targets. Sparse green low-poly trees provide scale.

The UI is deliberately thin:
- white top navigation with product mark, global search, site selector, live state and user;
- four compact KPI cards immediately under the nav;
- a right inspector card for the currently selected asset/task;
- a narrow bottom rail with operational categories and counts;
- small floating zoom/camera controls;
- almost all remaining screen area belongs to the spatial world.

## Timeline observations
- ~0–5 s: wide overview; warehouse, multiple pallets, trucks, KPI strip and right-side asset inspector.
- ~5–10 s: camera shifts toward the dock yard; fewer objects fill the frame; selected pallet/task pins become prominent.
- ~10–16 s: forklifts become the focus; inspector changes to a forklift/task state while trucks remain active in the background.
- ~16–23 s: camera follows truck/yard operations; vehicle cards and dock/task data change without leaving the world.
- ~23–30 s: denser dock/truck scene; multiple vehicles, dock doors and forklift operations are visible; inspector shows selected distribution/vehicle detail.

## Visual grammar to preserve
1. Orthographic or near-orthographic isometric camera.
2. Bright white / pale-blue world, not a dark control room.
3. Saturated blue buildings as the visual anchor.
4. Soft ambient shadows and low-poly assets.
5. White branded logistics vehicles.
6. Yellow forklifts; tan pallets; green trees.
7. Thin UI chrome with rounded white cards.
8. Spatial pins/labels appear at the operation itself.
9. Selection changes the inspector; the page does not navigate away.
10. Camera movement communicates task context.

## GAZA adaptation
Replace the generic warehouse story with:
farm -> tanker -> Coreses reception/quality -> silos -> process/UHT -> packaging -> ASRS 9 levels -> staging -> docks -> outbound truck -> road.

Brand surfaces:
- GAZA lockup top-left;
- GAZA facade sign;
- GAZA tanker/trailer markings;
- GAZA blue as the building/UI primary;
- green/red logo accents only as semantic highlights.

Do not copy the reference product name, logo, exact text, customers, site names or proprietary data.

## Acceptance target
A screenshot of GAZA Strategy Twin should read as the same *class of product* as the reference video before any text is read:
- same camera family;
- similar world-to-UI ratio;
- similar object scale;
- similar low-poly cleanliness;
- similar inspector proportions;
- similar operational density;
- clearly GAZA-branded and farm-to-factory specific.

The current implementation is a first structural pass. Next fidelity gates are: proper lane-following vehicle paths, dock-door animations, pallet pickup/drop, camera focus tween, richer low-poly models, real GAZA brand vector asset when supplied, and screenshot-backed visual regression.
