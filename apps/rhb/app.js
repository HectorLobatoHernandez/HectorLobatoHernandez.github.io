(()=>{
  const E=React.createElement;
  const {useEffect,useRef,useState}=React;
  const DATA_URL='./demo-data.json';
  const STORAGE_KEY='rhb-studio-public-demo-v1';
  const NAV=[['dashboard','Dashboard'],['project','Project Core'],['survey','Survey / CAD'],['bom','BOM / Estimate'],['router','Agent Router'],['docs','Documents'],['qa','QA / Handover']];
  const money=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(n)||0);
  const clone=x=>JSON.parse(JSON.stringify(x));
  const uid=(p='x')=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);

  function loadState(seed){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(raw){const parsed=JSON.parse(raw);if(parsed?.schemaVersion===1&&Array.isArray(parsed.projects))return parsed;}
    }catch(e){}
    return {schemaVersion:1,projects:clone(seed),activeProjectId:seed[0]?.id||null,events:[]};
  }
  const saveState=state=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  function download(filename,text,type='text/plain'){
    const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
  }
  function routeTask(text,agents){
    const t=(text||'').toLowerCase();
    const scored=agents.map(a=>({agent:a,score:a.tags.reduce((n,k)=>n+(t.includes(k)?1:0),0)})).sort((a,b)=>b.score-a.score);
    return scored[0]?.score>0?scored[0].agent:agents.find(a=>a.id==='pm')||agents[0];
  }

  function Shell({data,state,setState}){
    const [view,setView]=useState('dashboard');const [toast,setToast]=useState('');const importRef=useRef(null);
    const active=state.projects.find(p=>p.id===state.activeProjectId)||state.projects[0]||null;
    useEffect(()=>saveState(state),[state]);
    useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),2400);return()=>clearTimeout(t)},[toast]);
    const updateProject=fn=>{if(!active)return;setState(s=>({...s,projects:s.projects.map(p=>p.id===active.id?fn(clone(p)):p)}));};
    const log=(kind,msg)=>setState(s=>({...s,events:[{id:uid('ev'),at:new Date().toISOString(),kind,msg},...(s.events||[])].slice(0,30)}));
    const createProject=()=>{
      const id='RHB-DEMO-'+String(state.projects.length+1).padStart(3,'0');
      const p={id,name:'Nuevo proyecto',type:'General',status:'INTAKE',client:'Demo browser',location:'',description:'',dimensions:{width:1000,height:1000},bom:[],qa:[
        {id:uid('q'),label:'Alcance confirmado',done:false},{id:uid('q'),label:'Cotas críticas verificadas',done:false},{id:uid('q'),label:'Entregables aprobados',done:false}
      ]};
      setState(s=>({...s,projects:[...s.projects,p],activeProjectId:id}));setView('project');log('PROJECT','Created '+id);setToast('Proyecto demo creado');
    };
    const reset=()=>{
      if(!confirm('Restablecer la demo y borrar los cambios guardados en este navegador?'))return;
      localStorage.removeItem(STORAGE_KEY);setState({schemaVersion:1,projects:clone(data.seedProjects),activeProjectId:data.seedProjects[0]?.id||null,events:[]});setView('dashboard');setToast('Demo restablecida');
    };
    const exportState=()=>{download('RHB_STUDIO_PUBLIC_DEMO_STATE.json',JSON.stringify(state,null,2),'application/json');log('EXPORT','Browser demo state exported');setToast('JSON exportado');};
    const importState=async e=>{
      const f=e.target.files?.[0];if(!f)return;
      try{const parsed=JSON.parse(await f.text());if(!Array.isArray(parsed.projects))throw new Error('Invalid projects');
        setState({schemaVersion:1,projects:parsed.projects,activeProjectId:parsed.activeProjectId||parsed.projects[0]?.id||null,events:parsed.events||[]});setToast('Estado importado');
      }catch(err){alert('JSON no compatible con la demo.')}e.target.value='';
    };
    return E('div',{className:'demo-app'},
      E('header',{className:'demo-top'},
        E('div',{className:'demo-brand'},E('img',{src:'../../assets/visuals/rhb-monogram.svg',alt:''}),E('div',null,E('b',null,'RHB STUDIO'),E('small',null,'FUNCTIONAL PUBLIC DEMO'))),
        E('div',{className:'demo-mode'},E('i',null),'BROWSER ONLY · NO PRIVATE BACKEND'),
        E('div',{className:'demo-actions'},
          E('button',{onClick:createProject},'+ Project'),E('button',{onClick:exportState},'Export JSON'),E('button',{onClick:()=>importRef.current?.click()},'Import'),
          E('button',{className:'ghost',onClick:reset},'Reset'),E('a',{href:'../../projects/rhb-studio.html'},'Case ↗'),
          E('input',{ref:importRef,type:'file',accept:'application/json',onChange:importState,hidden:true})
        )
      ),
      E('aside',{className:'demo-side'},
        E('div',{className:'demo-project-switch'},E('label',null,'ACTIVE PROJECT'),E('select',{value:active?.id||'',onChange:e=>setState(s=>({...s,activeProjectId:e.target.value}))},...state.projects.map(p=>E('option',{key:p.id,value:p.id},p.id+' · '+p.name)))),
        E('nav',null,...NAV.map(([id,label])=>E('button',{key:id,className:view===id?'active':'',onClick:()=>setView(id)},E('span',null,label)))),
        E('div',{className:'demo-side-note'},E('b',null,'PUBLIC DEMO'),E('p',null,'Los cambios se guardan en localStorage de este navegador. No se envían a RHB STUDIO local ni a servicios externos.'))
      ),
      E('main',{className:'demo-main'},
        view==='dashboard'?E(Dashboard,{data,state,setState,setView,active}):null,
        view==='project'?E(ProjectCore,{data,active,updateProject,log}):null,
        view==='survey'?E(SurveyCad,{active,updateProject,log}):null,
        view==='bom'?E(Bom,{active,updateProject,log}):null,
        view==='router'?E(Router,{active,agents:data.agents,log}):null,
        view==='docs'?E(Documents,{active,log}):null,
        view==='qa'?E(Qa,{active,updateProject,log,data}):null
      ),
      toast?E('div',{className:'demo-toast'},toast):null
    );
  }

  function Dashboard({data,state,setState,setView,active}){
    const total=state.projects.reduce((sum,p)=>sum+p.bom.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.unitCost)||0),0),0);
    const qaDone=state.projects.reduce((s,p)=>s+p.qa.filter(x=>x.done).length,0);const qaAll=state.projects.reduce((s,p)=>s+p.qa.length,0);
    return E(React.Fragment,null,
      E('section',{className:'demo-hero'},E('div',null,E('p',{className:'eyebrow'},'PROJECT OPERATING SYSTEM / PUBLIC DEMO'),E('h1',null,'Make the project state visible.'),E('p',null,'Una demo funcional de la capa de proyecto: estado, survey, geometría paramétrica, BOM, routing, documentación y QA.')),
        E('div',{className:'demo-contract'},E('b',null,'BOUNDARY'),E('span',null,'Front-end demonstrator'),E('span',null,'Browser persistence'),E('span',null,'No OmniRoute/OpenClaw/NEXO connection'))),
      E('section',{className:'metric-grid'},E(Metric,{label:'Projects',value:String(state.projects.length),note:'browser state'}),E(Metric,{label:'BOM value',value:money(total),note:'demo estimate'}),E(Metric,{label:'QA checks',value:qaDone+'/'+qaAll,note:'project gates'}),E(Metric,{label:'Stages',value:String(data.stages.length),note:'intake → handover'})),
      E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'ACTIVE WORK'),E('h2',null,'Projects')),E('span',null,'Select a project and open a module')),
        E('div',{className:'project-grid'},...state.projects.map(p=>{const subtotal=p.bom.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.unitCost)||0),0);const done=p.qa.filter(x=>x.done).length;return E('article',{key:p.id,className:'project-card '+(p.id===active?.id?'selected':'')},
          E('small',null,p.id),E('h3',null,p.name),E('p',null,p.description||'No description yet.'),E('div',{className:'project-meta'},E('span',null,p.status),E('span',null,money(subtotal)),E('span',null,done+'/'+p.qa.length+' QA')),E('button',{onClick:()=>{setState(s=>({...s,activeProjectId:p.id}));setView('project')}},'Open project →'));}))),
      E('section',{className:'panel event-panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'TRACE'),E('h2',null,'Recent events')),E('span',null,'demo-local')),
        state.events?.length?E('div',{className:'events'},...state.events.slice(0,8).map(ev=>E('div',{key:ev.id},E('time',null,new Date(ev.at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})),E('b',null,ev.kind),E('span',null,ev.msg)))):E('p',{className:'empty'},'No events yet. Interact with a project to create an audit trace.'))
    );
  }
  function Metric({label,value,note}){return E('article',{className:'metric'},E('small',null,label),E('b',null,value),E('span',null,note))}
  function ProjectCore({data,active,updateProject,log}){
    if(!active)return E(Empty);const stageIndex=Math.max(0,data.stages.indexOf(active.status));
    return E(React.Fragment,null,E(ModuleTitle,{kicker:'PROJECT CORE',title:active.name,desc:'Estado, alcance, identificación y avance del proyecto.'}),
      E('section',{className:'panel form-panel'},E('div',{className:'field-grid'},E(Field,{label:'Project ID',value:active.id,disabled:true}),E(Field,{label:'Name',value:active.name,onChange:v=>updateProject(p=>(p.name=v,p))}),E(Field,{label:'Type',value:active.type,onChange:v=>updateProject(p=>(p.type=v,p))}),E(Field,{label:'Client / account',value:active.client,onChange:v=>updateProject(p=>(p.client=v,p))}),E(Field,{label:'Location',value:active.location,onChange:v=>updateProject(p=>(p.location=v,p))}),E('label',{className:'field span-2'},E('span',null,'Description'),E('textarea',{value:active.description,onChange:e=>updateProject(p=>(p.description=e.target.value,p)),rows:4})))),
      E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'WORKFLOW'),E('h2',null,'Project stage')),E('b',{className:'stage-code'},String(stageIndex+1).padStart(2,'0')+'/'+String(data.stages.length).padStart(2,'0'))),
        E('div',{className:'stage-track'},...data.stages.map((s,i)=>E('button',{key:s,className:(s===active.status?'active ':'')+(i<stageIndex?'done':''),onClick:()=>{updateProject(p=>(p.status=s,p));log('STAGE',active.id+' → '+s)}},E('i',null),E('span',null,s)))))
    );
  }
  function Field({label,value,onChange,disabled,type='text'}){return E('label',{className:'field'},E('span',null,label),E('input',{type,value:value??'',disabled,onChange:e=>onChange?.(e.target.value)}))}
  function ModuleTitle({kicker,title,desc,extra}){return E('section',{className:'module-title'},E('div',null,E('p',{className:'eyebrow'},kicker),E('h1',null,title),E('p',null,desc)),extra||null)}
  function SurveyCad({active,updateProject,log}){
    const [preview,setPreview]=useState('');if(!active)return E(Empty);const dims=active.dimensions||{};const isGate=/gate|puerta|sliding/i.test(active.type+' '+active.name);const width=Number(dims.width)||1000;const height=Number(dims.height)||750;const ped=Number(dims.pedestrian)||900;
    const setDim=(k,v)=>updateProject(p=>(p.dimensions={...p.dimensions,[k]:Number(v)||0},p));
    return E(React.Fragment,null,E(ModuleTitle,{kicker:'SURVEY / CAD',title:'Measured input → parametric sketch',desc:'La demo no genera DWG. Permite capturar referencias y comprobar cómo una geometría base responde a cotas editables.'}),
      E('div',{className:'two-col'},E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'01 / SURVEY'),E('h2',null,'Source intake')),E('span',null,'local preview only')),
        E('label',{className:'upload'},E('input',{type:'file',accept:'image/*',onChange:e=>{const f=e.target.files?.[0];if(!f)return;const url=URL.createObjectURL(f);setPreview(url);log('SURVEY','Loaded local image preview: '+f.name);}}),preview?E('img',{src:preview,alt:'Local survey preview'}):E('span',null,'Select a survey image\n(no upload)')),
        E('div',{className:'dimension-grid'},E(Field,{label:'Width (mm)',type:'number',value:width,onChange:v=>setDim('width',v)}),isGate?E(Field,{label:'Height (mm)',type:'number',value:height,onChange:v=>setDim('height',v)}):E(Field,{label:'Depth (mm)',type:'number',value:Number(dims.depth)||800,onChange:v=>setDim('depth',v)}),E(Field,{label:isGate?'Pedestrian (mm)':'Height (mm)',type:'number',value:isGate?ped:height,onChange:v=>setDim(isGate?'pedestrian':'height',v)})),E('button',{className:'primary-action',onClick:()=>log('CAD','Parametric dimensions reviewed for '+active.id)},'Mark dimensions reviewed')),
        E('section',{className:'panel cad-panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'02 / LIVE SKETCH'),E('h2',null,isGate?'Sliding gate':'Table base')),E('span',null,'SVG parametric preview')),isGate?E(GateSketch,{width,height,ped}):E(TableSketch,{width,depth:Number(dims.depth)||800,height}),E('p',{className:'cad-note'},'Diagrammatic browser geometry. Fabrication requires verified CAD/drawing and physical measurements.')))
    );
  }
  function GateSketch({width,height,ped}){const W=820,H=430,pad=60,gw=W-pad*2,gh=H-pad*2,p=Math.max(.12,Math.min(.42,ped/Math.max(width,1)));return E('svg',{viewBox:'0 0 '+W+' '+H,className:'live-cad'},E('rect',{x:pad,y:pad,width:gw,height:gh,fill:'none',stroke:'currentColor'}),E('line',{x1:pad+gw*(1-p),y1:pad,x2:pad+gw*(1-p),y2:pad+gh,stroke:'currentColor'}),E('line',{x1:pad,y1:pad-22,x2:pad+gw,y2:pad-22,stroke:'currentColor'}),E('text',{x:W/2,y:pad-30,textAnchor:'middle'},width+' mm'),E('text',{x:pad+gw*(1-p/2),y:pad+gh/2,textAnchor:'middle'},ped+' mm'),E('path',{d:'M '+(pad+gw*.7)+' '+(pad+gh+32)+' H '+(pad+gw*.16),stroke:'var(--accent)',fill:'none'}),E('path',{d:'M '+(pad+gw*.16)+' '+(pad+gh+32)+' l 18 -8 l 0 16 z',fill:'var(--accent)'}),E('text',{x:pad,y:H-15},'OPEN LEFT / schematic'))}
  function TableSketch({width,depth,height}){return E('svg',{viewBox:'0 0 820 430',className:'live-cad'},E('rect',{x:100,y:70,width:620,height:190,rx:5,fill:'none',stroke:'currentColor'}),E('path',{d:'M 210 285 L 325 370 H 495 L 610 285 M 325 370 L 410 285 L 495 370',stroke:'currentColor',fill:'none'}),E('line',{x1:100,y1:42,x2:720,y2:42,stroke:'currentColor'}),E('text',{x:410,y:30,textAnchor:'middle'},width+' mm'),E('text',{x:635,y:350},'H '+height+' mm'),E('text',{x:110,y:92},'Depth '+depth+' mm'))}
  function Bom({active,updateProject,log}){
    if(!active)return E(Empty);const rows=active.bom||[];const subtotal=rows.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.unitCost)||0),0);const vat=subtotal*.21,total=subtotal+vat;
    const patch=(id,key,val)=>updateProject(p=>(p.bom=p.bom.map(x=>x.id===id?{...x,[key]:key==='item'||key==='unit'?val:Number(val)||0}:x),p));const remove=id=>updateProject(p=>(p.bom=p.bom.filter(x=>x.id!==id),p));const add=()=>{updateProject(p=>(p.bom=[...p.bom,{id:uid('bom'),item:'New item',qty:1,unit:'ud',unitCost:0}],p));log('BOM','Added line to '+active.id)};
    return E(React.Fragment,null,E(ModuleTitle,{kicker:'BOM / ESTIMATE',title:'Materials become a calculable project object.',desc:'Editor funcional con cantidades, unidades, coste unitario y cálculo automático. Los importes son de demo, no precios vigentes de proveedor.'}),
      E('section',{className:'panel bom-panel'},E('div',{className:'bom-table'},E('div',{className:'bom-row head'},...['Item','Qty','Unit','Unit cost','Total',''].map(x=>E('span',{key:x},x))),...rows.map(x=>E('div',{className:'bom-row',key:x.id},E('input',{value:x.item,onChange:e=>patch(x.id,'item',e.target.value)}),E('input',{type:'number',step:'0.01',value:x.qty,onChange:e=>patch(x.id,'qty',e.target.value)}),E('input',{value:x.unit,onChange:e=>patch(x.id,'unit',e.target.value)}),E('input',{type:'number',step:'0.01',value:x.unitCost,onChange:e=>patch(x.id,'unitCost',e.target.value)}),E('b',null,money((Number(x.qty)||0)*(Number(x.unitCost)||0))),E('button',{className:'icon-btn',onClick:()=>remove(x.id)},'×')))),
        E('div',{className:'bom-footer'},E('button',{onClick:add},'+ Add line'),E('div',null,E('span',null,'Subtotal ',E('b',null,money(subtotal))),E('span',null,'IVA 21% ',E('b',null,money(vat))),E('span',null,'Total ',E('strong',null,money(total)))))));
  }
  function Router({active,agents,log}){
    const [task,setTask]=useState('Necesito sacar un plano CAD y despiece para fabricación');const [runs,setRuns]=useState([]);
    const run=()=>{const agent=routeTask(task,agents);const item={id:uid('route'),task,agent:agent.name,at:new Date().toISOString(),mode:'SIMULATED_BROWSER_ROUTING'};setRuns(r=>[item,...r].slice(0,8));log('ROUTER',agent.name+' ← '+task);};
    return E(React.Fragment,null,E(ModuleTitle,{kicker:'AGENT ROUTER',title:'Route by task, not by brand.',desc:'Simulador determinista del routing por disciplina. No llama a modelos externos ni al OmniRoute privado.'}),
      E('div',{className:'two-col'},E('section',{className:'panel router-input'},E('label',{className:'field'},E('span',null,'Task / request'),E('textarea',{rows:7,value:task,onChange:e=>setTask(e.target.value)})),E('button',{className:'primary-action',onClick:run},'Route task')),E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'AVAILABLE ROUTES'),E('h2',null,'Specialist agents')),E('span',null,'simulated')),E('div',{className:'agent-grid'},...agents.map(a=>E('article',{key:a.id},E('small',null,a.id.toUpperCase()),E('b',null,a.name),E('p',null,a.tags.slice(0,5).join(' · '))))))),
      E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'ROUTE TRACE'),E('h2',null,'Decisions')),E('span',null,active?.id||'')),runs.length?E('div',{className:'route-trace'},...runs.map(x=>E('div',{key:x.id},E('b',null,x.agent),E('span',null,x.task),E('small',null,x.mode)))):E('p',{className:'empty'},'Run the router to create a trace.')));
  }
  function Documents({active,log}){
    if(!active)return E(Empty);const total=active.bom.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.unitCost)||0),0);
    const md=['# '+active.name,'','**Project ID:** '+active.id,'**Type:** '+active.type,'**Stage:** '+active.status,'**Location:** '+(active.location||'—'),'','## Scope',active.description||'—','','## Dimensions','~~~json',JSON.stringify(active.dimensions,null,2),'~~~','','## BOM demo subtotal',money(total),'','## QA',...active.qa.map(x=>'- ['+(x.done?'x':' ')+'] '+x.label),'','> Generated by the RHB STUDIO browser demo. Not an approved fabrication or commercial document.'].join('\n');
    return E(React.Fragment,null,E(ModuleTitle,{kicker:'DOCUMENTS',title:'Generate from the same project state.',desc:'Esta superficie convierte el estado actual del proyecto en un documento reproducible sin copiar información manualmente entre módulos.'}),
      E('div',{className:'two-col docs-grid'},E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'PREVIEW'),E('h2',null,'Project brief')),E('span',null,'Markdown')),E('pre',{className:'doc-preview'},md)),E('section',{className:'panel doc-actions'},E('small',null,'EXPORTS'),E('h2',null,'Deliverable demo'),E('p',null,'Los archivos se generan en el navegador a partir del mismo estado que alimenta BOM, QA y Project Core.'),E('button',{className:'primary-action',onClick:()=>{download(active.id+'_BRIEF.md',md,'text/markdown');log('DOC','Generated Markdown brief for '+active.id)}},'Download brief .md'),E('button',{onClick:()=>{download(active.id+'_PROJECT.json',JSON.stringify(active,null,2),'application/json');log('DOC','Generated project JSON for '+active.id)}},'Download project .json'),E('p',{className:'doc-warning'},'No firma, no certifica y no sustituye planos/documentos aprobados.'))));
  }
  function Qa({active,updateProject,log,data}){
    if(!active)return E(Empty);const done=active.qa.filter(x=>x.done).length,score=active.qa.length?Math.round(done/active.qa.length*100):0;const toggle=id=>{updateProject(p=>(p.qa=p.qa.map(x=>x.id===id?{...x,done:!x.done}:x),p));log('QA','Toggled '+id+' for '+active.id)};const add=()=>updateProject(p=>(p.qa=[...p.qa,{id:uid('q'),label:'New QA check',done:false}],p));
    return E(React.Fragment,null,E(ModuleTitle,{kicker:'QA / HANDOVER',title:'A project is not finished because the render looks finished.',desc:'Checklist funcional para mantener pruebas, validaciones y handover dentro del mismo estado del proyecto.',extra:E('div',{className:'score-ring'},E('b',null,score+'%'),E('span',null,'complete'))}),
      E('div',{className:'two-col'},E('section',{className:'panel'},E('div',{className:'panel-head'},E('div',null,E('small',null,'CHECKLIST'),E('h2',null,active.id)),E('span',null,done+'/'+active.qa.length)),E('div',{className:'qa-list'},...active.qa.map(x=>E('label',{key:x.id,className:x.done?'done':''},E('input',{type:'checkbox',checked:x.done,onChange:()=>toggle(x.id)}),E('input',{type:'text',value:x.label,onChange:e=>updateProject(p=>(p.qa=p.qa.map(q=>q.id===x.id?{...q,label:e.target.value}:q),p))})))),E('button',{onClick:add},'+ Add check')),E('section',{className:'panel handover'},E('small',null,'HANDOVER GATE'),E('h2',null,score===100?'Ready for review':'Pending checks'),E('p',null,score===100?'La checklist demo está completa. En el runtime real aún serían necesarias las evidencias y aprobaciones correspondientes.':'Completa los checks antes de promover el proyecto a HANDOVER.'),E('button',{className:'primary-action',disabled:score<100,onClick:()=>{updateProject(p=>(p.status='HANDOVER',p));log('HANDOVER',active.id+' promoted to HANDOVER')}},'Promote to HANDOVER'),E('div',{className:'stage-mini'},...data.stages.map(s=>E('span',{key:s,className:s===active.status?'active':''},s))))));
  }
  function Empty(){return E('div',{className:'empty-page'},'No active project')}

  fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('demo-data '+r.status);return r.json()}).then(data=>{
    const root=document.getElementById('rhbDemoRoot');const initial=loadState(data.seedProjects);
    function Root(){const [state,setState]=useState(initial);window.__RHB_STUDIO_DEMO__={schemaVersion:1,mode:data.mode,projectCount:state.projects.length,activeProjectId:state.activeProjectId,modules:NAV.length,agents:data.agents.length,storage:'localStorage',backendConnected:false};return E(Shell,{data,state,setState});}
    ReactDOM.createRoot(root).render(E(Root));
  }).catch(err=>{document.getElementById('rhbDemoRoot').textContent='Demo failed to load: '+err});
})();