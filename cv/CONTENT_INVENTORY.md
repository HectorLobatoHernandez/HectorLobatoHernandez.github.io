# Inventario de contenido del CV · fuente protegida

**Fecha de inventario:** 2026-10-07. Este documento es la hoja de control del dossier editorial y del futuro CV ATS/PDF. `cv/dossier.html` es ya la síntesis web canónica; las variantes de `/cv/` siguen siendo experimentos **de forma** y las fichas de proyecto continúan siendo la fuente profesional.

## Datos de presentación existentes

- Nombre de firma: **Héctor Lobato**; base declarada en portfolio **Zamora**.
- Enfoque: **Systems Integration, Automation, IT/OT, AV, AI**, con trabajo de campo, documentación, fabricación y software.
- Eje de trabajo: **arquitectura → commissioning**, espacio físico + sistemas + software.
- Contacto: usar el existente del portfolio, sin duplicar emails o publicar datos personales nuevos en assets.
- Evitar inventar títulos académicos, certificaciones, resultados empresariales, fechas de empleos o experiencia no contrastada.

## Proyectos ya documentados en páginas individuales

| Prioridad de narrativa | Proyecto | Página fuente | Imagen/diagrama existente | Evidencia / estado |
| --- | --- | --- | --- | --- |
| Principal | Club Mar Salada | `projects/mar-salada.html` | `assets/visuals/mar-salada-system.svg` | Arquitectura de integración de AV, DSP, KNX/DALI; fotografía real final pendiente |
| Principal | GAZA Operations Intelligence | `projects/gaza-logistics-ia.html` | `assets/visuals/gaza-operations-system.svg` y UI del producto | Demo pública con simulación y datos públicos etiquetados, **no instalación validada en planta** |
| Principal | RHB STUDIO | `projects/rhb-studio.html` | `assets/visuals/rhb-studio-system.svg` | Proyecto/stack local-first en desarrollo; **runtime no publicado** |
| Secundario | Casa NOAH | `projects/casa-noah.html` | Solo contenido editorial disponible; verificar fotos | Caso de integración espacial y tecnológica |
| Secundario | Las Dalias / Akasha | `projects/las-dalias-akasha.html` | Solo contenido editorial disponible; verificar fotos | Caso destacado; confirmar alcance final antes de concretar |
| Secundario | Residencia tecnológica privada | `projects/private-tech-residence.html` | Solo contenido editorial disponible; verificar permisos | Mantener anonimato / confidencialidad |
| Secundario | XXXIA STUDIO | `projects/xxxia-studio.html` | Caso del stack tecnológico | Proyecto/laboratorio; diferenciar propuesta de ejecución |

## Conservación de contenido en el rediseño

Cada ficha final debe conservar:
1. Identidad y objetivo del proyecto.
2. Rol **tal como se documenta** en la ficha original.
3. Contexto y limitaciones.
4. Arquitectura técnica y subsistemas.
5. Implementación y puesta en marcha, solo donde esté documentada.
6. Resultados y pruebas, sin métricas no verificadas.
7. Imágenes de origen, créditos, permisos y etiqueta de origen.
8. Estado: realizado / en desarrollo / demostrador / propuesto.
9. Enlace al proyecto completo y siguiente lectura relacionada.

## Guion visual por scroll (no autogenerar hechos)

| Secuencia | Material gráfico admisible | Narrativa |
| --- | --- | --- |
| 00 Identidad | Foto de perfil actualmente publicada | Introducción y especialidades |
| 01 Obra / espacio | Diagrama Mar Salada; fotos reales autorizadas cuando lleguen | Del espacio a la instalación y commissioning |
| 02 Software industrial | Capturas reales de la **demo** GAZA; GIS 3D rotulado no as-built | De observabilidad y simulación a decisiones |
| 03 Ingeniería + CAD | Diagrama RHB; planos del proyecto piloto una vez validados | Del levantamiento al despiece y fabricación |
| 04 Archivo | Tarjetas vinculadas a Casa NOAH, Las Dalias, residencia privada y XXXIA | Profundidad de proyectos, sin inventar visuales |
| 05 Contacto | Tipografía y geometría editorial | Conclusión profesional |

**Imágenes pendientes no se sustituyen por fotografías ficticias sin rotular.** Un SVG diagramático representa arquitectura funcional, no necesariamente la apariencia real de un edificio.

## Criterios de aceptación del CV definitivo

- Todos los proyectos y la información relevante de las fichas anteriores siguen accesibles.
- La lectura funciona sin animaciones, sin vídeo y con teclado en móvil.
- El scroll alterna visuales que pertenecen realmente a la sección.
- La experiencia no oculta texto detrás de un canvas o secuencia audiovisual.
- Las tipografías tienen fallback; recursos gráficos con alt y licencia.
- La versión web y un futuro CV ATS imprimible se validan por separado.

## Estado de implementación

- `cv/dossier.html`: implementado como síntesis web canónica.
- Featured con visual documentado: Mar Salada, GAZA, RHB STUDIO.
- Archivo enlazado: Casa NOAH, Las Dalias/Akasha, residencia tecnológica privada, XXXIA STUDIO.
- Scroll World: laboratorio narrativo separado.
- ATS/PDF: pendiente como entregable específico y validación factual final.
