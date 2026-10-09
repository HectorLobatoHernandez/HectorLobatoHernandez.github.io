#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

import build_web_v1_lossless as v1


def collect_world_matrices(doc):
    nodes = doc.get("nodes", [])
    scenes = doc.get("scenes", [])
    world = {}
    reachable = set()
    visiting = set()

    if scenes:
        roots_by_scene = [scene.get("nodes", []) for scene in scenes]
    else:
        roots_by_scene = [list(range(len(nodes)))]

    def matrix_close(a, b, tol=1e-6):
        return all(
            abs(a[r][c] - b[r][c]) <= tol
            for r in range(4)
            for c in range(4)
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
                f"Node {index} is reachable through multiple world transforms."
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


def bbox_center(bounds):
    return [
        (bounds[0][i] + bounds[1][i]) * 0.5
        for i in range(3)
    ]


def bbox_extent(bounds):
    return [
        bounds[1][i] - bounds[0][i]
        for i in range(3)
    ]


def contributor_key(axis, side):
    return f"{side}{'XYZ'[axis]}"


def densest_cells(rows, grid_mm=25000.0, limit=20):
    counts = Counter()
    for row in rows:
        x, _, z = row["centerMm"]
        counts[(math.floor(x / grid_mm), math.floor(z / grid_mm))] += 1

    result = []
    for (cx, cz), count in counts.most_common(limit):
        result.append({
            "cellX": int(cx),
            "cellZ": int(cz),
            "count": count,
            "gridM": grid_mm / 1000.0,
            "centerApproxM": [
                (cx + 0.5) * grid_mm / 1000.0,
                (cz + 0.5) * grid_mm / 1000.0,
            ],
        })
    return result


def best_2x2_seed(rows, grid_mm=25000.0):
    counts = Counter()
    for row in rows:
        x, _, z = row["centerMm"]
        counts[(math.floor(x / grid_mm), math.floor(z / grid_mm))] += 1

    if not counts:
        return None

    cells = set(counts)
    candidates = set()
    for cx, cz in cells:
        for dx in (0, -1):
            for dz in (0, -1):
                candidates.add((cx + dx, cz + dz))

    best = None
    for ax, az in candidates:
        block = [
            (ax, az),
            (ax + 1, az),
            (ax, az + 1),
            (ax + 1, az + 1),
        ]
        score = sum(counts.get(cell, 0) for cell in block)
        if best is None or score > best["count"]:
            best = {
                "anchorCellX": ax,
                "anchorCellZ": az,
                "count": score,
                "cells": [
                    {"cellX": x, "cellZ": z, "count": counts.get((x, z), 0)}
                    for x, z in block
                ],
                "centerM": [
                    (ax + 1.0) * grid_mm / 1000.0,
                    (az + 1.0) * grid_mm / 1000.0,
                ],
            }
    return best


def y_density(rows, grid_mm=10000.0, limit=12):
    counts = Counter()
    for row in rows:
        y = row["centerMm"][1]
        counts[math.floor(y / grid_mm)] += 1

    return [
        {
            "cellY": int(cell),
            "count": count,
            "gridM": grid_mm / 1000.0,
            "centerApproxM": (cell + 0.5) * grid_mm / 1000.0,
        }
        for cell, count in counts.most_common(limit)
    ]


def main() -> int:
    ap = argparse.ArgumentParser(
        description=(
            "Focused V2 bounds analysis: identify the retained nodes/groups "
            "responsible for the oversized Sound Club world bounds."
        )
    )
    ap.add_argument("glb", type=Path)
    ap.add_argument("--json", dest="json_out", type=Path, required=True)
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"V2 GLB not found: {args.glb}")

    doc, layout = v1.read_glb(args.glb)
    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    world, reachable = collect_world_matrices(doc)

    mesh_bounds_cache = {}
    rows = []

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

        bounds = v1.transform_bounds(local_bounds, world[node_id])
        center = bbox_center(bounds)
        extent = bbox_extent(bounds)
        rows.append({
            "nodeId": node_id,
            "meshId": mesh_id,
            "name": node.get("name", ""),
            "group": v1.top_level_group(node.get("name", "")),
            "isProxy": bool((node.get("extras") or {}).get("webProxy")),
            "boundsMm": bounds,
            "centerMm": center,
            "extentMm": extent,
        })

    if not rows:
        raise SystemExit("No reachable mesh nodes found in V2.")

    global_bounds = [
        [
            min(row["boundsMm"][0][axis] for row in rows)
            for axis in range(3)
        ],
        [
            max(row["boundsMm"][1][axis] for row in rows)
            for axis in range(3)
        ],
    ]
    global_extent = bbox_extent(global_bounds)

    extrema = {}
    for axis in range(3):
        min_row = min(rows, key=lambda r: r["boundsMm"][0][axis])
        max_row = max(rows, key=lambda r: r["boundsMm"][1][axis])
        for side, row in (("min", min_row), ("max", max_row)):
            extrema[contributor_key(axis, side)] = {
                "nodeId": row["nodeId"],
                "meshId": row["meshId"],
                "name": row["name"],
                "group": row["group"],
                "isProxy": row["isProxy"],
                "boundM": row["boundsMm"][0 if side == "min" else 1][axis] / 1000.0,
                "centerM": [v / 1000.0 for v in row["centerMm"]],
                "extentM": [v / 1000.0 for v in row["extentMm"]],
                "boundsM": [
                    [v / 1000.0 for v in row["boundsMm"][0]],
                    [v / 1000.0 for v in row["boundsMm"][1]],
                ],
            }

    seed = best_2x2_seed(rows)
    if seed is None:
        raise SystemExit("Unable to calculate dense core seed.")

    core_x, core_z = seed["centerM"]
    # This is deliberately a diagnostic envelope only: 100 m x 100 m,
    # inside the 120 m hard gate, centered on the densest contiguous 2x2 block.
    half_horizontal_m = 50.0
    x_min = (core_x - half_horizontal_m) * 1000.0
    x_max = (core_x + half_horizontal_m) * 1000.0
    z_min = (core_z - half_horizontal_m) * 1000.0
    z_max = (core_z + half_horizontal_m) * 1000.0

    y_cells = y_density(rows)
    core_y = y_cells[0]["centerApproxM"] if y_cells else 0.0
    half_vertical_m = 18.0
    y_min = (core_y - half_vertical_m) * 1000.0
    y_max = (core_y + half_vertical_m) * 1000.0

    outside_center = []
    oversized = []

    group_outside = defaultdict(lambda: {
        "nodes": 0,
        "proxyNodes": 0,
        "minDistanceFromCoreM": None,
        "maxDistanceFromCoreM": 0.0,
        "examples": [],
    })

    for row in rows:
        cx, cy, cz = row["centerMm"]
        outside = not (
            x_min <= cx <= x_max
            and y_min <= cy <= y_max
            and z_min <= cz <= z_max
        )
        dx = cx / 1000.0 - core_x
        dy = cy / 1000.0 - core_y
        dz = cz / 1000.0 - core_z
        distance = math.sqrt(dx * dx + dy * dy + dz * dz)

        if outside:
            item = {
                "nodeId": row["nodeId"],
                "meshId": row["meshId"],
                "name": row["name"],
                "group": row["group"],
                "isProxy": row["isProxy"],
                "distanceFromCoreM": distance,
                "centerM": [v / 1000.0 for v in row["centerMm"]],
                "extentM": [v / 1000.0 for v in row["extentMm"]],
                "boundsM": [
                    [v / 1000.0 for v in row["boundsMm"][0]],
                    [v / 1000.0 for v in row["boundsMm"][1]],
                ],
            }
            outside_center.append(item)

            summary = group_outside[row["group"]]
            summary["nodes"] += 1
            summary["proxyNodes"] += int(row["isProxy"])
            summary["maxDistanceFromCoreM"] = max(
                summary["maxDistanceFromCoreM"], distance
            )
            if summary["minDistanceFromCoreM"] is None:
                summary["minDistanceFromCoreM"] = distance
            else:
                summary["minDistanceFromCoreM"] = min(
                    summary["minDistanceFromCoreM"], distance
                )
            if len(summary["examples"]) < 5:
                summary["examples"].append(item)

        ex, ey, ez = [v / 1000.0 for v in row["extentMm"]]
        if ex > 120.0 or ez > 120.0 or ey > 40.0:
            oversized.append({
                "nodeId": row["nodeId"],
                "meshId": row["meshId"],
                "name": row["name"],
                "group": row["group"],
                "isProxy": row["isProxy"],
                "extentM": [ex, ey, ez],
                "centerM": [v / 1000.0 for v in row["centerMm"]],
                "boundsM": [
                    [v / 1000.0 for v in row["boundsMm"][0]],
                    [v / 1000.0 for v in row["boundsMm"][1]],
                ],
            })

    outside_center.sort(
        key=lambda row: row["distanceFromCoreM"],
        reverse=True,
    )
    oversized.sort(
        key=lambda row: max(
            row["extentM"][0] / 120.0,
            row["extentM"][2] / 120.0,
            row["extentM"][1] / 40.0,
        ),
        reverse=True,
    )

    group_rows = []
    for group, summary in group_outside.items():
        group_rows.append({
            "group": group,
            **summary,
        })
    group_rows.sort(
        key=lambda row: (
            row["nodes"],
            row["maxDistanceFromCoreM"],
        ),
        reverse=True,
    )

    result = {
        "schemaVersion": 1,
        "projectId": "SOUND_CLUB_CDM",
        "mode": "V2_BOUNDS_ISOLATION_ANALYSIS",
        "source": {
            "path": str(args.glb),
            "sizeBytes": args.glb.stat().st_size,
            "jsonChunkBytes": layout["jsonLength"],
            "binBytes": layout["binLength"],
            "nodes": len(nodes),
            "meshes": len(meshes),
            "reachableMeshNodes": len(rows),
        },
        "global": {
            "boundsM": [
                [v / 1000.0 for v in global_bounds[0]],
                [v / 1000.0 for v in global_bounds[1]],
            ],
            "extentM": [v / 1000.0 for v in global_extent],
        },
        "extremaContributors": extrema,
        "density": {
            "densest25mXZCells": densest_cells(rows),
            "densest10mYCells": y_cells,
            "densest2x2Seed": seed,
        },
        "diagnosticCoreEnvelope": {
            "note": (
                "Diagnostic only. No geometry is removed by this script. "
                "Envelope is centered on the densest contiguous 2x2 XZ cells "
                "and densest Y band."
            ),
            "centerM": [core_x, core_y, core_z],
            "boundsM": [
                [x_min / 1000.0, y_min / 1000.0, z_min / 1000.0],
                [x_max / 1000.0, y_max / 1000.0, z_max / 1000.0],
            ],
            "extentM": [
                (x_max - x_min) / 1000.0,
                (y_max - y_min) / 1000.0,
                (z_max - z_min) / 1000.0,
            ],
            "meshNodesInsideByCenter": len(rows) - len(outside_center),
            "meshNodesOutsideByCenter": len(outside_center),
        },
        "topOutlierGroupsByNodeCount": group_rows[:40],
        "topFarthestMeshNodes": outside_center[:80],
        "oversizedMeshNodes": oversized[:80],
        "policy": {
            "analysisOnly": True,
            "sourceModified": False,
            "publicPromotionAllowed": False,
            "nextStep": (
                "Review extrema and outlier groups, then build a separate "
                "venue-only V3 that removes only verified remote/site-context "
                "geometry."
            ),
        },
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(
        json.dumps(result, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(json.dumps({
        "global": result["global"],
        "extremaContributors": result["extremaContributors"],
        "diagnosticCoreEnvelope": result["diagnosticCoreEnvelope"],
        "top15OutlierGroupsByNodeCount": result["topOutlierGroupsByNodeCount"][:15],
        "top20FarthestMeshNodes": result["topFarthestMeshNodes"][:20],
        "oversizedMeshNodes": result["oversizedMeshNodes"][:20],
        "json": str(args.json_out),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
