(()=>{
  const E=React.createElement;
  const {useEffect,useMemo,useState}=React;
  const MEDIA_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json';
  const STORY_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json';
  const SECTIONS=['overview','audio','lighting','structure','dj','story','docs'];

  function useScrollProgress(){
    const [p,setP]=useState(0);
    useEffect(()=>{
      let raf=0;
      const tick=()=>{raf=0;const d=document.documentElement;const max=Math.max(1,d.scrollHeight-innerHeight);setP(Math.min(1,Math.max(0,scrollY/max)));};
      const onScroll=()=>{if(!raf)raf=requestAnimationFrame(tick)};
      tick();addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
      return()=>{removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);if(raf)cancelAnimationFrame(raf)}
    },[]);
    return p;
  }

  function useActiveSection(ready){
    const [active,setActive]=useState('overview');
    useEffect(()=>{
      const nodes=SECTIONS.map(id=>document.getElementById(id)).filter(Boolean);
      const io=new IntersectionObserver(entries=>{
        const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(visible[0])setActive(visible[0].target.id);
      },{rootMargin:'-22% 0px -58% 0px',threshold:[0,.08,.2,.4]});
      nodes.forEach(n=>io.observe(n));return()=>io.disconnect();
    },[ready]);
    return active;
  }

  function Figure({item,contain=false,caption}){
    if(!item)return E('div',{className:'ms-media-frame'},E('div',{className:'ms-boot'},'Media slot pending'));
    return E('figure',{className:'ms-media-frame'+(contain?' contain':'')},
      item.src?E('img',{src:item.src,alt:item.title,loading:'lazy',decoding:'async'}):null,
      E('figcaption',{className:'ms-media-cap'},E('b',null,item.title),E('span',null,caption||item.classification))
    );
  }

  function Card({label,title,body,className=''}){return E('article',{className:'ms-card '+className},E('small',null,label),E('strong',null,title),body?E('p',null,body):null)}
  function Metric({value,label,note}){return E('article',{className:'ms-card ms-metric'},E('small',null,note),E('b',null,value),E('span',null,label))}

  function Story({story,mediaMap}){
    const [active,setActive]=useState(0);
    useEffect(()=>{
      const steps=[...document.querySelectorAll('[data-ms-story-step]')];
      const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)setActive(Number(e.target.dataset.msStoryStep));},{rootMargin:'-35% 0px -45% 0px',threshold:.01});
      steps.forEach(x=>io.observe(x));return()=>io.disconnect();
    },[story]);
    const scenes=story?.scenes||[];const scene=scenes[active]||scenes[0];const media=scene?mediaMap.get(scene.mediaId):null;
    return E('section',{className:'ms-section ms-story-wrap',id:'story'},
      E('div',{className:'ms-shell ms-story-shell'},
        E('div',{className:'ms-story-copy'},
          ...scenes.map((s,i)=>E('article',{key:s.mediaId+'-'+i,className:'ms-story-step '+(i===active?'active':''),'data-ms-story-step':i},
            E('span',{className:'ms-kicker'},s.kicker),E('h3',null,s.title),E('p',null,s.body),
            E('div',{className:'ms-story-tags'},...(s.tags||[]).map(t=>E('span',{key:t},t)))
          ))
        ),
        E('div',{className:'ms-story-stage'},
          E('div',{className:'ms-story-frame '+(media?.kind==='PLAN'||media?.kind==='DETAIL'?'plan':'')},
            media?.src?E('img',{key:media.id,src:media.src,alt:media.title,decoding:'async'}):null
          ),
          E('div',{className:'ms-story-meta'},E('b',null,media?.id+' · '+(media?.title||'')),
            E('div',{className:'ms-story-bars'},...scenes.map((_,i)=>E('i',{key:i,className:i===active?'active':''}))))
        )
      )
    );
  }

  function App(){
    const [media,setMedia]=useState(null),[story,setStory]=useState(null),[error,setError]=useState('');
    const progress=useScrollProgress();const active=useActiveSection(Boolean(media&&story));
    useEffect(()=>{Promise.all([
      fetch(MEDIA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('media '+r.status);return r.json()}),
      fetch(STORY_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('story '+r.status);return r.json()})
    ]).then(([m,s])=>{setMedia(m);setStory(s)}).catch(e=>setError(String(e)))},[]);
    const mediaMap=useMemo(()=>new Map((media?.items||[]).map(x=>[x.id,x])),[media]);
    if(error)return E('div',{className:'ms-error'},'No se pudo cargar el registro visual: '+error);
    if(!media||!story)return E('div',{className:'ms-boot'},'Loading MAR SALADA case study…');

    const hero=mediaMap.get('SC-BOARD-01'), audioPlan=mediaMap.get('SC-PLAN-02'), light=mediaMap.get('SC-BOARD-05'),
      suspension=mediaMap.get('SC-DETAIL-07'), dj=mediaMap.get('SC-BOARD-04'), djPlan=mediaMap.get('SC-DETAIL-04');

    window.__MAR_SALADA_CASE__={version:'1.0',projectId:'MAR_SALADA_CDM',publicAssets:media.items.filter(x=>x.publicSafe).length,storyScenes:story.scenes.length,activeSection:active};

    return E(React.Fragment,null,
      E('div',{className:'ms-progress',style:{transform:'scaleX('+progress+')'}}),
      E('header',{className:'ms-topbar'},E('div',{className:'ms-topbar-in'},
        E('a',{className:'ms-brand',href:'../index.html#projects'},'HL',E('small',null,'Project case study')),
        E('nav',{className:'ms-toplinks'},E('a',{href:'../index.html#projects'},'Projects'),E('a',{href:'sound-club-visuals.html'},'React Visuals'),E('a',{href:'../xxxia-studio/'},'XXXIA Studio'))
      )),
      E('aside',{className:'ms-rail'},E('div',{className:'ms-rail-brand'},'MAR SALADA'),
        ...SECTIONS.map((id,i)=>E('a',{key:id,href:'#'+id,className:active===id?'active':''},String(i+1).padStart(2,'0')+' '+id))
      ),
      E('main',{className:'ms-page'},
        E('section',{className:'ms-hero'},
          E('div',{className:'ms-hero-media'},hero?.src?E('img',{src:hero.src,alt:'MAR SALADA architectural concept board'}):null),
          E('div',{className:'ms-shell ms-hero-copy'},
            E('p',{className:'ms-kicker'},'AUDIO · LIGHTING · KNX/DALI · AS-BUILT'),
            E('h1',null,'MAR SALADA',E('span',null,'CLUB DEL MAR PALMA')),
            E('p',{className:'ms-lead'},'Integración multidisciplinar de audio profesional, iluminación, control, mobiliario técnico y desacople mecánico para un espacio hospitality / club de operación día-noche.'),
            E('div',{className:'ms-hero-meta'},...['Ecler MIMO88','Lynx GTX DSP','KNX + DALI','Gira X1','Custom fabrication','Commissioning'].map(x=>E('span',{className:'ms-pill',key:x},x)))
          ),
          E('aside',{className:'ms-proof'},E('b',null,'EVIDENCE MODEL'),'Visuales generados y diagramas se mantienen separados de la evidencia as-built. Los originales privados no se publican.')
        ),

        E('section',{className:'ms-shell ms-section',id:'overview'},
          E('div',{className:'ms-overview-head'},E('div',null,E('p',{className:'ms-kicker'},'01 / PROJECT OVERVIEW'),E('h2',{className:'ms-title'},'Space, function and atmosphere.')),
            E('p',{className:'ms-subtitle'},'El proyecto combina restaurante, lounge, DJ, pista y terraza con una arquitectura de sistemas común. El objetivo operativo es que audio, iluminación, automatización y control funcionen como una instalación única, documentable y mantenible.')),
          E('div',{className:'ms-grid ms-metrics'},
            E(Metric,{value:'326.23 m²',label:'Superficie interior aproximada',note:'documentado'}),
            E(Metric,{value:'137.08 m²',label:'Superficie exterior aproximada',note:'documentado'}),
            E(Metric,{value:'3.545 m',label:'Altura principal a techo',note:'documentado'}),
            E(Metric,{value:'Day → Night',label:'Hospitality / Club',note:'operación'})
          ),
          E('div',{className:'ms-evidence'},'Base documental consolidada V1.0. Geometría física definitiva: CAD/SKP maestro → verificación → planos → web model → exploded → XXXIA.')
        ),

        E('section',{className:'ms-shell ms-section',id:'audio'},
          E('div',{className:'ms-split'},
            E('div',null,E('p',{className:'ms-kicker'},'02 / AUDIO ARCHITECTURE'),E('h2',{className:'ms-title'},'Power, clarity and control.'),
              E('p',{className:'ms-subtitle'},'Matriz DSP central, amplificación dedicada por vía y separación operacional Interior / Exterior. El sistema está concebido para presets y limitación por zona.'),
              E('div',{className:'ms-zone-row'},...['Interior','Exterior','Restaurant preset','Club preset'].map(x=>E('span',{className:'ms-zone',key:x},x)))
            ),
            E(Figure,{item:audioPlan,contain:true,caption:'GENERATED DIAGRAM · routing / counts'})
          ),
          E('div',{className:'ms-grid ms-audio-grid'},
            E(Card,{label:'DSP / MATRIX',title:'Ecler MIMO88',body:'Routing, zonas, presets, control de niveles e integración de limitación.'}),
            E(Card,{label:'INTERIOR TOPS',title:'8 × TSI Hexagon Top 12″',body:'Distribución perimetral y control DSP dedicado.'}),
            E(Card,{label:'INTERIOR SUBS',title:'8 × TSI Megatron Sub 18″',body:'4 + 4 entre barra principal y secundaria.'}),
            E(Card,{label:'AMPLIFICATION',title:'2 × Lynx GTX 5K DSP',body:'Amplificación interior de tops; un canal por altavoz.'}),
            E(Card,{label:'AMPLIFICATION',title:'2 × Lynx GTX 14K DSP',body:'Amplificación interior de subgraves; procesamiento dedicado.'}),
            E(Card,{label:'EXTERIOR',title:'1 × Lynx GTX 14K DSP',body:'Sistema exterior independiente con tops y subgraves compactos.'})
          )
        ),

        E('section',{className:'ms-shell ms-section',id:'lighting'},
          E('p',{className:'ms-kicker'},'03 / LIGHTING & CONTROL'),E('h2',{className:'ms-title'},'Atmosphere in every moment.'),
          E('div',{className:'ms-control-layout'},
            E('div',{className:'ms-control-list'},
              E(Card,{label:'SUPERVISION',title:'Gira X1',body:'Visualización y control centralizado.'}),
              E(Card,{label:'BUS',title:'KNX + DALI',body:'Escenas, regulación y pasarela de iluminación.'}),
              E(Card,{label:'DECORATIVE',title:'15 pendants',body:'Drivers DALI y zonificación hospitality.'}),
              E(Card,{label:'DANCE FLOOR',title:'20 track spots',body:'10 frente DJ + 10 zona VIP, en líneas reguladas.'}),
              E(Card,{label:'DJ STRIP',title:'24 V · DALI DT8',body:'Dimmer 5 × 5 A y fuente 300 W.'}),
              E(Card,{label:'ROADMAP',title:'DMX ready',body:'Infraestructura preparada para futura ampliación visual.'})
            ),
            E(Figure,{item:light,caption:'GENERATED CONCEPT · 2300K portfolio visualization'})
          )
        ),

        E('section',{className:'ms-shell ms-section ms-structure',id:'structure'},
          E('div',{className:'ms-split'},E('div',null,E('p',{className:'ms-kicker'},'04 / SUSPENDED STRUCTURE · AS-BUILT'),E('h2',{className:'ms-title'},'Engineered for performance.'),
            E('p',{className:'ms-subtitle'},'La ejecución real utiliza suspensión elástica entre techo y estructura tubular para reducir transmisión mecánica. El dossier consolidado prioriza Ø48.3 mm frente al valor preliminar Ø63 mm.'),
            E('div',{style:{marginTop:'22px'}},E('span',{className:'ms-status'},E('i',null),'Ø48.3 mm · AS-BUILT DOCUMENTED'))
          ),E(Figure,{item:suspension,contain:true,caption:'GENERATED DETAIL · based on documented installation'})),
          E('div',{className:'ms-structure-grid'},
            E('div',{className:'ms-structure-notes'},
              E(Card,{label:'01',title:'Ceiling anchor / bridge plate',body:'Fijación al techo ondulado mediante solución puente y anclaje M8/M10 según soporte.'}),
              E(Card,{label:'02',title:'Spring isolator',body:'Elemento elástico para desacople vibratorio entre estructura y forjado.'}),
              E(Card,{label:'03',title:'Threaded rod + clamp',body:'Varilla roscada M8 hacia abrazadera del tubo estructural.'}),
              E(Card,{label:'04',title:'Structural pipe Ø48.3 mm',body:'Tubo real compatible con clamp de 48–51 mm; acabado negro.'})
            ),
            E(Card,{label:'QA / CONFLICT RESOLUTION',title:'Ø63 mm queda como valor preliminar',body:'La memoria preliminar citaba Ø63 mm. El informe de instalación y la evidencia de obra soportan Ø48.3 mm; el CAD maestro cerrará la validación geométrica definitiva.'})
          )
        ),

        E('section',{className:'ms-shell ms-section',id:'dj'},
          E('p',{className:'ms-kicker'},'05 / DJ BOOTH · TECHNICAL FURNITURE'),E('h2',{className:'ms-title'},'A central technical object.'),
          E('p',{className:'ms-subtitle'},'La cabina circular combina estructura, encimera, aislamiento vibratorio, acometidas, iluminación y servicio técnico. Las cotas documentadas se mantienen separadas de la geometría generada hasta cruzarlas con el DWG/SKP maestro.'),
          E('div',{className:'ms-dj-grid'},E(Figure,{item:dj,caption:'GENERATED CONCEPT · not authoritative geometry'}),
            E('div',{className:'ms-dj-stack'},E(Figure,{item:djPlan,contain:true,caption:'DOCUMENTED DIMENSIONS · diagrammatic geometry'}),
              E(Card,{label:'DOCUMENTED BASE',title:'Ø2570 / Ø1200 / 990 / H1000 mm',body:'Exterior / hueco interior / acceso / altura nominal. Integración técnica modular y mantenible.'})
            )
          )
        ),

        E(Story,{story,mediaMap}),

        E('section',{className:'ms-shell ms-section',id:'docs'},
          E('p',{className:'ms-kicker'},'07 / DOSSIER · SOURCE OF TRUTH'),E('h2',{className:'ms-title'},'Project documentation.'),
          E('p',{className:'ms-subtitle'},'La página pública lee un registro versionado. Los archivos fuente privados, vídeos originales y recoveries CAD no se publican.'),
          E('div',{className:'ms-doc-grid'},
            E('a',{className:'ms-doc',href:'sound-club-visuals.html'},E('i',null,'REACT'),E('b',null,'React Visuals'),E('span',null,'Media registry + provenance explorer →')),
            E('a',{className:'ms-doc',href:'../skills/mar-salada-project/PROJECT_STATE.md'},E('i',null,'STATE'),E('b',null,'Project State'),E('span',null,'Current technical / evidence status →')),
            E('a',{className:'ms-doc',href:'../skills/mar-salada-react-scroll/SKILL.md'},E('i',null,'SKILL'),E('b',null,'React Scroll Skill'),E('span',null,'Page operating contract →')),
            E('a',{className:'ms-doc',href:'../xxxia-studio/projects/sound-club-palma/'},E('i',null,'XXXIA'),E('b',null,'Visual Production'),E('span',null,'Boards, storyboards and motion briefs →'))
          ),
          E('div',{className:'ms-motion'},
            E('article',{className:'ms-card'},E('small',null,'XXXIA / SC08'),E('strong',null,'Portfolio Scroll Master'),E('p',null,'Motion brief preparado para evolucionar esta página a un scroll cinematográfico continuo cuando exista geometría CAD/SKP verificada. No se ha lanzado render de pago.'),
              E('ol',null,E('li',null,'Architecture / venue overview'),E('li',null,'Systems exploded'),E('li',null,'DJ booth exploded'),E('li',null,'Suspension / decoupling detail'),E('li',null,'KNX/DALI + audio convergence'))),
            E('article',{className:'ms-card'},E('small',null,'PIPELINE'),E('strong',null,'CAD/SKP master → GitHub'),E('p',null,'La fuente maestra será geometría verificada; de ella se derivarán planos, modelo web, exploded components, iluminación 2300 K y secuencias XXXIA. Los originales audiovisuales permanecen fuera de GitHub.'))
          )
        ),
        E('footer',{className:'ms-shell ms-foot'},E('span',null,'© 2026 Héctor Lobato'),E('span',null,'MAR SALADA · CLUB DEL MAR PALMA · CASE V1.0'))
      )
    );
  }
  const root=document.getElementById('marSaladaRoot');if(root)ReactDOM.createRoot(root).render(E(App));
})();