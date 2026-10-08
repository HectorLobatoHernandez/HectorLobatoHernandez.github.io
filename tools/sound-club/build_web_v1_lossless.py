#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import struct
from collections import defaultdict
from pathlib import Path

GLB_MAGIC = b"glTF"
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942

EXPECTED_PROJECT_ID = "SOUND_CLUB_CDM"
DEFAULT_TOLERANCE_MM = 0.001

COMPONENT_SIZE = {
    5120: 1,  # BYTE
    5121: 1,  # UNSIGNED_BYTE
    5122: 2,  # SHORT
    5123: 2,  # UNSIGNED_SHORT
    5125: 4,  # UNSIGNED_INT
    5126: 4,  # FLOAT
}

TYPE_COMPONENTS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16,
}

SAFE_DROP_ACTIONS = {
    "PROXY_OR_REMOVE_DECOR",
    "REMOVE_OR_PROXY_MINOR_HARDWARE",
    "REMOVE_WEB_DECOR",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def read_glb(path: Path):
    with path.open("rb") as fh:
        header = fh.read(12)
        if len(header) != 12:
            raise SystemExit("Invalid GLB header.")
        magic, version, total_length = struct.unpack("<4sII", header)
        if magic != GLB_MAGIC or version != 2:
            raise SystemExit(f"Unsupported GLB header: magic={magic!r}, version={version}")

        json_header = fh.read(8)
        if len(json_header) != 8:
            raise SystemExit("Missing GLB JSON chunk.")
        json_length, json_type = struct.unpack("<II", json_header)
        if json_type != JSON_CHUNK:
            raise SystemExit("First GLB chunk is not JSON.")
        raw_json = fh.read(json_length)
        if len(raw_json) != json_length:
            raise SystemExit("Truncated GLB JSON chunk.")
        doc = json.loads(raw_json.decode("utf-8").rstrip("\x00 \t\r\n"))

        bin_header = fh.read(8)
        if len(bin_header) != 8:
            raise SystemExit("Missing GLB BIN chunk.")
        bin_length, bin_type = struct.unpack("<II", bin_header)
        if bin_type != BIN_CHUNK:
            raise SystemExit("Second GLB chunk is not BIN.")
        bin_offset = fh.tell()

    return doc, {
        "totalLength": total_length,
        "jsonLength": json_length,
        "binLength": bin_length,
        "binOffset": bin_offset,
    }


def semantic_path(name: str):
    clean = re.sub(r"^mesh_\d+_", "", name or "", flags=re.IGNORECASE)
    clean = re.sub(r"^ROOT__", "", clean, flags=re.IGNORECASE)
    out = []
    for raw in [part for part in clean.split("__") if part]:
        token = re.sub(r"_AB(?:_.*)?$", "", raw, flags=re.IGNORECASE).strip()
        token = re.sub(r"#\d+$", "", token).strip()

        if re.fullmatch(r"Grupo#?\d*", token, flags=re.IGNORECASE):
            continue

        component = re.fullmatch(r"Component_\d+(?:_(.+))?", token, flags=re.IGNORECASE)
        if component:
            token = (component.group(1) or "").strip()
            if not token:
                continue

        if re.fullmatch(r"(COMPONENTE?|GROUP|GRUPO|AGRUPAR|AGRU)", token, flags=re.IGNORECASE):
            continue

        token = re.sub(r"\s+", " ", token).strip(" _-")
        if token:
            out.append(token.upper())
    return out


def top_level_group(name: str) -> str:
    path = semantic_path(name)
    return path[0] if path else "UNNAMED"


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
            [float(m[0]), float(m[4]), float(m[8]), float(m[12])],
            [float(m[1]), float(m[5]), float(m[9]), float(m[13])],
            [float(m[2]), float(m[6]), float(m[10]), float(m[14])],
            [float(m[3]), float(m[7]), float(m[11]), float(m[15])],
        ]

    t = node.get("translation", [0.0, 0.0, 0.0])
    s = node.get("scale", [1.0, 1.0, 1.0])
    q = node.get("rotation", [0.0, 0.0, 0.0, 1.0])
    x, y, z, w = [float(v) for v in q]
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
        [float(s[0]), 0.0, 0.0, 0.0],
        [0.0, float(s[1]), 0.0, 0.0],
        [0.0, 0.0, float(s[2]), 0.0],
        [0.0, 0.0, 0.0, 1.0],
    ]
    trans = mat_identity()
    trans[0][3], trans[1][3], trans[2][3] = [float(v) for v in t]
    return mat_mul(trans, mat_mul(rot, scale))


def gltf_matrix_from_row_major(m):
    return [
        m[0][0], m[1][0], m[2][0], m[3][0],
        m[0][1], m[1][1], m[2][1], m[3][1],
        m[0][2], m[1][2], m[2][2], m[3][2],
        m[0][3], m[1][3], m[2][3], m[3][3],
    ]


def local_translation_matrix(delta):
    m = mat_identity()
    m[0][3], m[1][3], m[2][3] = [float(v) for v in delta]
    return m


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
    result = None
    for prim in meshes[mesh_index].get("primitives", []):
        pos = (prim.get("attributes") or {}).get("POSITION")
        if pos is None:
            continue
        acc = accessors[pos]
        amin, amax = acc.get("min"), acc.get("max")
        if not amin or not amax:
            continue
        result = union_bounds(
            result,
            [list(map(float, amin[:3])), list(map(float, amax[:3]))],
        )
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
    return [
        [min(p[i] for p in corners) for i in range(3)],
        [max(p[i] for p in corners) for i in range(3)],
    ]


def scene_bounds(doc):
    nodes = doc.get("nodes", [])
    scenes = doc.get("scenes", [])
    if not nodes:
        return None
    scene_index = int(doc.get("scene", 0) or 0)
    roots = (
        scenes[scene_index].get("nodes", [])
        if scenes and 0 <= scene_index < len(scenes)
        else list(range(len(nodes)))
    )
    local_cache = {}
    result = None
    visiting = set()

    def visit(index, parent):
        nonlocal result
        if index < 0 or index >= len(nodes):
            return
        if index in visiting:
            raise SystemExit("Node hierarchy cycle detected during bounds check.")
        visiting.add(index)
        node = nodes[index]
        world = mat_mul(parent, mat_from_node(node))
        mesh = node.get("mesh")
        if mesh is not None:
            if mesh not in local_cache:
                local_cache[mesh] = mesh_local_bounds(doc, mesh)
            result = union_bounds(result, transform_bounds(local_cache[mesh], world))
        for child in node.get("children", []):
            visit(child, world)
        visiting.remove(index)

    for root in roots:
        visit(root, mat_identity())
    return result


def accessor_layout(doc, accessor_id):
    accessors = doc.get("accessors", [])
    views = doc.get("bufferViews", [])
    acc = accessors[accessor_id]
    if acc.get("sparse"):
        raise SystemExit("Sparse accessors are not supported in web-v1 build.")
    view_id = acc.get("bufferView")
    if view_id is None:
        raise SystemExit(f"Accessor {accessor_id} has no bufferView.")
    view = views[view_id]
    component_size = COMPONENT_SIZE.get(acc.get("componentType"))
    type_components = TYPE_COMPONENTS.get(acc.get("type"))
    if component_size is None or type_components is None:
        raise SystemExit(f"Unsupported accessor layout for accessor {accessor_id}.")
    element_size = component_size * type_components
    stride = int(view.get("byteStride", element_size) or element_size)
    offset = (
        int(view.get("byteOffset", 0) or 0)
        + int(acc.get("byteOffset", 0) or 0)
    )
    return acc, view_id, element_size, stride, offset


def hash_accessor_bytes(fh, doc, layout, accessor_id, cache):
    if accessor_id in cache:
        return cache[accessor_id]
    acc, _, element_size, stride, offset = accessor_layout(doc, accessor_id)
    count = int(acc.get("count", 0) or 0)
    h = hashlib.sha256()
    fh.seek(layout["binOffset"] + offset)

    if stride == element_size:
        remaining = count * element_size
        while remaining:
            chunk = fh.read(min(1024 * 1024, remaining))
            if not chunk:
                raise SystemExit("Unexpected EOF while hashing accessor.")
            h.update(chunk)
            remaining -= len(chunk)
    else:
        for _ in range(count):
            chunk = fh.read(element_size)
            if len(chunk) != element_size:
                raise SystemExit("Unexpected EOF while hashing strided accessor.")
            h.update(chunk)
            fh.seek(stride - element_size, 1)

    cache[accessor_id] = h.hexdigest()
    return cache[accessor_id]


def read_positions(fh, doc, layout, accessor_id):
    acc, _, element_size, stride, offset = accessor_layout(doc, accessor_id)
    if acc.get("componentType") != 5126 or acc.get("type") != "VEC3":
        raise ValueError("POSITION accessor is not FLOAT VEC3.")
    if element_size != 12:
        raise ValueError("Unexpected POSITION element size.")

    count = int(acc.get("count", 0) or 0)
    fh.seek(layout["binOffset"] + offset)
    values = []

    if stride == 12:
        raw = fh.read(count * 12)
        if len(raw) != count * 12:
            raise SystemExit("Unexpected EOF while reading positions.")
        values = list(struct.iter_unpack("<fff", raw))
    else:
        for _ in range(count):
            raw = fh.read(12)
            if len(raw) != 12:
                raise SystemExit("Unexpected EOF while reading strided positions.")
            values.append(struct.unpack("<fff", raw))
            fh.seek(stride - 12, 1)
    return values


def normalized_position_hash(values, tolerance_mm):
    if not values:
        return hashlib.sha256(b"").hexdigest(), (0.0, 0.0, 0.0)
    anchor = values[0]
    step = max(float(tolerance_mm), 1e-12)
    h = hashlib.sha256()
    for x, y, z in values:
        h.update(
            struct.pack(
                "<qqq",
                int(round((x - anchor[0]) / step)),
                int(round((y - anchor[1]) / step)),
                int(round((z - anchor[2]) / step)),
            )
        )
    return h.hexdigest(), tuple(float(v) for v in anchor)


def material_fingerprint(materials, material_id, cache):
    if material_id is None:
        return None
    if material_id not in cache:
        payload = json.dumps(
            materials[material_id],
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")
        cache[material_id] = hashlib.sha256(payload).hexdigest()
    return cache[material_id]


def extent_key(accessor, tolerance_mm):
    amin, amax = accessor.get("min"), accessor.get("max")
    if not amin or not amax:
        return None
    step = max(float(tolerance_mm), 1e-12)
    return tuple(
        int(round((float(amax[i]) - float(amin[i])) / step))
        for i in range(3)
    )


def mesh_coarse_key(doc, mesh_id, tolerance_mm, material_cache):
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    materials = doc.get("materials", [])
    parts = []

    for prim in meshes[mesh_id].get("primitives", []):
        attrs = prim.get("attributes") or {}
        position_id = attrs.get("POSITION")
        if position_id is None:
            return None
        pos_acc = accessors[position_id]
        if pos_acc.get("componentType") != 5126 or pos_acc.get("type") != "VEC3":
            return None

        attr_layout = []
        for semantic, accessor_id in sorted(attrs.items()):
            acc = accessors[accessor_id]
            attr_layout.append(
                (
                    semantic,
                    acc.get("componentType"),
                    acc.get("type"),
                    int(acc.get("count", 0) or 0),
                    bool(acc.get("normalized", False)),
                )
            )

        index_layout = None
        if prim.get("indices") is not None:
            acc = accessors[prim["indices"]]
            index_layout = (
                acc.get("componentType"),
                acc.get("type"),
                int(acc.get("count", 0) or 0),
            )

        material = material_fingerprint(
            materials,
            prim.get("material"),
            material_cache,
        )
        parts.append(
            (
                prim.get("mode", 4),
                tuple(attr_layout),
                index_layout,
                extent_key(pos_acc, tolerance_mm),
                material,
                len(prim.get("targets") or []),
            )
        )
    return tuple(parts)


def mesh_translation_signature(
    fh,
    doc,
    layout,
    mesh_id,
    tolerance_mm,
    accessor_hash_cache,
    material_cache,
):
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    materials = doc.get("materials", [])
    parts = []
    anchors = []

    for prim in meshes[mesh_id].get("primitives", []):
        attrs = prim.get("attributes") or {}
        position_id = attrs.get("POSITION")
        positions = read_positions(fh, doc, layout, position_id)
        position_hash, anchor = normalized_position_hash(positions, tolerance_mm)
        anchors.append(anchor)

        non_position = []
        for semantic, accessor_id in sorted(attrs.items()):
            if semantic == "POSITION":
                continue
            acc = accessors[accessor_id]
            non_position.append(
                (
                    semantic,
                    hash_accessor_bytes(
                        fh, doc, layout, accessor_id, accessor_hash_cache
                    ),
                    acc.get("componentType"),
                    acc.get("type"),
                    int(acc.get("count", 0) or 0),
                    bool(acc.get("normalized", False)),
                )
            )

        index_sig = None
        if prim.get("indices") is not None:
            idx = prim["indices"]
            acc = accessors[idx]
            index_sig = (
                hash_accessor_bytes(fh, doc, layout, idx, accessor_hash_cache),
                acc.get("componentType"),
                int(acc.get("count", 0) or 0),
            )

        material = material_fingerprint(
            materials,
            prim.get("material"),
            material_cache,
        )

        targets = []
        for target in prim.get("targets") or []:
            targets.append(
                tuple(
                    (
                        semantic,
                        hash_accessor_bytes(
                            fh, doc, layout, accessor_id, accessor_hash_cache
                        ),
                    )
                    for semantic, accessor_id in sorted((target or {}).items())
                )
            )

        parts.append(
            (
                prim.get("mode", 4),
                position_hash,
                tuple(non_position),
                index_sig,
                material,
                tuple(targets),
            )
        )

    payload = json.dumps(
        parts,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest(), anchors


def consistent_translation(rep_anchors, dup_anchors, tolerance_mm):
    if len(rep_anchors) != len(dup_anchors) or not rep_anchors:
        return None
    first = tuple(
        float(dup_anchors[0][i] - rep_anchors[0][i])
        for i in range(3)
    )
    tol = float(tolerance_mm)
    for rep, dup in zip(rep_anchors[1:], dup_anchors[1:]):
        delta = tuple(float(dup[i] - rep[i]) for i in range(3))
        if any(abs(delta[i] - first[i]) > tol for i in range(3)):
            return None
    return first


def primitive_accessor_ids(primitive):
    ids = []
    ids.extend((primitive.get("attributes") or {}).values())
    if primitive.get("indices") is not None:
        ids.append(primitive["indices"])
    for target in primitive.get("targets") or []:
        ids.extend((target or {}).values())
    return ids


def accessor_buffer_views(doc, accessor_ids):
    views = set()
    accessors = doc.get("accessors", [])
    for accessor_id in accessor_ids:
        acc = accessors[accessor_id]
        if acc.get("sparse"):
            raise SystemExit("Sparse accessors are not supported in web-v1 build.")
        if acc.get("bufferView") is not None:
            views.add(acc["bufferView"])
    return views


def build_selection(doc, plan):
    action_by_group = {
        str(row.get("topLevelGroup", "UNNAMED")).upper():
            row.get("action", "REVIEW_MANUALLY")
        for row in plan.get("groups") or []
    }

    nodes = doc.get("nodes", [])
    direct_mesh_keep = [False] * len(nodes)
    dropped_by_action = defaultdict(int)
    dropped_by_group = defaultdict(int)

    for index, node in enumerate(nodes):
        if node.get("mesh") is None:
            continue
        group = top_level_group(node.get("name", ""))
        action = action_by_group.get(group, "REVIEW_MANUALLY")
        if action in SAFE_DROP_ACTIONS:
            dropped_by_action[action] += 1
            dropped_by_group[group] += 1
        else:
            direct_mesh_keep[index] = True

    keep_cache = {}
    visiting = set()

    def keep_node(index):
        if index in keep_cache:
            return keep_cache[index]
        if index in visiting:
            raise SystemExit("Node hierarchy cycle detected.")
        visiting.add(index)
        node = nodes[index]
        keep = direct_mesh_keep[index]
        for child in node.get("children", []):
            if 0 <= child < len(nodes) and keep_node(child):
                keep = True
        keep_cache[index] = keep
        visiting.remove(index)
        return keep

    for index in range(len(nodes)):
        keep_node(index)

    kept_node_ids = [i for i in range(len(nodes)) if keep_cache.get(i, False)]
    kept_mesh_ids = sorted(
        {
            nodes[i]["mesh"]
            for i in kept_node_ids
            if direct_mesh_keep[i] and nodes[i].get("mesh") is not None
        }
    )
    return {
        "actionByGroup": action_by_group,
        "directMeshKeep": direct_mesh_keep,
        "keptNodeIds": kept_node_ids,
        "keptMeshIds": kept_mesh_ids,
        "droppedByAction": dict(dropped_by_action),
        "droppedByGroup": dict(dropped_by_group),
    }


def find_translation_reuse(
    source_path,
    doc,
    layout,
    kept_mesh_ids,
    tolerance_mm,
):
    print(f"Building translation-reuse candidates for {len(kept_mesh_ids)} kept meshes...")
    material_cache = {}
    coarse = defaultdict(list)

    for pos, mesh_id in enumerate(kept_mesh_ids, start=1):
        key = mesh_coarse_key(doc, mesh_id, tolerance_mm, material_cache)
        if key is not None:
            coarse[key].append(mesh_id)
        if pos % 25000 == 0:
            print(f"  coarse-keyed {pos}/{len(kept_mesh_ids)} kept meshes")

    buckets = [ids for ids in coarse.values() if len(ids) > 1]
    candidate_count = sum(len(ids) for ids in buckets)
    print(
        f"Translation candidate buckets: {len(buckets)}; "
        f"candidate meshes: {candidate_count}"
    )

    accessor_hash_cache = {}
    signature_groups = defaultdict(list)
    anchors_by_mesh = {}
    processed = 0

    with source_path.open("rb") as fh:
        for ids in buckets:
            for mesh_id in ids:
                signature, anchors = mesh_translation_signature(
                    fh,
                    doc,
                    layout,
                    mesh_id,
                    tolerance_mm,
                    accessor_hash_cache,
                    material_cache,
                )
                signature_groups[signature].append(mesh_id)
                anchors_by_mesh[mesh_id] = anchors
                processed += 1
                if processed % 10000 == 0:
                    print(
                        f"  translation-fingerprinted "
                        f"{processed}/{candidate_count} candidate meshes"
                    )

    reuse = {}
    rejected_inconsistent = 0
    sets_used = 0

    for mesh_ids in signature_groups.values():
        if len(mesh_ids) < 2:
            continue
        rep = mesh_ids[0]
        rep_anchors = anchors_by_mesh[rep]
        used_this_set = False
        for mesh_id in mesh_ids[1:]:
            delta = consistent_translation(
                rep_anchors,
                anchors_by_mesh[mesh_id],
                tolerance_mm,
            )
            if delta is None:
                rejected_inconsistent += 1
                continue
            reuse[mesh_id] = {
                "representativeMesh": rep,
                "deltaMm": delta,
            }
            used_this_set = True
        if used_this_set:
            sets_used += 1

    return {
        "reuse": reuse,
        "setsUsed": sets_used,
        "rejectedInconsistentPrimitiveTranslations": rejected_inconsistent,
        "candidateBuckets": len(buckets),
        "candidateMeshes": candidate_count,
    }


def remap_document(doc, selection, translation):
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    buffer_views = doc.get("bufferViews", [])
    materials = doc.get("materials", [])

    kept_node_ids = selection["keptNodeIds"]
    kept_node_set = set(kept_node_ids)
    direct_mesh_keep = selection["directMeshKeep"]
    reuse = translation["reuse"]

    node_map = {old: new for new, old in enumerate(kept_node_ids)}

    resolved_mesh_by_node = {}
    translation_by_node = {}

    for old_node in kept_node_ids:
        node = nodes[old_node]
        mesh_id = node.get("mesh")
        if mesh_id is None or not direct_mesh_keep[old_node]:
            continue
        if mesh_id in reuse:
            resolved_mesh_by_node[old_node] = reuse[mesh_id]["representativeMesh"]
            translation_by_node[old_node] = reuse[mesh_id]["deltaMm"]
        else:
            resolved_mesh_by_node[old_node] = mesh_id

    used_mesh_ids = sorted(set(resolved_mesh_by_node.values()))
    mesh_map = {old: new for new, old in enumerate(used_mesh_ids)}

    accessor_ids = set()
    material_ids = set()

    for mesh_id in used_mesh_ids:
        for primitive in meshes[mesh_id].get("primitives", []):
            accessor_ids.update(primitive_accessor_ids(primitive))
            if primitive.get("material") is not None:
                material_ids.add(primitive["material"])

    accessor_ids = sorted(accessor_ids)
    buffer_view_ids = sorted(accessor_buffer_views(doc, accessor_ids))
    material_ids = sorted(material_ids)

    accessor_map = {old: new for new, old in enumerate(accessor_ids)}
    view_map = {old: new for new, old in enumerate(buffer_view_ids)}
    material_map = {old: new for new, old in enumerate(material_ids)}

    new_nodes = []
    translated_nodes = 0

    for old_node in kept_node_ids:
        node = json.loads(json.dumps(nodes[old_node]))

        if old_node in resolved_mesh_by_node:
            node["mesh"] = mesh_map[resolved_mesh_by_node[old_node]]
        else:
            node.pop("mesh", None)

        if old_node in translation_by_node:
            delta = translation_by_node[old_node]
            old_matrix = mat_from_node(node)
            new_matrix = mat_mul(old_matrix, local_translation_matrix(delta))
            node["matrix"] = gltf_matrix_from_row_major(new_matrix)
            node.pop("translation", None)
            node.pop("rotation", None)
            node.pop("scale", None)
            translated_nodes += 1

        if node.get("children"):
            children = [
                node_map[child]
                for child in node["children"]
                if child in kept_node_set
            ]
            if children:
                node["children"] = children
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
        json.loads(json.dumps(materials[old_material]))
        for old_material in material_ids
    ]

    new_scenes = []
    for scene in doc.get("scenes", []):
        sc = json.loads(json.dumps(scene))
        sc["nodes"] = [
            node_map[node]
            for node in sc.get("nodes", [])
            if node in node_map
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

    return {
        "doc": new_doc,
        "bufferViewIds": buffer_view_ids,
        "translatedNodes": translated_nodes,
        "usedMeshIds": used_mesh_ids,
        "usedAccessorIds": accessor_ids,
        "usedMaterialIds": material_ids,
    }


def write_glb(source_path, output_path, source_layout, original_doc, remapped):
    new_doc = remapped["doc"]
    old_views = original_doc.get("bufferViews", [])
    kept_view_ids = remapped["bufferViewIds"]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_bin = output_path.with_suffix(output_path.suffix + ".bin.tmp")
    new_offsets = {}
    out_pos = 0

    try:
        with source_path.open("rb") as src, tmp_bin.open("wb") as dst:
            for old_view in kept_view_ids:
                view = old_views[old_view]
                if int(view.get("buffer", 0) or 0) != 0:
                    raise SystemExit("Only single-buffer GLBs are supported.")

                pad = (-out_pos) % 4
                if pad:
                    dst.write(b"\x00" * pad)
                    out_pos += pad

                new_offsets[old_view] = out_pos
                source_offset = (
                    source_layout["binOffset"]
                    + int(view.get("byteOffset", 0) or 0)
                )
                length = int(view.get("byteLength", 0) or 0)
                src.seek(source_offset)

                remaining = length
                while remaining:
                    chunk = src.read(min(1024 * 1024, remaining))
                    if not chunk:
                        raise SystemExit("Unexpected EOF while repacking BIN.")
                    dst.write(chunk)
                    out_pos += len(chunk)
                    remaining -= len(chunk)

            pad = (-out_pos) % 4
            if pad:
                dst.write(b"\x00" * pad)
                out_pos += pad

        for new_index, old_view in enumerate(kept_view_ids):
            new_doc["bufferViews"][new_index]["buffer"] = 0
            new_doc["bufferViews"][new_index]["byteOffset"] = new_offsets[old_view]

        new_doc["buffers"][0]["byteLength"] = out_pos

        raw_json = json.dumps(
            new_doc,
            separators=(",", ":"),
            ensure_ascii=False,
        ).encode("utf-8")
        raw_json += b" " * ((-len(raw_json)) % 4)

        total_length = 12 + 8 + len(raw_json) + 8 + out_pos

        with output_path.open("wb") as out, tmp_bin.open("rb") as bin_fh:
            out.write(struct.pack("<4sII", GLB_MAGIC, 2, total_length))
            out.write(struct.pack("<II", len(raw_json), JSON_CHUNK))
            out.write(raw_json)
            out.write(struct.pack("<II", out_pos, BIN_CHUNK))
            while True:
                chunk = bin_fh.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
    finally:
        tmp_bin.unlink(missing_ok=True)


def bounds_to_m(bounds):
    if bounds is None:
        return None
    return [[float(v) / 1000.0 for v in side] for side in bounds]


def extents_from_bounds_m(bounds_m):
    if bounds_m is None:
        return None
    return [
        bounds_m[1][i] - bounds_m[0][i]
        for i in range(3)
    ]


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            "Build Sound Club venue-web-v1 as a separate low-risk derivative: "
            "safe group removal + translation-equivalent mesh reuse."
        )
    )
    ap.add_argument("glb", type=Path)
    ap.add_argument("plan", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--report", type=Path, required=True)
    ap.add_argument("--expected-source-sha", required=True)
    ap.add_argument("--tolerance-mm", type=float, default=DEFAULT_TOLERANCE_MM)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"Source GLB not found: {args.glb}")
    if not args.plan.exists():
        raise SystemExit(f"Optimization plan not found: {args.plan}")
    if args.output.exists() and not args.force:
        raise SystemExit(
            f"Output already exists: {args.output}. "
            "Use --force only after reviewing the prior build/report."
        )

    source_sha = sha256_file(args.glb)
    if source_sha.lower() != args.expected_source_sha.lower():
        raise SystemExit(
            "SOURCE HASH MISMATCH. Build blocked.\n"
            f"Expected: {args.expected_source_sha}\n"
            f"Actual:   {source_sha}"
        )

    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    if plan.get("projectId") != EXPECTED_PROJECT_ID:
        raise SystemExit(
            f"Unexpected optimization plan projectId: {plan.get('projectId')!r}"
        )

    doc, layout = read_glb(args.glb)

    if doc.get("animations"):
        raise SystemExit("Build blocked: animations are present.")
    if doc.get("skins"):
        raise SystemExit("Build blocked: skins are present.")
    if doc.get("images") or doc.get("textures"):
        raise SystemExit(
            "Build blocked: source contains images/textures; "
            "texture index remapping is intentionally not implemented."
        )
    required_extensions = set(doc.get("extensionsRequired") or [])
    unsafe_extensions = {
        "KHR_draco_mesh_compression",
        "EXT_meshopt_compression",
    }
    if required_extensions & unsafe_extensions:
        raise SystemExit(
            "Build blocked: compressed geometry extensions are already present."
        )

    print("Stage 1/5: selecting safe keep/drop groups...")
    selection = build_selection(doc, plan)
    print(
        f"  keep nodes: {len(selection['keptNodeIds'])}/{len(doc.get('nodes', []))}; "
        f"keep source meshes: {len(selection['keptMeshIds'])}/{len(doc.get('meshes', []))}"
    )

    print("Stage 2/5: finding translation-equivalent reusable meshes...")
    translation = find_translation_reuse(
        args.glb,
        doc,
        layout,
        selection["keptMeshIds"],
        args.tolerance_mm,
    )
    print(
        f"  reusable duplicate meshes: {len(translation['reuse'])}; "
        f"sets used: {translation['setsUsed']}"
    )

    print("Stage 3/5: remapping nodes/meshes/accessors...")
    remapped = remap_document(doc, selection, translation)

    source_bounds = bounds_to_m(scene_bounds(doc))
    derived_bounds_prewrite = bounds_to_m(scene_bounds(remapped["doc"]))

    print("Stage 4/5: streaming retained BIN ranges into venue-web-v1...")
    if args.output.exists() and args.force:
        args.output.unlink()
    write_glb(args.glb, args.output, layout, doc, remapped)

    print("Stage 5/5: validating written GLB...")
    out_doc, out_layout = read_glb(args.output)
    derived_bounds = bounds_to_m(scene_bounds(out_doc))

    if len(out_doc.get("nodes", [])) != len(remapped["doc"].get("nodes", [])):
        raise SystemExit("Validation failed: node count mismatch after write.")
    if len(out_doc.get("meshes", [])) != len(remapped["doc"].get("meshes", [])):
        raise SystemExit("Validation failed: mesh count mismatch after write.")

    output_sha = sha256_file(args.output)
    output_bytes = args.output.stat().st_size

    report = {
        "schemaVersion": 1,
        "projectId": EXPECTED_PROJECT_ID,
        "buildMode": "SAFE_DROP_PLUS_TRANSLATION_REUSE",
        "source": {
            "path": str(args.glb),
            "sha256": source_sha,
            "sizeBytes": args.glb.stat().st_size,
            "jsonChunkBytes": layout["jsonLength"],
            "binBytes": layout["binLength"],
            "nodes": len(doc.get("nodes", [])),
            "meshes": len(doc.get("meshes", [])),
            "boundsM": source_bounds,
            "extentM": extents_from_bounds_m(source_bounds),
        },
        "operations": {
            "safeDropActions": sorted(SAFE_DROP_ACTIONS),
            "droppedNodesByAction": selection["droppedByAction"],
            "droppedNodesByGroup": selection["droppedByGroup"],
            "translationToleranceMm": args.tolerance_mm,
            "translationReuseSets": translation["setsUsed"],
            "translationReusedMeshes": len(translation["reuse"]),
            "translationAdjustedNodes": remapped["translatedNodes"],
            "rejectedInconsistentPrimitiveTranslations":
                translation["rejectedInconsistentPrimitiveTranslations"],
        },
        "derived": {
            "path": str(args.output),
            "sha256": output_sha,
            "sizeBytes": output_bytes,
            "sizeMiB": output_bytes / (1024.0 * 1024.0),
            "jsonChunkBytes": out_layout["jsonLength"],
            "binBytes": out_layout["binLength"],
            "nodes": len(out_doc.get("nodes", [])),
            "meshes": len(out_doc.get("meshes", [])),
            "accessors": len(out_doc.get("accessors", [])),
            "bufferViews": len(out_doc.get("bufferViews", [])),
            "materials": len(out_doc.get("materials", [])),
            "boundsM": derived_bounds,
            "extentM": extents_from_bounds_m(derived_bounds),
            "prewriteBoundsM": derived_bounds_prewrite,
        },
        "reduction": {
            "fileBytes": args.glb.stat().st_size - output_bytes,
            "filePercent": (
                (args.glb.stat().st_size - output_bytes)
                / args.glb.stat().st_size * 100.0
            ),
            "binBytes": layout["binLength"] - out_layout["binLength"],
            "binPercent": (
                (layout["binLength"] - out_layout["binLength"])
                / layout["binLength"] * 100.0
            ),
            "meshDefinitions": (
                len(doc.get("meshes", [])) - len(out_doc.get("meshes", []))
            ),
            "meshDefinitionPercent": (
                (len(doc.get("meshes", [])) - len(out_doc.get("meshes", [])))
                / max(1, len(doc.get("meshes", []))) * 100.0
            ),
            "nodes": len(doc.get("nodes", [])) - len(out_doc.get("nodes", [])),
        },
        "webGate": {
            "maxMiB": 95.0,
            "maxMeshes": 20000,
            "sizeOk": output_bytes <= 95.0 * 1024 * 1024,
            "meshCountOk": len(out_doc.get("meshes", [])) <= 20000,
            "ready": (
                output_bytes <= 95.0 * 1024 * 1024
                and len(out_doc.get("meshes", [])) <= 20000
            ),
            "expectedStatus": "INTERMEDIATE_V1_NOT_PUBLIC",
        },
        "policy": {
            "privateSketchUpMasterModified": False,
            "sourceCandidateModified": False,
            "separateDerivedOutput": True,
            "publicPromotionPerformed": False,
            "nextStep": (
                "Validate venue-web-v1, then perform controlled P1 proxy/merge/"
                "simplification until public web gate is met."
            ),
        },
    }

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(json.dumps({
        "derived": report["derived"],
        "reduction": report["reduction"],
        "webGate": report["webGate"],
        "report": str(args.report),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
