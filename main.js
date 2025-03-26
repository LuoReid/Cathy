
const { app, BrowserWindow, ipcMain, dialog, Menu, MessageChannelMain, nativeTheme } = require('electron/main')
const path = require('node:path')

// require('update-electron-app')() // an error when start in win

let bluetoothPinCallback
let selectBluetoothCallback

function handleSetTitle(event, title) {
  const webContents = event.sender
  const win = BrowserWindow.fromWebContents(webContents)
  win.setTitle(title)
}

async function handleOpenFile() {
  const { cancelled, filePaths } = await dialog.showOpenDialog({})
  if (!cancelled) {
    return filePaths[0]
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // sandbox: false,
      // nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    selectBluetoothCallback = callback
    console.log('devices:', deviceList)
    const result = deviceList.find(device => device.deviceName === 'xPhone')
    if (result) { callback(result.deviceId) } else { console.log('no device found') }
  })
  ipcMain.on('cancel-bluetooth-request', (event) => {
    selectBluetoothCallback('')
  })
  ipcMain.on('bluetooth-pairing-response', (event, response) => {
    bluetoothPinCallback(response)
  })
  win.webContents.session.setBluetoothPairingHandler((details, callback) => {
    bluetoothPinCallback = callback
    win.webContents.send('bluetooth-pairing-request', details)
  })

  const menu = Menu.buildFromTemplate([
    {
      label: 'Increment',
      click: async () => win.webContents.send('update-counter', 1)
    },
    {
      label: 'Decrement',
      click: async () => win.webContents.send('update-counter', -1)
    }
  ])
  Menu.setApplicationMenu(menu)

  win.loadFile('index.html')
}

// app.enableSandbox()
app.commandLine.appendSwitch('disable-hid-blocklist')
app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleOpenFile)
  ipcMain.handle('ping', (_event, ping) => {
    console.log('ping in main:', ping)
    return 'pong'
  })

  ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light'
    } else {
      nativeTheme.themeSource = 'dark'
    }
    return nativeTheme.shouldUseDarkColors
  })
  ipcMain.handle('dark-mode:system', () => {
    nativeTheme.themeSource = 'system'
  })

  ipcMain.on('set-title', handleSetTitle)
  ipcMain.on('counter-value', (_event, value) => console.log('counter value in main:', value))

  // ipcMain.on('give-me-a-stream', (event, msg) => {
  //   const [replyPort] = event.ports
  //   for (let i = 0; i < msg.count; i++) {
  //     replyPort.postMessage(msg.element)
  //   }
  //   replyPort.close()
  // })

  // demo 1
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})  