/* ============================================
   GRID-MANAGER.JS — Auto-layout CSS Grid + drag-and-drop
   Modules auto-resize to fill the page
   ============================================ */

const GridManager = (() => {
  let gridEl;
  let editMode = false;
  let _settings;
  const _mountedModules = new Map();

  // Layout presets
  const LAYOUT_PRESETS = {
    auto: { name: 'Auto (recommandé)', description: 'Les modules remplissent automatiquement l\'espace' },
    focus: { name: 'Focus', description: 'Un module principal au centre, les autres autour' },
    sidebar: { name: 'Barre latérale', description: 'Modules empilés sur le côté' },
    minimal: { name: 'Minimal', description: 'Modules centrés avec beaucoup d\'espace' },
    dashboard: { name: 'Dashboard', description: 'Grille dense type tableau de bord' }
  };

  // Smart layout: calculates optimal grid placement
  function calculateAutoLayout(enabledModules, cols) {
    const layout = {};
    const count = enabledModules.length;

    if (count === 0) return layout;
    if (count === 1) {
      layout[enabledModules[0]] = { col: 1, row: 1, colSpan: cols, rowSpan: 3 };
      return layout;
    }

    // Module size hints (how much space each module "wants")
    const sizeHints = {
      search:    { minCols: 2, preferCols: cols, preferRows: 1, priority: 1 },
      greeting:  { minCols: 2, preferCols: Math.min(3, cols), preferRows: 1, priority: 2 },
      clock:     { minCols: 1, preferCols: 1, preferRows: 1, priority: 3 },
      weather:   { minCols: 1, preferCols: 1, preferRows: 1, priority: 4 },
      shortcuts: { minCols: 2, preferCols: 2, preferRows: 1, priority: 5 },
      todo:      { minCols: 1, preferCols: 1, preferRows: 1, priority: 6 },
      quote:     { minCols: 1, preferCols: 1, preferRows: 1, priority: 7 },
      notes:     { minCols: 1, preferCols: 2, preferRows: 1, priority: 8 },
      pomodoro:  { minCols: 1, preferCols: 1, preferRows: 1, priority: 9 },
      countdown: { minCols: 1, preferCols: 1, preferRows: 1, priority: 10 }
    };

    // Sort by priority
    const sorted = [...enabledModules].sort((a, b) => {
      return (sizeHints[a]?.priority || 50) - (sizeHints[b]?.priority || 50);
    });

    // Simple row-packing algorithm
    let currentRow = 1;
    let currentCol = 1;
    let rowHeight = 1;

    // Calculate rows needed
    const totalRows = Math.max(2, Math.ceil(count / cols) + 1);

    for (const moduleId of sorted) {
      const hint = sizeHints[moduleId] || { minCols: 1, preferCols: 1, preferRows: 1 };
      let span = Math.min(hint.preferCols, cols - currentCol + 1);

      // Search bar always gets full width
      if (moduleId === 'search') {
        if (currentCol > 1) {
          currentRow++;
          currentCol = 1;
        }
        layout[moduleId] = { col: 1, row: currentRow, colSpan: cols, rowSpan: 1 };
        currentRow++;
        currentCol = 1;
        continue;
      }

      // If not enough space in current row, go to next
      if (currentCol + span - 1 > cols) {
        currentRow++;
        currentCol = 1;
      }

      // Remaining cols in last row? expand to fill
      const remaining = cols - currentCol + 1;
      const isLastInRow = sorted.indexOf(moduleId) === sorted.length - 1 ||
                          currentCol + span > cols;
      if (isLastInRow && remaining > span) {
        span = remaining;
      }

      layout[moduleId] = {
        col: currentCol,
        row: currentRow,
        colSpan: span,
        rowSpan: 1
      };

      currentCol += span;
      if (currentCol > cols) {
        currentRow++;
        currentCol = 1;
      }
    }

    return layout;
  }

  async function init(settings) {
    _settings = settings;
    gridEl = document.getElementById('module-grid');
    await renderModules();
  }

  async function renderModules() {
    // Unmount existing modules
    for (const [moduleId, cell] of _mountedModules) {
      const moduleDef = ModuleRegistry.get(moduleId);
      if (moduleDef?.unmount) moduleDef.unmount(cell);
    }

    gridEl.innerHTML = '';
    _mountedModules.clear();

    const moduleSettings = _settings.modules;
    const customPositions = _settings.grid.modulePositions;
    const cols = _settings.grid.columns;
    const layoutMode = _settings.grid.layoutMode || 'auto';

    // Get enabled module IDs
    const enabledModules = Object.entries(moduleSettings)
      .filter(([id, s]) => s.enabled && ModuleRegistry.get(id))
      .map(([id]) => id);

    if (enabledModules.length === 0) return;

    // Calculate positions
    let positions;
    if (layoutMode === 'auto' || Object.keys(customPositions).length === 0) {
      positions = calculateAutoLayout(enabledModules, cols);
    } else {
      positions = customPositions;
    }

    // Calculate how many rows we actually use
    let maxRow = 1;
    for (const pos of Object.values(positions)) {
      maxRow = Math.max(maxRow, pos.row + (pos.rowSpan || 1) - 1);
    }

    // Set grid rows dynamically
    gridEl.style.gridTemplateRows = `repeat(${maxRow}, 1fr)`;

    for (const moduleId of enabledModules) {
      const moduleDef = ModuleRegistry.get(moduleId);
      if (!moduleDef) continue;

      const pos = positions[moduleId] || moduleDef.defaultPosition;
      const config = moduleSettings[moduleId]?.config || {};

      const cell = document.createElement('div');
      cell.className = 'module-cell';
      cell.dataset.moduleId = moduleId;
      cell.style.gridColumn = `${pos.col} / span ${pos.colSpan}`;
      cell.style.gridRow = `${pos.row} / span ${pos.rowSpan}`;

      const html = moduleDef.render(config);
      cell.innerHTML = html;

      cell.draggable = true;
      cell.addEventListener('dragstart', onDragStart);
      cell.addEventListener('dragend', onDragEnd);

      gridEl.appendChild(cell);
      _mountedModules.set(moduleId, cell);

      if (moduleDef.mount) {
        moduleDef.mount(cell, config);
      }
    }
  }

  function toggleEditMode() {
    editMode = !editMode;
    gridEl.classList.toggle('edit-mode', editMode);
    return editMode;
  }

  function isEditMode() {
    return editMode;
  }

  let _draggedId = null;

  function onDragStart(e) {
    if (!editMode) { e.preventDefault(); return; }
    _draggedId = e.currentTarget.dataset.moduleId;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    _draggedId = null;
    document.querySelectorAll('.grid-placeholder').forEach(p => p.remove());
  }

  async function refreshModule(moduleId) {
    const cell = _mountedModules.get(moduleId);
    if (!cell) return;

    const moduleDef = ModuleRegistry.get(moduleId);
    if (!moduleDef) return;

    const moduleSettings = await StorageManager.get('modules');
    const config = moduleSettings[moduleId]?.config || {};

    if (moduleDef.unmount) moduleDef.unmount(cell);
    cell.innerHTML = moduleDef.render(config);
    if (moduleDef.mount) moduleDef.mount(cell, config);
  }

  async function toggleModule(moduleId, enabled) {
    const moduleSettings = await StorageManager.get('modules');
    moduleSettings[moduleId].enabled = enabled;
    await StorageManager.set('modules', moduleSettings);

    _settings = await StorageManager.getAll();
    await renderModules();

    // Re-trigger animation
    const cells = document.querySelectorAll('.module-cell');
    cells.forEach((cell, i) => {
      setTimeout(() => cell.classList.add('animate-in'), i * 80);
    });
  }

  async function updateGridSize(columns, rows) {
    const grid = await StorageManager.get('grid');
    grid.columns = columns;
    if (rows !== undefined) grid.rows = rows;
    await StorageManager.set('grid', grid);

    document.documentElement.style.setProperty('--grid-cols', columns);

    _settings = await StorageManager.getAll();
    await renderModules();

    const cells = document.querySelectorAll('.module-cell');
    cells.forEach((cell, i) => {
      setTimeout(() => cell.classList.add('animate-in'), i * 50);
    });
  }

  async function setLayoutMode(mode) {
    const grid = await StorageManager.get('grid');
    grid.layoutMode = mode;
    grid.modulePositions = {};
    await StorageManager.set('grid', grid);

    _settings = await StorageManager.getAll();
    await renderModules();

    const cells = document.querySelectorAll('.module-cell');
    cells.forEach((cell, i) => {
      setTimeout(() => cell.classList.add('animate-in'), i * 80);
    });
  }

  function getMountedCell(moduleId) {
    return _mountedModules.get(moduleId);
  }

  function getLayoutPresets() {
    return LAYOUT_PRESETS;
  }

  return {
    init,
    renderModules,
    toggleEditMode,
    isEditMode,
    refreshModule,
    toggleModule,
    updateGridSize,
    setLayoutMode,
    getMountedCell,
    getLayoutPresets
  };
})();
