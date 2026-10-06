import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const headed=process.argv.includes('--headed');
const base=process.env.GAZA_URL || 'http://127.0.0.1:4173';
const out=path.resolve('.qa');
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:!headed});
const errors=[],checks=[];
const renderBudget={calls:1200,triangles:3000000,geometries:1500,textures:512};
const targets=[
  {name:'strategy',url:'/game.html?camera=overview&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'strategy-plant',url:'/game.html?camera=plant&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'strategy-process',url:'/game.html?camera=process&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'strategy-asrs',url:'/game.html?camera=asrs&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'strategy-docks',url:'/game.html?camera=dock&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'plant',url:'/plant-3d.html?camera=exterior&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'plant-process',url:'/plant-3d.html?camera=process&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'plant-asrs',url:'/plant-3d.html?camera=asrs&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'plant-docks',url:'/plant-3d.html?camera=docks&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'plant-roads',url:'/plant-3d.html?camera=roads&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'plant-gis',url:'/plant-3d.html?camera=gis&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'campus-gis',url:'/campus-gis.html?qa=1',width:1600,height:900,dsf:1},
  {name:'gis-3d',url:'/gis-3d-overlay.html?qa=1',width:1600,height:900,dsf:2},
  {name:'farm-network',url:'/farm-network.html?qa=1',width:1600,height:900,dsf:1},
  {name:'systems',url:'/systems.html?qa=1',width:1600,height:900,dsf:1},
  {name:'territory',url:'/territory.html?qa=1',width:1600,height:900,dsf:1},
  {name:'strategy-mobile',url:'/game.html?camera=overview&freeze=1&debug=1&qa=1',width:390,height:844,dsf:2}
];

for(const target of targets){
  const {name,url,width,height,dsf=1}=target;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dsf});
  const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push({surface:name,type:'console',text:m.text()})});
  page.on('pageerror',e=>errors.push({surface:name,type:'pageerror',text:e.message}));
  const response=await page.goto(base+url,{waitUntil:'domcontentloaded',timeout:45000});
  if(!response?.ok()) errors.push({surface:name,type:'http',text:String(response?.status())});
  await page.waitForTimeout(1600);

  if(url.includes('game.html')||url.includes('plant-3d.html')){
    const canvasSelector=url.includes('game.html')?'#scene':'#twin3d';
    const metrics=await page.locator(canvasSelector).evaluate((canvas)=>{
      const r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      return {cssW:r.width,cssH:r.height,bufferW:canvas.width,bufferH:canvas.height,dpr,ratioX:r.width?canvas.width/r.width:0,ratioY:r.height?canvas.height/r.height:0};
    });
    const expected=Math.min(Math.max(metrics.dpr,1),2.5);
    const sharp=metrics.cssW>0&&metrics.cssH>0&&metrics.ratioX>=expected-.08&&metrics.ratioY>=expected-.08;
    checks.push({surface:name,check:'webgl-backing-resolution',ok:sharp,metrics});
    if(!sharp)errors.push({surface:name,type:'quality',text:'WebGL backing store below expected DPR: '+JSON.stringify(metrics)});

    const logo=await page.locator('img[src="assets/gaza-logo.svg"]').first().evaluate(img=>({complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}));
    const logoOk=logo.complete&&logo.naturalWidth>0&&logo.naturalHeight>0;
    checks.push({surface:name,check:'brand-svg-load',ok:logoOk,metrics:logo});
    if(!logoOk)errors.push({surface:name,type:'asset',text:'GAZA SVG did not load: '+JSON.stringify(logo)});

    const renderStats=await page.evaluate(()=>window.__GAZA_RENDER_STATS__||null);
    const statsOk=!!renderStats&&Number.isFinite(renderStats.calls)&&Number.isFinite(renderStats.triangles);
    checks.push({surface:name,check:'webgl-render-stats',ok:statsOk,metrics:renderStats});
    if(!statsOk)errors.push({surface:name,type:'quality',text:'WebGL render telemetry unavailable'});
    if(statsOk){
      const budgetOk=renderStats.calls<=renderBudget.calls&&renderStats.triangles<=renderBudget.triangles&&renderStats.geometries<=renderBudget.geometries&&renderStats.textures<=renderBudget.textures;
      checks.push({surface:name,check:'webgl-render-budget',ok:budgetOk,metrics:renderStats,budget:renderBudget});
      if(!budgetOk)errors.push({surface:name,type:'performance',text:'Render budget exceeded: '+JSON.stringify({renderStats,renderBudget})});
    }

    const assetRegistry=await page.evaluate(()=>{const r=window.__GAZA_ASSET_REGISTRY__;return r?{state:r.state,declared:r.declared,enabled:r.enabled,loaded:r.loaded,failed:r.failed,skipped:r.skipped,assets:r.assets}:null});
    const assetsOk=!!assetRegistry&&assetRegistry.state==='ready'&&assetRegistry.failed===0;
    checks.push({surface:name,check:'glb-asset-registry',ok:assetsOk,metrics:assetRegistry});
    if(!assetsOk)errors.push({surface:name,type:'asset',text:'GLB asset registry invalid: '+JSON.stringify(assetRegistry)});

    const twinState=await page.evaluate(()=>window.__GAZA_TWIN_STATE__||null);
    const twinStateOk=!!twinState&&twinState.schemaVersion===1&&['strategy','plant'].includes(twinState.surface)&&!!twinState.simulation&&!!twinState.environment&&!!twinState.provenance;
    checks.push({surface:name,check:'machine-readable-twin-state',ok:twinStateOk,metrics:twinState});
    if(!twinStateOk)errors.push({surface:name,type:'telemetry',text:'Twin telemetry snapshot unavailable or invalid'});
    if(url.includes('game.html')){
      const vehicle=await page.evaluate(()=>window.__GAZA_VEHICLE_CONTEXT__||null);
      const vehicleOk=vehicle?.forwardAxis==='-X'&&vehicle?.heading==='PATH_TANGENT';
      checks.push({surface:name,check:'vehicle-path-heading',ok:vehicleOk,metrics:vehicle});
      if(!vehicleOk)errors.push({surface:name,type:'quality',text:'Strategy vehicle tangent-heading contract missing'});
    }
  }

  if(url.includes('plant-3d.html')){
    const roads=await page.evaluate(()=>window.__GAZA_ROAD_CONTEXT__||null);
    const roadsOk=!!roads&&roads.schemaVersion>=4&&roads.truckHeading==='PATH_TANGENT'&&roads.truckArticulation==='TRACTOR_TRAILER_SPLIT_TANGENT'&&roads.wheelMotion==='DISTANCE_BASED'&&roads.refs?.includes('N-122')&&roads.gisSurface==='campus-gis.html'&&roads.gateStatus==='UNKNOWN_UNTIL_AUTHORISED_SURVEY'&&roads.hgvDesignEnvelope?.outerRadiusM===12.5&&roads.hgvDesignEnvelope?.innerRadiusM===5.3;
    checks.push({surface:name,check:'road-context-and-truck-heading',ok:roadsOk,metrics:roads});
    if(!roadsOk)errors.push({surface:name,type:'quality',text:'Plant road context / tangent truck heading unavailable'});
    const envField=await page.evaluate(()=>window.__GAZA_ENV_FIELD__||null);
    const envFieldOk=!!envField&&envField.schemaVersion===1&&envField.spatialModel==='UNIFORM_VECTOR_FIELD_NOT_CFD'&&envField.proposedSensors===8&&envField.sourceClass==='PUBLIC_REFERENCE_LIVE'&&envField.metrics?.wind===8&&envField.metrics?.windDirection===280;
    checks.push({surface:name,check:'environment-field-contract',ok:envFieldOk,metrics:envField});
    if(!envFieldOk)errors.push({surface:name,type:'quality',text:'Plant environmental field contract/QA fixture unavailable'});
    const gisOverlay=await page.evaluate(()=>window.__GAZA_PUBLIC_GIS_3D__||null);
    const gisOverlayOk=!!gisOverlay&&gisOverlay.schemaVersion>=2&&gisOverlay.state==='ready'&&gisOverlay.mode==='QA_FIXTURE'&&gisOverlay.promotionStatus==='COMPARISON_ONLY_NOT_AUTHORITY'&&gisOverlay.roads>=2&&gisOverlay.buildings>=2&&Number.isFinite(gisOverlay.nearestRoadDistanceM);
    checks.push({surface:name,check:'plant-public-gis-comparison-layer',ok:gisOverlayOk,metrics:gisOverlay});
    if(!gisOverlayOk)errors.push({surface:name,type:'quality',text:'Plant public GIS comparison layer unavailable or promoted beyond authority'});
  }

  if(url.includes('campus-gis.html')){
    const gis=await page.evaluate(()=>({contract:window.__GAZA_GIS__||null,map:!!document.querySelector('.leaflet-container'),exportButton:!!document.getElementById('exportGeojson'),accessUi:!!document.getElementById('accessStatus')&&!!document.getElementById('toggleSwept'),copy:document.body.textContent.includes('EPSG:25830')&&document.body.textContent.includes('Overpass')&&document.body.textContent.includes('OSRM')&&document.body.textContent.includes('12,50 m')&&document.body.textContent.includes('5,30 m')}));
    const gisOk=gis.map&&gis.copy&&gis.exportButton&&gis.accessUi&&gis.contract?.schemaVersion>=4&&gis.contract?.geometry==='OSM_RUNTIME'&&gis.contract?.routing==='OSRM_CALCULATED'&&gis.contract?.localAxes==='X_EAST_Z_NORTH'&&gis.contract?.engineeringCrs==='EPSG:25830'&&gis.contract?.factoryCandidatePolicy==='OSM_NAME_OPERATOR_MATCH_NOT_AS_BUILT'&&gis.contract?.accessPolicy==='NEAREST_OSM_ROAD_NOT_GATE'&&gis.contract?.hgvEnvelope?.outerRadiusM===12.5&&gis.contract?.hgvEnvelope?.innerRadiusM===5.3;
    checks.push({surface:name,check:'campus-gis-provenance',ok:gisOk,metrics:gis});
    if(!gisOk)errors.push({surface:name,type:'quality',text:'Campus GIS provenance/runtime contract missing'});
  }

  if(url.includes('gis-3d-overlay.html')){
    const gis3d=await page.evaluate(()=>({lab:window.__GAZA_GIS_3D_LAB__||null,overlay:window.__GAZA_PUBLIC_GIS_3D__||null,render:window.__GAZA_GIS_3D_RENDER__||null,canvas:!!document.getElementById('gisCanvas'),copy:document.body.textContent.includes('NO AS-BUILT')&&document.body.textContent.includes('OSM público')}));
    const gis3dOk=gis3d.canvas&&gis3d.copy&&gis3d.lab?.schemaVersion===1&&gis3d.lab?.authority==='OSM_PUBLIC_CONTEXT_NOT_AS_BUILT'&&gis3d.overlay?.state==='ready'&&gis3d.overlay?.mode==='QA_FIXTURE'&&gis3d.overlay?.roads>=2&&gis3d.overlay?.buildings>=2&&gis3d.overlay?.factoryCandidates>=1&&Number.isFinite(gis3d.render?.calls);
    checks.push({surface:name,check:'gis-3d-alignment-lab',ok:gis3dOk,metrics:gis3d});
    if(!gis3dOk)errors.push({surface:name,type:'quality',text:'GIS 3D alignment lab fixture/runtime contract invalid'});
  }

  if(url.includes('farm-network.html')){
    const farm=await page.evaluate(()=>({status:document.getElementById('netStatus')?.textContent||'',rows:document.querySelectorAll('#nodeRows tr').length,routes:document.querySelectorAll('#routes .route').length,copy:document.body.textContent.includes('SAT ROTE')&&document.body.textContent.includes('50 km')}));
    const farmOk=farm.rows>=9&&farm.routes>=4&&farm.copy&&!farm.status.startsWith('ERROR');
    checks.push({surface:name,check:'farm-network-boundary',ok:farmOk,metrics:farm});
    if(!farmOk)errors.push({surface:name,type:'quality',text:'Farm network did not render expected evidence boundary'});
  }

  if(url.includes('systems.html')){
    const systems=await page.evaluate(()=>({rows:document.querySelectorAll('#systemsRows tr').length,people:document.querySelectorAll('#people .person').length,checks:document.querySelectorAll('#discoveryChecklist .check').length,ids:document.querySelectorAll('#canonicalIds code').length,copy:['GAZACONTROL','INTERGAZA','Solmicro','Tetra Pak','StorFast','380.390'].every(x=>document.body.textContent.includes(x))}));
    const systemsOk=systems.rows>=7&&systems.people>=4&&systems.checks>=8&&systems.ids>=12&&systems.copy;
    checks.push({surface:name,check:'systems-discovery-matrix',ok:systemsOk,metrics:systems});
    if(!systemsOk)errors.push({surface:name,type:'quality',text:'Systems discovery matrix incomplete'});
  }

  if(url.includes('territory.html')){
    const territory=await page.evaluate(()=>({
      routeMetric:!!document.getElementById('dgtRouteMatches'),
      routeCopy:document.body.textContent.includes('coincidencia geométrica')||document.body.textContent.includes('coincidencias corredor ruta'),
      site:window.__GAZA_SITE_CONTEXT__||null,
      correctedCopy:document.body.textContent.includes('ANCLA CORREGIDA')&&document.body.textContent.includes('41.52355')&&document.body.textContent.includes('-5.59993')
    }));
    const territoryOk=territory.routeMetric&&territory.routeCopy&&territory.correctedCopy&&territory.site?.plant?.lat===41.52355&&territory.site?.plant?.lon===-5.59993&&territory.site?.policy==='OSM_NAME_OPERATOR_MATCH_NOT_AS_BUILT';
    checks.push({surface:name,check:'route-aware-dgt-ui',ok:territoryOk,metrics:territory});
    if(!territoryOk)errors.push({surface:name,type:'quality',text:'Territory route-aware DGT UI missing'});
  }

  await page.waitForTimeout(250);
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),renderBudget,targets,checks,errors},null,2));
if(errors.length){
  console.error(JSON.stringify({checks,errors},null,2));
  process.exit(2);
}
console.log('GAZA visual QA OK:',targets.map(x=>x.name).join(', '));
