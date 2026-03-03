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

  // Module size hints (how much space each module "wants")
  const SIZE_HINTS = {
    search:    { minCols: 2, preferCols: 4, preferRows: 1, priority: 1 },
    greeting:  { minCols: 2, preferCols: 3, preferRows: 1, priority: 2 },
    clock:     { minCols: 1, preferCols: 1, preferRows: 1, priority: 3 },
    weather:   { minCols: 1, preferCols: 1, preferRows: 1, priority: 4 },
    shortcuts: { minCols: 2, preferCols: 2, preferRows: 1, priority: 5 },
    todo:      { minCols: 1, preferCols: 1, preferRows: 1, priority: 6 },
    quote:     { minCols: 1, preferCols: 1, preferRows: 1, priority: 7 },
    notes:     { minCols: 1, preferCols: 2, preferRows: 1, priority: 8 },
    pomodoro:  { minCols: 1, preferCols: 1, preferRows: 1, priority: 9 },
    countdown: { minCols: 1, preferCols: 1, preferRows: 1, priority: 10 }
  };

  // ========== LAYOUT ALGORITHMS ==========

  function calculateAutoLayout(enabledModules, cols) {
    const layout = {};
    const count = enabledModules.length;

    if (count === 0) return layout;
    if (count === 1) {
      layout[enabledModules[0]] = { col: 1, row: 1, colSpan: cols, rowSpan: 3 };
      return layout;
    }

    const sorted = [...enabledModules].sort((a, b) => {
      return (SIZE_HINTS[a]?.priority || 50) - (SIZE_HINTS[b]?.priority || 50);
    });

    let currentRow = 1;
    let currentCol = 1;

    for (const moduleId of sorted) {
      const hint = SIZE_HINTS[moduleId] || { minCols: 1, preferCols: 1, preferRows: 1 };
      let span = Math.min(hint.preferCols, cols);

      // Search bar always gets full width
      if (moduleId === 'search') {
        if (currentCol > 1) { currentRow++; currentCol = 1; }
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

      // Last module in row? expand to fill remaining space
      const remaining = cols - currentCol + 1;
      const nextIdx = sorted.indexOf(moduleId) + 1;
      const isLast = nextIdx >= sorted.length;
      const nextIsSearch = !isLast && sorted[nextIdx] === 'search';
      if ((isLast || nextIsSearch) && remaining > span) {
        span = remaining;
      }

      layout[moduleId] = { col: currentCol, row: currentRow, colSpan: span, rowSpan: 1 };
      currentCol += span;
      if (currentCol > cols) { currentRow++; currentCol = 1; }
    }

    return layout;
  }

  function calculateFocusLayout(enabledModules, cols) {
    const layout = {};
    const count = enabledModules.length;
    if (count === 0) return layout;

    // Priority order: first enabled module is the "focus" module
    const sorted = [...enabledModules].sort((a, b) => {
      return (SIZE_HINTS[a]?.priority || 50) - (SIZE_HINTS[b]?.priority || 50);
    });

    // Search gets top row full width if present
    let currentRow = 1;
    const searchIdx = sorted.indexOf('search');
    if (searchIdx !== -1) {
      layout['search'] = { col: 1, row: currentRow, colSpan: cols, rowSpan: 1 };
      sorted.splice(searchIdx, 1);
      currentRow++;
    }

    if (sorted.length === 0) return layout;

    // The focus module takes center, large area
    const focusModule = sorted.shift();
    const sideModules = sorted;

    if (sideModules.length === 0) {
      layout[focusModule] = { col: 1, row: currentRow, colSpan: cols, rowSpan: 3 };
      return layout;
    }

    // Focus module takes left 2/3 of the grid, side modules stack on right 1/3
    const focusCols = Math.max(2, Math.ceil(cols * 0.65));
    const sideCols = cols - focusCols;

    layout[focusModule] = { col: 1, row: currentRow, colSpan: focusCols, rowSpan: Math.min(sideModules.length, 4) };

    for (let i = 0; i < sideModules.length; i++) {
      layout[sideModules[i]] = {
        col: focusCols + 1,
        row: currentRow + i,
        colSpan: sideCols,
        rowSpan: 1
      };
    }

    return layout;
  }

  function calculateSidebarLayout(enabledModules, cols) {
    const layout = {};
    const count = enabledModules.length;
    if (count === 0) return layout;

    const sorted = [...enabledModules].sort((a, b) => {
      return (SIZE_HINTS[a]?.priority || 50) - (SIZE_HINTS[b]?.priority || 50);
    });

    // All modules stacked in a single column on the left side, taking 1/3 of grid
    const sidebarCols = Math.max(1, Math.floor(cols / 3));

    for (let i = 0; i < sorted.length; i++) {
      const moduleId = sorted[i];
      if (moduleId === 'search') {
        // Search still gets full width at top
        layout[moduleId] = { col: 1, row: 1, colSpan: cols, rowSpan: 1 };
        // Shift all others down
        for (let j = 0; j < sorted.length; j++) {
          if (sorted[j] !== 'search' && layout[sorted[j]]) {
            layout[sorted[j]].row++;
          }
        }
      } else {
        const row = Object.keys(layout).length + 1;
        layout[moduleId] = { col: 1, row: row, colSpan: sidebarCols, rowSpan: 1 };
      }
    }

    // Re-sort rows to make them sequential
    let row = 1;
    const hasSearch = sorted.includes('search');
    if (hasSearch) {
      layout['search'] = { col: 1, row: 1, colSpan: cols, rowSpan: 1 };
      row = 2;
    }
    for (const moduleId of sorted.filter(m => m !== 'search')) {
      layout[moduleId] = { col: 1, row: row, colSpan: sidebarCols, rowSpan: 1 };
      row++;
    }

    return layout;
  }

  function calculateMinimalLayout(enabledModules, cols) {
    const layout = {};
    const count = enabledModules.length;
    if (count === 0) return layout;

    const sorted = [...enabledModules].sort((a, b) => {
      return (SIZE_HINTS[a]?.priority || 50) - (SIZE_HINTS[b]?.priority || 50);
    });

    // Centered layout: use middle columns, leave edges empty
    const useCols = Math.max(2, Math.ceil(cols * 0.5));
    const startCol = Math.floor((cols - useCols) / 2) + 1;
    let currentRow = 1;

    for (const moduleId of sorted) {
      if (moduleId === 'search') {
        layout[moduleId] = { col: startCol, row: currentRow, colSpan: useCols, rowSpan: 1 };
      } else {
        layout[moduleId] = { col: startCol, row: currentRow, colSpan: useCols, rowSpan: 1 };
      }
      currentRow++;
    }

    return layout;
  }

  function calculateDashboardLayout(enabledModules, cols) {
    const layout = {};
    const count = enabledModules.length;
    if (count === 0) return layout;

    const sorted = [...enabledModules].sort((a, b) => {
      return (SIZE_HINTS[a]?.priority || 50) - (SIZE_HINTS[b]?.priority || 50);
    });

    // Dense grid: everything gets equal space, filling cells left to right
    let currentRow = 1;
    let currentCol = 1;

    for (const moduleId of sorted) {
      if (moduleId === 'search') {
        if (currentCol > 1) { currentRow++; currentCol = 1; }
        layout[moduleId] = { col: 1, row: currentRow, colSpan: cols, rowSpan: 1 };
        currentRow++;
        currentCol = 1;
        continue;
      }

      // Each module gets exactly 1 column in dashboard mode
      layout[moduleId] = { col: currentCol, row: currentRow, colSpan: 1, rowSpan: 1 };
      currentCol++;
      if (currentCol > cols) { currentRow++; currentCol = 1; }
    }

    return layout;
  }

  function getLayoutForMode(mode, enabledModules, cols) {
    switch (mode) {
      case 'focus':     return calculateFocusLayout(enabledModules, cols);
      case 'sidebar':   return calculateSidebarLayout(enabledModules, cols);
      case 'minimal':   return calculateMinimalLayout(enabledModules, cols);
      case 'dashboard': return calculateDashboardLayout(enabledModules, cols);
      case 'auto':
      default:          return calculateAutoLayout(enabledModules, cols);
    }
  }

  // ========== INIT ==========

  async function init(settings) {
    _settings = settings;
    gridEl = document.getElementById('module-grid');
    await renderModules();
  }

  // ========== RENDER ==========

  async function renderModules() {
    // Unmount existing modules
    for (const [moduleId, cell] of _mountedModules) {
      const moduleDef = ModuleRegistry.get(moduleId);
      if (moduleDef?.unmount) moduleDef.unmount(cell);
    }

    gridEl.innerHTML = '';
    _mountedModules.clear();

    const moduleSettings = _settings.modules;
    const savedPositions = _settings.grid.savedPositions || {};
    const cols = _settings.grid.columns;
    const layoutMode = _settings.grid.layoutMode || 'auto';

    // Get enabled module IDs
    const enabledModules = Object.entries(moduleSettings)
      .filter(([id, s]) => s.enabled && ModuleRegistry.get(id))
      .map(([id]) => id);

    if (enabledModules.length === 0) return;

    // Use saved positions if we have them and are in auto mode, otherwise calculate
    let positions;
    if (layoutMode === 'auto' && Object.keys(savedPositions).length > 0) {
      // Validate saved positions still match enabled modules
      const allSaved = enabledModules.every(id => savedPositions[id]);
      if (allSaved) {
        positions = savedPositions;
      } else {
        positions = getLayoutForMode(layoutMode, enabledModules, cols);
      }
    } else {
      positions = getLayoutForMode(layoutMode, enabledModules, cols);
    }

    // Calculate how many rows we actually use
    let maxRow = 1;
    for (const pos of Object.values(positions)) {
      maxRow = Math.max(maxRow, pos.row + (pos.rowSpan || 1) - 1);
    }

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

      gridEl.appendChild(cell);
      _mountedModules.set(moduleId, cell);

      if (moduleDef.mount) {
        moduleDef.mount(cell, config);
      }
    }

    // Setup drag & drop
    setupDragAndDrop();
  }

  // ========== DRAG & DROP (mouse-based) ==========

  let _dragState = null;

  function setupDragAndDrop() {
    const cells = gridEl.querySelectorAll('.module-cell');
    cells.forEach(cell => {
      cell.addEventListener('mousedown', onMouseDown);
    });
  }

  function onMouseDown(e) {
    if (!editMode) return;
    // Ignore clicks on interactive elements
    if (e.target.closest('input, textarea, select, button, a')) return;
    e.preventDefault();

    const cell = e.currentTarget;
    const rect = cell.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();

    // Create a floating clone
    const clone = cell.cloneNode(true);
    clone.classList.add('drag-clone');
    clone.style.position = 'fixed';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.85';
    clone.style.transform = 'scale(1.03)';
    clone.style.transition = 'none';
    clone.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
    document.body.appendChild(clone);

    // Dim the original
    cell.classList.add('dragging');

    _dragState = {
      moduleId: cell.dataset.moduleId,
      cell: cell,
      clone: clone,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      startX: e.clientX,
      startY: e.clientY
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!_dragState) return;

    const { clone, offsetX, offsetY } = _dragState;
    clone.style.left = (e.clientX - offsetX) + 'px';
    clone.style.top = (e.clientY - offsetY) + 'px';

    // Highlight drop target
    const cells = gridEl.querySelectorAll('.module-cell');
    cells.forEach(c => c.classList.remove('drag-over'));

    const target = getDropTarget(e.clientX, e.clientY);
    if (target && target !== _dragState.cell) {
      target.classList.add('drag-over');
    }
  }

  function onMouseUp(e) {
    if (!_dragState) return;

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    const { cell, clone, moduleId } = _dragState;

    // Find drop target
    const target = getDropTarget(e.clientX, e.clientY);

    // Clean up
    clone.remove();
    cell.classList.remove('dragging');
    gridEl.querySelectorAll('.module-cell').forEach(c => c.classList.remove('drag-over'));

    if (target && target !== cell) {
      // Swap the two modules' grid positions
      const targetId = target.dataset.moduleId;
      swapModules(moduleId, targetId);
    }

    _dragState = null;
  }

  function getDropTarget(x, y) {
    const cells = gridEl.querySelectorAll('.module-cell');
    for (const cell of cells) {
      if (_dragState && cell === _dragState.cell) continue;
      const rect = cell.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return cell;
      }
    }
    return null;
  }

  async function swapModules(idA, idB) {
    const cellA = _mountedModules.get(idA);
    const cellB = _mountedModules.get(idB);
    if (!cellA || !cellB) return;

    // Get current grid positions
    const posA = {
      col: cellA.style.gridColumn,
      row: cellA.style.gridRow
    };
    const posB = {
      col: cellB.style.gridColumn,
      row: cellB.style.gridRow
    };

    // Animate swap
    cellA.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
    cellB.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';

    // Swap CSS grid positions
    cellA.style.gridColumn = posB.col;
    cellA.style.gridRow = posB.row;
    cellB.style.gridColumn = posA.col;
    cellB.style.gridRow = posA.row;

    // Save positions
    await saveCurrentLayout();

    // Clean up transitions
    setTimeout(() => {
      cellA.style.transition = '';
      cellB.style.transition = '';
    }, 350);

    showToast('Modules échangés');
  }

  // ========== LAYOUT PERSISTENCE ==========

  async function saveCurrentLayout() {
    const positions = {};
    for (const [moduleId, cell] of _mountedModules) {
      const colMatch = cell.style.gridColumn.match(/(\d+)\s*\/\s*span\s*(\d+)/);
      const rowMatch = cell.style.gridRow.match(/(\d+)\s*\/\s*span\s*(\d+)/);
      if (colMatch && rowMatch) {
        positions[moduleId] = {
          col: parseInt(colMatch[1]),
          colSpan: parseInt(colMatch[2]),
          row: parseInt(rowMatch[1]),
          rowSpan: parseInt(rowMatch[2])
        };
      }
    }

    const grid = await StorageManager.get('grid');
    grid.savedPositions = positions;
    await StorageManager.set('grid', grid);
  }

  // ========== PUBLIC API ==========

  function toggleEditMode() {
    editMode = !editMode;
    gridEl.classList.toggle('edit-mode', editMode);
    return editMode;
  }

  function isEditMode() {
    return editMode;
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

    // Clear saved positions so auto-layout recalculates
    const grid = await StorageManager.get('grid');
    grid.savedPositions = {};
    await StorageManager.set('grid', grid);

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
    grid.savedPositions = {};
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
    grid.savedPositions = {};
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
