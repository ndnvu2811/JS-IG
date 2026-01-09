const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getWindowSize } = require('./window-settings');

/**
 * ✅ Convert base64 data URL to temp file
 */
async function saveBase64ToTempFile(dataUrl, index, type = 'video') {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 data URL format');
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  
  // Determine file extension
  let ext = '.mp4';
  if (mimeType.includes('webm')) ext = '.webm';
  else if (mimeType.includes('mov')) ext = '.mov';
  else if (mimeType.includes('png')) ext = '.png';
  else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) ext = '.jpg';
  
  // Create temp file path
  const tempDir = path.join(os.tmpdir(), 'instagram-reel-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `${type}_${Date.now()}_${index}${ext}`);
  
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
  
  // Remove media-file:// or media-file:\ prefix (handle both formats)
  if (cleanPath.startsWith('media-file:///')) {
    cleanPath = cleanPath.replace('media-file:///', '');
  } else if (cleanPath.startsWith('media-file://')) {
    cleanPath = cleanPath.replace('media-file://', '');
  } else if (cleanPath.startsWith('media-file:\\')) {
    cleanPath = cleanPath.replace('media-file:\\', '');
  } else if (cleanPath.startsWith('media-file:')) {
    cleanPath = cleanPath.replace('media-file:', '');
  }
  
  // Remove leading backslash if present (Windows path issue)
  if (cleanPath.startsWith('\\')) {
    cleanPath = cleanPath.substring(1);
  }
  
  // Decode URI components (spaces, special chars)
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch (e) {
    // Ignore decode errors
  }
  
  // Normalize path separators
  cleanPath = cleanPath.replace(/\//g, path.sep);
  
  return cleanPath;
}

/**
 * ✅ Process video - handle both file paths and base64
 */
async function processVideo(video) {
  const url = video.url;
  
  if (!url) {
    throw new Error('No video URL provided');
  }
  
  // Case 1: Base64 data URL
  if (url.startsWith('data:')) {
    console.log('   Video type: BASE64');
    return await saveBase64ToTempFile(url, 0, 'video');
  }
  
  // Case 2: File path
  const cleanPath = cleanMediaPath(url);
  console.log(`   Original URL: ${url.substring(0, 80)}...`);
  console.log(`   Clean path: ${cleanPath}`);
  
  if (!fs.existsSync(cleanPath)) {
    throw new Error(`Video file not found: ${cleanPath}`);
  }
  
  console.log(`   ✅ Video file exists`);
  return cleanPath;
}

/**
 * ✅ Cleanup temp files
 */
function cleanupTempFiles(filePaths) {
  for (const filePath of filePaths) {
    if (filePath && filePath.includes('instagram-reel-temp')) {
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
 * Đăng Reel Instagram tự động
 */
async function postReelToInstagram(reelData) {
  let browser = null;
  let tempFilePaths = [];
  
  try {
    const { content, video, coverImage, useCustomCover, cookies, shareToThreads, username, aspectRatio } = reelData;
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🚀 STARTING INSTAGRAM REEL AUTOMATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 Caption:', content ? content.substring(0, 50) + '...' : '(empty)');
    console.log('🎬 Video URL:', video?.url ? video.url.substring(0, 60) + '...' : 'MISSING');
    console.log('🖼️ Custom cover:', useCustomCover ? 'Yes' : 'No');
    console.log('🔗 Share to Threads:', shareToThreads);
    console.log('👤 Username:', username);
    console.log('📐 Aspect Ratio:', aspectRatio || '9:16 (default)');
    
    // ✅ VALIDATE & PROCESS VIDEO
    if (!video || !video.url) {
      throw new Error('No video provided');
    }
    
    console.log('\n🎬 Processing video:');
    const videoPath = await processVideo(video);
    
    // Track temp files for cleanup
    if (videoPath.includes('instagram-reel-temp')) {
      tempFilePaths.push(videoPath);
    }
    
    console.log(`\n✅ Video ready: ${videoPath}`);
    
    // ✅ VALIDATE COOKIES
    if (!cookies || cookies.length === 0) {
      throw new Error('No cookies provided - please re-login to the account');
    }
    console.log('🍪 Cookies count:', cookies.length);
    
    // ===== Khởi động browser =====
    const windowSize = getWindowSize();

    const launchOptions = {
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--window-size=${windowSize.width},${windowSize.height}`,
        '--disable-gpu-shader-disk-cache',
        '--disable-gpu-program-cache',
      ],
    };

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

    console.log('\n🚀 Launching Chrome...');
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

    // BƯỚC 2: Click nút Create
    console.log('\n➕ [STEP 2] Clicking Create...');

    const clicked = await page.evaluate(() => {
      const spanList = Array.from(document.querySelectorAll('span'));
      const createSpan = spanList.find(el => el.textContent?.trim() === 'Create');

      if (createSpan) {
        const clickable = createSpan.closest('a') || createSpan.closest('div[role="button"]');
        if (clickable) {
          clickable.click();
          return true;
        }
      }

      const plusIcon = document.querySelector('svg[aria-label="New post"]')
        || document.querySelector('svg[aria-label="New Post"]')
        || document.querySelector('svg[aria-label="+"]');

      if (plusIcon) {
        const clickable = plusIcon.closest('a') || plusIcon.closest('div[role="button"]');
        if (clickable) {
          clickable.click();
          return true;
        }
      }

      return false;
    });

    if (!clicked) {
      throw new Error('Could not find Create button');
    }
    console.log('✅ Create menu opened');
    await page.waitForTimeout(2000);
    
    // BƯỚC 3: Click "Reel" option
    console.log('\n📝 [STEP 3] Looking for Reel option...');
    
    try {
      const reelClicked = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('span, div'));
        const reelOption = elements.find(el => el.textContent?.trim() === 'Reel');
        
        if (reelOption) {
          const clickable = reelOption.closest('div[role="menuitem"]') || reelOption;
          clickable.click();
          return true;
        }
        return false;
      });

      if (reelClicked) {
        console.log('✅ Reel option clicked');
        await page.waitForTimeout(3000);
      } else {
        console.log('ℹ️ No Reel menu, trying Post menu...');
        // Fallback: try Post option
        await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('span, div'));
          const postOption = elements.find(el => el.textContent?.trim() === 'Post');
          if (postOption) {
            const clickable = postOption.closest('div[role="menuitem"]') || postOption;
            clickable.click();
          }
        });
        await page.waitForTimeout(3000);
      }
    } catch (err) {
      console.log('⚠️ Menu navigation error:', err.message);
      await page.waitForTimeout(1000);
    }

    // BƯỚC 4: Upload video
    console.log('\n📤 [STEP 4] Uploading video...');

    const fileInput = await page.$('input[type="file"]');

    if (!fileInput) {
      throw new Error('File input not found');
    }

    console.log('📁 Video path:', videoPath);
    await fileInput.setInputFiles(videoPath);

    console.log('✅ Video uploaded!');
    // ⏳ CHỜ IG xử lý video + render popup
    await page.waitForTimeout(5000);  

    // ✅ STEP 4: click OK popup (nếu xuất hiện)
    console.log('🆗 [STEP 4] Clicking OK popup if it appears...');
    try {
      const popup = page.locator('div[role="dialog"]:visible').last();

      const popupText = await popup.innerText().catch(() => '');
      if (popupText.includes('Video posts are now shared as reels')) {
        const okBtn = popup.getByRole('button', { name: /^OK$/i }).first();
        await okBtn.waitFor({ state: 'visible', timeout: 3000 });

        // đôi khi enable chậm
        for (let i = 0; i < 10; i++) {
          if (await okBtn.isEnabled()) break;
          await page.waitForTimeout(300);
        }

        try {
          await okBtn.click({ timeout: 2000 });
        } catch (e) {
          console.log('⚠️ [STEP 4] OK click failed, trying force...');
          await okBtn.click({ timeout: 2000, force: true });
        }

        console.log('✅ [STEP 4] OK clicked');
        await page.waitForTimeout(800);
      } else {
        console.log('ℹ️ [STEP 4] No OK popup found');
      }
    } catch (err) {
      console.log('ℹ️ [STEP 4] No OK popup found');
    }

    // BƯỚC 4.5: Aspect ratio
    console.log('\n📐 [STEP 4.5] Selecting aspect ratio:', aspectRatio || '9:16');

    try {
      const cropTrigger = page.locator('[aria-label="Select crop"]').first();
      await cropTrigger.waitFor({ state: 'visible', timeout: 8000 });
      await cropTrigger.click();
      await page.waitForTimeout(1200);

      let targetRatio = aspectRatio || '9:16';
      let ratioText = '9:16';

      if (targetRatio === '1:1' || targetRatio.includes('1:1')) ratioText = '1:1';
      else if (targetRatio === '4:5' || targetRatio.includes('4:5')) ratioText = '4:5';
      else if (targetRatio === '16:9' || targetRatio.includes('16:9')) ratioText = '16:9';
      else if (targetRatio.toLowerCase().includes('original')) ratioText = 'Original';
      else ratioText = '9:16';

      console.log(`✅ [STEP 4.5] Clicking ratio: ${ratioText}`);
      await page.getByText(ratioText, { exact: false }).first().click();

      console.log(`✅ [STEP 4.5] Aspect ratio selected: ${ratioText}`);
      await page.waitForTimeout(1000);
    } catch (err) {
      console.log('⚠️ [STEP 4.5] Could not select aspect ratio, using default:', err.message);
    }

    // ✅ Helper: Click Next/OK button (robust)
    async function clickNextOrOk(step) {
      console.log(`⏭️ ${step} Looking for Next/OK...`);

      const dialog = page.locator('div[role="dialog"]').first();
      await dialog.waitFor({ state: 'visible', timeout: 20000 });

      // Try multiple button texts (IG có thể đổi label)
      const buttons = ['Next', 'OK', 'Continue'];

      for (const btnText of buttons) {
        try {
          // Ưu tiên role=button để bắt cả button/div[role=button]
          const btn = dialog.getByRole('button', { name: new RegExp(`^${btnText}$`, 'i') }).first();
          await btn.waitFor({ state: 'visible', timeout: 3000 });

          // đợi enable (khi video đang processing sẽ disable)
          for (let i = 0; i < 10; i++) {
            if (await btn.isEnabled()) break;
            await page.waitForTimeout(500);
          }

          await btn.click({ timeout: 3000 });
          console.log(`✅ ${step} Clicked "${btnText}"`);
          await page.waitForTimeout(2000);
          return;
        } catch {
          // Try next button text
        }
      }

      // Fallback: click last button
      try {
        const lastBtn = dialog.locator('button').last();
        await lastBtn.click({ force: true, timeout: 5000 });
        console.log(`✅ ${step} Clicked button (fallback)`);
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`⚠️ ${step} Could not click Next/OK:`, e.message);
      }
    }

    // BƯỚC 5: Click Next (video trimming screen)
    console.log('\n📌 [STEP 5] Video trim → Click Next');
    await clickNextOrOk('[STEP 5]');

    // BƯỚC 6: Click Next (audio/effects screen)
    console.log('\n📌 [STEP 6] Effects → Click Next');
    await clickNextOrOk('[STEP 6]');

    // BƯỚC 7: Share to Threads (if enabled)
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

    // BƯỚC 8: Điền caption
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

    // BƯỚC 9: Click Share
    console.log('\n📤 [STEP 9] Clicking Share...');

    try {
      const dialog = page.getByRole('dialog').first();
      await dialog.waitFor({ state: 'visible', timeout: 10000 });

      const shareBtn = dialog.getByRole('button', { name: /share/i });
      await shareBtn.click({ timeout: 5000 });
      console.log('✅ Share clicked');
    } catch (e) {
      console.log('⚠️ Share button error, trying fallback...');
      const dialog = page.locator('div[role="dialog"]').first();
      const lastBtn = dialog.locator('button').last();
      await lastBtn.click({ force: true, timeout: 5000 });
      console.log('✅ Share clicked (fallback)');
    }

    console.log('⏳ Waiting for reel to publish...');
    await page.waitForTimeout(30000); // Reels take longer to process

    // BƯỚC 10: Lấy reel URL
    console.log('\n🔗 [STEP 10] Getting reel URL...');
    await page.waitForTimeout(10000);

    if (!username) {
      cleanupTempFiles(tempFilePaths);
      setTimeout(() => { if (browser) browser.close(); }, 5000);
      return { success: true, reelUrl: 'https://www.instagram.com' };
    }

    await page.goto(`https://www.instagram.com/${username}/reels/`, {
      timeout: 60000,
      waitUntil: 'load'
    });

    await page.waitForTimeout(5000);

    const reelUrlResult = await page.evaluate(() => {
      const reelLinks = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
      if (reelLinks.length > 0) {
        return { url: reelLinks[0].href };
      }
      return { url: '' };
    });

    const reelUrl = reelUrlResult.url || `https://www.instagram.com/${username}/reels/`;
    console.log('✅ Reel URL:', reelUrl);

    // Cleanup
    cleanupTempFiles(tempFilePaths);
    
    setTimeout(() => {
      if (browser) {
        console.log('🔴 Closing browser...');
        browser.close();
      }
    }, 30000);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ REEL POSTED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');

    return { success: true, reelUrl };
    
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('❌ REEL POST FAILED:', error.message);
    console.error('═══════════════════════════════════════════════════════\n');
    
    cleanupTempFiles(tempFilePaths);
    
    if (browser) {
      await browser.close();
    }
    
    return { success: false, error: error.message };
  }
}

module.exports = { postReelToInstagram };