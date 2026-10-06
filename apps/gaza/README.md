# GAZA Operations Intelligence — Digital Twin Demo V2

MVP web responsive inspirado en patrones de warehouse-management visual y logistics control tower observados en las referencias de vídeo aportadas por el usuario.

## V2 implementado
- Digital Twin isométrico animado en Canvas, sin dependencias externas.
- Planta, ASRS, staging, 5 muelles, pallets, camiones y carretillas.
- Cámara con pan, zoom y home.
- Selección de activos con inspector lateral.
- KPIs live: stock, trucks on site, OTIF, dock utilisation, turnaround y dwell time.
- Shipment tracker de seis estados.
- Cola de muelles/vehículos y alertas operativas.
- Secuencia automática de demo end-to-end.
- Orders & Expeditions con búsqueda, filtros y alta de pedido sintético.
- Scenario Lab con cuatro incidencias.
- Comparación current plan vs proposed plan.
- AI Decision Support explicable.
- Aprobación/rechazo human-in-the-loop.
- Audit/event log y exportación JSON.
- Responsive desktop/tablet/mobile.

## Demo end-to-end
1. Pedido confirmado.
2. TR-204 llega a planta.
3. Se detecta falta de 2 pallets.
4. El motor calcula alternativas.
5. Se recomienda reasignación a D4.
6. Se solicita aprobación humana.
7. La replanificación se refleja en el Digital Twin y en KPIs.
8. La expedición se libera y queda registrada.

## Principio de seguridad
Todos los datos son sintéticos. No contiene información interna de Leche GAZA. No existe control PLC/ASRS. Una integración real debe comenzar read-only, separar IT/OT, registrar decisiones y validar las hipótesis mediante auditoría interna.
