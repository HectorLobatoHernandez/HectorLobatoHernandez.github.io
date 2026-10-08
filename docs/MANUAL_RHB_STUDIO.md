# Manual de usuario · RHB STUDIO

**Entradas públicas:** [Demo funcional](https://hectorlobatohernandez.github.io/apps/rhb/) · [Portada RHB STUDIO](https://hectorlobatohernandez.github.io/start/rhb.html) · [Caso técnico](https://hectorlobatohernandez.github.io/projects/rhb-studio.html)

## 1. ¿Qué puede usarse públicamente?

Se puede consultar el caso, la arquitectura y una **demo funcional browser-only**. La demo permite crear proyectos, editar estado, introducir cotas, visualizar geometría paramétrica esquemática, editar BOM/costes de demostración, simular routing por disciplina, generar Markdown/JSON y completar QA. Los cambios se guardan en `localStorage` del navegador. **No hay backend público de CAD ni conexión pública con OmniRoute/OpenClaw/NEXO.** Las máquinas, credenciales y archivos privados no son accesibles desde GitHub Pages.

## 2. Demo funcional pública

La demo de GitHub Pages sirve como prueba navegable del modelo de producto, no como réplica del runtime privado. Funciones públicas actuales:

- Project Core y stages;
- Survey / image intake local sin upload;
- sketch SVG paramétrico para los proyectos de referencia;
- BOM / estimate editable con cálculo automático;
- routing determinista por disciplina sin llamar modelos externos;
- generación local de brief Markdown y JSON;
- checklist QA y gate de handover;
- import/export del estado del navegador.

Los precios de ejemplo no son precios comerciales vigentes y los sketches no son planos de fabricación.

## 3. Flujo objetivo de proyecto

1. **Alta:** cliente, requisito, ubicación, versiones y alcance.
2. **Survey:** fotografías, cotas, material conocido y dudas por validar.
3. **Photo→CAD:** generación preliminar y revisión manual de medidas, plantas y alzados.
4. **Diseño:** soluciones alternativas, materiales y herrajes.
5. **BOM/presupuesto:** despiece y cantidades verificables; no cerrar con precios de proveedores sin fecha.
6. **Aprobación:** oferta firmada y congelación de revisión.
7. **Fabricación/montaje:** órdenes, soldaduras, acabados, seguridad y tolerancias.
8. **Control de calidad/entrega:** medición final, incidencias, archivos editables, manual y mantenimiento.

**Regla:** el CAD derivado de fotografías sin referencia métrica es **aproximado**. La validación dimensional de una pieza estructural o mecanizada corresponde a un técnico competente.

## 4. Comprobación de servicios locales (Windows)

Desde un clon local del repositorio, ejecutar PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\LOCAL_APP_READINESS.ps1
```

El script está descrito como diagnóstico **no destructivo** y verifica disponibilidad de servicios/rutas comunes. Ejecutarlo **no arranca** automáticamente todo el stack ni garantiza sus funcionalidades. Consultar la salida y corregir dependencias ausentes; no introducir credenciales en registros compartidos.

Para skills revisadas:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\INSTALL_GAZA_SKILLS.ps1
```

**Atención:** este instalador reemplaza las carpetas de skills de destino para los nombres listados. Revisar contenido/localizaciones antes de ejecutarlo si hay cambios manuales. No usarlo para sincronizar el código de RHB desde el PC.

## 5. Validación de un módulo de CAD

Elegir un ejemplo piloto autorizado (puerta o estructura de mesa) y generar, por versión: fotos fuente; cotas confirmadas; DXF/DWG/STEP según herramienta; plano de fabricación; BOM; costes; plan de montaje; checklist de QA. Confirmar apertura y edición del CAD en software real. No declarar un módulo finalizado por mostrar solo un render.

## 6. Integración y despliegue

Mantener repositorios/carpeta por proyecto, versiones, backup, permisos y registro de agentes. Sincronizar el estado activo desde PC antes de publicar; **no reemplazar datos locales por una versión web desfasada**. Cualquier servicio web real necesita autenticación, gestión de secretos y revisión de privacidad.

## 7. Incidencias

Si OmniRoute/OpenClaw no responden, revisar los puertos y procesos de forma local, sin asumir que los últimos registros del chat describen el estado actual. Recolectar logs de diagnóstico **con secretos ocultos**. Para perder el acceso a una API, resolver credenciales mediante los flujos oficiales de la herramienta, nunca publicarlas en GitHub.
