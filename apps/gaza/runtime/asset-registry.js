import * as THREE from 'three';
import {loadProductionAssets as originalLoad} from './asset-registry-base.js';
/** Keep original manifest validation and asset promotion unchanged. */
export async function loadProductionAssets(options={}){
 const result=await originalLoad(options);
 if(location.pathname.endsWith('/plant-3d.html'))setTimeout(()=>import('./dairy-process-scene.mjs').then(m=>m.bindProcessWorld(THREE,{scene:options.scene,surface:'plant',groups:options.groups,dock:true})).catch(e=>console.warn('Process overlay unavailable',e.message)),0);
 return result;
}
