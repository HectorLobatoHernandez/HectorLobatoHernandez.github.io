import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const repo='HectorLobatoHernandez/HectorLobatoHernandez.github.io',branch='refs/heads/feat/gaza-mobile-motion-20261013',expected='d537dcf6e2dd6432954d28328ccd694ad0f9eabc3e8496b423e1e0557bfd315f';
if(process.env.GITHUB_REPOSITORY!==repo||process.env.GITHUB_REF!==branch)throw Error('Wrong repository/branch');
const sha=b=>createHash('sha256').update(b).digest('hex'),blob=b=>createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const out='.qa/mobile-preparation';await fs.mkdir(out,{recursive:true});
let parts=await Promise.all([0,1,2].map(i=>fs.readFile(`tools/gaza/mobile-preparation/part${i}.b64`,'utf8')));parts=parts.map(s=>s.trim());
let bytes=Buffer.from(parts.join(''),'base64');
// Repair only the identified missing transport character, and only if the full reviewed hash matches.
if(sha(bytes)!==expected){const candidate=Buffer.from(parts.join('').replace('b9SdlpdptIn','b9SdlpdpttIn'),'base64');if(sha(candidate)===expected){bytes=candidate;console.log('Restored payload transport character; reviewed SHA256 exact');}}
await fs.writeFile(out+'/received.b64',parts.join(''));
if(sha(bytes)!==expected)throw Error('Payload hash mismatch '+sha(bytes));
const data=JSON.parse(inflateSync(bytes));if(data.base!=='0fc2f300b2694a9c3e516e34666d7e52e8a02d5b'||data.changes.length!==42)throw Error('Wrong manifest');
const verified=[];
for(const c of data.changes){
 if(c.path.includes('..')||path.isAbsolute(c.path)||!(/^(apps\/gaza\/|assets\/css\/mobile-projects.css$|start\/|cv\/|projects\/|skills\/gaza-geospatial-industrial-twin\/|apps\/rhb\/index.html$|README.md$|index.html$|\.github\/workflows\/gaza-mobile-qa.yml$)/.test(c.path)))throw Error('Out-of-scope path '+c.path);
 let text=c.content;
 if(c.before){const old=execFileSync('git',['show',`${data.base}:${c.path}`],{maxBuffer:4e6});if(blob(old)!==c.before)throw Error('Base mismatch '+c.path);let chars=Array.from(old.toString('utf8'));for(const [i,j,t]of [...c.spans].reverse()){if(i<0||j<i||j>chars.length)throw Error('Invalid splice');chars=chars.slice(0,i).concat(Array.from(t),chars.slice(j))}text=chars.join('');}
 const b=Buffer.from(text);if(blob(b)!==c.after)throw Error('Final bytes mismatch '+c.path);verified.push({...c,bytes:b});
}
for(const c of verified){await fs.mkdir(path.dirname(c.path),{recursive:true});await fs.writeFile(c.path,c.bytes)}
execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund'],{cwd:'apps/gaza',stdio:'inherit',timeout:120000});
const testFiles=['mobile-motion','live-ops','process-ledger','farm-stall-alignment','farm-life','company-demo','selfhost-engine','lab-detail','plant-detail','plant-stock','site-real-core'].map(n=>`tests/${n}.test.mjs`);
execFileSync('node',['--test',...testFiles],{cwd:'apps/gaza',stdio:'inherit',timeout:120000});
for(const c of verified.filter(c=>/\.m?js$/.test(c.path)))execFileSync('node',['--check',c.path],{stdio:'inherit',timeout:10000});
const token=process.env.GITHUB_TOKEN;if(!token)throw Error('Missing workflow token');
const report={base:data.base,head:process.env.GITHUB_SHA,payloadSha256:sha(bytes),files:[],refsChanged:false};
for(const c of verified){const r=await fetch(`https://api.github.com/repos/${repo}/git/blobs`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({content:c.bytes.toString('base64'),encoding:'base64'}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Blob upload '+r.status+' '+c.path);const result=await r.json();if(result.sha!==c.after)throw Error('Uploaded blob mismatch');report.files.push({path:c.path,sha:result.sha,before:c.before,sha256:sha(c.bytes),length:c.bytes.length});}
await fs.writeFile(out+'/verified-blobs.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
