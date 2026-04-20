/* ============================================
   PERFORMANCE MODULE — Page load metrics
   ============================================ */

window.PerfModule = {
  id: 'perf',
  name: 'Performance',
  defaultPosition: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },

  render() {
    return `
      <div class="perf-module">
        <div class="module-header"><span>⚡ Performance</span></div>
        <div class="perf-content">
          <div class="perf-metric">
            <span class="perf-label">Chargement page</span>
            <span class="perf-value" id="perf-load">--</span>
          </div>
          <div class="perf-metric">
            <span class="perf-label">DOM prêt</span>
            <span class="perf-value" id="perf-dom">--</span>
          </div>
          <div class="perf-metric">
            <span class="perf-label">Ressources</span>
            <span class="perf-value" id="perf-resources">--</span>
          </div>
          <div class="perf-metric">
            <span class="perf-label">RAM utilisée</span>
            <span class="perf-value" id="perf-memory">--</span>
          </div>
          <div class="perf-metric">
            <span class="perf-label">Heure d'ouverture</span>
            <span class="perf-value" id="perf-opened">--</span>
          </div>
        </div>
      </div>
    `;
  },

  mount(el) {
    const set = (id, val) => { const e = el.querySelector(`#${id}`); if (e) e.textContent = val; };

    const measure = () => {
      try {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
          const load = Math.round(nav.loadEventEnd - nav.startTime);
          const dom  = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
          set('perf-load', load > 0 ? `${load} ms` : '< 1 ms');
          set('perf-dom',  dom  > 0 ? `${dom} ms`  : '< 1 ms');
        }

        const res = performance.getEntriesByType('resource').length;
        set('perf-resources', `${res} fichiers`);

        if (performance.memory) {
          const mb = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
          set('perf-memory', `${mb} MB`);
        } else {
          set('perf-memory', 'N/D');
        }

        set('perf-opened', new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch {
        set('perf-load', 'N/D');
      }
    };

    if (document.readyState === 'complete') {
      measure();
    } else {
      window.addEventListener('load', measure, { once: true });
    }
  },

  unmount() {},

  renderSettings() {
    return `<p class="setting-hint">Affiche les métriques de performance du chargement de la page.</p>`;
  },

  onConfigChange(el) {
    el.innerHTML = this.render();
    this.mount(el);
  }
};
