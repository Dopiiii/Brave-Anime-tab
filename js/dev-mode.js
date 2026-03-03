/* ============================================
   DEV-MODE.JS — Developer mode: custom modules
   Uses sandboxed iframe for JS execution (MV3 compliant)
   ============================================ */

const DevMode = (() => {
  function init(devSettings) {
    if (!devSettings.enabled) return;

    const customModules = devSettings.customModules || [];
    for (const custom of customModules) {
      const wrapped = wrapCustomModule(custom);
      ModuleRegistry.register(wrapped);
    }
  }

  function wrapCustomModule({ id, name, html, css, js }) {
    return {
      id: id,
      name: name || 'Custom Module',
      defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      _html: html || '',
      _css: css || '',
      _js: js || '',

      render() {
        // If there's JS, we render via a sandboxed iframe
        if (this._js) {
          return `<iframe class="custom-module-iframe" data-module-id="${id}"
                    sandbox="allow-scripts" src="sandbox.html"
                    style="width:100%;height:100%;border:none;background:transparent;"></iframe>`;
        }
        // No JS: render HTML/CSS directly (safe)
        return `<style>${this._css}</style><div class="custom-module custom-module-${id}">${this._html}</div>`;
      },

      mount(el) {
        if (this._js) {
          const iframe = el.querySelector('.custom-module-iframe');
          if (iframe) {
            iframe.addEventListener('load', () => {
              iframe.contentWindow.postMessage({
                type: 'render-module',
                html: this._html,
                css: this._css,
                js: this._js
              }, '*');
            });
          }
        }
      },

      unmount() {},

      renderSettings() {
        return `<p class="setting-hint">Module personnalisé — modifiable dans l'onglet Développeur.</p>`;
      },

      onConfigChange(el) {
        el.innerHTML = this.render();
        this.mount(el);
      }
    };
  }

  // Save a new or updated custom module
  async function saveModule(moduleData) {
    const devSettings = await StorageManager.get('devMode');
    const modules = devSettings.customModules || [];

    const existing = modules.findIndex(m => m.id === moduleData.id);
    if (existing >= 0) {
      modules[existing] = moduleData;
    } else {
      modules.push(moduleData);
    }

    devSettings.customModules = modules;
    await StorageManager.set('devMode', devSettings);

    // Register and enable
    ModuleRegistry.register(wrapCustomModule(moduleData));

    const moduleSettings = await StorageManager.get('modules');
    moduleSettings[moduleData.id] = { enabled: true, config: {} };
    await StorageManager.set('modules', moduleSettings);

    return moduleData;
  }

  // Delete a custom module
  async function deleteModule(moduleId) {
    const devSettings = await StorageManager.get('devMode');
    devSettings.customModules = (devSettings.customModules || []).filter(m => m.id !== moduleId);
    await StorageManager.set('devMode', devSettings);

    const moduleSettings = await StorageManager.get('modules');
    delete moduleSettings[moduleId];
    await StorageManager.set('modules', moduleSettings);
  }

  return { init, saveModule, deleteModule, wrapCustomModule };
})();
