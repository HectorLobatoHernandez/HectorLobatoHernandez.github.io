(()=>{
  const E=React.createElement;
  const {useEffect,useMemo,useRef,useState}=React;
  const PROJECT_URL='../rhb-studio/metadata/project-manifest.json';
  const MODEL_URL='../rhb-studio/metadata/model-manifest.json';
  const SECTIONS=['overview','workflow','modules','routing','fabrication','models','roadmap'];

  function useProgress(){
    const [p,setP]=useState(0);
    useEffect(()=>{
      let raf=0;
      const update=()=>{raf=0;const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);setP(Math.min(1,Math.max(0,scrollY/max)));};
      const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update)};
      update();addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
      return()=>{removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);if(raf)cancelAnimationFrame(raf)}
    },[]);
    return p;
  }

  function useActive(ready){
    const [active,setActive]=useState('overview');
    useEffect(()=>{
      if(!ready)return;
      const nodes=SECTIONS.map(x=>document.getElementById(x)).filter(Boolean);
      const io=new IntersectionObserver(entries=>{
        const v=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(v[0])setActive(v[0].target.id);
      },{rootMargin:'-18% 0px -68% 0px',threshold:[0,.08,.25]});
      nodes.forEach(n=>io.observe(n));return()=>io.disconnect();
    },[ready]);
    return active;
  }

  function useMotion(ready){
    useEffect(()=>{
      if(!ready||!window.gsap||!window.ScrollTrigger||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx=gsap.context(()=>{
        gsap.utils.toArray('[data-rhb-reveal]').forEach(el=>gsap.fromTo(el,{y:28,opacity:0},{y:0,opacity:1,duration:.85,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 87%',once:true}}));
        gsap.utils.toArray('[data-rhb-parallax]').forEach(el=>gsap.fromTo(el,{yPercent:-3},{yPercent:3,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.65}}));
      });
      return()=>ctx.revert();
    },[ready]);
  }

  function Rail({active}){
    return E('aside',{className:'rhb-rail'},
      E('div',{className:'rhb-rail-head'},'RHB STUDIO',E('small',null,'engineering platform')),
      ...SECTIONS.map((id,i)=>E('a',{key:id,href:'#'+id,className:active===id?'active':''},E('span',null,String(i+1).padStart(2,'0')),E('b',null,id)))
    );
  }

  function Badge({children}){return E('span',{className:'rhb-badge'},children)}
  function ModuleCard({item,index}){
    return E('article',{className:'rhb-card','data-rhb-reveal':''},
      E('div',{className:'rhb-card-index'},String(index+1).padStart(2,'0')),
      E('small',null,item.status.replaceAll('_',' ')),
      E('h3',null,item.title),
      E('p',null,item.summary)
    );
  }

  function LogoLoop({items}){
    const row=[...items,...items];
    return E('div',{className:'rhb-logo-loop','aria-label':'RHB STUDIO technology stack'},
      E('div',{className:'rhb-logo-track'},...row.map((x,i)=>E('span',{key:x+'-'+i},x)))
    );
  }

  function BounceGallery(){
    const ref=useRef(null);
    const items=[
      {id:'workflow',src:'../assets/visuals/rhb-studio-workflow.svg',title:'Project lifecycle',tag:'SYSTEM'},
      {id:'routing',src:'../assets/visuals/rhb-agent-routing.svg',title:'Local orchestration',tag:'ARCHITECTURE'},
      {id:'gate',src:'../assets/visuals/rhb-gate-case.svg',title:'Sliding gate reference',tag:'FABRICATION'},
      {id:'table',src:'../assets/visuals/rhb-table-case.svg',title:'Glass table base',tag:'FABRICATION'}
    ];
    useEffect(()=>{
      if(!ref.current||!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const els=[...ref.current.querySelectorAll('.rhb-bounce-card')];
      const tw=gsap.fromTo(els,{y:55,opacity:0,scale:.9},{y:0,opacity:1,scale:1,duration:1,stagger:.08,ease:'elastic.out(1,.68)',scrollTrigger:{trigger:ref.current,start:'top 82%',once:true}});
      return()=>tw.kill();
    },[]);
    return E('div',{className:'rhb-bounce',ref},...items.map((x,i)=>{
      const center=(items.length-1)/2;
      return E('figure',{key:x.id,className:'rhb-bounce-card',style:{'--x':((i-center)*104)+'px','--r':((i-center)*4.2)+'deg'},tabIndex:0},
        E('img',{src:x.src,alt:x.title,loading:'lazy'}),
        E('figcaption',null,E('b',null,x.title),E('span',null,x.tag))
      );
    }));
  }

  function ModelViewer({manifest}){
    const models=manifest?.models||[];
    const [active,setActive]=useState(models.find(x=>x.default)?.id||models[0]?.id||null);
    useEffect(()=>{if(!active&&models[0])setActive(models[0].id)},[models.length,active]);
    const model=models.find(x=>x.id===active)||models[0];
    const ready=Boolean(model?.status==='APPROVED'&&model?.src);
    useEffect(()=>{
      if(!ready||customElements.get('model-viewer'))return;
      import('https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js').catch(()=>{});
    },[ready]);
    return E('section',{className:'rhb-shell rhb-section',id:'models'},
      E('div',{className:'rhb-section-head','data-rhb-reveal':''},
        E('div',null,E('p',{className:'rhb-kicker'},'06 / MODEL VIEWER'),E('h2',null,'CAD-derived objects, not decorative 3D.')),
        E('p',null,'Los modelos web se activan solo después de verificar la geometría y exportarla a GLB/glTF. Los archivos CAD/SKP originales permanecen fuera de la superficie pública.')
      ),
      E('div',{className:'rhb-model-layout'},
        E('div',{className:'rhb-model-stage','data-model-status':model?.status||'NONE'},
          ready?E('model-viewer',{src:model.src,poster:model.poster||'',alt:model.title,'camera-controls':'','auto-rotate':'','shadow-intensity':'1'}):
          E(React.Fragment,null,
            model?.poster?E('img',{src:model.poster,alt:model.title}):null,
            E('div',{className:'rhb-model-pending'},E('strong',null,'MODEL PENDING VERIFIED GLB'),E('h3',null,model?.title||'Geometry pending'),E('p',null,model?.sourceIntent||''))
          )
        ),
        E('div',{className:'rhb-model-list'},...models.map(x=>E('button',{key:x.id,type:'button',onClick:()=>setActive(x.id),className:'rhb-model-option '+(x.id===model?.id?'active':'')},
          E('small',null,x.role),E('b',null,x.title),E('span',null,x.status)
        )))
      )
    );
  }

  function App(){
    const [project,setProject]=useState(null),[models,setModels]=useState(null),[error,setError]=useState('');
    const progress=useProgress();const active=useActive(Boolean(project));
    useEffect(()=>{
      Promise.all([
        fetch(PROJECT_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('project '+r.status);return r.json()}),
        fetch(MODEL_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('models '+r.status);return r.json()})
      ]).then(([p,m])=>{setProject(p);setModels(m)}).catch(e=>setError(String(e)));
    },[]);
    useMotion(Boolean(project));
    if(error)return E('div',{className:'rhb-error'},error);
    if(!project)return E('div',{className:'rhb-boot'},'Loading RHB STUDIO…');

    const readyModels=(models?.models||[]).filter(x=>x.status==='APPROVED'&&x.src).length;
    window.__RHB_STUDIO_CASE__={schemaVersion:1,projectId:project.projectId,modules:project.modules.length,models:(models?.models||[]).length,modelReady:readyModels,referenceProjects:project.referenceProjects.length,publicShowcase:project.classification==='PUBLIC_SHOWCASE'};

    return E(React.Fragment,null,
      E('div',{className:'rhb-progress',style:{transform:'scaleX('+progress+')'}}),
      E('header',{className:'rhb-topbar'},E('div',{className:'rhb-topbar-in'},
        E('a',{href:'../index.html#projects',className:'rhb-mini-brand'},E('img',{src:'../assets/visuals/rhb-monogram.svg',alt:''}),E('span',null,'RHB STUDIO')),
        E('div',{className:'rhb-top-status'},E('i',null),'PUBLIC SHOWCASE · LOCAL RUNTIME'),
        E('a',{className:'rhb-back',href:'../index.html#projects'},'Portfolio ↗')
      )),
      E(Rail,{active}),
      E('main',{className:'rhb-page'},
        E('section',{className:'rhb-hero'},
          E('div',{className:'rhb-hero-grid rhb-shell'},
            E('div',{className:'rhb-logo-field','data-rhb-parallax':''},E('img',{src:'../assets/visuals/rhb-monogram.svg',alt:'RHB geometric monogram'})),
            E('div',{className:'rhb-hero-copy','data-rhb-reveal':''},
              E('p',{className:'rhb-kicker'},'ENGINEERING · FABRICATION · CAD · AI OPERATIONS'),
              E('h1',null,'RHB',E('span',null,'STUDIO')),
              E('p',{className:'rhb-hero-lead'},'Una plataforma local-first para convertir proyectos técnicos en un flujo trazable: levantamiento, CAD, diseño, BOM, presupuesto, fabricación, montaje, QA y entrega.'),
              E('div',{className:'rhb-badges'},...['PROJECT CORE','PHOTO → CAD','FABRICATION','AGENT ROUTING','DOCUMENTATION','HEALTH / OPS'].map(x=>E(Badge,{key:x},x))),
              E('p',{className:'rhb-boundary'},'La web muestra arquitectura y resultados publicables. Credenciales, rutas locales, secretos y datos privados permanecen fuera del showcase.')
            )
          )
        ),

        E('section',{className:'rhb-shell rhb-section',id:'overview'},
          E('div',{className:'rhb-section-head','data-rhb-reveal':''},
            E('div',null,E('p',{className:'rhb-kicker'},'01 / SYSTEM OVERVIEW'),E('h2',null,'One project state. Many specialist tools.')),
            E('p',null,'RHB STUDIO no pretende sustituir todas las aplicaciones. Mantiene contexto, decisiones, versiones y entregables mientras enruta cada tarea hacia la herramienta o agente adecuado.')
          ),
          E('div',{className:'rhb-facts'},
            E('article',null,E('small',null,'BASE'),E('b',null,'Zamora'),E('span',null,'engineering + fabrication')),
            E('article',null,E('small',null,'ARCHITECTURE'),E('b',null,'Local-first'),E('span',null,'modular / auditable')),
            E('article',null,E('small',null,'CONTROL'),E('b',null,'Human approval'),E('span',null,'technical gates')),
            E('article',null,E('small',null,'PUBLIC'),E('b',null,'Showcase only'),E('span',null,'runtime remains local'))
          ),
          E(LogoLoop,{items:project.stack})
        ),

        E('section',{className:'rhb-shell rhb-section',id:'workflow'},
          E('div',{className:'rhb-section-head','data-rhb-reveal':''},
            E('div',null,E('p',{className:'rhb-kicker'},'02 / PROJECT LIFECYCLE'),E('h2',null,'From survey to handover.')),
            E('p',null,'El sistema se organiza alrededor del ciclo técnico real, no alrededor de una colección de apps. Cada transición deja estado, evidencia y una decisión revisable.')
          ),
          E('figure',{className:'rhb-wide-visual','data-rhb-reveal':''},E('img',{src:'../assets/visuals/rhb-studio-workflow.svg',alt:'RHB STUDIO project lifecycle'}))
        ),

        E('section',{className:'rhb-shell rhb-section',id:'modules'},
          E('div',{className:'rhb-section-head','data-rhb-reveal':''},
            E('div',null,E('p',{className:'rhb-kicker'},'03 / MODULES'),E('h2',null,'The platform is a set of replaceable subsystems.')),
            E('p',null,'Cada módulo puede evolucionar sin romper el resto del flujo. El dato persistente es el proyecto: estado, geometría, decisiones, costes, evidencias y entregables.')
          ),
          E('div',{className:'rhb-module-grid'},...project.modules.map((x,i)=>E(ModuleCard,{item:x,index:i,key:x.id})))
        ),

        E('section',{className:'rhb-shell rhb-section',id:'routing'},
          E('div',{className:'rhb-routing-grid'},
            E('div',{'data-rhb-reveal':''},E('p',{className:'rhb-kicker'},'04 / LOCAL ORCHESTRATION'),E('h2',null,'Route the work. Keep the context.'),E('p',null,'OmniRoute actúa como capa de routing; OpenClaw organiza agentes y workspaces; NEXO aporta observabilidad y estado. La arquitectura pública omite deliberadamente credenciales, puertos y rutas locales.')),
            E('figure',{className:'rhb-routing-visual','data-rhb-reveal':''},E('img',{src:'../assets/visuals/rhb-agent-routing.svg',alt:'RHB STUDIO orchestration diagram'}))
          )
        ),

        E('section',{className:'rhb-shell rhb-section',id:'fabrication'},
          E('div',{className:'rhb-section-head','data-rhb-reveal':''},
            E('div',null,E('p',{className:'rhb-kicker'},'05 / FABRICATION REFERENCES'),E('h2',null,'Physical projects become structured data.')),
            E('p',null,'Dos ejemplos de referencia muestran la intención del sistema: pasar de brief y levantamiento a geometría verificada, fabricación, presupuesto, montaje y documentación.')
          ),
          E(BounceGallery),
          E('div',{className:'rhb-reference-grid'},
            ...project.referenceProjects.map((x,i)=>E('article',{key:x.id,'data-rhb-reveal':''},E('small',null,x.id),E('h3',null,x.title),E('p',null,i===0?'Puerta corredera con peatonal integrada, automatización, seguridad y opciones de iluminación. La geometría pública sigue siendo esquemática hasta verificar CAD.':'Base metálica para cristal 1400 × 800 mm y altura objetivo 750 mm. El brief está documentado; el despiece final requiere plano de fabricación validado.'),E('span',null,x.status.replaceAll('_',' '))))
          )
        ),

        E(ModelViewer,{manifest:models}),

        E('section',{className:'rhb-shell rhb-section',id:'roadmap'},
          E('div',{className:'rhb-section-head','data-rhb-reveal':''},
            E('div',null,E('p',{className:'rhb-kicker'},'07 / ROADMAP'),E('h2',null,'Promote only what is verified.')),
            E('p',null,'La siguiente fase pública se apoyará en geometría CAD/SKP verificada, modelos GLB, proyectos reales y documentación de fabricación. El runtime local continuará separado del portfolio.')
          ),
          E('div',{className:'rhb-roadmap'},
            E('article',null,E('small',null,'NOW'),E('b',null,'Architecture / project state'),E('p',null,'Rutas, módulos, proyectos de referencia y fronteras de información.')),
            E('article',null,E('small',null,'NEXT'),E('b',null,'Verified CAD / GLB'),E('p',null,'Puerta, mesa y componentes fabricados con Model Viewer.')),
            E('article',null,E('small',null,'THEN'),E('b',null,'Project automation'),E('p',null,'BOM, presupuesto, documentación y visuales derivados del mismo source of truth.')),
            E('article',null,E('small',null,'GATE'),E('b',null,'QA before promotion'),E('p',null,'No se etiqueta como ejecutado o verificado lo que siga siendo conceptual.'))
          )
        ),
        E('footer',{className:'rhb-shell rhb-footer'},E('span',null,'© 2026 Héctor Lobato'),E('span',null,'RHB STUDIO · PUBLIC CASE V1'))
      )
    );
  }

  const root=document.getElementById('rhbRoot');
  if(root)ReactDOM.createRoot(root).render(E(App));
})();