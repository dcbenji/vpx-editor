import { state } from '../editor/state.js';

export function materialOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  for (const name of state.materialNames) {
    const selected = name === currentValue ? ' selected' : '';
    html += `<option value="${name}"${selected}>${name}</option>`;
  }
  return html;
}

export function imageOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  for (const name of state.imageNames) {
    const selected = name === currentValue ? ' selected' : '';
    html += `<option value="${name}"${selected}>${name}</option>`;
  }
  return html;
}

export function surfaceOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  const surfaces = Object.entries(state.items)
    .filter(([_, item]) => item._type === 'Wall' || item._type === 'Surface')
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  for (const name of surfaces) {
    const selected = name === currentValue ? ' selected' : '';
    html += `<option value="${name}"${selected}>${name}</option>`;
  }
  return html;
}

export function lightOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  const lights = Object.entries(state.items)
    .filter(([_, item]) => item._type === 'Light')
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  for (const name of lights) {
    const selected = name === currentValue ? ' selected' : '';
    html += `<option value="${name}"${selected}>${name}</option>`;
  }
  return html;
}

export function layerOptions(currentLayer) {
  const layers = new Map();
  for (const gi of state.gameitems) {
    const num = gi.editor_layer ?? 0;
    const name = gi.editor_layer_name || `Layer ${num}`;
    if (!layers.has(num)) {
      layers.set(num, name);
    }
  }
  const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0]);
  let html = '';
  for (const [num, name] of sortedLayers) {
    const selected = num === currentLayer ? ' selected' : '';
    html += `<option value="${num}" data-layer-name="${name}"${selected}>${name}</option>`;
  }
  return html;
}

export function collectionOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  if (state.collections) {
    for (const collection of state.collections) {
      const name = collection.name || '';
      const selected = name === currentValue ? ' selected' : '';
      html += `<option value="${name}"${selected}>${name}</option>`;
    }
  }
  return html;
}

export function soundOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  for (const name of state.soundNames) {
    const selected = name === currentValue ? ' selected' : '';
    html += `<option value="${name}"${selected}>${name}</option>`;
  }
  return html;
}

export function renderProbeOptions(currentValue) {
  let html = `<option value=""${!currentValue ? ' selected' : ''}></option>`;
  for (const name of state.renderProbeNames) {
    const selected = name === currentValue ? ' selected' : '';
    html += `<option value="${name}"${selected}>${name}</option>`;
  }
  return html;
}
