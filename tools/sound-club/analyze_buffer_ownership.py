#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import struct
from collections import defaultdict
from pathlib import Path

GLB_MAGIC = b"glTF"
JSON_CHUNK = 0x4E4F534A

SAFE_DELETE_ACTIONS = {
    "PROXY_OR_REMOVE_DECOR",
    "REMOVE_OR_PROXY_MINOR_HARDWARE",
    "REMOVE_WEB_DECOR",
}

PROXY_REPLACEMENT_ACTIONS = SAFE_DELETE_ACTIONS | {
    "PROXY_FURNITURE",
    "INSTANCE_SIMPLIFY_HARDWARE",
    "INSTANCE_PROXY_LIGHTING",
    "KEEP_PROXY_LIGHTING",
    "KEEP_PROXY_DJ_EQUIPMENT",
}

SIMPLIFICATION_ACTIONS = PROXY_REPLACEMENT_ACTIONS | {
    "KEEP_SIMPLIFY_ACOUSTIC",
    "KEEP_MERGE_ARCHITECTURE",
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


def read_glb_json(path: Path):
    with path.open("rb") as fh:
        header = fh.read(12)
        if len(header) != 12:
            raise SystemExit("Invalid GLB header.")
        magic, version, total_length = struct.unpack("<4sII", header)
        if magic != GLB_MAGIC or version != 2:
            raise SystemExit(f"Unsupported GLB: magic={magic!r}, version={version}")
        chunk_header = fh.read(8)
        chunk_length, chunk_type = struct.unpack("<II", chunk_header)
        if chunk_type != JSON_CHUNK:
            raise SystemExit("First GLB chunk is not JSON.")
        raw = fh.read(chunk_length)
        doc = json.loads(raw.decode("utf-8").rstrip("\x00 \t\r\n"))
    return doc, total_length


def accessor_buffer_views(doc, accessor_id):
    accessors = doc.get("accessors", [])
    if accessor_id is None or accessor_id < 0 or accessor_id >= len(accessors):
        return set()
    acc = accessors[accessor_id]
    result = set()
    if acc.get("bufferView") is not None:
        result.add(acc["bufferView"])
    sparse = acc.get("sparse") or {}
    indices = sparse.get("indices") or {}
    values = sparse.get("values") or {}
    if indices.get("bufferView") is not None:
        result.add(indices["bufferView"])
    if values.get("bufferView") is not None:
        result.add(values["bufferView"])
    return result


def mesh_buffer_views(doc, mesh_id):
    meshes = doc.get("meshes", [])
    if mesh_id is None or mesh_id < 0 or mesh_id >= len(meshes):
        return set()
    views = set()
    for prim in meshes[mesh_id].get("primitives", []):
        attrs = prim.get("attributes") or {}
        for aid in attrs.values():
            views |= accessor_buffer_views(doc, aid)
        if prim.get("indices") is not None:
            views |= accessor_buffer_views(doc, prim["indices"])
        for target in prim.get("targets") or []:
            for aid in (target or {}).values():
                views |= accessor_buffer_views(doc, aid)
    return views


def scenario(groups_selected, refs_by_view, buffer_views):
    selected = set(groups_selected)
    removable = 0
    removable_views = 0
    for vid, groups in refs_by_view.items():
        if groups and groups.issubset(selected):
            removable += int(buffer_views[vid].get("byteLength", 0) or 0)
            removable_views += 1
    total_bin = sum(int(v.get("byteLength", 0) or 0) for v in buffer_views)
    return {
        "selectedGroupCount": len(selected),
        "removableBufferViews": removable_views,
        "removableBytes": removable,
        "removableMiB": removable / (1024.0 * 1024.0),
        "binReductionPercent": (removable / total_bin * 100.0) if total_bin else 0.0,
        "remainingBinMiB": (total_bin - removable) / (1024.0 * 1024.0),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Analyze exact GLB buffer ownership by top-level group.")
    ap.add_argument("glb", type=Path)
    ap.add_argument("plan", type=Path)
    ap.add_argument("--json", dest="json_out", type=Path, required=True)
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"GLB not found: {args.glb}")
    if not args.plan.exists():
        raise SystemExit(f"Optimization plan not found: {args.plan}")

    doc, total_length = read_glb_json(args.glb)
    plan = json.loads(args.plan.read_text(encoding="utf-8"))
    action_by_group = {
        str(row.get("topLevelGroup", "UNNAMED")).upper(): row.get("action", "REVIEW_MANUALLY")
        for row in plan.get("groups") or []
    }

    nodes = doc.get("nodes", [])
    buffer_views = doc.get("bufferViews", [])

    mesh_view_cache = {}
    refs_by_group = defaultdict(set)
    refs_by_view = defaultdict(set)
    node_count_by_group = defaultdict(int)

    for node in nodes:
        mesh_id = node.get("mesh")
        if mesh_id is None:
            continue
        group = top_level_group(node.get("name", ""))
        node_count_by_group[group] += 1
        if mesh_id not in mesh_view_cache:
            mesh_view_cache[mesh_id] = mesh_buffer_views(doc, mesh_id)
        views = mesh_view_cache[mesh_id]
        refs_by_group[group].update(views)
        for vid in views:
            refs_by_view[vid].add(group)

    rows = []
    for group, views in refs_by_group.items():
        referenced = sum(int(buffer_views[v].get("byteLength", 0) or 0) for v in views)
        exclusive_views = [v for v in views if refs_by_view[v] == {group}]
        exclusive = sum(int(buffer_views[v].get("byteLength", 0) or 0) for v in exclusive_views)
        rows.append({
            "group": group,
            "action": action_by_group.get(group, "REVIEW_MANUALLY"),
            "nodeCount": node_count_by_group[group],
            "uniqueReferencedBufferViews": len(views),
            "referencedMiB": referenced / (1024.0 * 1024.0),
            "exclusiveBufferViews": len(exclusive_views),
            "exclusiveMiB": exclusive / (1024.0 * 1024.0),
            "sharedMiB": (referenced - exclusive) / (1024.0 * 1024.0),
        })

    rows.sort(key=lambda r: r["exclusiveMiB"], reverse=True)

    safe_groups = [r["group"] for r in rows if r["action"] in SAFE_DELETE_ACTIONS]
    proxy_groups = [r["group"] for r in rows if r["action"] in PROXY_REPLACEMENT_ACTIONS]
    simplify_groups = [r["group"] for r in rows if r["action"] in SIMPLIFICATION_ACTIONS]

    result = {
        "schemaVersion": 1,
        "projectId": "SOUND_CLUB_CDM",
        "source": {
            "glb": str(args.glb),
            "fileBytes": args.glb.stat().st_size,
            "reportedTotalLength": total_length,
            "nodeCount": len(nodes),
            "bufferViewCount": len(buffer_views),
        },
        "notes": {
            "exclusiveMiB": "Bytes referenced only by one top-level group.",
            "referencedMiB": "Unique bytes referenced inside that group; may also be shared with other groups.",
            "scenarioMeaning": (
                "Scenarios estimate how much existing payload could be removed if every selected group were replaced. "
                "They do not estimate final proxy/instance payload and do not authorize mutation."
            ),
        },
        "topGroupsByExclusiveBytes": rows[:120],
        "scenarios": {
            "safeDeleteOnly": scenario(safe_groups, refs_by_view, buffer_views),
            "replaceProxyAndInstanceCandidates": scenario(proxy_groups, refs_by_view, buffer_views),
            "replaceProxyInstanceAndSimplifiableArchitectureAcoustics": scenario(simplify_groups, refs_by_view, buffer_views),
        },
        "selectedGroups": {
            "safeDeleteOnly": safe_groups,
            "replaceProxyAndInstanceCandidates": proxy_groups,
            "replaceProxyInstanceAndSimplifiableArchitectureAcoustics": simplify_groups,
        },
        "policy": {
            "dryRunOnly": True,
            "privateSketchUpMasterModified": False,
            "candidateGlbModified": False,
            "automaticMutationAuthorized": False,
        },
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps({
        "policy": result["policy"],
        "scenarios": result["scenarios"],
        "top20GroupsByExclusiveMiB": [
            {
                "group": r["group"],
                "action": r["action"],
                "nodes": r["nodeCount"],
                "exclusiveMiB": r["exclusiveMiB"],
                "sharedMiB": r["sharedMiB"],
            }
            for r in rows[:20]
        ],
        "json": str(args.json_out),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
