"""Blender 4.x: build an editable GAZA fleet stage from the app's JSON export.

Usage: blender -b --python generate_fleet_scene.py -- gaza-fleet-routes-sim.json output.blend
The export records whether each polyline came from OSRM or is a schematic fallback.
All destinations, vehicles, stops, buildings and timings remain synthetic.
"""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(args) != 2:
    raise SystemExit('Usage: blender -b --python generate_fleet_scene.py -- routes.json scene.blend')
source, target = Path(args[0]), Path(args[1])
data = json.loads(source.read_text(encoding='utf-8'))
if data.get('schema') != 'GAZA_FLEET_ROUTES_SIM_V1':
    raise SystemExit('Invalid GAZA export schema')
plant = data['plant']
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)

def material(name, hexcode, rough=0.8):
    color = tuple(int(hexcode[i:i+2],16)/255 for i in (1,3,5))
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
    return m

ground=material('Pradera · contexto escénico','#b8d1bb')
asphalt=material('Asfalto · ejes exportados','#667987')
marking=material('Marca vial','#e9e7cc')
white=material('Carrocería blanca','#f7f8f5')
blue=material('Azul GAZA · maqueta','#1554a3')
glass=material('Cabina cristal','#9fbed0')
black=material('Neumático','#223139')
leaf=material('Árbol escénico','#5b9b65')
materials={}

def cube(name,location,scale,mat):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location)
    obj=bpy.context.object;obj.name=name;obj.dimensions=scale;bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat);return obj

def pos(latlon):
    lat,lon=latlon
    return Vector(((lon-plant[1])*111320*math.cos(math.radians(plant[0]))/1000,
                   (lat-plant[0])*111320/1000,0))

def ribbon(name,points,width,mat):
    points=[pos(p) for p in points]
    if len(points)<2:return
    verts=[];faces=[]
    for i,p in enumerate(points):
        tangent=(points[min(i+1,len(points)-1)]-points[max(i-1,0)]).normalized()
        side=Vector((-tangent.y,tangent.x,0))*width/2
        verts.extend([p-side,p+side])
        if i:faces.append((2*i-2,2*i-1,2*i+1,2*i))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)

all_points=[]
for trip in data['routes']:
    points=trip.get('coordinates',[])
    if len(points)<2:continue
    all_points.extend(points)
    route_mat=materials.setdefault(trip['id'],material(trip['id']+' · color de ruta',trip['color']))
    ribbon(trip['id']+' · '+trip['routeSource'],points,0.065,asphalt)
    ribbon(trip['id']+' · centro',points,0.008,route_mat)
    # A low-poly tractor + trailer follows the exported road in the animation.
    root=bpy.data.objects.new(trip['id']+' · VEHÍCULO SIM',None);bpy.context.collection.objects.link(root)
    tractor=cube('Tractor', (0,0,0.06),(.09,.06,.065),white);tractor.parent=root
    cabin=cube('Cabina',(.038,0,.095),(.045,.055,.06),glass);cabin.parent=root
    trailer=cube('Caja',(-.085,0,.09),(.145,.072,.105),white);trailer.parent=root
    stripe=cube('Línea GAZA SIM',(-.085,-.037,.091),(.12,.003,.013),blue);stripe.parent=root
    for x in (-.13,-.04,.045):
        for y in (-.039,.039):
            wheel=cube('Neumático', (x,y,.029),(.016,.014,.038),black);wheel.parent=root
    samples=[pos(p) for p in points]
    length=[0]
    for a,b in zip(samples,samples[1:]):length.append(length[-1]+(b-a).length)
    for frame in range(1,241,3):
        fraction=((frame/240+len(materials)*.13)%1)*length[-1]
        index=next((i for i,d in enumerate(length[1:],1) if d>=fraction),len(length)-1)
        a,b=samples[index-1:index+1];distance=length[index]-length[index-1]
        location=a+(b-a)*(fraction-length[index-1])/max(distance,1e-8)
        root.location=location;root.rotation_euler.z=(b-a).to_2d().angle_signed(Vector((1,0)))*-1
        root.keyframe_insert(data_path='location',frame=frame);root.keyframe_insert(data_path='rotation_euler',frame=frame)

# Scene geometry is illustrative. The route export is the only source for the road axes.
if all_points:
    points=[pos(p) for p in all_points]
    xmin,xmax=min(p.x for p in points),max(p.x for p in points)
    ymin,ymax=min(p.y for p in points),max(p.y for p in points)
else:xmin,xmax,ymin,ymax=-5,5,-5,5
span=max(xmax-xmin,ymax-ymin,2)
cube('Terreno escénico',((xmin+xmax)/2,(ymin+ymax)/2,-.055),(xmax-xmin+span*.4,ymax-ymin+span*.4,.09),ground)
cube('Planta de Coreses · volumen conceptual',(0,0,.11),(.27,.17,.22),blue)
for i in range(28):
    x=xmin+(xmax-xmin)*(i*.61803398875%1);y=ymin+(ymax-ymin)*(i*.41421356237%1)
    if Vector((x,y)).length<.3:continue
    cube('Arbolado contextual', (x,y,.035),(.035,.035,.07),leaf)
world=bpy.context.scene;world.frame_start=1;world.frame_end=240
world.render.engine='BLENDER_EEVEE_NEXT'
world.world.color=(.72,.82,.9)
mid=Vector(((xmin+xmax)/2,(ymin+ymax)/2,0))
bpy.ops.object.camera_add(location=mid+Vector((span*.78,-span*.9,span*.95)))
camera=bpy.context.object;camera.rotation_euler=(mid-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=span*1.85;world.camera=camera
bpy.ops.object.light_add(type='AREA',location=mid+Vector((span*.45,-span*.35,span)))
light=bpy.context.object;light.data.energy=2200;light.data.shape='DISK';light.data.size=span*.9
world.render.resolution_x=1920;world.render.resolution_y=1080;world.render.resolution_percentage=100
target.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(target.resolve()))
print('GAZA_BLEND_SCENE_OK',target,'routes',len(data['routes']))
