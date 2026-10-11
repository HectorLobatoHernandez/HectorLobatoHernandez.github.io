import * as T from 'three';
function mergeGeometries(parts){
 const result=new T.BufferGeometry();
 for(const name of ['position','normal','uv','color']){
  const size=parts[0].attributes[name].itemSize,total=parts.reduce((n,g)=>n+g.attributes[name].array.length,0),data=new Float32Array(total);let offset=0;
  for(const g of parts){if(g.attributes[name].itemSize!==size)throw Error('Atributos incompatibles');data.set(g.attributes[name].array,offset);offset+=g.attributes[name].array.length;}
  result.setAttribute(name,new T.BufferAttribute(data,size));
 }
 const indices=[];let base=0;for(const g of parts){if(!g.index)throw Error('Geometría sin índice');for(const i of g.index.array)indices.push(i+base);base+=g.attributes.position.count;}result.setIndex(indices);return result;
}
/** Original procedural anatomy with vertex-colour coats; no downloaded/licensed animal artwork. Forward +X. */
const C={ivory:0xe9e5d9,black:0x24252b,pink:0xaa8179,hoof:0x343635,wool:0xcfc7b2,tag:0xe4bc43,eye:0x181b1d};
export function geometryKit(){
 const list=[];
 function add(kind,pos,scale,color,rotation=[0,0,0],coat=false){
  let g=kind==='box'?new T.BoxGeometry(1,1,1):kind==='cylinder'?new T.CylinderGeometry(1,1,1,10):new T.SphereGeometry(1,kind==='fine'?24:kind==='wool'?6:14,kind==='fine'?14:kind==='wool'?4:9);
  const a=g.attributes.position,colors=[],base=new T.Color(color),dark=new T.Color(C.black),variation=new T.Color();
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),pattern=Math.sin(x*7+z*3)*.6+Math.cos(z*9-y*4)*.5+Math.sin(y*8+x*3)*.4;variation.copy(coat&&pattern>.27?dark:base);variation.multiplyScalar(.95+.05*(y+1)/2);colors.push(variation.r,variation.g,variation.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));const m=new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));g.applyMatrix4(m);list.push(g);return g;
 }
 return {add,finish(){const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());g.computeBoundingSphere();return g}};
}
export function createAnimalParts(species){
 const ewe=species==='OVINE',k=geometryKit(),coat=ewe?C.wool:C.ivory;
 // Rump, barrel, shoulder and abdominal transition make the silhouette different from a sphere.
 k.add('fine',[0,ewe?.80:1.10,0],[ewe?.66:1.06,ewe?.34:.48,ewe?.29:.38],coat,[0,0,0],!ewe);
 k.add('sphere',[-.68,ewe?.78:1.13,0],[ewe?.18:.36,ewe?.27:.40,ewe?.25:.36],coat,[0,0,0],!ewe);
 k.add('sphere',[ewe?.44:.68,ewe?.88:1.13,0],[ewe?.25:.40,ewe?.31:.45,ewe?.26:.34],coat,[0,0,ewe?-.12:-.22],!ewe);
 k.add('sphere',[ewe?-.3:-.56,ewe?.44:.62,0],[ewe?.18:.28,ewe?.14:.19,ewe?.16:.22],C.pink);
 for(const x of ewe?[-.30]:[-.46,-.66])for(const z of [-.1,.1])k.add('cylinder',[x,ewe?.32:.42,z],[.028,.10,.028],C.pink);
 if(ewe){for(let i=0;i<36;i++){const angle=i*2.399,px=Math.sin(i*1.27)*.58,py=Math.cos(angle)*.27,pz=Math.sin(angle)*.28;k.add('wool',[px,.83+py,pz],[.17,.145,.125],coat);}}
 const body=k.finish(),h=geometryKit();
 h.add('fine',[.08,-.05,0],[ewe?.28:.36,ewe?.17:.21,ewe?.16:.18],ewe?C.ivory:C.black,[0,0,-.22]);
 h.add('sphere',[ewe?.25:.36,-.22,0],[ewe?.17:.21,.105,ewe?.115:.16],ewe?C.ivory:C.pink);
 h.add('sphere',[0,.08,0],[.18,.20,.155],C.ivory);
 for(const side of [-1,1]){h.add('sphere',[-.08,.13,side*(ewe?.23:.25)],[ewe?.18:.19,.052,.085],coat,[side*.15,side*-.2,0]);h.add('box',[-.08,.06,side*(ewe?.31:.35)],[.105,.11,.025],C.tag);h.add('sphere',[.10,0,side*.155],[.043,.039,.025],C.eye);h.add('sphere',[.29,-.24,side*.115],[.025,.018,.011],C.black);}
 const head=h.finish(),u=geometryKit(),l=geometryKit(),hoofY=ewe?-.29:-.39;
 u.add('sphere',[0,-.16,0],[ewe?.065:.085,ewe?.22:.25,ewe?.067:.087],coat);u.add('sphere',[0,ewe?-.31:-.38,0],[.075,.08,.075],coat);
 l.add('cylinder',[.01,hoofY/2,0],[.035,Math.abs(hoofY),.037],coat);
 for(const side of [-1,1])l.add('box',[.05,hoofY-.03,side*.033],[ewe?.14:.18,.09,.058],C.hoof);
 const upper=u.finish(),lower=l.finish(),t=geometryKit();t.add('cylinder',[0,-.24,0],[.035,.48,.035],coat);t.add('sphere',[0,-.49,0],[.072,.13,.065],ewe?coat:C.black);
 return {body,head,upper,lower,tail:t.finish(),headAnchor:[ewe?.65:1.00,ewe?1.10:1.45,0],hipHeight:ewe?.68:.86,legLength:ewe?.30:.39,ewe};
}
/** Batch every articulated part across a herd: 11 draws/species, not dozens per animal. */
export function createInstancedHerd(parent,species,count){
 const parts=createAnimalParts(species),material=new T.MeshStandardMaterial({vertexColors:true,roughness:.91}),meshes={},g=new T.Group();g.name='HERD_REALISM_'+species;parent.add(g);
 const geometryNames=['body','head','tail','upper','lower'];
 for(const key of geometryNames){const n=['upper','lower'].includes(key)?count*4:count;const mesh=new T.InstancedMesh(parts[key],material,Math.max(1,n));mesh.count=n;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;g.add(mesh);meshes[key]=mesh;}
 const root=new T.Matrix4(),local=new T.Matrix4(),result=new T.Matrix4(),pos=new T.Vector3(),quat=new T.Quaternion(),scale=new T.Vector3(1,1,1),euler=new T.Euler();
 function put(key,index,offset,rotation=[0,0,0]){pos.set(...offset);quat.setFromEuler(euler.set(...rotation));local.compose(pos,quat,scale);result.multiplyMatrices(root,local);meshes[key].setMatrixAt(index,result);}
 function setAnimal(i,a,pose,headDown=0){
  pos.set(a.x,a.y||0,a.z);quat.setFromEuler(euler.set(0,a.yaw,0));scale.setScalar(a.scale??1);root.compose(pos,quat,scale);scale.set(1,1,1);
  put('body',i,[0,0,0]);put('head',i,[parts.headAnchor[0]+headDown*.10,parts.headAnchor[1]-headDown*(parts.ewe?.45:.74),0],[0,pose.head,-headDown]);put('tail',i,[parts.ewe?-.67:-1.04,parts.ewe?1:1.42,0],[pose.tail,0,.15]);
  for(let j=0;j<4;j++){const front=j<2,x=front?(parts.ewe?.43:.65):(parts.ewe?-.45:-.72),z=(j%2?-1:1)*(parts.ewe?.19:.27),ang=pose.upper[j];const ex=x+Math.sin(ang)*parts.legLength,ey=parts.hipHeight-Math.cos(ang)*parts.legLength;put('lower',i*4+j,[ex,ey,z],[0,0,ang+pose.lower[j]]);
   // Every leg needs a distinct instance slot, unlike the body/head index.
   put('upper',i*4+j,[x,parts.hipHeight,z],[0,0,ang]);
  }
 }
 return {g,meshes,parts,setAnimal,finish(){for(const m of Object.values(meshes))m.instanceMatrix.needsUpdate=true},dispose(){g.removeFromParent();Object.values(meshes).forEach(m=>m.dispose());geometryNames.forEach(k=>parts[k].dispose());material.dispose()}};
}
export function createUniformWorker(role='FARM'){
 const coat=/VET/.test(role)?0xe1e8e0:/CLEAN/.test(role)?0x5e9c9c:0x294c72,vest=/DRIVER/.test(role)?0xd4b747:0xb9cbd4;
 const g=new T.Group(),kit=geometryKit();kit.add('sphere',[0,1.13,0],[.24,.39,.16],coat);kit.add('box',[0,1.03,.16],[.33,.38,.025],vest);kit.add('box',[0,1.28,.183],[.34,.04,.02],0xd6dfdc);kit.add('box',[.105,1.30,.205],[.08,.11,.012],0xefefdf);kit.add('sphere',[0,1.68,0],[.14,.18,.13],0xb78b74);kit.add('sphere',[0,1.83,0],[.158,.07,.15],0xd2deea);kit.add('box',[0,1.8,.10],[.28,.04,.20],0x1d4c7b);
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.85}),body=new T.Mesh(kit.finish(),material);g.add(body);const arms=[];
 for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.245,1.41,0);const a=geometryKit();a.add('cylinder',[0,-.18,0],[.065,.37,.065],coat);a.add('sphere',[0,-.4,.04],[.07,.095,.065],0x9bc2d3);arm.add(new T.Mesh(a.finish(),material));g.add(arm);arms.push(arm);
 const l=geometryKit();l.add('cylinder',[side*.12,.52,0],[.08,.65,.09],0x203953);l.add('box',[side*.12,.155,.07],[.18,.29,.28],0x283834);g.add(new T.Mesh(l.finish(),material));}
 return {g,arms,animate(seconds,working){arms.forEach((a,i)=>a.rotation.x=working?-.45+Math.sin(seconds*1.3+i)*.13:0)}};
}
