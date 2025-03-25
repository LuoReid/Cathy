const info = document.getElementById('info')
info.innerText = `本应用正在使用 Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), 和 Electron (v${versions.electron()})`

const ping = async () => {
  const response = await window.versions.ping()

  console.log(response)
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