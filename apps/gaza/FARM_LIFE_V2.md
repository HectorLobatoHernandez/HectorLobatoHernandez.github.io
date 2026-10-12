# FARM LIFE V2 · Anatomía, población y trabajo visible

Implementación sobre main 273cac3 (lectura verificada). Solo la granja existente; no sustituye los mapas ni modifica el catálogo/motor de leche. Labs y Plant se conservan para la siguiente revisión visual, y las primitivas de uniformes son reutilizables.

## Nueva evidencia de cantidades

Entrevista directa de Campo Galego, 16/02/2026, consultada 12/10/2026: en respuesta sobre recogida, la empresa declara aproximadamente 150.000 litros diarios de vaca y 6.000–14.000 de oveja, con estacionalidad. URL en runtime/farm/life/herd-model.mjs. Es una referencia fechada, NO telemetría actual. La entrevista indica unas 70 explotaciones; https://www.lechegaza.com/ganaderos.html mantiene más de 80. Ambas referencias se muestran sin inventar la conciliación ni un reparto por especie.

El botón de referencia prepara el formulario de red, sin iniciar ni reemplazar el escenario actual. Dado que la fuente habla de leche recogida, al bruto SIM se suman los segregados elegidos. El punto medio ovino de 10.000 es HIPÓTESIS, no una cifra exacta publicada. La confirmación de archivar/reiniciar sigue en el botón existente de creación de red.

## Censo equivalente

Hembras en lactación necesarias = techo(litros brutos del escenario / días representados / rendimiento L por hembra y día). Hembras adultas estimadas = techo(lactantes / proporción en lactación). Los rendimientos predeterminados 30 L/vaca/día y 2,5 L/oveja/día, periodo 1 día y proporciones 0,8/0,7 son HIPÓTESIS editables, no valores observados ni recomendaciones zootécnicas. No se interpreta el segundo SIM como un día.

No se crean animales reales ni leche en el registro a partir de estas cifras. El modelo de leche sigue siendo el existente; el censo es una proyección calculada. Los animales no lactantes se muestran en el cálculo, no producen. Los símbolos de animales lactantes representan grupos enteros que suman exactamente al censo productivo calculado. El ejemplo antiguo 9.600/2.400 L y las hipótesis predeterminadas equivalen a 320/960 hembras lactantes calculadas; no a 320/960 cabezas conocidas de GAZA.

La antigua parcela no se presenta como capaz de alojar toda la cabaña de la red. Los espacios de colocación respetan las naves/corrales actuales y dejan pasos vacíos. El límite de 100/200/360 símbolos es un presupuesto de render, NO capacidad legal o de bienestar. La inspección muestra cuánto representa cada símbolo. Sin escenario se ven animales ilustrativos y cero producción; no se inicia ningún registro implícitamente.

## Detalle visual

Modelos originales procedurales, no fotos: cuerpo y cuello orgánicos, cabeza, hocico, ojos, orejas, manchas de patrón variable, crotales ilustrativos, ubre/pezones, cola, cuatro patas articuladas y pezuñas separadas. Ovejas con vellón modulado y anatomía diferenciada. Modelos instanciados por especie/patrón, con dos niveles geométricos según cámara; sin archivos GLB de licencia desconocida.

Ocho personajes existentes reciben uniformes propuestos con articulaciones, botas, gorras, delantales o bandas de visibilidad y distintivo de referencia GAZA. No es el vestuario oficial ni una certificación EPI. Se mejora LA MISMA cisterna y el carro de alimentación: espejos, asideros, escalones, faros, parrilla, aros de depósito, escalera y válvula ilustrativa. No se duplica flota.

Canalones, bajantes, luminarias, barandillas, carteles por nave y 2.400 matas de pradera en la zona verde propuesta. No cambian las coordenadas, cubiertas de referencia, lindes ni edificios de otros proyectos.

El ordeño muestra entrada/preparación/colocación/extracción/salida; CIP, indisponibilidad/circulación/verificación. Son SUBETAPAS VISUALES de tiempos comprimidos, no nuevas tareas oficiales ni métodos de explotación. El registro solo contabiliza leche según las finalizaciones existentes. Los recorridos y gestos son representaciones ilustrativas, no un sistema de colisiones o un modelo biomecánico validado. Los dos actores de proceso ilustran la operación y no suman otro censo.

## Controles

Ver vaca / Ver oveja / Ver ordeño / Ver recogida, con el censo equivalente y los pesos visibles; rendimientos, periodo y densidad; referencia fechada con enlace; exportación JSON de censo SIM. Las hipótesis visuales se guardan en una clave separada, no en el libro de leche, y su cambio no altera stock, pruebas o calidad.

## Referencias generales

FAO/FIL 2012, Guía de buenas prácticas en explotaciones lecheras: https://www.fao.org/4/ba0027s/ba0027s00.htm . Apoya el reparto general en alimentación/agua, higiene de ordeño, sanidad y gestión; no confirma interiores reales o uniformes.
Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html . Se mantiene la dependencia 0.180.0 del proyecto.

## QA

15 pruebas nuevas de censo, pesos, periodo, procedencia, anatomía finita, densidad y retención; 112 unitarias con regresiones. Nueva suite de navegador con capturas de vaca, oveja, rebaños, ordeño, vehículo, paisaje y móvil. La suite histórica conserva sus comprobaciones y actualiza la expectativa del número de animales visibles: 26 era el prototipo sustituido, no el censo.
No afirmar publicado ni validado visualmente hasta comprobar CI del head final y revisar capturas. Sin suscripciones ni cambios de credenciales; registro local al navegador, no control industrial.
