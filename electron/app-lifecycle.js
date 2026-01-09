const { app, session, protocol } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { createWindow, getMainWindow, setupSecurityHeaders } = require('./window-manager');
const { registerAllHandlers } = require('./handlers');
const { setupStorageSyncHandlers } = require('./storage-sync');
const { startScheduler, stopScheduler } = require('./post-scheduler');
const { startReelScheduler, stopReelScheduler } = require('./reel-scheduler');
const { startCareScheduler, stopCareScheduler } = require('./care-scheduler');
const { ensureMediaDirectories } = require('./media-paths');
const { migrateMediaFiles } = require('./media-migration');
const { closeAllBrowsers } = require('./instagram-browser');

// ✅ Setup app data path - use same folder as app when possible
// When installed, fallback to AppData folder (inside app.asar can't create folders)
const getAppUserDataPath = () => {
  try {
    const appPath = app.getAppPath();
    const userDataPath = path.join(appPath, 'data');
    
    // Check if path is inside app.asar (installed version) or directory is writable
    if (appPath.includes('app.asar') || !fs.existsSync(path.dirname(userDataPath))) {
      // Fallback: Use AppData for installed version
      console.log('📁 App is in app.asar (installed), using AppData path');
      const appDataPath = path.join(os.homedir(), 'AppData', 'Local', 'Instagram-Tool-Care');
      return appDataPath;
    }
    
    // Dev/portable mode: use app-relative path
    return userDataPath;
  } catch (error) {
    console.error('❌ Error determining userData path:', error.message);
    // Ultimate fallback
    return path.join(os.homedir(), 'AppData', 'Local', 'Instagram-Tool-Care');
  }
};

// Initialize userData path
const userDataPath = getAppUserDataPath();
const cachePath = path.join(userDataPath, 'cache');

// ✅ Set app userData path so all getPath('userData') calls use our path
app.setPath('userData', userDataPath);

// Create the new directory if it doesn't exist
if (!fs.existsSync(userDataPath)) {
  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    console.log('📁 Created userDataPath:', userDataPath);
  } catch (error) {
    console.error('❌ Error creating userData directory:', error.message);
  }
}

app.setPath('userData', userDataPath);
app.setPath('cache', cachePath);  // ← Separate cache path for browser cache

// Disable security warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

/**
 * Create junction points from root folders to cache/ subfolders
 * This keeps tree view clean while redirecting browser cache
 * ⚠️ DISABLED TEMPORARILY FOR DEBUGGING - May cause installer hang
 */
function createBrowserCacheJunctions(userDataPath) {
  try {
    console.log('⚠️ Browser cache junctions skipped for debugging');
    // Try to create junctions for browser cache folders
    // This redirects Chrome cache to cache/ subfolder
    // return;
  } catch (error) {
    console.error('❌ Junction setup error:', error.message);
  }
}

/**
 * App ready: Initialize window and handlers
 */
function onAppReady() {
  try {
    console.log('📁 userData path:', app.getPath('userData'));
    
    const userDataPath = app.getPath('userData');
  
  // Ensure userData directory exists first
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  
  // ⚠️ DON'T delete browser cache folders!
  // They will be created as junctions pointing to cache/ subfolder
  // Deleting them would lose user data (Local Storage with accounts, etc.)
  // Instead, we'll let junctions redirect Chrome to cache/ automatically

  // Also clean temp and cache folders from last session
  const tempPath = path.join(userDataPath, 'temp');
  const cachePath = path.join(userDataPath, 'cache');
  
  if (fs.existsSync(tempPath)) {
    try {
      fs.rmSync(tempPath, { recursive: true, force: true });
      console.log('🗑️ Deleted temp folder');
    } catch (error) {
      // Silently skip
    }
  }
  
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true, force: true });
      console.log('🗑️ Deleted cache folder');
    } catch (error) {
      // Silently skip
    }
  }
  
  // Initialize media directories
  ensureMediaDirectories(app.getPath('userData'));
  
  // Migrate old media structure to new unified structure
  migrateMediaFiles(app.getPath('userData'));
  
  // Create junction points from root to cache/ folders BEFORE Chrome starts
  // This redirects all browser cache to cache/ for clean tree view
  createBrowserCacheJunctions(app.getPath('userData'));
  
  // Setup storage sync
  setupStorageSyncHandlers();
  
  // Setup security headers
  setupSecurityHeaders(session.defaultSession);
  
  // Register custom protocol for serving avatar files
  protocol.registerFileProtocol('avatar', (request, callback) => {
    try {
      let url = request.url.substring(9); // Remove 'avatar://' prefix
      
      // Remove query parameters
      url = url.split('?')[0];
      
      // Handle URL encoding
      url = decodeURIComponent(url);
      
      // Fix path format - convert /C:/ to C:\
      if (url.startsWith('/') && url[2] === ':') {
        url = url.substring(1).replace(/\//g, '\\');
      }
      
      console.log('📸 Serving avatar file:', url);
      
      callback({ path: url });
    } catch (error) {
      console.error('❌ Avatar protocol handler error:', error);
      callback({ error: error.message });
    }
  });
  
  // Register custom protocol for serving media files (videos, images)
  protocol.registerFileProtocol('media-file', (request, callback) => {
    try {
      let url = request.url.substring(12); // Remove 'media-file://' prefix
      
      // Remove query parameters
      url = url.split('?')[0];
      
      // Handle URL encoding
      url = decodeURIComponent(url);
      
      // Fix path format - convert /C:/ to C:\
      if (url.startsWith('/') && url[2] === ':') {
        url = url.substring(1).replace(/\//g, '\\');
      }
      
      console.log('📹 Serving media file:', url);
      
      callback({ path: url });
    } catch (error) {
      console.error('❌ Media protocol handler error:', error);
      callback({ error: error.message });
    }
  });
  
  // Register IPC handlers
  registerAllHandlers();
  
  // Create main window
  createWindow(app);
  
  // Get main window and start schedulers
  const mainWindow = getMainWindow();
  startScheduler(mainWindow);
  startReelScheduler(mainWindow);
  startCareScheduler(mainWindow);
  } catch (error) {
    console.error('❌ onAppReady error:', error);
  }
}

/**
 * Cleanup ephemeral folders on quit (temp folder with rendered videos)
 * IMPORTANT: Call this AFTER closing all browsers to avoid file lock issues
 * ⚠️ DISABLED TEMPORARILY FOR DEBUGGING
 */
function consolidateCacheBeforeQuit() {
  try {
    console.log('⚠️ consolidateCacheBeforeQuit skipped for debugging');
    // const userDataPath = app.getPath('userData');
    // const tempPath = path.join(userDataPath, 'temp');
    // 
    // // Delete ephemeral temp folder (contains rendered videos from this session)
    // if (fs.existsSync(tempPath)) {
    //   try {
    //     fs.rmSync(tempPath, { recursive: true, force: true });
    //     console.log('🗑️ Deleted ephemeral temp folder');
    //   } catch (error) {
    //     console.log(`⚠️ Could not delete temp: ${error.message}`);
    //     // ⚠️ This is OK - folder will be cleaned up on next app start
    //   }
    // }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('✅ Ephemeral cleanup complete (skipped)');
}

/**
 * App will quit: Minimal cleanup
 */
function onWillQuit() {
  console.log('🔴 App will-quit event - app is exiting');
}

function onBeforeQuit(event) {
  console.log('🔴 App before-quit event');
}

/**
 * Register lifecycle events
 */
function registerLifecycleEvents() {
  app.whenReady().then(onAppReady);
  
  // On Windows: Quit when all windows are closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('before-quit', onBeforeQuit);
  app.on('will-quit', onWillQuit);
}

module.exports = {
  registerLifecycleEvents,
};
