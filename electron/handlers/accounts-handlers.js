const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { loginInstagram } = require('../instagram-automation');
const { refreshAccountData, downloadAvatar } = require('../instagram-refresh');
const { loadAccountsFromCookies } = require('../storage-sync');

// Helper functions
function saveCookies(accountId, username, cookies, metadata = {}) {
  const cookiesDir = path.join(require('os').homedir(), '.instagram-tool-care');
  if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
  }
  
  const cookiesPath = path.join(cookiesDir, `cookies_${accountId}_${username}.json`);
  const cookieData = {
    accountId,
    username,
    cookies,
    avatarUrl: metadata.avatarUrl || '',
    followers: metadata.followers || '0',
    following: metadata.following || '0',
    posts: metadata.posts || '0',
    savedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(cookiesPath, JSON.stringify(cookieData, null, 2));
  console.log('💾 Cookies saved:', cookiesPath);
  return cookiesPath;
}

function loadCookies(cookiesPath) {
  try {
    const data = fs.readFileSync(cookiesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading cookies:', error);
    return null;
  }
}

/**
 * ============================================
 * ACCOUNT MANAGEMENT HANDLERS
 * ============================================
 */
function registerAccountHandlers() {
  ipcMain.on('login-instagram', async (event, { username, password, proxy }) => {
    console.log('📨 Received login request for:', username);
    
    try {
      const result = await loginInstagram(username, password, proxy);
      
      if (result.success) {
        const accountId = Date.now();
        
        // Avatar path can be avatar://, file://, or http URL
        let avatarPath = result.avatar;
        if (avatarPath && avatarPath.startsWith('http')) {
          try {
            console.log('📥 Downloading avatar during login...');
            avatarPath = await downloadAvatar(avatarPath, username);
          } catch (err) {
            console.error('⚠️ Failed to download avatar:', err.message);
            avatarPath = result.avatar;
          }
        }
        
        // Add timestamp for cache busting
        if (avatarPath && avatarPath.startsWith('avatar://')) {
          avatarPath = `${avatarPath}?t=${Date.now()}`;
        }
        
        // Save with metadata including avatar
        const cookiesPath = saveCookies(accountId, username, result.cookies, {
          avatarUrl: avatarPath,
          followers: result.followers,
          following: result.following,
          posts: result.posts,
        });
        
        event.reply('login-instagram-success', {
          accountId: accountId,
          username: result.username,
          avatar: avatarPath,
          followers: result.followers,
          following: result.following,
          posts: result.posts,
          cookiesPath: cookiesPath,
          sessionId: result.sessionId,
        });
      } else {
        event.reply('login-instagram-error', { error: result.error });
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      event.reply('login-instagram-error', { error: error.message });
    }
  });

  ipcMain.on('delete-instagram-account', async (event, { accountId, cookiesPath, username }) => {
    console.log('📨 Received delete request for account:', accountId, username);
    
    try {
      // Delete cookies file
      if (cookiesPath && fs.existsSync(cookiesPath)) {
        fs.unlinkSync(cookiesPath);
        console.log('🗑️ Deleted cookies file:', cookiesPath);
      }
      
      // Delete from backup file (local-storage-backup.json)
      const { loadStorageBackup, saveStorageBackup } = require('../storage-sync');
      const backup = loadStorageBackup();
      if (backup && backup['instagram-accounts']) {
        try {
          const accountsStr = backup['instagram-accounts'];
          let accounts = typeof accountsStr === 'string' ? JSON.parse(accountsStr) : accountsStr;
          
          // Filter out deleted account
          const filteredAccounts = accounts.filter(acc => String(acc.id) !== String(accountId));
          console.log(`  📋 Filtered ${accounts.length} → ${filteredAccounts.length} accounts`);
          
          // Update backup
          backup['instagram-accounts'] = JSON.stringify(filteredAccounts);
          saveStorageBackup(backup);
          console.log('🗑️ Deleted account from backup file');
        } catch (e) {
          console.log('  ⚠️ Could not remove from backup:', e.message);
        }
      }
      
      event.reply('delete-instagram-account-success', { accountId });
      console.log('✅ Account deleted successfully');
    } catch (error) {
      console.error('❌ Delete error:', error);
      event.reply('delete-instagram-account-error', { accountId, error: error.message });
    }
  });

  ipcMain.on('refresh-instagram-account', async (event, { accountId, username, cookiesPath }) => {
    console.log('📨 Received refresh request for:', username);
    
    try {
      const cookieData = loadCookies(cookiesPath);
      if (!cookieData) {
        throw new Error('Cannot load cookies');
      }
      
      const result = await refreshAccountData(username, cookieData.cookies);
      
      if (result.success) {
        // Avatar from refresh returns file://, convert to avatar://
        let avatarPath = result.avatar;
        if (avatarPath && avatarPath.startsWith('file://')) {
          // Convert file:// to avatar://
          const filePath = avatarPath.substring(7); // Remove 'file://'
          avatarPath = `avatar://${filePath}`;
        }
        
        // Add timestamp for cache busting
        if (avatarPath && avatarPath.startsWith('avatar://')) {
          avatarPath = `${avatarPath}?t=${Date.now()}`;
        }
        
        // 💾 Update cookies file with new avatar and stats
        try {
          cookieData.avatarUrl = avatarPath.split('?')[0]; // Remove timestamp for storage
          cookieData.followers = String(result.followers || '0');
          cookieData.following = String(result.following || '0');
          cookieData.posts = String(result.posts || '0');
          cookieData.updatedAt = new Date().toISOString();
          
          fs.writeFileSync(cookiesPath, JSON.stringify(cookieData, null, 2));
          console.log('💾 Updated cookies with new avatar and stats');
        } catch (e) {
          console.warn('⚠️ Failed to update cookies file:', e.message);
        }
        
        console.log('🎨 Sending refresh with avatar:', avatarPath);
        
        event.reply('refresh-instagram-account-success', {
          accountId,
          avatar: avatarPath,
          followers: result.followers,
          following: result.following,
          posts: result.posts,
        });
      } else {
        event.reply('refresh-instagram-account-error', { 
          accountId,
          error: result.error 
        });
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
      event.reply('refresh-instagram-account-error', { 
        accountId, 
        error: error.message 
      });
    }
  });

  // Load accounts from cookies files (for recovery/startup)
  ipcMain.handle('load-accounts-from-cookies', async (event) => {
    try {
      return loadAccountsFromCookies();
    } catch (error) {
      console.error('❌ Error loading accounts from cookies:', error);
      return [];
    }
  });

  // Load cookies from file (for browser login)
  ipcMain.handle('load-cookies', async (event, cookiesPath) => {
    try {
      console.log('📂 Loading cookies from:', cookiesPath);
      
      if (!cookiesPath || !fs.existsSync(cookiesPath)) {
        return { success: false, error: 'Cookies file not found' };
      }
      
      const data = fs.readFileSync(cookiesPath, 'utf8');
      const cookieData = JSON.parse(data);
      
      if (!cookieData.cookies || !Array.isArray(cookieData.cookies)) {
        return { success: false, error: 'Invalid cookies format' };
      }
      
      console.log(`✅ Loaded ${cookieData.cookies.length} cookies`);
      return { 
        success: true, 
        cookies: cookieData.cookies,
        accountId: cookieData.accountId,
        username: cookieData.username,
        avatarUrl: cookieData.avatarUrl,
        followers: cookieData.followers,
        following: cookieData.following,
        posts: cookieData.posts
      };
    } catch (error) {
      console.error('❌ Error loading cookies:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerAccountHandlers };
