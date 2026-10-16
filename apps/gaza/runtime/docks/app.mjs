import {processStore} from '../processes/store.mjs';
import {FLEET,projectDocks} from './model.mjs';
import {environmentOf} from '../living/model.mjs';

const $=id=>document.getElementById(id),canvas=$('yard'),ctx=canvas.getContext('2d');
const key='gaza:docks:truck:v1',selector=$('vehicle');
for(const v of FLEET){const option=document.createElement('option');option.value=v.id;option.textContent=v.id+' · '+v.name+' · '+v.kind;selector.append(option)}
let selected=localStorage.getItem(key)||new URLSearchParams(location.search).get('truck')||FLEET[0].id;
if(!FLEET.some(v=>v.id===selected))selected=FLEET[0].id;selector.value=selected;
let state=null,view=projectDocks(null,selected),night=false,open=true,running=true,practice=false,elapsed=0,last=performance.now(),w=1,h=1,scale=1;
const fmt=n=>Number(n||0).toLocaleString('es-ES');
function refresh(){view=projectDocks(state,selected);const v=view;
 $('sceneState').textContent=v.truck.id+' · '+v.operation+' · '+(v.operationState==='EN CURSO EN REGISTRO'?'REGISTRO EN CURSO':'MANIOBRA VISUAL SIM');
 $('activity').textContent=v.operation+' · '+v.operationState;$('activity').classList.toggle('wait',v.operationState!=='EN CURSO EN REGISTRO');
 $('truckDetail').textContent=v.truck.name+' · '+v.truck.destination+' · '+(v.truck.kind==='Recogida'?'cisterna / leche a granel':'tráiler / producto paletizado')+'. Posición en muelle ficticia; sin asignación de transporte en el registro.';
 $('stored').textContent=fmt(v.stockPallets);$('transit').textContent=fmt(v.shippingL)+' L';$('inbound').textContent=fmt(v.inboundL)+' L';$('revision').textContent=v.revision??'—';
 $('gateNote').textContent=!v.hasLedger?'Sin registro activo. Abre Proceso y lotes para iniciar un escenario.':v.canLoad?'Hay palés del registro liberados para expedición; este camión aún no está asignado a ellos.':'Sin palés liberados y completos para cargar. La escena puede ensayar la maniobra sin inventar stock.';
 const rows=v.families.map(f=>{const el=document.createElement('div');el.className='palletRow';const b=document.createElement('b'),small=document.createElement('small'),bar=document.createElement('div'),fill=document.createElement('span');bar.className='bar';fill.style.setProperty('--fill',f.color);fill.style.setProperty('--percent',f.occupancy+'%');b.textContent=f.name+' · '+f.occupancy+' %';small.textContent=f.usedSlots+' / '+f.capacity+' posiciones SIM · '+f.full+' palés completos · parcial '+fmt(f.partial)+' L ('+f.partialPct+' % del palé) · '+(f.released?'liberación SIM':'pendiente de liberación')+(f.overflow?' · excede capacidad visual':'');bar.append(fill);el.append(b,bar,small);return el});
 $('products').replaceChildren(...rows);if(!rows.length)$('products').textContent='Sin lotes del registro común. 0 palés contabilizados.';
 window.__GAZA_DOCKS__={provenance:v.provenance,selected,revision:v.revision,stockPallets:v.stockPallets,families:v.families.map(f=>({id:f.id,full:f.full,partial:f.partial,occupancy:f.occupancy,released:f.released})),practice};
}
processStore.subscribe(({state:next})=>{state=next;refresh()});
selector.onchange=()=>{selected=selector.value;localStorage.setItem(key,selected);refresh()};
addEventListener('storage',e=>{if(e.key===key&&FLEET.some(v=>v.id===e.newValue)){selected=e.newValue;selector.value=selected;refresh()}});
$('practice').onclick=()=>{practice=!practice;$('practice').setAttribute('aria-pressed',String(practice));$('practice').textContent=practice?'Detener ensayo visual':'Ensayar maniobra visual';refresh()};
$('motion').onclick=()=>{running=!running;$('motion').setAttribute('aria-pressed',String(running));$('motion').textContent=running?'Pausar movimiento':'Reanudar movimiento'};
$('roof').onclick=()=>{open=!open;$('roof').setAttribute('aria-pressed',String(open));$('roof').textContent=open?'Cubiertas quitadas':'Quitar cubiertas'};
$('camera').onclick=()=>{$('camera').textContent=$('camera').textContent==='Vista muelles'?'Vista almacén':'Vista muelles';draw()};
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;if(e.data?.type==='GAZA_SCENE_LIGHT_V1'){night=environmentOf(null,{mode:e.data.mode}).lamps;draw()}if(e.data?.type==='GAZA_SCENE_MOTION_V1'){running=!!e.data.active;$('motion').setAttribute('aria-pressed',String(running));$('motion').textContent=running?'Pausar movimiento':'Reanudar movimiento'}});
try{night=environmentOf(null,{mode:parent!==window?parent.parent.document.getElementById('livingEnvironment')?.value:'auto'}).lamps}catch{night=environmentOf(null,{mode:'auto'}).lamps}
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);scale=Math.min(w/760,h/470);draw()}new ResizeObserver(resize).observe(canvas);resize();
function P(x,z,y=0){const pan=$('camera').textContent==='Vista almacén'?-30:0;return [w*.51+(x-z)*scale*1.10,h*.46+(x+z)*scale*.46-y*scale+pan*scale]}
function polygon(pts,fill,stroke){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5*scale;ctx.stroke()}}
function box(x,z,dx,dz,y,color,topColor=color){const a=P(x,z),b=P(x+dx,z),c=P(x+dx,z+dz),d=P(x,z+dz),aa=P(x,z,y),bb=P(x+dx,z,y),cc=P(x+dx,z+dz,y),dd=P(x,z+dz,y);polygon([a,b,bb,aa],color);polygon([b,c,cc,bb],shade(color));polygon([aa,bb,cc,dd],topColor,'#b7d4d940')}
function shade(hex){const n=parseInt(hex.slice(1),16);return '#'+[16,8,0].map(s=>Math.max(0,((n>>s)&255)-27).toString(16).padStart(2,'0')).join('')}
function label(text,x,z,y=0,color='#eaf6fa',size=11){const p=P(x,z,y);ctx.fillStyle=color;ctx.font=`800 ${Math.max(9,size*scale)}px system-ui`;ctx.fillText(text,p[0],p[1])}
function pallet(x,z,color,loaded=true){box(x,z,5,4,1.3,'#9d7445','#c49257');if(loaded)box(x+.35,z+.35,4.3,3.3,5,color,shade(color));const p=P(x,z,5.1);ctx.fillStyle='#eef5df';ctx.fillRect(p[0],p[1],4*scale,3*scale)}
function forklift(x,z,carrying,color){box(x,z,9,6,3.5,color,'#e9bf50');box(x+6,z+1,1,4,10,'#182e3d');box(x+7,z+1,4,4,1,'#b9d4e4');for(const [dx,dz]of [[1,1],[7,1]]){const p=P(x+dx,z+dz);ctx.fillStyle='#102536';ctx.beginPath();ctx.arc(p[0],p[1],3.5*scale,0,7);ctx.fill()}if(carrying)pallet(x+8,z+1,'#8bc7e8');}
function worker(x,z,j){const p=P(x,z);ctx.fillStyle='#102631';ctx.beginPath();ctx.ellipse(p[0],p[1],4*scale,2*scale,0,0,7);ctx.fill();ctx.fillStyle=j?'#e7c379':'#a7d9ed';ctx.fillRect(p[0]-2*scale,p[1]-12*scale,4*scale,10*scale);ctx.fillStyle='#e9c7a8';ctx.beginPath();ctx.arc(p[0],p[1]-15*scale,3*scale,0,7);ctx.fill()}
function truck(x,z,color,tanker=false){box(x,z,25,9,6,'#e8f4f5','#fbffff');box(x+20,z,8,9,9,color,'#b5dbe6');if(tanker){const a=P(x+2,z+4,8);ctx.strokeStyle='#7baaba';ctx.lineWidth=10*scale;ctx.beginPath();ctx.ellipse(a[0],a[1],13*scale,4*scale,-.2,0,7);ctx.stroke()}for(const dx of [4,17,25]){const p=P(x+dx,z+8);ctx.fillStyle='#132a35';ctx.beginPath();ctx.arc(p[0],p[1],3*scale,0,7);ctx.fill()}label('GAZA · SIM',x+2,z+2,7,'#154a78',9)}
function draw(){if(w<1||h<1)return;const sky=night?'#142c40':'#cfe4ed';ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);const grad=ctx.createLinearGradient(0,h*.25,0,h);grad.addColorStop(0,night?'#294f5b':'#91aeb5');grad.addColorStop(1,night?'#102b36':'#adc3bd');ctx.fillStyle=grad;ctx.fillRect(0,h*.27,w,h);
 polygon([P(-164,-105),P(150,-105),P(150,150),P(-164,150)],night?'#385466':'#abc2c4');polygon([P(-155,65),P(140,65),P(140,103),P(-155,103)],night?'#344755':'#667d89');
 for(let i=0;i<3;i++){const z=91+i*13;polygon([P(-148,z),P(138,z),P(138,z+1),P(-148,z+1)],'#e7d8a5')}
 // Nine indicated levels, two proposed warehouse halls and three dock doors.
 for(const [x,z,sx,sz] of [[-102,-90,109,74],[29,-89,75,74]]){box(x,z,sx,sz,open?3:32,night?'#34576a':'#477b94',open?(night?'#263f4a':'#698d98'):(night?'#65869a':'#9fc5d6'));if(open){for(let row=0;row<3;row++)for(let col=0;col<5;col++){const xx=x+10+col*16,zz=z+12+row*18;box(xx,zz,12,5,8,'#467488','#7eabb4');for(let level=0;level<9;level++){const a=P(xx,zz,1+level*.72),b=P(xx+12,zz,1+level*.72);ctx.strokeStyle=night?'#a6c5ce88':'#183e5390';ctx.lineWidth=1*scale;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()}}}}
 let left=0,right=0;for(const f of view.families){const max=Math.min(f.full,16);for(let i=0;i<max;i++){const row=Math.floor(i/8),col=i%8;if(f.id.includes('BOV')){pallet(-94+col*12,-78+row*22,f.color);left++}else{pallet(40+col*8,-76+row*22,f.color);right++}}}
 for(let i=0;i<3;i++){const zz=-7+i*19;box(31+i*17,zz,14,2,18,night?'#587f91':'#80aabc');label('M'+(i+1),40+i*17,zz+7,4,'#163b55',12);if(night){const p=P(40+i*17,zz+8,5);ctx.fillStyle='#ffe5a6';ctx.beginPath();ctx.arc(p[0],p[1],8*scale,0,7);ctx.fill()}}
 const active=view.loading||view.unloading||practice,cycle=(elapsed*.14)%1,move=active?cycle:Math.min(.15,(Math.sin(elapsed*.34)+1)*.07),forkX=-47+move*128,forkZ=35-Math.sin(move*Math.PI)*20;
 forklift(forkX,forkZ,practice||view.loading,night?'#e7a847':'#eeb949');forklift(-35+(elapsed*.09%1)*57,11,false,'#d9943c');
 for(let i=0;i<6;i++){const t=elapsed*.12+i*1.7;worker(-9+(i%3)*36+Math.sin(t)*3,10+Math.floor(i/3)*24+Math.cos(t)*2,i%2)}
 for(let i=0;i<3;i++){const v=i===1?view.truck:FLEET[(i*3+2)%FLEET.length];truck(47+i*28,31+i*21,v.color,v.kind==='Recogida');if(i===1){const p=P(48+i*28,31+i*21,13);ctx.strokeStyle='#f4d77c';ctx.lineWidth=2.5*scale;ctx.strokeRect(p[0]-4,p[1]-9,59*scale,33*scale)}}
 if(view.truck.kind==='Recogida'&&active){const a=P(67,51,10),b=P(84,12,4);ctx.strokeStyle='#ffe3a1';ctx.lineWidth=4*scale;ctx.beginPath();ctx.moveTo(...a);ctx.bezierCurveTo(a[0]+14*scale,a[1]-17*scale,b[0]-11*scale,b[1]-10*scale,...b);ctx.stroke()}
 label('ALMACÉN AUTOMÁTICO · 9 NIVELES SIM',-96,-98,4,'#f2fbfb',11);label('NAVE DE ENVASADO / STAGING',30,-98,4,'#f2fbfb',11);label('3 MUELLES · SIM',109,9,9,'#e8f4f5',11);
 if(night){ctx.fillStyle='#ffe9b41a';for(const [x,z] of [[22,4],[99,18],[-70,21]]){const p=P(x,z,9);ctx.beginPath();ctx.ellipse(p[0],p[1],34*scale,18*scale,0,0,7);ctx.fill()}}
}
function tick(now){const dt=Math.min(.08,Math.max(0,(now-last)/1000));last=now;if(running&&document.visibilityState==='visible')elapsed+=dt;draw();requestAnimationFrame(tick)}requestAnimationFrame(tick);refresh();
