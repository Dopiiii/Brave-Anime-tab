/* ============================================
   SETTINGS.JS — Settings panel controller (v2)
   Improved: drag-drop upload, font picker, layout presets,
   new modules, better appearance controls
   ============================================ */

const SettingsPanel = (() => {
  let _panel;
  let _backdrop;
  let _isOpen = false;

  // Available fonts
  const FONTS = [
    { id: 'system', name: 'System Default', value: "'Segoe UI', system-ui, -apple-system, sans-serif" },
    { id: 'inter', name: 'Inter', value: "'Inter', 'Segoe UI', sans-serif" },
    { id: 'poppins', name: 'Poppins', value: "'Poppins', sans-serif" },
    { id: 'roboto', name: 'Roboto', value: "'Roboto', sans-serif" },
    { id: 'montserrat', name: 'Montserrat', value: "'Montserrat', sans-serif" },
    { id: 'quicksand', name: 'Quicksand', value: "'Quicksand', sans-serif" },
    { id: 'space-grotesk', name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
    { id: 'jetbrains', name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { id: 'playfair', name: 'Playfair Display', value: "'Playfair Display', serif" },
    { id: 'dm-sans', name: 'DM Sans', value: "'DM Sans', sans-serif" },
    { id: 'outfit', name: 'Outfit', value: "'Outfit', sans-serif" },
    { id: 'nunito', name: 'Nunito', value: "'Nunito', sans-serif" },
    { id: 'custom', name: 'Personnalisée...', value: '' }
  ];

  function init(settings) {
    injectHTML();
    attachEvents(settings);
    if (settings.theme && settings.theme.active !== 'custom') {
      ThemeManager.apply(settings.theme.active);
    }
    // Load Google Fonts
    loadGoogleFonts(settings.appearance.fontFamily);
  }

  function loadGoogleFonts(currentFont) {
    const fontsToLoad = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Quicksand', 'Space+Grotesk', 'JetBrains+Mono', 'Playfair+Display', 'DM+Sans', 'Outfit', 'Nunito'];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f}:wght@200;300;400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }

  function injectHTML() {
    const backdrop = document.createElement('div');
    backdrop.id = 'settings-backdrop';
    document.body.appendChild(backdrop);
    _backdrop = backdrop;

    const panel = document.getElementById('settings-panel');
    panel.innerHTML = `
      <div class="settings-header">
        <h2>Paramètres</h2>
        <button class="settings-close" id="settings-close-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="wallpaper">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span>Fond d'écran</span>
        </button>
        <button class="settings-tab" data-tab="modules">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <span>Modules</span>
        </button>
        <button class="settings-tab" data-tab="layout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span>Disposition</span>
        </button>
        <button class="settings-tab" data-tab="appearance">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <span>Apparence</span>
        </button>
        <button class="settings-tab" data-tab="themes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          <span>Thèmes</span>
        </button>
        <button class="settings-tab" data-tab="more">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          <span>Plus</span>
        </button>
      </div>

      <div class="settings-body">
        <!-- WALLPAPER TAB -->
        <div class="settings-tab-content active" data-tab="wallpaper">
          <div class="setting-group">
            <div class="wp-source-toggle">
              <button class="wp-source-btn active" data-source="local">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Fichier local
              </button>
              <button class="wp-source-btn" data-source="url">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                URL externe
              </button>
            </div>
          </div>

          <div class="setting-group" id="wp-upload-group">
            <div class="wp-dropzone" id="wp-dropzone">
              <div class="wp-dropzone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p class="wp-dropzone-text">Glissez une image ou vidéo ici</p>
                <p class="wp-dropzone-hint">ou cliquez pour parcourir</p>
                <p class="wp-dropzone-formats">JPG, PNG, WebP, MP4, WebM</p>
              </div>
              <input type="file" id="wp-file-input" accept="image/*,video/*" class="wp-file-hidden">
            </div>
            <div class="wp-preview hidden" id="wp-preview">
              <div class="wp-preview-info">
                <span class="wp-preview-name" id="wp-preview-name"></span>
                <button class="wp-preview-remove" id="wp-preview-remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="setting-group hidden" id="wp-url-group">
            <label class="setting-label">URL de l'image ou vidéo</label>
            <div class="setting-inline">
              <input type="text" class="setting-input" id="wp-url-input" placeholder="https://example.com/wallpaper.mp4">
              <button class="module-btn" id="wp-url-apply">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- MODULES TAB -->
        <div class="settings-tab-content" data-tab="modules">
          <div id="modules-toggles"></div>
          <div class="setting-divider"></div>
          <p class="setting-section-title">Paramètres des modules</p>
          <div id="modules-settings"></div>
        </div>

        <!-- LAYOUT TAB -->
        <div class="settings-tab-content" data-tab="layout">
          <div class="setting-group">
            <label class="setting-label">Mode de disposition</label>
            <div class="layout-presets" id="layout-presets"></div>
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <label class="setting-label">Colonnes</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="grid-cols" min="2" max="6" value="4">
              <span class="setting-slider-value" id="grid-cols-val">4</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Espacement entre modules</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="grid-gap" min="4" max="32" value="16">
              <span class="setting-slider-value" id="grid-gap-val">16px</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Marge extérieure</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="grid-padding" min="8" max="64" value="24">
              <span class="setting-slider-value" id="grid-padding-val">24px</span>
            </div>
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <label class="setting-toggle">
              <input type="checkbox" id="edit-mode-toggle">
              <span>Mode édition (drag & drop)</span>
            </label>
          </div>
          <div class="setting-group">
            <button class="module-btn-ghost" id="layout-reset">Réinitialiser la disposition</button>
          </div>
        </div>

        <!-- APPEARANCE TAB -->
        <div class="settings-tab-content" data-tab="appearance">
          <p class="setting-section-title">Style des modules</p>

          <div class="setting-group">
            <label class="setting-label">Opacité des modules</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="app-opacity" min="0" max="0.4" step="0.01" value="0.08">
              <span class="setting-slider-value" id="app-opacity-val">0.08</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Flou d'arrière-plan</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="app-blur" min="0" max="40" value="12">
              <span class="setting-slider-value" id="app-blur-val">12px</span>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">Arrondi des coins</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="app-radius" min="0" max="32" value="16">
              <span class="setting-slider-value" id="app-radius-val">16px</span>
            </div>
          </div>

          <div class="setting-divider"></div>
          <p class="setting-section-title">Couleurs</p>

          <div class="setting-group">
            <label class="setting-label">Couleur d'accent</label>
            <div class="color-presets">
              <button class="color-preset active" data-color="#6c5ce7" style="background:#6c5ce7"></button>
              <button class="color-preset" data-color="#e84393" style="background:#e84393"></button>
              <button class="color-preset" data-color="#00cec9" style="background:#00cec9"></button>
              <button class="color-preset" data-color="#fdcb6e" style="background:#fdcb6e"></button>
              <button class="color-preset" data-color="#e17055" style="background:#e17055"></button>
              <button class="color-preset" data-color="#00b894" style="background:#00b894"></button>
              <button class="color-preset" data-color="#a855f7" style="background:#a855f7"></button>
              <button class="color-preset" data-color="#3b82f6" style="background:#3b82f6"></button>
              <input type="color" class="color-preset-custom" id="app-accent" value="#6c5ce7" title="Couleur personnalisée">
            </div>
          </div>

          <div class="setting-divider"></div>
          <p class="setting-section-title">Typographie</p>

          <div class="setting-group">
            <label class="setting-label">Police d'écriture</label>
            <div class="font-picker" id="font-picker"></div>
          </div>

          <div class="setting-group hidden" id="custom-font-group">
            <label class="setting-label">Nom de la police personnalisée</label>
            <input type="text" class="setting-input" id="custom-font-input" placeholder="Ex: Comic Sans MS">
          </div>

          <div class="setting-divider"></div>

          <div class="setting-group">
            <label class="setting-toggle">
              <input type="checkbox" id="boot-animation-toggle" checked>
              <span>Animation au démarrage</span>
            </label>
          </div>

          <div class="setting-group">
            <label class="setting-label">Overlay wallpaper (assombrir)</label>
            <div class="setting-slider-row">
              <input type="range" class="setting-slider" id="wp-overlay" min="0" max="0.6" step="0.05" value="0.15">
              <span class="setting-slider-value" id="wp-overlay-val">15%</span>
            </div>
          </div>
        </div>

        <!-- THEMES TAB -->
        <div class="settings-tab-content" data-tab="themes">
          <div class="setting-group">
            <p class="setting-hint">Choisissez un thème ou personnalisez dans l'onglet Apparence.</p>
          </div>
          <div class="theme-grid" id="theme-grid">
            <div class="theme-card" data-theme="custom">
              <div class="theme-card-preview" style="background:linear-gradient(135deg, #6c5ce7, #2d1b69)"></div>
              <div class="theme-card-name">Personnalisé</div>
            </div>
          </div>
        </div>

        <!-- MORE TAB (keyboard, import/export, dev) -->
        <div class="settings-tab-content" data-tab="more">
          <p class="setting-section-title">Raccourcis clavier</p>
          <div class="setting-group">
            <label class="setting-toggle">
              <input type="checkbox" id="keyboard-enabled" checked>
              <span>Activer les raccourcis</span>
            </label>
          </div>
          <div class="keyboard-shortcuts-list">
            <div class="shortcut-key-row"><kbd>Esc</kbd><span>Paramètres</span></div>
            <div class="shortcut-key-row"><kbd>/</kbd><span>Recherche</span></div>
            <div class="shortcut-key-row"><kbd>E</kbd><span>Mode édition</span></div>
          </div>

          <div class="setting-divider"></div>
          <p class="setting-section-title">Import / Export</p>
          <div class="setting-group">
            <p class="setting-hint">Sauvegardez ou restaurez votre configuration.</p>
          </div>
          <div class="import-export-group">
            <button class="module-btn" id="config-export">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter
            </button>
            <button class="module-btn-ghost" id="config-import-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Importer
            </button>
          </div>
          <input type="file" id="config-import-file" accept=".json" class="hidden">

          <div class="setting-divider"></div>
          <p class="setting-section-title">Mode développeur</p>
          <div class="setting-group">
            <label class="setting-toggle">
              <input type="checkbox" id="dev-mode-toggle">
              <span>Activer le mode développeur</span>
            </label>
            <p class="setting-hint">Créez vos propres modules en HTML/CSS/JS.</p>
          </div>
          <div id="dev-mode-content" class="hidden">
            <div id="dev-modules-list"></div>
            <div class="setting-divider"></div>
            <div class="setting-group">
              <label class="setting-label">Nom du module</label>
              <input type="text" class="setting-input" id="dev-module-name" placeholder="Mon Module">
            </div>
            <div class="dev-editor-group">
              <div class="dev-editor-label">HTML</div>
              <textarea class="dev-editor-textarea" id="dev-module-html" placeholder="<div>Contenu</div>"></textarea>
            </div>
            <div class="dev-editor-group">
              <div class="dev-editor-label">CSS</div>
              <textarea class="dev-editor-textarea" id="dev-module-css" placeholder=".classe { }"></textarea>
            </div>
            <div class="dev-editor-group">
              <div class="dev-editor-label">JavaScript</div>
              <textarea class="dev-editor-textarea" id="dev-module-js" placeholder="// container = element"></textarea>
            </div>
            <button class="module-btn" id="dev-save-module" style="width:100%">Sauvegarder le module</button>
          </div>

          <div class="setting-divider"></div>
          <div class="setting-group">
            <button class="module-btn-ghost danger-btn" id="config-reset">Réinitialiser tous les paramètres</button>
          </div>
        </div>
      </div>
    `;

    _panel = panel;
  }

  function attachEvents(settings) {
    document.getElementById('settings-close-btn').addEventListener('click', close);
    _backdrop.addEventListener('click', close);
    document.getElementById('settings-trigger').addEventListener('click', toggle);

    // Tab navigation
    _panel.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _panel.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        _panel.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        _panel.querySelector(`.settings-tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
      });
    });

    // ======= WALLPAPER =======
    setupWallpaperTab(settings);

    // ======= MODULES =======
    renderModuleToggles(settings);

    // ======= LAYOUT =======
    setupLayoutTab(settings);

    // ======= APPEARANCE =======
    setupAppearanceTab(settings);

    // ======= THEMES =======
    renderThemes(settings.theme?.active);

    // ======= MORE (keyboard, import/export, dev) =======
    setupMoreTab(settings);
  }

  // ---------- WALLPAPER ----------
  function setupWallpaperTab(settings) {
    const sourceButtons = _panel.querySelectorAll('.wp-source-btn');
    const uploadGroup = document.getElementById('wp-upload-group');
    const urlGroup = document.getElementById('wp-url-group');
    const dropzone = document.getElementById('wp-dropzone');
    const fileInput = document.getElementById('wp-file-input');
    const preview = document.getElementById('wp-preview');
    const previewName = document.getElementById('wp-preview-name');

    // Source toggle
    if (settings.wallpaper.source === 'url') {
      sourceButtons[0].classList.remove('active');
      sourceButtons[1].classList.add('active');
      uploadGroup.classList.add('hidden');
      urlGroup.classList.remove('hidden');
      document.getElementById('wp-url-input').value = settings.wallpaper.url || '';
    }

    if (settings.wallpaper.fileName) {
      preview.classList.remove('hidden');
      previewName.textContent = settings.wallpaper.fileName;
    }

    sourceButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sourceButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const isUrl = btn.dataset.source === 'url';
        uploadGroup.classList.toggle('hidden', isUrl);
        urlGroup.classList.toggle('hidden', !isUrl);
      });
    });

    // Drag & drop
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) await handleFileUpload(file, preview, previewName);
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) await handleFileUpload(file, preview, previewName);
    });

    // URL apply
    document.getElementById('wp-url-apply').addEventListener('click', async () => {
      const url = document.getElementById('wp-url-input').value.trim();
      if (!url) return;
      await WallpaperManager.setFromUrl(url);
      showToast('Fond d\'écran appliqué !');
    });

    // Remove
    document.getElementById('wp-preview-remove').addEventListener('click', async () => {
      await WallpaperManager.clear();
      preview.classList.add('hidden');
      previewName.textContent = '';
      showToast('Fond d\'écran supprimé');
    });
  }

  async function handleFileUpload(file, preview, previewName) {
    const wp = await WallpaperManager.uploadFile(file);
    preview.classList.remove('hidden');
    previewName.textContent = wp.fileName;
    showToast('Fond d\'écran appliqué !');
  }

  // ---------- LAYOUT ----------
  function setupLayoutTab(settings) {
    // Layout presets
    const presetsContainer = document.getElementById('layout-presets');
    const presets = GridManager.getLayoutPresets();
    const currentLayout = settings.grid.layoutMode || 'auto';

    presetsContainer.innerHTML = Object.entries(presets).map(([id, preset]) => `
      <button class="layout-preset-btn ${id === currentLayout ? 'active' : ''}" data-layout="${id}">
        <span class="layout-preset-name">${preset.name}</span>
        <span class="layout-preset-desc">${preset.description}</span>
      </button>
    `).join('');

    presetsContainer.addEventListener('click', async (e) => {
      const btn = e.target.closest('.layout-preset-btn');
      if (!btn) return;
      presetsContainer.querySelectorAll('.layout-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      await GridManager.setLayoutMode(btn.dataset.layout);
    });

    // Grid controls
    const gridCols = document.getElementById('grid-cols');
    const gridColsVal = document.getElementById('grid-cols-val');
    const gridGap = document.getElementById('grid-gap');
    const gridGapVal = document.getElementById('grid-gap-val');
    const gridPadding = document.getElementById('grid-padding');
    const gridPaddingVal = document.getElementById('grid-padding-val');

    gridCols.value = settings.grid.columns;
    gridColsVal.textContent = settings.grid.columns;
    gridGap.value = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-gap')) || 16;
    gridGapVal.textContent = gridGap.value + 'px';
    gridPadding.value = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-padding')) || 24;
    gridPaddingVal.textContent = gridPadding.value + 'px';

    gridCols.addEventListener('input', async () => {
      gridColsVal.textContent = gridCols.value;
      await GridManager.updateGridSize(parseInt(gridCols.value));
    });

    gridGap.addEventListener('input', () => {
      gridGapVal.textContent = gridGap.value + 'px';
      document.documentElement.style.setProperty('--grid-gap', gridGap.value + 'px');
    });

    gridPadding.addEventListener('input', () => {
      gridPaddingVal.textContent = gridPadding.value + 'px';
      document.documentElement.style.setProperty('--grid-padding', gridPadding.value + 'px');
    });

    document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
      const isEdit = GridManager.toggleEditMode();
      e.target.checked = isEdit;
      showToast(isEdit ? 'Mode édition activé' : 'Mode édition désactivé');
    });

    document.getElementById('layout-reset').addEventListener('click', async () => {
      const grid = await StorageManager.get('grid');
      grid.modulePositions = {};
      grid.columns = 4;
      grid.layoutMode = 'auto';
      await StorageManager.set('grid', grid);
      document.documentElement.style.setProperty('--grid-gap', '16px');
      document.documentElement.style.setProperty('--grid-padding', '24px');
      gridCols.value = 4; gridColsVal.textContent = '4';
      gridGap.value = 16; gridGapVal.textContent = '16px';
      gridPadding.value = 24; gridPaddingVal.textContent = '24px';
      const all = await StorageManager.getAll();
      await GridManager.init(all);
      showToast('Disposition réinitialisée');
    });
  }

  // ---------- APPEARANCE ----------
  function setupAppearanceTab(settings) {
    const opacity = document.getElementById('app-opacity');
    const blur = document.getElementById('app-blur');
    const radius = document.getElementById('app-radius');
    const accent = document.getElementById('app-accent');
    const bootAnim = document.getElementById('boot-animation-toggle');
    const wpOverlay = document.getElementById('wp-overlay');

    opacity.value = settings.appearance.moduleOpacity;
    document.getElementById('app-opacity-val').textContent = settings.appearance.moduleOpacity;
    blur.value = settings.appearance.moduleBlur;
    document.getElementById('app-blur-val').textContent = settings.appearance.moduleBlur + 'px';
    radius.value = settings.appearance.moduleRadius;
    document.getElementById('app-radius-val').textContent = settings.appearance.moduleRadius + 'px';
    accent.value = settings.appearance.accentColor;
    bootAnim.checked = settings.bootAnimation.enabled;

    // Color presets
    const colorPresets = _panel.querySelectorAll('.color-preset');
    colorPresets.forEach(btn => {
      if (btn.dataset.color === settings.appearance.accentColor) btn.classList.add('active');
      btn.addEventListener('click', () => {
        colorPresets.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        accent.value = btn.dataset.color;
        updateAppearance();
      });
    });

    const updateAppearance = async () => {
      const app = {
        moduleOpacity: parseFloat(opacity.value),
        moduleBlur: parseInt(blur.value),
        moduleRadius: parseInt(radius.value),
        accentColor: accent.value,
        fontFamily: settings.appearance.fontFamily
      };
      document.getElementById('app-opacity-val').textContent = opacity.value;
      document.getElementById('app-blur-val').textContent = blur.value + 'px';
      document.getElementById('app-radius-val').textContent = radius.value + 'px';
      await StorageManager.set('appearance', app);

      const root = document.documentElement;
      root.style.setProperty('--module-opacity', app.moduleOpacity);
      root.style.setProperty('--module-blur', app.moduleBlur + 'px');
      root.style.setProperty('--module-radius', app.moduleRadius + 'px');
      root.style.setProperty('--accent', app.accentColor);
    };

    opacity.addEventListener('input', updateAppearance);
    blur.addEventListener('input', updateAppearance);
    radius.addEventListener('input', updateAppearance);
    accent.addEventListener('input', () => {
      colorPresets.forEach(b => b.classList.remove('active'));
      updateAppearance();
    });

    bootAnim.addEventListener('change', async () => {
      await StorageManager.set('bootAnimation', { enabled: bootAnim.checked });
      document.body.classList.toggle('no-animations', !bootAnim.checked);
    });

    // Wallpaper overlay
    wpOverlay.addEventListener('input', () => {
      const val = parseFloat(wpOverlay.value);
      document.getElementById('wp-overlay-val').textContent = Math.round(val * 100) + '%';
      document.querySelector('#wallpaper-layer').style.setProperty('--wp-overlay', val);
      const after = document.querySelector('#wallpaper-layer');
      // Apply via CSS variable
      document.documentElement.style.setProperty('--wp-overlay-opacity', val);
    });

    // Font picker
    renderFontPicker(settings.appearance.fontFamily);
  }

  function renderFontPicker(currentFont) {
    const container = document.getElementById('font-picker');
    container.innerHTML = FONTS.map(font => `
      <button class="font-picker-item ${font.value === currentFont ? 'active' : ''}"
              data-font-id="${font.id}" data-font-value="${font.value}"
              style="font-family: ${font.value || 'inherit'}">
        ${font.name}
      </button>
    `).join('');

    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('.font-picker-item');
      if (!btn) return;

      container.querySelectorAll('.font-picker-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const fontId = btn.dataset.fontId;
      const customGroup = document.getElementById('custom-font-group');

      if (fontId === 'custom') {
        customGroup.classList.remove('hidden');
        return;
      }

      customGroup.classList.add('hidden');
      const fontValue = btn.dataset.fontValue;
      document.documentElement.style.setProperty('--font-family', fontValue);
      document.body.style.fontFamily = fontValue;

      const app = await StorageManager.get('appearance');
      app.fontFamily = fontValue;
      await StorageManager.set('appearance', app);
    });

    // Custom font input
    const customInput = document.getElementById('custom-font-input');
    if (customInput) {
      customInput.addEventListener('change', async () => {
        const fontValue = customInput.value.trim();
        if (!fontValue) return;
        document.documentElement.style.setProperty('--font-family', fontValue);
        document.body.style.fontFamily = fontValue;
        const app = await StorageManager.get('appearance');
        app.fontFamily = fontValue;
        await StorageManager.set('appearance', app);
      });
    }
  }

  // ---------- MORE TAB ----------
  function setupMoreTab(settings) {
    // Keyboard
    const kbEnabled = document.getElementById('keyboard-enabled');
    kbEnabled.checked = settings.keyboard.enabled;
    kbEnabled.addEventListener('change', async () => {
      const kb = await StorageManager.get('keyboard');
      kb.enabled = kbEnabled.checked;
      await StorageManager.set('keyboard', kb);
      KeyboardManager.setEnabled(kbEnabled.checked);
    });

    // Export
    document.getElementById('config-export').addEventListener('click', async () => {
      const json = await StorageManager.exportConfig();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'brave-anime-tab-config.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Configuration exportée !');
    });

    // Import
    document.getElementById('config-import-btn').addEventListener('click', () => {
      document.getElementById('config-import-file').click();
    });

    document.getElementById('config-import-file').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await StorageManager.importConfig(await file.text());
        showToast('Configuration importée !');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        showToast('Fichier JSON invalide');
      }
    });

    // Reset
    document.getElementById('config-reset').addEventListener('click', async () => {
      if (confirm('Réinitialiser tous les paramètres ?')) {
        await StorageManager.reset();
        showToast('Réinitialisation...');
        setTimeout(() => location.reload(), 800);
      }
    });

    // Dev mode
    const devToggle = document.getElementById('dev-mode-toggle');
    const devContent = document.getElementById('dev-mode-content');
    devToggle.checked = settings.devMode.enabled;
    if (settings.devMode.enabled) devContent.classList.remove('hidden');

    devToggle.addEventListener('change', async () => {
      const devSettings = await StorageManager.get('devMode');
      devSettings.enabled = devToggle.checked;
      await StorageManager.set('devMode', devSettings);
      devContent.classList.toggle('hidden', !devToggle.checked);
      if (devToggle.checked) DevMode.init(devSettings);
    });

    document.getElementById('dev-save-module').addEventListener('click', async () => {
      const name = document.getElementById('dev-module-name').value.trim();
      if (!name) { showToast('Donnez un nom au module'); return; }

      await DevMode.saveModule({
        id: 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now(),
        name,
        html: document.getElementById('dev-module-html').value,
        css: document.getElementById('dev-module-css').value,
        js: document.getElementById('dev-module-js').value
      });

      document.getElementById('dev-module-name').value = '';
      document.getElementById('dev-module-html').value = '';
      document.getElementById('dev-module-css').value = '';
      document.getElementById('dev-module-js').value = '';

      const all = await StorageManager.getAll();
      await GridManager.init(all);
      renderDevModulesList(all.devMode);
      renderModuleToggles(all);
      showToast(`Module "${name}" créé !`);
    });

    renderDevModulesList(settings.devMode);
  }

  // ---------- MODULE TOGGLES ----------
  function renderModuleToggles(settings) {
    const container = document.getElementById('modules-toggles');
    const settingsContainer = document.getElementById('modules-settings');
    const allModules = ModuleRegistry.getAll();

    container.innerHTML = allModules.map(mod => {
      const enabled = settings.modules[mod.id]?.enabled ?? false;
      return `
        <div class="module-toggle-item">
          <span class="module-toggle-name">${mod.name}</span>
          <label class="setting-toggle">
            <input type="checkbox" data-toggle-module="${mod.id}" ${enabled ? 'checked' : ''}>
            <span></span>
          </label>
        </div>
      `;
    }).join('');

    settingsContainer.innerHTML = allModules.map(mod => {
      if (!mod.renderSettings) return '';
      const config = settings.modules[mod.id]?.config || {};
      return `
        <details class="module-settings-details">
          <summary class="module-settings-summary">${mod.name}</summary>
          <div class="module-settings-expand">
            ${mod.renderSettings(config)}
          </div>
        </details>
      `;
    }).join('');

    // Toggle events
    container.querySelectorAll('[data-toggle-module]').forEach(toggle => {
      toggle.addEventListener('change', async () => {
        await GridManager.toggleModule(toggle.dataset.toggleModule, toggle.checked);
      });
    });

    // Module settings change events
    settingsContainer.querySelectorAll('[data-module]').forEach(input => {
      const event = input.tagName === 'SELECT' ? 'change' : (input.type === 'checkbox' ? 'change' : 'input');
      input.addEventListener(event, async () => {
        const moduleId = input.dataset.module;
        const key = input.dataset.key;
        const value = input.type === 'checkbox' ? input.checked : input.value;

        const modules = await StorageManager.get('modules');
        if (modules[moduleId]?.config) {
          modules[moduleId].config[key] = value;
          await StorageManager.set('modules', modules);
          await GridManager.refreshModule(moduleId);
        }
      });
    });

    // Shortcut add button
    const addBtn = settingsContainer.querySelector('#shortcut-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const title = document.getElementById('shortcut-new-title').value.trim();
        const url = document.getElementById('shortcut-new-url').value.trim();
        if (!url) return;

        const modules = await StorageManager.get('modules');
        const items = modules.shortcuts.config.items || [];
        items.push({ title: title || url, url });
        modules.shortcuts.config.items = items;
        await StorageManager.set('modules', modules);
        await GridManager.refreshModule('shortcuts');

        document.getElementById('shortcut-new-title').value = '';
        document.getElementById('shortcut-new-url').value = '';
        const all = await StorageManager.getAll();
        renderModuleToggles(all);
        showToast('Raccourci ajouté !');
      });
    }

    settingsContainer.querySelectorAll('.shortcut-remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = parseInt(btn.dataset.index);
        const modules = await StorageManager.get('modules');
        modules.shortcuts.config.items.splice(index, 1);
        await StorageManager.set('modules', modules);
        await GridManager.refreshModule('shortcuts');
        const all = await StorageManager.getAll();
        renderModuleToggles(all);
        showToast('Raccourci supprimé');
      });
    });

    const clearDone = settingsContainer.querySelector('#todo-clear-done');
    if (clearDone) {
      clearDone.addEventListener('click', async () => {
        const modules = await StorageManager.get('modules');
        modules.todo.config.items = (modules.todo.config.items || []).filter(i => !i.done);
        await StorageManager.set('modules', modules);
        await GridManager.refreshModule('todo');
        showToast('Tâches terminées supprimées');
      });
    }
  }

  // ---------- THEMES ----------
  function renderThemes(activeThemeId) {
    const grid = document.getElementById('theme-grid');
    const presets = ThemeManager.getPresets();

    const customCard = grid.querySelector('[data-theme="custom"]');
    if (activeThemeId === 'custom' || !activeThemeId) customCard.classList.add('active');

    for (const [id, theme] of Object.entries(presets)) {
      const accent = theme.vars['--accent'] || '#6c5ce7';
      const bg = theme.vars['--bg-primary'] || 'rgba(15,15,25,0.85)';
      const text = theme.vars['--text-primary'] || '#f0f0f0';

      const card = document.createElement('div');
      card.className = `theme-card${activeThemeId === id ? ' active' : ''}`;
      card.dataset.theme = id;
      card.innerHTML = `
        <div class="theme-card-preview">
          <div class="theme-preview-swatch" style="background:${bg}"></div>
          <div class="theme-preview-swatch" style="background:${accent}"></div>
          <div class="theme-preview-swatch" style="background:${text}"></div>
        </div>
        <div class="theme-card-name">${theme.name}</div>
      `;
      grid.appendChild(card);
    }

    grid.addEventListener('click', async (e) => {
      const card = e.target.closest('.theme-card');
      if (!card) return;
      grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      await ThemeManager.setTheme(card.dataset.theme);
      showToast(`Thème "${card.querySelector('.theme-card-name').textContent}" appliqué !`);
    });
  }

  // ---------- DEV MODULES LIST ----------
  function renderDevModulesList(devSettings) {
    const container = document.getElementById('dev-modules-list');
    const modules = devSettings.customModules || [];
    if (modules.length === 0) {
      container.innerHTML = '<p class="setting-hint">Aucun module personnalisé.</p>';
      return;
    }
    container.innerHTML = modules.map(mod => `
      <div class="module-toggle-item">
        <span class="module-toggle-name">${mod.name}</span>
        <button class="module-btn-ghost" data-delete-module="${mod.id}">Supprimer</button>
      </div>
    `).join('');

    container.querySelectorAll('[data-delete-module]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await DevMode.deleteModule(btn.dataset.deleteModule);
        const all = await StorageManager.getAll();
        await GridManager.init(all);
        renderDevModulesList(all.devMode);
        renderModuleToggles(all);
        showToast('Module supprimé');
      });
    });
  }

  function open() { _isOpen = true; _panel.classList.add('open'); _backdrop.classList.add('visible'); }
  function close() { _isOpen = false; _panel.classList.remove('open'); _backdrop.classList.remove('visible'); }
  function toggle() { _isOpen ? close() : open(); }
  function isOpen() { return _isOpen; }

  return { init, open, close, toggle, isOpen };
})();
