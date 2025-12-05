const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('renderProbeManager', {
  onInit: callback => ipcRenderer.on('init', (event, data) => callback(data)),
  onThemeChanged: callback => ipcRenderer.on('theme-changed', (event, theme) => callback(theme)),
  onSetDisabled: callback => ipcRenderer.on('set-disabled', (event, disabled) => callback(disabled)),
  readFile: filePath => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  notifyRenderProbesChanged: () => ipcRenderer.send('renderprobes-changed'),
  undoBegin: description => ipcRenderer.send('undo-begin', description),
  undoEnd: () => ipcRenderer.send('undo-end'),
  undoCancel: () => ipcRenderer.send('undo-cancel'),
  undoMarkRenderProbes: () => ipcRenderer.send('undo-mark-renderprobes'),
  undoMarkRenderProbeCreate: probeName => ipcRenderer.send('undo-mark-renderprobe-create', probeName),
  undoMarkRenderProbeDelete: (probeName, probeData) =>
    ipcRenderer.send('undo-mark-renderprobe-delete', probeName, probeData),
});
