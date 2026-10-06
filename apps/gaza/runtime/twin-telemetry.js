export function createTwinTelemetry(surface,{intervalMs=250}={}){
  let last=-Infinity;
  return function publish(snapshot={}){
    const now=performance.now();
    if(now-last<intervalMs)return window.__GAZA_TWIN_STATE__||null;
    last=now;
    const state={
      schemaVersion:1,
      surface,
      emittedAt:new Date().toISOString(),
      ...snapshot
    };
    window.__GAZA_TWIN_STATE__=state;
    window.dispatchEvent(new CustomEvent('gaza-twin-state',{detail:state}));
    return state;
  };
}
