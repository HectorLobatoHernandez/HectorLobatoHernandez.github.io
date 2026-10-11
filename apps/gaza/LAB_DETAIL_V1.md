# GAZA OPS · Laboratorio interior V1

## Alcance y procedencia

Detalle espacial de la vista existente `farm-labs.html?mode=labs`, accesible en **7 · LABS** y desde el edificio propuesto del laboratorio en Plant/Site Real. No se crea otra aplicación ni otro registro de producción.

**Todo el interior es un diseño de simulación**: distribución, proporciones, mobiliario, número de técnicos y equipos genéricos no están verificados en GAZA. La asociación funcional del laboratorio a Coreses no confirma su sala real. No es un as-built, SOP, acreditación ni instalación de bioseguridad validada.

Se conservan íntegros el catálogo de Procesos V2, sus ensayos, duraciones, cantidades, decisiones y controles. La geometría y el skyline de Farm se conservan; una prueba de hash compara el bloque de representación de granja contra la versión base.

## Áreas

0. Recepción y custodia: registro, lector, puesto de inspección y conservación ilustrativa.
1. Fisicoquímica e inhibidores: analizador de composición, lector de cribado, pH-metro ilustrativo y gradillas.
2. Microbiología: incubador asociado al ensayo final, puesto de preparación y microscopio ilustrativos.
3. Control de proceso/envase: mesa de inspección, envases de ejemplo y archivo de contramuestras propuesto.
4. Metrología: balanza/masas ilustrativas y puesto de documentación del estado de recursos.
5. Lavado/higiene: fregadero, material y autoclave ilustrativos. Sin método automático de esterilización.
6. Revisión de calidad: oficina, documentación y tres indicadores independientes del registro.

## Estados y actividad

17 equipos seleccionables; 6 recursos coinciden con el registro (muestreo + 5 ensayos). Los demás muestran **ilustrativo / sin ensayo**, nunca crean un resultado ni afirman un equipo real instalado.

Verde indica tarea/ensayo activo; azul claro, recurso ocupado por otro lote; rojo, equipo no apto o resultado adverso; gris, disponible o sin escenario. La ficha textual es la referencia accesible; el color no es el único indicador.

Las alícuotas visuales leen `sampleId`, estación y progreso de cada ensayo RUNNING. Recorren un pasillo propuesto y la puerta de su área durante la primera fracción del tiempo comprimido. **No crean nuevas muestras, volúmenes ni cadena de custodia ficticia en el registro**. Es una coreografía explicativa, no transporte físico instrumentado ni animación de una siembra real.

Siete personajes representan actividad por estación, no una plantilla acreditada ni seguimiento de empleados. La actividad instrumental se congela cuando no avanza el reloj del registro. Un HOLD retiene material; los ensayos de investigación compatibles no quedan falsamente cancelados.

## Controles

- Vista general, plano cenital ortográfico, recepción, microbiología y acercar al puesto.
- Muros bajos/altos, cubierta visible, aislar área y recorrido de muestras.
- Selección por edificio/equipo o mediante botones y selector accesibles.
- Tareas, ensayos y decisiones continúan en el panel Procesos V2. Ningún control de cámara escribe en el registro.

## Implementación

- `runtime/labs/layout.mjs`: distribución e inventario propuestos; proyección sin escritura.
- `runtime/labs/world.mjs`: piezas genéricas, particiones con puertas, mobiliario, batching/instancing, indicadores, técnicos y marcadores.
- `runtime/labs/viewer.mjs`: cámaras, selección, panel informativo, ciclo de vida y observación del registro.

Se mantiene Three.js 0.180.0. La CI intercepta su CDN usando la dependencia fijada; las pruebas no necesitan red meteorológica ni servicios de pago. La web pública conserva su dependencia del CDN existente. No se añaden claves, compras ni suscripciones.

## QA

`node --test tests/lab-detail.test.mjs` y `node tests/lab-detail-browser-qa.mjs` se ejecutan antes de las regresiones de Procesos V2 y Site Real. Capturas/informe bajo `.qa/lab-detail/`. El resultado debe revisarse en CI antes de fusionar; este documento no presupone el éxito de una ejecución todavía pendiente.

## Referencias externas (no evidencias del interior GAZA)

- Tetra Pak, Collection and reception of milk: https://dairyprocessinghandbook.tetrapak.com/chapter/collection-and-reception-milk — contexto general de muestreo y controles. No se copian límites ni tiempos de método al escenario.
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html — reutilización de geometría.
- Three.js OrbitControls: https://threejs.org/docs/pages/OrbitControls.html — navegación.

Revisión: 2026-10-11.
