import { PostHistory, ReelHistory, CareHistory, Post, Reel, CareActivitySchedule, CareSettings } from '../types';

// =====================================================
// CONSTANTS - localStorage keys
// =====================================================
export const HISTORY_KEYS = {
  POSTS: 'posts-history',
  REELS: 'reels-history',
  CARE: 'care-history',
} as const;

// =====================================================
// POST HISTORY FUNCTIONS
// =====================================================

/**
 * Lấy toàn bộ Post History từ localStorage
 */
export const getPostsHistory = (): PostHistory[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEYS.POSTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading posts history:', error);
    return [];
  }
};

/**
 * Lưu Post vào History
 * Gọi khi: User schedule post HOẶC post được đăng thành công
 */
export const savePostToHistory = (post: Post): PostHistory => {
  const history = getPostsHistory();
  
  // Kiểm tra xem đã có history cho post này chưa
  const existingIndex = history.findIndex(h => h.originalPostId === post.id);
  
  const historyRecord: PostHistory = {
    id: existingIndex >= 0 ? history[existingIndex].id : `post_history_${Date.now()}`,
    originalPostId: post.id,
    account: post.account,
    content: post.content,
    media: post.media,
    scheduledAt: post.scheduledTime,
    postedAt: post.status === 'Posted' ? post.updatedAt : undefined,
    status: post.status === 'Posted' ? 'Posted' : 'Scheduled',
    postedUrl: post.postedUrl,
    createdAt: existingIndex >= 0 ? history[existingIndex].createdAt : new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    // Cập nhật record cũ
    history[existingIndex] = historyRecord;
  } else {
    // Thêm record mới
    history.push(historyRecord);
  }
  
  localStorage.setItem(HISTORY_KEYS.POSTS, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent('storage-change'));
  
  return historyRecord;
};

/**
 * Xóa Post History theo ID
 */
export const deletePostHistory = (historyId: string): void => {
  const history = getPostsHistory();
  const filtered = history.filter(h => h.id !== historyId);
  localStorage.setItem(HISTORY_KEYS.POSTS, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('storage-change'));
};

/**
 * Cập nhật Post History khi post được đăng thành công
 */
export const updatePostHistoryAsPosted = (postId: number, postedUrl: string, postedAt?: string): void => {
  try {
    const history = getPostsHistory();
    const index = history.findIndex(h => h.originalPostId === postId);
    
    if (index >= 0) {
      history[index].status = 'Posted';
      history[index].postedUrl = postedUrl;
      history[index].postedAt = postedAt || new Date().toISOString();
    } else {
      const posts = JSON.parse(localStorage.getItem('instagram-posts') || '[]');
      const originalPost = posts.find((p: any) => p.id === postId);
      
      if (originalPost) {
        history.push({
          id: `post_history_${Date.now()}`,
          originalPostId: postId,
          account: originalPost.account,
          content: originalPost.content,
          media: originalPost.media,
          scheduledAt: originalPost.scheduledTime,
          postedAt: postedAt || new Date().toISOString(),
          status: 'Posted',
          postedUrl: postedUrl,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    localStorage.setItem(HISTORY_KEYS.POSTS, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('storage-change'));
    console.log('✅ Updated post history:', postId, 'Posted');
  } catch (error) {
    console.error('Error updating post history:', error);
  }
};

// =====================================================
// REEL HISTORY FUNCTIONS
// =====================================================

/**
 * Lấy toàn bộ Reel History từ localStorage
 */
export const getReelsHistory = (): ReelHistory[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEYS.REELS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading reels history:', error);
    return [];
  }
};

/**
 * Lưu Reel vào History
 */
export const saveReelToHistory = (reel: Reel): ReelHistory => {
  const history = getReelsHistory();
  
  const existingIndex = history.findIndex(h => h.originalReelId === reel.id);
  
  const historyRecord: ReelHistory = {
    id: existingIndex >= 0 ? history[existingIndex].id : `reel_history_${Date.now()}`,
    originalReelId: reel.id,
    account: reel.account,
    content: reel.content,
    video: reel.video,
    scheduledAt: reel.scheduledTime,
    postedAt: reel.status === 'Posted' ? reel.updatedAt : undefined,
    status: reel.status === 'Posted' ? 'Posted' : 'Scheduled',
    postedUrl: reel.postedUrl,
    createdAt: existingIndex >= 0 ? history[existingIndex].createdAt : new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    history[existingIndex] = historyRecord;
  } else {
    history.push(historyRecord);
  }
  
  localStorage.setItem(HISTORY_KEYS.REELS, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent('storage-change'));
  
  return historyRecord;
};

/**
 * Xóa Reel History theo ID
 */
export const deleteReelHistory = (historyId: string): void => {
  const history = getReelsHistory();
  const filtered = history.filter(h => h.id !== historyId);
  localStorage.setItem(HISTORY_KEYS.REELS, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('storage-change'));
};

/**
 * Cập nhật Reel History khi reel được đăng thành công
 */
export const updateReelHistoryAsPosted = (reelId: number, postedUrl: string, postedAt?: string): void => {
  try {
    const history = getReelsHistory();
    const index = history.findIndex(h => h.originalReelId === reelId);
    
    if (index >= 0) {
      history[index].status = 'Posted';
      history[index].postedUrl = postedUrl;
      history[index].postedAt = postedAt || new Date().toISOString();
    } else {
      const reels = JSON.parse(localStorage.getItem('instagram-reels') || '[]');
      const originalReel = reels.find((r: any) => r.id === reelId);
      
      if (originalReel) {
        history.push({
          id: `reel_history_${Date.now()}`,
          originalReelId: reelId,
          account: originalReel.account,
          content: originalReel.content,
          video: originalReel.video,
          scheduledAt: originalReel.scheduledTime,
          postedAt: postedAt || new Date().toISOString(),
          status: 'Posted',
          postedUrl: postedUrl,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    localStorage.setItem(HISTORY_KEYS.REELS, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('storage-change'));
    console.log('✅ Updated reel history:', reelId, 'Posted');
  } catch (error) {
    console.error('Error updating reel history:', error);
  }
};
// =====================================================
// CARE HISTORY FUNCTIONS
// =====================================================

/**
 * Lấy toàn bộ Care History từ localStorage
 */
export const getCareHistory = (): CareHistory[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEYS.CARE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading care history:', error);
    return [];
  }
};

/**
 * Lưu Care Activity vào History khi Schedule hoặc Run Now
 */
export const saveCareToHistory = (
  settings: CareSettings,
  accounts: string[],
  scheduleId?: string,
  scheduledAt?: string,
  executedAt?: string
): CareHistory => {
  const history = getCareHistory();
  
  // Nếu có executedAt → status = Completed (Run Now)
  // Nếu không → status = Scheduled
  const status = executedAt ? 'Completed' : 'Scheduled';
  
  const historyRecord: CareHistory = {
    id: `care_history_${Date.now()}`,
    originalScheduleId: scheduleId,
    settings,
    accounts,
    scheduledAt,
    executedAt: executedAt,
    status: status,
    createdAt: new Date().toISOString(),
  };
  
  history.push(historyRecord);
  localStorage.setItem(HISTORY_KEYS.CARE, JSON.stringify(history));
  window.dispatchEvent(new CustomEvent('storage-change'));
  
  return historyRecord;
};

/**
 * Cập nhật Care History khi activity hoàn thành
 */
export const updateCareHistoryAsCompleted = (
  historyId: string,
  result: {
    totalActions: number;
    successCount: number;
    failedCount: number;
    details?: string;
  }
): void => {
  const history = getCareHistory();
  const index = history.findIndex(h => h.id === historyId);
  
  if (index >= 0) {
    history[index].status = 'Completed';
    history[index].executedAt = new Date().toISOString();
    history[index].result = result;
    localStorage.setItem(HISTORY_KEYS.CARE, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('storage-change'));
  }
};

/**
 * Đánh dấu Care History là Failed
 */
export const updateCareHistoryAsFailed = (historyId: string, errorDetails?: string): void => {
  const history = getCareHistory();
  const index = history.findIndex(h => h.id === historyId);
  
  if (index >= 0) {
    history[index].status = 'Missed';
    history[index].executedAt = new Date().toISOString();
    history[index].result = {
      totalActions: 0,
      successCount: 0,
      failedCount: 1,
      details: errorDetails,
    };
    localStorage.setItem(HISTORY_KEYS.CARE, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('storage-change'));
  }
};

/**
 * Xóa Care History theo ID
 */
export const deleteCareHistory = (historyId: string): void => {
  const history = getCareHistory();
  const filtered = history.filter(h => h.id !== historyId);
  localStorage.setItem(HISTORY_KEYS.CARE, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('storage-change'));
};
/**
 * ✅ Lấy Care Schedules từ localStorage (không phải history)
 * Dùng cho Calendar để hiển thị status thực
 */
export const getCareSchedules = (): any[] => {
  try {
    const data = localStorage.getItem('care-activity-schedules');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading care schedules:', error);
    return [];
  }
};
// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * ✅ Lấy activities cho 1 ngày (FIXED - không expand time slots)
 */
export const getActivitiesForDate = (date: Date, accountFilter?: string) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  const isDateMatch = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
  };
  
  // Lấy Posts
  const postsHistory = getPostsHistory()
    .filter(p => accountFilter ? p.account === accountFilter : true)
    .filter(p => isDateMatch(p.scheduledAt) || isDateMatch(p.postedAt));
  
  // Lấy Reels
  const reelsHistory = getReelsHistory()
    .filter(r => accountFilter ? r.account === accountFilter : true)
    .filter(r => isDateMatch(r.scheduledAt) || isDateMatch(r.postedAt));
  
  // ✅ LẤY CARE SCHEDULES - KHÔNG EXPAND TIME SLOTS
  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  // Lấy all accounts để convert ID -> username
  const allAccountsRaw = localStorage.getItem('instagram-accounts');
  const allAccounts = allAccountsRaw ? JSON.parse(allAccountsRaw) : [];
  
  const careActivities: CareHistory[] = [];
  
  // 1. Load from schedules - ✅ MỖI SCHEDULE CHỈ TẠO 1 ACTIVITY
  getCareSchedules()
    .filter(s => s.schedule.date === dateString)
    .forEach(schedule => {
      // Convert account IDs to usernames
      const accountIds = [
        ...(schedule.settings.autoBrowseAccounts || []),
        ...(schedule.settings.autoFollowAccounts || [])
      ];
      
      const accountNames = accountIds
        .map((id: number) => allAccounts.find((a: any) => a.id === id)?.username)
        .filter((name: string | undefined) => name !== undefined);
      
      // ✅ TẠO DUY NHẤT 1 ACTIVITY CHO SCHEDULE (không loop times)
      // Lấy time đầu tiên làm đại diện
      const firstTime = schedule.schedule.times[0] || '00:00';
      
      careActivities.push({
        id: schedule.id,  // ✅ Dùng schedule.id gốc (không thêm suffix)
        scheduleId: schedule.id,
        originalScheduleId: schedule.id,
        accounts: accountNames,
        settings: schedule.settings,
        scheduledAt: `${schedule.schedule.date}T${firstTime}:00`,
        executedAt: schedule.completedAt,
        status: schedule.status || 'Scheduled',
        schedule: schedule.schedule,
        createdAt: schedule.createdAt || new Date().toISOString(),
      } as CareHistory);
    });
  
  // 2. Load from history (Run Now)
  const careHistory = getCareHistory()
    .filter(h => isDateMatch(h.scheduledAt) || isDateMatch(h.executedAt));
  
  // Merge both sources
  careActivities.push(...careHistory);
  
  // Filter by account nếu có
  const filteredCareActivities = careActivities.filter(s => 
    accountFilter ? s.accounts.includes(accountFilter) : true
  );
  
  return {
    posts: postsHistory,
    reels: reelsHistory,
    care: filteredCareActivities,
  };
};

/**
 * Xóa Care Schedule theo ID
 * ✅ FIXED: Không cần extract suffix vì không còn suffix nữa
 */
export const deleteCareSchedule = (scheduleId: string): void => {
  console.log('🔍 deleteCareSchedule called with ID:', scheduleId);
  
  const schedules = getCareSchedules();
  console.log('📋 Current schedules:', schedules.length);
  
  // ✅ Direct comparison - không cần extract suffix
  const filtered = schedules.filter(s => {
    console.log(`  Comparing: "${s.id}" !== "${scheduleId}" = ${s.id !== scheduleId}`);
    return s.id !== scheduleId;
  });
  
  console.log('✂️ Filtered schedules:', filtered.length);
  
  localStorage.setItem('care-activity-schedules', JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('storage-change'));
  
  console.log('✅ Schedule deleted and event dispatched');
};

/**
 * ✅ Đồng bộ status Missed từ localStorage vào history
 * Gọi trong useScheduleCalendar để update status realtime
 */
export const syncMissedStatusToHistory = (): void => {
  try {
    // Sync Posts
    const postsRaw = localStorage.getItem('instagram-posts');
    if (postsRaw) {
      const posts = JSON.parse(postsRaw);
      const history = getPostsHistory();
      let hasChanges = false;
      
      posts.forEach((post: any) => {
        if (post.status === 'Missed') {
          const idx = history.findIndex(h => h.originalPostId === post.id);
          if (idx >= 0 && history[idx].status !== 'Missed') {
            history[idx].status = 'Missed';
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        localStorage.setItem(HISTORY_KEYS.POSTS, JSON.stringify(history));
      }
    }
    
    // Sync Reels
    const reelsRaw = localStorage.getItem('instagram-reels');
    if (reelsRaw) {
      const reels = JSON.parse(reelsRaw);
      const history = getReelsHistory();
      let hasChanges = false;
      
      reels.forEach((reel: any) => {
        if (reel.status === 'Missed') {
          const idx = history.findIndex(h => h.originalReelId === reel.id);
          if (idx >= 0 && history[idx].status !== 'Missed') {
            history[idx].status = 'Missed';
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        localStorage.setItem(HISTORY_KEYS.REELS, JSON.stringify(history));
      }
    }
  } catch (error) {
    console.error('Error syncing Missed status:', error);
  }
};

/**
 * ✅ Xóa toàn bộ lịch sử Calendar (Posts, Reels, Care Schedules)
 */
export const clearAllCalendarHistory = (): void => {
  // Xóa Posts
  localStorage.removeItem('instagram-posts');
  localStorage.removeItem(HISTORY_KEYS.POSTS);
  
  // Xóa Reels
  localStorage.removeItem('instagram-reels');
  localStorage.removeItem(HISTORY_KEYS.REELS);
  
  // Xóa Care Schedules & History
  localStorage.removeItem('care-activity-schedules');
  localStorage.removeItem(HISTORY_KEYS.CARE);
  
  // Trigger storage change event
  window.dispatchEvent(new CustomEvent('storage-change'));
};