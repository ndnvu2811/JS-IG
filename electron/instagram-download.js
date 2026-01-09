const { chromium } = require('playwright-core');
const { getWindowSize } = require('./window-settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const CryptoJS = require('crypto-js');
const { app } = require('electron');

/**
 * Resolve cookies path
 */
function resolveCookiesPath(cookiesPath) {
    if (fs.existsSync(cookiesPath)) return cookiesPath;

    // Try new app-relative location (data folder)
    if (cookiesPath.includes('Instagram-Tool-Care')) {
        const fileName = path.basename(cookiesPath);
        const newPath = path.join(app.getPath('userData'), 'cookies', fileName);
        if (fs.existsSync(newPath)) return newPath;
    }

    // Fallback to old location
    if (cookiesPath.includes('.instagram-tool-care')) {
        const fileName = path.basename(cookiesPath);
        const appPath = path.dirname(__dirname);
        const oldPath = path.join(appPath, 'media-library', 'cookies', fileName);
        if (fs.existsSync(oldPath)) return oldPath;
    }

    return cookiesPath;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function section(title) {
    console.log('\n' + '='.repeat(80));
    console.log(title);
    console.log('='.repeat(80));
}

function sub(title) {
    console.log('\n' + '-'.repeat(60));
    console.log(title);
    console.log('-'.repeat(60));
}

function short(url, n = 100) {
    if (!url) return '';
    return url.length > n ? url.slice(0, n) + '…' : url;
}

function baseUrl(url) {
    return (url || '').split('?')[0];
}

function dedupeByBase(urls) {
    const seen = new Set();
    const out = [];
    for (const u of urls || []) {
        const b = baseUrl(u);
        if (!b || seen.has(b)) continue;
        seen.add(b);
        out.push(u);
    }
    return out;
}

function pickBestCandidate(urls) {
    if (!urls || urls.length === 0) return null;
    return urls.reduce((a, b) => (String(a).length >= String(b).length ? a : b));
}

/**
 * ✅ FIX: Safe decrypt cookies - handles both encrypted and plain JSON
 * This function prevents the "Cannot read properties of undefined (reading 'salt')" error
 */
function safeDecryptCookies(fileData, secretKey = 'your-secret-key-change-this-later') {
    // Case 1: Already an array of cookies (plain JSON)
    if (Array.isArray(fileData)) {
        console.log('🍪 Cookies format: Plain array');
        return fileData;
    }

    // Case 2: Object with 'cookies' property (plain JSON object)
    if (typeof fileData === 'object' && fileData !== null) {
        if (Array.isArray(fileData.cookies)) {
            console.log('🍪 Cookies format: Object with cookies array');
            return fileData.cookies;
        }
        
        // Case 3: Object with 'encryptedData' property
        if (fileData.encryptedData) {
            console.log('🍪 Cookies format: Encrypted (encryptedData field)');
            try {
                const decrypted = CryptoJS.AES.decrypt(fileData.encryptedData, secretKey);
                const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
                
                if (!decryptedStr) {
                    throw new Error('Decryption returned empty string - wrong key or corrupted data');
                }
                
                const parsed = JSON.parse(decryptedStr);
                return Array.isArray(parsed) ? parsed : parsed.cookies || [];
            } catch (e) {
                console.error('❌ Failed to decrypt encryptedData:', e.message);
                throw new Error('Failed to decrypt cookies: ' + e.message);
            }
        }
    }

    // Case 4: String that might be encrypted or JSON
    if (typeof fileData === 'string') {
        // Try parsing as JSON first
        try {
            const parsed = JSON.parse(fileData);
            // Recursively handle the parsed result
            return safeDecryptCookies(parsed, secretKey);
        } catch {
            // Not valid JSON, try decrypting
            console.log('🍪 Cookies format: Encrypted string');
            try {
                const decrypted = CryptoJS.AES.decrypt(fileData, secretKey);
                const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
                
                if (!decryptedStr) {
                    throw new Error('Decryption returned empty string');
                }
                
                const parsed = JSON.parse(decryptedStr);
                return Array.isArray(parsed) ? parsed : parsed.cookies || [];
            } catch (e) {
                console.error('❌ Failed to decrypt string:', e.message);
                throw new Error('Failed to decrypt cookies string: ' + e.message);
            }
        }
    }

    throw new Error('Unknown cookies format - cannot parse');
}

/**
 * STRONG PROBE for VIDEO - verify URL returns actual video data
 */
async function probeVideoUrlStrong(requestContext, url, headers) {
    const MIN_BYTES_STRONG = 20 * 1024; // 20KB minimum
    const result = {
        ok: false,
        status: 0,
        contentType: '',
        bytes: 0,
        error: '',
        url,
    };

    try {
        const resp = await requestContext.fetch(url, {
            headers: { ...headers, Range: 'bytes=0-65535' },
            timeout: 20000,
        });

        result.status = resp.status();
        const h = resp.headers();
        result.contentType = (h['content-type'] || '').toLowerCase();

        const buf = await resp.body().catch(() => Buffer.alloc(0));
        result.bytes = buf?.length || 0;

        const statusOk = result.status === 200 || result.status === 206;
        const typeOk = result.contentType.includes('video') || url.toLowerCase().includes('.mp4');
        const bytesStrong = result.bytes >= MIN_BYTES_STRONG;

        result.ok = statusOk && typeOk && bytesStrong;

        console.log(`   🔎 [PROBE] status=${result.status} bytes=${result.bytes} | ${short(url, 80)}`);

        return result;
    } catch (e) {
        result.error = e?.message || String(e);
        console.log(`   🔎 [PROBE] ERROR: ${result.error}`);
        return result;
    }
}

/**
 * Download Instagram post/reel media using Playwright
 * 
 * 🎬 VIDEO: video_versions extraction from scripts
 * 📸 IMAGE: img.x5yr21d.xu96u03.x10l6tqk.x13vifvy + Carousel
 */
async function downloadInstagramPost(postUrl, account) {
    let context = null;
    let page = null;

    try {
        section('🔍 INSTAGRAM SCRAPER');
        console.log('📌 URL:', postUrl);
        console.log('👤 Account:', account?.username);

        // ========================================
        // ✅ FIX: LOAD COOKIES WITH SAFE DECRYPT
        // ========================================
        let cookies;
        
        if (account.cookies && Array.isArray(account.cookies)) {
            console.log('🍪 Using cookies from memory');
            cookies = account.cookies;
        } else if (account.cookiesPath) {
            const resolvedPath = resolveCookiesPath(account.cookiesPath);
            
            if (!fs.existsSync(resolvedPath)) {
                throw new Error('Cookies file not found at: ' + resolvedPath);
            }

            console.log('📂 Loading cookies from:', resolvedPath);
            const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
            
            // ✅ FIX: Use safe decrypt function instead of direct CryptoJS call
            let fileData;
            try {
                fileData = JSON.parse(fileContent);
            } catch {
                // File is not JSON, might be raw encrypted string
                fileData = fileContent;
            }
            
            cookies = safeDecryptCookies(fileData);
            
            if (!cookies || !Array.isArray(cookies) || cookies.length === 0) {
                throw new Error('No valid cookies found in file');
            }
        } else {
            throw new Error('No cookies provided or found');
        }
        
        console.log('🍪 Loaded', cookies.length, 'cookies');

        // ========================================
        // LAUNCH BROWSER
        // ========================================
        const windowSize = getWindowSize();
        const userDataDir = path.join(os.tmpdir(), 'chrome-instagram-tool-' + Date.now());

        const launchOptions = {
            headless: true,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-component-update',
                '--autoplay-policy=no-user-gesture-required',
                `--window-size=${windowSize.width},${windowSize.height}`,
            ],
        };

        console.log('🚀 Opening Chrome...');
        context = await chromium.launchPersistentContext(userDataDir, launchOptions);
        await context.addCookies(cookies);

        page = await context.newPage();
        const requestContext = context.request;

        // Headers for probing
        let userAgent = '';
        try {
            userAgent = await page.evaluate(() => navigator.userAgent);
        } catch {
            userAgent = 'Mozilla/5.0';
        }

        const probeHeaders = {
            'User-Agent': userAgent,
            Referer: postUrl,
            Accept: '*/*',
        };

        // ========================================
        // NAVIGATE TO PAGE
        // ========================================
        sub('🔄 Loading page');
        try {
            await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
            console.log('✅ Page loaded');
        } catch (e) {
            console.log('⚠️ Page load timeout, continuing:', e.message);
        }
        await page.waitForTimeout(3000);

        // ========================================
        // CHECK FOR VIDEO ELEMENT
        // ========================================
        const hasVideoElement = await page.evaluate(() => {
            return !!document.querySelector('video.x1lliihq.x5yr21d.xh8yej3');
        });

        console.log('🎥 Has video element:', hasVideoElement);

        // ========================================
        // VIDEO MODE: video_versions extraction
        // ========================================
        if (hasVideoElement) {
            sub('🎬 VIDEO MODE: Extracting video_versions');

            try {
                const videoUrls = await page.evaluate(() => {
                    const urls = [];
                    const scripts = document.querySelectorAll('script');

                    for (const s of scripts) {
                        const t = s.textContent || '';

                        // Pattern: video_versions with url
                        const videoVersions = t.matchAll(/"video_versions":\s*\[([^\]]+)\]/g);
                        for (const vv of videoVersions) {
                            const urlMatches = vv[1].matchAll(/"url":"([^"]+)"/g);
                            for (const um of urlMatches) {
                                const url = um[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                                if (!urls.includes(url) && url.includes('.mp4')) urls.push(url);
                            }
                        }
                    }

                    return urls;
                });

                const unique = dedupeByBase(videoUrls);
                console.log(`📊 Found ${videoUrls.length} candidates, ${unique.length} unique`);

                if (unique.length > 0) {
                    const best = pickBestCandidate(unique);
                    console.log('🔍 Probing best candidate...');

                    const probe = await probeVideoUrlStrong(requestContext, best, probeHeaders);

                    if (probe.ok) {
                        console.log('✅ VIDEO SUCCESS!');
                        await context.close();
                        return {
                            success: true,
                            media: [{ type: 'video', url: probe.url }],
                            caption: '',
                        };
                    }

                    // Return anyway even if probe fails
                    console.log('⚠️ Probe failed but returning video URL');
                    await context.close();
                    return {
                        success: true,
                        media: [{ type: 'video', url: best }],
                        caption: '',
                    };
                }

                console.log('⚠️ No video_versions found, falling back to images...');
            } catch (e) {
                console.log('❌ Video extraction error:', e.message);
            }
        }

        // ========================================
        // IMAGE MODE
        // ========================================
        sub('📸 IMAGE MODE');

        let allMedia = [];
        let currentSlideIndex = 0;
        const maxAttempts = 20;
        let captionText = '';

        while (currentSlideIndex < maxAttempts) {
            console.log(`   Slide ${currentSlideIndex + 1}...`);

            const mediaData = await page.evaluate(() => {
                const media = [];

                // Selector chính xác nhất cho image
                const mainImg = document.querySelector('img.x5yr21d.xu96u03.x10l6tqk.x13vifvy');
                if (mainImg) {
                    const src = mainImg.src;
                    if (src && (src.includes('cdninstagram.com') || src.includes('fbcdn.net') || src.includes('scontent'))) {
                        const shouldSkip = 
                            src.includes('/44x44/') || 
                            src.includes('/150x150/') ||
                            src.includes('profile_pic');
                        if (!shouldSkip) {
                            media.push({ type: 'image', url: src });
                        }
                    }
                }

                // Caption
                let caption = '';
                const article = document.querySelector('article');
                if (article) {
                    const h1 = article.querySelector('h1');
                    if (h1) caption = h1.textContent?.trim() || '';
                }

                return { media, caption };
            });

            // Deduplicate
            const seen = new Set(allMedia.map((m) => baseUrl(m.url)));
            const newMedia = (mediaData.media || []).filter((m) => {
                const b = baseUrl(m.url);
                if (!b || seen.has(b)) return false;
                seen.add(b);
                return true;
            });

            if (newMedia.length > 0) {
                allMedia = allMedia.concat(newMedia);
                console.log(`   ✅ Added ${newMedia.length} image(s) (Total: ${allMedia.length})`);
            }

            if (currentSlideIndex === 0 && mediaData.caption) {
                captionText = mediaData.caption;
            }

            // Next button (Carousel)
            const hasNextButton = await page.evaluate(() => {
                // Strategy 1: button._afxw._al46._al47
                let nextBtn = document.querySelector('button._afxw._al46._al47');
                if (nextBtn) {
                    nextBtn.click();
                    return true;
                }

                // Strategy 2: div._9zm2
                const div9zm2 = document.querySelector('div._9zm2');
                if (div9zm2) {
                    const parent = div9zm2.closest('button') || div9zm2.parentElement;
                    (parent || div9zm2).click();
                    return true;
                }

                // Strategy 3: aria-label
                const labels = ['Next', 'next', 'Tiếp', 'tiếp'];
                for (const label of labels) {
                    nextBtn = document.querySelector(`button[aria-label*="${label}"]`);
                    if (nextBtn) {
                        nextBtn.click();
                        return true;
                    }
                }

                return false;
            });

            if (!hasNextButton) {
                console.log('   ✅ No more slides');
                break;
            }

            await page.waitForTimeout(2000);
            currentSlideIndex++;
        }

        // ========================================
        // FINAL RESULT
        // ========================================
        section('🏁 FINAL RESULT');

        await context.close();

        if (allMedia.length > 0) {
            console.log(`✅ SUCCESS: ${allMedia.length} image(s)`);
            return {
                success: true,
                media: allMedia,
                caption: captionText || '',
            };
        }

        console.log('❌ No media found');
        throw new Error('No media found. The post might be private or selectors have changed.');

    } catch (error) {
        console.error('❌ Instagram download error:', error?.message || error);

        if (context) {
            try {
                await context.close();
            } catch {}
        }

        return {
            success: false,
            error: error?.message || 'Failed to download',
        };
    }
}

module.exports = { downloadInstagramPost };