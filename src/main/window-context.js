export class WindowContext {
  constructor(id, browserWindow) {
    this.id = id;
    this.window = browserWindow;

    this.extractedDir = null;
    this.currentTablePath = null;
    this.tableName = null;
    this.isTableDirty = false;
    this.hasExternalChanges = false;
    this.isTableLocked = false;
    this.backglassViewEnabled = false;
    this.is3DMode = false;

    this.scriptEditorWindow = null;
    this.scriptEditorClosePending = false;
    this.closeConfirmed = false;
    this.imageManagerWindow = null;
    this.materialManagerWindow = null;
    this.soundManagerWindow = null;
    this.collectionManagerWindow = null;
    this.dimensionsManagerWindow = null;
    this.renderProbeManagerWindow = null;
    this.searchSelectWindow = null;
    this.meshImportPrimitiveFileName = null;
  }

  updateWindowTitle() {
    if (!this.window || this.window.isDestroyed()) return;

    if (!this.tableName) {
      this.window.setTitle('VPX Editor');
      return;
    }

    const dirtyIndicator = this.isTableDirty ? ' *' : '';
    this.window.setTitle(`VPX Editor - [${this.tableName}.vpx]${dirtyIndicator}`);
  }

  markDirty() {
    if (!this.isTableDirty) {
      this.isTableDirty = true;
      this.closeConfirmed = false;
      this.updateWindowTitle();
    }
  }

  markClean() {
    this.isTableDirty = false;
    this.hasExternalChanges = false;
    this.closeConfirmed = false;
    this.updateWindowTitle();
  }

  closeChildWindows() {
    const windows = [
      this.scriptEditorWindow,
      this.imageManagerWindow,
      this.materialManagerWindow,
      this.soundManagerWindow,
      this.collectionManagerWindow,
      this.dimensionsManagerWindow,
      this.renderProbeManagerWindow,
      this.searchSelectWindow,
    ];

    for (const win of windows) {
      if (win && !win.isDestroyed()) {
        win.destroy();
      }
    }

    this.scriptEditorWindow = null;
    this.imageManagerWindow = null;
    this.materialManagerWindow = null;
    this.soundManagerWindow = null;
    this.collectionManagerWindow = null;
    this.dimensionsManagerWindow = null;
    this.renderProbeManagerWindow = null;
    this.searchSelectWindow = null;
    this.scriptEditorClosePending = false;
  }

  reset() {
    this.closeChildWindows();
    this.extractedDir = null;
    this.currentTablePath = null;
    this.tableName = null;
    this.isTableDirty = false;
    this.hasExternalChanges = false;
    this.isTableLocked = false;
    this.backglassViewEnabled = false;
    this.is3DMode = false;
    this.meshImportPrimitiveFileName = null;
    this.closeConfirmed = false;
    this.updateWindowTitle();
  }

  hasTable() {
    return !!this.extractedDir;
  }
}

export class WindowRegistry {
  constructor() {
    this.windows = new Map();
    this.focusedContext = null;
  }

  add(ctx) {
    this.windows.set(ctx.id, ctx);
  }

  remove(id) {
    const ctx = this.windows.get(id);
    if (ctx === this.focusedContext) {
      this.focusedContext = null;
    }
    this.windows.delete(id);
  }

  get(id) {
    return this.windows.get(id);
  }

  getByWindow(browserWindow) {
    for (const ctx of this.windows.values()) {
      if (ctx.window === browserWindow) {
        return ctx;
      }
    }
    return null;
  }

  getByChildWindow(childWindow) {
    for (const ctx of this.windows.values()) {
      if (
        ctx.scriptEditorWindow === childWindow ||
        ctx.imageManagerWindow === childWindow ||
        ctx.materialManagerWindow === childWindow ||
        ctx.soundManagerWindow === childWindow ||
        ctx.collectionManagerWindow === childWindow ||
        ctx.dimensionsManagerWindow === childWindow ||
        ctx.renderProbeManagerWindow === childWindow ||
        ctx.searchSelectWindow === childWindow
      ) {
        return ctx;
      }
    }
    return null;
  }

  getContextFromEvent(event) {
    const webContents = event.sender;
    const windowId = webContents.windowId;

    if (windowId && this.windows.has(windowId)) {
      return this.windows.get(windowId);
    }

    for (const ctx of this.windows.values()) {
      if (ctx.window?.webContents === webContents) {
        return ctx;
      }
    }

    return this.getByChildWindow(webContents.getOwnerBrowserWindow?.());
  }

  setFocused(ctx) {
    this.focusedContext = ctx;
  }

  getFocused() {
    return this.focusedContext;
  }

  getAll() {
    return Array.from(this.windows.values());
  }

  count() {
    return this.windows.size;
  }

  forEach(callback) {
    this.windows.forEach(callback);
  }

  findByTablePath(vpxPath) {
    if (!vpxPath) return null;
    const normalized = vpxPath.toLowerCase();
    for (const ctx of this.windows.values()) {
      if (ctx.currentTablePath && ctx.currentTablePath.toLowerCase() === normalized) {
        return ctx;
      }
    }
    return null;
  }
}
