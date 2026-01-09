const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// ✅ Helper: Get settings file path (called at runtime, not at import)
const getSettingsPath = () => path.join(app.getPath('userData'), 'chrome-settings.json');

/**
 * Lưu Chrome path do user chọn
 */
function saveChromeSettings(chromePath, autoDetect = true) {
  const settings = {
    chromePath: chromePath,
    autoDetectChrome: autoDetect,
    savedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2));
  console.log('✅ Chrome settings saved:', chromePath);
}

/**
 * Đọc Chrome path đã lưu
 */
function loadChromeSettings() {
  try {
    const SETTINGS_PATH = getSettingsPath();
    if (fs.existsSync(SETTINGS_PATH)) {
      const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Failed to load Chrome settings:', error);
  }
  return null;
}

/**
 * Tự động tìm Chrome trên máy
 */
function autoDetectChrome() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'D:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'E:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const chromePath of possiblePaths) {
    if (fs.existsSync(chromePath)) {
      console.log('✅ Auto-detected Chrome at:', chromePath);
      return chromePath;
    }
  }

  console.log('⚠️ Chrome not found');
  return null;
}

/**
 * Lấy Chrome path (Ưu tiên: User setting → Auto-detect → null)
 */
function getChromePath() {
  // 1. Ưu tiên path do user chọn
  const settings = loadChromeSettings();
  if (settings && settings.chromePath && fs.existsSync(settings.chromePath)) {
    console.log('✅ Using user-configured Chrome:', settings.chromePath);
    return settings.chromePath;
  }

  // 2. Nếu không có, tự động tìm
  if (!settings || settings.autoDetectChrome !== false) {
    const detectedPath = autoDetectChrome();
    if (detectedPath) {
      // Tự động lưu lại để lần sau không phải tìm nữa
      saveChromeSettings(detectedPath, true);
      return detectedPath;
    }
  }

  // 3. Không tìm thấy
  return null;
}

/**
 * Validate Chrome path
 */
function validateChromePath(chromePath) {
  if (!chromePath) return false;
  if (!fs.existsSync(chromePath)) return false;
  if (!chromePath.toLowerCase().endsWith('.exe')) return false;
  return true;
}

/**
 * Lấy config để launch browser
 */
function getChromeConfig(options = {}) {
  const chromePath = getChromePath();
  
  const config = {
    headless: options.headless || false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (chromePath) {
    config.executablePath = chromePath;
  }

  return config;
}

module.exports = {
  getChromeConfig,
  getChromePath,
  saveChromeSettings,
  loadChromeSettings,
  autoDetectChrome,
  validateChromePath
};