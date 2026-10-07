(()=>{
  const E=React.createElement;
  const {useEffect,useMemo,useRef,useState}=React;
  const PUBLIC_URL='../xxxia-studio/metadata/public-manifest.json';
  const MEDIA_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json';
  const MOTION_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/motion-manifest.json';
  const SECTIONS=['overview','pipeline','capabilities','case','motion','provenance','archive'];

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
      const nodes=SECTIONS.map(id=>document.getElementById(id)).filter(Boolean);
      const io=new IntersectionObserver(entries=>{
        const hit=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(hit)setActive(hit.target.id);
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
        gsap.utils.toArray('[data-xx-reveal]').forEach(el=>gsap.fromTo(el,{y:30,opacity:0},{y:0,opacity:1,duration:.85,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}}));
        gsap.utils.toArray('[data-xx-parallax]').forEach(el=>gsap.fromTo(el,{yPercent:-4},{yPercent:4,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.65}}));
      });
      return()=>ctx.revert();
    },[ready]);
  }

  function Rail({active}){
    return E('aside',{className:'xx-rail'},
      E('div',{className:'xx-rail-head'},'XXXIA',E('small',null,'visual production')),
      ...SECTIONS.map((id,i)=>E('a',{key:id,href:'#'+id,className:active===id?'active':''},E('span',null,String(i+1).padStart(2,'0')),E('b',null,id)))
    );
  }

  function Chip({children}){return E('span',{className:'xx-chip'},children)}

  function Capability({item,index}){
    return E('article',{className:'xx-cap','data-xx-reveal':''},
      E('span',{className:'xx-cap-no'},String(index+1).padStart(2,'0')),
      E('h3',null,item.title),
      E('p',null,item.summary)
    );
  }

  function LogoLoop(){
    const items=['REFERENCES','CAD / SKP','DIAGRAMS','STORYBOARD','IMAGE GEN','MOTION','REACT','SCROLL WORLD','GITHUB','QA / PROVENANCE'];
    const row=[...items,...items];
    return E('div',{className:'xx-logo-loop'},E('div',{className:'xx-logo-track'},...row.map((x,i)=>E('span',{key:x+'-'+i},x))));
  }

  function BounceGallery({items}){
    const ref=useRef(null);
    const cards=(items||[]).slice(0,5);
    useEffect(()=>{
      if(!ref.current||!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const els=[...ref.current.querySelectorAll('.xx-bounce-card')];
      const tw=gsap.fromTo(els,{y:65,opacity:0,scale:.9},{y:0,opacity:1,scale:1,duration:1.05,stagger:.08,ease:'elastic.out(1,.7)',scrollTrigger:{trigger:ref.current,start:'top 80%',once:true}});
      return()=>tw.kill();
    },[cards.length]);
    return E('div',{className:'xx-bounce',ref},...cards.map((x,i)=>{
      const center=(cards.length-1)/2;
      return E('figure',{className:'xx-bounce-card',style:{'--x':((i-center)*92)+'px','--r':((i-center)*4.8)+'deg'},key:x.id,tabIndex:0},
        E('img',{src:x.src,alt:x.title,loading:'lazy'}),
        E('figcaption',null,E('b',null,x.title),E('span',null,x.classification))
      );
    }));
  }

  function App(){
    const [studio,setStudio]=useState(null),[media,setMedia]=useState(null),[motion,setMotion]=useState(null),[error,setError]=useState('');
    const progress=useProgress();const active=useActive(Boolean(studio&&media));
    useEffect(()=>{
      Promise.all([
        fetch(PUBLIC_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('studio '+r.status);return r.json()}),
        fetch(MEDIA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('media '+r.status);return r.json()}),
        fetch(MOTION_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('motion '+r.status);return r.json()})
      ]).then(([s,m,mo])=>{setStudio(s);setMedia(m);setMotion(mo)}).catch(e=>setError(String(e)));
    },[]);
    useMotion(Boolean(studio&&media));
    const publicMedia=useMemo(()=>media?.items?.filter(x=>x.publicSafe)||[],[media]);
    const gallery=useMemo(()=>{
      const ids=['SC-BOARD-01','SC-BOARD-02','SC-BOARD-04','SC-BOARD-05','SC-DETAIL-07'];
      return ids.map(id=>publicMedia.find(x=>x.id===id)).filter(Boolean);
    },[publicMedia]);

    if(error)return E('div',{className:'xx-error'},error);
    if(!studio||!media||!motion)return E('div',{className:'xx-boot'},'Loading XXXIA STUDIO…');

    const counts=publicMedia.reduce((a,x)=>{a[x.kind]=(a[x.kind]||0)+1;return a},{});
    window.__XXXIA_PUBLIC_CASE__={
      schemaVersion:1,
      studioId:studio.studioId,
      publicAssets:publicMedia.length,
      boards:counts.BOARD||0,
      plans:counts.PLAN||0,
      details:counts.DETAIL||0,
      systems:counts.SYSTEM||0,
      motionSegments:motion.master?.segments?.length||0,
      motionStatus:motion.master?.status||'NONE',
      capabilities:studio.capabilities.length,
      gallery:gallery.length
    };

    return E(React.Fragment,null,
      E('div',{className:'xx-progress',style:{transform:'scaleX('+progress+')'}}),
      E('header',{className:'xx-topbar'},E('div',{className:'xx-topbar-in'},
        E('a',{className:'xx-brand',href:'../index.html#projects'},'XXXIA',E('small',null,'STUDIO')),
        E('span',{className:'xx-status'},'PUBLIC STUDIO CASE'),
        E('a',{className:'xx-back',href:'../index.html#projects'},'Portfolio ↗')
      )),
      E(Rail,{active}),
      E('main',{className:'xx-page'},
        E('section',{className:'xx-hero'},
          E('div',{className:'xx-shell xx-hero-grid'},
            E('div',{className:'xx-hero-code','data-xx-parallax':''},
              E('span',null,'X'),E('span',null,'X'),E('span',null,'X'),E('span',null,'I'),E('span',null,'A')
            ),
            E('div',{className:'xx-hero-copy','data-xx-reveal':''},
              E('p',{className:'xx-kicker'},'VISUAL PRODUCTION · TECHNICAL COMMUNICATION · MOTION'),
              E('h1',null,'XXXIA',E('span',null,'STUDIO')),
              E('p',{className:'xx-lead'},studio.mission),
              E('div',{className:'xx-chips'},...['DIAGRAMS','EXPLODED VIEWS','STORYBOARDS','MOTION','QA','PROVENANCE'].map(x=>E(Chip,{key:x},x))),
              E('p',{className:'xx-boundary'},'El estudio usa referencias privadas, datos técnicos y geometría verificada como inputs. Solo salen a público los activos aprobados o explícitamente publicSafe.')
            )
          )
        ),

        E('section',{className:'xx-shell xx-section',id:'overview'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'01 / STUDIO OVERVIEW'),E('h2',null,'Not an AI gallery. A production system.')),
            E('p',null,'XXXIA conserva intención, clasificación de evidencia, prompts, storyboard, versión y procedencia para que un activo visual pueda volver a generarse, revisarse o sustituirse sin perder el contexto del proyecto.')
          ),
          E('div',{className:'xx-facts'},
            E('article',null,E('small',null,'PIPELINE'),E('b',null,'7 stages'),E('span',null,'reference → embed')),
            E('article',null,E('small',null,'CURRENT CASE'),E('b',null,studio.selectedCase.title),E('span',null,'first structured public lot')),
            E('article',null,E('small',null,'PUBLIC MEDIA'),E('b',null,String(publicMedia.length)),E('span',null,'classified assets')),
            E('article',null,E('small',null,'MOTION'),E('b',null,motion.master.status.replaceAll('_',' ')),E('span',null,'SC08 master'))
          ),
          E(LogoLoop)
        ),

        E('section',{className:'xx-shell xx-section',id:'pipeline'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'02 / PIPELINE'),E('h2',null,'References become controlled outputs.')),
            E('p',null,'Cada fase tiene un contrato. El material fuente puede ser privado; eso no lo convierte en contenido publicable. La promoción ocurre después de QA y clasificación.')
          ),
          E('figure',{className:'xx-wide-visual','data-xx-reveal':''},E('img',{src:'../assets/visuals/xxxia-production-flow.svg',alt:'XXXIA visual production pipeline'}))
        ),

        E('section',{className:'xx-shell xx-section',id:'capabilities'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'03 / CAPABILITIES'),E('h2',null,'Visual language with engineering boundaries.')),
            E('p',null,'La capa creativa puede ser expresiva, pero no cambia la verdad técnica: un concepto sigue siendo concepto, un diagrama no se convierte en as-built y un render no sustituye una geometría verificada.')
          ),
          E('div',{className:'xx-cap-grid'},...studio.capabilities.map((x,i)=>E(Capability,{item:x,index:i,key:x.id})))
        ),

        E('section',{className:'xx-shell xx-section',id:'case'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'04 / SELECTED CASE'),E('h2',null,studio.selectedCase.title)),
            E('p',null,'Primer lote estructurado de XXXIA: boards conceptuales, diagramas técnicos, detalles y un master de motion preparado para activarse cuando la geometría CAD/SKP quede verificada.')
          ),
          E('div',{className:'xx-case-stats'},
            E('span',null,(counts.BOARD||0)+' BOARDS'),E('span',null,(counts.PLAN||0)+' PLANS'),E('span',null,(counts.DETAIL||0)+' DETAILS'),E('span',null,(counts.SYSTEM||0)+' SYSTEM')
          ),
          E(BounceGallery,{items:gallery}),
          E('div',{className:'xx-case-link','data-xx-reveal':''},E('a',{href:'mar-salada.html'},'Open MAR SALADA case ↗'))
        ),

        E('section',{className:'xx-shell xx-section',id:'motion'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'05 / MOTION SYSTEM'),E('h2',null,'SC08 · one master, ten technical beats.')),
            E('p',null,'El master está preparado como secuencia scroll-scrub de aproximadamente '+motion.master.targetDurationSeconds+' s. Sigue bloqueado hasta que la geometría autoritativa pase el gate de verificación.')
          ),
          E('div',{className:'xx-motion-head'},E('span',null,motion.master.id),E('b',null,motion.master.status.replaceAll('_',' ')),E('span',null,motion.master.aspectRatio+' · muted · scroll-scrub')),
          E('div',{className:'xx-timeline'},...motion.master.segments.map((seg,i)=>E('article',{key:seg.storyMediaId,'data-xx-reveal':''},
            E('small',null,String(i+1).padStart(2,'0')+' · '+seg.start+'–'+seg.end+' s'),E('b',null,seg.label),E('span',null,seg.storyMediaId)
          )))
        ),

        E('section',{className:'xx-shell xx-section',id:'provenance'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'06 / PROVENANCE'),E('h2',null,'Classification is part of the asset.')),
            E('p',null,'Cada archivo conserva qué es, de dónde viene y qué puede afirmar. La clasificación solo cambia si cambia la evidencia, no porque una imagen “parezca” más realista.')
          ),
          E('figure',{className:'xx-wide-visual','data-xx-reveal':''},E('img',{src:'../assets/visuals/xxxia-provenance.svg',alt:'XXXIA provenance classification model'}))
        ),

        E('section',{className:'xx-shell xx-section',id:'archive'},
          E('div',{className:'xx-section-head','data-xx-reveal':''},
            E('div',null,E('p',{className:'xx-kicker'},'07 / ARCHIVE / NEXT'),E('h2',null,'Versionable, replaceable, project-specific.')),
            E('p',null,'El archivo técnico conserva el contrato del output y permite sustituir el proveedor o regenerar una pieza sin romper la narrativa del proyecto.')
          ),
          E('div',{className:'xx-archive-grid'},
            E('article',null,E('small',null,'SOURCE'),E('b',null,'Private by default'),E('p',null,'Fotos, vídeos, CAD y referencias no se publican automáticamente.')),
            E('article',null,E('small',null,'PRODUCTION'),E('b',null,'Provider independent'),E('p',null,'El prompt, brief y contrato pertenecen al proyecto; el proveedor puede cambiar.')),
            E('article',null,E('small',null,'QA'),E('b',null,'Promotion gate'),E('p',null,'Consistencia visual, factual, clasificación y procedencia antes de publicar.')),
            E('article',null,E('small',null,'NEXT'),E('b',null,'Verified geometry'),E('p',null,'SC08 y los futuros exploded deberían derivar del master CAD/SKP verificado.'))
          )
        ),
        E('footer',{className:'xx-shell xx-footer'},E('span',null,'© 2026 Héctor Lobato'),E('span',null,'XXXIA STUDIO · PUBLIC CASE V1'))
      )
    );
  }

  const root=document.getElementById('xxxiaRoot');
  if(root)ReactDOM.createRoot(root).render(E(App));
})();