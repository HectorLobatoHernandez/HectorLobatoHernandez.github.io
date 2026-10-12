import json
import math
import struct
import sys
from pathlib import Path
import numpy as np

def parse_glb(path):
    raw=Path(path).read_bytes()
    magic,ver,total=struct.unpack_from("<4sII",raw,0)
    if magic!=b"glTF" or ver!=2:
        raise RuntimeError("INVALID_GLB")
    o=12
    chunks={}
    order=[]
    while o<len(raw):
        length,kind=struct.unpack_from("<II",raw,o)
        chunks[kind]=bytearray(raw[o+8:o+8+length])
        order.append(kind)
        o+=8+length
    return json.loads(chunks[0x4E4F534A].decode("utf-8")),chunks,order

def accessor_info(js,idx):
    a=js["accessors"][idx]
    bv=js["bufferViews"][a["bufferView"]]
    off=bv.get("byteOffset",0)+a.get("byteOffset",0)
    width={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT4":16}[a["type"]]
    dtype={
        5126:np.float32,
        5125:np.uint32,
        5123:np.uint16,
        5122:np.int16,
        5121:np.uint8,
        5120:np.int8,
    }[a["componentType"]]
    return a,bv,off,width,dtype

def read_accessor(js,binbuf,idx):
    a,bv,off,width,dtype=accessor_info(js,idx)
    stride=bv.get("byteStride")
    packed=np.dtype(dtype).itemsize*width
    if stride is None or stride==packed:
        return np.frombuffer(
            binbuf,dtype=dtype,count=a["count"]*width,offset=off
        ).copy().reshape(a["count"],width)
    out=np.empty((a["count"],width),dtype=dtype)
    for i in range(a["count"]):
        out[i]=np.frombuffer(
            binbuf,dtype=dtype,count=width,offset=off+i*stride
        )
    return out

def write_accessor(js,binbuf,idx,arr):
    a,bv,off,width,dtype=accessor_info(js,idx)
    arr=np.asarray(arr,dtype=dtype)
    stride=bv.get("byteStride")
    packed=np.dtype(dtype).itemsize*width
    if stride is None or stride==packed:
        binbuf[off:off+arr.nbytes]=arr.tobytes()
    else:
        for i in range(a["count"]):
            start=off+i*stride
            binbuf[start:start+packed]=arr[i].tobytes()
    if np.issubdtype(np.dtype(dtype),np.floating) and a["type"].startswith("VEC"):
        a["min"]=arr.min(axis=0).astype(float).tolist()
        a["max"]=arr.max(axis=0).astype(float).tolist()

def smooth(a,b,x):
    t=np.clip((x-a)/(b-a),0.0,1.0)
    return t*t*(3.0-2.0*t)

def save_glb(js,chunks,order,path):
    js["buffers"][0]["byteLength"]=len(chunks[0x004E4942])
    jb=json.dumps(js,separators=(",",":")).encode("utf-8")
    while len(jb)%4:
        jb+=b" "
    chunks[0x4E4F534A]=bytearray(jb)
    while len(chunks[0x004E4942])%4:
        chunks[0x004E4942]+=b"\x00"
    total=12+sum(8+len(chunks[t]) for t in order)
    data=bytearray(struct.pack("<4sII",b"glTF",2,total))
    for t in order:
        data+=struct.pack("<II",len(chunks[t]),t)
        data+=chunks[t]
    Path(path).write_bytes(data)

def main():
    if len(sys.argv)!=3:
        raise SystemExit("Usage: FIX_METAPERSON_HAIR_POSTURE.py input.glb output.glb")

    src=Path(sys.argv[1]).resolve()
    dst=Path(sys.argv[2]).resolve()
    if not src.exists():
        raise FileNotFoundError(src)

    js,chunks,order=parse_glb(src)
    binbuf=chunks[0x004E4942]

    hair_prim=None
    for mesh in js.get("meshes",[]):
        for prim in mesh.get("primitives",[]):
            mi=prim.get("material")
            name=((js["materials"][mi].get("name") or "").lower() if mi is not None else "")
            if name=="haircut":
                hair_prim=prim
                break
        if hair_prim is not None:
            break
    if hair_prim is None:
        raise RuntimeError("HAIRCUT_MESH_NOT_FOUND")

    pidx=hair_prim["attributes"]["POSITION"]
    nidx=hair_prim["attributes"].get("NORMAL")
    iidx=hair_prim["indices"]

    pos=read_accessor(js,binbuf,pidx).astype(np.float32)
    indices=read_accessor(js,binbuf,iidx).reshape(-1,3).astype(np.int64)

    mn=pos.min(axis=0)
    mx=pos.max(axis=0)
    cx=(mn[0]+mx[0])*0.5
    cz=(mn[2]+mx[2])*0.5
    hx=max((mx[0]-mn[0])*0.5,1e-6)
    hy=max(mx[1]-mn[1],1e-6)
    hz=max((mx[2]-mn[2])*0.5,1e-6)

    # Hair V2:
    # curly medium-length top/crown, short sides, and a real curly fringe
    # falling over the forehead. Front of this MetaPerson is +Z.
    for i in range(len(pos)):
        x,y,z=[float(v) for v in pos[i]]
        h=np.clip((y-mn[1])/hy,0.0,1.0)
        side=abs(x-cx)/hx
        front=(z-cz)/hz

        # Shorter, tighter sides/temples.
        side_t=smooth(0.48,0.98,side)
        lower=1.0-smooth(0.42,0.78,h)
        if side>0.48 and h<0.80:
            shrink=0.07+0.17*side_t*lower
            x=cx+(x-cx)*(1.0-shrink)

        # Curly volume through crown/top.
        top=smooth(0.32,0.94,h)
        side_control=1.0-0.48*side_t*(1.0-0.72*top)
        front_control=1.0-0.18*smooth(0.30,0.78,front)
        if h>0.30:
            rx=(x-cx)/hx
            rz=(z-cz)/hz
            rr=max(math.hypot(rx,rz),1e-6)
            ux,uz=rx/rr,rz/rr

            curl1=math.sin((x-cx)*108.0+(z-cz)*91.0+y*53.0)
            curl2=math.cos((x-cx)*79.0-(z-cz)*97.0+y*47.0)

            volume=(0.0030+0.0130*top)*side_control*front_control
            curl_amp=(0.0018+0.0058*top)*side_control

            x+=ux*(volume+curl_amp*curl1)
            z+=uz*(volume+0.76*curl_amp*curl2)
            y+=0.0010+0.0080*top+0.0020*curl1

        # Main central curly fringe.
        center=1.0-smooth(0.34,0.80,side)
        forward=smooth(0.18,0.78,front)
        middle=smooth(0.48,0.64,h)*(1.0-smooth(0.89,0.98,h))
        fringe=center*forward*middle

        if fringe>0.0:
            lock=0.5+0.5*math.sin((x-cx)*84.0+y*39.0)
            y-=fringe*(0.050+0.012*lock)
            z+=fringe*(0.010+0.010*(0.5+0.5*math.cos((x-cx)*68.0+y*33.0)))
            x+=fringe*0.0045*math.sin((x-cx)*102.0+y*31.0)

        # Secondary locks coming from the upper crown.
        fringe2=(
            center*
            smooth(0.48,0.90,front)*
            smooth(0.66,0.82,h)*
            (1.0-smooth(0.94,1.0,h))
        )
        if fringe2>0.0:
            wave=0.5+0.5*math.sin((x-cx)*122.0+z*76.0)
            y-=fringe2*(0.020+0.020*wave)
            z+=fringe2*(0.006+0.007*wave)
            x+=fringe2*0.0035*math.cos((x-cx)*116.0+y*43.0)

        # Neat nape.
        if h<0.25 and front<0.0:
            z=cz+(z-cz)*0.93

        pos[i]=(x,y,z)

    write_accessor(js,binbuf,pidx,pos)

    if nidx is not None:
        vn=np.zeros_like(pos)
        tri=pos[indices]
        fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
        for k in range(3):
            np.add.at(vn,indices[:,k],fn)
        lengths=np.linalg.norm(vn,axis=1,keepdims=True)
        lengths[lengths<1e-8]=1.0
        vn/=lengths
        write_accessor(js,binbuf,nidx,vn.astype(np.float32))

    # Dark brown hair only; preserve textures and every other material.
    for mat in js.get("materials",[]):
        if (mat.get("name") or "").lower()=="haircut":
            pbr=mat.setdefault("pbrMetallicRoughness",{})
            old=pbr.get("baseColorFactor",[1,1,1,1])
            pbr["baseColorFactor"]=[
                0.34,0.25,0.20,
                old[3] if len(old)>3 else 1.0
            ]
            pbr["roughnessFactor"]=0.84

    # Preserve the already accepted natural-arm posture from V1.
    nodes=js.get("nodes",[])
    by_name={n.get("name"):n for n in nodes if n.get("name")}
    if "LeftArm" not in by_name or "RightArm" not in by_name:
        raise RuntimeError("ARM_BONES_NOT_FOUND")

    by_name["LeftArm"]["rotation"]=[
        0.6583652887892534,
        -0.01283712939503643,
        0.01049041174875659,
        0.7525159838087693,
    ]
    by_name["RightArm"]["rotation"]=[
        0.6583656453792173,
        0.012837396541444331,
        -0.010490946217789732,
        0.7525156598250299,
    ]

    dst.parent.mkdir(parents=True,exist_ok=True)
    save_glb(js,chunks,order,dst)

    print("RHB_METAPERSON_HAIR_V2_OK=True")
    print(f"OUTPUT={dst}")
    print(f"HAIR_VERTICES={len(pos)}")
    print("HAIR=CURly_MEDIUM_TOP_SHORT_SIDES_FOREHEAD_FRINGE")
    print("POSTURE=PRESERVED_V1")

if __name__=="__main__":
    main()
