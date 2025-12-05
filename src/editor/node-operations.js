import { state } from './state.js';
import { undoManager } from './state.js';
import { saveItemToFile } from './table-loader.js';
import { updatePropertiesPanel } from './properties-panel.js';
import { render } from './canvas-renderer.js';
import { findClosestSegmentIndex } from './utils.js';

export function toggleNodeSmooth(itemName, nodeIndex) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  undoManager.beginUndo('Toggle smooth');
  undoManager.markForUndo(itemName);

  const pt = item.drag_points[nodeIndex];
  pt.smooth = !pt.smooth;

  saveItemToFile(itemName);
  undoManager.endUndo();
  updatePropertiesPanel();
  render();
}

export function deleteNode(itemName, nodeIndex) {
  const item = state.items[itemName];
  if (!item || !item.drag_points || item.drag_points.length <= 3) return;

  undoManager.beginUndo('Delete control point');
  undoManager.markForUndo(itemName);

  item.drag_points.splice(nodeIndex, 1);
  state.selectedNode = null;

  saveItemToFile(itemName);
  undoManager.endUndo();
  render();
}

export function toggleNodeSlingshot(itemName, nodeIndex) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  const pt = item.drag_points[nodeIndex];
  if (pt.smooth) return;

  undoManager.beginUndo('Toggle slingshot');
  undoManager.markForUndo(itemName);

  pt.is_slingshot = !pt.is_slingshot;
  if (pt.is_slingshot) {
    const nextIndex = (nodeIndex + 1) % item.drag_points.length;
    item.drag_points[nextIndex].smooth = false;
  }

  saveItemToFile(itemName);
  undoManager.endUndo();
  render();
}

export function addPointToObject(itemName, worldX, worldY) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  undoManager.beginUndo('Add control point');
  undoManager.markForUndo(itemName);

  const insertIndex = findClosestSegmentIndex(item, worldX, worldY);

  const newPoint = {
    x: worldX,
    y: worldY,
    z: 0,
    smooth: false,
    is_slingshot: false,
    has_auto_texture: true,
    tex_coord: 0,
    is_locked: false,
    editor_layer: 0,
  };

  item.drag_points.splice(insertIndex, 0, newPoint);
  state.selectedNode = { itemName, nodeIndex: insertIndex };

  saveItemToFile(itemName);
  undoManager.endUndo();
  render();
}

export function addNode(itemName, worldX, worldY, smooth = false) {
  const item = state.items[itemName];
  if (!item || !item.drag_points) return;

  undoManager.beginUndo('Add control point');
  undoManager.markForUndo(itemName);

  const insertIndex = findClosestSegmentIndex(item, worldX, worldY);

  const newPoint = {
    x: worldX,
    y: worldY,
    z: 0,
    smooth: smooth,
    is_slingshot: false,
    has_auto_texture: true,
    tex_coord: 0,
    is_locked: false,
    editor_layer: 0,
  };

  item.drag_points.splice(insertIndex, 0, newPoint);
  state.selectedNode = { itemName, nodeIndex: insertIndex };

  saveItemToFile(itemName);
  undoManager.endUndo();
  render();
}
