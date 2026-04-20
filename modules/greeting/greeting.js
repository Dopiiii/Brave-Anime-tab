/* ============================================
   GREETING MODULE — Fixed memory leak
   ============================================ */

window.GreetingModule = {
  id: 'greeting',
  name: 'Salutation',
  defaultPosition: { col: 1, row: 1, colSpan: 2, rowSpan: 1 },

  _interval: null,

  render(config) {
    const greeting = this._getGreeting(config);
    const name = config.name ? `, ${config.name}` : '';
    return `
      <div class="greeting-module">
        <div class="greeting-text">${greeting}${name} 👋</div>
        <div class="greeting-subtitle">${this._getSubtitle(config)}</div>
      </div>
    `;
  },

  _getGreeting(config) {
    const h = new Date().getHours();
    if ((config.language || 'fr') === 'fr') {
      if (h >= 5  && h < 12) return 'Bonjour';
      if (h >= 12 && h < 18) return 'Bon après-midi';
      if (h >= 18 && h < 22) return 'Bonsoir';
      return 'Bonne nuit';
    }
    if (h >= 5  && h < 12) return 'Good morning';
    if (h >= 12 && h < 18) return 'Good afternoon';
    if (h >= 18 && h < 22) return 'Good evening';
    return 'Good night';
  },

  _getSubtitle(config) {
    const h = new Date().getHours();
    if ((config.language || 'fr') === 'fr') {
      if (h >= 5  && h < 12) return 'Prêt pour une nouvelle journée ?';
      if (h >= 12 && h < 14) return 'Bon appétit !';
      if (h >= 14 && h < 18) return 'Continue comme ça !';
      if (h >= 18 && h < 22) return 'Bonne soirée !';
      return 'Il est temps de se reposer.';
    }
    if (h >= 5  && h < 12) return 'Ready for a new day?';
    if (h >= 12 && h < 14) return 'Enjoy your lunch!';
    if (h >= 14 && h < 18) return 'Keep going!';
    if (h >= 18 && h < 22) return 'Have a great evening!';
    return 'Time to rest.';
  },

  mount(el, config) {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    this._interval = setInterval(() => {
      const greetingEl = el.querySelector('.greeting-text');
      const subtitleEl = el.querySelector('.greeting-subtitle');
      if (!greetingEl) { clearInterval(this._interval); this._interval = null; return; }
      const name = config.name ? `, ${config.name}` : '';
      greetingEl.textContent = this._getGreeting(config) + name + ' 👋';
      if (subtitleEl) subtitleEl.textContent = this._getSubtitle(config);
    }, 60000);
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
        <label class="setting-label">Votre prénom</label>
        <input type="text" class="setting-input" data-module="greeting" data-key="name"
               value="${config.name || ''}" placeholder="Entrez votre prénom">
      </div>
      <div class="setting-group">
        <label class="setting-label">Langue</label>
        <select class="setting-select" data-module="greeting" data-key="language">
          <option value="fr" ${(config.language || 'fr') === 'fr' ? 'selected' : ''}>Français</option>
          <option value="en" ${config.language === 'en' ? 'selected' : ''}>English</option>
        </select>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
