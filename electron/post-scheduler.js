// 🕐 POST SCHEDULER - TỰ ĐỘNG ĐĂNG BÀI INSTAGRAM
// Kiểm tra mỗi phút xem có bài nào đến giờ đăng không

const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const CryptoJS = require('crypto-js');

// ===== CONSTANTS =====
const CHECK_INTERVAL = 60 * 1000; // 60 giây = 1 phút
const SECRET_KEY = 'your-secret-key-change-this-later';

// ✅ BUFFER TIME 2 phút (nếu trễ quá 2 phút → Missed)
const BUFFER_TIME = 2 * 60 * 1000; // 2 phút

// ✅ Helper: Get posts file path (called at runtime, not at import)
const getPostsFilePath = () => path.join(app.getPath('userData'), 'scheduled-posts.json');

let schedulerInterval = null;
let mainWindow = null;

/**
 * 📂 Đọc danh sách bài đã lên lịch từ file
 */
function loadScheduledPosts() {
  try {
    const POSTS_FILE = getPostsFilePath();
    if (!fs.existsSync(POSTS_FILE)) {
      console.log('📁 There is no scheduled-posts.json file yet, create a new one...');
      fs.writeFileSync(POSTS_FILE, JSON.stringify([]));
      return [];
    }

    const data = fs.readFileSync(POSTS_FILE, 'utf-8');
    const posts = JSON.parse(data);
    console.log(`📂 Loaded ${posts.length} posts from file`);
    return posts;
  } catch (error) {
    console.error('❌ Error reading scheduled posts:', error);
    return [];
  }
}

/**
 * 💾 Lưu danh sách bài đã cập nhật
 */
function saveScheduledPosts(posts) {
  try {
    // ✅ FIX: Thêm dòng này để định nghĩa POSTS_FILE
    const POSTS_FILE = getPostsFilePath();
    
    // ✅ VALIDATE: Đảm bảo tất cả posts có status
    const validPosts = posts.map(post => {
      if (!post.status) {
        console.log(`⚠️ WARNING: Post ${post.id} has no status! Setting to 'Scheduled'`);
        return { ...post, status: 'Scheduled' };
      }
      return post;
    });
    
    fs.writeFileSync(POSTS_FILE, JSON.stringify(validPosts, null, 2));
    console.log('✅ Saved scheduled posts');
  } catch (error) {
    console.error('❌ Error saving scheduled posts:', error);
  }
}

/**
 * ⏰ Kiểm tra và đăng bài tự động
 */
async function checkAndPostScheduledPosts() {
  const now = new Date();
  console.log(`\n⏰ [${now.toLocaleString('vi-VN')}] Check scheduled posts...`);

  const posts = loadScheduledPosts();
  
  // ✅ DEBUG: Log tất cả posts
  console.log(`📋 Total posts in file: ${posts.length}`);
  if (posts.length === 0) {
    console.log('   ℹ️ No posts to check');
    return;
  }
  
  posts.forEach((post, i) => {
    const scheduledTime = new Date(post.scheduledTime);
    const timeDiff = now.getTime() - scheduledTime.getTime();
    console.log(`   [${i}] ID: ${post.id}, Status: ${post.status}, Caption: "${post.caption?.substring(0, 30) || 'EMPTY'}...", Media: ${post.media?.length || 0}, Scheduled: ${scheduledTime.toLocaleString('vi-VN')}, Diff: ${Math.round(timeDiff / 1000)}s, CookiesPath: ${post.cookiesPath ? '✅' : '❌'}`);
  });
  
  const postsToPublish = [];

  // 🔍 Tìm bài nào đã đến giờ đăng
  posts.forEach((post) => {
    // ✅ CHỈ LẤY BÀI STATUS = "Scheduled" hoặc "Failed" (để retry)
    if (post.status !== 'Scheduled' && post.status !== 'Failed') {
      console.log(`   ⏭️ Skip post ${post.id} - Status: ${post.status}`);
      return;
    }

    const scheduledTime = new Date(post.scheduledTime);
    const timeDiff = now.getTime() - scheduledTime.getTime();
    
    console.log(`   🔍 Post ${post.id}: Scheduled at ${scheduledTime.toLocaleString('vi-VN')}`);
    console.log(`      Time diff: ${Math.round(timeDiff / 1000)}s (${Math.round(timeDiff / 60000)} minutes)`);
    console.log(`      Buffer time: ${BUFFER_TIME / 60000} minutes, Check: ${timeDiff >= -30000 && timeDiff <= BUFFER_TIME}`);

    // Kiểm tra xem đã đến giờ chưa
    if (timeDiff >= 0) { // ✅ Chỉ post khi ĐÃ ĐẾN GIỜ hoặc sau
      if (timeDiff > BUFFER_TIME) {
        // Quá buffer time → Missed
        console.log(`   ⚠️ Post ID ${post.id} missed schedule (>${BUFFER_TIME/60000} mins late)`);
        const allPosts = loadScheduledPosts();
        const idx = allPosts.findIndex(p => p.id === post.id);
        if (idx !== -1) {
          allPosts[idx].status = 'Missed';
          allPosts[idx].missedAt = new Date().toISOString();
          saveScheduledPosts(allPosts);
          
          // ✅ GỬI EVENT VỀ REACT
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('post-missed', {
              postId: post.id,
              missedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        // Trong vòng buffer time → Đăng bình thường
        console.log(`   📌 Post "${post.caption?.substring(0, 30) || post.id}..." is ready to publish!`);
        postsToPublish.push(post);
      }
    } else {
      console.log(`   ⏳ Post ${post.id} not yet time (${Math.round(-timeDiff / 1000)}s to go)`);
    }
  });

  // 📤 Đăng các bài đã đến giờ (TUẦN TỰ)
  if (postsToPublish.length > 0) {
    console.log(`\n🚀 Have ${postsToPublish.length} post(s) to publish!`);

    for (const post of postsToPublish) {
      console.log(`\n═══════════════════════════════════`);
      console.log(`▶️ PUBLISHING POST ${post.id}`);
      console.log(`═══════════════════════════════════`);
      await publishPost(post);
      // Đợi 5 giây giữa các bài
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } else {
    console.log('✅ There are no articles to post at this time.');
  }
}

/**
 * 📤 Đăng bài lên Instagram
 */
async function publishPost(post) {
  console.log(`\n📤 Start posting ID: ${post.id}`);
  console.log(`📝 Caption: "${post.caption?.substring(0, 50) || 'No caption'}..."`);
  console.log(`🖼️ Media: ${post.media?.length || 0} files`);
  console.log(`👤 Username: ${post.username}`);
  console.log(`🍪 Cookies path: ${post.cookiesPath}`);

  // ✅ VALIDATE: Check media format
  if (post.media && post.media.length > 0) {
    console.log('📋 Media details:');
    post.media.forEach((m, i) => {
      console.log(`   [${i}] Type: ${m.type}, URL: ${m.url?.substring(0, 50)}...`);
    });
  } else {
    console.warn('⚠️ Warning: Post has no media attached');
  }

  // ✅ VALIDATE: Check if post has required data
  if (!post.caption && (!post.media || post.media.length === 0)) {
    console.warn('⚠️ Warning: Post has no caption and no media');
  }

  if (!post.cookiesPath) {
    console.error('❌ ERROR: Post is missing cookiesPath - cannot post!');
    const allPosts = loadScheduledPosts();
    const index = allPosts.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      allPosts[index].status = 'Failed';
      allPosts[index].error = 'Missing cookiesPath - account not properly configured';
      allPosts[index].failedAt = new Date().toISOString();
      saveScheduledPosts(allPosts);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('post-publishing-error', {
        postId: post.id,
        error: 'Missing cookiesPath - please re-login to the account',
      });
    }
    return;
  }

  // ============================================
  // 🔥 BƯỚC 1: ĐỔI STATUS = "Posting" NGAY LẬP TỨC
  // ============================================
  try {
    const allPosts = loadScheduledPosts();
    const index = allPosts.findIndex((p) => p.id === post.id);
    
    if (index === -1) {
      console.log('⚠️ No posts found in file');
      return;
    }

    // 🔒 CHECK: Nếu đã Posting/Posted → SKIP
    if (allPosts[index].status !== 'Scheduled') {
      console.log(`⏭️ Skip Post ${post.id} - Already ${allPosts[index].status}`);
      return;
    }

    // ✅ ĐỔI STATUS = "Posting"
    allPosts[index].status = 'Posting';
    allPosts[index].startedAt = new Date().toISOString();
    saveScheduledPosts(allPosts);
    console.log('✅ Status changed to "Posting" → Avoid duplicate posting!');
    console.log(`⏰ Started at: ${allPosts[index].startedAt}`);

    // Gửi event về React
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('📢 Sending post-status-update event to React...');
      mainWindow.webContents.send('post-status-update', {
        postId: post.id,
        status: 'Posting',
      });
      console.log('✅ Event sent to React');
    } else {
      console.error('❌ mainWindow is destroyed or not available!');
    }

  } catch (error) {
    console.error('❌ Error when changing status:', error);
    return;
  }

  // ============================================
  // BƯỚC 2: LOAD COOKIES
  // ============================================
  let cookies = [];
  try {
    if (!post.cookiesPath) {
      throw new Error('CookiesPath not found');
    }

    console.log('📂 Loading cookies from:', post.cookiesPath);
    
    if (!fs.existsSync(post.cookiesPath)) {
      throw new Error(`Cookies file not found at: ${post.cookiesPath}`);
    }
    
    const fileData = fs.readFileSync(post.cookiesPath, 'utf-8');
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
    
    // Đổi status thành Failed
    const allPosts = loadScheduledPosts();
    const index = allPosts.findIndex((p) => p.id === post.id);
    if (index !== -1) {
      allPosts[index].status = 'Failed';
      allPosts[index].error = 'Unable to load cookies: ' + error.message;
      allPosts[index].failedAt = new Date().toISOString();
      saveScheduledPosts(allPosts);
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('post-publishing-error', {
        postId: post.id,
        error: 'Cookie error: ' + error.message,
      });
    }
    return;
  }

  // ============================================
  // BƯỚC 3: ĐĂNG BÀI
  // ============================================
  let result;
  try {
    const { postToInstagram } = require('./instagram-post');
    console.log('🚀 Calling postToInstagram()...');
    console.log('📦 Full post object:', JSON.stringify({
      id: post.id,
      caption: post.caption?.substring(0, 50),
      mediaCount: post.media?.length,
      username: post.username,
      hasShareToThreads: post.shareToThreads,
    }, null, 2));

    // ✅ FIX: Add timeout to prevent hanging forever
    const timeout = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('postToInstagram timeout after 5 minutes - Instagram automation took too long'));
      }, 5 * 60 * 1000); // 5 minutes timeout
    });

    result = await Promise.race([
      postToInstagram({
        content: post.caption,
        media: post.media,
        cookies: cookies,
        shareToThreads: post.shareToThreads || false,
        username: post.username,
      }),
      timeout
    ]);

    console.log('✅ postToInstagram() completed!');
    console.log('🔍 Result:', JSON.stringify(result, null, 2));

    // ============================================
    // BƯỚC 4: CẬP NHẬT STATUS = "Posted"
    // ============================================
    if (result && result.success) {
      const allPosts = loadScheduledPosts();
      const index = allPosts.findIndex((p) => p.id === post.id);
      
      if (index !== -1) {
        allPosts[index].status = 'Posted';
        allPosts[index].publishedAt = new Date().toISOString();
        allPosts[index].postUrl = result.postUrl || '';
        saveScheduledPosts(allPosts);
        console.log('✅ Updated status = "Posted"');
      }

      // Gửi event về React
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('post-publishing-success', {
          postId: post.id,
          publishedAt: new Date().toISOString(),
          postUrl: result.postUrl || '',
        });
      }
    } else {
      throw new Error(result?.error || 'Posting failed - unknown error');
    }

  } catch (error) {
    console.error(`❌ Error posting ID ${post.id}:`, error.message);
    
    // Đổi status thành Failed
    const allPosts = loadScheduledPosts();
    const index = allPosts.findIndex((p) => p.id === post.id);
    
    if (index !== -1) {
      allPosts[index].status = 'Failed';
      allPosts[index].error = error.message;
      allPosts[index].failedAt = new Date().toISOString();
      saveScheduledPosts(allPosts);
      console.log('❌ Updated status = "Failed"');
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('post-publishing-error', {
        postId: post.id,
        error: error.message,
      });
    }
  }
}

/**
 * 🚀 Khởi động scheduler
 */
function startScheduler(window) {
  mainWindow = window;

  if (schedulerInterval) {
    console.log('⚠️ Scheduler is already running!');
    return { success: false, message: 'Scheduler is already running' };
  }

  console.log('🚀 Start Post Scheduler...');
  console.log(`⏱️ Check interval: ${CHECK_INTERVAL / 1000} seconds`);
  console.log(`⏱️ Buffer time: ${BUFFER_TIME / 60000} minutes`);
  console.log(`📁 Posts file: ${getPostsFilePath()}`);

  // Kiểm tra ngay lần đầu
  checkAndPostScheduledPosts();

  // Sau đó kiểm tra định kỳ mỗi phút
  schedulerInterval = setInterval(() => {
    checkAndPostScheduledPosts();
  }, CHECK_INTERVAL);

  console.log('✅ Scheduler started!');
  return { success: true, message: 'Scheduler has started' };
}

/**
 * 🛑 Dừng scheduler
 */
function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 Post Scheduler has stopped');
    return { success: true, message: 'Scheduler has stopped' };
  }
  
  console.log('⚠️ Scheduler has stopped.');
  return { success: false, message: 'Scheduler has stopped' };
}

/**
 * 📊 Lấy trạng thái scheduler
 */
function getSchedulerStatus() {
  return {
    isRunning: schedulerInterval !== null,
    checkInterval: CHECK_INTERVAL / 1000,
    bufferTime: BUFFER_TIME / 60000,
  };
}

/**
 * 🔄 Đồng bộ posts từ React
 */
function syncPosts(posts) {
  try {
    console.log(`\n📤 ====== SYNCING ${posts.length} POSTS FROM REACT ======`);
    
    // Log chi tiết
    posts.forEach((post, i) => {
      console.log(`   [${i}] Post ID: ${post.id}`);
      console.log(`       ├─ Username: ${post.username}`);
      console.log(`       ├─ CookiesPath: ${post.cookiesPath || '❌ MISSING'}`);
      console.log(`       ├─ ScheduledTime: ${post.scheduledTime}`);
      console.log(`       └─ Caption: "${post.caption?.substring(0, 30) || 'EMPTY'}..."`);
    });
    
    saveScheduledPosts(posts);
    console.log(`✅ Saved ${posts.length} posts to scheduler file`);
    
    // ✅ CRITICAL FIX: Trigger check immediately instead of waiting 60 seconds!
    console.log(`⏱️ Triggering immediate check instead of waiting for next interval...`);
    setTimeout(() => {
      console.log(`🔥 ====== IMMEDIATE CHECK TRIGGERED by syncPosts() ======`);
      checkAndPostScheduledPosts();
    }, 100); // Small delay to ensure file is written
    
    return { success: true };
  } catch (error) {
    console.error('❌ Posts synchronization error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 📋 Lấy danh sách posts
 */
function getPosts() {
  return loadScheduledPosts();
}

// ===== EXPORT =====
module.exports = {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  syncPosts,
  getPosts,
  checkAndPostScheduledPosts, // ✅ THÊM: Export để trigger kiểm tra ngay lập tức
};