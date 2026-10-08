#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import math
import struct
from collections import Counter
from pathlib import Path


GLB_MAGIC = b"glTF"
JSON_CHUNK = 0x4E4F534A


def read_glb_json(path: Path) -> dict:
    with path.open("rb") as fh:
        header = fh.read(12)
        if len(header) != 12:
            raise SystemExit("Invalid GLB header.")
        magic, version, total_length = struct.unpack("<4sII", header)
        if magic != GLB_MAGIC:
            raise SystemExit(f"Unexpected GLB magic: {magic!r}")
        if version != 2:
            raise SystemExit(f"Unsupported GLB version: {version}")
        chunk_header = fh.read(8)
        if len(chunk_header) != 8:
            raise SystemExit("GLB JSON chunk header missing.")
        chunk_length, chunk_type = struct.unpack("<II", chunk_header)
        if chunk_type != JSON_CHUNK:
            raise SystemExit("First GLB chunk is not JSON.")
        raw = fh.read(chunk_length)
        if len(raw) != chunk_length:
            raise SystemExit("GLB JSON chunk truncated.")
    return json.loads(raw.decode("utf-8").rstrip("\x00 \t\r\n"))


def mat_identity():
    return [
        [1.0, 0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0, 0.0],
        [0.0, 0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]


def mat_mul(a, b):
    out = [[0.0] * 4 for _ in range(4)]
    for r in range(4):
        for c in range(4):
            out[r][c] = sum(a[r][k] * b[k][c] for k in range(4))
    return out


def mat_from_node(node):
    if "matrix" in node:
        m = node["matrix"]
        return [
            [m[0], m[4], m[8], m[12]],
            [m[1], m[5], m[9], m[13]],
            [m[2], m[6], m[10], m[14]],
            [m[3], m[7], m[11], m[15]],
        ]

    t = node.get("translation", [0.0, 0.0, 0.0])
    s = node.get("scale", [1.0, 1.0, 1.0])
    q = node.get("rotation", [0.0, 0.0, 0.0, 1.0])
    x, y, z, w = q
    xx, yy, zz = x * x, y * y, z * z
    xy, xz, yz = x * y, x * z, y * z
    wx, wy, wz = w * x, w * y, w * z

    rot = [
        [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0.0],
        [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0.0],
        [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    scale = [
        [s[0], 0.0, 0.0, 0.0],
        [0.0, s[1], 0.0, 0.0],
        [0.0, 0.0, s[2], 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    trans = mat_identity()
    trans[0][3], trans[1][3], trans[2][3] = t
    return mat_mul(trans, mat_mul(rot, scale))


def transform_point(m, p):
    x, y, z = p
    return [
        m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3],
        m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3],
        m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3],
    ]


def union_bounds(current, new_bounds):
    if new_bounds is None:
        return current
    if current is None:
        return [new_bounds[0][:], new_bounds[1][:]]
    for i in range(3):
        current[0][i] = min(current[0][i], new_bounds[0][i])
        current[1][i] = max(current[1][i], new_bounds[1][i])
    return current


def mesh_local_bounds(doc, mesh_index):
    accessors = doc.get("accessors", [])
    meshes = doc.get("meshes", [])
    if mesh_index is None or mesh_index >= len(meshes):
        return None
    result = None
    for prim in meshes[mesh_index].get("primitives", []):
        pos_accessor = (prim.get("attributes") or {}).get("POSITION")
        if pos_accessor is None or pos_accessor >= len(accessors):
            continue
        acc = accessors[pos_accessor]
        amin, amax = acc.get("min"), acc.get("max")
        if not amin or not amax or len(amin) < 3 or len(amax) < 3:
            continue
        result = union_bounds(result, [list(map(float, amin[:3])), list(map(float, amax[:3]))])
    return result


def transform_bounds(bounds, matrix):
    if bounds is None:
        return None
    lo, hi = bounds
    corners = []
    for x in (lo[0], hi[0]):
        for y in (lo[1], hi[1]):
            for z in (lo[2], hi[2]):
                corners.append(transform_point(matrix, [x, y, z]))
    out_lo = [min(p[i] for p in corners) for i in range(3)]
    out_hi = [max(p[i] for p in corners) for i in range(3)]
    return [out_lo, out_hi]


def main() -> int:
    ap = argparse.ArgumentParser(description="Low-memory GLB structural analyzer.")
    ap.add_argument("glb", type=Path)
    ap.add_argument("--json", dest="json_out", type=Path, required=True)
    ap.add_argument("--csv", dest="csv_out", type=Path, required=True)
    ap.add_argument("--grid-m", type=float, default=25.0)
    ap.add_argument("--top", type=int, default=200)
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"GLB not found: {args.glb}")

    doc = read_glb_json(args.glb)
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    scenes = doc.get("scenes", [])
    scene_index = doc.get("scene", 0)
    root_nodes = scenes[scene_index].get("nodes", []) if scenes and scene_index < len(scenes) else list(range(len(nodes)))

    local_bounds_cache = {}
    rows = []
    cells = Counter()
    global_bounds = None
    visited_instances = 0

    def visit(node_index, parent_matrix, path):
        nonlocal global_bounds, visited_instances
        if node_index < 0 or node_index >= len(nodes):
            return
        node = nodes[node_index]
        world = mat_mul(parent_matrix, mat_from_node(node))
        node_path = path + [node_index]

        mesh_index = node.get("mesh")
        if mesh_index is not None:
            visited_instances += 1
            if mesh_index not in local_bounds_cache:
                local_bounds_cache[mesh_index] = mesh_local_bounds(doc, mesh_index)
            world_bounds = transform_bounds(local_bounds_cache[mesh_index], world)
            if world_bounds is not None:
                global_bounds = union_bounds(global_bounds, world_bounds)
                lo, hi = world_bounds
                extent_mm = [hi[i] - lo[i] for i in range(3)]
                center_mm = [(hi[i] + lo[i]) * 0.5 for i in range(3)]
                extent_m = [v / 1000.0 for v in extent_mm]
                center_m = [v / 1000.0 for v in center_mm]
                diag_m = math.sqrt(sum(v * v for v in extent_m))
                cell = (
                    round(center_m[0] / args.grid_m),
                    round(center_m[2] / args.grid_m),
                )
                cells[cell] += 1
                rows.append(
                    {
                        "nodeIndex": node_index,
                        "nodeName": node.get("name", ""),
                        "meshIndex": mesh_index,
                        "meshName": meshes[mesh_index].get("name", "") if mesh_index < len(meshes) else "",
                        "path": "/".join(map(str, node_path)),
                        "extent_x_m": extent_m[0],
                        "extent_y_m": extent_m[1],
                        "extent_z_m": extent_m[2],
                        "center_x_m": center_m[0],
                        "center_y_m": center_m[1],
                        "center_z_m": center_m[2],
                        "diag_m": diag_m,
                    }
                )

        for child in node.get("children", []):
            visit(child, world, node_path)

    identity = mat_identity()
    for root in root_nodes:
        visit(root, identity, [])

    rows.sort(key=lambda row: row["diag_m"], reverse=True)
    top_rows = rows[: args.top]

    global_extent_m = None
    global_bounds_m = None
    if global_bounds is not None:
        global_bounds_m = [[v / 1000.0 for v in global_bounds[0]], [v / 1000.0 for v in global_bounds[1]]]
        global_extent_m = [
            global_bounds_m[1][i] - global_bounds_m[0][i]
            for i in range(3)
        ]

    primitive_count = sum(len(mesh.get("primitives", [])) for mesh in meshes)

    result = {
        "analysisMode": "GLB_JSON_ONLY_LOW_MEMORY",
        "file": str(args.glb),
        "sizeBytes": args.glb.stat().st_size,
        "glTF": {
            "nodes": len(nodes),
            "meshes": len(meshes),
            "meshPrimitives": primitive_count,
            "meshInstancesVisited": visited_instances,
            "accessors": len(doc.get("accessors", [])),
            "materials": len(doc.get("materials", [])),
            "images": len(doc.get("images", [])),
            "textures": len(doc.get("textures", [])),
        },
        "globalBoundsM": global_bounds_m,
        "globalExtentM": global_extent_m,
        "topNodeInstancesByDiagonal": top_rows[:50],
        "densestXZCells": [
            {
                "cellX": x,
                "cellZ": z,
                "gridM": args.grid_m,
                "count": count,
                "centerApproxM": [x * args.grid_m, z * args.grid_m],
            }
            for (x, z), count in cells.most_common(30)
        ],
        "recommendation": (
            "Use node/mesh names, large extents and dense spatial cells to identify "
            "venue geometry versus site context, terrain, geolocation and outliers. "
            "No binary mesh buffers were loaded by this analysis."
        ),
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.csv_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    fieldnames = list(top_rows[0].keys()) if top_rows else ["nodeIndex"]
    with args.csv_out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in top_rows:
            writer.writerow(row)

    print(json.dumps({
        "analysisMode": result["analysisMode"],
        "glTF": result["glTF"],
        "globalExtentM": result["globalExtentM"],
        "densestXZCells": result["densestXZCells"][:10],
        "json": str(args.json_out),
        "csv": str(args.csv_out),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
