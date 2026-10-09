import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.GAZA_URL || 'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1250,height:850}});
 const farm=await context.newPage(),labs=await context.newPage();
 const failures=[];
 for(const [page,mode] of [[farm,'farm'],[labs,'labs']]){
   page.on('pageerror',e=>failures.push(mode+': '+e.message));
   const res=await page.goto(base+'/farm-labs.html?mode='+mode+'&qa=1&freeze=1',{waitUntil:'domcontentloaded'});
   assert.equal(res.status(),200,mode+' HTTP');
   await page.waitForFunction(()=>window.__GAZA_TWIN_STATE__?.surface===mode,{timeout:15000});
   const state=await page.evaluate(()=>window.__GAZA_TWIN_STATE__);
   assert.equal(state.provenance.simulated,true);
   assert.equal(state.simulation.lotId,'SIM-LOT-001');
   assert.equal(await page.locator('#steps button').count(),7);
 }
 await farm.locator('#advance').click();
 await labs.waitForFunction(()=>document.getElementById('shared')?.textContent.includes('FARM 1/6'));
 await labs.locator('#advance').click();
 await farm.waitForFunction(()=>document.getElementById('shared')?.textContent.includes('LABS 1/6'));
 await farm.locator('[data-case="cold"]').click();
 for(let i=0;i<4;i++)await farm.locator('#advance').click();
 assert.match(await farm.locator('#status').textContent(),/ON HOLD/);
 assert.match(await labs.locator('#shared').textContent(),/ON_HOLD/);
 assert.deepEqual(failures,[],'browser errors');
 console.log('GAZA FARM LABS QA PASS: navigation, telemetry, cross-tab sync, cold hold');
}finally{await browser.close();}
