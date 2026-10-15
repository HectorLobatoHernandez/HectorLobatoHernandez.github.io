import {environmentOf} from '../living/model.mjs';

// Visible, selectable training scene for devices where WebGL is unavailable.
// Lab geometry, people and equipment are illustrative and never write to the process ledger.
export function mountLabCanvas(mount,{onSelect}){
 const canvas=document.createElement('canvas');canvas.id='labCanvasFallback';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Laboratorio de calidad simulado en Canvas: siete salas y personal en movimiento');mount.prepend(canvas);
 const ctx=canvas.getContext('2d'),names=['RECEPCIÓN','FISICOQUÍMICA','MICROBIOLOGÍA','PROCESO','METROLOGÍA','HIGIENE / APPCC','QUALITY REVIEW'];
 let w=1,h=1,dpr=1,selected=0,seconds=0,last=performance.now(),active=true,moving=true,light='auto',roof=false,raf=0;
 try{if(parent!==window){light=parent.document.getElementById('livingEnvironment')?.value||'auto';moving=parent.document.getElementById('livingMotion')?.getAttribute('aria-pressed')==='true'}}catch{}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)moving=false;
 const resize=()=>{const r=mount.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);paint()};const observer=new ResizeObserver(resize);observer.observe(mount);
 const rounded=(x,y,ww,hh,r=8)=>{ctx.beginPath();ctx.roundRect(x,y,ww,hh,r)};
 function paint(){const night=environmentOf(null,{mode:light}).lamps,sy=h<430?.78:1,cw=Math.min((w-58)/4,220),ch=Math.min((h-152)/2,180)*sy,gap=Math.max(9,Math.min(20,(w-4*cw)/5)),total=4*cw+3*gap,left=(w-total)/2,top=Math.max(54,(h-2*ch-28)/2);
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,night?'#162c40':'#d8e5e8');bg.addColorStop(1,night?'#27434b':'#f0f4ed');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle=night?'#18344a':'#c7d9d8';rounded(left-18,top-18,total+36,2*ch+gap+36,16);ctx.fill();
  for(let i=0;i<7;i++){const col=i%4,row=Math.floor(i/4),x=left+col*(cw+gap),y=top+row*(ch+gap),selectedRoom=i===selected;
   ctx.fillStyle=night?'#0c2134':'#ecf2f1';rounded(x,y,cw,ch,9);ctx.fill();ctx.lineWidth=selectedRoom?3:1;ctx.strokeStyle=selectedRoom?'#b9d775':night?'#537583':'#abc2c9';ctx.stroke();
   ctx.fillStyle=selectedRoom?'#286e72':night?'#24485d':'#d2e1e4';rounded(x+2,y+2,cw-4,30,6);ctx.fill();ctx.fillStyle=selectedRoom||night?'#f3faf5':'#244452';ctx.font='700 '+Math.max(9,Math.min(12,cw/15))+'px system-ui';ctx.fillText((i+1).toString().padStart(2,'0')+' · '+names[i],x+10,y+21,cw-18);
   if(roof){ctx.fillStyle=night?'#436277':'#91b1c0';rounded(x+8,y+41,cw-16,ch-52,6);ctx.fill();ctx.fillStyle=night?'#bdd8de':'#eaf3ef';ctx.font='11px system-ui';ctx.fillText('CUBIERTA / SALA SIM',x+14,y+ch*.55,cw-26);continue}
   // Equipment and three work positions form a legible open-plan cutaway.
   const benchY=y+ch*.55;ctx.fillStyle=night?'#467485':'#8fb8c2';rounded(x+cw*.12,benchY,cw*.72,Math.max(12,ch*.15),3);ctx.fill();ctx.fillStyle=night?'#253e4c':'#547482';rounded(x+cw*.16,benchY-5,cw*.63,7,2);ctx.fill();
   for(let j=0;j<3;j++){const bx=x+cw*(.26+j*.22),by=benchY-8;ctx.fillStyle=i===2?'#9ed3bd':i===4?'#f4c87d':'#b9dce5';rounded(bx,by-14,Math.max(6,cw*.055),15,2);ctx.fill();ctx.fillStyle=night?'#9bd8e0':'#2d697a';ctx.fillRect(bx+2,by-17,3,4)}
   if(i===0||i===6){ctx.fillStyle=night?'#b5d5e1':'#ffffff';rounded(x+cw*.37,y+ch*.34,cw*.29,13,2);ctx.fill();ctx.fillStyle='#3985a5';ctx.fillRect(x+cw*.42,y+ch*.34+4,cw*.18,2)}
   const phase=seconds*.19+i*1.8,px=x+cw*.2+Math.sin(phase)*Math.min(11,cw*.08),py=y+ch*.76;ctx.fillStyle='#0b233466';ctx.beginPath();ctx.ellipse(px,py+14,8,3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=night?'#d3eef1':'#f7fbf9';ctx.fillRect(px-4,py-4,8,16);ctx.fillStyle=night?'#e4b78c':'#c89d7f';ctx.beginPath();ctx.arc(px,py-9,4,0,Math.PI*2);ctx.fill();
   ctx.fillStyle=night?'#f8d98f':'#7ba5a9';ctx.fillRect(x+cw-17,y+39,7,6);if(night){const glow=ctx.createRadialGradient(x+cw-14,y+44,2,x+cw-14,y+44,35);glow.addColorStop(0,'#ffe2a944');glow.addColorStop(1,'#ffe2a900');ctx.fillStyle=glow;ctx.fillRect(x+cw-50,y+10,75,75)}
  }
  ctx.fillStyle=night?'#e9f5f1':'#173d4f';ctx.font='800 14px system-ui';ctx.fillText('GAZA · LABORATORIO / ESCENARIO SIM',left,27);
  ctx.font='11px system-ui';ctx.fillStyle=night?'#b9d6d8':'#456879';ctx.fillText('7 áreas · muestras y decisiones en el registro compartido · diseño interior propuesto',left,44,Math.max(1,w-2*left));
  ctx.fillStyle=night?'#0b1e30e8':'#eff6f2ed';rounded(left,Math.min(h-36,top+2*ch+gap+12),total,26,5);ctx.fill();ctx.fillStyle=night?'#e3ece7':'#345365';ctx.font='10px system-ui';ctx.fillText('SELECCIONA UNA SALA · empleados y equipos ilustrativos · NO laboratorio real',left+9,Math.min(h-18,top+2*ch+gap+29),total-15);
 }
 const message=e=>{if(e.source!==parent||e.origin!==location.origin)return;if(e.data?.type==='GAZA_VIEW_VISIBILITY_V1'){active=!!e.data.active;last=performance.now()}if(e.data?.type==='GAZA_SCENE_MOTION_V1')moving=!!e.data.active;if(e.data?.type==='GAZA_SCENE_LIGHT_V1'){light=e.data.mode;paint()}};window.addEventListener('message',message);
 function frame(now){raf=requestAnimationFrame(frame);if(!active||document.hidden)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(moving)seconds+=dt;if(Math.floor(now/70)!==Math.floor((now-dt*1000)/70))paint()}
 canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,cw=Math.min((w-58)/4,220),ch=Math.min((h-152)/2,180)*(h<430?.78:1),gap=Math.max(9,Math.min(20,(w-4*cw)/5)),left=(w-(4*cw+3*gap))/2,top=Math.max(54,(h-2*ch-28)/2);for(let i=0;i<7;i++){const bx=left+i%4*(cw+gap),by=top+Math.floor(i/4)*(ch+gap);if(x>=bx&&x<=bx+cw&&y>=by&&y<=by+ch){onSelect(i);return}}};
 const button=document.createElement('button');button.id='labRoof';button.textContent='Poner cubiertas';button.setAttribute('aria-pressed','false');button.style.cssText='position:absolute;right:12px;top:12px;z-index:3;background:#173c4d;color:#fff;border:1px solid #79a1a5';button.onclick=()=>{roof=!roof;button.setAttribute('aria-pressed',String(roof));button.textContent=roof?'Quitar cubiertas':'Poner cubiertas';paint()};mount.append(button);
 resize();raf=requestAnimationFrame(frame);window.__GAZA_LABS_CANVAS__={provenance:'SYNTHETIC_FALLBACK',get selected(){return selected},get moving(){return moving}};
 return {focus(i){selected=i;paint()},dispose(){cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('message',message);button.remove();canvas.remove()}};
}
