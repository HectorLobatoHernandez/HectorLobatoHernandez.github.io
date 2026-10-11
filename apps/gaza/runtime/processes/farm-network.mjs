/** Synthetic contribution model. Inputs are totals per scenario, not observed litres/day. */
const whole=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export const NETWORK_DEFAULTS=Object.freeze({bovineCount:64,ovineCount:16,bovineL:9600,ovineL:2400,bovineExcludedL:120,ovineExcludedL:40});
export function distribute(total,count){if(!whole(total,0,1e9)||!whole(count,1,500))throw Error('Reparto de aportaciones inválido');return Array.from({length:count},(_,i)=>Math.floor(total/count)+(i<total%count?1:0));}
export function networkConfig(input={}){
 const x={...NETWORK_DEFAULTS,...input};const lots=[['BOVINE','BOV','bovine'],['OVINE','OVI','ovine']].map(([species,code,key])=>{
  const count=x[key+'Count'],plannedL=x[key+'L'],excludedL=x[key+'ExcludedL'];
  if(!whole(count,1,500)||!whole(plannedL,count,1e8)||!whole(excludedL,0,plannedL-count))throw Error('Valores SIM no válidos: nodos 1–500; litros enteros y aportación apta por nodo');
  // Distribute excluded first, then positive eligible milk: every origin has a valid remainder.
  const excluded=distribute(excludedL,count),eligible=distribute(plannedL-excludedL,count);
  const sourceContributions=excluded.map((n,i)=>({id:`SIM-SOURCE-${code}-${String(i+1).padStart(3,'0')}`,species,plannedL:n+eligible[i],excludedL:n,provenance:'SYNTHETIC_CONTRIBUTION'}));
  return {id:`SIM-${code}-001`,species,plannedL,excludedL,sourceContributions};
 });return {lots};
}
export function validateContributions(lot){
 const a=lot.sourceContributions;if(a===undefined)return true;
 if(!Array.isArray(a)||a.length<1||a.length>500)return false;
 const ids=new Set();let p=0,e=0;
 for(const r of a){if(!r||typeof r.id!=='string'||!/^SIM-SOURCE-(BOV|OVI)-[0-9]{3}$/.test(r.id)||ids.has(r.id)||r.id===lot.id||r.species!==lot.species||r.provenance!=='SYNTHETIC_CONTRIBUTION'||!whole(r.plannedL,1,1e8)||!whole(r.excludedL,0,r.plannedL-1))return false;ids.add(r.id);p+=r.plannedL;e+=r.excludedL;}
 return p===lot.plannedL&&e===lot.excludedL;
}
