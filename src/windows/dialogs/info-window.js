import { setupThemeListener, setupKeyboardShortcuts } from '../../shared/window-utils.js';

setupThemeListener();

window.vpxEditor.onInitInfo?.(data => {
  document.getElementById('info-title').textContent = data.title || '';
  document.getElementById('info-message').textContent = data.message || '';
  document.getElementById('info-detail').textContent = data.detail || '';
});

const close = () => window.vpxEditor.infoResult();

document.getElementById('info-ok').addEventListener('click', close);

setupKeyboardShortcuts({
  onEnter: close,
  onEscape: close,
});
