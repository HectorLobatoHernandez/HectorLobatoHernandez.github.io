# Project Atlas — source media pipeline

This pipeline exists to keep the public portfolio tied to the real project archive.

## Policy

- No generated project imagery.
- No invented room geometry.
- Images are only resized/transcoded derivatives of supplied project renders, photographs or drawings.
- Videos are only technical transcodes of supplied project masters.
- Every derivative records the source path and SHA-256 in `assets/project-atlas/manifest.json`.
- Private identities, credentials, KNX Secure material and commercial files are not copied by this pipeline.

## Run

```powershell
python -m pip install pillow
.	oolsproject-atlasINGEST_SOURCE_MEDIA.ps1 -SourceDir "D:\PROJECT_ATLAS_SOURCES"
```

FFmpeg must be available in PATH for video derivatives. Use `-SkipVideo` to build only image derivatives.

The source folder can contain the original ZIP files and loose MP4 files; the script searches recursively by the exact source names defined in `build_source_media.py`.

The public pages must never claim a derived render is a photograph or a predicted acoustic value is a measured result.
