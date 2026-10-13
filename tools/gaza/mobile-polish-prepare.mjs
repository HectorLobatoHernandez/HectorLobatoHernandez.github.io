import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo='HectorLobatoHernandez/HectorLobatoHernandez.github.io',ref='refs/heads/feat/gaza-mobile-motion-20261013',base='029882d866038c074febf55b7b98fd292860d14f';
if(process.env.GITHUB_REPOSITORY!==repo||process.env.GITHUB_REF!==ref)throw Error('Wrong preparation scope');
const files=new Map(),get=p=>{if(!files.has(p))files.set(p,execFileSync('git',['show',base+':'+p],{encoding:'utf8',maxBuffer:4e6}));return files.get(p)};
function replace(p,a,b){const t=get(p);if(t.split(a).length!==2)throw Error('Ambiguous source transform '+p+' '+a.slice(0,70));files.set(p,t.replace(a,b))}
replace('apps/gaza/runtime/living/scene.mjs','const update=()=>{const changed=refresh(),pose=displayState()','const update=(force=false)=>{const changed=refresh(force),pose=displayState()');
const site='apps/gaza/runtime/site-real-app.mjs';
replace(site,"scene.background=new THREE.Color(night?'#172333'","if(!processState){scene.background=new THREE.Color(night?'#172333'");
replace(site,"Math.cos(hour/24*Math.PI*2)*170);rain.visible=weather==='rain'","Math.cos(hour/24*Math.PI*2)*170);}else living?.update(true);rain.visible=weather==='rain'");
replace(site,"living:living?.snapshot()||null,startup:","living:living?.snapshot()||null,lighting:{background:scene.background?.getHexString(),sunIntensity:sun.intensity},startup:");
const css='apps/gaza/runtime/mobile/mobile.css';
replace(css,'grid-template-columns:145px minmax(0,1fr)','grid-template-columns:175px minmax(0,1fr)');
replace(css,'grid-template-rows:42px minmax(0,1fr)','grid-template-rows:46px minmax(0,1fr)');
replace(css,'#touchMini button{min-height:38px}','#touchMini button{min-height:44px}');
replace(css,'#touchSceneTools{left:auto;width:300px;bottom:8px}','#touchSceneTools{left:auto;width:340px;max-width:calc(100% - 16px);bottom:8px}');
files.set(css,get(css)+'\n.touch-dialog .touch-dialog-head button,.touch-dialog .touch-actions button,#touchSceneViews .touch-dialog-body>button{background:#204b40;color:#e9f2e4;border:1px solid #779b88;border-radius:7px;padding:8px 10px}.touch-dialog .touch-actions button:disabled{opacity:.5}body.mobile-shell .top .brand{white-space:nowrap}\n');
const test='apps/gaza/tests/mobile-browser-qa.mjs';
replace(test,"await page.screenshot({path:path.join(out,'03-phone-current-plant.png')});","await site.waitForFunction(()=>window.__GAZA_SITE_REAL__?.lighting?.sunIntensity<.2&&window.__GAZA_SITE_REAL__?.lighting?.background==='07101f');checks.push('newly-opened-plant-starts-with-shared-night-not-only-night-settings');await page.screenshot({path:path.join(out,'03-phone-current-plant.png')});");
replace('.github/workflows/gaza-mobile-qa.yml','node --test tests/mobile-motion.test.mjs tests/process-ledger.test.mjs tests/farm-stall-alignment.test.mjs tests/live-ops.test.mjs','node --test tests/*.test.mjs');
files.set('apps/gaza/tests/mobile-night-start.test.mjs',`import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {environmentOf} from '../runtime/living/model.mjs';
import {initialState} from '../runtime/processes/ledger.mjs';
test('night preview is distinct from clock and has low ambient/solar energy',()=>{const s=initialState({living:{startMinute:480,environment:'night',schedule:false}}),e=environmentOf(s);assert(e.sunIntensity<.2);assert(e.ambientIntensity<.3);assert.equal(e.sourceHour,8);assert.equal(e.hour,23)});
test('initial plant lighting respects a pre-existing shared scenario',()=>{const t=fs.readFileSync(new URL('../runtime/site-real-app.mjs',import.meta.url),'utf8');assert(t.includes('if(!processState){scene.background='));assert(t.includes('else living?.update(true)'));const layer=fs.readFileSync(new URL('../runtime/living/scene.mjs',import.meta.url),'utf8');assert(layer.includes('const update=(force=false)=>{const changed=refresh(force)'))});
`);
const out='.qa/mobile-polish';await fs.mkdir(out,{recursive:true});
const hash=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
for(const[p,t]of files){await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,t);if(/\.m?js$/.test(p))execFileSync('node',['--check',p],{stdio:'inherit'});const target=path.join(out,p);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,t)}
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:'apps/gaza',stdio:'inherit',timeout:120000});
const tests=(await fs.readdir('apps/gaza/tests')).filter(n=>n.endsWith('.test.mjs')).map(n=>'tests/'+n);execFileSync('node',['--test',...tests],{cwd:'apps/gaza',stdio:'inherit',timeout:120000});
const token=process.env.GITHUB_TOKEN;if(!token)throw Error('Missing token');const report={base,refChanged:false,files:[]};
for(const[p,t]of files){const bytes=Buffer.from(t),r=await fetch(`https://api.github.com/repos/${repo}/git/blobs`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({content:bytes.toString('base64'),encoding:'base64'}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Upload '+r.status);const result=await r.json();if(result.sha!==hash(bytes))throw Error('Mismatch');report.files.push({path:p,sha:result.sha,sha256:createHash('sha256').update(bytes).digest('hex')})}
await fs.writeFile(out+'/verified-blobs.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
