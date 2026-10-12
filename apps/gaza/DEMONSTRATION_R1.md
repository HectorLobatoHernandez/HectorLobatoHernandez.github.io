# GAZA OPS · Presentación R1

## Motivo y diagnóstico
El usuario no veía el aumento de detalle. El artefacto GitHub Pages #351 contiene FARM LIFE V2. Sin una sesión en su navegador no puede afirmarse si abrió una copia local, una pestaña antigua o un módulo en caché.
Se detectan causas reproducibles de mala visibilidad: entrada por defecto a Plant/mini-granja en vez de FARM, cámara general muy alejada, rebaño pequeño de previsualización, módulos sin URL de versión y ausencia de estado visible de carga.

## Cambios
- `demostracion.html` abre la misma Mission Control directamente en FARM con `demo=company` y release explícita.
- Un script clásico síncrono instala el mapa de imports ANTES de cargar ESM. Cada módulo local recibe URL de release manteniendo una única identidad de store por documento; iframes y enlaces internos propagan release y modo.
- Controles visibles de rebaños, vacas, ovejas, ordeño, laboratorio, planta y trazabilidad.
- Cámara inicial centrada en ambos corrales y botón Ver REBAÑOS que deshace aislamiento para no dejar una escena aparentemente vacía.
- Contador de animales, release y centros proyectados al encuadre. El dato de encuadre cuenta centros en recintos abiertos/cutaway, no un algoritmo de oclusión completo.
- La previsualización normal no inicia producción. En la demostración se usa directamente densidad 360, representación de grupos, no censo real ni capacidad física.
- Mensaje de carga independiente de ESM y aviso explícito de fallo WebGL/CDN. No sustituye errores por un éxito ficticio.

## Aislamiento y seguridad
Un único reducer y catálogo, con registro persistido separado `gaza:company-demo:processes:v1`. Todos los módulos de presentación usan ese registro. Trabajo normal conserva `gaza:process-ledger:v2`, su canal y proyección anteriores. No se mezclan cantidades.
La entrada explícita de demo prepara el escenario con transiciones del motor hasta ordeño activo; revisiones de calidad siguen PENDING. No copia datos del escenario normal, no lo archiva, no lo reinicia y no aumenta su reloj. Repetir demo afecta únicamente a la partición de presentación.
La carga, fabricación y expedición requieren sus revisiones explícitas. El botón de revisión nombra decisión y lote y solo habilita acciones elegibles. No hay aprobación automática para hacer que parezca funcionar.
Los valores siguen siendo sintéticos. No se representan clientes, empleados, telemetría o uniformes reales ni capacidades autorizadas.

## QA
Pruebas de partición, escenario de demostración, masa/decisiones, URLs y caché. Navegador con el mismo enlace de presentación, sin preparación oculta de estado: ambos corrales visibles, anatomía y cambio entre departamentos, trabajo intacto y fotografías móvil. Prueba adicional posdespliegue contra el dominio público, sin interceptar el CDN, con espera de release y comprobación del iframe real.
No decir que se verificó el PC del usuario: el despliegue y el smoke público no diagnostican una caché privada. La sesión local de edición no dispone de WebGL2 y la prueba gráfica queda en CI.
La presentación utiliza FARM, LABS, Workflow y la planta ampliada SITE REAL. Las entradas legacy de Plant/Tower/GIS/Matrix se conservan en modo normal y no se abren dentro del registro aislado.
