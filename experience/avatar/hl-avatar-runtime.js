import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V19_METAPERSON';
  root.userData.source='HECTOR_METAPERSON_GLB';

  const fallback=createFallbackAvatar(THREE);
  fallback.visible=false;
  root.add(fallback);

  const modelRoot=new THREE.Group();
  modelRoot.name='HL_METAPERSON';
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
    const b=bone(name), q0=state.baseQuat.get(name);
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

  function updateWalk(time,speed=1){
    if(!state.ready)return;
    restore(.22);
    const phase=time*5.0*Math.max(.45,speed||1);
    const swing=Math.sin(phase);
    const swing2=Math.sin(phase+Math.PI);
    rotateLocal('LeftUpLeg', swing*.36,0,0,.28);
    rotateLocal('RightUpLeg', swing2*.36,0,0,.28);
    rotateLocal('LeftLeg', Math.max(0,-swing)*.42,0,0,.28);
    rotateLocal('RightLeg', Math.max(0,-swing2)*.42,0,0,.28);
    rotateLocal('LeftArm', swing2*.25,0,.05,.24);
    rotateLocal('RightArm', swing*.25,0,-.05,.24);
    rotateLocal('Spine2',0,0,Math.sin(phase)*.02,.18);
  }

  function updateFall(time){
    if(!state.ready)return;
    restore(.18);
    rotateLocal('LeftArm',-.35,0,.35,.22);
    rotateLocal('RightArm',-.35,0,-.35,.22);
    rotateLocal('LeftUpLeg',.15,0,0,.18);
    rotateLocal('RightUpLeg',-.12,0,0,.18);
  }

  function updateLanding(time){
    if(!state.ready)return;
    restore(.18);
    rotateLocal('LeftUpLeg',-.30,0,0,.24);
    rotateLocal('RightUpLeg',-.30,0,0,.24);
    rotateLocal('LeftLeg',.52,0,0,.24);
    rotateLocal('RightLeg',.52,0,0,.24);
  }

  function updateClimb(time){
    if(!state.ready)return;
    restore(.18);
  }

  const loader=new GLTFLoader();
  loader.load(
    '../assets/models/avatar/hector-metaperson.glb?v=19',
    gltf=>{
      const scene=gltf.scene;
      scene.traverse(obj=>{
        if(obj.isMesh){
          obj.castShadow=true;
          obj.receiveShadow=true;
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
      root.userData.model='hector-metaperson.glb';
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
  return root;
}
