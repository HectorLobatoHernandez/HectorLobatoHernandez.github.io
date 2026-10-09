(()=>{
  const E=React.createElement;
  const {useEffect,useMemo,useRef,useState}=React;
  const REGISTRY='../assets/data/project-registry.json';

  function useRegistry(){
    const [data,setData]=useState(null);
    const [error,setError]=useState('');
    useEffect(()=>{
      fetch(REGISTRY,{cache:'no-store'})
        .then(r=>{if(!r.ok)throw new Error('registry '+r.status);return r.json()})
        .then(setData)
        .catch(e=>setError(String(e)));
    },[]);
    return {data,error};
  }

  function ProjectCard({project}){
    return E('article',{className:'ph-card'},
      E('a',{className:'ph-card-media',href:project.caseHref},
        E('img',{src:project.cover,alt:project.title,loading:'lazy',decoding:'async'})
      ),
      E('div',{className:'ph-card-copy'},
        E('div',{className:'ph-card-meta'},
          E('span',null,project.type),
          E('span',{className:'ph-status'},project.status)
        ),
        E('h3',null,project.title),
        E('p',{className:'ph-subtitle'},project.subtitle),
        E('p',null,project.summary),
        E('div',{className:'ph-tags'},...(project.tags||[]).map(tag=>E('span',{key:tag},tag))),
        E('div',{className:'ph-actions'},
          E('a',{href:project.caseHref,className:'ph-btn primary'},'CASE STUDY ↗'),
          project.appHref?E('a',{href:project.appHref,className:'ph-btn'},'LIVE APP ↗'):null
        )
      )
    );
  }

  function Carousel({title,kicker,items}){
    const trackRef=useRef(null);
    const [index,setIndex]=useState(0);
    const max=Math.max(0,items.length-1);

    const go=delta=>{
      const track=trackRef.current;
      if(!track)return;
      const next=Math.max(0,Math.min(max,index+delta));
      setIndex(next);
      const child=track.children[next];
      child?.scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'});
    };

    useEffect(()=>{
      const track=trackRef.current;
      if(!track)return;
      const update=()=>{
        const cards=[...track.children];
        if(!cards.length)return;
        const left=track.scrollLeft;
        let best=0,bestDist=Infinity;
        cards.forEach((el,i)=>{
          const d=Math.abs(el.offsetLeft-left);
          if(d<bestDist){best=i;bestDist=d}
        });
        setIndex(best);
      };
      track.addEventListener('scroll',update,{passive:true});
      return()=>track.removeEventListener('scroll',update);
    },[items.length]);

    return E('section',{className:'ph-carousel-section'},
      E('header',{className:'ph-carousel-head'},
        E('div',null,E('p',{className:'ph-kicker'},kicker),E('h2',null,title)),
        E('div',{className:'ph-controls'},
          E('button',{type:'button',onClick:()=>go(-1),disabled:index===0,'aria-label':'Anterior'},'←'),
          E('span',null,String(index+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0')),
          E('button',{type:'button',onClick:()=>go(1),disabled:index===max,'aria-label':'Siguiente'},'→')
        )
      ),
      E('div',{className:'ph-track',ref:trackRef,tabIndex:0},
        ...items.map(p=>E(ProjectCard,{project:p,key:p.id}))
      )
    );
  }

  function App(){
    const {data,error}=useRegistry();
    if(error)return E('div',{className:'ph-state'},'No se pudo cargar el registro de proyectos: '+error);
    if(!data)return E('div',{className:'ph-state'},'Loading project system…');

    const all=data.projects||[];
    const featured=all.filter(x=>x.featured);
    const live=all.filter(x=>x.appHref);
    const archive=all.filter(x=>!x.featured);

    return E(React.Fragment,null,
      E('header',{className:'ph-top'},
        E('a',{href:'../index.html',className:'ph-brand'},'HL',E('small',null,'Portfolio / Project System')),
        E('nav',null,
          E('a',{href:'#featured'},'Featured'),
          E('a',{href:'#live'},'Live apps'),
          E('a',{href:'#archive'},'Archive')
        )
      ),
      E('main',null,
        E('section',{className:'ph-hero'},
          E('p',{className:'ph-kicker'},'PROJECT SYSTEM · CASE STUDIES + RUNNING APPS'),
          E('h1',null,'Un repositorio.',E('span',null,'Cada proyecto con su propia profundidad.')),
          E('p',{className:'ph-lead'},'El dossier general funciona como índice. Cada proyecto abre su case study; cuando existe software navegable, el mismo proyecto enlaza a su app. Nada pesado se carga hasta que el usuario entra en ese proyecto.'),
          E('div',{className:'ph-architecture'},
            E('span',null,'projects/ · case studies'),
            E('span',null,'apps/ · live demos'),
            E('span',null,'assets/ · public media'),
            E('span',null,'docs + skills · engineering')
          )
        ),
        E('div',{id:'featured',className:'ph-shell'},E(Carousel,{title:'Selected work',kicker:'01 / FEATURED PROJECTS',items:featured})),
        E('div',{id:'live',className:'ph-shell'},E(Carousel,{title:'Running systems',kicker:'02 / LIVE DEMONSTRATORS',items:live})),
        E('div',{id:'archive',className:'ph-shell'},E(Carousel,{title:'Project archive',kicker:'03 / MORE WORK',items:archive}))
      ),
      E('footer',{className:'ph-foot'},
        E('span',null,'Héctor Lobato · technical systems / architecture / software'),
        E('a',{href:'https://github.com/HectorLobatoHernandez/HectorLobatoHernandez.github.io',target:'_blank',rel:'noopener'},'GitHub repository ↗')
      )
    );
  }

  const root=ReactDOM.createRoot(document.getElementById('projectHubRoot'));
  root.render(E(App));
})();