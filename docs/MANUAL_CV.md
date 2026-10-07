# Manual de usuario · CV editorial

**Acceso:** [Dossier recomendado](https://hectorlobatohernandez.github.io/cv/dossier.html) · [Portada CV](https://hectorlobatohernandez.github.io/start/cv.html) · [Variantes](https://hectorlobatohernandez.github.io/cv/)

## 1. Para una persona que visita por primera vez

1. Abrir el **Dossier 2026** para la lectura profesional completa. Usar **Atelier**, **Swiss**, **Monograph** y **Scroll World** para comparar direcciones visuales.
2. Revisar el perfil y las competencias; los botones de proyecto conducen a fichas documentadas.
3. Abrir los casos Mar Salada / GAZA / RHB STUDIO y, para otros casos, volver a [proyectos de la portada](https://hectorlobatohernandez.github.io/#projects).
4. Usar el correo visible para contactar. El dossier incorpora CSS de impresión, pero no se etiqueta como ATS; el CV ATS/PDF se valida por separado.

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

`cv/dossier.html` es la síntesis profesional recomendada. Conserva siete proyectos, destaca Mar Salada / GAZA / RHB STUDIO, reutiliza diagramas documentados y expone `window.__CV_DOSSIER__` para QA. No reemplaza las fichas fuente ni inventa material visual pendiente.
