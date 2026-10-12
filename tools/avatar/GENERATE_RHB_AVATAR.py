import argparse
import io
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image
import rembg

ROOT = Path.home() / "Desktop" / "RHB_TripoSR"
TRIPO_SRC = ROOT / "ComfyUI-Flowty-TripoSR"
sys.path.insert(0, str(TRIPO_SRC))

from tsr.system import TSR

def preprocess_image(image_path: Path, foreground_ratio: float = 0.86) -> Image.Image:
    """Remove background and place subject centered on neutral square background."""
    src = Image.open(image_path).convert("RGBA")

    removed = rembg.remove(src)
    if isinstance(removed, bytes):
        removed = Image.open(io.BytesIO(removed)).convert("RGBA")
    else:
        removed = removed.convert("RGBA")

    alpha = removed.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("Background removal produced an empty image")

    subject = removed.crop(bbox)
    sw, sh = subject.size
    max_dim = max(sw, sh)
    canvas_size = 768
    target = max(32, int(canvas_size * foreground_ratio))
    scale = target / max_dim
    nw = max(1, int(round(sw * scale)))
    nh = max(1, int(round(sh * scale)))
    subject = subject.resize((nw, nh), Image.Resampling.LANCZOS)

    rgba = Image.new("RGBA", (canvas_size, canvas_size), (128, 128, 128, 255))
    x = (canvas_size - nw) // 2
    y = (canvas_size - nh) // 2
    rgba.alpha_composite(subject, (x, y))

    # TripoSR expects RGB with a neutral gray background.
    return rgba.convert("RGB")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--chunk-size", type=int, default=1024)
    ap.add_argument("--mc-resolution", type=int, default=192)
    ap.add_argument("--foreground-ratio", type=float, default=0.86)
    ap.add_argument("--threshold", type=float, default=25.0)
    args = ap.parse_args()

    image_path = Path(args.image).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not image_path.exists():
        raise FileNotFoundError(image_path)

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print("DEVICE=" + device)
    if torch.cuda.is_available():
        print("GPU=" + torch.cuda.get_device_name(0))

    print("Preprocessing reference...")
    image = preprocess_image(image_path, args.foreground_ratio)
    processed = output_path.with_suffix(".input.png")
    image.save(processed)
    print("PROCESSED_INPUT=" + str(processed))

    print("Loading TripoSR model...")
    model = TSR.from_pretrained(
        "stabilityai/TripoSR",
        config_name="config.yaml",
        weight_name="model.ckpt",
    )
    model.renderer.set_chunk_size(args.chunk_size)
    model.to(device)
    model.eval()

    print("Generating 3D...")
    with torch.no_grad():
        scene_codes = model([image], device=device)

    print("Extracting mesh...")
    meshes = model.extract_mesh(
        scene_codes,
        resolution=args.mc_resolution,
        threshold=args.threshold,
    )

    mesh = meshes[0]

    # Convert Flowty/TripoSR orientation to conventional Y-up before export.
    transform = np.array([
        [1.0, 0.0,  0.0, 0.0],
        [0.0, 0.0,  1.0, 0.0],
        [0.0,-1.0,  0.0, 0.0],
        [0.0, 0.0,  0.0, 1.0],
    ])
    mesh.apply_transform(transform)

    mesh.export(str(output_path))

    if not output_path.exists() or output_path.stat().st_size < 1024:
        raise RuntimeError("GLB export was not created correctly")

    print(f"VERTICES={len(mesh.vertices)}")
    print(f"FACES={len(mesh.faces)}")
    print(f"SIZE_MB={output_path.stat().st_size/1024/1024:.2f}")
    print(f"OUTPUT={output_path}")
    print("RHB_TRIPOSR_GENERATION_OK=True")

if __name__ == "__main__":
    main()