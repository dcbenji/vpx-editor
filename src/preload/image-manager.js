const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('imageManager', {
  onInit: callback => ipcRenderer.on('init', (event, data) => callback(data)),
  onSetDisabled: callback => ipcRenderer.on('set-disabled', (event, disabled) => callback(disabled)),
  onThemeChanged: callback => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),
  getImageInfo: imagePath => ipcRenderer.invoke('get-image-info', imagePath),
  readBinaryFile: filePath => ipcRenderer.invoke('read-binary-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  importImage: () => ipcRenderer.invoke('import-image'),
  exportImage: (srcPath, suggestedName) => ipcRenderer.invoke('export-image', srcPath, suggestedName),
  deleteFile: filePath => ipcRenderer.invoke('delete-file', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  updateItemImage: (itemName, itemType, oldImage, newImage) =>
    ipcRenderer.invoke('update-item-image', itemName, itemType, oldImage, newImage),
  confirm: message => ipcRenderer.invoke('confirm-dialog', message),
  selectItem: itemName => ipcRenderer.send('select-item', itemName),
  notifyImagesChanged: () => ipcRenderer.send('images-changed'),
  undoBegin: description => ipcRenderer.send('undo-begin', description),
  undoEnd: () => ipcRenderer.send('undo-end'),
  undoCancel: () => ipcRenderer.send('undo-cancel'),
  undoMarkImages: () => ipcRenderer.send('undo-mark-images'),
  undoMarkImageCreate: imageName => ipcRenderer.send('undo-mark-image-create', imageName),
  undoMarkImageDelete: (imageName, imageData, filePath) =>
    ipcRenderer.send('undo-mark-image-delete', imageName, imageData, filePath),
  undoMarkForUndo: itemName => ipcRenderer.send('undo-mark-for-undo', itemName),
  undoMarkGamedata: () => ipcRenderer.send('undo-mark-gamedata'),
});
