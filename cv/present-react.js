/* React Bits Threads presentation background.
 * Shader adapted from DavidHDev/react-bits Threads (MIT + Commons Clause).
 * Upstream: https://github.com/DavidHDev/react-bits
 */
(()=>{
  const R=window.React,RD=window.ReactDOM;
  if(!R||!RD)return;
  const h=R.createElement,{useEffect,useRef}=R;
  const reduced=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const vertex=`
    attribute vec2 position;
    varying vec2 vUv;
    void main(){vUv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}
  `;
  const fragment=`
    precision highp float;
    uniform float iTime;
    uniform vec3 iResolution;
    uniform vec3 uColor;
    uniform float uAmplitude;
    uniform float uDistance;
    uniform vec2 uMouse;
    #define PI 3.1415926538
    const int u_line_count=40;
    const float u_line_width=7.0;
    const float u_line_blur=10.0;
    float Perlin2D(vec2 P){
      vec2 Pi=floor(P);
      vec4 Pf_Pfmin1=P.xyxy-vec4(Pi,Pi+1.0);
      vec4 Pt=vec4(Pi.xy,Pi.xy+1.0);
      Pt=Pt-floor(Pt*(1.0/71.0))*71.0;
      Pt+=vec2(26.0,161.0).xyxy;
      Pt*=Pt;
      Pt=Pt.xzxz*Pt.yyww;
      vec4 hash_x=fract(Pt*(1.0/951.135664));
      vec4 hash_y=fract(Pt*(1.0/642.949883));
      vec4 grad_x=hash_x-0.49999;
      vec4 grad_y=hash_y-0.49999;
      vec4 grad_results=inversesqrt(grad_x*grad_x+grad_y*grad_y)*(grad_x*Pf_Pfmin1.xzxz+grad_y*Pf_Pfmin1.yyww);
      grad_results*=1.4142135623730950;
      vec2 blend=Pf_Pfmin1.xy*Pf_Pfmin1.xy*Pf_Pfmin1.xy*(Pf_Pfmin1.xy*(Pf_Pfmin1.xy*6.0-15.0)+10.0);
      vec4 blend2=vec4(blend,vec2(1.0-blend));
      return dot(grad_results,blend2.zxzx*blend2.wwyy);
    }
    float pixel(float count,vec2 resolution){return(1.0/max(resolution.x,resolution.y))*count;}
    float lineFn(vec2 st,float width,float perc,float offset,vec2 mouse,float time,float amplitude,float distance){
      float split_offset=(perc*0.4);
      float split_point=0.1+split_offset;
      float amplitude_normal=smoothstep(split_point,0.7,st.x);
      float finalAmplitude=amplitude_normal*0.5*amplitude*(1.0+(mouse.y-0.5)*0.2);
      float time_scaled=time/10.0+(mouse.x-0.5)*1.0;
      float blur=smoothstep(split_point,split_point+0.05,st.x)*perc;
      float xnoise=mix(
        Perlin2D(vec2(time_scaled,st.x+perc)*2.5),
        Perlin2D(vec2(time_scaled,st.x+time_scaled)*3.5)/1.5,
        st.x*0.3
      );
      float y=0.5+(perc-0.5)*distance+xnoise/2.0*finalAmplitude;
      float line_start=smoothstep(y+(width/2.0)+(u_line_blur*pixel(1.0,iResolution.xy)*blur),y,st.y);
      float line_end=smoothstep(y,y-(width/2.0)-(u_line_blur*pixel(1.0,iResolution.xy)*blur),st.y);
      return clamp((line_start-line_end)*(1.0-smoothstep(0.0,1.0,pow(perc,0.3))),0.0,1.0);
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/iResolution.xy;
      float line_strength=1.0;
      for(int i=0;i<u_line_count;i++){
        float p=float(i)/float(u_line_count);
        line_strength*=(1.0-lineFn(uv,u_line_width*pixel(1.0,iResolution.xy)*(1.0-p),p,(PI*1.0)*p,uMouse,iTime,uAmplitude,uDistance));
      }
      float colorVal=1.0-line_strength;
      gl_FragColor=vec4(uColor*colorVal,colorVal);
    }
  `;

  function shader(gl,type,source){
    const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(msg||'shader compile failed')}
    return s;
  }
  function program(gl){
    const p=gl.createProgram(),vs=shader(gl,gl.VERTEX_SHADER,vertex),fs=shader(gl,gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const msg=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error(msg||'program link failed')}
    return p;
  }

  function Threads(){
    const ref=useRef(null);
    useEffect(()=>{
      const canvas=ref.current;if(!canvas)return;
      const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true});
      if(!gl){canvas.dataset.fallback='true';return}
      let p;
      try{p=program(gl)}catch(err){console.error('Threads shader',err);canvas.dataset.fallback='true';return}
      gl.useProgram(p);
      const pos=gl.getAttribLocation(p,'position');
      const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      const u={
        time:gl.getUniformLocation(p,'iTime'),
        res:gl.getUniformLocation(p,'iResolution'),
        color:gl.getUniformLocation(p,'uColor'),
        amp:gl.getUniformLocation(p,'uAmplitude'),
        dist:gl.getUniformLocation(p,'uDistance'),
        mouse:gl.getUniformLocation(p,'uMouse')
      };
      gl.uniform3f(u.color,188/255,208/255,209/255);
      gl.uniform1f(u.amp,1.15);
      gl.uniform1f(u.dist,.34);
      let target=[.5,.5],current=[.5,.5],raf=0,w=0,hh=0,dpr=1;

      const resize=()=>{
        w=innerWidth;hh=innerHeight;
        const base=Math.min(devicePixelRatio||1,1.6);
        const maxDim=1700,longest=Math.max(w,hh)*base;
        dpr=longest>maxDim?base*maxDim/longest:base;
        canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(hh*dpr));
        canvas.style.width=w+'px';canvas.style.height=hh+'px';
        gl.viewport(0,0,canvas.width,canvas.height);
        gl.uniform3f(u.res,canvas.width,canvas.height,canvas.width/canvas.height);
      };
      const move=e=>{target=[e.clientX/Math.max(1,w),1-e.clientY/Math.max(1,hh)]};
      const leave=()=>{target=[.5,.5]};
      const draw=t=>{
        if(!document.hidden){
          current[0]+=(target[0]-current[0])*.055;current[1]+=(target[1]-current[1])*.055;
          gl.uniform2f(u.mouse,current[0],current[1]);
          gl.uniform1f(u.time,reduced()?0:t*.001);
          gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES,0,3);
        }
        if(!reduced())raf=requestAnimationFrame(draw);
      };
      resize();
      window.addEventListener('resize',resize);
      window.addEventListener('pointermove',move,{passive:true});
      document.addEventListener('mouseleave',leave);
      if(reduced())draw(0);else raf=requestAnimationFrame(draw);
      return()=>{
        cancelAnimationFrame(raf);
        window.removeEventListener('resize',resize);
        window.removeEventListener('pointermove',move);
        document.removeEventListener('mouseleave',leave);
        gl.deleteBuffer(buf);gl.deleteProgram(p);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
    },[]);
    return h('canvas',{ref,className:'present-threads','aria-hidden':'true','data-reactbits':'Threads'});
  }

  function App(){
    return h(R.Fragment,null,
      h(Threads),
      h('div',{className:'present-react-grid','aria-hidden':'true'}),
      h('div',{className:'present-react-vignette','aria-hidden':'true'}),
      h('div',{className:'present-react-grain','aria-hidden':'true'})
    );
  }

  const root=document.getElementById('present-react-root');
  if(root){
    document.body.classList.add('present-react-theme');
    RD.createRoot(root).render(h(App));
    window.__CV_PRESENT_REACT__={
      schemaVersion:1,
      engine:'REACT_18_UMD_WEBGL',
      palette:'IVORY_ATLAS',
      component:'Threads',
      source:'DavidHDev/react-bits',
      color:'#bcd0d1',
      amplitude:1.15,
      distance:.34,
      mouseInteraction:true,
      mounted:true
    };
  }
})();
