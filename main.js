
const { globalShortcut } = require('electron')
const { app, BrowserWindow, ipcMain, dialog, Menu, MessageChannelMain, nativeTheme, shell, WebContentsView, Notification } = require('electron/main')
const path = require('node:path')
const fs = require('node:fs')
const https = require('node:https')

// require('update-electron-app')() // an error when start in win

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('electron-fiddle', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('electron-api')
}
let mainWindow
let bluetoothPinCallback
let selectBluetoothCallback
let progressInterval

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
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // sandbox: false,
      // nodeIntegration: true,
      // nodeIntegrationInWorker: true,
      contextIsolation: true,
      // offscreen: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  const win = mainWindow
  mainWindow.webContents.on('paint', (_event, dirty, image) => {
    fs.writeFileSync('ex.png', image.toPNG())
  })
  mainWindow.webContents.setFrameRate(60)
  console.log(`The screenshot has been successfully saved to ${path.join(process.cwd(), 'ex.png')}`)

  const view = new WebContentsView()
  mainWindow.setContentView(view)
  view.setBounds({ x: 0, y: 0, width: 600, height: 600 })
  const navHistory = view.webContents.navigationHistory
  console.log('navHistory:', navHistory)
  ipcMain.handle('nav:back', () => navHistory.goBack())
  ipcMain.handle('nav:forward', () => navHistory.goForward())
  ipcMain.handle('nav:canBack', () => navHistory.canGoBack())
  ipcMain.handle('nav:canForward', () => navHistory.canGoForward())
  ipcMain.handle('nav:loadURL', (_event, url) => view.webContents.loadURL(url))
  ipcMain.handle('nav:getCurrentURL', () => view.webContents.getURL())
  ipcMain.handle('nav:getHistory', () => navHistory.getAllEntries())
  view.webContents.on('did-navigate-in-page', () => { mainWindow.webContents.send('nav:update') })

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
    },
    {
      label: 'Open Recent',
      role: 'recentDocuments',
    },
    {
      label: 'Clear Recent',
      role: 'clearRecentDocuments',
    }
  ])
  Menu.setApplicationMenu(menu)

  win.loadFile('index.html')
  // win.webContents.openDevTools()

  const INCREMENT = 0.03
  const INTERVAL_DELAY = 100 // ms
  let c = 0
  progressInterval = setInterval(() => {
    win.setProgressBar(c)
    if (c < 2) {
      c += INCREMENT
    } else {
      c = (-INCREMENT * 5)
    }
  }, INTERVAL_DELAY)
}

// const iconName = path.join(__dirname, 'icon.png')
// const icon = fs.createWriteStream(iconName)
// fs.writeFileSync(path.join(__dirname, 'drag-and-drop-1.md'), 'https://www.electronjs.org/docs/api/native-image')
// fs.writeFileSync(path.join(__dirname, 'drag-and-drop-2.md'), 'Second file to test drag and drop')
// https.get('https://www.electronjs.org/zh/assets/img/logo.svg', (response) => {
//   response.pipe(icon)
// })

// app.enableSandbox()
// app.commandLine.appendSwitch('disable-hid-blocklist')
app.disableHardwareAcceleration()

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    dialog.showErrorBox('Welcome back', `You arrived from ${_commandLine.pop()}`)
  })
  app.on('open-url', (event, url) => {
    dialog.showErrorBox('Welcome back', `You arrived from ${url}`)
  })
}

const NOTIFICATION_TITLE = 'Basic Notification'
const NOTIFICATION_BODY = 'Notification from the Main process'
function showNotification() {
  new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show()
}

const fileName = 'recently-used.md'
fs.writeFileSync(fileName, 'Lorem Ipsum', () => {
  app.addRecentDocument(path.join(__dirname, fileName))
})

app.whenReady().then(() => {
  globalShortcut.register('Alt+CommandOrControl+I', () => {
    console.log('Electron loves global shortcuts!')
  })
}).then(createWindow).then(showNotification)

app.on('window-all-closed', () => {
  app.clearRecentDocuments()
  if (process.platform !== 'darwin') app.quit()
})
app.on('before-quit', () => {
  clearInterval(progressInterval)
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('shell:open', () => {
  const pageDirectory = __dirname.replace('app.asar', 'app.asar.unpacked')
  const pagePath = path.join('file://', pageDirectory, 'index.html')
  shell.openExternal(pagePath)
})

ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: path.join(__dirname, filePath),
    icon: path.join(__dirname, 'icon.png')
  })
})

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