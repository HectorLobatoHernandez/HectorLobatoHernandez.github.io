import {TRIPS} from '../fleet/model.mjs';
import {TASKS} from '../processes/catalog.mjs';

// Read-only logistics projection. No SKU catalogue, rack capacity or truck assignment
// is available from GAZA; the two product families and capacities below are SIM only.
export const DEMO_CAPACITY_PER_FAMILY=16;
export const FLEET=TRIPS.map(({id,name,kind,color,destination})=>({id,name,kind,color,destination}));
const safe=n=>Number.isFinite(n)&&n>=0?n:0;
const loadDuration=TASKS.find(t=>t.id==='DISPATCH.LOAD')?.durationSimSeconds||1;
export function projectDocks(state,truckId){
 const truck=FLEET.find(v=>v.id===truckId)||FLEET[0];
 const cap=Number.isSafeInteger(state?.config?.palletCapacityL)&&state.config.palletCapacityL>0?state.config.palletCapacityL:720;
 const lots=Object.values(state?.lots||{}).filter(l=>l?.mass&&l?.tasks&&l?.gates);
 const families=lots.map(l=>{
  const packed=safe(l.mass.packedL),shipping=safe(l.mass.shippingL),delivered=safe(l.mass.deliveredL);
  const full=Math.floor(packed/cap),partial=packed%cap,usedSlots=full+(partial?1:0);
  const load=l.tasks['DISPATCH.LOAD'];
  return {id:l.id,name:l.species==='OVINE'?'Lácteo ovino · SIM':'Lácteo vacuno · SIM',color:l.species==='OVINE'?'#f2b96c':'#8bc7e8',storedL:packed,full,partial,partialPct:Math.round(partial/cap*100),usedSlots,capacity:DEMO_CAPACITY_PER_FAMILY,occupancy:Math.min(100,Math.round(usedSlots/DEMO_CAPACITY_PER_FAMILY*100)),overflow:usedSlots>DEMO_CAPACITY_PER_FAMILY,shippingL:shipping,deliveredL:delivered,inboundL:safe(l.mass.tankerL),siloL:safe(l.mass.siloL),held:!!l.holds,released:l.gates.dispatch.status==='APPROVED'&&!l.holds,putaway:l.tasks['WAREHOUSE.PUTAWAY'].status,receiving:l.tasks['RECEPTION.UNLOAD'].status,loading:load.status,loadingProgress:load.status==='RUNNING'?Math.min(1,safe(load.elapsed)/loadDuration):0};
 });
 const total=key=>families.reduce((n,f)=>n+f[key],0);
 const loading=families.some(f=>f.loading==='RUNNING'),unloading=families.some(f=>f.receiving==='RUNNING');
 return {truck,families,hasLedger:!!state?.lots,revision:state?.revision??null,seconds:safe(state?.clock?.seconds),palletCapacityL:cap,stockPallets:total('full'),stockL:total('storedL'),shippingL:total('shippingL'),inboundL:total('inboundL'),loading,unloading,canLoad:families.some(f=>f.released&&f.full>0),operation:truck.kind==='Recogida'?'DESCARGA CISTERNA':'CARGA PALÉS',operationState:truck.kind==='Recogida'?(unloading?'EN CURSO EN REGISTRO':'SIN DESCARGA ACTIVA'):(loading?'EN CURSO EN REGISTRO':'SIN CARGA ACTIVA'),provenance:'SIMULATED_READ_ONLY'};
}
