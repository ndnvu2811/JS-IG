const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { startScheduler, stopScheduler, syncPosts, getPosts, checkAndPostScheduledPosts } = require('../post-scheduler');
const { startReelScheduler, stopReelScheduler, syncScheduledReels, getReels, checkAndPostScheduledReels } = require('../reel-scheduler');
const { getLatestPostUrl } = require('../instagram-refresh');

// Helper function
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

module.exports = { registerSchedulerHandlers };
