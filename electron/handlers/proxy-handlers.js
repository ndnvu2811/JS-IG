const { ipcMain } = require('electron');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fetch = require('node-fetch');

/**
 * ============================================
 * PROXY TESTING HANDLER
 * ============================================
 */
function registerProxyHandlers() {
  ipcMain.handle('test-proxy', async (event, { url, proxy }) => {
    console.log('🔵 Testing proxy:', proxy);
    
    try {
      const agent = new HttpsProxyAgent(proxy);
      const startTime = Date.now();
      const response = await fetch(url, {
        agent: agent,
        timeout: 10000,
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Proxy test SUCCESS!');
        return { success: true, data };
      } else {
        console.log('❌ Proxy test FAILED');
        return { success: false, error: 'Request failed' };
      }
    } catch (error) {
      console.error('❌ Proxy test ERROR:', error.message);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerProxyHandlers };
