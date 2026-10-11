import {point} from './site.mjs';
/** Rendering corrections only. Heights/relief and roof finishes remain interpretations, not surveyed data. */
export function refineFarmWorld(T,world){
 let shadowCorrections=0;
 const matrix=new T.Matrix4(),p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();
 world.root.traverse(o=>{
  if(!o.isMesh)return;
  if([].concat(o.material||[]).some(m=>m.transparent&&m.opacity===0)){o.castShadow=false;o.receiveShadow=false;shadowCorrections++;return;}
  // Ground slabs and road strips receive shadows but must not self-shadow at terrain precision.
  const g=o.geometry;
  if(!o.isInstancedMesh){g?.computeBoundingBox();const b=g?.boundingBox;
   if(b&&(b.max.y-b.min.y)*o.scale.y<.46){o.castShadow=false;shadowCorrections++;}
  }else{
   let onlyGround=true;
   for(let i=0;i<o.count&&onlyGround;i++){o.getMatrixAt(i,matrix);matrix.decompose(p,q,s);onlyGround=p.y<.5&&s.y<=1.1;}
   if(onlyGround){o.castShadow=false;shadowCorrections++;}
  }
 });
 // Replace the cylinder prototype with an irregular stepped relief clear of the eastern street.
 const previous=world.context.children.find(o=>o.geometry?.type==='CylinderGeometry'&&o.geometry.parameters.radiusTop===118);
 if(previous)previous.visible=false;
 const ring=[[689,900],[730,858],[826,834],[925,900],[1049,987],[1081,1092],[997,1160],[874,1099],[789,1042],[684,1035]].map(point);
 const center=ring.reduce((a,b)=>[a[0]+b[0]/ring.length,a[1]+b[1]/ring.length],[0,0]);
 const slope=1.06,low=ring.map(a=>[center[0]+(a[0]-center[0])*slope,center[1]+(a[1]-center[1])*slope]);
 const verts=[],indices=[];ring.forEach(([x,z])=>verts.push(x,21,z));low.forEach(([x,z])=>verts.push(x,.1,z));
 const n=ring.length,shape=ring.map(([x,z])=>new T.Vector2(x,-z));
 const tri=T.ShapeUtils.triangulateShape(shape,[]);tri.forEach(t=>indices.push(...t));
 for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,n+i,j,j,n+i,n+j)}
 const reliefGeometry=new T.BufferGeometry();reliefGeometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));reliefGeometry.setIndex(indices);reliefGeometry.computeVertexNormals();
 const relief=new T.Mesh(reliefGeometry,new T.MeshStandardMaterial({color:0x909572,roughness:1,side:T.DoubleSide}));relief.name='PROPOSED_RELIEF_NOT_LIDAR';relief.receiveShadow=true;relief.castShadow=false;world.context.add(relief);
 // Ortho shows mixed finishes on the long shed. Boundaries below are qualitative approximations.
 const b=world.buildings.get('bovine'),f=b.f,x0=-f.w*.2,x1=f.w*.4,h=b.height;
 const rv=[x0,h+.04,-f.d/2,x1,h+.04,-f.d/2,x1,h+1.84,0,x0,h+1.84,0,x0,h+.04,f.d/2,x1,h+.04,f.d/2];
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rv,3));rg.setIndex([0,2,1,0,3,2,3,5,2,3,4,5]);rg.computeVertexNormals();
 const finish=new T.Mesh(rg,new T.MeshStandardMaterial({color:0x929b94,roughness:.86,side:T.DoubleSide}));finish.receiveShadow=true;finish.castShadow=false;b.roof.add(finish);
 const office=world.buildings.get('office');office.roof.traverse(o=>{if(o.material?.color)o.material.color.setHex(0xadb1a5)});
 let signsFixed=0;
 function resolveSigns(){if(signsFixed===3)return;signsFixed=0;for(const building of world.buildings.values())for(const o of building.walls.children)if(o.geometry?.type==='PlaneGeometry'&&o.material?.map){o.rotation.y=o.position.z<0?Math.PI:0;o.castShadow=false;signsFixed++;}}
 resolveSigns();
 return {resolveSigns,snapshot:()=>({shadowCorrections,signsFixed,relief:'PROPOSED_NOT_LIDAR',roof:'MIXED_FINISH_INTERPRETATION'})};
}
