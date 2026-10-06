import React,{useEffect,useMemo,useRef,useState} from 'https://esm.sh/react@19.1.1';
import gsap from 'https://esm.sh/gsap@3.13.0';
const h=React.createElement;

export function CursorGrid({cellSize=62,color='#4f8cff',radius=210,gridOpacity=.07}){
  const host=useRef(null),canvas=useRef(null);
  useEffect(()=>{
    const el=host.current,c=canvas.current;if(!el||!c)return;const x=c.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2);
    let W=1,H=1,raf=0,mouse={x:-9999,y:-9999,pulse:0};
    const hex=s=>{const n=parseInt(s.replace('#',''),16);return[(n>>16)&255,(n>>8)&255,n&255]};const rgb=hex(color);
    const resize=()=>{W=el.clientWidth;H=el.clientHeight;c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px';x.setTransform(dpr,0,0,dpr,0,0)};const ro=new ResizeObserver(resize);ro.observe(el);resize();
    const move=e=>{const r=c.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top};const down=()=>mouse.pulse=1;
    el.addEventListener('pointermove',move);el.addEventListener('pointerdown',down);
    const draw=()=>{x.clearRect(0,0,W,H);const cols=Math.ceil(W/cellSize)+1,rows=Math.ceil(H/cellSize)+1,ox=(W-cols*cellSize)/2,oy=(H-rows*cellSize)/2;
      for(let r=0;r<rows;r++)for(let cc=0;cc<cols;cc++){const px=ox+cc*cellSize,py=oy+r*cellSize,cx=px+cellSize/2,cy=py+cellSize/2,d=Math.hypot(cx-mouse.x,cy-mouse.y),a=Math.max(0,1-d/radius);x.strokeStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${gridOpacity+a*a*.65})`;x.lineWidth=1;x.strokeRect(px+.5,py+.5,cellSize-1,cellSize-1);if(a>0){x.fillStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a*a*.035})`;x.fillRect(px,py,cellSize,cellSize)}}mouse.pulse*=.94;if(mouse.pulse>.02){x.beginPath();x.arc(mouse.x,mouse.y,(1-mouse.pulse)*380,0,Math.PI*2);x.strokeStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${mouse.pulse*.55})`;x.stroke()}raf=requestAnimationFrame(draw)};raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);ro.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('pointerdown',down)}
  },[cellSize,color,radius,gridOpacity]);
  return h('div',{ref:host,className:'cursor-grid'},h('canvas',{ref:canvas}))
}

export function DecryptedText({text,speed=28,animateOn='view',className=''}){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}:/\\\\|+-=*',ref=useRef(null),[out,setOut]=useState(text),[run,setRun]=useState(false);
  useEffect(()=>{if(animateOn!=='view')return;const o=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting))setRun(true)},{threshold:.25});if(ref.current)o.observe(ref.current);return()=>o.disconnect()},[animateOn]);
  useEffect(()=>{if(!run)return;let fixed=0;const id=setInterval(()=>{setOut(text.split('').map((ch,i)=>ch===' '?ch:(i<fixed?ch:chars[Math.floor(Math.random()*chars.length)])).join(''));fixed++;if(fixed>text.length){clearInterval(id);setOut(text);setRun(false)}},speed);return()=>clearInterval(id)},[run,text,speed]);
  return h('span',{ref,className:'decrypt '+className,onPointerEnter:()=>animateOn==='hover'&&setRun(true),'aria-label':text},out)
}

export function ElectricBorder({children,color='#5b8cff',className=''}){
  return h('div',{className:'electric '+className,style:{'--electric':color}},h('div',{className:'electric-glow'}),h('div',{className:'electric-content'},children))
}

export function TiltCard({children,className=''}){
  const ref=useRef(null);const move=e=>{const el=ref.current,r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(900px) rotateX(${-y*9}deg) rotateY(${x*9}deg) translateZ(12px)`;el.style.setProperty('--px',`${(x+.5)*100}%`);el.style.setProperty('--py',`${(y+.5)*100}%`)};const leave=()=>{if(ref.current)ref.current.style.transform='perspective(900px) rotateX(0) rotateY(0)'};
  return h('div',{ref,className:'tilt '+className,onPointerMove:move,onPointerLeave:leave},children)
}

export function PixelTransition({front,back,color='#4f8cff',className=''}){
  const ref=useRef(null),backRef=useRef(null),[active,setActive]=useState(false);
  useEffect(()=>{const el=ref.current;if(!el)return;let grid=el.querySelector('.px-grid');grid.innerHTML='';for(let i=0;i<64;i++){const p=document.createElement('i');p.style.background=color;p.style.left=(i%8)*12.5+'%';p.style.top=Math.floor(i/8)*12.5+'%';grid.appendChild(p)}},[color]);
  const run=on=>{setActive(on);const pixels=ref.current?.querySelectorAll('.px-grid i');if(!pixels)return;gsap.killTweensOf(pixels);gsap.set(pixels,{display:'none'});gsap.to(pixels,{display:'block',duration:0,stagger:{each:.004,from:'random'}});gsap.delayedCall(.27,()=>{if(backRef.current)backRef.current.style.display=on?'block':'none'});gsap.to(pixels,{display:'none',duration:0,delay:.27,stagger:{each:.004,from:'random'}})};
  return h('div',{ref,className:'pixel '+className,tabIndex:0,onPointerEnter:()=>!active&&run(true),onPointerLeave:()=>active&&run(false),onFocus:()=>!active&&run(true),onBlur:()=>active&&run(false)},h('div',{className:'px-front'},front),h('div',{ref:backRef,className:'px-back'},back),h('div',{className:'px-grid'}))
}

export function ProximityDock({items=[]}){
  const [mx,setMx]=useState(-9999);
  return h('div',{className:'dock',onPointerMove:e=>setMx(e.clientX),onPointerLeave:()=>setMx(-9999)},items.map((it,i)=>h(DockItem,{it,mx,key:i})))
}
function DockItem({it,mx}){const ref=useRef(null),[size,setSize]=useState(46);useEffect(()=>{const r=ref.current?.getBoundingClientRect();if(!r)return;const d=Math.abs(mx-(r.left+r.width/2));setSize(46+Math.max(0,1-d/130)*30)},[mx]);return h('button',{ref,style:{width:size,height:size},onClick:it.onClick,'aria-label':it.label},h('b',null,it.icon),h('span',null,it.label))}
