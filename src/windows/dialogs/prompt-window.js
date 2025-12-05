import { setupThemeListener, createValidator, bindValidation, setupInputKeyboard } from '../../shared/window-utils.js';

let config = {};
let existingNames = [];
let validate;

setupThemeListener();

window.vpxEditor.onInitPrompt?.(data => {
  config = data;
  existingNames = data.existingNames || [];

  document.getElementById('prompt-label').textContent = data.label || '';

  const input = document.getElementById('prompt-input');
  input.value = data.defaultValue || '';
  input.placeholder = data.placeholder || '';
  input.focus();
  input.select();

  const rules = [{ type: 'notEmpty', message: config.emptyError || 'Value cannot be empty' }];
  if (config.maxLength) {
    rules.push({ type: 'maxLength', value: config.maxLength });
  }
  if (config.currentValue) {
    rules.push({ type: 'notSameAs', value: config.currentValue });
  }
  rules.push({ type: 'notInList', message: config.existsError || 'Name already exists' });

  const validator = createValidator(rules, { currentValue: config.currentValue });
  validate = bindValidation('prompt-input', 'prompt-ok', 'prompt-error', validator, existingNames);
  validate();
});

const submit = () => {
  if (validate && validate()) {
    window.vpxEditor.promptResult(document.getElementById('prompt-input').value.trim());
  }
};

const cancel = () => {
  window.vpxEditor.promptResult(null);
};

document.getElementById('prompt-cancel').addEventListener('click', cancel);
document.getElementById('prompt-ok').addEventListener('click', submit);

setupInputKeyboard(document.getElementById('prompt-input'), {
  onEnter: submit,
  onEscape: cancel,
});
