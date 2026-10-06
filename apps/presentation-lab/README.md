# HL Presentation Lab · React Bits

Purpose: test React Bits selectively inside the existing static portfolio without migrating the whole site to a React build.

## Runtime

This lab is intentionally build-free for GitHub Pages:

- React 19 via ESM
- htm for JSX-free templates
- GSAP + ScrollTrigger via ESM
- local CSS
- React Bits behaviors copied/adapted into the application

## Included examples

1. **ScrollReveal** — primary CV value proposition.
2. **SpotlightCard** — highlighted project cards and system use-cases.
3. **Local Counter helper** — KPI motion example; not claimed as React Bits source.

## Promotion rule

Do not replace the current portfolio globally until the component passes mobile, reduced-motion, performance, visual comparison and accessibility review.

Recommended next React Bits candidates:
- BlurText / RotatingText for hero role line,
- AnimatedContent / FadeContent for section transitions,
- CountUp for validated numeric metrics,
- ClickSpark or Magnet only for non-critical calls-to-action,
- ElectricBorder / BorderGlow for exceptional state cards,
- ChromaGrid or TiltedCard for portfolio media when performance permits.

Avoid SplashCursor / heavy WebGL effects in operational dashboards or on low-power devices unless isolated and optional.
