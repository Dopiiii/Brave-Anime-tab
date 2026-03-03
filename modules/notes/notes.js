/* ============================================
   NOTES MODULE — Quick notes/scratchpad
   ============================================ */

window.NotesModule = {
  id: 'notes',
  name: 'Notes',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  render(config) {
    return `
      <div class="notes-module">
        <div class="module-header"><span>Notes</span></div>
        <textarea class="notes-textarea" placeholder="Écrivez ici...">${this._escapeHtml(config.content || '')}</textarea>
      </div>
    `;
  },

  mount(el, config) {
    const textarea = el.querySelector('.notes-textarea');
    let saveTimeout;

    textarea.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        const modules = await StorageManager.get('modules');
        if (modules.notes) {
          modules.notes.config.content = textarea.value;
          await StorageManager.set('modules', modules);
        }
      }, 500); // Debounced save
    });
  },

  unmount() {},

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderSettings(config) {
    return `
      <div class="setting-group">
        <p class="setting-hint">${(config.content || '').length} caractères</p>
        <button class="module-btn-ghost" id="notes-clear">Effacer les notes</button>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
