# GAZA OPS · móvil y actividad

Release: `gaza-mobile-20261013-v1`. Base revisada: main `0575cd2` y captura de código `0fc2f30`.

## Teléfono

La entrada estable `demostracion.html` conserva `ui=mobile`. Detección automática por tamaño y puntero; opción explícita móvil/escritorio. No se cambia el registro, escenario o modelo por usar un teléfono.

La interfaz móvil muestra reloj/marcha, cuatro pestañas inferiores y Opciones. El canvas llena el área restante, sin cabeceras interiores duplicadas o panel lateral fijo. Panel abre el inspector original en un diálogo; Vistas permite elegir cada estación/departamento y ejecutar las cámaras originales. +/− usan la cámara activa y Centrar vuelve al encuadre general. Un dedo gira; dos permiten zoom y desplazamiento. Se conserva el zoom de la página fuera del canvas. El modo horizontal reorganiza el encabezado y la navegación, no reparte el plano en miniaturas.

DPR móvil máximo1,25. Las escenas ocultas conservan el registro y suspenden el dibujo. CSS dvh, viewport-fit=cover, márgenes safe-area-inset-* y controles táctiles. Referencias: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport ; https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env ; https://threejs.org/docs/pages/OrbitControls.html . No se añade service worker, caché offline ni app de tienda.

`start/mobile.html` enlaza los proyectos publicados. README incorpora ese acceso. Dossier, CV, portales y casos indicados reciben CSS de lectura/tacto; no se afirma que se hayan reconstruido todos los motores3D ajenos a GAZA.

## Movimiento y horarios

Actividad muestra cada tarea activa, su lote/estado y permite ir al área correspondiente. No se fuerzan las revisiones de calidad para avanzar una demostración.

Las personas existentes reciben articulaciones de piernas y rondas de puesto ilustrativas. Los puestos con tarea hacen gestos relacionados con ella; los disponibles pueden recorrer su pasillo. Fuera del turno SIM se ocultan salvo continuidad de una tarea iniciada. No representan trabajadores reales, fichajes ni rutas medidas. Dos coches existentes representan tráfico sin mercancía en el eje viario del escenario; no son entregas, más plantilla u otro inventario.

Las cisternas, expedición, equipos, muestras y actividad ganadera siguen las tareas del registro. Se interpola una copia exclusivamente gráfica entre ticks, hasta0,3segundos de reloj real por tasa de escenario: no se modifican cantidades, genealogía, eventos ni decisiones. Ninguna interpolación completa una tarea o supera una retención/equipo no apto. Pausa conserva posiciones; una retención conserva también la última pose del trabajador. Ciclos y turnos reales GAZA siguen sin medir.

## Arranque nocturno

Se corrigió un caso detectado al revisar capturas: abrir Planta mientras el registro ya estaba en previsualización nocturna podía sobrescribir inicialmente el sol/fondo con ajustes locales de día. Con escenario existente, la inicialización respeta la luz común. El diagnóstico incluye color de fondo e intensidad solar reales del renderer; la prueba exige esos valores, no solo una etiqueta night en el estado. La previsualización sigue sin cambiar la hora ni las cantidades.

## Pruebas y límites

174 pruebas unitarias locales y en preparaciónCI superadas. Preparación de correcciones38448566549, artifact11838588652: seis archivos originales/finales verificados por GitSHA ySHA256; no movió refs. Los scripts/payloads/workflows temporales con escritura se excluyen del árbol final.

La suite móvil anterior a la corrección nocturna (run38447332724/artifact11839326426) pasó12grupos y produjo capturas revisadas: granja, laboratorio, planta, horizontal y actividad. Debe completarse la suite FINAL y repetirse contra GitHub Pages antes de afirmar publicada esta revisión.

Navegador mobile-browser-qa.mjs: entrada real del launcher,390×844,360×800 y844×390; cámara útil, paneles/zoom, contexto común, arranque con iluminación efectiva, movimiento de personal/coches, conservación de datos y lectura de proyectos. Emulación táctil Chromium; no equivale a prueba física de todos los iPhone, Android o Safari. RequiereWebGL2. No hay servidor autónomo al cerrar todos los clientes, ERP/OT o telemetría de GAZA.

## Comprobaciones antiguas ajenas a GAZA

Las suites CV Editorial y MAR SALADA conservan expectativas anteriores al cambio móvil. Se comprobó byte por byte que tanto cv/present.html y su test como el manifiesto SOUND CLUB y el workflow MAR SALADA ya eran iguales en main0575cd2: el contenido usa OBSIDIAN_EDITORIAL frente a la expectativa IVORY_ATLAS, y SOUND_CLUB_CDM frente a MAR_SALADA_CDM. No se ha revertido el nombre/diseño vigente para satisfacer esas pruebas ni se han eliminado sus aserciones. Esas suites no se declaran superadas; necesitan una revisión independiente de contratos. Evidencia estática: tests/mobile-legacy-baseline.json. Las comprobaciones móviles específicas de Dossier,ATS y portada verifican ancho/lectura sin reemplazar la validación completa de esos otros proyectos.
