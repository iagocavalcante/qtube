import log from "electron-log";

export function sendToRenderer(mainWindow, channel, data) {
  if (!mainWindow) {
    log.warn(`Cannot send to ${channel}: window not available`);
    return false;
  }

  try {
    mainWindow.webContents.send(channel, data);
    return true;
  } catch (error) {
    log.error(`Failed to send to ${channel}: `, error);
    return false;
  }
}
