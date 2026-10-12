import bpy
import math
import os
import sys
from mathutils import Vector

def argv():
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--")+1:]

def arg_value(args, name, default=None):
    if name in args:
        i=args.index(name)
        if i+1 < len(args):
            return args[i+1]
    return default

args=argv()
src=arg_value(args,"--input")
dst=arg_value(args,"--output")
if not src or not dst:
    raise SystemExit("Usage: --input <glb> --output <glb>")
src=os.path.abspath(src)
dst=os.path.abspath(dst)
if not os.path.exists(src):
    raise SystemExit(f"INPUT_NOT_FOUND: {src}")

# Clean scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import generated avatar mesh
bpy.ops.import_scene.gltf(filepath=src)

mesh_objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not mesh_objs:
    raise SystemExit("NO_MESH_FOUND")

# Join all mesh pieces if TripoSR exporter created more than one
bpy.ops.object.select_all(action='DESELECT')
for o in mesh_objs:
    o.select_set(True)
bpy.context.view_layer.objects.active=mesh_objs[0]
if len(mesh_objs)>1:
    bpy.ops.object.join()
mesh=bpy.context.view_layer.objects.active
mesh.name="RHB_AVATAR_V2_MESH"

# Apply transforms
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# Compute world bbox
def bbox_world(obj):
    pts=[obj.matrix_world @ Vector(c) for c in obj.bound_box]
    xs=[p.x for p in pts]; ys=[p.y for p in pts]; zs=[p.z for p in pts]
    return min(xs),max(xs),min(ys),max(ys),min(zs),max(zs)

xmin,xmax,ymin,ymax,zmin,zmax=bbox_world(mesh)
height=zmax-zmin
if height <= 1e-6:
    raise SystemExit("INVALID_MESH_HEIGHT")

# Normalize to 1.80m
scale=1.80/height
mesh.scale=(scale,scale,scale)
bpy.context.view_layer.objects.active=mesh
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Recenter X/Y and ground on Z=0
xmin,xmax,ymin,ymax,zmin,zmax=bbox_world(mesh)
center_x=(xmin+xmax)/2
center_y=(ymin+ymax)/2
mesh.location.x -= center_x
mesh.location.y -= center_y
mesh.location.z -= zmin
bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

xmin,xmax,ymin,ymax,zmin,zmax=bbox_world(mesh)
W=max(xmax-xmin,0.35)
H=zmax-zmin

# Create armature
bpy.ops.object.armature_add(enter_editmode=True, location=(0,0,0))
arm=bpy.context.object
arm.name="RHB_AVATAR_V2_RIG"
arm.show_in_front=True
edata=arm.data
edata.name="RHB_AVATAR_V2_ARMATURE"

# remove default bone
for b in list(edata.edit_bones):
    edata.edit_bones.remove(b)

def add_bone(name, head, tail, parent=None, connected=False):
    b=edata.edit_bones.new(name)
    b.head=Vector(head)
    b.tail=Vector(tail)
    if parent:
        b.parent=parent
        b.use_connect=connected
    return b

# Anthropometric scaffold for a relaxed arms-down avatar.
pelvis_z=H*0.53
spine1_z=H*0.62
chest_z=H*0.72
neck_z=H*0.84
head_top=H*0.985

hips=add_bone("Hips",(0,0,pelvis_z),(0,0,spine1_z))
spine=add_bone("Spine",(0,0,spine1_z),(0,0,chest_z),hips,True)
spine1=add_bone("Spine1",(0,0,chest_z),(0,0,H*0.77),spine,True)
spine2=add_bone("Spine2",(0,0,H*0.77),(0,0,neck_z),spine1,True)
neck=add_bone("Neck",(0,0,neck_z),(0,0,H*0.89),spine2,True)
head=add_bone("Head",(0,0,H*0.89),(0,0,head_top),neck,True)

# legs
hip_x=W*0.105
knee_z=H*0.295
ankle_z=H*0.065
foot_z=H*0.035
foot_y=-max((ymax-ymin)*0.10,0.04)

lu=add_bone("LeftUpLeg",( hip_x,0,pelvis_z),( hip_x,0,knee_z),hips)
ll=add_bone("LeftLeg",( hip_x,0,knee_z),( hip_x,0,ankle_z),lu,True)
lf=add_bone("LeftFoot",( hip_x,0,ankle_z),( hip_x,foot_y,foot_z),ll,True)

ru=add_bone("RightUpLeg",(-hip_x,0,pelvis_z),(-hip_x,0,knee_z),hips)
rl=add_bone("RightLeg",(-hip_x,0,knee_z),(-hip_x,0,ankle_z),ru,True)
rf=add_bone("RightFoot",(-hip_x,0,ankle_z),(-hip_x,foot_y,foot_z),rl,True)

# relaxed arms-down scaffold
shoulder_z=H*0.79
shoulder_x=W*0.16
elbow_z=H*0.60
wrist_z=H*0.43
elbow_x=W*0.24
wrist_x=W*0.26

ls=add_bone("LeftShoulder",(0,0,shoulder_z),( shoulder_x,0,shoulder_z),spine2)
la=add_bone("LeftArm",( shoulder_x,0,shoulder_z),( elbow_x,0,elbow_z),ls,True)
lfa=add_bone("LeftForeArm",( elbow_x,0,elbow_z),( wrist_x,0,wrist_z),la,True)
lh=add_bone("LeftHand",( wrist_x,0,wrist_z),( wrist_x,0,H*0.39),lfa,True)

rs=add_bone("RightShoulder",(0,0,shoulder_z),(-shoulder_x,0,shoulder_z),spine2)
ra=add_bone("RightArm",(-shoulder_x,0,shoulder_z),(-elbow_x,0,elbow_z),rs,True)
rfa=add_bone("RightForeArm",(-elbow_x,0,elbow_z),(-wrist_x,0,wrist_z),ra,True)
rh=add_bone("RightHand",(-wrist_x,0,wrist_z),(-wrist_x,0,H*0.39),rfa,True)

bpy.ops.object.mode_set(mode='OBJECT')

# Automatic weights
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active=arm

try:
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
except Exception as e:
    print("AUTO_WEIGHTS_WARNING:", repr(e))
    # fallback: armature deform parent without weights (still exportable for diagnostics)
    mesh.parent=arm
    mod=mesh.modifiers.new("Armature","ARMATURE")
    mod.object=arm

# Smooth shading
for p in mesh.data.polygons:
    p.use_smooth=True

# Mild decimate safety if huge; TripoSR output is usually ~25k faces
if len(mesh.data.polygons) > 90000:
    dec=mesh.modifiers.new("RHB_DECIMATE","DECIMATE")
    dec.ratio=90000/len(mesh.data.polygons)
    bpy.context.view_layer.objects.active=mesh
    bpy.ops.object.modifier_apply(modifier=dec.name)

# Create a neutral pose correction action with tiny natural bends.
bpy.context.view_layer.objects.active=arm
bpy.ops.object.mode_set(mode='POSE')
for pb in arm.pose.bones:
    pb.rotation_mode='XYZ'

# slight elbow/knee relaxation
if "LeftForeArm" in arm.pose.bones:
    arm.pose.bones["LeftForeArm"].rotation_euler.y=math.radians(-4)
if "RightForeArm" in arm.pose.bones:
    arm.pose.bones["RightForeArm"].rotation_euler.y=math.radians(4)
if "LeftLeg" in arm.pose.bones:
    arm.pose.bones["LeftLeg"].rotation_euler.x=math.radians(2)
if "RightLeg" in arm.pose.bones:
    arm.pose.bones["RightLeg"].rotation_euler.x=math.radians(2)

bpy.ops.object.mode_set(mode='OBJECT')

# Export rigged GLB
os.makedirs(os.path.dirname(dst), exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=dst,
    export_format='GLB',
    export_apply=True,
    export_animations=False,
    export_skins=True,
    export_morph=False
)

if not os.path.exists(dst) or os.path.getsize(dst) < 1024:
    raise SystemExit("RIGGED_GLB_EXPORT_FAILED")

print("RHB_AVATAR_V2_RIGGED_OK=True")
print("OUTPUT="+dst)
print("SIZE_MB="+str(round(os.path.getsize(dst)/1024/1024,2)))
print("BONES="+",".join([b.name for b in arm.data.bones]))
