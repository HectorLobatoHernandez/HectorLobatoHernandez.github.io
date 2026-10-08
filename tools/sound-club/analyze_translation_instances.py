#!/usr/bin/env python3
from __future__ import annotations

import argparse, hashlib, json, re, struct
from collections import Counter, defaultdict
from pathlib import Path

MAGIC=b"glTF"; JSON_CHUNK=0x4E4F534A; BIN_CHUNK=0x004E4942
CS={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}
TC={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT2":4,"MAT3":9,"MAT4":16}

def semantic_path(name):
    clean=re.sub(r"^mesh_\d+_","",name or "",flags=re.I)
    clean=re.sub(r"^ROOT__","",clean,flags=re.I)
    out=[]
    for raw in [p for p in clean.split("__") if p]:
        t=re.sub(r"_AB(?:_.*)?$","",raw,flags=re.I).strip()
        t=re.sub(r"#\d+$","",t).strip()
        if re.fullmatch(r"Grupo#?\d*",t,flags=re.I): continue
        m=re.fullmatch(r"Component_\d+(?:_(.+))?",t,flags=re.I)
        if m:
            t=(m.group(1) or "").strip()
            if not t: continue
        if re.fullmatch(r"(COMPONENTE?|GROUP|GRUPO|AGRUPAR|AGRU)",t,flags=re.I): continue
        t=re.sub(r"\s+"," ",t).strip(" _-")
        if t: out.append(t.upper())
    return out

def top_group(name):
    p=semantic_path(name)
    return p[0] if p else "UNNAMED"

def read_glb(path):
    with path.open("rb") as f:
        h=f.read(12)
        if len(h)!=12: raise SystemExit("Invalid GLB header.")
        magic,ver,total=struct.unpack("<4sII",h)
        if magic!=MAGIC or ver!=2: raise SystemExit(f"Unsupported GLB: {magic!r} v{ver}")
        jl,jt=struct.unpack("<II",f.read(8))
        if jt!=JSON_CHUNK: raise SystemExit("First chunk is not JSON.")
        doc=json.loads(f.read(jl).decode("utf-8").rstrip("\x00 \t\r\n"))
        bl,bt=struct.unpack("<II",f.read(8))
        if bt!=BIN_CHUNK: raise SystemExit("Second chunk is not BIN.")
        bo=f.tell()
    return doc,{"jsonLength":jl,"binLength":bl,"binOffset":bo,"totalLength":total}

def mat_fp(materials,mid):
    if mid is None:return None
    raw=json.dumps(materials[mid],sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()

def info(doc,aid):
    acc=doc["accessors"][aid]
    if acc.get("sparse"): raise SystemExit("Sparse accessors not supported.")
    vid=acc.get("bufferView")
    if vid is None: raise SystemExit(f"Accessor {aid} has no bufferView.")
    view=doc["bufferViews"][vid]
    es=CS[acc["componentType"]]*TC[acc["type"]]
    stride=int(view.get("byteStride",es) or es)
    off=int(view.get("byteOffset",0) or 0)+int(acc.get("byteOffset",0) or 0)
    return acc,vid,es,stride,off

def hash_accessor(f,doc,layout,aid,cache):
    if aid in cache:return cache[aid]
    acc,vid,es,stride,off=info(doc,aid)
    count=int(acc.get("count",0) or 0); h=hashlib.sha256()
    f.seek(layout["binOffset"]+off)
    if stride==es:
        rem=count*es
        while rem:
            b=f.read(min(rem,1024*1024))
            if not b: raise SystemExit("Unexpected EOF.")
            h.update(b); rem-=len(b)
    else:
        for _ in range(count):
            b=f.read(es)
            if len(b)!=es: raise SystemExit("Unexpected EOF.")
            h.update(b); f.seek(stride-es,1)
    cache[aid]=h.hexdigest(); return cache[aid]

def read_positions(f,doc,layout,aid):
    acc,vid,es,stride,off=info(doc,aid)
    if acc.get("componentType")!=5126 or acc.get("type")!="VEC3":
        raise ValueError("POSITION not FLOAT VEC3")
    n=int(acc.get("count",0) or 0); f.seek(layout["binOffset"]+off)
    vals=[]
    if stride==12:
        raw=f.read(n*12)
        if len(raw)!=n*12: raise SystemExit("Unexpected EOF.")
        vals=list(struct.iter_unpack("<fff",raw))
    else:
        for _ in range(n):
            raw=f.read(12)
            if len(raw)!=12: raise SystemExit("Unexpected EOF.")
            vals.append(struct.unpack("<fff",raw)); f.seek(stride-12,1)
    return vals

def norm_pos_hash(vals,tol):
    if not vals:return hashlib.sha256(b"").hexdigest(),(0.,0.,0.)
    a=vals[0]; step=max(tol,1e-9); h=hashlib.sha256()
    for x,y,z in vals:
        h.update(struct.pack("<qqq",
            int(round((x-a[0])/step)),int(round((y-a[1])/step)),int(round((z-a[2])/step))))
    return h.hexdigest(),a

def extent_key(acc,tol):
    mn,mx=acc.get("min"),acc.get("max")
    if not mn or not mx:return None
    step=max(tol,1e-9)
    return tuple(int(round((float(mx[i])-float(mn[i]))/step)) for i in range(3))

def coarse_key(doc,mid,tol,mat_cache):
    mesh=doc["meshes"][mid]; mats=doc.get("materials",[]); parts=[]
    for p in mesh.get("primitives",[]):
        attrs=p.get("attributes") or {}; posid=attrs.get("POSITION")
        if posid is None:return None
        pos=doc["accessors"][posid]
        if pos.get("componentType")!=5126 or pos.get("type")!="VEC3":return None
        al=[]
        for sem,aid in sorted(attrs.items()):
            a=doc["accessors"][aid]
            al.append((sem,a.get("componentType"),a.get("type"),int(a.get("count",0) or 0),bool(a.get("normalized",False))))
        idx=p.get("indices"); il=None
        if idx is not None:
            a=doc["accessors"][idx]; il=(a.get("componentType"),a.get("type"),int(a.get("count",0) or 0))
        material=p.get("material")
        if material not in mat_cache: mat_cache[material]=mat_fp(mats,material)
        parts.append((p.get("mode",4),tuple(al),il,extent_key(pos,tol),mat_cache[material],len(p.get("targets") or [])))
    return tuple(parts)

def translation_sig(f,doc,layout,mid,tol,acache,mat_cache):
    mesh=doc["meshes"][mid]; mats=doc.get("materials",[]); parts=[]; anchors=[]
    for p in mesh.get("primitives",[]):
        attrs=p.get("attributes") or {}; posid=attrs["POSITION"]
        ph,a=norm_pos_hash(read_positions(f,doc,layout,posid),tol); anchors.append(a)
        non=[]
        for sem,aid in sorted(attrs.items()):
            if sem=="POSITION":continue
            x=doc["accessors"][aid]
            non.append((sem,hash_accessor(f,doc,layout,aid,acache),x.get("componentType"),x.get("type"),int(x.get("count",0) or 0),bool(x.get("normalized",False))))
        idx=p.get("indices"); isig=None
        if idx is not None:
            x=doc["accessors"][idx]
            isig=(hash_accessor(f,doc,layout,idx,acache),x.get("componentType"),int(x.get("count",0) or 0))
        material=p.get("material")
        if material not in mat_cache: mat_cache[material]=mat_fp(mats,material)
        targets=[]
        for t in p.get("targets") or []:
            targets.append(tuple((sem,hash_accessor(f,doc,layout,aid,acache)) for sem,aid in sorted((t or {}).items())))
        parts.append((p.get("mode",4),ph,tuple(non),isig,mat_cache[material],tuple(targets)))
    raw=json.dumps(parts,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest(),anchors

def mesh_views(doc,mid):
    out=set()
    def add(aid):
        if aid is None:return
        a=doc["accessors"][aid]
        if a.get("sparse"):raise SystemExit("Sparse accessors not supported.")
        if a.get("bufferView") is not None:out.add(a["bufferView"])
    for p in doc["meshes"][mid].get("primitives",[]):
        for aid in (p.get("attributes") or {}).values():add(aid)
        add(p.get("indices"))
        for t in p.get("targets") or []:
            for aid in (t or {}).values():add(aid)
    return out

def main():
    ap=argparse.ArgumentParser(description="Translation-equivalent mesh analyzer.")
    ap.add_argument("glb",type=Path); ap.add_argument("--json",dest="json_out",type=Path,required=True)
    ap.add_argument("--tolerance-mm",type=float,default=0.001)
    args=ap.parse_args()
    doc,layout=read_glb(args.glb)
    if doc.get("animations") or doc.get("skins"):raise SystemExit("Animations/skins are not supported.")
    nodes=doc.get("nodes",[]); meshes=doc.get("meshes",[]); views=doc.get("bufferViews",[])
    mat_cache={}; coarse=defaultdict(list); skipped=0
    print(f"Building coarse keys for {len(meshes)} meshes...")
    for mid in range(len(meshes)):
        k=coarse_key(doc,mid,args.tolerance_mm,mat_cache)
        if k is None: skipped+=1
        else: coarse[k].append(mid)
        if (mid+1)%25000==0:print(f"  coarse-keyed {mid+1}/{len(meshes)} meshes")
    buckets=[ids for ids in coarse.values() if len(ids)>1]
    candidates=sum(map(len,buckets))
    print(f"Candidate translation buckets: {len(buckets)}; candidate meshes: {candidates}; skipped: {skipped}")

    m2n=defaultdict(list)
    for ni,n in enumerate(nodes):
        if n.get("mesh") is not None:m2n[n["mesh"]].append(ni)

    mviews={}; viewrefs=defaultdict(set)
    for mid in range(len(meshes)):
        s=mesh_views(doc,mid); mviews[mid]=s
        for vid in s:viewrefs[vid].add(mid)

    sigs=defaultdict(list); anchors={}; acache={}; processed=0
    with args.glb.open("rb") as f:
        for ids in buckets:
            for mid in ids:
                try:s,a=translation_sig(f,doc,layout,mid,args.tolerance_mm,acache,mat_cache)
                except ValueError:
                    skipped+=1; continue
                sigs[s].append(mid); anchors[mid]=a; processed+=1
                if processed%10000==0:print(f"  translation-fingerprinted {processed}/{candidates} candidate meshes")

    sets=[]; global_views=set(); dup_count=0
    for sig,ids in sigs.items():
        if len(ids)<2:continue
        idset=set(ids); rep=ids[0]; dups=ids[1:]; dup_count+=len(dups); rv=set()
        for mid in dups:
            for vid in mviews[mid]:
                if viewrefs[vid].issubset(idset):rv.add(vid)
        global_views.update(rv)
        rb=sum(int(views[v].get("byteLength",0) or 0) for v in rv)
        ra=anchors.get(rep,[(0.,0.,0.)])[0]; sample=[]; gc=Counter()
        for mid in ids[:20]:
            nis=m2n.get(mid,[]); name=nodes[nis[0]].get("name","") if nis else ""; g=top_group(name); gc[g]+=1
            a=anchors.get(mid,[ra])[0]
            sample.append({"meshId":mid,"nodeName":name,"topLevelGroup":g,
                "translationFromRepresentativeMm":[float(a[i]-ra[i]) for i in range(3)]})
        sets.append({"fingerprint":sig,"meshCount":len(ids),"duplicateMeshCount":len(dups),
            "representativeMesh":rep,"recoverableBufferViews":len(rv),"estimatedRecoverableBytes":rb,
            "estimatedRecoverableMiB":rb/(1024*1024),"dominantTopLevelGroups":gc.most_common(8),"sample":sample[:10]})
    sets.sort(key=lambda x:(x["estimatedRecoverableBytes"],x["duplicateMeshCount"]),reverse=True)
    rbytes=sum(int(views[v].get("byteLength",0) or 0) for v in global_views)
    result={"schemaVersion":1,"projectId":"SOUND_CLUB_CDM","mode":"TRANSLATION_EQUIVALENCE_ANALYSIS_ONLY",
      "toleranceMm":args.tolerance_mm,
      "source":{"path":str(args.glb),"fileBytes":args.glb.stat().st_size,"jsonChunkBytes":layout["jsonLength"],
                "binBytes":layout["binLength"],"nodes":len(nodes),"meshes":len(meshes),"bufferViews":len(views)},
      "summary":{"candidateBuckets":len(buckets),"candidateMeshes":candidates,"translationEquivalentSetCount":len(sets),
                 "duplicateMeshCountBeyondRepresentatives":dup_count,"uniqueRecoverableBufferViews":len(global_views),
                 "estimatedRecoverableBufferBytes":rbytes,"estimatedRecoverableBufferMiB":rbytes/(1024*1024),
                 "estimatedBinReductionPercent":rbytes/layout["binLength"]*100 if layout["binLength"] else 0,
                 "estimatedMeshDefinitionsAfterReuse":len(meshes)-dup_count,
                 "estimatedMeshDefinitionReductionPercent":dup_count/len(meshes)*100 if meshes else 0},
      "topTranslationEquivalentSets":sets[:120],
      "policy":{"analysisOnly":True,"sourceCandidateModified":False,"privateSketchUpMasterModified":False,
                "automaticMutationAuthorized":False,
                "note":"Groups require matching topology, indices, non-position attributes and materials; positions match after translation normalization."}}
    args.json_out.parent.mkdir(parents=True,exist_ok=True)
    args.json_out.write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding="utf-8")
    print(json.dumps({"summary":result["summary"],"top20TranslationEquivalentSets":[
      {"meshCount":x["meshCount"],"estimatedRecoverableMiB":x["estimatedRecoverableMiB"],
       "dominantTopLevelGroups":x["dominantTopLevelGroups"],"sample":x["sample"][:3]} for x in sets[:20]],
      "json":str(args.json_out)},indent=2,ensure_ascii=False))
    return 0

if __name__=="__main__": raise SystemExit(main())
