
import React,{useMemo,useRef,useEffect} from 'https://esm.sh/react@19.1.1';
import {createRoot} from 'https://esm.sh/react-dom@19.1.1/client';
import * as THREE from 'https://esm.sh/three@0.181.1';
import {Canvas,useFrame,useLoader} from 'https://esm.sh/@react-three/fiber@9.3.0?external=react,react-dom,three';
import {ScrollControls,Scroll,useScroll,Environment} from 'https://esm.sh/@react-three/drei@10.7.4?external=react,react-dom,three,@react-three/fiber';

const h=React.createElement;
const PLAN='https://d2ol7oe51mr4n9.cloudfront.net/user_3I3SzGDcpPFtcj4NduumHmHAuKs/5d2cdf5c-42f4-4ad4-9707-cf87b1c849db.jpg';
const MONTAGE='https://d2ol7oe51mr4n9.cloudfront.net/user_3I3SzGDcpPFtcj4NduumHmHAuKs/3ae0229c-71c2-4359-a777-095b30f70f9d.jpg';
const HERO='../assets/projects/casa-alain/hero.webp';

function cropTexture(base,cols,rows,col,row){
  const t=base.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
  t.repeat.set(1/cols,1/rows);t.offset.set(col/cols,(rows-row-1)/rows);
  t.colorSpace=THREE.SRGBColorSpace;return t;
}
function City({group}){
  const specs=[
    [-4.2,.3,-1.8,1.5,.7,1.2],[-2.0,.35,-2.4,1.2,1.35,1.0],[0,.45,-1.1,1.6,1.75,1.3],[2.7,.35,-2.2,1.2,1.05,1.0],
    [-3.2,.35,1.3,1.25,.85,1.1],[-.9,.35,2.0,1.5,1.15,1.1],[2.2,.35,1.5,1.45,1.4,1.2]
  ];
  return h('group',{ref:group},
    h('mesh',{position:[0,-.18,0]},h('boxGeometry',{args:[11,.22,7]}),h('meshStandardMaterial',{color:'#10161d',roughness:.95})),
    ...specs.map((s,i)=>h('mesh',{key:i,position:[s[0],s[1],s[2]]},
      h('boxGeometry',{args:[s[3],s[4],s[5]]}),
      h('meshStandardMaterial',{color:i===2?'#0a57c9':'#e3ded2',roughness:.72,metalness:0,transparent:true,opacity:i===2?.98:.78})
    ))
  );
}
function Wall({pos,args,scaleY=1}){return h('mesh',{position:pos,scale:[1,scaleY,1]},h('boxGeometry',{args}),h('meshStandardMaterial',{color:'#e6e1d7',roughness:.82,transparent:true,opacity:.95}))}
function Room({group}){
  return h('group',{ref:group},
    h('mesh',{position:[0,.03,0]},h('boxGeometry',{args:[5.6,.08,7]}),h('meshStandardMaterial',{color:'#ddd8cd',roughness:.96,transparent:true,opacity:.82})),
    h(Wall,{pos:[0,1.25,-3.45],args:[5.6,2.5,.16]}),
    h(Wall,{pos:[0,1.25,3.45],args:[5.6,2.5,.16]}),
    h(Wall,{pos:[-2.72,1.25,0],args:[.16,2.5,7]}),
    h(Wall,{pos:[2.72,1.25,0],args:[.16,2.5,7]})
  );
}
function MediaPlane({tex,pos,rot=[0,0,0],scale=[3.2,1.8,1],opacity=1}){
  const mat=useRef();
  useEffect(()=>{if(mat.current)mat.current.opacity=opacity},[opacity]);
  return h('mesh',{position:pos,rotation:rot,scale},h('planeGeometry',{args:[1,1]}),h('meshBasicMaterial',{ref:mat,map:tex,transparent:true,opacity,toneMapped:false,side:THREE.DoubleSide}));
}
function Scene(){
  const scroll=useScroll();
  const city=useRef(),planG=useRef(),room=useRef(),gallery=useRef(),hero=useRef();
  const planBase=useLoader(THREE.TextureLoader,PLAN);
  const montageBase=useLoader(THREE.TextureLoader,MONTAGE);
  const heroTex=useLoader(THREE.TextureLoader,HERO);
  const planTex=useMemo(()=>cropTexture(planBase,2,2,1,1),[planBase]);
  const renders=useMemo(()=>[
    cropTexture(montageBase,3,3,0,0),cropTexture(montageBase,3,3,1,0),cropTexture(montageBase,3,3,0,1),
    cropTexture(montageBase,3,3,2,1),cropTexture(montageBase,3,3,0,2)
  ],[montageBase]);
  useEffect(()=>{planBase.colorSpace=montageBase.colorSpace=heroTex.colorSpace=THREE.SRGBColorSpace},[planBase,montageBase,heroTex]);

  useFrame((state,dt)=>{
    const p=scroll.offset;
    document.documentElement.style.setProperty('--cr-progress',String(p));
    const prog=document.querySelector('.cr-progress');if(prog)prog.style.width=(p*100)+'%';
    // City arrival 0-.14
    const cityFade=THREE.MathUtils.smoothstep(p,.07,.16);
    city.current.visible=cityFade<.995;city.current.position.y=THREE.MathUtils.lerp(0,-2.8,cityFade);city.current.scale.setScalar(THREE.MathUtils.lerp(1,1.35,cityFade));
    city.current.traverse(o=>{if(o.material)o.material.opacity=(o.userData.baseOpacity??o.material.opacity)*(1-cityFade)});
    // Source plan .10-.32
    const planIn=THREE.MathUtils.smoothstep(p,.10,.17);const planOut=1-THREE.MathUtils.smoothstep(p,.31,.37);
    planG.current.visible=planIn*planOut>.01;
    planG.current.rotation.x=THREE.MathUtils.lerp(-Math.PI/2,-1.02,THREE.MathUtils.smoothstep(p,.13,.24));
    planG.current.rotation.z=THREE.MathUtils.lerp(-.12,.08,THREE.MathUtils.smoothstep(p,.13,.30));
    planG.current.scale.setScalar(THREE.MathUtils.lerp(1.25,2.05,THREE.MathUtils.smoothstep(p,.13,.25)));
    planG.current.position.set(0,THREE.MathUtils.lerp(-.45,.15,planIn),0);
    planG.current.traverse(o=>{if(o.material)o.material.opacity=planIn*planOut});
    // Room build .22-.40
    const build=THREE.MathUtils.smoothstep(p,.22,.34);const roomOut=1-THREE.MathUtils.smoothstep(p,.43,.49);
    room.current.visible=build*roomOut>.01;room.current.scale.y=build;room.current.position.y=THREE.MathUtils.lerp(-1.3,0,build);
    room.current.rotation.y=THREE.MathUtils.lerp(-.25,.18,THREE.MathUtils.smoothstep(p,.30,.43));
    room.current.traverse(o=>{if(o.material)o.material.opacity=.92*build*roomOut});
    // Hero interior .36-.48
    const hi=THREE.MathUtils.smoothstep(p,.36,.42)*(1-THREE.MathUtils.smoothstep(p,.49,.53));
    hero.current.visible=hi>.01;hero.current.material.opacity=hi;hero.current.scale.setScalar(THREE.MathUtils.lerp(4.6,5.15,THREE.MathUtils.smoothstep(p,.36,.48)));
    // Gallery .43-.88
    const gi=THREE.MathUtils.smoothstep(p,.43,.49)*(1-THREE.MathUtils.smoothstep(p,.88,.92));gallery.current.visible=gi>.01;
    gallery.current.rotation.y+=dt*.10*gi;
    gallery.current.position.y=THREE.MathUtils.lerp(-.2,.25,gi);
    gallery.current.children.forEach((m,i)=>{if(m.material)m.material.opacity=gi*(i===Math.min(4,Math.floor(THREE.MathUtils.clamp((p-.43)/.09,0,4.99)))?1:.24)});
    // Camera choreography
    const cam=state.camera;
    let targetPos,targetLook=new THREE.Vector3(0,.35,0);
    if(p<.13)targetPos=new THREE.Vector3(9,7.5,11);
    else if(p<.28)targetPos=new THREE.Vector3(0,7.4,6.2);
    else if(p<.43)targetPos=new THREE.Vector3(7,5.2,8.6);
    else {const q=THREE.MathUtils.clamp((p-.43)/.45,0,1),a=-.5+q*2.8;targetPos=new THREE.Vector3(Math.sin(a)*8.4,3.2+Math.sin(q*Math.PI)*1.2,Math.cos(a)*8.4)}
    cam.position.lerp(targetPos,1-Math.exp(-dt*3.2));cam.lookAt(targetLook);
  });

  return h(React.Fragment,null,
    h('ambientLight',{intensity:1.2}),h('directionalLight',{position:[5,9,4],intensity:2.2,color:'#fff0da'}),h('directionalLight',{position:[-4,5,-3],intensity:1.1,color:'#5d86bc'}),
    h(City,{group:city}),
    h('group',{ref:planG,position:[0,0,0]},
      h(MediaPlane,{tex:planTex,pos:[0,0,0],rot:[-Math.PI/2,0,0],scale:[7.2,5.2,1],opacity:1}),
      h('lineSegments',{position:[0,.05,0]},h('edgesGeometry',{args:[new THREE.BoxGeometry(3.0,.02,3.7)]}),h('lineBasicMaterial',{color:'#0071FF'}))
    ),
    h(Room,{group:room}),
    h('mesh',{ref:hero,position:[0,2,-2.1],visible:false},h('planeGeometry',{args:[1.78,1]}),h('meshBasicMaterial',{map:heroTex,transparent:true,opacity:0,toneMapped:false})),
    h('group',{ref:gallery,visible:false},
      ...renders.map((t,i)=>{const a=i/renders.length*Math.PI*2;return h(MediaPlane,{key:i,tex:t,pos:[Math.sin(a)*5.1,1.7,Math.cos(a)*5.1],rot:[0,a+Math.PI,0],scale:[3.2,1.8,1],opacity:.25})})
    )
  );
}

function Overlay(){
 return h(Scroll,{html:true},
  h('div',{className:'cr-scroll-html'},
   h('section',{className:'cr-panel'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'PROJECT ATLAS / CITY ENTRY'),h('h1',null,'Enter Casa Alain.',h('br'),h('em',null,'From city to plan.')),h('p',null,'The opening field is a navigation model only. Casa Alain then resolves into its real source plan and project media.'),h('div',{className:'cr-tags'},h('span',null,'No geographic claim'),h('span',null,'Real source plan'),h('span',null,'R3F / useScroll')))),
   h('section',{className:'cr-panel right'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'01 / SOURCE PLAN'),h('h2',null,'Locate the actual project zone.'),h('p',null,'The house drawing is the source. Scroll isolates the Casa Alain room before any wall animation begins.'))),
   h('section',{className:'cr-panel'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'02 / ROOM BUILD'),h('h2',null,'Walls rise from the plan footprint.'),h('p',null,'The browser only builds the room perimeter for the transition. Doors, glazing, furniture and acoustic geometry remain tied to the supplied SketchUp and render archive.'))),
   h('section',{className:'cr-panel right'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'03 / ENTER THE ROOM'),h('h2',null,'Architecture becomes listening space.'),h('p',null,'The plan gives way to the real project render. From this point the visual story uses only supplied Casa Alain imagery.'))),
   h('section',{className:'cr-panel'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'04 / ARCHITECTURE'),h('h2',null,'Room organization.'),h('p',null,'The source plan continues to orbit as a reference while the selected render set explains access, DJ position, cinema wall and room composition.'))),
   h('section',{className:'cr-panel right'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'05 / ACOUSTICS'),h('h2',null,'Treatment by function.'),h('p',null,'Low-frequency control, rear diffusion/absorption, side reflections, ceiling treatment and variable curtains are read as an acoustic system, not as decoration.'))),
   h('section',{className:'cr-panel'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'06 / CINEMA / AV'),h('h2',null,'KEF architectural cinema.'),h('p',null,'The documented system uses a Ci4100QL-THX front stage, architectural surrounds and height channels, Kube 12 MIE subwoofer and Denon AVR-X2800H.'),h('div',{className:'cr-system'},h('div',null,h('small',null,'LCR / 3×'),h('b',null,'KEF Ci4100QL-THX')),h('div',null,h('small',null,'SURROUND'),h('b',null,'KEF Ci160QL')),h('div',null,h('small',null,'HEIGHT'),h('b',null,'KEF Ci130QS')),h('div',null,h('small',null,'SUB'),h('b',null,'KEF Kube 12 MIE')),h('div',null,h('small',null,'AVR'),h('b',null,'Denon AVR-X2800H'))))),
   h('section',{className:'cr-panel right'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'07 / DJ + CEILING'),h('h2',null,'A second listening condition.'),h('p',null,'The DJ position has local reflection control. Ceiling diffusers, broadband clouds and variable curtains change the room response without abandoning the cinema use case.'))),
   h('section',{className:'cr-panel'},h('div',{className:'cr-copy'},h('div',{className:'cr-kicker'},'08 / PROJECT FILM + ARCHIVE'),h('h2',null,'From model to evidence.'),h('p',null,'The final section hands off to the project film and technical archive: house plan, SketchUp source, acoustic report, audio documentation and project master video.')))
  )
 );
}
function App(){
 return h('div',{className:'cr-shell'},
  h('div',{className:'cr-progress'}),
  h('header',{className:'cr-top'},h('a',{className:'cr-brand',href:'./index.html'},'PROJECT ATLAS',h('small',null,'CASA ALAIN / R3F SCROLL STUDY')),h('nav',null,h('a',{href:'./casa-alain.html'},'Current case'),h('a',{href:'./index.html'},'All projects'),h('a',{href:'./systems.html'},'Systems'))),
  h('div',{className:'cr-canvas'},h(Canvas,{camera:{position:[9,7.5,11],fov:42,near:.1,far:100},dpr:[1,1.7],gl:{antialias:true,alpha:false},onCreated:({gl})=>{gl.setClearColor('#01030F');gl.outputColorSpace=THREE.SRGBColorSpace}},
    h(ScrollControls,{pages:9,damping:.22,maxSpeed:.55},h(Scene),h(Overlay))
  )),
  h('div',{className:'cr-hint'},'SCROLL TO BUILD THE PROJECT ↓'),
  h('div',{className:'cr-watermark'},h('b',null,'REAL PROJECT MEDIA'),h('br'),'ATLAS CITY = INTERFACE ONLY',h('br'),'PLAN / SKETCHUP / RENDERS / ACOUSTIC REPORT')
 );
}
createRoot(document.getElementById('root')).render(h(App));
window.__CASA_ALAIN_R3F__={schemaVersion:1,reference:'DREI_SCROLLCONTROLS_4JR4P_PATTERN',sourceBacked:true,atlasCityGeographic:false,roomBuild:'PLAN_DERIVED_PERIMETER',realMediaOnly:true};
