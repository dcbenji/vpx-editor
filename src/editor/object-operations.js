import { state, undoManager } from './state.js';
import { saveItemToFile } from './table-loader.js';
import { invalidateItem } from './canvas-renderer-3d.js';

export let transformItemName = null;
export let originalDragPoints = null;

export function setTransformItemName(name) {
  transformItemName = name;
}

export function setOriginalDragPoints(points) {
  originalDragPoints = points;
}

export function backupDragPoints(item) {
  if (!item.drag_points) return null;
  return item.drag_points.map(pt => ({ ...pt }));
}

export function restoreDragPoints(item, backup) {
  if (!backup) return;
  item.drag_points = backup.map(pt => ({ ...pt }));
}

export function applyRotation(item, angle, useOrigin, centerX, centerY) {
  const center = { x: centerX, y: centerY };
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  for (const pt of item.drag_points) {
    if (pt.vertex) {
      const x = pt.vertex.x - center.x;
      const y = pt.vertex.y - center.y;
      pt.vertex.x = center.x + x * cos - y * sin;
      pt.vertex.y = center.y + x * sin + y * cos;
    } else if (pt.x !== undefined) {
      const x = pt.x - center.x;
      const y = pt.y - center.y;
      pt.x = center.x + x * cos - y * sin;
      pt.y = center.y + x * sin + y * cos;
    }
  }
}

export function applyScale(item, scaleX, scaleY, useOrigin, centerX, centerY) {
  const center = { x: centerX, y: centerY };

  for (const pt of item.drag_points) {
    if (pt.vertex) {
      pt.vertex.x = center.x + (pt.vertex.x - center.x) * scaleX;
      pt.vertex.y = center.y + (pt.vertex.y - center.y) * scaleY;
    } else if (pt.x !== undefined) {
      pt.x = center.x + (pt.x - center.x) * scaleX;
      pt.y = center.y + (pt.y - center.y) * scaleY;
    }
  }
}

export function applyTranslate(item, dx, dy) {
  for (const pt of item.drag_points) {
    if (pt.vertex) {
      pt.vertex.x += dx;
      pt.vertex.y += dy;
    } else if (pt.x !== undefined) {
      pt.x += dx;
      pt.y += dy;
    }
  }
}

export function getObjectCenter(item) {
  if (!item.drag_points || item.drag_points.length === 0) return { x: 0, y: 0 };

  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (const pt of item.drag_points) {
    const x = pt.x ?? pt.vertex?.x ?? 0;
    const y = pt.y ?? pt.vertex?.y ?? 0;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

export function moveObjectOffset(itemName, dx, dy) {
  const item = state.items[itemName];
  if (!item) return;

  if (item.center) {
    item.center.x += dx;
    item.center.y += dy;
  }
  if (item.vCenter) {
    item.vCenter.x += dx;
    item.vCenter.y += dy;
  }
  if (item.pos) {
    item.pos.x += dx;
    item.pos.y += dy;
  }
  if (item.position) {
    item.position.x += dx;
    item.position.y += dy;
  }
  if (item.ver1) {
    item.ver1.x += dx;
    item.ver1.y += dy;
  }
  if (item.ver2) {
    item.ver2.x += dx;
    item.ver2.y += dy;
  }
  if (item.drag_points) {
    for (const pt of item.drag_points) {
      if (pt.vertex) {
        pt.vertex.x += dx;
        pt.vertex.y += dy;
      } else {
        pt.x += dx;
        pt.y += dy;
      }
    }
  }
}

export function flipObjectX(itemName, renderCallback) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  undoManager.beginUndo('Flip horizontal');
  undoManager.markForUndo(itemName);

  const center = getObjectCenter(item);

  for (const pt of item.drag_points) {
    if (pt.vertex) {
      pt.vertex.x = center.x - (pt.vertex.x - center.x);
    } else if (pt.x !== undefined) {
      pt.x = center.x - (pt.x - center.x);
    }
  }

  item.drag_points.reverse();

  saveItemToFile(itemName);
  undoManager.endUndo();
  invalidateItem(itemName);
  if (renderCallback) renderCallback();
}

export function flipObjectY(itemName, renderCallback) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  undoManager.beginUndo('Flip vertical');
  undoManager.markForUndo(itemName);

  const center = getObjectCenter(item);

  for (const pt of item.drag_points) {
    if (pt.vertex) {
      pt.vertex.y = center.y - (pt.vertex.y - center.y);
    } else if (pt.y !== undefined) {
      pt.y = center.y - (pt.y - center.y);
    }
  }

  item.drag_points.reverse();

  saveItemToFile(itemName);
  undoManager.endUndo();
  invalidateItem(itemName);
  if (renderCallback) renderCallback();
}

export function rotateObject(itemName, worldX, worldY) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  transformItemName = itemName;
  originalDragPoints = backupDragPoints(item);

  const center = getObjectCenter(item);
  const mouseX = worldX !== undefined ? worldX : center.x;
  const mouseY = worldY !== undefined ? worldY : center.y;
  window.vpxEditor.openTransform('rotate', {
    centerX: center.x,
    centerY: center.y,
    mouseX,
    mouseY,
  });
}

export function scaleObject(itemName, worldX, worldY) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  transformItemName = itemName;
  originalDragPoints = backupDragPoints(item);

  const center = getObjectCenter(item);
  const mouseX = worldX !== undefined ? worldX : center.x;
  const mouseY = worldY !== undefined ? worldY : center.y;
  window.vpxEditor.openTransform('scale', {
    centerX: center.x,
    centerY: center.y,
    mouseX,
    mouseY,
  });
}

export function translateObject(itemName) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  transformItemName = itemName;
  originalDragPoints = backupDragPoints(item);

  window.vpxEditor.openTransform('translate', { centerX: 0, centerY: 0 });
}
