"""GAZA public GIS snapshot -> Blender context geometry.
Run in Blender 4.5+:
  blender --background scene.blend --python tools/blender/import_gaza_geojson.py -- path/to/gaza-campus-public-snapshot.geojson
Or open Blender Scripting and set SNAPSHOT below.

Evidence rule: OSM buildings remain context geometry, never as-built.
"""
import bpy, json, sys, os
from mathutils import Vector

SNAPSHOT = None
COLLECTION = "GAZA_GIS_PUBLIC_CONTEXT"

def argv_snapshot():
    if "--" in sys.argv:
        args=sys.argv[sys.argv.index("--")+1:]
        if args:return args[0]
    return SNAPSHOT

def collection(name):
    old=bpy.data.collections.get(name)
    if old:
        for obj in list(old.objects): bpy.data.objects.remove(obj,do_unlink=True)
        return old
    c=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(c);return c

def mat(name,color):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color=(*color,1.0);return m

ROAD=mat("GAZA GIS Road",(0.08,0.23,0.38))
BUILDING=mat("GAZA GIS Building Context",(0.55,0.43,0.12))
INDUSTRIAL=mat("GAZA GIS Industrial",(0.18,0.42,0.22))
ROUTE=mat("GAZA GIS Calculated Route",(0.55,0.12,0.12))
FACTORY=mat("GAZA GIS Factory Candidate",(0.95,0.24,0.05))

def curve_obj(name,pts,coll,material,bevel=.7,z=0.06):
    if len(pts)<2:return None
    cu=bpy.data.curves.new(name,"CURVE");cu.dimensions="3D";cu.resolution_u=2;cu.bevel_depth=bevel;cu.bevel_resolution=2
    sp=cu.splines.new("POLY");sp.points.add(len(pts)-1)
    for p,(x,north) in zip(sp.points,pts):p.co=(float(x),float(north),z,1)
    ob=bpy.data.objects.new(name,cu);coll.objects.link(ob);ob.data.materials.append(material);return ob

def polygon_obj(name,rings,coll,material,height=2.0):
    if not rings or len(rings[0])<3:return None
    pts=rings[0]
    if pts[0]==pts[-1]:pts=pts[:-1]
    verts=[(float(x),float(north),0) for x,north in pts]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[list(range(len(verts)))]);mesh.update()
    ob=bpy.data.objects.new(name,mesh);coll.objects.link(ob);ob.data.materials.append(material)
    if height>0:
        bpy.context.view_layer.objects.active=ob;ob.select_set(True)
        mod=ob.modifiers.new("Context extrusion","SOLIDIFY");mod.thickness=height
        ob.select_set(False)
    return ob

def main():
    path=argv_snapshot()
    if not path or not os.path.isfile(path):raise SystemExit("Provide exported gaza-campus-public-snapshot.geojson after --")
    data=json.load(open(path,encoding="utf-8"));coll=collection(COLLECTION)
    counts={"road":0,"building":0,"industrial":0,"factory_osm_candidate":0,"calculated_route":0}
    for i,f in enumerate(data.get("features",[])):
        props=f.get("properties",{});kind=props.get("kind","");local=f.get("localXZ");oid=props.get("osmId",i);name=f"GIS_{kind}_{oid}"
        if kind=="road" and local:
            ob=curve_obj(name,local,coll,ROAD,.55);counts[kind]+=bool(ob)
        elif kind=="calculated_route" and local:
            ob=curve_obj(name,local,coll,ROUTE,.32,.12);counts[kind]+=bool(ob)
        elif kind in ("building","industrial","factory_osm_candidate") and local:
            material=FACTORY if kind=="factory_osm_candidate" else (BUILDING if kind=="building" else INDUSTRIAL)
            height=4.0 if kind=="factory_osm_candidate" else (3.0 if kind=="building" else .12)
            ob=polygon_obj(name,local,coll,material,height);counts[kind]+=bool(ob)
        else:continue
        if ob:
            ob["gaza_source_class"]=props.get("sourceClass","PUBLIC_REFERENCE")
            ob["gaza_geometry_policy"]=props.get("geometryPolicy","")
            ob["gaza_osm_id"]=str(props.get("osmId",""))
    coll["gaza_provenance"]="OSM/OSRM public context; NOT AS-BUILT"
    coll["gaza_origin"]=json.dumps(data.get("metricLocal",{}).get("origin"))
    print("GAZA GIS import complete",counts)

if __name__=="__main__":main()
