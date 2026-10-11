# GAZA OPS — connected dairy process v2

This is a browser-local training simulator, NOT live GAZA telemetry, a production SOP, an authenticated quality release system or a surveyed building model.

## One source of truth
`localStorage['gaza:process-flow:v2']` holds two explicitly separated BOVINE and OVINE batch genealogies. A shared clock and commands are serialized through the Web Locks API. Opening additional tabs/iframes does not multiply production or clock speed. No Web Locks / denied storage: read-only/error, never unsafe concurrent writes.

Workflow, Farm/Labs, Site Real and the Plant overlay consume the same snapshot. The old key `gaza:operations-thread:v1` is a **derived read-only compatibility view**, not a second ledger. Old snapshots are preserved under `:before-v2` on explicit initialization; old successful tests are not silently imported. Archive before starting another session. Archives and exports are local and not tamper-proof records.

## Executable scope
- Separate species; eligible milk and deliberately segregated quantities.
- Preparation, milking, cooling, loading, transport, sampling, unloading, manufacturing, packaging, palletizing and dispatch.
- Specimen custody; timed temperature/inhibitor/composition tests for raw material; timed microbiology/packaging tests for finished product.
- Three independent decisions: reception acceptance, manufacture eligibility, dispatch release. All require a simulated QUALITY-01 role and appropriate valid tests. **The role is not authentication.**
- Equipment readiness/version and occupancy, invalidation, individual origin hold, documented retest and CAPA closure. Adverse attempts and revoked decisions are retained.
- Physical material is not zeroed or rolled back when a late incident is introduced. Post-dispatch alerts preserve delivered quantity and genealogy.
- Five lot nodes per origin: tank → compartment → reception → manufactured → finished. No automatic inter-species blending. This version does not yet implement arbitrary many-to-many mixing/splitting or actual recall management.
- Partial pallet volume remains in packed stock and is not falsely reported as delivered.

All durations are short **demo seconds**, not biological incubation times or industrial cycle times. Yield, quantity and pallet capacity are fictitious inputs. The gate plan `DAIRY-TRAINING-2` is not GAZA's control plan; do not use it operationally.

## 3D and model boundaries
The geometry and fixed locations of the farm remain unchanged for coordination with the parallel farm modelling chat. Station inspection is view state only, never material progression. Overlays use stable semantic process IDs and show active station, sample transfer, progress and HOLD. Lab station blocks are opened for visibility; their interior remains schematic.

Site Real reuses its original exact geometry module and routes through a wrapper; cisterna/trailer position follows process progression, while the stock/quality ledger remains authoritative. Plant 3D retains its existing scene and adds semantic process beacons/flow markers. Original background animation in Plant is illustrative, not counted as an additional physical delivery. The wrapper files preserve original manifest validation, asset gates and site geometry.

`asset-registry-base.js`, `site-real-world-geometry-v2.mjs` and `site-real-app-base-v2.mjs` retain original code; adapt wrappers or semantic bindings rather than overwriting geometry.

## Catalog versus executable processes
The process catalog also describes farm biosecurity, feeding, water, health, cleaning and environmental sampling. Detailed veterinary rules, dosing, CIP recipes, environmental microbiology and waste balances are **not executable or validated in this increment**. They are explicit procedure placeholders, not invented internal GAZA SOPs. No precise plant laboratory location is asserted.

## Operation
Open Workflow or either Farm/Labs tab. Start the connected simulation; choose a species, start a task or automatic task sequencing, and run the shared clock. Sequencing stops at each human review. In Labs accept custody, start tests, allow demo time, then review the applicable decision. For incident/retest/equipment actions enter a descriptive note. Select a station without changing the actual process stage.

## Validation
`node --test tests/dairy-process-core.test.mjs`
`node tests/dairy-process-browser-qa.mjs` (local server, Playwright + Three.js required)

23 core tests passed locally before PR. Browser/WebGL tests run in CI because this execution environment cannot create a permitted WebGL browser session. Final CI status must be checked before publishing.

CI checks all five surfaces, clock sharing, custody, separate gates, FAIL/HOLD, retest history, material balance, WebGL, and responsive UI. It uses pinned Three.js and synthetic tests, not network availability or real plant data.

## References reviewed 2026-10-11
- FAO: https://www.fao.org/dairy-production-products/products/quality-and-testing/en/
- Tetra Pak: https://dairyprocessinghandbook.tetrapak.com/chapter/collection-and-reception-milk
- Web Locks: https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API

Sources establish general domain concepts and browser coordination. They do not establish site equipment, actual capacities, building positions or GAZA-specific acceptance criteria.
