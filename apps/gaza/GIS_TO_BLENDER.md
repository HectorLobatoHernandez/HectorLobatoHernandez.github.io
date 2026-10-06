# GAZA GIS → Blender

1. Open `campus-gis.html`.
2. Wait for Overpass to load.
3. Click **Exportar snapshot GeoJSON**.
4. Import with Blender:

```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" --background --python .\tools\blender\import_gaza_geojson.py -- "$env:USERPROFILE\Downloads\gaza-campus-public-snapshot.geojson"
```

The importer creates collection `GAZA_GIS_PUBLIC_CONTEXT`.

- roads: curve geometry;
- OSRM routes: separate red curve context;
- OSM buildings: simple context extrusions;
- industrial polygons: low extrusions;
- local axes: X east, Blender Y north (the browser's Three.js Z-north contract maps to Blender Y);
- provenance is stored on imported objects/collection.

This is **public context geometry, not as-built engineering**. An authorized DWG/DXF/IFC or survey must override it for actual plant geometry.

## Production pipeline

`OSM/OSRM snapshot → Blender context → authorized CAD overlay → modelling → LOD/collision/material bake → GLB → assets/3d/manifest.json → Three.js`.

Do not commit an exported GLB until source/license/provenance and visual QA are recorded.
