/** Redraw only changed poses/cameras. Rendering never drives the simulation clock. */
export function createRenderScheduler(){
 let dirty=true,key=null,frames=0;
 return {invalidate(){dirty=true},observe(next){if(next!==key){key=next;dirty=true}},needsFrame(){return dirty},rendered(){dirty=false;frames++},snapshot(){return {frames,dirty}}};
}
