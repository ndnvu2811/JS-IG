const { chromium } = require('playwright-core');
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { getWindowSize } = require('./window-settings');

/**
 * Hàm đăng nhập Instagram tự động
 * @param {string} username - Tên đăng nhập Instagram
 * @param {string} password - Mật khẩu
 * @param {string} proxyUrl - Proxy (optional)
 * @returns {Promise<Object>} - Trả về thông tin tài khoản và cookies
 */
async function loginInstagram(username, password, proxyUrl = null) {
  let browser = null;
  
  try {
    // Trim username để loại bỏ khoảng trắng
    username = username.trim();
    
    // Cấu hình browser
    const windowSize = getWindowSize();

    const launchOptions = {
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${windowSize.width},${windowSize.height}`,
      ],
    };
    
    // Thêm proxy nếu có
    if (proxyUrl) {
      launchOptions.proxy = {
        server: proxyUrl,
      };
    }
    
    // Khởi động browser
    console.log('🚀 Opening Chrome...');

    launchOptions.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: null,
    });
    const page = await context.newPage();
    
    // Bước 1: Mở trang đăng nhập Instagram
    console.log('🔄 Navigating to Instagram login...');
    await page.goto('https://www.instagram.com/accounts/login/', {
      timeout: 15000,
    });
    
    // Đợi form đăng nhập xuất hiện
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });
    
    // Bước 2: Điền username
    console.log('✏️ Filling username...');
    await page.fill('input[name="username"]', username);
    
    // Bước 3: Điền password
    console.log('🔑 Filling password...');
    await page.fill('input[name="password"]', password);
    
    // Bước 4: Click nút đăng nhập
    console.log('🔘 Clicking login button...');
    await page.click('button[type="submit"]');
    
    // Đợi 15 giây để Instagram xử lý
    console.log('⏳ Waiting 15 seconds for Instagram to process...');
    await page.waitForTimeout(15000);
    
    // Kiểm tra URL hiện tại
    console.log('🔍 Checking current URL...');
    const currentUrl = page.url();
    
    // Nếu vẫn ở trang login = Đăng nhập thất bại
    if (currentUrl.includes('/accounts/login')) {
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('#slfErrorAlert');
        return errorElement ? errorElement.textContent : 'Incorrect password';
      });
      
      throw new Error(errorMessage);
    }
    
    // Bỏ qua popup "Save Login Info"
    if (currentUrl.includes('/accounts/onetap')) {
      console.log('⭕ Skipping "Save Login Info"...');
      try {
        await page.click('button:has-text("Not Now")', { timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('No "Save Login Info" popup found');
      }
    }
    
    // Bước 5: Vào trang profile
    console.log('👤 Navigating to profile...');
    await page.goto(`https://www.instagram.com/${username}/`, {
      timeout: 15000,
    });
    
    // Đợi cho đến khi thấy text "followers" xuất hiện
    console.log('⏳ Waiting for profile stats to load...');
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('followers') || document.body.innerText.includes('follower'),
        { timeout: 15000 }
      );
      console.log('✅ Stats loaded!');
      await page.waitForTimeout(3000); // Đợi thêm 3 giây cho chắc
    } catch (e) {
      console.log('⚠️ Timeout waiting for stats, proceeding anyway...');
      await page.waitForTimeout(10000);
    }
    
    // Bước 6: Lấy page text để debug
    console.log('📊 Extracting profile data...');
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Page text sample (first 1000 chars):');
    console.log(pageText.substring(0, 1000));
    console.log('---');
    
    // Bước 7: Scrape dữ liệu profile (giống instagram-refresh.js)
    const profileData = await page.evaluate(() => {
      // 1. LẤY AVATAR - thử nhiều selector
      let avatar = '';
      const avatarSelectors = [
        'img[alt*="profile picture"]',
        'img[alt*="Profile picture"]',
        'header img[alt]',
        'img[data-testid="user-avatar"]',
        'canvas + img'
      ];
      
      for (const selector of avatarSelectors) {
        const img = document.querySelector(selector);
        if (img && img.src && img.src.startsWith('http')) {
          avatar = img.src;
          break;
        }
      }
      
      // 2. LẤY SỐ LIỆU - thử nhiều cách
      let followers = 0;
      let following = 0;
      let posts = 0;
      
      // Cách 1: Tìm theo text content
      const allText = document.body.innerText;
      const followersMatch = allText.match(/(\d+(?:,\d+)*)\s*followers?/i);
      const followingMatch = allText.match(/(\d+(?:,\d+)*)\s*following/i);
      const postsMatch = allText.match(/(\d+(?:,\d+)*)\s*posts?/i);
      
      if (followersMatch) followers = parseInt(followersMatch[1].replace(/,/g, '')) || 0;
      if (followingMatch) following = parseInt(followingMatch[1].replace(/,/g, '')) || 0;
      if (postsMatch) posts = parseInt(postsMatch[1].replace(/,/g, '')) || 0;
      
      // Cách 2: Tìm theo meta tags (backup)
      if (followers === 0 || following === 0 || posts === 0) {
        const metaDescription = document.querySelector('meta[property="og:description"]');
        if (metaDescription) {
          const content = metaDescription.getAttribute('content') || '';
          
          if (followers === 0) {
            const match = content.match(/(\d+(?:,\d+)*)\s*Followers?/i);
            if (match) followers = parseInt(match[1].replace(/,/g, '')) || 0;
          }
          
          if (following === 0) {
            const match = content.match(/(\d+(?:,\d+)*)\s*Following/i);
            if (match) following = parseInt(match[1].replace(/,/g, '')) || 0;
          }
          
          if (posts === 0) {
            const match = content.match(/(\d+(?:,\d+)*)\s*Posts?/i);
            if (match) posts = parseInt(match[1].replace(/,/g, '')) || 0;
          }
        }
      }
      
      return { avatar, followers, following, posts };
    });
    
    console.log('📦 Profile data received from browser:');
    console.log('   Avatar:', profileData.avatar ? '✅ Found' : '❌ NOT FOUND');
    console.log('   Avatar URL:', profileData.avatar);
    console.log('   Followers:', profileData.followers);
    console.log('   Following:', profileData.following);
    console.log('   Posts:', profileData.posts);
    
    // === TẢI AVATAR MỚI & XÓA CŨ (giống instagram-refresh.js) ===
    let localAvatarPath = '';
    if (profileData.avatar) {
      try {
        const avatarsDir = path.join(app.getPath('userData'), 'avatars');
        if (!fs.existsSync(avatarsDir)) {
          fs.mkdirSync(avatarsDir, { recursive: true });
        }
        
        // Xóa avatar cũ của user này
        console.log('🗑️ Deleting old avatars...');
        try {
          const oldAvatars = fs.readdirSync(avatarsDir).filter(file => file.startsWith(username + '_'));
          oldAvatars.forEach(file => {
            const oldPath = path.join(avatarsDir, file);
            fs.unlinkSync(oldPath);
            console.log(`   Deleted: ${file}`);
          });
        } catch (e) {
          console.log('   No old avatars to delete');
        }
        
        // Tải avatar mới
        const avatarFileName = `${username}_${Date.now()}.jpg`;
        const avatarPath = path.join(avatarsDir, avatarFileName);
        
        console.log('📥 Downloading new avatar to:', avatarPath);
        
        const file = fs.createWriteStream(avatarPath);
        
        await new Promise((resolve, reject) => {
          https.get(profileData.avatar, (response) => {
            response.pipe(file);
            file.on('finish', () => {
              file.close();
              resolve();
            });
          }).on('error', (err) => {
            fs.unlink(avatarPath, () => {});
            reject(err);
          });
        });
        
        console.log('✅ New avatar saved successfully!');
        
        localAvatarPath = `avatar://${avatarPath}`;
        console.log('📍 New avatar path:', localAvatarPath);
        
      } catch (error) {
        console.error('❌ Failed to download avatar:', error.message);
        // Nếu lỗi, dùng URL gốc
        localAvatarPath = profileData.avatar;
      }
    }
    
    // Bước 8: Lấy cookies
    console.log('🍪 Extracting cookies...');
    const cookies = await context.cookies();
    
    // Tìm sessionid
    const sessionCookie = cookies.find(c => c.name === 'sessionid');
    if (!sessionCookie) {
      throw new Error('Session cookie not found!');
    }
    
    console.log('✅ Login successful!');
    
    // Đóng browser sau 30 giây
    setTimeout(() => {
      if (browser) {
        console.log('🔴 Closing browser...');
        browser.close();
      }
    }, 30000);
    
    // Trả về kết quả
    return {
      success: true,
      username,
      avatar: localAvatarPath || profileData.avatar, // Dùng local path
      followers: profileData.followers,
      following: profileData.following,
      posts: profileData.posts,
      cookies: cookies,
      sessionId: sessionCookie.value,
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (browser) {
      await browser.close();
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { loginInstagram };