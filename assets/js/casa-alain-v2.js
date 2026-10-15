(()=>{
const prog=document.getElementById('caProgress');
const update=()=>{const m=Math.max(1,document.documentElement.scrollHeight-innerHeight);prog.style.width=Math.min(100,scrollY/m*100)+'%'};
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('on')}),{threshold:.08,rootMargin:'0px 0px -5%'});
document.querySelectorAll('.ca-reveal').forEach(x=>io.observe(x));
window.__CASA_ALAIN_V2__={schemaVersion:1,sourceBacked:true,acousticSupplierBrandHidden:true,syntheticProjectGeometry:false,mounted:true};
})();