
const { globalShortcut } = require('electron')
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

  let grantedDeviceThroughPermHandler
  win.webContents.session.on('select-usb-device', (event, details, callback) => {
    win.webContents.session.on('usb-device-added', (event, device) => {
      console.log('usb-device added:', device)
    })
    win.webContents.session.on('usb-device-removed', (event, device) => {
      console.log('usb-device removed:', device)
    })
    event.preventDefault()
    if (details.deviceList && details.deviceList.length > 0) {
      const deviceToReturn = details.deviceList
        .find(device => !grantedDeviceThroughPermHandler ||
          device.deviceId !== grantedDeviceThroughPermHandler.deviceId)
      if (deviceToReturn) { callback(deviceToReturn.deviceId) } else { callback() }
    }
  })
  win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return (permission === 'usb' && details.securityOrigin === 'file:///')
  })
  win.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'usb' && details.origin === 'file:///') {
      grantedDeviceThroughPermHandler = details
      return true
    }
    return false
  })
  win.webContents.session.setUSBProtectedClassesHandler((details) => {
    return details.protectedClasses.filter(usbClass => usbClass.indexOf('audio') === -1)
  })

  win.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault()
    selectBluetoothCallback = callback
    console.log('devices:', deviceList)
    const result = deviceList.find(device => device.deviceName === 'xPhone8')
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

  win.webContents.session.on('select-hid-device', (event, devices, callback) => {
    win.webContents.session.on('hid-device-added', (event, device) => {
      console.log('hid-device added:', device)
    })
    win.webContents.session.on('hid-device-removed', (event, device) => {
      console.log('hid-device removed:', device)
    })
    event.preventDefault()
    if (details.deviceList && details.deviceList.length > 0) {
      callback(details.deviceList[0].deviceId)
    }
  })
  win.webContents.session.setPermissionCheckHandler((webContents, permission, details) => {
    if (permission === 'hid' && details.securityOrigin === 'file:///') {
      return true
    }
  })
  win.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid' && details.origin === 'file:///') {
      return true
    }
  })

  win.webContents.session.on('select-serial-port', (event, ports, webContents, callback) => {
    win.webContents.session.on('serial-port-added', (event, port) => {
      console.log('serial-port added:', port)
    })
    win.webContents.session.on('serial-port-removed', (event, port) => {
      console.log('serial-port removed:', port)
    })
    event.preventDefault()
    if (ports && ports.length > 0) {
      callback(ports[0].portId)
    } else { callback('') }
  })
  win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    return (permission === 'serial' && details.securityOrigin === 'file:///')
  })
  win.webContents.session.setDevicePermissionHandler((details) => {
    return (details.deviceType === 'serial' && details.origin === 'file:///')
  })

  const menu = Menu.buildFromTemplate([
    {
      label: 'Increment',
      click: async () => win.webContents.send('update-counter', 1)
    },
    {
      label: 'Decrement',
      click: async () => win.webContents.send('update-counter', -1)
    },
    {
      label: 'Help',
      accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
      click: async () => console.log('Electron rocks!')
    }
  ])
  Menu.setApplicationMenu(menu)

  win.loadFile('index.html')
  win.webContents.openDevTools()
}

// app.enableSandbox()
// app.commandLine.appendSwitch('disable-hid-blocklist')
app.whenReady().then(() => {
  globalShortcut.register('Alt+CommandOrControl+I', () => {
    console.log('Electron loves global shortcuts!')
  })
}).then(() => {
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