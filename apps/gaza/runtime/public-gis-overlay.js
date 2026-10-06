import * as THREE from 'three';

const R=6378137;
const DEFAULT_ORIGIN=[41.52355,-5.59993];
const ROAD_CLASSES=new Set(['motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','unclassified','residential','service','living_street']);

function localXZ(lat,lon,origin=DEFAULT_ORIGIN){
  const lat0=origin[0]*Math.PI/180;
  return [(lon-origin[1])*Math.PI/180*R*Math.cos(lat0),(lat-origin[0])*Math.PI/180*R];
}
function cleanRing(points){
  if(!Array.isArray(points))return [];
  const out=points.map(p=>[Number(p[0]),Number(p[1])]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
  if(out.length>2&&out[0][0]===out.at(-1)[0]&&out[0][1]===out.at(-1)[1])out.pop();
  return out;
}
function parseHeight(tags={}){
  const h=Number.parseFloat(String(tags.height||'').replace(',','.'));
  if(Number.isFinite(h)&&h>1&&h<80)return h;
  const levels=Number.parseFloat(tags['building:levels']);
  if(Number.isFinite(levels)&&levels>0&&levels<20)return Math.max(3.2,levels*3.2);
  return 5;
}
function overpassUrl(origin,radiusM){
  const [lat,lon]=origin;
  const q='[out:json][timeout:25];(way(around:'+radiusM+','+lat+','+lon+')[highway];way(around:'+radiusM+','+lat+','+lon+')[building];way(around:'+radiusM+','+lat+','+lon+')[landuse=industrial];);out geom;';
  return 'https://overpass-api.de/api/interpreter?data='+encodeURIComponent(q);
}
function featureFromOsm(e,origin){
  if(!Array.isArray(e.geometry)||e.geometry.length<2)return null;
  const tags=e.tags||{};let kind=null;
  if(tags.highway)kind='road';
  else if(tags.building)kind=/gaza/i.test(String(tags.name||''))||/gaza/i.test(String(tags.operator||''))?'factory_osm_candidate':'building';
  else if(tags.landuse==='industrial')kind=/gaza/i.test(String(tags.name||''))||/gaza/i.test(String(tags.operator||''))?'factory_osm_candidate':'industrial';
  if(!kind)return null;
  const pts=e.geometry.map(p=>localXZ(p.lat,p.lon,origin));
  return {type:'Feature',properties:{kind,osmType:e.type,osmId:e.id,tags,sourceClass:'PUBLIC_REFERENCE',geometryPolicy:kind==='road'?'OSM_PUBLIC_GEOMETRY':'OSM_CONTEXT_NOT_AS_BUILT'},localXZ:kind==='road'?pts:[pts]};
}
function addRoad(group,f,report){
  const pts=(f.localXZ||[]).map(p=>new THREE.Vector3(Number(p[0]),.35,Number(p[1]))).filter(v=>Number.isFinite(v.x)&&Number.isFinite(v.z));
  if(pts.length<2)return;
  const t=f.properties?.tags||{},major=['motorway','trunk','primary'].includes(t.highway),secondary=['secondary','tertiary'].includes(t.highway);
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],vx=b.x-a.x,vz=b.z-a.z,den=vx*vx+vz*vz,tt=den?Math.max(0,Math.min(1,-(a.x*vx+a.z*vz)/den)):0,x=a.x+vx*tt,z=a.z+vz*tt,d=Math.hypot(x,z);if(d<(report.nearestRoadDistanceM??Infinity)){report.nearestRoadDistanceM=d;report.nearestRoad={ref:t.ref||null,name:t.name||null,highway:t.highway||null,localXZ:[Number(x.toFixed(2)),Number(z.toFixed(2))]}}}
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:major?0x35a7ff:secondary?0x78c5ff:0x8b9bad,transparent:true,opacity:major?.95:.72,depthTest:false}));
  line.name='OSM road · '+(t.ref||t.name||t.highway||f.properties?.osmId||'way');
  line.userData={type:'gis-reference',kind:'OSM ROAD · PUBLIC REFERENCE',info:'Geometría viaria OSM en coordenadas locales. No prueba una ruta comercial real de GAZA.',provenance:'PUBLIC_REFERENCE'};
  group.add(line);report.roads++;if(ROAD_CLASSES.has(t.highway))report.hgvRoads++;
}
function addOutline(group,f,color,key,report){
  const ring=cleanRing(f.localXZ?.[0]);if(ring.length<3)return;
  const pts=ring.map(p=>new THREE.Vector3(p[0],.28,p[1]));pts.push(pts[0].clone());
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color,transparent:true,opacity:.82,depthTest:false}));
  line.name='OSM '+key+' · '+(f.properties?.tags?.name||f.properties?.osmId||'polygon');
  line.userData={type:'gis-reference',kind:'OSM '+key.toUpperCase()+' · PUBLIC REFERENCE',info:'Contorno OSM de contexto; no es as-built.',provenance:'PUBLIC_REFERENCE'};
  group.add(line);report[key]++;
}
function addBuilding(group,f,clickable,report){
  const ring=cleanRing(f.localXZ?.[0]);if(ring.length<3)return;
  const shape=new THREE.Shape();shape.moveTo(ring[0][0],ring[0][1]);for(let i=1;i<ring.length;i++)shape.lineTo(ring[i][0],ring[i][1]);shape.closePath();
  const height=parseHeight(f.properties?.tags),geom=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1});
  geom.rotateX(Math.PI/2);geom.translate(0,height,0);
  const candidate=f.properties?.kind==='factory_osm_candidate';
  const mesh=new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:candidate?0xff733b:0xe6b83d,roughness:.86,metalness:.03,transparent:true,opacity:candidate?.32:.18,depthWrite:false}));
  mesh.name=(candidate?'GAZA OSM candidate':'OSM building')+' · '+(f.properties?.tags?.name||f.properties?.osmId||'footprint');
  mesh.userData={type:'gis-reference',kind:candidate?'OSM GAZA CANDIDATE · NOT AS-BUILT':'OSM BUILDING · CONTEXT',info:'Footprint público extruido; CAD/topografía autorizados prevalecen.',provenance:'PUBLIC_REFERENCE'};
  group.add(mesh);clickable?.push(mesh);report.buildings++;if(candidate)report.factoryCandidates++;
}
function render(features,group,clickable,report){
  for(const f of features||[]){
    const k=f.properties?.kind;
    if(k==='road')addRoad(group,f,report);
    else if(k==='building'||k==='factory_osm_candidate')addBuilding(group,f,clickable,report);
    else if(k==='industrial')addOutline(group,f,0x6fcf78,'industrial',report);
  }
}
function clear(group){while(group.children.length)group.remove(group.children[0]);}

export async function loadPublicGisOverlay({group,clickable=[],qaMode=false,origin=DEFAULT_ORIGIN,radiusM=900,fixtureUrl='data/campus-gis-qa-fixture.json',onStatus=()=>{}}={}){
  if(!group)throw new Error('GIS overlay group is required');
  const report={schemaVersion:2,state:'loading',mode:qaMode?'QA_FIXTURE':'OSM_LIVE',origin,radiusM,roads:0,hgvRoads:0,buildings:0,industrial:0,factoryCandidates:0,nearestRoadDistanceM:null,nearestRoad:null,sourceClass:qaMode?'QA_FIXTURE':'PUBLIC_REFERENCE',geometryPolicy:'OSM_CONTEXT_NOT_AS_BUILT',promotionStatus:'COMPARISON_ONLY_NOT_AUTHORITY'};
  window.__GAZA_PUBLIC_GIS_3D__=report;onStatus(report);clear(group);
  try{
    let features=[];
    if(qaMode){
      const r=await fetch(fixtureUrl,{cache:'no-store'});if(!r.ok)throw new Error('fixture HTTP '+r.status);features=(await r.json()).features||[];
    }else{
      const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),9000);
      const r=await fetch(overpassUrl(origin,radiusM),{cache:'no-store',signal:ctrl.signal});clearTimeout(timer);if(!r.ok)throw new Error('Overpass HTTP '+r.status);
      features=((await r.json()).elements||[]).map(e=>featureFromOsm(e,origin)).filter(Boolean);
    }
    render(features,group,clickable,report);report.state='ready';report.features=features.length;if(Number.isFinite(report.nearestRoadDistanceM))report.nearestRoadDistanceM=Number(report.nearestRoadDistanceM.toFixed(2));report.updatedAt=new Date().toISOString();
  }catch(error){report.state='unavailable';report.error=String(error?.message||error);report.updatedAt=new Date().toISOString();}
  window.__GAZA_PUBLIC_GIS_3D__=report;onStatus(report);return report;
}
