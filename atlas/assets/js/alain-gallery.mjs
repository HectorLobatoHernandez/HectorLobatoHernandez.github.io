export function createGallery({catalog, assetBase, $, labels}) {
  let files=[], index=0, zoom=1, fitWidth=1, loadToken=0;
  const dialog=$('image-dialog'), image=$('image-full'), stage=$('image-stage');
  const item=key=>catalog.items[key];
  const url=path=>new URL(path,assetBase).href;
  function fit(){
    if(!image.naturalWidth)return;
    fitWidth=Math.min(image.naturalWidth,stage.clientWidth-28,(stage.clientHeight-28)*image.naturalWidth/image.naturalHeight);
    image.style.width=Math.max(1,fitWidth*zoom)+'px';
    $('image-zoom-label').textContent=Math.round(fitWidth*zoom/image.naturalWidth*100)+' %';
  }
  function setZoom(value){zoom=Math.max(1,Math.min(Math.max(8,image.naturalWidth/Math.max(1,fitWidth)),value));fit()}
  function open(at){
    index=(at+files.length)%files.length;zoom=1;
    const key=files[index],meta=item(key),token=++loadToken;
    $('image-title').textContent=meta.title||labels[key]||key;
    $('image-resolution').textContent=`${meta.width} × ${meta.height} · ${meta.kind}`;
    $('image-counter').textContent=`${index+1} / ${files.length}`;
    $('image-download').href=url(meta.full);$('image-download').download=meta.full.split('/').pop();
    image.alt=meta.title||labels[key]||key;image.style.opacity='.35';
    image.onload=()=>{if(token!==loadToken)return;image.style.opacity='1';fit();stage.scrollTo(0,0)};
    image.onerror=()=>{$('image-resolution').textContent='No se pudo abrir la imagen. Prueba con la siguiente.';image.style.opacity='1'};
    image.src=url(meta.full);
    if(!dialog.open)dialog.showModal();
    $('image-strip').replaceChildren(...files.map((f,i)=>{
      const b=document.createElement('button');b.setAttribute('aria-label','Ver '+(item(f).title||labels[f]||f));b.setAttribute('aria-current',String(i===index));
      const im=document.createElement('img');im.src=url(item(f).thumb);im.alt='';b.append(im);b.onclick=()=>open(i);return b;
    }));
    if(image.complete&&image.naturalWidth){image.style.opacity='1';fit()}
  }
  $('image-close').onclick=()=>dialog.close();
  $('image-previous').onclick=()=>open(index-1);$('image-next').onclick=()=>open(index+1);
  $('image-fit').onclick=()=>setZoom(1);$('image-native').onclick=()=>setZoom(image.naturalWidth/fitWidth);
  $('image-zoom-in').onclick=()=>setZoom(zoom*1.4);$('image-zoom-out').onclick=()=>setZoom(zoom/1.4);
  image.ondblclick=()=>setZoom(zoom>1?1:image.naturalWidth/fitWidth);
  stage.addEventListener('wheel',e=>{if(!dialog.open)return;e.preventDefault();setZoom(zoom*(e.deltaY<0?1.15:1/1.15))},{passive:false});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();open(index+1)}
    if(e.key==='ArrowLeft'){e.preventDefault();open(index-1)}
    if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom*1.4)}
    if(e.key==='-'){e.preventDefault();setZoom(zoom/1.4)}
    if(e.key==='0'){e.preventDefault();setZoom(1)}
  });
  new ResizeObserver(()=>{if(dialog.open)fit()}).observe(stage);
  return function gallery(keys,heading){
    files=[...new Set(keys)].filter(key=>item(key));
    $('gallery-heading').textContent=heading||'Interiores relacionados';$('gallery-count').textContent=String(files.length).padStart(2,'0');$('gallery').replaceChildren();
    for(const [i,key] of files.entries()){
      const meta=item(key),b=document.createElement('button');b.dataset.file=key;b.setAttribute('aria-label','Ampliar '+(meta.title||labels[key]||key));
      const im=document.createElement('img');im.src=url(meta.thumb);im.alt=meta.title||labels[key]||key;im.loading='lazy';im.width=640;im.height=360;
      const caption=document.createElement('span');caption.textContent=im.alt+(meta.width>=3840?' · 4K':'');
      const kind=document.createElement('small');kind.textContent=`${meta.width>=3840?'4K · ':''}${meta.kind} · ${meta.width} × ${meta.height}`;
      b.append(im,caption,kind);b.onclick=()=>open(i);$('gallery').append(b);
    }
  };
}
