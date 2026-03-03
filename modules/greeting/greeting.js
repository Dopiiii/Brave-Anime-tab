/* ============================================
   GREETING MODULE
   ============================================ */

window.GreetingModule = {
  id: 'greeting',
  name: 'Salutation',
  defaultPosition: { col: 1, row: 1, colSpan: 2, rowSpan: 1 },

  render(config) {
    const greeting = this._getGreeting(config);
    const name = config.name || '';
    const nameDisplay = name ? `, ${name}` : '';

    return `
      <div class="greeting-module">
        <div class="greeting-text">${greeting}${nameDisplay}</div>
        <div class="greeting-subtitle">${this._getSubtitle(config)}</div>
      </div>
    `;
  },

  _getGreeting(config) {
    const hour = new Date().getHours();
    const lang = config.language || 'fr';

    if (lang === 'fr') {
      if (hour >= 5 && hour < 12) return 'Bonjour';
      if (hour >= 12 && hour < 18) return 'Bon après-midi';
      if (hour >= 18 && hour < 22) return 'Bonsoir';
      return 'Bonne nuit';
    } else {
      if (hour >= 5 && hour < 12) return 'Good morning';
      if (hour >= 12 && hour < 18) return 'Good afternoon';
      if (hour >= 18 && hour < 22) return 'Good evening';
      return 'Good night';
    }
  },

  _getSubtitle(config) {
    const hour = new Date().getHours();
    const lang = config.language || 'fr';

    if (lang === 'fr') {
      if (hour >= 5 && hour < 12) return 'Prêt pour une nouvelle journée ?';
      if (hour >= 12 && hour < 14) return 'Bon appétit !';
      if (hour >= 14 && hour < 18) return 'Continue comme ça !';
      if (hour >= 18 && hour < 22) return 'Bonne soirée !';
      return 'Il est temps de se reposer.';
    } else {
      if (hour >= 5 && hour < 12) return 'Ready for a new day?';
      if (hour >= 12 && hour < 14) return 'Enjoy your lunch!';
      if (hour >= 14 && hour < 18) return 'Keep going!';
      if (hour >= 18 && hour < 22) return 'Have a great evening!';
      return 'Time to rest.';
    }
  },

  mount(el, config) {
    // Update greeting every minute (time of day can change)
    this._interval = setInterval(() => {
      const greetingEl = el.querySelector('.greeting-text');
      const subtitleEl = el.querySelector('.greeting-subtitle');
      if (greetingEl) {
        const name = config.name || '';
        const nameDisplay = name ? `, ${name}` : '';
        greetingEl.textContent = this._getGreeting(config) + nameDisplay;
      }
      if (subtitleEl) {
        subtitleEl.textContent = this._getSubtitle(config);
      }
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
          <option value="fr" ${config.language === 'fr' ? 'selected' : ''}>Français</option>
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
