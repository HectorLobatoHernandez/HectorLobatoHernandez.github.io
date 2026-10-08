#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
from collections import defaultdict
from pathlib import Path

GLB_MAGIC = b"glTF"
JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


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
        raw = fh.read(json_length)
        doc = json.loads(raw.decode("utf-8").rstrip("\x00 \t\r\n"))

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


def hash_range(fh, offset: int, length: int) -> str:
    h = hashlib.sha256()
    fh.seek(offset)
    remaining = length
    while remaining:
        chunk = fh.read(min(1024 * 1024, remaining))
        if not chunk:
            raise SystemExit("Unexpected EOF while hashing GLB bufferView.")
        h.update(chunk)
        remaining -= len(chunk)
    return h.hexdigest()


def material_fingerprint(materials, material_id):
    if material_id is None:
        return None
    if material_id < 0 or material_id >= len(materials):
        raise SystemExit(f"Invalid material index {material_id}.")
    payload = json.dumps(materials[material_id], sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def accessor_signature(accessors, buffer_view_hashes, accessor_id):
    if accessor_id is None:
        return None
    if accessor_id < 0 or accessor_id >= len(accessors):
        raise SystemExit(f"Invalid accessor index {accessor_id}.")
    acc = accessors[accessor_id]
    sparse = acc.get("sparse")
    if sparse:
        raise SystemExit("Sparse accessors are not supported by exact dedupe analysis.")

    view_id = acc.get("bufferView")
    return {
        "bufferViewHash": buffer_view_hashes.get(view_id) if view_id is not None else None,
        "byteOffset": int(acc.get("byteOffset", 0) or 0),
        "componentType": acc.get("componentType"),
        "count": int(acc.get("count", 0) or 0),
        "type": acc.get("type"),
        "normalized": bool(acc.get("normalized", False)),
        "min": acc.get("min"),
        "max": acc.get("max"),
    }


def mesh_signature(doc, mesh_id, buffer_view_hashes):
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    materials = doc.get("materials", [])
    if mesh_id < 0 or mesh_id >= len(meshes):
        raise SystemExit(f"Invalid mesh index {mesh_id}.")

    primitive_sigs = []
    for prim in meshes[mesh_id].get("primitives", []):
        attrs = prim.get("attributes") or {}
        primitive_sigs.append({
            "mode": prim.get("mode", 4),
            "attributes": {
                semantic: accessor_signature(accessors, buffer_view_hashes, accessor_id)
                for semantic, accessor_id in sorted(attrs.items())
            },
            "indices": accessor_signature(accessors, buffer_view_hashes, prim.get("indices")),
            "material": material_fingerprint(materials, prim.get("material")),
            "targets": [
                {
                    semantic: accessor_signature(accessors, buffer_view_hashes, accessor_id)
                    for semantic, accessor_id in sorted((target or {}).items())
                }
                for target in (prim.get("targets") or [])
            ],
        })

    payload = json.dumps(primitive_sigs, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def mesh_referenced_views(doc, mesh_id):
    meshes = doc.get("meshes", [])
    accessors = doc.get("accessors", [])
    result = set()

    def add_accessor(accessor_id):
        if accessor_id is None:
            return
        if accessor_id < 0 or accessor_id >= len(accessors):
            raise SystemExit(f"Invalid accessor index {accessor_id}.")
        acc = accessors[accessor_id]
        if acc.get("bufferView") is not None:
            result.add(acc["bufferView"])
        if acc.get("sparse"):
            raise SystemExit("Sparse accessors are not supported by exact dedupe analysis.")

    for prim in meshes[mesh_id].get("primitives", []):
        for accessor_id in (prim.get("attributes") or {}).values():
            add_accessor(accessor_id)
        add_accessor(prim.get("indices"))
        for target in prim.get("targets") or []:
            for accessor_id in (target or {}).values():
                add_accessor(accessor_id)

    return result


def main() -> int:
    ap = argparse.ArgumentParser(description="Exact duplicate mesh analyzer for Sound Club GLB.")
    ap.add_argument("glb", type=Path)
    ap.add_argument("--json", dest="json_out", type=Path, required=True)
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"GLB not found: {args.glb}")

    doc, layout = read_glb(args.glb)
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    buffer_views = doc.get("bufferViews", [])

    if doc.get("animations"):
        raise SystemExit("Exact dedupe analysis blocked: animations are present.")
    if doc.get("skins"):
        raise SystemExit("Exact dedupe analysis blocked: skins are present.")

    print(f"Hashing {len(buffer_views)} bufferViews...")
    buffer_view_hashes = {}
    with args.glb.open("rb") as fh:
        ordered = sorted(
            range(len(buffer_views)),
            key=lambda vid: int(buffer_views[vid].get("byteOffset", 0) or 0),
        )
        for pos, vid in enumerate(ordered, start=1):
            view = buffer_views[vid]
            if int(view.get("buffer", 0) or 0) != 0:
                raise SystemExit("Only single-buffer GLBs are supported.")
            offset = layout["binOffset"] + int(view.get("byteOffset", 0) or 0)
            length = int(view.get("byteLength", 0) or 0)
            buffer_view_hashes[vid] = hash_range(fh, offset, length)
            if pos % 25000 == 0:
                print(f"  hashed {pos}/{len(ordered)} bufferViews")

    mesh_to_nodes = defaultdict(list)
    for node_index, node in enumerate(nodes):
        mesh_id = node.get("mesh")
        if mesh_id is not None:
            mesh_to_nodes[mesh_id].append(node_index)

    print(f"Fingerprinting {len(meshes)} meshes...")
    sig_to_meshes = defaultdict(list)
    mesh_views = {}
    for mesh_id in range(len(meshes)):
        sig = mesh_signature(doc, mesh_id, buffer_view_hashes)
        sig_to_meshes[sig].append(mesh_id)
        mesh_views[mesh_id] = mesh_referenced_views(doc, mesh_id)
        if (mesh_id + 1) % 25000 == 0:
            print(f"  fingerprinted {mesh_id + 1}/{len(meshes)} meshes")

    duplicate_sets = []
    estimated_duplicate_bytes = 0
    duplicate_mesh_count = 0

    for sig, mesh_ids in sig_to_meshes.items():
        if len(mesh_ids) < 2:
            continue

        per_mesh_bytes = []
        for mesh_id in mesh_ids:
            referenced = sum(
                int(buffer_views[vid].get("byteLength", 0) or 0)
                for vid in mesh_views[mesh_id]
            )
            per_mesh_bytes.append(referenced)

        recoverable = sum(per_mesh_bytes[1:])
        estimated_duplicate_bytes += recoverable
        duplicate_mesh_count += len(mesh_ids) - 1

        sample_nodes = []
        sample_groups = []
        for mesh_id in mesh_ids[:10]:
            for node_index in mesh_to_nodes.get(mesh_id, [])[:2]:
                name = nodes[node_index].get("name", "")
                sample_nodes.append(name)
                sample_groups.append(top_level_group(name))

        duplicate_sets.append({
            "fingerprint": sig,
            "meshCount": len(mesh_ids),
            "duplicateMeshCount": len(mesh_ids) - 1,
            "representativeMesh": mesh_ids[0],
            "estimatedRecoverableBytes": recoverable,
            "estimatedRecoverableMiB": recoverable / (1024.0 * 1024.0),
            "sampleMeshes": mesh_ids[:10],
            "sampleNodeNames": sample_nodes[:10],
            "sampleTopLevelGroups": sample_groups[:10],
        })

    duplicate_sets.sort(key=lambda row: row["estimatedRecoverableBytes"], reverse=True)

    result = {
        "schemaVersion": 1,
        "projectId": "SOUND_CLUB_CDM",
        "mode": "EXACT_DUPLICATE_ANALYSIS_ONLY",
        "source": {
            "path": str(args.glb),
            "fileBytes": args.glb.stat().st_size,
            "jsonChunkBytes": layout["jsonLength"],
            "binBytes": layout["binLength"],
            "nodes": len(nodes),
            "meshes": len(meshes),
            "bufferViews": len(buffer_views),
        },
        "summary": {
            "duplicateSetCount": len(duplicate_sets),
            "duplicateMeshCountBeyondRepresentatives": duplicate_mesh_count,
            "estimatedRecoverableDuplicateBufferBytes": estimated_duplicate_bytes,
            "estimatedRecoverableDuplicateBufferMiB": estimated_duplicate_bytes / (1024.0 * 1024.0),
            "estimatedBinReductionPercent": (
                estimated_duplicate_bytes / layout["binLength"] * 100.0
                if layout["binLength"] else 0.0
            ),
            "note": (
                "Estimate assumes duplicate meshes can share one representative geometry. "
                "It does not yet account for bufferViews shared by unrelated meshes; build step must verify exact ownership."
            ),
        },
        "topDuplicateSets": duplicate_sets[:100],
        "policy": {
            "losslessIntent": True,
            "dryRunOnly": True,
            "sourceCandidateModified": False,
            "privateSketchUpMasterModified": False,
            "automaticMutationAuthorized": False,
        },
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps({
        "summary": result["summary"],
        "top20DuplicateSets": [
            {
                "meshCount": row["meshCount"],
                "estimatedRecoverableMiB": row["estimatedRecoverableMiB"],
                "sampleTopLevelGroups": row["sampleTopLevelGroups"][:5],
                "sampleNodeNames": row["sampleNodeNames"][:3],
            }
            for row in duplicate_sets[:20]
        ],
        "json": str(args.json_out),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
