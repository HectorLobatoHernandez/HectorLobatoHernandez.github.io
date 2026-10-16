# Dossier visual: procedencia de capturas

El dossier web y el PDF usan el logotipo de referencia `assets/gaza-logo.svg` del demostrador. Es una aplicación visual independiente de la marca pública y no acredita aprobación de Leche GAZA.

| Archivo | Escena capturada | Procedencia |
| --- | --- | --- |
| `assets/dossier/plant-facade-brand.png` | Acceso 1, fachada y rótulo | Captura WebGL de QA de planta, revisión v27 |
| `assets/dossier/farm-facade-brand.png` | Fachada de nave ganadera | Captura WebGL de GitHub Actions, `GAZA historic farm QA`, ejecución `38916952876` sobre `937978e` |
| `assets/dossier/lab-quality-brand.png` | Interior propuesto de laboratorio | Captura WebGL de QA nocturna del recorrido integrado |
| `assets/dossier/truck-load-brand.png` | Camión de expedición SIM con carga y logotipo visual | Captura WebGL de QA nocturna del recorrido integrado |
| `assets/dossier/gaza-lockup.png` | Reproducción raster del SVG para el PDF | Convertido desde `assets/gaza-logo.svg` mediante Inkscape |

Los archivos JPEG del dossier existentes muestran almacén, muelle, exterior, granja y laboratorio de día o de noche. Las capturas son instantes del prototipo, no datos en tiempo real ni geometría as-built. El PDF se reconstruye con `python3 apps/gaza/scripts/build-visual-dossier.py` desde la raíz del repositorio.
