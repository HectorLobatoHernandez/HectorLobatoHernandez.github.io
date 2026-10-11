/** Site Real geometry and movement contracts. No Three.js or network dependencies. */
export const ORIGIN = Object.freeze({lat:41.52355,lon:-5.59993,status:'APPROXIMATE_NOT_SURVEYED'});
const R=6378137, DEG=Math.PI/180;
export function project(lon,lat,origin=ORIGIN){
  if(!Number.isFinite(lon)||!Number.isFinite(lat)||Math.abs(lon)>180||Math.abs(lat)>90)throw new Error('Coordenada WGS84 inválida');
  return [(lon-origin.lon)*DEG*R*Math.cos(origin.lat*DEG),(lat-origin.lat)*DEG*R];
}
export function unproject(east,north,origin=ORIGIN){return [origin.lon+east/(R*Math.cos(origin.lat*DEG))/DEG,origin.lat+north/R/DEG]}
export function numericTag(value){
  if(typeof value==='number')return Number.isFinite(value)&&value>0?value:null;
  const s=String(value??'').trim();if(!/^\d+(?:\.\d+)?\s*(?:m)?$/.test(s))return null;
  const n=parseFloat(s);return Number.isFinite(n)&&n>0?n:null;
}
export function heightFor(tags={}){
  const h=numericTag(tags.height);if(h&&h<=150)return {meters:h,source:'OSM_ATTRIBUTE'};
  const levels=numericTag(tags['building:levels']);if(levels&&levels<=40)return {meters:levels*3,source:'INFERRED_FROM_LEVELS'};
  return {meters:tags.building==='industrial'?10:6,source:'SIMULATED_HEIGHT'};
}
export function widthFor(tags={}){
  const w=numericTag(tags.width);if(w&&w<=50)return {meters:w,source:'OSM_ATTRIBUTE'};
  const widths={motorway:14,trunk:10,primary:8,secondary:7,tertiary:6.5,residential:6,service:5,track:3,footway:1.6,path:1.5};
  return {meters:widths[tags.highway]??5,source:'INFERRED_WIDTH'};
}
function cleanLine(coords){
  if(!Array.isArray(coords)||coords.length<2)return null;
  const points=[];
  for(const c of coords){if(!Array.isArray(c)||c.length<2)return null;let p;try{p=project(c[0],c[1])}catch{return null}if(!points.length||Math.hypot(p[0]-points.at(-1)[0],p[1]-points.at(-1)[1])>.001)points.push(p)}
  return points.length>=2?points:null;
}
function near(points,radius){return points.some(([x,y])=>Math.hypot(x,y)<=radius)||points.some((p,i)=>{if(!i)return false;const q=points[i-1],dx=p[0]-q[0],dy=p[1]-q[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,-(q[0]*dx+q[1]*dy)/d)):0;return Math.hypot(q[0]+t*dx,q[1]+t*dy)<=radius})}
export function normalizeGeoJSON(fc,{radius=2200,source='IMPORTED_GEOJSON'}={}){
  if(fc?.type!=='FeatureCollection'||!Array.isArray(fc.features)||fc.features.length>30000)throw new Error('GeoJSON FeatureCollection inválido o demasiado grande');
  const roads=[],buildings=[];let rejected=0;
  for(const [index,f] of fc.features.entries()){
    const p=f?.properties??{},tags={...(p.tags&&typeof p.tags==='object'?p.tags:{}),...p},g=f?.geometry;
    const id=String(f?.id??p['@id']??p.id??`import-${index}`),name=String(tags.name??id);
    if(tags.highway&&['LineString','MultiLineString'].includes(g?.type)){
      const parts=g.type==='LineString'?[g.coordinates]:g.coordinates;
      if(!Array.isArray(parts)){rejected++;continue}
      for(const [i,c] of parts.entries()){const line=cleanLine(c);if(!line||!near(line,radius)){rejected++;continue}roads.push({id:id+':'+i,name,tags,points:line,width:widthFor(tags),geometrySource:source})}
    }else if(tags.building&&['Polygon','MultiPolygon'].includes(g?.type)){
      const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;
      if(!Array.isArray(polygons)){rejected++;continue}
      for(const [i,rings] of polygons.entries()){
        if(!Array.isArray(rings)||!rings.length){rejected++;continue}
        const lines=rings.map(cleanLine);if(lines.some(l=>!l||l.length<4||Math.hypot(l[0][0]-l.at(-1)[0],l[0][1]-l.at(-1)[1])>.05)||!near(lines[0],radius)){rejected++;continue}
        buildings.push({id:id+':'+i,name,tags,rings:lines,height:heightFor(tags),geometrySource:source});
      }
    }else rejected++;
  }
  return {roads,buildings,rejected,source,original:fc,axes:'X_EAST_Y_UP_Z_SOUTH',anchor:ORIGIN};
}
export function overpassToGeoJSON(data){
  if(!Array.isArray(data?.elements))throw new Error('Respuesta Overpass inválida');
  const features=[];
  for(const e of data.elements){if(e.type!=='way'||!Array.isArray(e.geometry))continue;const coords=e.geometry.map(p=>[p.lon,p.lat]),closed=coords.length>3&&coords[0][0]===coords.at(-1)[0]&&coords[0][1]===coords.at(-1)[1];features.push({type:'Feature',id:'way/'+e.id,properties:{...e.tags,source:'OpenStreetMap',osmId:e.id},geometry:e.tags?.building&&closed?{type:'Polygon',coordinates:[coords]}:{type:'LineString',coordinates:coords}})}
  return {type:'FeatureCollection',source:'OpenStreetMap contributors / Overpass',capturedAt:new Date().toISOString(),features};
}
/** Flat ribbon, joins clamped at 2x half-width; original centerline is never spline-smoothed. */
export function ribbon(points,width){
  const positions=[],indices=[],half=width/2;
  for(let i=0;i<points.length;i++){
    const a=points[Math.max(0,i-1)],b=points[i],c=points[Math.min(points.length-1,i+1)];
    let d1=[b[0]-a[0],b[1]-a[1]],d2=[c[0]-b[0],c[1]-b[1]];
    if(i===0)d1=d2;if(i===points.length-1)d2=d1;
    const n1=Math.hypot(...d1)||1,n2=Math.hypot(...d2)||1;
    const p=[-d1[1]/n1,d1[0]/n1],q=[-d2[1]/n2,d2[0]/n2];let m=[p[0]+q[0],p[1]+q[1]],len=Math.hypot(...m);
    if(len<.001){m=q;len=1}m=m.map(v=>v/len);const scale=Math.min(half*2,half/Math.max(.5,Math.abs(m[0]*q[0]+m[1]*q[1])));
    positions.push(b[0]+m[0]*scale,.16,-b[1]-m[1]*scale,b[0]-m[0]*scale,.16,-b[1]+m[1]*scale);
    if(i<points.length-1){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2)}
  }
  return {positions,indices};
}
export function makePath(points){
  if(!Array.isArray(points)||points.length<2)throw new Error('Ruta vacía');
  const segments=[];let length=0;
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!Number.isFinite(len))throw new Error('Ruta no finita');if(len>.001){segments.push({a,b,start:length,len});length+=len}}
  if(!length)throw new Error('Ruta sin longitud');return {segments,length};
}
export function samplePath(path,distance){
  const d=Math.max(0,Math.min(path.length,distance)),s=path.segments.find(s=>d<=s.start+s.len)||path.segments.at(-1),t=(d-s.start)/s.len,dx=(s.b[0]-s.a[0])/s.len,dz=(s.b[1]-s.a[1])/s.len;
  return {x:s.a[0]+(s.b[0]-s.a[0])*t,z:s.a[1]+(s.b[1]-s.a[1])*t,yaw:Math.atan2(-dz,dx),tangent:[dx,dz]};
}
/** Demo task dwell: units are scene meters, seconds; stops never disappear on large timesteps. */
export function sampleTrip(path,elapsed,{speed=5,stops=[]}={}){
  let time=Math.max(0,elapsed),distance=0;
  for(const stop of [...stops,{distance:path.length,seconds:8,label:'Salida / retorno demo'}]){
    const target=Math.max(distance,Math.min(path.length,stop.distance)),travel=(target-distance)/speed;
    if(time<travel)return {...samplePath(path,distance+time*speed),distance:distance+time*speed,phase:'En tránsito',stopped:false};time-=travel;distance=target;
    if(time<stop.seconds)return {...samplePath(path,distance),distance,phase:stop.label,stopped:true};time-=stop.seconds;
  }
  return {...samplePath(path,path.length),distance:path.length,phase:'Ciclo terminado',stopped:true,complete:true};
}
export function readLedger(value){
  if(value?.schemaVersion!==1||value.provenance!=='SIMULATED'||!Number.isInteger(value.stage)||value.stage<0||value.stage>9||!['RUNNING','HOLD','COMPLETE'].includes(value.status)||typeof value.config?.lotId!=='string'||!Array.isArray(value.departments))return null;
  return {lotId:value.config.lotId,stage:value.stage,department:String(value.departments[value.stage]?.name??''),status:value.status,quality:String(value.quality??''),held:value.status==='HOLD'||value.quality==='ON_HOLD'};
}
