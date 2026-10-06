# GAZA 3D Agent Stack

Updated: 2026-10-06

## Objective

Move the current browser twin from procedural proof-of-concept geometry to a production asset pipeline while keeping public evidence, inferred reconstruction and synthetic operation clearly separated.

## Recommended stack

### 1. Current runtime — Three.js
Keep the existing Three.js application as the browser runtime. GLB/glTF becomes the interchange format for authored assets.

### 2. Agent guidance — Mint Three.js Skills
Repository: https://github.com/mintdotgg/mint-threejs-skills

Suggested Codex install:

```powershell
npx skills add mintdotgg/mint-threejs-skills -a codex -g -y
```

Use it for scene composition, camera presets, interaction, asset loading, performance and release verification. Mint MCP itself is optional; do not make the project dependent on a paid service.

### 3. Live scene inspection — threejs-devtools-mcp
Repository: https://github.com/DmitriyGolub/threejs-devtools-mcp

OpenClaw can consume stdio MCP servers. After a local dev server exists:

```powershell
openclaw mcp add threejs-devtools --command npx --arg -y --arg threejs-devtools-mcp
openclaw mcp doctor threejs-devtools --probe
```

Purpose: inspect scene tree, materials, shaders, animations, FPS and memory from the agent instead of judging changes only from source code.

### 4. Asset authoring — Blender MCP
Candidate: https://github.com/carlosh7/blender-mcp

Why: modeling, materials, UV, rigging, animation, rendering, VLM feedback, asset integrations and GLB/glTF export. Run localhost-only and filter dangerous/raw execution tools until the workflow is trusted.

Target pipeline:

```
public evidence / reference photos
        ↓
Blender scene + reconstruction labels
        ↓
LOD0 / LOD1 / collision / baked materials
        ↓
GLB export_for_target(web)
        ↓
Three.js GLTFLoader
        ↓
runtime roles + routes + telemetry overlays
```

### 5. Free production assets

- Quaternius Universal Base Characters: rigged humanoid GLTF/FBX.
- Quaternius Universal Animation Library: 120+ humanoid animations.
- Quaternius Universal Animation Library 2: 130+ additional animations.
- Kenney Mini Characters / Prototype Kit: CC0 alternatives for lightweight stylised characters.
- Poly Haven: CC0 HDRI, PBR textures and industrial environment assets.

Before committing third-party assets, keep the source URL and license snapshot in this folder.

## Visual acceptance gate

Every meaningful 3D commit must visibly change at least one review camera:

1. Exterior / facade.
2. Process / packaging.
3. ASRS.
4. Farm.
5. Docks / logistics.

Use Playwright screenshot comparisons once the local dev harness is added. A change that only alters hidden simulation logic does not count as a visual-fidelity milestone.

## Character policy

Current procedural people are synthetic role characters. Do not infer or reproduce real employee identities from photographs. Real public executives may be referenced textually where relevant, but operational worker positions and routes remain synthetic unless an authorised data source is connected.

## Branding

The GAZA wordmark used in the prototype is a referential in-app reconstruction for identification. Do not claim it is an official brand asset. If the demo becomes a client deliverable, replace it with brand files supplied or licensed by the company.

## Implementation status and next milestones

Implemented in browser runtime:
- deterministic review cameras + freeze/QA modes;
- manifest-driven GLB/glTF loader with source/license/provenance gate;
- AnimationMixer support for loaded GLB clips;
- machine-readable twin/render telemetry for agents and QA;
- detailed procedural process/CIP/packaging/conveyor/palletising layer;
- instanced ASRS occupancy, conveyors and exterior repeated context;
- Playwright multi-camera QA + GitHub Actions + render budgets.

Next production-asset milestones:
- commit the first licensed rigged GLB character and validate walk/idle animation blending;
- build PPE variants: food-production coat/hairnet, hi-vis logistics, maintenance and driver;
- replace procedural tanker/trucks/forklifts with optimised GLB assets while preserving fallbacks;
- use the now-enabled Blender MCP connection for evidence-guided exterior authoring once localhost:9876 is confirmed;
- create LOD0/LOD1 variants and compressed texture workflow for repeated production assets;
- calibrate kinematics only when authoritative dimensions/operational constraints are available;
- connect a read-only canonical operations adapter only after an authorised WMS/MES/ASRS data contract exists.


## Bootstrap implemented — 2026-10-06

The repository now includes an idempotent Windows bootstrap and verifier:

```powershell
cd "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
powershell -ExecutionPolicy Bypass -File .\tools\INSTALL_GAZA_3D_STACK.ps1
powershell -ExecutionPolicy Bypass -File .\tools\VERIFY_GAZA_3D_STACK.ps1
powershell -ExecutionPolicy Bypass -File .\tools\START_GAZA_3D_DEV.ps1
```

Use `-MintLogin` on the installer only when an interactive Mint OAuth/account login is desired. Mint is an optional development-time asset service; the browser runtime must not depend on a paid Mint session.

The bootstrap installs/copies the curated GAZA skills, Mint Three.js Skills, registers Three.js DevTools MCP in OpenClaw, installs the Blender MCP gateway, prepares the Blender addon package when the release provides it, registers Blender MCP, registers Mint MCP for Codex/OpenClaw, and installs the local Playwright/Chromium QA harness.

### Hard version gates

- Node.js 22+ for the current Three.js DevTools MCP build.
- Python 3.10+ for Blender MCP gateway.
- Blender 4.2+ / 5.x for the selected Blender MCP implementation.

### Local QA

From `apps/gaza`:

```powershell
npm run dev
# another terminal
npm run qa
```

QA captures Strategy Twin, Plant 3D, Territory and a 390x844 mobile Strategy Twin screenshot into `.qa/` and fails on page/console errors.
