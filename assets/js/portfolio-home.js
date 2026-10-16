(() => {
  const translations = {
    en: {
      skip:"Skip to content",navDesign:"Design & engineering",navSoftware:"Software & AI",contact:"Contact",
      eyebrow:"Technical portfolio · 2026",headline:"From physical spaces to the systems that make them work.",
      lead:"Design, acoustics, audiovisual systems and automation. Software and AI to connect projects, operations and people.",
      explore:"Explore projects",cv:"Technical CV (Spanish)",applied:"Applied engineering",
      designKicker:"Spaces · systems · construction",
      designIntro:"Acoustics, professional audio, KNX/DALI, CAD, fabrication and systems integration. ATLAS brings spatial projects together in an explorable 3D city.",
      atlasTitle:"One city to explore every project.",
      atlasText:"Enter the city, select a building and inspect its model, layers and references. The city and its activity are a conceptual presentation.",
      openAtlas:"Open 3D ATLAS",marLabel:"AV · acoustics · KNX/DALI",alainLabel:"Residential cinema · acoustics",
      softwareKicker:"Tools · operations · automation",softwareTitle:"Software engineering & AI",
      softwareIntro:"Three development lines at different stages: an industrial demonstrator, an engineering platform and a visual production system.",
      gazaState:"Independent demonstrator",gazaTitle:"Connected industrial operations.",
      gazaText:"Farm, lab, plant, warehouse and fleet in one simulation. Public data and assumptions remain distinct from the company's real operational data.",
      gazaDossier:"GAZA dossier",gazaDemo:"Open simulation",
      rhbState:"Local platform and web demo",rhbTitle:"From survey to documentation.",
      rhbText:"Project workflows for CAD, materials, budgets, fabrication and QA. The browser demo shows part of the local platform.",
      viewProject:"View project",openDemo:"Open demo",xxxiaState:"System in development",
      xxxiaTitle:"Visual production with provenance.",
      xxxiaText:"Organises references, briefs, storyboards, generation, review and archives; distinguishes verified sources from conceptual or generated material.",
      openConsole:"Open console",contactTitle:"Let's discuss the next project.",
      contactText:"Systems integration, project engineering and applied software.",
      email:"Send an email",fullCv:"Full CV (Spanish)",footer:"Built projects and demonstrations are identified in each case."
    },
    it: {
      skip:"Vai al contenuto",navDesign:"Progettazione e ingegneria",navSoftware:"Software e IA",contact:"Contatti",
      eyebrow:"Portfolio tecnico · 2026",headline:"Dagli spazi fisici ai sistemi che li fanno funzionare.",
      lead:"Progettazione, acustica, sistemi audiovisivi e automazione. Software e IA per collegare progetti, operazioni e persone.",
      explore:"Esplora i progetti",cv:"CV tecnico (spagnolo)",applied:"Ingegneria applicata",
      designKicker:"Spazi · sistemi · costruzione",
      designIntro:"Acustica, audio professionale, KNX/DALI, CAD, fabbricazione e integrazione di impianti. ATLAS riunisce i progetti spaziali in una città 3D navigabile.",
      atlasTitle:"Una città per esplorare ogni progetto.",
      atlasText:"Entra nella città, seleziona un edificio ed esamina modello, livelli e riferimenti. La città e le sue attività sono una presentazione concettuale.",
      openAtlas:"Apri ATLAS 3D",marLabel:"AV · acustica · KNX/DALI",alainLabel:"Cinema residenziale · acustica",
      softwareKicker:"Strumenti · operazioni · automazione",softwareTitle:"Ingegneria del software e IA",
      softwareIntro:"Tre linee di sviluppo in fasi diverse: un dimostratore industriale, una piattaforma di ingegneria e un sistema di produzione visiva.",
      gazaState:"Dimostratore indipendente",gazaTitle:"Operazioni industriali connesse.",
      gazaText:"Allevamento, laboratorio, stabilimento, magazzino e flotta in una simulazione. Dati pubblici e ipotesi restano distinti dai dati operativi reali dell'azienda.",
      gazaDossier:"Dossier GAZA",gazaDemo:"Apri simulazione",
      rhbState:"Piattaforma locale e demo web",rhbTitle:"Dal rilievo alla documentazione.",
      rhbText:"Flussi di progetto per CAD, materiali, preventivi, fabbricazione e QA. La demo nel browser mostra una parte della piattaforma locale.",
      viewProject:"Vedi progetto",openDemo:"Apri demo",xxxiaState:"Sistema in sviluppo",
      xxxiaTitle:"Produzione visiva con tracciabilità.",
      xxxiaText:"Organizza riferimenti, brief, storyboard, generazione, revisione e archivio; distingue le fonti verificate dai materiali concettuali o generati.",
      openConsole:"Apri console",contactTitle:"Parliamo del prossimo progetto.",
      contactText:"Integrazione tecnica, ingegneria di progetto e software applicato.",
      email:"Invia un'e-mail",fullCv:"CV completo (spagnolo)",footer:"I progetti reali e le dimostrazioni sono identificati in ogni scheda."
    }
  };
  const spanish = Object.fromEntries([...document.querySelectorAll("[data-t]")].map(el => [el.dataset.t, el.textContent]));
  const meta = document.querySelector('meta[name="description"]');
  const description = {
    es:meta.content,
    en:"Héctor Lobato: design and engineering, systems integration, software and applied artificial intelligence.",
    it:"Héctor Lobato: progettazione e ingegneria, integrazione tecnica, software e intelligenza artificiale applicata."
  };
  function select(lang) {
    if (!["es","en","it"].includes(lang)) lang = "es";
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(el => {
      const value = (translations[lang] || spanish)[el.dataset.t];
      if (value !== undefined) el.textContent = value;
    });
    document.querySelectorAll("[data-lang]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.lang === lang)));
    document.querySelector('[data-t="gazaDossier"]').href = "/apps/gaza/dossier-candidatura" + (lang === "es" ? "" : "-" + lang) + ".html";
    meta.content = description[lang];
    document.title = lang === "es" ? "Héctor Lobato · Diseño, ingeniería y software" : lang === "en" ? "Héctor Lobato · Design, engineering and software" : "Héctor Lobato · Progettazione, ingegneria e software";
    try { localStorage.setItem("hl-portfolio-language", lang); } catch {}
    const url = new URL(location.href);
    if (lang === "es") url.searchParams.delete("lang"); else url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);
  }
  const query = new URLSearchParams(location.search).get("lang");
  let remembered;
  try { remembered = localStorage.getItem("hl-portfolio-language"); } catch {}
  select(query || remembered || "es");
  document.querySelectorAll("[data-lang]").forEach(button => button.addEventListener("click", () => select(button.dataset.lang)));
})();
