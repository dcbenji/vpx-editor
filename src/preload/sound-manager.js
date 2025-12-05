const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soundManager', {
  onInit: callback => ipcRenderer.on('init', (event, data) => callback(data)),
  onSetDisabled: callback => ipcRenderer.on('set-disabled', (event, disabled) => callback(disabled)),
  onThemeChanged: callback => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),
  readFile: filePath => ipcRenderer.invoke('read-file', filePath),
  readBinaryFile: filePath => ipcRenderer.invoke('read-binary-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  listDir: dirPath => ipcRenderer.invoke('list-dir', dirPath),
  getSoundInfo: soundPath => ipcRenderer.invoke('get-sound-info', soundPath),
  importSound: () => ipcRenderer.invoke('import-sound'),
  exportSound: (srcPath, suggestedName) => ipcRenderer.invoke('export-sound', srcPath, suggestedName),
  deleteFile: filePath => ipcRenderer.invoke('delete-file', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  confirm: message => ipcRenderer.invoke('confirm-dialog', message),
  notifySoundsChanged: () => ipcRenderer.send('sounds-changed'),
});
