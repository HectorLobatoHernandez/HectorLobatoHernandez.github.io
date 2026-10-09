#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import struct
from collections import Counter, defaultdict
from pathlib import Path

import build_web_v1_lossless as v1

PROJECT_ID = "SOUND_CLUB_CDM"

COMPONENT_FORMAT = {
    5120: ("b", 1),
    5121: ("B", 1),
    5122: ("h", 2),
    5123: ("H", 2),
    5125: ("I", 4),
    5126: ("f", 4),
}

TYPE_COMPONENTS = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
}


def matrix_close(a, b, tol=1e-6):
    return all(
        abs(a[r][c] - b[r][c]) <= tol
        for r in range(4)
        for c in range(4)
    )


def collect_world_matrices(doc):
    nodes = doc.get("nodes", [])
    scenes = doc.get("scenes", [])
    world = {}
    reachable = set()
    visiting = set()

    roots_by_scene = (
        [scene.get("nodes", []) for scene in scenes]
        if scenes
        else [list(range(len(nodes)))]
    )

    def visit(index, parent):
        if index < 0 or index >= len(nodes):
            return
        if index in visiting:
            raise SystemExit("Node hierarchy cycle detected.")
        visiting.add(index)

        current = v1.mat_mul(parent, v1.mat_from_node(nodes[index]))
        if index in world and not matrix_close(world[index], current):
            raise SystemExit(
                f"Node {index} is reachable through multiple world transforms; "
                "venue crop requires one unambiguous transform."
            )

        world[index] = current
        reachable.add(index)
        for child in nodes[index].get("children", []):
            visit(child, current)

        visiting.remove(index)

    for roots in roots_by_scene:
        for root in roots:
            visit(root, v1.mat_identity())

    return world, reachable


def bounds_center(bounds):
    return [
        (bounds[0][i] + bounds[1][i]) * 0.5
        for i in range(3)
    ]


def bounds_inside(bounds, envelope, eps=1e-6):
    return all(
        bounds[0][i] >= envelope[0][i] - eps
        and bounds[1][i] <= envelope[1][i] + eps
        for i in range(3)
    )


def bounds_intersect(bounds, envelope, eps=1e-6):
    return all(
        bounds[1][i] >= envelope[0][i] - eps
        and bounds[0][i] <= envelope[1][i] + eps
        for i in range(3)
    )


def point_inside(point, envelope, eps=1e-6):
    return all(
        envelope[0][i] - eps <= point[i] <= envelope[1][i] + eps
        for i in range(3)
    )


def density_core(rows, xz_grid_mm=25000.0, y_grid_mm=10000.0):
    xz = Counter()
    y = Counter()

    for row in rows:
        cx, cy, cz = row["centerMm"]
        xz[(
            math.floor(cx / xz_grid_mm),
            math.floor(cz / xz_grid_mm),
        )] += 1
        y[math.floor(cy / y_grid_mm)] += 1

    if not xz or not y:
        raise SystemExit("Unable to derive venue density core.")

    candidate_anchors = set()
    for cell_x, cell_z in xz:
        for dx in (0, -1):
            for dz in (0, -1):
                candidate_anchors.add((cell_x + dx, cell_z + dz))

    best = None
    for anchor_x, anchor_z in candidate_anchors:
        block = [
            (anchor_x, anchor_z),
            (anchor_x + 1, anchor_z),
            (anchor_x, anchor_z + 1),
            (anchor_x + 1, anchor_z + 1),
        ]
        count = sum(xz.get(cell, 0) for cell in block)
        if best is None or count > best["count"]:
            best = {
                "anchorCellX": anchor_x,
                "anchorCellZ": anchor_z,
                "count": count,
                "cells": block,
            }

    y_cell, y_count = y.most_common(1)[0]

    center_mm = [
        (best["anchorCellX"] + 1.0) * xz_grid_mm,
        (y_cell + 0.5) * y_grid_mm,
        (best["anchorCellZ"] + 1.0) * xz_grid_mm,
    ]

    return {
        "centerMm": center_mm,
        "centerM": [v / 1000.0 for v in center_mm],
        "xzGridM": xz_grid_mm / 1000.0,
        "yGridM": y_grid_mm / 1000.0,
        "densest2x2Count": best["count"],
        "densestYCount": y_count,
        "densest2x2Cells": [
            {
                "cellX": int(cx),
                "cellZ": int(cz),
                "count": xz.get((cx, cz), 0),
            }
            for cx, cz in best["cells"]
        ],
        "densestYCell": int(y_cell),
    }


def make_envelope(center_mm, horizontal_m=100.0, vertical_m=36.0):
    hx = horizontal_m * 1000.0 * 0.5
    hy = vertical_m * 1000.0 * 0.5
    cx, cy, cz = center_mm
    return [
        [cx - hx, cy - hy, cz - hx],
        [cx + hx, cy + hy, cz + hx],
    ]


def accessor_meta(doc, accessor_id):
    accessors = doc.get("accessors", [])
    views = doc.get("bufferViews", [])

    if accessor_id is None or accessor_id < 0 or accessor_id >= len(accessors):
        raise SystemExit(f"Invalid accessor index {accessor_id}.")

    acc = accessors[accessor_id]
    if acc.get("sparse"):
        raise SystemExit("Sparse accessors are not supported in V3 venue crop.")

    type_name = acc.get("type")
    component_type = acc.get("componentType")

    if type_name not in TYPE_COMPONENTS:
        raise SystemExit(
            f"Unsupported accessor type {type_name!r} in V3 venue crop."
        )
    if component_type not in COMPONENT_FORMAT:
        raise SystemExit(
            f"Unsupported componentType {component_type!r} in V3 venue crop."
        )

    view_id = acc.get("bufferView")
    if view_id is None:
        raise SystemExit(f"Accessor {accessor_id} has no bufferView.")

    view = views[view_id]
    component_count = TYPE_COMPONENTS[type_name]
    component_size = COMPONENT_FORMAT[component_type][1]
    element_size = component_count * component_size
    stride = int(view.get("byteStride", element_size) or element_size)

    if stride < element_size:
        raise SystemExit(
            f"Accessor {accessor_id} has invalid stride {stride} < {element_size}."
        )

    offset = (
        int(view.get("byteOffset", 0) or 0)
        + int(acc.get("byteOffset", 0) or 0)
    )

    return {
        "accessor": acc,
        "viewId": view_id,
        "componentType": component_type,
        "type": type_name,
        "componentCount": component_count,
        "componentSize": component_size,
        "elementSize": element_size,
        "stride": stride,
        "offset": offset,
        "count": int(acc.get("count", 0) or 0),
    }


def read_accessor_elements(fh, doc, layout, accessor_id):
    meta = accessor_meta(doc, accessor_id)
    elements = []
    base = layout["binOffset"] + meta["offset"]
    fh.seek(base)

    if meta["stride"] == meta["elementSize"]:
        raw = fh.read(meta["count"] * meta["elementSize"])
        if len(raw) != meta["count"] * meta["elementSize"]:
            raise SystemExit(f"Unexpected EOF reading accessor {accessor_id}.")
        step = meta["elementSize"]
        elements = [
            raw[i:i + step]
            for i in range(0, len(raw), step)
        ]
    else:
        for _ in range(meta["count"]):
            raw = fh.read(meta["elementSize"])
            if len(raw) != meta["elementSize"]:
                raise SystemExit(
                    f"Unexpected EOF reading strided accessor {accessor_id}."
                )
            elements.append(raw)
            fh.seek(meta["stride"] - meta["elementSize"], 1)

    return meta, elements


def decode_float_vec3(elements, component_type):
    if component_type != 5126:
        raise SystemExit(
            "V3 venue crop requires FLOAT POSITION accessors."
        )
    return [struct.unpack("<fff", item) for item in elements]


def read_indices(fh, doc, layout, primitive, position_count):
    index_id = primitive.get("indices")
    if index_id is None:
        return list(range(position_count)), None

    meta, elements = read_accessor_elements(fh, doc, layout, index_id)
    if meta["type"] != "SCALAR" or meta["componentType"] not in (5121, 5123, 5125):
        raise SystemExit(
            f"Unsupported index accessor layout at accessor {index_id}."
        )

    fmt = "<" + COMPONENT_FORMAT[meta["componentType"]][0]
    return [struct.unpack(fmt, raw)[0] for raw in elements], meta


def encode_indices(indices, vertex_count):
    if vertex_count <= 65535:
        component_type = 5123
        fmt = "<" + "H" * len(indices)
    else:
        component_type = 5125
        fmt = "<" + "I" * len(indices)
    return component_type, struct.pack(fmt, *indices)


def primitive_min_max_from_elements(elements, component_type, type_name):
    if component_type != 5126 or type_name != "VEC3":
        return None, None
    values = [struct.unpack("<fff", raw) for raw in elements]
    return (
        [min(v[i] for v in values) for i in range(3)],
        [max(v[i] for v in values) for i in range(3)],
    )


def primitive_world_bounds(doc, primitive, world_matrix):
    pos_id = (primitive.get("attributes") or {}).get("POSITION")
    if pos_id is None:
        return None
    acc = doc["accessors"][pos_id]
    if not acc.get("min") or not acc.get("max"):
        return None
    local = [
        list(map(float, acc["min"][:3])),
        list(map(float, acc["max"][:3])),
    ]
    return v1.transform_bounds(local, world_matrix)


def crop_primitive(
    fh,
    doc,
    layout,
    primitive,
    world_matrix,
    envelope,
    generated_payloads,
    generated_accessors,
    generated_views,
):
    mode = int(primitive.get("mode", 4) or 4)
    if mode != 4:
        raise SystemExit(
            f"Partial primitive mode {mode} is unsupported; "
            "V3 refuses to silently drop non-triangle geometry."
        )
    if primitive.get("targets"):
        raise SystemExit(
            "Morph targets encountered in a partial primitive; V3 build blocked."
        )

    attrs = primitive.get("attributes") or {}
    position_id = attrs.get("POSITION")
    if position_id is None:
        raise SystemExit("Partial triangle primitive has no POSITION accessor.")

    pos_meta, pos_elements = read_accessor_elements(
        fh, doc, layout, position_id
    )
    if pos_meta["componentType"] != 5126 or pos_meta["type"] != "VEC3":
        raise SystemExit(
            "Partial geometry POSITION must be FLOAT VEC3."
        )

    positions = decode_float_vec3(
        pos_elements,
        pos_meta["componentType"],
    )
    indices, _ = read_indices(
        fh,
        doc,
        layout,
        primitive,
        len(positions),
    )

    if len(indices) % 3 != 0:
        raise SystemExit(
            "TRIANGLES primitive index count is not divisible by 3."
        )

    kept_triangles = []
    dropped_triangles = 0

    for i in range(0, len(indices), 3):
        tri = indices[i:i + 3]
        if any(vertex < 0 or vertex >= len(positions) for vertex in tri):
            raise SystemExit("Primitive contains out-of-range vertex index.")

        world_points = [
            v1.transform_point(world_matrix, positions[vertex])
            for vertex in tri
        ]

        if all(point_inside(point, envelope) for point in world_points):
            kept_triangles.append(tri)
        else:
            dropped_triangles += 1

    if not kept_triangles:
        return {
            "primitive": None,
            "keptTriangles": 0,
            "droppedTriangles": dropped_triangles,
            "keptVertices": 0,
        }

    vertex_map = {}
    ordered_old_vertices = []

    def map_vertex(old_index):
        if old_index not in vertex_map:
            vertex_map[old_index] = len(ordered_old_vertices)
            ordered_old_vertices.append(old_index)
        return vertex_map[old_index]

    new_indices = []
    for tri in kept_triangles:
        new_indices.extend(map_vertex(old) for old in tri)

    new_attrs = {}

    for semantic, accessor_id in sorted(attrs.items()):
        meta, elements = read_accessor_elements(
            fh, doc, layout, accessor_id
        )

        if meta["count"] != len(positions):
            raise SystemExit(
                f"Attribute {semantic} count {meta['count']} does not match "
                f"POSITION count {len(positions)} in partial primitive."
            )

        selected = [elements[old] for old in ordered_old_vertices]
        payload = b"".join(selected)
        view_ref = {
            "buffer": 0,
            "byteOffset": 0,
            "byteLength": len(payload),
            "target": 34962,
        }
        new_view_slot = len(generated_views)
        generated_views.append(view_ref)
        generated_payloads.append(payload)

        old_acc = meta["accessor"]
        new_acc = {
            "bufferView": new_view_slot,
            "byteOffset": 0,
            "componentType": old_acc["componentType"],
            "count": len(selected),
            "type": old_acc["type"],
        }
        if old_acc.get("normalized"):
            new_acc["normalized"] = True

        amin, amax = primitive_min_max_from_elements(
            selected,
            old_acc["componentType"],
            old_acc["type"],
        )
        if amin is not None:
            new_acc["min"] = amin
            new_acc["max"] = amax

        new_accessor_slot = len(generated_accessors)
        generated_accessors.append(new_acc)
        new_attrs[semantic] = new_accessor_slot

    index_component_type, index_payload = encode_indices(
        new_indices,
        len(ordered_old_vertices),
    )
    index_view_slot = len(generated_views)
    generated_views.append({
        "buffer": 0,
        "byteOffset": 0,
        "byteLength": len(index_payload),
        "target": 34963,
    })
    generated_payloads.append(index_payload)

    index_accessor_slot = len(generated_accessors)
    generated_accessors.append({
        "bufferView": index_view_slot,
        "byteOffset": 0,
        "componentType": index_component_type,
        "count": len(new_indices),
        "type": "SCALAR",
        "min": [0],
        "max": [len(ordered_old_vertices) - 1],
    })

    new_primitive = json.loads(json.dumps(primitive))
    new_primitive["attributes"] = new_attrs
    new_primitive["indices"] = index_accessor_slot
    new_primitive["mode"] = 4
    new_primitive.pop("targets", None)

    return {
        "primitive": new_primitive,
        "keptTriangles": len(kept_triangles),
        "droppedTriangles": dropped_triangles,
        "keptVertices": len(ordered_old_vertices),
    }


def classify_nodes(doc, world, reachable, envelope):
    nodes = doc.get("nodes", [])
    mesh_bounds_cache = {}
    rows = []
    classification = {}

    for node_id in sorted(reachable):
        node = nodes[node_id]
        mesh_id = node.get("mesh")
        if mesh_id is None:
            continue

        if mesh_id not in mesh_bounds_cache:
            mesh_bounds_cache[mesh_id] = v1.mesh_local_bounds(doc, mesh_id)

        local_bounds = mesh_bounds_cache[mesh_id]
        if local_bounds is None:
            continue

        world_bounds = v1.transform_bounds(
            local_bounds,
            world[node_id],
        )
        center = bounds_center(world_bounds)

        if bounds_inside(world_bounds, envelope):
            state = "INSIDE"
        elif not bounds_intersect(world_bounds, envelope):
            state = "OUTSIDE"
        else:
            state = "PARTIAL"

        classification[node_id] = {
            "state": state,
            "meshId": mesh_id,
            "boundsMm": world_bounds,
            "centerMm": center,
            "group": v1.top_level_group(node.get("name", "")),
            "name": node.get("name", ""),
        }
        rows.append(classification[node_id])

    return classification, rows


def build_cropped_meshes(
    source,
    doc,
    layout,
    world,
    classification,
    envelope,
):
    generated_payloads = []
    generated_accessors = []
    generated_views = []
    cropped_mesh_by_node = {}
    stats = {
        "partialNodes": 0,
        "partialMeshesBuilt": 0,
        "partialMeshesEmptied": 0,
        "keptTriangles": 0,
        "droppedTriangles": 0,
        "keptVerticesAcrossPrimitives": 0,
        "partialPrimitiveCount": 0,
    }

    with source.open("rb") as fh:
        for node_id, info in classification.items():
            if info["state"] != "PARTIAL":
                continue

            stats["partialNodes"] += 1
            mesh = doc["meshes"][info["meshId"]]
            new_primitives = []

            for primitive in mesh.get("primitives", []):
                primitive_bounds = primitive_world_bounds(
                    doc,
                    primitive,
                    world[node_id],
                )

                if primitive_bounds is None:
                    raise SystemExit(
                        f"Unable to determine partial primitive bounds "
                        f"for node {node_id}."
                    )

                if bounds_inside(primitive_bounds, envelope):
                    # Mark original primitive for later accessor remap.
                    kept = json.loads(json.dumps(primitive))
                    kept["_v3OriginalPrimitive"] = True
                    new_primitives.append(kept)
                    continue

                if not bounds_intersect(primitive_bounds, envelope):
                    # Entire primitive is outside.
                    # We do not need to decode it.
                    continue

                stats["partialPrimitiveCount"] += 1
                result = crop_primitive(
                    fh,
                    doc,
                    layout,
                    primitive,
                    world[node_id],
                    envelope,
                    generated_payloads,
                    generated_accessors,
                    generated_views,
                )
                stats["keptTriangles"] += result["keptTriangles"]
                stats["droppedTriangles"] += result["droppedTriangles"]
                stats["keptVerticesAcrossPrimitives"] += result["keptVertices"]

                if result["primitive"] is not None:
                    new_primitives.append(result["primitive"])

            if new_primitives:
                cropped_mesh_by_node[node_id] = {
                    "name": (
                        f"{mesh.get('name', f'mesh_{info['meshId']}')}"
                        f"__V3_CROPPED_NODE_{node_id}"
                    ),
                    "primitives": new_primitives,
                }
                stats["partialMeshesBuilt"] += 1
            else:
                stats["partialMeshesEmptied"] += 1

    return {
        "croppedMeshByNode": cropped_mesh_by_node,
        "generatedPayloads": generated_payloads,
        "generatedAccessors": generated_accessors,
        "generatedViews": generated_views,
        "stats": stats,
    }


def collect_primitive_refs(primitive, accessor_ids, material_ids):
    for accessor_id in (primitive.get("attributes") or {}).values():
        accessor_ids.add(accessor_id)
    if primitive.get("indices") is not None:
        accessor_ids.add(primitive["indices"])
    if primitive.get("material") is not None:
        material_ids.add(primitive["material"])
    for target in primitive.get("targets") or []:
        for accessor_id in (target or {}).values():
            accessor_ids.add(accessor_id)


def build_document(
    doc,
    reachable,
    classification,
    crop_result,
):
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    materials = doc.get("materials", [])
    buffer_views = doc.get("bufferViews", [])

    cropped_mesh_by_node = crop_result["croppedMeshByNode"]

    keep_mesh_node = {}
    for node_id in reachable:
        node = nodes[node_id]
        if node.get("mesh") is None:
            continue
        info = classification.get(node_id)
        if info is None:
            keep_mesh_node[node_id] = True
        elif info["state"] == "INSIDE":
            keep_mesh_node[node_id] = True
        elif info["state"] == "PARTIAL" and node_id in cropped_mesh_by_node:
            keep_mesh_node[node_id] = True
        else:
            keep_mesh_node[node_id] = False

    keep_cache = {}
    visiting = set()

    def keep_node(node_id):
        if node_id not in reachable:
            return False
        if node_id in keep_cache:
            return keep_cache[node_id]
        if node_id in visiting:
            raise SystemExit("Node hierarchy cycle during V3 remap.")

        visiting.add(node_id)
        node = nodes[node_id]
        keep_here = bool(
            keep_mesh_node.get(node_id, False)
            or node.get("camera") is not None
        )
        keep_child = any(
            keep_node(child)
            for child in node.get("children", [])
            if 0 <= child < len(nodes)
        )
        keep = keep_here or keep_child
        keep_cache[node_id] = keep
        visiting.remove(node_id)
        return keep

    for node_id in reachable:
        keep_node(node_id)

    kept_node_ids = [
        node_id
        for node_id in sorted(reachable)
        if keep_cache.get(node_id, False)
    ]
    node_map = {
        old: new
        for new, old in enumerate(kept_node_ids)
    }

    inside_original_mesh_ids = sorted({
        nodes[node_id]["mesh"]
        for node_id in kept_node_ids
        if nodes[node_id].get("mesh") is not None
        and classification.get(node_id, {}).get("state") != "PARTIAL"
        and keep_mesh_node.get(node_id, False)
    })

    original_mesh_map = {
        old: new
        for new, old in enumerate(inside_original_mesh_ids)
    }

    original_accessor_ids = set()
    material_ids = set()

    for mesh_id in inside_original_mesh_ids:
        for primitive in meshes[mesh_id].get("primitives", []):
            collect_primitive_refs(
                primitive,
                original_accessor_ids,
                material_ids,
            )

    # Partially cropped meshes may contain some original untouched primitives.
    for node_id, cropped_mesh in cropped_mesh_by_node.items():
        for primitive in cropped_mesh.get("primitives", []):
            if primitive.get("_v3OriginalPrimitive"):
                for accessor_id in (primitive.get("attributes") or {}).values():
                    original_accessor_ids.add(accessor_id)
                if primitive.get("indices") is not None:
                    original_accessor_ids.add(primitive["indices"])
                if primitive.get("material") is not None:
                    material_ids.add(primitive["material"])
            else:
                if primitive.get("material") is not None:
                    material_ids.add(primitive["material"])

    original_accessor_ids = sorted(original_accessor_ids)
    material_ids = sorted(material_ids)
    original_buffer_view_ids = sorted(
        v1.accessor_buffer_views(doc, original_accessor_ids)
    )

    accessor_map = {
        old: new
        for new, old in enumerate(original_accessor_ids)
    }
    material_map = {
        old: new
        for new, old in enumerate(material_ids)
    }
    view_map = {
        old: new
        for new, old in enumerate(original_buffer_view_ids)
    }

    new_materials = [
        json.loads(json.dumps(materials[old]))
        for old in material_ids
    ]
    new_accessors = []
    for old in original_accessor_ids:
        acc = json.loads(json.dumps(accessors[old]))
        if acc.get("bufferView") is not None:
            acc["bufferView"] = view_map[acc["bufferView"]]
        new_accessors.append(acc)

    new_views = [
        json.loads(json.dumps(buffer_views[old]))
        for old in original_buffer_view_ids
    ]

    # Append generated V3 bufferViews/accessors. Their bufferView references
    # are local to the generated arrays and must be offset here.
    generated_view_base = len(new_views)
    for view in crop_result["generatedViews"]:
        new_views.append(json.loads(json.dumps(view)))

    generated_accessor_base = len(new_accessors)
    for acc in crop_result["generatedAccessors"]:
        copied = json.loads(json.dumps(acc))
        copied["bufferView"] = (
            generated_view_base + int(copied["bufferView"])
        )
        new_accessors.append(copied)

    def remap_primitive(primitive):
        p = json.loads(json.dumps(primitive))
        is_original = bool(p.pop("_v3OriginalPrimitive", False))

        if is_original:
            p["attributes"] = {
                semantic: accessor_map[old]
                for semantic, old in (p.get("attributes") or {}).items()
            }
            if p.get("indices") is not None:
                p["indices"] = accessor_map[p["indices"]]
            if p.get("targets"):
                p["targets"] = [
                    {
                        semantic: accessor_map[old]
                        for semantic, old in target.items()
                    }
                    for target in p["targets"]
                ]
        else:
            p["attributes"] = {
                semantic: generated_accessor_base + local
                for semantic, local in (p.get("attributes") or {}).items()
            }
            if p.get("indices") is not None:
                p["indices"] = generated_accessor_base + p["indices"]

        if p.get("material") is not None:
            p["material"] = material_map[p["material"]]

        return p

    new_meshes = []

    for old_mesh in inside_original_mesh_ids:
        mesh = json.loads(json.dumps(meshes[old_mesh]))
        for p in mesh.get("primitives", []):
            p["_v3OriginalPrimitive"] = True
        mesh["primitives"] = [
            remap_primitive(p)
            for p in mesh.get("primitives", [])
        ]
        new_meshes.append(mesh)

    cropped_mesh_index_by_node = {}

    for node_id in sorted(cropped_mesh_by_node):
        source_mesh = cropped_mesh_by_node[node_id]
        mesh_index = len(new_meshes)
        cropped_mesh_index_by_node[node_id] = mesh_index
        new_meshes.append({
            "name": source_mesh.get("name"),
            "primitives": [
                remap_primitive(p)
                for p in source_mesh.get("primitives", [])
            ],
        })

    new_nodes = []

    for old in kept_node_ids:
        node = json.loads(json.dumps(nodes[old]))
        original_mesh = node.get("mesh")

        if old in cropped_mesh_index_by_node:
            node["mesh"] = cropped_mesh_index_by_node[old]
            extras = dict(node.get("extras") or {})
            extras["venueV3Cropped"] = True
            node["extras"] = extras
        elif original_mesh is not None and keep_mesh_node.get(old, False):
            node["mesh"] = original_mesh_map[original_mesh]
        else:
            node.pop("mesh", None)

        if node.get("children"):
            children = [
                node_map[child]
                for child in node["children"]
                if child in node_map
            ]
            if children:
                node["children"] = children
            else:
                node.pop("children", None)

        new_nodes.append(node)

    new_scenes = []
    for scene in doc.get("scenes", []):
        copied = json.loads(json.dumps(scene))
        copied["nodes"] = [
            node_map[root]
            for root in scene.get("nodes", [])
            if root in node_map
        ]
        new_scenes.append(copied)

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
        "keptNodeIds": kept_node_ids,
        "originalBufferViewIds": original_buffer_view_ids,
        "generatedViewBase": generated_view_base,
        "generatedPayloads": crop_result["generatedPayloads"],
        "croppedMeshCount": len(cropped_mesh_index_by_node),
    }


def write_glb(source, output, layout, original_doc, built):
    doc = built["doc"]
    retained_views = built["originalBufferViewIds"]
    old_views = original_doc.get("bufferViews", [])
    generated_payloads = built["generatedPayloads"]
    generated_view_base = built["generatedViewBase"]

    output.parent.mkdir(parents=True, exist_ok=True)
    tmp_bin = output.with_suffix(output.suffix + ".bin.tmp")

    offsets = {}
    out_pos = 0

    try:
        with source.open("rb") as src, tmp_bin.open("wb") as dst:
            for old_view in retained_views:
                view = old_views[old_view]
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
                        raise SystemExit(
                            "Unexpected EOF while repacking V3 BIN."
                        )
                    dst.write(chunk)
                    remaining -= len(chunk)
                    out_pos += len(chunk)

            for local_index, payload in enumerate(generated_payloads):
                pad = (-out_pos) % 4
                if pad:
                    dst.write(b"\x00" * pad)
                    out_pos += pad

                view_index = generated_view_base + local_index
                doc["bufferViews"][view_index]["buffer"] = 0
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

        with output.open("wb") as out, tmp_bin.open("rb") as bin_fh:
            out.write(
                struct.pack("<4sII", v1.GLB_MAGIC, 2, total_length)
            )
            out.write(
                struct.pack("<II", len(raw_json), v1.JSON_CHUNK)
            )
            out.write(raw_json)
            out.write(
                struct.pack("<II", out_pos, v1.BIN_CHUNK)
            )

            while True:
                chunk = bin_fh.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)

    finally:
        tmp_bin.unlink(missing_ok=True)


def bounds_m(doc):
    b = v1.scene_bounds(doc)
    return v1.bounds_to_m(b)


def extents_m(bounds):
    return v1.extents_from_bounds_m(bounds)


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            "Build Sound Club venue-web-v3 by cropping V2 to the dense venue "
            "core. Fully inside meshes are untouched, fully outside meshes are "
            "removed, and partial triangle meshes are cropped by retaining only "
            "triangles whose vertices are inside the venue envelope."
        )
    )
    ap.add_argument("v2_glb", type=Path)
    ap.add_argument("v2_report", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--report", type=Path, required=True)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    for required in (args.v2_glb, args.v2_report):
        if not required.exists():
            raise SystemExit(f"Required input not found: {required}")

    if args.output.exists() and not args.force:
        raise SystemExit(
            f"Output already exists: {args.output}. "
            "Review the existing report or use --force intentionally."
        )

    v2_report = json.loads(
        args.v2_report.read_text(encoding="utf-8")
    )
    expected_sha = (v2_report.get("derivedV2") or {}).get("sha256")
    if not expected_sha:
        raise SystemExit("V2 report is missing derivedV2.sha256.")

    actual_sha = v1.sha256_file(args.v2_glb)
    if actual_sha.lower() != expected_sha.lower():
        raise SystemExit(
            "V2 SOURCE HASH MISMATCH. V3 build blocked.\n"
            f"Expected: {expected_sha}\n"
            f"Actual:   {actual_sha}"
        )

    doc, layout = v1.read_glb(args.v2_glb)

    if doc.get("animations") or doc.get("skins"):
        raise SystemExit("V3 crop blocked: animations/skins are present.")
    if doc.get("images") or doc.get("textures"):
        raise SystemExit("V3 crop blocked: images/textures are present.")

    print("Stage 1/6: calculating venue density core...")
    world, reachable = collect_world_matrices(doc)

    mesh_bounds_cache = {}
    density_rows = []

    for node_id in sorted(reachable):
        node = doc["nodes"][node_id]
        mesh_id = node.get("mesh")
        if mesh_id is None:
            continue

        if mesh_id not in mesh_bounds_cache:
            mesh_bounds_cache[mesh_id] = v1.mesh_local_bounds(doc, mesh_id)

        local_bounds = mesh_bounds_cache[mesh_id]
        if local_bounds is None:
            continue

        world_bounds = v1.transform_bounds(
            local_bounds,
            world[node_id],
        )
        density_rows.append({
            "nodeId": node_id,
            "meshId": mesh_id,
            "centerMm": bounds_center(world_bounds),
            "boundsMm": world_bounds,
        })

    core = density_core(density_rows)
    envelope = make_envelope(core["centerMm"])
    print(
        "  core center m: "
        f"{core['centerM'][0]:.3f}, "
        f"{core['centerM'][1]:.3f}, "
        f"{core['centerM'][2]:.3f}"
    )
    print(
        "  crop envelope m: "
        f"X {envelope[0][0]/1000:.3f}..{envelope[1][0]/1000:.3f}, "
        f"Y {envelope[0][1]/1000:.3f}..{envelope[1][1]/1000:.3f}, "
        f"Z {envelope[0][2]/1000:.3f}..{envelope[1][2]/1000:.3f}"
    )

    print("Stage 2/6: classifying V2 mesh nodes against venue envelope...")
    classification, rows = classify_nodes(
        doc,
        world,
        reachable,
        envelope,
    )

    state_counts = Counter(
        info["state"]
        for info in classification.values()
    )
    print(
        f"  inside={state_counts['INSIDE']} "
        f"partial={state_counts['PARTIAL']} "
        f"outside={state_counts['OUTSIDE']}"
    )

    outside_groups = Counter(
        info["group"]
        for info in classification.values()
        if info["state"] == "OUTSIDE"
    )

    print("Stage 3/6: cropping partial triangle meshes...")
    crop_result = build_cropped_meshes(
        args.v2_glb,
        doc,
        layout,
        world,
        classification,
        envelope,
    )
    crop_stats = crop_result["stats"]
    print(
        f"  cropped meshes built={crop_stats['partialMeshesBuilt']} "
        f"emptied={crop_stats['partialMeshesEmptied']} "
        f"kept triangles={crop_stats['keptTriangles']} "
        f"dropped triangles={crop_stats['droppedTriangles']}"
    )

    print("Stage 4/6: compacting hierarchy/meshes/accessors...")
    built = build_document(
        doc,
        reachable,
        classification,
        crop_result,
    )

    print("Stage 5/6: streaming retained + cropped BIN into venue-web-v3...")
    if args.output.exists() and args.force:
        args.output.unlink()

    write_glb(
        args.v2_glb,
        args.output,
        layout,
        doc,
        built,
    )

    print("Stage 6/6: validating venue-web-v3...")
    out_doc, out_layout = v1.read_glb(args.output)
    output_sha = v1.sha256_file(args.output)
    output_bytes = args.output.stat().st_size
    output_bounds = bounds_m(out_doc)
    output_extent = extents_m(output_bounds)

    size_ok = output_bytes <= 95.0 * 1024 * 1024
    mesh_ok = len(out_doc.get("meshes", [])) <= 20000
    bounds_ok = bool(
        output_extent
        and output_extent[0] <= 120.0
        and output_extent[2] <= 120.0
        and output_extent[1] <= 40.0
    )

    envelope_m = [
        [v / 1000.0 for v in envelope[0]],
        [v / 1000.0 for v in envelope[1]],
    ]

    report = {
        "schemaVersion": 1,
        "projectId": PROJECT_ID,
        "buildMode": "VENUE_DENSE_CORE_TRIANGLE_CROP",
        "sourceV2": {
            "path": str(args.v2_glb),
            "sha256": actual_sha,
            "sizeBytes": args.v2_glb.stat().st_size,
            "sizeMiB": args.v2_glb.stat().st_size / (1024.0 * 1024.0),
            "binBytes": layout["binLength"],
            "nodes": len(doc.get("nodes", [])),
            "meshes": len(doc.get("meshes", [])),
            "boundsM": bounds_m(doc),
            "extentM": extents_m(bounds_m(doc)),
        },
        "venueCore": {
            **core,
            "cropEnvelopeBoundsM": envelope_m,
            "cropEnvelopeExtentM": [100.0, 36.0, 100.0],
        },
        "classification": {
            "insideMeshNodes": state_counts["INSIDE"],
            "partialMeshNodes": state_counts["PARTIAL"],
            "outsideMeshNodes": state_counts["OUTSIDE"],
            "outsideGroupsTop30": [
                {"group": group, "nodes": count}
                for group, count in outside_groups.most_common(30)
            ],
        },
        "triangleCrop": crop_stats,
        "derivedV3": {
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
            "croppedMeshes": built["croppedMeshCount"],
            "boundsM": output_bounds,
            "extentM": output_extent,
        },
        "reductionFromV2": {
            "fileMiB": (
                args.v2_glb.stat().st_size - output_bytes
            ) / (1024.0 * 1024.0),
            "filePercent": (
                (args.v2_glb.stat().st_size - output_bytes)
                / args.v2_glb.stat().st_size * 100.0
            ),
            "binMiB": (
                layout["binLength"] - out_layout["binLength"]
            ) / (1024.0 * 1024.0),
            "binPercent": (
                (layout["binLength"] - out_layout["binLength"])
                / layout["binLength"] * 100.0
            ),
            "nodes": (
                len(doc.get("nodes", []))
                - len(out_doc.get("nodes", []))
            ),
            "meshes": (
                len(doc.get("meshes", []))
                - len(out_doc.get("meshes", []))
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
            "allNumericGatesPassed": bool(size_ok and mesh_ok and bounds_ok),
            "readyForVisualQA": bool(size_ok and mesh_ok and bounds_ok),
            "publicPromotionAllowed": False,
            "status": (
                "V3_NUMERIC_GATE_MET_VISUAL_QA_REQUIRED"
                if size_ok and mesh_ok and bounds_ok
                else "V3_REQUIRES_REVIEW"
            ),
        },
        "policy": {
            "privateSketchUpMasterModified": False,
            "venueMasterModified": False,
            "venueWebV1Modified": False,
            "venueWebV2Modified": False,
            "separateDerivedOutput": True,
            "cropMethod": (
                "Fully inside meshes untouched; fully outside mesh nodes "
                "removed; partial TRIANGLES primitives retain only triangles "
                "whose three world-space vertices are inside the venue envelope."
            ),
            "publicPromotionPerformed": False,
        },
    }

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(json.dumps({
        "venueCore": report["venueCore"],
        "classification": report["classification"],
        "triangleCrop": report["triangleCrop"],
        "derivedV3": report["derivedV3"],
        "reductionFromV2": report["reductionFromV2"],
        "webGate": report["webGate"],
        "report": str(args.report),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
