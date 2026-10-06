# RHB / GAZA Agent Skill Stack

This folder vendors a small, reviewed skill stack for the GAZA Operations Intelligence build. The upstream skill text is kept intact where copied; licenses and notices are retained next to the vendored material.

## Active composition
The project-specific orchestrator is `gaza-strategy-digital-twin/SKILL.md`. It composes:
- Anthropic `frontend-design` — intentional, non-template UI direction.
- Meng To `video-to-superprompt` — reference-video decomposition and fidelity specification.
- `3d-web-experience` from the Claude Code Templates catalog — 3D web stack and model pipeline guidance.
- Allan Alton Three.js skills — core, camera, animation, geometry, lighting, materials and performance.
- OpenAI `playwright-interactive` — iterative browser functional/visual QA when the required local Playwright/js_repl environment is available.

## Why curated instead of installing everything
A smaller stack reduces conflicting instructions and context cost. GAZA needs deterministic Three.js, visual fidelity, performance and QA; unrelated agent packs are intentionally excluded.

## Local use
Repository-aware agents should follow the root `AGENTS.md`. For Codex outside the repo, run `tools/INSTALL_GAZA_SKILLS.ps1` from a local clone. The installer copies skill folders only; it does **not** enable Playwright's elevated sandbox prerequisites or change Codex/OpenClaw security settings.

## Updating
Review upstream changes before replacing vendored copies. Preserve LICENSE/NOTICE files and update `skills/manifest.json`.
