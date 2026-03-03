/* ============================================
   STORAGE.JS — Chrome storage wrapper + defaults
   ============================================ */

const StorageManager = (() => {
  const DEFAULTS = {
    wallpaper: {
      type: 'none',        // 'video' | 'image' | 'none'
      source: 'local',     // 'local' | 'url'
      url: '',
      localKey: '',        // IndexedDB key for large files
      fileName: ''
    },
    grid: {
      columns: 4,
      rows: 3,
      layoutMode: 'auto',
      modulePositions: {}  // { moduleId: { col, row, colSpan, rowSpan } }
    },
    modules: {
      clock:     { enabled: true, config: { format: '24h', showSeconds: false, showDate: true } },
      greeting:  { enabled: true, config: { name: '', language: 'fr' } },
      search:    { enabled: true, config: { engine: 'google', placeholder: 'Rechercher...' } },
      weather:   { enabled: true, config: { mode: 'minimal', unit: 'C', city: '', lat: null, lon: null } },
      shortcuts: { enabled: true, config: { showSimple: true, showFolders: false, showTopSites: true, items: [], folders: [] } },
      todo:      { enabled: true, config: { items: [] } },
      quote:     { enabled: true, config: { category: 'inspirational', language: 'fr' } },
      notes:     { enabled: false, config: { content: '' } },
      pomodoro:  { enabled: false, config: { workDuration: 25, breakDuration: 5 } },
      countdown: { enabled: false, config: { label: '', targetDate: '' } }
    },
    appearance: {
      moduleOpacity: 0.08,
      moduleBlur: 12,
      accentColor: '#6c5ce7',
      fontFamily: 'Segoe UI',
      moduleRadius: 16
    },
    theme: {
      active: 'custom',   // 'custom' | theme preset id
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
    devMode: {
      enabled: false,
      customModules: []    // [{ id, name, html, css, js }]
    }
  };

  // Deep merge helper
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

  // Get all settings, merged with defaults
  async function getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        resolve(deepMerge(DEFAULTS, data));
      });
    });
  }

  // Get a top-level key
  async function get(key) {
    const all = await getAll();
    return all[key];
  }

  // Set a top-level key
  async function set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  // Update nested value with dot notation: set('modules.clock.config.format', '12h')
  async function setNested(path, value) {
    const keys = path.split('.');
    const topKey = keys[0];
    const current = await get(topKey);

    if (keys.length === 1) {
      await set(topKey, value);
      return;
    }

    let obj = current;
    for (let i = 1; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    await set(topKey, current);
  }

  // Listen for storage changes
  function onChange(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        callback(changes);
      }
    });
  }

  // Reset all settings to defaults
  async function reset() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        chrome.storage.local.set(DEFAULTS, resolve);
      });
    });
  }

  // Export all settings as JSON
  async function exportConfig() {
    const all = await getAll();
    // Don't export localKey (binary data references)
    const exported = { ...all };
    if (exported.wallpaper) {
      delete exported.wallpaper.localKey;
    }
    return JSON.stringify(exported, null, 2);
  }

  // Import settings from JSON
  async function importConfig(jsonString) {
    const config = JSON.parse(jsonString);
    const merged = deepMerge(DEFAULTS, config);
    return new Promise((resolve) => {
      chrome.storage.local.set(merged, resolve);
    });
  }

  return {
    DEFAULTS,
    getAll,
    get,
    set,
    setNested,
    onChange,
    reset,
    exportConfig,
    importConfig
  };
})();

/* ============================================
   IndexedDB helper for large files (videos)
   ============================================ */
const MediaDB = (() => {
  const DB_NAME = 'BraveAnimeTabMedia';
  const STORE_NAME = 'files';
  const DB_VERSION = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function saveFile(key, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async function getFile(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function deleteFile(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  return { saveFile, getFile, deleteFile };
})();
