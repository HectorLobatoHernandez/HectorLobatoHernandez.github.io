/** Responsive policies are viewport based, not user-agent guesses. */
export const MOBILE_RELEASE='gaza-mobile-20261013-v1';
export const MOBILE_QUERY='(max-width: 760px), (pointer: coarse) and (max-height: 560px)';
export function useMobile(query='',matches=false){const p=new URLSearchParams(query);return p.get('ui')==='mobile'||(p.get('ui')!=='desktop'&&matches)}
export function pixelRatio(mobile,dpr=1){return Math.min(Math.max(Number(dpr)||1,1),mobile?1.25:1.5)}
export const PRIMARY_VIEWS=Object.freeze([['site','Planta'],['farm','Granja'],['labs','Labs'],['workflow','Procesos']]);
export function safeSceneAction(id){return ['overview','zoom-in','zoom-out','activity','panel','views'].includes(id)}
