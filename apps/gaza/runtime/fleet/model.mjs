// All vehicle identities, milestones and transactions in this module are synthetic.
export const PLANT=[41.52355,-5.59993];
export const TRIPS=[
 {id:'SIM-FLT-01',name:'Cisterna 01',kind:'Recogida',destination:'Toro · nodo demo',to:[41.5251,-5.3936],color:'#1554a3',offset:15,events:[{at:38,progress:.22,type:'fuel',title:'Parada de combustible',detail:'Repostaje simulado · importe y litros no disponibles'},{at:108,progress:.58,type:'delay',title:'Incidencia de carretera',detail:'Retraso simulado de 12 min; ETA recalculada en escenario'}]},
 {id:'SIM-FLT-02',name:'Tráiler 02',kind:'Expedición',destination:'Zamora · nodo demo',to:[41.5063,-5.7446],color:'#87b83f',offset:74,events:[{at:64,progress:.39,type:'parking',title:'Estacionamiento',detail:'Detención simulada · descanso / revisión'},{at:138,progress:.76,type:'toll',title:'Paso por peaje hipotético',detail:'Evento de pago de prueba; no confirma peaje en esta ruta'}]},
 {id:'SIM-FLT-03',name:'Tráiler 03',kind:'Expedición',destination:'Valladolid · nodo demo',to:[41.6523,-4.7245],color:'#d98e32',offset:137,events:[{at:84,progress:.43,type:'toll',title:'Peaje hipotético',detail:'Cargo simulado; ubicación y uso real por validar'},{at:158,progress:.82,type:'parking',title:'Parada técnica',detail:'Estacionamiento simulado, sin dato de tacógrafo'}]}
];
export const LOOP=240;
export function motion(seconds){const t=((seconds%LOOP)+LOOP)%LOOP;
 // Each dwell holds a fixed road position while the scenario clock continues.
 const key=[[0,0],[28,.22],[46,.22],[83,.42],[91,.42],[126,.61],[140,.61],[215,1],[240,1]];
 let i=1;while(i<key.length-1&&t>key[i][0])i++;
 const a=key[i-1],b=key[i],fraction=(t-a[0])/(b[0]-a[0]);
 return {progress:a[1]+(b[1]-a[1])*fraction,seconds:t,dwell:b[1]===a[1]&&t>a[0]&&t<b[0],complete:t>=215};
}
export function pathAt(coords,progress){if(!Array.isArray(coords)||coords.length<2)return null;const dist=[0];for(let i=1;i<coords.length;i++){const a=coords[i-1],b=coords[i],dx=(b[1]-a[1])*Math.cos(a[0]*Math.PI/180),dy=b[0]-a[0];dist.push(dist.at(-1)+Math.hypot(dx,dy))}const target=dist.at(-1)*Math.max(0,Math.min(1,progress));let i=1;while(i<dist.length-1&&dist[i]<target)i++;const f=dist[i]===dist[i-1]?0:(target-dist[i-1])/(dist[i]-dist[i-1]);return [coords[i-1][0]+(coords[i][0]-coords[i-1][0])*f,coords[i-1][1]+(coords[i][1]-coords[i-1][1])*f]}

export function pathPrefix(coords,progress){if(!Array.isArray(coords)||coords.length<2)return [];const end=pathAt(coords,progress),out=[coords[0]];const total=coords.reduce((n,p,i)=>i? n+Math.hypot((p[1]-coords[i-1][1])*Math.cos(p[0]*Math.PI/180),p[0]-coords[i-1][0]):0,0),target=total*Math.max(0,Math.min(1,progress));let walked=0;for(let i=1;i<coords.length;i++){const d=Math.hypot((coords[i][1]-coords[i-1][1])*Math.cos(coords[i][0]*Math.PI/180),coords[i][0]-coords[i-1][0]);if(walked+d>=target)break;walked+=d;out.push(coords[i]);}out.push(end);return out}
