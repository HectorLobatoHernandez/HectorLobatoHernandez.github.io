// A dimensioned synthetic truck prototype in kilometre-scale scene units.
// It depicts a GAZA demonstration livery, never a known vehicle or carrier.
export function buildFleetTruck(T,{vehicle,logoMaterial,labelMaterial}){
 const g=new T.Group(),tank=vehicle.kind==='Recogida',parts=[],lights=[];
 g.name=vehicle.id+' · VEHÍCULO 3D SIM';g.userData.vehicle=vehicle;g.userData.provenance='SYNTHETIC_VEHICLE_DIMENSIONS_AND_LIVERY';
 const m={white:new T.MeshStandardMaterial({color:'#f4f7f4',roughness:.45,metalness:.03}),blue:new T.MeshStandardMaterial({color:'#1554a3',roughness:.48}),green:new T.MeshStandardMaterial({color:'#87b83f',roughness:.6}),dark:new T.MeshStandardMaterial({color:'#202e37',roughness:.85}),rim:new T.MeshStandardMaterial({color:'#b8c4ca',metalness:.75,roughness:.25}),steel:new T.MeshStandardMaterial({color:'#d8e0e2',metalness:.72,roughness:.28}),glass:new T.MeshPhysicalMaterial({color:'#537b94',metalness:.12,roughness:.12,transparent:true,opacity:.8}),head:new T.MeshStandardMaterial({color:'#fff6dc',emissive:'#fff0b1',emissiveIntensity:0}),tail:new T.MeshStandardMaterial({color:'#b5312e',emissive:'#e74234',emissiveIntensity:0})};
 function add(geo,mat,x,y,z,name,rot){const o=new T.Mesh(geo,mat);o.name=name;o.position.set(x,y,z);if(rot)o.rotation.set(...rot);o.castShadow=true;o.receiveShadow=true;g.add(o);parts.push(o);return o}
 const box=(name,size,pos,mat,rot)=>add(new T.BoxGeometry(...size),mat,...pos,name,rot);
 box('Bastidor', [.016,.00065,.0025],[-.0003,.00255,0],m.dark);
 box('Cabina · carrocería blanca',[.0043,.0032,.00285],[.00745,.0054,0],m.white);
 box('Cabina · techo aerodinámico',[.0034,.00042,.0029],[.007,.0072,0],m.blue);
 box('Parabrisas',[.00014,.00155,.00215],[.00967,.00595,0],m.glass);
 box('Calandra frontal',[.00018,.00075,.00165],[.00968,.0045,0],m.dark);
 for(const side of [-1,1]){
  const z=side*.00148;
  box('Ventanilla lateral '+side,[.00136,.00115,.00012],[.00795,.00605,z],m.glass);
  box('Retrovisor '+side,[.00055,.00072,.00018],[.00915,.00595,side*.00182],m.dark);
  box('Estribo '+side,[.0017,.00015,.00038],[.0061,.00345,side*.00145],m.rim);
  box('Faro '+side,[.00016,.00047,.00048],[.00973,.00413,side*.00092],m.head);
  box('Piloto trasero '+side,[.00015,.00046,.00054],[-.01035,.0037,side*.00105],m.tail);
  for(const x of [-.0083,-.0058,.0068]){
   add(new T.CylinderGeometry(.00065,.00065,.00037,12),m.dark,x,.00163,side*.00142,'Neumático '+x+' / '+side,[Math.PI/2,0,0]);
   add(new T.CylinderGeometry(.00028,.00028,.00039,12),m.rim,x,.00163,side*.00143,'Buje '+x+' / '+side,[Math.PI/2,0,0]);
  }
 }
 if(tank){
  box('Subchasis cisterna',[.0118,.0006,.0027],[-.003,.0032,0],m.blue);
  add(new T.CylinderGeometry(.00142,.00142,.0116,18),m.steel,-.003,.00515,0,'Tanque de acero SIM',[0,0,Math.PI/2]);
  for(const x of [-.0079,-.004,.0002])add(new T.TorusGeometry(.00143,.00008,6,18),m.blue,x,.00515,0,'Virola azul '+x,[0,Math.PI/2,0]);
  box('Escotilla superior',[.0014,.0002,.001],[-.002,.0067,0],m.dark);
 }else{
  box('Semirremolque blanco',[.0118,.00335,.003],[-.0036,.0057,0],m.white);
  box('Franja corporativa',[.0118,.00035,.00304],[-.0036,.00715,0],m.blue);
  box('Frío / módulo de carga SIM',[.00052,.00165,.0028],[.00252,.0057,0],m.rim);
  box('Puerta trasera',[.0002,.0028,.00265],[-.00961,.00565,0],m.rim);
 }
 for(const side of [-1,1]){
  const z=side*(tank?.00153:.00157),y=tank?.0053:.0059;
  box('Placa blanca de marca '+side,[.0057,.00184,.00008],[-.0037,y,z],m.white);
  const badge=add(new T.PlaneGeometry(.0054,.00162),labelMaterial,-.0037,y,z+side*.00006,'GAZA · OPERACIÓN SIM '+side,[0,side>0?0:Math.PI,0]);badge.castShadow=false;
  if(logoMaterial){const logo=add(new T.PlaneGeometry(.0034,.00115),logoMaterial,-.0042,y,z+side*.00012,'Logotipo GAZA '+side,[0,side>0?0:Math.PI,0]);logo.castShadow=false;logo.renderOrder=1}
 }
 // Only the inspected truck uses a real lamp; other trucks keep emissive lenses.
 const beam=new T.SpotLight('#fff1cc',0,.09,Math.PI/7,.65,2);beam.position.set(.0095,.0045,0);beam.target.position.set(.05,.001,0);g.add(beam,beam.target);lights.push(beam);
 function setNight(night,selected=false){m.head.emissiveIntensity=night?2.8:0;m.tail.emissiveIntensity=night?2.4:0;beam.intensity=night&&selected?12:0;beam.visible=night&&selected}
 setNight(false);return {group:g,parts,lights,setNight,dispose(){g.traverse(o=>{if(o.isMesh)o.geometry.dispose()});Object.values(m).forEach(x=>x.dispose());g.removeFromParent()}};
}
