import { undoManager } from '../editor/state.js';

export async function withUndo(name, fn, options = {}) {
  const { skipUndo = false, markCollections = false } = options;

  if (skipUndo) {
    return await fn();
  }

  undoManager.beginUndo(name);
  if (markCollections) {
    undoManager.markCollectionsForUndo();
  }

  try {
    const result = await fn();
    undoManager.endUndo();
    return result;
  } catch (e) {
    undoManager.cancelUndo();
    throw e;
  }
}

export function withUndoSync(name, fn, options = {}) {
  const { skipUndo = false, markCollections = false } = options;

  if (skipUndo) {
    return fn();
  }

  undoManager.beginUndo(name);
  if (markCollections) {
    undoManager.markCollectionsForUndo();
  }

  try {
    const result = fn();
    undoManager.endUndo();
    return result;
  } catch (e) {
    undoManager.cancelUndo();
    throw e;
  }
}
