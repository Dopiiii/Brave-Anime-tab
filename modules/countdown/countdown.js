/* ============================================
   COUNTDOWN MODULE — Countdown to a date
   ============================================ */

window.CountdownModule = {
  id: 'countdown',
  name: 'Compte à rebours',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,

  render(config) {
    return `
      <div class="countdown-module">
        <div class="module-header"><span>Compte à rebours</span></div>
        <div class="countdown-content">
          <div class="countdown-label">${this._escapeHtml(config.label || 'Événement')}</div>
          <div class="countdown-timer">
            <div class="countdown-unit"><span class="countdown-value countdown-days">--</span><span class="countdown-unit-label">jours</span></div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit"><span class="countdown-value countdown-hours">--</span><span class="countdown-unit-label">heures</span></div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit"><span class="countdown-value countdown-mins">--</span><span class="countdown-unit-label">min</span></div>
            <div class="countdown-separator">:</div>
            <div class="countdown-unit"><span class="countdown-value countdown-secs">--</span><span class="countdown-unit-label">sec</span></div>
          </div>
        </div>
      </div>
    `;
  },

  mount(el, config) {
    const targetDate = config.targetDate ? new Date(config.targetDate) : null;
    const daysEl = el.querySelector('.countdown-days');
    const hoursEl = el.querySelector('.countdown-hours');
    const minsEl = el.querySelector('.countdown-mins');
    const secsEl = el.querySelector('.countdown-secs');

    const update = () => {
      if (!targetDate) {
        daysEl.textContent = '--';
        hoursEl.textContent = '--';
        minsEl.textContent = '--';
        secsEl.textContent = '--';
        return;
      }

      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      daysEl.textContent = String(days).padStart(2, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(mins).padStart(2, '0');
      secsEl.textContent = String(secs).padStart(2, '0');
    };

    update();
    this._interval = setInterval(update, 1000);
  },

  unmount() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Nom de l'événement</label>
        <input type="text" class="setting-input" data-module="countdown" data-key="label"
               value="${config.label || ''}" placeholder="Mon événement">
      </div>
      <div class="setting-group">
        <label class="setting-label">Date cible</label>
        <input type="datetime-local" class="setting-input" data-module="countdown" data-key="targetDate"
               value="${config.targetDate || ''}">
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
