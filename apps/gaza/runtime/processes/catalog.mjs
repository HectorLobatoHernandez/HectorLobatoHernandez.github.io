/** Training catalogue. Durations, quantities and station bindings are NOT GAZA SOPs. */
export const SOURCE_NOTES = Object.freeze([
  {id:'fao-farm',url:'https://www.fao.org/4/ba0027s/ba0027s00.htm',scope:'General dairy farm practice; not GAZA topology'},
  {id:'reception',url:'https://dairyprocessinghandbook.tetrapak.com/chapter/collection-and-reception-milk',scope:'Reception checks depend on the applicable plan; not all assays are immediate'},
  {id:'milk-quality',url:'https://dairyprocessinghandbook.tetrapak.com/chapter/raw-milk-quality',scope:'Raw milk quality and segregation; not a site-specific acceptance limit'}
]);
const task=(id,title,module,station,seconds,after,resource,role,steps,extra={})=>({id,title,module,station,durationSimSeconds:seconds,after,resource,role,steps,...extra});
export const TASKS = Object.freeze([
 task('FARM.BIOSECURITY','Acceso y bioseguridad','farm',0,6,[],'farm-access','SIM-FARM-01',['Registrar acceso y tarea','Comprobar higiene y circulación','Autorizar la entrada de entrenamiento']),
 task('FARM.FEED','Alimentación y agua','farm',1,10,['FARM.BIOSECURITY'],'feed-cart','SIM-FARM-02',['Comprobar alimento y agua','Asignar ración al grupo/especie','Registrar reposición e incidencias']),
 task('FARM.HEALTH','Sanidad y segregación','farm',5,8,['FARM.BIOSECURITY'],'health-station','SIM-VET-01',['Identificar animales con restricción','Excluir su leche del tanque comercial','Registrar el destino segregado']),
 task('FARM.MILKING','Ordeño identificado','farm',3,22,['FARM.FEED','FARM.HEALTH'],'milking-parlour','SIM-FARM-03',['Identificar especie y grupo apto','Preparar el puesto','Ordeñar y asignar origen a la leche','Separar la leche excluida']),
 task('FARM.COOL','Refrigeración del lote','farm',4,18,['FARM.MILKING'],'bulk-cooler','SIM-FARM-03',['Comprobar equipo','Refrigerar y registrar tendencia','Conservar especie y genealogía','Verificar disponibilidad para recogida']),
 task('FARM.CIP','Limpieza del circuito de ordeño','farm',3,16,['FARM.MILKING'],'milking-parlour','SIM-CLEAN-01',['Retirar el circuito de servicio','Ejecutar ciclo aprobado en escenario','Registrar verificación antes de nuevo uso'],{qualityIndependent:true}),
 task('COLLECTION.LOAD','Muestreo y carga de cisterna','farm',6,14,['FARM.COOL'],'tanker-bay','SIM-DRIVER-01',['Identificar tanque y compartimento','Registrar muestra de origen','Transferir sin mezclar especies','Crear entrega con lote padre']),
 task('LOGISTICS.TRANSIT','Transporte a recepción','logistics',null,24,['COLLECTION.LOAD'],'tanker','SIM-DRIVER-01',['Transportar el compartimento identificado','Registrar tiempo/condiciones del escenario','Llegar al control de recepción']),
 task('RECEPTION.SAMPLE','Identificación y muestra de recepción','labs',0,8,['LOGISTICS.TRANSIT'],'sampling-point','SIM-SAMPLER-01',['Comprobar entrega y cantidad','Identificar y sellar muestra','Registrar condiciones de llegada','Asignar plan analítico y custodia']),
 task('RECEPTION.UNLOAD','Descarga autorizada','plant',null,18,['RECEPTION.SAMPLE'],'unloading-pump','SIM-RECEPTION-01',['Verificar aceptación de descarga','Comprobar silo compatible','Transferir cantidad documentada','Registrar tanque/cisterna/silo'],{gate:'admission'}),
 task('PLANT.CIP','Disponibilidad higiénica de línea','plant',null,18,['RECEPTION.UNLOAD'],'cip-skid','SIM-CLEAN-02',['Comprobar programa aplicable','Registrar limpieza del circuito','Revisar verificación de disponibilidad'],{qualityIndependent:true}),
 task('PLANT.PROCESS','Fabricación identificada','plant',null,30,['RECEPTION.UNLOAD','PLANT.CIP'],'process-line','SIM-PROD-01',['Verificar disponibilidad para fabricación','Consumir silo autorizado','Transformar y registrar merma de escenario','Crear lote hijo de fabricación'],{gate:'manufacturing'}),
 task('PLANT.PACK','Envasado y muestra final','plant',null,22,['PLANT.PROCESS'],'packaging-line','SIM-PACK-01',['Vincular envase y orden','Envasar cantidad procesada','Identificar producto terminado','Enviar muestra final al laboratorio'],{gate:'manufacturing'}),
 task('WAREHOUSE.PUTAWAY','Almacenar producto identificado','warehouse',null,12,['PLANT.PACK'],'forklift','SIM-WMS-01',['Contar palés completos y remanente','Asignar ubicación de entrenamiento','Mantener bloqueo comercial hasta revisión']),
 task('DISPATCH.LOAD','Preparar y cargar expedición','logistics',null,18,['WAREHOUSE.PUTAWAY'],'outbound-dock','SIM-SHIPPING-01',['Verificar liberación final','Asignar palés completos a entrega','Registrar carga y cantidad remanente'],{gate:'dispatch'}),
 task('DELIVERY.ARRIVE','Entrega virtual documentada','logistics',null,24,['DISPATCH.LOAD'],'outbound-truck','SIM-DRIVER-02',['Transportar entrega identificada','Confirmar cantidad del escenario','Registrar final de la entrega'],{gate:'dispatch'})
]);
export const TESTS = Object.freeze([
 {id:'RAW.INTAKE',title:'Inspección de recepción',sample:'raw',station:0,resource:'intake-instrument',durationSimSeconds:6,gate:'admission'},
 {id:'RAW.INHIBITORS',title:'Cribado de inhibidores',sample:'raw',station:1,resource:'inhibitor-reader',durationSimSeconds:14,gate:'admission'},
 {id:'RAW.COMPOSITION',title:'Composición y fisicoquímica',sample:'raw',station:1,resource:'composition-instrument',durationSimSeconds:16,gate:'manufacturing'},
 {id:'FINAL.PACKAGING',title:'Control de envase y registros',sample:'finished',station:3,resource:'packaging-inspection',durationSimSeconds:9,gate:'dispatch'},
 {id:'FINAL.MICRO',title:'Ensayo microbiológico del plan demo',sample:'finished',station:2,resource:'microbiology-incubator',durationSimSeconds:55,gate:'dispatch'}
]);
export const GATES=Object.freeze({
 admission:{title:'Aceptación de descarga',tests:['RAW.INTAKE','RAW.INHIBITORS']},
 manufacturing:{title:'Disponibilidad para fabricación',tests:['RAW.INTAKE','RAW.INHIBITORS','RAW.COMPOSITION'],requires:['PLANT.CIP']},
 dispatch:{title:'Liberación de producto terminado',tests:['RAW.INTAKE','RAW.INHIBITORS','RAW.COMPOSITION','FINAL.PACKAGING','FINAL.MICRO'],requires:['PLANT.PACK']}
});
export const ROLES=Object.freeze({
 'SIM-FARM-01':'Responsable de acceso', 'SIM-FARM-02':'Operario de alimentación','SIM-VET-01':'Revisión sanitaria ficticia','SIM-FARM-03':'Operario de ordeño',
 'SIM-CLEAN-01':'Higiene de ordeño','SIM-CLEAN-02':'Higiene de proceso','SIM-DRIVER-01':'Conductor de cisterna','SIM-DRIVER-02':'Conductor de expedición',
 'SIM-SAMPLER-01':'Muestreo y custodia','SIM-LAB-01':'Técnico de laboratorio','SIM-QA-01':'Responsable de calidad ficticio',
 'SIM-RECEPTION-01':'Operario de recepción','SIM-PROD-01':'Producción','SIM-PACK-01':'Envasado','SIM-WMS-01':'Almacén','SIM-SHIPPING-01':'Expedición'
});
export const STATIONS=Object.freeze({
 farm:['Acceso y bioseguridad','Vacas / alimentación','Ovejas / alimentación','Ordeño e higiene','Tanques y refrigeración','Sanidad y segregación','Muestreo y recogida'],
 labs:['Recepción y custodia','Fisicoquímica / inhibidores','Microbiología','Control de proceso y envase','Metrología','Higiene y APPCC','Revisión y desviaciones']
});
export const DEFAULT_LOTS=Object.freeze([
 {id:'SIM-BOV-001',species:'BOVINE',plannedL:9600,excludedL:120},
 {id:'SIM-OVI-001',species:'OVINE',plannedL:2400,excludedL:40}
]);
export const DATA_BOUNDARY='SIMULACIÓN: duraciones comprimidas, cantidades y plan de control ficticios. No es un SOP de GAZA ni autoriza producto real.';
