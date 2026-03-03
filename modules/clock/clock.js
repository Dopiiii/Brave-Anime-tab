/* ============================================
   CLOCK MODULE
   ============================================ */

window.ClockModule = {
  id: 'clock',
  name: 'Horloge',
  defaultPosition: { col: 3, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,

  render(config) {
    return `
      <div class="clock-module">
        <div class="clock-time">--:--</div>
        ${config.showDate !== false ? '<div class="clock-date"></div>' : ''}
      </div>
    `;
  },

  mount(el, config) {
    const timeEl = el.querySelector('.clock-time');
    const dateEl = el.querySelector('.clock-date');

    const update = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      let period = '';

      if (config.format === '12h') {
        period = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
      }

      const hoursStr = String(hours).padStart(2, '0');
      let timeStr = `${hoursStr}:${minutes}`;
      if (config.showSeconds) timeStr += `:${seconds}`;
      if (period) timeStr += period;

      timeEl.textContent = timeStr;

      if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const lang = config.language || 'fr-FR';
        dateEl.textContent = now.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', options);
      }
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

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Format</label>
        <select class="setting-select" data-module="clock" data-key="format">
          <option value="24h" ${config.format === '24h' ? 'selected' : ''}>24h</option>
          <option value="12h" ${config.format === '12h' ? 'selected' : ''}>12h</option>
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="clock" data-key="showSeconds" ${config.showSeconds ? 'checked' : ''}>
          <span>Afficher les secondes</span>
        </label>
      </div>
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="clock" data-key="showDate" ${config.showDate !== false ? 'checked' : ''}>
          <span>Afficher la date</span>
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
