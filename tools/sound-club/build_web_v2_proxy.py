#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import struct
from collections import defaultdict
from pathlib import Path

import build_web_v1_lossless as v1


PROJECT_ID = "SOUND_CLUB_CDM"
MAX_PROXY_NODES = 6000

PROXY_RULES = {
    "KEEP_MERGE_ARCHITECTURE": {
        "category": "architecture",
        "gridMm": 3000.0,
    },
    "KEEP_SIMPLIFY_ACOUSTIC": {
        "category": "acoustic",
        "gridMm": 1500.0,
    },
    "PROXY_FURNITURE": {
        "category": "furniture",
        "gridMm": 2200.0,
    },
    "INSTANCE_SIMPLIFY_HARDWARE": {
        "category": "hardware",
        "gridMm": 1200.0,
    },
    "INSTANCE_PROXY_LIGHTING": {
        "category": "lighting",
        "gridMm": 1000.0,
    },
    "KEEP_PROXY_LIGHTING": {
        "category": "lighting",
        "gridMm": 1000.0,
    },
    "KEEP_PROXY_DJ_EQUIPMENT": {
        "category": "dj",
        "gridMm": 1200.0,
    },
}

PROXY_MATERIALS = {
    "architecture": {
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.56, 0.58, 0.60, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.82,
        },
    },
    "acoustic": {
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.24, 0.23, 0.21, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.9,
        },
    },
    "furniture": {
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.46, 0.37, 0.27, 1.0],
            "metallicFactor": 0.0,
            "roughnessFactor": 0.82,
        },
    },
    "hardware": {
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.12, 0.13, 0.14, 1.0],
            "metallicFactor": 0.72,
            "roughnessFactor": 0.42,
        },
    },
    "lighting": {
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.62, 0.47, 0.27, 1.0],
            "metallicFactor": 0.12,
            "roughnessFactor": 0.62,
        },
        "emissiveFactor": [0.22, 0.12, 0.035],
    },
    "dj": {
        "pbrMetallicRoughness": {
            "baseColorFactor": [0.10, 0.10, 0.11, 1.0],
            "metallicFactor": 0.35,
            "roughnessFactor": 0.55,
        },
    },
}


def matrix_close(a, b, tol=1e-6):
    for r in range(4):
        for c in range(4):
            if abs(a[r][c] - b[r][c]) > tol:
                return False
    return True


def collect_world_matrices(doc):
    nodes = doc.get("nodes", [])
    scenes = doc.get("scenes", [])
    if not scenes:
        roots = list(range(len(nodes)))
        scene_roots = [roots]
    else:
        scene_roots = [scene.get("nodes", []) for scene in scenes]

    world = {}
    reachable = set()
    visiting = set()

    def visit(index, parent):
        if index < 0 or index >= len(nodes):
            return
        if index in visiting:
            raise SystemExit("Node hierarchy cycle detected.")
        visiting.add(index)
        current = v1.mat_mul(parent, v1.mat_from_node(nodes[index]))
        if index in world and not matrix_close(world[index], current):
            raise SystemExit(
                f"Node {index} is instanced through multiple transforms; "
                "V2 proxy build requires an unambiguous world transform."
            )
        world[index] = current
        reachable.add(index)
        for child in nodes[index].get("children", []):
            visit(child, current)
        visiting.remove(index)

    for roots in scene_roots:
        for root in roots:
            visit(root, v1.mat_identity())

    return world, reachable


def bounds_center(bounds):
    return [
        (bounds[0][i] + bounds[1][i]) * 0.5
        for i in range(3)
    ]


def union_bounds(a, b):
    if a is None:
        return [b[0][:], b[1][:]]
    for i in range(3):
        a[0][i] = min(a[0][i], b[0][i])
        a[1][i] = max(a[1][i], b[1][i])
    return a


def cluster_proxy_items(items, grid_scale=1.0):
    clusters = {}
    for item in items:
        grid = float(item["baseGridMm"]) * grid_scale
        center = bounds_center(item["worldBounds"])
        cell = (
            int(math.floor(center[0] / grid)),
            int(math.floor(center[1] / grid)),
            int(math.floor(center[2] / grid)),
        )
        key = (
            item["category"],
            item["group"],
            cell,
        )
        cluster = clusters.get(key)
        if cluster is None:
            clusters[key] = {
                "category": item["category"],
                "group": item["group"],
                "gridMm": grid,
                "bounds": [
                    item["worldBounds"][0][:],
                    item["worldBounds"][1][:],
                ],
                "sourceNodes": 1,
            }
        else:
            cluster["bounds"] = union_bounds(
                cluster["bounds"],
                item["worldBounds"],
            )
            cluster["sourceNodes"] += 1
    return list(clusters.values())


def adaptive_clusters(items):
    scale = 1.0
    clusters = cluster_proxy_items(items, scale)
    while len(clusters) > MAX_PROXY_NODES:
        scale *= 1.5
        clusters = cluster_proxy_items(items, scale)
        if scale > 12.0:
            raise SystemExit(
                f"Proxy clustering still exceeds {MAX_PROXY_NODES} nodes "
                f"after grid scale {scale:.2f}."
            )
    return clusters, scale


def proxy_node_matrix(bounds, min_extent_mm=20.0):
    lo, hi = bounds
    center = [(lo[i] + hi[i]) * 0.5 for i in range(3)]
    extent = [max(float(hi[i] - lo[i]), min_extent_mm) for i in range(3)]
    matrix = [
        [extent[0], 0.0, 0.0, center[0]],
        [0.0, extent[1], 0.0, center[1]],
        [0.0, 0.0, extent[2], center[2]],
        [0.0, 0.0, 0.0, 1.0],
    ]
    return v1.gltf_matrix_from_row_major(matrix)


def cube_payloads():
    positions = [
        # +X
        (0.5,-0.5,-0.5),(0.5,0.5,-0.5),(0.5,0.5,0.5),(0.5,-0.5,0.5),
        # -X
        (-0.5,-0.5,0.5),(-0.5,0.5,0.5),(-0.5,0.5,-0.5),(-0.5,-0.5,-0.5),
        # +Y
        (-0.5,0.5,-0.5),(-0.5,0.5,0.5),(0.5,0.5,0.5),(0.5,0.5,-0.5),
        # -Y
        (-0.5,-0.5,0.5),(-0.5,-0.5,-0.5),(0.5,-0.5,-0.5),(0.5,-0.5,0.5),
        # +Z
        (-0.5,-0.5,0.5),(0.5,-0.5,0.5),(0.5,0.5,0.5),(-0.5,0.5,0.5),
        # -Z
        (0.5,-0.5,-0.5),(-0.5,-0.5,-0.5),(-0.5,0.5,-0.5),(0.5,0.5,-0.5),
    ]
    normals = (
        [(1.0,0.0,0.0)]*4 +
        [(-1.0,0.0,0.0)]*4 +
        [(0.0,1.0,0.0)]*4 +
        [(0.0,-1.0,0.0)]*4 +
        [(0.0,0.0,1.0)]*4 +
        [(0.0,0.0,-1.0)]*4
    )
    indices = []
    for face in range(6):
        b = face * 4
        indices.extend([b,b+1,b+2,b,b+2,b+3])

    pos_bytes = b"".join(struct.pack("<fff", *p) for p in positions)
    normal_bytes = b"".join(struct.pack("<fff", *n) for n in normals)
    index_bytes = struct.pack("<" + "H"*len(indices), *indices)
    return pos_bytes, normal_bytes, index_bytes


def collect_proxy_selection(doc, plan):
    action_by_group = {
        str(row.get("topLevelGroup", "UNNAMED")).upper():
            row.get("action", "REVIEW_MANUALLY")
        for row in plan.get("groups") or []
    }

    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    world, reachable = collect_world_matrices(doc)

    mesh_bounds_cache = {}
    proxy_items = []
    proxy_node_ids = set()
    removed_by_action = defaultdict(int)
    removed_by_group = defaultdict(int)

    for node_id in sorted(reachable):
        node = nodes[node_id]
        mesh_id = node.get("mesh")
        if mesh_id is None:
            continue

        group = v1.top_level_group(node.get("name", ""))
        action = action_by_group.get(group, "REVIEW_MANUALLY")
        rule = PROXY_RULES.get(action)
        if not rule:
            continue

        if mesh_id not in mesh_bounds_cache:
            mesh_bounds_cache[mesh_id] = v1.mesh_local_bounds(doc, mesh_id)
        local_bounds = mesh_bounds_cache[mesh_id]
        if local_bounds is None:
            continue

        world_bounds = v1.transform_bounds(local_bounds, world[node_id])
        proxy_items.append({
            "nodeId": node_id,
            "group": group,
            "action": action,
            "category": rule["category"],
            "baseGridMm": rule["gridMm"],
            "worldBounds": world_bounds,
        })
        proxy_node_ids.add(node_id)
        removed_by_action[action] += 1
        removed_by_group[group] += 1

    return {
        "actionByGroup": action_by_group,
        "worldMatrices": world,
        "reachable": reachable,
        "proxyItems": proxy_items,
        "proxyNodeIds": proxy_node_ids,
        "removedByAction": dict(removed_by_action),
        "removedByGroup": dict(removed_by_group),
    }


def build_retained_document(doc, selection, clusters):
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    buffer_views = doc.get("bufferViews", [])
    materials = doc.get("materials", [])

    proxy_node_ids = selection["proxyNodeIds"]
    reachable = selection["reachable"]

    keep_cache = {}
    visiting = set()

    def keep_node(index):
        if index not in reachable:
            return False
        if index in keep_cache:
            return keep_cache[index]
        if index in visiting:
            raise SystemExit("Node hierarchy cycle detected during V2 keep pass.")
        visiting.add(index)

        node = nodes[index]
        keep_mesh = node.get("mesh") is not None and index not in proxy_node_ids
        keep_child = any(
            keep_node(child)
            for child in node.get("children", [])
            if 0 <= child < len(nodes)
        )
        keep = keep_mesh or keep_child or node.get("camera") is not None
        keep_cache[index] = keep
        visiting.remove(index)
        return keep

    for node_id in reachable:
        keep_node(node_id)

    kept_node_ids = [i for i in sorted(reachable) if keep_cache.get(i, False)]
    node_map = {old: new for new, old in enumerate(kept_node_ids)}

    used_mesh_ids = sorted({
        nodes[node_id]["mesh"]
        for node_id in kept_node_ids
        if nodes[node_id].get("mesh") is not None
        and node_id not in proxy_node_ids
    })
    mesh_map = {old: new for new, old in enumerate(used_mesh_ids)}

    accessor_ids = set()
    material_ids = set()
    for mesh_id in used_mesh_ids:
        for primitive in meshes[mesh_id].get("primitives", []):
            accessor_ids.update(v1.primitive_accessor_ids(primitive))
            if primitive.get("material") is not None:
                material_ids.add(primitive["material"])

    accessor_ids = sorted(accessor_ids)
    material_ids = sorted(material_ids)
    buffer_view_ids = sorted(v1.accessor_buffer_views(doc, accessor_ids))

    accessor_map = {old: new for new, old in enumerate(accessor_ids)}
    material_map = {old: new for new, old in enumerate(material_ids)}
    view_map = {old: new for new, old in enumerate(buffer_view_ids)}

    new_nodes = []
    for old in kept_node_ids:
        node = json.loads(json.dumps(nodes[old]))
        if old in proxy_node_ids:
            node.pop("mesh", None)
        elif node.get("mesh") is not None:
            node["mesh"] = mesh_map[node["mesh"]]

        if node.get("children"):
            new_children = [
                node_map[child]
                for child in node["children"]
                if child in node_map
            ]
            if new_children:
                node["children"] = new_children
            else:
                node.pop("children", None)
        new_nodes.append(node)

    new_meshes = []
    for old_mesh in used_mesh_ids:
        mesh = json.loads(json.dumps(meshes[old_mesh]))
        for primitive in mesh.get("primitives", []):
            primitive["attributes"] = {
                semantic: accessor_map[accessor_id]
                for semantic, accessor_id
                in (primitive.get("attributes") or {}).items()
            }
            if primitive.get("indices") is not None:
                primitive["indices"] = accessor_map[primitive["indices"]]
            if primitive.get("material") is not None:
                primitive["material"] = material_map[primitive["material"]]
            if primitive.get("targets"):
                primitive["targets"] = [
                    {
                        semantic: accessor_map[accessor_id]
                        for semantic, accessor_id in target.items()
                    }
                    for target in primitive["targets"]
                ]
        new_meshes.append(mesh)

    new_accessors = []
    for old_accessor in accessor_ids:
        acc = json.loads(json.dumps(accessors[old_accessor]))
        if acc.get("bufferView") is not None:
            acc["bufferView"] = view_map[acc["bufferView"]]
        new_accessors.append(acc)

    new_views = [
        json.loads(json.dumps(buffer_views[old_view]))
        for old_view in buffer_view_ids
    ]
    new_materials = [
        json.loads(json.dumps(materials[old_mat]))
        for old_mat in material_ids
    ]

    new_scenes = []
    for scene in doc.get("scenes", []):
        sc = json.loads(json.dumps(scene))
        sc["nodes"] = [
            node_map[root]
            for root in sc.get("nodes", [])
            if root in node_map
        ]
        new_scenes.append(sc)

    new_doc = json.loads(json.dumps(doc))
    new_doc["nodes"] = new_nodes
    new_doc["meshes"] = new_meshes
    new_doc["accessors"] = new_accessors
    new_doc["bufferViews"] = new_views
    new_doc["materials"] = new_materials
    new_doc["scenes"] = new_scenes
    new_doc["buffers"] = [{"byteLength": 0}]

    # Add proxy materials.
    proxy_material_index = {}
    for category in sorted({cluster["category"] for cluster in clusters}):
        material = json.loads(json.dumps(PROXY_MATERIALS[category]))
        material["name"] = f"WEB_PROXY_{category.upper()}"
        proxy_material_index[category] = len(new_doc["materials"])
        new_doc["materials"].append(material)

    # Reserve three accessors/bufferViews for one reusable unit cube.
    proxy_position_accessor = len(new_doc["accessors"])
    proxy_normal_accessor = proxy_position_accessor + 1
    proxy_index_accessor = proxy_position_accessor + 2

    proxy_position_view = len(new_doc["bufferViews"])
    proxy_normal_view = proxy_position_view + 1
    proxy_index_view = proxy_position_view + 2

    new_doc["bufferViews"].extend([
        {"buffer": 0, "byteOffset": 0, "byteLength": 0, "target": 34962},
        {"buffer": 0, "byteOffset": 0, "byteLength": 0, "target": 34962},
        {"buffer": 0, "byteOffset": 0, "byteLength": 0, "target": 34963},
    ])

    new_doc["accessors"].extend([
        {
            "bufferView": proxy_position_view,
            "byteOffset": 0,
            "componentType": 5126,
            "count": 24,
            "type": "VEC3",
            "min": [-0.5, -0.5, -0.5],
            "max": [0.5, 0.5, 0.5],
        },
        {
            "bufferView": proxy_normal_view,
            "byteOffset": 0,
            "componentType": 5126,
            "count": 24,
            "type": "VEC3",
        },
        {
            "bufferView": proxy_index_view,
            "byteOffset": 0,
            "componentType": 5123,
            "count": 36,
            "type": "SCALAR",
            "min": [0],
            "max": [23],
        },
    ])

    proxy_mesh_index = {}
    for category in sorted(proxy_material_index):
        mesh_id = len(new_doc["meshes"])
        proxy_mesh_index[category] = mesh_id
        new_doc["meshes"].append({
            "name": f"WEB_PROXY_CUBE_{category.upper()}",
            "primitives": [{
                "attributes": {
                    "POSITION": proxy_position_accessor,
                    "NORMAL": proxy_normal_accessor,
                },
                "indices": proxy_index_accessor,
                "material": proxy_material_index[category],
                "mode": 4,
            }],
        })

    proxy_node_indices = []
    for idx, cluster in enumerate(clusters):
        node_index = len(new_doc["nodes"])
        proxy_node_indices.append(node_index)
        new_doc["nodes"].append({
            "name": (
                f"WEB_PROXY__{cluster['category'].upper()}__"
                f"{cluster['group']}__{idx:05d}"
            ),
            "mesh": proxy_mesh_index[cluster["category"]],
            "matrix": proxy_node_matrix(cluster["bounds"]),
            "extras": {
                "webProxy": True,
                "sourceGroup": cluster["group"],
                "category": cluster["category"],
                "sourceMeshNodes": cluster["sourceNodes"],
                "gridMm": cluster["gridMm"],
            },
        })

    active_scene = int(new_doc.get("scene", 0) or 0)
    if not new_doc.get("scenes"):
        new_doc["scenes"] = [{"nodes": []}]
        active_scene = 0
        new_doc["scene"] = 0
    if active_scene < 0 or active_scene >= len(new_doc["scenes"]):
        active_scene = 0
        new_doc["scene"] = 0
    roots = new_doc["scenes"][active_scene].setdefault("nodes", [])
    roots.extend(proxy_node_indices)

    return {
        "doc": new_doc,
        "retainedBufferViewIds": buffer_view_ids,
        "proxyViewIndices": {
            "position": proxy_position_view,
            "normal": proxy_normal_view,
            "indices": proxy_index_view,
        },
        "keptNodeIds": kept_node_ids,
        "usedMeshIds": used_mesh_ids,
        "proxyNodeCount": len(proxy_node_indices),
        "proxyMaterialCount": len(proxy_material_index),
    }


def write_v2_glb(source, output, layout, original_doc, built):
    doc = built["doc"]
    retained_views = built["retainedBufferViewIds"]
    original_views = original_doc.get("bufferViews", [])
    proxy_views = built["proxyViewIndices"]
    pos_bytes, normal_bytes, index_bytes = cube_payloads()

    output.parent.mkdir(parents=True, exist_ok=True)
    temp_bin = output.with_suffix(output.suffix + ".bin.tmp")
    out_pos = 0
    offsets = {}

    try:
        with source.open("rb") as src, temp_bin.open("wb") as dst:
            for old_view in retained_views:
                view = original_views[old_view]
                if int(view.get("buffer", 0) or 0) != 0:
                    raise SystemExit("Only single-buffer GLBs are supported.")

                pad = (-out_pos) % 4
                if pad:
                    dst.write(b"\x00" * pad)
                    out_pos += pad

                offsets[old_view] = out_pos
                src.seek(
                    layout["binOffset"]
                    + int(view.get("byteOffset", 0) or 0)
                )
                remaining = int(view.get("byteLength", 0) or 0)
                while remaining:
                    chunk = src.read(min(1024 * 1024, remaining))
                    if not chunk:
                        raise SystemExit("Unexpected EOF while repacking V2 BIN.")
                    dst.write(chunk)
                    remaining -= len(chunk)
                    out_pos += len(chunk)

            for key, payload in (
                ("position", pos_bytes),
                ("normal", normal_bytes),
                ("indices", index_bytes),
            ):
                pad = (-out_pos) % 4
                if pad:
                    dst.write(b"\x00" * pad)
                    out_pos += pad
                view_index = proxy_views[key]
                doc["bufferViews"][view_index]["byteOffset"] = out_pos
                doc["bufferViews"][view_index]["byteLength"] = len(payload)
                dst.write(payload)
                out_pos += len(payload)

            pad = (-out_pos) % 4
            if pad:
                dst.write(b"\x00" * pad)
                out_pos += pad

        for new_index, old_view in enumerate(retained_views):
            doc["bufferViews"][new_index]["buffer"] = 0
            doc["bufferViews"][new_index]["byteOffset"] = offsets[old_view]

        doc["buffers"][0]["byteLength"] = out_pos

        raw_json = json.dumps(
            doc,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")
        raw_json += b" " * ((-len(raw_json)) % 4)
        total_length = 12 + 8 + len(raw_json) + 8 + out_pos

        with output.open("wb") as out, temp_bin.open("rb") as bin_fh:
            out.write(struct.pack("<4sII", v1.GLB_MAGIC, 2, total_length))
            out.write(struct.pack("<II", len(raw_json), v1.JSON_CHUNK))
            out.write(raw_json)
            out.write(struct.pack("<II", out_pos, v1.BIN_CHUNK))
            while True:
                chunk = bin_fh.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
    finally:
        temp_bin.unlink(missing_ok=True)


def bounds_m(doc):
    bounds = v1.scene_bounds(doc)
    return v1.bounds_to_m(bounds)


def extents(bounds):
    return v1.extents_from_bounds_m(bounds)


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            "Build Sound Club venue-web-v2 by replacing classified heavy P1 "
            "geometry with compact spatial proxies while preserving all "
            "unclassified geometry."
        )
    )
    ap.add_argument("v1_glb", type=Path)
    ap.add_argument("plan", type=Path)
    ap.add_argument("v1_report", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--report", type=Path, required=True)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    for path in (args.v1_glb, args.plan, args.v1_report):
        if not path.exists():
            raise SystemExit(f"Required input not found: {path}")

    if args.output.exists() and not args.force:
        raise SystemExit(
            f"Output already exists: {args.output}. "
            "Review its report or use --force intentionally."
        )

    v1_report = json.loads(args.v1_report.read_text(encoding="utf-8"))
    expected_v1_sha = (v1_report.get("derived") or {}).get("sha256")
    if not expected_v1_sha:
        raise SystemExit("V1 build report does not contain derived.sha256.")

    actual_v1_sha = v1.sha256_file(args.v1_glb)
    if actual_v1_sha.lower() != expected_v1_sha.lower():
        raise SystemExit(
            "V1 SOURCE HASH MISMATCH. V2 build blocked.\n"
            f"Expected: {expected_v1_sha}\n"
            f"Actual:   {actual_v1_sha}"
        )

    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    if plan.get("projectId") != PROJECT_ID:
        raise SystemExit(
            f"Unexpected optimization plan projectId: {plan.get('projectId')!r}"
        )

    doc, layout = v1.read_glb(args.v1_glb)

    if doc.get("animations") or doc.get("skins"):
        raise SystemExit("V2 build blocked: animations/skins are present.")
    if doc.get("images") or doc.get("textures"):
        raise SystemExit("V2 build blocked: images/textures are present.")

    print("Stage 1/5: selecting classified P1 proxy geometry...")
    selection = collect_proxy_selection(doc, plan)
    print(
        f"  source mesh nodes selected for proxy: "
        f"{len(selection['proxyNodeIds'])}"
    )

    print("Stage 2/5: clustering proxies spatially...")
    clusters, grid_scale = adaptive_clusters(selection["proxyItems"])
    by_category = defaultdict(int)
    by_group = defaultdict(int)
    source_nodes_by_category = defaultdict(int)
    for cluster in clusters:
        by_category[cluster["category"]] += 1
        by_group[cluster["group"]] += 1
        source_nodes_by_category[cluster["category"]] += cluster["sourceNodes"]
    print(
        f"  proxy clusters: {len(clusters)} "
        f"(adaptive grid scale {grid_scale:.2f}x)"
    )

    print("Stage 3/5: remapping retained geometry and adding proxy nodes...")
    built = build_retained_document(doc, selection, clusters)

    source_bounds = bounds_m(doc)
    prewrite_bounds = bounds_m(built["doc"])

    print("Stage 4/5: streaming retained BIN and appending proxy cube...")
    if args.output.exists() and args.force:
        args.output.unlink()
    write_v2_glb(args.v1_glb, args.output, layout, doc, built)

    print("Stage 5/5: validating venue-web-v2...")
    out_doc, out_layout = v1.read_glb(args.output)
    output_sha = v1.sha256_file(args.output)
    output_bytes = args.output.stat().st_size
    output_bounds = bounds_m(out_doc)

    size_ok = output_bytes <= 95.0 * 1024 * 1024
    mesh_ok = len(out_doc.get("meshes", [])) <= 20000
    extent_m = extents(output_bounds)
    bounds_ok = bool(
        extent_m
        and extent_m[0] <= 120.0
        and extent_m[2] <= 120.0
        and extent_m[1] <= 40.0
    )

    report = {
        "schemaVersion": 1,
        "projectId": PROJECT_ID,
        "buildMode": "CONTROLLED_P1_SPATIAL_PROXY",
        "sourceV1": {
            "path": str(args.v1_glb),
            "sha256": actual_v1_sha,
            "sizeBytes": args.v1_glb.stat().st_size,
            "sizeMiB": args.v1_glb.stat().st_size / (1024.0 * 1024.0),
            "binBytes": layout["binLength"],
            "nodes": len(doc.get("nodes", [])),
            "meshes": len(doc.get("meshes", [])),
            "boundsM": source_bounds,
            "extentM": extents(source_bounds),
        },
        "proxySelection": {
            "actions": sorted(PROXY_RULES.keys()),
            "sourceMeshNodesReplaced": len(selection["proxyNodeIds"]),
            "removedByAction": selection["removedByAction"],
            "removedByGroup": selection["removedByGroup"],
            "adaptiveGridScale": grid_scale,
            "maxProxyNodes": MAX_PROXY_NODES,
            "proxyClusters": len(clusters),
            "proxyClustersByCategory": dict(sorted(by_category.items())),
            "sourceNodesByCategory": dict(sorted(source_nodes_by_category.items())),
            "proxyClustersByGroup": dict(
                sorted(
                    by_group.items(),
                    key=lambda item: item[1],
                    reverse=True,
                )
            ),
        },
        "derivedV2": {
            "path": str(args.output),
            "sha256": output_sha,
            "sizeBytes": output_bytes,
            "sizeMiB": output_bytes / (1024.0 * 1024.0),
            "jsonChunkBytes": out_layout["jsonLength"],
            "binBytes": out_layout["binLength"],
            "binMiB": out_layout["binLength"] / (1024.0 * 1024.0),
            "nodes": len(out_doc.get("nodes", [])),
            "meshes": len(out_doc.get("meshes", [])),
            "accessors": len(out_doc.get("accessors", [])),
            "bufferViews": len(out_doc.get("bufferViews", [])),
            "materials": len(out_doc.get("materials", [])),
            "proxyNodes": built["proxyNodeCount"],
            "boundsM": output_bounds,
            "extentM": extent_m,
            "prewriteBoundsM": prewrite_bounds,
        },
        "reductionFromV1": {
            "fileMiB": (
                args.v1_glb.stat().st_size - output_bytes
            ) / (1024.0 * 1024.0),
            "filePercent": (
                (args.v1_glb.stat().st_size - output_bytes)
                / args.v1_glb.stat().st_size * 100.0
            ),
            "binMiB": (
                layout["binLength"] - out_layout["binLength"]
            ) / (1024.0 * 1024.0),
            "binPercent": (
                (layout["binLength"] - out_layout["binLength"])
                / layout["binLength"] * 100.0
            ),
            "meshDefinitions": (
                len(doc.get("meshes", []))
                - len(out_doc.get("meshes", []))
            ),
            "meshPercent": (
                (len(doc.get("meshes", []))
                 - len(out_doc.get("meshes", [])))
                / max(1, len(doc.get("meshes", []))) * 100.0
            ),
            "nodes": (
                len(doc.get("nodes", []))
                - len(out_doc.get("nodes", []))
            ),
            "nodePercent": (
                (len(doc.get("nodes", []))
                 - len(out_doc.get("nodes", [])))
                / max(1, len(doc.get("nodes", []))) * 100.0
            ),
        },
        "webGate": {
            "maxMiB": 95.0,
            "maxMeshes": 20000,
            "maxHorizontalExtentM": 120.0,
            "maxHeightM": 40.0,
            "sizeOk": size_ok,
            "meshCountOk": mesh_ok,
            "boundsOk": bounds_ok,
            "readyForVisualQA": bool(size_ok and mesh_ok and bounds_ok),
            "publicPromotionAllowed": False,
            "status": (
                "V2_GATE_MET_VISUAL_QA_REQUIRED"
                if size_ok and mesh_ok and bounds_ok
                else "V2_REQUIRES_FURTHER_OPTIMIZATION"
            ),
        },
        "policy": {
            "privateSketchUpMasterModified": False,
            "venueMasterModified": False,
            "venueWebV1Modified": False,
            "separateDerivedOutput": True,
            "proxyGeometryIsDerivedTechnicalRepresentation": True,
            "publicPromotionPerformed": False,
        },
    }

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(json.dumps({
        "derivedV2": report["derivedV2"],
        "reductionFromV1": report["reductionFromV1"],
        "webGate": report["webGate"],
        "report": str(args.report),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
