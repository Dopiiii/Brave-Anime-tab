/* ============================================
   MODULE-REGISTRY.JS — Module registration & lifecycle
   ============================================ */

const ModuleRegistry = (() => {
  const _modules = new Map();

  function register(moduleDef) {
    if (!moduleDef.id || !moduleDef.render) {
      console.warn('Module missing required fields:', moduleDef);
      return;
    }
    _modules.set(moduleDef.id, moduleDef);
  }

  function get(id) {
    return _modules.get(id);
  }

  function getAll() {
    return Array.from(_modules.values());
  }

  function init() {
    // Register all built-in modules (they must be loaded via <script> before this)
    if (window.ClockModule) register(window.ClockModule);
    if (window.GreetingModule) register(window.GreetingModule);
    if (window.SearchModule) register(window.SearchModule);
    if (window.WeatherModule) register(window.WeatherModule);
    if (window.ShortcutsModule) register(window.ShortcutsModule);
    if (window.TodoModule) register(window.TodoModule);
    if (window.QuoteModule) register(window.QuoteModule);
    if (window.NotesModule) register(window.NotesModule);
    if (window.PomodoroModule) register(window.PomodoroModule);
    if (window.CountdownModule) register(window.CountdownModule);
  }

  return { register, get, getAll, init };
})();
