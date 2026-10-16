// Deterministic local simulation; no live telemetry or geographic traffic feed.
export const intersections=[-97,-46,0,46,97].flatMap(x=>[-61,-9,49].filter(z=>x!==0||z!==-9).map(z=>({x,z})));
export function signalAt(time,axis){const t=((time%40)+40)%40;return axis==='x'?(t<9?'green':t<11?'amber':'red'):(t>=12&&t<21?'green':t>=21&&t<23?'amber':'red')}
export const pedestrianGreen=time=>((time%40)+40)%40>=24;
export function roundedRoute(x0,z0,x1,z1,inset=1.15){
 x0+=inset;z0+=inset;x1-=inset;z1-=inset;const r=2.3,points=[];
 for(const [x,z,start] of [[x1-r,z0+r,-Math.PI/2],[x1-r,z1-r,0],[x0+r,z1-r,Math.PI/2],[x0+r,z0+r,Math.PI]])for(let j=0;j<=8;j++){const a=start+j*Math.PI/16;points.push([x+Math.cos(a)*r,z+Math.sin(a)*r])}
 let length=0;const segments=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],size=Math.hypot(dx,dz),s={a,b,dx:dx/size,dz:dz/size,length:size,start:length};length+=size;return s});return {segments,length};
}
export function sampleRoute(route,distance){const s=((distance%route.length)+route.length)%route.length,segment=route.segments.find(q=>s<q.start+q.length)||route.segments.at(-1),t=s-segment.start;return {x:segment.a[0]+segment.dx*t,z:segment.a[1]+segment.dz*t,dx:segment.dx,dz:segment.dz,heading:Math.atan2(segment.dx,segment.dz),axis:Math.abs(segment.dx)>.8?'x':'z'}}
export function createTraffic(count=32){
 const routes=[roundedRoute(-97,-61,-46,-9),roundedRoute(-97,-9,-46,49),roundedRoute(46,-61,97,-9),roundedRoute(46,-9,97,49),roundedRoute(-46,-61,46,49)];
 const cars=Array.from({length:count},(_,i)=>{const route=routes[i%routes.length],rank=Math.floor(i/routes.length),number=Math.ceil((count-i%routes.length)/routes.length);return {id:i,route,s:rank*route.length/number,speed:0,cruise:3.7+(i%5)*.35,wait:false,...sampleRoute(route,rank*route.length/number)}});let time=0;
 function step(dt){dt=Math.max(0,Math.min(.05,dt));time+=dt;const positions=cars.map(c=>({...sampleRoute(c.route,c.s),id:c.id}));
  for(const c of cars){const pos=positions[c.id];let gap=Infinity;
   for(const other of positions){if(other.id===c.id)continue;const dx=other.x-pos.x,dz=other.z-pos.z,forward=dx*pos.dx+dz*pos.dz,lateral=Math.abs(dx*pos.dz-dz*pos.dx),aligned=other.dx*pos.dx+other.dz*pos.dz;if(aligned>.6&&forward>0&&lateral<1.7)gap=Math.min(gap,forward-4.6)}
   c.wait=false;for(const junction of intersections){const dx=junction.x-pos.x,dz=junction.z-pos.z,forward=dx*pos.dx+dz*pos.dz,lateral=Math.abs(dx*pos.dz-dz*pos.dx);if(forward>=4.8&&forward<18&&lateral<1.8&&signalAt(time,pos.axis)!=='green'){gap=Math.min(gap,forward-5);c.wait=true}}
   const desired=Math.max(0,Math.min(c.cruise,Number.isFinite(gap)?Math.sqrt(2*3*Math.max(0,gap-.25)):c.cruise));c.speed=Math.max(0,c.speed+Math.max(-6*dt,Math.min(1.6*dt,desired-c.speed)));const travel=Math.min(c.speed*dt,Number.isFinite(gap)?Math.max(0,gap):Infinity);c.s=(c.s+travel)%c.route.length;Object.assign(c,sampleRoute(c.route,c.s));
  }
 }
 return {cars,routes,step,get time(){return time},snapshot(){return {classification:'SIMULATED_LOCAL_TRAFFIC',time,count:cars.length,waiting:cars.filter(c=>c.wait&&c.speed<.15).length,pedestrianGreen:pedestrianGreen(time),signals:{x:signalAt(time,'x'),z:signalAt(time,'z')},cars:cars.map(({id,x,z,speed,wait})=>({id,x,z,speed,wait}))}}};
}
