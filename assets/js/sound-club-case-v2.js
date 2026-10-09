(()=>{
  const E=React.createElement;
  const {useEffect,useMemo,useRef,useState}=React;
  const MEDIA_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json';
  const STORY_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json';
  const MOTION_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/motion-manifest.json';
  const MODEL_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/model-manifest.json';
  const SOURCE_URL='../xxxia-studio/projects/sound-club-palma/05_metadata/source-ingest.json';
  const LOCAL_HOST=(location.hostname==='localhost'||location.hostname==='127.0.0.1');
  const LOCAL_CANDIDATE_RAW=LOCAL_HOST?new URLSearchParams(location.search).get('candidate'):null;
  const LOCAL_CANDIDATE_MODE=LOCAL_CANDIDATE_RAW==='1'?'v3':LOCAL_CANDIDATE_RAW;
  const LOCAL_CANDIDATE_CONFIG={
    v3:{
      src:'../assets/models/sound-club/_candidate/venue-web-v3.glb',
      report:'../assets/models/sound-club/_candidate/venue-web-v3.build-report.json',
      label:'LOCAL V3 · NUMERIC GATES PASSED · VISUAL QA',
      short:'V3'
    },
    v2:{
      src:'../assets/models/sound-club/_candidate/venue-web-v2.glb',
      report:'../assets/models/sound-club/_candidate/venue-web-v2.build-report.json',
      label:'LOCAL V2 · BOUNDS FAILED · REFERENCE ONLY',
      short:'V2'
    },
    master:{
      src:'../assets/models/sound-club/_candidate/venue-master.glb',
      report:'../assets/models/sound-club/_candidate/venue-master.qa.json',
      label:'LOCAL MASTER · 874 MB · SOURCE QA ONLY',
      short:'MASTER'
    }
  };
  const LOCAL_CANDIDATE=Boolean(LOCAL_HOST&&LOCAL_CANDIDATE_CONFIG[LOCAL_CANDIDATE_MODE]);
  const SECTIONS=['overview','media','spatial','render','phases','systems','audio','lighting','structure','dj','gallery','story','docs'];
  const STACK=['React 18','GSAP','ScrollTrigger','Scroll World','React Bits','Three.js'];
  const RENDER_MOLD_BASE='../assets/visuals/sound-club-renders/';
  const BUILD_MOLDS=[
    {
      id:'complete',code:'M01',label:'TODO COMPLETO',title:'Del volumen base al local terminado',
      summary:'Lectura general del proyecto sin cargar el GLB pesado: envolvente, planta, interior y fachada final.',
      stages:[
        ['01','MASSING / BASE','overall-massing.webp','Volumen arquitectónico y envolvente general.'],
        ['02','PLAN / LAYOUT','overall-plan.webp','Distribución, recorridos y organización espacial desde arriba.'],
        ['03','INTERIOR / FINAL','overall-interior-final.webp','Atmósfera interior con mobiliario, iluminación y cerramientos.'],
        ['04','EXTERIOR / FINAL','overall-exterior-final.webp','Fachada acristalada, terraza y relación interior/exterior.']
      ]
    },
    {
      id:'dj',code:'M02',label:'MESA DJ INTERIOR',title:'Estructura → integración → equipo → resultado',
      summary:'La cabina se presenta como objeto técnico fabricable, no como una sola imagen decorativa.',
      stages:[
        ['01','ESTRUCTURA / SERVICIOS','dj-structure-side.webp','Sección lateral con capas, fijaciones y pasos de servicio visibles.'],
        ['02','INTEGRACIÓN TÉCNICA','dj-structure-back.webp','Despiece posterior y lógica constructiva del mueble.'],
        ['03','EQUIPAMIENTO','dj-final-detail.webp','Platos, reproductores, mixer, lámparas de tarea y superficie de trabajo.'],
        ['04','RESULTADO','dj-final-overview.webp','Cabina completa integrada en el espacio y en la escena de iluminación.']
      ]
    },
    {
      id:'lighting',code:'M03',label:'ILUMINACIÓN',title:'Infraestructura → focos → escenas → atmósfera',
      summary:'Separar el sistema de iluminación del render general permite explicar carriles, luminarias, orientación y escena.',
      stages:[
        ['01','TECHO / CARRILES','lighting-ceiling.webp','Carriles, luminarias suspendidas y focos vistos como sistema.'],
        ['02','ESCENA / FINAL','lighting-final.webp','Resultado de la escena cálida con focos y colgantes encendidos.'],
        ['03','HOSPITALITY','overall-interior-final.webp','Relación entre luz ambiental, mobiliario y fachada acristalada.']
      ]
    },
    {
      id:'glass',code:'M04',label:'CRISTALES / ENVOLVENTE',title:'Cerramiento opaco ↔ vidrio activo',
      summary:'Este molde resuelve lo que el visor técnico no estaba mostrando: transparencia, reflexión y lectura del cerramiento.',
      stages:[
        ['01','CERRAMIENTO / OPACO','glass-closed.webp','Lectura con paneles/cortinas cerrados y menor transparencia.'],
        ['02','VIDRIO / ACTIVO','glass-open.webp','Cristal visible con transparencia y relación con el corredor exterior.'],
        ['03','FACHADA / REFLEJOS','exterior-glass-final.webp','Lectura exterior del vidrio con reflejos, interior y vegetación.']
      ]
    },
    {
      id:'lounge',code:'M05',label:'RESTAURANTE / LOUNGE',title:'Zonificación → mobiliario → ambiente final',
      summary:'La zona hospitality se entiende por capas: circulación, mesas/sofás, luminarias y ambiente nocturno.',
      stages:[
        ['01','ZONIFICACIÓN','overall-plan.webp','Posición relativa de lounge, barras, cabina y circulación.'],
        ['02','MOBILIARIO','lounge-final.webp','Sofás, mesas bajas, sillas y relaciones de escala.'],
        ['03','ATMÓSFERA','overall-interior-final.webp','Resultado conjunto de materiales, iluminación y vegetación exterior.']
      ]
    },
    {
      id:'exterior',code:'M06',label:'TERRAZA / EXTERIOR',title:'Envolvente → vegetación → vidrio → resultado',
      summary:'La terraza se presenta como una pieza propia: arquitectura, jardinería, cerramiento y luz exterior.',
      stages:[
        ['01','BASE / EDIFICIO','overall-massing.webp','Volumen y perímetro antes de leer la atmósfera final.'],
        ['02','PLANTACIÓN','exterior-planting-detail.webp','Jardineras y vegetación como filtro entre terraza y fachada.'],
        ['03','VIDRIO / INTERIOR','exterior-glass-final.webp','Fachada transparente con interior iluminado al fondo.'],
        ['04','RESULTADO EXTERIOR','overall-exterior-final.webp','Vista global final de la envolvente y terraza.']
      ]
    }
  ];

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
      if(!ready)return;
      const nodes=SECTIONS.map(id=>document.getElementById(id)).filter(Boolean);
      const io=new IntersectionObserver(entries=>{
        const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);
        if(visible[0])setActive(visible[0].target.id);
      },{rootMargin:'-18% 0px -62% 0px',threshold:[0,.08,.2,.4]});
      nodes.forEach(n=>io.observe(n));return()=>io.disconnect();
    },[ready]);
    return active;
  }

  function useMotion(ready){
    useEffect(()=>{
      if(!ready||!window.gsap||!window.ScrollTrigger)return;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx=gsap.context(()=>{
        gsap.utils.toArray('[data-ms-reveal]').forEach((el)=>{
          gsap.fromTo(el,{y:34,opacity:0},{y:0,opacity:1,duration:.9,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 86%',once:true}});
        });
        gsap.utils.toArray('[data-ms-parallax]').forEach((el)=>{
          gsap.fromTo(el,{yPercent:-4},{yPercent:4,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:.6}});
        });
        gsap.utils.toArray('[data-ms-depth]').forEach((el)=>{
          gsap.fromTo(el,{scale:1.06},{scale:1,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom 25%',scrub:.6}});
        });
      });
      return()=>ctx.revert();
    },[ready]);
  }

  function Pill({children}){return E('span',{className:'ms-pill'},children)}
  function Card({label,title,body,className=''}){return E('article',{'data-ms-reveal':'',className:'ms-card '+className},E('small',null,label),E('strong',null,title),body?E('p',null,body):null)}
  function Metric({value,label,note}){return E('article',{'data-ms-reveal':'',className:'ms-card ms-metric'},E('small',null,note),E('b',null,value),E('span',null,label))}

  function Figure({item,contain=false,caption,depth=false,className=''}) {
    if(!item)return E('div',{className:'ms-media-frame'},E('div',{className:'ms-boot'},'Media slot pending'));
    return E('figure',{className:'ms-media-frame '+(contain?'contain ':'')+className,'data-ms-reveal':'','data-ms-depth':depth?'':''},
      item.src?E('img',{src:item.src,alt:item.title,loading:'lazy',decoding:'async'}):null,
      E('figcaption',{className:'ms-media-cap'},E('b',null,item.title),E('span',null,caption||item.classification))
    );
  }

  function ChapterRail({active}){
    return E('aside',{className:'ms-rail'},
      E('div',{className:'ms-rail-brand'},'SOUND CLUB and restaurant',E('small',null,'(CLUB del MAR) Palma de Mallorca')),
      ...SECTIONS.map((id,i)=>E('a',{key:id,href:'#'+id,className:active===id?'active':''},
        E('span',null,String(i+1).padStart(2,'0')),E('b',null,id)
      ))
    );
  }

  function LogoLoop({items}){
    const row=[...items,...items];
    return E('div',{className:'ms-logo-loop','aria-label':'Tecnologías y fabricantes del proyecto'},
      E('div',{className:'ms-logo-track'},...row.map((x,i)=>E('span',{className:'ms-logo-mark',key:x+'-'+i},x)))
    );
  }

  function BounceGallery({items}){
    const ref=useRef(null);
    const cards=(items||[]).filter(Boolean).slice(0,5);
    useEffect(()=>{
      if(!ref.current||!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const els=[...ref.current.querySelectorAll('.ms-bounce-card')];
      const tween=gsap.fromTo(els,{y:72,opacity:0,scale:.88},{y:0,opacity:1,scale:1,duration:1.1,stagger:.09,ease:'elastic.out(1,.68)',scrollTrigger:{trigger:ref.current,start:'top 78%',once:true}});
      return()=>tween.kill();
    },[cards.length]);
    return E('section',{className:'ms-shell ms-section',id:'gallery'},
      E('div',{'data-ms-reveal':''},E('p',{className:'ms-kicker'},'11 / CURATED GALLERY'),E('h2',{className:'ms-title'},'Boards, plans and details.'),E('p',{className:'ms-subtitle'},'Galería React inspirada en Bounce Cards. Cada pieza conserva su clasificación de evidencia y solo usa activos publicSafe.')),
      E('div',{className:'ms-bounce-wrap',ref},...cards.map((item,i)=>{const c=(cards.length-1)/2;return E('figure',{className:'ms-bounce-card',key:item.id,style:{'--offset':((i-c)*78)+'px','--rot':((i-c)*4.5)+'deg'},tabIndex:0},
        E('img',{src:item.src,alt:item.title,loading:'lazy'}),
        E('figcaption',null,E('b',null,item.title),E('span',null,item.classification))
      )}))
    );
  }

  function CADBlueprintLayer(){
    const labelRef=useRef(null);
    useEffect(()=>{
      const root=document.documentElement;
      let raf=0,x=.5,y=.5;
      const paint=()=>{
        raf=0;
        root.style.setProperty('--cad-x',(x*100).toFixed(3)+'vw');
        root.style.setProperty('--cad-y',(y*100).toFixed(3)+'vh');
        root.style.setProperty('--cad-pan-x',((.5-x)*18).toFixed(2)+'px');
        root.style.setProperty('--cad-pan-y',((.5-y)*12).toFixed(2)+'px');
        if(labelRef.current)labelRef.current.textContent='REF X '+(x*100).toFixed(1)+' / Y '+(y*100).toFixed(1);
      };
      const move=e=>{x=Math.min(1,Math.max(0,e.clientX/Math.max(1,innerWidth)));y=Math.min(1,Math.max(0,e.clientY/Math.max(1,innerHeight)));if(!raf)raf=requestAnimationFrame(paint)};
      paint();addEventListener('pointermove',move,{passive:true});
      return()=>{removeEventListener('pointermove',move);if(raf)cancelAnimationFrame(raf)}
    },[]);
    return E('div',{className:'ms-cad-layer','aria-hidden':'true'},
      E('div',{className:'ms-cad-plan'}),
      E('i',{className:'ms-cad-axis ms-cad-axis-x'}),
      E('i',{className:'ms-cad-axis ms-cad-axis-y'}),
      E('i',{className:'ms-cad-cross'}),
      E('span',{className:'ms-cad-readout',ref:labelRef},'REF X 50.0 / Y 50.0'),
      E('span',{className:'ms-cad-source'},'DWG DERIVED PREVIEW · REFERENCE ONLY')
    );
  }


  function BuildMolds({mediaMap}){
    const [activeId,setActiveId]=useState(BUILD_MOLDS[0].id);
    const [stageIndex,setStageIndex]=useState(0);
    const mold=BUILD_MOLDS.find(x=>x.id===activeId)||BUILD_MOLDS[0];
    const stage=mold.stages[stageIndex]||mold.stages[0];
    const first=mold.stages[0],last=mold.stages[mold.stages.length-1];
    const choose=id=>{setActiveId(id);setStageIndex(0)};
    const src=name=>RENDER_MOLD_BASE+name;
    const fallbackFor=(moldId,index)=>{
      const ids={
        complete:['SC-BOARD-01','SC-PLAN-01','SC-BOARD-05','SC-BOARD-01'],
        dj:['SC-BOARD-04','SC-DETAIL-04','SC-BOARD-04','SC-BOARD-04'],
        lighting:['SC-DETAIL-07','SC-BOARD-05','SC-BOARD-05'],
        glass:['SC-BOARD-01','SC-BOARD-01','SC-BOARD-01'],
        lounge:['SC-PLAN-01','SC-BOARD-05','SC-BOARD-05'],
        exterior:['SC-BOARD-01','SC-BOARD-01','SC-BOARD-01','SC-BOARD-01']
      };
      const id=(ids[moldId]||[])[index]||'SC-BOARD-01';
      return mediaMap?.get(id)?.src||'../assets/visuals/sound-club-cad-blueprint.svg';
    };
    const imgProps=(name,alt,fallback)=>({src:src(name),alt,loading:'lazy',decoding:'async',onError:e=>{const im=e.currentTarget;if(im.dataset.fallbackDone)return;im.dataset.fallbackDone='1';im.src=fallback;}});
    return E('section',{className:'ms-shell ms-section ms-molds',id:'molds'},
      E('div',{className:'ms-decon-head','data-ms-reveal':''},
        E('div',null,
          E('p',{className:'ms-kicker'},'02 / BUILD MOLDS · PARTS OF THE PROJECT'),
          E('h2',{className:'ms-title'},'Construir el proyecto por piezas.')
        ),
        E('p',{className:'ms-subtitle'},'En lugar de pedir al navegador que renderice todo el SketchUp a la vez, cada molde cuenta una parte del proyecto con imágenes de referencia ligeras: base, construcción, sistemas y resultado. El 3D queda como herramienta técnica bajo demanda.')
      ),
      E('div',{className:'ms-mold-tabs'},...BUILD_MOLDS.map(x=>E('button',{type:'button',key:x.id,className:x.id===activeId?'active':'',onClick:()=>choose(x.id)},
        E('span',null,x.code),E('b',null,x.label)
      ))),
      E('div',{className:'ms-mold-layout'},
        E('div',{className:'ms-mold-stage'},
          E('img',{key:activeId+'-'+stageIndex,...imgProps(stage[2],mold.label+' · '+stage[1],fallbackFor(activeId,stageIndex)),loading:'eager'}),
          E('div',{className:'ms-mold-stamp'},E('b',null,mold.code+' · '+stage[0]+' / '+String(mold.stages.length).padStart(2,'0')),E('span',null,'USER-SUPPLIED RENDER · REFERENCE · NOT AS-BUILT'))
        ),
        E('aside',{className:'ms-mold-side'},
          E('p',{className:'ms-kicker'},mold.label),
          E('h3',null,mold.title),
          E('p',null,mold.summary),
          E('div',{className:'ms-mold-steps'},...mold.stages.map((s,i)=>E('button',{type:'button',key:s[0],className:i===stageIndex?'active':'',onClick:()=>setStageIndex(i)},
            E('span',null,s[0]),E('div',null,E('b',null,s[1]),E('small',null,s[3]))
          )))
        )
      ),
      E('div',{className:'ms-mold-compare'},
        E('figure',null,E('img',imgProps(first[2],mold.label+' antes',fallbackFor(activeId,0))),E('figcaption',null,E('b',null,'ANTES / BASE'),E('span',null,first[1]))),
        E('div',{className:'ms-mold-arrow','aria-hidden':'true'},'→'),
        E('figure',null,E('img',imgProps(last[2],mold.label+' después',fallbackFor(activeId,mold.stages.length-1))),E('figcaption',null,E('b',null,'DESPUÉS / RESULTADO'),E('span',null,last[1])))
      ),
      activeId==='exterior'?E('div',{className:'ms-mold-tech'},E('b',null,'TERRAZA · DATOS DEL DOSSIER'),E('span',null,'2 líneas en catenaria · 6 colgantes IP65 · 12 spots TW 48V · 2200–2300 K · regulación DMX')):null
    );
  }

  function MediaCarousel({title,kicker,items=[]}){
    const trackRef=useRef(null);
    const [index,setIndex]=useState(0);
    const cards=items.filter(Boolean);
    const go=delta=>{
      const track=trackRef.current;if(!track||!cards.length)return;
      const next=Math.max(0,Math.min(cards.length-1,index+delta));setIndex(next);
      track.children[next]?.scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'});
    };
    useEffect(()=>{
      const track=trackRef.current;if(!track)return;
      const onScroll=()=>{
        const children=[...track.children];if(!children.length)return;
        let best=0,dist=Infinity;
        children.forEach((el,i)=>{const d=Math.abs(el.offsetLeft-track.scrollLeft);if(d<dist){dist=d;best=i}});
        setIndex(best);
      };
      track.addEventListener('scroll',onScroll,{passive:true});
      return()=>track.removeEventListener('scroll',onScroll);
    },[cards.length]);
    if(!cards.length)return null;
    return E('section',{className:'ms-media-carousel'},
      E('header',{className:'ms-media-carousel-head'},
        E('div',null,E('p',{className:'ms-kicker'},kicker),E('h3',null,title)),
        E('div',{className:'ms-media-carousel-controls'},
          E('button',{type:'button',onClick:()=>go(-1),disabled:index===0,'aria-label':'Anterior'},'←'),
          E('span',null,String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0')),
          E('button',{type:'button',onClick:()=>go(1),disabled:index===cards.length-1,'aria-label':'Siguiente'},'→')
        )
      ),
      E('div',{className:'ms-media-carousel-track',ref:trackRef,tabIndex:0},
        ...cards.map(item=>E('figure',{className:'ms-media-carousel-card',key:item.id},
          E('img',{src:item.src,alt:item.title,loading:'lazy',decoding:'async'}),
          E('figcaption',null,E('b',null,item.title),E('span',null,item.classification||item.kind))
        ))
      )
    );
  }

  function ProjectMediaCarousels({mediaMap}){
    const byIds=ids=>ids.map(id=>mediaMap.get(id)).filter(Boolean);
    const renderRefs=[...mediaMap.values()].filter(x=>x.kind==='RENDER'||String(x.id).startsWith('SC-RENDER-'));
    return E('section',{className:'ms-shell ms-section ms-project-media',id:'media'},
      E('div',{className:'ms-decon-head','data-ms-reveal':''},
        E('div',null,E('p',{className:'ms-kicker'},'02 / PROJECT MEDIA · REACT CAROUSELS'),E('h2',{className:'ms-title'},'Renders, systems and details — separated.')),
        E('p',{className:'ms-subtitle'},'Cada familia visual vive en su carrusel. Así el proyecto carga rápido, se entiende por capas y puede crecer desde el manifest del repositorio sin rehacer la página.')
      ),
      E(MediaCarousel,{title:'Finished render references',kicker:'A / RENDERS',items:renderRefs}),
      E(MediaCarousel,{title:'Architecture & atmosphere',kicker:'B / OVERVIEW',items:byIds(['SC-BOARD-01','SC-BOARD-02','SC-BOARD-05'])}),
      E(MediaCarousel,{title:'DJ booth & fabrication',kicker:'C / OBJECTS',items:byIds(['SC-BOARD-04','SC-DETAIL-04','SC-DETAIL-07'])}),
      E(MediaCarousel,{title:'Systems, plans & control',kicker:'D / TECHNICAL',items:byIds(['SC-PLAN-01','SC-PLAN-02','SC-PLAN-03','SC-SYS-01'])})
    );
  }

  function SpatialExplorer({manifest,source}){
    const models=manifest?.models||[];
    const [active,setActive]=useState(models.find(x=>x.default)?.id||models[0]?.id||null);
    const [view,setView]=useState('design');
    const [load3D,setLoad3D]=useState(false);
    const stageRef=useRef(null);
    const runtimeRef=useRef(null);
    useEffect(()=>{if(!active&&models[0])setActive(models[0].id)},[models.length,active]);

    const model=models.find(x=>x.id===active)||models[0];
    const ready=Boolean(model?.status==='APPROVED'&&model?.src);
    const candidate=Boolean(model?.classification==='LOCAL_CANDIDATE_NOT_VERIFIED');
    const candidateLabel=model?.candidateLabel||'LOCAL CANDIDATE · NOT VERIFIED';
    const candidateMode=model?.candidateMode||null;
    const preview=model?.previewSrc||source?.skp?.derivedPreview||'../assets/visuals/sound-club-skp-line-preview.svg';

    useEffect(()=>{
      const host=stageRef.current;
      if(!host||!ready||!model?.src||!load3D)return;
      let disposed=false,raf=0,renderer=null,controls=null,ro=null;
      host.innerHTML='';

      Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/controls/OrbitControls.js')
      ]).then(([THREE,{GLTFLoader},{OrbitControls}])=>{
        if(disposed)return;

        const scene=new THREE.Scene();
        scene.background=new THREE.Color(0x07100e);
        const camera=new THREE.PerspectiveCamera(42,1,.01,500000);
        renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
        renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
        renderer.outputColorSpace=THREE.SRGBColorSpace;
        renderer.toneMapping=THREE.ACESFilmicToneMapping;
        host.appendChild(renderer.domElement);

        controls=new OrbitControls(camera,renderer.domElement);
        controls.enableDamping=true;controls.dampingFactor=.07;

        const hemi=new THREE.HemisphereLight(0xdce8e5,0x24302c,1.4);scene.add(hemi);
        const key=new THREE.DirectionalLight(0xffd39a,2.2);key.position.set(1,2,1);scene.add(key);
        const fill=new THREE.DirectionalLight(0x8fb9c2,1.0);fill.position.set(-1,.7,-1);scene.add(fill);
        const rim=new THREE.DirectionalLight(0xffbd75,.7);rim.position.set(-.5,1.2,1);scene.add(rim);

        const loader=new GLTFLoader();
        loader.load(model.src,gltf=>{
          if(disposed)return;
          const group=gltf.scene;
          group.name='SOUND_CLUB_MASTER';
          scene.add(group);

          const originalMaterials=new Map();
          const designMaterials=new Map();
          const edgeObjects=[];

          group.traverse(obj=>{
            if(!obj.isMesh)return;
            originalMaterials.set(obj.uuid,obj.material);
            const designMat=new THREE.MeshStandardMaterial({
              color:0x9ba7a1,
              roughness:.93,
              metalness:.03,
              side:THREE.DoubleSide
            });
            designMaterials.set(obj.uuid,designMat);
            const edges=new THREE.LineSegments(
              new THREE.EdgesGeometry(obj.geometry,28),
              new THREE.LineBasicMaterial({color:0xd6a467,transparent:true,opacity:.34})
            );
            edges.name='__DESIGN_EDGES__';
            edges.renderOrder=4;
            obj.add(edges);
            edgeObjects.push(edges);
          });

          const box=new THREE.Box3().setFromObject(group);
          const size=box.getSize(new THREE.Vector3());
          const center=box.getCenter(new THREE.Vector3());
          group.position.sub(center);
          const radius=Math.max(size.x,size.y,size.z)*.68||5000;
          camera.position.set(radius*1.15,radius*.76,radius*1.35);
          camera.near=Math.max(.1,radius/5000);
          camera.far=Math.max(10000,radius*30);
          camera.updateProjectionMatrix();
          controls.target.set(0,0,0);

          const applyView=mode=>{
            const isDesign=mode==='design';
            group.traverse(obj=>{
              if(!obj.isMesh)return;
              obj.material=isDesign?designMaterials.get(obj.uuid):originalMaterials.get(obj.uuid);
            });
            edgeObjects.forEach(e=>e.visible=isDesign);
            scene.background.setHex(isDesign?0x07100e:0x0b0b09);
            hemi.intensity=isDesign?1.7:.95;
            key.intensity=isDesign?1.25:2.75;
            fill.intensity=isDesign?.9:.55;
            rim.intensity=isDesign?.35:1.05;
            renderer.toneMappingExposure=isDesign?.82:1.12;
          };

          runtimeRef.current={scene,camera,group,applyView,view};
          applyView(view);
        },undefined,err=>{
          console.error('SpatialExplorer GLB',err);
          host.dataset.error='glb-load';
        });

        const resize=()=>{
          const w=host.clientWidth||1,h=host.clientHeight||1;
          renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
        };
        ro=new ResizeObserver(resize);ro.observe(host);resize();

        const loop=()=>{
          if(disposed)return;
          controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(loop);
        };
        loop();
      }).catch(err=>{console.error('SpatialExplorer',err);host.dataset.error='three-load'});

      return()=>{
        disposed=true;cancelAnimationFrame(raf);ro?.disconnect();controls?.dispose?.();renderer?.dispose?.();
        if(host)host.innerHTML='';runtimeRef.current=null;
      };
    },[model?.id,model?.src,ready,load3D]);

    useEffect(()=>{
      const rt=runtimeRef.current;if(!rt?.applyView)return;
      rt.applyView(view);rt.view=view;
    },[view]);

    const zones=model?.zones||[];
    return E('section',{className:'ms-shell ms-section',id:'spatial'},
      E('div',{className:'ms-spatial-head','data-ms-reveal':''},
        E('div',null,E('p',{className:'ms-kicker'},'03 / TECHNICAL 3D · ON DEMAND'),E('h2',{className:'ms-title'},'3D técnico, no render final.')),
        E('p',{className:'ms-subtitle'},'El GLB se conserva para inspección geométrica, escala y órbita. Ya no se carga automáticamente: los renders aportados mandan en materiales, vidrio e iluminación; el 3D se abre solo cuando hace falta comprobar geometría.')
      ),
      E('div',{className:'ms-spatial-toolbar'},
        E('div',{className:'ms-view-toggle'},
          E('button',{type:'button',className:view==='design'?'active':'',onClick:()=>setView('design'),'aria-pressed':view==='design'},'DESIGN',E('small',null,ready?'SAME GLB':'GLB PENDING')),
          E('button',{type:'button',className:view==='render'?'active':'',onClick:()=>setView('render'),'aria-pressed':view==='render'},'RENDER',E('small',null,ready?'SAME GLB':'GLB PENDING'))
        ),
        E('div',{className:'ms-source-strip'},
          E('span',null,'SKP '+(source?.skp?.version||'24.0.594')),
          E('span',null,'UNIT '+(source?.skp?.unit||'Meter')),
          E('span',null,(source?.skp?.materials||499)+' MATERIALS'),
          E('span',null,'DWG '+(source?.dwg?.dwgVersion||'AC1032')),candidate?E('span',{className:'ms-candidate-chip'},candidateLabel):null
        )
      ),
      E('div',{className:'ms-spatial-layout'},
        E('div',{className:'ms-spatial-stage','data-view':view,'data-ready':ready?'true':'false'},
          ready&&load3D?E('div',{className:'ms-three-host',ref:stageRef}):
            E(React.Fragment,null,
              E('img',{className:'ms-skp-preview',src:preview,alt:'Technical preview of the private SketchUp-derived model'}),
              E('div',{className:'ms-spatial-pending'},
                E('strong',null,ready?'3D TECHNICAL MODEL · MANUAL LOAD':'VERIFIED GLB PENDING'),
                E('span',null,model?.title||'Venue / Master Architecture'),
                ready?E('button',{type:'button',className:'ms-load-3d',onClick:()=>setLoad3D(true)},'CARGAR 3D TÉCNICO · ~70 MiB'):
                  E('small',null,'El SKP real está ingerido. Falta convertir y validar el GLB; no se sustituye por geometría ficticia.'),
                ready?E('small',null,'Para vidrio, materiales e iluminación usa los BUILD MOLDS de arriba; este visor queda para geometría y QA.'):null
              )
            ),
          E('div',{className:'ms-spatial-hud'},E('b',null,candidate?('LOCAL '+String(candidateMode||'QA').toUpperCase()+' QA · ORBIT / PAN / ZOOM'):'ORBIT / PAN / ZOOM'),E('span',null,ready?(candidate?(candidateLabel+' · do not promote yet'):(view==='design'?'Technical material + edges':'Original materials + warm light')):'Source preview · no fake geometry'))
        ),
        E('aside',{className:'ms-spatial-side'},
          E('p',{className:'ms-kicker'},'MODEL MAP'),
          ...zones.map(z=>E('button',{type:'button',key:z.id,disabled:z.status!=='READY',className:'ms-zone-link'},E('b',null,z.label),E('span',null,z.status==='READY'?'FOCUS':'COORDS PENDING'))),
          candidateMode==='v3'?E('div',{className:'ms-spatial-rule'},E('b',null,'V3 visual QA checklist'),E('p',null,'Revisar envolvente del local, techo, cortinas/acústica, DJ, luminarias, estructura suspendida, escala, clipping y ausencia de contexto remoto. Si todo coincide con el master privado, V3 pasa a integración.')):null,
          E('div',{className:'ms-spatial-rule'},E('b',null,'Geometry rule'),E('p',null,'Un único GLB manda. Blender puede mejorar materiales/luces, pero no cambiar la geometría autoritativa.'))
        )
      ),
      E('div',{className:'ms-model-list ms-model-list-spatial'},...models.map(x=>E('button',{type:'button',key:x.id,className:'ms-model-option '+(x.id===model?.id?'active':''),onClick:()=>{setActive(x.id);setView('design')}},
        E('small',null,x.role),E('b',null,x.title),E('span',null,x.status)
      )))
    );
  }

  function RenderComparison({afterItem,source}){
    const [mode,setMode]=useState('before');
    const beforeSrc=RENDER_MOLD_BASE+'overall-massing.webp';
    const afterSrc=RENDER_MOLD_BASE+'overall-interior-final.webp';
    const currentSrc=mode==='before'?beforeSrc:afterSrc;
    return E('section',{className:'ms-shell ms-section ms-render-compare',id:'render'},
      E('div',{className:'ms-decon-head','data-ms-reveal':''},
        E('div',null,
          E('p',{className:'ms-kicker'},'04 / BEFORE ↔ AFTER · RENDER EVIDENCE'),
          E('h2',{className:'ms-title'},'Build state → final render reference.')
        ),
        E('p',{className:'ms-subtitle'},'Comparador ligero basado en renders aportados. No intenta sustituir una comparación matched-camera: sirve para explicar el salto desde el volumen/base de proyecto hasta la atmósfera final sin cargar el modelo 3D completo.')
      ),
      E('div',{className:'ms-render-toolbar'},
        E('div',{className:'ms-view-toggle'},
          E('button',{type:'button',className:mode==='before'?'active':'',onClick:()=>setMode('before'),'aria-pressed':mode==='before'},'BEFORE',E('small',null,'BASE / MASSING')),
          E('button',{type:'button',className:mode==='after'?'active':'',onClick:()=>setMode('after'),'aria-pressed':mode==='after'},'AFTER',E('small',null,'USER RENDER'))
        ),
        E('div',{className:'ms-source-strip'},
          E('span',null,'MASTER '+(source?.skp?.masterFilename||'SKP PENDING')),
          E('span',null,'V-RAY '+(source?.skp?.vrayStatus==='MATERIAL_NAMING_DETECTED_RENDER_SETTINGS_NOT_YET_VERIFIED'?'MATERIALS DETECTED':'PENDING')),
          E('span',{className:'ms-candidate-chip'},'MATCHED CAMERA · OPTIONAL LATER')
        )
      ),
      E('div',{className:'ms-render-stage','data-mode':mode},
        currentSrc?E('img',{src:currentSrc,alt:mode==='before'?'Base render state for Sound Club project':'User-supplied final render reference for Sound Club project',loading:'lazy',decoding:'async',onError:e=>{const im=e.currentTarget;if(im.dataset.fallbackDone)return;im.dataset.fallbackDone='1';im.src=mode==='before'?'../assets/visuals/sound-club-cad-blueprint.svg':(afterItem?.src||'../assets/visuals/sound-club-cad-blueprint.svg');}}):null,
        !afterSrc&&mode==='after'?E('div',{className:'ms-render-empty'},'V-Ray export pending'):null,
        E('div',{className:'ms-render-stamp'},
          E('b',null,mode==='before'?'BEFORE · TECHNICAL SOURCE':'AFTER · USER-SUPPLIED RENDER'),
          E('span',null,mode==='before'?'Derived CAD / reference only':'Render de referencia aportado · no se etiqueta como as-built')
        )
      ),
      E('div',{className:'ms-render-foot'},
        E('article',null,E('small',null,'REGISTERED MASTER'),E('b',null,source?.skp?.masterFilename||'CLUB_DEL_MAR_12_02_2026_3.skp'),E('p',null,'Nuevo SketchUp master seleccionado para el proyecto; el SKP original permanece privado.')),
        E('article',null,E('small',null,'NEXT VISUAL GATE'),E('b',null,'Matched-camera V-Ray stills'),E('p',null,'Exportar BEFORE / AFTER con la misma cámara para convertir este comparador en una comparación geométrica directa.'))
      )
    );
  }

  function DevelopmentPhases(){
    const phases=[
      ['P01','EXISTING SPACE / SURVEY','Existing architecture, ceiling, circulation, access, services and physical constraints.'],
      ['P02','SPATIAL ZONING','Restaurant, bars, DJ, dance floor, VIP, exterior and technical positions.'],
      ['P03','ACOUSTIC + AUDIO STRATEGY','Coverage, LF strategy, zoning, vibration paths and isolation constraints.'],
      ['P04','LIGHTING + ATMOSPHERE','Decorative light, track spots, scene logic, dimming and night operation.'],
      ['P05','CONTROL ARCHITECTURE','DSP, KNX, DALI, Gira X1, presets, feedback and user interaction.'],
      ['P06','FABRICATION + INTEGRATION','DJ booth, technical furniture, suspended structure, cable routes and custom details.'],
      ['P07','PROGRAMMING + COMMISSIONING','DSP routing, presets, scenes, dimming, control verification and troubleshooting.'],
      ['P08','AS-BUILT + HANDOVER','Installed configuration, evidence, maintenance logic and future roadmap.']
    ];
    return E('section',{className:'ms-shell ms-section ms-phases',id:'phases'},
      E('div',{className:'ms-decon-head','data-ms-reveal':''},
        E('div',null,E('p',{className:'ms-kicker'},'05 / DEVELOPMENT PHASES'),E('h2',{className:'ms-title'},'From existing space to commissioned system.')),
        E('p',{className:'ms-subtitle'},'El proyecto se presenta como una secuencia de decisiones verificables: analizar, zonificar, diseñar, coordinar, fabricar, programar y entregar.')
      ),
      E('div',{className:'ms-phase-grid'},...phases.map((p,i)=>E('article',{className:'ms-phase',key:p[0],'data-ms-reveal':''},
        E('span',null,p[0]),E('small',null,String(i+1).padStart(2,'0')+' / 08'),E('h3',null,p[1]),E('p',null,p[2])
      )))
    );
  }

  function DisciplineMatrix(){
    const disciplines=[
      ['ARCH','Architecture / interior','Spatial organization, circulation, geometry and visual integration.'],
      ['AUD','Audio / electroacoustics','DSP matrix, amplification, loudspeaker zoning, presets and limit strategy.'],
      ['LGT','Lighting','Decorative DALI, track lighting, DJ strip, scene hierarchy and future DMX path.'],
      ['CTL','Automation / control','KNX, DALI, Gira X1, user interfaces, states, feedback and commissioning.'],
      ['ACO','Acoustic control','Isolation boundaries, vibration paths, suspension decoupling and treatment where documented.'],
      ['FAB','Fabrication','DJ booth, custom furniture, wood / metal work, structural supports and service access.'],
      ['NET','Serviceability','IP control, diagnostics, maintainability and expansion where documented.']
    ];
    return E('section',{className:'ms-shell ms-section ms-systems',id:'systems'},
      E('div',{className:'ms-decon-head','data-ms-reveal':''},
        E('div',null,E('p',{className:'ms-kicker'},'06 / SYSTEMS DECONSTRUCTION'),E('h2',{className:'ms-title'},'One space. Multiple coordinated layers.')),
        E('p',{className:'ms-subtitle'},'La lectura técnica no separa oficios: muestra cómo arquitectura, audio, iluminación, control, acústica y fabricación se afectan mutuamente.')
      ),
      E('div',{className:'ms-discipline-grid'},...disciplines.map((d,i)=>E('article',{className:'ms-discipline',key:d[0],'data-ms-reveal':''},
        E('span',{className:'ms-discipline-code'},d[0]),E('b',null,d[1]),E('p',null,d[2]),E('i',null,'LAYER '+String(i+1).padStart(2,'0'))
      )))
    );
  }

  function MotionStage({motion,media}){
    const videoRef=useRef(null);
    const approved=Boolean(motion?.master?.status==='APPROVED'&&motion?.master?.src);
    useEffect(()=>{
      if(!approved||!videoRef.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      const video=videoRef.current;let raf=0;
      const update=()=>{
        raf=0;const wrap=document.getElementById('story');if(!wrap||!video.duration)return;
        const rect=wrap.getBoundingClientRect();
        const total=Math.max(1,wrap.offsetHeight-innerHeight);
        const passed=Math.min(total,Math.max(0,-rect.top));
        const p=passed/total;const t=p*video.duration;
        if(Number.isFinite(t)&&Math.abs(video.currentTime-t)>.04)video.currentTime=t;
      };
      const onScroll=()=>{if(!raf)raf=requestAnimationFrame(update)};
      video.addEventListener('loadedmetadata',update);addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);update();
      return()=>{video.removeEventListener('loadedmetadata',update);removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);if(raf)cancelAnimationFrame(raf)};
    },[approved,motion?.master?.src]);
    if(approved)return E('video',{ref:videoRef,src:motion.master.src,poster:media?.src||'',muted:true,playsInline:true,preload:'metadata','aria-label':'SOUND CLUB and restaurant SC08 scroll motion master'});
    return media?.src?E('img',{key:media.id,src:media.src,alt:media.title,decoding:'async'}):null;
  }

  function Story({story,mediaMap,motion}){
    const [active,setActive]=useState(0);
    const stageRef=useRef(null);
    useEffect(()=>{
      const steps=[...document.querySelectorAll('[data-ms-story-step]')];
      const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)setActive(Number(e.target.dataset.msStoryStep));},{rootMargin:'-32% 0px -48% 0px',threshold:.01});
      steps.forEach(x=>io.observe(x));return()=>io.disconnect();
    },[story]);
    const scenes=story?.scenes||[];const scene=scenes[active]||scenes[0];const media=scene?mediaMap.get(scene.mediaId):null;
    return E('section',{className:'ms-section ms-story-wrap',id:'story'},
      E('div',{className:'ms-shell ms-story-shell'},
        E('div',{className:'ms-story-copy'},
          E('div',{className:'ms-story-intro','data-ms-reveal':''},E('p',{className:'ms-kicker'},'12 / SCROLL WORLD STORY'),E('h2',{className:'ms-title'},'Architecture → systems → as-built.'),E('p',{className:'ms-subtitle'},'Narrativa modular preparada para evolucionar a vídeo frame-locked de XXXIA sin cambiar la arquitectura React de la página.')),
          ...scenes.map((s,i)=>E('article',{key:s.mediaId+'-'+i,className:'ms-story-step '+(i===active?'active':''),'data-ms-story-step':i},
            E('span',{className:'ms-kicker'},s.kicker),E('h3',null,s.title),E('p',null,s.body),
            E('div',{className:'ms-story-tags'},...(s.tags||[]).map(t=>E('span',{key:t},t)))
          ))
        ),
        E('div',{className:'ms-story-stage',ref:stageRef},
          E('div',{className:'ms-story-frame '+(media?.kind==='PLAN'||media?.kind==='DETAIL'?'plan':''), 'data-ms-depth':'','data-motion-status':motion?.master?.status||'NONE'},
            E(MotionStage,{motion,media})
          ),
          E('div',{className:'ms-story-meta'},E('b',null,(motion?.master?.status==='APPROVED'?'SC08 · MOTION MASTER':'STILL FALLBACK · ')+(media?.id||'')+' · '+(media?.title||'')),
            E('div',{className:'ms-story-bars'},...scenes.map((_,i)=>E('i',{key:i,className:i===active?'active':''})))
          )
        )
      )
    );
  }

  function App(){
    const [media,setMedia]=useState(null),[story,setStory]=useState(null),[motion,setMotion]=useState(null),[models,setModels]=useState(null),[source,setSource]=useState(null),[error,setError]=useState('');
    const progress=useScrollProgress();const active=useActiveSection(Boolean(media&&story));
    useEffect(()=>{Promise.all([
      fetch(MEDIA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('media '+r.status);return r.json()}),
      fetch(STORY_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('story '+r.status);return r.json()}),
      fetch(MOTION_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(MODEL_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(SOURCE_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
    ]).then(([m,s,mo,md,src])=>{
      if(LOCAL_CANDIDATE&&md){
        md=JSON.parse(JSON.stringify(md));
        const master=(md.models||[]).find(x=>x.role==='ARCHITECTURE_MASTER');
        const cfg=LOCAL_CANDIDATE_CONFIG[LOCAL_CANDIDATE_MODE];
        if(master&&cfg){
          master.status='APPROVED';
          master.src=cfg.src;
          master.classification='LOCAL_CANDIDATE_NOT_VERIFIED';
          master.candidateMode=LOCAL_CANDIDATE_MODE;
          master.candidateLabel=cfg.label;
          master.candidateReport=cfg.report;
          master.title=(master.title||'Venue / Master Architecture')+' · LOCAL '+cfg.short;
          if(master.views){
            for(const key of ['design','render']){
              if(master.views[key]){master.views[key].status='READY';master.views[key].src=master.src;}
            }
          }
        }
      }
      setMedia(m);setStory(s);setMotion(mo);setModels(md);setSource(src)
    }).catch(e=>setError(String(e)))},[]);
    useMotion(Boolean(media&&story));

    const mediaMap=useMemo(()=>new Map((media?.items||[]).filter(x=>x.publicSafe).map(x=>[x.id,x])),[media]);
    if(error)return E('div',{className:'ms-error'},'No se pudo cargar el registro visual: '+error);
    if(!media||!story)return E('div',{className:'ms-boot'},'Loading SOUND CLUB and restaurant case study…');

    const hero=mediaMap.get('SC-BOARD-01'), audioPlan=mediaMap.get('SC-PLAN-02'), light=mediaMap.get('SC-BOARD-05'),
      suspension=mediaMap.get('SC-DETAIL-07'), dj=mediaMap.get('SC-BOARD-04'), djPlan=mediaMap.get('SC-DETAIL-04'), system=mediaMap.get('SC-SYS-01');

    const bounceItems=['SC-BOARD-01','SC-BOARD-02','SC-BOARD-04','SC-BOARD-05','SC-DETAIL-07'].map(id=>mediaMap.get(id)).filter(Boolean);
    window.__SOUND_CLUB_CASE__={version:'4.1',projectId:'SOUND_CLUB_CDM',publicAssets:mediaMap.size,storyScenes:story.scenes.length,activeSection:active,stack:STACK,motionStatus:motion?.master?.status||'NONE',motionId:motion?.motionId||null,models:models?.models?.length||0,modelReady:(models?.models||[]).filter(x=>x.status==='APPROVED'&&x.src).length,bounceCards:bounceItems.length,localCandidateMode:LOCAL_CANDIDATE_MODE||null,localCandidateSrc:LOCAL_CANDIDATE?LOCAL_CANDIDATE_CONFIG[LOCAL_CANDIDATE_MODE]?.src||null:null};

    return E(React.Fragment,null,
      E('div',{className:'ms-progress',style:{transform:'scaleX('+progress+')'}}),
      E(CADBlueprintLayer),
      E('header',{className:'ms-topbar'},E('div',{className:'ms-topbar-in'},
        E('a',{className:'ms-brand',href:'../index.html#projects'},'HL',E('small',null,'Systems / Architecture portfolio')),
        E('div',{className:'ms-stack'},...STACK.map(x=>E('span',{key:x},x))),
        E('nav',{className:'ms-toplinks'},E('a',{href:'#media'},'Media'),E('a',{href:'#spatial'},'3D'),E('a',{href:'#gallery'},'Gallery'),E('a',{href:'#docs'},'Docs'))
      )),
      E(ChapterRail,{active}),
      E('main',{className:'ms-page'},
        E('section',{className:'ms-hero'},
          E('div',{className:'ms-hero-media','data-ms-parallax':''},hero?.src?E('img',{src:hero.src,alt:'SOUND CLUB and restaurant architectural concept board'}):null),
          E('div',{className:'ms-hero-shade'}),
          E('div',{className:'ms-shell ms-hero-copy','data-ms-reveal':''},
            E('p',{className:'ms-kicker'},'ARCHITECTURE · AUDIO · LIGHTING · CONTROL · ACOUSTICS · FABRICATION'),
            E('h1',null,'SOUND CLUB and restaurant',E('span',null,'(CLUB del MAR) Palma de Mallorca')),
            E('p',{className:'ms-lead'},'Deconstruction of space, systems and execution. Del plano CAD a la geometría 3D, de las capas técnicas a la programación y del detalle constructivo a la experiencia final.'),
            E('div',{className:'ms-hero-meta'},...['Ecler MIMO88','Lynx GTX DSP','KNX + DALI','Gira X1','Custom fabrication','Commissioning'].map(x=>E(Pill,{key:x},x)))
          ),
          E('aside',{className:'ms-proof'},E('b',null,'PUBLIC EVIDENCE MODEL'),'Solo se muestran activos publicSafe. Fotos y vídeos originales permanecen como PRIVATE_REFERENCE_ONLY.')
        ),

        E('section',{className:'ms-shell ms-section',id:'overview'},
          E('div',{className:'ms-overview-head','data-ms-reveal':''},E('div',null,E('p',{className:'ms-kicker'},'01 / EXISTING SPACE · CAD DEPTH'),E('h2',{className:'ms-title'},'Read the space before adding systems.')),
            E('p',{className:'ms-subtitle'},'El dossier empieza por la geometría, las restricciones y la zonificación. Sobre esa base se superponen acústica, audio, iluminación, control, fabricación y commissioning como capas coordinadas.')),
          E('div',{className:'ms-grid ms-metrics'},
            E(Metric,{value:'326.23 m²',label:'Superficie interior aproximada',note:'documentado'}),
            E(Metric,{value:'137.08 m²',label:'Superficie exterior aproximada',note:'documentado'}),
            E(Metric,{value:'3.545 m',label:'Altura principal a techo',note:'documentado'}),
            E(Metric,{value:'Day → Night',label:'Hospitality / Club',note:'operación'})
          ),
          E('div',{className:'ms-evidence','data-ms-reveal':''},E('b',null,'MASTER PIPELINE'),'DWG + SKP → geometría verificada → planos → modelo web → exploded components → iluminación 2300 K → secuencias XXXIA → GitHub.')
        ),

        E(ProjectMediaCarousels,{mediaMap}),
        E(SpatialExplorer,{manifest:models,source}),
        E(RenderComparison,{afterItem:light,source}),
        E(DevelopmentPhases),
        E(DisciplineMatrix),

        E('section',{className:'ms-shell ms-section',id:'audio'},
          E('div',{className:'ms-split'},
            E('div',{'data-ms-reveal':''},E('p',{className:'ms-kicker'},'07 / AUDIO ARCHITECTURE'),E('h2',{className:'ms-title'},'Power, clarity and control.'),
              E('p',{className:'ms-subtitle'},'Matriz DSP central, amplificación dedicada y separación operacional Interior / Exterior, con presets Restaurante / Club y arquitectura preparada para limitación homologada por zona.'),
              E('div',{className:'ms-zone-row'},...['Interior','Exterior','Restaurant preset','Club preset'].map(x=>E('span',{className:'ms-zone',key:x},x)))
            ),
            E(Figure,{item:audioPlan,contain:true,caption:'GENERATED DIAGRAM · routing / counts'})
          ),
          E('div',{className:'ms-grid ms-audio-grid'},
            E(Card,{label:'DSP / MATRIX',title:'Ecler MIMO88',body:'Routing, zonas, presets, control de niveles e integración de limitación.'}),
            E(Card,{label:'INTERIOR TOPS',title:'8 × TSI Hexagon Top 12″',body:'Distribución perimetral y control DSP dedicado.'}),
            E(Card,{label:'INTERIOR SUBS',title:'8 × TSI Megatron Sub 18″',body:'4 + 4 entre barra principal y secundaria.'}),
            E(Card,{label:'AMPLIFICATION',title:'2 × Lynx GTX 5K DSP',body:'Tops interiores; un canal independiente por altavoz.'}),
            E(Card,{label:'AMPLIFICATION',title:'2 × Lynx GTX 14K DSP',body:'Subgraves interiores con procesamiento dedicado.'}),
            E(Card,{label:'EXTERIOR',title:'1 × Lynx GTX 14K DSP',body:'Sistema exterior independiente con tops y subs compactos.'})
          ),
          E(Figure,{item:system,contain:true,caption:'GENERATED SYSTEM VIEW · AV / control architecture',className:'ms-wide-figure'}),
          E(LogoLoop,{items:['ECLER','LYNX PRO AUDIO','TSI','GIRA','KNX','DALI']})
        ),

        E('section',{className:'ms-shell ms-section',id:'lighting'},
          E('div',{'data-ms-reveal':''},E('p',{className:'ms-kicker'},'08 / LIGHTING & CONTROL'),E('h2',{className:'ms-title'},'Atmosphere in every moment.'),E('p',{className:'ms-subtitle'},'Control central Gira X1, KNX + DALI, escenas hospitality/club, colgantes decorativos, spots de pista y previsión de ampliación DMX.')),
          E('div',{className:'ms-control-layout'},
            E('div',{className:'ms-control-list'},
              E(Card,{label:'SUPERVISION',title:'Gira X1',body:'Visualización y control centralizado.'}),
              E(Card,{label:'BUS',title:'KNX + DALI',body:'Escenas, regulación y pasarela de iluminación.'}),
              E(Card,{label:'DECORATIVE',title:'15 pendants',body:'Drivers DALI y zonificación hospitality.'}),
              E(Card,{label:'DANCE FLOOR',title:'20 track spots',body:'10 frente DJ + 10 zona VIP, en líneas reguladas.'}),
              E(Card,{label:'DJ STRIP',title:'24 V · DALI DT8',body:'Dimmer 5 × 5 A y fuente 300 W.'}),
              E(Card,{label:'ROADMAP',title:'DMX ready',body:'Infraestructura preparada para futura ampliación visual.'})
            ),
            E(Figure,{item:light,caption:'GENERATED CONCEPT · 2300K portfolio visualization',depth:true})
          )
        ),

        E('section',{className:'ms-shell ms-section ms-structure',id:'structure'},
          E('div',{className:'ms-split'},
            E('div',{'data-ms-reveal':''},E('p',{className:'ms-kicker'},'09 / SUSPENDED STRUCTURE · AS-BUILT'),E('h2',{className:'ms-title'},'Engineered for performance.'),
              E('p',{className:'ms-subtitle'},'La ejecución documentada utiliza suspensión elástica entre techo y estructura tubular. Se prioriza Ø48.3 mm frente al valor preliminar Ø63 mm; el CAD maestro cerrará la validación geométrica definitiva.'),
              E('div',{className:'ms-status'},E('i',null),'Ø48.3 mm · DOCUMENTED AS-BUILT PRIORITY')
            ),
            E(Figure,{item:suspension,contain:true,caption:'GENERATED DETAIL · based on documented installation'})
          ),
          E('div',{className:'ms-structure-grid'},
            E('div',{className:'ms-structure-notes'},
              E(Card,{label:'01',title:'Ceiling anchor / bridge plate',body:'Solución de fijación compatible con techo ondulado y anclaje M8/M10.'}),
              E(Card,{label:'02',title:'Spring isolator',body:'Elemento elástico para desacople vibratorio respecto al forjado.'}),
              E(Card,{label:'03',title:'Threaded rod + clamp',body:'Varilla roscada hacia abrazadera del tubo estructural.'}),
              E(Card,{label:'04',title:'Structural pipe Ø48.3 mm',body:'Tubo compatible con clamp 48–51 mm; acabado negro.'})
            ),
            E(Card,{label:'QA / CONFLICT RESOLUTION',title:'Ø63 mm = valor preliminar',body:'La memoria preliminar citaba Ø63 mm. El informe de instalación y la evidencia de obra soportan Ø48.3 mm hasta verificación CAD.'})
          )
        ),

        E('section',{className:'ms-shell ms-section',id:'dj'},
          E('div',{'data-ms-reveal':''},E('p',{className:'ms-kicker'},'10 / DJ BOOTH · TECHNICAL FURNITURE'),E('h2',{className:'ms-title'},'A central technical object.'),E('p',{className:'ms-subtitle'},'La cabina circular combina estructura, encimera, aislamiento vibratorio, acometidas, iluminación y servicio técnico. La geometría generada permanece separada de las cotas documentadas.')),
          E('div',{className:'ms-dj-grid'},
            E(Figure,{item:dj,caption:'GENERATED CONCEPT · not authoritative geometry',depth:true}),
            E('div',{className:'ms-dj-stack'},E(Figure,{item:djPlan,contain:true,caption:'DOCUMENTED DIMENSIONS · diagrammatic geometry'}),
              E(Card,{label:'DOCUMENTED BASE',title:'Ø2570 / Ø1200 / 990 / H1000 mm',body:'Exterior / hueco interior / acceso / altura nominal. Paso lateral documentado: 490 mm.'})
            )
          )
        ),

        E(BounceGallery,{items:bounceItems}),
        E(Story,{story,mediaMap,motion}),

        E('section',{className:'ms-shell ms-section',id:'docs'},
          E('div',{'data-ms-reveal':''},E('p',{className:'ms-kicker'},'13 / DOSSIER · SOURCE OF TRUTH'),E('h2',{className:'ms-title'},'Project documentation.'),E('p',{className:'ms-subtitle'},'La página pública consume metadatos versionados y mantiene separados los activos privados, la evidencia documental, los diagramas generados y la futura geometría verificada.')),
          E('div',{className:'ms-doc-grid'},
            E('a',{className:'ms-doc',href:'../docs/projects/sound-club-palma/README.md'},E('i',null,'DOSSIER'),E('b',null,'Technical dossier'),E('span',null,'Consolidated technical summary →')),
            E('a',{className:'ms-doc',href:'../docs/projects/sound-club-palma/CAD_INGEST_AUDIT.md'},E('i',null,'CAD QA'),E('b',null,'Geometry audit'),E('span',null,'Source identity, duplicates and master-promotion gate →')),
            E('a',{className:'ms-doc',href:'../xxxia-studio/projects/sound-club-palma/05_metadata/source-ingest.json'},E('i',null,'SOURCE INGEST'),E('b',null,'DWG + SKP master metadata'),E('span',null,'Version, units, hashes and GLB promotion gate →')),
            E('a',{className:'ms-doc',href:'../index.html#projects'},E('i',null,'PORTFOLIO'),E('b',null,'Selected projects'),E('span',null,'Return to the public portfolio →'))
          ),
          E('div',{className:'ms-motion'},
            E(Card,{label:'XXXIA / SC08',title:'Portfolio Scroll Master',body:'Motion brief preparado para una secuencia continua sobre geometría CAD/SKP verificada. No se publican los vídeos fuente originales.'}),
            E(Card,{label:'NEXT',title:'Verified geometry promotion',body:'DWG + SKP → alignment / units / origin QA → verified master → web model / exploded / frame-locked sequence.'})
          )
        ),
        E('footer',{className:'ms-shell ms-foot'},E('span',null,'© 2026 Héctor Lobato'),E('span',null,'SOUND CLUB and restaurant · (CLUB del MAR) Palma de Mallorca · CASE V3.1 · TECHNICAL DECONSTRUCTION'))
      )
    );
  }

  const root=document.getElementById('soundClubRoot');
  if(root)ReactDOM.createRoot(root).render(E(App));
})();