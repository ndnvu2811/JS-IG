const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { postToInstagram } = require('../instagram-post');
const { postReelToInstagram } = require('../instagram-reel');

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

module.exports = { registerPostingHandlers };
