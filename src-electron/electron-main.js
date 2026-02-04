import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import log from 'electron-log'
import server from './main-process/server/server.js'

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

// Default download path
const defaultPath = `${app.getPath('downloads')}/Ytdown/`.replace(/\\/g, '/')

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
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD || 'electron-preload.js')
    }
  })

  // Determine the URL to load
  let appUrl = process.env.APP_URL
  if (!appUrl) {
    // Production: load from built files
    const indexPath = path.resolve(__dirname, 'index.html')
    appUrl = `file://${indexPath}`
  }

  // Log the URL being loaded for debugging
  log.info('Loading URL:', appUrl)
  log.info('__dirname:', __dirname)

  mainWindow.loadURL(appUrl)

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Page loaded successfully')
  })

  // Start the Express server for downloads
  server.listen(defaultPath)

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

// File system operations (using handle for invoke calls)
ipcMain.handle('createYtDownFolder', () => {
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath, { recursive: true })
  }
  return defaultPath
})

ipcMain.handle('createVideosFolder', () => {
  const videosPath = `${defaultPath}/videos`.replace(/\\/g, '/')
  if (!fs.existsSync(videosPath)) {
    fs.mkdirSync(videosPath, { recursive: true })
  }
  return videosPath
})

ipcMain.handle('createMusicFolder', () => {
  const musicsPath = `${defaultPath}/musics`.replace(/\\/g, '/')
  if (!fs.existsSync(musicsPath)) {
    fs.mkdirSync(musicsPath, { recursive: true })
  }
  return musicsPath
})

ipcMain.handle('createDatabaseFolder', () => {
  const databasePath = `${defaultPath}/database`.replace(/\\/g, '/')
  if (!fs.existsSync(databasePath)) {
    fs.mkdirSync(databasePath, { recursive: true })
  }
  return databasePath
})

ipcMain.handle('createFileDatabase', () => {
  const databasePath = `${defaultPath}/database`.replace(/\\/g, '/')
  if (!fs.existsSync(`${databasePath}/ytdown.json`)) {
    const yt = { videos: [], musics: [] }
    fs.writeFileSync(`${databasePath}/ytdown.json`, JSON.stringify(yt))
  }
  return `${databasePath}/ytdown.json`
})

ipcMain.handle('getFolderApp', () => {
  return defaultPath
})