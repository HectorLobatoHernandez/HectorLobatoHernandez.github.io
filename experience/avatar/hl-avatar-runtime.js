import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V16';
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

  const bone=name=>state.bones.get(name)||null;

  function rotateLocal(name,x=0,y=0,z=0,amount=.22){
    const b=bone(name), q0=state.baseQuat.get(name);
    if(!b||!q0)return;
    const qDelta=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
    b.quaternion.slerp(q0.clone().multiply(qDelta),amount);
  }

  function aimBoneModel(name,childName,desiredModelDirection,amount=.25){
    const b=bone(name), child=bone(childName), q0=state.baseQuat.get(name);
    if(!b||!child||!q0||!b.parent)return;

    modelRoot.updateWorldMatrix(true,true);

    const localAxis=child.position.clone();
    if(localAxis.lengthSq()<1e-8)return;
    localAxis.normalize();

    const modelWorldQ=new THREE.Quaternion();
    modelRoot.getWorldQuaternion(modelWorldQ);

    const desiredWorld=desiredModelDirection.clone().normalize().applyQuaternion(modelWorldQ);

    const parentWorldQ=new THREE.Quaternion();
    b.parent.getWorldQuaternion(parentWorldQ);

    const desiredParent=desiredWorld.clone().applyQuaternion(parentWorldQ.clone().invert()).normalize();
    const restParent=localAxis.clone().applyQuaternion(q0).normalize();

    const delta=new THREE.Quaternion().setFromUnitVectors(restParent,desiredParent);
    const target=delta.multiply(q0.clone());

    b.quaternion.slerp(target,amount);
  }

  function setArmsDown(swing=0,amount=.28){
    aimBoneModel(
      'LeftArm','LeftForeArm',
      new THREE.Vector3(-.08,-1,swing),
      amount
    );
    aimBoneModel(
      'RightArm','RightForeArm',
      new THREE.Vector3(.08,-1,-swing),
      amount
    );

    modelRoot.updateWorldMatrix(true,true);

    aimBoneModel(
      'LeftForeArm','LeftHand',
      new THREE.Vector3(-.035,-1,.08+swing*.30),
      amount*.92
    );
    aimBoneModel(
      'RightForeArm','RightHand',
      new THREE.Vector3(.035,-1,.08-swing*.30),
      amount*.92
    );
  }

  function addGlasses(head){
    const frameMat=new THREE.MeshStandardMaterial({
      color:0xd66f28,
      roughness:.34,
      metalness:.08
    });
    const lensMat=new THREE.MeshPhysicalMaterial({
      color:0x7b5b3d,
      transparent:true,
      opacity:.17,
      roughness:.08,
      transmission:.12,
      depthWrite:false
    });

    const glasses=new THREE.Group();
    glasses.name='HL_PERSONAL_GLASSES_V16';

    for(const sx of [-1,1]){
      const ring=new THREE.Mesh(
        new THREE.TorusGeometry(.0355,.0032,10,32),
        frameMat
      );
      ring.position.set(sx*.0385,.055,.129);
      glasses.add(ring);

      const lens=new THREE.Mesh(
        new THREE.CircleGeometry(.0325,32),
        lensMat
      );
      lens.position.set(sx*.0385,.055,.130);
      glasses.add(lens);

      const temple=new THREE.Mesh(
        new THREE.CylinderGeometry(.0022,.0022,.105,8),
        frameMat
      );
      temple.rotation.x=Math.PI/2;
      temple.position.set(sx*.074,.055,.078);
      glasses.add(temple);
    }

    const bridge=new THREE.Mesh(
      new THREE.BoxGeometry(.025,.0035,.0035),
      frameMat
    );
    bridge.position.set(0,.055,.130);
    glasses.add(bridge);

    head.add(glasses);
  }

  function addCurlyHair(head){
    const mat=new THREE.MeshStandardMaterial({
      color:0x211713,
      roughness:.94,
      metalness:0
    });

    const curls=new THREE.Group();
    curls.name='HL_CURLY_HAIR_V16';

    const rows=[
      {y:.170,z:.020,xs:[-.060,-.030,0,.030,.060],r:.031},
      {y:.148,z:.058,xs:[-.074,-.040,0,.040,.074],r:.032},
      {y:.122,z:.082,xs:[-.072,-.036,0,.036,.072],r:.031},
      {y:.100,z:.058,xs:[-.078,-.040,0,.040,.078],r:.030},
      {y:.083,z:.010,xs:[-.070,-.035,0,.035,.070],r:.029},
      {y:.086,z:-.045,xs:[-.055,-.018,.018,.055],r:.028}
    ];

    rows.forEach((row,ri)=>{
      row.xs.forEach((x,i)=>{
        const curl=new THREE.Mesh(
          new THREE.SphereGeometry(row.r*(.90+((i+ri)%3)*.07),10,8),
          mat
        );
        curl.scale.set(1,.82,1.06);
        curl.position.set(
          x,
          row.y+(((i+ri)%2)?-.006:.004),
          row.z+(((i*2+ri)%3)-1)*.008
        );
        curls.add(curl);
      });
    });

    head.add(curls);
  }

  function addChestBadge(){
    const chest=bone('Spine2')||bone('Spine1')||bone('Spine');
    if(!chest||typeof document==='undefined')return;

    const canvas=document.createElement('canvas');
    canvas.width=512;
    canvas.height=160;
    const ctx=canvas.getContext('2d');

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#111111';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#f2f2ed';
    ctx.font='700 72px Arial, sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('carhartt',256,82);

    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;

    const material=new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true,
      depthWrite:false,
      side:THREE.DoubleSide
    });

    const badge=new THREE.Mesh(
      new THREE.PlaneGeometry(.105,.033),
      material
    );
    badge.name='HL_CARHARTT_CHEST_BADGE';
    badge.position.set(.070,.035,.142);
    chest.add(badge);
  }

  function styleImportedAvatar(scene){
    scene.traverse(obj=>{
      if(!obj.isMesh&&!obj.isSkinnedMesh)return;

      const objName=(obj.name||'').toLowerCase();

      if(/jacket|coat|blazer|outerwear/.test(objName)){
        obj.visible=false;
        return;
      }

      if(objName==='haircut'||/haircut|hairstyle/.test(objName)){
        obj.visible=false;
      }

      const mats=Array.isArray(obj.material)?obj.material:[obj.material];

      mats.forEach(mat=>{
        if(!mat)return;
        const matName=(mat.name||'').toLowerCase();

        if(/jacket|coat|blazer|outerwear/.test(matName)){
          mat.visible=false;
          return;
        }

        if(mat.color){
          if(objName==='outfit_top'||/shirt|tshirt|t-shirt|tee/.test(objName)||/shirt|tshirt|t-shirt|tee/.test(matName)){
            mat.color.setHex(0x111214);
          }
          if(objName==='outfit_bottom')mat.color.setHex(0x121316);
          if(objName==='outfit_shoes')mat.color.setHex(0x554d45);
        }

        if('roughness' in mat)mat.roughness=Math.max(.62,mat.roughness??.72);
      });
    });

    const head=bone('Head');
    if(head){
      addGlasses(head);
      addCurlyHair(head);
    }

    addChestBadge();

    root.userData.meshNames=[];
    root.userData.materialNames=[];

    scene.traverse(obj=>{
      if(obj.isMesh||obj.isSkinnedMesh){
        root.userData.meshNames.push(obj.name||'(unnamed)');
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach(m=>root.userData.materialNames.push(m?.name||'(unnamed)'));
      }
    });
  }

  function applyStandPose(time=0,amount=.28){
    setArmsDown(0,amount);

    rotateLocal('LeftUpLeg',0,0,0,amount);
    rotateLocal('RightUpLeg',0,0,0,amount);
    rotateLocal('LeftLeg',0,0,0,amount);
    rotateLocal('RightLeg',0,0,0,amount);
    rotateLocal('LeftFoot',0,0,0,amount);
    rotateLocal('RightFoot',0,0,0,amount);

    rotateLocal(
      'Spine2',
      Math.sin(time*.55)*.003,
      Math.sin(time*.27)*.006,
      Math.sin(time*.42)*.003,
      amount*.55
    );

    rotateLocal(
      'Head',
      Math.sin(time*.31)*.004,
      Math.sin(time*.23)*.008,
      0,
      amount*.50
    );
  }

  const loader=new GLTFLoader();
  loader.load(
    '../assets/models/avatar/hector-metaperson.glb?v=16',
    gltf=>{
      const scene=gltf.scene;

      scene.traverse(obj=>{
        if(obj.isMesh||obj.isSkinnedMesh){
          obj.castShadow=true;
          obj.receiveShadow=true;
        }

        if(obj.isBone||boneNames.includes(obj.name)){
          state.bones.set(obj.name,obj);
          state.baseQuat.set(obj.name,obj.quaternion.clone());
          state.basePos.set(obj.name,obj.position.clone());
        }
      });

      scene.scale.setScalar(1);
      scene.rotation.y=0;
      modelRoot.rotation.y=0;
      modelRoot.add(scene);

      state.model=scene;
      state.ready=true;

      fallback.visible=false;
      modelRoot.visible=true;

      styleImportedAvatar(scene);
      scene.updateWorldMatrix(true,true);
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
    modelRoot.rotation.y=THREE.MathUtils.lerp(modelRoot.rotation.y,0,amount);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,0,amount);
  }

  function smooth01(v){
    v=THREE.MathUtils.clamp(v,0,1);
    return v*v*(3-2*v);
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
      moving?.09:.07
    );

    const blend=state.moveBlend;
    const cadence=1.62*THREE.MathUtils.clamp(speed,.60,1.10);
    const phase=time*cadence;
    const s=Math.sin(phase);
    const c=Math.cos(phase);

    const legSwing=.22*s*blend;
    const kneeL=Math.max(0,-s)*.23*blend;
    const kneeR=Math.max(0,s)*.23*blend;

    setArmsDown(-s*.12*blend,.28);

    rotateLocal('LeftUpLeg',legSwing,0,0,.20);
    rotateLocal('RightUpLeg',-legSwing,0,0,.20);
    rotateLocal('LeftLeg',kneeL,0,0,.20);
    rotateLocal('RightLeg',kneeR,0,0,.20);
    rotateLocal('LeftFoot',-Math.max(0,s)*.045*blend,0,0,.18);
    rotateLocal('RightFoot',-Math.max(0,-s)*.045*blend,0,0,.18);

    rotateLocal('Spine2',.012*blend,-.012*s*blend,-.008*s*blend,.14);
    rotateLocal('Head',-.006*blend,.008*s*blend,0,.12);

    const hips=bone('Hips'), base=state.basePos.get('Hips');
    if(hips&&base){
      const bob=(1-Math.cos(phase*2))*.0038*blend;
      const sway=c*.003*blend;
      hips.position.x=THREE.MathUtils.lerp(hips.position.x,base.x+sway,.24);
      hips.position.y=THREE.MathUtils.lerp(hips.position.y,base.y+bob,.24);
      hips.position.z=THREE.MathUtils.lerp(hips.position.z,base.z,.28);
    }

    modelRoot.rotation.y=THREE.MathUtils.lerp(modelRoot.rotation.y,0,.22);
    modelRoot.rotation.x=THREE.MathUtils.lerp(modelRoot.rotation.x,0,.15);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,0,.15);

    if(!moving&&blend<.05)applyStandPose(time,.24);
  }

  function updateFall(time,progress=0){
    if(!state.ready){
      fallback.userData.updateFall?.(time,progress);
      return;
    }

    const p=smooth01(progress);
    const drift=Math.sin(time*1.6)*.04;

    aimBoneModel('LeftArm','LeftForeArm',new THREE.Vector3(-.55,-.58,.30+drift),.30);
    aimBoneModel('RightArm','RightForeArm',new THREE.Vector3(.55,-.58,.30-drift),.30);

    modelRoot.updateWorldMatrix(true,true);

    aimBoneModel('LeftForeArm','LeftHand',new THREE.Vector3(-.22,-.78,.48),.27);
    aimBoneModel('RightForeArm','RightHand',new THREE.Vector3(.22,-.78,.48),.27);

    rotateLocal('LeftUpLeg',.13,0,-.02,.22);
    rotateLocal('RightUpLeg',-.08,0,.02,.22);
    rotateLocal('LeftLeg',.23,0,0,.22);
    rotateLocal('RightLeg',.17,0,0,.22);
    rotateLocal('Spine2',-.09,0,drift*.15,.18);
    rotateLocal('Head',.035,Math.sin(time*.35)*.012,0,.16);

    modelRoot.rotation.x=THREE.MathUtils.lerp(modelRoot.rotation.x,-.13-.04*p,.13);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,drift*.18,.10);
  }

  function updateLanding(time,progress=0){
    if(!state.ready){
      fallback.userData.updateLanding?.(time,progress);
      return;
    }

    const p=THREE.MathUtils.clamp(progress,0,1);
    const recover=smooth01(p);
    const impact=Math.sin(Math.PI*p);
    const crouch=Math.max(0,(1-recover)*.52+impact*.36);

    setArmsDown(.09*crouch,.31);

    rotateLocal('LeftUpLeg',.43*crouch,0,0,.30);
    rotateLocal('RightUpLeg',.43*crouch,0,0,.30);
    rotateLocal('LeftLeg',.78*crouch,0,0,.30);
    rotateLocal('RightLeg',.78*crouch,0,0,.30);
    rotateLocal('Spine2',-.19*crouch,0,0,.24);
    rotateLocal('Head',.075*crouch,0,0,.20);

    const hips=bone('Hips'), base=state.basePos.get('Hips');
    if(hips&&base){
      hips.position.y=THREE.MathUtils.lerp(
        hips.position.y,
        base.y-.10*crouch,
        .32
      );
    }

    modelRoot.rotation.x=THREE.MathUtils.lerp(modelRoot.rotation.x,-.06*crouch,.22);
    modelRoot.rotation.z=THREE.MathUtils.lerp(modelRoot.rotation.z,0,.22);

    if(p>.94)applyStandPose(time,.24);
  }

  function updateClimb(time,progress=0){
    if(!state.ready){
      fallback.userData.updateClimb?.(time,progress);
      return;
    }

    const phase=time*3.15;
    const s=Math.sin(phase);

    aimBoneModel('LeftArm','LeftForeArm',new THREE.Vector3(-.28,.35,.58+s*.08),.27);
    aimBoneModel('RightArm','RightForeArm',new THREE.Vector3(.28,.35,.58-s*.08),.27);

    rotateLocal('LeftUpLeg',.39-s*.14,0,0,.24);
    rotateLocal('RightUpLeg',.39+s*.14,0,0,.24);
    rotateLocal('LeftLeg',.66,0,0,.24);
    rotateLocal('RightLeg',.66,0,0,.24);
    rotateLocal('Spine2',-.12,0,0,.20);
  }

  root.userData.update=(time,direction=0,speed=1)=>updateWalk(time,direction,speed);
  root.userData.updateFall=(time,progress=0)=>updateFall(time,progress);
  root.userData.updateLanding=(time,progress=0)=>updateLanding(time,progress);
  root.userData.updateClimb=(time,progress=0)=>updateClimb(time,progress);

  root.userData.reset=(amount=.2)=>{
    if(state.ready){
      restoreRig(amount);
      applyStandPose(0,amount);
    }
  };

  root.userData.ready=false;
  return root;
}
