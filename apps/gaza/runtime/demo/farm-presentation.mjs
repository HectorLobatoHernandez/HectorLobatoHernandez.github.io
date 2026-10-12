/** Verification metric: open-air / cutaway animal centers within the camera; not complete occlusion testing. */
export function screenPopulation(T,life,camera,world) {
 const snapshot=world.snapshot(),point=new T.Vector3();let inFrame=0,total=0;
 for(const plan of life.plans){
  if(snapshot.isolated&&snapshot.station!==(plan.species==='BOVINE'?1:2))continue;
  for(const animal of plan.members){total++;if(!snapshot.cutaway&&!animal.zone.includes('yard'))continue;
   point.set(animal.position[0],1,animal.position[1]).project(camera);
   if(Math.abs(point.x)<.94&&Math.abs(point.y)<.88&&point.z>-1&&point.z<1)inFrame++;
  }
 }
 return {inFrame:life.snapshot().preview?null:inFrame,total,method:'PROJECTED_OPEN_AIR_OR_CUTAWAY_CENTERS'};
}
