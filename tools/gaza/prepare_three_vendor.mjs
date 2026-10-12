#!/usr/bin/env node
/** One-off preparation: fixed upstream package, fixed hashes, Git blobs only. No ref update. */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const REPO='HectorLobatoHernandez/HectorLobatoHernandez.github.io';
if(process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_REF!=='refs/heads/fix/gaza-dossier-demo-entry-20261012')throw Error('Preparation is restricted to the reviewed repository and feature branch');
const token=process.env.GITHUB_TOKEN;if(!token)throw Error('Missing workflow token');
const files={
 'build/three.module.min.js':['e2b5ee6bccd38fd6d8a2428546b83c5f2426d84b152ef82be8055556e3b40eb6','20d3c112761a519c7780a5ccc9f72a40937fa83b'],
 'build/three.core.min.js':['61ba0df005b05991361d040d8ff670e1aadfd0ce7aeebd1fdb0725957a8957de','70c40977daa0f6e1e312c6b58e9bfe49cb5a87a4'],
 'examples/jsm/controls/OrbitControls.js':['b97879c748170baadeb3fb84cea1ffdf4674e283dc06042f34e2acb95a76042c','eea26706dae735dade19367026185f6e68f5cf55'],
 'examples/jsm/loaders/GLTFLoader.js':['67ac5551fdafa6e349bd80c8f8e5e39c136d6b2fb1ad647db9abb21dc86f9e4a','38f8c14fb500631f01d39cd54c202eefddcf0987'],
 'examples/jsm/utils/BufferGeometryUtils.js':['fda7e946b8e0b5ab39b779206589e7a1079a22eb24efb89d7223e03fdfb1f751','c84dc7b2bbc99849373e17a6efae609e326f9536'],
 'LICENSE':['bfe119ea4fd413f5f7ca3fcd63adb0c4a073ed39daa2fe7d3e6b769e21272601','cf781430404b0ae0ba7d8dea3457a3515dd7c9b9']
};
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'gaza-three-r180-'));
const output=path.resolve('.qa/three-vendor');await fs.mkdir(output,{recursive:true});
try{
 const packed=JSON.parse(execFileSync('npm',['pack','three@0.180.0','--ignore-scripts','--json','--pack-destination',temp],{encoding:'utf8',timeout:90000}));
 if(packed.length!==1||packed[0].name!=='three'||packed[0].version!=='0.180.0'||packed[0].filename!=='three-0.180.0.tgz')throw Error('Unexpected package metadata');
 execFileSync('tar',['-xzf',path.join(temp,packed[0].filename),'-C',temp,...Object.keys(files).map(f=>'package/'+f)],{timeout:20000});
 const verified=[];
 for(const [name,[expectedHash,expectedBlob]] of Object.entries(files)){
  const bytes=await fs.readFile(path.join(temp,'package',name));
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const gitBlob=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
  if(sha256!==expectedHash||gitBlob!==expectedBlob)throw Error('Unexpected upstream bytes: '+name);
  verified.push({name,bytes,sha256,gitBlob});
 }
 // Do not publish partial or unverified package bytes. All six files pass before any upload.
 const report={package:'three',version:'0.180.0',license:'MIT',source:'https://registry.npmjs.org/three/-/three-0.180.0.tgz',integrity:packed[0].integrity,head:process.env.GITHUB_SHA,files:[],refUpdated:false};
 for(const f of verified){
  const res=await fetch(`https://api.github.com/repos/${REPO}/git/blobs`,{method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({content:f.bytes.toString('base64'),encoding:'base64'}),signal:AbortSignal.timeout(30000)});
  if(!res.ok)throw Error(`Git blob upload failed: ${res.status} (${f.name})`);
  const data=await res.json();if(data.sha!==f.gitBlob)throw Error('Returned blob hash mismatch');
  report.files.push({path:'apps/gaza/vendor/three-r180/'+f.name,sha:data.sha,sha256:f.sha256,bytes:f.bytes.length});
 }
 await fs.writeFile(path.join(output,'verified-blobs.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}finally{await fs.rm(temp,{recursive:true,force:true})}
