# SOUND CLUB and restaurant — CAD ingest audit

## Scope

Public-safe audit of the private CAD source set. **Raw DWG files are not committed to GitHub.**

This audit records only file identity, format generation, hashes and promotion status so the project can progress without accidentally treating an autosave/recovery as the geometric master.

## Findings

### 1. Exact duplicate historical group

The following three files are **byte-identical**:

- `CLUB DE MAR ABRIL 2024.dwg`
- `CLUB DE MAR ABRIL 2024002.dwg`
- `CLUB DE MAR ABRIL 2024003.dwg`

All three share SHA-256:

`79faa012bc2c0f821a0ca02a6f2def2e37d7ecafdd81fe2172b741b17ee144fc`

They are AutoCAD 2004/2005/2006 DWG files. They should be treated as one historical source, not as three independent geometry candidates.

### 2. Architectural candidates

`ARQ_BASE.dwg`

- AutoCAD 2018/2019/2020
- 1,703,010 bytes
- current role: **ARCHITECTURE_CANDIDATE**
- status: **CANDIDATE_NOT_VERIFIED**

`CLUB DE MAR ABRIL 2024(1).dwg`

- AutoCAD 2018/2019/2020
- distinct hash and size from ARQ_BASE
- role: **ARCHITECTURE_VARIANT**
- requires geometry comparison before any master decision.

`CLUB DE MAR ABRIL 2024_1_22428_8aeea3cf.sv$.dwg`

- autosave/recovery naming
- role: **AUTOSAVE_RECOVERY**
- must never be auto-promoted.

### 3. DJ booth CAD

Two distinct full drawing variants exist:

- `CLUB DE MAR ABRIL MESA DE DJ.dwg`
- `CLUB DE MAR ABRIL MESA DE DJ(1).dwg`

They are not byte-identical, therefore one cannot silently replace the other.

`CORTES MESA DJ.dwg` is retained as a separate detail/reference drawing.

The documented dimensions shown on the public case remain data-level facts until the CAD geometry is verified.

### 4. Suspended structure / anti-vibration CAD

A clean candidate exists for:

- `AMORTIGUADOR TECHO SPEAKERS.dwg`

Two additional recovery variants exist and remain non-authoritative.

For `CDM_STR_TUBOS`, only recovery variants are currently present:

- `CDM_STR_TUBOS_recover.dwg`
- `CDM_STR_TUBOS_recover2.dwg`

Because there is no clean source file in the current set, neither recovery can be promoted automatically.

## Promotion rule

No DWG becomes `VERIFIED_DRAWING` merely because it is newer, larger or named `recover2`.

Required next gate:

1. ingest original SKP;
2. establish common units;
3. verify model origin / axes;
4. compare architectural perimeter and levels;
5. compare DJ booth geometry;
6. compare suspended structure routes and supports;
7. resolve Ø48.3 mm / Ø63 mm against CAD + site evidence;
8. promote one geometry master;
9. derive web model / exploded / XXXIA from that promoted master.

## Machine-readable registry

See:

`docs/projects/sound-club-palma/cad-source-manifest.json`

The manifest contains SHA-256 values for source identity while keeping the actual DWG files private.
