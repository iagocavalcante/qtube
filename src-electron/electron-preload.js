/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.js you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * })
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp: () => ipcRenderer.send('close-app'),
  minimize: () => ipcRenderer.send('minimize'),
  quitAndInstall: () => ipcRenderer.send('quitAndInstall'),

  // File system operations
  createYtDownFolder: () => ipcRenderer.invoke('createYtDownFolder'),
  createVideosFolder: () => ipcRenderer.invoke('createVideosFolder'),
  createMusicFolder: () => ipcRenderer.invoke('createMusicFolder'),
  createDatabaseFolder: () => ipcRenderer.invoke('createDatabaseFolder'),
  createFileDatabase: () => ipcRenderer.invoke('createFileDatabase'),
  getFolderApp: () => ipcRenderer.invoke('getFolderApp'),

  // Download operations
  downloadVideo: (url) => ipcRenderer.invoke('downloadVideo', url),
  downloadAudio: (url) => ipcRenderer.invoke('downloadAudio', url),
  getVideoInfo: (url) => ipcRenderer.invoke('getVideoInfo', url),
  getDownloads: () => ipcRenderer.invoke('getDownloads'),
  openFolder: (folderPath) => ipcRenderer.invoke('openFolder', folderPath),

  // Download progress events
  onDownloadProgress: (callback) => {
    ipcRenderer.on('downloadProgress', (event, progress) => callback(progress))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('downloadProgress')
  },

  // Event listeners for auto-update
  onUpdateReady: (callback) => ipcRenderer.on('updateReady', (event, info) => callback(info)),
  removeUpdateListener: () => ipcRenderer.removeAllListeners('updateReady')
})