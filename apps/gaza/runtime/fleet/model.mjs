// All vehicle identities, milestones and transactions in this module are synthetic.
export const PLANT=[41.52355,-5.59993];
// Public municipality references only; no individual supplier location or exact farm pin.
export const REGION_NODES=[
 {name:'Coreses · planta',at:PLANT,type:'plant'},
 {name:'Toro · zona SAT ROTE',at:[41.5251,-5.3936],type:'supplier_area'},
 {name:'Zamora',at:[41.5063,-5.7446],type:'municipality'},
 {name:'Fresno de la Ribera',at:[41.54514,-5.56229],type:'municipality'},
 {name:'Morales de Toro',at:[41.53737,-5.30642],type:'municipality'},
 {name:'Villalpando',at:[41.82406,-5.41788],type:'municipality'},
 {name:'Fuentesaúco',at:[41.242,-5.50375],type:'municipality'},
 {name:'Benavente',at:[42.0038,-5.6783],type:'municipality'}
];
export const TRIPS=[
 {id:'SIM-FLT-01',name:'Cisterna 01',kind:'Recogida',destination:'Toro · nodo demo',to:[41.5251,-5.3936],color:'#1554a3',offset:15,events:[{at:28,duration:18,progress:.22,type:'fuel',title:'Parada de combustible',detail:'Repostaje simulado · importe y litros no disponibles'},{at:126,duration:14,progress:.61,type:'delay',title:'Incidencia de carretera',detail:'Retraso simulado de 12 min; ETA recalculada en escenario'}]},
 {id:'SIM-FLT-02',name:'Tráiler 02',kind:'Expedición',destination:'Zamora · nodo demo',to:[41.5063,-5.7446],color:'#87b83f',offset:74,events:[{at:83,duration:8,progress:.42,type:'toll',title:'Paso por peaje hipotético',detail:'Evento de pago de prueba; no confirma peaje en esta ruta'},{at:126,duration:14,progress:.61,type:'parking',title:'Estacionamiento',detail:'Detención simulada · descanso / revisión'}]},
 {id:'SIM-FLT-03',name:'Tráiler 03',kind:'Expedición',destination:'Valladolid · nodo demo',to:[41.6523,-4.7245],color:'#d98e32',offset:137,events:[{at:83,duration:8,progress:.42,type:'toll',title:'Peaje hipotético',detail:'Cargo simulado; ubicación y uso real por validar'},{at:126,duration:14,progress:.61,type:'parking',title:'Parada técnica',detail:'Estacionamiento simulado, sin dato de tacógrafo'}]},
 {id:'SIM-FLT-04',name:'Tráiler 04',kind:'Expedición',destination:'Salamanca · nodo demo',to:[40.9701,-5.6635],color:'#7395c8',offset:42,events:[{at:28,duration:18,progress:.22,type:'fuel',title:'Repostaje de ensayo',detail:'Parada sintética; no se conoce estación, volumen ni factura'},{at:126,duration:14,progress:.61,type:'parking',title:'Descanso',detail:'Tiempo de espera simulado, sin dato de tacógrafo'}]},
 {id:'SIM-FLT-05',name:'Cisterna 05',kind:'Recogida',destination:'Benavente · nodo demo',to:[42.0038,-5.6783],color:'#6b9f89',offset:182,events:[{at:83,duration:8,progress:.42,type:'inspection',title:'Control de ruta',detail:'Revisión sintética; ninguna medición real'},{at:126,duration:14,progress:.61,type:'parking',title:'Estacionamiento',detail:'Parada simulada'}]},
 {id:'SIM-FLT-06',name:'Tráiler 06',kind:'Expedición',destination:'Tordesillas · nodo demo',to:[41.502,-5.0014],color:'#bd749a',offset:98,events:[{at:28,duration:18,progress:.22,type:'fuel',title:'Combustible',detail:'Operación hipotética; no se registran litros ni pago'},{at:126,duration:14,progress:.61,type:'delay',title:'Espera logística',detail:'Retraso sintético para evaluar ETA'}]},
 {id:'SIM-FLT-07',name:'Tráiler 07',kind:'Expedición',destination:'Medina del Campo · nodo demo',to:[41.3082,-4.9148],color:'#9988bb',offset:3,events:[{at:83,duration:8,progress:.42,type:'toll',title:'Peaje de prueba',detail:'Evento de demostración; no confirma peaje en carretera'},{at:126,duration:14,progress:.61,type:'parking',title:'Área de servicio simulada',detail:'Detención hipotética'}]},
 {id:'SIM-FLT-08',name:'Tráiler 08',kind:'Expedición',destination:'Madrid · nodo demo',to:[40.4168,-3.7038],color:'#d36b65',offset:205,events:[{at:28,duration:18,progress:.22,type:'fuel',title:'Repostaje de prueba',detail:'Consumo y pago no conectados'},{at:126,duration:14,progress:.61,type:'parking',title:'Pausa programada',detail:'Parada del escenario, no registro de conductor'}]},
 {id:'SIM-FLT-09',name:'Cisterna 09',kind:'Recogida',destination:'Fresno de la Ribera · entorno municipal',to:[41.54514,-5.56229],color:'#5b9ba5',offset:58,events:[{at:83,duration:8,progress:.42,type:'parking',title:'Parada de recogida SIM',detail:'Municipio de referencia; granja y acceso exactos desconocidos'}]},
 {id:'SIM-FLT-10',name:'Cisterna 10',kind:'Recogida',destination:'Morales de Toro · entorno municipal',to:[41.53737,-5.30642],color:'#ad7a55',offset:156,events:[{at:28,duration:18,progress:.22,type:'inspection',title:'Control de ruta SIM',detail:'Vial público; explotación y punto de recogida no identificados'}]}
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
