const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const CryptoJS = require('crypto-js');
const { getWindowSize } = require('./window-settings');

/**
 * Hàm chính - Auto-Browse Newfeed: Scroll + Like định kỳ
 */
async function autoBrowseNewfeed(account, settings, onProgress) {
  let browser = null;
  
  try {
    console.log(`🚀 Starting Auto-Browse for: ${account.username}`);
    
    // ===================================================
    // BƯỚC 1: Load Cookies (Support both Plain JSON & Encrypted)
    // ===================================================
    const SECRET_KEY = 'your-secret-key-change-this-later';
    let savedCookies = [];

    if (account.cookies && account.cookies.length > 0) {
      console.log(`✅ Using cookies from memory: ${account.cookies.length} cookies`);
      savedCookies = account.cookies;
    } else if (account.cookiesPath && fs.existsSync(account.cookiesPath)) {
      console.log(`📂 Loading cookies from: ${account.cookiesPath}`);
      
      try {
        const fileData = fs.readFileSync(account.cookiesPath, 'utf-8');
        
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
          savedCookies = parsedFile.cookies;
        } 
        // Format 2: Encrypted JSON (new format) - { encryptedData: "..." }
        else if (parsedFile.encryptedData) {
          console.log('✅ Detected ENCRYPTED format');
          const encryptedData = parsedFile.encryptedData;
          
          let decryptedBytes;
          try {
            decryptedBytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
          } catch (decryptError) {
            throw new Error(`Decryption failed: ${decryptError.message}`);
          }
          
          let decryptedText;
          try {
            decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
          } catch (toStringError) {
            throw new Error(`Failed to convert decrypted bytes to UTF8: ${toStringError.message}`);
          }
          
          if (!decryptedText) {
            throw new Error('Failed to decrypt cookies - empty result');
          }
          
          const cookieData = JSON.parse(decryptedText);
          savedCookies = cookieData.cookies || cookieData;
        } 
        else {
          throw new Error('Unknown cookies file format - neither plain JSON nor encrypted');
        }
        
        console.log(`✅ Cookies loaded: ${savedCookies.length} items`);
      } catch (error) {
        throw new Error(`Failed to load cookies: ${error.message}`);
      }
    } else {
      throw new Error(`Cookies not found for ${account.username}`);
    }
    
    // ===================================================
    // BƯỚC 2: Khởi động Browser
    // ===================================================
    const windowSize = getWindowSize();
    const launchOptions = {
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${windowSize.width},${windowSize.height}`,
        '--disable-gpu-shader-disk-cache',
        '--disable-gpu-program-cache',
        '--disk-cache-dir=nul',
        '--media-cache-dir=nul',
      ],
    };

    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({ viewport: null });
    
    console.log('🍪 Adding cookies...');
    await context.addCookies(savedCookies);
    
    const page = await context.newPage();

    // ===================================================
    // BƯỚC 3: Mở Instagram
    // ===================================================
    console.log('📱 Opening Instagram...');
    onProgress({ account: account.username, status: 'Opening Instagram...', progress: 8 });

    await page.goto('https://www.instagram.com', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Đóng popup
    try {
      const okButton = page.getByText('OK', { exact: true });
      await okButton.click({ timeout: 3000 });
      console.log('✅ Popup closed');
    } catch (err) {
      console.log('ℹ️ No popup');
    }

    await page.waitForTimeout(1500);

    // Kiểm tra login
    const isLoggedIn = await page.locator('svg[aria-label="Home"]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      throw new Error(`Account ${account.username} session expired`);
    }

    console.log(`✅ Logged in as ${account.username}`);
    await page.waitForTimeout(2000);
    
    // ===================================================
    // BƯỚC 4: Auto-Browse - LOGIC ĐƠN GIẢN
    // ===================================================
    const duration = settings.autoBrowseDuration; // Tổng thời gian (giây)
    const scrollInterval = settings.autoBrowseScrollInterval; // Thời gian giữa các scroll (giây)
    const enableLike = settings.autoBrowseEnableLike;
    const maxLikes = settings.autoBrowseLikeCount;
    
    console.log(`⏱️ Duration: ${duration}s`);
    console.log(`📜 Scroll interval: ${scrollInterval}s`);
    console.log(`❤️ Auto-like: ${enableLike ? 'YES' : 'NO'}`);
    if (enableLike) {
      console.log(`🎯 Max likes: ${maxLikes}`);
    }
    
    let likesCount = 0;
    let lastLikeTime = 0; // Timestamp lần like cuối
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);
    
    onProgress({ account: account.username, status: 'Browsing newfeed...', progress: 10 });
    
    while (Date.now() < endTime) {
      // ✅ CHECK: Browser/Page còn hoạt động không?
      try {
        if (!browser.isConnected() || page.isClosed()) {
          console.log('⚠️ Browser or page was closed, stopping...');
          break;
        }
      } catch (checkError) {
        console.log('⚠️ Browser check failed, stopping...');
        break;
      }

      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const progressPercent = Math.min(90, 10 + (elapsed / duration) * 80);
      
      // ===================================================
      // SCROLL XUỐNG
      // ===================================================
      const scrollAmount = Math.floor(Math.random() * 500) + 300;
      await page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
      
      console.log(`⬇️ Scrolled ${scrollAmount}px`);
      
      // ===================================================
      // LIKE MỖI 60S (NẾU ENABLE)
      // ===================================================
      const now = Date.now();
      const timeSinceLastLike = (now - lastLikeTime) / 1000; // giây
      
      if (enableLike && likesCount < maxLikes && timeSinceLastLike >= 60) {
        console.log(`\n❤️ Time to like! (${timeSinceLastLike.toFixed(0)}s since last like)`);
        
        const likeSuccess = await likeRandomPost(page);
        
        if (likeSuccess) {
          likesCount++;
          lastLikeTime = now;
          console.log(`✅ Liked post (${likesCount}/${maxLikes})`);
          
          onProgress({ 
            account: account.username, 
            status: `Liked post (${likesCount}/${maxLikes})`, 
            progress: progressPercent 
          });
          
          // Nếu đủ likes, thoát
          if (likesCount >= maxLikes) {
            console.log(`✅ Reached max likes (${maxLikes})`);
            break;
          }
        } else {
          console.log(`⚠️ Failed to like, will retry in next cycle`);
        }
      }
      
      // Đợi scroll interval
      console.log(`⏳ Waiting ${scrollInterval}s...\n`);
      await page.waitForTimeout(scrollInterval * 1000);
      
      onProgress({ 
        account: account.username, 
        status: `Browsing... (${elapsed}s/${duration}s, Likes: ${likesCount}/${maxLikes})`, 
        progress: progressPercent 
      });
    }
    
    // ===================================================
    // HOÀN THÀNH
    // ===================================================
    console.log(`✅ Completed! Total likes: ${likesCount}/${maxLikes}`);
    onProgress({ account: account.username, status: 'Completed!', progress: 100 });
    
    // ✅ Safe close browser
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
    } catch (closeError) {
      console.log('⚠️ Browser already closed');
    }
    
    return {
      success: true,
      account: account.username,
      likesCount,
    };
    
  } catch (error) {
    console.error(`❌ Error for ${account.username}:`, error.message);
    
    // ✅ Safe close browser on error
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
    } catch (closeError) {
      console.log('⚠️ Browser already closed');
    }
    
    return {
      success: false,
      account: account.username,
      error: error.message,
    };
  }
}

/**
 * Like bài viết ngẫu nhiên trên newfeed (KHÔNG mở modal)
 */
async function likeRandomPost(page) {
  try {
    console.log(`🎲 Finding a post to like...`);
    
    // Tìm tất cả nút Like chưa được like (aria-label="Like")
    const likeButtons = await page.locator('svg[aria-label="Like"]').all();
    
    if (likeButtons.length === 0) {
      console.log(`❌ No unliked posts found`);
      return false;
    }
    
    console.log(`📊 Found ${likeButtons.length} unliked posts`);
    
    // Chọn ngẫu nhiên 1 nút Like
    const randomIndex = Math.floor(Math.random() * likeButtons.length);
    const randomLikeButton = likeButtons[randomIndex];
    
    // Scroll đến nút Like để đảm bảo visible
    await randomLikeButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Click Like
    const isVisible = await randomLikeButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await randomLikeButton.click();
      await page.waitForTimeout(1000);
      console.log(`✅ Liked post #${randomIndex}`);
      return true;
    }
    
    console.log(`⚠️ Like button not visible`);
    return false;
    
  } catch (error) {
    console.error('❌ Error liking:', error.message);
    return false;
  }
}

/**
 * Chạy cho nhiều accounts
 */
async function runAutoBrowse(allAccounts, settings, onProgress) {
  // ✅ LỌC CHỈ LẤY ACCOUNTS ĐÃ CHỌN
  const selectedAccounts = allAccounts.filter(acc => 
    settings.autoBrowseAccounts.includes(acc.id)
  );
  
  console.log(`📋 Selected ${selectedAccounts.length} account(s) for Auto-Browse`);
  console.log(`   IDs: ${settings.autoBrowseAccounts.join(', ')}`);
  console.log(`   Usernames: ${selectedAccounts.map(a => a.username).join(', ')}`);
  
  if (selectedAccounts.length === 0) {
    console.log('⚠️ No accounts selected');
    return [];
  }
  
  const results = [];
  
  if (settings.autoBrowseRunMode === 'parallel') {
    console.log('🔀 Running in PARALLEL');
    const promises = selectedAccounts.map(account => 
      autoBrowseNewfeed(account, settings, onProgress)
    );
    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);
  } else {
    console.log('📋 Running in SEQUENTIAL');
    for (const account of selectedAccounts) {
      const result = await autoBrowseNewfeed(account, settings, onProgress);
      results.push(result);
    }
  }
  
  return results;
}

module.exports = {
  autoBrowseNewfeed,
  runAutoBrowse,
};