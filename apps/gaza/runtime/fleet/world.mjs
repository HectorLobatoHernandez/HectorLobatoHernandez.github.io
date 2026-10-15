// Canvas isometric view: projected public road geometry with synthetic, selectable vehicles.
// Intentionally works without WebGL, Blender or external map scripts.
export function mountFleetWorld(canvas,{plant,vehicles,getSelected,getState,onSelect}){
 const ctx=canvas.getContext('2d',{alpha:false});let width=1,height=1,dpr=1,night=false,follow=true,hit=[];
 const rad=Math.PI/180;
 function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 new ResizeObserver(resize).observe(canvas);resize();
 const meters=p=>[(p[1]-plant[1])*111320*Math.cos(plant[0]*rad),(plant[0]-p[0])*111320];
 function draw(){if(!width||!height)return;const selected=getSelected(),pts=selected.coords?.length>1?selected.coords:[plant,selected.to],xy=pts.map(meters);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const [x,y] of xy){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}const span=Math.max(maxX-minX,maxY-minY,4000),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 // Rotate ground plane into a stable isometric camera. Keep the whole selected road corridor visible.
 const angle=-.34,co=Math.cos(angle),si=Math.sin(angle);const rotated=xy.map(([x,y])=>[(x-cx)*co-(y-cy)*si,(x-cx)*si+(y-cy)*co]);let bx=Math.max(...rotated.map(p=>Math.abs(p[0])),span*.13),by=Math.max(...rotated.map(p=>Math.abs(p[1])),span*.13);const scale=Math.min(width*.42/bx,height*.65/(by*.58));const originX=width*.5,originY=height*.53;
 const focus=follow&&getState(selected)?.point?meters(getState(selected).point):[cx,cy];
 const point=p=>{const [x,y]=meters(p),dx=x-focus[0],dy=y-focus[1];return [originX+(dx*co-dy*si)*scale,originY+(dx*si+dy*co)*scale*.58]};
 const bg=night?'#142b42':'#dce9df',ground=night?'#213d48':'#e6eddf';ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);ctx.fillStyle=ground;ctx.fillRect(0,46,width,height-46);
 // Parallel parcel contours make a local ground reference; these are purely scenic.
 ctx.strokeStyle=night?'#31564f':'#c6dcc1';ctx.lineWidth=1;for(let i=-15;i<20;i++){const y=i*58+height*.48;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y-width*.13);ctx.stroke()}
 ctx.fillStyle=night?'#172a3d':'#c4d9bd';for(let i=0;i<14;i++){const x=((i*173+83)%Math.max(1,width)),y=65+((i*97+37)%Math.max(1,height-100));ctx.fillRect(x,y,Math.max(12,width*.06),Math.max(9,height*.028))}
 // Secondary traces are connected OSRM geometry when available; no invented road map is claimed.
 const road=(coords,color,weight,opacity=1,dashed=false)=>{if(!coords?.length)return;ctx.globalAlpha=opacity;ctx.beginPath();coords.forEach((p,i)=>{const [x,y]=point(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dashed?[9,10]:[]);ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1};
 for(const v of vehicles){if(v===selected)continue;road(v.coords,night?'#4e7182':'#b5c5c4',7,.65,!v.distance);road(v.coords,v.color,2,.45,!v.distance)}
 road(pts,night?'#0b1827':'#94a7b2',26,1,!selected.distance);road(pts,night?'#536475':'#596975',21,1,!selected.distance);road(pts,night?'#344858':'#657888',16,1,!selected.distance);road(pts,night?'#e6ce86':'#eff6e8',1.6,.85,true);
 const state=getState(selected);road((state?.prefix||[]),selected.color,5,1,false);
 // Isometric terminal buildings and simple contextual streets. Their dimensions are illustrative.
 function block(x,y,w,h,depth,front,side,top){ctx.fillStyle='#0002';ctx.beginPath();ctx.ellipse(x+3,y+depth+8,w*.66,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=side;ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w,y+depth);ctx.lineTo(x,y+depth+h);ctx.lineTo(x,y+h);ctx.fill();ctx.fillStyle=front;ctx.fillRect(x-w,y,w*2,h);ctx.fillStyle=top;ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x,y-depth*.5);ctx.lineTo(x+w,y);ctx.lineTo(x,y+depth*.5);ctx.closePath();ctx.fill()}
 const [px,py]=point(plant),[dx,dy]=point(selected.to);block(px,py-40,32,28,20,night?'#174172':'#2261a7',night?'#123251':'#17487e',night?'#4674a3':'#90b6df');ctx.fillStyle=night?'#ffe9a4':'#f9fbff';ctx.font='bold 10px system-ui';ctx.fillText('GAZA · COReSES',px-43,py-49);block(dx,dy-30,19,19,12,night?'#3e4d64':'#93adbe',night?'#293b4d':'#6e94a5',night?'#687f92':'#d6e4e5');
 hit=[];
 for(const v of vehicles){const s=getState(v);if(!s?.point)continue;const [x,y]=point(s.point),next=point(s.ahead||s.point),heading=Math.atan2(next[1]-y,next[0]-x);drawTruck(x,y,heading,v.color,v===selected,night);hit.push({v,x,y});}
 function label(x,y,text,accent){ctx.font='700 11px system-ui';const w=Math.min(210,ctx.measureText(text).width+18),lx=Math.max(8,Math.min(width-w-8,x-w/2));ctx.fillStyle=night?'#0d2438ec':'#fffffff2';ctx.strokeStyle=accent;ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(lx,y,w,25,6);ctx.fill();ctx.stroke();ctx.fillStyle=night?'#e7f0f5':'#233b50';ctx.fillText(text,lx+9,y+17)}
 label(px,Math.max(53,py+17),'PLANTA · ORIGEN APROX.',selected.color);label(dx,Math.min(height-33,dy+20),selected.destination,selected.color);
 ctx.fillStyle=night?'#0b2037e8':'#ffffffeb';ctx.fillRect(0,0,width,46);ctx.fillStyle=night?'#eaf4fd':'#173652';ctx.font='800 12px system-ui';ctx.fillText('GAZA  /  MAPA ISOMÉTRICO DE RUTAS',15,19);ctx.font='10px system-ui';ctx.fillText((selected.distance?'Ejes OSRM públicos':'Eje esquemático')+' · camiones y eventos SIM · '+vehicles.length+' trayectos',15,35);
 ctx.fillStyle=night?'#0b2037df':'#ffffffdf';ctx.fillRect(0,height-25,width,25);ctx.fillStyle=night?'#c8dce9':'#526879';ctx.font='10px system-ui';ctx.fillText('Contexto visual inferido · no es modelo Blender as-built ni telemetría GPS',10,height-9);
 }
 function drawTruck(x,y,a,color,chosen,dark){ctx.save();ctx.translate(x,y);ctx.rotate(Number.isFinite(a)?a:0);const k=chosen?1.25:1;ctx.scale(k,k);ctx.fillStyle='#13293a55';ctx.beginPath();ctx.ellipse(0,9,19,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#182b39';ctx.fillRect(-15,5,8,4);ctx.fillRect(6,5,8,4);ctx.fillStyle=color;ctx.fillRect(-19,-5,24,11);ctx.fillStyle=dark?'#f5f7f4':'#ffffff';ctx.fillRect(-18,-7,23,11);ctx.fillStyle='#91a9b7';ctx.fillRect(7,-4,11,9);ctx.fillStyle='#e8f4f9';ctx.fillRect(7,-7,11,7);ctx.fillStyle='#254159';ctx.fillRect(14,-5,4,5);ctx.fillStyle='#1763aa';ctx.fillRect(-14,-1,8,2);if(dark){ctx.fillStyle='#ffecb2';ctx.fillRect(17,0,3,3)}ctx.restore();if(chosen){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.stroke()}}
 canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const nearest=hit.map(h=>({...h,d:Math.hypot(h.x-x,h.y-y)})).sort((a,b)=>a.d-b.d)[0];if(nearest?.d<30)onSelect(nearest.v)});
 return {draw,setNight(value){night=!!value;draw()},setFollow(value){follow=!!value;draw()},get night(){return night},get follow(){return follow}};
}
