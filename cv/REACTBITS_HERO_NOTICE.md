# CV dossier · React Bits attribution

The complete visual layer of `cv/dossier.html` uses interaction patterns adapted from React Bits:

- Waves — https://reactbits.dev/backgrounds/waves
- Particles — https://reactbits.dev/backgrounds/particles
- Lattice Loader — https://reactbits.dev/micro/lattice-loader
- Tech Text — https://reactbits.dev/text-animations/tech-text
- Logo Loop — https://reactbits.dev/animations/logo-loop
- Dither Veil — https://reactbits.dev/animations/dither-veil
- Staggered Menu — https://reactbits.dev/components/staggered-menu

Upstream repository: `DavidHDev/react-bits`
Reviewed upstream snapshot: `63a008de65732d73010bd219d25d15c47739bb31`
License at the reviewed snapshot: **MIT + Commons Clause License Condition v1.0**. The portfolio uses/adapts interaction patterns inside an application and does not redistribute the components as a standalone library.

Implementation notes:

- GitHub Pages remains static HTML with a dependency-light React 18 island.
- Particles are the dominant fixed full-page ambient layer; Waves remain deliberately subdued.
- Tech Text treatment is used for the main name and extended to large dossier headings.
- Logo Loop is used as a restrained technology/system rail below the skills section; typographic fallbacks are used where an approved logo asset is not available.
- Staggered Menu remains fixed and available while navigating the full dossier.
- The portrait is a single authorised photograph with an interactive Dither Veil canvas. There is no portrait carousel and no generated portrait imagery.
- Lattice Loader is used as the entry/loading state.
- Reduced-motion and static fallbacks remain available.
