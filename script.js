(function(){
  const root = document.documentElement;
  const body = document.body;
  const buttons = document.querySelectorAll('[data-lang-btn]');
  const stored = localStorage.getItem('site-lang');
  const browserLang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  let lang = stored || browserLang || 'es';

  function applyLanguage(next){
    lang = next;
    root.setAttribute('lang', next);
    document.querySelectorAll('[data-es][data-en]').forEach(el => {
      const value = el.getAttribute('data-' + next);
      if(value !== null) el.innerHTML = value;
    });
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.langBtn === next));
    localStorage.setItem('site-lang', next);
  }
  buttons.forEach(btn => btn.addEventListener('click', ()=> applyLanguage(btn.dataset.langBtn)));
  applyLanguage(lang);

  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('primaryNav');
  if(menuToggle && nav){
    menuToggle.addEventListener('click', ()=>{
      const open = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      menuToggle.setAttribute('aria-expanded','false');
      nav.classList.remove('open');
    }));
  }

  const progress = document.getElementById('scrollProgress');
  function updateProgress(){
    if(!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = pct + '%';
  }
  updateProgress();
  addEventListener('scroll', updateProgress, {passive:true});

  if(matchMedia('(pointer:fine)').matches){
    addEventListener('pointermove', e=>{
      body.style.setProperty('--px', e.clientX + 'px');
      body.style.setProperty('--py', e.clientY + 'px');
    }, {passive:true});
    document.querySelectorAll('.glow-card').forEach(card=>{
      card.addEventListener('pointermove', e=>{
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX-r.left)+'px');
        card.style.setProperty('--my', (e.clientY-r.top)+'px');
      });
    });
  }

  const reveal = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const io = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.08, rootMargin:'0px 0px -35px'});
    reveal.forEach(el=>io.observe(el));
  } else {
    reveal.forEach(el=>el.classList.add('visible'));
  }

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];
  if('IntersectionObserver' in window && sections.length && navLinks.length){
    const so = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          navLinks.forEach(a=>a.classList.toggle('active', a.getAttribute('href') === '#'+entry.target.id));
        }
      });
    }, {rootMargin:'-35% 0px -55% 0px'});
    sections.forEach(s=>so.observe(s));
  }
})();