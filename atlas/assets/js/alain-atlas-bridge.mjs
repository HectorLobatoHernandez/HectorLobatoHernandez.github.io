/** Same-origin, versioned bridge between the city and a source-backed project. */
export function createAtlasBridge({onStart,onProgress,onPause,onTheme,projectId='casa-alain'}){
 const active=new URLSearchParams(location.search).get('atlas')==='1'&&window.parent!==window;
 let intro=null,suspended=false;
 const post=type=>{if(active)window.parent.postMessage({type,version:1,projectId},location.origin)};
 if(active){
  document.body.classList.add('inside-atlas');
  const brand=document.querySelector('.brand');brand.textContent='← Ciudad / atlas';brand.href='./atlas.html';brand.onclick=e=>{e.preventDefault();post('ATLAS_RETURN')};
  window.addEventListener('message',e=>{
   if(e.source!==window.parent||e.origin!==location.origin||e.data?.version!==1||e.data.projectId!==projectId)return;
   if(e.data.type==='ATLAS_PROJECT_START'){suspended=false;onStart();onTheme?.(0);intro={start:performance.now(),duration:10000,targetNight:e.data.night?1:0,lastLevel:0}}
   if(e.data.type==='ATLAS_PROJECT_PAUSE'){intro=null;suspended=true;onPause()}
  });
  for(const event of ['wheel','pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted){if(intro&&performance.now()-intro.start>=intro.duration)onTheme?.(intro.targetNight);intro=null}},{capture:true,passive:true});
 }
 return {active,get suspended(){return suspended},ready(){post('ATLAS_PROJECT_READY')},error(){post('ATLAS_PROJECT_ERROR')},tick(now){if(!intro||suspended)return;const elapsed=now-intro.start,q=Math.min(1,Math.max(0,elapsed/intro.duration));if(elapsed<=intro.duration)onProgress(q*.21);const fade=Math.max(0,Math.min(1,(elapsed-intro.duration)/6500)),level=fade*fade*(3-2*fade)*intro.targetNight;if(Math.abs(level-intro.lastLevel)>.004||fade===1){onTheme?.(level);intro.lastLevel=level}if(fade===1)intro=null}};
}
