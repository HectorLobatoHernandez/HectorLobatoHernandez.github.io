#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import math
import re
import struct
from collections import Counter, defaultdict
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


def mesh_weight_stats(doc, mesh_index):
    accessors = doc.get("accessors", [])
    buffer_views = doc.get("bufferViews", [])
    meshes = doc.get("meshes", [])
    if mesh_index is None or mesh_index >= len(meshes):
        return {
            "primitiveCount": 0,
            "vertexCount": 0,
            "indexCount": 0,
            "triangleCount": 0,
            "referencedBufferBytes": 0,
        }

    vertex_count = 0
    index_count = 0
    used_buffer_views = set()
    primitives = meshes[mesh_index].get("primitives", [])

    for prim in primitives:
        attrs = prim.get("attributes") or {}
        pos = attrs.get("POSITION")
        if pos is not None and pos < len(accessors):
            vertex_count += int(accessors[pos].get("count", 0) or 0)

        idx = prim.get("indices")
        if idx is not None and idx < len(accessors):
            index_count += int(accessors[idx].get("count", 0) or 0)

        accessor_ids = list(attrs.values())
        if idx is not None:
            accessor_ids.append(idx)

        for accessor_id in accessor_ids:
            if accessor_id is None or accessor_id >= len(accessors):
                continue
            view_id = accessors[accessor_id].get("bufferView")
            if view_id is not None and view_id < len(buffer_views):
                used_buffer_views.add(view_id)

    referenced_bytes = sum(
        int(buffer_views[view_id].get("byteLength", 0) or 0)
        for view_id in used_buffer_views
    )

    return {
        "primitiveCount": len(primitives),
        "vertexCount": vertex_count,
        "indexCount": index_count,
        "triangleCount": index_count // 3,
        "referencedBufferBytes": referenced_bytes,
    }


def classify_family(name: str):
    upper = (name or "").upper()
    rules = [
        ("VEGETACION", "PROXY_OR_REMOVE", "Decorative vegetation is a high-poly web candidate; keep only if composition needs it."),
        ("CESTA+FRUTAS", "REMOVE_WEB_DECOR", "Decorative tabletop prop; omit from technical web geometry."),
        ("WEAVED_LAMP_BAMBOO", "INSTANCE_OR_PROXY_KEEP_LOCATIONS", "Design-significant pendant; keep location/count but instance or proxy the repeated geometry."),
        ("DIFUSOR_2D", "INSTANCE_KEEP_ACOUSTIC_INTENT", "Acoustic element; preserve design intent and placement, but instance repeated geometry."),
        ("DRILL_PRESS_CLAMP", "REVIEW_REMOVE_HARDWARE_DETAIL", "Imported hardware/detail family; review whether it belongs in the final venue model."),
        ("TECHO", "KEEP_ARCHITECTURE", "Architectural ceiling geometry."),
        ("MUROS", "KEEP_ARCHITECTURE", "Architectural wall geometry."),
        ("COLUMNAS", "KEEP_ARCHITECTURE", "Architectural column geometry."),
        ("RAIL_BLACK", "KEEP_SIMPLIFY_LIGHTING", "Lighting rail; preserve route/position and simplify repeated detail."),
        ("RAIL_WHITE", "KEEP_SIMPLIFY_LIGHTING", "Lighting rail; preserve route/position and simplify repeated detail."),
        ("DJ", "KEEP_TECHNICAL", "DJ/fabrication geometry should be preserved for the technical case."),
    ]
    for needle, action, reason in rules:
        if needle in upper:
            return needle, action, reason

    clean = re.sub(r"^mesh_\d+_", "", name or "")
    clean = clean.replace("ROOT__", "")
    clean = re.sub(r"Grupo#\d+__", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"_AB(?:_.*)?$", "", clean)
    parts = [p for p in clean.split("__") if p]
    family = parts[-1] if parts else (clean or "UNNAMED")
    family = re.sub(r"#\d+$", "", family)
    family = re.sub(r"Component_\d+_", "", family, flags=re.IGNORECASE)
    family = family[:120]
    return family.upper(), "REVIEW", "No automatic web action assigned."


def family_summary(rows):
    grouped = defaultdict(lambda: {
        "instanceCount": 0,
        "estimatedReferencedBufferBytes": 0,
        "vertexCount": 0,
        "triangleCount": 0,
        "maxDiagM": 0.0,
        "exampleNames": [],
        "suggestedAction": "REVIEW",
        "reason": "",
    })

    for row in rows:
        family, action, reason = classify_family(row.get("nodeName", ""))
        item = grouped[family]
        item["family"] = family
        item["instanceCount"] += 1
        item["estimatedReferencedBufferBytes"] += int(row.get("referencedBufferBytes", 0) or 0)
        item["vertexCount"] += int(row.get("vertexCount", 0) or 0)
        item["triangleCount"] += int(row.get("triangleCount", 0) or 0)
        item["maxDiagM"] = max(item["maxDiagM"], float(row.get("diag_m", 0.0) or 0.0))
        item["suggestedAction"] = action
        item["reason"] = reason
        if len(item["exampleNames"]) < 3:
            item["exampleNames"].append(row.get("nodeName", ""))

    out = []
    for item in grouped.values():
        item["estimatedReferencedBufferMiB"] = item["estimatedReferencedBufferBytes"] / (1024.0 * 1024.0)
        out.append(item)

    out.sort(key=lambda x: x["estimatedReferencedBufferBytes"], reverse=True)
    return out


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
            weight = mesh_weight_stats(doc, mesh_index)
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
                        "primitiveCount": weight["primitiveCount"],
                        "vertexCount": weight["vertexCount"],
                        "indexCount": weight["indexCount"],
                        "triangleCount": weight["triangleCount"],
                        "referencedBufferBytes": weight["referencedBufferBytes"],
                        "referencedBufferMiB": weight["referencedBufferBytes"] / (1024.0 * 1024.0),
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

    rows_by_diagonal = sorted(rows, key=lambda row: row["diag_m"], reverse=True)
    rows_by_weight = sorted(rows, key=lambda row: row["referencedBufferBytes"], reverse=True)
    families = family_summary(rows)
    top_rows = rows_by_diagonal[: args.top]
    top_weight_rows = rows_by_weight[: args.top]

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
        "totals": {
            "vertexCount": sum(row["vertexCount"] for row in rows),
            "indexCount": sum(row["indexCount"] for row in rows),
            "triangleCount": sum(row["triangleCount"] for row in rows),
            "referencedBufferBytesAcrossInstances": sum(row["referencedBufferBytes"] for row in rows)
        },
        "familySummaryByEstimatedReferencedBytes": families[:100],
        "topNodeInstancesByReferencedBytes": top_weight_rows[:50],
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
        "weightAccountingNote": (
            "referencedBufferBytes is an optimization estimate per mesh instance and may double-count "
            "bufferViews shared by several meshes. Use it for ranking, not as exact GLB storage size."
        ),
        "recommendation": (
            "Use familySummaryByEstimatedReferencedBytes to decide KEEP / INSTANCE / PROXY / REMOVE "
            "without modifying the private SketchUp master. No binary mesh buffers were loaded by this analysis."
        ),
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.csv_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    fieldnames = list(top_rows[0].keys()) if top_rows else ["nodeIndex"]
    with args.csv_out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in top_weight_rows:
            writer.writerow(row)

    print(json.dumps({
        "analysisMode": result["analysisMode"],
        "glTF": result["glTF"],
        "globalExtentM": result["globalExtentM"],
        "topFamilies": [
            {
                "family": item["family"],
                "instanceCount": item["instanceCount"],
                "estimatedReferencedBufferMiB": item["estimatedReferencedBufferMiB"],
                "suggestedAction": item["suggestedAction"],
            }
            for item in result["familySummaryByEstimatedReferencedBytes"][:15]
        ],
        "densestXZCells": result["densestXZCells"][:10],
        "json": str(args.json_out),
        "csv": str(args.csv_out),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
