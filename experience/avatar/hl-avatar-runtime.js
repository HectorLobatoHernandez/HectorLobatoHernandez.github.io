import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V20_METAPERSON';
  root.userData.source='HECTOR_METAPERSON_GLB_V20';

  const fallback=createFallbackAvatar(THREE);
  fallback.visible=false;
  root.add(fallback);

  const modelRoot=new THREE.Group();
  modelRoot.name='HL_METAPERSON_V20';
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

  function makeClothingBlack(obj){
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    const names=mats.map(m=>(m?.name||'').toLowerCase());
    const isClothing=names.some(n=>
      n.includes('outfit_top') ||
      n.includes('outfit_bottom') ||
      n.includes('outfit_shoes')
    );
    if(!isClothing)return;

    obj.material=mats.map(mat=>{
      if(!mat)return mat;
      const m=mat.clone();
      m.color.setRGB(0.035,0.035,0.035);
      if('roughness' in m)m.roughness=.76;
      if('metalness' in m)m.metalness=.03;
      m.needsUpdate=true;
      return m;
    });
    if(!Array.isArray(obj.material))obj.material=obj.material[0];
  }

  function refineHair(obj){
    const mats=Array.isArray(obj.material)?obj.material:[obj.material];
    const isHair=(obj.name||'').toLowerCase().includes('hair') ||
      mats.some(m=>(m?.name||'').toLowerCase().includes('haircut'));
    if(!isHair || !obj.geometry?.attributes?.position)return;

    obj.geometry=obj.geometry.clone();
    const geo=obj.geometry;
    const pos=geo.attributes.position;
    geo.computeBoundingBox();
    const bb=geo.boundingBox;
    const cx=(bb.min.x+bb.max.x)*.5;
    const cz=(bb.min.z+bb.max.z)*.5;
    const sx=Math.max(.0001,(bb.max.x-bb.min.x)*.5);
    const sy=Math.max(.0001,bb.max.y-bb.min.y);
    const sz=Math.max(.0001,(bb.max.z-bb.min.z)*.5);

    for(let i=0;i<pos.count;i++){
      let x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
      const h=THREE.MathUtils.clamp((y-bb.min.y)/sy,0,1);
      const side=Math.abs(x-cx)/sx;

      // Short, controlled sides: taper around temples and ears.
      if(h<.72 && side>.48){
        const sideT=THREE.MathUtils.smoothstep(side,.48,1);
        const lowT=1-THREE.MathUtils.smoothstep(h,.34,.72);
        const shrink=.10+.16*sideT*lowT;
        x=cx+(x-cx)*(1-shrink);
        z=cz+(z-cz)*(1-.05*sideT);
      }

      // Medium-long curly top: fuller crown, restrained front, natural irregularity.
      if(h>.36){
        const top=THREE.MathUtils.smoothstep(h,.36,1);
        const rx=(x-cx)/sx;
        const rz=(z-cz)/sz;
        const len=Math.max(.0001,Math.hypot(rx,rz));
        const ux=rx/len, uz=rz/len;
        const sideControl=1-.55*THREE.MathUtils.smoothstep(side,.58,1)*(1-.65*top);
        const frontControl=z>cz ? .78 : 1;
        const volume=(.004+.018*top)*sideControl*frontControl;
        const curlA=Math.sin((x-cx)*92+(z-cz)*71+y*49);
        const curlB=Math.cos((x-cx)*67-(z-cz)*83+y*41);
        const curlAmp=(.0025+.0065*top)*sideControl;

        x+=ux*(volume+curlAmp*curlA);
        z+=uz*(volume+curlAmp*.8*curlB);
        y+=.002+.009*top+.0025*Math.sin((x-cx)*74+(z-cz)*63);
      }

      // Keep nape neat.
      if(h<.28 && z<cz){
        z=cz+(z-cz)*.92;
      }

      pos.setXYZ(i,x,y,z);
    }

    pos.needsUpdate=true;
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    // Dark brown/near-black hair without changing any other material.
    obj.material=mats.map(mat=>{
      if(!mat)return mat;
      const m=mat.clone();
      m.color.multiply(new THREE.Color(.36,.30,.26));
      if('roughness' in m)m.roughness=.82;
      m.needsUpdate=true;
      return m;
    });
    if(!Array.isArray(obj.material))obj.material=obj.material[0];
  }

  function applyNaturalArmRestPose(){
    const offsets={
      LeftShoulder:[0,0,.08],
      RightShoulder:[0,0,-.08],
      LeftArm:[0,0,-1.18],
      RightArm:[0,0,1.18],
      LeftForeArm:[0,0,-.10],
      RightForeArm:[0,0,.10],
      LeftHand:[0,0,.035],
      RightHand:[0,0,-.035]
    };

    for(const [name,euler] of Object.entries(offsets)){
      const b=bone(name);
      if(!b)continue;
      const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...euler,'XYZ'));
      b.quaternion.multiply(q);
    }

    // The lowered-arm pose becomes the new neutral/base pose.
    for(const name of boneNames){
      const b=bone(name);
      if(!b)continue;
      state.baseQuat.set(name,b.quaternion.clone());
      state.basePos.set(name,b.position.clone());
    }
  }

  function updateWalk(time,speed=1){
    if(!state.ready)return;
    restore(.22);
    const phase=time*4.4*Math.max(.45,speed||1);
    const swing=Math.sin(phase);
    const swing2=Math.sin(phase+Math.PI);
    rotateLocal('LeftUpLeg', swing*.30,0,0,.26);
    rotateLocal('RightUpLeg', swing2*.30,0,0,.26);
    rotateLocal('LeftLeg', Math.max(0,-swing)*.34,0,0,.26);
    rotateLocal('RightLeg', Math.max(0,-swing2)*.34,0,0,.26);
    rotateLocal('LeftArm', swing2*.16,0,.02,.22);
    rotateLocal('RightArm', swing*.16,0,-.02,.22);
    rotateLocal('Spine2',0,0,Math.sin(phase)*.014,.16);
  }

  function updateFall(time){
    if(!state.ready)return;
    restore(.18);
    rotateLocal('LeftArm',-.28,0,.18,.20);
    rotateLocal('RightArm',-.28,0,-.18,.20);
    rotateLocal('LeftUpLeg',.12,0,0,.18);
    rotateLocal('RightUpLeg',-.10,0,0,.18);
  }

  function updateLanding(time){
    if(!state.ready)return;
    restore(.18);
    rotateLocal('LeftUpLeg',-.26,0,0,.22);
    rotateLocal('RightUpLeg',-.26,0,0,.22);
    rotateLocal('LeftLeg',.44,0,0,.22);
    rotateLocal('RightLeg',.44,0,0,.22);
  }

  function updateClimb(time){
    if(!state.ready)return;
    restore(.18);
  }

  const loader=new GLTFLoader();
  loader.load(
    '../assets/models/avatar/hector-metaperson.glb?v=20',
    gltf=>{
      const scene=gltf.scene;

      // Pass 1: bones.
      scene.traverse(obj=>{
        if(obj.isBone && boneNames.includes(obj.name)){
          state.bones.set(obj.name,obj);
        }
      });

      // Pass 2: requested visual edits only.
      scene.traverse(obj=>{
        if(!obj.isMesh)return;
        obj.castShadow=true;
        obj.receiveShadow=true;
        makeClothingBlack(obj);
        refineHair(obj);
      });

      applyNaturalArmRestPose();

      modelRoot.add(scene);
      modelRoot.visible=true;
      state.model=scene;
      state.ready=true;
      root.userData.ready=true;
      root.userData.model='hector-metaperson.glb';
      root.userData.revision='V20_HAIR_ARMS_BLACK';
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
