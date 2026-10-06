# GAZA GIS / Digital Twin skill stack

Selected 2026-10-06 after repository/web review.

## Install first
1. **OpenMapStack skills** — open-first GIS workflow, provenance, reproducible projects, discovery and spatial SQL.
   - https://github.com/jaakla/openmapstack-skills
2. **Cesium AI Integrations** — official Cesium reference skills/MCP patterns for geospatially aware 3D.
   - https://github.com/CesiumGS/cesium-ai-integrations
3. **GIS Agent Skills** — GIS QA, project audit, GeoParquet/KML and micro-app UX patterns.
   - https://github.com/danmaps/gis-agent-skills

## Architecture references, not installed as trusted skills
- https://github.com/webtrackerxy/3d-city-million-cars — useful MapLibre + Three.js vehicle LOD/road-following architecture.
- https://github.com/sparkgeo/geo-mcp-servers — catalog for later MCP selection; review each server before install.
- https://github.com/gaopengbin/cesium-mcp — Cesium MCP candidate if/when the territory layer migrates to Cesium.

## Why
The existing Three.js/Blender stack is good for plant detail. The missing capability is reproducible GIS: authoritative road geometry, CRS discipline, spatial QA, provenance and future 3D geospatial context.

## Rule
Do not add a new MCP/server merely because it exists. Pin versions, inspect source/license, keep credentials local and require a concrete GAZA use case.
