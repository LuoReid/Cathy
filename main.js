
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

  ipcMain.on('give-me-a-stream', (event, msg) => {
    const [replyPort] = event.ports
    for (let i = 0; i < msg.count; i++) {
      replyPort.postMessage(msg.element)
    }
    replyPort.close()
  })

  // demo 1
  //createWindow()

  const mainWin = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWin.loadURL('index.html')
  const { port1, port2 } = new MessageChannelMain()
  port2.postMessage({ test: 21 })
  port2.on('message', (e) => {
    console.log('from renderer main world:', e.data)
  })
  port2.start()
  mainWin.webContents.postMessage('main-world-port', null, [port1])

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})  