(function(global){
  'use strict';

  const RAIN_CODES=new Set([51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
  const STORM_CODES=new Set([95,96,99]);
  const LABELS={0:'Despejado',1:'Mayormente despejado',2:'Parcialmente nublado',3:'Nublado',45:'Niebla',48:'Niebla escarchada',51:'Llovizna',53:'Llovizna',55:'Llovizna intensa',56:'Llovizna helada',57:'Llovizna helada intensa',61:'Lluvia',63:'Lluvia moderada',65:'Lluvia intensa',66:'Lluvia helada',67:'Lluvia helada intensa',71:'Nieve ligera',73:'Nieve',75:'Nieve intensa',77:'Granos de nieve',80:'Chubascos',81:'Chubascos',82:'Chubascos fuertes',85:'Chubascos de nieve',86:'Chubascos de nieve fuertes',95:'Tormenta',96:'Tormenta + granizo',99:'Tormenta fuerte + granizo'};
  const THRESHOLDS={
    advisoryOnly:true,
    gustKmh:{attention:35,high:50,severe:70},
    sustainedWindKmh:{attention:30,high:45,severe:65},
    visibilityM:{attention:5000,high:2000,severe:1000},
    precipitationMmH:{attention:2.5,high:7.5,severe:15},
    precipitationProbability:{attention:70}
  };
  const LEVELS=['NORMAL','ATENCIÓN','ALTO','SEVERO'];

  function num(v,fallback=null){const n=Number(v);return Number.isFinite(n)?n:fallback}
  function weatherText(code){return LABELS[Number(code)]||('Código '+code)}
  function levelLabel(level){return LEVELS[Math.max(0,Math.min(3,Number(level)||0))]}

  function assess(metrics={}){
    const wind=num(metrics.wind,0),gust=num(metrics.gust,0),visibility=num(metrics.visibility,999999),rain=num(metrics.precipitation,0),prob=num(metrics.precipitationProbability,0),code=num(metrics.code,0);
    let level=0;
    const reasons=[];
    const raise=(n,msg)=>{level=Math.max(level,n);if(msg&&!reasons.includes(msg))reasons.push(msg)};

    if(STORM_CODES.has(code))raise(code===99?3:2,'Tormenta prevista/observada');
    if(gust>=THRESHOLDS.gustKmh.severe)raise(3,'Rachas ≥ '+THRESHOLDS.gustKmh.severe+' km/h');
    else if(gust>=THRESHOLDS.gustKmh.high)raise(2,'Rachas ≥ '+THRESHOLDS.gustKmh.high+' km/h');
    else if(gust>=THRESHOLDS.gustKmh.attention)raise(1,'Rachas ≥ '+THRESHOLDS.gustKmh.attention+' km/h');

    if(wind>=THRESHOLDS.sustainedWindKmh.severe)raise(3,'Viento sostenido ≥ '+THRESHOLDS.sustainedWindKmh.severe+' km/h');
    else if(wind>=THRESHOLDS.sustainedWindKmh.high)raise(2,'Viento sostenido ≥ '+THRESHOLDS.sustainedWindKmh.high+' km/h');
    else if(wind>=THRESHOLDS.sustainedWindKmh.attention)raise(1,'Viento sostenido ≥ '+THRESHOLDS.sustainedWindKmh.attention+' km/h');

    if(visibility<THRESHOLDS.visibilityM.severe)raise(3,'Visibilidad < 1 km');
    else if(visibility<THRESHOLDS.visibilityM.high)raise(2,'Visibilidad < 2 km');
    else if(visibility<THRESHOLDS.visibilityM.attention)raise(1,'Visibilidad < 5 km');

    if(rain>=THRESHOLDS.precipitationMmH.severe)raise(3,'Precipitación ≥ '+THRESHOLDS.precipitationMmH.severe+' mm/h');
    else if(rain>=THRESHOLDS.precipitationMmH.high)raise(2,'Precipitación ≥ '+THRESHOLDS.precipitationMmH.high+' mm/h');
    else if(rain>=THRESHOLDS.precipitationMmH.attention)raise(1,'Precipitación ≥ '+THRESHOLDS.precipitationMmH.attention+' mm/h');
    else if((RAIN_CODES.has(code)||rain>0)&&level===0)raise(1,'Superficie potencialmente húmeda');

    if(prob>=THRESHOLDS.precipitationProbability.attention&&level===0)raise(1,'Probabilidad de precipitación ≥ 70 %');

    return {level,label:levelLabel(level),reasons,basis:'PROJECT_ADVISORY_THRESHOLDS_NOT_SAFETY_CONTROL'};
  }

  function hourlyPoint(hourly,i){
    const p={
      time:hourly.time?.[i]||null,
      temp:num(hourly.temperature_2m?.[i]),
      code:num(hourly.weather_code?.[i],0),
      precipitationProbability:num(hourly.precipitation_probability?.[i],0),
      precipitation:num(hourly.precipitation?.[i],0),
      visibility:num(hourly.visibility?.[i]),
      wind:num(hourly.wind_speed_10m?.[i]),
      windDirection:num(hourly.wind_direction_10m?.[i]),
      gust:num(hourly.wind_gusts_10m?.[i])
    };
    const a=assess(p);
    return {...p,label:weatherText(p.code),risk:a.level,riskLabel:a.label,reasons:a.reasons};
  }

  function summarizeHourly(hourly={},currentTime=null){
    const times=Array.isArray(hourly.time)?hourly.time:[];
    const start=currentTime||times[0]||'';
    const idx=[];
    for(let i=0;i<times.length;i++)if(!start||times[i]>=start)idx.push(i);
    const next=idx.slice(0,24).map(i=>hourlyPoint(hourly,i));
    if(!next.length)return {horizonHours:24,risk:0,riskLabel:'NO DATA',reasons:['Previsión horaria no disponible'],slots:[],basis:'PROJECT_ADVISORY_THRESHOLDS_NOT_SAFETY_CONTROL'};

    let risk=0,worstAt=null,maxGust=0,minVisibility=Infinity,maxPrecip=0,maxProb=0;
    const reasons=[];
    next.forEach(p=>{
      if(p.risk>risk){risk=p.risk;worstAt=p.time}
      maxGust=Math.max(maxGust,num(p.gust,0));
      if(Number.isFinite(p.visibility))minVisibility=Math.min(minVisibility,p.visibility);
      maxPrecip=Math.max(maxPrecip,num(p.precipitation,0));
      maxProb=Math.max(maxProb,num(p.precipitationProbability,0));
      p.reasons.forEach(x=>{if(!reasons.includes(x))reasons.push(x)});
    });
    const sampleIdx=[0,4,8,12,16,20].filter(i=>i<next.length);
    return {
      horizonHours:24,
      risk,
      riskLabel:levelLabel(risk),
      reasons:reasons.slice(0,4),
      worstAt,
      maxGustKmh:Number(maxGust.toFixed(1)),
      minVisibilityM:Number.isFinite(minVisibility)?Math.round(minVisibility):null,
      maxPrecipMm:Number(maxPrecip.toFixed(1)),
      maxPrecipProbability:Math.round(maxProb),
      slots:sampleIdx.map(i=>next[i]),
      basis:'PROJECT_ADVISORY_THRESHOLDS_NOT_SAFETY_CONTROL'
    };
  }

  function normalize(payload={}){
    const c=payload.current||{};
    const current={
      live:true,
      temp:num(c.temperature_2m),
      apparent:num(c.apparent_temperature),
      humidity:num(c.relative_humidity_2m),
      pressure:num(c.surface_pressure),
      wind:num(c.wind_speed_10m),
      windDirection:num(c.wind_direction_10m),
      gust:num(c.wind_gusts_10m),
      cloudCover:num(c.cloud_cover),
      visibility:num(c.visibility),
      precipitation:num(c.precipitation,0),
      code:num(c.weather_code,0),
      label:weatherText(c.weather_code),
      observedAt:c.time||null,
      checkedAt:new Date().toISOString(),
      source:'Open-Meteo public grid'
    };
    const nowAssessment=assess(current);
    current.risk=nowAssessment.level;
    current.riskLabel=nowAssessment.label;
    current.reasons=nowAssessment.reasons;
    current.forecast=summarizeHourly(payload.hourly||{},c.time||null);
    current.opsRisk=Math.max(current.risk,current.forecast.risk||0);
    current.opsRiskLabel=levelLabel(current.opsRisk);
    return current;
  }

  function url(lat,lon){
    const current='temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,visibility,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation';
    const hourly='temperature_2m,weather_code,precipitation_probability,precipitation,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m';
    return 'https://api.open-meteo.com/v1/forecast?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lon)+'&current='+current+'&hourly='+hourly+'&forecast_days=2&timezone=Europe%2FMadrid';
  }

  async function fetchWeather(lat,lon){
    const response=await fetch(url(lat,lon),{cache:'no-store'});
    if(!response.ok)throw new Error('weather '+response.status);
    return normalize(await response.json());
  }

  global.GAZAWeatherOps={schemaVersion:1,thresholds:THRESHOLDS,weatherText,assess,summarizeHourly,normalize,url,fetchWeather,levelLabel};
})(window);
