/** Work and presentation use the same reducer, but NEVER the same persisted record. */
export const RELEASE='gaza-vida-20261015-v16';
export const DEMO_KEY='gaza:company-demo:processes:v1';
export function sessionScope(search='') {
 const demo=new URLSearchParams(search).get('demo')==='company';
 return Object.freeze({demo,id:demo?'company-demo':'working',key:demo?DEMO_KEY:'gaza:process-ledger:v2',
  legacy:demo?'gaza:company-demo:legacy:v1':'gaza:operations-thread:v1',
  channel:demo?'gaza-company-demo-v1':'gaza-process-v2',label:demo?'DEMOSTRACIÓN AISLADA':'ESCENARIO DE TRABAJO'});
}
export function propagateMode(target,search='',release=RELEASE,baseURL=globalThis.location?.href||'https://example.invalid/apps/gaza/') {
 const source=new URLSearchParams(search),url=new URL(target,baseURL);
 url.searchParams.set('release',release);
 if(source.get('demo')==='company')url.searchParams.set('demo','company');
 for(const key of ['qa','freeze','debug'])if(source.has(key))url.searchParams.set(key,source.get(key));
 return url.pathname+url.search+url.hash;
}
