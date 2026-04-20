/* ============================================
   STORAGE.JS — Chrome storage wrapper + defaults
   ============================================ */

const StorageManager = (() => {
  const DEFAULTS = {
    wallpaper: {
      type: 'none',
      source: 'local',
      url: '',
      localKey: '',
      fileName: ''
    },
    grid: {
      columns: 4,
      rows: 3,
      layoutMode: 'auto',
      modulePositions: {},
      savedPositions: {}
    },
    modules: {
      clock:     { enabled: true,  config: { format: '24h', showSeconds: false, showDate: true } },
      greeting:  { enabled: true,  config: { name: '', language: 'fr' } },
      search:    { enabled: true,  config: { engine: 'google', placeholder: 'Rechercher...', commands: [] } },
      weather:   { enabled: true,  config: { mode: 'minimal', unit: 'C', city: '', lat: null, lon: null, showUV: false, showAQI: false } },
      shortcuts: { enabled: true,  config: { showSimple: true, showFolders: false, showTopSites: true, items: [], folders: [] } },
      todo:      { enabled: true,  config: { items: [] } },
      quote:     { enabled: true,  config: { category: 'inspirational', language: 'fr' } },
      notes:     { enabled: false, config: { content: '' } },
      pomodoro:  { enabled: false, config: { workDuration: 25, breakDuration: 5 } },
      countdown: { enabled: false, config: { label: '', targetDate: '' } },
      calendar:  { enabled: false, config: { showEvents: true, events: [] } },
      habits:    { enabled: false, config: { habits: [], completions: {} } },
      stopwatch: { enabled: false, config: {} },
      crypto:    { enabled: false, config: { coins: ['bitcoin','ethereum','solana'], currency: 'eur' } },
      rss:       { enabled: false, config: { feedUrl: '', feedName: 'RSS', itemCount: 5 } },
      focus:     { enabled: false, config: { defaultDuration: 25, dimModules: true } },
      lastfm:    { enabled: false, config: { username: '', apiKey: '' } },
      perf:      { enabled: false, config: {} }
    },
    appearance: {
      moduleOpacity: 0.08,
      moduleBlur: 12,
      accentColor: '#6c5ce7',
      fontFamily: 'Segoe UI',
      moduleRadius: 16,
      autoDarkMode: false
    },
    theme: {
      active: 'custom'
    },
    bootAnimation: {
      enabled: true
    },
    keyboard: {
      enabled: true,
      shortcuts: {
        toggleSettings: 'Escape',
        focusSearch: '/',
        toggleEditMode: 'e'
      }
    },
    particles: {
      preset: 'none',
      density: 1
    },
    cursor: {
      style: 'none',
      color: '#6c5ce7'
    },
    notifications: {
      enabled: false
    },
    customThemes: [],
    devMode: {
      enabled: false,
      customModules: []
    }
  };

  function deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  async function getAll() {
    return new Promise(resolve => {
      chrome.storage.local.get(null, data => resolve(deepMerge(DEFAULTS, data)));
    });
  }

  async function get(key) {
    const all = await getAll();
    return all[key];
  }

  async function set(key, value) {
    return new Promise(resolve => chrome.storage.local.set({ [key]: value }, resolve));
  }

  async function setNested(path, value) {
    const keys   = path.split('.');
    const topKey = keys[0];
    const current = await get(topKey);
    if (keys.length === 1) { await set(topKey, value); return; }
    let obj = current;
    for (let i = 1; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    await set(topKey, current);
  }

  function onChange(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') callback(changes);
    });
  }

  async function reset() {
    return new Promise(resolve => {
      chrome.storage.local.clear(() => chrome.storage.local.set(DEFAULTS, resolve));
    });
  }

  async function exportConfig() {
    const all = await getAll();
    const exported = { ...all };
    if (exported.wallpaper) delete exported.wallpaper.localKey;
    return JSON.stringify(exported, null, 2);
  }

  async function importConfig(jsonString) {
    const config = JSON.parse(jsonString);
    const merged = deepMerge(DEFAULTS, config);
    return new Promise(resolve => chrome.storage.local.set(merged, resolve));
  }

  return { DEFAULTS, getAll, get, set, setNested, onChange, reset, exportConfig, importConfig };
})();

/* ============================================
   IndexedDB helper for large files
   ============================================ */
const MediaDB = (() => {
  const DB_NAME   = 'BraveAnimeTabMedia';
  const STORE     = 'files';
  const DB_VER    = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function saveFile(key, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = resolve;
      tx.onerror = e => reject(e.target.error);
    });
  }

  async function getFile(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function deleteFile(key) {
    if (!key) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = e => reject(e.target.error);
    });
  }

  return { saveFile, getFile, deleteFile };
})();
