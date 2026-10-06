import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ALLOWED_PROVENANCE=new Set(['PUBLIC_REFERENCE','INFERRED_RECONSTRUCTION','SIMULATED']);
const LOCAL_PATH=/^(?![a-z]+:|\/\/|data:)[a-zA-Z0-9_./-]+\.(?:glb|gltf)(?:\?.*)?$/i;

function vec3(value,fallback){
  const v=Array.isArray(value)&&value.length===3?value:fallback;
  return new THREE.Vector3(Number(v[0]),Number(v[1]),Number(v[2]));
}
function validEntry(a){
  return !!a&&typeof a.id==='string'&&typeof a.path==='string'&&LOCAL_PATH.test(a.path)&&
    typeof a.license==='string'&&typeof a.sourceUrl==='string'&&ALLOWED_PROVENANCE.has(a.provenance);
}
function markRenderable(root,entry){
  root.traverse(o=>{
    if(o.isMesh){
      o.castShadow=entry.castShadow!==false;
      o.receiveShadow=entry.receiveShadow!==false;
      o.userData={...o.userData,assetId:entry.id,provenance:entry.provenance,license:entry.license,sourceUrl:entry.sourceUrl};
    }
  });
}
function pickClip(clips,preferred){
  if(!clips?.length)return null;
  if(preferred){
    const exact=THREE.AnimationClip.findByName(clips,preferred);
    if(exact)return exact;
    const lower=String(preferred).toLowerCase();
    const fuzzy=clips.find(c=>c.name.toLowerCase().includes(lower));
    if(fuzzy)return fuzzy;
  }
  return clips[0];
}

export async function loadProductionAssets({
  manifestUrl='assets/3d/manifest.json',
  groups={},
  scene,
  clickable=[],
  onStatus=()=>{}
}={}){
  const report={state:'loading',manifestUrl,declared:0,enabled:0,loaded:0,failed:0,skipped:0,assets:[],mixers:[]};
  window.__GAZA_ASSET_REGISTRY__=report;
  try{
    const response=await fetch(manifestUrl,{cache:'no-store'});
    if(!response.ok)throw new Error('manifest HTTP '+response.status);
    const manifest=await response.json();
    if(manifest?.schemaVersion!==1||!Array.isArray(manifest.assets))throw new Error('manifest schemaVersion/assets invalid');
    report.declared=manifest.assets.length;
    const loader=new GLTFLoader();
    for(const entry of manifest.assets){
      if(entry.enabled===false){report.skipped++;continue}
      report.enabled++;
      if(!validEntry(entry)){
        report.failed++;report.assets.push({id:entry?.id||'unknown',state:'invalid-manifest-entry'});continue;
      }
      try{
        const gltf=await loader.loadAsync(entry.path);
        const root=gltf.scene||gltf.scenes?.[0];
        if(!root)throw new Error('GLB has no scene');
        root.name=entry.name||entry.id;
        root.position.copy(vec3(entry.position,[0,0,0]));
        root.rotation.set(...vec3(entry.rotation,[0,0,0]).toArray());
        root.scale.copy(vec3(entry.scale,[1,1,1]));
        root.userData={...root.userData,assetId:entry.id,kind:entry.kind||'GLB',provenance:entry.provenance,license:entry.license,sourceUrl:entry.sourceUrl};
        markRenderable(root,entry);
        const target=groups[entry.targetGroup]||scene;
        target.add(root);
        if(entry.clickable!==false)clickable.push(root);
        let mixer=null,clip=null;
        if(gltf.animations?.length&&entry.playAnimation!==false){
          clip=pickClip(gltf.animations,entry.animation);
          if(clip){mixer=new THREE.AnimationMixer(root);mixer.clipAction(clip).play();report.mixers.push(mixer)}
        }
        report.loaded++;
        report.assets.push({id:entry.id,state:'loaded',targetGroup:entry.targetGroup||'scene',animation:clip?.name||null,animations:gltf.animations?.map(x=>x.name)||[]});
      }catch(error){
        report.failed++;report.assets.push({id:entry.id,state:'load-failed',error:String(error?.message||error)});
      }
    }
    report.state=report.failed?'degraded':'ready';
  }catch(error){
    report.state='manifest-failed';report.error=String(error?.message||error);
  }
  report.update=(dt)=>{for(const mixer of report.mixers)mixer.update(dt)};
  window.__GAZA_ASSET_REGISTRY__=report;
  onStatus(report);
  return report;
}
