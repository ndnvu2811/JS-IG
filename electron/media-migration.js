/**
 * ============================================
 * MEDIA MIGRATION
 * Move files from old folder structure to new unified structure on first run
 * ============================================
 */

const path = require('path');
const fs = require('fs');
const { getMediaPaths } = require('./media-paths');

/**
 * Migrate media files from old structure to new unified structure
 * Called once on app startup
 */
function migrateMediaFiles(userDataPath) {
  const mediaPaths = getMediaPaths(userDataPath);
  
  // Migrate media files to user-media/
  const mediaMigrations = [
    {
      oldPath: mediaPaths.contentMedia,
      newPath: mediaPaths.posts,
      name: 'content-media → posts'
    },
    {
      oldPath: mediaPaths.downloadedMedia,
      newPath: mediaPaths.imports,
      name: 'downloaded-media → imports'
    },
    {
      oldPath: mediaPaths.renderedVideos,
      newPath: mediaPaths.reels,
      name: 'rendered-videos → reels'
    }
  ];

  // Migrate temp files to temp/
  const tempMigrations = [
    {
      oldPath: mediaPaths.tempFramesOld,
      newPath: mediaPaths.tempFrames,
      name: 'temp-frames → temp/frames'
    },
    {
      oldPath: mediaPaths.tempHybridOld,
      newPath: mediaPaths.tempHybrid,
      name: 'temp-hybrid → temp/hybrid'
    },
    {
      oldPath: mediaPaths.tempRendersOld,
      newPath: mediaPaths.tempRenders,
      name: 'temp-renders → temp/renders'
    }
  ];

  // Run all migrations
  [...mediaMigrations, ...tempMigrations].forEach(({ oldPath, newPath, name }) => {
    if (fs.existsSync(oldPath)) {
      console.log(`🔄 Migrating ${name}...`);
      
      try {
        const files = fs.readdirSync(oldPath, { withFileTypes: true });
        let movedCount = 0;

        files.forEach(file => {
          try {
            const oldFilePath = path.join(oldPath, file.name);
            const newFilePath = path.join(newPath, file.name);
            
            // Avoid overwriting existing files
            if (!fs.existsSync(newFilePath)) {
              if (file.isFile()) {
                fs.copyFileSync(oldFilePath, newFilePath);
                movedCount++;
              } else if (file.isDirectory()) {
                // Recursively copy directories
                copyDirectoryRecursive(oldFilePath, newFilePath);
                movedCount++;
              }
            }
          } catch (error) {
            console.error(`❌ Error moving ${file.name}:`, error);
          }
        });

        console.log(`✅ Migrated ${movedCount} items from ${name}`);

        // Remove old directory after successful migration
        try {
          fs.rmSync(oldPath, { recursive: true, force: true });
          console.log(`🗑️ Removed old directory: ${oldPath}`);
        } catch (error) {
          console.log(`⚠️ Could not remove old directory: ${oldPath}`);
        }
      } catch (error) {
        console.error(`❌ Migration error for ${name}:`, error);
      }
    }
  });

  // Cleanup orphan browser cache folders that might have been created
  cleanupOrphanBrowserCache(userDataPath);
}

/**
 * Move browser cache folders from userData root to cache/ folder
 * Consolidates all browser cache in one location for cleanup
 */
function moveBrowserCacheToCacheFolder(userDataPath, silent = false) {
  try {
    const cachePath = path.join(userDataPath, 'cache');
    
    // Ensure cache folder exists
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
    }

    const browserCacheDirs = [
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

    browserCacheDirs.forEach(dirName => {
      const srcPath = path.join(userDataPath, dirName);
      const destPath = path.join(cachePath, dirName);

      if (fs.existsSync(srcPath) && srcPath !== destPath) {
        try {
          // Check if destination already exists
          if (fs.existsSync(destPath)) {
            // Remove old destination first
            fs.rmSync(destPath, { recursive: true, force: true });
          }
          
          // Move (rename) to cache folder
          fs.renameSync(srcPath, destPath);
          if (!silent) {
            console.log(`📦 Moved browser cache to: cache/${dirName}`);
          }
        } catch (error) {
          // If move fails, try copy + delete
          try {
            copyDirectoryRecursive(srcPath, destPath);
            fs.rmSync(srcPath, { recursive: true, force: true });
            if (!silent) {
              console.log(`📦 Moved browser cache to: cache/${dirName}`);
            }
          } catch (copyError) {
            // Silently skip if both methods fail
            if (!silent) {
              console.log(`⚠️ Could not move ${dirName}: ${error.message}`);
            }
          }
        }
      }
    });
  } catch (error) {
    if (!silent) {
      console.error('❌ Browser cache consolidation error:', error.message);
    }
  }
}

/**
 * Cleanup browser cache folders that were accidentally created in userData
 * These should be in the cache/ folder instead (configured via app.setPath)
 */
function cleanupOrphanBrowserCache(userDataPath) {
  const orphanDirs = [
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
  ];

  orphanDirs.forEach(dirName => {
    const dirPath = path.join(userDataPath, dirName);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`🗑️ Removed orphan browser cache: ${dirName}`);
      } catch (error) {
        // Silently skip
      }
    }
  });
}

/**
 * Helper: Recursively copy directory
 */
function copyDirectoryRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src, { withFileTypes: true });
  
  files.forEach(file => {
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);

    if (file.isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
}

module.exports = {
  migrateMediaFiles,
  moveBrowserCacheToCacheFolder,
  cleanupOrphanBrowserCache,
};
