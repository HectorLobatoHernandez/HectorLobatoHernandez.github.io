#!/usr/bin/env node
/** Materialize reviewed R1 sources as R2 blobs only; no branch or deployment writes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const REPO='HectorLobatoHernandez/HectorLobatoHernandez.github.io';
const SOURCE='71ac8ccacdca5ee5830e4f00cb47ee991edcd3a1';
const FROM='gaza-demo-20261012-r1',TO='gaza-demo-20261012-r2';
if(process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_REF!=='refs/heads/fix/gaza-dossier-demo-entry-20261012')throw Error('Wrong preparation scope');
const token=process.env.GITHUB_TOKEN;if(!token)throw Error('Missing workflow token');
const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'};
const files=['demostracion.html','farm-labs.html','mission-control.html','operations-thread.html','site-real-preview.html','runtime/demo/session.mjs','runtime/demo/scene-health.js','runtime/demo/import-map.js'];
const out=path.resolve('.qa/demo-release');await fs.mkdir(out,{recursive:true});
const report={source:SOURCE,from:FROM,to:TO,files:[],refUpdated:false};
for(const file of files){
 const name='apps/gaza/'+file;
 const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${name}?ref=${SOURCE}`,{headers,signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Read ${name}: ${r.status}`);
 const meta=await r.json();if(meta.encoding!=='base64')throw Error('Unexpected file encoding');
 const before=Buffer.from(meta.content,'base64');
 const gitHash=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
 if(gitHash(before)!==meta.sha)throw Error('Source blob mismatch');
 let text=before.toString('utf8');const occurrences=text.split(FROM).length-1;
 text=text.replaceAll(FROM,TO);
 if(file==='runtime/demo/import-map.js'){
  const old=" const imports={'three':'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js','three/addons/':'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/'};";
  if(!text.includes(old))throw Error('Import map differs from reviewed source');
  text=text.replace(old," const engine=new URL('vendor/three-r180/build/three.module.min.js',base).href,addons=new URL('vendor/three-r180/examples/jsm/',base).href;\n const imports={'three':engine,'three/addons/':addons,'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js':engine,'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/':addons};\n window.__GAZA_ENGINE_DELIVERY__='SAME_ORIGIN_R180';");
 }
 if(!occurrences&&file!=='runtime/demo/scene-health.js')throw Error('Expected release marker missing: '+file);
 const bytes=Buffer.from(text),sha=gitHash(bytes);
 if(sha===meta.sha){report.files.push({path:name,sha,before:meta.sha,unchanged:true});continue}
 const res=await fetch(`https://api.github.com/repos/${REPO}/git/blobs`,{method:'POST',headers,body:JSON.stringify({content:bytes.toString('base64'),encoding:'base64'}),signal:AbortSignal.timeout(30000)});
 if(!res.ok)throw Error(`Store ${name}: ${res.status}`);const uploaded=await res.json();if(uploaded.sha!==sha)throw Error('Uploaded blob mismatch');
 const saved=path.join(out,name);await fs.mkdir(path.dirname(saved),{recursive:true});await fs.writeFile(saved,bytes);
 report.files.push({path:name,sha,before:meta.sha,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,releaseReplacements:occurrences});
}
await fs.writeFile(path.join(out,'release-blobs.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
