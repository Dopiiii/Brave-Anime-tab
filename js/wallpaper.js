/* ============================================
   WALLPAPER.JS — Wallpaper manager
   Video/Image, Upload/URL, IndexedDB storage
   ============================================ */

const WallpaperManager = (() => {
  let videoEl;
  let imageEl;

  async function init(wp) {
    videoEl = document.getElementById('wallpaper-video');
    imageEl = document.getElementById('wallpaper-image');
    await apply(wp || await StorageManager.get('wallpaper'));
  }

  async function apply(wp) {
    // Reset both
    videoEl.style.display = 'none';
    imageEl.style.display = 'none';
    videoEl.src = '';
    imageEl.style.backgroundImage = '';

    if (wp.type === 'none') return;

    if (wp.type === 'video') {
      videoEl.style.display = 'block';
      if (wp.source === 'url') {
        videoEl.src = wp.url;
      } else if (wp.localKey) {
        const blob = await MediaDB.getFile(wp.localKey);
        if (blob) {
          videoEl.src = URL.createObjectURL(blob);
        }
      }
      try { await videoEl.play(); } catch (e) { /* autoplay blocked */ }
    } else if (wp.type === 'image') {
      imageEl.style.display = 'block';
      if (wp.source === 'url') {
        imageEl.style.backgroundImage = `url(${wp.url})`;
      } else if (wp.localKey) {
        const blob = await MediaDB.getFile(wp.localKey);
        if (blob) {
          imageEl.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
        }
      }
    }
  }

  // Upload a file (image or video) from user input
  async function uploadFile(file) {
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';
    const key = 'wallpaper_' + Date.now();

    // Store in IndexedDB
    await MediaDB.saveFile(key, file);

    // Clean up old file
    const current = await StorageManager.get('wallpaper');
    if (current.localKey) {
      await MediaDB.deleteFile(current.localKey);
    }

    const wp = {
      type,
      source: 'local',
      url: '',
      localKey: key,
      fileName: file.name
    };

    await StorageManager.set('wallpaper', wp);
    await apply(wp);
    return wp;
  }

  // Set wallpaper from URL
  async function setFromUrl(url) {
    // Guess type from URL extension
    const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
    const type = isVideo ? 'video' : 'image';

    // Clean up old local file
    const current = await StorageManager.get('wallpaper');
    if (current.localKey) {
      await MediaDB.deleteFile(current.localKey);
    }

    const wp = {
      type,
      source: 'url',
      url,
      localKey: '',
      fileName: ''
    };

    await StorageManager.set('wallpaper', wp);
    await apply(wp);
    return wp;
  }

  // Remove wallpaper
  async function clear() {
    const current = await StorageManager.get('wallpaper');
    if (current.localKey) {
      await MediaDB.deleteFile(current.localKey);
    }

    const wp = { type: 'none', source: 'local', url: '', localKey: '', fileName: '' };
    await StorageManager.set('wallpaper', wp);
    await apply(wp);
  }

  return { init, apply, uploadFile, setFromUrl, clear };
})();
