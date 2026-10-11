import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createRhbWorld} from './rhb-scene.js';

const canvas=document.getElementById('rhbCanvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.95;
renderer.shadowMap.enabled=true;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x1b1713);
scene.fog=new THREE.FogExp2(0x1b1713,.02);
const camera=new THREE.PerspectiveCamera(44,1,.05,100);
camera.position.set(10,5.8,10);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.target.set(0,1.3,0);controls.minDistance=3;controls.maxDistance=30;

scene.add(new THREE.HemisphereLight(0xc7bca9,0x2b241d,1.5));
const key=new THREE.DirectionalLight(0xffd1a0,3.4);key.position.set(-8,14,9);key.castShadow=true;scene.add(key);
const fill=new THREE.DirectionalLight(0x8aa4b0,.65);fill.position.set(10,6,-8);scene.add(fill);

const world=createRhbWorld(THREE,{detail:'interactive'});scene.add(world);
const clock=new THREE.Clock();

const views={
  overview:{p:[10,5.8,10],t:[0,1.3,0]},
  heritage:{p:[0,3.0,8.6],t:[0,1.7,-2.6]},
  profiles:{p:[-7,3.1,1.5],t:[-3,1.3,-2.4]},
  fabrication:{p:[0,3.7,6.2],t:[.2,.9,-.2]},
  machines:{p:[7,3.1,3.0],t:[4.0,1.0,-.5]},
  architecture:{p:[-6.5,3.3,4.2],t:[-3.7,1.1,1.6]},
  studio:{p:[0,3.2,7.2],t:[0,2.0,-2.8]}
};

let tween=null,active=null,studioMode=false;
const nav=document.getElementById('rhbHotspots');
const add=(id,label)=>{
  const b=document.createElement('button');b.type='button';b.textContent=label;
  b.addEventListener('click',()=>{
    active?.classList.remove('active');active=b;b.classList.add('active');
    const v=views[id];studioMode=id==='studio';
    tween={s:performance.now(),d:900,fp:camera.position.clone(),ft:controls.target.clone(),tp:new THREE.Vector3(...v.p),tt:new THREE.Vector3(...v.t)};
  });
  nav.appendChild(b);
};
add('overview','00 · OVERVIEW');
for(const h of world.userData.hotspots||[])add(h.id,h.label);

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/Math.max(1,innerHeight);camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

function loop(){
  requestAnimationFrame(loop);
  const time=clock.getElapsedTime();
  if(tween){
    const raw=Math.min(1,(performance.now()-tween.s)/tween.d),t=ease(raw);
    camera.position.lerpVectors(tween.fp,tween.tp,t);controls.target.lerpVectors(tween.ft,tween.tt,t);
    if(raw>=1)tween=null;
  }
  world.userData.update?.(time,studioMode?1:.2);
  controls.update();renderer.render(scene,camera);
}
document.getElementById('rhbLoading').classList.add('hide');
loop();