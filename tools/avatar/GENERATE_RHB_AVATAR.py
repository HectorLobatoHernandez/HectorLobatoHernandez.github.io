import argparse
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
from tsr.utils import remove_background, resize_foreground

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True)
    ap.add_argument("--output", required=True)
    ap.add_argument("--chunk-size", type=int, default=1024)
    ap.add_argument("--mc-resolution", type=int, default=192)
    ap.add_argument("--foreground-ratio", type=float, default=0.86)
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

    print("Loading TripoSR model...")
    model = TSR.from_pretrained("stabilityai/TripoSR", config_name="config.yaml", weight_name="model.ckpt")
    model.renderer.set_chunk_size(args.chunk_size)
    model.to(device)

    print("Removing background...")
    session = rembg.new_session()
    image = remove_background(Image.open(image_path).convert("RGB"), session)
    image = resize_foreground(image, args.foreground_ratio)

    arr = np.array(image).astype(np.float32) / 255.0
    if arr.shape[-1] == 4:
        arr = arr[:, :, :3] * arr[:, :, 3:4] + (1.0 - arr[:, :, 3:4]) * 0.5
    image = Image.fromarray((arr[:, :, :3] * 255).astype(np.uint8))
    processed = output_path.with_suffix(".input.png")
    image.save(processed)

    print("Generating 3D...")
    with torch.no_grad():
        scene_codes = model([image], device=device)

    print("Extracting mesh...")
    meshes = model.extract_mesh(scene_codes, True, resolution=args.mc_resolution)
    mesh = meshes[0]
    mesh.export(str(output_path))

    if not output_path.exists():
        raise RuntimeError("GLB export was not created")

    print(f"VERTICES={len(mesh.vertices)}")
    print(f"FACES={len(mesh.faces)}")
    print(f"OUTPUT={output_path}")
    print("RHB_TRIPOSR_GENERATION_OK=True")

if __name__ == "__main__":
    main()