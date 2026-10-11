import {TASKS} from './catalog.mjs';
/** Non-geometric bindings. These status markers never claim surveyed piping or staff tracking. */
export function attachStationBinding(THREE,scene,positions){
 const group=new THREE.Group();group.name='SIMULATED_PROCESS_STATUS';scene.add(group);
 const sphere=new THREE.SphereGeometry(.16,8,6),material=new THREE.MeshBasicMaterial({color:'#65ccf1'});
 const markers=positions.map(p=>{const m=new THREE.Mesh(sphere,material.clone());m.position.set(p[0],p[1],p[2]);group.add(m);return m});
 return {update(snapshot,module){
  markers.forEach((m,i)=>{const active=snapshot?.active.some(x=>x.module===module&&x.station===i),test=module==='labs'&&snapshot?.tests.some(x=>x.station===i);
   m.visible=!!snapshot;m.material.color.set(snapshot?.held?'#e3a256':active||test?'#65dabb':'#63839a');
   const p=active?snapshot.active.find(x=>x.module===module&&x.station===i)?.progress:test?snapshot.tests.find(x=>x.station===i)?.progress:0;
   m.scale.setScalar(active||test?1.3+.4*Math.sin((p||0)*Math.PI*8):.7);
   m.userData={kind:'SIMULATED_PROCESS',station:i,active:!!active,test:!!test,lotId:snapshot?.lotId};
  });
 },dispose(){sphere.dispose();markers.forEach(m=>m.material.dispose());scene.remove(group)}};
}
export function taskProgress(state,lotId,id){const t=state?.lots[lotId]?.tasks[id];return t?.status==='DONE'?1:t?.status==='RUNNING'?Math.min(1,t.elapsed/(DURATION[id]||1)):0}
const DURATION=Object.fromEntries(TASKS.map(t=>[t.id,t.durationSimSeconds]));
