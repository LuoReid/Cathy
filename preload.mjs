import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('eAPI', {
  selectExcelFile: () => ipcRenderer.invoke('select-excel-file')
})

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
  counterValue: (value) => ipcRenderer.send('counter-value', value),
  cancelBluetoothRequest: () => ipcRenderer.send('cancel-bluetooth-request'),
  bluetoothPairingRequest: (callback) => ipcRenderer.on('bluetooth-pairing-request', () => callback()),
  bluetoothPairingResponse: (response) => ipcRenderer.send('bluetooth-pairing-response', response),
})

contextBridge.exposeInMainWorld('darkMode', {
  toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
  system: () => ipcRenderer.invoke('dark-mode:system')
})
contextBridge.exposeInMainWorld('shell', { open: () => ipcRenderer.send('shell:open') })

contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName) => ipcRenderer.send('ondragstart', fileName),
  navBack: () => ipcRenderer.send('nav:back'),
  navForward: () => ipcRenderer.send('nav:forward'),
  navCanBack: () => ipcRenderer.send('nav:canBack'),
  navCanForward: () => ipcRenderer.send('nav:canForward'),
  navLoadURL: (url) => ipcRenderer.send('nav:loadURL', url),
  navGetCurrentURL: () => ipcRenderer.send('nav:getCurrentURL'),
  navGetHistory: () => ipcRenderer.send('nav:getHistory'),
  navOnUpdate: (callback) => ipcRenderer.on('nav:update', callback),
})

// const windowLoad = new Promise(resolve => {
//   window.onload = resolve
// })
// ipcRenderer.on('main-world-port', async (e) => {
//   await windowLoad
//   window.postMessage('main-world-port', '*', e.ports)
// })

