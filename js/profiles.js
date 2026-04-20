/* ============================================
   PROFILES.JS — Multiple configuration profiles
   ============================================ */

const ProfileManager = (() => {
  const STORAGE_KEY = 'profiles';

  async function getAll() {
    const data = await new Promise(resolve =>
      chrome.storage.local.get(STORAGE_KEY, d => resolve(d[STORAGE_KEY] || []))
    );
    return data;
  }

  async function getActive() {
    const data = await new Promise(resolve =>
      chrome.storage.local.get('activeProfile', d => resolve(d.activeProfile || null))
    );
    return data;
  }

  async function save(name) {
    const current = await StorageManager.getAll();
    const profiles = await getAll();

    const profile = {
      id: 'profile_' + Date.now(),
      name,
      savedAt: new Date().toISOString(),
      data: { ...current }
    };

    if (profile.data.wallpaper) delete profile.data.wallpaper.localKey;

    const existing = profiles.findIndex(p => p.name === name);
    if (existing >= 0) {
      profiles[existing] = profile;
    } else {
      profiles.push(profile);
    }

    await new Promise(resolve => chrome.storage.local.set({ [STORAGE_KEY]: profiles }, resolve));
    return profile;
  }

  async function load(profileId) {
    const profiles = await getAll();
    const profile  = profiles.find(p => p.id === profileId);
    if (!profile) return false;

    await new Promise(resolve =>
      chrome.storage.local.set({ ...profile.data, activeProfile: profileId }, resolve)
    );
    return true;
  }

  async function remove(profileId) {
    const profiles = await getAll();
    const filtered = profiles.filter(p => p.id !== profileId);
    await new Promise(resolve => chrome.storage.local.set({ [STORAGE_KEY]: filtered }, resolve));
  }

  async function duplicate(profileId) {
    const profiles = await getAll();
    const src = profiles.find(p => p.id === profileId);
    if (!src) return;
    const copy = { ...src, id: 'profile_' + Date.now(), name: src.name + ' (copie)', savedAt: new Date().toISOString() };
    profiles.push(copy);
    await new Promise(resolve => chrome.storage.local.set({ [STORAGE_KEY]: profiles }, resolve));
    return copy;
  }

  return { getAll, getActive, save, load, remove, duplicate };
})();
