# GAZA OPS · operación integrada e iluminación nocturna

Base: main69558db (PR115 vacas alineadas conservado). Entrega `gaza-live-20261012-v1`.

## Navegación
La planta operativa es ahora Site Real con sus departamentos. `view=plant` dirige a `view=site`; Mission Control y Matrix no cargan la planta anterior. Se conserva su archivo histórico para compatibilidad de código y regresiones, no como vista activa. El dossier y el enlace de demostración siguen usando la misma aplicación. Los accesos a granja/laboratorio desde la planta usan mensajes de navegación del mismo origen y conservan el registro de demostración.

La consola nueva ofrece un lote compartido, reloj, velocidad1/4/8, marcha/pausa, iluminación y panel de personal/carga/colas/incidencias. Las selecciones viajan por claves/canales separados para demo y trabajo. No se renueva ni borra un registro al abrir la vista.

## Noche
Las tres escenas usan la hora derivada del mismo reloj V2. La iluminación solar es una envolvente artística, no efemérides. Ambient y sol se reducen; luminarias de calles/edificios/laboratorio emiten y hay hasta siete luces reales por escena, con piscinas de luz aproximadas para mantener rendimiento. La ubicación añadida de postes/puntos y el cálculo lumínico son PROPIEDAD DE SIMULACIÓN, no instalación medida ni lux reglamentarios.

Las opciones Ver de día/atardecer/noche son previsualizaciones lumínicas compartidas y lo indican. No adelantan los lotes ni cambian la hora del turno. Automático vuelve al reloj del escenario. Preparar demostración de tarde recrea exclusivamente el registro demo por sus transiciones válidas, a19:30, sin aprobar calidad ni tocar el modo normal.

## Personal
Turnos SIM disponibles y política opcional para impedir nuevas tareas, ensayos o revisiones fuera del turno. Producción, envasado, mantenimiento y ciertos recursos continuos tienen cobertura24h propuesta; el resto usa ventanas sintéticas. No conocemos los turnos reales de GAZA. Lo ya iniciado se termina o se entrega al relevo; la incubación no se congela al salir el técnico. Ninguna política sustituye retenciones, estado de equipo o decisiones explícitas de calidad.

Personajes existentes reciben uniformes propuestos reutilizando las mismas identidades y rutas. Se detallan los coches existentes, tractores, remolques, espejos, parrillas, estribos, pilotos, acceso de carga y rótulos. No se inventa una flota real nueva. La animación de planta usa segundos del registro, no frames independientes.

## Cajas / briks
Los envases GAZA tienen geometría y grafismo ilustrativos propios. No se afirma que sean un SKU, dimensiones o arte final comercial. La cisterna conserva leche a granel, sin briks.
Los palés existentes del almacén/muelle reciben envases en la MISMA asignación visual anterior, sin otra ubicación de inventario. En el remolque de expedición, Ver carga de briks abre una sección y muestra símbolos únicamente cuando shippingL contiene producto. Las cantidades vienen de V2; cada grupo representa parte de los palés. El remanente se muestra aparte. Al completar la entrega, esa carga desaparece del vehículo y queda registrada como entregada. Una retención conserva cantidades y detiene el avance autorizado.

## Qué no equivale a «tiempo real» industrial
El reloj corre en vivo dentro del navegador. Las tareas siguen teniendo duraciones COMPRIMIDAS de entrenamiento, no tiempos medidos ni recetas de fábrica. No hay PLC/ERP/OT conectados, servidor multiusuario, telemetría real, calendarios laborales confirmados, capacidad de vehículos verificada ni réplica as-built. Geografía y geometría existentes conservan su clasificación fotointerpretada/propuesta. No se ejecuta trabajo en el PC del usuario ni se instala software local.

## QA
20 pruebas nuevas de horarios, iluminación, continuidad, invariantes y navegación, además de regresiones existentes. Nueva prueba de navegador integra planta/granja/laboratorio, lote y reloj compartidos, noche, turnos, carga autorizada, retención y móvil. El workflow repite contra Pages después del merge. Solo anunciar como publicado y comprobado lo realmente confirmado por esos informes.
