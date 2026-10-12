# GAZA OPS · operación integrada e iluminación nocturna

Base: main69558db (PR115 vacas alineadas conservado). Entrega `gaza-live-20261012-v1`.

## Navegación y manejo

La planta operativa es Site Real con sus departamentos. `view=plant` dirige a `view=site`; Mission Control y Matrix no cargan la planta anterior. Se conserva el archivo histórico para trazabilidad y regresiones, no como vista activa. El dossier y `demostracion.html` siguen usando la misma aplicación. Los accesos a granja/laboratorio desde la planta conservan el ámbito de demostración o trabajo.

Consola superior: lote compartido, reloj, velocidad 1/4/8×, marcha/pausa e iluminación. `Turnos · Cargas · Alertas` abre equipo del turno, estado de mercancía, colas, decisiones pendientes e incidencias. Las selecciones viajan por claves/canales separados para demo y trabajo. Abrir una vista no renueva ni borra un registro.

Para presentar: abrir demostracion.html, seleccionar Planta, Granja o Laboratorio, elegir Ver de noche y Continuar proceso. Ver de noche NO adelanta la hora del turno. Las decisiones de aceptación, fabricación y expedición siguen siendo explícitas en Flujo/calidad; Autoplan no las aprueba.

## Noche

Las tres escenas usan la hora derivada del mismo reloj V2. La envolvente solar es artística, no efemérides. Se reducen ambiente y sol, se iluminan calles/edificios/laboratorio con emisivos, luces puntuales de presupuesto acotado y manchas de luz aproximadas. La planta añade una luz de inspección de carga: hasta ocho luces puntuales en esa escena; siete en granja/laboratorio. Ubicaciones y resultados son de simulación, no instalación medida ni cálculo de lux.

Ver de día/atardecer/noche son previsualizaciones compartidas y se etiquetan. No cambian cantidades ni época del escenario. Automático vuelve al reloj. Preparar demostración de tarde recrea exclusivamente el registro demo a 19:30, mediante sus transiciones válidas, sin aprobar calidad ni tocar el modo normal.

## Personal y horario

Turnos SIM y política opcional para impedir nuevas tareas, ensayos o revisiones fuera del turno. Producción, envasado, mantenimiento y determinados recursos tienen cobertura 24 h propuesta; el resto usa ventanas sintéticas. No conocemos los turnos reales de GAZA. Lo iniciado se termina o se entrega al relevo; la incubación no se congela al salir el técnico. Se mantienen retenciones, estado del equipo y decisiones de calidad.

Los personajes existentes reciben uniformes propuestos reutilizando identidades y rutas. Se detallan coches, tractores, remolques, espejos, parrillas, estribos, pilotos y rótulos. No se presenta una flota real nueva ni vestuario oficial. La actividad de proceso lee segundos y estados del registro.

## Cajas y briks

Geometría y grafismo ilustrativos GAZA, no SKU ni arte comercial certificado. La cisterna contiene leche a granel, nunca envases de venta.

Los palés existentes de almacén/muelle reciben envases en la misma asignación anterior. En el remolque de expedición, Ver carga de briks abre una sección y muestra símbolos solamente cuando `shippingL` contiene producto. Cantidades y pesos proceden de V2; no aparece stock por abrir la caja. El remanente se informa aparte. Al entregar, el registro mueve la cantidad a entregado y desaparece del vehículo. Una retención conserva la carga.

Para inspeccionar: Planta → Ver carga de briks, después de completar y revisar la fabricación/expedición del lote. Antes de existir producto en transporte se ve el remolque vacío, no una carga decorativa ficticia.

## Rendimiento y diagnóstico

Los informes de regresión previos mostraron un primer render lento al coexistir Granja, Laboratorio y Planta en un mismo navegador de software. Se conserva la misma prueba y límite temporal: no se han sembrado resultados ni sustituido WebGL para aprobarla.

La planta prepara shaders con `compileAsync` cuando el motor lo admite y expone fases de inicialización/compilación/primer fotograma/lista/error. Solo un dibujo real habilita lista; `startup.compileMs`, `startup.firstFrameMs` y `render.drawMs` son métricas del dispositivo de prueba, no tiempos universales.

Granja y laboratorio no repintan cada segundo una imagen estática. Se invalidan por estado, cámara, controles, tamaño, texturas y fuentes terminadas. El registro sigue escuchando cambios aunque no se dibuje un fotograma. Se conserva el máximo visual de 30 Hz, el LOD y la pausa de las vistas ocultas.

Three r180 y addons principales se sirven desde la propia aplicación con licencia/verificación de procedencia. Meteorología y cartografía públicas siguen siendo externas. No es una garantía offline ni de rendimiento idéntico en todas las GPU.

## Alcance de «en vivo»

El reloj corre dentro del navegador y la simulación mantiene tareas, recursos, genealogía y decisiones. Duraciones comprimidas de entrenamiento, no recetas ni ciclos medidos de fábrica. Al cerrar todos los clientes no continúa un servidor operacional. No hay PLC/ERP/OT conectado, asistencia real de empleados, servidor multiusuario, capacidad de vehículos validada o réplica as-built.

Recintos, censo representativo, alineación de cubículos, especies y trabajo concurrente del portfolio se conservan. Las referencias públicas siguen identificadas por fuente/fecha, separadas de parámetros sintéticos.

## Skill y aceptación

`skills/gaza-geospatial-industrial-twin/SKILL.md` se reorganiza como contrato único de GAZA LIVE OPS: navegación operator-first, una fuente de estado, evidencia, vehículos/carga, iluminación, rendimiento y prueba pública. Sustituye reglas obsoletas que designaban Plant legacy y contadores de entrenamiento como canónicos.

La revisión local completa ejecutó 159 pruebas unitarias, cero fallos. Las pruebas reales de navegador se realizan en CI, porque el entorno local no proporciona WebGL2. Exigir regresiones completas del head final, capturas nocturnas y de carga, y el recorrido posdespliegue contra GitHub Pages. Solo anunciar los resultados realmente confirmados; un build exitoso no acredita un render público.
