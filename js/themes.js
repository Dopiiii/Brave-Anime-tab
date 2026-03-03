/* ============================================
   THEMES.JS — Theme system
   ============================================ */

const ThemeManager = (() => {
  function apply(themeId) {
    if (themeId === 'custom' || !window.ThemePresets || !window.ThemePresets[themeId]) {
      return; // Custom mode: user controls CSS variables manually via appearance settings
    }

    const theme = window.ThemePresets[themeId];
    const root = document.documentElement;

    for (const [prop, value] of Object.entries(theme.vars)) {
      root.style.setProperty(prop, value);
    }
  }

  function getPresets() {
    return window.ThemePresets || {};
  }

  async function setTheme(themeId) {
    await StorageManager.set('theme', { active: themeId });
    apply(themeId);
  }

  return { apply, getPresets, setTheme };
})();
