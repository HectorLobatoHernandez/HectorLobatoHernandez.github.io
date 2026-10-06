# GAZA Operations Intelligence — Synthetic Demo

MVP web responsive para GitHub Pages basado en el concepto Logistics Control Tower · Digital Twin · AI Decision Support.

## Implementado
- KPIs: OTIF, dock utilisation, truck turnaround, dwell time, incidencias y coste sintético.
- Pedidos/expediciones con búsqueda y filtros.
- Digital Twin de ASRS (9 niveles), staging, muelles y camiones.
- Scenario Lab: falta de pallets, retraso de transportista, bloqueo de muelle y documentación incompleta.
- Comparación plan actual vs propuesta.
- Aprobación/rechazo human-in-the-loop.
- Registro de eventos y exportación JSON.
- Diseño responsive móvil/escritorio.

## Prueba de aceptación
Abrir /apps/gaza/ → Scenario Lab → Faltan 2 pallets → Calcular alternativas → Aprobar. Verificar cambio de KPIs, mitigación de incidencia y evento HUMAN_APPROVAL.

## Gobernanza
Todos los datos son sintéticos. No contiene información interna de Leche GAZA. No existe control PLC/ASRS. Una integración real debe comenzar read-only y validar hipótesis operativas mediante auditoría interna.
