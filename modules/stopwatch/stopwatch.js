/* ============================================
   STOPWATCH MODULE — Chronomètre + Laps
   ============================================ */

window.StopwatchModule = {
  id: 'stopwatch',
  name: 'Chronomètre',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,
  _startTime: 0,
  _elapsed: 0,
  _running: false,
  _laps: [],

  render() {
    return `
      <div class="stopwatch-module">
        <div class="module-header"><span>Chronomètre</span></div>
        <div class="stopwatch-display">
          <span class="stopwatch-time">00:00.00</span>
        </div>
        <div class="stopwatch-controls">
          <button class="module-btn sw-start">▶ Démarrer</button>
          <button class="module-btn-ghost sw-lap" disabled>Tour</button>
          <button class="module-btn-ghost sw-reset">↺</button>
        </div>
        <div class="stopwatch-laps"></div>
      </div>
    `;
  },

  mount(el) {
    this._elapsed = 0;
    this._running = false;
    this._laps = [];

    const timeEl  = el.querySelector('.stopwatch-time');
    const startBtn = el.querySelector('.sw-start');
    const lapBtn   = el.querySelector('.sw-lap');
    const resetBtn = el.querySelector('.sw-reset');
    const lapsEl   = el.querySelector('.stopwatch-laps');

    const format = (ms) => {
      const cs = Math.floor(ms / 10) % 100;
      const s  = Math.floor(ms / 1000) % 60;
      const m  = Math.floor(ms / 60000);
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    };

    startBtn.addEventListener('click', () => {
      if (this._running) {
        clearInterval(this._interval);
        this._elapsed += Date.now() - this._startTime;
        this._running = false;
        startBtn.textContent = '▶ Reprendre';
        startBtn.className = 'module-btn sw-start';
      } else {
        this._startTime = Date.now();
        this._running = true;
        startBtn.textContent = '⏸ Pause';
        startBtn.className = 'module-btn sw-start';
        lapBtn.disabled = false;
        this._interval = setInterval(() => {
          timeEl.textContent = format(this._elapsed + (Date.now() - this._startTime));
        }, 10);
      }
    });

    lapBtn.addEventListener('click', () => {
      if (!this._running) return;
      const total = this._elapsed + (Date.now() - this._startTime);
      this._laps.push(total);
      const prev = this._laps.length > 1 ? this._laps[this._laps.length - 2] : 0;
      const lapTime = total - prev;
      const item = document.createElement('div');
      item.className = 'sw-lap-item';
      item.innerHTML = `<span class="sw-lap-num">Tour ${this._laps.length}</span><span class="sw-lap-time">${format(lapTime)}</span><span class="sw-lap-total">${format(total)}</span>`;
      lapsEl.prepend(item);
    });

    resetBtn.addEventListener('click', () => {
      clearInterval(this._interval);
      this._elapsed = 0;
      this._running = false;
      this._laps = [];
      timeEl.textContent = '00:00.00';
      lapsEl.innerHTML = '';
      startBtn.textContent = '▶ Démarrer';
      lapBtn.disabled = true;
    });
  },

  unmount() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._running = false;
  },

  renderSettings() {
    return `<p class="setting-hint">Le chronomètre est un module simple sans configuration.</p>`;
  },

  onConfigChange(el) {
    this.unmount();
    el.innerHTML = this.render();
    this.mount(el);
  }
};
