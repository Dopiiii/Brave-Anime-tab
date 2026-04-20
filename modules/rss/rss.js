/* ============================================
   RSS MODULE — Feed reader (uses rss2json proxy)
   ============================================ */

window.RssModule = {
  id: 'rss',
  name: 'Flux RSS',
  defaultPosition: { col: 1, row: 1, colSpan: 2, rowSpan: 1 },

  _interval: null,
  _currentEl: null,
  _currentConfig: null,

  render(config) {
    const feedName = config.feedName || 'Flux RSS';
    return `
      <div class="rss-module">
        <div class="module-header">
          <span>${feedName}</span>
          <button class="module-btn-ghost rss-refresh" style="font-size:0.7rem;padding:2px 6px">↺</button>
        </div>
        <div class="rss-list">
          <div class="rss-loading">Chargement du flux...</div>
        </div>
      </div>
    `;
  },

  async mount(el, config) {
    this._currentEl = el;
    this._currentConfig = config;
    if (this._interval) { clearInterval(this._interval); this._interval = null; }

    if (!config.feedUrl) {
      el.querySelector('.rss-list').innerHTML = '<span class="rss-empty">Configurez un flux RSS dans les paramètres.</span>';
      return;
    }

    await this._fetchFeed(el, config);
    el.querySelector('.rss-refresh')?.addEventListener('click', () => this._fetchFeed(el, config));

    this._interval = setInterval(() => {
      if (this._currentEl) this._fetchFeed(this._currentEl, this._currentConfig);
    }, 15 * 60 * 1000);
  },

  async _fetchFeed(el, config) {
    const listEl = el.querySelector('.rss-list');
    const count = config.itemCount || 5;

    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(config.feedUrl)}&count=${count}`;
      const resp = await fetch(apiUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (data.status !== 'ok') throw new Error('Feed parse error');

      const items = (data.items || []).slice(0, count);
      listEl.innerHTML = items.map(item => {
        const date = item.pubDate ? new Date(item.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
        const title = item.title || 'Sans titre';
        return `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="rss-item">
            <div class="rss-item-title">${title}</div>
            ${date ? `<span class="rss-item-date">${date}</span>` : ''}
          </a>
        `;
      }).join('') || '<span class="rss-empty">Aucun article trouvé.</span>';

    } catch (e) {
      console.error('RSS fetch error:', e);
      listEl.innerHTML = '<span class="rss-empty">Erreur de chargement du flux.</span>';
    }
  },

  unmount() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    this._currentEl = null;
    this._currentConfig = null;
  },

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-label">URL du flux RSS</label>
        <input type="url" class="setting-input" data-module="rss" data-key="feedUrl"
               value="${config.feedUrl || ''}" placeholder="https://example.com/feed.xml">
      </div>
      <div class="setting-group">
        <label class="setting-label">Nom affiché</label>
        <input type="text" class="setting-input" data-module="rss" data-key="feedName"
               value="${config.feedName || ''}" placeholder="Nom du flux">
      </div>
      <div class="setting-group">
        <label class="setting-label">Nombre d'articles</label>
        <input type="number" class="setting-input" data-module="rss" data-key="itemCount"
               value="${config.itemCount || 5}" min="1" max="20">
      </div>
      <p class="setting-hint">Utilise l'API rss2json pour contourner les restrictions CORS.</p>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
