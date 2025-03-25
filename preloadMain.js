const { ipcRenderer } = require('electron')

ipcRenderer.on('port', e => {
    window.electronMessagePort = e.ports[0]
    window.electronMessagePort.onmessage = me => {
        console.log('message from main:', me.data)
    }
})