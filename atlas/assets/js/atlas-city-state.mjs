import {businessForBuilding} from './atlas-business-state.mjs';
export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
export const ramp=(p,a,b)=>smooth((p-a)/(b-a));
export const phases=[
 {id:'ground',title:'El trazado',from:0,to:.16,copy:'Calles, plazas y parcelas forman el plano de la ciudad.'},
 {id:'foundation',title:'Las cimentaciones',from:.08,to:.28,copy:'Las bases fijan la posición de cada volumen.'},
 {id:'structure',title:'La estructura',from:.20,to:.54,copy:'Pilares y forjados levantan la maqueta arquitectónica.'},
 {id:'envelope',title:'Las envolventes',from:.49,to:.83,copy:'Fachadas, huecos y cubiertas completan los edificios.'},
 {id:'landscape',title:'La ciudad de proyectos',from:.78,to:1,copy:'Selecciona una parcela para entrar en su proyecto.'}
];
export function cityPhase(p){return phases.findLast(x=>p>=x.from)||phases[0]}
export function componentProgress(p,phase,order=0){const q=phases.find(x=>x.id===phase);return ramp(p,q.from+order*.035,q.to+order*.035)}
export function focusPose(project,aspect=1.5){const [x,z]=project.plot.center,factor=Math.max(1,1/aspect);return {position:[x+28*factor,22*factor,z+31*factor],target:[x,0,z]}}
export function districtFor(x,z){return x<0?(z<0?'alley':'heritage'):(z<0?'modern':'music')}
export const districts=[{id:'heritage',name:'Barrio clásico',position:[-78,5,47],target:[-57,2,60]},{id:'modern',name:'Distrito moderno',position:[79,8,-56],target:[49,2,-71]},{id:'alley',name:'Callejones',position:[-89,3,-60],target:[-49,2,-71]},{id:'music',name:'Noche y música',position:[24,5.5,44],target:[10,2.2,60]},{id:'water',name:'Paseo del agua',position:[-154,7,30],target:[-141,1,-9]}];
export function cityDescriptors(){
 let seed=1806;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const pieces=[],buildings=[];
 const add=(phase,material,position,size,order=0,rotation=[0,0,0])=>pieces.push({phase,material,position,size,order,rotation});
 const sites=[];for(const z of [-78,67])for(let x=-90;x<=90;x+=20)sites.push([x,z]);for(const x of [-110,110])for(const z of [-52,-28,-4,20,44])sites.push([x,z]);for(const z of [-99,91])for(let x=-120;x<=120;x+=20)sites.push([x,z]);
 sites.forEach(([x,z],index)=>{
  const district=districtFor(x,z),modern=district==='modern',old=district==='heritage',alley=district==='alley';
  const width=10+random()*5,depth=10+random()*6,floors=modern?6+Math.floor(random()*7):old?2+index%2:alley?2+index%4:2+index%3,floorHeight=3.2,height=floors*floorHeight,order=(index%5)/5,wall=modern?'glass':old?'ochre':alley?'brick':'charcoal';
  const building={id:index,x,z,width,depth,floors,height,district},business=businessForBuilding(building);building.business=business;buildings.push(building);
  add('foundation','stone',[x,.15,z],[width+1.5,.5,depth+1.5],order);
  for(const dx of [-width/2+.4,width/2-.4])for(const dz of [-depth/2+.4,depth/2-.4]){add('foundation','concrete',[x+dx,.3,z+dz],[1.7,.6,1.7],order);add('structure','concrete',[x+dx,height/2,z+dz],[.45,height,.45],order)}
  for(let floor=1;floor<=floors;floor++){
   const y=floor*floorHeight;add('structure','concrete',[x,y,z],[width+.3,.22,depth+.3],order);
   for(const side of [-1,1]){
    const fz=z+side*depth/2;
    if(floor===1&&business?.side===side){const opening=business.width;for(const dx of [-1,1])add('envelope',wall,[x+dx*(width+opening)/4,1.7,fz],[(width-opening)/2,2.8,.24],order);add('envelope',wall,[x,2.9,fz],[opening,.4,.24],order);continue}
    add('envelope',wall,[x,y-1.5,fz],[width,2.8,.24],order);
    for(let wx=-width/2+1.2;wx<width/2-.5;wx+=2.3){
     add('envelope',modern?'coolglass':'window',[x+wx,y-1.45,fz+side*.15],[1.3,modern?2.5:1.5,.08],order);
     if(!modern){for(const dx of [-.74,.74])add('envelope','wood',[x+wx+dx,y-1.45,fz+side*.21],[.09,1.8,.12],order);add('envelope','stone',[x+wx,y-2.25,fz+side*.25],[1.7,.1,.34],order)}
    }
    if(old&&floor>1){add('envelope','stone',[x,y-2.5,fz+side*.7],[width*.82,.12,1.2],order);add('envelope','metal',[x,y-1.6,fz+side*1.25],[width*.82,.06,.06],order);for(let bx=-width*.39;bx<width*.4;bx+=.75)add('envelope','metal',[x+bx,y-2.1,fz+side*1.25],[.045,1,.045],order)}
   }
   for(const side of [-1,1])add('envelope',wall,[x+side*width/2,y-1.5,z],[.25,2.8,depth],order);
  }
  if(old||alley){const angle=.30,half=depth/2+.5;for(const side of [-1,1])add('envelope',old?'tile':'roof',[x,height+.5+half*.15,z+side*half/2],[width+1,.22,half*1.06],order,[side*angle,0,0]);add('envelope','brick',[x+width*.28,height+1.5,z],[.8,2,.9],order)}
  else{add('envelope','roof',[x,height+.2,z],[width+.5,.3,depth+.5],order);for(const side of [-1,1])add('envelope','metal',[x,height+.7,z+side*depth/2],[width,.8,.15],order);add('envelope','metal',[x+2,height+1,z],[2.8,1.1,2],order)}
  // Shopfronts and entrance recesses face the promenade.
  for(const side of [-1,1]){if(business?.side===side)continue;add('envelope','wood',[x,1.3,z+side*(depth/2+.18)],[2.1,2.6,.2],order);if(!modern){add('envelope',old?'awning':'charcoal',[x,2.7,z+side*(depth/2+.9)],[width*.85,.18,1.6],order,[side*.12,0,0])}}
 });return {buildings,pieces};
}
export function validateCity(config){
 if(config.schemaVersion!==1||config.classification!=='CONCEPTUAL_NAVIGATION_CITY')throw Error('Configuración de ciudad incompatible');
 const seen=new Set();for(const p of config.projects){if(seen.has(p.id))throw Error('Proyecto duplicado');seen.add(p.id);if(p.status==='ready'&&(!p.entry||!p.plan))throw Error('Falta la fuente de un proyecto activo')}
 return config;
}
