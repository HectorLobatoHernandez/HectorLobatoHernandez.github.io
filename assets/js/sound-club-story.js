(() => {
  const E = React.createElement;
  const { useEffect, useState } = React;
  const MEDIA = '../xxxia-studio/projects/sound-club-palma/05_metadata/project-media.json';
  const STORY = '../xxxia-studio/projects/sound-club-palma/05_metadata/visual-story.json';

  function App() {
    const [data, setData] = useState(null);
    const [active, setActive] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
      Promise.all([
        fetch(MEDIA, { cache: 'no-store' }).then(r => {
          if (!r.ok) throw new Error('media HTTP ' + r.status);
          return r.json();
        }),
        fetch(STORY, { cache: 'no-store' }).then(r => {
          if (!r.ok) throw new Error('story HTTP ' + r.status);
          return r.json();
        })
      ])
        .then(([media, story]) => setData({ media, story }))
        .catch(e => setError(String(e)));
    }, []);

    useEffect(() => {
      if (!data) return;
      const steps = [...document.querySelectorAll('.sc-story-step')];
      const observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(Number(visible.target.dataset.index) || 0);
      }, {
        rootMargin: '-38% 0px -38% 0px',
        threshold: [0, .25, .5, .75, 1]
      });
      steps.forEach(step => observer.observe(step));
      return () => observer.disconnect();
    }, [data]);

    if (error) {
      return E('div', { className: 'sc-story-loading sc-story-error' }, 'Visual story failed: ' + error);
    }
    if (!data) {
      return E('div', { className: 'sc-story-loading' }, 'Loading XXXIA visual story…');
    }

    const byId = Object.fromEntries(data.media.items.map(item => [item.id, item]));
    const scenes = data.story.scenes
      .map(scene => ({ ...scene, media: byId[scene.mediaId] }))
      .filter(scene => scene.media);
    const current = scenes[active] || scenes[0];

    window.__SOUND_CLUB_STORY__ = {
      schemaVersion: data.story.schemaVersion,
      steps: scenes.length,
      activeIndex: active,
      activeId: current?.mediaId || null,
      loaded: true
    };

    const visual = current.media.kind === 'VIDEO'
      ? E('video', {
          key: current.media.id,
          src: current.media.src,
          autoPlay: true,
          muted: true,
          loop: true,
          playsInline: true,
          preload: 'metadata'
        })
      : E('img', {
          key: current.media.id,
          src: current.media.src,
          alt: current.media.title
        });

    const copyColumn = E(
      'div',
      { className: 'sc-story-copy' },
      ...scenes.map((scene, i) => E(
        'article',
        {
          key: scene.mediaId,
          className: 'sc-story-step ' + (active === i ? 'active' : ''),
          'data-index': i
        },
        E('span', { className: 'sc-story-kicker' }, scene.kicker),
        E('h3', null, scene.title),
        E('p', null, scene.body),
        E(
          'div',
          { className: 'sc-story-tags' },
          ...(scene.tags || []).map(tag => E('span', { key: tag }, tag))
        )
      ))
    );

    const stage = E(
      'aside',
      { className: 'sc-story-sticky' },
      E(
        'div',
        { className: 'sc-story-frame ' + (current.media.kind === 'PLAN' ? 'is-plan' : '') },
        visual,
        E('div', { className: 'sc-story-overlay' })
      ),
      E(
        'div',
        { className: 'sc-story-meta' },
        E('strong', null, current.media.id + ' · ' + current.media.title),
        E(
          'div',
          { className: 'sc-story-progress' },
          ...scenes.map((_, i) => E('i', { key: i, className: active === i ? 'active' : '' }))
        )
      ),
      E(
        'div',
        { className: 'sc-story-note' },
        current.media.classification === 'DOCUMENTED_REFERENCE'
          ? 'DOCUMENTED_REFERENCE · real project footage'
          : 'GENERATED VISUAL · communication asset, not verified as-built documentation'
      )
    );

    return E('div', { className: 'sc-story-shell' }, copyColumn, stage);
  }

  const root = document.getElementById('soundClubStoryRoot');
  if (!root) return;
  ReactDOM.createRoot(root).render(E(App));
})();
