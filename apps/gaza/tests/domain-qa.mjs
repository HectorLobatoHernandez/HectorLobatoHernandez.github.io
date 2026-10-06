import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const [ops,farms,adapters]=await Promise.all([
  read('data/public-operations-2026.json'),
  read('data/farm-network.json'),
  read('data/integration-adapters.json')
]);
const errors=[];
const hav=(a,b,c,d)=>{const R=6371,p=Math.PI/180,q=Math.sin((c-a)*p/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin((d-b)*p/2)**2;return 2*R*Math.asin(Math.sqrt(q))};
if(ops.water.maxAnnualM3!==380390||ops.water.maxInstantLs!==25.2||ops.water.meanEquivalentLs!==12.06)errors.push('official water values changed unexpectedly');
if(!ops.roads.some(x=>x.ref==='N-122'))errors.push('N-122 public road anchor missing');
if(!ops.operations.some(x=>x.id==='gazacontrol'&&x.status==='CONFIRMED'))errors.push('GAZACONTROL evidence missing');
if(ops.operations.find(x=>x.id==='wau')?.detail.includes('uses Dynamics'))errors.push('WAU evidence overclaims Gaza product use');
if(ops.leadership.some(x=>Object.keys(x).some(k=>/^(lat|lon|latitude|longitude|gps)$/i.test(k))))errors.push('leadership must not contain live/exact location coordinates');

const ids=new Set(farms.nodes.map(x=>x.id));
for(const n of farms.nodes){
 const km=hav(farms.plant.lat,farms.plant.lon,n.lat,n.lon);
 if(km>farms.publicConstraint.radiusKm+0.5)errors.push(n.id+' lies outside public <50 km design boundary: '+km.toFixed(1));
 if(n.kind==='CONFIRMED_SUPPLIER_PUBLIC'&&!/NOT_FARM_PIN/.test(n.precision))errors.push(n.id+' confirmed supplier must not imply exact farm pin');
}
for(const loop of farms.candidateLoops)for(const id of loop.nodeIds)if(!ids.has(id))errors.push(loop.id+' references missing node '+id);
if(!farms.nodes.some(x=>x.id==='sat-rote'&&x.kind==='CONFIRMED_SUPPLIER_PUBLIC'))errors.push('SAT ROTE confirmed public supplier reference missing');

for(const a of adapters.adapters){
 if(a.writes!=='DISABLED')errors.push(a.id+' writes must remain disabled in discovery');
 if(!Array.isArray(a.unknown)||!a.unknown.length)errors.push(a.id+' must document unknowns');
}
if(!adapters.rules.some(x=>x.includes('No browser-to-PLC')))errors.push('browser control boundary missing');

const report={checkedAt:new Date().toISOString(),farmNodes:farms.nodes.length,candidateLoops:farms.candidateLoops.length,systems:ops.operations.length,leadership:ops.leadership.length,adapters:adapters.adapters.length,errors};
await fs.mkdir(path.join(root,'.qa'),{recursive:true});await fs.writeFile(path.join(root,'.qa','domain-report.json'),JSON.stringify(report,null,2));
if(errors.length){console.error(JSON.stringify(report,null,2));process.exit(2)}
console.log('GAZA domain QA OK:',report);
