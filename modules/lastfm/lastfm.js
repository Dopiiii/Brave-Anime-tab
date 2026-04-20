/* ============================================
   LAST.FM MODULE — Now Playing / Recent tracks
   Uses Last.fm public API (requires free API key)
   ============================================ */

window.LastfmModule = {
  id: 'lastfm',
  name: 'Musique (Last.fm)',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _interval: null,
  _currentEl: null,
  _currentConfig: null,

  render(config) {
    if (!config.username || !config.apiKey) {
      return `
        <div class="lastfm-module">
          <div class="module-header">
            <span>🎵 Musique</span>
          </div>
          <div class="lastfm-setup">
            <p>Configurez votre compte Last.fm dans les paramètres.</p>
            <a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener" class="lastfm-link">Obtenir une clé API →</a>
          </div>
        </div>
      `;
    }
    return `
      <div class="lastfm-module">
        <div class="module-header">
          <span>🎵 En écoute</span>
          <span class="lastfm-user">@${config.username}</span>
        </div>
        <div class="lastfm-content">
          <div class="lastfm-loading">Chargement...</div>
          <div class="lastfm-track hidden">
            <img class="lastfm-cover" src="" alt="" loading="lazy">
            <div class="lastfm-track-info">
              <span class="lastfm-track-name"></span>
              <span class="lastfm-artist-name"></span>
              <span class="lastfm-now-playing-badge hidden">🔴 En direct</span>
            </div>
          </div>
          <div class="lastfm-recent hidden">
            <div class="lastfm-recent-title">Récemment écouté</div>
            <div class="lastfm-recent-list"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount(el, config) {
    this._currentEl = el;
    this._currentConfig = config;
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    if (!config.username || !config.apiKey) return;

    await this._fetchTracks(el, config);
    this._interval = setInterval(() => {
      if (this._currentEl) this._fetchTracks(this._currentEl, this._currentConfig);
    }, 30 * 1000);
  },

  async _fetchTracks(el, config) {
    try {
      const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(config.username)}&api_key=${encodeURIComponent(config.apiKey)}&format=json&limit=5`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (data.error) throw new Error(data.message);

      const tracks = data.recenttracks?.track || [];
      if (tracks.length === 0) {
        el.querySelector('.lastfm-loading').textContent = 'Aucun historique';
        return;
      }

      const loadingEl = el.querySelector('.lastfm-loading');
      const trackEl   = el.querySelector('.lastfm-track');
      const recentEl  = el.querySelector('.lastfm-recent');

      if (loadingEl) loadingEl.classList.add('hidden');
      if (trackEl) trackEl.classList.remove('hidden');

      const current = tracks[0];
      const isNowPlaying = current['@attr']?.nowplaying === 'true';

      const cover = current.image?.find(i => i.size === 'medium')?.['#text'] || '';
      const coverEl = el.querySelector('.lastfm-cover');
      if (coverEl) {
        coverEl.src = cover || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';
        coverEl.style.display = cover ? '' : 'none';
      }

      const nameEl = el.querySelector('.lastfm-track-name');
      if (nameEl) nameEl.textContent = current.name || '—';

      const artistEl = el.querySelector('.lastfm-artist-name');
      if (artistEl) artistEl.textContent = current.artist?.['#text'] || '—';

      const badge = el.querySelector('.lastfm-now-playing-badge');
      if (badge) badge.classList.toggle('hidden', !isNowPlaying);

      if (recentEl && tracks.length > 1) {
        recentEl.classList.remove('hidden');
        const listEl = el.querySelector('.lastfm-recent-list');
        if (listEl) {
          listEl.innerHTML = tracks.slice(1, 4).map(t => `
            <div class="lastfm-recent-item">
              <span class="lastfm-recent-name">${t.name}</span>
              <span class="lastfm-recent-artist">${t.artist?.['#text'] || ''}</span>
            </div>
          `).join('');
        }
      }
    } catch (e) {
      console.error('Last.fm fetch error:', e);
      const loadingEl = el.querySelector('.lastfm-loading');
      if (loadingEl) { loadingEl.textContent = 'Erreur Last.fm'; loadingEl.classList.remove('hidden'); }
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
        <label class="setting-label">Nom d'utilisateur Last.fm</label>
        <input type="text" class="setting-input" data-module="lastfm" data-key="username"
               value="${config.username || ''}" placeholder="votre_pseudo">
      </div>
      <div class="setting-group">
        <label class="setting-label">Clé API Last.fm</label>
        <input type="text" class="setting-input" data-module="lastfm" data-key="apiKey"
               value="${config.apiKey || ''}" placeholder="a1b2c3d4e5f6...">
        <p class="setting-hint"><a href="https://www.last.fm/api/account/create" target="_blank" rel="noopener" style="color:var(--accent)">Créer une clé API gratuitement →</a></p>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    this.unmount();
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
