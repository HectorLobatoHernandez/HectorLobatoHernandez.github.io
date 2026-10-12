// Requires a real browser/WebGL runtime. Not a substitute for unit tests.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),threeRoot=path.dirname(path.dirname(require.resolve('three')));
const base=process.env.GAZA_URL||'http://127.0.0.1:4173',out=path.resolve('.qa/process-v2');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});const checks=[],errors=[],warnings=[],readiness=[];let context;
try{
 context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async r=>{
  const rel=r.request().url().split('/three@0.180.0/')[1];if(!rel||rel.includes('..'))return r.abort();
  return r.fulfill({body:await fs.readFile(path.join(threeRoot,rel)),contentType:'text/javascript'});
 });
 const flow=await context.newPage();flow.on('pageerror',e=>errors.push(e.message));
 assert((await flow.goto(base+'/operations-thread.html?qa=1')).ok());
 await flow.locator('[data-process-panel] #start').click();await flow.waitForFunction(()=>window.__GAZA_PROCESS_STATE__?.schemaVersion===2);
 assert.equal(await flow.locator('[data-process-panel] #lot option').count(),2);checks.push('explicit-initialisation/two-species');
 const farm=await context.newPage(),labs=await context.newPage();
 for(const [page,mode] of [[farm,'farm'],[labs,'labs']]){
  page.on('pageerror',e=>errors.push(e.message));assert((await page.goto(base+'/farm-labs.html?mode='+mode+'&qa=1')).ok());
  await page.waitForFunction(()=>window.__GAZA_TWIN_STATE__?.simulation?.processLedgerVersion===2&&window.__GAZA_RENDER_STATS__?.calls>0);
  assert.equal(await page.locator('#steps button').count(),7);
 }
 checks.push('Farm/Labs-real-WebGL-and-common-ledger');
 const before=await farm.evaluate(()=>JSON.stringify(window.__GAZA_PROCESS_STATE__));await farm.locator('#steps button').nth(4).click();
 assert.equal(await farm.evaluate(()=>JSON.stringify(window.__GAZA_PROCESS_STATE__)),before);checks.push('station-selection-does-not-advance-production');
 await flow.locator('[data-process-panel] [data-task="FARM.BIOSECURITY"] button').click();
 await labs.waitForFunction(()=>window.__GAZA_PROCESS_STATE__.lots['SIM-BOV-001'].tasks['FARM.BIOSECURITY'].status==='RUNNING');
 await flow.locator('[data-process-panel] #step').click();
 await farm.waitForFunction(()=>window.__GAZA_PROCESS_STATE__.lots['SIM-BOV-001'].tasks['FARM.BIOSECURITY'].status==='DONE');checks.push('cross-frame-task-and-time-propagation');
 await flow.evaluate(async()=>{const {processStore:s}=await import('./runtime/processes/store.mjs');await Promise.all(Array.from({length:8},()=>s.dispatch({type:'TICK',seconds:1})))});
 await labs.waitForFunction(()=>window.__GAZA_PROCESS_STATE__.clock.seconds===18);checks.push('concurrent-writes-serialized');
 await flow.evaluate(async()=>{const {processStore:s}=await import('./runtime/processes/store.mjs');await s.dispatch({type:'INCIDENT',lotId:'SIM-BOV-001',reason:'Cooling anomaly test'})});
 await labs.waitForFunction(()=>window.__GAZA_PROCESS_STATE__.lots['SIM-BOV-001'].holds);
 assert.equal(await labs.evaluate(()=>window.__GAZA_PROCESS_STATE__.lots['SIM-OVI-001'].holds),false);checks.push('hold-is-lot-specific');
 assert(await flow.locator('[data-process-panel] [data-gate="dispatch"]').isDisabled());checks.push('independent-quality-gates');
 const site=await context.newPage();site.on('console',m=>{if(['warning','error'].includes(m.type()))warnings.push(m.text())});site.on('pageerror',e=>errors.push(e.message));
 const started=performance.now();await site.goto(base+'/site-real-preview.html?qa=1');
 // Inspect the real foreground WebGL view. Background pages may suspend animation-frame polling.
 // Artifacts 259/262 showed the exact ready/held/render predicates true in failure diagnostics.
 // Keep the same 60 s bound and all assertions; do not seed state or substitute a mocked renderer.
 await site.bringToFront();
 await site.waitForFunction(()=>window.__GAZA_SITE_REAL__?.state==='ready'&&window.__GAZA_SITE_REAL__?.process?.held&&window.__GAZA_SITE_REAL__?.render?.calls>0,null,{timeout:60000,polling:100});
 readiness.push({scene:'Site Real',milliseconds:Math.round(performance.now()-started),renderer:'CI SwiftShader; inspected tab brought to foreground',waitBudgetMs:60000,pollingMs:100});
 assert.equal(await site.evaluate(()=>window.__GAZA_SITE_REAL__.process.lotId),'SIM-BOV-001');
 assert.equal(await site.evaluate(()=>window.__GAZA_SITE_REAL__.process.simSeconds),18);
 const position=await site.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position);await site.waitForTimeout(400);
 assert.deepEqual(await site.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position),position);checks.push('Site-Real-hold-binding');
 await farm.screenshot({path:path.join(out,'farm-process.png'),fullPage:true});await labs.screenshot({path:path.join(out,'labs-process.png'),fullPage:true});
 await flow.setViewportSize({width:390,height:844});assert(await flow.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await flow.screenshot({path:path.join(out,'workflow-mobile.png'),fullPage:true});checks.push('mobile-layout');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,checks,errors,warnings,readiness},null,2));console.log('PROCESS V2 BROWSER QA PASS',checks,readiness);
}catch(e){const diagnostics=[];for(const [i,p]of (context?.pages()||[]).entries()){try{const state=await p.evaluate(()=>({url:location.href,fallback:document.querySelector('#fallback')?.textContent,site:window.__GAZA_SITE_REAL__,processError:window.__GAZA_PROCESS_ERROR__,visibility:document.visibilityState,render:window.__GAZA_RENDER_STATS__}));diagnostics.push(state);await p.screenshot({path:path.join(out,'failure-'+i+'.png'),timeout:5000})}catch(x){diagnostics.push({error:String(x)})}}await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,checks,errors,warnings,readiness,diagnostics,error:String(e)},null,2));throw e}finally{await browser.close()}
