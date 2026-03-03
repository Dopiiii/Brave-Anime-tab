/* ============================================
   KEYBOARD.JS — Keyboard shortcuts
   ============================================ */

const KeyboardManager = (() => {
  let _enabled = false;
  let _shortcuts = {};

  function init(settings) {
    _enabled = settings.enabled;
    _shortcuts = settings.shortcuts || {};

    if (_enabled) {
      document.addEventListener('keydown', handleKeydown);
    }
  }

  function handleKeydown(e) {
    if (!_enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      // Only Escape works in inputs
      if (e.key !== 'Escape') return;
    }

    switch (e.key) {
      case _shortcuts.toggleSettings:
        e.preventDefault();
        SettingsPanel.toggle();
        break;

      case _shortcuts.focusSearch:
        // Only trigger if not already in an input
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          const searchInput = document.querySelector('.search-input');
          if (searchInput) searchInput.focus();
        }
        break;

      case _shortcuts.toggleEditMode:
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          const isEdit = GridManager.toggleEditMode();
          showToast(isEdit ? 'Mode édition activé' : 'Mode édition désactivé');
        }
        break;
    }
  }

  function setEnabled(enabled) {
    _enabled = enabled;
    if (!enabled) {
      document.removeEventListener('keydown', handleKeydown);
    } else {
      document.removeEventListener('keydown', handleKeydown);
      document.addEventListener('keydown', handleKeydown);
    }
  }

  return { init, setEnabled };
})();

/* Toast notification helper */
function showToast(message, duration = 2000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      padding: 10px 20px;
      background: rgba(15, 15, 25, 0.9);
      backdrop-filter: blur(10px);
      color: #f0f0f0;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.85rem;
      z-index: 10000;
      opacity: 0;
      transition: opacity 200ms, transform 200ms;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, duration);
}
