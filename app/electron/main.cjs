const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')

const isDevelopment = Boolean(process.env.ELECTRON_START_URL)

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Ejunz Edge',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDevelopment) {
    void window.loadURL(process.env.ELECTRON_START_URL)
  } else {
    void window.loadFile(path.join(__dirname, '..', 'dist', 'build', 'h5', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
