import { chromium } from 'playwright';

const base=process.env.PORTAL_URL||'http://127.0.0.1:4175';
const browser=await chromium.launch({headless:true});
const errors=[];
const pages=[
  ['/start/','START HERE',['CV','GAZA','RHB STUDIO','Labs']],
  ['/start/cv.html','Currículum',['Atelier','Swiss','Monograph','Scroll World']],
  ['/start/gaza.html','GAZA',['ARRANCAR MISSION CONTROL','ABRIR MATRIX']],
  ['/start/rhb.html','RHB STUDIO',['LOCAL RUNTIME','Demo pública funcional','ABRIR DEMO FUNCIONAL']],
  ['/start/labs.html','Labs',['App Test Center','GIS 3D']]
];

for(const [path,titlePart,needles] of pages){
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  page.on('pageerror',e=>errors.push(path+' pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(path+' console: '+m.text())});
  const r=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:30000});
  if(!r?.ok())errors.push(path+' http '+String(r?.status()));
  const state=await page.evaluate(()=>({
    title:document.title,
    text:document.body.textContent,
    stylesheet:document.querySelectorAll('link[rel="stylesheet"],style').length,
    links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))
  }));
  if(!state.title.includes(titlePart))errors.push(path+' title mismatch: '+state.title);
  for(const n of needles)if(!state.text.includes(n))errors.push(path+' missing copy: '+n);
  if(state.stylesheet<1)errors.push(path+' stylesheet missing');
  if(!state.links.length)errors.push(path+' links missing');
  await page.close();
}

const root=await browser.newPage({viewport:{width:1440,height:960}});
await root.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
const rootOk=await root.evaluate(()=>document.body.textContent.includes('START HERE')&&!!document.querySelector('a[href="start/"]'));
if(!rootOk)errors.push('root START HERE entry missing');
await root.close();

const gaza=await browser.newPage({viewport:{width:1440,height:960}});
await gaza.goto(base+'/apps/gaza/mission-control.html?qa=1&view=matrix',{waitUntil:'domcontentloaded',timeout:30000});
await gaza.waitForTimeout(1200);
const direct=await gaza.evaluate(()=>({matrix:document.getElementById('matrixView')?.classList.contains('on')||false,runtime:window.__GAZA_MISSION_CONTROL__||null}));
if(!direct.matrix||direct.runtime?.initialView!=='matrix')errors.push('GAZA matrix direct launch failed: '+JSON.stringify(direct));
await gaza.close();

await browser.close();
if(errors.length){console.error(JSON.stringify({errors},null,2));process.exit(2)}
console.log('Sector launch portal QA OK');
