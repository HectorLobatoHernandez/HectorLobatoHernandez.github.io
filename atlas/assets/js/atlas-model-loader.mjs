// Lossless transport. Decoded GLB bytes and source geometry are unchanged.
export async function loadAtlasModel(loader,url,onProgress){
 const multipart=url.endsWith('.parts.json');
 if(!multipart&&!url.endsWith('.gz'))return loader.loadAsync(url,onProgress);
 if(!globalThis.DecompressionStream)throw Error('Please use a current browser with gzip decompression support.');
 let stream;
 if(multipart){
  const response=await fetch(url);if(!response.ok)throw Error('Model manifest request failed: HTTP '+response.status);
  const manifest=await response.json();if(manifest.schemaVersion!==1||manifest.compression!=='gzip'||!manifest.parts?.length)throw Error('Invalid model transport manifest');
  let index=0,loaded=0;
  stream=new ReadableStream({async pull(controller){
   try{
    if(index===manifest.parts.length){controller.close();return;}
    const part=manifest.parts[index++],partUrl=new URL(part.file,url);
    if(partUrl.origin!==new URL(url).origin)throw Error('Unexpected model part origin');
    const result=await fetch(partUrl);if(!result.ok)throw Error('Model part request failed: HTTP '+result.status);
    const bytes=await result.arrayBuffer();if(bytes.byteLength!==part.bytes)throw Error('Incomplete model download');
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==part.sha256)throw Error('Model download integrity check failed');
    loaded+=bytes.byteLength;onProgress?.({loaded,total:manifest.bytes});controller.enqueue(new Uint8Array(bytes));
   }catch(error){controller.error(error);}
  }});
 }else{
  const response=await fetch(url);if(!response.ok)throw Error('Model request failed: HTTP '+response.status);
  const total=Number(response.headers.get('content-length'))||0;let loaded=0;
  stream=response.body.pipeThrough(new TransformStream({transform(chunk,controller){loaded+=chunk.byteLength;onProgress?.({loaded,total});controller.enqueue(chunk);}}));
 }
 const data=await new Response(stream.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 return loader.parseAsync(data,new URL('.',url).href);
}
