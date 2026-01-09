const { chromium } = require('playwright-core');
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Download avatar from URL and save to local file
 * @param {string} avatarUrl - Avatar URL from Instagram
 * @param {string} username - Instagram username
 * @returns {Promise<string>} - Local avatar path (avatar://...) or empty string if failed
 */
async function downloadAvatar(avatarUrl, username) {
  if (!avatarUrl) {
    console.warn('⚠️ No avatar URL provided');
    return '';
  }

  try {
    const avatarsDir = path.join(app.getPath('userData'), 'avatars');
    
    // Create avatars directory if not exists
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    
    // Delete old avatars for this user
    console.log('🗑️ Deleting old avatars...');
    const oldAvatars = fs.readdirSync(avatarsDir).filter(file => file.startsWith(username + '_'));
    oldAvatars.forEach(file => {
      try {
        const oldPath = path.join(avatarsDir, file);
        fs.unlinkSync(oldPath);
        console.log(`   Deleted: ${file}`);
      } catch (err) {
        console.warn(`⚠️ Failed to delete old avatar: ${file}`, err.message);
      }
    });
    
    // Download new avatar
    const avatarFileName = `${username}_${Date.now()}.jpg`;
    const avatarPath = path.join(avatarsDir, avatarFileName);
    
    console.log('📥 Downloading avatar from:', avatarUrl);
    console.log('📁 Saving to:', avatarPath);
    
    const protocol = avatarUrl.startsWith('https') ? https : http;
    const file = fs.createWriteStream(avatarPath);
    
    return new Promise((resolve, reject) => {
      protocol.get(avatarUrl, { timeout: 10000 }, (response) => {
        // Check for redirect
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          console.log('🔄 Following redirect to:', response.headers.location);
          downloadAvatar(response.headers.location, username)
            .then(resolve)
            .catch(reject);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download avatar: HTTP ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          // Use avatar:// protocol - send path as-is (Windows path with backslashes)
          const avatarUrl = `avatar://${avatarPath}`;
          console.log('✅ Avatar downloaded successfully!');
          console.log('📍 Avatar URL:', avatarUrl);
          resolve(avatarUrl);
        });
        file.on('error', (err) => {
          fs.unlink(avatarPath, () => {}); // Delete incomplete file
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(avatarPath, () => {}); // Delete incomplete file
        reject(err);
      }).on('timeout', () => {
        fs.unlink(avatarPath, () => {}); // Delete incomplete file
        reject(new Error('Avatar download timeout'));
      });
    });
  } catch (error) {
    console.error('❌ Error downloading avatar:', error.message);
    return '';
  }
}

/**
 * Refresh account data using existing cookies
 */
async function refreshAccountData(username, cookies) {
  let browser = null;
  
  try {
    console.log('🔄 Refreshing account data...');
    
    browser = await chromium.launch({
      headless: true, // Chạy ngầm
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    
    // Set cookies
    await context.addCookies(cookies);
    
    const page = await context.newPage();
    
    // Vào trang profile
    console.log('👤 Navigating to profile...');
    await page.goto(`https://www.instagram.com/${username}/`, {
      timeout: 30000,
    });
    
    // Đợi cho đến khi thấy text "followers" xuất hiện
    console.log('⏳ Waiting for profile stats to load...');
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes('followers') || document.body.innerText.includes('follower'),
        { timeout: 30000 }
      );
      console.log('✅ Stats loaded!');
      await page.waitForTimeout(3000); // Đợi thêm 3 giây cho chắc
    } catch (e) {
      console.log('⚠️ Timeout waiting for stats, proceeding anyway...');
      await page.waitForTimeout(10000);
    }
    
    // Lấy page text để debug
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('📄 Page text sample (first 500 chars):');
    console.log(pageText.substring(0, 500));
    console.log('---');
    
    // Scrape data
    console.log('📊 Extracting profile data...');
    const profileData = await page.evaluate(() => {
      // Lấy avatar - thử nhiều selector
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
      
      // Lấy số liệu - thử nhiều cách
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
    
    console.log('📦 Refresh data received:');
    console.log('   Avatar:', profileData.avatar ? '✅ Found' : '❌ NOT FOUND');
    console.log('   Followers:', profileData.followers);
    console.log('   Following:', profileData.following);
    console.log('   Posts:', profileData.posts);
    
    // === TẢI AVATAR MỚI & XÓA CŨ ===
    let localAvatarPath = '';
    if (profileData.avatar) {
      try {
        localAvatarPath = await downloadAvatar(profileData.avatar, username);
      } catch (error) {
        console.error('❌ Failed to update avatar:', error.message);
        localAvatarPath = profileData.avatar;
      }
    }
    
    await browser.close();
    
    console.log('✅ Refresh successful!');
    
    return {
      success: true,
      avatar: localAvatarPath || profileData.avatar,
      followers: profileData.followers,
      following: profileData.following,
      posts: profileData.posts,
    };
    
  } catch (error) {
    console.error('❌ Refresh error:', error.message);
    
    if (browser) {
      await browser.close();
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
}

async function getLatestPostUrl(username, cookies) {
  let browser = null;
  
  try {
    console.log('🔍 Getting latest post URL for:', username);
    
    browser = await chromium.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    
    await context.addCookies(cookies);
    const page = await context.newPage();
    
    console.log('👤 Navigating to profile...');
    await page.goto(`https://www.instagram.com/${username}/`, {
      timeout: 30000,
      waitUntil: 'networkidle'
    });
    
    console.log('⏳ Waiting for posts to load...');
    
    // ✅ Chờ image/video post được load
    try {
      await page.waitForSelector('article img[alt]', { timeout: 10000 });
      console.log('✅ Posts loaded');
    } catch (e) {
      console.log('⚠️ Timeout waiting for posts, retrying...');
    }
    
    // Đợi thêm để chắc chắn DOM fully loaded
    await page.waitForTimeout(3000);
    
    // ✅ TRY MULTIPLE SELECTORS
    const postUrl = await page.evaluate(() => {
      let url = '';
      
      // Cách 1: Tìm tất cả links có href chứa /p/ (posts)
      const postLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      if (postLinks.length > 0) {
        url = postLinks[0].href;
        console.log('Method 1 - /p/ selector: Found');
        return url;
      }
      
      // Cách 2: Tìm tất cả links có href chứa /reel/ (reels)
      const reelLinks = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
      if (reelLinks.length > 0) {
        url = reelLinks[0].href;
        console.log('Method 2 - /reel/ selector: Found');
        return url;
      }
      
      // Cách 3: Tìm từ article links
      const articles = Array.from(document.querySelectorAll('article a'));
      for (const link of articles) {
        const href = link.getAttribute('href');
        if (href && (href.includes('/p/') || href.includes('/reel/'))) {
          console.log('Method 3 - article link: Found');
          return href;
        }
      }
      
      // Cách 4: Tìm từ gallery wrapper (common Instagram structure)
      const galleryItems = Array.from(document.querySelectorAll('[role="presentation"] a, [role="link"]'));
      for (const item of galleryItems) {
        const href = item.getAttribute('href');
        if (href && (href.includes('/p/') || href.includes('/reel/'))) {
          console.log('Method 4 - gallery item: Found');
          return href;
        }
      }
      
      // Cách 5: Tìm từ image src (last resort)
      const images = Array.from(document.querySelectorAll('article img'));
      if (images.length > 0) {
        // Try to find parent link
        let parent = images[0].closest('a');
        if (parent && parent.href) {
          console.log('Method 5 - image parent: Found');
          return parent.href;
        }
      }
      
      console.log('All methods failed');
      return '';
    });
    
    console.log('📊 Page evaluation result:', postUrl);
    
    await browser.close();
    
    if (postUrl && postUrl.length > 0) {
      console.log('✅ Latest post URL found:', postUrl);
      return postUrl;
    } else {
      console.log('⚠️ Could not find post URL, returning profile link');
      return `https://www.instagram.com/${username}/`;
    }
  } catch (error) {
    console.error('❌ Error getting latest post URL:', error.message);
    console.error('Stack:', error.stack);
    if (browser) await browser.close();
    return `https://www.instagram.com/${username}/`;
  }
}

module.exports = { refreshAccountData, getLatestPostUrl, downloadAvatar };