import React, { useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@19.1.1';
import { createRoot } from 'https://esm.sh/react-dom@19.1.1/client';
import htm from 'https://esm.sh/htm@3.1.1';
import gsap from 'https://esm.sh/gsap@3.13.0';
import { ScrollTrigger } from 'https://esm.sh/gsap@3.13.0/ScrollTrigger';

const html = htm.bind(React.createElement);
gsap.registerPlugin(ScrollTrigger);

/*
  React Bits integration notes
  - SpotlightCard behavior adapted from DavidHDev/react-bits.
  - ScrollReveal behavior adapted from DavidHDev/react-bits.
  - License notice: ./THIRD_PARTY_NOTICES.md
*/

function SpotlightCard({ children, className = '', spotlightColor = 'rgba(87, 143, 255, 0.22)' }) {
  const ref = useRef(null);
  const onMove = e => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
    el.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
    el.style.setProperty('--spotlight-color', spotlightColor);
  };
  return html`<article ref=${ref} onMouseMove=${onMove} className=${'spotlight-card ' + className}>${children}</article>`;
}

function ScrollReveal({ children, enableBlur = true, baseOpacity = 0.12, baseRotation = 2, blurStrength = 5, className = '' }) {
  const ref = useRef(null);
  const words = useMemo(() => String(children).split(/(\s+)/), [children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wordEls = el.querySelectorAll('.rb-word');

    const rotateTween = gsap.fromTo(
      el,
      { transformOrigin: '0% 50%', rotate: baseRotation },
      { rotate: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom 55%', scrub: true } }
    );

    const opacityTween = gsap.fromTo(
      wordEls,
      { opacity: baseOpacity },
      { opacity: 1, ease: 'none', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 58%', scrub: true } }
    );

    let blurTween = null;
    if (enableBlur) {
      blurTween = gsap.fromTo(
        wordEls,
        { filter: 'blur(' + blurStrength + 'px)' },
        { filter: 'blur(0px)', ease: 'none', stagger: 0.04, scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 58%', scrub: true } }
      );
    }

    return () => {
      rotateTween.scrollTrigger?.kill();
      rotateTween.kill();
      opacityTween.scrollTrigger?.kill();
      opacityTween.kill();
      blurTween?.scrollTrigger?.kill();
      blurTween?.kill();
    };
  }, [enableBlur, baseOpacity, baseRotation, blurStrength]);

  return html`<div ref=${ref} className=${'scroll-reveal ' + className}>
    ${words.map((w, i) => /^\s+$/.test(w) ? w : html`<span className="rb-word" key=${i}>${w}</span>`)}
  </div>`;
}

function Counter({ value, suffix = '', duration = 900 }) {
  const [shown, setShown] = useState(0);
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const obs = new IntersectionObserver(entries => {
      if (!entries.some(x => x.isIntersecting) || started) return;
      started = true;
      const t0 = performance.now();
      const step = now => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(value * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      obs.disconnect();
    }, { threshold: .35 });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);

  return html`<strong ref=${host}>${shown}${suffix}</strong>`;
}

const projects = [
  {
    tag: 'INDUSTRIAL DIGITAL TWIN',
    title: 'GAZA Operations Intelligence',
    copy: 'Control Tower, GIS 3D, logística, clima, ASRS, expediciones e integración IT/OT en un demostrador operacional.',
    href: '../gaza/',
    meta: ['Three.js', 'GIS', 'IT/OT', 'AI']
  },
  {
    tag: 'SYSTEMS INTEGRATION',
    title: 'Mar Salada · Club del Mar',
    copy: 'Audio profesional, DSP, KNX, DALI, control táctil, limitación y commissioning de un sistema real multidisciplinar.',
    href: '../../index.html#projects',
    meta: ['KNX', 'DALI', 'DSP', 'Commissioning']
  },
  {
    tag: 'AI / ENGINEERING PLATFORM',
    title: 'RHB STUDIO',
    copy: 'Sistema local-first para diseño, CAD, agentes, presupuestos, documentación y automatización de proyectos técnicos.',
    href: '../../index.html#ventures',
    meta: ['Agents', 'CAD', 'Automation', 'Local-first']
  }
];

const systemUses = [
  ['CV / PORTFOLIO', 'ScrollReveal · SpotlightCard · RotatingText · CountUp', 'Animación narrativa, proyectos memorables y métricas sin convertir el CV en una demo de efectos.'],
  ['GAZA APP', 'AnimatedContent · ElectricBorder · SpotlightCard', 'Alertas, selección de activos y paneles de detalle. Evitar efectos decorativos en controles críticos.'],
  ['RHB STUDIO', 'AnimatedList · SpotlightCard · Dock · Folder', 'Agentes, proyectos, historial, ficheros y navegación visual de departamentos.'],
  ['PRESENTACIONES', 'ScrollReveal · BlurText · PixelTransition', 'Entradas de capítulos, mensajes clave y transiciones entre problema → arquitectura → resultado.'],
  ['WEBS CLIENTE', 'SpotlightCard · FadeContent · Magnet', 'Landing pages con interacción controlada y carga progresiva; solo en zonas comerciales.'],
  ['DASHBOARDS TÉCNICOS', 'CountUp · AnimatedContent · BorderGlow', 'KPIs y cambios de estado. Movimiento reservado para excepciones y variación de datos.']
];

function App() {
  return html`
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="../../index.html"><span>HL</span><b>Presentation Lab</b></a>
        <nav>
          <a href="#cv">CV</a>
          <a href="#projects">Proyectos</a>
          <a href="#system">Sistema</a>
          <a className="pill" href="../../index.html">Portfolio actual ↗</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="cv">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">REACT BITS · CV / PRESENTATION PROTOTYPE</p>
              <h1>Héctor<br/><span>Lobato</span></h1>
              <p className="role">Systems Integration · Automation · IT/OT · AV · AI</p>
              <p className="lead">Un CV técnico puede comportarse como una presentación de ingeniería: primero contexto, después evidencia y finalmente proyectos verificables.</p>
              <div className="actions">
                <a className="primary" href="#projects">Ver proyectos</a>
                <a className="secondary" href="../../index.html">Comparar con CV actual</a>
              </div>
              <div className="metrics">
                <div><${Counter} value="8" suffix="+" /><span>años de recorrido técnico</span></div>
                <div><strong>Field + Digital</strong><span>obra · sistemas · software</span></div>
                <div><strong>Architecture → Commissioning</strong><span>de diseño a operación</span></div>
              </div>
            </div>
            <div className="portrait-wrap">
              <div className="portrait-halo"></div>
              <img src="../../assets/hector-profile.png" alt="Héctor Lobato" />
              <div className="portrait-card pc-a"><small>CONTROL</small><b>KNX / DALI</b></div>
              <div className="portrait-card pc-b"><small>NETWORK</small><b>IT / OT</b></div>
              <div className="portrait-card pc-c"><small>WORKFLOW</small><b>AI / AGENTS</b></div>
            </div>
          </div>
        </section>

        <section className="statement">
          <p className="eyebrow">SCROLL REVEAL · MENSAJE PRINCIPAL</p>
          <${ScrollReveal}>
            Diseño sistemas que conectan espacio físico, automatización, redes, audiovisual y software para que la operación sea comprensible, mantenible y medible.
          <//>
        </section>

        <section className="section" id="projects">
          <div className="section-head">
            <div><p className="eyebrow">SPOTLIGHT CARD · PORTFOLIO</p><h2>El efecto sirve cuando refuerza la jerarquía.</h2></div>
            <p>No usaría React Bits en todas las tarjetas. Solo en proyectos prioritarios y puntos de decisión.</p>
          </div>
          <div className="project-grid">
            ${projects.map((p, i) => html`
              <${SpotlightCard} key=${p.title} spotlightColor=${i === 0 ? 'rgba(73,132,255,.28)' : 'rgba(255,255,255,.13)'}>
                <p className="card-tag">${p.tag}</p>
                <h3>${p.title}</h3>
                <p>${p.copy}</p>
                <div className="tags">${p.meta.map(x => html`<span key=${x}>${x}</span>`)}</div>
                <a href=${p.href}>Abrir proyecto ↗</a>
              <//>
            `)}
          </div>
        </section>

        <section className="section system" id="system">
          <div className="section-head">
            <div><p className="eyebrow">REACT BITS · MAPA DE USO</p><h2>Dónde sí lo incorporaría.</h2></div>
            <p>Regla: la animación debe comunicar estado, jerarquía o transición. Si solo distrae, se elimina.</p>
          </div>
          <div className="use-grid">
            ${systemUses.map(([area, bits, why]) => html`
              <${SpotlightCard} className="use-card" key=${area} spotlightColor="rgba(74,222,190,.12)">
                <span className="use-id">${area}</span>
                <h3>${bits}</h3>
                <p>${why}</p>
              <//>
            `)}
          </div>
        </section>

        <section className="section architecture">
          <p className="eyebrow">ARQUITECTURA RECOMENDADA</p>
          <h2>No migrar todo el portfolio a React de golpe.</h2>
          <div className="flow">
            <div><b>01</b><span>Portfolio actual</span><small>HTML/CSS/JS estable</small></div><i>→</i>
            <div><b>02</b><span>React Bits islands</span><small>hero · proyectos · presentación</small></div><i>→</i>
            <div><b>03</b><span>Promoción selectiva</span><small>solo componentes aprobados</small></div><i>→</i>
            <div><b>04</b><span>Design system</span><small>CV · RHB · GAZA · clientes</small></div>
          </div>
        </section>
      </main>

      <footer>
        <span>Héctor Lobato · UI Integration Lab</span>
        <span>React Bits components used under MIT + Commons Clause · attribution included</span>
      </footer>
    </div>
  `;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
