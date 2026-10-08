---
name: cv-ats-pdf
description: Build and maintain Héctor Lobato's printable professional CV / ATS page and plain-text mirror. Use when editing cv/ats.html, exporting PDF, adding verified experience, education, ongoing master's studies, certifications, technologies or project summaries.
---

# CV ATS / PDF · Héctor Lobato

## Purpose

This skill governs the **printable / ATS professional CV**, not the interactive dossier.

Canonical surfaces:
- `cv/ats.html` — human-readable, printable A4 CV;
- `cv/ats.txt` — plain-text ATS mirror;
- `cv/dossier.html` — interactive evidence dossier, used only as a source/companion;
- `cv/present.html` — short presentation route.

The printable CV must be useful on its own. Do not make it a thin index that forces the reader into the website.

## Content hierarchy

Use this order unless a job-specific variant requires another sequence:

1. identity + professional headline;
2. concise professional profile;
3. core competencies;
4. **employment chronology**;
5. selected technical projects;
6. higher education + master's studies;
7. certifications / manufacturer training / courses;
8. technologies and tools;
9. languages;
10. working method / delivery lifecycle.

Target length: normally **2–3 A4 pages** when printed. Prefer useful density over forcing everything into one page.

## Source and evidence rules

Use, in descending priority:
1. user-confirmed facts in the current task;
2. previous CVs / portfolio files;
3. documented project pages in this repository;
4. prior conversation context;
5. public manufacturer terminology only for generic technology names.

Never invent:
- employer dates;
- formal course titles;
- certification dates;
- client identities;
- academic completion;
- metrics or project outcomes.

If the user confirms a certification exists but the exact certificate/course title or date is not documented, write a conservative manufacturer-training line and omit the date rather than fabricating one.

For confidential clients, describe sector, scope and technical responsibility without revealing identity.

## Current verified chronology

### Studio Ingenia
**2021 – Actualidad · Technical Director / Project Engineer**

Summarize:
- end-to-end project delivery;
- requirements and architecture;
- measurements, BOM/BOQ and budgeting;
- supplier / contractor coordination;
- site follow-up;
- integration and programming;
- commissioning / troubleshooting;
- documentation / handover;
- acoustics, automation, AV, IT/network and special systems.

### Estudio Áureo
**2018 – 2021 · Director de Departamento**

Summarize:
- domotics / KNX;
- IT and networks;
- electrical/control systems;
- AV;
- telecommunications;
- video security;
- AutoCAD / Revit / SolidWorks;
- estimating and technical documentation;
- client/site coordination.

### 2026 R&D / products
Keep RHB STUDIO and GAZA as **technical product / R&D work**, separate from employment chronology unless the user explicitly requests a legal-company framing.

## Current selected project set

Keep short, technically specific entries for:
- Sound Club, Palma / Puerto Deportivo de Palma;
- Las Dalias / Club Akasha;
- Casa NOAH;
- private international technology-client residence;
- hospitality/restoration project in Formentera;
- GAZA Operations Intelligence;
- RHB STUDIO;
- XXXIA Studio.

Use the current public alias/privacy rules. Do not restore deprecated project naming if a newer public name exists.

## Education

Verified:
- **2013–2016 — Bachelor's Degree · Audio Engineering & Audio Production · Middlesex University, London**.
- **2020–Actualidad — Máster en Inteligencia Artificial · VIU — Cursando actualmente**.

Incomplete studies must be explicit:
- use `Cursando actualmente`, `En curso`, or `No finalizado`;
- never imply the master's degree has been awarded.

If more master's programmes are later recovered, add them only after exact title/institution is known.

## Certifications and manufacturer training

Keep the documented entries:
- 2018 — KNX Advanced · Grupo Conitec Ingeniería y Domótica;
- 2019 — Crestron CTI-P101 · Foundations of Crestron Programming;
- 2019 — Crestron NVX · Design and Application;
- 2020 — JAVA IFCD033PO;
- 2021 — AXIS · Network Audio / System Design / Camera Station / Analytics.

User-confirmed manufacturer credentials/training to show even when exact date/title is not yet documented:
- Ecler;
- Void Acoustics;
- Lynx Pro Audio.

For those three, do **not** invent a year or exact certificate title. Use a neutral formulation such as:
`certificación / formación técnica de fabricante en ...`.

## Skills vocabulary

Prefer these clusters:

- Acoustics / electroacoustics;
- KNX / ETS6 / DALI / Gira / Crestron;
- DSP / matrices / amplifiers / audio networking / zoning;
- TCP/IP / VLAN / Wi-Fi / UniFi / VPN / PoE;
- AutoCAD / Revit / SolidWorks / SketchUp;
- BOM / BOQ / budgeting / suppliers / QA;
- Python / JavaScript / Java / APIs / GitHub / Three.js;
- OpenClaw / OmniRoute / agents / model routing / local-first automation;
- commissioning / troubleshooting / documentation / handover.

## Toolbar and navigation

The ATS/PDF page must have only distinct actions:
- `Presentar 5 min`;
- `Dossier interactivo`;
- `Imprimir / Guardar PDF`.

Do not add duplicate links such as `Dossier` + `Dossier web` pointing to the same destination.

## Print / PDF requirements

- A4;
- 10–12 mm print margins;
- no toolbar in print;
- no box shadow in print;
- sections and jobs should avoid bad page breaks;
- semantic headings and ordinary text remain selectable/searchable;
- no React/canvas dependency;
- hyperlinks may remain visible but must not be required for comprehension;
- `ats.txt` must mirror the substantive content.

## ATS requirements

- one semantic document;
- no critical information inside images;
- standard job/project/education headings;
- explicit dates;
- recognizable technology names;
- plain-language responsibility verbs;
- no keyword stuffing;
- keep project aliases and confidentiality consistent.

## QA contract

`window.__CV_ATS__` must expose:
- schema version;
- print support;
- `employmentChronology: true`;
- selected project count;
- master's-in-progress count;
- certification/training count;
- duplicate dossier button status.

Playwright QA should assert:
- no duplicate dossier buttons;
- chronology contains Studio Ingenia and Estudio Áureo;
- master's study shows `Cursando actualmente`;
- Ecler, Void Acoustics and Lynx Pro Audio are present;
- print button exists;
- no horizontal overflow on desktop/mobile;
- required section headings are present.
