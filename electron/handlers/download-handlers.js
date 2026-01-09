const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { downloadInstagramPost } = require('../instagram-download');
const { getMediaPaths, getMediaFolder, deleteMediaFile } = require('../media-paths');

// Helper function
function loadCookies(cookiesPath) {
  try {
    const data = fs.readFileSync(cookiesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading cookies:', error);
    return null;
  }
}

/**
 * ============================================
 * DOWNLOAD HANDLERS
 * ============================================
 */
function registerDownloadHandlers() {
  ipcMain.handle('get-media-path', async () => {
    const mediaPaths = getMediaPaths(app.getPath('userData'));
    // Return imports folder for downloaded content
    if (!fs.existsSync(mediaPaths.imports)) {
      fs.mkdirSync(mediaPaths.imports, { recursive: true });
    }
    return mediaPaths.imports;
  });

  ipcMain.handle('download-media', async (event, { url, savePath }) => {
    try {
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            protocol.get(redirectUrl, (redirectResponse) => {
              const file = fs.createWriteStream(savePath);
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve({ success: true, path: savePath });
              });
            });
            return;
          }

          const file = fs.createWriteStream(savePath);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve({ success: true, path: savePath });
          });
        });

        request.on('error', (err) => {
          fs.unlink(savePath, () => {});
          resolve({ success: false, error: err.message });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file-to-downloads', async (event, { sourcePath, fileName, folderName }) => {
    try {
      const downloadsPath = app.getPath('downloads');
      const targetFolder = folderName ? path.join(downloadsPath, folderName) : downloadsPath;
      
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const targetPath = path.join(targetFolder, fileName);
      fs.copyFileSync(sourcePath, targetPath);

      return { success: true, path: targetPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('instagram-download-post', async (event, { postUrl }) => {
    try {
      console.log('\n' + '='.repeat(60));
      console.log('📥 Direct Instagram download:', postUrl);
      console.log('='.repeat(60));
      
      const accounts = await new Promise((resolve) => {
        event.sender.send('request-instagram-accounts');
        
        ipcMain.once('provide-instagram-accounts', (e, accountsData) => {
          resolve(accountsData);
        });
        
        setTimeout(() => resolve(null), 5000);
      });
      
      if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
        return { success: false, error: 'No Instagram account found. Please add an account first.' };
      }
      
      const account = accounts[0];
      console.log('📱 Using account:', account.username);
      
      const result = await downloadInstagramPost(postUrl, account);
      
      return result;
    } catch (error) {
      console.error('❌ Instagram download error:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Background download handler
   * Uses Scraper_Post_X / Scraper_Reel_X naming convention
   */
  ipcMain.handle('start-background-download', async (event, params) => {
    console.log('\n' + '='.repeat(60));
    console.log('📥 [Electron] Background download request received');
    console.log('='.repeat(60));
    
    let { urls, cookiesPath, taskId, contentType, startingNumber } = params;
    
    // Default values
    contentType = contentType || 'post';
    startingNumber = startingNumber || 1;
    
    // Normalize path - convert backslashes to forward slashes for consistency
    if (cookiesPath) {
      cookiesPath = cookiesPath.replace(/\\\\/g, '\\').replace(/\//g, '\\');
      console.log('✅ Normalized cookiesPath:', cookiesPath);
    }
    
    try {
      console.log('📋 Request details:');
      console.log(`  - URLs: ${urls?.length || 0}`);
      console.log(`  - Content type: ${contentType}`);
      console.log(`  - Starting number: ${startingNumber}`);
      console.log(`  - Task ID: ${taskId}`);
      
      if (!Array.isArray(urls) || urls.length === 0) {
        const error = 'No URLs provided';
        console.error('❌', error);
        return { success: false, error };
      }
      
      if (!cookiesPath) {
        const error = 'No cookies path provided';
        console.error('❌', error);
        return { success: false, error };
      }

      const cookieData = loadCookies(cookiesPath);
      if (!cookieData) {
        const error = `Cookies file not found: ${cookiesPath}`;
        console.error('❌', error);
        return { success: false, error };
      }
      
      console.log('✅ Cookies loaded successfully');

      // Setup directories
      const mediaDir = path.join(app.getPath('userData'), 'content-media');
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      console.log(`📁 Media directory: ${mediaDir}`);

      const downloadedFiles = [];
      let successCount = 0;
      let totalMediaDownloaded = 0;

      // Determine folder prefix based on content type
      const folderPrefix = contentType === 'reel' ? 'Scraper_Reel' : 'Scraper_Post';
      console.log(`📁 Folder naming: ${folderPrefix}_${startingNumber} → ${folderPrefix}_${startingNumber + urls.length - 1}`);

      // Send initial progress
      event.sender.send('download-progress', {
        taskId,
        status: 'starting',
        current: 0,
        total: urls.length,
        message: `📥 Received ${urls.length} URLs - Starting from ${folderPrefix}_${startingNumber}`
      });

      for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
        const url = urls[urlIndex];
        const fileNumber = startingNumber + urlIndex;
        const folderName = `${folderPrefix}_${fileNumber}`;
        const folderPath = path.join(mediaDir, folderName);
        
        // Create folder for this post
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        
        try {
          console.log(`\n${'─'.repeat(50)}`);
          console.log(`📥 [${urlIndex + 1}/${urls.length}] Processing: ${url}`);
          console.log(`📁 Saving to: ${folderName}`);
          console.log(`${'─'.repeat(50)}`);
          
          // Send progress to frontend
          event.sender.send('download-progress', {
            taskId,
            status: 'scraping',
            current: urlIndex + 1,
            total: urls.length,
            message: `🔍 [${urlIndex + 1}/${urls.length}] Scraping ${folderName}...`
          });
          
          // Get media URLs from Instagram post/reel
          const result = await downloadInstagramPost(url, {
            cookiesPath,
            cookies: cookieData.cookies,
            username: 'downloaded-account'
          });

          if (!result.success) {
            console.warn(`⚠️ Failed to scrape ${url}: ${result.error}`);
            event.sender.send('download-progress', {
              taskId,
              status: 'scrape-error',
              current: urlIndex + 1,
              total: urls.length,
              message: `❌ Failed to scrape ${folderName}: ${result.error}`
            });
            continue;
          }

          console.log(`✅ Found ${result.media.length} media item(s) in ${folderName}`);
          
          // Download each media file
          for (let mediaIndex = 0; mediaIndex < result.media.length; mediaIndex++) {
            const media = result.media[mediaIndex];
            try {
              const isVideo = media.type === 'video';
              const ext = isVideo ? 'mp4' : 'jpg';
              const fileName = `${folderName}_${String(mediaIndex + 1).padStart(2, '0')}.${ext}`;
              const filePath = path.join(folderPath, fileName);
              
              console.log(`  💾 [${mediaIndex + 1}/${result.media.length}] Downloading ${isVideo ? 'video' : 'image'}...`);
              
              event.sender.send('download-progress', {
                taskId,
                status: 'downloading',
                current: urlIndex + 1,
                total: urls.length,
                message: `💾 [${urlIndex + 1}/${urls.length}] Downloading file ${mediaIndex + 1}/${result.media.length} to ${folderName}...`
              });
              
              await new Promise((resolve, reject) => {
                const protocol = media.url.startsWith('https') ? https : http;
                
                const request = protocol.get(media.url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  }
                }, (response) => {
                  if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    protocol.get(redirectUrl, (redirectResponse) => {
                      const file = fs.createWriteStream(filePath);
                      redirectResponse.pipe(file);
                      file.on('finish', () => {
                        file.close();
                        resolve();
                      });
                      file.on('error', reject);
                    });
                    return;
                  }

                  const file = fs.createWriteStream(filePath);
                  response.pipe(file);
                  file.on('finish', () => {
                    file.close();
                    resolve();
                  });
                  file.on('error', reject);
                });

                request.on('error', reject);
              });
              
              downloadedFiles.push(filePath);
              totalMediaDownloaded++;
              console.log(`  ✅ Saved: ${fileName}`);
              
            } catch (error) {
              console.warn(`  ⚠️ Failed to download media: ${error.message}`);
            }
          }
          
          successCount++;
          
          event.sender.send('download-progress', {
            taskId,
            status: 'completed-url',
            current: urlIndex + 1,
            total: urls.length,
            filesDownloaded: totalMediaDownloaded,
            message: `✅ Completed ${folderName} (${urlIndex + 1}/${urls.length}) - ${totalMediaDownloaded} files total`
          });
          
        } catch (error) {
          console.error(`❌ Error processing ${url}:`, error.message);
          event.sender.send('download-progress', {
            taskId,
            status: 'url-error',
            current: urlIndex + 1,
            total: urls.length,
            message: `❌ Error on ${folderName}: ${error.message}`
          });
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log(`✅ Download complete!`);
      console.log(`📊 Summary: ${successCount}/${urls.length} URLs processed, ${totalMediaDownloaded} files downloaded`);
      console.log('='.repeat(60));
      
      if (totalMediaDownloaded === 0) {
        const error = `Failed to download any files (${urls.length} URLs attempted)`;
        console.error('❌', error);
        event.sender.send('download-complete', {
          taskId,
          success: false,
          error
        });
        return {
          success: false,
          error
        };
      }

      const finalMessage = `🎉 Download complete! ${successCount}/${urls.length} URLs processed, ${totalMediaDownloaded} files saved to ${folderPrefix}_${startingNumber}${urls.length > 1 ? ` → ${folderPrefix}_${startingNumber + urls.length - 1}` : ''}`;
      
      event.sender.send('download-complete', {
        taskId,
        success: true,
        downloadedCount: totalMediaDownloaded,
        totalCount: urls.length,
        files: downloadedFiles,
        message: finalMessage
      });

      return {
        success: true,
        downloadedCount: totalMediaDownloaded,
        totalCount: urls.length,
        successfulUrls: successCount,
        files: downloadedFiles,
        message: finalMessage
      };
    } catch (error) {
      console.error('❌ Background download error:', error);
      event.sender.send('download-complete', {
        taskId,
        success: false,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  });
}

module.exports = { registerDownloadHandlers };