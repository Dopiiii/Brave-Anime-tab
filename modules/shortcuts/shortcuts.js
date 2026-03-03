/* ============================================
   SHORTCUTS MODULE — Simple + Folders + TopSites
   ============================================ */

window.ShortcutsModule = {
  id: 'shortcuts',
  name: 'Raccourcis',
  defaultPosition: { col: 1, row: 3, colSpan: 2, rowSpan: 1 },

  render(config) {
    return `
      <div class="shortcuts-module">
        <div class="module-header">
          <span>Raccourcis</span>
        </div>
        <div class="shortcuts-content">
          ${config.showTopSites ? '<div class="shortcuts-section shortcuts-topsites"></div>' : ''}
          ${config.showSimple ? '<div class="shortcuts-section shortcuts-simple"></div>' : ''}
          ${config.showFolders ? '<div class="shortcuts-section shortcuts-folders"></div>' : ''}
        </div>
      </div>
    `;
  },

  async mount(el, config) {
    // Top Sites
    if (config.showTopSites) {
      const container = el.querySelector('.shortcuts-topsites');
      if (container) {
        try {
          const sites = await this._getTopSites();
          container.innerHTML = sites.map(site => this._renderShortcut(site)).join('');
        } catch (e) {
          container.innerHTML = '<span class="shortcuts-empty">Top sites non disponibles</span>';
        }
      }
    }

    // Simple shortcuts
    if (config.showSimple) {
      const container = el.querySelector('.shortcuts-simple');
      if (container) {
        const items = config.items || [];
        if (items.length === 0) {
          container.innerHTML = '<span class="shortcuts-empty">Aucun raccourci. Ajoutez-en dans les paramètres.</span>';
        } else {
          container.innerHTML = items.map(item => this._renderShortcut(item)).join('');
        }
      }
    }

    // Folders
    if (config.showFolders) {
      const container = el.querySelector('.shortcuts-folders');
      if (container) {
        const folders = config.folders || [];
        if (folders.length === 0) {
          container.innerHTML = '<span class="shortcuts-empty">Aucun dossier.</span>';
        } else {
          container.innerHTML = folders.map(folder => `
            <div class="shortcut-folder">
              <div class="shortcut-folder-header" data-folder-id="${folder.id}">
                <span class="folder-icon">📁</span>
                <span class="folder-name">${this._escapeHtml(folder.name)}</span>
                <span class="folder-chevron">▸</span>
              </div>
              <div class="shortcut-folder-items hidden">
                ${(folder.items || []).map(item => this._renderShortcut(item)).join('')}
              </div>
            </div>
          `).join('');

          // Toggle folder expand/collapse
          container.querySelectorAll('.shortcut-folder-header').forEach(header => {
            header.addEventListener('click', () => {
              const items = header.nextElementSibling;
              const chevron = header.querySelector('.folder-chevron');
              items.classList.toggle('hidden');
              chevron.textContent = items.classList.contains('hidden') ? '▸' : '▾';
            });
          });
        }
      }
    }
  },

  _renderShortcut(item) {
    const url = item.url || '#';
    const title = item.title || new URL(url).hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`;

    return `
      <a href="${this._escapeHtml(url)}" class="shortcut-item" title="${this._escapeHtml(title)}">
        <img class="shortcut-favicon" src="${favicon}" alt="" loading="lazy"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
        <span class="shortcut-fallback-icon" style="display:none">${title.charAt(0).toUpperCase()}</span>
        <span class="shortcut-name">${this._escapeHtml(title)}</span>
      </a>
    `;
  },

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  _getTopSites() {
    return new Promise((resolve) => {
      if (chrome.topSites) {
        chrome.topSites.get(resolve);
      } else {
        resolve([]);
      }
    });
  },

  unmount() {},

  renderSettings(config) {
    return `
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="shortcuts" data-key="showTopSites" ${config.showTopSites ? 'checked' : ''}>
          <span>Sites les plus visités (auto)</span>
        </label>
      </div>
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="shortcuts" data-key="showSimple" ${config.showSimple ? 'checked' : ''}>
          <span>Raccourcis personnalisés</span>
        </label>
      </div>
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="shortcuts" data-key="showFolders" ${config.showFolders !== false ? 'checked' : ''}>
          <span>Dossiers</span>
        </label>
      </div>
      <div class="setting-group">
        <label class="setting-label">Ajouter un raccourci</label>
        <div class="setting-inline">
          <input type="text" class="setting-input" id="shortcut-new-title" placeholder="Titre">
          <input type="text" class="setting-input" id="shortcut-new-url" placeholder="https://...">
          <button class="module-btn" id="shortcut-add-btn">+</button>
        </div>
      </div>
      <div id="shortcut-list">
        ${(config.items || []).map((item, i) => `
          <div class="shortcut-edit-item" data-index="${i}">
            <span>${this._escapeHtml(item.title || item.url)}</span>
            <button class="module-btn-ghost shortcut-remove-btn" data-index="${i}">✕</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
