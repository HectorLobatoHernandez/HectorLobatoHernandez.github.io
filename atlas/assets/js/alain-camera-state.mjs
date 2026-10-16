export function rotatePosition(position,target,angle){
  const x=position[0]-target[0],z=position[2]-target[2],c=Math.cos(angle),s=Math.sin(angle);
  return [target[0]+x*c+z*s,position[1],target[2]+z*c-x*s];
}
export function zoomPosition(position,target,factor,min=.3,max=85){
  const delta=position.map((v,i)=>v-target[i]),distance=Math.hypot(...delta);
  if(distance===0)return [...position];
  const amount=Math.max(min,Math.min(max,distance*factor))/distance;
  return target.map((v,i)=>v+delta[i]*amount);
}
export function fitDistance(radius,fov,aspect){
  const vertical=fov*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect);
  return Math.max(.6,radius/Math.sin(Math.min(vertical,horizontal))*1.15);
}
