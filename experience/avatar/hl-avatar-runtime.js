import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V17';
  root.userData.source='RHB_TRIPOSR_V2_RIGGED_GLB';

  const fallback=createFallbackAvatar(THREE);
  fallback.name='HL_AVATAR_FALLBACK';
  root.add(fallback);

  const modelRoot=new THREE.Group();
  modelRoot.name='HL_AVATAR_V2_RIGGED';
  modelRoot.visible=false;
  root.add(modelRoot);

  const state={
    ready:false,
    bones:new Map(),
    baseQuat:new Map(),
    basePos:new Map(),
    model:null,
    moveBlend:0
  };

  const boneNames=[
    'Hips','Spine','Spine1','Spine2','Neck','Head',
    'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
    'RightShoulder','RightArm','RightForeArm','RightHand',
    'LeftUpLeg','LeftLeg','LeftFoot',
    'RightUpLeg','RightLeg','RightFoot'
  ];

  function bone(name){
    return state.bones.get(name)||null;
  }

  function rotateLocal(name,x=0,y=0,z=0,amount=.18){
    const b=bone(name);
    const q0=state.baseQuat.get(name);
    if(!b||!q0)return;
    const delta=new THREE.Quaternion().setFromEuler(
      new THREE.Euler(x,y,z,'XYZ')
    );
    b.quaternion.slerp(q0.clone().multiply(delta),amount);
  }

  function restoreBone(name,amount=.18){
    const b=bone(name);
    const q=state.baseQuat.get(name);
    const p=state.basePos.get(name);
    if(!b||!q)return;
    b.quaternion.slerp(q,amount);
    if(p)b.position.lerp(p,amount);
  }

  function restoreRig(amount=.18){
    for(const name of boneNames)restoreBone(name,amount);
    modelRoot.position.y=THREE.MathUtils.lerp(modelRoot.position.y,0,amount);
    modelRoot.rotation.x=THREE.MathUtils.lerp(modelRoot.rotation.x,0,amount);
    modelRoot.rotation.y=THREE.MathUtils.lerp(modelRoot.rotation.y,0,amount);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,0,amount);
  }

  function smooth01(v){
    v=THREE.MathUtils.clamp(v,0,1);
    return v*v*(3-2*v);
  }

  function updateIdle(time,amount=.14){
    rotateLocal('Spine2',
      Math.sin(time*.55)*.004,
      Math.sin(time*.24)*.004,
      Math.sin(time*.37)*.003,
      amount
    );
    rotateLocal('Head',
      Math.sin(time*.31)*.004,
      Math.sin(time*.23)*.007,
      0,
      amount
    );
    rotateLocal('LeftArm',0,0,0,amount);
    rotateLocal('RightArm',0,0,0,amount);
    rotateLocal('LeftForeArm',0,0,0,amount);
    rotateLocal('RightForeArm',0,0,0,amount);
  }

  const loader=new GLTFLoader();

  loader.load(
    '../assets/models/avatar/hector-avatar-v2-rigged.glb?v=17',
    gltf=>{
      const scene=gltf.scene;

      scene.traverse(obj=>{
        if(obj.isMesh||obj.isSkinnedMesh){
          obj.castShadow=true;
          obj.receiveShadow=true;

          const mats=Array.isArray(obj.material)?obj.material:[obj.material];
          mats.forEach(mat=>{
            if(!mat)return;
            if('roughness' in mat && mat.roughness<.62)mat.roughness=.62;
          });
        }

        if(obj.isBone||boneNames.includes(obj.name)){
          state.bones.set(obj.name,obj);
          state.baseQuat.set(obj.name,obj.quaternion.clone());
          state.basePos.set(obj.name,obj.position.clone());
        }
      });

      scene.scale.setScalar(1);
      scene.rotation.set(0,0,0);

      modelRoot.add(scene);
      state.model=scene;
      state.ready=true;

      fallback.visible=false;
      modelRoot.visible=true;

      root.userData.ready=true;
      root.userData.skeletonBones=[...state.bones.keys()];
      root.userData.model='hector-avatar-v2-rigged.glb';

      updateIdle(0,1);
    },
    undefined,
    err=>{
      console.warn('RHB avatar V2 unavailable, using fallback',err);
      root.userData.ready=false;
      root.userData.loadError=String(err?.message||err);
      fallback.visible=true;
      modelRoot.visible=false;
    }
  );

  function updateWalk(time,direction=0,speed=1){
    if(!state.ready){
      fallback.userData.update?.(time,direction,speed);
      return;
    }

    const moving=Math.abs(direction)>.01;
    state.moveBlend=THREE.MathUtils.lerp(
      state.moveBlend,
      moving?1:0,
      moving?.10:.07
    );

    const blend=state.moveBlend;

    if(blend<.035){
      restoreRig(.10);
      updateIdle(time,.15);
      return;
    }

    const normalizedSpeed=THREE.MathUtils.clamp(speed,.60,1.10);
    const phase=time*1.72*normalizedSpeed;
    const s=Math.sin(phase);
    const c=Math.cos(phase);

    const leg=.18*s*blend;
    const arm=.10*s*blend;

    rotateLocal('LeftUpLeg', leg,0,0,.18);
    rotateLocal('RightUpLeg',-leg,0,0,.18);

    rotateLocal('LeftLeg', Math.max(0,-s)*.18*blend,0,0,.17);
    rotateLocal('RightLeg',Math.max(0, s)*.18*blend,0,0,.17);

    rotateLocal('LeftArm',-arm,0,0,.16);
    rotateLocal('RightArm',arm,0,0,.16);

    rotateLocal('LeftForeArm',Math.max(0,s)*.035*blend,0,0,.14);
    rotateLocal('RightForeArm',Math.max(0,-s)*.035*blend,0,0,.14);

    rotateLocal('Spine2',
      .008*blend,
      -.010*s*blend,
      -.006*s*blend,
      .13
    );

    rotateLocal('Head',
      -.004*blend,
      .007*s*blend,
      0,
      .12
    );

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');
    if(hips&&base){
      const bob=(1-Math.cos(phase*2))*.0032*blend;
      hips.position.x=THREE.MathUtils.lerp(
        hips.position.x,
        base.x+c*.0025*blend,
        .22
      );
      hips.position.y=THREE.MathUtils.lerp(
        hips.position.y,
        base.y+bob,
        .22
      );
      hips.position.z=THREE.MathUtils.lerp(
        hips.position.z,
        base.z,
        .25
      );
    }

    modelRoot.rotation.x=THREE.MathUtils.lerp(modelRoot.rotation.x,0,.15);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,0,.15);
  }

  function updateFall(time,progress=0){
    if(!state.ready){
      fallback.userData.updateFall?.(time,progress);
      return;
    }

    const p=smooth01(progress);
    const drift=Math.sin(time*1.55);

    rotateLocal('LeftArm',-.34,0,-.12,.18);
    rotateLocal('RightArm',-.34,0,.12,.18);
    rotateLocal('LeftForeArm',.14,0,0,.16);
    rotateLocal('RightForeArm',.14,0,0,.16);

    rotateLocal('LeftUpLeg',.10+drift*.015,0,0,.16);
    rotateLocal('RightUpLeg',-.06-drift*.015,0,0,.16);
    rotateLocal('LeftLeg',.16,0,0,.16);
    rotateLocal('RightLeg',.12,0,0,.16);

    rotateLocal('Spine2',-.08,0,drift*.008,.15);
    rotateLocal('Head',.025,drift*.008,0,.14);

    modelRoot.rotation.x=THREE.MathUtils.lerp(
      modelRoot.rotation.x,
      -.10-.04*p,
      .12
    );
    modelRoot.rotation.z=THREE.MathUtils.lerp(
      modelRoot.rotation.z,
      drift*.008,
      .10
    );
  }

  function updateLanding(time,progress=0){
    if(!state.ready){
      fallback.userData.updateLanding?.(time,progress);
      return;
    }

    const p=THREE.MathUtils.clamp(progress,0,1);
    const recover=smooth01(p);
    const impact=Math.sin(Math.PI*p);
    const crouch=Math.max(0,(1-recover)*.48+impact*.28);

    rotateLocal('LeftUpLeg',.26*crouch,0,0,.24);
    rotateLocal('RightUpLeg',.26*crouch,0,0,.24);
    rotateLocal('LeftLeg',.48*crouch,0,0,.24);
    rotateLocal('RightLeg',.48*crouch,0,0,.24);

    rotateLocal('LeftArm',-.10*crouch,0,0,.20);
    rotateLocal('RightArm',-.10*crouch,0,0,.20);
    rotateLocal('Spine2',-.15*crouch,0,0,.20);
    rotateLocal('Head',.05*crouch,0,0,.18);

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');
    if(hips&&base){
      hips.position.y=THREE.MathUtils.lerp(
        hips.position.y,
        base.y-.075*crouch,
        .28
      );
    }

    modelRoot.rotation.x=THREE.MathUtils.lerp(
      modelRoot.rotation.x,
      -.04*crouch,
      .20
    );

    if(p>.94){
      restoreRig(.20);
      updateIdle(time,.16);
    }
  }

  function updateClimb(time,progress=0){
    if(!state.ready){
      fallback.userData.updateClimb?.(time,progress);
      return;
    }

    const s=Math.sin(time*3.0);
    rotateLocal('LeftArm',-.24+s*.08,0,0,.18);
    rotateLocal('RightArm',-.24-s*.08,0,0,.18);
    rotateLocal('LeftUpLeg',.30-s*.12,0,0,.20);
    rotateLocal('RightUpLeg',.30+s*.12,0,0,.20);
    rotateLocal('LeftLeg',.42,0,0,.20);
    rotateLocal('RightLeg',.42,0,0,.20);
    rotateLocal('Spine2',-.10,0,0,.17);
  }

  root.userData.update=(time,direction=0,speed=1)=>updateWalk(time,direction,speed);
  root.userData.updateFall=(time,progress=0)=>updateFall(time,progress);
  root.userData.updateLanding=(time,progress=0)=>updateLanding(time,progress);
  root.userData.updateClimb=(time,progress=0)=>updateClimb(time,progress);

  root.userData.reset=(amount=.2)=>{
    if(state.ready){
      restoreRig(amount);
      updateIdle(0,amount);
    }
  };

  root.userData.ready=false;
  return root;
}
