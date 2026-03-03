/* ============================================
   TODO MODULE
   ============================================ */

window.TodoModule = {
  id: 'todo',
  name: 'To-Do',
  defaultPosition: { col: 3, row: 3, colSpan: 1, rowSpan: 1 },

  render(config) {
    const items = config.items || [];
    const pending = items.filter(i => !i.done).length;
    const total = items.length;

    return `
      <div class="todo-module">
        <div class="module-header">
          <span>To-Do</span>
          <span class="todo-count">${pending}/${total}</span>
        </div>
        <div class="todo-list">
          ${items.map((item, i) => `
            <div class="todo-item ${item.done ? 'todo-done' : ''}" data-index="${i}">
              <button class="todo-check" data-index="${i}">${item.done ? '✓' : ''}</button>
              <span class="todo-text">${this._escapeHtml(item.text)}</span>
              <button class="todo-delete" data-index="${i}">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="todo-add">
          <input type="text" class="todo-input module-input" placeholder="Nouvelle tâche..." maxlength="200">
        </div>
      </div>
    `;
  },

  mount(el, config) {
    const input = el.querySelector('.todo-input');
    const list = el.querySelector('.todo-list');

    // Add new todo on Enter
    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const modules = await StorageManager.get('modules');
        const items = modules.todo.config.items || [];
        items.push({ text: input.value.trim(), done: false });
        modules.todo.config.items = items;
        await StorageManager.set('modules', modules);
        input.value = '';
        this.onConfigChange(el, modules.todo.config);
      }
    });

    // Check/uncheck and delete
    list.addEventListener('click', async (e) => {
      const checkBtn = e.target.closest('.todo-check');
      const deleteBtn = e.target.closest('.todo-delete');

      if (!checkBtn && !deleteBtn) return;

      const index = parseInt((checkBtn || deleteBtn).dataset.index);
      const modules = await StorageManager.get('modules');
      const items = modules.todo.config.items || [];

      if (checkBtn) {
        items[index].done = !items[index].done;
      } else if (deleteBtn) {
        items.splice(index, 1);
      }

      modules.todo.config.items = items;
      await StorageManager.set('modules', modules);
      this.onConfigChange(el, modules.todo.config);
    });
  },

  unmount() {},

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  renderSettings(config) {
    const items = config.items || [];
    return `
      <div class="setting-group">
        <label class="setting-label">${items.length} tâche(s), ${items.filter(i => i.done).length} terminée(s)</label>
        <button class="module-btn-ghost" id="todo-clear-done">Supprimer les tâches terminées</button>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
