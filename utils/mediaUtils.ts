/**
 * Media Upload Utilities
 * Save to: src/utils/mediaUtils.ts
 */

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadMediaFile = async (file: File): Promise<{ path: string; fileName: string } | null> => {
  try {
    const fileData = await fileToBase64(file);
    
    // Clean up filename - remove duplicate extensions like .jpg.jpg
    let cleanFileName = file.name.toLowerCase();
    
    // Remove duplicate extensions
    const doubleExtPatterns = ['.jpg.jpg', '.png.png', '.gif.gif', '.webp.webp', '.mp4.mp4', '.webm.webm', '.mov.mov'];
    for (const pattern of doubleExtPatterns) {
      while (cleanFileName.endsWith(pattern)) {
        cleanFileName = cleanFileName.slice(0, -pattern.length) + pattern.slice(0, pattern.length / 2);
      }
    }
    
    // Restore original case for the filename (use file.name but with cleaned extension)
    const originalLower = file.name.toLowerCase();
    if (originalLower !== cleanFileName) {
      // If filename was cleaned, use the cleaned version
      cleanFileName = file.name.slice(0, file.name.toLowerCase().indexOf(cleanFileName) + cleanFileName.length);
    } else {
      cleanFileName = file.name;
    }
    
    const result = await window.electronAPI.saveMediaFile({
      fileData,
      fileName: cleanFileName,
      fileType: file.type,
    });
    
    if (result.success && result.path && result.fileName) {
      console.log('✅ Media uploaded with new cache:', result.path);
      return {
        path: result.path,
        fileName: result.fileName,
      };
    } else {
      console.error('Failed to save media:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error uploading media:', error);
    return null;
  }
};

/**
 * ✅ Create video cache from existing file path
 * Useful for importing videos and ensuring fresh cache
 */
export const createVideoCache = async (sourceVideoPath: string): Promise<{ path: string; fileName: string } | null> => {
  try {
    console.log('🎥 Creating new video cache from:', sourceVideoPath);
    
    const result = await (window as any).electronAPI?.createVideoCache?.({
      sourceVideoPath,
      fileType: 'video/mp4',
    });
    
    if (result?.success) {
      console.log('✅ Video cache created (NEW):', result.path);
      return {
        path: result.path,
        fileName: result.fileName,
      };
    } else {
      console.error('Failed to create video cache:', result?.error);
      return null;
    }
  } catch (error) {
    console.error('Error creating video cache:', error);
    return null;
  }
};

export const deleteMediaFile = async (filePath: string): Promise<boolean> => {
  try {
    const result = await window.electronAPI.deleteMediaFile(filePath);
    return result.success;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
};

/**
 * Read file from disk and convert to data URL
 * Handles both regular paths and file:// URLs
 */
export const readMediaFile = async (filePath: string): Promise<string | null> => {
  try {
    const result = await window.electronAPI.readMediaFile(filePath);
    if (result.success && result.dataUrl) {
      return result.dataUrl;
    }
    return null;
  } catch (error) {
    console.error('Error reading media file:', error);
    return null;
  }
};

/**
 * Convert file path to proper URL for Electron
 * Uses custom protocol 'media-file://' registered in main.js
 */
export const getMediaUrl = (filePath: string): string => {
  if (!filePath) return '';
  
  // If already a URL (http/https), return as-is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  // If already using custom protocol, return as-is
  if (filePath.startsWith('media-file://')) {
    return filePath;
  }

  // If it's a file:// URL, convert to custom protocol
  if (filePath.startsWith('file://')) {
    let cleanPath = filePath.substring(7); // Remove 'file://'
    // On Windows, handle paths like /C:/Users/...
    if (cleanPath.match(/^\/[A-Za-z]:/)) {
      cleanPath = cleanPath.substring(1); // Remove leading /
    }
    cleanPath = cleanPath.replace(/\\/g, '/'); // Windows backslash to forward slash
    return `media-file://${cleanPath}`;
  }
  
  // Convert local path to custom protocol
  // Remove any leading slashes and drive letters for consistency
  let cleanPath = filePath.replace(/\\/g, '/'); // Windows backslash to forward slash
  
  // If path starts with drive letter (C:, D:, etc), keep it
  // Otherwise add /// for absolute paths
  if (cleanPath.match(/^[A-Z]:/i)) {
    return `media-file://${cleanPath}`;
  } else if (cleanPath.startsWith('/')) {
    return `media-file://${cleanPath}`;
  } else {
    return `media-file:///${cleanPath}`;
  }
};