export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>v*v*(3-2*v);
export const ramp=(p,a,b)=>smooth(clamp((p-a)/(b-a)));
export const chapters=[
 {id:'construir',nav:'Construcción',title:'El proyecto se construye.',copy:'El modelo original aparece sobre el plano: envolvente, interiores, instalaciones y cubiertas.',gallery:['model-exploded','acoustic-01.webp','plan-room.webp','final-22.webp']},
 {id:'cerrado',nav:'Edificio',title:'La envolvente completa.',copy:'El recinto del SketchUp, con sus dos cubiertas y sus componentes originales.',gallery:['model-exploded','acoustic-01.webp','acoustic-06.webp','final-04.webp']},
 {id:'cubierta',nav:'Cubiertas',title:'El techo se separa.',copy:'Las cubiertas se elevan y dejan ver la distribución interior. El resto del modelo conserva su posición.',gallery:['model-exploded','model-acoustic','final-01.webp','final-15.webp','final-18.webp']},
 {id:'paredes',nav:'Paredes',title:'El interior queda a la vista.',copy:'Las paredes se retiran hacia fuera. Puedes girar el conjunto y ocultar cualquier capa.',gallery:['model-cinema','model-exploded','final-22.webp','final-28.webp','acoustic-10.webp']},
 {id:'acustica',nav:'Acústica',title:'Las superficies, por función.',copy:'Tratamiento de paredes y techo en capas independientes, junto a los renders de sus detalles.',gallery:['model-acoustic','final-11.webp','final-14.webp','final-16.webp','acoustic-10.webp']},
 {id:'sistemas',nav:'Sistemas',title:'Audio, luz y puesto DJ.',copy:'Los componentes audiovisuales, las luminarias y el mobiliario se pueden aislar y examinar.',gallery:['model-dj','model-cinema','final-19.webp','final-21.webp','final-15.webp','final-22.webp']},
 {id:'interior',nav:'Interiores',title:'Recorre el interior.',copy:'Abre las vistas interiores o explora libremente. Las galerías reúnen vistas 4K del modelo y renders originales del proyecto.',gallery:['model-cinema','model-dj','model-acoustic','final-28.webp','final-04.webp','final-26.webp','final-30.webp']},
 {id:'recomponer',nav:'Recomponer',title:'Todo vuelve a su sitio.',copy:'Las piezas regresan a sus transformaciones de origen. El recorrido puede hacerse en ambos sentidos.',gallery:['model-cinema','model-exploded','final-22.webp','acoustic-01.webp','plan-room.webp']}
];
export const starts=[0,.14,.25,.39,.51,.63,.75,.90];
export function layerState(p,manual=null){
 p=clamp(p);
 const returnFactor=1-ramp(p,.90,1);
 const index=Math.max(0,starts.findLastIndex(v=>v<=p));
 const amount=manual===null?null:clamp(manual);
 return {p,index,chapter:chapters[index],roof:amount??ramp(p,.25,.37)*returnFactor,
  walls:amount??ramp(p,.39,.50)*returnFactor,
  acoustic:amount??ramp(p,.51,.61)*returnFactor,
  systems:amount??ramp(p,.63,.73)*returnFactor,build:ramp(p,0,.135)};
}
export function buildForLayer(key,p){
 if(key==='floor')return 1;
 const start=key.startsWith('wall_')||key==='partition'?0:key==='roof'?.105:key==='acoustic_wall'||key==='acoustic_ceiling'?.055:.025;
 return Math.max(.001,ramp(p,start,start+.03));
}
export const galleryByLayer={
 roof:['model-exploded','final-01.webp','final-15.webp','final-18.webp'],
 acoustic_wall:['model-acoustic','final-11.webp','final-14.webp','final-16.webp'],
 acoustic_ceiling:['model-acoustic','final-01.webp','final-15.webp','final-18.webp'],
 av:['model-cinema','model-dj','final-19.webp','final-21.webp','final-22.webp'],
 lighting:['model-cinema','final-03.webp','final-15.webp','final-18.webp'],
 furniture:['model-dj','final-21.webp','final-22.webp','final-28.webp'],
 openings:['model-acoustic','final-04.webp','final-26.webp','final-30.webp']
};
