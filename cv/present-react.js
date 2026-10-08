/* React Bits / Threads — presentation background.
 * Core shader + OGL renderer follow DavidHDev/react-bits Threads.
 * Upstream: https://github.com/DavidHDev/react-bits/tree/main/src/content/Backgrounds/Threads
 * OGL pinned to 1.0.11 for deterministic GitHub Pages rendering.
 */
import { Renderer, Program, Mesh, Triangle, Color } from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm';

const React = window.React;
const ReactDOM = window.ReactDOM;
if (!React || !ReactDOM) throw new Error('React runtime unavailable');

const { createElement:h, Fragment, useEffect, useRef } = React;

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

function Threads({
  color=[144/255,166/255,173/255],
  amplitude=1.10,
  distance=.32,
  enableMouseInteraction=true
}={}) {
  const containerRef=useRef(null);
  const animationFrameId=useRef(0);
  const propsRef=useRef({color,amplitude,distance,enableMouseInteraction});
  propsRef.current={color,amplitude,distance,enableMouseInteraction};

  useEffect(()=>{
    const container=containerRef.current;
    if(!container) return;

    const renderer=new Renderer({alpha:true});
    const gl=renderer.gl;
    gl.clearColor(0,0,0,0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    container.appendChild(gl.canvas);

    const geometry=new Triangle(gl);
    const program=new Program(gl,{
      vertex:vertexShader,
      fragment:fragmentShader,
      uniforms:{
        iTime:{value:0},
        iResolution:{value:new Color(gl.canvas.width,gl.canvas.height,gl.canvas.width/gl.canvas.height)},
        uColor:{value:new Color(...propsRef.current.color)},
        uAmplitude:{value:propsRef.current.amplitude},
        uDistance:{value:propsRef.current.distance},
        uMouse:{value:new Float32Array([.5,.5])}
      }
    });
    const mesh=new Mesh(gl,{geometry,program});

    const MAX_RENDER_DIM=1920;
    function resize(){
      const {clientWidth,clientHeight}=container;
      const baseDpr=Math.min(window.devicePixelRatio||1,2);
      const longestSide=Math.max(clientWidth,clientHeight)*baseDpr;
      const dpr=longestSide>MAX_RENDER_DIM?(baseDpr*MAX_RENDER_DIM)/longestSide:baseDpr;
      renderer.dpr=dpr;
      renderer.setSize(clientWidth,clientHeight);
      program.uniforms.iResolution.value.r=gl.canvas.width;
      program.uniforms.iResolution.value.g=gl.canvas.height;
      program.uniforms.iResolution.value.b=gl.canvas.width/gl.canvas.height;
    }

    const resizeObserver=new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener('resize',resize);
    resize();

    const currentMouse=[.5,.5];
    let targetMouse=[.5,.5];
    function handleMouseMove(e){
      targetMouse=[e.clientX/Math.max(1,window.innerWidth),1-(e.clientY/Math.max(1,window.innerHeight))];
    }
    function handleMouseLeave(){targetMouse=[.5,.5]}
    window.addEventListener('pointermove',handleMouseMove,{passive:true});
    document.addEventListener('mouseleave',handleMouseLeave);

    let isVisible=true;
    const intersectionObserver=new IntersectionObserver(entries=>{
      isVisible=entries[0]?.isIntersecting!==false;
    },{threshold:0});
    intersectionObserver.observe(container);

    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
    function renderFrame(t){
      if(!isVisible||document.hidden) return;
      const {color,amplitude,distance,enableMouseInteraction}=propsRef.current;
      program.uniforms.uColor.value.set(...color);
      program.uniforms.uAmplitude.value=amplitude;
      program.uniforms.uDistance.value=distance;
      if(enableMouseInteraction){
        const smoothing=.05;
        currentMouse[0]+=smoothing*(targetMouse[0]-currentMouse[0]);
        currentMouse[1]+=smoothing*(targetMouse[1]-currentMouse[1]);
        program.uniforms.uMouse.value[0]=currentMouse[0];
        program.uniforms.uMouse.value[1]=currentMouse[1];
      }else{
        program.uniforms.uMouse.value[0]=.5;
        program.uniforms.uMouse.value[1]=.5;
      }
      program.uniforms.iTime.value=reduced?0:t*.001;
      renderer.render({scene:mesh});
    }
    function update(t){
      animationFrameId.current=requestAnimationFrame(update);
      renderFrame(t);
    }
    if(reduced) renderFrame(0);
    else animationFrameId.current=requestAnimationFrame(update);

    return()=>{
      if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('resize',resize);
      window.removeEventListener('pointermove',handleMouseMove);
      document.removeEventListener('mouseleave',handleMouseLeave);
      if(container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  },[]);

  return h('div',{
    ref:containerRef,
    className:'threads-container',
    'data-reactbits':'Threads',
    'data-source':'DavidHDev/react-bits'
  });
}

function App(){
  return h(Fragment,null,
    h(Threads,{color:[144/255,166/255,173/255],amplitude:1.10,distance:.32,enableMouseInteraction:true}),
    h('div',{className:'present-react-wash','aria-hidden':'true'}),
    h('div',{className:'present-react-grid','aria-hidden':'true'}),
    h('div',{className:'present-react-grain','aria-hidden':'true'})
  );
}

const root=document.getElementById('present-react-root');
if(root){
  document.body.classList.add('present-react-theme');
  ReactDOM.createRoot(root).render(h(App));
  window.__CV_PRESENT_REACT__={
    schemaVersion:2,
    engine:'REACT_18_UMD + OGL_1_0_11',
    palette:'OBSIDIAN_EDITORIAL',
    component:'Threads',
    source:'DavidHDev/react-bits',
    sourcePinned:true,
    threadColor:'#90a6ad',
    accentColor:'#bd654b',
    amplitude:1.10,
    distance:.32,
    mouseInteraction:true,
    mounted:true
  };
}
