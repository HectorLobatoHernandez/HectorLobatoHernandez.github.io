# CV dossier · React Bits attribution

The complete visual layer of `cv/dossier.html` uses interaction patterns adapted from React Bits:

- Waves — https://reactbits.dev/backgrounds/waves
- Particles — https://reactbits.dev/backgrounds/particles
- Lattice Loader — https://reactbits.dev/micro/lattice-loader
- Tech Text — https://reactbits.dev/text-animations/tech-text
- Dither Veil — https://reactbits.dev/animations/dither-veil
- Staggered Menu — https://reactbits.dev/components/staggered-menu

Upstream repository: `DavidHDev/react-bits`
Reviewed upstream snapshot: `63a008de65732d73010bd219d25d15c47739bb31`
License: MIT.

Implementation notes:

- GitHub Pages remains static HTML with a dependency-light React 18 island.
- Waves + Particles are mounted as a fixed full-page visual layer, not only inside the first fold.
- Tech Text treatment is used for the main name and extended to large dossier headings.
- Staggered Menu remains fixed and available while navigating the full dossier.
- The portrait is a single authorised photograph with an interactive Dither Veil canvas. There is no portrait carousel and no generated portrait imagery.
- Lattice Loader is used as the entry/loading state.
- Reduced-motion and static fallbacks remain available.
