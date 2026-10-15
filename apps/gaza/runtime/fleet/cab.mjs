import {pathAt} from './model.mjs';

// The windshield is a synthetic perspective render of public road geometry, not video.
export function headingDegrees(a,b){if(!a||!b)return 0;const east=(b[1]-a[1])*Math.cos(a[0]*Math.PI/180),north=b[0]-a[0];return (Math.atan2(east,north)*180/Math.PI+360)%360}
export function mountCab(canvas){
 const ctx=canvas.getContext('2d');
 function draw(vehicle,state,{night=false,road='—'}={}){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(320,Math.round(rect.width)),h=Math.max(300,Math.round(rect.height));
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);
  const sky=ctx.createLinearGradient(0,0,0,h*.68);sky.addColorStop(0,night?'#08152e':'#72b8df');sky.addColorStop(1,night?'#365070':'#e6f4f4');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const horizon=h*.49;ctx.fillStyle=night?'#223441':'#90aa79';ctx.fillRect(0,horizon,w,h-horizon);
  ctx.fillStyle=night?'#1a2a3b':'#79976e';for(let i=-1;i<6;i++){ctx.beginPath();ctx.ellipse(i*w*.23,horizon+8,w*.23,19,0,Math.PI,Math.PI*2);ctx.fill()}
  // Sample the route ahead in metres along its full geometry, then project relative
  // to the vehicle's heading. No pretense of a live camera or road-sign position.
  const point=state.point||vehicle.coords[0],ahead=pathAt(vehicle.coords,Math.min(1,state.m.progress+.002))||point;
  let east=(ahead[1]-point[1])*Math.cos(point[0]*Math.PI/180),north=ahead[0]-point[0],length=Math.hypot(east,north);
  if(length<1e-8){east=(vehicle.to[1]-point[1])*Math.cos(point[0]*Math.PI/180);north=vehicle.to[0]-point[0];length=Math.hypot(east,north)||1}
  east/=length;north/=length;
  const samples=[];
  for(let i=0;i<=32;i++){const p=pathAt(vehicle.coords,Math.min(1,state.m.progress+i*.0009));if(!p)continue;const dx=(p[1]-point[1])*Math.cos(point[0]*Math.PI/180)*111320,dy=(p[0]-point[0])*111320,forward=dx*east+dy*north,side=dx*north-dy*east;if(forward>=-5&&forward<1400)samples.push({forward,side})}
  if(samples.length<2)samples.push({forward:800,side:0});
  const project=(p,offset=0)=>{const depth=Math.max(0,p.forward),scale=1/(1+depth/75);return [w/2+(p.side+offset)*scale*21,horizon+(h*.47)*scale]};
  const ordered=samples.slice().sort((a,b)=>b.forward-a.forward);
  function stripe(offset,width,color,dash=false){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dash?[16,19]:[]);ctx.beginPath();ordered.forEach((p,i)=>{const [x,y]=project(p,offset);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();ctx.setLineDash([])}
  // Render a broad carriageway that narrows with depth, retaining route bends.
  for(let i=0;i<ordered.length-1;i++){const a=ordered[i],b=ordered[i+1];ctx.fillStyle=night?'#536071':'#606971';ctx.beginPath();for(const [p,o] of [[a,-5],[a,5],[b,5],[b,-5]]){const [x,y]=project(p,o);if(p===a&&o===-5)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();ctx.fill()}
  stripe(-4.4,2,night?'#d4d7bc':'#f1f2df');stripe(4.4,2,night?'#d4d7bc':'#f1f2df');stripe(0,2,night?'#f7e9ad':'#e9e0b1',true);
  stripe(-6,3,night?'#9baeb6':'#c6cfcc');stripe(6,3,night?'#9baeb6':'#c6cfcc');
  for(const distance of [100,210,390,680])for(const side of [-1,1]){const p=samples.reduce((a,b)=>Math.abs(b.forward-distance)<Math.abs(a.forward-distance)?b:a,samples[0]);const [x,y]=project(p,side*15),scale=1/(1+distance/75);ctx.fillStyle=night?'#192d28':'#3d7040';ctx.beginPath();ctx.ellipse(x,y-24*scale,9*scale+2,22*scale+3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=night?'#405044':'#645b47';ctx.fillRect(x-1,y-5*scale,2,13*scale)}
  const label=road==='—'?'RUTA SIM':road;const signX=w*.74,signY=h*.3;ctx.fillStyle='#15593b';ctx.strokeStyle='#f7fbf8';ctx.lineWidth=2;ctx.fillRect(signX,signY,Math.min(170,w*.23),58);ctx.strokeRect(signX,signY,Math.min(170,w*.23),58);ctx.fillStyle='#fff';ctx.font='bold 15px system-ui';ctx.fillText(label,signX+12,signY+24);ctx.font='11px system-ui';ctx.fillText('referencia de vía',signX+12,signY+44);
  // The dashboard and pillars make the camera position readable on every device.
  ctx.fillStyle='#14283d';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(w*.06,0);ctx.lineTo(w*.14,h*.79);ctx.lineTo(0,h*.84);ctx.fill();ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w*.94,0);ctx.lineTo(w*.86,h*.79);ctx.lineTo(w,h*.84);ctx.fill();
  ctx.fillStyle='#172536';ctx.beginPath();ctx.moveTo(0,h*.85);ctx.quadraticCurveTo(w/2,h*.72,w,h*.85);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();ctx.strokeStyle='#476076';ctx.lineWidth=12;ctx.beginPath();ctx.arc(w*.27,h*1.03,Math.min(w,h)*.23,Math.PI*1.04,Math.PI*1.95);ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='800 12px system-ui';ctx.fillText('GAZA OPS · CABINA SIMULADA',w*.40,h*.88);ctx.font='11px system-ui';ctx.fillStyle='#b4d0df';ctx.fillText('Carretera recreada a partir de trazado OSRM · no es vídeo en directo',w*.40,h*.92);
  if(night){const glow=ctx.createRadialGradient(w*.5,h*.77,10,w*.5,h*.77,w*.46);glow.addColorStop(0,'#fff5ba30');glow.addColorStop(1,'#fff5ba00');ctx.fillStyle=glow;ctx.fillRect(0,horizon,w,h-horizon)}
 }
 return {draw};
}
