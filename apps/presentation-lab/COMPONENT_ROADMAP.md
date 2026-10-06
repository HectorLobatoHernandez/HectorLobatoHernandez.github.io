# React Bits · integration roadmap

Updated: 2026-10-06

## Principle

React Bits is a visual primitive library, not the application architecture. Components are promoted only when they improve hierarchy, state communication or storytelling.

## CV / technical portfolio

| Surface | React Bits candidate | Decision |
|---|---|---|
| Hero name / value proposition | BlurText or ScrollReveal | PILOT |
| Role line | RotatingText | PILOT |
| Featured projects | SpotlightCard | ADOPT in lab |
| Project media | TiltedCard / PixelTransition | PILOT |
| Numeric proof | CountUp | PILOT after metric validation |
| Section entrance | AnimatedContent / FadeContent | PILOT |
| CTA | Magnet / ClickSpark | OPTIONAL, non-critical only |

The CV must remain readable with JavaScript disabled where practical and must respect reduced motion.

## GAZA Operations Intelligence

Use motion to signal **state**, not decoration.

- Incident / exception cards: ElectricBorder or BorderGlow.
- Selected asset / entity: SpotlightCard.
- New event arrival: AnimatedContent.
- KPI transition: CountUp.
- Presentation/demo mode only: PixelTransition / richer backgrounds.
- Do not use SplashCursor, aggressive cursor effects or continuous decorative shaders on operational controls.
- Never let animation hide alarm state, units, provenance or source quality.

## RHB STUDIO

Good candidates:
- AnimatedList for agent activity / job queue.
- SpotlightCard for project and department cards.
- Folder for project-document grouping.
- Dock for secondary tool navigation.
- AnimatedContent for panel transitions.
- CountUp for budgets, project KPIs and production totals.

Avoid replacing standard tables, forms or CAD controls with novelty UI.

## Client websites / presentations

Good candidates:
- ScrollReveal / BlurText for chapter openings.
- SpotlightCard for services and case studies.
- Magnet for CTA.
- PixelTransition for before/after or project media.
- Selected animated backgrounds only when GPU load is bounded and the page has a static fallback.

## Promotion gates

A component moves from LAB → PORTFOLIO / GAZA / RHB only after:

1. mobile layout review;
2. keyboard and focus review;
3. `prefers-reduced-motion` behavior;
4. no console/page errors;
5. acceptable Lighthouse / render cost;
6. no conflict with technical readability;
7. source/license attribution retained where required.
