const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getWindowSize } = require('./window-settings');

/**
 * ✅ Convert base64 data URL to temp file
 */
async function saveBase64ToTempFile(dataUrl, index) {
  // Extract mime type and base64 data
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL format');
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Determine file extension
  let ext = '.jpg';
  if (mimeType.includes('png')) ext = '.png';
  else if (mimeType.includes('gif')) ext = '.gif';
  else if (mimeType.includes('webp')) ext = '.webp';
  else if (mimeType.includes('video')) ext = '.mp4';
  
  // Create temp file path
  const tempDir = path.join(os.tmpdir(), 'instagram-post-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `media_${Date.now()}_${index}${ext}`);
  
  // Write base64 to file
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(tempFilePath, buffer);
  
  console.log(`   ✅ Saved base64 to temp file: ${tempFilePath}`);
  return tempFilePath;
}

/**
 * ✅ Clean media file path - remove media-file:// prefix
 */
function cleanMediaPath(url) {
  if (!url) return '';
  
  let cleanPath = url;
  
  // Remove media-file:// prefix
  if (cleanPath.startsWith('media-file:///')) {
    cleanPath = cleanPath.replace('media-file:///', '');
  } else if (cleanPath.startsWith('media-file://')) {
    cleanPath = cleanPath.replace('media-file://', '');
  }
  
  // Decode URI components (spaces, special chars)
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch (e) {
    // Ignore decode errors
  }
  
  return cleanPath;
}

/**
 * ✅ Process media item - handle both file paths and base64
 */
async function processMediaItem(mediaItem, index) {
  const url = mediaItem.url;
  
  // Case 1: Base64 data URL
  if (url.startsWith('data:')) {
    console.log(`   [${index}] Type: ${mediaItem.type} (BASE64)`);
    return await saveBase64ToTempFile(url, index);
  }
  
  // Case 2: File path (with or without media-file:// prefix)
  const cleanPath = cleanMediaPath(url);
  console.log(`   [${index}] Type: ${mediaItem.type}`);
  console.log(`       Path: ${cleanPath}`);
  
  if (!fs.existsSync(cleanPath)) {
    throw new Error(`Media file not found: ${cleanPath}`);
  }
  
  console.log(`       ✅ File exists`);
  return cleanPath;
}

/**
 * ✅ Cleanup temp files
 */
function cleanupTempFiles(filePaths) {
  for (const filePath of filePaths) {
    if (filePath.includes('instagram-post-temp')) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Đăng bài Instagram tự động
 */
async function postToInstagram(postData) {
  let browser = null;
  let tempFilePaths = [];
  
  try {
    const { content, media, cookies, shareToThreads, username } = postData;
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🚀 STARTING INSTAGRAM POST AUTOMATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 Caption:', content ? content.substring(0, 50) + '...' : '(empty)');
    console.log('🖼️ Media count:', media?.length || 0);
    console.log('🔗 Share to Threads:', shareToThreads);
    console.log('👤 Username:', username);
    
    // ✅ VALIDATE & PROCESS MEDIA
    if (!media || media.length === 0) {
      throw new Error('No media files provided');
    }
    
    const filePaths = [];
    console.log('\n📁 Processing media files:');
    
    for (let i = 0; i < media.length; i++) {
      const processedPath = await processMediaItem(media[i], i);
      filePaths.push(processedPath);
      
      // Track temp files for cleanup
      if (processedPath.includes('instagram-post-temp')) {
        tempFilePaths.push(processedPath);
      }
    }
    
    console.log(`\n✅ All ${filePaths.length} media files ready`);
    
    // ✅ VALIDATE COOKIES
    if (!cookies || cookies.length === 0) {
      throw new Error('No cookies provided - please re-login to the account');
    }
    console.log('🍪 Cookies count:', cookies.length);
    
    // Khởi động browser
    const windowSize = getWindowSize();

    const launchOptions = {
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${windowSize.width},${windowSize.height}`,
      ],
    };

    console.log('\n🚀 Opening Chrome...');

    // Find Chrome
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.CHROME_PATH,
    ].filter(p => p);
    
    for (const chromePath of chromePaths) {
      if (fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
        console.log('✅ Chrome found:', chromePath);
        break;
      }
    }
    
    if (!launchOptions.executablePath) {
      throw new Error('Chrome not found! Please install Google Chrome.');
    }
    
    console.log('🚀 Launching Chrome...');
    browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
      viewport: null,
    });

    console.log('🍪 Adding cookies...');
    await context.addCookies(cookies);

    const page = await context.newPage();
    
    // BƯỚC 1: Mở Instagram
    console.log('\n📱 [STEP 1] Opening Instagram...');
    await page.goto('https://www.instagram.com', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Đóng popup nếu có
    try {
      const okButton = page.getByText('OK', { exact: true });
      await okButton.click({ timeout: 3000 });
      console.log('✅ Popup closed');
    } catch (err) {
      console.log('ℹ️ No popup found');
    }

    await page.waitForTimeout(1500);

    // Bước 2: Click nút Create
    console.log('\n➕ [STEP 2] Clicking Create...');

    const clicked = await page.evaluate(() => {
      const spanList = Array.from(document.querySelectorAll('span'));
      const createSpan = spanList.find(el => el.textContent?.trim() === 'Create');

      if (createSpan) {
        const clickable = createSpan.closest('a') || createSpan.closest('div[role="button"]');
        if (clickable) {
          clickable.click();
          return "clicked-create";
        }
      }

      const plusIcon = document.querySelector('svg[aria-label="New post"]')
        || document.querySelector('svg[aria-label="New Post"]')
        || document.querySelector('svg[aria-label="+"]');

      if (plusIcon) {
        const clickable = plusIcon.closest('a') || plusIcon.closest('div[role="button"]');
        if (clickable) {
          clickable.click();
          return "clicked-plus";
        }
      }

      return "not-found";
    });

    if (clicked === "not-found") {
      throw new Error('Could not find Create button');
    }
    console.log('✅ Create button clicked');

    await page.waitForTimeout(2000);

    // Bước 3: Click "Post" option nếu có
    console.log('\n📝 [STEP 3] Looking for Post option...');
    
    try {
      const postClicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('span, div'));
        const postOption = elements.find(el => el.textContent?.trim() === 'Post');
        
        if (postOption) {
          const clickable = postOption.closest('div[role="menuitem"]') || postOption;
          clickable.click();
          return true;
        }
        return false;
      });

      if (postClicked) {
        console.log('✅ Post option clicked');
        await page.waitForTimeout(3000);
      } else {
        console.log('ℹ️ No Post menu, continuing...');
        await page.waitForTimeout(1000);
      }
    } catch (err) {
      await page.waitForTimeout(1000);
    }

    // Bước 4: Upload media
    console.log('\n📤 [STEP 4] Uploading media...');

    const fileInput = await page.$('input[type="file"]');

    if (!fileInput) {
      throw new Error('File input not found');
    }

    console.log('📁 Files to upload:', filePaths);
    await fileInput.setInputFiles(filePaths);

    console.log('✅ Media uploaded!');
    await page.waitForTimeout(5000);
    
    // Chọn aspect ratio
    console.log('\n🎯 [STEP 4.5] Selecting aspect ratio...');
    try {
      const cropTrigger = page.locator('[aria-label="Select crop"]').first();
      await cropTrigger.waitFor({ state: 'visible', timeout: 8000 });
      await cropTrigger.click();
      await page.waitForTimeout(1500);

      const originalOption = page.getByText('Original', { exact: false }).first();
      await originalOption.waitFor({ state: 'visible', timeout: 8000 });
      await originalOption.click();
      console.log('✅ Aspect ratio: Original');
      await page.waitForTimeout(1500);
    } catch (err) {
      console.log('ℹ️ Using default aspect ratio');
    }

    // Helper: Click Next
    async function clickNext(step) {
      console.log(`⏭️ ${step} Clicking Next...`);
      
      const dialog = page.locator('div[role="dialog"]').first();
      await dialog.waitFor({ state: 'visible', timeout: 15000 });

      const byButton = dialog.locator('button:has-text("Next")').first();
      const byText = dialog.locator('text=Next').first();

      let next;
      try {
        await byButton.waitFor({ state: 'visible', timeout: 4000 });
        next = byButton;
      } catch {
        next = byText;
        await next.waitFor({ state: 'visible', timeout: 15000 });
      }

      await next.scrollIntoViewIfNeeded();
      await next.click({ timeout: 5000 });
      console.log(`✅ ${step} Next clicked`);
      await page.waitForTimeout(2000);
    }

    // Bước 5 & 6: Click Next
    console.log('\n📌 [STEP 5] After crop → Click Next');
    await clickNext('[STEP 5]');

    console.log('\n📌 [STEP 6] After filter → Click Next');
    await clickNext('[STEP 6]');

    // Bước 7: Share to Threads
    if (shareToThreads) {
      console.log('\n🔗 [STEP 7] Enabling Share to Threads...');
      try {
        await page.getByText('Advanced settings', { exact: false }).click();
        await page.waitForTimeout(2000);

        const toggleRow = page.getByText('Automatically share to Threads', { exact: false }).locator('..');
        await toggleRow.waitFor({ state: 'visible', timeout: 5000 });

        const switchBtn = toggleRow.locator('[role="switch"], input[type="checkbox"]');
        if (await switchBtn.isVisible()) {
          await switchBtn.click();
        } else {
          await toggleRow.click();
        }
        console.log('✅ Threads enabled');
        
        await page.mouse.wheel(0, -3000);
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log('⚠️ Threads error:', e.message);
      }
    }

    // Bước 8: Điền caption
    console.log('\n✍️ [STEP 8] Writing caption...');
    await page.waitForTimeout(2000);

    try {
      const editableDiv = await page.$('div[contenteditable="true"]');
      if (editableDiv) {
        await editableDiv.click();
        await page.waitForTimeout(500);
        await page.keyboard.type(content || '');
        console.log('✅ Caption filled');
      }
    } catch (err) {
      console.log('⚠️ Caption error:', err.message);
    }

    await page.waitForTimeout(2000);

    // Bước 9: Click Share
    console.log('\n📤 [STEP 9] Clicking Share...');

    const dialog = page.getByRole('dialog', { name: 'Create new post' });
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    try {
      const shareBtn = dialog.getByRole('button', { name: /share/i });
      await shareBtn.click({ timeout: 5000 });
      console.log('✅ Share clicked');
    } catch (e) {
      const lastBtn = dialog.locator('button').last();
      await lastBtn.click({ force: true, timeout: 5000 });
      console.log('✅ Share clicked (fallback)');
    }

    console.log('⏳ Waiting for post to publish...');
    await page.waitForTimeout(20000);

    // Bước 10: Lấy post URL
    console.log('\n🔗 [STEP 10] Getting post URL...');
    await page.waitForTimeout(10000);

    if (!username) {
      cleanupTempFiles(tempFilePaths);
      setTimeout(() => { if (browser) browser.close(); }, 5000);
      return { success: true, postUrl: 'https://www.instagram.com' };
    }

    await page.goto(`https://www.instagram.com/${username}/`, {
      timeout: 60000,
      waitUntil: 'load'
    });

    await page.waitForTimeout(5000);

    const postUrlResult = await page.evaluate(() => {
      const postLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      if (postLinks.length > 0) {
        return { url: postLinks[0].href };
      }
      return { url: '' };
    });

    const postUrl = postUrlResult.url || `https://www.instagram.com/${username}/`;
    console.log('✅ Post URL:', postUrl);

    // Cleanup và đóng browser
    cleanupTempFiles(tempFilePaths);
    
    setTimeout(() => {
      if (browser) {
        console.log('🔴 Closing browser...');
        browser.close();
      }
    }, 30000);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ POST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');

    return { success: true, postUrl };
    
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ POST FAILED:', error.message);
    console.error('═══════════════════════════════════════════════════════\n');
    
    cleanupTempFiles(tempFilePaths);
    
    if (browser) {
      await browser.close();
    }
    
    return { success: false, error: error.message };
  }
}

module.exports = { postToInstagram };