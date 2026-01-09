const { ipcMain } = require('electron');
const { openBrowser, closeBrowser, isBrowserOpen } = require('../instagram-browser');

/**
 * ============================================
 * BROWSER MANAGEMENT HANDLERS
 * ============================================
 */
function registerBrowserHandlers() {
  ipcMain.on('open-instagram-browser', async (event, { accountId, username, cookies, mobileMode }) => {
    console.log('📨 Received request to open browser:', username);
    const result = await openBrowser(accountId, username, cookies, mobileMode);
    
    if (result.success) {
      event.reply('open-browser-success', { accountId });
    } else {
      event.reply('open-browser-error', { accountId, error: result.error });
    }
  });

  ipcMain.on('close-instagram-browser', async (event, { accountId }) => {
    console.log('📨 Received request to close browser:', accountId);
    const result = await closeBrowser(accountId);
    
    if (result.success) {
      event.reply('close-browser-success', { accountId });
    } else {
      event.reply('close-browser-error', { accountId, error: result.error });
    }
  });

  ipcMain.on('check-browser-status', (event, { accountId }) => {
    const isOpen = isBrowserOpen(accountId);
    event.reply('browser-status-response', { accountId, isOpen });
  });
}

module.exports = { registerBrowserHandlers };
