const { chromium } = require('playwright-core');
const fs = require('fs');
const CryptoJS = require('crypto-js');
const { getWindowSize } = require('./window-settings');

/**
 * Auto-Follow Users từ target account
 */
async function autoFollowUsers(account, settings, onProgress) {
  let browser = null;
  
  try {
    console.log(`🚀 Starting Auto-Follow for: ${account.username}`);
    
    // ===================================================
    // BƯỚC 1: Load Cookies (Support both Plain JSON & Encrypted)
    // ===================================================
    const SECRET_KEY = 'your-secret-key-change-this-later';
    let savedCookies = [];

    if (account.cookies && account.cookies.length > 0) {
      savedCookies = account.cookies;
      console.log('🍪 Using cookies from memory:', savedCookies.length, 'items');
    } else if (account.cookiesPath && fs.existsSync(account.cookiesPath)) {
      console.log('📂 Loading cookies from:', account.cookiesPath);
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
      
      console.log('✅ Cookies loaded:', savedCookies.length, 'items');
    } else {
      throw new Error(`Cookies not found for ${account.username}`);
    }
    
    // ===================================================
    // BƯỚC 2: Khởi động Browser
    // ===================================================
    const windowSize = getWindowSize();
    browser = await chromium.launch({
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
    });

    const context = await browser.newContext({ viewport: null });
    await context.addCookies(savedCookies);
    const page = await context.newPage();

    // ===================================================
    // BƯỚC 3: Mở Instagram và đóng popup
    // ===================================================
    console.log('📱 Opening Instagram...');
    await page.goto('https://www.instagram.com', { timeout: 30000 });
    await page.waitForTimeout(3000);

    try {
      const okButton = page.getByText('OK', { exact: true });
      await okButton.click({ timeout: 3000 });
    } catch (err) {}

    await page.waitForTimeout(1500);

    const isLoggedIn = await page.locator('svg[aria-label="Home"]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      throw new Error(`Account ${account.username} session expired`);
    }

    console.log(`✅ Logged in as ${account.username}`);
    
    // ===================================================
    // BƯỚC 4: Đi tới target account profile
    // ===================================================
    const targetUsername = settings.autoFollowTargetUsername.replace('@', '');
    const profileUrl = `https://www.instagram.com/${targetUsername}/`;
    
    console.log(`🔍 Opening target account: ${targetUsername}`);
    onProgress({ account: account.username, status: `Opening ${targetUsername} profile...`, progress: 10 });
    
    await page.goto(profileUrl, { timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // ===================================================
    // BƯỚC 5: Click Followers hoặc Following button
    // ===================================================
    const source = settings.autoFollowSource; // 'followers' or 'following'
    console.log(`👥 Source: ${source}`);
    
    // ⚠️ VẤN ĐỀ 1: Selector này có thể sai tùy ngôn ngữ
    const buttonText = source === 'followers' ? 'followers' : 'following';
    const sourceButton = page.locator(`a:has-text("${buttonText}")`).first();
    
    await sourceButton.click();
    console.log(`✅ Clicked ${buttonText} button`);
    await page.waitForTimeout(3000);
    
    // ===================================================
    // BƯỚC 6: Loop follow users
    // ===================================================
    const maxFollows = settings.autoFollowCount;
    const enableLike = settings.autoFollowEnableLike;
    const enableComment = settings.autoFollowEnableComment;
    const comments = settings.autoFollowComments;
    
    let followsCount = 0;
    let attempts = 0;
    const maxAttempts = maxFollows * 3;
    
    while (followsCount < maxFollows && attempts < maxAttempts) {
      attempts++;
      
      console.log(`\n📌 Attempt ${attempts} (Follows: ${followsCount}/${maxFollows})`);
      
      // ⚠️ VẤN ĐỀ 2: Function này tìm user SAI
      const result = await findAndProcessUser(page, settings, enableLike, enableComment, comments);
      
      if (result && result.success) {
        followsCount++;
        console.log(`✅ Successfully followed user (${followsCount}/${maxFollows})`);
        
        onProgress({
          account: account.username,
          status: `Followed ${followsCount}/${maxFollows} users`,
          progress: 10 + (followsCount / maxFollows) * 80
        });
        
      } else if (result && result.noMoreUsers) {
        console.log(`⚠️ No more unfollowed users found`);
        break;
      } else {
        console.log(`⚠️ Failed to process user, continuing...`);
      }
      
      // Scroll popup để load thêm users
      await scrollFollowersPopup(page);
      await page.waitForTimeout(3000);
    }
    
    console.log(`✅ Completed! Total follows: ${followsCount}/${maxFollows}`);
    onProgress({ account: account.username, status: 'Completed!', progress: 100 });
    
    await browser.close();
    
    return {
      success: true,
      account: account.username,
      followsCount,
    };
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    if (browser) await browser.close();
    
    return {
      success: false,
      account: account.username,
      error: error.message,
    };
  }
}

async function findAndProcessUser(page, settings, enableLike, enableComment, comments) {
  try {
    // ===== BƯỚC 1: TÌM USER CHƯA FOLLOW (CÓ SCROLL) =====
    console.log('🔍 BƯỚC 1: Tìm user chưa follow...');

    let targetButton = null;
    let targetUsername = null;

    // Cho phép scroll tối đa 10 lần để tìm user chưa follow
    for (let attempt = 0; attempt < 10 && !targetButton; attempt++) {
      const allButtons = await page.locator('div[role="dialog"] button').all();
      console.log(`📊 Lần ${attempt + 1}: Tìm thấy ${allButtons.length} buttons`);

      // Tìm nút Follow trong batch hiện tại
      for (const btn of allButtons) {
        const text = (await btn.textContent().catch(() => ''))?.trim();

        if (text === 'Follow' || text === 'Theo dõi') {
          targetButton = btn;

          // Lấy row cha để tìm username
          const row = btn.locator('xpath=ancestor::div[3]');
          const link = row.locator('a[href^="/"]').first();
          const href = await link.getAttribute('href').catch(() => null);

          if (href) {
            targetUsername = href.replace(/\//g, '');
            console.log(`✅ BƯỚC 1 XONG: Tìm thấy ${targetUsername}`);
          } else {
            console.log('⚠️ BƯỚC 1: Tìm thấy Follow nhưng không lấy được username');
          }
          break;
        }
      }

      // Nếu đã tìm được thì thoát vòng lặp, không cần scroll nữa
      if (targetButton) break;

      // Nếu chưa tìm được → scroll popup xuống để load thêm user
      console.log('↘️ Chưa tìm thấy user chưa follow, scroll popup xuống...');
      await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]');
        if (!dialog) return;

        // tìm phần tử có thể scroll bên trong dialog
        const scrollEl =
          Array.from(dialog.querySelectorAll('div')).find(
            el => el.scrollHeight > el.clientHeight
          ) || dialog;

        scrollEl.scrollBy(0, 400);
      });

      await page.waitForTimeout(1500);
    }

    if (!targetButton) {
      console.log('❌ BƯỚC 1 THẤT BẠI: Scroll hết mà vẫn không tìm thấy user chưa follow');
      return { success: false, noMoreUsers: true };
    }
    
    // ===== BƯỚC 2: CLICK USERNAME =====
    console.log(`🖱️ BƯỚC 2: Click vào ${targetUsername}...`);

    // Tìm phần tử có text = username trong popup (Following dialog)
    const dialog = page.locator('div[role="dialog"]').first();
    const usernameNode = dialog.getByText(targetUsername, { exact: true }).first();

    const linkVisible = await usernameNode.isVisible({ timeout: 3000 }).catch(() => false);

    if (!linkVisible) {
      console.log('❌ BƯỚC 2 THẤT BẠI: Không tìm thấy username');
      return { success: false };
    }

    // Click vào username để mở profile
    await usernameNode.click({ delay: 80 });
    await page.waitForTimeout(3000);
    console.log('✅ BƯỚC 2 XONG: Đã vào profile');
    
    // ===== BƯỚC 3: TÌM POST ĐẦU TIÊN (MỚI NHẤT) =====
    console.log('📸 BƯỚC 3: Tìm post đầu tiên (mới nhất)...');

    // Chờ posts load
    await page.waitForTimeout(2000);

    // Lấy URL bài viết đầu tiên trong grid (href chứa /p/ hoặc /reel/)
    const postUrl = await page.evaluate(() => {
      const allLinks = Array.from(document.querySelectorAll('a[href]'));

      // Ưu tiên /p/ (post thường), nếu không có thì /reel/
      const postLinks = allLinks.filter(a =>
        a.href.includes('/p/') || a.href.includes('/reel/')
      );

      if (postLinks.length > 0) {
        return postLinks[0].href;
      }
      return '';
    });

    if (!postUrl) {
      console.log('⚠️ BƯỚC 3: Không tìm được URL post, bỏ qua like/comment');
      // Nhảy thẳng sang bước tiếp theo (follow...) nếu bạn có
    } else {
      console.log('✅ BƯỚC 3 XONG: Tìm thấy URL post:', postUrl);

      // ===== BƯỚC 4: MỞ POST =====
      console.log('🖱️ BƯỚC 4: Mở post mới nhất...');

      await page.goto(postUrl, { timeout: 30000, waitUntil: 'load' });
      await page.waitForTimeout(3000);

      console.log('✅ BƯỚC 4 XONG: Đã mở post');
      
      // ===== BƯỚC 5: XEM POST 60S =====
      console.log('👀 BƯỚC 5: Xem post 60s...');
      await page.waitForTimeout(10000);
      console.log('✅ BƯỚC 5 XONG: Đã xem 60s');
      
      // ===== BƯỚC 6: LIKE BÀI VIẾT / REEL BẰNG CLICK TỌA ĐỘ =====
      if (enableLike) {
        console.log('❤️ BƯỚC 6: Like bài viết bằng mouse.click...');

        // Tìm vị trí icon "Like" lớn nhất trên màn hình
        const pos = await page.evaluate(() => {
          // Lấy tất cả icon có aria-label="Like"
          var svgs = Array.prototype.slice.call(
            document.querySelectorAll('svg[aria-label="Like"]')
          );
          if (!svgs.length) return null;

          // Chọn icon có diện tích lớn nhất (tim chính của post/reel)
          var target = null;
          var maxArea = 0;

          for (var i = 0; i < svgs.length; i++) {
            var el = svgs[i];
            var rect = el.getBoundingClientRect();
            var area = rect.width * rect.height;
            if (area > maxArea) {
              maxArea = area;
              target = el;
            }
          }

          if (!target) return null;
          var r = target.getBoundingClientRect();

          // Trả về tọa độ giữa icon tim
          return {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2
          };
        });

        if (!pos) {
          console.log('❌ BƯỚC 6: Không tìm thấy icon Like nào trên màn hình');
        } else {
          console.log('📍 Click tại tọa độ:', pos.x, pos.y);
          await page.mouse.click(pos.x, pos.y, { clickCount: 1 });
          await page.waitForTimeout(1500);
          console.log('✅ BƯỚC 6 XONG: Đã click vào icon Like (post hoặc reel)');
        }
      }
 
      // ===== BƯỚC 7: COMMENT (NẾU BẬT) =====
      if (enableComment && comments.length > 0) {
        console.log('💬 BƯỚC 7: Comment...');
        const comment = comments[Math.floor(Math.random() * comments.length)];
        const textarea = page.locator('textarea[placeholder*="comment" i]').first();
        
        if (await textarea.isVisible().catch(() => false)) {
          await textarea.click();
          await page.waitForTimeout(500);
          await textarea.fill(comment);
          await page.waitForTimeout(1000);
          await page.keyboard.press('Enter');
          console.log(`✅ BƯỚC 7 XONG: Đã comment "${comment}"`);
          await page.waitForTimeout(10000);
        } else {
          console.log('⚠️ BƯỚC 7: Không tìm thấy textarea');
        }
      } else {
        console.log('⏭️ BƯỚC 7: Bỏ qua (comment chưa bật)');
      }
    }  
      // ===== BƯỚC 8: CLICK FOLLOW BÊN CẠNH USERNAME =====
      console.log('👤 BƯỚC 8: Click nút Follow cạnh tên...');

      try {
        const followBtn = page.getByRole('button', { name: /follow|theo dõi/i }).first();
        const visible = await followBtn.isVisible({ timeout: 4000 }).catch(() => false);

        if (visible) {
          await followBtn.click({ timeout: 4000 });
          console.log('✅ BƯỚC 8 XONG: Đã click Follow');

          // ⭐ CHỜ 10 GIÂY
          console.log('⏳ Chờ 10 giây sau khi follow...');
          await page.waitForTimeout(10000);

        } else {
          console.log('❌ BƯỚC 8: Nút Follow không visible');
        }

      } catch (e) {
        console.log('❌ BƯỚC 8 FAILED:', e.message);
      }

      // ===== BƯỚC 9: ĐÓNG POST =====
      console.log('🔙 BƯỚC 9: Đóng post...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(10000);
      console.log('✅ BƯỚC 9 XONG: Đã đóng post');
    
    
    // ===== BƯỚC 10: QUAY LẠI POPUP =====
    console.log('🔙 BƯỚC 10: Quay lại popup...');

    const targetUsernameUrl = settings.autoFollowTargetUsername.replace('@', '');
    const profileUrlBack = `https://www.instagram.com/${targetUsernameUrl}/`;

    await page.goto(profileUrlBack, { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Click lại button followers/following
    const sourceType = settings.autoFollowSource;
    const buttonTextBack = sourceType === 'followers' ? 'followers' : 'following';
    const sourceButtonBack = page.locator(`a:has-text("${buttonTextBack}")`).first();
    await sourceButtonBack.click();
    await page.waitForTimeout(3000);

    console.log('✅ BƯỚC 10 XONG: Đã quay lại popup');

    return { success: true };
    } catch (error) {
      console.error('❌ LỖI:', error.message);
      return { success: false };
    }
}

/**
 * Scroll popup followers để load thêm users
 * ✅ Function này OK
 */
async function scrollFollowersPopup(page) {
  try {
    await page.evaluate(() => {
      const popup = document.querySelector('div[role="dialog"]');
      if (popup) {
        const scrollableDiv = popup.querySelector('div[style*="overflow"]');
        if (scrollableDiv) {
          scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
        }
      }
    });
    console.log(`⬇️ Scrolled popup`);
  } catch (error) {
    console.log(`⚠️ Could not scroll popup`);
  }
}

/**
 * Run cho nhiều accounts
 */
async function runAutoFollow(allAccounts, settings, onProgress) {
  // ✅ LỌC CHỈ LẤY ACCOUNTS ĐÃ CHỌN
  const selectedAccounts = allAccounts.filter(acc => 
    settings.autoFollowAccounts.includes(acc.id)
  );
  
  console.log(`📋 Selected ${selectedAccounts.length} account(s) for Auto-Follow`);
  console.log(`   IDs: ${settings.autoFollowAccounts.join(', ')}`);
  console.log(`   Usernames: ${selectedAccounts.map(a => a.username).join(', ')}`);
  
  if (selectedAccounts.length === 0) {
    console.log('⚠️ No accounts selected');
    return [];
  }
  
  const results = [];
  
  if (settings.autoFollowRunMode === 'parallel') {
    console.log('🔀 Running in PARALLEL');
    const promises = selectedAccounts.map(account => autoFollowUsers(account, settings, onProgress));
    const parallelResults = await Promise.all(promises);
    results.push(...parallelResults);
  } else {
    console.log('📋 Running in SEQUENTIAL');
    for (const account of selectedAccounts) {
      const result = await autoFollowUsers(account, settings, onProgress);
      results.push(result);
    }
  }
  
  return results;
}

module.exports = {
  autoFollowUsers,
  runAutoFollow,
};