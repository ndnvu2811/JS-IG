const { BrowserWindow } = require('electron');
const path = require('path');

let mainWindow = null;

/**
 * Create and configure the main window
 */
function createWindow(app) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1d29',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../public/icon.png')
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Cleanup when window closes
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // When user closes window, quit app
  mainWindow.on('close', (event) => {
    console.log('📍 Window close event - quitting app');
    const { app } = require('electron');
    app.quit();
  });

  return mainWindow;
}

/**
 * Get the main window instance
 */
function getMainWindow() {
  return mainWindow;
}

/**
 * Setup CSP and security headers
 */
function setupSecurityHeaders(session) {
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' http://localhost:5678; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: http: https: avatar: media-file: blob:; media-src 'self' data: http: https: avatar: media-file: blob:; connect-src 'self' http://localhost:5678 http://localhost:* https:;"
        ]
      }
    });
  });
}

module.exports = {
  createWindow,
  getMainWindow,
  setupSecurityHeaders,
};
