const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { getMediaPaths, getMediaFolder, deleteMediaFile } = require('../media-paths');

/**
 * ============================================
 * MEDIA FILE HANDLERS
 * ============================================
 */
function registerMediaHandlers() {
  ipcMain.handle('save-media-file', async (event, { fileData, fileName, fileType }) => {
    try {
      const mediaPaths = getMediaPaths(app.getPath('userData'));
      
      // Determine folder based on file type
      let mediaDir = mediaPaths.posts;
      if (fileType && fileType.startsWith('video/')) {
        mediaDir = mediaPaths.reels; // Use reels folder for videos
      }
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      
      // ✅ ALWAYS CREATE NEW CACHE - Use unique timestamp to avoid caching
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const ext = path.extname(fileName);
      const nameWithoutExt = path.basename(fileName, ext);
      
      // Create UNIQUE filename with timestamp AND random ID to prevent caching
      const uniqueFileName = `${timestamp}_${randomId}_${nameWithoutExt}${ext}`;
      const filePath = path.join(mediaDir, uniqueFileName);
      
      const base64Data = fileData.replace(/^data:.*;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      console.log('✅ Media file saved with NEW CACHE:', filePath);
      console.log(`📍 File size: ${buffer.length} bytes`);
      
      return {
        success: true,
        path: filePath,
        fileName: uniqueFileName,
      };
    } catch (error) {
      console.error('❌ Error saving media file:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * ✅ NEW: Create video cache from existing video file
   * This creates a fresh copy to ensure browser cache is cleared
   */
  ipcMain.handle('create-video-cache', async (event, { sourceVideoPath, fileType }) => {
    try {
      const mediaPaths = getMediaPaths(app.getPath('userData'));
      const mediaDir = mediaPaths.reels;
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }
      
      // Create new filename with timestamp to force fresh cache
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const sourceExt = path.extname(sourceVideoPath);
      const sourceName = path.basename(sourceVideoPath, sourceExt);
      
      // Create UNIQUE filename
      const newFileName = `${timestamp}_${randomId}_${sourceName}${sourceExt}`;
      const newFilePath = path.join(mediaDir, newFileName);
      
      // Copy video file to create fresh cache
      fs.copyFileSync(sourceVideoPath, newFilePath);
      
      console.log('✅ Video cache created (NEW):', newFilePath);
      console.log(`📍 Source: ${sourceVideoPath}`);
      
      return {
        success: true,
        path: newFilePath,
        fileName: newFileName,
      };
    } catch (error) {
      console.error('❌ Error creating video cache:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-media-file', async (event, filePath) => {
    // Use centralized deletion function that ensures sync
    const result = deleteMediaFile(filePath);
    return result;
  });

  ipcMain.handle('read-media-file', async (event, filePath) => {
    try {
      console.log('📖 Reading media file:', filePath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found: ' + filePath);
      }

      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      if (ext === '.mp4') mimeType = 'video/mp4';
      else if (ext === '.webm') mimeType = 'video/webm';
      else if (ext === '.mov') mimeType = 'video/quicktime';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';

      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      
      console.log('✅ File converted to data URL');
      return { success: true, dataUrl };
    } catch (error) {
      console.error('❌ Error reading media file:', error);
      return { success: false, error: error.message };
    }
  });

  // Clear all media files except avatars
  ipcMain.handle('clear-all-media', async (event) => {
    try {
      const mediaPaths = getMediaPaths(app.getPath('userData'));
      const foldersToDelete = [
        mediaPaths.posts,
        mediaPaths.reels,
        mediaPaths.renders,
        mediaPaths.tempFrames,
        mediaPaths.tempHybrid,
      ];

      let totalDeleted = 0;

      for (const folderPath of foldersToDelete) {
        if (!fs.existsSync(folderPath)) continue;

        try {
          const files = fs.readdirSync(folderPath);
          for (const file of files) {
            const filePath = path.join(folderPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isFile()) {
              fs.unlinkSync(filePath);
              totalDeleted++;
            } else if (stat.isDirectory()) {
              // Remove subdirectories recursively
              fs.rmSync(filePath, { recursive: true, force: true });
            }
          }
          console.log(`🗑️ Cleared folder: ${folderPath}`);
        } catch (err) {
          console.warn(`⚠️ Failed to clear ${folderPath}:`, err.message);
        }
      }

      console.log(`✅ Cleared media: ${totalDeleted} files deleted`);
      return { success: true, deletedCount: totalDeleted };
    } catch (error) {
      console.error('❌ Error clearing media:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerMediaHandlers };
