import { setupThemeListener, setupInputKeyboard } from '../../shared/window-utils.js';

let existingNames = [];
let currentName = '';
let mode = 'new';

setupThemeListener();

window.vpxEditor.onInitCollectionPrompt?.(data => {
  existingNames = data.existingNames || [];
  currentName = data.currentName || '';
  mode = data.mode || 'new';

  document.title = mode === 'rename' ? 'Rename Collection' : 'New Collection';

  const input = document.getElementById('prompt-input');
  input.value = data.defaultValue || '';
  input.focus();
  input.select();

  document.getElementById('prompt-error').textContent = '';
  validate();
});

function validate() {
  const input = document.getElementById('prompt-input');
  const okBtn = document.getElementById('prompt-ok');
  const error = document.getElementById('prompt-error');
  const newName = input.value.trim();

  if (!newName) {
    okBtn.disabled = true;
    error.textContent = 'Name cannot be empty';
    return false;
  }

  if (mode === 'rename' && newName === currentName) {
    okBtn.disabled = true;
    error.textContent = '';
    return false;
  }

  const exists = existingNames.some(n => n === newName && n !== currentName);
  if (exists) {
    okBtn.disabled = true;
    error.textContent = 'A collection with this name already exists';
    return false;
  }

  okBtn.disabled = false;
  error.textContent = '';
  return true;
}

document.getElementById('prompt-input').addEventListener('input', validate);

document.getElementById('prompt-cancel').addEventListener('click', () => {
  window.vpxEditor.collectionPromptCancel();
});

document.getElementById('prompt-ok').addEventListener('click', () => {
  if (!validate()) return;
  const name = document.getElementById('prompt-input').value.trim();
  window.vpxEditor.collectionPromptSubmit(name);
});

setupInputKeyboard(document.getElementById('prompt-input'), {
  onEnter: () => {
    if (validate()) {
      const name = document.getElementById('prompt-input').value.trim();
      window.vpxEditor.collectionPromptSubmit(name);
    }
  },
  onEscape: () => window.vpxEditor.collectionPromptCancel(),
});
