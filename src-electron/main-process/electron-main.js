import { app, BrowserWindow, ipcMain } from 'electron'
import server from './server/server.js'
// import utilUpdater from './auto-updater/auto-updater.js'
import { autoUpdater } from 'electron-updater'
import fs from 'fs'
const log = require('electron-log')
/**
 * Set `__statics` path to static files in production
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

// configure logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

const defaultPath = `${app.getPath('downloads')}/Ytdown/`.replace(/\\/g, '/')

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    frame: process.env.PROD ? false : true,
    webPreferences: {
      webSecurity: false
    }
  })

  
  mainWindow.loadURL(process.env.APP_URL)
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  server.listen(defaultPath)
}

// when receiving a quitAndInstall signal, quit and install the new version )
ipcMain.on('quitAndInstall', (event, arg) => {
  autoUpdater.quitAndInstall()
})

ipcMain.on('close-app', (event) => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('minimize', (event) => {
  mainWindow.minimize()
})

ipcMain.on('createYtDownFolder', function (event) {

  if (!fs.existsSync(defaultPath)) { //check if default folder already exists
    fs.mkdirSync(defaultPath, '0o765')
    event.returnValue = defaultPath
  } else {
    event.returnValue = defaultPath
  }

})

ipcMain.on('createVideosFolder', function (event) {
  const videosPath = `${defaultPath}/videos`.replace(/\\/g, '/')
  if (!fs.existsSync(videosPath)) { //check if default folder already exists
    fs.mkdirSync(videosPath, '0o765')
    event.returnValue = videosPath
  } else {
    event.returnValue = videosPath
  }
})

ipcMain.on('createDatabaseFolder', function (event) {
  const databasePath = `${defaultPath}/database`.replace(/\\/g, '/')
  if (!fs.existsSync(databasePath)) { //check if default folder already exists
    fs.mkdirSync(databasePath, '0o765')
    event.returnValue = databasePath
  } else {
    event.returnValue = databasePath
  }
})

ipcMain.on('createMusicFolder', function (event) {
  const musicsPath = `${defaultPath}/musics`.replace(/\\/g, '/')
  if (!fs.existsSync(musicsPath)) { //check if default folder already exists
    fs.mkdirSync(musicsPath, '0o765')
    event.returnValue = musicsPath
  } else {
    event.returnValue = musicsPath
  }
})

ipcMain.on('createFileDatabase', function (event) {
  const databasePath = `${defaultPath}/database`.replace(/\\/g, '/')
  if (!fs.existsSync(`${databasePath}/ytdown.json`)) {
    const yt = {
      videos: [],
      musics: [],
    }
    fs.writeFileSync(`${databasePath}/ytdown.json`, JSON.stringify(yt))
    event.returnValue = `${databasePath}/ytdown.json`
  } else {
    event.returnValue = `${databasePath}/ytdown.json`
  }
})

ipcMain.on('getFolderApp', (event) => {
  event.returnValue = defaultPath
})

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()
  createWindow
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

function sendStatusToWindow(text) {
  const dialogOpts = {
      type: 'info',
      buttons: ['Ok'],
      title: 'Atualização do aplicativo',
      message: 'Detalhes:',
      detail: text
  }

  dialog.showMessageBox(dialogOpts)
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});

app.on('ready', function () {
  autoUpdater.checkForUpdatesAndNotify();
  createWindow();
});
