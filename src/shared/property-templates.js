export function propRow(label, content) {
  return `<div class="prop-row">
  <label class="prop-label">${label}</label>
  ${content}
</div>`;
}

export function numberInput(label, prop, value, step = 1, options = {}) {
  const { min, max, readonly } = options;
  const attrs = [
    `type="number"`,
    `class="prop-input${readonly ? ' readonly' : ''}"`,
    `data-prop="${prop}"`,
    `value="${typeof value === 'number' ? value.toFixed(step < 1 ? Math.max(1, -Math.floor(Math.log10(step))) : 0) : value}"`,
    `step="${step}"`,
  ];
  if (min !== undefined) attrs.push(`min="${min}"`);
  if (max !== undefined) attrs.push(`max="${max}"`);
  if (readonly) attrs.push('readonly');

  return propRow(label, `<input ${attrs.join(' ')}>`);
}

export function checkbox(label, prop, checked) {
  return propRow(label, `<input type="checkbox" class="prop-input" data-prop="${prop}" ${checked ? 'checked' : ''}>`);
}

export function select(label, prop, optionsHtml) {
  return propRow(label, `<select class="prop-select" data-prop="${prop}">${optionsHtml}</select>`);
}

export function colorInput(label, prop, value) {
  return propRow(label, `<input type="color" class="prop-color" data-prop="${prop}" value="${value || '#ffffff'}">`);
}

export function textInput(label, prop, value, options = {}) {
  const { readonly, maxlength } = options;
  const attrs = [
    `type="text"`,
    `class="prop-input${readonly ? ' readonly' : ''}"`,
    `data-prop="${prop}"`,
    `value="${value || ''}"`,
  ];
  if (maxlength) attrs.push(`maxlength="${maxlength}"`);
  if (readonly) attrs.push('readonly');

  return propRow(label, `<input ${attrs.join(' ')}>`);
}

export function propGroup(content, title = null) {
  const titleHtml = title ? `<div class="prop-group-title">${title}</div>` : '';
  return `<div class="prop-group">${titleHtml}${content}</div>`;
}

export function propTabs(tabs) {
  const buttons = tabs
    .map((tab, i) => `<button class="prop-tab${i === 0 ? ' active' : ''}" data-tab="${tab.id}">${tab.label}</button>`)
    .join('');
  return `<div class="prop-tabs">${buttons}</div>`;
}

export function propTabContent(id, content, active = false) {
  return `<div class="prop-tab-content${active ? ' active' : ''}" data-tab="${id}">${content}</div>`;
}

export function timerTab(item, defaultInterval = 100) {
  return propTabContent(
    'timer',
    propGroup(`
    ${checkbox('Enabled', 'is_timer_enabled', item.is_timer_enabled)}
    ${numberInput('Interval (ms)', 'timer_interval', item.timer_interval ?? defaultInterval, 10, { min: 1 })}
  `)
  );
}

export function positionGroup(item, fields = ['x', 'y']) {
  let content = '';

  if (fields.includes('x')) {
    const x = item.center?.x ?? item.pos?.x ?? item.position?.x ?? item.vCenter?.x ?? 0;
    content += numberInput(
      'X',
      item.center ? 'center.x' : item.pos ? 'pos.x' : item.position ? 'position.x' : 'vCenter.x',
      x,
      1
    );
  }
  if (fields.includes('y')) {
    const y = item.center?.y ?? item.pos?.y ?? item.position?.y ?? item.vCenter?.y ?? 0;
    content += numberInput(
      'Y',
      item.center ? 'center.y' : item.pos ? 'pos.y' : item.position ? 'position.y' : 'vCenter.y',
      y,
      1
    );
  }

  return propGroup(content, 'Position');
}
