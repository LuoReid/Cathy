
const { globalShortcut, nativeImage } = require('electron')
const { app, BrowserWindow, ipcMain, dialog, Menu,
    MessageChannelMain, nativeTheme, shell, WebContentsView,
    Notification, Tray } = require('electron/main')
const path = require('node:path')
const fs = require('node:fs')
const https = require('node:https')
const os = require('node:os')



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
let tray


const createWindow = async () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // sandbox: false,
            // nodeIntegration: true,
            // nodeIntegrationInWorker: true,
            contextIsolation: true,
            // spellcheck: true,
            // offscreen: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    const win = mainWindow

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

    win.loadURL('http://localhost:5173/')
    win.webContents.openDevTools()
}

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

app.whenReady().then(() => {
    globalShortcut.register('Alt+CommandOrControl+I', () => {
        console.log('Electron loves global shortcuts!')
    })
}).then(createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
app.on('before-quit', () => {
    clearInterval(progressInterval)
    // app.setUserTasks([])
    // mainWindow.setThumbarButtons([])
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

ipcMain.handle('select-excel-file', async () => {
    try {
        const { filePaths } = await dialog.showOpenDialog({})
        if (!filePaths.length) return null
        const buffer = await fs.readFile(filePaths[0])
        return { name: path.basename(filePaths[0]), data: buffer }
    } catch (error) {
        console.log('read file error:' + error.message)
    }
})