# GAZA OPS — procesos comunes v2

## Estado de entrega

Implementación preparada sobre una copia local de los archivos GAZA publicados, con hashes comprobados contra `7d594fb726a31d01bbe5d72fc8e893ecae3c5394`. **No se ha publicado desde esta sesión:** el conector GitHub expone lectura, no escrituras. La rama local y el parche no son una rama remota.

## Alcance funcional

Un registro canónico `gaza:process-ledger:v2` conecta Workflow, Farm, Labs, Plant 3D y Site Real. Los registros anteriores se archivan al iniciar/reiniciar. El antiguo `gaza:operations-thread:v1` pasa a ser una proyección de solo lectura para los HUD existentes. El escritor anterior de Workflow y el lote de entrenamiento independiente de Farm/Labs dejan de ejecutarse. El antiguo módulo del motor v1 permanece sin importarse, para conservar su historia y sus pruebas.

- 16 tareas temporizadas, 5 ensayos del plan de ejemplo, 3 decisiones de calidad y 2 lotes separados por especie.
- Roles ficticios, recursos exclusivos, precedencias y colas. Un mismo equipo no atiende dos tareas simultáneas.
- Leche apta y segregada, tanque, compartimento de cisterna, silo, fabricación, envasado, palés completos, remanente, entrega y merma.
- Genealogía: origen → tanque → carga → silo → lote de fabricación → lote terminado → expedición. Las muestras conservan el origen correspondiente.
- Aceptación de descarga ≠ disponibilidad para fabricación ≠ liberación de producto terminado.
- Ensayos con espera de reloj simulado, custodia y vigencia de equipo. Resultado adverso/invalidado conserva auditoría; reensayo exige motivo.
- Retenciones por lote, corrección documentada y revisión ficticia. No hay retroceso que borre leche procesada o entregada. Una incidencia después de salida señala revisión de retirada.
- Autoplan solo programa tareas y ensayos conformes del escenario. No aprueba calidad.
- Datos inválidos fallan de forma cerrada. No se reemplazan por un escenario aparentemente válido.

## Integración visual

- Farm/Labs: seleccionar una de las siete estaciones no altera el lote ni adelanta operaciones; las acciones pertenecen al panel de procesos. Indicadores por estación y actividad de actores ligados a tareas/ensayos.
- Plant 3D: circulación de cisterna y expedición ligada al progreso de sus tareas; producción y ASRS se activan según el proceso. Se conserva la escena existente. La cifra de carga se muestra como litros simulados, no se convierte sin densidad en toneladas.
- Site Real: los dos vehículos usan sus recorridos existentes, pero su progreso procede del lote seleccionado; no repiten entregas en un bucle autónomo cuando existe v2. La geometría exterior no cambia.
- Mission Control: HUD de decisiones de descarga, fabricación y expedición del registro compartido.
- La animación es esquemática. No se afirma movimiento real, distancias de maniobra validadas ni una reproducción de la maquinaria de GAZA.

## Coordinación con el otro chat

No se han cambiado las coordenadas de edificios, recinto ni skyline de la granja. Se conserva el bloque de geometría existente y se cambia su vinculación funcional. `catalog.mjs` usa identificadores estables para poder reasignar la estación a las futuras geometrías.

El laboratorio pertenece funcionalmente a la planta. Su ubicación interior y maquinaria reales continúan sin verificar.

## Uso

En Workflow, pulsa **Iniciar escenario compartido**. Elige vacuno u ovino. Inicia tareas manualmente o activa Autoplan y el reloj. Cada decisión de calidad permanece detenida hasta una revisión explícita del perfil ficticio `SIM-QA-01`. Usa la sección de incidencias para registrar motivos, corregir y revisar. Una selección de plano o cámara nunca sustituye esas acciones.

Los tiempos son segundos de entrenamiento comprimidos: NO tiempos de cultivo, de transporte, ni de proceso industrial. El plan no es un APPCC o SOP validado. Los perfiles no implementan autenticación ni una firma electrónica real. No hay conexiones PLC/MES/WMS ni autorizaciones reales.

## Sincronización

Web Locks serializa las transacciones en un mismo origen seguro. `BroadcastChannel` y eventos `storage` informan a las otras vistas. El reloj calcula diferencias de tiempo sobre la marca común, para no multiplicar la velocidad por el número de pestañas. Sin Web Locks, las acciones de escritura se deshabilitan. Esta arquitectura es local al navegador: no ofrece sincronización multiusuario/multiequipo ni persistencia de servidor.

## Validación

Ejecutado localmente:

```sh
node --test apps/gaza/tests/process-ledger.test.mjs apps/gaza/tests/site-real-core.test.mjs
node apps/gaza/tests/operations-thread-qa.mjs
```

Resultado: **30 pruebas nuevas + 10 del núcleo Site Real, todas correctas**. También correcto el test histórico de operaciones v1 y la comprobación sintáctica de scripts modificados.

Pendiente, NO marcado como pasado:

```sh
cd apps/gaza
npm install --no-audit --no-fund
npx playwright install chromium
npm run dev
# Otro terminal, con el servidor activo:
npm run qa:process
node tests/master-farm-navigation-qa.mjs
npm run qa:all
```

El Chromium local de esta sesión no ofrece WebGL2 y bloquea la navegación de pruebas con `ERR_BLOCKED_BY_ADMINISTRATOR`. No se han sorteado esas restricciones. Por tanto, las pruebas de navegador/capturas incluidas requieren ejecutarse en CI o en un entorno autorizado antes de fusionar con `main`.

## Fuentes técnicas de referencia

- FAO/FIL: https://www.fao.org/4/ba0027s/ba0027s00.htm — prácticas generales de granja.
- Tetra Pak: https://dairyprocessinghandbook.tetrapak.com/chapter/collection-and-reception-milk — recepción y diferenciación de controles según el programa.
- Tetra Pak: https://dairyprocessinghandbook.tetrapak.com/chapter/raw-milk-quality — calidad de leche cruda y segregación.

Estas referencias no acreditan procedimientos, equipos o capacidades específicos de GAZA. Las cifras, duraciones y reglas concretas del catálogo son hipótesis de entrenamiento, no límites reglamentarios.
