import { app, BrowserWindow, ipcMain } from 'electron'
import server from './server/server.js'
import fs from 'fs'
/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

const path = `${app.getPath('documents')}/Ytdown/`.replace(/\\/g, '/')
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
  
  server.listen(path)
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
  //check if the default folder exists
  let defaultPath = app.getPath('documents') + '/Ytdown'
  defaultPath = defaultPath.replace(/\\/g, '/') //replaces "frontlaces" with backslashes

  if (!fs.existsSync(defaultPath)) { //check if default folder already exists
    fs.mkdirSync(defaultPath, '0o765')
    event.returnValue = defaultPath
  } else {
    event.returnValue = defaultPath
  }

})

ipcMain.on('createVideosFolder', function (event) {
  let videosPath = app.getPath('documents') + '/Ytdown/videos'
  videosPath = videosPath.replace(/\\/g, '/') //replaces "frontlaces" with backslashes
  if (!fs.existsSync(videosPath)) { //check if default folder already exists
    fs.mkdirSync(videosPath, '0o765')
    event.returnValue = videosPath
  } else {
    event.returnValue = videosPath
  }
})

ipcMain.on('createDatabaseFolder', function (event) {
  let databasePath = app.getPath('documents') + '/Ytdown/database'
  databasePath = databasePath.replace(/\\/g, '/') //replaces "frontlaces" with backslashes
  if (!fs.existsSync(databasePath)) { //check if default folder already exists
    fs.mkdirSync(databasePath, '0o765')
    event.returnValue = databasePath
  } else {
    event.returnValue = databasePath
  }
})

ipcMain.on('createFileDatabase', function (event) {
  let databasePath = app.getPath('documents') + '/Ytdown/database'
  databasePath = databasePath.replace(/\\/g, '/') //replaces "frontlaces" with backslashes
  if (!fs.existsSync(`${databasePath}/ytdown.json`)) {
    const yt = {
      ytdown: []
    }
    fs.writeFileSync(`${databasePath}/ytdown.json`, JSON.stringify(yt))
    event.returnValue = `${databasePath}/ytdown.json`
  } else {
    event.returnValue = `${databasePath}/ytdown.json`
  }
})

ipcMain.on('getFolderApp', (event) => {
  let defaultPath = app.getPath('documents') + '/Ytdown'
  defaultPath = defaultPath.replace(/\\/g, '/') //replaces "frontlaces" with backslashes
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
