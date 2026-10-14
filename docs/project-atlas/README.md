# Project Atlas

Revisión: 15 de octubre de 2026.

## Objetivo

El Project Atlas organiza proyectos reales de acústica, AV, automatización, CAD/3D, fabricación y estudios de producción en una estructura común y navegable.

La prioridad es la **procedencia de la evidencia**, no la espectacularidad gráfica.

## Entradas públicas

| Ruta | Función |
| --- | --- |
| `/projects/atlas-3d.html` | Índice 3D source-backed. La profundidad pertenece únicamente a la interfaz. |
| `/projects/promo.html` | Promo técnica combinada por dominios: arquitectura, acústica, AV, automatización, CAD/fabricación y estudios. |
| `/projects/` | Índice de casos individuales. |
| `/projects/mar-salada.html` | Mar Salada / Club del Mar. |
| `/projects/casa-alain.html` | Cine residencial Casa Alain. |
| `/projects/can-furnet-club.html` | Aislamiento y acústica Can Furnet Club. |
| `/projects/playa-soleil-bora-bora.html` | Infraestructura AV Playa Soleil / Bora Bora. |
| `/projects/private-production-studio-canada.html` | Estudio privado de producción, Canadá. |
| `/projects/private-production-studio-sta-eulalia.html` | Estudio privado de productor, anonimizado. |
| `/projects/acoustic-studio-italy.html` | Sala de producción / mezcla, Italia. |
| `/projects/private-producer-acoustic-concept.html` | Preproyecto acústico confidencial. |

## Registro canónico

`docs/project-atlas/project-registry.json` concentra:

- nombre público;
- slug y ruta;
- dominios técnicos;
- paquete o paquetes de origen;
- recuento de archivos;
- media disponible;
- frontera de privacidad;
- referencias fuente seleccionadas;
- política de procedencia.

## Clasificaciones

Las páginas no deben intercambiar estos estados:

- **MEASURED** — valor o dimensión medida.
- **FIELD_ARCHIVE** — fotografía o evidencia de campo.
- **SOURCE_DRAWING** — plano/dibujo de origen.
- **SOURCE_MODEL** — modelo CAD/SketchUp/3D de origen.
- **RENDERED** — visualización renderizada.
- **DESIGNED** — solución diseñada.
- **PREDICTED** — resultado estimado o calculado sin validación final.
- **INSTALLED** — elemento documentado como instalado.
- **COMMISSIONED** — integración/proceso documentado como comisionado.
- **CONFIDENTIAL_SOURCE** — fuente privada usada para validar el caso, no publicable.

## Regla gráfica

No generar imágenes sustitutas de proyectos ni inventar geometría de espacios.

Se permite:

1. reencuadrar, redimensionar o transcodificar un render/foto/vídeo real;
2. presentar un plano fuente o diagrama sanitizado ya documentado;
3. usar profundidad, movimiento o 3D en la **interfaz de navegación**;
4. convertir un modelo real a un formato web cuando la geometría y procedencia estén validadas.

No se permite:

1. crear renders nuevos fingiendo que pertenecen al proyecto;
2. rellenar huecos con arquitectura genérica;
3. reconstruir una planta sin fuente y mostrarla como real;
4. convertir una predicción acústica en medición;
5. publicar identidad de clientes confidenciales sin permiso.

## Pipeline de media real

`tools/project-atlas/build_source_media.py` crea derivados públicos a partir de los ZIP/MP4 originales.

El pipeline:

- no altera los originales;
- extrae únicamente archivos definidos de forma explícita;
- genera WebP/MP4 optimizados;
- conserva clasificación;
- calcula SHA-256 de fuente y derivado;
- escribe `assets/project-atlas/manifest.json`.

Wrapper Windows:

`tools/project-atlas/INGEST_SOURCE_MEDIA.ps1`

Ejemplo:

```powershell
python -m pip install pillow
.\tools\project-atlas\INGEST_SOURCE_MEDIA.ps1 -SourceDir "D:\PROJECT_ATLAS_SOURCES"
```

FFmpeg debe estar disponible en `PATH` para transcodificar vídeos.

## QA

Workflows principales:

- **Project Atlas Source Archive QA**
- **Project Atlas / MAR SALADA QA**
- **README Links**
- **CV Editorial Variants QA**
- **Master Project Map QA**

El QA valida sintaxis, rutas, contratos públicos, overflow, imágenes rotas, interacción del 3D Atlas y la frontera `source-backed`.

## Arquitectura futura

El siguiente nivel de fidelidad no requiere rediseñar las páginas.

Basta con sustituir placeholders de media por derivados reales y, cuando exista geometría validada, cargar GLB derivados de los modelos fuente.

La estructura editorial y la procedencia ya están preparadas para ello.
