import { chromium } from 'playwright';
const base=process.env.GAZA_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
const r=await page.goto(base+'/mission-control.html?qa=1',{waitUntil:'domcontentloaded',timeout:30000});
if(!r?.ok())errors.push('http '+String(r?.status()));
await page.waitForTimeout(2600);
const s=await page.evaluate(()=>({
  title:document.title,
  tabs:document.querySelectorAll('[data-view]').length,
  matrix:!!document.getElementById('matrixView'),
  plantSrc:document.querySelector('[data-pane="plant"] iframe')?.getAttribute('src')||'',
  risk:document.getElementById('risk')?.textContent||'',
  temp:document.getElementById('temp')?.textContent||'',
  boundary:document.body.textContent.includes('No automatic process, safety or PLC control'),
  mission:document.body.textContent.includes('MISSION CONTROL')
}));
if(s.tabs<5||!s.matrix||!s.plantSrc.includes('qa=1')||s.risk!=='NORMAL'||s.temp!=='17.0 °C'||!s.boundary||!s.mission)errors.push('mission shell invalid: '+JSON.stringify(s));
await browser.close();
if(errors.length){console.error(JSON.stringify({s,errors},null,2));process.exit(2)}
console.log('GAZA Mission Control QA OK',s);
