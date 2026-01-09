const { ipcMain, shell } = require('electron');

/**
 * ============================================
 * MACHINE ID HANDLER
 * ============================================
 */
function registerMachineIdHandler() {
  const { machineIdSync } = require('node-machine-id');
  
  ipcMain.handle('get-machine-id', async () => {
    try {
      const id = machineIdSync();
      console.log('📱 Machine ID:', id);
      return { success: true, id };
    } catch (error) {
      console.error('Error getting machine ID:', error);
      return { success: false, error: error.message };
    }
  });

  // ✅ ADD: Open external link handler
  ipcMain.on('open-external-link', (event, url) => {
    console.log('🔗 Opening external link:', url);
    
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url)
        .then(() => {
          console.log('✅ Link opened in default browser');
        })
        .catch((error) => {
          console.error('❌ Error opening link:', error);
        });
    } else {
      console.warn('⚠️ Invalid URL:', url);
    }
  });

  // ✅ ADD: Also handle invoke version (for compatibility)
  ipcMain.handle('open-external', async (event, url) => {
    console.log('🔗 Opening external (invoke):', url);
    
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      await shell.openExternal(url);
      return { success: true };
    }
    
    return { success: false, error: 'Invalid URL' };
  });

  console.log('✅ Open external link handler registered');
}

module.exports = { registerMachineIdHandler };