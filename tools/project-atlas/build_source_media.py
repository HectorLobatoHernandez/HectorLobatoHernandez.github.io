#!/usr/bin/env python3
"""
Build public-safe Project Atlas media strictly from supplied project sources.

Rules:
- Never generate synthetic project imagery.
- Never alter source files.
- Every public derivative records source path + sha256.
- Renders stay RENDERED, photographs stay FIELD_ARCHIVE, plans stay SOURCE_DRAWING.
- Videos are transcoded, not creatively edited.
"""
from __future__ import annotations
import argparse, hashlib, io, json, os, shutil, subprocess, tempfile, zipfile
from pathlib import Path
from PIL import Image, ImageOps

PROJECTS = {
    "mar-salada": {
        "loose_videos": [
            ("CLUB_DEL_MAR_VIDEO_DOSSIER_01.mp4", "overview-720p.mp4", "MASTER_VIDEO"),
            ("MUEBLE SUBS.mp4", "subwoofer-furniture-720p.mp4", "MASTER_VIDEO"),
        ],
        "posters_from_video": [
            ("CLUB_DEL_MAR_VIDEO_DOSSIER_01.mp4", "overview-15s.webp", 15.0),
            ("CLUB_DEL_MAR_VIDEO_DOSSIER_01.mp4", "overview-58s.webp", 58.0),
            ("CLUB_DEL_MAR_VIDEO_DOSSIER_01.mp4", "overview-126s.webp", 126.0),
        ],
    },
    "casa-alain": {
        "zip_images": [
            ("RENDERS FINALES.zip", "RENDERS FINALES/01.png", "render-01.webp", "RENDERED"),
            ("RENDERS.zip", "acustica finalizada/10.png", "acoustic-finish-10.webp", "PROJECT_ARCHIVE"),
            ("RENDERS.zip", "PLANOS/I_06_ELECTRICIDAD_CASA ALAIN_page-0001.jpg", "electrical-plan.webp", "SOURCE_DRAWING"),
        ],
        "zip_videos": [
            ("RENDERS FINALES.zip", "VIDEO PAD/PROYECTO VIDEO ACUSTICA.mp4", "project-video-720p.mp4", "MASTER_VIDEO"),
        ],
    },
    "can-furnet": {
        "zip_images": [
            ("CAN FURNET CLUB.zip", "CAN FURNET CLUB/REMODELACION FINAL/RENDER 3.png", "final-render-03.webp", "RENDERED"),
            ("CAN FURNET CLUB.zip", "CAN FURNET CLUB/REMODELACION FINAL/RENDER 7.png", "final-render-07.webp", "RENDERED"),
            ("CAN FURNET CLUB.zip", "CAN FURNET CLUB/Nueva carpeta/LAYER 3.png", "construction-layer-03.webp", "SOURCE_REFERENCE"),
        ],
    },
    "playa-soleil": {
        "zip_images": [
            ("Planos.zip", "CLUB/FOTOS ZONA CLUB CON L-Acoustics/WhatsApp Image 2024-09-19 at 23.39.13 (1).jpeg", "rack-field.webp", "FIELD_ARCHIVE"),
            ("Planos.zip", "CLUB/FOTOS ZONA CLUB CON L-Acoustics/WhatsApp Image 2024-09-19 at 23.39.13 (7).jpeg", "club-field.webp", "FIELD_ARCHIVE"),
            ("Planos.zip", "CLUB/Renders/vista lateral hacie DJ.png", "dj-render.webp", "RENDERED"),
        ],
    },
    "studio-canada": {
        "zip_images": [
            ("PROYECTO FINAL.zip", "SKETCHUP/001.png", "studio-render-01.webp", "RENDERED"),
            ("PROYECTO FINAL.zip", "segunda fase/08.png", "phase2-08.webp", "RENDERED"),
            ("PROYECTO FINAL.zip", "Imagen de WhatsApp 2025-04-25 a las 21.20.31_28b47200.jpg", "field-reference.webp", "FIELD_ARCHIVE"),
        ],
    },
    "studio-unders": {
        "zip_images": [
            ("UNDERS (ESTUDIO PROD).zip", "UNDERS (ESTUDIO PROD)/imagenes/Imagenes estudio antiguas/WhatsApp Image 2024-09-19 at 23.40.58 (1).jpeg", "existing-room.webp", "FIELD_ARCHIVE"),
            ("VRAY RENDERS.zip", "VRAY RENDERS/005.png", "vray-005.webp", "RENDERED"),
            ("UNDERS (ESTUDIO PROD).zip", "UNDERS (ESTUDIO PROD)/renders ANTIGUO UNDERS/10.png", "design-10.webp", "RENDERED"),
        ],
    },
    "studio-italy": {
        "zip_images": [
            ("ACUSTICA ITALIANA.zip", "ACUSTICA ITALIANA/RENDERS/1.png", "render-01.webp", "RENDERED"),
            ("ACUSTICA ITALIANA.zip", "ACUSTICA ITALIANA/RENDERS/12.png", "render-12.webp", "RENDERED"),
            ("ACUSTICA ITALIANA.zip", "ACUSTICA ITALIANA/RENDERS/24.png", "render-24.webp", "RENDERED"),
        ],
        "zip_videos": [
            ("ACUSTICA ITALIANA.zip", "ACUSTICA ITALIANA/VIDEO-2025-06-03-20-15-54.mp4", "project-video-720p.mp4", "MASTER_VIDEO"),
        ],
    },
}

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> str:
    h=hashlib.sha256()
    with path.open("rb") as f:
        for b in iter(lambda:f.read(1024*1024), b""): h.update(b)
    return h.hexdigest()

def fit_webp(data: bytes, target: Path, max_size=(1600,1000), quality=74):
    im=Image.open(io.BytesIO(data)).convert("RGB")
    im.thumbnail(max_size, Image.Resampling.LANCZOS)
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target, "WEBP", quality=quality, method=6)

def require(tool: str):
    if shutil.which(tool) is None:
        raise SystemExit(f"Missing required tool: {tool}")

def ffmpeg_video(src: Path, dst: Path):
    require("ffmpeg")
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg","-y","-i",str(src),
        "-vf","scale='min(1280,iw)':-2:flags=lanczos",
        "-c:v","libx264","-preset","slow","-crf","25",
        "-c:a","aac","-b:a","128k","-movflags","+faststart",str(dst)
    ],check=True)

def ffmpeg_poster(src: Path, dst: Path, sec: float):
    require("ffmpeg")
    dst.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        jpg=Path(td)/"frame.jpg"
        subprocess.run(["ffmpeg","-y","-ss",str(sec),"-i",str(src),"-frames:v","1","-q:v","2",str(jpg)],check=True)
        fit_webp(jpg.read_bytes(),dst,(1600,1000),76)

def find_loose(source_dir: Path, name: str) -> Path:
    candidates=list(source_dir.rglob(name))
    if not candidates: raise FileNotFoundError(name)
    return candidates[0]

def zip_member(source_dir: Path, zip_name: str, member: str) -> tuple[bytes,Path]:
    zp=find_loose(source_dir,zip_name)
    with zipfile.ZipFile(zp) as z:
        return z.read(member), zp

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("source_dir",type=Path,help="Folder containing the original ZIP/MP4 source files")
    ap.add_argument("--repo",type=Path,default=Path(__file__).resolve().parents[2])
    ap.add_argument("--skip-video",action="store_true")
    args=ap.parse_args()
    out=args.repo/"assets"/"project-atlas"
    manifest={"schemaVersion":1,"policy":"SOURCE_DERIVATIVES_ONLY_NO_GENERATED_PROJECT_IMAGERY","projects":{}}

    for project,cfg in PROJECTS.items():
        entries=[]; project_out=out/project; project_out.mkdir(parents=True,exist_ok=True)
        for zip_name,member,dst_name,classification in cfg.get("zip_images",[]):
            data,zp=zip_member(args.source_dir,zip_name,member)
            dst=project_out/dst_name; fit_webp(data,dst)
            entries.append({"kind":"image","classification":classification,"sourceContainer":zip_name,"source":member,"sourceSha256":sha256_bytes(data),"derived":str(dst.relative_to(args.repo)).replace("\\\\","/"),"derivedSha256":sha256_file(dst)})
        for name,dst_name,classification in cfg.get("loose_videos",[]):
            src=find_loose(args.source_dir,name)
            if args.skip_video:
                entries.append({"kind":"video","classification":classification,"source":name,"sourceSha256":sha256_file(src),"derived":None})
            else:
                dst=project_out/dst_name; ffmpeg_video(src,dst)
                entries.append({"kind":"video","classification":classification,"source":name,"sourceSha256":sha256_file(src),"derived":str(dst.relative_to(args.repo)).replace("\\\\","/"),"derivedSha256":sha256_file(dst)})
        for zip_name,member,dst_name,classification in cfg.get("zip_videos",[]):
            data,zp=zip_member(args.source_dir,zip_name,member)
            with tempfile.TemporaryDirectory() as td:
                src=Path(td)/Path(member).name; src.write_bytes(data)
                if args.skip_video:
                    derived=None; dh=None
                else:
                    dst=project_out/dst_name; ffmpeg_video(src,dst); derived=str(dst.relative_to(args.repo)).replace("\\\\","/"); dh=sha256_file(dst)
            entries.append({"kind":"video","classification":classification,"sourceContainer":zip_name,"source":member,"sourceSha256":sha256_bytes(data),"derived":derived,**({"derivedSha256":dh} if dh else {})})
        for name,dst_name,sec in cfg.get("posters_from_video",[]):
            src=find_loose(args.source_dir,name); dst=project_out/dst_name; ffmpeg_poster(src,dst,sec)
            entries.append({"kind":"poster","classification":"VIDEO_FRAME_DERIVATIVE","source":name,"sourceSha256":sha256_file(src),"timeSeconds":sec,"derived":str(dst.relative_to(args.repo)).replace("\\\\","/"),"derivedSha256":sha256_file(dst)})
        manifest["projects"][project]={"items":entries}

    manifest_path=out/"manifest.json"
    manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False),encoding="utf-8")
    print(f"Wrote {manifest_path}")
    for project,p in manifest["projects"].items():
        print(project, len(p["items"]), "derived items")

if __name__=="__main__": main()
