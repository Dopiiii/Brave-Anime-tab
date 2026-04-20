/* ============================================
   FOCUS MODE MODULE — Bloque les distractions
   ============================================ */

window.FocusModule = {
  id: 'focus',
  name: 'Mode Focus',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _active: false,
  _endTime: null,
  _interval: null,

  render(config) {
    return `
      <div class="focus-module">
        <div class="module-header"><span>Mode Focus</span></div>
        <div class="focus-content">
          <div class="focus-status inactive">
            <span class="focus-icon">🎯</span>
            <span class="focus-label">Focus inactif</span>
          </div>
          <div class="focus-timer-display hidden">
            <span class="focus-countdown">00:00</span>
            <span class="focus-session-label">Session en cours</span>
          </div>
          <div class="focus-controls">
            <select class="focus-duration-select module-select">
              ${[15,25,30,45,60,90].map(m =>
                `<option value="${m}" ${(config.defaultDuration||25) === m ? 'selected' : ''}>${m} min</option>`
              ).join('')}
            </select>
            <button class="module-btn focus-start-btn">▶ Démarrer</button>
          </div>
          <div class="focus-blocked-hint hidden">
            <span>🚫 Mode focus actif — Restez concentré !</span>
          </div>
        </div>
      </div>
    `;
  },

  mount(el, config) {
    const statusEl    = el.querySelector('.focus-status');
    const timerEl     = el.querySelector('.focus-timer-display');
    const countdownEl = el.querySelector('.focus-countdown');
    const hintEl      = el.querySelector('.focus-blocked-hint');
    const startBtn    = el.querySelector('.focus-start-btn');
    const durationSel = el.querySelector('.focus-duration-select');

    const activate = (minutes) => {
      this._active = true;
      this._endTime = Date.now() + minutes * 60 * 1000;

      statusEl.classList.add('hidden');
      timerEl.classList.remove('hidden');
      hintEl.classList.remove('hidden');
      startBtn.textContent = '⏹ Arrêter';
      startBtn.className = 'module-btn-ghost focus-start-btn';

      document.body.classList.add('focus-mode-active');

      if (this._interval) clearInterval(this._interval);
      this._interval = setInterval(() => {
        const remaining = Math.max(0, this._endTime - Date.now());
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        countdownEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if (remaining <= 0) deactivate();
      }, 1000);

      NotificationManager.scheduleAlert('🎯 Session focus terminée ! Bravo.', minutes * 60 * 1000);
    };

    const deactivate = () => {
      this._active = false;
      this._endTime = null;
      if (this._interval) { clearInterval(this._interval); this._interval = null; }

      statusEl.classList.remove('hidden');
      timerEl.classList.add('hidden');
      hintEl.classList.add('hidden');
      startBtn.textContent = '▶ Démarrer';
      startBtn.className = 'module-btn focus-start-btn';

      document.body.classList.remove('focus-mode-active');
    };

    startBtn.addEventListener('click', () => {
      if (this._active) {
        deactivate();
      } else {
        activate(parseInt(durationSel.value) || 25);
      }
    });
  },

  unmount() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    this._active = false;
    document.body.classList.remove('focus-mode-active');
  },

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Durée par défaut (minutes)</label>
        <select class="setting-select" data-module="focus" data-key="defaultDuration">
          ${[15,25,30,45,60,90].map(m =>
            `<option value="${m}" ${(config.defaultDuration||25) === m ? 'selected' : ''}>${m} min</option>`
          ).join('')}
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="focus" data-key="dimModules" ${config.dimModules ? 'checked' : ''}>
          <span>Assombrir les autres modules en mode focus</span>
        </label>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
