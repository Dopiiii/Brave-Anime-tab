/* ============================================
   PARTICLES.JS — Canvas particle effects
   Modes: sakura, snow, stars, fireflies, none
   ============================================ */

const ParticleSystem = (() => {
  let canvas, ctx, _particles = [], _animId = null, _config = {};

  const PRESETS = {
    sakura: {
      count: 35, color: ['#ffb7c5','#ff9eb5','#ffd4dd','#ffafc0'], size: [4,9],
      speed: [0.5,1.2], drift: 0.8, spin: true, shape: 'sakura'
    },
    snow: {
      count: 60, color: ['#fff','#e0eeff','#cce4ff'], size: [2,6],
      speed: [0.3,0.9], drift: 0.3, spin: false, shape: 'circle'
    },
    stars: {
      count: 80, color: ['#fff','#ffffcc','#ffd700','#aaddff'], size: [1,3],
      speed: [0.05,0.2], drift: 0, spin: false, shape: 'star', twinkle: true
    },
    fireflies: {
      count: 25, color: ['#ffffaa','#aaffaa','#ffddaa'], size: [2,5],
      speed: [0.2,0.6], drift: 1.2, spin: false, shape: 'glow'
    }
  };

  function rand(min, max) { return min + Math.random() * (max - min); }
  function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function createParticle(preset, w, h) {
    const p = PRESETS[preset];
    return {
      x: rand(0, w),
      y: rand(-50, h + 50),
      size: rand(p.size[0], p.size[1]),
      color: randItem(p.color),
      speed: rand(p.speed[0], p.speed[1]),
      drift: rand(-p.drift, p.drift),
      angle: rand(0, Math.PI * 2),
      spin: p.spin ? rand(-0.04, 0.04) : 0,
      alpha: rand(0.4, 1),
      alphaDir: rand(0, 1) > 0.5 ? 1 : -1,
      driftTimer: 0,
      driftTarget: rand(-p.drift, p.drift),
      shape: p.shape,
      twinkleSpeed: rand(0.01, 0.03)
    };
  }

  function drawSakura(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x1 = Math.cos(a) * p.size;
      const y1 = Math.sin(a) * p.size;
      const cx1 = Math.cos(a + 0.3) * p.size * 0.5;
      const cy1 = Math.sin(a + 0.3) * p.size * 0.5;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.quadraticCurveTo(cx1, cy1, x1, y1);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGlow(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.alpha * 0.8;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 3);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, p.size * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCircle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    const preset = _config.preset;
    const p = PRESETS[preset];
    if (!p) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    _particles.forEach(particle => {
      switch (particle.shape) {
        case 'sakura':   drawSakura(ctx, particle);  break;
        case 'star':     drawStar(ctx, particle);    break;
        case 'glow':     drawGlow(ctx, particle);    break;
        default:         drawCircle(ctx, particle);  break;
      }

      particle.y += particle.speed;
      particle.x += particle.drift * 0.5 * Math.sin(particle.driftTimer * 0.02);
      particle.angle += particle.spin;
      particle.driftTimer++;

      if (p.twinkle) {
        particle.alpha += particle.alphaDir * particle.twinkleSpeed;
        if (particle.alpha > 1)   { particle.alpha = 1;   particle.alphaDir = -1; }
        if (particle.alpha < 0.1) { particle.alpha = 0.1; particle.alphaDir = 1;  }
      }

      if (preset === 'fireflies') {
        particle.drift += rand(-0.05, 0.05);
        particle.drift = Math.max(-1.2, Math.min(1.2, particle.drift));
        particle.y += particle.drift * 0.3;
        particle.alpha += particle.alphaDir * 0.008;
        if (particle.alpha > 0.9) { particle.alpha = 0.9; particle.alphaDir = -1; }
        if (particle.alpha < 0.1) { particle.alpha = 0.1; particle.alphaDir = 1;  }
      }

      if (particle.y > h + 20) {
        particle.y = -20;
        particle.x = rand(0, w);
      }
      if (particle.x < -20) particle.x = w + 20;
      if (particle.x > w + 20) particle.x = -20;
    });

    _animId = requestAnimationFrame(animate);
  }

  function init(config) {
    _config = config;
    stop();

    if (!config.preset || config.preset === 'none') return;

    canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const preset = PRESETS[config.preset];
    const count = Math.round((preset.count * (config.density || 1)));
    _particles = Array.from({ length: count }, () =>
      createParticle(config.preset, canvas.width, canvas.height)
    );

    animate();
  }

  function stop() {
    if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
    if (canvas)  { canvas.remove(); canvas = null; ctx = null; }
    _particles = [];
  }

  function update(config) {
    _config = config;
    init(config);
  }

  function getPresets() { return Object.keys(PRESETS); }

  return { init, stop, update, getPresets };
})();
