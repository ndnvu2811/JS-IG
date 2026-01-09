const { chromium } = require('playwright-core');
const { getWindowSize } = require('./window-settings');

let activeBrowsers = {}; // Lưu browser instances theo accountId

/**
 * Mở browser với cookies đã lưu
 * @param {boolean} mobileMode - Nếu true, mở dạng mobile (có Reel)
 */
async function openBrowser(accountId, username, cookies, mobileMode = false) {
  try {
    // Nếu browser đã mở rồi thì không mở nữa
    if (activeBrowsers[accountId]) {
      console.log('⚠️ Browser already open for:', username);
      return { success: false, error: 'Browser already open' };
    }

    console.log('🚀 Opening browser for:', username);
    console.log('📱 Mobile mode:', mobileMode ? 'YES' : 'NO');

    // ✅ LOAD WINDOW SIZE
    const windowSize = getWindowSize();

    const browser = await chromium.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${windowSize.width},${windowSize.height}`,
      ],
    });

    // ===== MOBILE MODE CONFIG =====
    const contextOptions = mobileMode ? {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    viewport: null,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    } : {
      viewport: null,
    };

    const context = await browser.newContext(contextOptions);

    // Set cookies
    await context.addCookies(cookies);

    const page = await context.newPage();

    // Mở trang Instagram
    await page.goto('https://www.instagram.com/', {
      timeout: 15000,
    });

    console.log('✅ Browser opened successfully!');

    // Lưu browser instance
    activeBrowsers[accountId] = { browser, context, page };

    // Lắng nghe khi user đóng browser thủ công
    browser.on('disconnected', () => {
      console.log('🔴 Browser closed by user:', username);
      delete activeBrowsers[accountId];
    });

    return { success: true };

  } catch (error) {
    console.error('❌ Failed to open browser:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Đóng browser
 */
async function closeBrowser(accountId) {
  try {
    const browserData = activeBrowsers[accountId];

    if (!browserData) {
      return { success: false, error: 'Browser not found' };
    }

    console.log('🔴 Closing browser for account:', accountId);

    await browserData.browser.close();
    delete activeBrowsers[accountId];

    console.log('✅ Browser closed successfully!');

    return { success: true };

  } catch (error) {
    console.error('❌ Failed to close browser:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Kiểm tra browser có đang mở không
 */
function isBrowserOpen(accountId) {
  return !!activeBrowsers[accountId];
}

/**
 * ✅ NEW: Lấy tất cả active browsers
 */
function getAllActiveBrowsers() {
  return Object.keys(activeBrowsers).map(id => ({
    accountId: id,
    browser: activeBrowsers[id].browser
  }));
}

/**
 * ✅ NEW: Đóng TẤT CẢ browsers đang mở
 * Waits up to 5 seconds for browsers to close gracefully
 */
async function closeAllBrowsers() {
  console.log('🛑 Closing ALL active browsers...');
  
  const accountIds = Object.keys(activeBrowsers);
  console.log(`📊 Found ${accountIds.length} active browser(s):`, accountIds);
  
  if (accountIds.length === 0) {
    console.log('✅ No active browsers to close');
    return 0;
  }
  
  let closedCount = 0;
  const closePromises = [];
  
  // Start closing all browsers in parallel with timeout
  for (const accountId of accountIds) {
    const closePromise = (async () => {
      try {
        const browserData = activeBrowsers[accountId];
        
        if (browserData && browserData.browser) {
          // Add 5 second timeout for each browser close
          const closeWithTimeout = Promise.race([
            browserData.browser.close(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Close timeout')), 5000)
            )
          ]);
          
          await closeWithTimeout;
          delete activeBrowsers[accountId];
          closedCount++;
          console.log(`✅ Closed browser for account: ${accountId}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error closing browser ${accountId}: ${error.message}`);
        // Remove it anyway to prevent stuck instances
        delete activeBrowsers[accountId];
      }
    })();
    
    closePromises.push(closePromise);
  }
  
  // Wait for all close operations
  await Promise.allSettled(closePromises);
  
  console.log(`🏁 Total browsers closed: ${closedCount}/${accountIds.length}`);
  
  return closedCount;
}

module.exports = { 
  openBrowser, 
  closeBrowser, 
  isBrowserOpen, 
  getAllActiveBrowsers, 
  closeAllBrowsers 
};