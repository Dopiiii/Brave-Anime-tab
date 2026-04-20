/* ============================================
   HABITS MODULE — Daily habit tracker with streaks
   ============================================ */

window.HabitsModule = {
  id: 'habits',
  name: 'Habitudes',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  _escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  render(config) {
    const habits = config.habits || [];
    const today = this._todayKey();
    const completions = config.completions || {};

    return `
      <div class="habits-module">
        <div class="module-header">
          <span>Habitudes</span>
          <span class="habits-progress-label">${habits.filter(h => (completions[today] || []).includes(h.id)).length}/${habits.length}</span>
        </div>
        <div class="habits-list">
          ${habits.length === 0
            ? '<span class="habits-empty">Ajoutez des habitudes dans les paramètres.</span>'
            : habits.map(h => {
                const done = (completions[today] || []).includes(h.id);
                const streak = this._getStreak(h.id, completions);
                return `
                  <div class="habit-item ${done ? 'habit-done' : ''}" data-habit-id="${h.id}">
                    <button class="habit-check ${done ? 'checked' : ''}" data-habit-id="${h.id}">
                      ${done ? '✓' : ''}
                    </button>
                    <div class="habit-info">
                      <span class="habit-name">${this._escapeHtml(h.name)}</span>
                      ${h.emoji ? `<span class="habit-emoji">${h.emoji}</span>` : ''}
                    </div>
                    ${streak > 0 ? `<span class="habit-streak">🔥${streak}</span>` : ''}
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>
    `;
  },

  _getStreak(habitId, completions) {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      d.setDate(d.getDate() - (i === 0 ? 0 : 1));
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if ((completions[key] || []).includes(habitId)) {
        streak++;
      } else if (i === 0) {
        break;
      } else {
        break;
      }
    }
    return streak;
  },

  async mount(el, config) {
    el.querySelector('.habits-list')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('.habit-check');
      if (!btn) return;
      const habitId = btn.dataset.habitId;
      const today = this._todayKey();

      const modules = await StorageManager.get('modules');
      const cfg = modules.habits.config;
      if (!cfg.completions) cfg.completions = {};
      if (!cfg.completions[today]) cfg.completions[today] = [];

      const idx = cfg.completions[today].indexOf(habitId);
      if (idx >= 0) {
        cfg.completions[today].splice(idx, 1);
      } else {
        cfg.completions[today].push(habitId);
      }

      await StorageManager.set('modules', modules);
      this.onConfigChange(el, cfg);
    });
  },

  unmount() {},

  renderSettings(config) {
    const habits = config.habits || [];
    return `
      <div class="setting-group">
        <label class="setting-label">Mes habitudes (${habits.length})</label>
        ${habits.map((h, i) => `
          <div class="module-toggle-item">
            <span>${h.emoji || ''} ${h.name}</span>
            <button class="module-btn-ghost habit-remove-btn" data-index="${i}" style="font-size:0.72rem;padding:3px 8px">✕</button>
          </div>
        `).join('')}
      </div>
      <div class="setting-group">
        <label class="setting-label">Ajouter une habitude</label>
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
          <input type="text" class="setting-input" id="habit-emoji" placeholder="🏃" style="width:56px;text-align:center">
          <input type="text" class="setting-input" id="habit-name" placeholder="Nom de l'habitude" style="flex:1">
          <button class="module-btn" id="habit-add-btn">+</button>
        </div>
      </div>
      <div class="setting-group">
        <button class="module-btn-ghost" id="habits-reset-today">Réinitialiser aujourd'hui</button>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
