const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('materialManager', {
  onInit: callback => ipcRenderer.on('init', (event, data) => callback(data)),
  onSetDisabled: callback => ipcRenderer.on('set-disabled', (event, disabled) => callback(disabled)),
  onThemeChanged: callback => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),
  readFile: filePath => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  updateItemMaterial: (itemName, itemType, oldMaterial, newMaterial) =>
    ipcRenderer.invoke('update-item-material', itemName, itemType, oldMaterial, newMaterial),
  confirm: message => ipcRenderer.invoke('confirm-dialog', message),
  selectItem: itemName => ipcRenderer.send('select-item', itemName),
  notifyMaterialsChanged: () => ipcRenderer.send('materials-changed'),
  undoBegin: description => ipcRenderer.send('undo-begin', description),
  undoEnd: () => ipcRenderer.send('undo-end'),
  undoCancel: () => ipcRenderer.send('undo-cancel'),
  undoMarkMaterials: () => ipcRenderer.send('undo-mark-materials'),
  undoMarkMaterialCreate: materialName => ipcRenderer.send('undo-mark-material-create', materialName),
  undoMarkMaterialDelete: (materialName, materialData) =>
    ipcRenderer.send('undo-mark-material-delete', materialName, materialData),
  undoMarkForUndo: itemName => ipcRenderer.send('undo-mark-for-undo', itemName),
  undoMarkGamedata: () => ipcRenderer.send('undo-mark-gamedata'),
});
