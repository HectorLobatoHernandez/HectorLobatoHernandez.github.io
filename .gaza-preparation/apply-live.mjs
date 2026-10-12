import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const REPO='HectorLobatoHernandez/HectorLobatoHernandez.github.io',BRANCH='refs/heads/feat/gaza-live-ops-20261012';
if(process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_REF!==BRANCH)throw Error('Wrong preparation repository or branch');
const bytes=gunzipSync(Buffer.concat(await Promise.all(Array.from({length:19},(_,i)=>fs.readFile('.gaza-preparation/part'+String(i).padStart(2,'0')+'.gz')))),{maxOutputLength:1e6});
if(createHash('sha256').update(bytes).digest('hex')!=='50941301b5c270d912442cd4c451ee831d06858873bb6c2d6964437ab39a26e6')throw Error('Reviewed source payload does not match');
const payload=JSON.parse(bytes),blob=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
if(payload.base!=='69558db5b0fab2a2290d74a5b4c67bef9d71f682'||payload.files.length!==33)throw Error('Unexpected base or file count');
const names=new Set();for(const f of payload.files){if(f.path.includes('..')||names.has(f.path)||!(f.path.startsWith('apps/gaza/')||['start/gaza.html','skills/gaza-geospatial-industrial-twin/SKILL.md','.github/workflows/gaza-live-ops-qa.yml'].includes(f.path)))throw Error('Unapproved path');names.add(f.path)}
const mode=process.argv[2];
if(mode==='apply'){
 const prepared=[];
 for(const f of payload.files){let before;try{before=await fs.readFile(f.path)}catch(e){if(e.code!=='ENOENT'||f.before!==null)throw e;before=Buffer.alloc(0)}
  if((f.before===null&&before.length)||(f.before!==null&&blob(before)!==f.before))throw Error('File advanced or differs: '+f.path);
  const chars=Array.from(before.toString('utf8'));let last=chars.length;
  for(const [start,end,insert]of [...f.edits].reverse()){if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||end>last||typeof insert!=='string')throw Error('Invalid edit');chars.splice(start,end-start,...Array.from(insert));last=start;}
  const after=Buffer.from(chars.join(''));if(blob(after)!==f.after)throw Error('Output hash differs: '+f.path);prepared.push([f.path,after]);
 }
 for(const [p,b]of prepared){await fs.mkdir(path.dirname(p),{recursive:true});await fs.writeFile(p,b)}console.log('ALL_REVIEWED_SOURCES_APPLIED=33; NO_GIT_REF_WRITE');
}else if(mode==='publish'){
 const token=process.env.GITHUB_TOKEN;if(!token)throw Error('Missing temporary workflow token');
 const files=[];for(const f of payload.files){const b=await fs.readFile(f.path);if(blob(b)!==f.after)throw Error('Changed after validation: '+f.path);files.push({...f,bytes:b});}
 const out='.qa/live-preparation';await fs.mkdir(out,{recursive:true});const report={base:payload.base,release:'gaza-live-20261012-v1',refUpdated:false,files:[]};
 for(const f of files){const r=await fetch(`https://api.github.com/repos/${REPO}/git/blobs`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({content:f.bytes.toString('base64'),encoding:'base64'}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Blob storage failed ${r.status} ${f.path}`);const result=await r.json();if(result.sha!==f.after)throw Error('GitHub hash mismatch');report.files.push({path:f.path,sha:result.sha,before:f.before,bytes:f.bytes.length});}
 await fs.writeFile(out+'/manifest.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}else throw Error('Choose apply or publish');
