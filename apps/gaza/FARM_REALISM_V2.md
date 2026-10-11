# FARM V2 · anatomy, husbandry detail and evidence-aware herd planning

Extends **6 · FARM** in the existing application. Geometry of the historic Zamora site and the source network/Process Ledger V2 stay unchanged. No generated image, paid asset, subscription, external employee data or new private credentials.

## Visual content

Original procedural cattle and sheep meshes: body/shoulder/rump, differentiated muzzle, eyes, ears/tags, udder and teats, separate hoof halves and two-link legs, tail and fleece. These are improved mesh illustrations, not photogrammetry or photographed real animals. Herd components are instanced by species; rendering density does not multiply production.

The baseline ambient scene contains 80 cattle and 100 sheep with no milk produced. With the baseline scenario the balanced display uses 120 cattle and 160 sheep; compact and high limits are 120 and 420 total. Packing respects the existing pasture polygons with spacing. These figures are **graphical representatives, not a herd census or validated physical capacity**. Additional close-up cameras and instance selection show the distinction.

Eight existing worker anchors now wear proposed role-specific clothing: farm workwear, sanitary white, cleaning teal and driver high-visibility vest. No real uniform specification or staff identity is claimed. Vehicles retain their existing task anchor but add glazing, mirrors, rims, hatches, lights and body detail. Buildings add illustrative guttering, roof structure, internal fixtures, milking apparatus, drains, work surfaces and information boards. The original facade signs are retained.

Milking presentation has six phases: entry, identification/preparation, attachment, extraction, detachment/check and exit. Hoses and product-flow markers correspond to the illustrative phase. Timing is derived from the existing 22-second **training task**, not an actual analytical, veterinary or milking method. Animals are not counted as separate real milk yields. Pausing does not advance animation; quantities still change only at the existing canonical task completion.

## Herd equivalent calculator

Inputs: volumes already recorded per scenario, explicitly selected equivalent horizon in days, hypothetical litres per lactating animal/day, and lactating fraction of adult females. Calculate lactating females with ceiling(volume / horizon / yield), then adult females with ceiling(lactating / fraction). Dry females are the difference. Replacement stock and males are not included. It is a planning estimate, not a veterinary recommendation or licensed stocking capacity.

Default assumptions: one equivalent day, 35 L/cow in milk/day, 2 L/ewe in milk/day, .82/.70 lactating fractions. **All are editable SIM hypotheses**, not measurements or herd performance attributed to GAZA. The compressed simulation clock is independent of that horizon. Graphics and calculator never write the ledger or approve quality.

No currently verified consolidated GAZA daily/annual production or species census was established. The corporate source confirms >80 farms and Frisian cows, not these litres. No dated press figure or directory estimate is promoted to a present-day operating value.

## References checked 2026-10-11

- https://www.lechegaza.com/ganaderos.html — >80 farms, cows and general care; not current production/census.
- https://www.lechegaza.com/_blog/bienestar-animal-ganaderias-zamora.html — general welfare, water, feed, resting and milking context, not inventory of this virtual site.
- https://www.fao.org/4/ba0027s/ba0027s00.htm — general FAO/FIL farm-practice framing; not GAZA procedures.
- https://threejs.org/docs/pages/InstancedMesh.html — instancing and buffer update/disposal.

## QA

Twelve additional unit checks cover assumptions, periods, graphic counts, immutability, seeded spacing, phase mapping, finite mesh geometry, articulation matrices and full enhancement construction. Browser checks cover close-up cameras, population vs production, hypothesis edits without ledger writes, invalid input, timed milking/hold/pause, mobile and continuity with Labs. The existing global, farm, plant, lab and process suites are retained. The old farm browser assertion of 26 figures is replaced by the V2 count contract; no functional process check is removed.

Local unit checks pass. Local browser navigation is blocked by the container policy: browser/screenshots must be validated in GitHub Actions before merge. The final CI result belongs in the PR rather than being guessed here.

This iteration upgrades Farm first. The anatomy/uniform module is reusable, but **Lab and Plant geometry are not restyled in this commit**. Their shared process integration remains in force.
