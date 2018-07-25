import { app, BrowserWindow, ipcMain, autoUpdater, dialog } from 'electron'
import server from './server/server.js'
import fs from 'fs'
/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

const defaultPath = `${app.getPath('downloads')}/Ytdown/`.replace(/\\/g, '/')

let mainWindow

const urlUpdate = 'https://api.github.com/repos/iagocavalcante/qtube/releases/latest'

const startAutoUpdater = (squirrelUrl) => {
  autoUpdater.setFeedURL(squirrelUrl)

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'A new version has been downloaded. Restart the application to apply the updates.'
    }

    dialog.showMessageBox(dialogOpts, (response) => {
      if (response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('error', message => {
    console.error('There was a problem updating the application')
    console.error(message)
  })


  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 60000)
}

const handleSquirrelEvent = () => {
  if (process.argv.length === 1) {
    return false;
  }

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
    case '--squirrel-uninstall':
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
}

if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  app.quit();
}

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

app.on('ready', createWindow)

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
