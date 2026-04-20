/* ============================================
   CURSOR.JS — Custom cursor system
   ============================================ */

const CursorManager = (() => {
  let _dot, _ring, _config = {}, _enabled = false;

  const CURSORS = {
    none:      { label: 'Défaut', cursor: 'auto' },
    dot:       { label: 'Point lumineux', cursor: 'none' },
    crosshair: { label: 'Viseur', cursor: 'crosshair' },
    sword:     { label: 'Épée (anime)', cursor: 'none' },
    star:      { label: 'Étoile', cursor: 'none' },
    sakura:    { label: 'Sakura', cursor: 'none' }
  };

  function init(config) {
    _config = config;
    stop();
    if (!config.style || config.style === 'none') return;
    _enabled = true;
    _apply(config.style);
  }

  function _apply(style) {
    const preset = CURSORS[style];
    if (!preset || preset.cursor !== 'none') {
      document.body.style.cursor = preset ? preset.cursor : 'auto';
      return;
    }

    document.body.style.cursor = 'none';

    _dot = document.createElement('div');
    _dot.id = 'cursor-dot';

    _ring = document.createElement('div');
    _ring.id = 'cursor-ring';

    _applyStyle(style);

    document.body.appendChild(_dot);
    document.body.appendChild(_ring);

    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', onMove);

    function onMove(e) {
      mx = e.clientX;
      my = e.clientY;
      _dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    }

    function follow() {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      _ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    }
    follow();
  }

  function _applyStyle(style) {
    const color = _config.color || 'var(--accent)';

    const dotBase = `
      position: fixed; top: 0; left: 0;
      pointer-events: none; z-index: 99999;
      border-radius: 50%; mix-blend-mode: difference;
    `;
    const ringBase = `
      position: fixed; top: 0; left: 0;
      pointer-events: none; z-index: 99998;
      border-radius: 50%; transition: width 200ms, height 200ms;
    `;

    switch (style) {
      case 'dot':
        _dot.style.cssText  = dotBase + `width:8px;height:8px;background:${color};`;
        _ring.style.cssText = ringBase + `width:30px;height:30px;border:2px solid ${color};opacity:0.6;`;
        break;
      case 'sword':
        _dot.style.cssText = `
          position:fixed;top:0;left:0;pointer-events:none;z-index:99999;
          width:3px;height:24px;background:${color};
          transform-origin:center;
          box-shadow:0 0 8px ${color};
          border-radius:1px;
        `;
        _ring.style.cssText = ringBase + `width:0;height:0;`;
        break;
      case 'star':
        _dot.style.cssText  = dotBase + `width:14px;height:14px;background:${color};clip-path:polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);`;
        _ring.style.cssText = ringBase + `width:28px;height:28px;border:2px solid ${color};opacity:0.4;`;
        break;
      case 'sakura':
        _dot.style.cssText  = dotBase + `width:12px;height:12px;background:${_config.color || '#ffb7c5'};`;
        _ring.style.cssText = ringBase + `width:24px;height:24px;border:2px solid ${_config.color || '#ffb7c5'};opacity:0.5;`;
        break;
    }
  }

  function stop() {
    _enabled = false;
    document.body.style.cursor = '';
    if (_dot)  { _dot.remove();  _dot = null; }
    if (_ring) { _ring.remove(); _ring = null; }
  }

  function update(config) {
    _config = config;
    init(config);
  }

  function getOptions() { return CURSORS; }

  return { init, stop, update, getOptions };
})();
