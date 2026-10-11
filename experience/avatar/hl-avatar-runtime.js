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
    moveBlend:0
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
      const amber=new THREE.MeshStandardMaterial({color:0xb7642f,roughness:.45,metalness:.05});
      const lens=new THREE.MeshPhysicalMaterial({
        color:0x5a4632,transparent:true,opacity:.28,roughness:.12,metalness:0,depthWrite:false
      });

      const glasses=new THREE.Group();
      glasses.name='HL_AMBER_GLASSES';
      for(const sx of [-1,1]){
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.039,.0055,8,24),amber);
        ring.position.set(sx*.036,.055,.126);
        glasses.add(ring);

        const l=new THREE.Mesh(new THREE.CircleGeometry(.034,24),lens);
        l.position.set(sx*.036,.055,.127);
        glasses.add(l);

        for(let i=0;i<6;i++){
          const link=new THREE.Mesh(new THREE.TorusGeometry(.0065,.0017,5,10),amber);
          link.scale.set(.72,1.28,1);
          link.rotation.y=Math.PI/2;
          link.position.set(sx*.079,.025-i*.018,.048);
          glasses.add(link);
        }
      }
      const bridge=new THREE.Mesh(new THREE.BoxGeometry(.028,.0045,.0045),amber);
      bridge.position.set(0,.055,.127);
      glasses.add(bridge);
      head.add(glasses);

      // Curly-hair overlay: only an accessory shell, not the whole character.
      const curlMat=new THREE.MeshStandardMaterial({color:0x171311,roughness:.98});
      const curls=new THREE.Group();
      curls.name='HL_CURLY_HAIR_OVERLAY';
      const pts=[
        [-.065,.145,.03],[-.03,.162,.045],[0,.168,.05],[.03,.162,.045],[.065,.145,.03],
        [-.075,.115,.015],[-.04,.128,.06],[0,.135,.07],[.04,.128,.06],[.075,.115,.015],
        [-.07,.095,-.025],[-.035,.11,-.055],[0,.115,-.065],[.035,.11,-.055],[.07,.095,-.025],
        [-.055,.06,-.065],[0,.07,-.08],[.055,.06,-.065]
      ];
      pts.forEach(([x,y,z],i)=>{
        const curl=new THREE.Mesh(new THREE.IcosahedronGeometry(.026+(i%3)*.003,1),curlMat);
        curl.position.set(x,y,z);
        curls.add(curl);
      });
      head.add(curls);
    }
  }

  const ARM_DOWN=1.55;

  function applyStandPose(time=0,amount=.22){
    rotateLocal('LeftArm',ARM_DOWN,0,-.015,amount);
    rotateLocal('RightArm',ARM_DOWN,0,.015,amount);
    rotateLocal('LeftForeArm',.08,0,0,amount);
    rotateLocal('RightForeArm',.08,0,0,amount);
    rotateLocal('LeftUpLeg',0,0,0,amount);
    rotateLocal('RightUpLeg',0,0,0,amount);
    rotateLocal('LeftLeg',0,0,0,amount);
    rotateLocal('RightLeg',0,0,0,amount);
    rotateLocal('Spine2',0,0,0,amount);
    rotateLocal('Head',0,Math.sin(time*.35)*.008,0,amount);
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
      // MetaPerson already faces the runtime forward axis. The old PI flip made it walk backwards.
      scene.rotation.y=0;
      modelRoot.add(scene);

      state.model=scene;
      state.ready=true;
      fallback.visible=false;
      modelRoot.visible=true;
      styleImportedAvatar(scene);
      applyStandPose(0,1);
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
    state.moveBlend=THREE.MathUtils.lerp(
      state.moveBlend,
      moving?1:0,
      moving?.075:.055
    );

    const blend=state.moveBlend;
    const cadence=1.82*Math.max(.82,Math.min(1.05,speed));
    const phase=time*cadence;

    const legL=Math.sin(phase)*.14*blend;
    const legR=Math.sin(phase+Math.PI)*.14*blend;
    const kneeL=Math.max(0,-Math.sin(phase))*.10*blend;
    const kneeR=Math.max(0,-Math.sin(phase+Math.PI))*.10*blend;

    // Natural relaxed arms: start from arm-down, then add only a very small counter swing.
    rotateLocal('LeftArm',ARM_DOWN-legL*.18,0,-.008,.16);
    rotateLocal('RightArm',ARM_DOWN-legR*.18,0,.008,.16);
    rotateLocal('LeftForeArm',.055+Math.max(0,legL)*.025,0,0,.14);
    rotateLocal('RightForeArm',.055+Math.max(0,legR)*.025,0,0,.14);

    rotateLocal('LeftUpLeg',legL,0,0,.17);
    rotateLocal('RightUpLeg',legR,0,0,.17);
    rotateLocal('LeftLeg',kneeL,0,0,.16);
    rotateLocal('RightLeg',kneeR,0,0,.16);

    rotateLocal('Spine2',.003*Math.sin(phase*.5)*blend,0,.002*Math.sin(phase*.5)*blend,.12);
    rotateLocal('Head',0,.005*Math.sin(time*.32)*blend,0,.10);

    // Lock root motion: walking animation never changes the avatar's world height or position.
    const hips=bone('Hips');
    const base=state.basePos.get('Hips');
    if(hips&&base){
      hips.position.x=THREE.MathUtils.lerp(hips.position.x,base.x,.38);
      hips.position.y=THREE.MathUtils.lerp(hips.position.y,base.y,.38);
      hips.position.z=THREE.MathUtils.lerp(hips.position.z,base.z,.38);
    }

    if(!moving && blend<.035)applyStandPose(time,.18);
  }
  function updateFall(time,progress=0){
    if(!state.ready){
      fallback.userData.updateFall?.(time,progress);
      return;
    }

    // Stable belly-down/free-fall silhouette. No frantic arm windmilling.
    const wind=Math.sin(time*1.35);
    rotateLocal('LeftArm',1.18,0,-.12+wind*.012,.15);
    rotateLocal('RightArm',1.18,0,.12-wind*.012,.15);
    rotateLocal('LeftForeArm',.18,0,0,.14);
    rotateLocal('RightForeArm',.18,0,0,.14);
    rotateLocal('LeftUpLeg',.08+wind*.008,0,-.01,.14);
    rotateLocal('RightUpLeg',-.04-wind*.008,0,.01,.14);
    rotateLocal('LeftLeg',.12,0,0,.14);
    rotateLocal('RightLeg',.10,0,0,.14);
    rotateLocal('Spine2',-.055,0,wind*.004,.12);
    rotateLocal('Head',.02,Math.sin(time*.25)*.008,0,.12);

    const hips=bone('Hips');
    const base=state.basePos.get('Hips');
    if(hips&&base){
      hips.position.x=THREE.MathUtils.lerp(hips.position.x,base.x,.35);
      hips.position.y=THREE.MathUtils.lerp(hips.position.y,base.y,.35);
      hips.position.z=THREE.MathUtils.lerp(hips.position.z,base.z,.35);
    }
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
    rotateLocal('LeftArm',ARM_DOWN-.34*crouch,0,-.18*crouch,.22);
    rotateLocal('RightArm',ARM_DOWN-.22*crouch,0,.18*crouch,.22);
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
    rotateLocal('LeftArm',.35+a*.16,0,-.12,.22);
    rotateLocal('RightArm',.35+b*.16,0,.12,.22);
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
