const { registerWindowHandlers } = require('./window-handlers');
const { registerCareHandlers } = require('./care-handlers');
const { registerBrowserHandlers } = require('./browser-handlers');
const { registerAccountHandlers } = require('./accounts-handlers');
const { registerPostingHandlers } = require('./posts-handlers');
const { registerSchedulerHandlers } = require('./scheduler-handlers');
const { registerChromeHandlers } = require('./chrome-handlers');
const { registerProxyHandlers } = require('./proxy-handlers');
const { registerMediaHandlers } = require('./media-handlers');
const { registerDownloadHandlers } = require('./download-handlers');
const { registerFullPipelineRenderHandler } = require('./rendering-handlers');
const { registerMachineIdHandler } = require('./misc-handlers');

/**
 * Register all IPC handlers
 */
function registerAllHandlers() {
  console.log('📡 Registering all IPC handlers...');
  
  registerWindowHandlers();
  console.log('✅ Window handlers registered');
  
  registerCareHandlers();
  console.log('✅ Care handlers registered');
  
  registerBrowserHandlers();
  console.log('✅ Browser handlers registered');
  
  registerAccountHandlers();
  console.log('✅ Account handlers registered');
  
  registerPostingHandlers();
  console.log('✅ Posting handlers registered');
  
  registerSchedulerHandlers();
  console.log('✅ Scheduler handlers registered');
  
  registerChromeHandlers();
  console.log('✅ Chrome handlers registered');
  
  registerProxyHandlers();
  console.log('✅ Proxy handlers registered');
  
  registerMediaHandlers();
  console.log('✅ Media handlers registered');
  
  registerDownloadHandlers();
  console.log('✅ Download handlers registered');
  
  registerFullPipelineRenderHandler();
  console.log('✅ Rendering handlers registered');
  
  registerMachineIdHandler();
  console.log('✅ Machine ID handlers registered');
  
  console.log('🎉 All handlers registered successfully!');
}

module.exports = { registerAllHandlers };
