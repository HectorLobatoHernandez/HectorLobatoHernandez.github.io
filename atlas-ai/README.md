# ATLAS AI — Financial District V2

Segunda ciudad interactiva del dossier. **No reemplaza** `/atlas/projects/atlas.html` (ATLAS Diseño e Ingeniería).

## Arquitectura

- `index.html`: UI, cámara, Three.js, ciudad inicial, selección y timeline.
- `district-v2.mjs`: skyline secundario, fachadas instanciadas, canales, anuncios, iluminación arquitectónica, estructura técnica de cada parcela y tour FPV.
- `gaza-module.html?module=<id>`: página de navegación funcional para cada sector de GAZA.
- Vendor: `/atlas/assets/vendor/three-r180/`, sin dependencias CDN para el motor principal.
- Hosting: GitHub Pages, aplicación estática.

## Parcelas

| ID | Geometría adicional | Enlace |
| --- | --- | --- |
| `gaza` | Headquarters, núcleo, marcos y pantallas | Hub GAZA |
| `planta` | 9 niveles de estanterías ASRS, transportador y pórticos | Hub de Planta |
| `laboratorio` | Forjados, cápsulas y montantes técnicos | Hub Laboratorio |
| `granja` | Bandejas de cultivo, fachadas y flujos | Hub Granja |
| `logistica` | Muelles, camiones, zonas de carga | Hub Logística |
| `rhb` | Estructura en desarrollo y grúa | Sin enlace público definitivo |
| `xxxia` | Estructura en desarrollo y grúa | Sin enlace público definitivo |

La geometría es **conceptual y explicativa**, no es un modelo BIM `as-built`, no procede de mediciones de instalaciones reales ni sustituye documentación técnica.

## Controles

- **Estructura:** oculta las envolventes y muestra pórticos, núcleos y forjados.
- **Sistemas:** añade una capa de flujo/logística simulada sobre la estructura.
- **Tour FPV:** secuencia orbital por puntos de vista, interrumpible desde el mismo botón.
- **Día/Noche:** adapta exposición y luces. El texto 2300 K es referencia estética, no una medición fotométrica.
- **Calidad Alta/Media/Baja:** reduce pixel ratio y oculta detalles secundarios.
- **Timeline:** despliegue por fases y construcción por componentes; no simula un cronograma real de obra.
- **Elegir parcela:** panel lateral o clic en edificio.
- **Entrar:** abre la página de módulos, con enlaces verificados al panel general y Territorio donde corresponda.

## Pruebas

Workflow: `.github/workflows/atlas-ai-smoke.yml`. Incluye Chromium con SwiftShader, comprobación de dependencias/sintaxis, navegación por proyectos, overlays, calidad, modo nocturno y capturas de Ciudad/Estructura/Sistemas.

Para reproducir localmente desde raíz del repo:

```bash
python -m http.server 8000
# Abrir http://localhost:8000/atlas-ai/
```

## Rendimiento

Las ventanas y molduras periféricas se dibujan con `THREE.InstancedMesh`, no con un draw call por ventana. Usar el preset **Media** si se experimenta GPU throttling. La iluminación de resplandor usa geometría emisiva ligera y no postprocesado HDR con múltiples buffers.

## Siguiente iteración técnica

Integrar GLB/GLTF optimizados por proyecto con LOD, instancing, compresión KTX2/Meshopt y planos estructurales verificados. Separa `Source Geometry` (proyecto validado) de `Conceptual Set Dressing` (entorno ficticio). Añadir validación de FPS y presupuesto de geometría en dispositivos Windows/Android antes de conectar telemetría real por API.
