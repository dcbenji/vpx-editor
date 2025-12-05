import { setupThemeListener, setupKeyboardShortcuts } from '../../shared/window-utils.js';

let config = {};

setupThemeListener();

window.vpxEditor.onInitConfirm?.(data => {
  config = data;

  document.getElementById('confirm-title').textContent = data.title || '';
  document.getElementById('confirm-message').textContent = data.message || '';

  const selectContainer = document.getElementById('confirm-select-container');
  const select = document.getElementById('confirm-select');

  if (data.options && data.options.length > 0) {
    selectContainer.classList.add('visible');
    select.innerHTML = '';
    data.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    if (data.selectedValue) {
      select.value = data.selectedValue;
    }
  } else {
    selectContainer.classList.remove('visible');
  }

  const footer = document.getElementById('confirm-footer');
  footer.innerHTML = '';

  data.buttons.forEach(btn => {
    const button = document.createElement('button');
    button.className = btn.primary ? 'win-btn primary' : 'win-btn';
    button.textContent = btn.label;
    button.addEventListener('click', () => {
      const selectValue = data.options ? select.value : null;
      window.vpxEditor.confirmResult({ action: btn.action, selectValue });
    });
    footer.appendChild(button);
  });
});

setupKeyboardShortcuts({
  onEscape: () => {
    if (config.cancelAction) {
      window.vpxEditor.confirmResult({ action: config.cancelAction });
    }
  },
});
