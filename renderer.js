const info = document.getElementById('info')
info.innerText = `本应用正在使用 Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), 和 Electron (v${versions.electron()})`

const ping = async () => {
  const response = await window.versions.ping()

  console.log(response)
}

ping()

const setBtn = document.getElementById('btn')
const title = document.getElementById('title')
setBtn.addEventListener('click', () => {
  const title = title.value
  console.log(title)
  window.electronAPI.setTitle(title)
})