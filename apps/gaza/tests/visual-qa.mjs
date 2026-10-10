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
  {name:'tower',url:'/?qa=1',width:1600,height:900,dsf:1},
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
  {name:'plant-environment',url:'/plant-3d.html?camera=environment&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
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

  if(name==='tower'){
    const tower=await page.evaluate(()=>({
      env:window.__GAZA_CONTROL_TOWER_ENV__||null,
      panel:!!document.getElementById('environmentOps'),
      risk:document.getElementById('towerWxRisk')?.textContent||'',
      gust:document.getElementById('towerWxGust24')?.textContent||'',
      visibility:document.getElementById('towerWxVis24')?.textContent||'',
      advice:document.getElementById('towerWxAdvice')?.textContent||'',
      alerts:document.getElementById('alerts')?.textContent||''
    }));
    const towerOk=tower.panel&&tower.env?.schemaVersion===1&&tower.env?.weather?.advisoryOnly===true&&tower.env?.weather?.currentRisk===0&&tower.env?.weather?.forecastRisk===1&&tower.env?.weather?.opsRisk===1&&tower.env?.weather?.forecast?.maxGustKmh===38&&tower.env?.weather?.forecast?.minVisibilityM===12000&&tower.risk==='ATENCIÓN'&&tower.gust==='38 km/h'&&tower.visibility==='12.0 km'&&tower.advice.includes('Rachas ≥ 35 km/h')&&tower.alerts.includes('METEO 24H · ATENCIÓN');
    checks.push({surface:name,check:'control-tower-weather-ops',ok:towerOk,metrics:tower});
    if(!towerOk)errors.push({surface:name,type:'quality',text:'Control Tower Weather Ops contract/UI unavailable'});
  }

  if(url.includes('plant-3d.html')){
    const roads=await page.evaluate(()=>window.__GAZA_ROAD_CONTEXT__||null);
    const roadsOk=!!roads&&roads.schemaVersion>=4&&roads.truckHeading==='PATH_TANGENT'&&roads.truckArticulation==='TRACTOR_TRAILER_SPLIT_TANGENT'&&roads.wheelMotion==='DISTANCE_BASED'&&roads.refs?.includes('N-122')&&roads.gisSurface==='campus-gis.html'&&roads.gateStatus==='UNKNOWN_UNTIL_AUTHORISED_SURVEY'&&roads.hgvDesignEnvelope?.outerRadiusM===12.5&&roads.hgvDesignEnvelope?.innerRadiusM===5.3;
    checks.push({surface:name,check:'road-context-and-truck-heading',ok:roadsOk,metrics:roads});
    if(!roadsOk)errors.push({surface:name,type:'quality',text:'Plant road context / tangent truck heading unavailable'});
    const envField=await page.evaluate(()=>window.__GAZA_ENV_FIELD__||null);
    const envFieldOk=!!envField&&envField.schemaVersion===2&&envField.spatialModel==='UNIFORM_VECTOR_FIELD_NOT_CFD'&&envField.visualEncoding==='CONCENTRIC_COMPASS_RINGS'&&envField.motion==='ANIMATED_STREAMLINES'&&envField.proposedSensors===8&&envField.sourceClass==='PUBLIC_REFERENCE_LIVE'&&envField.metrics?.wind===8&&envField.metrics?.windDirection===280&&envField.metrics?.visibility===24000&&envField.metrics?.apparent===16.8;
    checks.push({surface:name,check:'environment-field-contract',ok:envFieldOk,metrics:envField});
    const envUi=await page.evaluate(()=>({visibility:document.getElementById('ambientVisibility')?.textContent||'',risk:document.getElementById('ambientRisk')?.textContent||'',cloud:document.getElementById('ambientCloud')?.textContent||'',feels:document.getElementById('ambientFeels')?.textContent||''}));
    const envUiOk=envUi.visibility==='24.0 km'&&envUi.risk==='NORMAL'&&envUi.cloud==='25 %'&&envUi.feels==='16.8 °C';
    checks.push({surface:name,check:'environment-field-ui',ok:envUiOk,metrics:envUi});
    if(!envUiOk)errors.push({surface:name,type:'quality',text:'Plant environmental UI metrics unavailable'});
    if(!envFieldOk)errors.push({surface:name,type:'quality',text:'Plant environmental field contract/QA fixture unavailable'});
    const wxOps=await page.evaluate(()=>window.__GAZA_WEATHER_OPS__||null);
    const wxOpsOk=!!wxOps&&wxOps.schemaVersion===2&&wxOps.advisoryOnly===true&&wxOps.currentRisk===0&&wxOps.forecastRisk===1&&wxOps.opsRisk===1&&wxOps.horizonHours===24&&wxOps.forecast?.maxGustKmh===38&&wxOps.forecast?.minVisibilityM===12000&&wxOps.activityRisk?.hgv?.level===1&&wxOps.activityRisk?.docks?.level===0&&wxOps.activityRisk?.outdoor?.level===1&&wxOps.activityRisk?.access?.level===0&&wxOps.worstWindow?.start==='2026-10-07T02:00';
    checks.push({surface:name,check:'weather-ops-24h-contract',ok:wxOpsOk,metrics:wxOps});
    const wxUi=await page.evaluate(()=>({risk:document.getElementById('ambient24Risk')?.textContent||'',gust:document.getElementById('ambient24Gust')?.textContent||'',visibility:document.getElementById('ambient24Visibility')?.textContent||'',rain:document.getElementById('ambient24Rain')?.textContent||'',window:document.getElementById('ambient24Window')?.textContent||'',hgv:document.getElementById('ambientOpsHgv')?.textContent||'',docks:document.getElementById('ambientOpsDocks')?.textContent||'',outdoor:document.getElementById('ambientOpsOutdoor')?.textContent||'',access:document.getElementById('ambientOpsAccess')?.textContent||'',advice:document.getElementById('ambientAdvice')?.textContent||''}));
    const wxUiOk=wxUi.risk==='ATENCIÓN'&&wxUi.gust==='38 km/h'&&wxUi.visibility==='12.0 km'&&wxUi.rain==='35 %'&&wxUi.window==='02:00–04:00'&&wxUi.hgv==='ATENCIÓN'&&wxUi.docks==='NORMAL'&&wxUi.outdoor==='ATENCIÓN'&&wxUi.access==='NORMAL'&&wxUi.advice.includes('No actúa sobre seguridad ni control');
    checks.push({surface:name,check:'weather-ops-24h-ui',ok:wxUiOk,metrics:wxUi});
    if(!wxOpsOk||!wxUiOk)errors.push({surface:name,type:'quality',text:'24 h weather advisory contract/UI unavailable'});
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
      correctedCopy:document.body.textContent.includes('ANCLA CORREGIDA')&&document.body.textContent.includes('41.52355')&&document.body.textContent.includes('-5.59993'),
      weatherOps:window.__GAZA_WEATHER_OPS__||null,
      weatherRisk24:document.getElementById('weatherRisk24')?.textContent||'',
      forecastSlots:document.querySelectorAll('#forecastStrip .forecast-slot').length,
      weatherWindow:document.getElementById('weatherWindow')?.textContent||'',
      opsHgv:document.getElementById('opsHgv')?.textContent||'',
      opsDocks:document.getElementById('opsDocks')?.textContent||'',
      opsOutdoor:document.getElementById('opsOutdoor')?.textContent||'',
      opsAccess:document.getElementById('opsAccess')?.textContent||'',
    }));
    const territoryOk=territory.routeMetric&&territory.routeCopy&&territory.correctedCopy&&territory.site?.plant?.lat===41.52355&&territory.site?.plant?.lon===-5.59993&&territory.site?.policy==='OSM_NAME_OPERATOR_MATCH_NOT_AS_BUILT'&&territory.weatherOps?.schemaVersion===2&&territory.weatherOps?.advisoryOnly===true&&territory.weatherOps?.forecastRisk===1&&territory.weatherOps?.forecast?.maxGustKmh===38&&territory.weatherOps?.activityRisk?.hgv?.level===1&&territory.weatherOps?.activityRisk?.docks?.level===0&&territory.weatherWindow==='02:00–04:00'&&territory.opsHgv==='ATENCIÓN'&&territory.opsDocks==='NORMAL'&&territory.opsOutdoor==='ATENCIÓN'&&territory.opsAccess==='NORMAL'&&territory.weatherRisk24==='ATENCIÓN'&&territory.forecastSlots>=2;
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
