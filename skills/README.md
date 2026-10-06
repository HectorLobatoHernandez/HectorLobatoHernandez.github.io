# RHB / GAZA Agent Skill Stack

This folder vendors a small, reviewed skill stack for the GAZA Operations Intelligence build. The upstream skill text is kept intact where copied; licenses and notices are retained next to the vendored material.

## Active composition
The project-specific orchestrator is `gaza-strategy-digital-twin/SKILL.md`. It composes:
- Anthropic `frontend-design` — intentional, non-template UI direction.
- Meng To `video-to-superprompt` — reference-video decomposition and fidelity specification.
- latent-spaces `brag-slim` — short project/website launch videos, motion, soundtrack planning, poster frame and share copy without bundling Hyperframes or binary assets.
- `3d-web-experience` from the Claude Code Templates catalog — 3D web stack and model pipeline guidance.
- Allan Alton Three.js skills — core, camera, animation, geometry, lighting, materials and performance.
- OpenAI `playwright-interactive` — iterative browser functional/visual QA when the required local Playwright/js_repl environment is available.

## Why curated instead of installing everything
A smaller stack reduces conflicting instructions and context cost. GAZA needs deterministic Three.js, visual fidelity, performance, QA and a controlled media-output path; unrelated agent packs are intentionally excluded.

The full `/brag` distribution is deliberately not vendored here because it adds Hyperframes-specific references plus bundled audio assets. `brag-slim` supplies the launch-video workflow without those extra runtime assumptions. The full upstream plugin can be evaluated separately later if Hyperframes becomes part of the canonical RHB media stack.

## Local use
Repository-aware agents should follow the root `AGENTS.md`. For Codex outside the repo, run `tools/INSTALL_GAZA_SKILLS.ps1` from a local clone. The installer copies skill folders only; it does **not** enable Playwright's elevated sandbox prerequisites or change Codex/OpenClaw security settings.

After installation, `/brag-slim` can be used from the GAZA app, the portfolio/CV project, or another checked-out RHB project. Outputs go to `brag-output*/` and are intentionally ignored by Git until explicitly selected for publication.

## Updating
Review upstream changes before replacing vendored copies. Preserve LICENSE/NOTICE files and update `skills/manifest.json`.
