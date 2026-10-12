import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V23_HAIR_FRINGE';
  root.userData.source='HECTOR_METAPERSON_FIXED_V2';

  const fallback=createFallbackAvatar(THREE);
  fallback.visible=false;
  root.add(fallback);

  const modelRoot=new THREE.Group();
  modelRoot.name='HL_METAPERSON_FIXED_V2';
  modelRoot.visible=false;
  root.add(modelRoot);

  const state={
    ready:false,
    bones:new Map(),
    baseQuat:new Map(),
    basePos:new Map(),
    model:null
  };

  const boneNames=[
    'Hips','Spine','Spine1','Spine2','Neck','Head',
    'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
    'RightShoulder','RightArm','RightForeArm','RightHand',
    'LeftUpLeg','LeftLeg','LeftFoot',
    'RightUpLeg','RightLeg','RightFoot'
  ];

  function bone(name){ return state.bones.get(name)||null; }

  function rotateLocal(name,x=0,y=0,z=0,amount=.16){
    const b=bone(name),q0=state.baseQuat.get(name);
    if(!b||!q0)return;
    const d=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
    b.quaternion.slerp(q0.clone().multiply(d),amount);
  }

  function restore(amount=.18){
    for(const name of boneNames){
      const b=bone(name),q=state.baseQuat.get(name),p=state.basePos.get(name);
      if(!b||!q)continue;
      b.quaternion.slerp(q,amount);
      if(p)b.position.lerp(p,amount);
    }
  }

  function makeClothingBlack(obj){
    if(!obj.isMesh)return;
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    const isClothing=materials.some(mat=>{
      const n=(mat?.name||'').toLowerCase();
      return n.includes('outfit_top') ||
             n.includes('outfit_bottom') ||
             n.includes('outfit_shoes');
    });
    if(!isClothing)return;

    const cloned=materials.map(mat=>{
      if(!mat)return mat;
      const m=mat.clone();
      // Black fabric, but not zero-black so it remains readable in the dark world.
      m.color.setRGB(.10,.10,.10);
      if('roughness' in m)m.roughness=.78;
      if('metalness' in m)m.metalness=.02;
      m.needsUpdate=true;
      return m;
    });
    obj.material=Array.isArray(obj.material)?cloned:cloned[0];
  }

  function updateIdle(){
    if(!state.ready)return;
    restore(.22);
  }

  function updateWalk(time,speed=1){
    if(!state.ready)return;
    restore(.22);
    const phase=time*4.6*Math.max(.45,speed||1);
    const a=Math.sin(phase);
    const b=Math.sin(phase+Math.PI);

    rotateLocal('LeftUpLeg', a*.28,0,0,.24);
    rotateLocal('RightUpLeg',b*.28,0,0,.24);
    rotateLocal('LeftLeg',Math.max(0,-a)*.32,0,0,.24);
    rotateLocal('RightLeg',Math.max(0,-b)*.32,0,0,.24);

    // Keep original MetaPerson shoulder/arm bind pose intact for now.
    // Only a small safe swing around its existing base pose.
    rotateLocal('LeftArm',b*.08,0,0,.18);
    rotateLocal('RightArm',a*.08,0,0,.18);
    rotateLocal('Spine2',0,0,Math.sin(phase)*.012,.16);
  }

  function updateFall(){
    if(!state.ready)return;
    restore(.20);
  }

  function updateLanding(){
    if(!state.ready)return;
    restore(.20);
    rotateLocal('LeftUpLeg',-.18,0,0,.18);
    rotateLocal('RightUpLeg',-.18,0,0,.18);
    rotateLocal('LeftLeg',.30,0,0,.18);
    rotateLocal('RightLeg',.30,0,0,.18);
  }

  function updateClimb(){
    if(!state.ready)return;
    restore(.20);
  }

  const loader=new GLTFLoader();
  loader.load(
    '../assets/models/avatar/hector-metaperson-fixed-v2.glb?v=23',
    gltf=>{
      const scene=gltf.scene;

      scene.traverse(obj=>{
        if(obj.isMesh){
          obj.castShadow=true;
          obj.receiveShadow=true;
          makeClothingBlack(obj);
        }
        if(obj.isBone && boneNames.includes(obj.name)){
          state.bones.set(obj.name,obj);
          state.baseQuat.set(obj.name,obj.quaternion.clone());
          state.basePos.set(obj.name,obj.position.clone());
        }
      });

      modelRoot.add(scene);
      modelRoot.visible=true;
      state.model=scene;
      state.ready=true;
      root.userData.ready=true;
      root.userData.model='hector-metaperson-fixed-v2.glb';
      root.userData.revision='V23_HAIR_FRINGE';
    },
    undefined,
    err=>{
      console.error('MetaPerson avatar load failed',err);
      root.userData.ready=false;
      root.userData.loadError=String(err?.message||err);
    }
  );

  root.userData.update=(time,speed)=>updateWalk(time,speed);
  root.userData.updateWalk=updateWalk;
  root.userData.updateFall=updateFall;
  root.userData.updateLanding=updateLanding;
  root.userData.updateClimb=updateClimb;
  root.userData.reset=()=>restore(1);
  root.userData.updateIdle=updateIdle;
  return root;
}
