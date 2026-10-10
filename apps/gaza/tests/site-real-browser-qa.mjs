import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {unproject} from '../runtime/site-real-core.mjs';
const require=createRequire(import.meta.url),threeRoot=path.dirname(path.dirname(require.resolve('three')));
const base=process.env.GAZA_URL||'http://127.0.0.1:4173',out=path.resolve('.qa/site-real');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});const checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 // Deterministic dependency delivery: exercise the real import map against the pinned npm package.
 await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async route=>{const rel=route.request().url().split('/three@0.180.0/')[1];if(!rel||rel.includes('..'))return route.abort();await route.fulfill({body:await fs.readFile(path.join(threeRoot,rel)),contentType:'text/javascript'})});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('503'))errors.push(m.text())});
 const response=await page.goto(base+'/site-real-preview.html?qa=1',{waitUntil:'networkidle'});assert(response.ok());
 await page.waitForFunction(()=>window.__GAZA_SITE_REAL__?.render?.calls>0);await page.waitForTimeout(350);
 const initial=await page.evaluate(()=>window.__GAZA_SITE_REAL__);assert.equal(initial.actors.length,2);assert.equal(initial.geometry.workers,8);assert.equal(initial.axes,'X_EAST_Y_UP_Z_SOUTH');assert(initial.render.calls>0&&initial.render.calls<1800);checks.push('boot/import-map/WebGL/render-budget');
 await page.screenshot({path:path.join(out,'01-exterior.png')});
 await page.locator('[data-camera="access1"]').click();await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'02-access1.png')});
 await page.locator('[data-camera="access2"]').click();await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'03-access2.png')});
 await page.locator('#cutaway').check();await page.waitForFunction(()=>window.__GAZA_SITE_REAL__.cutaway);await page.locator('[data-camera="top"]').click();await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'04-cutaway.png')});checks.push('cameras/cutaway');
 await page.locator('#cutaway').uncheck();await page.locator('#pause').click();await page.waitForFunction(old=>JSON.stringify(window.__GAZA_SITE_REAL__.actors[0].position)!==JSON.stringify(old),initial.actors[0].position);
 await page.locator('#pause').click();await page.waitForTimeout(400);const stopped=await page.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position);await page.waitForTimeout(550);assert.deepEqual(await page.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position),stopped);checks.push('motion/pause');
 await page.locator('#pause').click();await page.evaluate(()=>{const s={schemaVersion:1,provenance:'SIMULATED',stage:4,status:'HOLD',quality:'ON_HOLD',config:{lotId:'QA-LOT'},departments:Array.from({length:10},()=>({name:'LAB QA'}))};localStorage.setItem('gaza:operations-thread:v1',JSON.stringify(s));dispatchEvent(new StorageEvent('storage',{key:'gaza:operations-thread:v1'}))});
 await page.waitForFunction(()=>window.__GAZA_SITE_REAL__.ledger?.held);const held=await page.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position);await page.waitForTimeout(550);assert.deepEqual(await page.evaluate(()=>window.__GAZA_SITE_REAL__.actors[0].position),held);assert.match(await page.locator('#ledger').textContent(),/QA-LOT/);checks.push('Workflow-HOLD-stops-vehicles');
 await page.locator('#weather').selectOption('rain');await page.locator('#hour').evaluate(el=>{el.value='21';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'05-rain-evening.png')});
 const polygon=[[10,80],[30,80],[30,100],[10,100],[10,80]].map(p=>unproject(...p));
 const fixture={type:'FeatureCollection',features:[{type:'Feature',properties:{highway:'service',name:'QA synthetic road'},geometry:{type:'LineString',coordinates:[unproject(-20,40),unproject(40,40)]}},{type:'Feature',properties:{building:'industrial',name:'QA north building'},geometry:{type:'Polygon',coordinates:[polygon]}}]};
 await page.locator('#importFile').setInputFiles({name:'qa-context.geojson',mimeType:'application/geo+json',buffer:Buffer.from(JSON.stringify(fixture))});await page.waitForFunction(()=>window.__GAZA_SITE_REAL__.buildings===1);const imported=await page.evaluate(()=>window.__GAZA_SITE_REAL__);assert.equal(imported.roads,1);assert(imported.geometryQA[0].max[2]<0,'North building must be north/negative-Z like the road');checks.push('GeoJSON-import/alignment');
 await page.route('https://overpass-api.de/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));await page.locator('#load').click();await page.waitForFunction(()=>document.getElementById('status').textContent.includes('503'));assert.equal(await page.evaluate(()=>window.__GAZA_SITE_REAL__.buildings),1);checks.push('provider-failure-preserves-scene');
 await page.locator('#importFile').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});await page.waitForFunction(()=>document.getElementById('status').textContent.includes('rechazada'));assert.equal(await page.evaluate(()=>window.__GAZA_SITE_REAL__.buildings),1);checks.push('invalid-import-preserves-scene');
 await page.setViewportSize({width:390,height:844});await page.locator('#study').click();await page.waitForTimeout(350);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'06-mobile.png'),fullPage:true});checks.push('mobile/no-horizontal-overflow');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,checks,errors,render:initial.render,network:'Pinned Three.js; fixture/import tests, live OSM availability not tested'},null,2));console.log('SITE REAL BROWSER QA PASS',checks);
}catch(error){await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:false,checks,errors,error:String(error)},null,2));throw error}finally{await browser.close()}
