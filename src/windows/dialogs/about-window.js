import { setupThemeListener, setupKeyboardShortcuts } from '../../shared/window-utils.js';

const versionEl = document.getElementById('about-version');
const iconEl = document.getElementById('about-icon');

setupThemeListener();

setupKeyboardShortcuts({
  onEscape: () => window.close(),
  onEnter: () => window.close(),
});

window.vpxEditor.onInitAbout?.(data => {
  versionEl.textContent = `Version ${data.version}`;
  if (data.iconPath) {
    iconEl.src = data.iconPath;
  }
});
