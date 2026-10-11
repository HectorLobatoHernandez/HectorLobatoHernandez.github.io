import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V12';
  root.userData.source='METAPERSON_GLB_WITH_PROCEDURAL_FALLBACK';

  const fallback=createFallbackAvatar(THREE);
  fallback.name='HL_AVATAR_FALLBACK';
  root.add(fallback);

  const modelRoot=new THREE.Group();
  modelRoot.name='HL_AVATAR_METAPERSON';
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
    'Hips','Spine','Spine1','Spine2','Neck','Neck1','Neck2','Head',
    'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
    'RightShoulder','RightArm','RightForeArm','RightHand',
    'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase',
    'RightUpLeg','RightLeg','RightFoot','RightToeBase'
  ];

  const loader=new GLTFLoader();
  loader.load(
    '../assets/models/avatar/hector-metaperson.glb?v=12',
    gltf=>{
      const scene=gltf.scene;
      scene.traverse(obj=>{
        if(obj.isMesh || obj.isSkinnedMesh){
          obj.castShadow=true;
          obj.receiveShadow=true;
          if(obj.material){
            const mats=Array.isArray(obj.material)?obj.material:[obj.material];
            mats.forEach(mat=>{
              if('roughness' in mat)mat.roughness=Math.max(.5,mat.roughness??.7);
            });
          }
        }
        if(obj.isBone || boneNames.includes(obj.name)){
          state.bones.set(obj.name,obj);
          state.baseQuat.set(obj.name,obj.quaternion.clone());
          state.basePos.set(obj.name,obj.position.clone());
        }
      });

      // MetaPerson export is ~1.81 m high, so it can live at world scale 1.
      scene.scale.setScalar(1);
      scene.rotation.y=Math.PI;
      modelRoot.add(scene);

      state.model=scene;
      state.ready=true;
      fallback.visible=false;
      modelRoot.visible=true;
      root.userData.ready=true;
      root.userData.skeletonBones=[...state.bones.keys()];
    },
    undefined,
    err=>{
      console.warn('MetaPerson avatar unavailable, using procedural fallback',err);
      root.userData.ready=false;
      root.userData.loadError=String(err?.message||err);
    }
  );

  function bone(name){ return state.bones.get(name) || null; }

  function restoreBone(name,amount=.18){
    const b=bone(name), q=state.baseQuat.get(name), p=state.basePos.get(name);
    if(!b||!q)return;
    b.quaternion.slerp(q,amount);
    if(p)b.position.lerp(p,amount);
  }

  function restoreRig(amount=.18){
    for(const name of boneNames)restoreBone(name,amount);
    modelRoot.position.y=THREE.MathUtils.lerp(modelRoot.position.y,0,amount);
    modelRoot.rotation.x=THREE.MathUtils.lerp(modelRoot.rotation.x,0,amount);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,0,amount);
  }

  function rotateLocal(name,x=0,y=0,z=0,amount=.22){
    const b=bone(name), q0=state.baseQuat.get(name);
    if(!b||!q0)return;
    const qDelta=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
    const target=q0.clone().multiply(qDelta);
    b.quaternion.slerp(target,amount);
  }

  function updateWalk(time,direction=0,speed=1){
    if(!state.ready){
      fallback.userData.update?.(time,direction,speed);
      return;
    }

    const moving=Math.abs(direction)>.01;
    const cadence=2.65*Math.max(.72,Math.min(1.15,speed));
    const phase=time*cadence;

    const legSwing=moving?Math.sin(phase)*.30:0;
    const opposite=moving?Math.sin(phase+Math.PI)*.30:0;
    const kneeL=moving?Math.max(0,-Math.sin(phase))*.27:0;
    const kneeR=moving?Math.max(0,-Math.sin(phase+Math.PI))*.27:0;

    rotateLocal('LeftUpLeg',legSwing,0,0,.18);
    rotateLocal('RightUpLeg',opposite,0,0,.18);
    rotateLocal('LeftLeg',kneeL,0,0,.18);
    rotateLocal('RightLeg',kneeR,0,0,.18);

    rotateLocal('LeftArm',-legSwing*.38,0,-.015,.16);
    rotateLocal('RightArm',-opposite*.38,0,.015,.16);
    rotateLocal('LeftForeArm',moving?.08+Math.max(0,legSwing)*.05:0,0,0,.14);
    rotateLocal('RightForeArm',moving?.08+Math.max(0,opposite)*.05:0,0,0,.14);

    rotateLocal('Spine2',moving?.012*Math.sin(phase*.5):0,0,moving?.008*Math.sin(phase*.5):0,.14);
    rotateLocal('Head',0,moving?.012*Math.sin(time*.45):0,0,.12);

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');
    if(hips&&base){
      const bob=moving?Math.abs(Math.sin(phase))*0.008:Math.sin(time*1.25)*0.002;
      hips.position.x=THREE.MathUtils.lerp(hips.position.x,base.x,.3);
      hips.position.z=THREE.MathUtils.lerp(hips.position.z,base.z,.3);
      hips.position.y=THREE.MathUtils.lerp(hips.position.y,base.y+bob,.22);
    }

    if(!moving)restoreRig(.12);
  }

  function updateFall(time,progress=0){
    if(!state.ready){
      fallback.userData.updateFall?.(time,progress);
      return;
    }
    const wind=Math.sin(time*2.8);
    rotateLocal('LeftArm',-.28,0,-.32+wind*.035,.18);
    rotateLocal('RightArm',-.28,0,.32-wind*.035,.18);
    rotateLocal('LeftForeArm',-.14,0,0,.16);
    rotateLocal('RightForeArm',-.14,0,0,.16);
    rotateLocal('LeftUpLeg',.10+wind*.025,0,-.025,.16);
    rotateLocal('RightUpLeg',-.06-wind*.025,0,.025,.16);
    rotateLocal('LeftLeg',.14,0,0,.16);
    rotateLocal('RightLeg',.12,0,0,.16);
    rotateLocal('Spine2',-.07,0,wind*.012,.14);
    rotateLocal('Head',.02,Math.sin(time*.4)*.02,0,.14);
  }

  function updateLanding(time,progress=0){
    if(!state.ready){
      fallback.userData.updateLanding?.(time,progress);
      return;
    }
    const p=THREE.MathUtils.clamp(progress,0,1);
    const r=p*p*(3-2*p);
    const crouch=1-r;

    rotateLocal('LeftUpLeg',.78*crouch,0,0,.28);
    rotateLocal('RightUpLeg',.52*crouch,0,0,.28);
    rotateLocal('LeftLeg',1.02*crouch,0,0,.28);
    rotateLocal('RightLeg',.84*crouch,0,0,.28);
    rotateLocal('LeftArm',-.85*crouch,0,-.35*crouch,.24);
    rotateLocal('RightArm',.25*crouch,0,.4*crouch,.24);
    rotateLocal('Spine2',-.28*crouch,0,-.04*crouch,.22);
    rotateLocal('Head',.12*crouch,0,0,.18);

    const hips=bone('Hips'), base=state.basePos.get('Hips');
    if(hips&&base)hips.position.y=THREE.MathUtils.lerp(hips.position.y,base.y-.13*crouch,.28);
  }

  function updateClimb(time,progress=0){
    if(!state.ready){
      fallback.userData.updateClimb?.(time,progress);
      return;
    }
    const phase=time*4.1;
    const a=Math.sin(phase), b=Math.sin(phase+Math.PI);
    rotateLocal('LeftArm',-1.15+a*.24,0,-.18,.26);
    rotateLocal('RightArm',-1.15+b*.24,0,.18,.26);
    rotateLocal('LeftForeArm',-.45,0,0,.22);
    rotateLocal('RightForeArm',-.45,0,0,.22);
    rotateLocal('LeftUpLeg',.45+b*.18,0,0,.24);
    rotateLocal('RightUpLeg',.45+a*.18,0,0,.24);
    rotateLocal('LeftLeg',.72,0,0,.24);
    rotateLocal('RightLeg',.72,0,0,.24);
    rotateLocal('Spine2',-.16,0,0,.2);
    rotateLocal('Head',.08,0,0,.18);
  }

  root.userData.update=(time,direction=0,speed=1)=>updateWalk(time,direction,speed);
  root.userData.updateFall=(time,progress=0)=>updateFall(time,progress);
  root.userData.updateLanding=(time,progress=0)=>updateLanding(time,progress);
  root.userData.updateClimb=(time,progress=0)=>updateClimb(time,progress);
  root.userData.reset=(amount=.2)=>{
    if(state.ready)restoreRig(amount);
  };
  root.userData.ready=false;
  return root;
}
