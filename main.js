
const { app, BrowserWindow, ipcMain, dialog, Menu, MessageChannelMain } = require('electron/main')
const path = require('node:path')

// require('update-electron-app')() // an error when start in win

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

app.enableSandbox()

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', handleOpenFile)
  ipcMain.handle('ping', (_event, ping) => {
    console.log('ping in main:', ping)
    return 'pong'
  })

  ipcMain.on('set-title', handleSetTitle)
  ipcMain.on('counter-value', (_event, value) => console.log('counter value in main:', value))

  // demo 1
  // createWindow()

  const mainWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preloadMain.js')
    }
  })
  const secondWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: false,
      preload: path.join(__dirname, 'preloadSecond.js')
    }
  })
  const { port1, port2 } = new MessageChannelMain()
  mainWindow.once('ready-to-show', () => {
    mainWindow.webContents.postMessage('port', null, [port1])
  })
  secondWindow.once('ready-to-show', () => {
    secondWindow.webContents.postMessage('port', null, [port2])
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})  