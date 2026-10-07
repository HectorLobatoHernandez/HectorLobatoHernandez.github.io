# Manual de usuario · RHB STUDIO

**Entrada pública:** [Portada RHB STUDIO](https://hectorlobatohernandez.github.io/start/rhb.html) · [Caso técnico](https://hectorlobatohernandez.github.io/projects/rhb-studio.html)

## 1. ¿Qué puede usarse públicamente?

Se puede consultar el caso, la arquitectura funcional y el esquema de herramientas. **No hay un backend público de CAD ni un panel de servicios OmniRoute/OpenClaw/NEXO conectado a esta página.** Las máquinas, credenciales y archivos del usuario no son accesibles desde GitHub Pages.

## 2. Flujo objetivo de proyecto

1. **Alta:** cliente, requisito, ubicación, versiones y alcance.
2. **Survey:** fotografías, cotas, material conocido y dudas por validar.
3. **Photo→CAD:** generación preliminar y revisión manual de medidas, plantas y alzados.
4. **Diseño:** soluciones alternativas, materiales y herrajes.
5. **BOM/presupuesto:** despiece y cantidades verificables; no cerrar con precios de proveedores sin fecha.
6. **Aprobación:** oferta firmada y congelación de revisión.
7. **Fabricación/montaje:** órdenes, soldaduras, acabados, seguridad y tolerancias.
8. **Control de calidad/entrega:** medición final, incidencias, archivos editables, manual y mantenimiento.

**Regla:** el CAD derivado de fotografías sin referencia métrica es **aproximado**. La validación dimensional de una pieza estructural o mecanizada corresponde a un técnico competente.

## 3. Comprobación de servicios locales (Windows)

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

## 4. Validación de un módulo de CAD

Elegir un ejemplo piloto autorizado (puerta o estructura de mesa) y generar, por versión: fotos fuente; cotas confirmadas; DXF/DWG/STEP según herramienta; plano de fabricación; BOM; costes; plan de montaje; checklist de QA. Confirmar apertura y edición del CAD en software real. No declarar un módulo finalizado por mostrar solo un render.

## 5. Integración y despliegue

Mantener repositorios/carpeta por proyecto, versiones, backup, permisos y registro de agentes. Sincronizar el estado activo desde PC antes de publicar; **no reemplazar datos locales por una versión web desfasada**. Cualquier servicio web real necesita autenticación, gestión de secretos y revisión de privacidad.

## 6. Incidencias

Si OmniRoute/OpenClaw no responden, revisar los puertos y procesos de forma local, sin asumir que los últimos registros del chat describen el estado actual. Recolectar logs de diagnóstico **con secretos ocultos**. Para perder el acceso a una API, resolver credenciales mediante los flujos oficiales de la herramienta, nunca publicarlas en GitHub.
