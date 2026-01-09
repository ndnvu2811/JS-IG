// 🕐 REEL SCHEDULER - AUTO POST INSTAGRAM REELS
// Check every 30 seconds for scheduled reels

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const CryptoJS = require('crypto-js');

// ===== CONSTANTS =====
const CHECK_INTERVAL = 60 * 1000; // 60 giây = 1 phút
const SECRET_KEY = 'your-secret-key-change-this-later';

// ✅ BUFFER TIME 2 phút (nếu trễ quá 2 phút → Missed)
const BUFFER_TIME = 2 * 60 * 1000; // 2 phút

// ✅ Helper: Get reels file path (called at runtime, not at import)
const getReelsFilePath = () => path.join(app.getPath('userData'), 'scheduled-reels.json');

let schedulerInterval = null;
let mainWindow = null;

/**
 * 📂 Load scheduled reels from file
 */
function loadScheduledReels() {
  try {
    const REELS_FILE = getReelsFilePath();
    if (!fs.existsSync(REELS_FILE)) {
      console.log('📁 There is no scheduled-reels.json file yet, create a new one...');
      fs.writeFileSync(REELS_FILE, JSON.stringify([]));
      return [];
    }

    const data = fs.readFileSync(REELS_FILE, 'utf-8');
    const reels = JSON.parse(data);
    console.log(`📂 Loaded ${reels.length} reels from file`);
    return reels;
  } catch (error) {
    console.error('❌ Error reading scheduled reels:', error);
    return [];
  }
}

/**
 * 💾 Save updated reels list
 */
function saveScheduledReels(reels) {
  try {
    // ✅ FIX: Thêm dòng này để định nghĩa REELS_FILE
    const REELS_FILE = getReelsFilePath();
    
    // ✅ VALIDATE: Đảm bảo tất cả reels có status
    const validReels = reels.map(reel => {
      if (!reel.status) {
        console.log(`⚠️ WARNING: Reel ${reel.id} has no status! Setting to 'Scheduled'`);
        return { ...reel, status: 'Scheduled' };
      }
      return reel;
    });
    
    fs.writeFileSync(REELS_FILE, JSON.stringify(validReels, null, 2));
    console.log('✅ Saved scheduled reels');
  } catch (error) {
    console.error('❌ Error saving scheduled reels:', error);
  }
}

/**
 * ⏰ Check and post scheduled reels
 */
async function checkAndPostScheduledReels() {
  const now = new Date();
  console.log(`\n⏰ [${now.toLocaleString('vi-VN')}] Check scheduled reels...`);

  const reels = loadScheduledReels();
  
  // ✅ DEBUG: Log tất cả reels
  console.log(`📋 Total reels in file: ${reels.length}`);
  if (reels.length === 0) {
    console.log('   ℹ️ No reels to check');
    return;
  }
  
  reels.forEach((reel, i) => {
    const scheduledTime = new Date(reel.scheduledTime);
    const timeDiff = now.getTime() - scheduledTime.getTime();
    console.log(`   [${i}] ID: ${reel.id}, Status: ${reel.status}, Scheduled: ${scheduledTime.toLocaleString('vi-VN')}, Diff: ${Math.round(timeDiff / 1000)}s`);
  });
  
  const reelsToPublish = [];

  // 🔍 Find reels that are ready to post
  reels.forEach((reel) => {
    // ✅ ONLY GET REEL STATUS = "Scheduled" or "Failed" (to retry)
    if (reel.status !== 'Scheduled' && reel.status !== 'Failed') {
      console.log(`   ⏭️ Skip reel ${reel.id} - Status: ${reel.status}`);
      return;
    }

    const scheduledTime = new Date(reel.scheduledTime);
    const timeDiff = now.getTime() - scheduledTime.getTime();
    
    console.log(`   🔍 Reel ${reel.id}: Scheduled at ${scheduledTime.toLocaleString('vi-VN')}`);
    console.log(`      Time diff: ${Math.round(timeDiff / 1000)}s (${Math.round(timeDiff / 60000)} minutes)`);
    console.log(`      Buffer time: ${BUFFER_TIME / 60000} minutes, Check: ${timeDiff >= -30000 && timeDiff <= BUFFER_TIME}`);

    // Check if it's time to post
    if (timeDiff >= 0) { // ✅ Chỉ post khi ĐÃ ĐẾN GIỜ hoặc sau
      if (timeDiff > BUFFER_TIME) {
        // Missed the window
        console.log(`   ⚠️ Reel ID ${reel.id} missed schedule (>${BUFFER_TIME/60000} mins late)`);
        const allReels = loadScheduledReels();
        const idx = allReels.findIndex(r => r.id === reel.id);
        if (idx !== -1) {
          allReels[idx].status = 'Missed';
          allReels[idx].missedAt = new Date().toISOString();
          saveScheduledReels(allReels);
          
          // ✅ SEND EVENT TO REACT
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('reel-missed', {
              reelId: reel.id,
              missedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        // Within buffer time → Post normally
        console.log(`   📌 Reel "${reel.caption?.substring(0, 30) || reel.id}..." is ready to publish!`);
        reelsToPublish.push(reel);
      }
    } else {
      console.log(`   ⏳ Reel ${reel.id} not yet time (${Math.round(-timeDiff / 1000)}s to go)`);
    }
  });

  // 📤 Post reels that are ready (SEQUENTIALLY)
  if (reelsToPublish.length > 0) {
    console.log(`\n🚀 Have ${reelsToPublish.length} reel(s) to publish!`);

    for (const reel of reelsToPublish) {
      await publishReel(reel);
      // Wait 5 seconds between reels
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } else {
    console.log('✅ There are no reels to post at this time.');
  }
}

/**
 * 📤 Post reel to Instagram
 */
async function publishReel(reel) {
  console.log(`\n📤 Start posting ID: ${reel.id}`);
  console.log(`📝 Caption: "${reel.caption?.substring(0, 50) || 'No caption'}..."`);
  console.log(`🎬 Video: ${reel.video?.url || 'No video'}`);
  console.log(`👤 Username: ${reel.username}`);
  console.log(`🍪 Cookies path: ${reel.cookiesPath}`);

  // ============================================
  // 🔥 STEP 1: CHANGE STATUS = "Posting" IMMEDIATELY
  // ============================================
  try {
    const allReels = loadScheduledReels();
    const index = allReels.findIndex((r) => r.id === reel.id);
    
    if (index === -1) {
      console.log('⚠️ No reels found in file');
      return;
    }

    // 🔒 CHECK: If already Posting/Posted → SKIP
    if (allReels[index].status !== 'Scheduled') {
      console.log(`⏭️ Skip Reel ${reel.id} - Already ${allReels[index].status}`);
      return;
    }

    // ✅ CHANGE STATUS = "Posting"
    allReels[index].status = 'Posting';
    allReels[index].startedAt = new Date().toISOString();
    saveScheduledReels(allReels);
    console.log('✅ Status changed to "Posting" → Avoid duplicate posting!');

    // Send event to React
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('reel-status-update', {
        reelId: reel.id,
        status: 'Posting',
      });
    }

  } catch (error) {
    console.error('❌ Error when changing status:', error);
    return;
  }

  // ============================================
  // STEP 2: LOAD COOKIES (Same logic as post-scheduler.js)
  // ============================================
  let cookies = [];
  try {
    if (!reel.cookiesPath) {
      throw new Error('CookiesPath not found');
    }

    console.log('📂 Loading cookies from:', reel.cookiesPath);
    
    if (!fs.existsSync(reel.cookiesPath)) {
      throw new Error(`Cookies file not found at: ${reel.cookiesPath}`);
    }
    
    const fileData = fs.readFileSync(reel.cookiesPath, 'utf-8');
    console.log('✅ Cookies file read successfully, size:', fileData.length, 'bytes');
    
    // Parse the file
    let parsedFile;
    try {
      parsedFile = JSON.parse(fileData);
    } catch (e) {
      throw new Error(`Failed to parse cookies file as JSON: ${e.message}`);
    }
    
    // ============================================
    // CHECK FORMAT: Plain JSON or Encrypted?
    // ============================================
    
    // Format 1: Plain JSON (old format) - { accountId, username, cookies: [], ... }
    if (parsedFile.cookies && Array.isArray(parsedFile.cookies)) {
      console.log('✅ Detected PLAIN JSON format (unencrypted)');
      console.log('   Cookies array length:', parsedFile.cookies.length);
      cookies = parsedFile.cookies;
    } 
    // Format 2: Encrypted JSON (new format) - { encryptedData: "..." }
    else if (parsedFile.encryptedData) {
      console.log('✅ Detected ENCRYPTED format');
      const encryptedData = parsedFile.encryptedData;
      
      if (!encryptedData) {
        throw new Error('encryptedData is empty or undefined');
      }
      
      console.log('🔐 Decrypting cookies...');
      console.log('   Encrypted data length:', encryptedData.length);
      
      let decryptedBytes;
      try {
        decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
      } catch (decryptError) {
        throw new Error(`Decryption failed: ${decryptError.message}`);
      }
      
      if (!decryptedBytes) {
        throw new Error('CryptoJS returned null/undefined after decryption');
      }
      
      let decryptedText;
      try {
        decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
      } catch (toStringError) {
        throw new Error(`Failed to convert decrypted bytes to UTF8: ${toStringError.message}`);
      }
      
      if (!decryptedText) {
        throw new Error('Failed to decrypt cookies - empty result after conversion');
      }
      
      console.log('✅ Decryption successful, parsing JSON...');
      const cookieData = JSON.parse(decryptedText);
      cookies = cookieData.cookies || cookieData;
    } 
    else {
      throw new Error('Unknown cookies file format - neither plain JSON nor encrypted');
    }
    
    if (!cookies || cookies.length === 0) {
      throw new Error('Cookies array is empty');
    }
    
    console.log('✅ Cookies loaded successfully:', cookies.length, 'items');
  } catch (error) {
    console.error('❌ Error loading cookies:', error.message);
    console.error('📋 Stack:', error.stack);
    
    // Change status to Failed
    const allReels = loadScheduledReels();
    const index = allReels.findIndex((r) => r.id === reel.id);
    if (index !== -1) {
      allReels[index].status = 'Failed';
      allReels[index].error = 'Unable to load cookies: ' + error.message;
      allReels[index].failedAt = new Date().toISOString();
      saveScheduledReels(allReels);
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('reel-publishing-error', {
        reelId: reel.id,
        error: 'Cookie error: ' + error.message,
      });
    }
    return;
  }

  // ============================================
  // STEP 3: POST REEL
  // ============================================
  let result;
  try {
    const { postReelToInstagram } = require('./instagram-reel');
    console.log('🚀 Calling postReelToInstagram()...');

    result = await postReelToInstagram({
      content: reel.caption,
      video: reel.video,
      cookies: cookies,
      shareToThreads: reel.shareToThreads || false,
      aspectRatio: reel.aspectRatio || '9:16',
      username: reel.username,
    });

    console.log('✅ postReelToInstagram() completed!');
    console.log('🔍 Result:', JSON.stringify(result, null, 2));

    // ============================================
    // STEP 4: UPDATE STATUS = "Posted"
    // ============================================
    if (result && result.success) {
      const allReels = loadScheduledReels();
      const index = allReels.findIndex((r) => r.id === reel.id);
      
      if (index !== -1) {
        allReels[index].status = 'Posted';
        allReels[index].publishedAt = new Date().toISOString();
        allReels[index].reelUrl = result.reelUrl || '';
        saveScheduledReels(allReels);
        console.log('✅ Updated status = "Posted"');
      }

      // Send event to React
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('reel-publishing-success', {
          reelId: reel.id,
          publishedAt: new Date().toISOString(),
          reelUrl: result.reelUrl || '',
        });
      }
    } else {
      throw new Error(result?.error || 'Posting failed - unknown error');
    }

  } catch (error) {
    console.error(`❌ Error posting ID ${reel.id}:`, error.message);
    
    // Change status to Failed
    const allReels = loadScheduledReels();
    const index = allReels.findIndex((r) => r.id === reel.id);
    
    if (index !== -1) {
      allReels[index].status = 'Failed';
      allReels[index].error = error.message;
      allReels[index].failedAt = new Date().toISOString();
      saveScheduledReels(allReels);
      console.log('❌ Updated status = "Failed"');
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('reel-publishing-error', {
        reelId: reel.id,
        error: error.message,
      });
    }
  }
}

/**
 * 🚀 Start scheduler
 */
function startReelScheduler(window) {
  mainWindow = window;

  if (schedulerInterval) {
    console.log('⚠️ Reel Scheduler is already running!');
    return { success: false, message: 'Scheduler is already running' };
  }

  console.log('🚀 Start Reel Scheduler...');
  console.log(`⏱️ Check interval: ${CHECK_INTERVAL / 1000} seconds`);
  console.log(`⏱️ Buffer time: ${BUFFER_TIME / 60000} minutes`);
  console.log(`📁 Reels file: ${getReelsFilePath()}`);

  // Check immediately
  checkAndPostScheduledReels();

  // Then check periodically
  schedulerInterval = setInterval(() => {
    checkAndPostScheduledReels();
  }, CHECK_INTERVAL);

  console.log('✅ Reel Scheduler started!');
  return { success: true, message: 'Scheduler has started' };
}

/**
 * 🛑 Stop scheduler
 */
function stopReelScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 Reel Scheduler has stopped');
    return { success: true, message: 'Scheduler has stopped' };
  }
  
  console.log('⚠️ Reel Scheduler already stopped');
  return { success: false, message: 'Scheduler already stopped' };
}

/**
 * 📊 Get scheduler status
 */
function getReelSchedulerStatus() {
  return {
    isRunning: schedulerInterval !== null,
    checkInterval: CHECK_INTERVAL / 1000,
    bufferTime: BUFFER_TIME / 60000,
  };
}

/**
 * 🔄 Sync reels from React
 */
function syncScheduledReels(reels) {
  try {
    console.log(`🔄 Syncing ${reels.length} reels from React...`);
    
    // Log details
    reels.forEach((reel, i) => {
      console.log(`   [${i}] ID: ${reel.id}, Status: ${reel.status}, Time: ${reel.scheduledTime}`);
    });
    
    saveScheduledReels(reels);
    console.log(`✅ Synchronized ${reels.length} reels`);
    return { success: true };
  } catch (error) {
    console.error('❌ Reels synchronization error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 📋 Get reels list
 */
function getReels() {
  return loadScheduledReels();
}

// ===== EXPORT =====
module.exports = {
  startReelScheduler,
  stopReelScheduler,
  getReelSchedulerStatus,
  syncScheduledReels,
  getReels,
  checkAndPostScheduledReels,
};