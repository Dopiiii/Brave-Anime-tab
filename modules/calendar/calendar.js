/* ============================================
   CALENDAR MODULE — Monthly view with events
   ============================================ */

window.CalendarModule = {
  id: 'calendar',
  name: 'Calendrier',
  defaultPosition: { col: 1, row: 1, colSpan: 2, rowSpan: 1 },

  _currentDate: new Date(),

  render(config) {
    return `
      <div class="calendar-module">
        <div class="calendar-header">
          <button class="calendar-nav cal-prev" title="Mois précédent">‹</button>
          <span class="calendar-month-label"></span>
          <button class="calendar-nav cal-next" title="Mois suivant">›</button>
        </div>
        <div class="calendar-grid"></div>
        ${config.showEvents ? '<div class="calendar-events"></div>' : ''}
      </div>
    `;
  },

  mount(el, config) {
    this._currentDate = new Date();
    this._renderCalendar(el, config, this._currentDate);

    el.querySelector('.cal-prev').addEventListener('click', () => {
      this._currentDate.setMonth(this._currentDate.getMonth() - 1);
      this._renderCalendar(el, config, this._currentDate);
    });

    el.querySelector('.cal-next').addEventListener('click', () => {
      this._currentDate.setMonth(this._currentDate.getMonth() + 1);
      this._renderCalendar(el, config, this._currentDate);
    });
  },

  _renderCalendar(el, config, date) {
    const today = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    el.querySelector('.calendar-month-label').textContent =
      monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const firstDay = new Date(year, month, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const dayNames = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
    const events = config.events || [];

    let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');

    for (let i = 0; i < startDay; i++) {
      html += `<div class="cal-day cal-day-other">${daysInPrev - startDay + i + 1}</div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvent = events.some(e => e.date === dateStr);
      html += `<div class="cal-day ${isToday ? 'cal-today' : ''} ${hasEvent ? 'cal-has-event' : ''}" data-date="${dateStr}">${d}${hasEvent ? '<span class="cal-event-dot"></span>' : ''}</div>`;
    }

    const remaining = 42 - startDay - daysInMonth;
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="cal-day cal-day-other">${d}</div>`;
    }

    const grid = el.querySelector('.calendar-grid');
    grid.innerHTML = html;

    if (config.showEvents) {
      const eventsEl = el.querySelector('.calendar-events');
      const upcomingEvents = events
        .filter(e => new Date(e.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

      if (eventsEl) {
        eventsEl.innerHTML = upcomingEvents.length === 0
          ? '<span class="cal-no-events">Aucun événement à venir</span>'
          : upcomingEvents.map(e => {
            const d = new Date(e.date);
            const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            return `<div class="cal-event-item"><span class="cal-event-date">${label}</span><span class="cal-event-title">${e.title}</span></div>`;
          }).join('');
      }
    }

    grid.querySelectorAll('.cal-day:not(.cal-day-other)').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        grid.querySelectorAll('.cal-day').forEach(d => d.classList.remove('cal-selected'));
        dayEl.classList.add('cal-selected');
      });
    });
  },

  unmount() {},

  renderSettings(config) {
    const events = config.events || [];
    return `
      <div class="setting-group">
        <label class="setting-toggle">
          <input type="checkbox" data-module="calendar" data-key="showEvents" ${config.showEvents ? 'checked' : ''}>
          <span>Afficher les événements</span>
        </label>
      </div>
      <div class="setting-group">
        <label class="setting-label">Événements (${events.length})</label>
        ${events.map((e, i) => `
          <div class="search-cmd-item" style="margin-bottom:4px">
            <span>${e.date} — ${e.title}</span>
            <button class="module-btn-ghost cal-event-remove" data-index="${i}" style="font-size:0.72rem">✕</button>
          </div>
        `).join('')}
      </div>
      <div class="setting-group">
        <label class="setting-label">Ajouter un événement</label>
        <input type="text" class="setting-input" id="cal-event-title" placeholder="Titre" style="margin-bottom:4px">
        <input type="date" class="setting-input" id="cal-event-date" style="margin-bottom:4px">
        <button class="module-btn" id="cal-event-add" style="width:100%">Ajouter</button>
      </div>
    `;
  },

  onConfigChange(el, newConfig) {
    el.innerHTML = this.render(newConfig);
    this.mount(el, newConfig);
  }
};
