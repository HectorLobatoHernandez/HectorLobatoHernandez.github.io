
(function(){
  const root = document.documentElement;
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
})();
