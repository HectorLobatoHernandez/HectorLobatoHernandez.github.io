# Corrección de orientación de vacas en cubículos

Solicitud del usuario: corregir dentro del mapa 3D las vacas que estaban perpendiculares a sus recintos. No editar ni generar una imagen.

Base revisada: main 88dd4a9. Alcance de producción: solo runtime/farm/life/herd-model.mjs. Se conservan el motor de leche, los edificios, las muestras, la cantidad de animales, sus pesos y las decisiones de calidad.

## Causa

La anatomía tiene el frente en +X local. Las posiciones de estabulación usaban el yaw longitudinal de la nave, paralelo al pasillo, aunque las camas se extienden sobre el eje Z local. Además, la retícula de animales (4,5) no coincidía con el paso de camas dibujadas (3,2). Son dimensiones del modelo propuesto, no cotas reales de GAZA.

## Cambio

Las vacas de las dos filas se giran ±90° respecto a la orientación de la nave. Sus cabezas quedan hacia el pasillo central, una fila frente a la otra. Se centran lateralmente en camas distintas. Tras revisar la primera captura se retrasa cada cuerpo dentro de la profundidad de su cama para evitar que la barra frontal lo atraviese: no se cambia el recinto, y se comprueba el encaje de todas las partes detalladas del modelo.

Se mantiene la cantidad y orden de posiciones interiores para no desplazar la población exterior ni cambiar sus orientaciones procedurales. No se giran globalmente los rebaños, los animales de la pradera, los ovinos, los actores de ordeño ni los vehículos. Las huellas, el entorno histórico y las geometrías no se modifican. Esta corrección tampoco constituye un cálculo ganadero o layout autorizado.

## Comprobación

Nueve nuevas pruebas verifican ambos sentidos, centrado lateral, ocupación única, coincidencia con las instancias de camas del renderer, matrices reales de animales, holgura de todas las partes frente a los límites y la barra, conservación de pradera/ovino por hash, densidades y estados de alimentación/retención. El navegador debe validar las dos filas y la inspección cercana antes de merge; el workflow repite la prueba contra la web pública después de publicar.

Identificador de la corrección: bovine-cubicles-20261012-v1. La versión de la demostración R2 y sus registros se conservan; no es necesario reiniciar el escenario. Una pestaña que ya tenía el módulo cargado debe recargarse con Ctrl+F5.
