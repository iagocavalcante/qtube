import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import server from './server/server.js'
import { autoUpdater } from 'electron-updater'
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

// const urlUpdate = 'https://api.github.com/repos/iagocavalcante/qtube/releases/latest'

// autoUpdater.setFeedURL(urlUpdate)

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

  autoUpdater.checkForUpdates()

  server.listen(defaultPath)
}

// when the update has been downloaded and is ready to be installed, notify the BrowserWindow
autoUpdater.on('update-downloaded', (info, releaseNotes, releaseName) => {
  console.log(info)
  let message = `${app.getName()} ${releaseName}  is now available. It will be installed the next time you restart the application.`
		if (releaseNotes) {
			const splitNotes = releaseNotes.split(/[^\r]\n/)
			message += '\n\nRelease notes:\n'
			splitNotes.forEach(notes => {
				message += `${notes} \n\n`
			})
		}
		// Ask user to update the app
		dialog.showMessageBox({
			type: 'question',
			buttons: ['Install and Relaunch', 'Later'],
			defaultId: 0,
			message: `A new version of ${app.getName()} has been downloaded`,
			detail: message
		}, response => {
			if (response === 0) {
				setTimeout(() => autoUpdater.quitAndInstall(), 1)
			}
		})
  mainWindow.webContents.send('updateReady')
});

// when receiving a quitAndInstall signal, quit and install the new version ;)
ipcMain.on("quitAndInstall", (event, arg) => {
  autoUpdater.quitAndInstall();
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
