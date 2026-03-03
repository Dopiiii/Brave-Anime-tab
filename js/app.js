/* ============================================
   APP.JS — Bootstrap + boot animation
   ============================================ */

const App = (() => {
  async function init() {
    const settings = await StorageManager.getAll();

    // Disable animations if user toggled them off
    if (!settings.bootAnimation.enabled) {
      document.body.classList.add('no-animations');
    }

    // Apply appearance CSS variables
    applyAppearance(settings.appearance);

    // Apply grid CSS variables
    applyGrid(settings.grid);

    // Init subsystems in order
    await WallpaperManager.init(settings.wallpaper);
    ModuleRegistry.init();
    await GridManager.init(settings);
    SettingsPanel.init(settings);
    KeyboardManager.init(settings.keyboard);

    if (settings.devMode.enabled) {
      DevMode.init(settings.devMode);
    }

    // Trigger boot animation
    requestAnimationFrame(() => {
      document.getElementById('wallpaper-layer').classList.add('loaded');

      setTimeout(() => {
        document.getElementById('module-grid').classList.add('loaded');

        // Stagger module animations
        const cells = document.querySelectorAll('.module-cell');
        cells.forEach((cell, i) => {
          setTimeout(() => {
            cell.classList.add('animate-in');
          }, i * 80);
        });
      }, 200);
    });

    // Listen for settings changes
    StorageManager.onChange((changes) => {
      if (changes.appearance) {
        applyAppearance(changes.appearance.newValue);
      }
      if (changes.grid) {
        applyGrid(changes.grid.newValue);
      }
    });
  }

  function applyAppearance(appearance) {
    const root = document.documentElement;
    root.style.setProperty('--module-opacity', appearance.moduleOpacity);
    root.style.setProperty('--module-blur', appearance.moduleBlur + 'px');
    root.style.setProperty('--accent', appearance.accentColor);
    root.style.setProperty('--module-radius', appearance.moduleRadius + 'px');
    if (appearance.fontFamily) {
      root.style.setProperty('--font-family', appearance.fontFamily);
      document.body.style.fontFamily = appearance.fontFamily;
    }
  }

  function applyGrid(grid) {
    const root = document.documentElement;
    root.style.setProperty('--grid-cols', grid.columns);
    root.style.setProperty('--grid-rows', grid.rows);
  }

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
