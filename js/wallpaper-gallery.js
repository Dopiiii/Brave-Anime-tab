/* ============================================
   WALLPAPER-GALLERY.JS — Built-in curated wallpapers
   ============================================ */

const WallpaperGallery = (() => {
  const GALLERY = [
    {
      id: 'wg1', name: 'Cherry Blossom',
      thumb: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=85',
      type: 'image', tags: ['nature','sakura']
    },
    {
      id: 'wg2', name: 'Night City',
      thumb: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=85',
      type: 'image', tags: ['city','night']
    },
    {
      id: 'wg3', name: 'Aurora Borealis',
      thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=85',
      type: 'image', tags: ['night','aurora']
    },
    {
      id: 'wg4', name: 'Mount Fuji',
      thumb: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1920&q=85',
      type: 'image', tags: ['japan','nature']
    },
    {
      id: 'wg5', name: 'Galaxy',
      thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=85',
      type: 'image', tags: ['space','night']
    },
    {
      id: 'wg6', name: 'Forest Path',
      thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=85',
      type: 'image', tags: ['nature','forest']
    },
    {
      id: 'wg7', name: 'Tokyo Rain',
      thumb: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1920&q=85',
      type: 'image', tags: ['japan','city','rain']
    },
    {
      id: 'wg8', name: 'Neon Lights',
      thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85',
      type: 'image', tags: ['neon','night','city']
    },
    {
      id: 'wg9', name: 'Ocean Sunset',
      thumb: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=85',
      type: 'image', tags: ['ocean','sunset']
    },
    {
      id: 'wg10', name: 'Lavender Field',
      thumb: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=1920&q=85',
      type: 'image', tags: ['nature','purple']
    },
    {
      id: 'wg11', name: 'Desert Dunes',
      thumb: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=85',
      type: 'image', tags: ['desert','minimal']
    },
    {
      id: 'wg12', name: 'Snow Mountain',
      thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=60',
      url:   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85',
      type: 'image', tags: ['nature','snow']
    }
  ];

  function getAll() { return GALLERY; }

  function getByTag(tag) {
    if (!tag) return GALLERY;
    return GALLERY.filter(w => w.tags.includes(tag));
  }

  function getAllTags() {
    const tags = new Set();
    GALLERY.forEach(w => w.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }

  async function apply(wallpaper) {
    await WallpaperManager.setFromUrl(wallpaper.url);
    showToast(`Fond "${wallpaper.name}" appliqué !`);
  }

  function renderGallery(container, activeId, onApply) {
    const allTags = getAllTags();
    container.innerHTML = `
      <div class="gallery-tags">
        <button class="gallery-tag active" data-tag="">Tous</button>
        ${allTags.map(t => `<button class="gallery-tag" data-tag="${t}">${t}</button>`).join('')}
      </div>
      <div class="gallery-grid">
        ${GALLERY.map(w => `
          <div class="gallery-item ${w.id === activeId ? 'gallery-item-active' : ''}" data-id="${w.id}">
            <img src="${w.thumb}" alt="${w.name}" loading="lazy" class="gallery-thumb">
            <div class="gallery-item-overlay">
              <span class="gallery-item-name">${w.name}</span>
              <button class="gallery-apply-btn module-btn" data-id="${w.id}">Appliquer</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.gallery-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.gallery-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filtered = getByTag(btn.dataset.tag);
        const grid = container.querySelector('.gallery-grid');
        grid.innerHTML = filtered.map(w => `
          <div class="gallery-item ${w.id === activeId ? 'gallery-item-active' : ''}" data-id="${w.id}">
            <img src="${w.thumb}" alt="${w.name}" loading="lazy" class="gallery-thumb">
            <div class="gallery-item-overlay">
              <span class="gallery-item-name">${w.name}</span>
              <button class="gallery-apply-btn module-btn" data-id="${w.id}">Appliquer</button>
            </div>
          </div>
        `).join('');
        grid.querySelectorAll('.gallery-apply-btn').forEach(b => {
          b.addEventListener('click', () => {
            const w = GALLERY.find(x => x.id === b.dataset.id);
            if (w) onApply(w);
          });
        });
      });
    });

    container.querySelectorAll('.gallery-apply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = GALLERY.find(x => x.id === btn.dataset.id);
        if (w) onApply(w);
      });
    });
  }

  return { getAll, getByTag, getAllTags, apply, renderGallery };
})();
