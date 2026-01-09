const { app } = require('electron');
const fs = require('fs');
const path = require('path');

/**
 * Load window size từ settings
 * @returns {{ width: number, height: number }}
 */
function getWindowSize() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'chrome-settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (settings.windowWidth && settings.windowHeight) {
        console.log(`📐 Using custom window size: ${settings.windowWidth}x${settings.windowHeight}`);
        return {
          width: settings.windowWidth,
          height: settings.windowHeight
        };
      }
    }
  } catch (error) {
    console.error('Error loading window settings:', error);
  }
  
  // Default size
  return { width: 1280, height: 800 };
}

module.exports = { getWindowSize };