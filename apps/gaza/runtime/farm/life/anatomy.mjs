/** Original procedural anatomy. Colour patterns and uniforms are proposed, not scans or certified PPE. */
export function createAnatomy(T){
 const geo=new Set(),mats=new Set();let resolution=1;
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.82});mats.add(material);
 function merge(items){
  const positions=[],normals=[],colors=[],color=new T.Color();
  for(const item of items){let g=item.g.toNonIndexed();g.scale(...(item.s||[1,1,1]));if(item.r){g.rotateX(item.r[0]);g.rotateY(item.r[1]);g.rotateZ(item.r[2]);}g.translate(...(item.p||[0,0,0]));const p=g.attributes.position,n=g.attributes.normal;
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);positions.push(x,y,z);normals.push(n.getX(i),n.getY(i),n.getZ(i));color.set(typeof item.c==='function'?item.c(x,y,z):item.c||'#ddd9ce');colors.push(color.r,color.g,color.b)}g.dispose();item.g.dispose();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();geo.add(g);return g;
 }
 const ell=(p,s,c,segments=16,r)=>({g:new T.SphereGeometry(1,Math.max(6,Math.floor(segments*resolution)),resolution===1?10:5),p,s,c,r});
 const box=(p,s,c,r)=>({g:new T.BoxGeometry(1,1,1),p,s,c,r});
 const rod=(p,radius,height,c,rotation=[0,0,0],top=.8)=>({g:new T.CylinderGeometry(radius*top,radius,height,resolution===1?10:6),p,c,r:rotation});
 const palette={white:'#ddd9cf',dark:'#252421',hoof:'#363531',pink:'#ba8d85',eye:'#141817',tag:'#dfb956',wool:'#c8c1a8'};
 function animal(species,seed=0,detail=true){
  resolution=detail?1:.5;
  const cow=species==='BOVINE',skin=(x,y,z)=>cow?(Math.sin(x*4+seed*2.3)+Math.cos(z*9+y*6)+.55*Math.sin(y*14+x*3)> .5?palette.dark:palette.white):palette.wool;
  const body=[ell([0,1.18,0],[1.02,.5,.37],skin,24),ell([-.63,1.26,0],[.4,.43,.39],skin),ell([.62,1.27,0],[.35,.45,.34],skin),ell([.7,1.48,0],[.28,.35,.27],skin),ell([.87,1.33,0],[.4,.34,.23],skin,16,[0,0,.35])];
  // Dewlap, abdomen, spine contour, udder. All herd symbols are adult females.
  body.push(ell([.75,.92,0],[.23,.31,.12],skin),ell([-.3,.92,0],[.55,.2,.28],skin),ell([-.62,.66,0],[.3,.21,.27],palette.pink));
  const teatPositions=cow?[[-.76,-.13],[-.48,-.13],[-.76,.13],[-.48,.13]]:[[-.65,-.16],[-.65,.16]];
  for(const[x,z]of teatPositions)body.push(rod([x,.43,z],.037,.17,palette.pink));
  if(!cow){
   // Non-uniform short fleece over an organic surface, rather than a row of sphere bodies.
   const wool=new T.SphereGeometry(1,detail?28:12,detail?16:6),a=wool.attributes.position;
   for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),r=1+.035*Math.sin(x*42+seed)*Math.cos(z*38+y*17);a.setXYZ(i,x*r,y*r,z*r)}wool.computeVertexNormals();
   body.push({g:wool,p:[-.05,1.2,0],s:[1.04,.57,.41],c:(x,y,z)=>Math.sin(x*24+z*26+y*11)>.4?'#d6ceb5':'#bdb69f'});
  }
  const head=[ell([.2,.07,0],[.28,.27,.205],cow?palette.white:'#afa89a'),ell([.43,-.14,0],[.25,.18,.15],cow?palette.white:'#b8b09e',18,[0,0,-.36]),ell([.59,-.25,0],[.16,.12,.16],cow?'#b99a92':'#84766b')];
  for(const side of [-1,1]){head.push(ell([.61,-.23,side*.11],[.063,.033,.025],palette.dark),ell([.27,.11,side*.181],[.058,.052,.027],'#8b8175'),ell([.281,.115,side*.205],[.031,.034,.016],palette.eye),ell([.285,.127,side*.218],[.01,.01,.005],'#eee9df'),ell([.02,.21,side*.28],[.17,.06,.13],cow?palette.white:'#aaa392',14,[side*.23,0,side*.3]),box([.06,.12,side*.36],[.095,.135,.018],palette.tag,[.1,0,.15]),box([.06,.12,side*.371],[.05,.015,.007],palette.dark));}
  head.push(box([.64,-.294,0],[.14,.012,.17],'#65564e'),ell([.21,-.14,0],[.19,.15,.12],cow?palette.white:'#b2aa98'));
  const tail=[rod([-.08,-.26,0],.035,.56,cow?palette.white:'#c2b99f',[0,0,-.18]),ell([-.15,-.6,0],[.055,.18,.055],cow?palette.dark:'#9e9486')];
  return {body:merge(body),head:merge(head),tail:merge(tail),upper:merge([rod([0,-.2,0],.105,.42,skin),ell([0,-.42,0],[.085,.1,.09],skin)]),lower:merge([rod([0,-.21,0],.063,.42,cow?palette.white:'#a29886',[0,0,-.035]),ell([.015,-.4,0],[.078,.09,.08],palette.dark)]),hoof:merge([box([.046,-.035,-.044],[.18,.135,.077],palette.hoof),box([.046,-.035,.044],[.18,.135,.077],palette.hoof)]),scale:cow?1:.66};
 }
 function human(profile='farm'){resolution=1;
  const clean=['milk','vet','clean'].includes(profile),suit=profile==='vet'?'#e0e5dd':profile==='clean'?'#567f75':'#294a61',boots=clean?'#64756d':'#2e3536';
  const torso=merge([ell([0,1.2,0],[.24,.33,.145],suit),box([0,.99,0],[.39,.21,.23],suit),box([0,1.16,.153],[.018,.52,.012],'#b0bcb8'),box([-.115,1.31,.156],[.115,.13,.015],suit),box([.11,1.29,.161],[.1,.06,.018],'#eeeede'),box([.11,1.294,.174],[.065,.015,.006],'#234b80'),...(profile==='driver'?[box([0,1.17,.16],[.47,.1,.022],'#d8c463'),box([-.17,1.33,.16],[.075,.36,.022],'#d8c463'),box([.17,1.33,.16],[.075,.36,.022],'#d8c463')]:[]),...(clean?[box([0,.93,.18],[.4,.52,.035],profile==='milk'?'#d8dfda':suit)]:[])]);
  const head=merge([ell([0,0,0],[.14,.2,.145],'#bb9276'),ell([0,-.1,.136],[.055,.06,.026],'#b5896a'),ell([0,.153,0],[.156,.07,.158],clean?'#b3cfcd':'#294e68'),box([0,.128,.163],[.21,.026,.13],clean?'#b3cfcd':'#294e68'),ell([0,0,.145],[.03,.04,.035],'#bb8b6d'),ell([-.049,.039,.14],[.019,.012,.011],'#343633'),ell([.049,.039,.14],[.019,.012,.011],'#343633')]);
  return {body:torso,head,upperArm:merge([rod([0,-.145,0],.069,.29,suit)]),lowerArm:merge([rod([0,-.15,0],.056,.3,suit),ell([0,-.335,.015],[.06,.09,.05],clean?'#8cacb1':'#bb9276')]),thigh:merge([rod([0,-.22,0],.09,.44,suit)]),shin:merge([rod([0,-.2,0],.071,.4,suit),rod([0,-.33,0],.082,.27,boots)]),boot:merge([box([0,-.027,.075],[.18,.13,.32],boots)])};
 }
 return {animal,human,merge,ell,box,rod,material,dispose(){geo.forEach(g=>g.dispose());mats.forEach(m=>m.dispose())}};
}
/** Joint animation with reusable geometry and one draw call per articulated batch part. */
export function createHerdBatch(T,parent,anatomy,species,capacity,seed){
 const a=anatomy.animal(species,seed),low=anatomy.animal(species,seed,false),root=new T.Group();root.name='DETAIL_HERD_'+species+'_'+seed;parent.add(root);const meshes={},parts=['body','head','tail',...Array.from({length:4},(_,i)=>['upper'+i,'lower'+i,'hoof'+i]).flat()];
 for(const key of parts){const g=low[key.replace(/[0-9]+$/,'')],o=new T.InstancedMesh(g,anatomy.material,capacity);o.count=0;o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;root.add(o);meshes[key]=o;}
 const transform=new T.Object3D(),base=new T.Matrix4(),joint=new T.Matrix4(),mid=new T.Matrix4(),foot=new T.Matrix4();
 function local(out,p,rz=0,ry=0,scale=1){transform.position.set(...p);transform.rotation.set(0,ry,rz);transform.scale.setScalar(scale);transform.updateMatrix();out.copy(transform.matrix);return out;}
 function put(key,i,m){meshes[key].setMatrixAt(i,m)}
 let members=[],detailed=false;
 return {root,body:meshes.body,
  setMembers(v){members=v;for(const o of Object.values(meshes))o.count=v.length;},
  get members(){return members},
  setDetail(value){if(detailed===value)return;detailed=value;for(const [key,o]of Object.entries(meshes))o.geometry=(value?a:low)[key.replace(/[0-9]+$/,'')];},
  update(poses){members.forEach((animal,i)=>{const pose=poses[i],size=a.scale*animal.scale;local(base,[pose.x,pose.y,pose.z],0,pose.yaw,size);put('body',i,base);local(joint,[.94,1.45,0],pose.headTilt||0,pose.headTurn||0);joint.premultiply(base);put('head',i,joint);local(joint,[-1.0,1.34,0],pose.tail||0);joint.premultiply(base);put('tail',i,joint);
   for(let k=0;k<4;k++){const front=k<2,side=k%2?-1:1,phase=(pose.phase||0)+(k===0?0:k===1?Math.PI:k===2?Math.PI:0),swing=(pose.walk||0)*Math.sin(phase)*.36,knee=(pose.walk||0)*Math.max(0,-Math.sin(phase))*.5;local(joint,[front?.67:-.72,1.02,side*.265],swing);joint.premultiply(base);put('upper'+k,i,joint);local(mid,[0,-.42,0],-knee);mid.premultiply(joint);put('lower'+k,i,mid);local(foot,[.015,-.4,0],-swing+knee);foot.premultiply(mid);put('hoof'+k,i,foot);}
  });for(const o of Object.values(meshes))o.instanceMatrix.needsUpdate=true;},
  dispose(){for(const o of Object.values(meshes))o.dispose();parent.remove(root)}
 };
}
