const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: (ping) => ipcRenderer.invoke('ping', ping),
  setTitle: (title) => ipcRenderer.invoke('setTitle', title),
})
contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  setTitle: (title) => ipcRenderer.send('set-title', title),
  onUpdateCounter: (callback) => ipcRenderer.on('update-counter', (_event, value) => callback(value)),
  counterValue: (value) => ipcRenderer.send('counter-value', value)
})