import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),threeRoot=path.dirname(path.dirname(require.resolve('three'))),base=process.env.GAZA_URL||'http://127.0.0.1:4173',out=path.resolve('.qa/plant-detail');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']}),checks=[],errors=[];let page;
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('https://cdn.jsdelivr.net/npm/three@0.180.0/**',async r=>{const rel=r.request().url().split('/three@0.180.0/')[1];if(!rel||rel.includes('..'))return r.abort();return r.fulfill({body:await fs.readFile(path.join(threeRoot,rel)),contentType:'text/javascript'})});
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/site-real-preview.html?qa=1&dept=asrs',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__GAZA_PLANT_DETAIL__?.stockGlyphs&&window.__GAZA_SITE_RENDER_STATS__?.calls>0);
 assert.equal(await page.evaluate(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs.represented),0);assert.equal(await page.evaluate(()=>window.__GAZA_PLANT_DETAIL__.parkingCarsAdded),0);checks.push('no-invented-finished-stock-or-duplicate-cars');
 await page.evaluate(async()=>{const {processStore:s}=await import('./runtime/processes/store.mjs'),{gateEligibility}=await import('./runtime/processes/ledger.mjs');await s.start();await s.dispatch({type:'AUTO',enabled:true});for(let i=0;i<900;i++){for(const gate of ['admission','manufacturing'])if(s.state.lots[s.selected].gates[gate].status!=='APPROVED'&&gateEligibility(s.state,s.selected,gate).ok)await s.dispatch({type:'REVIEW_GATE',lotId:s.selected,gate,reviewer:'SIM-QA-01'});await s.dispatch({type:'TICK',seconds:1});if(s.state.lots[s.selected].tasks['WAREHOUSE.PUTAWAY'].status==='DONE')return}throw Error('Putaway not reached')});
 await page.waitForFunction(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs.rack>0);
 const stored=await page.evaluate(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs);assert.equal(stored.dock,0);assert.equal(stored.rack,Math.min(24,stored.stock));checks.push('rack-glyphs-follow-actual-selected-lot-stock');
 await page.screenshot({path:path.join(out,'07-stock-after-putaway.png')});
 await page.evaluate(async()=>{const {processStore:s}=await import('./runtime/processes/store.mjs'),{gateEligibility}=await import('./runtime/processes/ledger.mjs');for(let i=0;i<300;i++){if(gateEligibility(s.state,s.selected,'dispatch').ok){await s.dispatch({type:'REVIEW_GATE',lotId:s.selected,gate:'dispatch',reviewer:'SIM-QA-01'});break}await s.dispatch({type:'TICK',seconds:1})}for(let i=0;i<25;i++){await s.dispatch({type:'TICK',seconds:1});if(s.state.lots[s.selected].tasks['DISPATCH.LOAD'].status==='RUNNING'){await s.dispatch({type:'TICK',seconds:8});return}}throw Error('Loading not reached')});
 await page.waitForFunction(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs.dock>0);const loading=await page.evaluate(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs);assert(loading.represented<=loading.stock);checks.push('loading-reallocates-stock-without-duplicating');
 await page.evaluate(async()=>{const {processStore:s}=await import('./runtime/processes/store.mjs');await s.dispatch({type:'INCIDENT',lotId:s.selected,reason:'Stock loading hold QA'});await s.dispatch({type:'TICK',seconds:6})});
 await page.waitForFunction(()=>window.__GAZA_PLANT_DETAIL__.taskStates['DISPATCH.LOAD'].state==='HELD');assert.deepEqual(await page.evaluate(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs),loading);checks.push('held-loading-preserves-pallet-allocation');
 await page.locator('#plantDepartment').selectOption('shipping');await page.locator('#plantEnter').click();await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'08-stock-held-loading.png')});
 await page.locator('[data-process-panel] #lot').selectOption('SIM-OVI-001');await page.waitForFunction(()=>window.__GAZA_PLANT_DETAIL__.lotId==='SIM-OVI-001');
 const actual=await page.evaluate(async()=>{const {processStore:s}=await import('./runtime/processes/store.mjs'),{projectPlant}=await import('./runtime/plant/model.mjs'),{inventoryGlyphPlan}=await import('./runtime/plant/inventory-view.mjs');return inventoryGlyphPlan(projectPlant(s.state,s.selected))});assert.deepEqual(await page.evaluate(()=>window.__GAZA_PLANT_DETAIL__.stockGlyphs),actual);checks.push('species-change-uses-own-stock');
 assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'stock-report.json'),JSON.stringify({ok:true,checks,errors,stored,loading},null,2));console.log('PLANT STOCK BROWSER QA PASS',checks);
}catch(e){if(page)await page.screenshot({path:path.join(out,'stock-failure.png')}).catch(()=>{});await fs.writeFile(path.join(out,'stock-report.json'),JSON.stringify({ok:false,checks,errors,error:String(e)},null,2));throw e}finally{await browser.close()}
