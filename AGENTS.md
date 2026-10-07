# Repository agent instructions

## GAZA scope
When changing `apps/gaza/**`, first read:
1. `skills/gaza-strategy-digital-twin/SKILL.md`
2. `apps/gaza/REFERENCE_VIDEO_SPEC.md`
3. `apps/gaza/PUBLIC_EVIDENCE.md`

Then load only the vendor skills needed by the task:
- visual/UI direction: `skills/vendor/anthropic/frontend-design/SKILL.md`
- video matching: `skills/vendor/mengto/video-to-superprompt/SKILL.md`
- 3D architecture: `skills/vendor/davila/3d-web-experience/SKILL.md`
- Three.js core/camera/animation/geometry/lighting/materials/performance: `skills/vendor/threejs/**/SKILL.md`
- browser QA: `skills/vendor/openai/playwright-interactive/SKILL.md` when its prerequisites are available.

GAZA invariant: never convert synthetic/demo information into an internal-company factual claim. Keep PUBLIC / LIVE PUBLIC / SYNTHETIC / TO VALIDATE provenance visible.

For the strategy twin, the reference-video interaction grammar takes precedence over generic dashboard aesthetics: bright isometric world, operational motion, selection-driven inspector, thin UI chrome, GAZA-specific farm-to-factory story.

## Other repo areas
Do not apply GAZA branding or simulation assumptions to unrelated projects.

## CV / editorial architecture
When changing `cv/**`, first read `skills/cv-editorial-architecture/SKILL.md`; when editing `cv/world.html` or its scroll behavior, read `skills/scroll-world/SKILL.md` and use the vendored MIT engine. Keep the previous React Bits CV available but do not reintroduce its neon/glitch aesthetic as the default. Never start paid image/video rendering without user approval.

## MAR SALADA case study
When changing `projects/mar-salada.html`, `assets/js/mar-salada-case.js`, `assets/css/mar-salada-case.css`, or its public media/story metadata, first read:
1. `skills/mar-salada-project/SKILL.md`
2. `skills/mar-salada-react-scroll/SKILL.md`
3. `skills/react-visuals/SKILL.md`
4. `skills/scroll-world/SKILL.md` when changing scroll/motion behaviour
5. `skills/xxxia-visual-production/SKILL.md` when changing generated media or motion briefs

MAR SALADA invariant: original user-supplied photos/videos are PRIVATE_REFERENCE_ONLY and must not be published or linked. The public case is React-first and must preserve evidence classification. Do not start paid motion rendering without explicit approval.
