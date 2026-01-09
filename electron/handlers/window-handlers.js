const { ipcMain } = require('electron');
const { getMainWindow } = require('../window-manager');

/**
 * ============================================
 * WINDOW CONTROL HANDLERS
 * ============================================
 */
function registerWindowHandlers() {
  ipcMain.on('window-minimize', () => {
    const window = getMainWindow();
    if (window) window.minimize();
  });

  ipcMain.on('window-maximize', () => {
    const window = getMainWindow();
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    const window = getMainWindow();
    if (window) window.close();
  });
}

module.exports = { registerWindowHandlers };
