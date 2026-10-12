import json, struct, shutil, sys
from pathlib import Path
import numpy as np

def smoothstep(a,b,x):
    t=np.clip((x-a)/(b-a),0.0,1.0)
    return t*t*(3.0-2.0*t)

def parse_glb(path):
    raw=Path(path).read_bytes()
    magic,version,length=struct.unpack_from('<4sII',raw,0)
    if magic!=b'glTF' or version!=2:
        raise RuntimeError("INVALID_GLB")
    o=12
    chunks={}
    order=[]
    while o<len(raw):
        l,t=struct.unpack_from('<II',raw,o)
        d=bytearray(raw[o+8:o+8+l])
        chunks[t]=d
        order.append(t)
        o+=8+l
    js=json.loads(chunks[0x4E4F534A].decode('utf-8'))
    return js,chunks,order

def acc_info(js,idx):
    a=js['accessors'][idx]
    bv=js['bufferViews'][a['bufferView']]
    off=bv.get('byteOffset',0)+a.get('byteOffset',0)
    num={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
    dt={5126:np.float32,5121:np.uint8,5123:np.uint16,5125:np.uint32}[a['componentType']]
    return a,bv,off,num,dt

def read_acc(js,binbuf,idx):
    a,bv,off,num,dt=acc_info(js,idx)
    return np.frombuffer(binbuf,dtype=dt,count=a['count']*num,offset=off).copy().reshape((a['count'],num))

def write_acc(js,binbuf,idx,arr):
    a,bv,off,num,dt=acc_info(js,idx)
    arr=np.asarray(arr,dtype=dt)
    binbuf[off:off+arr.nbytes]=arr.tobytes()
    if dt==np.float32 and a['type'].startswith('VEC'):
        js['accessors'][idx]['min']=arr.min(axis=0).tolist()
        js['accessors'][idx]['max']=arr.max(axis=0).tolist()

def append_vec3_float_accessor(js,chunks,order,arr,target=34962):
    binbuf=chunks[0x004E4942]
    while len(binbuf)%4:
        binbuf+=b'\x00'
    byte_offset=len(binbuf)
    payload=np.asarray(arr,dtype=np.float32).tobytes()
    binbuf+=payload

    bv_index=len(js.setdefault('bufferViews',[]))
    js['bufferViews'].append({
        'buffer':0,
        'byteOffset':byte_offset,
        'byteLength':len(payload),
        'target':target,
    })

    acc_index=len(js.setdefault('accessors',[]))
    a=np.asarray(arr,dtype=np.float32)
    js['accessors'].append({
        'bufferView':bv_index,
        'componentType':5126,
        'count':int(a.shape[0]),
        'type':'VEC3',
        'min':a.min(axis=0).tolist(),
        'max':a.max(axis=0).tolist(),
    })

    js.setdefault('buffers',[{}])[0]['byteLength']=len(binbuf)
    return acc_index

def save_glb(js,chunks,order,path):
    jb=json.dumps(js,separators=(',',':')).encode('utf-8')
    while len(jb)%4: jb+=b' '
    chunks[0x4E4F534A]=bytearray(jb)
    for t in list(chunks):
        while len(chunks[t])%4: chunks[t]+=b'\x00'
    total=12+sum(8+len(chunks[t]) for t in order)
    out=bytearray(struct.pack('<4sII',b'glTF',2,total))
    for t in order:
        d=chunks[t]
        out+=struct.pack('<II',len(d),t)+d
    Path(path).write_bytes(out)

def main():
    if len(sys.argv)<3:
        raise SystemExit("Usage: script input.glb output.glb")
    src=Path(sys.argv[1]).resolve()
    dst=Path(sys.argv[2]).resolve()
    if not src.exists():
        raise FileNotFoundError(src)

    js,chunks,order=parse_glb(src)
    binbuf=chunks[0x004E4942]
    prim=js['meshes'][0]['primitives'][0]
    attrs=prim['attributes']

    pos=read_acc(js,binbuf,attrs['POSITION']).astype(np.float32)
    norm_idx=attrs.get('NORMAL')
    norm=read_acc(js,binbuf,norm_idx).astype(np.float32) if norm_idx is not None else None
    col=read_acc(js,binbuf,attrs['COLOR_0']).astype(np.float32)
    color_channels=col.shape[1]
    if color_channels not in (3,4):
        raise RuntimeError(f"UNSUPPORTED_COLOR_CHANNELS_{color_channels}")
    rgb=col[:,:3].copy()
    alpha=col[:,3:4].copy() if color_channels==4 else None
    indices=read_acc(js,binbuf,prim['indices']).astype(np.int32).reshape(-1,3)

    # Model generated earlier is Y-up and ~1.8 m tall.
    ymin,ymax=pos[:,1].min(),pos[:,1].max()
    H=ymax-ymin
    head=(pos[:,1] > ymin+0.78*H)
    head_pts=pos[head]
    cx=np.median(head_pts[:,0])
    cz=np.median(head_pts[:,2])

    lum=0.2126*rgb[:,0]+0.7152*rgb[:,1]+0.0722*rgb[:,2]

    # Skin reference from central face.
    face_sample=head & (pos[:,1] > ymin+0.82*H) & (pos[:,1] < ymin+0.90*H) & (pos[:,0] > cx+0.01) & (np.abs(pos[:,2]-cz)<0.08) & (lum>0.18)
    skin=np.median(rgb[face_sample],axis=0) if face_sample.any() else np.array([0.56,0.32,0.17],dtype=np.float32)

    # 1) REMOVE BAD GLASSES
    eye_low=ymin+0.865*H
    eye_high=ymin+0.925*H
    eye=head & (pos[:,1]>eye_low) & (pos[:,1]<eye_high) & (pos[:,0]>cx+0.015) & (np.abs(pos[:,2]-cz)<0.11)
    warm=(rgb[:,0]>np.maximum(0.26,rgb[:,1]*1.10)) & (rgb[:,1]>0.08)
    dark=lum<0.13
    glasses=eye & (warm|dark)

    skin_eye=eye & (lum>0.18)
    x_target=np.percentile(pos[skin_eye,0],35) if skin_eye.any() else cx+0.04
    p=smoothstep(eye_low,eye_low+0.03,pos[:,1])*(1.0-smoothstep(eye_high-0.025,eye_high,pos[:,1]))
    alpha=0.86*p[glasses]
    pos[glasses,0]=pos[glasses,0]*(1-alpha)+x_target*alpha
    pos[glasses,2]=cz+(pos[glasses,2]-cz)*(1-0.28*alpha)
    rgb[glasses]=skin[None,:]

    # 2) HAIR: medium-long curly top, short sides
    hair_low=ymin+0.865*H
    hair=head & (pos[:,1]>hair_low)

    # sides shorter / tighter around temples and ears
    side=(hair & (pos[:,1]<ymin+0.955*H) & (np.abs(pos[:,2]-cz)>0.075))
    side_strength=(1.0-smoothstep(hair_low,ymin+0.955*H,pos[:,1]))[side]
    pos[side,2]=cz+(pos[side,2]-cz)*(1.0-(0.16+0.12*side_strength))

    # fuller top with controlled medium length
    idx=np.where(hair)[0]
    x=pos[idx,0]; y=pos[idx,1]; z=pos[idx,2]
    top=smoothstep(ymin+0.89*H,ymin+0.995*H,y)
    front=1.0-0.48*smoothstep(cx+0.03,cx+0.13,x)
    sidefade=1.0-0.60*smoothstep(0.07,0.145,np.abs(z-cz))*(1.0-0.70*top)
    back=1.0+0.20*smoothstep(cx-0.14,cx-0.025,x)

    rx=x-cx; rz=z-cz
    rr=np.sqrt(rx*rx+rz*rz)+1e-6
    ux=rx/rr; uz=rz/rr

    base_vol=(0.008+0.034*top)*front*sidefade*back
    curl=np.sin(rx*67+rz*49+y*29)+0.65*np.cos(rx*51-rz*37+y*33)
    curl_amp=(0.004+0.009*top)*front

    pos[idx,0]+=ux*(base_vol+curl_amp*curl)
    pos[idx,2]+=uz*(base_vol+0.75*curl_amp*np.sin(rx*73+y*31))
    pos[idx,1]+=0.003+0.010*top+0.0035*np.sin(rx*42+rz*57)

    # Color: dark brown, still allowing baked highlights.
    hair_color=np.array([0.105,0.062,0.038],dtype=np.float32)
    rgb[idx]=np.clip(rgb[idx]*0.28+hair_color*0.72,0,1)

    # Restore visible forehead/face color below hairline.
    face_restore=head & (pos[:,1]<ymin+0.89*H) & (pos[:,0]>cx+0.01) & (lum>0.16)
    rgb[face_restore]=np.clip(rgb[face_restore]*0.20+skin*0.80,0,1)

    # Recompute normals.
    vn=np.zeros_like(pos)
    tri=pos[indices]
    fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0])
    for k in range(3):
        np.add.at(vn,indices[:,k],fn)
    ln=np.linalg.norm(vn,axis=1,keepdims=True)
    ln[ln<1e-8]=1
    vn/=ln

    write_acc(js,binbuf,attrs['POSITION'],pos)
    if norm_idx is not None:
        write_acc(js,binbuf,norm_idx,vn)
    else:
        norm_idx=append_vec3_float_accessor(js,chunks,order,vn)
        attrs['NORMAL']=norm_idx
    write_acc(js,binbuf,attrs['COLOR_0'],col)
    js.setdefault('buffers',[{}])[0]['byteLength']=len(chunks[0x004E4942])

    dst.parent.mkdir(parents=True,exist_ok=True)
    save_glb(js,chunks,order,dst)
    print("RHB_MASTER_REFINEMENT_OK=True")
    print("OUTPUT="+str(dst))
    print("GLASSES_VERTICES="+str(int(glasses.sum())))
    print("HAIR_VERTICES="+str(int(hair.sum())))

if __name__=="__main__":
    main()
