import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:4191';
const out='.qa/xxxia';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const res=await page.goto(base+'/xxxia-studio/',{waitUntil:'networkidle'});
if(!res?.ok())throw new Error('XXXIA console HTTP '+res?.status());
await page.waitForFunction(()=>window.__XXXIA_CONSOLE__?.pieces===7,{timeout:10000});
const state=await page.evaluate(()=>({
  contract:window.__XXXIA_CONSOLE__,
  jobs:document.querySelectorAll('.job').length,
  pipeline:document.querySelectorAll('.pipeline>div').length,
  publicCase:[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')?.includes('sound-club-palma')),
  title:document.title,
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));
await page.screenshot({path:out+'/console.png',fullPage:true});
await browser.close();
const failures=[];
if(state.title!=='XXXIA STUDIO — Production Console')failures.push('title mismatch');
if(state.contract?.schemaVersion!==2)failures.push('contract schema mismatch');
if(state.contract?.pieces!==7)failures.push('expected 7 production pieces');
if(state.contract?.jobs!==0)failures.push('private-reference provider jobs must not be registered');
if(state.contract?.boards!==4)failures.push('expected 4 tracked generated boards');
if(state.contract?.available!==4)failures.push('expected 4 available generated boards');
if(state.contract?.media!==8)failures.push('expected 8 public media assets');
if(state.jobs!==7)failures.push('expected 7 rendered job cards');
if(state.pipeline!==7)failures.push('pipeline stages mismatch');
if(!state.publicCase)failures.push('public Sound Club route missing');
if(state.overflow)failures.push('horizontal overflow');
if(errors.length)failures.push('browser errors: '+errors.join(' | '));
if(failures.length){console.error(JSON.stringify({state,failures},null,2));process.exit(2)}
console.log('XXXIA CONSOLE QA PASS',JSON.stringify(state.contract));
