#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
from pathlib import Path


GLB_MAGIC = b"glTF"
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942

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


def read_glb_layout(path: Path):
    with path.open("rb") as fh:
        header = fh.read(12)
        if len(header) != 12:
            raise SystemExit("Invalid GLB header.")
        magic, version, total_length = struct.unpack("<4sII", header)
        if magic != GLB_MAGIC or version != 2:
            raise SystemExit(f"Unsupported GLB header: magic={magic!r} version={version}")

        json_header = fh.read(8)
        json_length, json_type = struct.unpack("<II", json_header)
        if json_type != JSON_CHUNK:
            raise SystemExit("First GLB chunk is not JSON.")
        json_offset = fh.tell()
        raw_json = fh.read(json_length)
        doc = json.loads(raw_json.decode("utf-8").rstrip("\x00 \t\r\n"))

        bin_header_offset = fh.tell()
        bin_header = fh.read(8)
        if len(bin_header) != 8:
            raise SystemExit("GLB BIN chunk missing.")
        bin_length, bin_type = struct.unpack("<II", bin_header)
        if bin_type != BIN_CHUNK:
            raise SystemExit("Second GLB chunk is not BIN.")
        bin_offset = fh.tell()

    return {
        "doc": doc,
        "totalLength": total_length,
        "jsonOffset": json_offset,
        "jsonLength": json_length,
        "binHeaderOffset": bin_header_offset,
        "binOffset": bin_offset,
        "binLength": bin_length,
    }


def collect_accessor_buffer_views(doc, accessor_ids):
    accessors = doc.get("accessors", [])
    views = set()
    for aid in accessor_ids:
        if aid is None or aid < 0 or aid >= len(accessors):
            continue
        acc = accessors[aid]
        view = acc.get("bufferView")
        if view is not None:
            views.add(view)
        sparse = acc.get("sparse") or {}
        indices = sparse.get("indices") or {}
        values = sparse.get("values") or {}
        if indices.get("bufferView") is not None:
            views.add(indices["bufferView"])
        if values.get("bufferView") is not None:
            views.add(values["bufferView"])
    return views


def primitive_accessor_ids(primitive):
    ids = []
    attrs = primitive.get("attributes") or {}
    ids.extend(attrs.values())
    if primitive.get("indices") is not None:
        ids.append(primitive["indices"])
    for target in primitive.get("targets") or []:
        ids.extend((target or {}).values())
    return ids


def build_plan(doc, optimization_plan):
    groups = optimization_plan.get("groups") or []
    action_by_group = {
        str(row.get("topLevelGroup", "UNNAMED")).upper(): row.get("action", "REVIEW_MANUALLY")
        for row in groups
    }

    nodes = doc.get("nodes", [])
    scenes = doc.get("scenes", [])
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    buffer_views = doc.get("bufferViews", [])
    materials = doc.get("materials", [])

    if doc.get("animations"):
        raise SystemExit("Streaming trim blocked: animations are present.")
    if doc.get("skins"):
        raise SystemExit("Streaming trim blocked: skins are present.")

    direct_keep = [True] * len(nodes)
    dropped_by_action = {}
    dropped_by_group = {}

    for idx, node in enumerate(nodes):
        if node.get("mesh") is None:
            continue
        group = top_level_group(node.get("name", ""))
        action = action_by_group.get(group, "REVIEW_MANUALLY")
        if action in SAFE_DROP_ACTIONS:
            direct_keep[idx] = False
            dropped_by_action[action] = dropped_by_action.get(action, 0) + 1
            dropped_by_group[group] = dropped_by_group.get(group, 0) + 1

    # Keep transform/container nodes whenever they have a kept descendant.
    keep_cache = {}
    visiting = set()

    def should_keep_node(index):
        if index in keep_cache:
            return keep_cache[index]
        if index in visiting:
            raise SystemExit("Node hierarchy cycle detected.")
        visiting.add(index)
        node = nodes[index]
        keep_here = direct_keep[index] if node.get("mesh") is not None else False
        child_keep = any(should_keep_node(c) for c in node.get("children", []) if 0 <= c < len(nodes))
        # Non-mesh containers are kept only when required by retained children.
        keep = keep_here or child_keep
        keep_cache[index] = keep
        visiting.remove(index)
        return keep

    for i in range(len(nodes)):
        should_keep_node(i)

    kept_node_ids = [i for i in range(len(nodes)) if keep_cache.get(i, False)]
    kept_node_set = set(kept_node_ids)

    kept_mesh_ids = sorted({
        nodes[i]["mesh"]
        for i in kept_node_ids
        if nodes[i].get("mesh") is not None
    })

    accessor_ids = set()
    material_ids = set()
    for mid in kept_mesh_ids:
        if mid < 0 or mid >= len(meshes):
            raise SystemExit(f"Invalid mesh index {mid}.")
        for primitive in meshes[mid].get("primitives", []):
            accessor_ids.update(primitive_accessor_ids(primitive))
            if primitive.get("material") is not None:
                material_ids.add(primitive["material"])

    buffer_view_ids = collect_accessor_buffer_views(doc, accessor_ids)

    kept_buffer_bytes = sum(
        int(buffer_views[vid].get("byteLength", 0) or 0)
        for vid in buffer_view_ids
        if 0 <= vid < len(buffer_views)
    )

    return {
        "actionByGroup": action_by_group,
        "keptNodeIds": kept_node_ids,
        "keptNodeSet": kept_node_set,
        "keptMeshIds": kept_mesh_ids,
        "keptAccessorIds": sorted(accessor_ids),
        "keptBufferViewIds": sorted(buffer_view_ids),
        "keptMaterialIds": sorted(material_ids),
        "keptBufferBytes": kept_buffer_bytes,
        "droppedByAction": dropped_by_action,
        "droppedByGroup": dropped_by_group,
    }


def remap_document(doc, plan):
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    buffer_views = doc.get("bufferViews", [])
    materials = doc.get("materials", [])

    node_map = {old: new for new, old in enumerate(plan["keptNodeIds"])}
    mesh_map = {old: new for new, old in enumerate(plan["keptMeshIds"])}
    accessor_map = {old: new for new, old in enumerate(plan["keptAccessorIds"])}
    view_map = {old: new for new, old in enumerate(plan["keptBufferViewIds"])}
    material_map = {old: new for new, old in enumerate(plan["keptMaterialIds"])}

    new_nodes = []
    for old in plan["keptNodeIds"]:
        node = dict(nodes[old])
        if node.get("mesh") is not None:
            node["mesh"] = mesh_map[node["mesh"]]
        if node.get("children"):
            node["children"] = [node_map[c] for c in node["children"] if c in node_map]
            if not node["children"]:
                node.pop("children", None)
        new_nodes.append(node)

    new_meshes = []
    for old in plan["keptMeshIds"]:
        mesh = json.loads(json.dumps(meshes[old]))
        for primitive in mesh.get("primitives", []):
            attrs = primitive.get("attributes") or {}
            primitive["attributes"] = {k: accessor_map[v] for k, v in attrs.items()}
            if primitive.get("indices") is not None:
                primitive["indices"] = accessor_map[primitive["indices"]]
            if primitive.get("material") is not None:
                primitive["material"] = material_map[primitive["material"]]
            if primitive.get("targets"):
                primitive["targets"] = [
                    {k: accessor_map[v] for k, v in target.items()}
                    for target in primitive["targets"]
                ]
        new_meshes.append(mesh)

    new_accessors = []
    for old in plan["keptAccessorIds"]:
        acc = json.loads(json.dumps(accessors[old]))
        if acc.get("bufferView") is not None:
            acc["bufferView"] = view_map[acc["bufferView"]]
        sparse = acc.get("sparse")
        if sparse:
            if sparse.get("indices", {}).get("bufferView") is not None:
                sparse["indices"]["bufferView"] = view_map[sparse["indices"]["bufferView"]]
            if sparse.get("values", {}).get("bufferView") is not None:
                sparse["values"]["bufferView"] = view_map[sparse["values"]["bufferView"]]
        new_accessors.append(acc)

    new_views = [json.loads(json.dumps(buffer_views[old])) for old in plan["keptBufferViewIds"]]
    new_materials = [json.loads(json.dumps(materials[old])) for old in plan["keptMaterialIds"]]

    new_scenes = []
    for scene in doc.get("scenes", []):
        sc = json.loads(json.dumps(scene))
        sc["nodes"] = [node_map[n] for n in sc.get("nodes", []) if n in node_map]
        new_scenes.append(sc)

    new_doc = json.loads(json.dumps(doc))
    new_doc["nodes"] = new_nodes
    new_doc["meshes"] = new_meshes
    new_doc["accessors"] = new_accessors
    new_doc["bufferViews"] = new_views
    new_doc["materials"] = new_materials
    new_doc["scenes"] = new_scenes

    # Current candidate has no textures/images; preserve only when absent.
    if new_doc.get("textures") or new_doc.get("images"):
        raise SystemExit("Streaming trim blocked: textures/images are present and remapping is not implemented.")

    # Preserve only one BIN buffer.
    new_doc["buffers"] = [{"byteLength": 0}]

    return new_doc, view_map


def write_trimmed_glb(source: Path, output: Path, layout, new_doc, plan):
    old_views = layout["doc"].get("bufferViews", [])
    output.parent.mkdir(parents=True, exist_ok=True)

    temp_bin = output.with_suffix(output.suffix + ".bin.tmp")
    new_offsets = {}
    out_pos = 0

    with source.open("rb") as src, temp_bin.open("wb") as dst:
        for old_vid in plan["keptBufferViewIds"]:
            view = old_views[old_vid]
            if int(view.get("buffer", 0) or 0) != 0:
                raise SystemExit("Only single-buffer GLBs are supported.")
            old_offset = int(view.get("byteOffset", 0) or 0)
            length = int(view.get("byteLength", 0) or 0)

            pad = (-out_pos) % 4
            if pad:
                dst.write(b"\x00" * pad)
                out_pos += pad

            new_offsets[old_vid] = out_pos
            src.seek(layout["binOffset"] + old_offset)
            remaining = length
            while remaining:
                chunk = src.read(min(1024 * 1024, remaining))
                if not chunk:
                    raise SystemExit("Unexpected end of source BIN chunk.")
                dst.write(chunk)
                remaining -= len(chunk)
                out_pos += len(chunk)

        bin_pad = (-out_pos) % 4
        if bin_pad:
            dst.write(b"\x00" * bin_pad)
            out_pos += bin_pad

    for new_vid, old_vid in enumerate(plan["keptBufferViewIds"]):
        new_doc["bufferViews"][new_vid]["buffer"] = 0
        new_doc["bufferViews"][new_vid]["byteOffset"] = new_offsets[old_vid]

    new_doc["buffers"][0]["byteLength"] = out_pos

    raw_json = json.dumps(new_doc, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    json_pad = (-len(raw_json)) % 4
    raw_json += b" " * json_pad

    total_length = 12 + 8 + len(raw_json) + 8 + out_pos

    with output.open("wb") as out, temp_bin.open("rb") as binfh:
        out.write(struct.pack("<4sII", GLB_MAGIC, 2, total_length))
        out.write(struct.pack("<II", len(raw_json), JSON_CHUNK))
        out.write(raw_json)
        out.write(struct.pack("<II", out_pos, BIN_CHUNK))
        while True:
            chunk = binfh.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)

    temp_bin.unlink(missing_ok=True)


def main() -> int:
    ap = argparse.ArgumentParser(description="Low-memory streaming GLB trimmer for Sound Club.")
    ap.add_argument("glb", type=Path)
    ap.add_argument("plan", type=Path)
    ap.add_argument("--output", type=Path, required=True)
    ap.add_argument("--report", type=Path, required=True)
    ap.add_argument("--build", action="store_true", help="Actually write the derived GLB. Default is dry-run.")
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"Source GLB not found: {args.glb}")
    if not args.plan.exists():
        raise SystemExit(f"Optimization plan not found: {args.plan}")

    layout = read_glb_layout(args.glb)
    optimization_plan = json.loads(args.plan.read_text(encoding="utf-8"))
    plan = build_plan(layout["doc"], optimization_plan)

    source_bytes = args.glb.stat().st_size
    projected_bin_bytes = plan["keptBufferBytes"]
    projected_ratio = projected_bin_bytes / max(1, layout["binLength"])

    report = {
        "schemaVersion": 1,
        "mode": "BUILD" if args.build else "DRY_RUN",
        "source": {
            "path": str(args.glb),
            "sizeBytes": source_bytes,
            "sha256": sha256_file(args.glb),
            "binBytes": layout["binLength"],
            "nodes": len(layout["doc"].get("nodes", [])),
            "meshes": len(layout["doc"].get("meshes", [])),
        },
        "safeDropActions": sorted(SAFE_DROP_ACTIONS),
        "selection": {
            "keptNodes": len(plan["keptNodeIds"]),
            "keptMeshes": len(plan["keptMeshIds"]),
            "keptAccessors": len(plan["keptAccessorIds"]),
            "keptBufferViews": len(plan["keptBufferViewIds"]),
            "droppedNodesByAction": plan["droppedByAction"],
            "droppedNodesByGroup": plan["droppedByGroup"],
        },
        "projection": {
            "sourceBinBytes": layout["binLength"],
            "keptReferencedBufferBytes": projected_bin_bytes,
            "estimatedBinRetentionRatio": projected_ratio,
            "estimatedBinReductionPercent": (1.0 - projected_ratio) * 100.0,
            "note": "Projection is based on unique retained bufferViews; final JSON/header overhead is small relative to BIN.",
        },
        "policy": {
            "privateSketchUpMasterModified": False,
            "sourceCandidateModified": False,
            "derivedOutputOnly": True,
            "architectureAutomaticallyDropped": False,
        },
        "output": {
            "path": str(args.output),
            "written": False,
        },
    }

    if args.build:
        new_doc, _ = remap_document(layout["doc"], plan)
        write_trimmed_glb(args.glb, args.output, layout, new_doc, plan)
        report["output"].update({
            "written": True,
            "sizeBytes": args.output.stat().st_size,
            "sha256": sha256_file(args.output),
        })

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
