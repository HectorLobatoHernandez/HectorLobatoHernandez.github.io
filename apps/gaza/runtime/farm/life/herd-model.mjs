/** Herd sizing is an explicit hypothesis; it NEVER writes production or claims a real census. */
import {BUILDINGS,PADDOCKS,point,frame} from '../site.mjs';
export const EVIDENCE=Object.freeze({
 date:'2026-02-16',queriedAt:'2026-10-12',source:'Entrevista directa publicada por Campo Galego',
 url:'https://www.campogalego.es/en-leche-gaza-pagamos-un-precio-bastante-superior-para-que-el-ganadero-pueda-innovar-y-haya-relevo/',
 bovineCollectedLPerDay:150000,ovineCollectedRangeLPerDay:[6000,14000],farmsApprox:70,
 scope:'Recogida aproximada declarada en la entrevista, NO lectura actual ni capacidad de la parcela histórica.',
 conflict:'La página corporativa ganaderos.html mantiene «más de 80». Se conservan ambas referencias: no se inventa un reparto de socios por especie.',
 corporateURL:'https://www.lechegaza.com/ganaderos.html'
});
export const DEFAULTS=Object.freeze({days:1,bovineYield:30,ovineYield:2.5,bovineLactatingShare:.8,ovineLactatingShare:.7,density:'balanced'});
const positive=(v,max=1e8)=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=max;
export function validateAssumptions(a){
 if(!a||!positive(a.days,366)||!positive(a.bovineYield,100)||!positive(a.ovineYield,20)||!positive(a.bovineLactatingShare,1)||!positive(a.ovineLactatingShare,1)||!['light','balanced','dense'].includes(a.density))throw Error('Revisa días, rendimientos, proporción en lactación y densidad visual.');return a;
}
export function sizeHerd(grossL,yieldL,days,share){
 if(!Number.isSafeInteger(grossL)||grossL<0||!positive(yieldL)||!positive(days,366)||!positive(share,1))throw Error('Balance de censo no válido');
 const productive=Math.ceil(grossL/(yieldL*days)),adultFemales=Math.ceil(productive/share);
 return {grossL,productive,adultFemales,nonLactating:adultFemales-productive,potentialL:productive*yieldL*days,
  yieldLPerLactatingFemalePerDay:yieldL,days,lactatingShare:share,provenance:'CALCULATED_SCENARIO_NOT_CENSUS'};
}
export function weights(total,visible){
 if(!Number.isSafeInteger(total)||total<0||!Number.isSafeInteger(visible)||visible<0||visible>total)throw Error('Peso representativo inválido');
 if(!visible)return [];return Array.from({length:visible},(_,i)=>Math.floor(total/visible)+(i<total%visible?1:0));
}
export function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes;}
function distanceEdge(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
function toWorld(f,x,z){return [f.x+Math.cos(f.yaw)*x+Math.sin(f.yaw)*z,f.z-Math.sin(f.yaw)*x+Math.cos(f.yaw)*z];}
/** Grid spacing is a rendering clearance, not a livestock welfare or stocking-density standard. */
export function placements(species){
 const cow=species==='BOVINE',b=BUILDINGS.find(x=>x.id===(cow?'bovine':'ovine')),f=frame(b),spacing=cow?4.5:2.6,slots=[];
 for(const sign of [-1,1])for(let x=-f.w/2+3;x<f.w/2-3;x+=spacing){const z=sign*f.d*.32;slots.push({position:toWorld(f,x,z),yaw:f.yaw+(sign>0?Math.PI:0),zone:b.id,station:cow?1:2,space:spacing});}
 const ring=PADDOCKS.find(x=>x.species===species).corners.map(point),xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
 for(let z=Math.min(...zs)+spacing;z<Math.max(...zs)-spacing;z+=spacing)for(let x=Math.min(...xs)+spacing;x<Math.max(...xs)-spacing;x+=spacing){const p=[x,z];if(inside(p,ring)&&ring.every((a,i)=>distanceEdge(p,a,ring[(i+1)%ring.length])>spacing*.7))slots.push({position:p,yaw:(slots.length%4)*Math.PI/2,zone:cow?'cow-yard':'sheep-yard',station:cow?1:2,space:spacing});}
 return slots;
}
const cap={light:{BOVINE:40,OVINE:60},balanced:{BOVINE:80,OVINE:120},dense:{BOVINE:140,OVINE:220}};
export function herdPlan(view,assumptions=DEFAULTS){
 validateAssumptions(assumptions);
 return ['BOVINE','OVINE'].map(species=>{
  const cow=species==='BOVINE',gross=view?.lots?.filter(l=>l.species===species).reduce((n,l)=>n+l.plannedL,0)||0;
  const size=sizeHerd(gross,cow?assumptions.bovineYield:assumptions.ovineYield,assumptions.days,cow?assumptions.bovineLactatingShare:assumptions.ovineLactatingShare);
  const slots=placements(species),visible=Math.min(cap[assumptions.density][species],size.productive,slots.length),w=weights(size.productive,visible);
  // Spread symbols across barn AND paddock, without filling corridors or adding bodies on top of each other.
  const chosen=Array.from({length:visible},(_,i)=>slots[Math.floor(i*slots.length/visible)]);
  return {...size,species,visible,visualSlots:slots.length,spatialCompression:visible<size.productive,
   members:chosen.map((slot,i)=>({...slot,id:`SIM-ANIMAL-${cow?'BOV':'OVI'}-${String(i+1).padStart(3,'0')}`,weight:w[i],index:i,
    state:'REPRESENTATIVE_LACTATING_FEMALES',morphologySeed:i%3,scale:.9+(i%7)*.025}))};
 });
}
const MILKING=[['Entrada y espera',0,.15],['Identificación y preparación',.15,.32],['Colocación del equipo',.32,.43],['Extracción hacia circuito compatible',.43,.78],['Retirada y salida',.78,1]];
const CIP=[['Circuito fuera de producción',0,.2],['Circulación de limpieza SIM',.2,.8],['Verificación y disponibilidad',.8,1]];
export function operationPhase(task){
 if(!task)return {title:'Sin tarea',phase:-1,progress:0,flow:false,active:false};
 const p=Math.max(0,Math.min(1,task.progress||0)),steps=task.id==='FARM.MILKING'?MILKING:task.id==='FARM.CIP'?CIP:[['Trabajo de estación',0,1]];
 const i=p===1?steps.length-1:steps.findIndex(x=>p>=x[1]&&p<x[2]);
 return {title:steps[i][0],phase:i,progress:p,flow:task.status==='RUNNING'&&(task.id==='FARM.MILKING'?i===3:task.id==='FARM.CIP'?i===1:true),active:task.status==='RUNNING',status:task.status,
  provenance:'VISUAL_CHOREOGRAPHY_NOT_ANALYTICAL_OR_VETERINARY_SOP'};
}
/** Primary publication gives COLLECTED milk; add the separately chosen excluded scenario milk to gross. */
export function publicReferenceInputs(ovineTarget,excludedBovine=0,excludedOvine=0){
 if(!Number.isSafeInteger(ovineTarget)||ovineTarget<6000||ovineTarget>14000||![excludedBovine,excludedOvine].every(x=>Number.isSafeInteger(x)&&x>=0&&x<1e6))throw Error('Referencia ovina: elige 6.000–14.000 L/día y segregados no negativos.');
 return {bovineL:150000+excludedBovine,ovineL:ovineTarget+excludedOvine,bovineExcludedL:excludedBovine,ovineExcludedL:excludedOvine,
  collectedBovineL:150000,collectedOvineL:ovineTarget,referenceDate:EVIDENCE.date,days:1};
}
