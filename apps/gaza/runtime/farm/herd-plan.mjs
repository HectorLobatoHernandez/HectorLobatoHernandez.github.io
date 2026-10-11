/** Dimensioning hypotheses, not measured GAZA census or production. Never writes the ledger. */
export const PRODUCTION_EVIDENCE=Object.freeze({status:'TO_VALIDATE',annualLitres:null,dailyLitres:null,census:null,checked:'2026-10-11',url:'https://www.lechegaza.com/ganaderos.html',supported:'Más de 80 ganaderías y vacas frisonas; sin volumen consolidado ni censo por especie publicado en esta fuente.'});
export const HERD_ASSUMPTIONS=Object.freeze({horizonDays:1,cowYieldL:35,eweYieldL:2,cowLactatingFraction:.82,eweLactatingFraction:.70,detail:'balanced'});
export const DRAW_LIMITS=Object.freeze({compact:{BOVINE:48,OVINE:72},balanced:{BOVINE:120,OVINE:160},high:{BOVINE:180,OVINE:240}});
function positive(x,min,max){return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;}
export function estimateHerd(lots,options={}){
 const p={...HERD_ASSUMPTIONS,...options};
 if(!Array.isArray(lots)||!positive(p.horizonDays,.25,366)||!positive(p.cowYieldL,.1,100)||!positive(p.eweYieldL,.1,20)||!positive(p.cowLactatingFraction,.1,1)||!positive(p.eweLactatingFraction,.1,1)||!DRAW_LIMITS[p.detail])throw Error('Hipótesis de censo inválidas');
 const species=['BOVINE','OVINE'].map(species=>{
  const values=lots.filter(l=>l.species===species);if(values.some(l=>!Number.isSafeInteger(l.plannedL)||l.plannedL<0))throw Error('Volumen de escenario inválido');
  const litres=values.reduce((n,l)=>n+l.plannedL,0),yieldL=species==='BOVINE'?p.cowYieldL:p.eweYieldL,fraction=species==='BOVINE'?p.cowLactatingFraction:p.eweLactatingFraction;
  const lactating=Math.ceil(litres/p.horizonDays/yieldL),adultFemales=Math.ceil(lactating/fraction),rendered=Math.min(adultFemales,DRAW_LIMITS[p.detail][species]);
  return {species,scenarioLitres:litres,equivalentLitresPerDay:litres/p.horizonDays,lactating,adultFemales,nonLactating:adultFemales-lactating,rendered,representedPerActor:rendered?adultFemales/rendered:0,yieldAssumptionL:yieldL};
 });
 return {provenance:'SIMULATED_DIMENSIONING',physicalCapacityValidated:false,includesReplacements:false,parameters:p,species,totalRendered:species.reduce((a,b)=>a+b.rendered,0),actualGazaProduction:PRODUCTION_EVIDENCE};
}
export function seed01(n){let x=Math.imul(n+1,1597334677);x^=x>>>16;x=Math.imul(x,2246822507);return (x>>>0)/4294967296;}
export function insidePolygon(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function segmentDistance(p,a,b){const d=[b[0]-a[0],b[1]-a[1]],l=d[0]**2+d[1]**2,t=l?Math.max(0,Math.min(1,((p[0]-a[0])*d[0]+(p[1]-a[1])*d[1])/l)):0;return Math.hypot(p[0]-a[0]-d[0]*t,p[1]-a[1]-d[1]*t);}
/** Grid packing with seeded jitter and edge clearance; no animation crosses pasture limits. */
export function pastureSlots(polygon,count,spacing,clearance=spacing*.75){
 if(!Number.isSafeInteger(count)||count<0||count>500||!positive(spacing,.5,20)||polygon.length<3)throw Error('Distribución inválida');
 const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]),slots=[];let k=0;
 for(let z=Math.min(...zs)+clearance;z<=Math.max(...zs)-clearance;z+=spacing)for(let x=Math.min(...xs)+clearance;x<=Math.max(...xs)-clearance;x+=spacing){const p=[x+(seed01(k++)-.5)*spacing*.16,z+(seed01(k++)-.5)*spacing*.16];if(insidePolygon(p,polygon)&&polygon.every((a,i)=>segmentDistance(p,a,polygon[(i+1)%polygon.length])>=clearance))slots.push(p);}
 return slots.map((p,i)=>({p,sort:seed01(i+200)})).sort((a,b)=>a.sort-b.sort).slice(0,count).map(x=>x.p);
}
export const MILKING_PHASES=Object.freeze([
 {id:'entry',title:'Entrada y espera',from:0,to:.16},
 {id:'prepare',title:'Identificación y preparación',from:.16,to:.30},
 {id:'attach',title:'Colocación del conjunto',from:.30,to:.40},
 {id:'extract',title:'Ordeño y conducción de leche',from:.40,to:.78},
 {id:'detach',title:'Retirada y comprobación',from:.78,to:.87},
 {id:'exit',title:'Salida del puesto',from:.87,to:1}
]);
export function milkingPhase(progress){const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));return MILKING_PHASES.find(x=>p<x.to)||MILKING_PHASES.at(-1);}
export function gaitPose(seconds,seed=0,walking=false){
 const phase=(Number.isFinite(seconds)?seconds:0)*2.8+seed*.618,angles=[0,Math.PI,Math.PI*.55,Math.PI*1.55].map(p=>walking?Math.sin(phase+p)*.30:0);
 return {upper:angles,lower:angles.map((a,i)=>walking?Math.max(0,-Math.sin(phase+i*Math.PI/2))*.42:0),head:Math.sin(phase*.23)*.035,tail:Math.sin(phase*.51)*.10};
}

/** Parallel-parlour choreography in local proposed room coordinates. Not surveyed stall dimensions. */
export function parlourPose(progress,species='BOVINE'){
 const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0)),side=species==='OVINE'?-1:1;
 const smooth=n=>{const v=Math.max(0,Math.min(1,n));return v*v*(3-2*v)};
 const turn=p<.30?smooth((p-.16)/.14):p<=.87?1:1-smooth((p-.87)/.04);
 const z=p<.16?-6+6.25*smooth(p/.16):p>.91?.25+6*smooth((p-.91)/.09):.25;
 return {x:side*2.85,y:.895,z,yaw:-Math.PI/2+side*Math.PI/2*turn,operatorX:side*.65,operatorZ:.25,hoseTarget:[side*(species==='OVINE'?2.55:2.30),species==='OVINE'?1.16:1.26,.25]};
}
