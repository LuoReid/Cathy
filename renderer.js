
const info = document.getElementById('info')
info.innerText = `本应用正在使用 Node.js (v${versions.node()}), Chrome (v${versions.chrome()}), 和 Electron (v${versions.electron()})`

const ping = async () => {
  const response = await window.versions.ping('ping')
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

document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
  const isDarkMode = await window.darkMode.toggle()
  document.getElementById('theme-source').innerHTML = isDarkMode ? 'Dark' : 'Light'
})
document.getElementById('reset-to-system').addEventListener('click', async () => {
  await window.darkMode.system()
  document.getElementById('theme-source').innerHTML = 'System'
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, window.versions[type]())
  }
})

async function testIt() {
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true
  })
  document.getElementById('device-name').innerText = device.name || `ID: ${device.id}`
}
document.getElementById('clickme').addEventListener('click', testIt)
function cancelRequest() {
  window.electronAPI.cancelBluetoothRequest()
}
document.getElementById('cancel').addEventListener('click', cancelRequest)
window.electronAPI.bluetoothPairingRequest((event, details) => {
  console.log('pairing request:', details)
  const respose = {}
  switch (details.pairingKind) {
    case 'confirm': {
      respose.confirmed = window.confirm(`Do you want to connect to device ${details.deviceId}?`)
      break
    }
    case 'confirmPin': {
      respose.confirmed = window.confirm(`Does the pin ${details.pin} match the pin displayed on device ${details.deviceId}?`)
      break
    }
    case 'providePin': {
      const pin = window.prompt(`Please provide a pin for ${details.deviceId}`)
      if (pin) {
        respose.pin = pin
        respose.confirmed = true
      } else {
        respose.confirmed = false
      }
    }
  }
  window.electronAPI.bluetoothPairingResponse(respose)
})

function formatDevices(devices) {
  return devices.map(device => device.productName).join('<hr>')
}
async function testHid() {
  document.getElementById('granted-devices').innerHTML = formatDevices(await navigator.hid.getDevices())
  document.getElementById('granted-devices2').innerHTML = formatDevices(await navigator.hid.requestDevice({ filters: [] }))
}
document.getElementById('clickhid').addEventListener('click', testHid)

async function testSerial() {
  const filters = [
    { usbVendorId: 0x2341, usbProductId: 0x0043 },
    { usbVendorId: 0x2341, usbProductId: 0x0001 }
  ]
  try {
    const port = await navigator.serial.requestPort({ filters })
    const portInfo = port.getInfo()
    document.getElementById('device-serial').innerText = `vendorId: ${portInfo.usbVendorId} | productId: ${portInfo.usbProductId}`
  } catch (ex) {
    if (ex.name === 'NotFoundError') {
      document.getElementById('device-serial').innerText = 'Device NOT found'
    } else {
      document.getElementById('device-serial').innerText = ex
    }
  }
}
document.getElementById('clickSerial').addEventListener('click', testSerial)

function getDeviceDetails(device) {
  return device.productName || `Unknown device${device.deviceId}`
}
async function testUsb() {
  const noDeviceFoundMsg = 'No device found'
  const grantedDevices = await navigator.usb.getDevices()
  console.log('granted devices:', grantedDevices)
  let grantedDeviceList = ''
  if (grantedDevices.length > 0) {
    for (const d of grantedDevices) {
      grantedDeviceList += `<hr>${getDeviceDetails(d)}</hr>`
    }
  } else {
    grantedDeviceList = noDeviceFoundMsg
  }
  document.getElementById('granted-devices-usb').innerHTML = grantedDeviceList

  grantedDeviceList = ''
  try {
    const grantedDevice = await navigator.usb.requestDevice({ filters: [] })
    console.log('requested device:', grantedDevice)
    grantedDeviceList += `<hr>${getDeviceDetails(grantedDevice)}</hr>`
  } catch (ex) {
    if (ex.name === 'NotFoundError') {
      grantedDeviceList = noDeviceFoundMsg
    }
  }
  document.getElementById('granted-devices2-usb').innerHTML = grantedDeviceList
}
document.getElementById('clickusb').addEventListener('click', testUsb)

document.getElementById('open-in-browser').addEventListener('click', () => {
  window.shell.open()
})
// window.electronMessagePort.postMessage('ping')
// const makeStreamingRequest = (element, callback) => {
//   const { port1, port2 } = new MessageChannel()
//   ipcRenderer.postMessage('give-me-a-stream', { element, count: 10 }, [port2])
//   port1.onmessage = (e) => callback(e.data)
//   port1.onclose = () => console.log('stream ended')
// }
// makeStreamingRequest(42, (data) => { console.log('got response data:', data) })


