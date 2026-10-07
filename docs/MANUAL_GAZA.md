# Manual de usuario · GAZA Operations Intelligence

**Inicio guiado:** [Mission Control](https://hectorlobatohernandez.github.io/apps/gaza/mission-control.html?guide=1) · [Portada del sector](https://hectorlobatohernandez.github.io/start/gaza.html)

## 1. Uso de Mission Control

1. Abrir la URL y pulsar **Entrar en Mission Control** en la guía inicial.
2. Seleccionar **1 Plant 3D**, **2 Control Tower**, **3 GIS 3D**, **4 Territory**, **5 Systems**. Las teclas **1–5** también funcionan cuando el foco no está dentro de un iframe.
3. Pulsar **M** para activar **Matrix**, que contiene cuatro vistas. Puede ser intensivo para equipos modestos.
4. El botón **Fullscreen** solicita pantalla completa; puede necesitar interacción o permisos del navegador.

Enlace para abrir directamente Matrix: `/apps/gaza/mission-control.html?view=matrix&guide=1`.

## 2. Demostración de la Control Tower

Abrir [Control Tower](https://hectorlobatohernandez.github.io/apps/gaza/?demo=1). El botón demo o la tecla **D** inicia la secuencia guiada; **Espacio** pausa/reanuda; **1/2/3** cambian capas y **R** reinicia. Esta interfaz muestra **expediciones, incidentes, KPIs y decisiones simulados** y no órdenes reales de almacén.

## 3. Plant 3D, geodatos y meteorología

- Plant 3D: escenario procedimental, movimientos y equipos representativos.
- GIS 3D / Campus GIS: comparar contexto OSM con un anclaje de planta confirmado como **aproximado**, no catastral/as-built.
- Territory: rutas OSRM de demostración; datos de tráfico DGT solo cuando el proveedor entrega información; clima Open-Meteo como campo público estimado.
- Farm Network: la red de granjas es un modelo con nodos públicos limitados y otros **sintéticos/anónimos**.
- Systems: descubrimiento de integraciones, **no** conexión autorizada a ERP/MES/PLC.

No interpretar el viento interpolado como CFD ni las ubicaciones de sensor propuestas como estaciones instaladas. Los fallos de red o APIs deben mostrarse como **no disponible**, nunca sustituirse silenciosamente por datos reales ficticios.

## 4. Seguridad y procedencia

No hay telecontrol de PLCs ni actuadores de seguridad. No hay información interna autenticada ni seguimiento de personas reales. Leer [PUBLIC_EVIDENCE.md](https://github.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/blob/main/apps/gaza/PUBLIC_EVIDENCE.md) y [ARCHITECTURE.md](https://github.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io/blob/main/apps/gaza/ARCHITECTURE.md).

El gateway de integración/AEMET vive en `services/gaza-integration-gateway/`: es **server-side**, requiere despliegue independiente y secrets en servidor. No poner claves en GitHub Pages.

## 5. Para desarrollo

- `apps/gaza/README.md`: superficies y escenarios.
- `apps/gaza/TEST_PLAN.md`: casos y aceptación.
- `apps/gaza/tests/` y GitHub Actions: visual QA, contratos y fixtures.
- Para obtener un twin as-built: CAD/BIM autorizado, topografía, catálogo de sistemas, contratos API y validación por la propiedad de la planta.

## 6. Resolución de problemas

**Pantalla en blanco:** abrir cada vista directamente desde la portada GAZA y comprobar soporte WebGL. **Mapa no carga:** proveedor OSM/OSRM/Overpass puede limitar peticiones; revisar indicador de no disponible. **Meteo sin datos:** verificar conectividad y proveedor. **Matrix lenta:** usar vistas individuales. **Demo no responde:** recargar sin `?qa=1` y volver a iniciar la secuencia.
