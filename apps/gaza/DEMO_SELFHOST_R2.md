# GAZA · demostración visible R2

Continúa el PR #113 (publicado como 71ac8cc); no se aplica encima el paquete PS1 antiguo ni se crean dos controladores de presentación.

## Entrada

`start/gaza.html` recomienda `apps/gaza/demostracion.html`. La entrada estable dirige a Mission Control, FARM, `demo=company`, release `gaza-demo-20261012-r2`. Se conservan las entradas normales a Plant, Site Real, Farm, Labs, Workflow, GIS, Territory y Matrix.

La demo aislada de R1 se conserva: su registro, bloqueo de escritura y canal no son los del modo de trabajo. La cámara inicial muestra rebaños. Los 360 animales son símbolos representativos; el escenario, la reconversión ganadera y las cantidades siguen siendo simulaciones. La app no confirma qué carga el navegador del usuario hasta recibir evidencia de ese navegador.

## Motor del mismo origen

Se incluyen, sin modificación, seis archivos del paquete Three.js 0.180.0: núcleo, módulo, OrbitControls, GLTFLoader, BufferGeometryUtils y licencia MIT. Los archivos se descargaron del registro npm con scripts de instalación deshabilitados y se verificaron por SHA-256, longitud y Git blob antes de incorporarlos. Procedencia y hashes en `vendor/three-r180/PROVENANCE.json`. No se cambia de versión del motor.

El import map asigna `three`, los addons y los alias absolutos del CDN al MISMO módulo local. FARM, LABS, Workflow y Site Real solicitan R2 y conservan una sola identidad por módulo operativo. No se modifica el renderer de las vistas legacy que no forman parte de la presentación.

No se ha demostrado que la causa del fallo del usuario fuese el CDN o la caché. Esta revisión elimina esa dependencia del motor de las vistas de presentación y permite verificar su carga. La meteorología y la cartografía pública siguen siendo externas; no se afirma funcionamiento completamente offline.

## Seguridad y compatibilidad

No hay nuevas suscripciones, claves, conexión OT/ERP ni servidor multiusuario. No se toca el avatar ni las geometrías ya aprobadas. Los scripts y el workflow temporales que prepararon blobs con permisos de escritura NO se incluyen en esta versión; el QA final solo necesita lectura.

## Pruebas

`tests/selfhost-engine.test.mjs`: integridad, identidad del motor, resolución en subruta/localhost, release de documentos y conservación de los dos registros.
`tests/selfhost-demo-browser-qa.mjs`: usa la entrada real del dossier, bloquea jsDelivr y exige 360 símbolos con centros visibles, motor local, reloj activo, carga de Labs y Site Real, cero solicitudes al CDN y registro normal idéntico. No inyecta resultados ni simula éxito WebGL.
El workflow repite la navegación contra GitHub Pages después del merge. Sus informes y capturas distinguen `local` y `public`. NO dar por superada esta prueba por el simple éxito de Pages.

Se descarta el identificador del instalador DEMO-20261012-V1 en favor del release coherente del sistema ya integrado: gaza-demo-20261012-r2.
