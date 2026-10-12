import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V15';
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
    model:null,
    moveBlend:0,
    facingYaw:0,
    landingBlend:0
  };

  const boneNames=[
    'Hips','Spine','Spine1','Spine2','Neck','Neck1','Neck2','Head',
    'LeftShoulder','LeftArm','LeftForeArm','LeftHand',
    'RightShoulder','RightArm','RightForeArm','RightHand',
    'LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase',
    'RightUpLeg','RightLeg','RightFoot','RightToeBase'
  ];

  function styleImportedAvatar(scene){
    const colors={
      hair:0x1a1412,
      top:0x18191b,
      bottom:0x151619,
      shoes:0x5d554b
    };

    scene.traverse(obj=>{
      if(!obj.isMesh && !obj.isSkinnedMesh)return;
      const mats=Array.isArray(obj.material)?obj.material:[obj.material];
      mats.forEach(mat=>{
        if(!mat || !mat.color)return;
        if(obj.name==='haircut')mat.color.setHex(colors.hair);
        if(obj.name==='outfit_top')mat.color.setHex(colors.top);
        if(obj.name==='outfit_bottom')mat.color.setHex(colors.bottom);
        if(obj.name==='outfit_shoes')mat.color.setHex(colors.shoes);
        if('roughness' in mat)mat.roughness=Math.max(.68,mat.roughness??.72);
      });
    });

    const head=state.bones.get('Head');
    if(head){
      const amber=new THREE.MeshStandardMaterial({
        color:0xb7642f,
        roughness:.45,
        metalness:.05
      });

      const lens=new THREE.MeshPhysicalMaterial({
        color:0x5a4632,
        transparent:true,
        opacity:.28,
        roughness:.12,
        metalness:0,
        depthWrite:false
      });

      const glasses=new THREE.Group();
      glasses.name='HL_AMBER_GLASSES';

      for(const sx of [-1,1]){
        const ring=new THREE.Mesh(
          new THREE.TorusGeometry(.039,.0055,8,24),
          amber
        );
        ring.position.set(sx*.036,.055,.126);
        glasses.add(ring);

        const l=new THREE.Mesh(
          new THREE.CircleGeometry(.034,24),
          lens
        );
        l.position.set(sx*.036,.055,.127);
        glasses.add(l);

        for(let i=0;i<6;i++){
          const link=new THREE.Mesh(
            new THREE.TorusGeometry(.0065,.0017,5,10),
            amber
          );
          link.scale.set(.72,1.28,1);
          link.rotation.y=Math.PI/2;
          link.position.set(sx*.079,.025-i*.018,.048);
          glasses.add(link);
        }
      }

      const bridge=new THREE.Mesh(
        new THREE.BoxGeometry(.028,.0045,.0045),
        amber
      );
      bridge.position.set(0,.055,.127);
      glasses.add(bridge);
      head.add(glasses);

      const curlMat=new THREE.MeshStandardMaterial({
        color:0x171311,
        roughness:.98
      });

      const curls=new THREE.Group();
      curls.name='HL_CURLY_HAIR_OVERLAY';

      const pts=[
        [-.065,.145,.03],[-.03,.162,.045],[0,.168,.05],[.03,.162,.045],[.065,.145,.03],
        [-.075,.115,.015],[-.04,.128,.06],[0,.135,.07],[.04,.128,.06],[.075,.115,.015],
        [-.07,.095,-.025],[-.035,.11,-.055],[0,.115,-.065],[.035,.11,-.055],[.07,.095,-.025],
        [-.055,.06,-.065],[0,.07,-.08],[.055,.06,-.065]
      ];

      pts.forEach(([x,y,z],i)=>{
        const curl=new THREE.Mesh(
          new THREE.IcosahedronGeometry(.026+(i%3)*.003,1),
          curlMat
        );
        curl.position.set(x,y,z);
        curls.add(curl);
      });

      head.add(curls);
    }
  }

  const ARM_DROP=1.30;
  const WALK_LEG_SWING=.24;
  const WALK_ARM_SWING=.16;

  function bone(name){
    return state.bones.get(name) || null;
  }

  function rotateLocal(name,x=0,y=0,z=0,amount=.22){
    const b=bone(name);
    const q0=state.baseQuat.get(name);
    if(!b || !q0)return;

    const qDelta=new THREE.Quaternion().setFromEuler(
      new THREE.Euler(x,y,z,'XYZ')
    );

    const target=q0.clone().multiply(qDelta);
    b.quaternion.slerp(target,amount);
  }

  function lerpAngle(current,target,amount){
    let delta=(target-current+Math.PI)%(Math.PI*2)-Math.PI;
    if(delta<-Math.PI)delta+=Math.PI*2;
    return current+delta*amount;
  }

  function smooth01(v){
    v=THREE.MathUtils.clamp(v,0,1);
    return v*v*(3-2*v);
  }

  function setNeutralArms(amount=.22){
    rotateLocal('LeftArm',0,0, ARM_DROP,amount);
    rotateLocal('RightArm',0,0,-ARM_DROP,amount);
    rotateLocal('LeftForeArm',.08,0,.03,amount);
    rotateLocal('RightForeArm',.08,0,-.03,amount);
  }

  function applyStandPose(time=0,amount=.22){
    setNeutralArms(amount);

    rotateLocal('LeftUpLeg',0,0,0,amount);
    rotateLocal('RightUpLeg',0,0,0,amount);
    rotateLocal('LeftLeg',0,0,0,amount);
    rotateLocal('RightLeg',0,0,0,amount);

    rotateLocal(
      'Spine2',
      Math.sin(time*.55)*.003,
      Math.sin(time*.27)*.006,
      Math.sin(time*.42)*.003,
      amount
    );

    rotateLocal(
      'Head',
      Math.sin(time*.31)*.004,
      Math.sin(time*.23)*.008,
      0,
      amount
    );
  }

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
              if('roughness' in mat){
                mat.roughness=Math.max(.5,mat.roughness??.7);
              }
            });
          }
        }

        if(obj.isBone || boneNames.includes(obj.name)){
          state.bones.set(obj.name,obj);
          state.baseQuat.set(obj.name,obj.quaternion.clone());
          state.basePos.set(obj.name,obj.position.clone());
        }
      });

      scene.scale.setScalar(1);
      scene.rotation.y=0;

      modelRoot.add(scene);

      state.model=scene;
      state.ready=true;
      state.facingYaw=0;

      fallback.visible=false;
      modelRoot.visible=true;

      styleImportedAvatar(scene);
      applyStandPose(0,1);

      root.userData.ready=true;
      root.userData.skeletonBones=[...state.bones.keys()];
    },
    undefined,
    err=>{
      console.warn(
        'MetaPerson avatar unavailable, using procedural fallback',
        err
      );
      root.userData.ready=false;
      root.userData.loadError=String(err?.message||err);
    }
  );

  function restoreBone(name,amount=.18){
    const b=bone(name);
    const q=state.baseQuat.get(name);
    const p=state.basePos.get(name);

    if(!b || !q)return;

    b.quaternion.slerp(q,amount);
    if(p)b.position.lerp(p,amount);
  }

  function restoreRig(amount=.18){
    for(const name of boneNames){
      restoreBone(name,amount);
    }

    modelRoot.position.x=THREE.MathUtils.lerp(
      modelRoot.position.x,0,amount
    );
    modelRoot.position.y=THREE.MathUtils.lerp(
      modelRoot.position.y,0,amount
    );
    modelRoot.position.z=THREE.MathUtils.lerp(
      modelRoot.position.z,0,amount
    );

    modelRoot.rotation.x=THREE.MathUtils.lerp(
      modelRoot.rotation.x,0,amount
    );
    modelRoot.rotation.z=THREE.MathUtils.lerp(
      modelRoot.rotation.z,0,amount
    );
  }

  function updateFacing(direction,moving){
    if(!moving)return;

    const targetYaw=direction<0 ? Math.PI : 0;

    state.facingYaw=lerpAngle(
      state.facingYaw,
      targetYaw,
      .105
    );

    modelRoot.rotation.y=state.facingYaw;
  }

  function updateWalk(time,direction=0,speed=1){
    if(!state.ready){
      fallback.userData.update?.(time,direction,speed);
      return;
    }

    const moving=Math.abs(direction)>.01;
    const targetBlend=moving ? 1 : 0;

    state.moveBlend=THREE.MathUtils.lerp(
      state.moveBlend,
      targetBlend,
      moving ? .095 : .075
    );

    updateFacing(direction,moving);

    const normalizedSpeed=THREE.MathUtils.clamp(speed,.55,1.15);
    const cadence=1.72*normalizedSpeed;
    const phase=time*cadence;
    const blend=state.moveBlend;

    const s=Math.sin(phase);
    const c=Math.cos(phase);

    const legL=s*WALK_LEG_SWING*blend;
    const legR=-s*WALK_LEG_SWING*blend;

    const kneeL=Math.max(0,-s)*.27*blend;
    const kneeR=Math.max(0, s)*.27*blend;

    const ankleL=Math.max(0,s)*.055*blend;
    const ankleR=Math.max(0,-s)*.055*blend;

    rotateLocal(
      'LeftArm',
      -s*WALK_ARM_SWING*blend,
      0,
      ARM_DROP+.025,
      .20
    );

    rotateLocal(
      'RightArm',
      s*WALK_ARM_SWING*blend,
      0,
      -ARM_DROP-.025,
      .20
    );

    rotateLocal(
      'LeftForeArm',
      .10+Math.max(0,s)*.055*blend,
      0,
      .025,
      .18
    );

    rotateLocal(
      'RightForeArm',
      .10+Math.max(0,-s)*.055*blend,
      0,
      -.025,
      .18
    );

    rotateLocal('LeftUpLeg', legL,0,0,.20);
    rotateLocal('RightUpLeg',legR,0,0,.20);

    rotateLocal('LeftLeg', kneeL,0,0,.20);
    rotateLocal('RightLeg',kneeR,0,0,.20);

    rotateLocal('LeftFoot', -ankleL,0,0,.18);
    rotateLocal('RightFoot',-ankleR,0,0,.18);

    rotateLocal(
      'Spine2',
      .018*blend,
      -.018*s*blend,
      -.012*s*blend,
      .16
    );

    rotateLocal(
      'Head',
      -.008*blend,
      .010*s*blend,
      0,
      .14
    );

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');

    if(hips && base){
      const bob=(1-Math.cos(phase*2))*.0045*blend;
      const sway=c*.004*blend;

      hips.position.x=THREE.MathUtils.lerp(
        hips.position.x,
        base.x+sway,
        .24
      );

      hips.position.y=THREE.MathUtils.lerp(
        hips.position.y,
        base.y+bob,
        .24
      );

      hips.position.z=THREE.MathUtils.lerp(
        hips.position.z,
        base.z,
        .28
      );
    }

    modelRoot.position.y=THREE.MathUtils.lerp(
      modelRoot.position.y,
      0,
      .18
    );

    modelRoot.rotation.x=THREE.MathUtils.lerp(
      modelRoot.rotation.x,
      0,
      .15
    );

    modelRoot.rotation.z=THREE.MathUtils.lerp(
      modelRoot.rotation.z,
      0,
      .15
    );

    if(!moving && state.moveBlend<.055){
      applyStandPose(time,.18);
    }
  }

  function updateFall(time,progress=0){
    if(!state.ready){
      fallback.userData.updateFall?.(time,progress);
      return;
    }

    const p=smooth01(progress);
    const wind=Math.sin(time*2.2);

    rotateLocal(
      'LeftArm',
      -.20+wind*.025,
      0,
      1.02,
      .24
    );

    rotateLocal(
      'RightArm',
      -.16-wind*.025,
      0,
      -1.02,
      .24
    );

    rotateLocal(
      'LeftForeArm',
      .28,
      0,
      .08,
      .22
    );

    rotateLocal(
      'RightForeArm',
      .24,
      0,
      -.08,
      .22
    );

    rotateLocal(
      'LeftUpLeg',
      .18+wind*.025,
      0,
      -.025,
      .22
    );

    rotateLocal(
      'RightUpLeg',
      -.10-wind*.025,
      0,
      .025,
      .22
    );

    rotateLocal(
      'LeftLeg',
      .28,
      0,
      0,
      .22
    );

    rotateLocal(
      'RightLeg',
      .18,
      0,
      0,
      .22
    );

    rotateLocal(
      'Spine2',
      -.10,
      0,
      wind*.018,
      .20
    );

    rotateLocal(
      'Head',
      .035,
      Math.sin(time*.45)*.018,
      0,
      .18
    );

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');

    if(hips && base){
      hips.position.x=THREE.MathUtils.lerp(
        hips.position.x,
        base.x,
        .25
      );

      hips.position.y=THREE.MathUtils.lerp(
        hips.position.y,
        base.y-.018*p,
        .22
      );

      hips.position.z=THREE.MathUtils.lerp(
        hips.position.z,
        base.z,
        .25
      );
    }

    modelRoot.rotation.x=THREE.MathUtils.lerp(
      modelRoot.rotation.x,
      -.11-.05*p,
      .12
    );

    modelRoot.rotation.z=THREE.MathUtils.lerp(
      modelRoot.rotation.z,
      wind*.012,
      .10
    );

    modelRoot.position.y=THREE.MathUtils.lerp(
      modelRoot.position.y,
      -.018*p,
      .12
    );
  }

  function updateLanding(time,progress=0){
    if(!state.ready){
      fallback.userData.updateLanding?.(time,progress);
      return;
    }

    const p=THREE.MathUtils.clamp(progress,0,1);
    const recover=smooth01(p);
    const impact=Math.sin(Math.PI*Math.min(1,p))*0.88;
    const crouch=Math.max(0,(1-recover)*.58+impact*.42);

    rotateLocal(
      'LeftUpLeg',
      .46*crouch,
      0,
      0,
      .30
    );

    rotateLocal(
      'RightUpLeg',
      .43*crouch,
      0,
      0,
      .30
    );

    rotateLocal(
      'LeftLeg',
      .82*crouch,
      0,
      0,
      .30
    );

    rotateLocal(
      'RightLeg',
      .78*crouch,
      0,
      0,
      .30
    );

    rotateLocal(
      'LeftArm',
      -.16*crouch,
      0,
      ARM_DROP-.10*crouch,
      .26
    );

    rotateLocal(
      'RightArm',
      -.13*crouch,
      0,
      -ARM_DROP+.10*crouch,
      .26
    );

    rotateLocal(
      'LeftForeArm',
      .16*crouch,
      0,
      .025,
      .22
    );

    rotateLocal(
      'RightForeArm',
      .16*crouch,
      0,
      -.025,
      .22
    );

    rotateLocal(
      'Spine2',
      -.22*crouch,
      0,
      0,
      .25
    );

    rotateLocal(
      'Head',
      .09*crouch,
      0,
      0,
      .20
    );

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');

    if(hips && base){
      hips.position.y=THREE.MathUtils.lerp(
        hips.position.y,
        base.y-.105*crouch,
        .34
      );

      hips.position.x=THREE.MathUtils.lerp(
        hips.position.x,
        base.x,
        .28
      );

      hips.position.z=THREE.MathUtils.lerp(
        hips.position.z,
        base.z,
        .28
      );
    }

    modelRoot.rotation.x=THREE.MathUtils.lerp(
      modelRoot.rotation.x,
      -.08*crouch,
      .22
    );

    modelRoot.rotation.z=THREE.MathUtils.lerp(
      modelRoot.rotation.z,
      0,
      .22
    );

    modelRoot.position.y=THREE.MathUtils.lerp(
      modelRoot.position.y,
      -.055*crouch,
      .28
    );

    if(p>.94){
      applyStandPose(time,.20);
    }
  }

  function updateClimb(time,progress=0){
    if(!state.ready){
      fallback.userData.updateClimb?.(time,progress);
      return;
    }

    const phase=time*3.25;
    const a=Math.sin(phase);
    const b=-a;

    rotateLocal(
      'LeftArm',
      -.18+a*.12,
      0,
      .98,
      .22
    );

    rotateLocal(
      'RightArm',
      -.18+b*.12,
      0,
      -.98,
      .22
    );

    rotateLocal(
      'LeftForeArm',
      -.38,
      0,
      .05,
      .22
    );

    rotateLocal(
      'RightForeArm',
      -.38,
      0,
      -.05,
      .22
    );

    rotateLocal(
      'LeftUpLeg',
      .42+b*.16,
      0,
      0,
      .24
    );

    rotateLocal(
      'RightUpLeg',
      .42+a*.16,
      0,
      0,
      .24
    );

    rotateLocal('LeftLeg',.68,0,0,.24);
    rotateLocal('RightLeg',.68,0,0,.24);
    rotateLocal('Spine2',-.13,0,0,.20);
    rotateLocal('Head',.06,0,0,.18);
  }

  root.userData.update=(time,direction=0,speed=1)=>{
    updateWalk(time,direction,speed);
  };

  root.userData.updateFall=(time,progress=0)=>{
    updateFall(time,progress);
  };

  root.userData.updateLanding=(time,progress=0)=>{
    updateLanding(time,progress);
  };

  root.userData.updateClimb=(time,progress=0)=>{
    updateClimb(time,progress);
  };

  root.userData.reset=(amount=.2)=>{
    if(state.ready){
      restoreRig(amount);
      applyStandPose(0,amount);
    }
  };

  root.userData.ready=false;

  return root;
}
