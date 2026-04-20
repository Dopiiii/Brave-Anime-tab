/* ============================================
   POMODORO MODULE — Focus timer with state persistence
   ============================================ */

window.PomodoroModule = {
  id: 'pomodoro',
  name: 'Pomodoro',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,
  _state: null,

  _getStorageKey() { return 'pomodoro_state'; },

  async _loadState(config) {
    try {
      const stored = await StorageManager.get('pomodoroState');
      if (stored && stored.savedAt) {
        const elapsed = Math.floor((Date.now() - stored.savedAt) / 1000);
        if (stored.running) {
          stored.timeLeft = Math.max(0, stored.timeLeft - elapsed);
          stored.running = false;
        }
        return stored;
      }
    } catch { /* ignore */ }
    return {
      running: false,
      timeLeft: (config.workDuration || 25) * 60,
      mode: 'work',
      sessions: 0
    };
  },

  async _saveState() {
    if (!this._state) return;
    try {
      await StorageManager.set('pomodoroState', { ...this._state, savedAt: Date.now() });
    } catch { /* ignore */ }
  },

  render(config) {
    const workMin = config.workDuration || 25;
    return `
      <div class="pomodoro-module">
        <div class="module-header">
          <span>Pomodoro</span>
          <span class="pomodoro-sessions">🍅 <span class="pomodoro-sessions-count">0</span></span>
        </div>
        <div class="pomodoro-display">
          <div class="pomodoro-mode">Travail</div>
          <div class="pomodoro-time">${String(workMin).padStart(2, '0')}:00</div>
          <div class="pomodoro-progress">
            <div class="pomodoro-progress-bar" style="width:100%"></div>
          </div>
        </div>
        <div class="pomodoro-controls">
          <button class="pomodoro-btn pomodoro-start" title="Démarrer / Pause">▶</button>
          <button class="pomodoro-btn pomodoro-skip" title="Passer">⏭</button>
          <button class="pomodoro-btn pomodoro-reset" title="Réinitialiser">↺</button>
        </div>
      </div>
    `;
  },

  async mount(el, config) {
    const timeEl = el.querySelector('.pomodoro-time');
    const modeEl = el.querySelector('.pomodoro-mode');
    const progressBar = el.querySelector('.pomodoro-progress-bar');
    const startBtn = el.querySelector('.pomodoro-start');
    const skipBtn = el.querySelector('.pomodoro-skip');
    const resetBtn = el.querySelector('.pomodoro-reset');
    const sessionsEl = el.querySelector('.pomodoro-sessions-count');

    const workDuration = (config.workDuration || 25) * 60;
    const breakDuration = (config.breakDuration || 5) * 60;

    this._state = await this._loadState(config);
    if (sessionsEl) sessionsEl.textContent = this._state.sessions || 0;

    const totalTime = () => this._state.mode === 'work' ? workDuration : breakDuration;

    const updateDisplay = () => {
      const mins = Math.floor(this._state.timeLeft / 60);
      const secs = this._state.timeLeft % 60;
      timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      modeEl.textContent = this._state.mode === 'work' ? 'Travail' : 'Pause';
      progressBar.style.width = (this._state.timeLeft / totalTime() * 100) + '%';
      progressBar.style.background = this._state.mode === 'work' ? 'var(--accent)' : '#00b894';
      if (sessionsEl) sessionsEl.textContent = this._state.sessions || 0;
    };

    const switchMode = (newMode) => {
      if (newMode === 'break') this._state.sessions = (this._state.sessions || 0) + 1;
      this._state.mode = newMode;
      this._state.timeLeft = newMode === 'work' ? workDuration : breakDuration;
      updateDisplay();
      this._saveState();
      NotificationManager.pomodoroAlert(newMode === 'break' ? '🍅 Session terminée ! Pause méritée.' : '⏰ La pause est terminée. Au travail !');
    };

    startBtn.addEventListener('click', () => {
      if (this._state.running) {
        clearInterval(this._interval);
        this._interval = null;
        this._state.running = false;
        startBtn.textContent = '▶';
        this._saveState();
      } else {
        this._state.running = true;
        startBtn.textContent = '⏸';
        this._interval = setInterval(() => {
          this._state.timeLeft--;
          if (this._state.timeLeft <= 0) {
            switchMode(this._state.mode === 'work' ? 'break' : 'work');
          }
          updateDisplay();
        }, 1000);
      }
    });

    skipBtn.addEventListener('click', () => {
      const newMode = this._state.mode === 'work' ? 'break' : 'work';
      switchMode(newMode);
    });

    resetBtn.addEventListener('click', () => {
      clearInterval(this._interval);
      this._interval = null;
      this._state = { running: false, timeLeft: workDuration, mode: 'work', sessions: 0 };
      startBtn.textContent = '▶';
      updateDisplay();
      this._saveState();
    });

    updateDisplay();
  },

  unmount() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this._state) {
      this._state.running = false;
      this._saveState();
    }
  },

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Durée de travail (min)</label>
        <input type="number" class="setting-input" data-module="pomodoro" data-key="workDuration"
               value="${config.workDuration || 25}" min="1" max="120">
      </div>
      <div class="setting-group">
        <label class="setting-label">Durée de pause (min)</label>
        <input type="number" class="setting-input" data-module="pomodoro" data-key="breakDuration"
               value="${config.breakDuration || 5}" min="1" max="60">
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
