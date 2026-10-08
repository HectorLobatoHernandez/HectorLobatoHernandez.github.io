#!/usr/bin/env python3
"""Private SketchUp -> public GLB candidate pipeline for SOUND CLUB.

Raw SKP stays local. This script exports a candidate GLB and a QA report.
Use --promote-manifest only after visually checking the candidate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path


PROJECT_ID = "SOUND_CLUB_CDM"
PUBLIC_SRC = "/assets/models/sound-club/venue-master.glb"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("skp", type=Path, help="Private .skp master")
    ap.add_argument("--output", type=Path, required=True, help="Candidate GLB output")
    ap.add_argument("--report", type=Path, required=True, help="QA report JSON")
    ap.add_argument("--manifest", type=Path, help="model-manifest.json")
    ap.add_argument("--public-output", type=Path, help="Promoted public GLB path")
    ap.add_argument("--promote-manifest", action="store_true",
                    help="Explicitly promote candidate after human QA")
    ap.add_argument("--no-textures", action="store_true")
    args = ap.parse_args()

    skp_path = args.skp.resolve()
    if not skp_path.exists() or skp_path.suffix.lower() != ".skp":
        raise SystemExit(f"Invalid SKP path: {skp_path}")

    try:
        from openskp import SkpFile
        from openskp.export import glb
    except Exception as exc:
        raise SystemExit(
            "OpenSKP is not available. Run the PowerShell wrapper, which installs "
            "openskp==1.3.0 and its dependencies.\n" + str(exc)
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)

    source_sha = sha256_file(skp_path)
    source_bytes = skp_path.stat().st_size

    skp = SkpFile.open(skp_path)
    model = skp.parse()

    glb.export(
        skp,
        str(args.output),
        coordinate_system="y-up",
        units="mm",
        textures=not args.no_textures,
    )

    if not args.output.exists() or args.output.stat().st_size < 20:
        raise SystemExit("GLB export did not produce a valid output file.")
    with args.output.open("rb") as f:
        magic = f.read(4)
    if magic != b"glTF":
        raise SystemExit(f"Unexpected GLB magic: {magic!r}")

    output_sha = sha256_file(args.output)
    output_bytes = args.output.stat().st_size

    # Independent sanity check through trimesh.
    import trimesh
    loaded = trimesh.load(str(args.output), force="scene", process=False)
    geometry_count = len(getattr(loaded, "geometry", {}) or {})
    bounds = getattr(loaded, "bounds", None)
    bounds_list = bounds.tolist() if bounds is not None else None

    report = {
        "schemaVersion": 1,
        "projectId": PROJECT_ID,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "filename": skp_path.name,
            "sha256": source_sha,
            "sizeBytes": source_bytes,
            "sketchUpVersion": getattr(model, "version", None),
            "units": getattr(model, "units", None),
            "definitions": len(getattr(model, "definitions", {}) or {}),
            "layers": len(getattr(model, "layers", []) or []),
            "materials": len(getattr(model, "materials", []) or []),
            "pages": len(getattr(model, "pages", []) or []),
        },
        "candidate": {
            "filename": args.output.name,
            "sha256": output_sha,
            "sizeBytes": output_bytes,
            "glbMagic": "glTF",
            "coordinateSystem": "y-up",
            "numericUnits": "mm",
            "texturesEmbedded": not args.no_textures,
            "geometryCount": geometry_count,
            "bounds": bounds_list,
            "classification": "CANDIDATE_VERIFIED_GEOMETRY",
        },
        "qa": {
            "rawSkpPublished": False,
            "humanVisualReviewRequired": True,
            "dwgOriginAlignmentRequired": True,
            "publicPromotion": bool(args.promote_manifest),
        },
    }
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if output_bytes > 95 * 1024 * 1024:
        print("WARNING: candidate exceeds 95 MiB; do not commit before optimization.", file=sys.stderr)
    elif output_bytes > 25 * 1024 * 1024:
        print("WARNING: candidate exceeds 25 MiB; web optimization is recommended.", file=sys.stderr)

    if args.promote_manifest:
        if not args.manifest or not args.public_output:
            raise SystemExit("--promote-manifest requires --manifest and --public-output")
        manifest_path = args.manifest.resolve()
        public_output = args.public_output.resolve()
        if not manifest_path.exists():
            raise SystemExit(f"Manifest not found: {manifest_path}")

        public_output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(args.output, public_output)

        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        models = manifest.get("models", [])
        master = next((m for m in models if m.get("role") == "ARCHITECTURE_MASTER"), None)
        if master is None:
            raise SystemExit("ARCHITECTURE_MASTER not found in manifest")

        master["status"] = "APPROVED"
        master["src"] = PUBLIC_SRC
        master["classification"] = "VERIFIED_GEOMETRY"
        master["glbSha256"] = sha256_file(public_output)
        master["glbSizeBytes"] = public_output.stat().st_size
        views = master.setdefault("views", {})
        for key in ("design", "render"):
            v = views.setdefault(key, {})
            v["status"] = "READY"
            v["src"] = PUBLIC_SRC
            v["evidence"] = "VERIFIED_GEOMETRY"
        manifest["updatedAt"] = datetime.now(timezone.utc).date().isoformat()
        manifest.setdefault("viewer", {})["geometryStrategy"] = "SINGLE_VERIFIED_GLB_RUNTIME_TREATMENTS"
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"PROMOTED: {public_output}")
        print(f"MANIFEST: {manifest_path}")
    else:
        print("Candidate created. Visual/DWG-origin QA is still required before public promotion.")

    print(f"GLB: {args.output}")
    print(f"REPORT: {args.report}")
    print(f"SOURCE SHA256: {source_sha}")
    print(f"GLB SHA256: {output_sha}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
