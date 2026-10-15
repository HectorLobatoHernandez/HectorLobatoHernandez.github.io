"""Create an importable GLB from the cached OSRM network, without Blender dependencies.

Run: python export_fleet_glb.py routes.json fleet.glb
Coordinates are scaled to kilometres, keeping true route shape. Trucks are
synthetic 16 m prototypes; buildings are contextual and not an as-built plan.
"""
import json, math, struct, sys
from pathlib import Path

source, target = map(Path, sys.argv[1:3])
data=json.loads(source.read_text(encoding='utf-8'))
if data.get('schema')!='GAZA_FLEET_ROUTES_SIM_V1':raise SystemExit('Invalid GAZA route schema')
plant=data['plant'];binary=bytearray();views=[];accessors=[];meshes=[];nodes=[];materials=[];animations=[]

def pack(values,format_,component,type_,count,minimum=None,maximum=None,target_=None):
    while len(binary)%4:binary.append(0)
    offset=len(binary);binary.extend(struct.pack('<'+format_*len(values),*values))
    view={'buffer':0,'byteOffset':offset,'byteLength':len(binary)-offset}
    if target_:view['target']=target_
    views.append(view)
    acc={'bufferView':len(views)-1,'componentType':component,'count':count,'type':type_}
    if minimum is not None:acc['min']=minimum;acc['max']=maximum
    accessors.append(acc);return len(accessors)-1

def material(name,color):
    r,g,b=[int(color[i:i+2],16)/255 for i in (1,3,5)]
    materials.append({'name':name,'pbrMetallicRoughness':{'baseColorFactor':[r,g,b,1],'metallicFactor':0,'roughnessFactor':.88},'doubleSided':True});return len(materials)-1

def mesh(name,verts,faces,mat):
    flat=[value for v in verts for value in v]
    pos=pack(flat,'f',5126,'VEC3',len(verts),[min(v[i] for v in verts) for i in range(3)],[max(v[i] for v in verts) for i in range(3)],34962)
    idx=pack([i for f in faces for i in f],'I',5125,'SCALAR',3*len(faces),target_=34963)
    meshes.append({'name':name,'primitives':[{'attributes':{'POSITION':pos},'indices':idx,'material':mat}]});return len(meshes)-1

def box(name,at,size,mat,parent=None):
    x,y,z=at;w,h,d=[v/2 for v in size]
    verts=[(x+sx*w,y+sy*h,z+sz*d) for sx,sy,sz in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    faces=[(0,1,2),(0,2,3),(4,6,5),(4,7,6),(0,4,5),(0,5,1),(1,5,6),(1,6,2),(2,6,7),(2,7,3),(3,7,4),(3,4,0)]
    node={'name':name,'mesh':mesh(name,verts,faces,mat)}
    nodes.append(node)
    if parent is not None:nodes[parent].setdefault('children',[]).append(len(nodes)-1)
    return len(nodes)-1

def coord(p):return ((p[1]-plant[1])*111.32*math.cos(math.radians(plant[0])),0,(plant[0]-p[0])*111.32)

road=material('Asfalto · eje OSRM','#596b76');white=material('Camión SIM blanco','#f6f8f5');blue=material('GAZA azul · maqueta','#1554a3');roof=material('Cubierta conceptual','#90b8d5')
box('Coreses · volumen inferido',(0,.035,0),(.11,.07,.07),blue)
box('Coreses · cubierta inferida',(0,.073,0),(.115,.008,.075),roof)
for route in data['routes']:
    points=[coord(p) for p in route['coordinates']]
    if len(points)<2:continue
    verts=[];faces=[]
    for i,(x,_,z) in enumerate(points):
        a=points[max(0,i-1)];b=points[min(len(points)-1,i+1)];dx=b[0]-a[0];dz=b[2]-a[2];length=math.hypot(dx,dz) or 1
        ox=-dz/length*.006;oz=dx/length*.006
        verts.extend([(x-ox,.002,z-oz),(x+ox,.002,z+oz)])
        if i:faces.extend([(2*i-2,2*i-1,2*i+1),(2*i-2,2*i+1,2*i)])
    route_mat=material(route['id']+' · SIM',route['color'])
    nodes.append({'name':route['id']+' · public OSRM road','mesh':mesh(route['id']+' · eje',verts,faces,road),'extras':{'routeSource':route['routeSource'],'distanceMeters':route['distanceMeters']}})
    root=len(nodes);nodes.append({'name':route['id']+' · VEHÍCULO SINTÉTICO','translation':list(points[0]),'extras':{'provenance':'SYNTHETIC','destination':route['destination']}})
    box(route['id']+' · remolque',(-.005,.004,0),(.011,.006,.003),white,root)
    box(route['id']+' · cabina',(.004,.004,0),(.004,.006,.003),blue,root)
    distances=[0]
    for a,b in zip(points,points[1:]):distances.append(distances[-1]+math.dist(a,b))
    samples=[]
    for fraction in [i/24 for i in range(25)]:
        distance=fraction*distances[-1]
        j=next((i for i,d in enumerate(distances[1:],1) if d>=distance),len(points)-1)
        t=(distance-distances[j-1])/max(1e-9,distances[j]-distances[j-1])
        samples.append([points[j-1][k]+(points[j][k]-points[j-1][k])*t for k in range(3)])
    times=pack([i*20/24 for i in range(25)],'f',5126,'SCALAR',25,[0],[20])
    values=pack([x for p in samples for x in p],'f',5126,'VEC3',25,[min(p[i] for p in samples) for i in range(3)],[max(p[i] for p in samples) for i in range(3)])
    animations.append((root,times,values))
    dx,_,dz=points[-1];box(route['id']+' · DESTINO DEMO',(dx,.012,dz),(.03,.024,.03),roof)

samplers=[{'input':a,'output':b,'interpolation':'LINEAR'} for _,a,b in animations]
channels=[{'sampler':i,'target':{'node':root,'path':'translation'}} for i,(root,_,_) in enumerate(animations)]
gltf={'asset':{'version':'2.0','generator':'GAZA Operations · public OSRM and synthetic fleet'},'scene':0,'scenes':[{'nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':materials,'buffers':[{'byteLength':len(binary)}],'bufferViews':views,'accessors':accessors,'animations':[{'name':'20s · eight synthetic trips','samplers':samplers,'channels':channels}],'extras':{'roadProvenance':'PUBLIC OSM/OSRM 2026-10-15','operationalProvenance':'SYNTHETIC','license':'© OpenStreetMap contributors · ODbL','asBuilt':False}}
# Child nodes cannot also be roots of the scene.
children={c for node in nodes for c in node.get('children',[])};gltf['scenes'][0]['nodes']=[i for i in range(len(nodes)) if i not in children]
json_bytes=json.dumps(gltf,ensure_ascii=False,separators=(',',':')).encode('utf-8');json_bytes+=b' ' * (-len(json_bytes)%4)
binary+=b'\0' * (-len(binary)%4)
body=struct.pack('<I4s',len(json_bytes),b'JSON')+json_bytes+struct.pack('<I4s',len(binary),b'BIN\0')+binary
target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(struct.pack('<4sII',b'glTF',2,len(body)+12)+body)
print('GAZA_GLTF_OK',target, 'routes',len(data['routes']),'bytes',target.stat().st_size)
