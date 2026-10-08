#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import math
from collections import Counter
from pathlib import Path


def _length(value) -> int:
    try:
        return len(value)
    except Exception:
        return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("glb", type=Path)
    ap.add_argument("--json", dest="json_out", type=Path, required=True)
    ap.add_argument("--csv", dest="csv_out", type=Path, required=True)
    ap.add_argument("--grid-m", type=float, default=25.0)
    ap.add_argument("--top", type=int, default=200)
    args = ap.parse_args()

    if not args.glb.exists():
        raise SystemExit(f"GLB not found: {args.glb}")

    import trimesh

    scene = trimesh.load(str(args.glb), force="scene", process=False)
    rows = []
    cells = Counter()

    for name, geom in scene.geometry.items():
        bounds = getattr(geom, "bounds", None)
        if bounds is None:
            continue

        extent_m = (bounds[1] - bounds[0]) / 1000.0
        center_m = ((bounds[1] + bounds[0]) * 0.5) / 1000.0
        diag_m = float(math.sqrt(float((extent_m * extent_m).sum())))

        cell = (
            round(float(center_m[0]) / args.grid_m),
            round(float(center_m[2]) / args.grid_m),
        )
        cells[cell] += 1

        rows.append(
            {
                "name": name,
                "vertices": _length(getattr(geom, "vertices", None)),
                "faces": _length(getattr(geom, "faces", None)),
                "extent_x_m": float(extent_m[0]),
                "extent_y_m": float(extent_m[1]),
                "extent_z_m": float(extent_m[2]),
                "center_x_m": float(center_m[0]),
                "center_y_m": float(center_m[1]),
                "center_z_m": float(center_m[2]),
                "diag_m": diag_m,
            }
        )

    rows.sort(key=lambda row: row["diag_m"], reverse=True)
    top_rows = rows[: args.top]

    global_bounds = getattr(scene, "bounds", None)
    global_extent_m = (
        ((global_bounds[1] - global_bounds[0]) / 1000.0).tolist()
        if global_bounds is not None
        else None
    )

    result = {
        "file": str(args.glb),
        "sizeBytes": args.glb.stat().st_size,
        "geometryCount": len(scene.geometry),
        "globalBounds": global_bounds.tolist() if global_bounds is not None else None,
        "globalExtentM": global_extent_m,
        "topGeometryByDiagonal": top_rows[:50],
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
            "Use the largest-geometry and density lists to identify context, terrain "
            "and remote/outlier objects before destructive optimization."
        ),
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.csv_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2), encoding="utf-8")

    fieldnames = list(top_rows[0].keys()) if top_rows else ["name"]
    with args.csv_out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in top_rows:
            writer.writerow(row)

    print(
        json.dumps(
            {
                "geometryCount": result["geometryCount"],
                "globalExtentM": result["globalExtentM"],
                "densestXZCells": result["densestXZCells"][:10],
                "json": str(args.json_out),
                "csv": str(args.csv_out),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
