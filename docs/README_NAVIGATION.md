# Navegación pública del repositorio

Revisión editorial: 13 de octubre de 2026. Fuente inicial: `main` en `a3b9e813c2aafbf38b83e7e09779f924ec453979`.

## Entradas actuales

| Acceso | Destino público | Alcance |
| --- | --- | --- |
| Dossier profesional | https://hectorlobatohernandez.github.io/ | Entrada principal. El `index.html` actual ya contiene el dossier. |
| CV ATS / imprimir | https://hectorlobatohernandez.github.io/cv/ats.html | Página de candidatura imprimible; no se anuncia un PDF descargable inexistente. |
| Presentación de 5 minutos | https://hectorlobatohernandez.github.io/cv/present.html | Recorrido guiado existente. |
| GAZA · demo empresa | https://hectorlobatohernandez.github.io/apps/gaza/demostracion.html | Launcher mantenido por la aplicación; abre el recorrido con registro de demostración separado. |
| GAZA · planta actual | https://hectorlobatohernandez.github.io/apps/gaza/mission-control.html?view=site | Vista `site` vigente; evita la antigua guía de pestañas. |
| RHB STUDIO · demo | https://hectorlobatohernandez.github.io/apps/rhb/ | Demo browser-only. No implica que el runtime local esté desplegado. |
| RHB STUDIO · caso | https://hectorlobatohernandez.github.io/projects/rhb-studio.html | Presentación del proyecto. |
| SOUND CLUB | https://hectorlobatohernandez.github.io/projects/sound-club-palma.html | SOUND CLUB and restaurant (CLUB del MAR), Palma de Mallorca. |
| Experiencia 3D | https://hectorlobatohernandez.github.io/experience/ | Prototipo en desarrollo, no sustituto del dossier. |

Casa NOAH, Las Dalias / Akasha y la residencia tecnológica conservan sus casos públicos. No se han borrado aplicaciones, proyectos, recursos 3D, rutas de compatibilidad ni contenido profesional.

## Accesos retirados de la portada

Retirar un acceso de la navegación principal **no significa que devuelva 404**. La decisión también depende de si el destino sigue siendo la entrada adecuada.

| Acceso anterior | Decisión |
| --- | --- |
| `start/` como START HERE obligatorio | Sustituido por accesos directos; se conserva la página. |
| `start/gaza.html` como entrada principal a GAZA | Se prioriza `apps/gaza/demostracion.html`, enlazado por Mission Control actual. |
| `start/labs.html` | Se retira de la portada profesional; no se elimina el laboratorio. |
| `start/mapa.html` | Se retira del bloque principal: mezcla estudios de diseño con navegación y referencias anteriores. |
| `cv/` y sus cuatro estudios editoriales | Se retiran como recomendación principal. Siguen disponibles para trabajo de diseño. |
| `cv/world.html` / bloque Scroll World | El prototipo actual se presenta mediante `experience/`; no se elimina el motor ni el storyboard. |
| `cv/dossier.html` y raíz como dos portfolios distintos | Se elimina esa distinción: la raíz ya contiene el dossier profesional. Se conserva la otra ruta. |
| Mission Control con `guide=1` | Se utiliza la demo empresa y `view=site`. La guía incrustada aún contiene numeración anterior; no se modifica aquí la aplicación. |
| Matrix como arranque destacado | Se retira del primer nivel; sigue disponible dentro de Mission Control. |
| Estado de QA y cronología pendiente en la portada | Se retiran afirmaciones de estado fácilmente desactualizables y notas internas de candidatura. |

## Verificación

`tools/check_readme_links.py` comprueba los enlaces y las imágenes del README contra el árbol del repositorio. `--live` añade peticiones HTTP GET a las páginas públicas. `--previous HEAD^` audita también el README anterior, sin considerar un enlace antiguo retirado como un fallo de la nueva portada.

El informe JSON y los logs del workflow **README Links** son la evidencia de cada ejecución. La comprobación HTTP confirma respuesta y título; no ejecuta JavaScript, no valida WebGL y no certifica las funciones internas de GAZA, RHB ni los proyectos. Un fallo de red se informa como fallo, no como enlace verificado.

Las tarjetas SVG son recursos locales, sin servicios de badges, fuentes remotas ni scripts. Sus enlaces tienen alternativa textual y texto descriptivo. No se ha sustituido ni rediseñado el logotipo de RHB STUDIO.

## Mantenimiento

Mantener un destino principal por función, diferenciar caso documentado / demo / prototipo y conservar la distinción PUBLIC / LIVE PUBLIC / SYNTHETIC / TO VALIDATE de los proyectos. Antes de promocionar una ruta nueva, comprobar su contenido, sus parámetros y su estado publicado. Un HTTP 200 por sí solo no demuestra que el enlace sea el más actual.
