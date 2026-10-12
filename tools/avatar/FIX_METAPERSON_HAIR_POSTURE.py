import json
import math
import struct
import sys
from pathlib import Path

import numpy as np

def parse_glb(path):
    raw = Path(path).read_bytes()
    magic, version, total = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2:
        raise RuntimeError("INVALID_GLB")
    o = 12
    chunks = {}
    order = []
    while o < len(raw):
        length, kind = struct.unpack_from("<II", raw, o)
        chunks[kind] = bytearray(raw[o + 8:o + 8 + length])
        order.append(kind)
        o += 8 + length
    js = json.loads(chunks[0x4E4F534A].decode("utf-8"))
    return js, chunks, order

def accessor_info(js, idx):
    a = js["accessors"][idx]
    bv = js["bufferViews"][a["bufferView"]]
    off = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    width = {"SCALAR":1, "VEC2":2, "VEC3":3, "VEC4":4, "MAT4":16}[a["type"]]
    dtype = {
        5126: np.float32,
        5125: np.uint32,
        5123: np.uint16,
        5122: np.int16,
        5121: np.uint8,
        5120: np.int8,
    }[a["componentType"]]
    return a, bv, off, width, dtype

def read_accessor(js, binbuf, idx):
    a, bv, off, width, dtype = accessor_info(js, idx)
    stride = bv.get("byteStride")
    packed = np.dtype(dtype).itemsize * width
    if stride is None or stride == packed:
        return np.frombuffer(
            binbuf, dtype=dtype, count=a["count"] * width, offset=off
        ).copy().reshape(a["count"], width)
    out = np.empty((a["count"], width), dtype=dtype)
    for i in range(a["count"]):
        out[i] = np.frombuffer(
            binbuf, dtype=dtype, count=width, offset=off + i * stride
        )
    return out

def write_accessor(js, binbuf, idx, arr):
    a, bv, off, width, dtype = accessor_info(js, idx)
    arr = np.asarray(arr, dtype=dtype)
    stride = bv.get("byteStride")
    packed = np.dtype(dtype).itemsize * width
    if stride is None or stride == packed:
        binbuf[off:off + arr.nbytes] = arr.tobytes()
    else:
        for i in range(a["count"]):
            start = off + i * stride
            binbuf[start:start + packed] = arr[i].tobytes()
    if np.issubdtype(np.dtype(dtype), np.floating) and a["type"].startswith("VEC"):
        a["min"] = arr.min(axis=0).astype(float).tolist()
        a["max"] = arr.max(axis=0).astype(float).tolist()

def save_glb(js, chunks, order, path):
    chunks[0x004E4942] = bytearray(chunks[0x004E4942])
    js["buffers"][0]["byteLength"] = len(chunks[0x004E4942])
    jb = json.dumps(js, separators=(",", ":")).encode("utf-8")
    while len(jb) % 4:
        jb += b" "
    chunks[0x4E4F534A] = bytearray(jb)
    while len(chunks[0x004E4942]) % 4:
        chunks[0x004E4942] += b"\x00"

    total = 12 + sum(8 + len(chunks[t]) for t in order)
    data = bytearray(struct.pack("<4sII", b"glTF", 2, total))
    for t in order:
        data += struct.pack("<II", len(chunks[t]), t)
        data += chunks[t]
    Path(path).write_bytes(data)

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: FIX_METAPERSON_HAIR_POSTURE.py input.glb output.glb")

    src = Path(sys.argv[1]).resolve()
    dst = Path(sys.argv[2]).resolve()
    if not src.exists():
        raise FileNotFoundError(src)

    js, chunks, order = parse_glb(src)
    binbuf = chunks[0x004E4942]

    # Find the dedicated haircut mesh by material name.
    hair_prim = None
    for mesh in js.get("meshes", []):
        for prim in mesh.get("primitives", []):
            mi = prim.get("material")
            if mi is None:
                continue
            name = (js["materials"][mi].get("name") or "").lower()
            if name == "haircut":
                hair_prim = prim
                break
        if hair_prim is not None:
            break
    if hair_prim is None:
        raise RuntimeError("HAIRCUT_MESH_NOT_FOUND")

    pidx = hair_prim["attributes"]["POSITION"]
    nidx = hair_prim["attributes"].get("NORMAL")
    iidx = hair_prim["indices"]

    pos = read_accessor(js, binbuf, pidx).astype(np.float32)
    indices = read_accessor(js, binbuf, iidx).reshape(-1, 3).astype(np.int64)

    mn = pos.min(axis=0)
    mx = pos.max(axis=0)
    cx = (mn[0] + mx[0]) * 0.5
    cy = (mn[1] + mx[1]) * 0.5
    cz = (mn[2] + mx[2]) * 0.5
    hx = max((mx[0] - mn[0]) * 0.5, 1e-6)
    hy = max(mx[1] - mn[1], 1e-6)
    hz = max((mx[2] - mn[2]) * 0.5, 1e-6)

    # Hair only:
    # medium-length textured/curly crown, tighter sides and nape.
    for i in range(len(pos)):
        x, y, z = [float(v) for v in pos[i]]
        h = np.clip((y - mn[1]) / hy, 0.0, 1.0)
        side = abs(x - cx) / hx
        front = (z - cz) / hz

        # Shorter sides / temples.
        if h < 0.72 and side > 0.50:
            t = np.clip((side - 0.50) / 0.50, 0.0, 1.0)
            low = 1.0 - np.clip((h - 0.25) / 0.47, 0.0, 1.0)
            shrink = 0.10 + 0.14 * t * low
            x = cx + (x - cx) * (1.0 - shrink)
            z = cz + (z - cz) * (1.0 - 0.035 * t)

        # Fuller curly crown/top.
        if h > 0.34:
            top = np.clip((h - 0.34) / 0.66, 0.0, 1.0)
            rx = (x - cx) / hx
            rz = (z - cz) / hz
            rr = max(math.hypot(rx, rz), 1e-6)
            ux, uz = rx / rr, rz / rr

            side_control = 1.0 - 0.52 * np.clip((side - 0.52) / 0.48, 0.0, 1.0) * (1.0 - 0.70 * top)
            front_control = 0.78 if front > 0.10 else 1.0
            volume = (0.0035 + 0.0125 * top) * side_control * front_control

            curl1 = math.sin((x - cx) * 95.0 + (z - cz) * 82.0 + y * 48.0)
            curl2 = math.cos((x - cx) * 71.0 - (z - cz) * 89.0 + y * 44.0)
            curl_amp = (0.0018 + 0.0048 * top) * side_control

            x += ux * (volume + curl_amp * curl1)
            z += uz * (volume + 0.75 * curl_amp * curl2)
            y += 0.0015 + 0.0090 * top + 0.0018 * math.sin(
                (x - cx) * 74.0 + (z - cz) * 67.0 + y * 38.0
            )

        # Tidy the nape.
        if h < 0.26 and front < 0.0:
            z = cz + (z - cz) * 0.93

        pos[i] = (x, y, z)

    write_accessor(js, binbuf, pidx, pos)

    if nidx is not None:
        vn = np.zeros_like(pos)
        tri = pos[indices]
        fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
        for k in range(3):
            np.add.at(vn, indices[:, k], fn)
        lens = np.linalg.norm(vn, axis=1, keepdims=True)
        lens[lens < 1e-8] = 1.0
        vn /= lens
        write_accessor(js, binbuf, nidx, vn.astype(np.float32))

    # Slightly dark-brown hair; texture is kept intact.
    for mat in js.get("materials", []):
        if (mat.get("name") or "").lower() == "haircut":
            pbr = mat.setdefault("pbrMetallicRoughness", {})
            old = pbr.get("baseColorFactor", [1, 1, 1, 1])
            pbr["baseColorFactor"] = [0.42, 0.33, 0.27, old[3] if len(old) > 3 else 1.0]
            pbr["roughnessFactor"] = 0.82

    # Posture only: lower the two upper arms from the MetaPerson T-pose.
    # These quaternions are calculated specifically from hector-metaperson.glb;
    # they pose the arms naturally downward without changing inverse bind matrices.
    nodes = js.get("nodes", [])
    by_name = {n.get("name"): n for n in nodes if n.get("name")}
    if "LeftArm" not in by_name or "RightArm" not in by_name:
        raise RuntimeError("ARM_BONES_NOT_FOUND")

    by_name["LeftArm"]["rotation"] = [
        0.6583652887892534,
        -0.01283712939503643,
        0.01049041174875659,
        0.7525159838087693,
    ]
    by_name["RightArm"]["rotation"] = [
        0.6583656453792173,
        0.012837396541444331,
        -0.010490946217789732,
        0.7525156598250299,
    ]

    dst.parent.mkdir(parents=True, exist_ok=True)
    save_glb(js, chunks, order, dst)

    print("RHB_METAPERSON_HAIR_POSTURE_OK=True")
    print(f"OUTPUT={dst}")
    print(f"HAIR_VERTICES={len(pos)}")
    print("POSTURE=ARMS_DOWN_NATURAL")

if __name__ == "__main__":
    main()
