# Manual de usuario · CV editorial

**Acceso principal:** [Dossier profesional](https://hectorlobatohernandez.github.io/) · [Presentar en 5 min](https://hectorlobatohernandez.github.io/cv/present.html) · [CV ATS](https://hectorlobatohernandez.github.io/cv/ats.html) · [Variantes](https://hectorlobatohernandez.github.io/cv/)

## 1. Para una persona que visita por primera vez

1. Para una reunión o pantalla compartida, abrir **Presentation Route**. Para lectura detenida, abrir el **Dossier 2026**. Usar **Atelier**, **Swiss**, **Monograph** y **Scroll World** para comparar direcciones visuales.
2. Revisar el perfil y las competencias; los botones de proyecto conducen a fichas documentadas.
3. Abrir los casos Sound Club, Palma / GAZA / RHB STUDIO y, para otros casos, volver a [proyectos de la portada](https://hectorlobatohernandez.github.io/#projects).
4. Para candidatura y exportación PDF, abrir `cv/ats.html` y usar imprimir/guardar PDF. Para copiar a portales ATS, usar `cv/ats.txt`.

## 2. Lectura por scroll

Las secciones narrativas muestran una imagen/diagrama y el texto relacionado. En el storyboard Scroll World, desplazar con rueda o panel táctil; los puntos y menús de sección permiten saltar de escena. En dispositivos con movimiento reducido se conservan láminas sin vídeos animados. Las escenas SVG actuales son **ilustraciones conceptuales**, no planos de fabricación.

## 3. Cómo comprobar las fuentes

Consultar `index.html` y `projects/*.html` antes de modificar fechas, títulos, empleadores o logros. No suponer cualificaciones académicas no verificadas. Las fichas de proyectos son el archivo de referencia y cualquier resumen debe enlazar a ellas.

## 4. Para editores y responsables del proyecto

- Las variantes usan HTML/CSS/JavaScript nativo y no requieren un build de React.
- `cv/README.md` y `skills/cv-editorial-architecture/SKILL.md` definen estilo, UX y límites.
- `cv/tests/visual-qa.mjs` realiza QA en Chromium para móvil, escritorio, navegación y scroll.
- `skills/scroll-world/` contiene motor original MIT; la generación de secuencias de vídeo y el gasto asociado requieren un proyecto aparte.

## 5. Incidencias

Si el movimiento molesta, activar la opción del sistema **reducir animaciones**. Si falla una ilustración o estilo remoto, abrir la ficha de proyecto clásica. Un enlace roto se reporta en GitHub como issue con URL y captura.

## 6. Dossier canónico

`cv/dossier.html` es la síntesis profesional canónica y también el destino de la raíz pública del sitio. Conserva siete proyectos, destaca Sound Club, Palma / GAZA / RHB STUDIO, reutiliza diagramas documentados y expone `window.__CV_DOSSIER__` para QA. No reemplaza las fichas fuente ni inventa material visual pendiente.

## 7. CV ATS

`cv/ats.html` es una versión de una columna, semántica y preparada para imprimir/guardar en PDF. `cv/ats.txt` contiene el mismo núcleo en texto plano. La versión actual es **project-based** porque la cronología laboral completa por empresa/cargo no está todavía verificada; no inventar esas fechas para rellenar el CV.

## 8. Presentation Route

`cv/present.html` es el punto de entrada para una presentación breve. Orden recomendado: Dossier → Sound Club, Palma → GAZA Mission Control/Systems → RHB STUDIO → ATS/GitHub. Expone `window.__CV_PRESENT__` y no añade hechos nuevos: sólo organiza evidencias existentes.

## 9. Dirección visual canónica

El dossier usa fondo negro real y una escala gris verdosa inspirada en Pantone. El nombre **Héctor Lobato** y los títulos principales usan TechText como demostración visible de interacción React. El portfolio clásico ya no forma parte de la entrada pública ni se conserva como página HTML activa. La raíz sirve directamente el dossier.

### React TechText

El nombre y los títulos principales deben mostrar interacción de letra, outline, selección técnica, labels, specks, sweep automático y drag controlado. Particles/Waves permanecen visibles en toda la página como capa demostrativa, con fallback de movimiento reducido.
