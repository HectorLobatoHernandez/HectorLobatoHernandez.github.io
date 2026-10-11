import {subscribeProcess,getProcess} from './dairy-process-store.mjs';
import {sceneStatus,STAGES,latestAttempt,METHODS} from './dairy-process-core.mjs';
import {mountProcessDock} from './dairy-process-panel.mjs';
const COLORS={idle:0x6f8796,active:0x41c2d1,pass:0x75c58f,hold:0xe15f55};
/** Add a semantic, reversible overlay. The base farm geometry is never replaced or repositioned. */
export function bindProcessWorld(THREE,{scene,surface='plant',groups={},stations=[],dock=false}={}){
 if(!scene||scene.userData.processBinding)return scene?.userData.processBinding;
 if(dock)setTimeout(()=>mountProcessDock(surface),0);
 const layer=new THREE.Group();layer.name='GAZA_CANONICAL_PROCESS_OVERLAY';layer.visible=false;scene.add(layer);
 const small=surface==='farm'||surface==='labs',scale=small?1:4;
 const anchors=small?stations.map(o=>o.position.clone()):[];
 const fallback=surface==='site'?[[-48,0,30],[55,0,22],[26,0,55],[13,0,10],[22,0,-25],[20,0,-77],[75,0,-78]]:[[-222,0,-78],[-82,0,-50],[-98,0,-49],[-5,0,-36],[22,0,-10],[88,0,-25],[91,0,38]];
 if(!anchors.length)anchors.push(...fallback.map(p=>new THREE.Vector3(...p)));
 const indicators=[];
 function marker(pos,index){const g=new THREE.Group();g.position.copy(pos);g.position.y=small?4.4:16;layer.add(g);
  const material=new THREE.MeshBasicMaterial({color:COLORS.idle,transparent:true,opacity:.8,depthTest:false});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.65*scale,.075*scale,5,20),material);ring.rotation.x=-Math.PI/2;g.add(ring);
  const column=new THREE.Mesh(new THREE.CylinderGeometry(.1*scale,.1*scale,1.4*scale,6),material);column.position.y=.7*scale;g.add(column);
  const token=new THREE.Mesh(new THREE.BoxGeometry(.34*scale,.45*scale,.24*scale),material.clone());token.position.y=1.8*scale;g.add(token);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));label.position.set(0,2.4*scale,0);label.scale.set(4.5*scale,1.125*scale,1);g.add(label);
  indicators.push({g,material,ring,token,canvas,texture,lastLabel:'',index});
 }
 anchors.forEach(marker);
 const milkMaterial=new THREE.MeshBasicMaterial({color:0x68d8da,depthTest:false});
 const milk=new THREE.Mesh(new THREE.SphereGeometry(.22*scale,8,6),milkMaterial);layer.add(milk);
 const sampleToken=new THREE.Mesh(new THREE.BoxGeometry(.24*scale,.38*scale,.24*scale),new THREE.MeshBasicMaterial({color:0xeac26a,depthTest:false}));layer.add(sampleToken);
 const points=anchors.map(p=>p.clone().setY(small?4.15:15));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineDashedMaterial({color:0x6b9baf,dashSize:scale,gapSize:scale*.7,transparent:true,opacity:.5}));line.computeLineDistances();layer.add(line);
 let status=null,snapshot=null,last=0,disposed=false,oldVehiclesVisible=null;
 const stationFor=b=>surface==='farm'?([0,3,4,6,6,6,6,6,6,6,6,6,6,6][b.stage]):surface==='labs'?([0,0,0,0,0,0,0,6,3,3,6,6,6,6][b.stage]):([0,0,0,0,1,1,1,2,3,4,4,5,6,6][b.stage]);
 function updateSnapshot(s){snapshot=s;status=sceneStatus(s,surface);layer.visible=!!status;window.__GAZA_PROCESS_BINDING__={surface,active:!!status,...status,geometryUntouched:true,semantics:'SCHEMATIC_FLOW_NOT_PHYSICAL_PIPING'};}
 const unsubscribe=subscribeProcess(updateSnapshot);
 function label(item,text){if(item.lastLabel===text)return;item.lastLabel=text;const ctx=item.canvas.getContext('2d');ctx.clearRect(0,0,256,64);ctx.fillStyle='#0a1b2ae8';ctx.fillRect(0,0,256,64);ctx.fillStyle='#e5f5ff';ctx.font='bold 22px system-ui';ctx.textAlign='center';ctx.fillText(text,128,39,248);item.texture.needsUpdate=true}
 function update(){if(disposed)return;requestAnimationFrame(update);if(!status||!snapshot)return;const b=snapshot.batches[snapshot.active],idx=stationFor(b),t=status.seconds;
  const activeTests=b.samples.flatMap(id=>snapshot.samples[id].attempts).filter(a=>a.status==='RUNNING');
  for(const item of indicators){const busy=surface==='labs'?activeTests.some(a=>METHODS[a.method].station===item.index):idx===item.index&&!!b.task;
   item.material.color.setHex(status.held?COLORS.hold:busy?COLORS.active:item.index<idx?COLORS.pass:COLORS.idle);item.token.material.color.copy(item.material.color);
   item.ring.scale.setScalar(busy&&!status.held?1+.1*Math.sin(t*3):1);item.token.rotation.y=busy?t*.5:0;
   const text=status.held&&item.index===idx?'RETENIDO':busy?'EN EJECUCIÓN':item.index===idx?'ESPERA / REVISIÓN':String(item.index+1).padStart(2,'0');label(item,text);
  }
  const point=points[idx]||points[0],next=points[Math.min(idx+1,points.length-1)];milk.position.copy(point).lerp(next,b.task?status.progress:0);milk.visible=surface!=='labs'&&!!b.task;milkMaterial.color.setHex(status.held?COLORS.hold:COLORS.active);
  if(surface==='labs'&&activeTests.length){const test=activeTests[0],dest=points[METHODS[test.method].station]||points[1];sampleToken.position.copy(points[0]).lerp(dest,Math.min(1,test.elapsed/test.duration));sampleToken.visible=true}else sampleToken.visible=false;
 }
 requestAnimationFrame(update);
 const binding={status:()=>status,updateSnapshot,layer,dispose(){disposed=true;unsubscribe();scene.remove(layer);layer.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose()})}};scene.userData.processBinding=binding;return binding;
}
