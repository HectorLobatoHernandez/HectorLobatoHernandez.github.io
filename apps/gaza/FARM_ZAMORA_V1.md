# GAZA FARM · recinto histórico de Zamora y red virtual

## Base de evidencia

Sustituye la escena genérica de `farm-labs.html?mode=farm` dentro de **6 · FARM** por un modelo del recinto de la antigua fábrica de Zamora. La planta de Coreses y el laboratorio permanecen en sus vistas. No se ha utilizado ninguna imagen generada como evidencia o textura.

Fuentes: fotografías del usuario, mapa anotado del perímetro, enlace histórico de localización GAZA (Almaraz 1, aproximadamente 41.5013093 / -5.7585331) y una respuesta real WMS de PNOA/IGN-CNIG. El ancla anterior 41.506/-5.744 no se conserva para esta parcela.

Captura de contexto: workflow `GAZA Zamora context discovery`, run 38116022298, artifact 11693243830. PNOA devolvió un PNG 1600×1245 de 5.415.098 bytes, bbox [-5.762,41.498,-5.750,41.505], EPSG:4326, consulta 2026-10-11. **Fecha de vuelo desconocida**: fecha de consulta no equivale a fecha de vuelo. Las dos consultas Overpass fallaron (504 y 500); no se atribuye la geometría a datos OSM obtenidos.

Se han digitalizado manualmente contorno, siete conjuntos de cubiertas, cuatro ejes viales y tres glorietas. Se convierten a coordenadas locales métricas X este / Y arriba / Z sur. La traza es interpretación de imagen, no parcela catastral ni levantamiento. Los edificios 3D simplifican esas cubiertas en marcos rectangulares; no reproducen cada irregularidad o anexo. Las alturas son estimaciones. La superficie se muestra redondeada y no es registral.

## Reconversión virtual

No se afirma que hoy exista una granja ni que esté permitida allí esa actividad. El uso de las naves como vacuno, ovino, ordeño, frío, sanidad, administración y alimento es una propuesta de entrenamiento. Corrales, itinerarios de animales, interior, maquinaria y personal son simulados.

La volumetría conserva el lenguaje fotográfico: ocre/ladrillo, zócalos azules, cerramientos, ventanas longitudinales y oficina de dos plantas. Rótulos reutilizan `assets/gaza-logo.svg`, referencia ya existente; sus posiciones son inferidas, no anclajes medidos ni un vector oficial certificado.

Castillo y catedral se colocan por referencia horizontal a la ortofoto, con geometría arquitectónica y relieve simplificados. No hay elevación LiDAR ni modelado monumental exacto.

## Red agregada, no doble producción

La granja maestra es una representación espacial única de múltiples orígenes. `runtime/processes/farm-network.mjs` produce aportaciones sintéticas que suman exactamente a cada lote. Se incorporan como ancestros a la genealogía del mismo registro Procesos V2, no a un contador alternativo.

El ejemplo contiene 64 orígenes vacunos y 16 ovinos, 9.600/2.400 litros previstos por escenario y 120/40 litros excluidos. **Todo ese reparto y esas cantidades son editables y sintéticos**. No constituyen censo, producción diaria ni distribución real de GAZA. La web oficial declara más de 80 ganaderías, pero no proporciona aquí el desglose ni el volumen consolidado que permitiría poblar la simulación con datos reales.

Los antiguos escenarios sin `sourceContributions` continúan válidos, sin inventarles retrospectivamente orígenes. La vista reutiliza el estado existente. Crear otra red requiere confirmación explícita para archivar y reiniciar; nunca suma cantidades del escenario archivado al nuevo.

Los pasos y transferencias siguen en el motor existente: preparación, alimentación, salud, ordeño, frío, limpieza, recogida, transporte, recepción, ensayos, decisiones, fabricación y expedición. El visor no modifica decisiones de calidad ni genera leche al mover un objeto. Litros producidos, tanque, cisterna, segregados y entregados se leen del registro.

## Interior y actividad

Siete estaciones conservan sus IDs. Naves diferenciadas, cubículos, cama, comederos, bebederos, material, oficinas, zona veterinaria, puestos de ordeño, colectores, dos depósitos por especie, tractor de alimentación, cisterna y ocho trabajadores ficticios. 26 animales representativos más dos actores ilustrativos de ordeño: no censo ni capacidad de alojamiento.

Coreografías ligadas al tiempo de la tarea: alimentación, circulación hacia ordeño, marcadores de leche/CIP y salida local de cisterna. No son un modelo animal individual, detección de colisiones validada, cálculo hidráulico, método veterinario ni control industrial. Trayecto de salida local; no sustituye el trazado vial completo a Coreses.

## Controles

Recinto completo, fachada histórica, plano cenital ortográfico, entrar al edificio, abrir cubiertas, aislar estación, contexto castillo/catedral y flujos. Selección también mediante botones de las siete estaciones.

`Contrastar ortofoto` consulta bajo demanda el WMS, con atribución y error explícito. La escena 3D se puede abrir sin esa consulta; requiere el CDN Three.js que ya usa el proyecto. `Exportar plano GeoJSON` genera la traza y sus metadatos, nunca un plano de ejecución.

`?legacy=1` conserva el bloque de representación antiguo byte por byte para revisión y compatibilidad. Labs y Plant no cambian su geometría.

## QA

17 pruebas nuevas, incluidas geometría, genealogía, sumas, límites, conservación, retrocompatibilidad, retención y construcción procedural. Con regresiones: 93 pruebas locales superadas. La nueva suite de navegador se ejecuta en `GAZA historic farm QA`, captura vistas exterior/interior/plano/móvil y comprueba red compartida, pausa, retención, separación de especie, exportación y continuidad del laboratorio.

No confundir pruebas unitarias locales con render validado: comprobar CI y capturas del commit final antes de publicar. Los workflows existentes de planta/laboratorio/procesos/regresión se mantienen.

Sin suscripciones, pagos, datos de empleados/clientes ni acceso a OT/ERP. Persistencia local al navegador/origen, no servidor multiusuario.
