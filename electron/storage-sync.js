// 💾 STORAGE SYNC - Backup/Restore localStorage to file system
// Giải quyết vấn đề mất data khi restart app trong development mode

const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

// File lưu backup
const getStorageFilePath = () => {
  return path.join(app.getPath('userData'), 'local-storage-backup.json');
};

/**
 * Get media library backup file path
 */
const getMediaLibraryBackupPath = () => {
  return path.join(app.getPath('userData'), 'media-library-backup.json');
};

/**
 * Get cookies directory path
 */
const getCookiesDir = () => {
  return path.join(app.getPath('userData'), 'cookies');
};

/**
 * Helper: Load single cookie file
 */
function loadCookiesFromFile(cookiesPath) {
  try {
    const CryptoJS = require('crypto-js');
    
    if (!fs.existsSync(cookiesPath)) {
      return null;
    }
    
    const fileData = fs.readFileSync(cookiesPath, 'utf8');
    let encryptedData;
    
    // Try to parse as JSON first (new format)
    try {
      const parsed = JSON.parse(fileData);
      encryptedData = parsed.encryptedData;
    } catch {
      // If JSON parsing fails, treat entire content as encrypted data (old format)
      encryptedData = fileData;
    }
    
    const decryptedData = CryptoJS.AES.decrypt(encryptedData, 'your-secret-key-change-this-later').toString(CryptoJS.enc.Utf8);
    const cookiesArray = JSON.parse(decryptedData);
    
    return { cookies: cookiesArray };
  } catch (error) {
    console.warn('⚠️ Error loading cookies from', cookiesPath, ':', error.message);
    return null;
  }
}

/**
 * Load all accounts from cookies folder
 * Returns InstagramAccount array with cookiesPath
 */
function loadAccountsFromCookies() {
  try {
    const cookiesDir = getCookiesDir();
    
    if (!fs.existsSync(cookiesDir)) {
      console.log('📁 Cookies directory does not exist yet');
      return [];
    }
    
    const files = fs.readdirSync(cookiesDir);
    console.log('📁 Found', files.length, 'cookies files');
    
    const accounts = [];
    const uniqueAccounts = new Set();
    
    for (const file of files) {
      try {
        const cookiesPath = path.join(cookiesDir, file);
        const cookieData = loadCookiesFromFile(cookiesPath);
        
        if (cookieData && cookieData.cookies && cookieData.cookies.length > 0) {
          // Find username from cookies - try multiple possible fields
          let username = null;
          
          // Try different username sources
          const usernameCookie = cookieData.cookies.find(c => c.name === 'ds_user_id' || c.name === 'username');
          if (usernameCookie) {
            username = usernameCookie.value;
          } else {
            // Try first cookie that might have username
            const firstCookie = cookieData.cookies[0];
            if (firstCookie && firstCookie.name) {
              username = firstCookie.name;
            }
          }
          
          // If no username found, skip this account
          if (!username) {
            console.warn('   ⚠️ Could not determine username from', file);
            continue;
          }
          
          // Avoid duplicates
          if (!uniqueAccounts.has(username)) {
            uniqueAccounts.add(username);
            accounts.push({
              id: Date.now() + Math.random(),
              username: username,
              avatarUrl: '',
              category: '',
              followers: '0',
              following: '0',
              posts: '0',
              status: 'Active',
              cookiesPath: cookiesPath,
            });
            console.log('   ✅ Loaded account:', username, 'from:', file);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load cookies from', file, ':', error.message);
      }
    }
    
    console.log('✅ Loaded', accounts.length, 'unique accounts from cookies');
    return accounts;
  } catch (error) {
    console.error('❌ Error loading accounts from cookies:', error);
    return [];
  }
}


/**
 * Load storage backup từ file
 */
function loadStorageBackup() {
  try {
    const filePath = getStorageFilePath();
    console.log('📂 Loading storage backup from:', filePath);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      console.log('✅ Storage backup loaded, keys:', Object.keys(parsed).length);
      return parsed;
    } else {
      console.log('📁 No storage backup file found');
    }
  } catch (error) {
    console.error('❌ Error loading storage backup:', error);
  }
  return null;
}

/**
 * Save storage backup to file
 */
function saveStorageBackup(data) {
  try {
    const filePath = getStorageFilePath();
    
    // Đảm bảo folder tồn tại
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('💾 Storage backup saved, keys:', Object.keys(data).length);
    return true;
  } catch (error) {
    console.error('❌ Error saving storage backup:', error);
    return false;
  }
}

/**
 * Setup IPC handlers
 */
function setupStorageSyncHandlers() {
  // Load backup
  ipcMain.handle('load-storage-backup', () => {
    return loadStorageBackup();
  });

  // Save backup
  ipcMain.handle('save-storage-backup', (event, data) => {
    const success = saveStorageBackup(data);
    return { success };
  });

  // ✅ NEW: Load media library backup (for IndexedDB persistence)
  ipcMain.handle('load-media-library-backup', () => {
    try {
      const backupPath = getMediaLibraryBackupPath();
      console.log('📂 Loading media library backup from:', backupPath);
      
      if (fs.existsSync(backupPath)) {
        const data = fs.readFileSync(backupPath, 'utf-8');
        const parsed = JSON.parse(data);
        console.log(`✅ Media library backup loaded, ${parsed.length} items`);
        return { success: true, items: parsed };
      } else {
        console.log('📁 No media library backup file found');
        return { success: true, items: [] };
      }
    } catch (error) {
      console.error('❌ Error loading media library backup:', error);
      return { success: false, error: error.message, items: [] };
    }
  });

  // ✅ NEW: Save media library backup
  ipcMain.handle('save-media-library-backup', (event, mediaItems) => {
    try {
      const backupPath = getMediaLibraryBackupPath();
      
      // Ensure folder exists
      const dir = path.dirname(backupPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(backupPath, JSON.stringify(mediaItems, null, 2));
      console.log(`💾 Media library backup saved, ${mediaItems.length} items`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving media library backup:', error);
      return { success: false, error: error.message };
    }
  });

  console.log('✅ Storage sync handlers registered');
}

module.exports = { 
  loadStorageBackup, 
  saveStorageBackup,
  setupStorageSyncHandlers,
  loadAccountsFromCookies
};