const { ipcMain } = require('electron');
const { runAutoBrowse } = require('../care-automation');
const { runAutoFollow } = require('../care-automation-follow');
const { runSingleSchedule } = require('../care-scheduler');
const { getMainWindow } = require('../window-manager');

/**
 * ============================================
 * CARE AUTOMATION HANDLERS
 * ============================================
 */
function registerCareHandlers() {
  ipcMain.handle('start-auto-browse', async (event, { accounts, settings }) => {
    console.log('🟢🟢🟢 IPC HANDLER CALLED: start-auto-browse 🟢🟢🟢');
    
    try {
      const selectedAccounts = accounts.filter(acc => 
        settings.autoBrowseAccounts.includes(acc.id)
      );
      
      if (selectedAccounts.length === 0) {
        return { success: false, error: 'No accounts selected' };
      }
      
      const onProgress = (progressData) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('auto-browse-progress', progressData);
        }
      };
      
      const automationResults = await runAutoBrowse(selectedAccounts, settings, onProgress);
      
      return { success: true, results: automationResults };
    } catch (error) {
      console.error('❌ Error in start-auto-browse:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('start-auto-follow', async (event, { accounts, settings }) => {
    console.log('🟢🟢🟢 IPC HANDLER CALLED: start-auto-follow 🟢🟢🟢');
    
    try {
      const selectedAccounts = accounts.filter(acc => 
        settings.autoFollowAccounts.includes(acc.id)
      );
      
      if (selectedAccounts.length === 0) {
        return { success: false, error: 'No accounts selected' };
      }
      
      const onProgress = (progressData) => {
        if (event.sender && !event.sender.isDestroyed()) {
          event.sender.send('auto-follow-progress', progressData);
        }
      };
      
      const results = await runAutoFollow(selectedAccounts, settings, onProgress);
      
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error in start-auto-follow:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('run-care-schedule', async (event, { schedule, accounts, date, time }) => {
    console.log('📨 Received care schedule to run:', schedule.id);
    console.log('   Date:', date, 'Time:', time);
    console.log('   Accounts count:', accounts?.length || 0);
    
    try {
      // ✅ Gọi runSingleSchedule thay vì handleScheduleExecution
      const result = await runSingleSchedule(schedule, accounts, getMainWindow());
      
      event.reply('care-schedule-completed', {
        scheduleId: schedule.id,
        success: true,
        result,
      });
    } catch (error) {
      console.error('❌ Care schedule error:', error);
      event.reply('care-schedule-completed', {
        scheduleId: schedule.id,
        success: false,
        error: error.message,
      });
    }
  });
}

module.exports = { registerCareHandlers };