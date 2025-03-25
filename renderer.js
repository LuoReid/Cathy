const { ipcRenderer } = require("electron/renderer")

const info = document.getElementById('info')
info.innerText = `本应用正在使用 Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), 和 Electron (v${versions.electron()})`

const ping = () => {
  const response = window.versions.ping('ping')
  console.log('ping in render:', response)
}
ping()

const setBtn = document.getElementById('btn')
const titleLabel = document.getElementById('title')
setBtn.addEventListener('click', () => {
  const title = titleLabel.value
  console.log(title)
  window.electronAPI.setTitle(title)
})

const openFileBtn = document.getElementById('btnOpenFile')
const filePathLabel = document.getElementById('filePath')
openFileBtn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  console.log(filePath)
  filePathLabel.innerText = filePath
})

const counterLabel = document.getElementById('counter')
window.electronAPI.onUpdateCounter((value) => {
  const oldValue = Number(counterLabel.innerText)
  const newValue = oldValue + value
  counterLabel.innerText = newValue.toString()
  window.electronAPI.counterValue(newValue)
})

window.electronMessagePort.postMessage('ping')

const makeStreamingRequest = (element, callback) => {
  const { port1, port2 } = new MessageChannel()
  ipcRenderer.postMessage('give-me-a-stream', { element, count: 10 }, [port2])
  port1.onmessage = (e) => callback(e.data)
  port1.onclose = () => console.log('stream ended')
}
makeStreamingRequest(42, (data) => { console.log('got response data:', data) })