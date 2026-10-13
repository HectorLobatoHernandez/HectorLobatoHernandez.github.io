# GAZA OPS · móvil y actividad

Release: `gaza-mobile-20261013-v1`. Base revisada: main `0575cd2` y captura de código `0fc2f30` (solo añade workflow de revisión).

## Teléfono

La entrada estable `demostracion.html` conserva ahora `ui=mobile`. Detección automática por tamaño y puntero; opción explícita móvil/escritorio. No se cambia el registro, escenario o modelo por usar un teléfono.

La carcasa móvil muestra reloj/marcha, cuatro pestañas inferiores y Opciones. El canvas llena el área restante, sin cabeceras interiores duplicadas o panel lateral fijo. Panel abre el inspector original en un diálogo; Vistas permite elegir cada estación/departamento y ejecutar las cámaras originales. +/− usan la cámara activa. Un dedo gira; dos permiten zoom y desplazamiento. Se conserva el zoom de la página fuera del canvas. El modo horizontal reorganiza el encabezado y la navegación, no reparte el plano en miniaturas.

DPR móvil máximo 1,25. Las escenas ocultas conservan el registro y suspenden el dibujo. Ajustes técnicos: CSS `dvh`, `viewport-fit=cover`, márgenes `safe-area-inset-*`, controles de al menos 44 px. Documentación de referencia: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport ; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env ; https://threejs.org/docs/pages/OrbitControls.html . No se añade un service worker, caché offline ni app de tienda.

`start/mobile.html` enlaza los proyectos publicados. README incorpora ese acceso. Dossier, CV, portales y casos indicados reciben CSS de lectura/tacto; no se afirma que se hayan reconstruido todos los motores 3D ajenos a GAZA.

## Movimiento y horarios

La consola muestra cada tarea activa, su lote y estado y permite ir al área correspondiente. No se fuerzan las revisiones de calidad para hacer avanzar una demostración.

Las personas existentes reciben articulaciones de piernas y rondas de puesto ilustrativas. Los puestos con tarea hacen gestos relacionados con ella; los disponibles pueden recorrer su pasillo. Fuera del turno SIM se ocultan salvo continuidad de una tarea iniciada. No representan trabajadores reales, fichajes ni rutas medidas. Dos coches existentes representan tráfico sin mercancía en el eje viario del escenario. No son entregas, ni más plantilla, ni otro inventario.

Las cisternas, expedición, equipos de planta, muestras del laboratorio y actividad ganadera siguen las tareas del registro. Se interpola una copia exclusivamente gráfica entre ticks, hasta 0,3 segundos de reloj real por tasa de escenario: no se modifican cantidades, genealogía, eventos ni decisiones. Ninguna interpolación completa una tarea o supera una retención/equipo no apto. Pausa conserva las posiciones. Los ciclos reales y turnos GAZA siguen sin estar medidos.

## Pruebas y límites

Suite `mobile-motion.test.mjs`: política, presupuestos, geometría/timing de rondas, tangentes, inmutabilidad, pause/hold/equipo, turnos e integración. Navegador `mobile-browser-qa.mjs`: entrada real del launcher, 390×844, 360×800 y 844×390; cámara útil, paneles y zoom, contexto común, actividad, conservación del trabajo y acceso a proyectos. El workflow prueba la URL pública después del merge. Los resultados deben revisarse antes de afirmar publicado/validado.

Pruebas de navegador: emulación táctil Chromium; no equivalen a validación física de todos los iPhone, Android o Safari. Exige WebGL2 y un navegador actualizado. Sin servidor de simulación al cerrar todos los clientes, ERP/OT o telemetría de GAZA. Sin suscripciones o instalación local para el usuario.
