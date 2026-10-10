# GAZA OPS · Site Real pipeline v1

**Estado:** importador geoespacial implementado; aún no existe un modelo as-built ni una descarga OSM real incorporada en esta rama.

## Fuentes y límites

- **OSM / Overpass (ODbL):** viales públicos, cruces, huellas de edificios y usos de suelo; atribución obligatoria. Las señales solo pueden ubicarse cuando exista evidencia de ubicación.
- **Catastro / DGC INSPIRE:** parcela y huellas catastrales cuando se descarguen legalmente, con restricciones de uso pertinentes.
- **IGN PNOA:** ortofotografías (COG/WMTS) como referencia de cubiertas, patios y accesos.
- **IGN PNOA LiDAR:** terreno, alturas y vegetación con cobertura disponible; no equivale a un levantamiento de ingeniería.
- **Fotos exteriores verificadas:** geometrías y materiales *inferred*, nunca as-built.
- **Planos y levantamientos autorizados:** única vía para fijar puertas, interior, radios de giro y equipos con exactitud.

## Captura de datos

1. Ancla existente: 41.52355, -5.59993, **aproximada**. Consulta el archivo `apps/gaza/data/geospatial-baseline.json`.
2. Exportar GeoJSON del área de 800 m a ~1,8 km desde un cliente OSM/Overpass/QGIS. Debe contener líneas `highway`, polígonos `building`, opcionalmente `landuse`; las coordenadas GeoJSON son longitud/latitud WGS84.
3. Importar sin dependencias externas:
   ```bash
   python tools/gaza/build_site_context.py downloads/coreses-osm.geojson apps/gaza/data/site-real-context.json --radius 1800
   python -m unittest discover -s apps/gaza/tests -p "site-real-test.py"
   ```
4. Inspeccionar los resultados. El sistema conserva `PUBLIC_REFERENCE`; alturas ausentes **no se inventan**.
5. Para Blender, convertir con `pyproj` a **ETRS89 / UTM 30N (EPSG:25830)** antes de cualquier medición industrial. El importador local usa una aproximación ENU solo para visualizar alrededor del ancla.
6. Generar LOD0/LOD1 y exportar glTF 2.0 GLB con licencia/fuente en `assets/3d/manifest.json`; pasar QA de GLB y render. Mantener la geometría procedural actual de fallback.
7. Solo tras QA visual/geográfico, conectar el contexto a `plant-3d.html`, sin sustituir el motor de producción/logística.

## Capas sugeridas en Blender

```text
GEO_ROADS_OSM
GEO_BUILDINGS_OSM
GEO_PARCEL_CATASTRO
GEO_TERRAIN_PNOA_LIDAR
GEO_ORTHO_REFERENCE
PLANT_EXTERIOR_INFERRED
PLANT_AS_BUILT_AUTHORIZED
PLANT_EQUIPMENT_SIMULATED
TRAFFIC_SIGNAGE_EVIDENCED
DYNAMIC_AGENT_ROUTES
```

## Gate de promoción

- Mismas coordenadas y misma escala en escenas GIS y Plant 3D.
- Ensayar entradas, cruces, pasos peatonales y geometría de calzada; **no** etiquetar acceso confirmado usando la carretera OSM más próxima.
- Mantener campos `source`, `license`, `provenance`, `captureDate` y `geometryQuality` en cada asset.
- Atribuciones visibles: © OpenStreetMap contributors / DGC / IGN según licencias aplicables.
- Modo demo sin claves, sin costes externos y sin control PLC/OT.

## Enlaces oficiales
- OSM: https://www.openstreetmap.org/about
- Catastro: https://www.sedecatastro.gob.es/Accesos/SECAccDescargaDatos.aspx
- IGN PNOA ortofotos: https://pnoa.ign.es/web/portal/pnoa-imagen/productos-a-descarga
- IGN PNOA LiDAR: https://pnoa.ign.es/web/portal/pnoa-lidar/productos-a-descarga


## Referencia visual aportada (Coreses, 2025)

El archivo `data/coreses-exterior-photo-evidence.json` recoge la observación manual de las capturas aportadas por el usuario: nave longitudinal con panel metálico horizontal gris, coronación prismática roja, volumen anexo de oficinas acristaladas, bloque bajo rojo, vallado blanco, accesos diferenciados y mapa de orientación. **No contiene coordenadas de puertas ni cotas inventadas**.

**Próxima ejecución Blender / WebGL:** construir bloques separados de cubierta roja y nave gris, vidrio del anexo, perfil de valla y elementos viales con escala definida por parcela vectorial. Modelar dos accesos identificados funcionalmente según cartel, pero dejar sus coordenadas pendientes de georreferenciación. La simulación utilizará acceso 1 para expediciones/oficinas y acceso 2 para entrada de leche/báscula como escenario hasta validación operativa. Revisar geometría, señalética y giros HGV con ortofoto antes de publicar la escena.

### QA actual
El importador OSM pasó cuatro pruebas Python. El workflow visual falla más adelante, durante la ejecución del QA navegador. Este fallo **no demuestra que el importador esté mal**, y bloquea la promoción a `main` hasta diagnóstico de la suite visual.
