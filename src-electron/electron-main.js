import { app, BrowserWindow, nativeTheme, ipcMain, shell } from "electron";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";
import pkg from "electron-updater";
const { autoUpdater } = pkg;
import log from "electron-log";
import * as ytdlp from "./main-process/server/modules/ytdlp/index.js";
import * as database from "./main-process/modules/database.js";
import { createDir } from "./main-process/server/modules/manipulate-files/index.js";

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

// Disable Autofill to suppress DevTools console errors
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication')

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
      // Allow loading local video/audio files
      webSecurity: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD || 'preload/electron-preload.cjs')
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

  // Ensure download folders exist
  database.ensureDatabaseExists(defaultPath)

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

app.whenReady().then(() => {
  createWindow()

  // Check for updates after app is ready (only in production)
  if (process.env.PROD) {
    // Wait a bit for the window to be ready
    setTimeout(() => {
      checkForUpdates()
    }, 3000)
  }
})

// Auto-updater setup
function checkForUpdates() {
  log.info('Checking for updates...')

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available, current version is latest')
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version)
    // Notify the renderer that an update is ready
    if (mainWindow) {
      mainWindow.webContents.send("updateReady", info);
    }
  });

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify()
}

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

ipcMain.handle('openFolder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath)
    return { success: true }
  } catch (err) {
    log.error('Failed to open folder:', err)
    return { success: false, error: err.message }
  }
})

// Download operations via IPC
ipcMain.handle('downloadVideo', async (event, url) => {
  try {
    const info = await ytdlp.getInfo(url)
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, '')
    const outputDir = path.join(defaultPath, `videos/${title}/`)
    createDir(outputDir)

    // Send initial progress
    if (mainWindow) {
      mainWindow.webContents.send("downloadProgress", {
        percent: 0,
        stage: "starting",
        title,
      });
    }

    await ytdlp.downloadVideo(url, outputDir, title, (progress) => {
      log.info(`Download progress: ${progress.percent}%`);
      if (mainWindow) {
        mainWindow.webContents.send("downloadProgress", {
          percent: progress.percent,
          stage: "downloading",
          speed: progress.speed,
          eta: progress.eta,
          title,
        });
      }
    });

    const videoPath = path.join(outputDir, `${title}.mp4`);
    const thumbnail = path.join(outputDir, `${title}.jpg`);

    if (!fs.existsSync(videoPath)) {
      throw new Error("Download failed: Video file not created");
    }

    const videoStats = fs.statSync(videoPath);
    if (videoStats.size === 0) {
      throw new Error("Download failed: video file is empty");
    }

    if (videoStats.size < 100 * 1024) {
      throw new Error(
        "Download failed: Video file too small (possibly corrupted)",
      );
    }

    log.info(`Video validated: ${videoPath} (${videoStats.size} bytes)`);

    if (!fs.existsSync(thumbnailPath)) {
      log.warn("Thumbnail not found, but continuing");
    }

    // Insert into database
    const record = {
      title: title,
      description: info.description,
      thumbnail: `videos/${title}/${title}.jpg`,
      src: `videos/${title}/${title}.mp4`
    }
    database.insertToDatabase(defaultPath, record, 'video')

    // Send completion
    if (mainWindow) {
      mainWindow.webContents.send("downloadProgress", {
        percent: 100,
        stage: "complete",
        title,
      });
    }

    return { success: true, video: record }
  } catch (err) {
    log.error("Download video error:", err);
    if (mainWindow) {
      mainWindow.webContents.send("downloadProgress", {
        percent: 0,
        stage: "error",
        error: err.message,
      });
    }
    throw err;
  }
})

ipcMain.handle('downloadAudio', async (event, url) => {
  try {
    const info = await ytdlp.getInfo(url)
    const title = info.title.replace(/[!?@#$%^&*|\.\;]/g, '')
    const outputDir = path.join(defaultPath, `musics/${title}/`)
    createDir(outputDir)

    // Send initial progress
    if (mainWindow) {
      mainWindow.webContents.send("downloadProgress", {
        percent: 0,
        stage: "starting",
        title,
      });
    }

    const musicPath = await ytdlp.downloadAudio(
      url,
      outputDir,
      title,
      (progress) => {
        log.info(`Download progress: ${progress.percent}%`);
        if (mainWindow) {
          mainWindow.webContents.send("downloadProgress", {
            percent: progress.percent,
            stage: "downloading",
            speed: progress.speed,
            eta: progress.eta,
            title,
          });
        }
      },
    );

    const audioPath = path.join(outputDir, `${title}.mp3`);
    const thumbnailPath = path.join(outputDir, `${title}.jpg`);

    if (!fs.existsSync(audioPath)) {
      throw new Error("Download failed: Audio file not created");
    }

    const audioStats = fs.statSync(audioPath);
    if (audioStats.size === 0) {
      throw new Error("Download failed: Audio file is empty");
    }

    if (audioStats.size < 50 * 1024) {
      throw new Error(
        "Download failed: Audio file too small (possibly corrupted)",
      );
    }

    log.info(`Audio validated: ${audioPath} (${audioStats.size} bytes)`);

    if (!fs.existsSync(thumbnailPath)) {
      log.warn("Thumbnail not found, but continuing");
    }

    // Insert into database
    const record = {
      title: title,
      description: info.description,
      thumbnail: `musics/${title}/${title}.jpg`,
      src: `musics/${title}/${title}.mp3`
    }
    database.insertToDatabase(defaultPath, record, 'mp3')

    // Send completion
    if (mainWindow) {
      mainWindow.webContents.send("downloadProgress", {
        percent: 100,
        stage: "complete",
        title,
      });
    }

    return { success: true, music: record, path: musicPath }
  } catch (err) {
    log.error("Download audio error:", err);
    if (mainWindow) {
      mainWindow.webContents.send("downloadProgress", {
        percent: 0,
        stage: "error",
        error: err.message,
      });
    }
    throw err;
  }
})

ipcMain.handle('getVideoInfo', async (event, url) => {
  try {
    return await ytdlp.getInfo(url)
  } catch (err) {
    log.error('Get video info error:', err)
    throw err
  }
})

ipcMain.handle('getDownloads', async () => {
  return database.readDatabase(defaultPath)
})