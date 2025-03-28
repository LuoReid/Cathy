
import { globalShortcut, nativeImage } from 'electron'
import { app, BrowserWindow, ipcMain, dialog, Menu,
    MessageChannelMain, nativeTheme, shell, WebContentsView,
    Notification, Tray } from 'electron/main'
import path  from 'node:path'

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
let tray
 

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        titleBarStyle: 'hidden',
        frame: false,
        webPreferences: {
            // sandbox: false,
            // nodeIntegration: true,
            // nodeIntegrationInWorker: true,
            contextIsolation: true,
            spellcheck: true,
            // offscreen: true,
            preload: path.join(__dirname, 'preload.mjs')
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
    app.setUserTasks([])
    // mainWindow.setThumbarButtons([])
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})
app.setUserTasks([
    {
        program: process.execPath, arguments: '--new-window',
        iconPath: process.execPath, iconIndex: 0,
        title: 'New Window', description: 'Create a new window'
    },
])

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

