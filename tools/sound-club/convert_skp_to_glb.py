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
    ap.add_argument("--source-ingest", type=Path, help="source-ingest.json with registered master hash")
    ap.add_argument("--public-output", type=Path, help="Promoted public GLB path")
    ap.add_argument("--promote-manifest", action="store_true",
                    help="Explicitly promote candidate after human QA")
    ap.add_argument("--no-textures", action="store_true",
                    help="Compatibility flag: keep textures disabled")
    ap.add_argument("--with-textures", action="store_true",
                    help="Attempt to embed textures. Not recommended for large SKP masters.")
    ap.add_argument("--max-extent-m", type=float, default=500.0,
                    help="Maximum accepted X/Z venue extent before promotion is blocked")
    ap.add_argument("--max-height-m", type=float, default=150.0,
                    help="Maximum accepted Y venue extent before promotion is blocked")
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

    registered_source = None
    source_match = None
    if args.source_ingest:
        source_ingest_path = args.source_ingest.resolve()
        if not source_ingest_path.exists():
            raise SystemExit(f"Source ingest manifest not found: {source_ingest_path}")
        source_ingest = json.loads(source_ingest_path.read_text(encoding="utf-8"))
        registered_source = source_ingest.get("skp") or {}
        expected_sha = (registered_source.get("sha256") or "").lower()
        expected_size = registered_source.get("sizeBytes")
        source_match = {
            "expectedSha256": expected_sha or None,
            "actualSha256": source_sha,
            "sha256Match": bool(expected_sha and source_sha.lower() == expected_sha),
            "expectedSizeBytes": expected_size,
            "actualSizeBytes": source_bytes,
            "sizeMatch": (expected_size == source_bytes) if expected_size is not None else None,
        }

    skp = SkpFile.open(skp_path)
    model = skp.parse()

    embed_textures = bool(args.with_textures and not args.no_textures)
    texture_fallback = False

    try:
        glb.export(
            skp,
            str(args.output),
            coordinate_system="y-up",
            units="mm",
            textures=embed_textures,
        )
    except MemoryError:
        if not embed_textures:
            raise
        texture_fallback = True
        print(
            "WARNING: textured GLB export exhausted memory. "
            "Retrying geometry/material-colour export without embedded textures.",
            file=sys.stderr,
        )
        if args.output.exists():
            args.output.unlink()
        glb.export(
            skp,
            str(args.output),
            coordinate_system="y-up",
            units="mm",
            textures=False,
        )
        embed_textures = False

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
    extent_mm = None
    extent_m = None
    bounds_plausible = False
    if bounds is not None:
        extent_mm = (bounds[1] - bounds[0]).tolist()
        extent_m = [float(v) / 1000.0 for v in extent_mm]
        bounds_plausible = (
            extent_m[0] <= args.max_extent_m
            and extent_m[2] <= args.max_extent_m
            and extent_m[1] <= args.max_height_m
        )

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
            "texturesEmbedded": embed_textures,
            "textureFallbackAfterMemoryError": texture_fallback,
            "geometryCount": geometry_count,
            "bounds": bounds_list,
            "extentMm": extent_mm,
            "extentM": extent_m,
            "boundsGate": {
                "maxHorizontalExtentM": args.max_extent_m,
                "maxHeightM": args.max_height_m,
                "plausibleVenueBounds": bounds_plausible,
            },
            "classification": "CANDIDATE_VERIFIED_GEOMETRY" if bounds_plausible else "CANDIDATE_REQUIRES_GEOMETRY_CLEANUP",
        },
        "qa": {
            "rawSkpPublished": False,
            "humanVisualReviewRequired": True,
            "dwgOriginAlignmentRequired": True,
            "registeredMasterCheck": source_match,
            "boundsPlausible": bounds_plausible,
            "publicPromotion": bool(args.promote_manifest and bounds_plausible),
        },
    }
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if output_bytes > 95 * 1024 * 1024:
        print("WARNING: candidate exceeds 95 MiB; do not commit before optimization.", file=sys.stderr)
    elif output_bytes > 25 * 1024 * 1024:
        print("WARNING: candidate exceeds 25 MiB; web optimization is recommended.", file=sys.stderr)

    if args.promote_manifest:
        if not args.manifest or not args.public_output or not args.source_ingest:
            raise SystemExit("--promote-manifest requires --manifest, --source-ingest and --public-output")
        if source_match and not source_match.get("sha256Match"):
            raise SystemExit(
                "PROMOTION BLOCKED: selected SKP does not match the registered private master. "
                f"Expected SHA256 {source_match.get('expectedSha256')}, got {source_sha}. "
                "Review the candidate and choose the correct SKP before changing the registered master."
            )
        if not bounds_plausible:
            raise SystemExit(
                "PROMOTION BLOCKED: GLB bounds are implausible for the venue. "
                f"Extent (m) = {extent_m}. Remove/isolate geolocation, terrain or remote geometry "
                "and regenerate the candidate before promotion."
            )
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
        if source_match and not source_match.get("sha256Match"):
            print(
                "WARNING: selected SKP does NOT match the registered master "
                f"({source_match.get('expectedSha256')}). Candidate kept for comparison only.",
                file=sys.stderr,
            )
        if not bounds_plausible:
            print(
                "WARNING: GLB bounds are implausible for this venue. "
                f"Extent (m) = {extent_m}. Candidate requires geometry cleanup before promotion.",
                file=sys.stderr,
            )

    print(f"GLB: {args.output}")
    print(f"REPORT: {args.report}")
    print(f"SOURCE SHA256: {source_sha}")
    print(f"GLB SHA256: {output_sha}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
