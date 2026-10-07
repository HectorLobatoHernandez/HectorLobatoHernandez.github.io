/* React hero island for cv/dossier.html.
 * Interaction patterns adapted from React Bits (DavidHDev/react-bits, MIT):
 * Waves, Particles, TechText, DitherVeil, CircularCarousel, StaggeredMenu and LatticeLoader.
 * Upstream snapshot reviewed: 63a008de65732d73010bd219d25d15c47739bb31.
 */
(function(){
  const contract={
    schemaVersion:1,
    engine:'REACT_18_UMD',
    upstream:'DavidHDev/react-bits@63a008de65732d73010bd219d25d15c47739bb31',
    components:['Waves','Particles','TechText','DitherVeil','CircularCarousel','StaggeredMenu','LatticeLoader'],
    heroOnly:true,
    photoVariants:5,
    generatedPortraits:0,
    mounted:false
  };
  window.__CV_HERO__=contract;
  const rootNode=document.getElementById('hero-react-root');
  if(!rootNode||!window.React||!window.ReactDOM){return}
  const R=window.React;
  const h=R.createElement;
  const {useEffect,useMemo,useRef,useState}=R;
  const PHOTO='../assets/hector-profile.png';

  function useReducedMotion(){
    const [reduced,setReduced]=useState(false);
    useEffect(()=>{
      const q=window.matchMedia('(prefers-reduced-motion: reduce)');
      const sync=()=>setReduced(q.matches);sync();
      q.addEventListener?.('change',sync);
      return()=>q.removeEventListener?.('change',sync);
    },[]);
    return reduced;
  }

  function sizeCanvas(canvas){
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(rect.width*dpr));
    canvas.height=Math.max(1,Math.round(rect.height*dpr));
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx,w:rect.width,h:rect.height};
  }

  function Waves(){
    const ref=useRef(null);
    const reduced=useReducedMotion();
    useEffect(()=>{
      const canvas=ref.current;if(!canvas)return;
      let state=sizeCanvas(canvas),raf=0,t=0;
      const pointer={x:-9999,y:-9999};
      const resize=()=>{state=sizeCanvas(canvas)};
      const move=e=>{pointer.x=e.clientX;pointer.y=e.clientY};
      window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});
      const draw=()=>{
        const {ctx,w,h}=state;
        ctx.clearRect(0,0,w,h);
        const base=h*.60;
        const lines=Math.max(13,Math.round(h/48));
        for(let j=0;j<lines;j++){
          const y0=base+j*18;
          ctx.beginPath();
          ctx.lineWidth=.72;
          ctx.strokeStyle='rgba(183,200,158,'+(0.19-j*.006)+')';
          for(let x=-40;x<=w+40;x+=7){
            const wave=Math.sin(x*.011+t*.007+j*.42)*14+Math.sin(x*.0032-t*.004+j)*22;
            const dx=x-pointer.x,dy=y0-pointer.y,dist=Math.hypot(dx,dy);
            const push=dist<240?(1-dist/240)*Math.sin(dist*.035)*34:0;
            const y=y0+wave+push;
            if(x===-40)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
        if(!reduced){t+=1;raf=requestAnimationFrame(draw)}
      };
      draw();
      return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move)};
    },[reduced]);
    return h('canvas',{ref,className:'rb-canvas rb-waves','aria-hidden':'true'});
  }

  function Particles(){
    const ref=useRef(null);
    const reduced=useReducedMotion();
    useEffect(()=>{
      const canvas=ref.current;if(!canvas)return;
      let state=sizeCanvas(canvas),raf=0,t=0;
      const pointer={x:-9999,y:-9999};
      const count=window.innerWidth<700?34:82;
      let particles=Array.from({length:count},(_,i)=>({
        x:Math.random()*state.w,y:Math.random()*state.h,
        r:.7+Math.random()*1.25,s:.08+Math.random()*.22,
        phase:Math.random()*Math.PI*2
      }));
      const resize=()=>{state=sizeCanvas(canvas)};
      const move=e=>{const rect=canvas.getBoundingClientRect();pointer.x=e.clientX-rect.left;pointer.y=e.clientY-rect.top};
      window.addEventListener('resize',resize);canvas.addEventListener('pointermove',move,{passive:true});
      const draw=()=>{
        const {ctx,w,h}=state;ctx.clearRect(0,0,w,h);
        particles.forEach((p,i)=>{
          if(!reduced){p.y-=p.s;p.x+=Math.sin(t*.003+p.phase)*.08}
          if(p.y<-8){p.y=h+8;p.x=Math.random()*w}
          const d=Math.hypot(p.x-pointer.x,p.y-pointer.y);
          const a=d<180?.74:.28;
          ctx.beginPath();ctx.fillStyle=i%7===0?'rgba(197,154,103,'+a+')':'rgba(229,232,219,'+a+')';
          ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
          if(d<125){
            ctx.beginPath();ctx.strokeStyle='rgba(183,200,158,'+((1-d/125)*.17)+')';ctx.lineWidth=.55;
            ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();
          }
        });
        if(!reduced){t++;raf=requestAnimationFrame(draw)}
      };
      draw();
      return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);canvas.removeEventListener('pointermove',move)};
    },[reduced]);
    return h('canvas',{ref,className:'rb-canvas rb-particles','aria-hidden':'true'});
  }

  function TechLine({text}){
    return h('span',{className:'rb-tech-line'},...[...text].map((char,i)=>{
      const props={
        key:i,className:'rb-tech-char','data-char':char===' '?'\u00a0':char,
        onPointerMove:e=>{
          const r=e.currentTarget.getBoundingClientRect();
          const x=(e.clientX-(r.left+r.width/2))/Math.max(r.width,1);
          const y=(e.clientY-(r.top+r.height/2))/Math.max(r.height,1);
          e.currentTarget.style.transform='translate3d('+(x*5)+'px,'+(y*4)+'px,0) rotate('+x*1.3+'deg)';
        },
        onPointerLeave:e=>{e.currentTarget.style.transform=''}
      };
      return h('span',props,char===' '?'\u00a0':char);
    }));
  }
  function TechText(){
    return h('h1',{className:'rb-name','aria-label':'Héctor Lobato'},h('span',{className:'rb-tech-word'},h(TechLine,{text:'Héctor'}),h(TechLine,{text:'Lobato.'})));
  }

  function MenuDots(){
    return h('span',{className:'rb-menu-dots','aria-hidden':'true'},...Array.from({length:9},(_,i)=>h('i',{key:i})));
  }

  const MENU=[
    ['01','Perfil','#perfil'],['02','Skills','#skills'],['03','Mar Salada','#mar-salada'],
    ['04','GAZA','#gaza'],['05','RHB STUDIO','#rhb'],['06','Evidence','#evidence'],['07','Archivo','#archivo']
  ];
  function StaggeredMenu({open,setOpen}){
    useEffect(()=>{
      const esc=e=>{if(e.key==='Escape')setOpen(false)};window.addEventListener('keydown',esc);
      document.body.style.overflow=open?'hidden':'';
      return()=>{window.removeEventListener('keydown',esc);document.body.style.overflow=''};
    },[open,setOpen]);
    return h('div',{className:'rb-stagger'+(open?' is-open':''),'aria-hidden':open?'false':'true'},
      h('button',{className:'rb-stagger-backdrop',onClick:()=>setOpen(false),'aria-label':'Cerrar menú'}),
      h('aside',{className:'rb-stagger-panel','aria-label':'Navegación del dossier'},
        h('div',{className:'rb-stagger-head'},h('span',null,'Dossier / índice'),h('button',{className:'rb-menu-close',onClick:()=>setOpen(false),'aria-label':'Cerrar'},'×')),
        h('nav',{className:'rb-stagger-links'},...MENU.map(([n,label,url])=>h('a',{key:n,className:'rb-stagger-link',href:url,onClick:()=>setOpen(false)},h('span',null,label),h('small',null,n)))),
        h('div',{className:'rb-stagger-foot'},'Héctor Lobato · Systems Integration · Automation · IT/OT · AV · AI')
      )
    );
  }

  const CONCEPTS=[
    {id:'systems',label:'Sistemas y control',desc:'Arquitectura, interfaces y commissioning',left:'18%',top:'18%',labelStyle:{marginLeft:'-156px',marginTop:'42px'}},
    {id:'industrial',label:'Operación industrial',desc:'Campo, procesos y diagnóstico',left:'12%',top:'70%',labelStyle:{marginLeft:'-168px',marginTop:'38px'}},
    {id:'architecture',label:'Arquitectura técnica',desc:'Espacio, planos y coordinación',left:'82%',top:'15%',labelStyle:{marginLeft:'72px',marginTop:'24px'}},
    {id:'av',label:'AV y automatización',desc:'DSP, KNX, DALI y experiencia',left:'91%',top:'51%',labelStyle:{marginLeft:'72px',marginTop:'18px'}},
    {id:'strategy',label:'Producto + IA',desc:'Software, agentes y sistemas',left:'79%',top:'84%',labelStyle:{marginLeft:'72px',marginTop:'28px'}}
  ];
  function PortraitCarousel(){
    const [active,setActive]=useState(0);
    const portraitRef=useRef(null);
    const activeConcept=CONCEPTS[active];
    const onMove=e=>{
      const node=portraitRef.current;if(!node)return;
      const r=node.getBoundingClientRect();
      node.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
      node.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
    };
    return h('div',{className:'rb-portrait-zone'},
      h('div',{className:'rb-orbit'},
        h('div',{className:'rb-main-portrait',ref:portraitRef,onPointerMove:onMove,onPointerLeave:e=>{e.currentTarget.style.setProperty('--mx','50%');e.currentTarget.style.setProperty('--my','50%')}},
          h('img',{src:PHOTO,alt:'Retrato profesional de Héctor Lobato'}),
          h('div',{className:'rb-dither','aria-hidden':'true'}),
          h('div',{className:'rb-main-badge'},'Portrait / current source')
        ),
        ...CONCEPTS.map((c,i)=>h(R.Fragment,{key:c.id},
          h('button',{type:'button',className:'rb-orbit-card'+(i===active?' is-active':''),'data-tone':c.id,style:{left:c.left,top:c.top},onClick:()=>setActive(i),'aria-label':'Vista conceptual: '+c.label},
            h('img',{src:PHOTO,alt:''})
          ),
          h('div',{className:'rb-orbit-label',style:Object.assign({left:c.left,top:c.top},c.labelStyle)},c.label)
        )),
        h('div',{className:'rb-active-concept'},h('strong',null,activeConcept.label),activeConcept.desc,h('br'),h('span',null,'Vista conceptual · misma fotografía base'))
      )
    );
  }

  function LatticeLoader({done}){
    const [message,setMessage]=useState(0);
    const lines=['Alineando cables y píxeles…','Negociando con el commissioning…','Convenciendo al CSS de que coopere…','Todo bajo control. Casi.'];
    useEffect(()=>{const id=setInterval(()=>setMessage(v=>(v+1)%lines.length),430);return()=>clearInterval(id)},[]);
    return h('div',{className:'rb-loader'+(done?' is-done':''),'aria-hidden':done?'true':'false'},
      h('div',{className:'rb-loader-card'},
        h('div',{className:'rb-loader-head'},h('span',null,'HL / boot sequence'),h('span',null,'React + systems')),
        h('div',{className:'rb-lattice-row'},
          h('div',{className:'rb-lattice'},...Array.from({length:16},(_,i)=>h('i',{className:'rb-cell',key:i,style:{'--i':i}}))),
          h('div',{className:'rb-loader-copy'},h('strong',null,lines[message]),h('span',null,'por favor, mantenga la curiosidad'))
        ),
        h('div',{className:'rb-loader-bar'},h('i'))
      )
    );
  }

  function HeroApp(){
    const [menu,setMenu]=useState(false);
    const [loaded,setLoaded]=useState(false);
    useEffect(()=>{
      contract.mounted=true;
      const img=new Image();img.src=PHOTO;
      let resolved=false;
      const finish=()=>{if(resolved)return;resolved=true;setTimeout(()=>setLoaded(true),420)};
      img.onload=finish;img.onerror=finish;
      const timer=setTimeout(finish,1250);
      return()=>clearTimeout(timer);
    },[]);
    return h(R.Fragment,null,
      h(LatticeLoader,{done:loaded}),
      h('section',{className:'rb-hero-shell','data-reactbits-hero':'true'},
        h(Waves),h(Particles),h('div',{className:'rb-veil-global'}),h('div',{className:'rb-grain'}),
        h('header',{className:'rb-nav'},
          h('div',{className:'rb-nav-inner'},
            h('a',{className:'rb-brand',href:'../'},h('span',{className:'rb-brand-mark'},'HL.'),h('span',{className:'rb-brand-name'},'Héctor Lobato')),
            h('button',{className:'rb-menu-trigger',type:'button',onClick:()=>setMenu(true),'aria-expanded':menu?'true':'false'},h(MenuDots),'Menú')
          )
        ),
        h(StaggeredMenu,{open:menu,setOpen:setMenu}),
        h('div',{className:'rb-stage'},
          h('div',{className:'rb-copy'},
            h('div',{className:'rb-kicker'},'Systems Integration / Automation / IT/OT / AV / AI'),
            h(TechText),
            h('p',{className:'rb-deck'},'Ingeniería entre el espacio físico, los sistemas de control y el software.'),
            h('p',{className:'rb-lead'},'Perfil multidisciplinar orientado a diseñar, integrar, poner en marcha y documentar sistemas técnicos completos. Trabajo desde la arquitectura funcional y el levantamiento hasta el commissioning, el diagnóstico y las herramientas digitales que hacen la operación más comprensible.'),
            h('div',{className:'rb-actions'},
              h('a',{className:'rb-btn primary',href:'present.html'},'Presentar en 5 min →'),
              h('a',{className:'rb-btn',href:'#proyectos'},'Ver dossier'),
              h('a',{className:'rb-btn',href:'ats.html'},'CV ATS / PDF'),
              h('a',{className:'rb-btn',href:'../'},'Portfolio técnico'),
              h('a',{className:'rb-btn',href:'mailto:lobatohernandezhector@gmail.com'},'Contacto')
            ),
            h('div',{className:'rb-index'},
              h('div',{className:'rb-index-item'},h('strong',null,'2018 → 2026'),h('span',null,'trayectoria técnica pública')),
              h('div',{className:'rb-index-item'},h('strong',null,'Field + Digital'),h('span',null,'obra, sistemas y software')),
              h('div',{className:'rb-index-item'},h('strong',null,'Architecture + Commissioning'),h('span',null,'ciclo completo')),
              h('div',{className:'rb-index-item'},h('strong',null,'Zamora'),h('span',null,'base profesional'))
            )
          ),
          h(PortraitCarousel)
        ),
        h('div',{className:'rb-scroll-cue'},'scroll / explorar dossier ↓')
      )
    );
  }

  const root=window.ReactDOM.createRoot(rootNode);
  root.render(h(HeroApp));
})();