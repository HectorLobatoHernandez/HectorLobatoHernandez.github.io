# GAZA project-created GLB worker factory.
# Run with Blender 4.5+ in background mode. No third-party assets are used.
import bpy
import math
import os
import sys

def cli_out():
    args=sys.argv
    if "--" in args:
        extra=args[args.index("--")+1:]
        if extra:
            return os.path.abspath(extra[0])
    return os.path.abspath(os.path.join(os.getcwd(),"apps","gaza","assets","3d","generated","worker_demo.glb"))

OUT=cli_out()
os.makedirs(os.path.dirname(OUT),exist_ok=True)

# Clean deterministic scene.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.cameras,bpy.data.lights):
    pass

scene=bpy.context.scene
scene.frame_start=1
scene.frame_end=17
scene.render.fps=24
scene["gaza_asset_id"]="worker-demo-v1"
scene["gaza_provenance"]="SIMULATED"
scene["gaza_generator"]="tools/blender/GAZA_BUILD_WORKER_GLBS.py"

def material(name,color,metallic=0.0,roughness=0.72):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,1.0)
    m.use_nodes=True
    bsdf=m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value=(*color,1.0)
        bsdf.inputs["Metallic"].default_value=metallic
        bsdf.inputs["Roughness"].default_value=roughness
    return m

MAT_WHITE=material("PPE_White",(0.88,0.91,0.94),0.0,0.78)
MAT_BLUE=material("GAZA_Blue",(0.08,0.28,0.58),0.05,0.62)
MAT_HIVIS=material("HiVis",(0.75,0.88,0.12),0.0,0.58)
MAT_DARK=material("Workwear_Dark",(0.05,0.08,0.12),0.0,0.82)
MAT_SKIN=material("Skin",(0.63,0.39,0.27),0.0,0.88)
MAT_BLACK=material("Black",(0.01,0.015,0.02),0.0,0.9)

def empty(name,parent=None,loc=(0,0,0)):
    o=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(o)
    o.empty_display_type='PLAIN_AXES'
    o.empty_display_size=.35
    if parent is not None:o.parent=parent
    o.location=loc
    o.rotation_mode='XYZ'
    return o

def cube(name,dims,loc,mat,parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0))
    o=bpy.context.object;o.name=name
    o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if parent is not None:o.parent=parent
    o.location=loc
    if mat:o.data.materials.append(mat)
    return o

def sphere(name,radius,loc,mat,parent=None,scale=(1,1,1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,radius=radius,location=(0,0,0))
    o=bpy.context.object;o.name=name
    if parent is not None:o.parent=parent
    o.location=loc;o.scale=scale
    if mat:o.data.materials.append(mat)
    return o

root=empty("GAZA_Worker_Root")
root.scale=(0.22,0.22,0.22)
root["asset_id"]="worker-demo-v1"
root["provenance"]="SIMULATED"
root["license"]="Project-created"
root["role"]="Operario demo"

# Core body.
cube("Torso",(2.5,1.45,3.2),(0,0,4.8),MAT_WHITE,root)
cube("Vest",(2.68,1.58,1.55),(0,-0.03,4.65),MAT_HIVIS,root)
cube("Reflective_A",(2.78,1.64,.13),(0,-0.04,4.28),MAT_WHITE,root)
cube("Reflective_B",(2.78,1.64,.13),(0,-0.04,4.95),MAT_WHITE,root)
sphere("Head",1.05,(0,0,7.15),MAT_SKIN,root)
sphere("Helmet",1.13,(0,0,7.75),MAT_WHITE,root,scale=(1.0,1.0,.48))
cube("Helmet_Brim",(2.25,1.45,.18),(0,-.18,7.62),MAT_WHITE,root)
cube("Badge",(.95,.08,.48),(0,-.78,4.92),MAT_BLUE,root)

# Articulated rigid hierarchy. This validates object-transform animation in glTF.
arm_l=empty("Arm.L",root,(-1.62,0,5.75))
arm_r=empty("Arm.R",root,(1.62,0,5.75))
leg_l=empty("Leg.L",root,(-.72,0,3.25))
leg_r=empty("Leg.R",root,(.72,0,3.25))
for p in (arm_l,arm_r,leg_l,leg_r):p.rotation_mode='XYZ'

cube("ArmMesh.L",(.68,.72,2.85),(0,0,-1.42),MAT_WHITE,arm_l)
cube("ArmMesh.R",(.68,.72,2.85),(0,0,-1.42),MAT_WHITE,arm_r)
cube("LegMesh.L",(.82,.9,3.15),(0,0,-1.58),MAT_DARK,leg_l)
cube("LegMesh.R",(.82,.9,3.15),(0,0,-1.58),MAT_DARK,leg_r)
cube("Shoe.L",(1.0,1.35,.52),(0,-.18,-3.15),MAT_BLACK,leg_l)
cube("Shoe.R",(1.0,1.35,.52),(0,-.18,-3.15),MAT_BLACK,leg_r)

# Simple maintenance/operations accessory.
cube("Radio",(.55,.38,1.05),(1.45,.55,4.8),MAT_BLUE,root)

# Deterministic looping walk cycle, exported as one baked Scene animation.
poses=[
    (1,  .48,-.48,-.52,.52,0.00),
    (5,  0.0, 0.0, 0.0,0.0,.12),
    (9, -.48, .48, .52,-.52,0.00),
    (13, 0.0, 0.0, 0.0,0.0,.12),
    (17, .48,-.48,-.52,.52,0.00),
]
for frame,al,ar,ll,lr,bob in poses:
    arm_l.rotation_euler=(al,0,0);arm_r.rotation_euler=(ar,0,0)
    leg_l.rotation_euler=(ll,0,0);leg_r.rotation_euler=(lr,0,0)
    root.location=(0,0,bob)
    for o in (arm_l,arm_r,leg_l,leg_r):
        o.keyframe_insert(data_path="rotation_euler",frame=frame)
    root.keyframe_insert(data_path="location",frame=frame)

# Export only runtime-relevant content; custom properties become glTF extras.
scene.frame_set(1)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_extras=True,
    export_cameras=False,
    export_lights=False,
    export_animations=True,
    export_animation_mode='SCENE',
    export_nla_strips_merged_animation_name='Walk',
    export_frame_range=True,
    export_frame_step=1,
    export_force_sampling=True,
    export_anim_slide_to_zero=True,
    export_apply=True,
    export_yup=True,
    check_existing=False,
)
print("GAZA_GLTF_OK="+OUT)
