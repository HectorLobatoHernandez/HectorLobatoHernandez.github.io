import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHLAvatar as createFallbackAvatar } from './hl-avatar.js?v=11';

export function createHLAvatarRuntime(THREE){
  const root=new THREE.Group();
  root.name='HL_AVATAR_RUNTIME_V18_MASTER_REVIEW';
  root.userData.source='RHB_AVATAR_V2_MASTER_V1_VISUAL_REVIEW';

  const fallback=createFallbackAvatar(THREE);
  fallback.visible=false;
  root.add(fallback);

  const modelRoot=new THREE.Group();
  modelRoot.name='HL_AVATAR_V2_MASTER_V1';
  modelRoot.visible=false;
  root.add(modelRoot);

  const loader=new GLTFLoader();
  loader.load(
    '../assets/models/avatar/hector-avatar-v2-master-v1.glb?v=18',
    gltf=>{
      const scene=gltf.scene;
      scene.traverse(obj=>{
        if(obj.isMesh){
          obj.castShadow=true;
          obj.receiveShadow=true;
        }
      });
      scene.scale.setScalar(1);
      modelRoot.add(scene);
      modelRoot.visible=true;
      root.userData.ready=true;
      root.userData.model='hector-avatar-v2-master-v1.glb';
    },
    undefined,
    err=>{
      console.warn('Avatar master V1 unavailable',err);
      root.userData.ready=false;
      root.userData.loadError=String(err?.message||err);
    }
  );

  // Visual-review mode: world movement remains active, but no bone deformation.
  root.userData.update=()=>{};
  root.userData.updateFall=()=>{};
  root.userData.updateLanding=()=>{};
  root.userData.updateClimb=()=>{};
  root.userData.reset=()=>{};
  root.userData.ready=false;
  return root;
}
