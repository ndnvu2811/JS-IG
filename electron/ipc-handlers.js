const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');
const https = require('https');
const http = require('http');

// Import functions from other modules
const { loginInstagram } = require('./instagram-automation');
const { refreshAccountData, getLatestPostUrl, downloadAvatar } = require('./instagram-refresh');
const { openBrowser, closeBrowser, isBrowserOpen } = require('./instagram-browser');
const { postToInstagram } = require('./instagram-post');
const { postReelToInstagram } = require('./instagram-reel');
const { startScheduler, stopScheduler, syncPosts, getPosts, checkAndPostScheduledPosts } = require('./post-scheduler');
const { startReelScheduler, stopReelScheduler, syncScheduledReels, getReels, checkAndPostScheduledReels } = require('./reel-scheduler');
const { getChromePath, saveChromeSettings, loadChromeSettings, validateChromePath } = require('./chrome-config');
const { runAutoBrowse } = require('./care-automation');
const { runAutoFollow } = require('./care-automation-follow');
const { startCareScheduler, stopCareScheduler, handleScheduleExecution } = require('./care-scheduler');
const { downloadInstagramPost } = require('./instagram-download');
const { getMainWindow } = require('./window-manager');

// ✅ User data path - now uses app.setPath from app-lifecycle.js
// So it points to {appPath}\data\ on same drive as app
const userDataPath = require('electron').app.getPath('userData');

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

/**
 * ============================================
 * CARE AUTOMATION HANDLERS
 * ============================================
 */
function registerCareHandlers() {
  ipcMain.handle('start-auto-browse', async (event, { accounts, settings }) => {
    console.log('🟢🟢🟢 IPC HANDLER CALLED: start-auto-browse 🟢🟢🟢');
    
    try {
      const selectedAccounts = accounts.filter(acc => 
        settings.autoBrowseAccounts.includes(acc.id)
      );
      
      if (selectedAccounts.length === 0) {
        return { success: false, error: 'No accounts selected' };
      }
      
      const onProgress = (progressData) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('auto-browse-progress', progressData);
        }
      };
      
      const automationResults = await runAutoBrowse(selectedAccounts, settings, onProgress);
      
      return { success: true, results: automationResults };
    } catch (error) {
      console.error('❌ Error in start-auto-browse:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('start-auto-follow', async (event, { accounts, settings }) => {
    console.log('🟢🟢🟢 IPC HANDLER CALLED: start-auto-follow 🟢🟢🟢');
    
    try {
      const selectedAccounts = accounts.filter(acc => 
        settings.autoFollowAccounts.includes(acc.id)
      );
      
      if (selectedAccounts.length === 0) {
        return { success: false, error: 'No accounts selected' };
      }
      
      const onProgress = (progressData) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('auto-follow-progress', progressData);
        }
      };
      
      const results = await runAutoFollow(selectedAccounts, settings, onProgress);
      
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error in start-auto-follow:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('run-care-schedule', async (event, { schedule, accounts, date, time }) => {
    console.log('📨 Received care schedule to run:', schedule.id);
    
    try {
      await handleScheduleExecution(schedule, accounts, getMainWindow());
      
      event.reply('care-schedule-completed', {
        scheduleId: schedule.id,
        success: true,
      });
    } catch (error) {
      console.error('❌ Care schedule error:', error);
      event.reply('care-schedule-completed', {
        scheduleId: schedule.id,
        success: false,
        error: error.message,
      });
    }
  });
}

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
        const cookiesPath = saveCookies(accountId, username, result.cookies);
        
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

  ipcMain.on('delete-instagram-account', async (event, { accountId, cookiesPath }) => {
    console.log('📨 Received delete request for account:', accountId);
    
    try {
      if (cookiesPath && fs.existsSync(cookiesPath)) {
        fs.unlinkSync(cookiesPath);
        console.log('🗑️ Deleted cookies file:', cookiesPath);
      }
      
      event.reply('delete-instagram-account-success', { accountId });
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
}

/**
 * ============================================
 * POSTING HANDLERS
 * ============================================
 */
function registerPostingHandlers() {
  ipcMain.on('post-to-instagram', async (event, postData) => {
    console.log('📨 Received post request');
    
    try {
      const cookieData = loadCookies(postData.cookiesPath);
      if (!cookieData) {
        throw new Error('Cannot load cookies');
      }
      
      const result = await postToInstagram({
        content: postData.content,
        media: postData.media,
        cookies: cookieData.cookies,
        shareToThreads: postData.shareToThreads || false,
        username: postData.username,
      });
      
      if (result.success) {
        event.reply('post-success', {
          postId: postData.postId,
          postUrl: result.postUrl,
        });
      } else {
        event.reply('post-error', {
          postId: postData.postId,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('❌ Post error:', error);
      event.reply('post-error', {
        postId: postData.postId,
        error: error.message,
      });
    }
  });

  ipcMain.on('post-reel-to-instagram', async (event, reelData) => {
    console.log('📨 Received reel post request');
    
    try {
      const cookieData = loadCookies(reelData.cookiesPath);
      if (!cookieData) {
        throw new Error('Cannot load cookies');
      }
      
      const result = await postReelToInstagram({
        content: reelData.content,
        video: reelData.video,
        cookies: cookieData.cookies,
        shareToThreads: reelData.shareToThreads || false,
        aspectRatio: reelData.aspectRatio || '9:16',
        username: reelData.username,
      });
      
      if (result.success) {
        event.reply('reel-success', {
          reelId: reelData.reelId,
          reelUrl: result.reelUrl,
        });
      } else {
        event.reply('reel-error', {
          reelId: reelData.reelId,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('❌ Reel post error:', error);
      event.reply('reel-error', {
        reelId: reelData.reelId,
        error: error.message,
      });
    }
  });
}

/**
 * ============================================
 * SCHEDULER SYNC HANDLERS
 * ============================================
 */
function registerSchedulerHandlers() {
  ipcMain.handle('sync-posts', async (event, posts) => {
    try {
      await syncPosts(posts);
      console.log(`📤 Synced ${posts.length} posts`);
      return { success: true };
    } catch (error) {
      console.error('❌ Sync posts error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-reels', async (event, reels) => {
    try {
      await syncScheduledReels(reels);
      console.log(`📤 Synced ${reels.length} reels`);
      return { success: true };
    } catch (error) {
      console.error('❌ Sync reels error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-scheduled-reels', async (event, reels) => {
    try {
      await syncScheduledReels(reels);
      console.log(`📤 Synced ${reels.length} scheduled reels`);
      return { success: true };
    } catch (error) {
      console.error('❌ Sync scheduled reels error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-latest-post-url', async (event, username, cookiesPath) => {
    try {
      console.log(`🔍 Getting latest post URL for ${username}...`);
      const cookieData = loadCookies(cookiesPath);
      if (!cookieData || !cookieData.cookies) {
        throw new Error('Cannot load cookies');
      }
      
      const postUrl = await getLatestPostUrl(username, cookieData.cookies);
      console.log(`✅ Latest post URL: ${postUrl}`);
      return { success: true, postUrl };
    } catch (error) {
      console.error('❌ Error getting latest post URL:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-scheduled-posts', async (event) => {
    try {
      const posts = getPosts();
      console.log(`📋 Retrieved ${posts.length} posts from file`);
      return { success: true, posts };
    } catch (error) {
      console.error('❌ Error getting posts:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-scheduled-reels', async (event) => {
    try {
      const reels = getReels();
      console.log(`📋 Retrieved ${reels.length} reels from file`);
      return { success: true, reels };
    } catch (error) {
      console.error('❌ Error getting reels:', error);
      return { success: false, error: error.message };
    }
  });
}

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

/**
 * ============================================
 * PROXY TESTING HANDLER
 * ============================================
 */
function registerProxyHandlers() {
  ipcMain.handle('test-proxy', async (event, { url, proxy }) => {
    console.log('🔵 Testing proxy:', proxy);
    
    try {
      const agent = new HttpsProxyAgent(proxy);
      const startTime = Date.now();
      const response = await fetch(url, {
        agent: agent,
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Proxy test SUCCESS!');
        return { success: true, data };
      } else {
        console.log('❌ Proxy test FAILED');
        return { success: false, error: 'Request failed' };
      }
    } catch (error) {
      console.error('❌ Proxy test ERROR:', error.message);
      return { success: false, error: error.message };
    }
  });
}

/**
 * ============================================
 * MEDIA FILE HANDLERS
 * ============================================
 */
function registerMediaHandlers() {
  ipcMain.handle('save-media-file', async (event, { fileData, fileName, fileType }) => {
    try {
      const mediaDir = path.join(app.getPath('userData'), 'media');
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      
      const timestamp = Date.now();
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      // Use original name with extension, don't add extension twice
      const uniqueFileName = `${timestamp}_${nameWithoutExt}${ext}`;
      const filePath = path.join(mediaDir, uniqueFileName);
      
      const base64Data = fileData.replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      console.log('✅ Media file saved:', filePath);
      
      return {
        success: true,
        path: filePath,
        fileName: uniqueFileName,
      };
    } catch (error) {
      console.error('❌ Error saving media file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-media-file', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ Media file deleted:', filePath);
      }
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting media file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('read-media-file', async (event, filePath) => {
    try {
      // Handle file:// URLs
      let actualPath = filePath;
      if (filePath.startsWith('file://')) {
        actualPath = filePath.substring(7); // Remove 'file://'
        // On Windows, handle paths like /C:/Users/...
        if (actualPath.match(/^\/[A-Za-z]:/)) {
          actualPath = actualPath.substring(1); // Remove leading /
        }
      }
      
      console.log('📖 Reading media file:', actualPath);
      
      if (!fs.existsSync(actualPath)) {
        throw new Error('File not found: ' + actualPath);
      }

      const buffer = fs.readFileSync(actualPath);
      const ext = path.extname(actualPath).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      if (ext === '.mp4') mimeType = 'video/mp4';
      else if (ext === '.webm') mimeType = 'video/webm';
      else if (ext === '.mov') mimeType = 'video/quicktime';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';

      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      console.log('✅ File converted to data URL');
      return { success: true, dataUrl };
    } catch (error) {
      console.error('❌ Error reading media file:', error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * ============================================
 * DOWNLOAD HANDLERS
 * ============================================
 */
function registerDownloadHandlers() {
  ipcMain.handle('get-media-path', async () => {
    const mediaPath = path.join(app.getPath('userData'), 'content-media');
    if (!fs.existsSync(mediaPath)) {
      fs.mkdirSync(mediaPath, { recursive: true });
    }
    return mediaPath;
  });

  ipcMain.handle('download-media', async (event, { url, savePath }) => {
    try {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            protocol.get(redirectUrl, (redirectResponse) => {
              const file = fs.createWriteStream(savePath);
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve({ success: true, path: savePath });
              });
            });
            return;
          }

          const file = fs.createWriteStream(savePath);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve({ success: true, path: savePath });
          });
        });

        request.on('error', (err) => {
          fs.unlink(savePath, () => {});
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file-to-downloads', async (event, { sourcePath, fileName, folderName }) => {
    try {
      const downloadsPath = app.getPath('downloads');
      const targetFolder = folderName ? path.join(downloadsPath, folderName) : downloadsPath;
      
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const targetPath = path.join(targetFolder, fileName);
      fs.copyFileSync(sourcePath, targetPath);

      return { success: true, path: targetPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('instagram-download-post', async (event, { postUrl }) => {
    try {
      console.log('📥 Direct Instagram download:', postUrl);
      
      const accounts = await new Promise((resolve) => {
        event.sender.send('request-instagram-accounts');
        
        ipcMain.once('provide-instagram-accounts', (e, accountsData) => {
          resolve(accountsData);
        });
        
        setTimeout(() => resolve(null), 5000);
      });
      
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        return { success: false, error: 'No Instagram account found. Please add an account first.' };
      }
      
      const account = accounts[0];
      console.log('📱 Using account:', account.username);
      
      const result = await downloadInstagramPost(postUrl, account);
      
      return result;
    } catch (error) {
      console.error('❌ Instagram download error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('start-background-download', async (event, params) => {
    console.log('📥 [Electron] Received background download request:', params);
    let { urls, cookiesPath, postId, taskId } = params;
    
    // Normalize path - convert backslashes to forward slashes for consistency
    if (cookiesPath) {
      cookiesPath = cookiesPath.replace(/\\\\/g, '\\').replace(/\//g, '\\');
      console.log('✅ Normalized cookiesPath:', cookiesPath);
    }
    
    try {
      console.log('🔍 Validating request...');
      
      if (!Array.isArray(urls) || urls.length === 0) {
        const error = 'No URLs provided';
        console.error('❌', error);
        return { success: false, error };
      }
      
      console.log(`✓ URLs count: ${urls.length}`);
      
      if (!cookiesPath) {
        const error = 'No cookies path provided';
        console.error('❌', error);
        return { success: false, error };
      }
      
      console.log(`✓ Cookies path: ${cookiesPath}`);

      const cookieData = loadCookies(cookiesPath);
      if (!cookieData) {
        const error = `Cookies file not found: ${cookiesPath}`;
        console.error('❌', error);
        return { success: false, error };
      }
      
      console.log('✓ Cookies loaded successfully');

      const downloadedFiles = [];
      let successCount = 0;
      let totalMediaDownloaded = 0;
      const mediaDir = path.join(app.getPath('userData'), 'downloaded-media');
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      
      console.log(`📁 Media directory: ${mediaDir}`);

      for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
        const url = urls[urlIndex];
        try {
          console.log(`\n📥 [${urlIndex + 1}/${urls.length}] Scraping: ${url}`);
          
          // Send progress to frontend
          event.sender.send('download-progress', {
            taskId,
            status: 'scraping',
            current: urlIndex + 1,
            total: urls.length,
            message: `Scraping post ${urlIndex + 1}/${urls.length}...`
          });
          
          // Get media URLs from Instagram post/reel
          const result = await downloadInstagramPost(url, {
            cookiesPath,
            cookies: cookieData.cookies,
            username: 'downloaded-account'
          });

          if (!result.success) {
            console.warn(`⚠️ Failed to scrape ${url}: ${result.error}`);
            event.sender.send('download-progress', {
              taskId,
              status: 'scrape-error',
              current: urlIndex + 1,
              total: urls.length,
              message: `Failed to scrape: ${result.error}`
            });
            continue;
          }

          console.log(`✅ Found ${result.media.length} media items`);
          
          // Download each media file
          for (let mediaIndex = 0; mediaIndex < result.media.length; mediaIndex++) {
            const media = result.media[mediaIndex];
            try {
              console.log(`  📥 [${mediaIndex + 1}/${result.media.length}] Downloading: ${media.type}...`);
              
              const fileName = `Down_${media.type === 'video' ? 'Video' : 'Image'}_${totalMediaDownloaded + 1}${media.type === 'video' ? '.mp4' : '.jpg'}`;
              const filePath = path.join(mediaDir, fileName);
              
              await new Promise((resolve, reject) => {
                const protocol = media.url.startsWith('https') ? https : http;
                
                const request = protocol.get(media.url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  }
                }, (response) => {
                  if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    protocol.get(redirectUrl, (redirectResponse) => {
                      const file = fs.createWriteStream(filePath);
                      redirectResponse.pipe(file);
                      file.on('finish', () => {
                        file.close();
                        resolve();
                      });
                      file.on('error', reject);
                    });
                    return;
                  }

                  const file = fs.createWriteStream(filePath);
                  response.pipe(file);
                  file.on('finish', () => {
                    file.close();
                    resolve();
                  });
                  file.on('error', reject);
                });

                request.on('error', reject);
              });
              
              // Store both path and type for proper Media Library syncing
              downloadedFiles.push({
                path: filePath,
                type: media.type === 'video' ? 'video' : 'image'
              });
              successCount++;
              totalMediaDownloaded++;
              console.log(`  ✅ Saved: ${fileName}`);
              
              // Send progress for EACH file downloaded (1/3, 2/3, 3/3, etc)
              event.sender.send('download-progress', {
                taskId,
                status: 'downloading',
                currentIndex: successCount,
                totalCount: urlIndex + 1, // Will be updated to total URLs
                filesDownloaded: successCount,
                totalFiles: urls.length,
                fileName: fileName,
                progress: Math.round((successCount / (urls.length * 2)) * 100), // Estimate based on URLs
                message: `Downloaded ${successCount} file(s)`
              });
            } catch (error) {
              console.warn(`  ⚠️ Failed to download media: ${error.message}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error scraping ${url}:`, error.message);
        }
      }

      console.log(`\n✅ Download complete! Downloaded ${successCount} files`);
      
      if (successCount === 0) {
        const error = `Failed to download any files (${urls.length} attempted)`;
        console.error('❌', error);
        event.sender.send('download-complete', {
          taskId,
          success: false,
          error
        });
        return {
          success: false,
          error
        };
      }

      // Send completion with proper file data
      event.sender.send('download-complete', {
        taskId,
        success: true,
        downloadedCount: successCount,
        totalCount: urls.length,
        files: downloadedFiles, // Now includes {path, type} objects
        message: `✅ Downloaded ${successCount}/${urls.length} files`
      });

      return {
        success: true,
        downloadedCount: successCount,
        totalCount: urls.length,
        files: downloadedFiles,
      };
    } catch (error) {
      console.error('❌ Background download error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  });
}

/**
 * ============================================
 * FULL PIPELINE BACKGROUND RENDERING (MUTED)
 * ============================================
 * Render video completely in Electron process (backend)
 * - Audio is MUTED (no sound during rendering)
 * - Runs even if app is in background or minimized
 */
function registerFullPipelineRenderHandler() {
  // Read file as blob (helper for exporting rendered videos)
  ipcMain.handle('read-file-as-blob', async (event, { filePath }) => {
    try {
      const data = fs.readFileSync(filePath);
      return data.toString('base64');
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  ipcMain.handle('render-video-full-pipeline', async (event, { videoUrl, session, outputPath }) => {
    try {
      console.log('\n🎬 ========== FULL PIPELINE RENDERING START (BACKEND - MUTED) ==========');
      console.log('📹 Video URL:', videoUrl.substring(0, 80));
      console.log('📁 Output:', outputPath);
      console.log('🔇 Audio: MUTED during rendering');
      
      const mainWindow = getMainWindow();
      
      // Full output path in temp directory
      const fullOutputPath = path.join(app.getPath('userData'), 'temp-renders', outputPath);
      const renderDir = path.dirname(fullOutputPath);
      
      if (!fs.existsSync(renderDir)) {
        fs.mkdirSync(renderDir, { recursive: true });
      }
      
      // Step 1: Export frames from video
      console.log('📸 Step 1: Exporting frames from video...');
      const frameResult = await exportFramesFromVideo(videoUrl, session, mainWindow);
      
      if (!frameResult.success) {
        return { success: false, error: frameResult.error || 'Failed to export frames' };
      }
      
      console.log(`✅ Exported ${frameResult.totalFrames} frames`);
      
      // Step 2: Encode frames with FFmpeg (NO AUDIO - MUTED)
      console.log('🎥 Step 2: Encoding with FFmpeg (audio muted)...');
      const encodeResult = await encodeFramesWithFFmpeg(
        frameResult.framesDir,
        null, // No audio - MUTED
        fullOutputPath,
        30,
        mainWindow
      );
      
      if (!encodeResult.success) {
        return { success: false, error: encodeResult.error || 'FFmpeg encoding failed' };
      }
      
      console.log('\n✅ ========== FULL PIPELINE RENDERING COMPLETED (MUTED) ==========');
      console.log('🎬 Output video:', encodeResult.outputPath);
      
      return {
        success: true,
        videoPath: encodeResult.outputPath,
        message: 'Video rendered successfully (audio muted)'
      };
    } catch (error) {
      console.error('❌ Full pipeline rendering error:', error);
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  });
}

/**
 * Helper: Export frames from video file to disk
 */
async function exportFramesFromVideo(videoUrl, session, mainWindow) {
  return new Promise((resolve) => {
    try {
      const framesDir = path.join(app.getPath('userData'), 'temp-frames', `frames_${Date.now()}`);
      
      if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
      }
      
      // Determine if it's a file path or data URL
      let inputSource = videoUrl;
      if (videoUrl.startsWith('data:')) {
        // Handle data URL
        const base64Data = videoUrl.replace(/^data:video\/[^;]+;base64,/, '');
        const videoPath = path.join(framesDir, 'temp_video.mp4');
        fs.writeFileSync(videoPath, Buffer.from(base64Data, 'base64'));
        inputSource = videoPath;
      }
      
      let frameCount = 0;
      let timeout = null;
      
      const command = ffmpeg(inputSource);
      
      // Set timeout (5 min max for frame extraction)
      timeout = setTimeout(() => {
        console.warn('⏱️ Frame extraction timeout (5 min)');
        command.kill();
      }, 5 * 60 * 1000);
      
      command
        .inputOptions(['-loglevel error']) // 🔇 Suppress FFmpeg logs
        .screenshots({
          count: 0, // Extract all frames at 30fps
          folder: framesDir,
          filename: 'frame_%04d.png'
        })
        .noAudio() // 🔇 NO AUDIO
        .on('end', () => {
          clearTimeout(timeout);
          const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
          frameCount = files.length;
          
          console.log(`✅ Extracted ${frameCount} frames to: ${framesDir}`);
          
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('rendering-progress', { stage: 'frames-extracted', frameCount });
          }
          
          resolve({
            success: true,
            framesDir,
            totalFrames: frameCount
          });
        })
        .on('error', (error) => {
          clearTimeout(timeout);
          console.error('❌ Frame extraction error:', error);
          resolve({
            success: false,
            error: error.message
          });
        })
        .run();
    } catch (error) {
      console.error('Error in exportFramesFromVideo:', error);
      resolve({ success: false, error: error.message });
    }
  });
}

/**
 * Helper: Encode frames with FFmpeg (WITHOUT audio)
 */
async function encodeFramesWithFFmpeg(framesDir, audioPath, outputPath, fps, mainWindow) {
  return new Promise((resolve) => {
    try {
      const command = ffmpeg(`${framesDir}/frame_%04d.png`);
      let timeout = null;
      
      // Set timeout (10 min max for encoding)
      timeout = setTimeout(() => {
        console.warn('⏱️ Encoding timeout (10 min)');
        command.kill();
      }, 10 * 60 * 1000);
      
      command
        .inputOptions([
          `-framerate ${fps}`,
          '-loglevel error' // 🔇 Suppress FFmpeg logs
        ])
        .output(outputPath)
        .videoCodec('libx264')
        .format('mp4')
        .noAudio() // 🔇 EXPLICITLY disable audio
        .outputOptions([
          '-preset', 'medium',
          '-crf', '28',
          '-y',
          '-an', // 🔇 -an = disable audio stream
          '-f null' // 🔇 Null audio format to prevent speaker output
        ]);
      
      // Progress tracking
      command.on('progress', (progress) => {
        const percent = Math.round(progress.percent || 0);
        
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('rendering-progress', { stage: 'encoding', percent });
        }
      });
      
      // Completion
      command.on('end', () => {
        clearTimeout(timeout);
        console.log('✅ Encoding complete (NO AUDIO)!');
        
        // Cleanup frames directory
        try {
          const files = fs.readdirSync(framesDir);
          for (const file of files) {
            fs.unlinkSync(path.join(framesDir, file));
          }
          fs.rmdirSync(framesDir);
          console.log(`🗑️ Cleaned up frames directory`);
        } catch (e) {
          console.warn('Could not cleanup frames:', e.message);
        }
        
        resolve({
          success: true,
          outputPath
        });
      });
      
      // Error handling
      command.on('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ FFmpeg error:', error.message);
        resolve({
          success: false,
          error: error.message
        });
      });
      
      console.log('▶️ Starting FFmpeg encoding (NO AUDIO)...');
      command.run();
    } catch (error) {
      console.error('Error in encodeFramesWithFFmpeg:', error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * ============================================
 * MACHINE ID HANDLER
 * ============================================
 */
function registerMachineIdHandler() {
  const { machineIdSync } = require('node-machine-id');
  
  ipcMain.handle('get-machine-id', async () => {
    try {
      const id = machineIdSync();
      console.log('📱 Machine ID:', id);
      return { success: true, id };
    } catch (error) {
      console.error('Error getting machine ID:', error);
      return { success: false, error: error.message };
    }
  });
}

/**
 * Helper: Save cookies to encrypted file
 */
function saveCookies(accountId, username, cookies) {
  const CryptoJS = require('crypto-js');
  const cookiesDir = path.join(userDataPath, 'cookies');
  
  if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
  }
  
  const cookiesPath = path.join(cookiesDir, `${accountId}.json`);
  
  // ✅ FIXED: Use proper Base64 encoding for ciphertext
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(cookies),
    'your-secret-key-change-this-later'
  );
  
  // Get base64 representation
  const encryptedData = encrypted.toString();
  
  console.log('🔐 Encrypting cookies...');
  console.log('   Encrypted data type:', typeof encryptedData);
  console.log('   Encrypted data length:', encryptedData.length);
  console.log('   First 50 chars:', encryptedData.substring(0, 50));
  
  if (!encryptedData || encryptedData.length === 0) {
    throw new Error('Encryption failed - encryptedData is empty!');
  }
  
  fs.writeFileSync(cookiesPath, JSON.stringify({ encryptedData }));
  console.log('✅ Cookies saved to:', cookiesPath);
  
  return cookiesPath;
}

/**
 * Helper: Load cookies from encrypted file
 * Supports both old format (plain encrypted string) and new format (JSON wrapper)
 */
function loadCookies(cookiesPath) {
  try {
    const CryptoJS = require('crypto-js');
    
    if (!fs.existsSync(cookiesPath)) {
      console.error('❌ Cookies file not found:', cookiesPath);
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
    console.error('❌ Error loading cookies:', error.message);
    return null;
  }
}

/**
 * Register all IPC handlers
 */
function registerAllHandlers() {
  registerWindowHandlers();
  registerCareHandlers();
  registerBrowserHandlers();
  registerAccountHandlers();
  registerPostingHandlers();
  registerSchedulerHandlers();
  registerChromeHandlers();
  registerProxyHandlers();
  registerMediaHandlers();
  registerDownloadHandlers();
  registerFullPipelineRenderHandler();
  registerMachineIdHandler();
  
  console.log('🎯 IPC Handlers registered!');
}

module.exports = {
  registerAllHandlers,
  saveCookies,
  loadCookies,
};
