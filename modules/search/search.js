/* ============================================
   SEARCH MODULE — with custom commands
   Fixed: URL encoding, input validation
   ============================================ */

window.SearchModule = {
  id: 'search',
  name: 'Recherche',
  defaultPosition: { col: 1, row: 2, colSpan: 4, rowSpan: 1 },

  _engines: {
    google:     { name: 'Google',      url: 'https://www.google.com/search?q=' },
    duckduckgo: { name: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=' },
    bing:       { name: 'Bing',        url: 'https://www.bing.com/search?q=' },
    brave:      { name: 'Brave Search',url: 'https://search.brave.com/search?q=' },
    youtube:    { name: 'YouTube',     url: 'https://www.youtube.com/results?search_query=' },
    github:     { name: 'GitHub',      url: 'https://github.com/search?q=' }
  },

  _safeUrl(base, query) {
    try {
      const url = new URL(base + encodeURIComponent(query));
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
      return url.href;
    } catch {
      return null;
    }
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
        <div class="search-commands-hint hidden"></div>
      </div>
    `;
  },

  mount(el, config) {
    const input = el.querySelector('.search-input');
    const engine = this._engines[config.engine] || this._engines.google;
    const hint = el.querySelector('.search-commands-hint');
    const commands = config.commands || [];

    input.addEventListener('input', () => {
      const val = input.value.trim();
      if (val.startsWith('/') && commands.length > 0) {
        const typed = val.slice(1).toLowerCase();
        const matches = commands.filter(c => c.name.toLowerCase().startsWith(typed));
        if (matches.length > 0 && typed.length > 0) {
          hint.innerHTML = matches.map(c =>
            `<span class="search-cmd-suggestion" data-cmd="${c.name}">/${c.name} <small>(${c.urls.length} sites)</small></span>`
          ).join('');
          hint.classList.remove('hidden');

          hint.querySelectorAll('.search-cmd-suggestion').forEach(s => {
            s.addEventListener('click', () => {
              const cmd = commands.find(c => c.name === s.dataset.cmd);
              if (cmd) {
                cmd.urls.forEach(url => {
                  try { window.open(new URL(url).href, '_blank'); } catch { /* invalid url */ }
                });
                input.value = '';
                hint.classList.add('hidden');
              }
            });
          });
        } else {
          hint.classList.add('hidden');
        }
      } else {
        hint.classList.add('hidden');
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        hint.classList.add('hidden');
        input.blur();
        return;
      }
      if (e.key !== 'Enter' || !input.value.trim()) return;

      const val = input.value.trim();

      if (val.startsWith('/') && commands.length > 0) {
        const cmdName = val.slice(1).toLowerCase();
        const cmd = commands.find(c => c.name.toLowerCase() === cmdName);
        if (cmd) {
          cmd.urls.forEach(url => {
            try { window.open(new URL(url).href, '_blank'); } catch { /* invalid */ }
          });
          input.value = '';
          hint.classList.add('hidden');
          return;
        }
      }

      const dest = this._safeUrl(engine.url, val);
      if (dest) window.location.href = dest;
    });
  },

  unmount() {},

  renderSettings(config) {
    const commands = config.commands || [];
    const commandsHtml = commands.map((cmd, i) => `
      <div class="search-cmd-item">
        <div class="search-cmd-header">
          <span class="search-cmd-name">/${cmd.name}</span>
          <button class="module-btn-ghost search-cmd-remove" data-cmd-index="${i}">✕</button>
        </div>
        <div class="search-cmd-urls">${cmd.urls.map(u => `<span class="search-cmd-url">${u}</span>`).join('')}</div>
      </div>
    `).join('');

    return `
      <div class="setting-group">
        <label class="setting-label">Moteur de recherche</label>
        <select class="setting-select" data-module="search" data-key="engine">
          <option value="google"     ${config.engine === 'google'     ? 'selected' : ''}>Google</option>
          <option value="duckduckgo" ${config.engine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
          <option value="bing"       ${config.engine === 'bing'       ? 'selected' : ''}>Bing</option>
          <option value="brave"      ${config.engine === 'brave'      ? 'selected' : ''}>Brave Search</option>
          <option value="youtube"    ${config.engine === 'youtube'    ? 'selected' : ''}>YouTube</option>
          <option value="github"     ${config.engine === 'github'     ? 'selected' : ''}>GitHub</option>
        </select>
      </div>
      <div class="setting-group">
        <label class="setting-label">Placeholder</label>
        <input type="text" class="setting-input" data-module="search" data-key="placeholder"
               value="${config.placeholder || ''}" placeholder="Texte du placeholder">
      </div>
      <div class="setting-divider"></div>
      <p class="setting-section-title">Commandes personnalisées</p>
      <p class="setting-hint">Tapez /<em>nom</em> dans la barre de recherche pour ouvrir plusieurs sites.</p>
      <div class="search-commands-list">${commandsHtml || '<p class="setting-hint">Aucune commande.</p>'}</div>
      <div class="setting-group" style="margin-top:10px">
        <label class="setting-label">Nouvelle commande</label>
        <input type="text" class="setting-input" id="search-cmd-name" placeholder="Nom (ex: travail)" style="margin-bottom:6px">
        <textarea class="setting-input" id="search-cmd-urls" placeholder="URLs (une par ligne)&#10;https://gmail.com&#10;https://github.com" style="min-height:60px;resize:vertical"></textarea>
        <button class="module-btn" id="search-cmd-add" style="margin-top:6px;width:100%">Ajouter la commande</button>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
