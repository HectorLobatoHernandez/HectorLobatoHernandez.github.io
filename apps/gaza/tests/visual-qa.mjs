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
  {name:'plant-farm',url:'/plant-3d.html?camera=farm&freeze=1&debug=1&qa=1',width:1600,height:900,dsf:2},
  {name:'territory',url:'/territory.html',width:1600,height:900,dsf:1},
  {name:'strategy-mobile',url:'/game.html?camera=overview&freeze=1&debug=1&qa=1',width:390,height:844,dsf:2}
];

for(const target of targets){
  const {name,url,width,height,dsf=1}=target;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dsf});
  const page=await context.newPage();
  page.on('console',m=>{if(m.type()==='error')errors.push({surface:name,type:'console',text:m.text()})});
  page.on('pageerror',e=>errors.push({surface:name,type:'pageerror',text:e.message}));
  const response=await page.goto(base+url,{waitUntil:'networkidle',timeout:45000});
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
  }

  if(url.includes('territory.html')){
    const territory=await page.evaluate(()=>({
      routeMetric:!!document.getElementById('dgtRouteMatches'),
      routeCopy:document.body.textContent.includes('coincidencia geométrica')||document.body.textContent.includes('coincidencias corredor ruta')
    }));
    const territoryOk=territory.routeMetric&&territory.routeCopy;
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
