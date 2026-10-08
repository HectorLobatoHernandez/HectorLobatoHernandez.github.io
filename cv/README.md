# CV / Dossier profesional · Héctor Lobato

`dossier.html` es la entrada profesional canónica y usa React Bits de forma controlada. El antiguo portfolio principal se ha retirado; la raíz del sitio sirve directamente el mismo dossier canónico, sin redirección.

- `atelier.html`: editorial de arquitectura; serif Instrument, proporciones y fotografía.
- `swiss.html`: retícula suiza, Archivo, jerarquía precisa y proyectos indexados.
- `monograph.html`: monografía técnica, código documental, verde oscuro y cobre.
- `world.html`: recorrido con el motor original de `oso95/scroll-world` (MIT), cuatro escenas SVG creadas localmente, sin vídeos.

### Estado Scroll World

El engine es el código original de `skills/scroll-world/references/scrub-engine.js`. Aquí se usa su **modo de imágenes estáticas**, sin clips ni conectores generados. La experiencia es un storyboard con scroll/sutil zoom y transiciones; **NO** es todavía una secuencia cinematográfica de vuelo continuo. Para activar esa versión, producir imágenes y clips frame-locked conforme a `skills/scroll-world/SKILL.md`; Monid/Higgsfield requiere créditos y presupuesto autorizado. No iniciar gastos automáticamente.

Los visuales SVG son **conceptuales / ilustrativos** y no sustituyen planos reales.

### Performance / accesibilidad

CSS + JavaScript nativo; tipografías Google Fonts opcionales con serif/sans/monospace de respaldo. Sin build ni React. Soporta diseño responsive y `prefers-reduced-motion`. Se conserva la versión anterior en `/apps/presentation-lab/`.

### Estrategia

Elegir una variante base para el CV final. Usar Scroll World como sección de narrativa opcional, no como único medio de acceder a experiencia, casos y contacto.


### Dirección canónica 2026

- fondo negro real `#000000`;
- tipografía y UI en familia gris fría inspirada en Pantone Cool Gray;
- `TechText` en **Héctor Lobato** como elemento dominante del hero;
- `Particles` visibles en toda la experiencia, siempre en escala de grises;
- retrato con `DitherVeil` y botón para alternar a fotografía normal;
- sin acceso al antiguo portfolio principal desde las rutas de CV.


### CV ATS / PDF profesional

`ats.html` ya no es un resumen mínimo: funciona como CV profesional imprimible de 3 páginas A4 aproximadamente, con cronología laboral, responsabilidades técnicas, proyectos, formación superior, másteres en curso, certificaciones de fabricante, tecnologías, dominios de experiencia e idiomas. `ats.txt` mantiene el mismo contenido esencial para ATS.

Su edición se rige por `skills/cv-ats-pdf/SKILL.md`; la toolbar se limita a `Presentar 5 min` + `Imprimir / Guardar PDF`, sin enlaces redundantes al dossier. No inventar fechas/títulos de certificación ni másteres no documentados.

### ATS browser visual layer · Waves + PixelTrail

La vista web de `ats.html` comparte la gama IVORY ATLAS del dossier y monta una capa React separada: **Waves** ocupa todo el viewport y **PixelTrail** usa oliva `#93884B`. La capa es exclusivamente de presentación; `@media print` la elimina por completo y restaura el documento blanco/negro para exportación PDF y ATS.
