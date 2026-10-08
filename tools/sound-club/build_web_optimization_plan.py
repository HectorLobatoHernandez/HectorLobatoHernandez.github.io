#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip()).upper()


RULES = [
    {
        "match": lambda g: g.startswith("TECHO"),
        "action": "KEEP_MERGE_ARCHITECTURE",
        "priority": "P1",
        "reason": "Architectural ceiling hierarchy. Preserve geometry and spatial envelope; merge/simplify only in the derived web GLB.",
    },
    {
        "match": lambda g: g.startswith("MUROS") or g.startswith("COLUMNAS"),
        "action": "KEEP_ARCHITECTURE",
        "priority": "P1",
        "reason": "Primary architectural geometry. Preserve in web derivative.",
    },
    {
        "match": lambda g: g == "CORTINAS",
        "action": "KEEP_SIMPLIFY_ACOUSTIC",
        "priority": "P1",
        "reason": "Acoustic treatment is part of the technical narrative. Preserve placement and silhouette; reduce mesh density.",
    },
    {
        "match": lambda g: g.startswith("MESA_ACSUTICA") or g.startswith("MESA_ACUSTICA"),
        "action": "KEEP_SIMPLIFY_ACOUSTIC",
        "priority": "P1",
        "reason": "Project-specific acoustic/fabrication element. Preserve intent and placement; simplify repeated detail.",
    },
    {
        "match": lambda g: g.startswith("THREADED_ROD") or g in {"THRE_WRB", "THRE_RAILS"},
        "action": "INSTANCE_SIMPLIFY_HARDWARE",
        "priority": "P1",
        "reason": "Engineering hardware is highly repeated. Preserve count/routes where technically relevant; replace repeated detailed geometry with instances or simplified rods.",
    },
    {
        "match": lambda g: g.startswith("GASKET"),
        "action": "INSTANCE_SIMPLIFY_HARDWARE",
        "priority": "P2",
        "reason": "Small repeated hardware. Preserve only where useful for technical close-ups; otherwise instance/simplify.",
    },
    {
        "match": lambda g: "VEGET" in g or "NEPHROLEPIS" in g,
        "action": "PROXY_OR_REMOVE_DECOR",
        "priority": "P1",
        "reason": "Vegetation is presentation entourage, not authoritative technical geometry. Use low-poly proxy or omit from technical web GLB.",
    },
    {
        "match": lambda g: "SOFA" in g,
        "action": "PROXY_FURNITURE",
        "priority": "P1",
        "reason": "Furniture is useful for spatial reading but not at fabrication-level detail. Replace with low-poly proxy.",
    },
    {
        "match": lambda g: "WEAVED_LAMP_BAMBOO" in g or "LUMINARIA-DIARA" in g,
        "action": "INSTANCE_PROXY_LIGHTING",
        "priority": "P1",
        "reason": "Design-significant pendants. Preserve positions/count and appearance silhouette; instance or proxy repeated meshes.",
    },
    {
        "match": lambda g: g == "FOCOS" or g.startswith("RAIL_") or g == "RAILS",
        "action": "KEEP_PROXY_LIGHTING",
        "priority": "P1",
        "reason": "Lighting-system location matters. Preserve route/fixture positions while simplifying fixture detail.",
    },
    {
        "match": lambda g: "DRILL_PRESS_CLAMP" in g,
        "action": "REMOVE_OR_PROXY_MINOR_HARDWARE",
        "priority": "P1",
        "reason": "Imported clamp/bolt detail is disproportionately heavy for the public technical model.",
    },
    {
        "match": lambda g: "TECHNICS_SL-1200" in g,
        "action": "KEEP_PROXY_DJ_EQUIPMENT",
        "priority": "P2",
        "reason": "DJ equipment supports the project narrative. Preserve recognizable proxy geometry rather than full imported detail.",
    },
    {
        "match": lambda g: g.startswith("DJ"),
        "action": "KEEP_TECHNICAL",
        "priority": "P1",
        "reason": "DJ/fabrication geometry is project-specific technical content.",
    },
    {
        "match": lambda g: g in {"UNNAMED", "UNTITLED"},
        "action": "REVIEW_MANUALLY",
        "priority": "P2",
        "reason": "Unnamed geometry cannot be safely modified automatically.",
    },
]


def classify(group: str):
    g = norm(group)
    for rule in RULES:
        if rule["match"](g):
            return rule["action"], rule["priority"], rule["reason"]
    return "REVIEW_MANUALLY", "P3", "No high-confidence optimization rule assigned."


def main() -> int:
    ap = argparse.ArgumentParser(description="Build a non-destructive Sound Club web-geometry optimization plan.")
    ap.add_argument("analysis", type=Path)
    ap.add_argument("--json", dest="json_out", type=Path, required=True)
    ap.add_argument("--csv", dest="csv_out", type=Path, required=True)
    args = ap.parse_args()

    if not args.analysis.exists():
        raise SystemExit(f"Analysis JSON not found: {args.analysis}")

    analysis = json.loads(args.analysis.read_text(encoding="utf-8"))
    groups = analysis.get("topLevelGroupSummaryByEstimatedReferencedBytes") or []
    if not groups:
        raise SystemExit("Analysis does not contain topLevelGroupSummaryByEstimatedReferencedBytes.")

    rows = []
    for item in groups:
        group = item.get("topLevelGroup", "UNNAMED")
        action, priority, reason = classify(group)
        rows.append({
            "topLevelGroup": group,
            "instanceCount": int(item.get("instanceCount", 0) or 0),
            "estimatedReferencedBufferMiB": float(item.get("estimatedReferencedBufferMiB", 0.0) or 0.0),
            "vertexCount": int(item.get("vertexCount", 0) or 0),
            "triangleCount": int(item.get("triangleCount", 0) or 0),
            "action": action,
            "priority": priority,
            "reason": reason,
            "automaticMutationAllowed": False,
        })

    rows.sort(key=lambda row: (row["priority"], -row["estimatedReferencedBufferMiB"]))

    action_summary = {}
    for row in rows:
        s = action_summary.setdefault(row["action"], {
            "groups": 0,
            "instances": 0,
            "vertices": 0,
            "triangles": 0,
            "estimatedReferencedBufferMiB": 0.0,
        })
        s["groups"] += 1
        s["instances"] += row["instanceCount"]
        s["vertices"] += row["vertexCount"]
        s["triangles"] += row["triangleCount"]
        s["estimatedReferencedBufferMiB"] += row["estimatedReferencedBufferMiB"]

    result = {
        "schemaVersion": 1,
        "projectId": "SOUND_CLUB_CDM",
        "sourceAnalysis": str(args.analysis),
        "policy": {
            "privateSketchUpMasterModified": False,
            "candidateGlbModified": False,
            "automaticMutationAllowed": False,
            "purpose": "Dry-run optimization plan for a future derived web GLB only.",
        },
        "webTargets": {
            "maxGlbMiB": 95,
            "preferredGlbMiB": 50,
            "maxGeometryCount": 20000,
            "preferredTriangleCount": 3000000,
        },
        "actionSummary": action_summary,
        "groups": rows,
        "nextStep": (
            "Review P1 groups, then build a separate venue-web-v1 derivative. "
            "Do not overwrite venue-master.glb and do not run -Promote."
        ),
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.csv_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    fields = [
        "priority", "topLevelGroup", "action", "instanceCount",
        "estimatedReferencedBufferMiB", "vertexCount", "triangleCount",
        "automaticMutationAllowed", "reason"
    ]
    with args.csv_out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row[key] for key in fields})

    print(json.dumps({
        "policy": result["policy"],
        "webTargets": result["webTargets"],
        "topP1Groups": [
            {
                "group": row["topLevelGroup"],
                "action": row["action"],
                "instances": row["instanceCount"],
                "triangles": row["triangleCount"],
                "estimatedReferencedBufferMiB": row["estimatedReferencedBufferMiB"],
            }
            for row in rows if row["priority"] == "P1"
        ][:20],
        "json": str(args.json_out),
        "csv": str(args.csv_out),
    }, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
