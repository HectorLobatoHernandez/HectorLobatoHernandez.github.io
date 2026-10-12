/* Runs before ESM imports: a network/WebGL failure must be visible, not an empty pasture. */
(() => {
 const RELEASE='gaza-demo-20261012-r1';let ready=false,pending=null;
 const box=document.createElement('aside');box.id='gazaLoadStatus';box.setAttribute('role','status');
 box.style.cssText='position:fixed;z-index:70;left:12px;top:64px;background:#102e3eef;color:#e3f1ef;border:1px solid #659496;border-radius:8px;padding:12px;max-width:min(550px,90vw);font:13px/1.5 system-ui';
 box.textContent='GAZA '+RELEASE+' · cargando módulos y escena 3D…';document.body.append(box);
 const diagnostic={release:RELEASE,scene:null,status:'loading',error:null};window.__GAZA_SCENE_LOAD__=diagnostic;
 const fail=message=>{if(ready)return;diagnostic.status='error';diagnostic.error=String(message);box.replaceChildren(document.createTextNode('La escena todavía no está disponible: '+String(message)+' '));const retry=document.createElement('button');retry.textContent='Reintentar esta escena';retry.onclick=()=>{const u=new URL(location.href);u.searchParams.set('release',RELEASE);u.searchParams.set('reload',Date.now());location.replace(u.pathname+u.search)};box.append(retry);box.hidden=false;};
 window.addEventListener('gaza-scene-error',e=>fail(e.detail||'Error WebGL / módulos'));
 window.addEventListener('error',e=>fail(e.message||'Recurso no disponible'));
 window.addEventListener('unhandledrejection',e=>fail(e.reason?.message||e.reason));
 const focus=()=>{if(!ready||!pending)return;const map={herds:'farmHerds',cow:'lifeCow',sheep:'lifeSheep',milking:'lifeMilking',collection:'lifeTruck'};const button=document.getElementById(map[pending]);if(button){button.click();pending=null;}};
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='GAZA_DEMO_FOCUS')return;pending=e.data.focus;focus()});
 window.addEventListener('gaza-scene-ready',e=>{ready=true;diagnostic.status='ready';diagnostic.scene=e.detail?.scene||'unknown';box.remove();if(window.parent!==window)window.parent.postMessage({type:'GAZA_SCENE_READY',release:RELEASE,scene:diagnostic.scene},location.origin);focus();});
 setTimeout(()=>{if(!ready&&diagnostic.status==='loading')box.textContent='La carga está tardando. Esperando los módulos WebGL · '+RELEASE+' · no se ha borrado ningún escenario.';},20000);
 setTimeout(()=>{if(!ready&&diagnostic.status==='loading')fail('Los módulos o WebGL no han terminado de cargar.');},60000);
})();
