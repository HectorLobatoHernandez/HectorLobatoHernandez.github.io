/* React Bits-inspired interactive screen layer for cv/ats.html
 * Waves algorithm: source-adapted from DavidHDev/react-bits Waves (MIT + Commons Clause).
 * Pixel trail: lightweight 2D static-Pages adaptation of the React Bits PixelTrail interaction language.
 * Upstream: https://github.com/DavidHDev/react-bits
 */
(()=>{
  const R=window.React, RD=window.ReactDOM;
  if(!R||!RD)return;
  const h=R.createElement,{useEffect,useRef}=R;
  const palette={burgundy:'#370001',ivory:'#e2dfcf',ice:'#bcd0d1',olive:'#93884b',sage:'#a5a999'};

  const reduced=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class Grad{
    constructor(x,y,z){this.x=x;this.y=y;this.z=z}
    dot2(x,y){return this.x*x+this.y*y}
  }
  class Noise{
    constructor(seed=0){
      this.grad3=[
        new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
        new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
        new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)
      ];
      this.p=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
      this.perm=new Array(512);this.gradP=new Array(512);this.seed(seed);
    }
    seed(seed){
      if(seed>0&&seed<1)seed*=65536;seed=Math.floor(seed);if(seed<256)seed|=seed<<8;
      for(let i=0;i<256;i++){const v=i&1?this.p[i]^(seed&255):this.p[i]^((seed>>8)&255);this.perm[i]=this.perm[i+256]=v;this.gradP[i]=this.gradP[i+256]=this.grad3[v%12]}
    }
    fade(t){return t*t*t*(t*(t*6-15)+10)}
    lerp(a,b,t){return(1-t)*a+t*b}
    perlin2(x,y){
      let X=Math.floor(x),Y=Math.floor(y);x-=X;y-=Y;X&=255;Y&=255;
      const n00=this.gradP[X+this.perm[Y]].dot2(x,y),n01=this.gradP[X+this.perm[Y+1]].dot2(x,y-1),
      n10=this.gradP[X+1+this.perm[Y]].dot2(x-1,y),n11=this.gradP[X+1+this.perm[Y+1]].dot2(x-1,y-1),u=this.fade(x);
      return this.lerp(this.lerp(n00,n10,u),this.lerp(n01,n11,u),this.fade(y));
    }
  }

  function Waves(){
    const ref=useRef(null);
    useEffect(()=>{
      const canvas=ref.current;if(!canvas)return;
      const ctx=canvas.getContext('2d'),noise=new Noise(.4621);
      const mouse={x:-10,y:0,lx:0,ly:0,sx:0,sy:0,v:0,vs:0,a:0,set:false};
      let bounds={width:0,height:0,left:0,top:0},lines=[],raf=0;
      const cfg={waveSpeedX:.0125,waveSpeedY:.005,waveAmpX:34,waveAmpY:18,xGap:15,yGap:34,friction:.925,tension:.005,maxCursorMove:90};

      const setSize=()=>{
        const dpr=Math.min(window.devicePixelRatio||1,1.5);
        bounds=canvas.parentElement.getBoundingClientRect();
        canvas.width=Math.max(1,Math.round(bounds.width*dpr));canvas.height=Math.max(1,Math.round(bounds.height*dpr));
        canvas.style.width=bounds.width+'px';canvas.style.height=bounds.height+'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
      };
      const setLines=()=>{
        lines=[];const oWidth=bounds.width+200,oHeight=bounds.height+30,totalLines=Math.ceil(oWidth/cfg.xGap),totalPoints=Math.ceil(oHeight/cfg.yGap);
        const xStart=(bounds.width-cfg.xGap*totalLines)/2,yStart=(bounds.height-cfg.yGap*totalPoints)/2;
        for(let i=0;i<=totalLines;i++){
          const pts=[];
          for(let j=0;j<=totalPoints;j++)pts.push({x:xStart+cfg.xGap*i,y:yStart+cfg.yGap*j,wave:{x:0,y:0},cursor:{x:0,y:0,vx:0,vy:0}});
          lines.push(pts);
        }
      };
      const moved=(p,withCursor=true)=>({x:p.x+p.wave.x+(withCursor?p.cursor.x:0),y:p.y+p.wave.y+(withCursor?p.cursor.y:0)});
      const movePoints=time=>{
        lines.forEach(pts=>pts.forEach(p=>{
          const mv=noise.perlin2((p.x+time*cfg.waveSpeedX)*.002,(p.y+time*cfg.waveSpeedY)*.0015)*12;
          p.wave.x=Math.cos(mv)*cfg.waveAmpX;p.wave.y=Math.sin(mv)*cfg.waveAmpY;
          const dx=p.x-mouse.sx,dy=p.y-mouse.sy,dist=Math.hypot(dx,dy),l=Math.max(175,mouse.vs);
          if(dist<l){const s=1-dist/l,f=Math.cos(dist*.001)*s;p.cursor.vx+=Math.cos(mouse.a)*f*l*mouse.vs*.00065;p.cursor.vy+=Math.sin(mouse.a)*f*l*mouse.vs*.00065}
          p.cursor.vx+=(0-p.cursor.x)*cfg.tension;p.cursor.vy+=(0-p.cursor.y)*cfg.tension;p.cursor.vx*=cfg.friction;p.cursor.vy*=cfg.friction;
          p.cursor.x=Math.max(-cfg.maxCursorMove,Math.min(cfg.maxCursorMove,p.cursor.x+p.cursor.vx*2));
          p.cursor.y=Math.max(-cfg.maxCursorMove,Math.min(cfg.maxCursorMove,p.cursor.y+p.cursor.vy*2));
        }));
      };
      const draw=time=>{
        ctx.clearRect(0,0,bounds.width,bounds.height);movePoints(time);
        lines.forEach((points,lineIndex)=>{
          ctx.beginPath();
          const alpha=.14+((lineIndex%5)===0?.08:0);
          ctx.strokeStyle=lineIndex%7===0?`rgba(147,136,75,${alpha})`:`rgba(188,208,209,${alpha})`;
          ctx.lineWidth=lineIndex%6===0?.85:.55;
          points.forEach((p,idx)=>{
            const last=idx===points.length-1,pt=moved(p,!last);
            if(idx===0)ctx.moveTo(pt.x,pt.y);else ctx.lineTo(pt.x,pt.y);
          });
          ctx.stroke();
        });
      };
      const updateMouse=(x,y)=>{mouse.x=x-bounds.left;mouse.y=y-bounds.top;if(!mouse.set){mouse.sx=mouse.x;mouse.sy=mouse.y;mouse.lx=mouse.x;mouse.ly=mouse.y;mouse.set=true}};
      const move=e=>updateMouse(e.clientX,e.clientY);
      const resize=()=>{setSize();setLines()};
      const tick=time=>{
        mouse.sx+=(mouse.x-mouse.sx)*.1;mouse.sy+=(mouse.y-mouse.sy)*.1;
        const dx=mouse.x-mouse.lx,dy=mouse.y-mouse.ly,d=Math.hypot(dx,dy);mouse.v=d;mouse.vs+=(d-mouse.vs)*.1;mouse.vs=Math.min(100,mouse.vs);mouse.lx=mouse.x;mouse.ly=mouse.y;mouse.a=Math.atan2(dy,dx);
        draw(time);
        raf=requestAnimationFrame(tick);
      };
      setSize();setLines();
      if(reduced())draw(0);else raf=requestAnimationFrame(tick);
      window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});
      return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move)};
    },[]);
    return h('canvas',{ref,className:'ats-waves','aria-hidden':'true','data-reactbits':'Waves'});
  }

  function PixelTrail(){
    const ref=useRef(null);
    useEffect(()=>{
      const canvas=ref.current;if(!canvas)return;
      const ctx=canvas.getContext('2d'),pixels=new Map();
      let w=0,hh=0,dpr=1,raf=0,lastX=-999,lastY=-999;
      const cell=14,maxAge=520;
      const resize=()=>{
        dpr=Math.min(window.devicePixelRatio||1,1.5);w=window.innerWidth;hh=window.innerHeight;
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(hh*dpr);canvas.style.width=w+'px';canvas.style.height=hh+'px';ctx.setTransform(dpr,0,0,dpr,0,0);
      };
      const add=(x,y)=>{
        const gx=Math.floor(x/cell),gy=Math.floor(y/cell),now=performance.now();
        const radius=window.innerWidth<700?1:2;
        for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++){
          const d=Math.abs(dx)+Math.abs(dy);if(d>radius+1)continue;
          const key=(gx+dx)+':'+(gy+dy);
          pixels.set(key,{x:(gx+dx)*cell,y:(gy+dy)*cell,t:now,a:Math.max(.28,1-d*.22)});
        }
      };
      const move=e=>{
        const d=Math.hypot(e.clientX-lastX,e.clientY-lastY);
        if(d>5){add(e.clientX,e.clientY);lastX=e.clientX;lastY=e.clientY}
      };
      const draw=now=>{
        ctx.clearRect(0,0,w,hh);
        for(const [key,p] of pixels){
          const age=now-p.t;if(age>maxAge){pixels.delete(key);continue}
          const a=(1-age/maxAge)*p.a,size=cell*(.36+.34*a);
          ctx.fillStyle=`rgba(147,136,75,${a*.92})`;
          ctx.fillRect(p.x+(cell-size)/2,p.y+(cell-size)/2,size,size);
          if(a>.45){
            ctx.strokeStyle=`rgba(226,223,207,${a*.17})`;ctx.lineWidth=.5;ctx.strokeRect(p.x+.5,p.y+.5,cell-1,cell-1);
          }
        }
        if(!reduced())raf=requestAnimationFrame(draw);
      };
      resize();window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});
      if(reduced())draw(performance.now());else raf=requestAnimationFrame(draw);
      return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move)};
    },[]);
    return h('canvas',{ref,className:'ats-pixel-trail','aria-hidden':'true','data-reactbits':'PixelTrail'});
  }

  function App(){
    return h(R.Fragment,null,
      h(Waves),
      h(PixelTrail),
      h('div',{className:'ats-react-grid','aria-hidden':'true'}),
      h('div',{className:'ats-react-vignette','aria-hidden':'true'})
    );
  }

  const root=document.getElementById('ats-react-root');
  if(root){
    document.body.classList.add('ats-react-theme');
    RD.createRoot(root).render(h(App));
    window.__CV_ATS_REACT__={
      schemaVersion:1,
      engine:'REACT_18_UMD',
      palette:'IVORY_ATLAS',
      components:['Waves','PixelTrail'],
      wavesSource:'DavidHDev/react-bits',
      pixelTrailMode:'LIGHTWEIGHT_2D_ADAPTATION',
      trailColor:palette.olive,
      printFallback:true,
      mounted:true
    };
  }
})();
