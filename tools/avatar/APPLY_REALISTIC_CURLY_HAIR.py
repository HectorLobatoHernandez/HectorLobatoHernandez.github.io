import bpy
import math
import os
import random
import shutil
import sys
from mathutils import Vector

def argv_after_double_dash():
    if "--" not in sys.argv:
        return []
    return sys.argv[sys.argv.index("--") + 1:]

def arg_value(args, name, default=None):
    if name in args:
        i = args.index(name)
        if i + 1 < len(args):
            return args[i + 1]
    return default

args = argv_after_double_dash()
input_path = arg_value(args, "--input")
if not input_path:
    raise SystemExit("Missing --input <path>")

input_path = os.path.abspath(input_path)
if not os.path.exists(input_path):
    raise SystemExit(f"GLB not found: {input_path}")

base, ext = os.path.splitext(input_path)
backup_path = base + ".backup-before-curly.glb"
temp_path = base + ".curly-working.glb"

if not os.path.exists(backup_path):
    shutil.copy2(input_path, backup_path)
    print(f"[OK] Backup created: {backup_path}")
else:
    print(f"[OK] Backup already exists: {backup_path}")

# Clean Blender scene.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Import original avatar.
bpy.ops.import_scene.gltf(filepath=input_path)

objects = list(bpy.context.scene.objects)
armatures = [o for o in objects if o.type == 'ARMATURE']
if not armatures:
    raise SystemExit("No armature found in GLB")
arm = armatures[0]

head_bone = arm.data.bones.get("Head")
if head_bone is None:
    raise SystemExit("Head bone not found")

# Remove MetaPerson haircut entirely.
for obj in list(bpy.context.scene.objects):
    if obj.name.lower() == "haircut" or "haircut" in obj.name.lower():
        old_name = obj.name
        bpy.data.objects.remove(obj, do_unlink=True)
        print(f"[OK] Removed old haircut: {old_name}")

# Remove any prior generated curly hair if script is rerun.
for obj in list(bpy.context.scene.objects):
    if obj.name.startswith("HL_CURLY_HAIR") or obj.name.startswith("HL_HAIR_SCALP"):
        bpy.data.objects.remove(obj, do_unlink=True)

# Material.
mat = bpy.data.materials.get("HL_Natural_Curly_Hair")
if mat is None:
    mat = bpy.data.materials.new("HL_Natural_Curly_Hair")
mat.diffuse_color = (0.055, 0.032, 0.022, 1.0)
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.055, 0.032, 0.022, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.72
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.28

# The inspected MetaPerson head occupies approximately:
# x [-0.100,0.100], y [1.473,1.791], z [-0.094,0.145]
# Hair is built around a compact scalp ellipsoid, deliberately avoiding the face.
CX, CY, CZ = 0.0, 1.692, -0.004
RX, RY, RZ = 0.096, 0.118, 0.094

def parent_to_head(obj):
    # Keep current world-space placement while parenting rigidly to the Head bone.
    mw = obj.matrix_world.copy()
    obj.parent = arm
    obj.parent_type = 'BONE'
    obj.parent_bone = 'Head'
    obj.matrix_world = mw

# ---- Dark scalp cap under curls: no visible bald gaps ----
verts = []
faces = []
lat_steps = 12
lon_steps = 32
# Top (theta=0) through slightly below the widest scalp (~100 degrees).
theta_max = math.radians(100.0)
for iy in range(lat_steps + 1):
    theta = theta_max * (iy / lat_steps)
    st, ct = math.sin(theta), math.cos(theta)
    # Taper front lower edge to keep forehead open.
    for ix in range(lon_steps):
        phi = 2.0 * math.pi * (ix / lon_steps)
        cp, sp = math.cos(phi), math.sin(phi)
        x = CX + RX * st * cp
        y = CY + RY * ct
        z = CZ + RZ * st * sp
        # +Z is the face/front; lift the front hairline.
        if z > CZ + 0.040:
            y += 0.010 * (z - (CZ + 0.040)) / 0.055
        verts.append((x, y, z))

for iy in range(lat_steps):
    for ix in range(lon_steps):
        a = iy * lon_steps + ix
        b = iy * lon_steps + ((ix + 1) % lon_steps)
        c = (iy + 1) * lon_steps + ((ix + 1) % lon_steps)
        d = (iy + 1) * lon_steps + ix
        faces.append((a, b, c, d))

mesh = bpy.data.meshes.new("HL_HAIR_SCALP_MESH")
mesh.from_pydata(verts, [], faces)
mesh.update()
cap = bpy.data.objects.new("HL_HAIR_SCALP", mesh)
bpy.context.collection.objects.link(cap)
cap.data.materials.append(mat)
parent_to_head(cap)

# ---- Curly strands ----
curve_data = bpy.data.curves.new("HL_CURLY_HAIR_CURVES", type='CURVE')
curve_data.dimensions = '3D'
curve_data.resolution_u = 1
curve_data.bevel_depth = 0.00165
curve_data.bevel_resolution = 2
curve_data.resolution_u = 1
curve_data.materials.append(mat)

hair = bpy.data.objects.new("HL_CURLY_HAIR", curve_data)
bpy.context.collection.objects.link(hair)

random.seed(9506)
strand_count = 230
golden = math.pi * (3.0 - math.sqrt(5.0))

for i in range(strand_count):
    # Even distribution over upper scalp.
    u = (i + 0.5) / strand_count
    theta = theta_max * math.sqrt(u) * 0.98
    phi = i * golden + random.uniform(-0.10, 0.10)
    st, ct = math.sin(theta), math.cos(theta)
    cp, sp = math.cos(phi), math.sin(phi)

    x = CX + RX * st * cp
    y = CY + RY * ct
    z = CZ + RZ * st * sp

    # Avoid curls hanging across the forehead/eyes.
    front = max(0.0, (z - (CZ + 0.020)) / 0.075)
    if front > 0.0 and theta > math.radians(68):
        continue

    # Small natural irregularity.
    x += random.uniform(-0.003, 0.003)
    y += random.uniform(-0.002, 0.004)
    z += random.uniform(-0.003, 0.003)

    # Outward scalp normal.
    n = Vector(((x-CX)/(RX*RX), (y-CY)/(RY*RY), (z-CZ)/(RZ*RZ))).normalized()
    # Tangent basis around n.
    up = Vector((0,1,0))
    t1 = n.cross(up)
    if t1.length < 1e-5:
        t1 = Vector((1,0,0))
    t1.normalize()
    t2 = n.cross(t1).normalized()

    # Natural curls: shorter at crown/front, slightly longer at sides/back.
    side_back = 1.0 - max(0.0, n.z)
    drop = 0.018 + 0.024 * side_back + random.uniform(-0.003,0.005)
    curl_r = random.uniform(0.0048, 0.0074)
    turns = random.uniform(1.35, 2.15)
    outward = random.uniform(0.002, 0.006)

    spline = curve_data.splines.new('POLY')
    points = 11
    spline.points.add(points - 1)

    phase = random.uniform(0, 2*math.pi)
    for j in range(points):
        t = j/(points-1)
        ang = phase + turns * 2*math.pi * t
        # Curl gets slightly tighter toward the end.
        rr = curl_r * (1.0 - 0.18*t)
        p = Vector((x,y,z))
        p += t1 * (math.cos(ang) * rr)
        p += t2 * (math.sin(ang) * rr)
        p += Vector((0,-drop*t,0))
        p += n * (outward*t)
        spline.points[j].co = (p.x,p.y,p.z,1.0)

parent_to_head(hair)

# Add a small number of flyaway curls around the silhouette.
for side in (-1, 1):
    for k in range(8):
        spline = curve_data.splines.new('POLY')
        pts = 12
        spline.points.add(pts-1)
        base = Vector((
            side*(0.078 + random.uniform(-0.006,0.006)),
            1.735 + random.uniform(-0.055,0.040),
            -0.012 + random.uniform(-0.035,0.035)
        ))
        for j in range(pts):
            t=j/(pts-1)
            ang=2*math.pi*(1.6*t)+random.uniform(-0.05,0.05)
            p=base + Vector((
                side*(0.004*t + 0.005*math.cos(ang)),
                -0.030*t + 0.006*math.sin(ang),
                0.005*math.sin(ang*0.9)
            ))
            spline.points[j].co=(p.x,p.y,p.z,1.0)

# Smooth mesh cap.
for poly in cap.data.polygons:
    poly.use_smooth = True

# Select everything and export. GLTF exporter preserves armature/skin/morphs by default.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=temp_path,
    export_format='GLB',
    export_animations=True
)

if not os.path.exists(temp_path):
    raise SystemExit("Export failed: output GLB not created")

os.replace(temp_path, input_path)
print(f"[OK] Curly hair applied directly to: {input_path}")
print(f"[OK] Original backup: {backup_path}")

print("RHB_CURLY_HAIR_SCRIPT_OK=True")
