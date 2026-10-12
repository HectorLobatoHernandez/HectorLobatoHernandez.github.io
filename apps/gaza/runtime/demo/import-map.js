/* Synchronous classic script: register one versioned module identity before any ESM loads. */
(() => {
 const RELEASE='gaza-demo-20261012-r1';
 const MODULES=["runtime/asset-registry.js","runtime/demo/farm-presentation.mjs","runtime/demo/hub.mjs","runtime/demo/scenario.mjs","runtime/demo/scene-health.js","runtime/demo/session.mjs","runtime/farm/life/anatomy.mjs","runtime/farm/life/controls.mjs","runtime/farm/life/herd-model.mjs","runtime/farm/life/layer.mjs","runtime/farm/model.mjs","runtime/farm/refinements.mjs","runtime/farm/site.mjs","runtime/farm/viewer.mjs","runtime/farm/world.mjs","runtime/labs/layout.mjs","runtime/labs/viewer.mjs","runtime/labs/world.mjs","runtime/master-farm-contract.js","runtime/operations-thread.js","runtime/plant/inventory-view.mjs","runtime/plant/model.mjs","runtime/plant/panel.mjs","runtime/plant/world.mjs","runtime/processes/catalog.mjs","runtime/processes/farm-network.mjs","runtime/processes/ledger.mjs","runtime/processes/panel.mjs","runtime/processes/scene-binding.mjs","runtime/processes/store.mjs","runtime/public-gis-overlay.js","runtime/site-real-app.mjs","runtime/site-real-core.mjs","runtime/site-real-world.mjs","runtime/training-world-details.js","runtime/twin-telemetry.js","runtime/weather-ops.js"];
 const source=document.currentScript,base=new URL('../../',source.src);
 const imports={'three':'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js','three/addons/':'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/'};
 for(const path of MODULES){const key=new URL(path,base).href;imports[key]=key+'?release='+RELEASE;}
 const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});source.after(map);
 window.__GAZA_ASSET_RELEASE__=RELEASE;
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('runtime/demo/layout.css?release='+RELEASE,base).href;document.head.append(css);
 if(new URLSearchParams(location.search).get('demo')==='company'){
  const decorate=root=>{for(const a of root.querySelectorAll('a[href]')){const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname.includes('/apps/gaza/')&&(u.pathname.endsWith('.html')||u.pathname.endsWith('/'))){u.searchParams.set('demo','company');u.searchParams.set('release',RELEASE);a.href=u.href}}};
  document.addEventListener('DOMContentLoaded',()=>{decorate(document);new MutationObserver(()=>decorate(document)).observe(document.body,{childList:true,subtree:true})},{once:true});
 }
})();
