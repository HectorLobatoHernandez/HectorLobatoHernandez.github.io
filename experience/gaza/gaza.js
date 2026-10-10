import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGazaWorld } from './gaza-scene.js';

const canvas=document.getElementById('gazaCanvas');
const loading=document.getElementById('gazaLoading');
const hotspotRoot=document.getElementById('gazaHotspots');

const renderer=new THREE.WebGLRenderer({
  canvas,
  antialias:true,
  alpha:false,
  powerPreference:'high-performance'
});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x142016);
scene.fog=new THREE.FogExp2(0x172019,.014);

const camera=new THREE.PerspectiveCamera(44,1,.05,180);
camera.position.set(-13,8.2,17);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.065;
controls.target.set(-1.2,1.25,0);
controls.minDistance=4;
controls.maxDistance=48;
controls.maxPolarAngle=Math.PI*.47;

const hemi=new THREE.HemisphereLight(0xbfd7c0,0x29351f,1.8);
scene.add(hemi);

const sun=new THREE.DirectionalLight(0xffd49b,4.0);
sun.position.set(-10,18,12);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-30;
sun.shadow.camera.right=30;
sun.shadow.camera.top=30;
sun.shadow.camera.bottom=-30;
scene.add(sun);

const fill=new THREE.DirectionalLight(0x83b2a8,.9);
fill.position.set(16,7,-12);
scene.add(fill);

const world=createGazaWorld(THREE,{detail:'interactive'});
scene.add(world);

const clock=new THREE.Clock();

const views={
  overview:{
    pos:new THREE.Vector3(-13,8.2,17),
    target:new THREE.Vector3(-1.2,1.25,0)
  },
  zamora:{
    pos:new THREE.Vector3(-14.8,5.1,9.4),
    target:new THREE.Vector3(-7.2,1.35,4.2)
  },
  duero:{
    pos:new THREE.Vector3(-8.5,4.2,7.3),
    target:new THREE.Vector3(-1.3,.25,.3)
  },
  plant:{
    pos:new THREE.Vector3(13.5,5.1,11.3),
    target:new THREE.Vector3(6.3,1.1,3.8)
  },
  farm:{
    pos:new THREE.Vector3(13.7,4.3,-1.7),
    target:new THREE.Vector3(6.0,.9,-7.3)
  },
  vineyards:{
    pos:new THREE.Vector3(-7.2,4.7,-2.2),
    target:new THREE.Vector3(-.3,.5,-8.0)
  }
};

let tween=null;
let activeButton=null;

function moveTo(viewId,button){
  const v=views[viewId];
  if(!v)return;
  activeButton?.classList.remove('active');
  activeButton=button||null;
  activeButton?.classList.add('active');
  tween={
    start:performance.now(),
    duration:1150,
    fromPos:camera.position.clone(),
    fromTarget:controls.target.clone(),
    toPos:v.pos.clone(),
    toTarget:v.target.clone()
  };
}

const overviewButton=document.createElement('button');
overviewButton.type='button';
overviewButton.textContent='00 · OVERVIEW';
overviewButton.addEventListener('click',()=>moveTo('overview',overviewButton));
hotspotRoot.appendChild(overviewButton);

for(const h of world.userData.hotspots||[]){
  const b=document.createElement('button');
  b.type='button';
  b.textContent=h.label;
  b.addEventListener('click',()=>moveTo(h.id,b));
  hotspotRoot.appendChild(b);
}

function resize(){
  const w=innerWidth,h=innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/Math.max(1,h);
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize,{passive:true});
resize();

function ease(t){
  return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
}

function animate(){
  requestAnimationFrame(animate);
  const time=clock.getElapsedTime();

  if(tween){
    const raw=Math.min(1,(performance.now()-tween.start)/tween.duration);
    const t=ease(raw);
    camera.position.lerpVectors(tween.fromPos,tween.toPos,t);
    controls.target.lerpVectors(tween.fromTarget,tween.toTarget,t);
    if(raw>=1)tween=null;
  }

  try{
    world.userData.update?.(time);
  }catch(err){
    console.error('GAZA world animation update',err);
  }
  controls.update();
  renderer.render(scene,camera);
}

loading.classList.add('hide');
animate();
