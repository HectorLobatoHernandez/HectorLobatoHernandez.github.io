import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base=process.env.MAP_BASE_URL||'http://127.0.0.1:4187';
const projectPaths=[
 'projects/mar-salada.html','projects/gaza-logistics-ia.html','projects/rhb-studio.html',
 'projects/casa-noah.html','projects/las-dalias-akasha.html',
 'projects/private-tech-residence.html','projects/xxxia-studio.html'
];
const docs=['docs/MAPA_MAESTRO.md','docs/MANUAL_CV.md','docs/MANUAL_GAZA.md','docs/MANUAL_RHB_STUDIO.md','cv/CONTENT_INVENTORY.md'];
for(const p of [...projectPaths,...docs]) await fs.access(p);

const browser=await chromium.launch({headless:true});
const errors=[],results=[];
await fs.mkdir('.qa/master-map',{recursive:true});
for(const viewport of [{width:1440,height:960,name:'desktop'},{width:390,height:844,name:'mobile'}]){
 const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
 page.on('pageerror',e=>errors.push(viewport.name+': '+e.message));
 const res=await page.goto(base+'/start/mapa.html',{waitUntil:'domcontentloaded',timeout:30000});
 if(!res?.ok())errors.push('Master map HTTP '+res?.status());
 for(const img of await page.locator('.visual img').all()){
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(async node=>{if(!node.complete) await new Promise(resolve=>{node.addEventListener('load',resolve,{once:true});node.addEventListener('error',resolve,{once:true});setTimeout(resolve,1500)})});
 }
 await page.waitForTimeout(150);
 const state=await page.evaluate(()=>({
  title:document.title,
  headings:[...document.querySelectorAll('section[id]')].map(x=>x.id),
  imgs:[...document.querySelectorAll('.visual img')].map(x=>({ok:x.complete&&x.naturalWidth>0,src:x.getAttribute('src'),alt:x.alt})),
  navigation:[...document.querySelectorAll('a[href]')].map(x=>x.getAttribute('href')),
  horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
  statuses:[...document.querySelectorAll('.status')].map(x=>x.textContent.trim())
 }));
 results.push({viewport:viewport.name,...state});
 if(state.headings.join(',')!=='cv,gaza,rhb,manuales')errors.push('Master map sections missing');
 if(state.imgs.length!==3||state.imgs.some(x=>!x.ok||!x.alt))errors.push(viewport.name+' 3 referenced diagrams not loaded or inaccessible');
 if(state.horizontalOverflow>3)errors.push(viewport.name+' horizontal overflow '+state.horizontalOverflow);
 if(!state.statuses.some(x=>x.includes('LOCAL'))&&!state.statuses.some(x=>x.includes('EJECUCIÓN')))errors.push('RHB not marked local');
 if(!state.navigation.some(x=>x.includes('MANUAL_GAZA.md')))errors.push('manual links missing');
 if(!state.navigation.some(x=>x.includes('mission-control.html?guide=1')))errors.push('GAZA launch missing');
 for(const href of state.navigation.filter(x=>!x.startsWith('#')&&!x.startsWith('https:')&&!x.startsWith('mailto:'))){
  const u=new URL(href,base+'/start/mapa.html');
  const head=await page.request.head(u.href,{timeout:10000});
  if(!head.ok()) errors.push(viewport.name+' broken link: '+href+' HTTP '+head.status());
 }
 await page.screenshot({path:'.qa/master-map/'+viewport.name+'.png',fullPage:true});
 await page.close();
}
const start=await browser.newPage();
await start.goto(base+'/start/',{waitUntil:'domcontentloaded'});
if(!(await start.locator('a[href="mapa.html"]').count()))errors.push('START HERE no master map link');
await start.close();
for(const p of docs){
 const file=await fs.readFile(p,'utf8');
 if(file.length<600)errors.push('manual too short: '+p);
}
for(const p of projectPaths){
 const source=await fs.readFile(p,'utf8');
 if(!source.includes('<title>'))errors.push('original CV case corrupted: '+p);
}
await fs.writeFile('.qa/master-map/result.json',JSON.stringify({errors,results},null,2));
await browser.close();
if(errors.length){console.error(JSON.stringify({errors},null,2));process.exit(2)}
console.log('MASTER MAP QA PASS: public entry, 3 diagrams, 4 manuals, 7 CV case files, linked launch surfaces, desktop/mobile.');
