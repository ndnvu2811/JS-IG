/**
 * Care Activity Scheduler
 * Chạy trong Electron main process
 */

const { runAutoFollow } = require('./care-automation-follow');
const { runAutoBrowse } = require('./care-automation');

let schedulerInterval = null;
let isRunning = false;

// ✅ LOCK MECHANISM: Tránh chạy duplicate
const runningSchedules = new Set();  // Set chứa các schedule đang chạy
const completedSchedules = new Map(); // Map chứa schedule đã chạy xong (key -> timestamp)

/**
 * Khởi động scheduler
 */
function startCareScheduler(mainWindow) {
  if (isRunning) {
    console.log('⚠️ Care Scheduler already running');
    return;
  }

  console.log('🚀 Starting Care Activity Scheduler...');
  isRunning = true;

  // Check ngay
  checkSchedules(mainWindow);

  // Check mỗi 60s
  schedulerInterval = setInterval(() => {
    checkSchedules(mainWindow);
  }, 60000);

  console.log('✅ Care Scheduler started');
}

/**
 * Dừng scheduler
 */
function stopCareScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    isRunning = false;
    console.log('🛑 Care Scheduler stopped');
  }
}

/**
 * Check schedules
 */
function checkSchedules(mainWindow) {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  console.log(`🕐 Checking care schedules... (${currentDate} ${currentTime})`);

  // Gửi request lấy schedules từ renderer
  mainWindow.webContents.send('check-care-schedules', { currentDate, currentTime });
}

/**
 * Xử lý schedule từ renderer
 */
async function handleScheduleExecution(schedules, accounts, currentDate, currentTime, mainWindow) {
  try {
    const toRun = schedules.filter(schedule => {
      if (schedule.schedule.date !== currentDate) return false;
      if (!schedule.schedule.times.includes(currentTime)) return false;
      
      // Check last run
      const key = `${schedule.id}-${currentDate}-${currentTime}`;
      if (global.lastRunSchedules && global.lastRunSchedules[key]) {
        const diff = Date.now() - global.lastRunSchedules[key];
        if (diff < 60000) return false;
      }
      
      return true;
    });

    if (toRun.length === 0) {
      console.log('✅ No care activities to run');
      return;
    }

    console.log(`🎯 Running ${toRun.length} care activity(s)...`);

    for (const schedule of toRun) {
      await runSchedule(schedule, accounts, mainWindow);
      
      // Save last run
      if (!global.lastRunSchedules) global.lastRunSchedules = {};
      const key = `${schedule.id}-${currentDate}-${currentTime}`;
      global.lastRunSchedules[key] = Date.now();
    }

  } catch (error) {
    console.error('❌ Schedule execution error:', error);
  }
}

/**
 * Chạy 1 schedule
 */
async function runSchedule(schedule, allAccounts, mainWindow) {
  const scheduleKey = `${schedule.id}`;
  
  // ✅ CHECK LOCK: Nếu schedule đang chạy, skip
  if (runningSchedules.has(scheduleKey)) {
    console.log(`⏭️ Schedule ${schedule.id} is already running, skipping...`);
    return { success: false, error: 'Already running' };
  }
  
  // ✅ CHECK COMPLETED: Nếu đã chạy trong 5 phút qua, skip
  const lastCompleted = completedSchedules.get(scheduleKey);
  if (lastCompleted && (Date.now() - lastCompleted) < 5 * 60 * 1000) {
    console.log(`⏭️ Schedule ${schedule.id} was completed recently, skipping...`);
    return { success: false, error: 'Recently completed' };
  }
  
  // ✅ SET LOCK
  runningSchedules.add(scheduleKey);
  console.log(`🔒 Lock acquired for schedule: ${schedule.id}`);
  
  try {
    console.log(`▶️ Running care schedule: ${schedule.id}`);

    const { settings } = schedule;

    // ✅ Debug settings
    console.log('🔍 Schedule settings:');
    console.log('  - autoBrowseEnabled:', settings.autoBrowseEnabled);
    console.log('  - autoBrowseAccounts:', settings.autoBrowseAccounts);
    console.log('  - autoFollowEnabled:', settings.autoFollowEnabled);
    console.log('  - autoFollowAccounts:', settings.autoFollowAccounts);

    const results = [];

    // ✅ Helper: Safe send to renderer (check mainWindow before sending)
    const safeSend = (channel, data) => {
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(channel, data);
        }
      } catch (e) {
        console.log(`⚠️ Could not send to ${channel}:`, e.message);
      }
    };

    // Auto-Browse
    if (settings.autoBrowseEnabled && settings.autoBrowseAccounts.length > 0) {
      console.log('🔄 Auto-Browse...');
      console.log('  📋 Selected accounts:', settings.autoBrowseAccounts);

      try {
        const browseResult = await runAutoBrowse(allAccounts, settings, (data) => {
          safeSend('auto-browse-progress', data);
        });
        
        if (browseResult) results.push(...browseResult); 
      } catch (browseError) {
        console.error('❌ Auto-Browse error:', browseError.message);
        results.push({ success: false, error: browseError.message, type: 'autoBrowse' });
      }
    }

    // Auto-Follow
    if (settings.autoFollowEnabled && settings.autoFollowAccounts.length > 0) {
      console.log('🔄 Auto-Follow...');
      
      try {
        const followResult = await runAutoFollow(allAccounts, settings, (data) => {
          safeSend('auto-follow-progress', data);
        });

        if (followResult) results.push(...followResult);
      } catch (followError) {
        console.error('❌ Auto-Follow error:', followError.message);
        results.push({ success: false, error: followError.message, type: 'autoFollow' });
      }
    }

    console.log(`✅ Schedule ${schedule.id} completed`);
    
    // ✅ MARK AS COMPLETED
    completedSchedules.set(scheduleKey, Date.now());

    // Thông báo hoàn thành
    safeSend('care-schedule-completed', {
      scheduleId: schedule.id,
      results: results,
      success: true
    });
    
    return { success: true, results };

  } catch (error) {
    console.error(`❌ Error running schedule ${schedule.id}:`, error);
    
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('care-schedule-completed', {
          scheduleId: schedule.id,
          error: error.message,
          success: false
        });
      }
    } catch (e) {
      console.log('⚠️ Could not send error to renderer');
    }
    
    return { success: false, error: error.message };
  } finally {
    // ✅ RELEASE LOCK
    runningSchedules.delete(scheduleKey);
    console.log(`🔓 Lock released for schedule: ${schedule.id}`);
  }
}

module.exports = {
  startCareScheduler,
  stopCareScheduler,
  handleScheduleExecution,
  runSingleSchedule: runSchedule,  // ✅ Export runSchedule với tên mới cho handlers
};