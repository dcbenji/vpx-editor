import {
  TOOLBOX_MIN_WIDTH,
  TOOLBOX_MAX_WIDTH,
  RIGHT_PANEL_MIN_WIDTH,
  RIGHT_PANEL_MAX_WIDTH,
} from '../shared/constants.js';

export function savePanelSettings() {
  const panelSettings = {
    toolboxWidth: document.getElementById('toolbox-panel')?.offsetWidth,
    rightPanelWidth: document.getElementById('right-panel')?.offsetWidth,
    layersHeight: document.getElementById('layers-panel')?.offsetHeight,
  };
  window.vpxEditor.savePanelSettings(panelSettings);
}

export async function loadPanelSettings() {
  try {
    const panelSettings = await window.vpxEditor.getPanelSettings();
    if (!panelSettings) return;

    if (panelSettings.toolboxWidth) {
      const panel = document.getElementById('toolbox-panel');
      if (panel) panel.style.width = panelSettings.toolboxWidth + 'px';
    }
    if (panelSettings.rightPanelWidth) {
      const panel = document.getElementById('right-panel');
      if (panel) panel.style.width = panelSettings.rightPanelWidth + 'px';
    }
    if (panelSettings.layersHeight) {
      const panel = document.getElementById('layers-panel');
      if (panel) {
        panel.style.flex = 'none';
        panel.style.height = panelSettings.layersHeight + 'px';
      }
    }
  } catch (e) {}
}

export function initToolboxResize(resizeCanvas) {
  const handle = document.getElementById('toolbox-resize-handle');
  const panel = document.getElementById('toolbox-panel');
  if (!handle || !panel) return;

  let startX, startWidth;

  handle.addEventListener('mousedown', e => {
    startX = e.clientX;
    startWidth = panel.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = e => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(TOOLBOX_MAX_WIDTH, Math.max(TOOLBOX_MIN_WIDTH, startWidth + delta));
      panel.style.width = newWidth + 'px';
      resizeCanvas();
    };

    const onMouseUp = () => {
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      savePanelSettings();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

export function initRightPanelResize(resizeCanvas) {
  const handle = document.getElementById('right-resize-handle');
  const panel = document.getElementById('right-panel');
  if (!handle || !panel) return;

  let startX, startWidth;

  handle.addEventListener('mousedown', e => {
    startX = e.clientX;
    startWidth = panel.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = e => {
      const delta = startX - e.clientX;
      const newWidth = Math.min(RIGHT_PANEL_MAX_WIDTH, Math.max(RIGHT_PANEL_MIN_WIDTH, startWidth + delta));
      panel.style.width = newWidth + 'px';
      resizeCanvas();
    };

    const onMouseUp = () => {
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      savePanelSettings();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

export function initLayersResize() {
  const handle = document.getElementById('layers-resize-handle');
  const panel = document.getElementById('layers-panel');
  const rightPanel = document.getElementById('right-panel');
  if (!handle || !panel || !rightPanel) return;

  let startY, startHeight;

  handle.addEventListener('mousedown', e => {
    startY = e.clientY;
    startHeight = panel.offsetHeight;
    handle.classList.add('dragging');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = e => {
      const delta = startY - e.clientY;
      const maxHeight = rightPanel.offsetHeight - 100;
      const newHeight = Math.min(maxHeight, Math.max(80, startHeight + delta));
      panel.style.flex = 'none';
      panel.style.height = newHeight + 'px';
    };

    const onMouseUp = () => {
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      savePanelSettings();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}
