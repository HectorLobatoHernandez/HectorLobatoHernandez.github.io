# GAZA OPS · Planta por departamentos V1

## Alcance

Dentro de la vista existente **9 · SITE REAL**, accesible desde Plant 3D, se sustituye el esquema interior por 16 áreas seleccionables. No se crea otra app ni otro registro de producción. Farm y Labs, catálogo y motor de Procesos V2 se conservan.

Entrada: `mission-control.html?view=site`. Seleccionar un departamento y pulsar **Entrar al área** / **Plano interior**. También existe enlace directo `site-real-preview.html?dept=process`, `?dept=administration` o `?dept=asrs`. La geometría interior se muestra al abrir cubierta; el exterior existente se conserva. El visor OSM continúa separado del estudio hasta que se verifique su alineación.

## Despiece

Recepción/descarga, silos/materia prima, preparación/tratamiento genérico, CIP, envasado, materiales auxiliares, paletizado/staging, ASRS, muelles/expedición, recepción de personas, administración/planificación, coordinación/calidad, personal/vestuarios, mantenimiento, acceso a LABS y parking propuesto.

El ASRS representa nueve niveles, según referencia publicada por Esnova para GAZA. Columnas, calles, palés, capacidad y ubicación del modelo son ilustrativos, no inventario real. Máquinas de proceso, bombas, colectores, tubos, transportadores y puestos son genéricos sin modelos comerciales atribuidos. El esquema térmico tiene referencia general en Tetra Pak: NO implica que el equipo se haya suministrado a GAZA ni que esta secuencia sea su P&ID.

## Fachadas

Se mueve el rótulo grande a la cara corta del volumen rojo del acceso 1 y se añade el menor en la cara larga gris, siguiendo las capturas de marzo de 2025 del usuario. Las posiciones están parametrizadas en `SIGN_PLACEMENTS`: son fotointerpretadas, NO medidas. Se mantiene intacto `assets/gaza-logo.svg`, cuyo propio contenido lo describe como un gráfico de referencia del demostrador, no vector oficial aportado por la marca. No se reconstruye ni se modifica el wordmark y no se usan capturas de Google como texturas.

## Funciones acreditadas frente a propuesta

Las fichas incluyen fuente, alcance y limitaciones. `runtime/plant/model.mjs` conserva el registro de fuentes consultado el 11-10-2026:

- GAZA I+D+i: procesos/CIP/automatización/logística y mejora continua: https://www.lechegaza.com/I%2BD%2Bi.html
- GAZA calidad y trazabilidad: https://www.lechegaza.com/calidad-gaza.html
- Esnova, referencia de almacén de nueve niveles y Signode Storfast: https://www.linkedin.com/posts/esnova_almac%C3%A9n-autom%C3%A1tico-fabricado-por-esnova-racks-activity-6778236573809987584-akRa
- Veolia: calderas de vapor, potabilizadora, EDARI y residuos: https://www.veolia.es/casos-exito/leche-gaza
- Solmicro: referencia de cliente ERP, sin versión/API/topología actual: https://www.solmicro.com/clientes-erp/clientes-erp-solmicro/102277-leche-gaza-zamora
- Aula Láctea (función, no planta interior): https://www.lechegaza.com/aula-lactea.html
- DELTA: digitalización de procesos de agua: https://www.lechegaza.com/_proyectos/proyecto-delta.html
- Tratamiento genérico: https://dairyprocessinghandbook.tetrapak.com/chapter/long-life-dairy-products

No se presume la plantilla real, nombres de empleados, turnos, organigrama, oficinas concretas, recetas, software, versiones, capacidades ni emplazamiento de cada máquina. La existencia de referencias públicas de proveedores no demuestra que sigan operando hoy igual ni da permiso para conectarse a sus sistemas.

## Instalaciones traseras

Paneles solares: observación del usuario, pendiente de verificación. El lector de Google Maps no ofreció una vista satélite utilizable; tampoco se incorporaron Catastro/PNOA/LiDAR. No se añade una geometría que pudiera confundirse con campo solar confirmado. El enlace «Ubicación» consultado en la propia web corporativa dirige a la antigua dirección de Almaraz en Zamora: no se utiliza para georreferenciar Coreses. Número/capacidad de silos y la ubicación trasera siguen pendientes de datos verificables.

## Integración con simulación y administración

Solo proyección del `processStore` común. Producto/CIP/transportadores y elevación de lanzadera leen el progreso de tareas del lote seleccionado. Tiempo en pausa, equipo no apto, decisión pendiente o retención no fabrican movimiento ni cantidades. La decisión de calidad permanece manual en el módulo original. La subdivisión visible de la fabricación en máquinas es ilustrativa dentro de una única tarea existente; no se inventan suboperaciones completadas.

El panel de administración consulta cuatro documentos derivados: entrada de leche, orden de fabricación, existencias envasadas y expedición/entrega. Las cantidades proceden del registro, los palés mantienen el remanente y una incidencia posterior a la entrega se refleja sin borrar el material entregado. Exportación JSON con `SIMULATED_DERIVED_READ_ONLY`, lote y revisión de origen. No se emiten facturas/albaranes legales, precios, clientes, documentos firmados ni se conecta con un ERP real.

## QA

15 pruebas nuevas del modelo, más las 52 de núcleo/Labs/Procesos V2 se ejecutaron localmente con éxito. CI añade el navegador WebGL, lectura/selección sin mutación, cámaras, rutas/pausas/retenciones, exportación, especie y móvil; las capturas requieren revisión. `gaza-plant-detail-qa.yml` ejecuta esta suite separada mientras permanece la regresión global original. Esta nota no presupone un resultado remoto que aún no se haya obtenido.
