/* ============================================
   THEMES.JS — Theme system with custom theme support
   ============================================ */

const ThemeManager = (() => {

  function apply(themeId) {
    if (!themeId || themeId === 'custom') {
      return; // Custom mode: user controls CSS variables manually via appearance settings
    }

    // Check built-in presets first
    if (window.ThemePresets && window.ThemePresets[themeId]) {
      const theme = window.ThemePresets[themeId];
      applyVars(theme.vars);
      return;
    }

    // Check user-created themes
    applyUserTheme(themeId);
  }

  function applyVars(vars) {
    const root = document.documentElement;
    for (const [prop, value] of Object.entries(vars)) {
      root.style.setProperty(prop, value);
    }
  }

  async function applyUserTheme(themeId) {
    const themeData = await StorageManager.get('customThemes');
    const themes = themeData || [];
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      applyVars(theme.vars);
    }
  }

  function getPresets() {
    return window.ThemePresets || {};
  }

  async function getCustomThemes() {
    const themes = await StorageManager.get('customThemes');
    return themes || [];
  }

  async function saveCustomTheme(theme) {
    const themes = await getCustomThemes();
    const existing = themes.findIndex(t => t.id === theme.id);
    if (existing >= 0) {
      themes[existing] = theme;
    } else {
      themes.push(theme);
    }
    await StorageManager.set('customThemes', themes);
    return themes;
  }

  async function deleteCustomTheme(themeId) {
    const themes = await getCustomThemes();
    const filtered = themes.filter(t => t.id !== themeId);
    await StorageManager.set('customThemes', filtered);
    return filtered;
  }

  async function setTheme(themeId) {
    await StorageManager.set('theme', { active: themeId });
    apply(themeId);
  }

  return { apply, getPresets, getCustomThemes, saveCustomTheme, deleteCustomTheme, setTheme };
})();
