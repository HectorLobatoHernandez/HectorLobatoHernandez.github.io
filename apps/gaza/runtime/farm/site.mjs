/** Manual roof/road interpretation of a georeferenced PNOA image. Not Catastro, a survey or a farm licence. */
export const ORIGIN=Object.freeze({lat:41.5013093,lon:-5.7585331});
export const RASTER=Object.freeze({bbox:[-5.762,41.498,-5.750,41.505],width:1600,height:1245,queriedAt:'2026-10-11T05:49:19Z',flightDate:null});
export const BOUNDARY='ZAMORA · recinto histórico fotointerpretado. Reconversión ganadera, alturas e interiores PROPUESTOS. Producción SIM agregada, no volumen real de GAZA.';
export const SOURCES=Object.freeze([
 {id:'photos',title:'Fotografías aportadas · marzo 2025 / mayo 2026',supports:'Fachadas ocres, zócalos azules, acceso, oficinas acristaladas, vallados y entorno.',limits:'No muestran interiores ganaderos, cotas ni actividad ganadera actual.'},
 {id:'pnoa',title:'PNOA Máxima Actualidad · IGN/CNIG',url:'https://pnoa.ign.es/pnoa-imagen/ortofotos-pnoa-maxima-actualidad',supports:'Ortofoto WMS consultada; contorno, cubiertas y ejes viales digitalizados manualmente.',limits:'Fecha de vuelo pendiente. Cubierta no equivale a huella catastral; alturas y titularidad no deducidas.'},
 {id:'historic',title:'Localización histórica enlazada por GAZA',url:'https://www.lechegaza.com/contacto.html',supports:'El enlace antiguo de ubicación remite a Almaraz 1, Zamora; la dirección de contacto actual es Coreses.',limits:'El marcador no es centro geodésico de parcela ni acceso medido.'},
 {id:'network',title:'GAZA · Nuestros Ganaderos',url:'https://www.lechegaza.com/ganaderos.html',supports:'Más de 80 ganaderías; cuidados, espacio, cama y comedero de vacas frisonas.',limits:'No publica aquí censo individual, reparto vacuno/ovino ni producción consolidada actual.'},
 {id:'fao',title:'FAO/FIL · Buenas prácticas en explotaciones lecheras',url:'https://www.fao.org/4/ba0027s/ba0027s00.htm',supports:'Sanidad, ordeño, alimentación/agua, bienestar, medio ambiente y gestión.',limits:'Referencia general, no SOP ni diseño aprobado de GAZA.'},
 {id:'heritage',title:'Turismo Zamora · Castillo y murallas',url:'https://turismo-zamora.com/el-castillo-y-las-murallas-de-zamora.html',supports:'Castillo, planta romboidal y relación visual con catedral y entorno.',limits:'Reconstrucciones volumétricas simplificadas; elevaciones no LiDAR.'}
]);
export function pixelLonLat([px,py]){return [RASTER.bbox[0]+px/RASTER.width*(RASTER.bbox[2]-RASTER.bbox[0]),RASTER.bbox[3]-py/RASTER.height*(RASTER.bbox[3]-RASTER.bbox[1])];}
export function local([lon,lat]){const rad=Math.PI/180,R=6378137;return [(lon-ORIGIN.lon)*rad*R*Math.cos(ORIGIN.lat*rad),-(lat-ORIGIN.lat)*rad*R];}
export const point=p=>local(pixelLonLat(p));
export const PARCEL=Object.freeze([[152,637],[187,619],[344,578],[485,540],[592,515],[607,571],[625,666],[647,752],[646,774],[625,794],[343,876],[318,872],[287,854],[245,796],[191,716],[163,672]]);
const roof=(id,title,corners,height,station,kind)=>Object.freeze({id,title,corners,height,station,kind,geometry:'MANUALLY_DIGITIZED_ROOF_PNOA',heightQuality:'ESTIMATED_NOT_LIDAR',use:'VIRTUAL_RECONVERSION'});
export const BUILDINGS=Object.freeze([
 roof('bovine','Nave histórica longitudinal · vacuno SIM',[[351,610],[515,566],[523,602],[360,640]],6.0,1,'shed'),
 roof('ovine','Nave posterior · ovino SIM',[[361,641],[451,618],[464,662],[374,683]],5.5,2,'shed'),
 roof('office','Oficinas históricas · recepción SIM',[[532,555],[557,548],[563,572],[538,579]],8.0,0,'office'),
 roof('veterinary','Anexo oriental · sanidad SIM',[[582,577],[595,574],[602,596],[588,600]],4.4,5,'shed'),
 roof('milking','Edificio de patio · ordeño SIM',[[547,613],[575,605],[584,633],[555,642]],5.0,3,'shed'),
 roof('cold','Anexos de proceso · refrigeración SIM',[[488,609],[504,605],[512,626],[497,631]],4.6,4,'shed'),
 roof('feed','Anexo posterior · alimento y material SIM',[[583,690],[602,685],[611,713],[591,720]],4.0,1,'shed')
]);
export const ROADS=Object.freeze([
 {id:'north',name:'ZA-P-2223 / Urb. Villalobos',width:8,points:[[20,648],[75,639],[147,618],[242,593],[415,548],[581,503],[614,501],[642,493]]},
 {id:'west',name:'C. Rosa Chacel',width:9,points:[[131,668],[163,706],[222,791],[280,869],[304,905],[312,978],[318,1190]]},
 {id:'south',name:'C. Almena',width:9,points:[[338,900],[425,875],[571,837],[669,810]]},
 {id:'east',name:'C. Almaraz / corredor N-122',width:10,points:[[604,335],[618,447],[644,518],[660,645],[681,736],[701,773],[707,840],[671,900],[663,969],[686,1056],[756,1131],[920,1172],[1120,1181]]}
]);
export const ROUNDABOUTS=Object.freeze([{center:[103,635],radius:27},{center:[305,918],radius:27},{center:[708,805],radius:28}]);
export const COURTYARD=Object.freeze([[512,534],[530,580],[541,621],[543,658],[515,666],[481,664],[470,650]]);
export const PADDOCKS=Object.freeze([
 {id:'cow-yard',species:'BOVINE',corners:[[173,645],[332,603],[350,678],[244,710],[222,716]]},
 {id:'sheep-yard',species:'OVINE',corners:[[252,732],[349,704],[370,806],[310,822]]},
 {id:'green-reserve',species:null,corners:[[397,719],[526,685],[544,792],[409,831]]}
]);
export const LANDMARKS=Object.freeze({castle:{center:[782,930],corners:[[725,890],[817,868],[838,966],[712,1003]],height:14,ground:21},cathedral:{center:[956,1052],height:20,ground:22}});
export function frame(building){const ps=building.corners.map(point),x=ps.reduce((v,p)=>v+p[0],0)/ps.length,z=ps.reduce((v,p)=>v+p[1],0)/ps.length;return {x,z,w:Math.hypot(ps[1][0]-ps[0][0],ps[1][1]-ps[0][1]),d:Math.hypot(ps.at(-1)[0]-ps[0][0],ps.at(-1)[1]-ps[0][1]),yaw:Math.atan2(ps[0][1]-ps[1][1],ps[1][0]-ps[0][0])};}
export function areaM2(ring){const ps=ring.map(point);return Math.abs(ps.reduce((a,p,i)=>{const q=ps[(i+1)%ps.length];return a+p[0]*q[1]-q[0]*p[1]},0))/2;}
export function pointOnRoute(route,progress){if(!Array.isArray(route)||route.length<2||route.some(p=>p.length!==2||p.some(n=>!Number.isFinite(n))))throw Error('Ruta inválida');const t=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0)),len=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1]));let rest=t*len.reduce((a,b)=>a+b,0);for(let i=0;i<len.length;i++){if(rest<=len[i]||i===len.length-1){const k=len[i]?Math.min(1,rest/len[i]):0;return {position:[route[i][0]+(route[i+1][0]-route[i][0])*k,route[i][1]+(route[i+1][1]-route[i][1])*k],yaw:Math.atan2(-(route[i+1][1]-route[i][1]),route[i+1][0]-route[i][0])}}rest-=len[i]}}
export function toGeoJSON(){const poly=(id,title,r,extra={})=>({type:'Feature',properties:{id,title,provenance:'PNOA_MANUAL_INTERPRETATION',...extra},geometry:{type:'Polygon',coordinates:[[...r,r[0]].map(pixelLonLat)]}});return {type:'FeatureCollection',name:'GAZA historic Zamora reference and proposed farm',attribution:'PNOA / IGN-CNIG; digitización manual propia. No Catastro ni levantamiento.',sourceRaster:RASTER,features:[poly('site','Contorno observado aproximado',PARCEL,{legalBoundary:false}),...BUILDINGS.map(b=>poly(b.id,b.title,b.corners,{height:b.height,heightQuality:b.heightQuality,use:b.use})),...ROADS.map(r=>({type:'Feature',properties:{id:r.id,title:r.name,width:r.width,widthQuality:'INFERRED',provenance:'PNOA_MANUAL_INTERPRETATION'},geometry:{type:'LineString',coordinates:r.points.map(pixelLonLat)}}))]};}
export const STATION_INFO=Object.freeze([
 ['Recepción y bioseguridad','Edificio de oficinas históricas','Acceso peatonal, registro de tarea, vestuario y entrada controlada.','No registra personas reales.'],
 ['Vacuno, alimentación y agua','Nave longitudinal y corral propuesto','Cubículos, cama, comederos, bebederos y grupos de vacas. Alimentación ligada a FARM.FEED.','Animales visibles: símbolos, no censo real.'],
 ['Ovino y lotes separados','Nave posterior y corral propuesto','Comederos bajos, agua, zonas de descanso y circulación hacia ordeño de ovejas.','El circuito ovino no se mezcla con vacuno.'],
 ['Ordeño y limpieza','Edificio del patio oriental','Puestos de espera, identificación, ordeño, colectores y limpieza del recurso.','Programa y duración comprimidos de Procesos V2; no SOP.'],
 ['Tanques de frío','Anexos centrales','Dos depósitos por especie; cantidad y estado del recurso según registro común.','No se inventan temperaturas medidas ni capacidad instalada.'],
 ['Sanidad y segregación','Anexo oriental propuesto','Revisión ficticia, restricción de aportación y recipiente segregado fuera de circuito comercial.','Sin diagnóstico veterinario ni tratamiento real.'],
 ['Muestreo y recogida','Patio y acceso histórico','Muestra de origen, compartimento compatible, carga y salida a Coreses.','Trayecto local propuesto; no ruta vial completa o ETA real.']
]);
