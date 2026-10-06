import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('.');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const [ops,farms,adapters,geo,eventSchema,mapping,site,campusOps,envField]=await Promise.all([
  read('data/public-operations-2026.json'),
  read('data/farm-network.json'),
  read('data/integration-adapters.json'),
  read('data/geospatial-baseline.json'),
  read('data/canonical-event.schema.json'),
  read('data/integration-mapping-template.json'),
  read('data/site-reference.json'),
  read('data/campus-operations-contract.json'),
  read('data/environment-field-contract.json')
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
if(geo.crs?.interchange!=='EPSG:4326'||geo.crs?.metricRecommended!=='EPSG:25830')errors.push('GIS CRS contract changed unexpectedly');
const sameAnchor=(a,b)=>Math.abs(Number(a?.lat)-Number(b?.lat))<1e-9&&Math.abs(Number(a?.lon)-Number(b?.lon))<1e-9;
if(site.site?.status!=='USER_CONFIRMED_APPROXIMATE'||site.site?.accuracy!=='APPROX_30M_NOT_SURVEYED')errors.push('canonical site provenance/accuracy changed');
if(!sameAnchor(site.site,geo.plant)||!sameAnchor(site.site,farms.plant))errors.push('plant anchor drift between canonical site, GIS and farm network');
if(Math.abs(site.site.lat-41.52355)>1e-9||Math.abs(site.site.lon+5.59993)>1e-9)errors.push('corrected factory anchor changed unexpectedly');
if(!site.deprecated?.some(x=>x.status==='DEPRECATED_WRONG_SITE_POINT'))errors.push('deprecated wrong anchor audit trail missing');
if(geo.routing?.network!=='OpenStreetMap'||!String(geo.routing?.engine||'').includes('OSRM'))errors.push('GIS routing provenance missing');
if(!geo.roadRefs?.some(x=>x.ref==='N-122'))errors.push('GIS N-122 anchor missing');
if(geo.signs?.some(x=>x.positionPolicy!=='CONTEXTUAL_UNTIL_GEOREFERENCED'))errors.push('road sign must remain contextual until georeferenced');
if(campusOps.accessModel?.gateStatus!=='UNKNOWN_UNTIL_AUTHORISED_SURVEY'||campusOps.accessModel?.gateCoordinates!==null)errors.push('campus access must remain candidate-only until authorised survey');
if(campusOps.manoeuvrePolicy?.outerRadiusM!==12.5||campusOps.manoeuvrePolicy?.innerRadiusM!==5.3)errors.push('HGV manoeuvre reference envelope changed unexpectedly');
if(!campusOps.vehicleDesignClasses?.some(x=>x.id==='ARTICULATED_16_5M'&&x.overallLengthM===16.5))errors.push('articulated design class missing');
if(envField.spatialField?.classification!=='DERIVED_VISUAL_FIELD_NOT_CFD')errors.push('environment field must remain explicitly non-CFD');
if(envField.proposedSensorNetwork?.classification!=='PROPOSED_NOT_INSTALLED'||envField.proposedSensorNetwork?.nodes?.length!==8)errors.push('proposed weather sensor network contract changed unexpectedly');
if(envField.controlBoundary?.writes!=='DISABLED')errors.push('environment field writes must remain disabled');
const requiredEvent=new Set(eventSchema.required||[]);for(const k of ['event_id','source','source_class','observed_at','entity_type','entity_id','event_type','quality','payload'])if(!requiredEvent.has(k))errors.push('canonical event missing required field '+k);
if(mapping.rows?.some(x=>x.writes!=='DISABLED'))errors.push('integration mapping contains enabled writes');
if(!mapping.rows?.some(x=>x.source==='GAZACONTROL')||!mapping.rows?.some(x=>String(x.source).includes('StorFast')))errors.push('integration mapping missing core authorities');

const report={checkedAt:new Date().toISOString(),farmNodes:farms.nodes.length,candidateLoops:farms.candidateLoops.length,systems:ops.operations.length,leadership:ops.leadership.length,adapters:adapters.adapters.length,roadRefs:geo.roadRefs?.length||0,integrationMappings:mapping.rows?.length||0,campusAccessPolicy:campusOps.accessModel?.status,hgvEnvelope:campusOps.manoeuvrePolicy,environmentSensors:envField.proposedSensorNetwork?.nodes?.length||0,environmentModel:envField.spatialField?.classification,errors};
await fs.mkdir(path.join(root,'.qa'),{recursive:true});await fs.writeFile(path.join(root,'.qa','domain-report.json'),JSON.stringify(report,null,2));
if(errors.length){console.error(JSON.stringify(report,null,2));process.exit(2)}
console.log('GAZA domain QA OK:',report);
