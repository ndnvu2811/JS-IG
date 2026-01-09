/**
 * ============================================
 * MEDIA PATH MANAGEMENT
 * Unified paths for all media operations
 * ============================================
 */

const path = require('path');
const fs = require('fs');

/**
 * Media path constants
 * Organized folder structure:
 * - user-media/ → All important media (posts, reels, avatars, imports)
 * - temp/ → Temporary files (auto-delete on quit)
 * - cache/ → Browser cache (handled by Electron, auto-cleanup)
 */
function getMediaPaths(userDataPath) {
  return {
    // =============== USER MEDIA (Important) ===============
    // Main user media folder (consolidates content-media, downloaded-media, rendered-videos)
    userMedia: path.join(userDataPath, 'user-media'),
    posts: path.join(userDataPath, 'user-media', 'posts'),
    reels: path.join(userDataPath, 'user-media', 'reels'),
    avatars: path.join(userDataPath, 'user-media', 'avatars'),
    imports: path.join(userDataPath, 'user-media', 'imports'),
    
    // =============== TEMP FILES (Auto-cleanup on quit) ===============
    temp: path.join(userDataPath, 'temp'),
    tempHybrid: path.join(userDataPath, 'temp', 'hybrid'),
    tempFrames: path.join(userDataPath, 'temp', 'frames'),
    tempRenders: path.join(userDataPath, 'temp', 'renders'),
    
    // =============== CACHE (Browser cache, auto-cleanup) ===============
    // Note: Electron automatically uses app.getPath('cache') for browser cache
    cache: path.join(userDataPath, 'cache'),
    
    // =============== LEGACY FOLDERS (For migration only) ===============
    contentMedia: path.join(userDataPath, 'content-media'),
    downloadedMedia: path.join(userDataPath, 'downloaded-media'),
    renderedVideos: path.join(userDataPath, 'rendered-videos'),
    tempFramesOld: path.join(userDataPath, 'temp-frames'),
    tempHybridOld: path.join(userDataPath, 'temp-hybrid'),
    tempRendersOld: path.join(userDataPath, 'temp-renders'),
  };
}

/**
 * Ensure media directory exists
 */
function ensureMediaDirectories(userDataPath) {
  const paths = getMediaPaths(userDataPath);
  
  // Create user-media structure (important files)
  [
    paths.userMedia,
    paths.posts,
    paths.reels,
    paths.avatars,
    paths.imports,
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 Created directory:', dir);
    }
  });
  
  // Create temp folder structure (will auto-cleanup on quit)
  [
    paths.temp,
    paths.tempHybrid,
    paths.tempFrames,
    paths.tempRenders,
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Clean temp directory (auto-delete on app quit)
 * IMPORTANT: This deletes ephemeral folders - cache/temp directories
 * Keeps: user-media, databases, Preferences, Local State, SharedStorage
 */
function cleanupCacheAndTemp(userDataPath) {
  const paths = getMediaPaths(userDataPath);
  
  // Browser cache folder names that Chromium creates in userData root
  // These should be consolidated in cache/, but just in case they're at root, delete them
  const browserCacheFolders = [
    'Local Storage',
    'Session Storage',
    'IndexedDB',
    'WebStorage',
    'GPUCache',
    'DawnGraphiteCache',
    'DawnWebGPUCache',
    'VideoDecodeStats',
    'Code Cache',
    'blob_storage',
    'Network',
    'Shared Dictionary',
  ];

  // DELETE orphan browser cache folders from userData root (don't move, just delete)
  // This ensures media-library/ doesn't accumulate browser cache at root
  browserCacheFolders.forEach(dirName => {
    const folderPath = path.join(userDataPath, dirName);
    if (fs.existsSync(folderPath)) {
      try {
        fs.rmSync(folderPath, { recursive: true, force: true });
      } catch (error) {
        // Silently skip
      }
    }
  });

  // Clean temp folder (transient render files, hybrid files, etc)
  if (fs.existsSync(paths.temp)) {
    try {
      fs.rmSync(paths.temp, { recursive: true, force: true });
    } catch (error) {
      // Silently skip
    }
  }

  // Also clean any old temp folders (for backward compatibility)
  const oldTempDirs = [
    paths.tempFramesOld,
    paths.tempHybridOld,
    paths.tempRendersOld,
  ];

  oldTempDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        // Silently skip
      }
    }
  });

  // Clean cache folder (consolidated browser cache) - delete in cleanup phase
  const cachePath = path.join(userDataPath, 'cache');
  if (fs.existsSync(cachePath)) {
    try {
      fs.rmSync(cachePath, { recursive: true, force: true });
    } catch (error) {
      // Silently skip
    }
  }
}

/**
 * Get appropriate media folder based on file type/source
 * @param {string} mediaType - 'post' | 'reel' | 'avatar' | 'import'
 * @param {string} userDataPath - userData path
 */
function getMediaFolder(mediaType, userDataPath) {
  const paths = getMediaPaths(userDataPath);
  
  switch (mediaType.toLowerCase()) {
    case 'post':
      return paths.posts;
    case 'reel':
      return paths.reels;
    case 'avatar':
      return paths.avatars;
    case 'import':
    case 'downloaded':
    case 'scraper':
      return paths.imports;
    default:
      return paths.posts;
  }
}

/**
 * Delete file and ensure actual filesystem deletion
 * @param {string} filePath - Full path to file
 * @returns {object} - Success status
 */
function deleteMediaFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ Media file deleted:', filePath);
      
      // Try to clean up empty parent directories
      const parentDir = path.dirname(filePath);
      if (fs.existsSync(parentDir)) {
        const files = fs.readdirSync(parentDir);
        if (files.length === 0) {
          fs.rmdirSync(parentDir);
          console.log('🗑️ Removed empty directory:', parentDir);
        }
      }
      
      return { success: true };
    } else {
      return { success: false, error: 'File not found' };
    }
  } catch (error) {
    console.error('❌ Error deleting media file:', filePath, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all media files in a folder
 */
function getMediaFilesInFolder(folderPath) {
  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    
    const files = [];
    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(folderPath, item.name);
      if (item.isFile()) {
        files.push(fullPath);
      } else if (item.isDirectory()) {
        // Recursively get files from subdirectories
        files.push(...getMediaFilesInFolder(fullPath));
      }
    });
    
    return files;
  } catch (error) {
    console.error('❌ Error reading media folder:', folderPath, error);
    return [];
  }
}

module.exports = {
  getMediaPaths,
  ensureMediaDirectories,
  cleanupCacheAndTemp,
  getMediaFolder,
  deleteMediaFile,
  getMediaFilesInFolder,
};
