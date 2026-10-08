/* React Bits visual system for cv/dossier.html.
 * Patterns adapted from DavidHDev/react-bits (MIT):
 * Waves, Particles, TechText, DitherVeil, StaggeredMenu and LatticeLoader.
 * Reviewed upstream snapshot: 63a008de65732d73010bd219d25d15c47739bb31.
 */
(function(){
  const contract={
    schemaVersion:4,
    engine:'REACT_18_UMD',
    upstream:'DavidHDev/react-bits@63a008de65732d73010bd219d25d15c47739bb31',
    components:['Waves','Particles','TechText','LogoLoop','DitherVeil','StaggeredMenu','LatticeLoader'],
    scope:'FULL_DOSSIER',
    portraitMode:'DITHER_VEIL_SINGLE',
    portraitImages:1,
    generatedPortraits:0,
    globalEffects:true,
    techMode:'REACT_BITS_TECH_TEXT_VISIBLE_DEMO',
    techTextProps:{reveal:'letter',reach:200,softness:.7,lineStyle:'dashed',dashLength:4,dashGap:2,strokeWidth:1.5,specks:15,selection:true,labels:true,draggable:true,sweep:true,speed:1},
    techHeadings:0,
    mounted:false
  };
  window.__CV_HERO__=contract;

  const rootNode=document.getElementById('hero-react-root');
  if(!rootNode||!window.React||!window.ReactDOM)return;

  const R=window.React;
  const h=R.createElement;
  const {useEffect,useRef,useState}=R;
  const PHOTO='../assets/hector-profile.png';

  function useReducedMotion(){
    const [reduced,setReduced]=useState(false);
    useEffect(()=>{
      const q=window.matchMedia('(prefers-reduced-motion: reduce)');
      const sync=()=>setReduced(q.matches);
      sync();
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
    return {ctx,w:rect.width,h:rect.height,dpr};
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
      window.addEventListener('resize',resize);
      window.addEventListener('pointermove',move,{passive:true});
      const draw=()=>{
        const {ctx,w,h}=state;
        ctx.clearRect(0,0,w,h);
        const base=h*.54;
        const lines=Math.max(14,Math.round(h/46));
        for(let j=0;j<lines;j++){
          const y0=base+j*17;
          ctx.beginPath();
          ctx.lineWidth=.68;
          ctx.strokeStyle='rgba(142,160,145,'+(0.19-j*.0045)+')';
          for(let x=-50;x<=w+50;x+=7){
            const wave=Math.sin(x*.0105+t*.006+j*.43)*13+Math.sin(x*.0031-t*.003+j*.9)*20;
            const dx=x-pointer.x,dy=y0-pointer.y,dist=Math.hypot(dx,dy);
            const push=dist<220?(1-dist/220)*Math.sin(dist*.035)*28:0;
            const y=y0+wave+push;
            if(x===-50)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
        if(!reduced){t++;raf=requestAnimationFrame(draw)}
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
      const count=window.innerWidth<700?42:96;
      const particles=Array.from({length:count},(_,i)=>({
        x:Math.random()*state.w,y:Math.random()*state.h,
        r:.72+Math.random()*1.45,s:.07+Math.random()*.20,
        phase:Math.random()*Math.PI*2,warm:i%8===0
      }));
      const resize=()=>{state=sizeCanvas(canvas)};
      const move=e=>{pointer.x=e.clientX;pointer.y=e.clientY};
      window.addEventListener('resize',resize);
      window.addEventListener('pointermove',move,{passive:true});
      const draw=()=>{
        const {ctx,w,h}=state;ctx.clearRect(0,0,w,h);
        particles.forEach(p=>{
          if(!reduced){p.y-=p.s;p.x+=Math.sin(t*.003+p.phase)*.07}
          if(p.y<-8){p.y=h+8;p.x=Math.random()*w}
          const d=Math.hypot(p.x-pointer.x,p.y-pointer.y);
          const a=d<170?.7:.27;
          ctx.beginPath();
          ctx.fillStyle=p.warm?'rgba(157,174,159,'+Math.min(.92,a+.08)+')':'rgba(207,218,208,'+Math.min(.88,a+.04)+')';
          ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
          if(d<115){
            ctx.beginPath();ctx.strokeStyle='rgba(170,189,172,'+((1-d/115)*.22)+')';ctx.lineWidth=.65;
            ctx.moveTo(p.x,p.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke();
          }
        });
        if(!reduced){t++;raf=requestAnimationFrame(draw)}
      };
      draw();
      return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move)};
    },[reduced]);
    return h('canvas',{ref,className:'rb-canvas rb-particles','aria-hidden':'true'});
  }

  function GlobalEffects(){
    return h(R.Fragment,null,
      h(Waves),
      h(Particles),
      h('div',{className:'rb-page-vignette'}),
      h('div',{className:'rb-page-grain'})
    );
  }

  function TechWordmark({lines,compact=false,draggable=true,label='TECH TEXT'}){
    const ref=useRef(null);
    const reduced=useReducedMotion();
    const [active,setActive]=useState(-1);
    const [frame,setFrame]=useState(null);
    const [inside,setInside]=useState(false);
    const dragRef=useRef(null);
    const flat=lines.flatMap((line,lineIndex)=>[...line].map((char,charIndex)=>({char,lineIndex,charIndex})));

    const updateFrame=index=>{
      const root=ref.current;if(!root||index<0){setFrame(null);return}
      const chars=[...root.querySelectorAll('.rb-tech-char')];
      const el=chars[index];if(!el){setFrame(null);return}
      const rr=root.getBoundingClientRect(),cr=el.getBoundingClientRect();
      setFrame({
        x:cr.left-rr.left-5,y:cr.top-rr.top-4,w:cr.width+10,h:cr.height+8,
        char:el.dataset.char||'',
        index:index+1
      });
    };

    const setProximity=(centerIndex,event=null)=>{
      const root=ref.current;if(!root)return;
      const chars=[...root.querySelectorAll('.rb-tech-char')];
      const reach=compact?132:200;
      chars.forEach((el,i)=>{
        let p=0;
        if(event){
          const rr=el.getBoundingClientRect();
          const d=Math.hypot(event.clientX-(rr.left+rr.width/2),event.clientY-(rr.top+rr.height/2));
          p=Math.max(0,1-d/reach);
        }else if(centerIndex>=0){
          p=Math.max(0,1-Math.abs(i-centerIndex)/2.7);
        }
        el.style.setProperty('--rb-proximity',p.toFixed(3));
      });
    };

    const activate=index=>{
      setActive(index);
      setProximity(index);
      requestAnimationFrame(()=>updateFrame(index));
    };

    useEffect(()=>{
      if(reduced||inside||flat.length<2)return;
      let i=-1;
      const tick=()=>{i=(i+1)%flat.length;activate(i)};
      const first=setTimeout(tick,420);
      const id=setInterval(tick,760);
      return()=>{clearTimeout(first);clearInterval(id)};
    },[reduced,inside,flat.length]);

    useEffect(()=>{
      const resize=()=>active>=0&&updateFrame(active);
      window.addEventListener('resize',resize);
      return()=>window.removeEventListener('resize',resize);
    },[active]);

    const nearest=e=>{
      const root=ref.current;if(!root)return;
      const chars=[...root.querySelectorAll('.rb-tech-char')];
      let best=-1,bestDist=Infinity;
      chars.forEach((el,i)=>{
        const r=el.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
        const d=Math.hypot(dx,dy);
        if(d<bestDist){bestDist=d;best=i}
      });
      setProximity(best,e);
      if(best>=0&&bestDist<(compact?132:210)){
        setActive(best);
        requestAnimationFrame(()=>updateFrame(best));
      }
    };

    const down=(e,index)=>{
      if(!draggable||reduced||e.button!==0)return;
      const el=e.currentTarget;
      const r=el.getBoundingClientRect();
      dragRef.current={el,index,startX:e.clientX,startY:e.clientY,baseX:0,baseY:0};
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-dragging');
      activate(index);
    };

    const move=e=>{
      nearest(e);
      const d=dragRef.current;if(!d)return;
      const max=compact?12:22;
      const dx=Math.max(-max,Math.min(max,e.clientX-d.startX));
      const dy=Math.max(-max,Math.min(max,e.clientY-d.startY));
      d.el.style.setProperty('--drag-x',dx+'px');
      d.el.style.setProperty('--drag-y',dy+'px');
      requestAnimationFrame(()=>updateFrame(d.index));
    };

    const up=e=>{
      const d=dragRef.current;if(!d)return;
      d.el.releasePointerCapture?.(e.pointerId);
      d.el.classList.remove('is-dragging');
      d.el.style.setProperty('--drag-x','0px');
      d.el.style.setProperty('--drag-y','0px');
      dragRef.current=null;
      setTimeout(()=>active>=0&&updateFrame(active),170);
    };

    let globalIndex=-1;
    return h('span',{
      ref,
      className:'rb-tech-shell'+(compact?' is-compact':''),
      'data-tech-mode':'letter',
      onPointerEnter:e=>{setInside(true);nearest(e)},
      onPointerMove:move,
      onPointerLeave:()=>{
        setInside(false);
        const root=ref.current;
        root?.querySelectorAll('.rb-tech-char').forEach(el=>el.style.setProperty('--rb-proximity','0'));
        if(!reduced){setActive(-1);setFrame(null)}
      },
      onPointerUp:up,
      onPointerCancel:up
    },
      h('span',{className:'rb-tech-word'},...lines.map((line,lineIndex)=>
        h('span',{className:'rb-tech-line',key:lineIndex},...[...line].map((char,charIndex)=>{
          globalIndex++;
          const index=globalIndex;
          const value=char;
          return h('span',{
            key:lineIndex+'-'+charIndex,
            className:'rb-tech-char'+(char===' '?' is-space':'')+(active===index?' is-active':''),
            'data-char':char===' '?'SPACE':value,
            style:{'--char-index':index},
            onPointerDown:e=>down(e,index)
          },
            value,
            active===index?h('span',{className:'rb-tech-specks','aria-hidden':'true'},...Array.from({length:compact?6:12},(_,i)=>
              h('i',{key:i,style:{'--sx':(((i*37)%100)-50)+'%','--sy':(((i*61)%100)-50)+'%','--sd':((i%5)*.07)+'s'}})
            )):null
          );
        }))
      )),
      frame?h('span',{
        className:'rb-tech-selection',
        'aria-hidden':'true',
        style:{transform:'translate3d('+frame.x+'px,'+frame.y+'px,0)',width:frame.w+'px',height:frame.h+'px'}
      },
        h('i',{className:'rb-tech-corner c1'}),h('i',{className:'rb-tech-corner c2'}),h('i',{className:'rb-tech-corner c3'}),h('i',{className:'rb-tech-corner c4'}),
        h('span',{className:'rb-tech-selection-label'},label+' / '+String(frame.index).padStart(2,'0')+' · '+frame.char),
        h('span',{className:'rb-tech-connector'})
      ):null
    );
  }

  function TechText(){
    return h('h1',{className:'rb-name','aria-label':'Héctor Lobato','data-reactbits-tech-text':'true'},
      h(TechWordmark,{lines:['Héctor','Lobato.'],compact:false,draggable:true,label:'REACT BITS / TECH TEXT'})
    );
  }

  function enhanceDocumentHeadings(){
    const targets=[...document.querySelectorAll('main .section-head h2,main .project-copy h2,main .final h2')];
    const roots=[];
    targets.forEach((el,index)=>{
      if(el.dataset.rbTech==='1')return;
      const raw=el.innerText||el.textContent||'';
      const lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean);
      el.textContent='';
      el.dataset.rbTech='1';
      el.classList.add('rb-doc-tech');
      el.setAttribute('aria-label',lines.join(' '));
      const root=window.ReactDOM.createRoot(el);
      root.render(h(TechWordmark,{lines:lines.length?lines:[''],compact:true,draggable:true,label:'TECH TEXT / TITLE '+String(index+1).padStart(2,'0')}));
      roots.push(root);
    });
    window.__CV_TECH_HEADING_ROOTS__=roots;
    contract.techHeadings=targets.length;
  }

  const LOGO_ITEMS=[
    ['KNX','automation'],['DALI','lighting'],['CRESTRON','control'],['ECLER','audio'],['LYNX PRO AUDIO','audio'],
    ['AUTOCAD','engineering'],['SKETCHUP','3D'],['PYTHON','software'],['GITHUB','delivery'],['REACT','frontend'],
    ['THREE.JS','3D web'],['OPENCLAW','agents'],['OMNIROUTE','routing']
  ];

  function LogoLoop(){
    const items=[...LOGO_ITEMS,...LOGO_ITEMS];
    return h('div',{className:'rb-logo-loop-wrap','data-reactbits-logo-loop':'true'},
      h('div',{className:'rb-logo-loop-head'},h('span',null,'Technology / systems stack'),h('small',null,'React Bits · Logo Loop pattern')),
      h('div',{className:'rb-logo-loop-mask'},
        h('div',{className:'rb-logo-loop-track'},...items.map(([label,kind],i)=>
          h('div',{className:'rb-logo-item',key:label+'-'+i},h('b',null,label),h('span',null,kind))
        ))
      )
    );
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
      const esc=e=>{if(e.key==='Escape')setOpen(false)};
      window.addEventListener('keydown',esc);
      document.body.style.overflow=open?'hidden':'';
      return()=>{window.removeEventListener('keydown',esc);document.body.style.overflow=''};
    },[open,setOpen]);
    return h('div',{className:'rb-stagger'+(open?' is-open':''),'aria-hidden':open?'false':'true'},
      h('button',{className:'rb-stagger-backdrop',onClick:()=>setOpen(false),'aria-label':'Cerrar menú'}),
      h('aside',{className:'rb-stagger-panel','aria-label':'Navegación del dossier'},
        h('div',{className:'rb-stagger-head'},h('span',null,'Dossier / índice'),h('button',{className:'rb-menu-close',onClick:()=>setOpen(false),'aria-label':'Cerrar'},'×')),
        h('nav',{className:'rb-stagger-links'},...MENU.map(([n,label,url])=>
          h('a',{key:n,className:'rb-stagger-link',href:url,onClick:()=>setOpen(false)},h('span',null,label),h('small',null,n))
        )),
        h('div',{className:'rb-stagger-foot'},'Héctor Lobato · Systems Integration · Automation · IT/OT · AV · AI')
      )
    );
  }

  function DitherVeil(){
    const canvasRef=useRef(null);
    const frameRef=useRef(null);
    const [plain,setPlain]=useState(false);
    const reduced=useReducedMotion();

    useEffect(()=>{
      const canvas=canvasRef.current;
      const frame=frameRef.current;
      if(!canvas||!frame)return;

      const source=new Image();
      const work=document.createElement('canvas');
      const base=document.createElement('canvas');
      const pointer={x:0,y:0,inside:false,radius:0,target:0};
      let raf=0,ready=false,lastW=0,lastH=0;

      function drawCover(ctx,img,w,h){
        const ir=img.naturalWidth/img.naturalHeight;
        const tr=w/h;
        let sw=img.naturalWidth,sh=img.naturalHeight,sx=0,sy=0;
        if(ir>tr){sw=sh*tr;sx=(img.naturalWidth-sw)/2}
        else{sh=sw/tr;sy=(img.naturalHeight-sh)*.24}
        sy=Math.max(0,Math.min(img.naturalHeight-sh,sy));
        ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);
      }

      function buildDither(){
        if(!ready)return;
        const rect=frame.getBoundingClientRect();
        const w=Math.max(1,Math.round(rect.width)),hh=Math.max(1,Math.round(rect.height));
        if(w===lastW&&hh===lastH&&base.width)return;
        lastW=w;lastH=hh;
        const dpr=Math.min(window.devicePixelRatio||1,2);
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(hh*dpr);
        canvas.style.width=w+'px';canvas.style.height=hh+'px';
        const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);

        work.width=w;work.height=hh;
        const wctx=work.getContext('2d',{willReadFrequently:true});
        wctx.clearRect(0,0,w,hh);drawCover(wctx,source,w,hh);
        const pixels=wctx.getImageData(0,0,w,hh).data;

        base.width=w;base.height=hh;
        const bctx=base.getContext('2d');
        bctx.fillStyle='#080808';bctx.fillRect(0,0,w,hh);
        const matrix=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
        const step=4;
        for(let y=0;y<hh;y+=step){
          for(let x=0;x<w;x+=step){
            const px=Math.min(w-1,x+1),py=Math.min(hh-1,y+1);
            const idx=(py*w+px)*4;
            const lum=(pixels[idx]*.299+pixels[idx+1]*.587+pixels[idx+2]*.114)/255;
            const threshold=(matrix[(y/step)%4|0][(x/step)%4|0]+.5)/16;
            bctx.fillStyle=lum>threshold?'rgba(217,217,214,.94)':'rgba(8,8,8,.97)';
            bctx.fillRect(x,y,step,step);
          }
        }
      }

      function render(){
        buildDither();
        if(!base.width){raf=requestAnimationFrame(render);return}
        const ctx=canvas.getContext('2d');
        const rect=frame.getBoundingClientRect();
        const dpr=Math.min(window.devicePixelRatio||1,2);
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.clearRect(0,0,rect.width,rect.height);
        ctx.globalCompositeOperation='source-over';
        ctx.drawImage(base,0,0,rect.width,rect.height);

        pointer.radius+=(pointer.target-pointer.radius)*(reduced?.32:.17);
        if(pointer.radius>.5){
          ctx.save();
          ctx.globalCompositeOperation='destination-out';
          const g=ctx.createRadialGradient(pointer.x,pointer.y,pointer.radius*.30,pointer.x,pointer.y,pointer.radius);
          g.addColorStop(0,'rgba(0,0,0,1)');
          g.addColorStop(.62,'rgba(0,0,0,.96)');
          g.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=g;
          ctx.fillRect(0,0,rect.width,rect.height);
          ctx.restore();
        }
        raf=requestAnimationFrame(render);
      }

      const locate=e=>{
        const r=canvas.getBoundingClientRect();
        pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;
        pointer.inside=true;pointer.target=Math.min(150,Math.max(95,r.width*.22));
      };
      const leave=()=>{pointer.inside=false;pointer.target=0};
      const resize=()=>{lastW=0;lastH=0;buildDither()};

      canvas.addEventListener('pointermove',locate,{passive:true});
      canvas.addEventListener('pointerenter',locate,{passive:true});
      canvas.addEventListener('pointerleave',leave);
      window.addEventListener('resize',resize);

      source.onload=()=>{ready=true;buildDither();render()};
      source.onerror=()=>{ready=false};
      source.src=PHOTO;

      return()=>{
        cancelAnimationFrame(raf);
        canvas.removeEventListener('pointermove',locate);
        canvas.removeEventListener('pointerenter',locate);
        canvas.removeEventListener('pointerleave',leave);
        window.removeEventListener('resize',resize);
      };
    },[reduced]);

    return h('div',{className:'rb-portrait-zone'},
      h('div',{className:'rb-dither-axis','aria-hidden':'true'}),
      h('div',{className:'rb-dither-frame'+(plain?' is-plain':''),ref:frameRef,'data-dither-veil':'true','data-portrait-view':plain?'plain':'interactive'},
        h('img',{className:'rb-dither-photo',src:PHOTO,alt:'Retrato profesional de Héctor Lobato'}),
        h('canvas',{className:'rb-dither-canvas',ref:canvasRef,'aria-label':'Retrato interactivo con efecto dither'}),
        h('div',{className:'rb-dither-overlay','aria-hidden':'true'}),
        h('div',{className:'rb-dither-hint'},plain?'foto original':'mueve el cursor / revelar'),
        h('div',{className:'rb-dither-meta'},h('span',null,'Portrait / 2026'),h('span',null,plain?'Original / clean':'Dither Veil / interactive'))
      ),
      h('button',{
        className:'rb-portrait-toggle',
        type:'button',
        onClick:()=>setPlain(v=>!v),
        'aria-pressed':plain?'true':'false'
      },plain?'Activar visor React':'Ver foto normal'),
      h('div',{className:'rb-portrait-code'},h('strong',null,'01 / HUMAN LAYER'),'field + digital',h('br'),'systems / engineering')
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
      enhanceDocumentHeadings();
      contract.mounted=true;
      const img=new Image();img.src=PHOTO;
      let resolved=false;
      const finish=()=>{if(resolved)return;resolved=true;setTimeout(()=>setLoaded(true),420)};
      img.onload=finish;img.onerror=finish;
      const timer=setTimeout(finish,1400);
      return()=>clearTimeout(timer);
    },[]);

    return h(R.Fragment,null,
      h(LatticeLoader,{done:loaded}),
      h('section',{className:'rb-hero-shell','data-reactbits-hero':'true'},
        h('header',{className:'rb-nav'},
          h('div',{className:'rb-nav-inner'},
            h('a',{className:'rb-brand',href:'#hero-react-root'},h('span',{className:'rb-brand-mark'},'HL.'),h('span',{className:'rb-brand-name'},'Héctor Lobato')),
            h('button',{className:'rb-menu-trigger',type:'button',onClick:()=>setMenu(true),'aria-expanded':menu?'true':'false'},h(MenuDots),'Menú')
          )
        ),
        h(StaggeredMenu,{open:menu,setOpen:setMenu}),
        h('div',{className:'rb-stage'},
          h('div',{className:'rb-copy'},
            h('div',{className:'rb-kicker'},'Systems Integration / Automation / IT/OT / AV / AI'),
            h(TechText),
            h('p',{className:'rb-deck'},'Ingeniería e integración de sistemas: automatización, AV, IT/OT, CAD y software aplicado.'),
            h('div',{className:'rb-actions rb-actions-compact'},
              h('a',{className:'rb-btn primary',href:'#proyectos'},'Explorar proyectos ↓'),
              h('a',{className:'rb-btn',href:'ats.html'},'CV ATS / PDF'),
              h('a',{className:'rb-btn',href:'present.html'},'Presentación 5 min')
            )
          ),
          h(DitherVeil)
        ),
        h('div',{className:'rb-scroll-cue'},'scroll / explorar dossier ↓')
      )
    );
  }

  const fxNode=document.createElement('div');
  fxNode.className='rb-global-effects';
  fxNode.setAttribute('aria-hidden','true');
  document.body.prepend(fxNode);
  window.ReactDOM.createRoot(fxNode).render(h(GlobalEffects));

  const root=window.ReactDOM.createRoot(rootNode);
  root.render(h(HeroApp));

  const logoRoot=document.getElementById('cv-logo-loop-root');
  if(logoRoot)window.ReactDOM.createRoot(logoRoot).render(h(LogoLoop));
})();