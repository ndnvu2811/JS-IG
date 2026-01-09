const { ipcMain, dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { getChromePath, saveChromeSettings, loadChromeSettings, validateChromePath } = require('../chrome-config');

/**
 * ============================================
 * CHROME SETTINGS HANDLERS
 * ============================================
 */
function registerChromeHandlers() {
  ipcMain.handle('get-chrome-path', () => {
    return getChromePath();
  });

  ipcMain.handle('get-chrome-settings', async () => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'chrome-settings.json');
      if (fs.existsSync(settingsPath)) {
        const data = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error reading settings:', error);
      return null;
    }
  });

  ipcMain.handle('browse-chrome-path', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Chrome Executable',
      filters: [{ name: 'Chrome/Chromium', extensions: ['exe'] }],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('save-chrome-settings', async (event, settings) => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'chrome-settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('test-chrome-path', async (event, chromePath) => {
    try {
      const { chromium } = require('playwright-core');
      const browser = await chromium.launch({
        executablePath: chromePath,
        headless: true,
        timeout: 5000
      });
      await browser.close();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerChromeHandlers };
