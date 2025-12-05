import { state } from '../editor/state.js';

export function parseColor(c, defaultColor = { r: 255, g: 169, b: 87 }) {
  if (!c) return defaultColor;
  if (typeof c === 'number') {
    return { r: (c >> 16) & 0xff, g: (c >> 8) & 0xff, b: c & 0xff };
  }
  if (typeof c === 'string' && c.startsWith('#')) {
    const hex = c.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return defaultColor;
}

export function colorToHex(c) {
  const { r, g, b } = parseColor(c);
  return (r << 16) | (g << 8) | b;
}

export function colorToRgb(c) {
  const { r, g, b } = parseColor(c);
  return `rgb(${r}, ${g}, ${b})`;
}

export function colorToRgba(c, alpha = 1) {
  const { r, g, b } = parseColor(c);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function blendColors(color1, color2) {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  return {
    r: Math.round(((c1.r & 0xfe) + (c2.r & 0xfe)) / 2),
    g: Math.round(((c1.g & 0xfe) + (c2.g & 0xfe)) / 2),
    b: Math.round(((c1.b & 0xfe) + (c2.b & 0xfe)) / 2),
  };
}

export function blendColorsToHex(color1, color2) {
  const { r, g, b } = blendColors(color1, color2);
  return (r << 16) | (g << 8) | b;
}

export function blendColorsToRgba(color1, color2, alpha = 0.3) {
  const { r, g, b } = blendColors(color1, color2);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getMaterialColor(materialName, fallback) {
  if (!materialName || !state.materials) return fallback;
  const mat = state.materials[materialName];
  if (!mat || !mat.base_color) return fallback;
  const c = mat.base_color;
  if (typeof c === 'string' && c.startsWith('#')) {
    return c;
  }
  if (typeof c === 'number') {
    return colorToRgb(c);
  }
  return fallback;
}
