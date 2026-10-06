import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve('.');
const manifestPath=path.join(root,'assets','3d','manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const errors=[],allowed=new Set(['PUBLIC_REFERENCE','INFERRED_RECONSTRUCTION','SIMULATED']),ids=new Set();
if(manifest.schemaVersion!==1)errors.push('schemaVersion must be 1');
if(!Array.isArray(manifest.assets))errors.push('assets must be an array');

for(const a of manifest.assets||[]){
  if(!a?.id||typeof a.id!=='string')errors.push('asset missing id');
  else if(ids.has(a.id))errors.push('duplicate id: '+a.id);else ids.add(a.id);
  if(!allowed.has(a.provenance))errors.push((a.id||'?')+': invalid provenance');
  if(!a.license)errors.push((a.id||'?')+': missing license');
  if(!a.sourceUrl||!/^https:\/\//.test(a.sourceUrl))errors.push((a.id||'?')+': sourceUrl must be https');
  if(!a.path||/^(?:[a-z]+:|\/\/|data:)/i.test(a.path)||!/^assets\/3d\/[A-Za-z0-9_./-]+\.(?:glb|gltf)$/i.test(a.path))errors.push((a.id||'?')+': path must be local under assets/3d');
  if(!a.targetGroup)errors.push((a.id||'?')+': missing targetGroup');
  if(a.enabled!==false&&a.path){
    const file=path.join(root,a.path);
    try{
      const stat=await fs.stat(file);
      if(!stat.isFile()||stat.size<128)errors.push(a.id+': asset file is empty/invalid');
      if(/\.glb$/i.test(a.path)){
        const fh=await fs.open(file,'r'),buf=Buffer.alloc(12);await fh.read(buf,0,12,0);await fh.close();
        if(buf.toString('ascii',0,4)!=='glTF')errors.push(a.id+': invalid GLB magic');
        if(buf.readUInt32LE(4)!==2)errors.push(a.id+': unsupported GLB version '+buf.readUInt32LE(4));
      }
    }catch(e){errors.push(a.id+': enabled asset missing: '+a.path)}
  }
}
const report={checkedAt:new Date().toISOString(),assets:(manifest.assets||[]).length,enabled:(manifest.assets||[]).filter(a=>a.enabled!==false).length,errors};
await fs.mkdir(path.join(root,'.qa'),{recursive:true});
await fs.writeFile(path.join(root,'.qa','manifest-report.json'),JSON.stringify(report,null,2));
if(errors.length){console.error(JSON.stringify(report,null,2));process.exit(2)}
console.log('GAZA manifest QA OK:',report);
