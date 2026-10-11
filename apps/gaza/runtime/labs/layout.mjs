/** Proposed training laboratory, NOT the measured GAZA layout. Read-only scene projection. */
import {TESTS} from '../processes/catalog.mjs';
export const LAB_BOUNDARY='Interior propuesto, equipos genéricos y personal ficticio. No es el plano real del laboratorio GAZA. Tiempos SIM, no métodos analíticos.';
const area=(station,name,x,z,w,d,role)=>Object.freeze({station,name,x,z,w,d,role,provenance:'SIMULATED_LAYOUT'});
export const AREAS=Object.freeze([
 area(0,'Recepción y custodia',-12,5.5,7,7,'Muestreo y registro'),
 area(1,'Fisicoquímica e inhibidores',-10.5,-5.5,10,7,'Análisis instrumental'),
 area(2,'Microbiología',0,-5.5,10,7,'Preparación e incubación'),
 area(3,'Proceso y envase',10.5,-5.5,10,7,'Control de producto'),
 area(4,'Metrología',-4.5,5.5,7,7,'Verificación instrumental'),
 area(5,'Lavado e higiene',3,5.5,7,7,'Limpieza y material'),
 area(6,'Calidad y documentación',11,5.5,8,7,'Revisión humana SIM')
]);
const equipment=(id,station,type,name,x,z,resource=null,testId=null)=>Object.freeze({id,station,type,name,x,z,resource,testId,provenance:'SIMULATED_EQUIPMENT'});
export const EQUIPMENT=Object.freeze([
 equipment('LAB.REGISTER',0,'computer','Registro y lector de muestras',-13,7,'sampling-point'),
 equipment('LAB.INTAKE',0,'reader','Puesto de inspección de recepción',-10.5,6,'intake-instrument','RAW.INTAKE'),
 equipment('LAB.COLD',0,'fridge','Conservación de muestras · propuesta',-14.5,3.5),
 equipment('LAB.COMPOSITION',1,'analyzer','Analizador de composición · genérico',-12,-7.2,'composition-instrument','RAW.COMPOSITION'),
 equipment('LAB.INHIBITORS',1,'reader','Lector de inhibidores · genérico',-8.5,-7.2,'inhibitor-reader','RAW.INHIBITORS'),
 equipment('LAB.PH',1,'ph','pH-metro · elemento ilustrativo',-13.5,-3.5),
 equipment('LAB.INCUBATOR',2,'incubator','Incubador microbiológico · genérico',2.5,-7,'microbiology-incubator','FINAL.MICRO'),
 equipment('LAB.CABINET',2,'cabinet','Puesto de preparación · propuesto',-2.5,-7),
 equipment('LAB.MICROSCOPE',2,'microscope','Microscopio · elemento ilustrativo',-2.5,-3.8),
 equipment('LAB.PACKAGING',3,'packaging','Inspección de envases y registros',9,-7,'packaging-inspection','FINAL.PACKAGING'),
 equipment('LAB.RETAINED',3,'shelves','Archivo de contramuestras · propuesto',14,-6),
 equipment('LAB.BALANCE',4,'balance','Balanza y pesas patrón · ilustrativo',-5,7),
 equipment('LAB.METROLOGY',4,'computer','Estado metrológico de equipos',-2.5,6),
 equipment('LAB.WASH',5,'sink','Lavado y secado de material',2.5,7),
 equipment('LAB.AUTOCLAVE',5,'autoclave','Autoclave · elemento ilustrativo',5.2,3.6),
 equipment('LAB.REVIEW',6,'computer','Revisión de calidad · SIM-QA-01',10.5,7),
 equipment('LAB.DOCUMENTS',6,'shelves','Documentación del plan demo',14,6)
]);
export const CAMERAS=Object.freeze({
 overview:{position:[30,29,32],target:[0,0,0]},plan:{position:[0,44,.01],target:[0,0,0]},
 reception:{position:[-20,12,19],target:[-12,1,5]},micro:{position:[12,13,5],target:[0,1,-5]}
});
export function clamp01(n){return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0}
export function pointOnRoute(route,progress){
 if(!Array.isArray(route)||route.length<2||route.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n))))throw new Error('Ruta de laboratorio inválida');
 const lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1]));
 let distance=clamp01(progress)*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1){const t=lengths[i]?clamp01(distance/lengths[i]):0;return [route[i][0]+(route[i+1][0]-route[i][0])*t,route[i][1]+(route[i+1][1]-route[i][1])*t]}distance-=lengths[i]}
 return [...route[0]];
}
export function sampleRoute(station){
 const a=AREAS[station];if(!a)throw new Error('Estación inválida');
 if(station===0)return [[-13,5],[-12,5],[-10.5,5]];
 return [[-12,4],[-12,0],[a.x,0],[a.x,a.z>0?3.2:-3.2],[a.x,a.z]];
}
export function projectLab(state,lotId){
 const valid=state?.schemaVersion===2&&state.provenance==='SIMULATED'&&state.lots?.[lotId];
 const lot=valid?state.lots[lotId]:null,seconds=valid?state.clock.seconds:0;
 const instruments=EQUIPMENT.map(e=>{
  const eq=e.resource&&state?.equipment?.[e.resource];
  let running=null,owner=null;
  if(valid&&e.resource)for(const l of Object.values(state.lots)){
   const t=l.tests.find(t=>t.resource===e.resource&&t.status==='RUNNING');
   if(t){running=t;owner=l.id;break}
   if(e.resource==='sampling-point'&&l.tasks['RECEPTION.SAMPLE']?.status==='RUNNING'){running=l.tasks['RECEPTION.SAMPLE'];owner=l.id;break}
  }
  const last=lot&&e.testId?[...lot.tests].reverse().find(t=>t.testId===e.testId):null;
  const status=!e.resource?'ILLUSTRATIVE':!valid?'NO_SCENARIO':eq?.valid===false?'UNAVAILABLE':running?(owner===lotId?'RUNNING':'BUSY_OTHER_LOT'):last?.result||'READY';
  const progress=running?.readyAt!==undefined?clamp01((seconds-running.startedAt)/(running.readyAt-running.startedAt)):running?.elapsed!==undefined?clamp01(running.elapsed/8):0;
  return {...e,status,owner,progress,sampleId:running?.sampleId||last?.sampleId||null};
 });
 const samples=lot?Object.values(lot.samples).map(s=>({id:s.id,status:s.status,origin:s.nodeId})):[];
 const tokens=lot?lot.tests.filter(t=>t.status==='RUNNING').map(t=>{
  const def=TESTS.find(d=>d.id===t.testId),progress=clamp01((seconds-t.startedAt)/(t.readyAt-t.startedAt));
  const sample=Object.values(lot.samples).find(s=>s.id===t.sampleId);
  const eligible=sample?.status==='RECEIVED'&&state.equipment[t.resource]?.valid!==false;
  return {id:t.testId,sampleId:t.sampleId,station:def.station,position:pointOnRoute(sampleRoute(def.station),eligible?clamp01(progress/.2):0),progress,eligible,kind:'VISUAL_ALIQUOT_NOT_NEW_LEDGER_SAMPLE'};
 }):[];
 const rooms=AREAS.map(a=>({station:a.station,active:instruments.some(e=>e.station===a.station&&e.status==='RUNNING'),unavailable:instruments.some(e=>e.station===a.station&&e.status==='UNAVAILABLE')}));
 return {schemaVersion:1,provenance:'SIMULATED',ready:!!lot,lotId:lot?.id||null,species:lot?.species||null,seconds,held:!!lot?.holds,recall:!!lot?.recall,instruments,samples,tokens,rooms,gates:lot?Object.fromEntries(Object.entries(lot.gates).map(([k,v])=>[k,v.status])):{}};
}
