import * as THREE from 'three';

export function createProjectProjection({scene,config,parcels,reduced=false}){
 const group=new THREE.Group();group.name='Proyecto señalado / proyección de luz';group.visible=false;scene.add(group);
 const colors=['#65f6dd','#ff68aa','#bdff62','#4ad7ff','#f7a6ff','#ffae5c','#9a9bff','#7af1e2'],textures=new Map();
 const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{color:{value:new THREE.Color()},power:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform vec3 color;uniform float power;void main(){float a=pow(max(0.,sin(v.y*3.14159265)),.35);gl_FragColor=vec4(color,power*a*.13);}'});
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.22,1.5,1,24,1,true),beamMat);group.add(beam);
 const coreMat=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),core=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1,8),coreMat);group.add(core);
 const ringMat=coreMat.clone(),ring=new THREE.Mesh(new THREE.TorusGeometry(1.7,.055,6,48),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.12;group.add(ring);
 const labelMat=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}),label=new THREE.Mesh(new THREE.PlaneGeometry(1,.375),labelMat);group.add(label);
 let target=null,shown=null,opacity=0,last=0,height=12,night=0,widthPixels=0;
 function texture(project){if(textures.has(project.id))return textures.get(project.id);const i=config.projects.indexOf(project),canvas=document.createElement('canvas');canvas.width=2048;canvas.height=768;const c=canvas.getContext('2d');c.scale(2,2);c.textAlign='center';c.lineJoin='round';c.lineCap='round';
  function text(text,y,font,max){c.font=font;c.strokeStyle=colors[i%colors.length];c.lineWidth=6;c.shadowColor=c.strokeStyle;c.shadowBlur=28;c.strokeText(text,512,y,max);c.lineWidth=1.2;c.shadowBlur=0;c.strokeStyle='#f5ffff';c.strokeText(text,512,y,max)}
  const name=project.name.toUpperCase(),words=name.split(' ');let lines=[name];
  if(name.includes(' / '))lines=name.split(' / ',2);else if(name.length>23&&words.length>1){let best=1,score=Infinity;for(let i=1;i<words.length;i++){const delta=Math.abs(words.slice(0,i).join(' ').length-words.slice(i).join(' ').length);if(delta<score){best=i;score=delta}}lines=[words.slice(0,best).join(' '),words.slice(best).join(' ')]}
  c.font='italic bold 126px Georgia';const font=Math.min(126,...lines.map(line=>126*960/Math.max(1,c.measureText(line).width)));
  lines.forEach((line,i)=>text(line,lines.length===1?186:138+i*122,'italic bold '+font+'px Georgia',960));
  text(project.number+' · '+(project.domain?.[0]||'PROJECT'),318,'32px Arial',900);text('ENTER PROJECT ↗',365,'28px Arial',900);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;textures.set(project.id,map);return map;
 }
 return {show(id){target=config.projects.find(p=>p.id===id)||null},clear(){target=null},setNight(v){night=v},update(now,camera,active=true){
  if(!active)target=null;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
  if(target&&shown?.id!==target.id){shown=target;const i=config.projects.indexOf(shown),color=colors[i%colors.length];group.position.set(shown.plot.center[0],.08,shown.plot.center[1]);for(const mat of [coreMat,ringMat])mat.color.set(color);beamMat.uniforms.color.value.set(color);labelMat.map=texture(shown);labelMat.needsUpdate=true;opacity=0}
  const next=target?1:0;opacity=reduced?next:THREE.MathUtils.damp(opacity,next,14,dt);group.visible=opacity>.012;
  if(!group.visible)return false;
  height=Math.max(18,(parcels.anchor(shown.id)?.height||5)+6);beam.position.y=core.position.y=height/2;beam.scale.y=core.scale.y=height;label.position.y=height+1.3;label.quaternion.copy(camera.quaternion);
  const viewport=scene.userData.viewport||{width:innerWidth,height:innerHeight},world=group.position.clone().add(label.position),projected=world.clone().project(camera);
  widthPixels=Math.min(560,viewport.width*.86);const pixelHeight=widthPixels*.375;
  const mx=Math.min(.96,(widthPixels+18)/viewport.width),my=Math.min(.96,(pixelHeight+18)/viewport.height);
  projected.x=THREE.MathUtils.clamp(projected.x,-1+mx,1-mx);projected.y=THREE.MathUtils.clamp(projected.y,-1+my,1-my);
  label.position.copy(projected.unproject(camera).sub(group.position));
  const forward=new THREE.Vector3();camera.getWorldDirection(forward);const depth=group.position.clone().add(label.position).sub(camera.position).dot(forward),width=2*Math.max(.5,depth)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*widthPixels/viewport.height;label.scale.setScalar(width);
  const pulse=reduced?1:.94+.06*Math.sin(now*.004);labelMat.opacity=opacity;coreMat.opacity=opacity*(.2+night*.5)*pulse;ringMat.opacity=opacity*(.5+night*.5);beamMat.uniforms.power.value=opacity*(.35+night*.65);return !reduced||Math.abs(opacity-next)>.012;
 },snapshot(){return {projectId:target?.id||null,visible:group.visible,displayedProject:shown?.id||null,height,opacity,widthPixels,classification:'HOVER_PROJECT_PROJECTION',fixedParcelSigns:0}}};
}
