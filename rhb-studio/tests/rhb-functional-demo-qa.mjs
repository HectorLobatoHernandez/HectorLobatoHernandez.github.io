import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base=process.env.BASE_URL||'http://127.0.0.1:4198';
const out='.qa/rhb-functional-demo';
await fs.mkdir(out,{recursive:true});

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror: '+String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
const res=await page.goto(base+'/apps/rhb/',{waitUntil:'domcontentloaded',timeout:45000});
if(!res?.ok())throw new Error('RHB demo HTTP '+res?.status());
await page.waitForFunction(()=>window.__RHB_STUDIO_DEMO__?.projectCount===2,{timeout:30000});

const initial=await page.evaluate(()=>({
  contract:window.__RHB_STUDIO_DEMO__,
  nav:document.querySelectorAll('.demo-side nav button').length,
  cards:document.querySelectorAll('.project-card').length,
  privateLeak:/C:\\Users|OMNIROUTE_KEY|api[_ -]?key|password|20128|18789|20800/i.test(document.body.innerText),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
}));

await page.getByRole('button',{name:'BOM / Estimate'}).click();
await page.waitForSelector('.bom-row:not(.head)');
const bomBefore=await page.locator('.bom-row:not(.head)').count();
await page.locator('.bom-row:not(.head) input[type="number"]').first().fill('20');
await page.waitForTimeout(120);

await page.getByRole('button',{name:'Agent Router'}).click();
await page.locator('.router-input textarea').fill('Necesito plano CAD, cotas y geometría');
await page.getByRole('button',{name:'Route task'}).click();
await page.waitForSelector('.route-trace b');
const routed=await page.locator('.route-trace b').first().textContent();

await page.getByRole('button',{name:'+ Project'}).click();
await page.waitForFunction(()=>window.__RHB_STUDIO_DEMO__?.projectCount===3);
const afterCreate=await page.evaluate(()=>({
  contract:window.__RHB_STUDIO_DEMO__,
  stored:JSON.parse(localStorage.getItem('rhb-studio-public-demo-v1')||'{}'),
  active:document.querySelector('.demo-project-switch select')?.value
}));

await page.getByRole('button',{name:'Documents'}).click();
const docText=await page.locator('.doc-preview').textContent();

await page.screenshot({path:out+'/desktop.png',fullPage:true});

await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__RHB_STUDIO_DEMO__?.projectCount===3,{timeout:30000});
const mobile=await page.evaluate(()=>({
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,
  projectCount:window.__RHB_STUDIO_DEMO__?.projectCount,
  nav:document.querySelectorAll('.demo-side nav button').length
}));
await page.screenshot({path:out+'/mobile.png',fullPage:true});
await browser.close();

const failures=[];
if(initial.contract?.mode!=='BROWSER_ONLY'||initial.contract?.backendConnected!==false)failures.push('public/private boundary contract mismatch');
if(initial.contract?.modules!==7||initial.contract?.agents!==6||initial.nav!==7)failures.push('module/agent inventory mismatch');
if(initial.cards!==2)failures.push('seed project cards mismatch');
if(initial.privateLeak)failures.push('private runtime details leaked');
if(bomBefore!==4)failures.push('gate BOM seed mismatch');
if(routed?.trim()!=='CAD Agent')failures.push('deterministic CAD routing failed');
if(afterCreate.contract?.projectCount!==3||afterCreate.stored?.projects?.length!==3)failures.push('new project/localStorage persistence failed');
if(afterCreate.active!=='RHB-DEMO-003')failures.push('new project did not become active');
if(!docText?.includes('RHB-DEMO-003'))failures.push('document generation not bound to active project');
if(initial.overflow||mobile.overflow)failures.push('horizontal overflow');
if(mobile.projectCount!==3||mobile.nav!==7)failures.push('mobile persisted state mismatch');
if(errors.length)failures.push('browser errors: '+errors.join(' | '));

if(failures.length){
  console.error(JSON.stringify({initial,bomBefore,routed,afterCreate,mobile,errors,failures},null,2));
  process.exit(2);
}
console.log('RHB FUNCTIONAL DEMO QA PASS',JSON.stringify({initial,bomBefore,routed,afterCreate:{projectCount:afterCreate.contract.projectCount,active:afterCreate.active},mobile}));
