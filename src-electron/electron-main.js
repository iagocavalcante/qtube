import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import log from 'electron-log'

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

// configure logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    frame: process.env.PROD ? false : true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: process.env.QUASAR_ELECTRON_PRELOAD ? path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD) : undefined
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC handlers
ipcMain.on('close-app', () => {
  app.quit()
})

ipcMain.on('minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.on('quitAndInstall', () => {
  autoUpdater.quitAndInstall()
})

// File system operations - you may need to adapt these based on your needs
ipcMain.handle('createYtDownFolder', async () => {
  // Implement your folder creation logic here
  return true
})

ipcMain.handle('createVideosFolder', async () => {
  // Implement your folder creation logic here
  return true
})

ipcMain.handle('createMusicFolder', async () => {
  // Implement your folder creation logic here
  return true
})

ipcMain.handle('createDatabaseFolder', async () => {
  // Implement your folder creation logic here
  return true
})

ipcMain.handle('createFileDatabase', async () => {
  // Implement your database creation logic here
  return true
})

ipcMain.handle('getFolderApp', async () => {
  // Return the app's download directory
  const downloadsPath = app.getPath('downloads')
  return `${downloadsPath}/Ytdown/`
})