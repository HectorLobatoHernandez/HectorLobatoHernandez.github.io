/* Translation of the canonical editorial dossier. The Spanish HTML remains
   the readable, printable fallback when JavaScript is unavailable. */
(function(){
  const requested=new URLSearchParams(location.search).get('lang');
  const lang=['es','en','it'].includes(requested)?requested:'es';
  document.documentElement.lang=lang;
  document.querySelectorAll('.language-switch a').forEach(a=>a.setAttribute('aria-current',String(a.dataset.lang===lang)));
  const hero={
    es:{menu:'Menú',close:'Cerrar',index:'Dossier / índice',profile:'Perfil',skills:'Skills',design:'Diseño e ingeniería',software:'Software e IA',evidence:'Evidencia',archive:'Archivo',deck:'Ingeniería e integración de sistemas: automatización, AV, IT/OT, CAD y software aplicado.',explore:'Explorar proyectos ↓',presentation:'Presentación 5 min',scroll:'scroll / explorar dossier ↓',photo:'Ver foto normal',viewer:'Activar visor React',hint:'mueve el cursor / revelar',plain:'foto original',load:'Alineando cables y píxeles…',wait:'por favor, mantenga la curiosidad'},
    en:{menu:'Menu',close:'Close',index:'Dossier / contents',profile:'Profile',skills:'Skills',design:'Design & engineering',software:'Software & AI',evidence:'Evidence',archive:'Archive',deck:'Systems engineering and integration: automation, AV, IT/OT, CAD and applied software.',explore:'Explore projects ↓',presentation:'5-minute presentation',scroll:'scroll / explore the dossier ↓',photo:'View original photo',viewer:'Enable React viewer',hint:'move pointer / reveal',plain:'original photo',load:'Aligning cables and pixels…',wait:'please stay curious'},
    it:{menu:'Menu',close:'Chiudi',index:'Dossier / indice',profile:'Profilo',skills:'Competenze',design:'Design e ingegneria',software:'Software e IA',evidence:'Prove',archive:'Archivio',deck:'Ingegneria e integrazione di sistemi: automazione, AV, IT/OT, CAD e software applicato.',explore:'Esplora i progetti ↓',presentation:'Presentazione · 5 min',scroll:'scorri / esplora il dossier ↓',photo:'Mostra foto originale',viewer:'Attiva visualizzatore React',hint:'muovi il cursore / rivela',plain:'foto originale',load:'Allineamento di cavi e pixel…',wait:'mantieni viva la curiosità'}
  };
  window.__CV_I18N__={lang,t:key=>hero[lang][key]||hero.es[key]||key};
  if(lang==='es')return;
  const copy=(selector,en,it)=>{
    const nodes=selector.split(',').flatMap(part=>[...document.querySelectorAll(part.trim())]);
    const values=(lang==='en'?en:it).trim().split('\n').map(s=>s.trim());
    if(nodes.length!==values.length){console.error('Dossier translation count',selector,nodes.length,values.length);return}
    nodes.forEach((node,i)=>{node.textContent=values[i]});
  };
  copy('.rb-fallback p:first-of-type,.rb-fallback p a',`Engineering across physical spaces, control systems and software.
Enter the dossier →`,`Ingegneria tra spazi fisici, sistemi di controllo e software.
Entra nel dossier →`);
  copy('main > nav > a:first-child',`Architectural Atlas · Explore the city ↗`,`Architectural Atlas · Esplora la città ↗`);
  copy('.portfolio-paths small,.portfolio-paths strong,.portfolio-paths span',`01 / Spaces · systems
Design & engineering
ATLAS, spatial projects and systems integration ↓
02 / Products · systems
Software engineering & AI
GAZA OPS, RHB STUDIO and XXXIA STUDIO ↓`,`01 / Spazi · sistemi
Design e ingegneria
ATLAS, progetti spaziali e integrazione tecnica ↓
02 / Prodotti · sistemi
Ingegneria del software e IA
GAZA OPS, RHB STUDIO e XXXIA STUDIO ↓`);
  copy('#perfil .kicker,#perfil h2,#perfil .section-head p,#perfil .meta-label,#perfil h3,#perfil article p',`01 / Profile
Integrate before isolating.
Specialization is not one technology. It means understanding interfaces across disciplines, turning constraints into architecture and delivering an operable, documented system.
Field
Systems
Engineering
Software
On-site installation and commissioning
Control, AV and IT/OT
Drawings, BOM and traceability
Tools and automation
Surveying, coordination, wiring, integration, testing, diagnostics, handover and issue documentation.
KNX, DALI, DSP, matrices, networks, PoE, interface integration and design for maintainability.
AutoCAD, technical specification, budgets, suppliers, QA, change control and project documentation.
Python, APIs, Git/GitHub, web, GIS and AI agents turning project information into usable systems.`,`01 / Profilo
Integrare prima di isolare.
La specializzazione non è una singola tecnologia: significa capire le interfacce tra discipline, trasformare i vincoli in architettura e consegnare un sistema utilizzabile e documentato.
Sul campo
Sistemi
Ingegneria
Software
Lavori in cantiere e collaudo
Controllo, AV e IT/OT
Disegni, BOM e tracciabilità
Strumenti e automazione
Rilievi, coordinamento, cablaggio, integrazione, test, diagnosi, consegna e documentazione delle criticità.
KNX, DALI, DSP, matrici, reti, PoE, integrazione di interfacce e progettazione orientata alla manutenzione.
AutoCAD, specifiche tecniche, preventivi, fornitori, QA, controllo delle modifiche e documentazione di progetto.
Python, API, Git/GitHub, web, GIS e agenti IA per trasformare le informazioni di progetto in sistemi utilizzabili.`);
  copy('#skills .kicker,#skills h2,#skills .section-head p,#skills .cap p,#skills .cap small',`02 / Skills
A physical and digital stack.
Capabilities are grouped by system function: where each tool fits, what depends on it and how to validate it.
KNX · ETS6 · DALI · Gira · Crestron · scenes · states · interoperability
DSP · matrices · amplification · zones · routing · limiting · Dante concepts
TCP/IP · VLAN · UniFi · VPN · PoE · structured cabling · segmentation
AutoCAD · BOM · budgeting · suppliers · documentation · QA · change control
Python · JavaScript · APIs · Git/GitHub · agents · automation · GIS · visualization
Troubleshooting · incident handling · support · process improvement · documentation
Design / programming / commissioning
Signal flow / tuning / diagnostics
Availability / observability / troubleshooting
From survey to handover
Tools / workflows / assistants
Operate / explain / improve`,`02 / Competenze
Competenze fisiche e digitali.
Le capacità sono raggruppate per funzione: dove si colloca ogni strumento, da cosa dipende e come si valida.
KNX · ETS6 · DALI · Gira · Crestron · scene · stati · interoperabilità
DSP · matrici · amplificazione · zone · instradamento · limitazione · concetti Dante
TCP/IP · VLAN · UniFi · VPN · PoE · cablaggio strutturato · segmentazione
AutoCAD · BOM · preventivi · fornitori · documentazione · QA · controllo modifiche
Python · JavaScript · API · Git/GitHub · agenti · automazione · GIS · visualizzazione
Diagnosi · gestione incidenti · assistenza · miglioramento processi · documentazione
Progettazione / programmazione / collaudo
Flusso segnale / taratura / diagnosi
Disponibilità / osservabilità / diagnosi
Dal rilievo alla consegna
Strumenti / processi / assistenti
Gestire / spiegare / migliorare`);
  copy('#diseno-ingenieria .kicker,#diseno-ingenieria h2,#diseno-ingenieria .section-head p,#diseno-ingenieria .domain-card small,#diseno-ingenieria .domain-card h3,#diseno-ingenieria .domain-card p,#diseno-ingenieria .domain-card b',`01 / Practice
Design & engineering.
Spaces, acoustics, integration and technical documentation. ATLAS offers a conceptual journey through projects; each project page retains its sources and evidence limits.
ATLAS / Interactive city
Delivered project / documented case
Architectural Atlas
MAR SALADA
Explore spatial projects and their architecture and engineering records.
Audio, acoustics, KNX/DALI, CAD and systems integration at Club del Mar Palma.
Explore ATLAS ↗
View chapter ↓`,`01 / Area di lavoro
Design e ingegneria.
Spazi, acustica, integrazione e documentazione tecnica. ATLAS offre un percorso concettuale tra i progetti; ogni scheda conserva fonti e limiti delle prove.
ATLAS / Città interattiva
Progetto realizzato / caso documentato
Architectural Atlas
MAR SALADA
Esplora i progetti spaziali e la documentazione di architettura e ingegneria.
Audio, acustica, KNX/DALI, CAD e integrazione di sistemi al Club del Mar Palma.
Esplora ATLAS ↗
Vedi il capitolo ↓`);
  copy('#software-ia .kicker,#software-ia h2,#software-ia .section-head p,#software-ia .domain-card small,#software-ia .domain-card h3,#software-ia .domain-card p,#software-ia .domain-card b',`02 / Practice
Software engineering & AI.
Products and tools with visible architecture, code, QA and evidence boundaries. Public demos distinguish real, inferred and simulated data.
Demonstrator / operations
Active development / engineering
Creative studio / AI
GAZA OPS
RHB STUDIO
XXXIA STUDIO
Plant, warehouse, farm, laboratory and logistics on a simulated operations surface.
Projects, CAD, BOM, documentation and agents; separate web demo and local runtime.
Identity, visual production and traceability of generative processes.
View chapter ↓
View chapter ↓
Explore project ↗`,`02 / Area di lavoro
Ingegneria del software e IA.
Prodotti e strumenti con architettura, codice, QA e confini delle prove visibili. Le demo pubbliche distinguono dati reali, dedotti e simulati.
Dimostratore / operazioni
Sviluppo attivo / ingegneria
Studio creativo / IA
GAZA OPS
RHB STUDIO
XXXIA STUDIO
Impianto, magazzino, fattoria, laboratorio e logistica in una superficie operativa simulata.
Progetti, CAD, BOM, documentazione e agenti; demo web e runtime locale separati.
Identità, produzione visiva e tracciabilità dei processi generativi.
Vedi il capitolo ↓
Vedi il capitolo ↓
Esplora il progetto ↗`);
  copy('#mar-salada .project-no,#mar-salada .project-lead,#mar-salada .project-copy>p:not(.project-lead),#mar-salada .fact span,#mar-salada .project-links a',`03 / Selected work · Hospitality systems
Professional audio, acoustics, KNX/DALI, mechanics, fabrication and commissioning coordinated as one system.
This case study draws on the real project archive: acoustic reports, ETS/Gira, CAD, suspension and isolation details, subwoofers, DJ booth, surveys, 3D sequences and master video. Estimates, design, installation and commissioning are labelled separately.
Role
Technical design · integration · coordination · commissioning
Domains
AV · DSP · acoustics · KNX/ETS6 · DALI · Gira X1 · CAD · fabrication
Evidence
Reports · DWG · KNX project · 1080p video · 3D sequences · installation documents
Boundary
MEASURED / PREDICTED / DESIGNED / INSTALLED / COMMISSIONED are labelled separately. Credentials and sensitive files are excluded.
Open case study ↗
Project Atlas ↗
Real-media 3D ↗
Source 3D Atlas ↗
Technical promo ↗`,`03 / Lavori selezionati · Sistemi per l'ospitalità
Audio professionale, acustica, KNX/DALI, meccanica, fabbricazione e collaudo coordinati come un unico sistema.
Il caso nasce dall'archivio reale del progetto: relazioni acustiche, ETS/Gira, CAD, dettagli di sospensione e disaccoppiamento, subwoofer, cabina DJ, rilievi, sequenze 3D e video master. Stima, progetto, installazione e collaudo sono distinti.
Ruolo
Progettazione tecnica · integrazione · coordinamento · collaudo
Ambiti
AV · DSP · acustica · KNX/ETS6 · DALI · Gira X1 · CAD · fabbricazione
Prove
Relazioni · DWG · progetto KNX · video 1080p · sequenze 3D · documentazione installativa
Confine
MEASURED / PREDICTED / DESIGNED / INSTALLED / COMMISSIONED sono indicati separatamente. Credenziali e file sensibili sono esclusi.
Apri il caso ↗
Project Atlas ↗
Media reale 3D ↗
Source 3D Atlas ↗
Promo tecnica ↗`);
  copy('#gaza .project-no,#gaza .project-lead,#gaza .project-copy>p:not(.project-lead),#gaza .fact span,#gaza .project-links a',`04 / Selected work · Industrial operations
A product demonstrator bringing shipments, warehouse, fleet, GIS and territory into a common operations view.
The project covers functional architecture, operations UX and an information model. The public demo explicitly separates public data, inferred reconstructions and simulation; it is not presented as a validated plant installation.
Role
Architecture · functional UX · operations model
Surfaces
Mission Control · Plant 3D · GIS · Territory · Weather · Systems
Use
Observability, exception triage, routes, environmental context and decision support.
Boundary
Read-only demo; real OT/ERP integration needs authorization, discovery and commissioning.
Open Mission Control ↗
Case study`,`04 / Lavori selezionati · Operazioni industriali
Un dimostratore che riunisce spedizioni, magazzino, flotta, GIS e territorio in una vista operativa comune.
Il progetto comprende architettura funzionale, UX operativa e modello informativo. La demo pubblica distingue dati pubblici, ricostruzioni dedotte e simulazione; non è presentata come installazione validata nell'impianto.
Ruolo
Architettura · UX funzionale · modello operativo
Superfici
Mission Control · Plant 3D · GIS · Territory · Weather · Systems
Utilizzo
Osservabilità, gestione eccezioni, percorsi, contesto ambientale e supporto decisionale.
Confine
Demo di sola lettura; una vera integrazione OT/ERP richiede autorizzazione, analisi e collaudo.
Apri Mission Control ↗
Caso di studio`);
  copy('#rhb .project-no,#rhb .project-lead,#rhb .project-copy>p:not(.project-lead),#rhb .fact span,#rhb .project-links a',`05 / Selected work · Engineering platform
An internal platform coordinating projects, CAD, fabrication, documentation and AI agents.
The goal is a traceable technical workflow: request, survey, CAD, design, BOM, budget, approval, fabrication, installation, QA and handover. The full runtime is local; the public site is a showcase.
Role
Functional architecture · internal product · automation
Status
In active development
Core
Project state · versions · documents · decisions · deliverables
Runtime
OmniRoute · OpenClaw · NEXO · local agents and tools
Open functional demo ↗
Architecture`,`05 / Lavori selezionati · Piattaforma ingegneristica
Una piattaforma interna per coordinare progetti, CAD, fabbricazione, documentazione e agenti IA.
L'obiettivo è un ciclo tecnico tracciabile: richiesta, rilievo, CAD, progetto, BOM, preventivo, approvazione, fabbricazione, montaggio, QA e consegna. Il runtime completo è locale; il sito pubblico è una presentazione.
Ruolo
Architettura funzionale · prodotto interno · automazione
Stato
In sviluppo attivo
Nucleo
Stato progetto · versioni · documenti · decisioni · deliverable
Runtime
OmniRoute · OpenClaw · NEXO · agenti e strumenti locali
Apri la demo funzionale ↗
Architettura`);
  copy('#evidence .kicker,#evidence h2,#evidence .section-head p,#evidence .profile-grid h3,#evidence .profile-grid p,#evidence .archive p,#evidence .project-links a',`06 / Programming · AI · Systems Engineering
Proof of work, beyond a list of buzzwords.
Digital work is shown through architecture, contracts, code, QA and navigable demos. Public and local, implemented and conceptual, real and simulated are distinguished.
Web, APIs and visualization
Agents with clear boundaries
GitHub as a delivery system
Interfaces, limits and failures
JavaScript, Python, HTML/CSS, APIs, JSON contracts, Three.js, GIS and Node services for technical interfaces and read-only gateways.
OmniRoute, OpenClaw, specialized agents, vendored skills, routing by discipline, human approval and a clear distinction between local runtime and public showcase.
Branches, pull requests, GitHub Actions, visual and functional Chromium QA, state contracts, evidence artifacts and promotion to main after passing checks.
Read-only IT/OT design, credentials outside the browser, observability, PUBLIC / INFERRED / SIMULATED provenance, change control and graceful degradation when an external source fails.
Navigable surface connecting operations, Plant 3D, GIS, Territory, weather and systems with visible provenance.
Gateway, interface discovery, canonical contracts, OT boundaries and read-only integration strategy.
Navigable Project Core, Survey/CAD, BOM, routing, documentation and QA demo; private runtime separate.
Code, skills, workflows, documentation, tests and traceable evolution of the portfolio and demonstrators.
Skill manifest ↗
Complete technical map ↗
Presentation route ↗`,`06 / Programmazione · IA · Ingegneria dei sistemi
Prove di lavoro, oltre l'elenco delle parole alla moda.
Il lavoro digitale è mostrato con architettura, contratti, codice, QA e demo navigabili. Si distinguono pubblico e locale, realizzato e concettuale, reale e simulato.
Web, API e visualizzazione
Agenti con confini chiari
GitHub come sistema di consegna
Interfacce, limiti e guasti
JavaScript, Python, HTML/CSS, API, contratti JSON, Three.js, GIS e servizi Node per interfacce tecniche e gateway di sola lettura.
OmniRoute, OpenClaw, agenti specializzati, skill integrate, instradamento per disciplina, approvazione umana e distinzione tra runtime locale e presentazione pubblica.
Branch, pull request, GitHub Actions, QA visivo e funzionale in Chromium, contratti di stato, artefatti di prova e promozione su main dopo controlli superati.
Progettazione IT/OT di sola lettura, credenziali fuori dal browser, osservabilità, provenienza PUBLIC / INFERRED / SIMULATED, controllo modifiche e degrado controllato quando una fonte esterna non risponde.
Interfaccia navigabile che collega operazioni, Plant 3D, GIS, territorio, meteo e sistemi con provenienza visibile.
Gateway, analisi delle interfacce, contratti canonici, limiti OT e strategia di integrazione di sola lettura.
Demo navigabile di Project Core, Survey/CAD, BOM, instradamento, documentazione e QA; runtime privato separato.
Codice, skill, workflow, documentazione, test ed evoluzione tracciabile del portfolio e dei dimostratori.
Manifest delle skill ↗
Mappa tecnica completa ↗
Percorso di presentazione ↗`);
  copy('.section:has(.method) .kicker,.section:has(.method) h2,.section:has(.method) .section-head p,.method p',`07 / Method
From problem to operating system.
A technical project changes shape over time. Keeping continuity across phases prevents design, installation, programming and handover from becoming isolated worlds.
Requirements, current state, risks, constraints and evidence.
Interfaces, protocols, topology, capacity and decisions.
Programming, routing, installation, coordination and control.
Testing, tuning, diagnostics, acceptance and corrections.
Documentation, support, observability and continuous improvement.`,`07 / Metodo
Dal problema al sistema operativo.
Un progetto tecnico cambia forma nel tempo. Mantenere continuità tra le fasi evita che progetto, installazione, programmazione e consegna diventino mondi separati.
Requisiti, stato attuale, rischi, vincoli e prove.
Interfacce, protocolli, topologia, capacità e decisioni.
Programmazione, instradamento, montaggio, coordinamento e controllo.
Test, taratura, diagnosi, accettazione e correzioni.
Documentazione, assistenza, osservabilità e miglioramento continuo.`);
  copy('#archivo .kicker,#archivo h2,#archivo .section-head p,#archivo .archive p',`08 / Project archive
More context, less noise.
The Project Atlas keeps each project in context, with its evidence, limits and technical material.
Conceptual city and access to documented architecture and engineering projects.
Residential cinema: acoustics, audio options, SketchUp, renders, finishes and video.
Structural decoupling, silenced HVAC, acoustic doors, treatment, wiring and documentation.
Cable book, speaker positions, CAT6a, power, CAD, sections and acoustic models.
Phased acoustic design, CAD, SketchUp, diffusion reinforcement and critical listening.
First reflections, absorptive ceiling, acoustic furniture, CAD, SketchUp and V-Ray.
Modes, bass, first reflections, diffusion and RT60 predictions with explicit evidence boundary.
Bilingual preliminary design for isolation, acoustics, timber, 3D, hardware, lighting and phased implementation.
Systems integration and project documentation.
Technical direction and systems integration with gradual recovery of the original archive.
Identity withheld; public documentation is limited to non-sensitive material.
Creative direction, identity, presentation systems and controlled generative experimentation.`,`08 / Archivio dei progetti
Più contesto, meno rumore.
Il Project Atlas conserva ogni progetto nel suo contesto, con prove, limiti e materiali tecnici.
Città concettuale e accesso ai progetti documentati di architettura e ingegneria.
Cinema residenziale: acustica, opzioni audio, SketchUp, render, finiture e video.
Disaccoppiamento strutturale, HVAC silenziato, porte acustiche, trattamento, cablaggio e documentazione.
Elenco cavi, posizioni diffusori, CAT6a, alimentazione, CAD, sezioni e modelli acustici.
Progettazione acustica per fasi, CAD, SketchUp, diffusione e ascolto critico.
Prime riflessioni, soffitto assorbente, arredo acustico, CAD, SketchUp e V-Ray.
Modi, basse frequenze, prime riflessioni, diffusione e previsioni RT60 con confine probatorio esplicito.
Preprogetto bilingue per isolamento, acustica, legno, 3D, hardware, illuminazione e realizzazione per fasi.
Integrazione dei sistemi e documentazione progettuale.
Direzione tecnica e integrazione dei sistemi con recupero progressivo dell'archivio originale.
Identità riservata; documentazione pubblica limitata a materiale non sensibile.
Direzione creativa, identità, sistemi di presentazione e sperimentazione generativa controllata.`);
  copy('.section:has(.cred) .kicker,.section:has(.cred) h2,.section:has(.cred) .section-head p',`09 / Credentials
Technical foundation.
Education and certifications already published in the portfolio. This dossier does not add unverified credentials.`,`09 / Titoli e certificazioni
Base tecnica.
Formazione e certificazioni già pubblicate nel portfolio. Questo dossier non aggiunge titoli non verificati.`);
  copy('.final .kicker,.final h2,.final p,.final-note',`10 / Contact
Complex systems. Explained and operable.
Available for technical roles, systems integration, automation, project engineering and operations where hardware, software and people must work as one system.
WEB DOSSIER / 2026. This is an editorial presentation. The ATS/PDF CV is a separate linked document. GAZA surfaces are public demonstrators; the complete RHB STUDIO runtime remains local.`,`10 / Contatti
Sistemi complessi. Spiegati e utilizzabili.
Disponibile per ruoli tecnici, integrazione di sistemi, automazione, ingegneria di progetto e operazioni in cui hardware, software e persone devono funzionare insieme.
DOSSIER WEB / 2026. Questa è una presentazione editoriale. Il CV ATS/PDF è un documento separato. Le superfici GAZA sono dimostratori pubblici; il runtime completo di RHB STUDIO rimane locale.`);
  document.title='Héctor Lobato — '+(lang==='en'?'Professional dossier':'Dossier professionale');
})();
