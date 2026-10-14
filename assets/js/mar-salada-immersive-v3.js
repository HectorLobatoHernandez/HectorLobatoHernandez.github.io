
(async()=>{
const host=document.querySelector('main.pa-page');
if(!host||!window.PROJECT_ATLAS_DATA||!String(window.PROJECT_ATLAS_DATA.name||'').includes('MAR SALADA'))return;
const mediaUrl='../xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json';
let registry={items:[]};
try{registry=await fetch(mediaUrl).then(r=>r.ok?r.json():Promise.reject(r.status))}catch(e){}
const items=registry.items||[];
const byId=id=>items.find(x=>x.id===id);
const fallback='../assets/visuals/sound-club-system.svg';
const pick=(id,fallbackSrc=fallback)=>byId(id)?.src||fallbackSrc;

const html=document.createElement('section');
html.className='msi-wrap';
html.id='virtual';
html.innerHTML=`
<div class="msi-shell">
  <div class="msi-head">
    <div><p class="msi-kicker">VIRTUAL TECHNICAL PRESENTATION / V1</p><h2>Space, systems, sound.</h2></div>
    <div><p>This layer turns the case study into an explorable technical presentation. The 3D scene is diagrammatic — it represents documented zones and system layers, not surveyed geometry. Source-backed drawings and media remain separately classified.</p><div style="margin-top:14px"><span class="msi-badge">DIAGRAMMATIC 3D · NOT AS-BUILT</span></div></div>
  </div>
  <div class="msi-stage-grid">
    <div class="msi-stage"><canvas id="msiThree"></canvas><div class="msi-stage-copy"><div><p class="msi-kicker">INTERACTIVE SYSTEM MODEL</p><h3>Five spatial zones / five technical layers.</h3><p>Drag to orbit. Toggle layers to read architecture, audio, lighting, KNX/DALI and acoustic intervention as one coordinated project.</p></div><div class="msi-coord">SOURCE LOGIC<br>PUBLIC-SAFE MODEL<br>GEOMETRY: SCHEMATIC</div></div></div>
    <aside class="msi-side">
      <div class="msi-panel"><p class="msi-kicker">LAYER CONTROL</p><h3>Technical visibility.</h3><p>Each layer can be isolated without pretending that the browser model is the construction CAD.</p>
        <div class="msi-layers">
          <button class="msi-layer is-on" data-layer="architecture"><i></i><span>Architecture / zones</span><em>01</em></button>
          <button class="msi-layer is-on" data-layer="audio"><i></i><span>Audio / DSP</span><em>02</em></button>
          <button class="msi-layer is-on" data-layer="lighting"><i></i><span>Lighting / DALI</span><em>03</em></button>
          <button class="msi-layer is-on" data-layer="control"><i></i><span>KNX / Gira X1</span><em>04</em></button>
          <button class="msi-layer is-on" data-layer="acoustics"><i></i><span>Acoustics / isolation</span><em>05</em></button>
        </div>
      </div>
      <div class="msi-panel"><p class="msi-kicker">EVIDENCE BOUNDARY</p><div class="msi-proof-list">
        <div class="msi-proof"><span>Zone logic</span><b>DOCUMENTED</b></div>
        <div class="msi-proof"><span>System interfaces</span><b>DOCUMENTED</b></div>
        <div class="msi-proof"><span>3D geometry</span><b>SCHEMATIC</b></div>
        <div class="msi-proof"><span>Acoustic values</span><b>PREDICTED / SOURCE REPORT</b></div>
        <div class="msi-proof"><span>Credentials / KNX secure</span><b>PRIVATE</b></div>
      </div></div>
    </aside>
  </div>
</div>
<div class="msi-shell msi-system">
  <div class="msi-head" style="padding-top:0">
    <div><p class="msi-kicker">SYSTEM ORBIT</p><h2>Interfaces define the project.</h2></div>
    <p>Rather than separating disciplines, this view shows the real coordination problem: audio, automation, lighting, mechanics and acoustics affect each other.</p>
  </div>
  <div class="msi-system-grid">
    <div class="msi-orbit">
      <div class="msi-core"><div><b>MAR SALADA</b><span>INTEGRATED SYSTEM</span></div></div>
      <div class="msi-node n1"><small>AUDIO</small>DSP matrix · amplifiers · tops · subs · DJ</div>
      <div class="msi-node n2"><small>CONTROL</small>KNX / ETS6 · Gira X1 · feedback</div>
      <div class="msi-node n3"><small>LIGHTING</small>DALI · dimmer · scenes · 2300 K atmosphere</div>
      <div class="msi-node n4"><small>MECHANICS</small>Ø48.3 tube · clamps · resilient suspension</div>
      <div class="msi-node n5"><small>ACOUSTICS</small>RT · LF control · raised floor · perimeter absorption</div>
    </div>
    <div class="msi-media-wall">
      <figure class="msi-media-card"><img src="\${pick('SC-BOARD-01')}" alt="Mar Salada architectural concept board"><figcaption><b>ARCHITECTURE / VISUAL NARRATIVE</b><br>GENERATED_CONCEPT · reference communication</figcaption></figure>
      <figure class="msi-media-card"><img src="../assets/visuals/sound-club-audio-plan.svg" alt="Audio distribution diagram"><figcaption><b>AUDIO DISTRIBUTION</b><br>GENERATED_DIAGRAM · documented routing logic</figcaption></figure>
      <figure class="msi-media-card"><img src="../assets/visuals/sound-club-control-plan.svg" alt="KNX DALI control diagram"><figcaption><b>KNX / DALI CONTROL</b><br>GENERATED_DIAGRAM · documented topology</figcaption></figure>
      <figure class="msi-media-card"><img src="../assets/visuals/sound-club-suspension-detail.svg" alt="Suspended structure anti-vibration detail"><figcaption><b>MECHANICAL DECOUPLING</b><br>DETAIL · source-backed installation logic</figcaption></figure>
      <figure class="msi-media-card"><img src="\${pick('SC-BOARD-04')}" alt="DJ booth exploded technical board"><figcaption><b>DJ BOOTH / FABRICATION</b><br>GENERATED_CONCEPT · dimensions not authoritative</figcaption></figure>
      <figure class="msi-media-card"><img src="\${pick('SC-BOARD-05')}" alt="Lighting atmosphere board"><figcaption><b>LIGHTING / ATMOSPHERE</b><br>GENERATED_CONCEPT · warm hospitality scene</figcaption></figure>
    </div>
  </div>
</div>
<div class="msi-shell msi-timeline">
  <div class="msi-head" style="padding-top:0">
    <div><p class="msi-kicker">VIDEO MASTER INDEX</p><h2>2 min 41 s of spatial presentation.</h2></div>
    <p>The supplied 1080p master is indexed here as a project source. A lightweight public derivative is intentionally kept separate from the source archive so the portfolio does not publish a heavy master or compromise source provenance.</p>
  </div>
  <div class="msi-video-index">
    <div class="msi-video-head"><div><h3>CLUB_DEL_MAR_VIDEO_DOSSIER_01</h3><p>1920 × 1080 · H.264 · 30 fps · supplied project master</p></div><div class="msi-timecode">00:00 → 02:41</div></div>
    <div class="msi-chapters">
      <div class="msi-chapter"><span>00:00–00:32</span><b>Arrival / structure</b><small>Ceiling, rails, AV objects, entrance sequence.</small></div>
      <div class="msi-chapter"><span>00:32–00:58</span><b>Interior zones</b><small>Bars, glass perimeter and circulation.</small></div>
      <div class="msi-chapter"><span>00:58–01:32</span><b>Hospitality core</b><small>Main room, furniture and lighting composition.</small></div>
      <div class="msi-chapter"><span>01:32–02:06</span><b>Lounge / details</b><small>Tables, integrated furniture and acoustic surfaces.</small></div>
      <div class="msi-chapter"><span>02:06–02:41</span><b>Exterior / exit</b><small>Terrace, envelope and closing sequence.</small></div>
    </div>
  </div>
</div>
<div class="msi-shell msi-cta">
  <div><p class="msi-kicker">NEXT MEDIA PASS</p><h2>Source models → web derivatives.</h2><p>The next build step is to publish optimized derivatives of the user-supplied videos and SketchUp/CAD sources, then replace the diagrammatic model with a browser-safe GLB where the geometry passes QA.</p></div>
  <div class="msi-actions"><a class="msi-btn primary" href="#systems">Technical case ↑</a><a class="msi-btn" href="./index.html">Project Atlas ↗</a></div>
</div>`;
const anchor=host.querySelector('.pa-section');
if(anchor)host.insertBefore(html,anchor);else host.appendChild(html);

let THREE;
try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js')}catch(e){return}
const canvas=document.getElementById('msiThree');if(!canvas)return;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x050807,.045);
const camera=new THREE.PerspectiveCamera(43,1,.1,100);camera.position.set(9,8,11);camera.lookAt(0,0,0);
const hemi=new THREE.HemisphereLight(0xd9d3c4,0x1b251f,1.5);scene.add(hemi);
const key=new THREE.DirectionalLight(0xe9bf7d,2.1);key.position.set(4,9,5);scene.add(key);
const floor=new THREE.Mesh(new THREE.BoxGeometry(12,.22,8),new THREE.MeshStandardMaterial({color:0x0e1512,roughness:.92,metalness:.05}));floor.position.y=-.2;scene.add(floor);
const grid=new THREE.GridHelper(12,12,0x33443b,0x17221d);grid.position.y=-.075;scene.add(grid);

const groups={architecture:new THREE.Group(),audio:new THREE.Group(),lighting:new THREE.Group(),control:new THREE.Group(),acoustics:new THREE.Group()};
Object.values(groups).forEach(g=>scene.add(g));
const zoneDefs=[
  [-2.5,0,-1.4,3.1,2.3,0x1d3840], [1.8,0,-1.1,2.3,2.7,0x402c24],
  [-3.1,0,2.0,2.0,1.65,0x24372c], [.1,0,2.25,3.0,1.45,0x383220], [3.25,0,2.0,1.55,1.65,0x2f2b38]
];
zoneDefs.forEach((z,i)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(z[3],.38,z[4]),new THREE.MeshStandardMaterial({color:z[5],transparent:true,opacity:.72,roughness:.78}));m.position.set(z[0],.1,z[2]);groups.architecture.add(m)});
for(let i=0;i<12;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.34,.48,.32),new THREE.MeshStandardMaterial({color:0x1b1b1b,metalness:.35,roughness:.5}));const a=i/12*Math.PI*2;s.position.set(Math.cos(a)*4.5,.55,Math.sin(a)*2.7);s.rotation.y=-a;groups.audio.add(s)}
for(let i=0;i<18;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.06,.09,.22,8),new THREE.MeshStandardMaterial({color:0xf0bd6d,emissive:0x9b5e1b,emissiveIntensity:2.4}));const x=-4.5+(i%9)*1.1,z=i<9?-2.8:2.9;l.position.set(x,2.2,z);groups.lighting.add(l)}
const ctrlMat=new THREE.LineBasicMaterial({color:0x63c7c8,transparent:true,opacity:.55});
zoneDefs.forEach((z,i)=>{const pts=[new THREE.Vector3(0,.38,0),new THREE.Vector3(z[0],.38,z[2])];groups.control.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),ctrlMat))});
const core=new THREE.Mesh(new THREE.BoxGeometry(.8,.7,.8),new THREE.MeshStandardMaterial({color:0x244d52,emissive:0x123035,emissiveIntensity:.9}));core.position.set(0,.45,0);groups.control.add(core);
const acMat=new THREE.MeshStandardMaterial({color:0x7b6b50,transparent:true,opacity:.36,side:THREE.DoubleSide});
for(let i=0;i<5;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.8),acMat);p.position.set(-4.8+i*2.35,1.25,-3.55);groups.acoustics.add(p)}
const sub1=new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,.7),new THREE.MeshStandardMaterial({color:0x1a1a18}));sub1.position.set(-2.8,.4,2.55);groups.audio.add(sub1);
const sub2=sub1.clone();sub2.position.x=2.4;groups.audio.add(sub2);

let yaw=.62,pitch=.48,dist=15,drag=false,lx=0,ly=0;
function applyCam(){const cp=Math.cos(pitch);camera.position.set(Math.sin(yaw)*cp*dist,Math.sin(pitch)*dist,Math.cos(yaw)*cp*dist);camera.lookAt(0,.5,0)}
applyCam();
canvas.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-lx)*.006;pitch=Math.max(.12,Math.min(1.05,pitch+(e.clientY-ly)*.004));lx=e.clientX;ly=e.clientY;applyCam()});
canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(9,Math.min(22,dist+e.deltaY*.01));applyCam()},{passive:false});
document.querySelectorAll('.msi-layer').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.layer;groups[key].visible=!groups[key].visible;btn.classList.toggle('is-on',groups[key].visible)}));
const ro=new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix()});ro.observe(canvas);
let raf=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function tick(t){if(!reduced){groups.lighting.rotation.y=Math.sin(t*.00018)*.025;groups.control.rotation.y=Math.sin(t*.00013)*.018}renderer.render(scene,camera);raf=requestAnimationFrame(tick)}tick(0);
window.__MAR_SALADA_IMMERSIVE__={schemaVersion:1,mode:'DIAGRAMMATIC_3D_SOURCE_BACKED',layers:Object.keys(groups),videoMaster:'CLUB_DEL_MAR_VIDEO_DOSSIER_01',publicVideoDerivative:false,geometry:'NOT_AS_BUILT',mounted:true};
})();
