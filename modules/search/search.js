/* ============================================
   SEARCH MODULE
   ============================================ */

window.SearchModule = {
  id: 'search',
  name: 'Recherche',
  defaultPosition: { col: 1, row: 2, colSpan: 4, rowSpan: 1 },

  _engines: {
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    brave: { name: 'Brave Search', url: 'https://search.brave.com/search?q=' }
  },

  render(config) {
    const engine = this._engines[config.engine] || this._engines.google;
    const placeholder = config.placeholder || `Rechercher sur ${engine.name}...`;

    return `
      <div class="search-module">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" class="search-input" placeholder="${placeholder}" autocomplete="off" spellcheck="false">
          <span class="search-engine-badge">${engine.name}</span>
        </div>
      </div>
    `;
  },

  mount(el, config) {
    const input = el.querySelector('.search-input');
    const engine = this._engines[config.engine] || this._engines.google;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const query = encodeURIComponent(input.value.trim());
        window.location.href = engine.url + query;
      }
    });
  },

  unmount() {},

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">Moteur de recherche</label>
        <select class="setting-select" data-module="search" data-key="engine">
          <option value="google" ${config.engine === 'google' ? 'selected' : ''}>Google</option>
          <option value="duckduckgo" ${config.engine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
          <option value="bing" ${config.engine === 'bing' ? 'selected' : ''}>Bing</option>
          <option value="brave" ${config.engine === 'brave' ? 'selected' : ''}>Brave Search</option>
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-label">Placeholder</label>
        <input type="text" class="setting-input" data-module="search" data-key="placeholder"
               value="${config.placeholder || ''}" placeholder="Texte du placeholder">
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
