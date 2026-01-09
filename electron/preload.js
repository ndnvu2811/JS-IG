const { contextBridge, ipcRenderer } = require('electron');

// Expose API an toàn cho React
contextBridge.exposeInMainWorld('electronAPI', {

  // ===== HYBRID RENDER (NEW) =====
  hybridRenderVideo: (params) => ipcRenderer.invoke('hybrid-render-video', params),
  saveTempVideo: (params) => ipcRenderer.invoke('save-temp-video', params),
  // ===== LEGACY RENDER (keep for compatibility) =====
  renderVideoFullPipeline: (params) => ipcRenderer.invoke('render-video-full-pipeline', params),
  saveFramesToDisk: (params) => ipcRenderer.invoke('save-frames-to-disk', params),
  encodeFramesToVideo: (params) => ipcRenderer.invoke('encode-frames-to-video', params),
  
  // ===== MEDIA =====
  readFileAsBlob: (params) => ipcRenderer.invoke('read-file-as-blob', params),
  saveMediaFile: (params) => ipcRenderer.invoke('save-media-file', params),
  createVideoCache: (params) => ipcRenderer.invoke('create-video-cache', params),
  deleteMediaFile: (params) => ipcRenderer.invoke('delete-media-file', params),
  clearAllMedia: () => ipcRenderer.invoke('clear-all-media'),
  
  // ===== REEL SESSION =====
  saveReelSession: (params) => ipcRenderer.invoke('save-reel-session', params),
  loadReelSession: (params) => ipcRenderer.invoke('load-reel-session', params),
  deleteReelSession: (params) => ipcRenderer.invoke('delete-reel-session', params),
  listReelSessions: () => ipcRenderer.invoke('list-reel-sessions'),
  
  // ===== EVENTS =====
  onRenderingProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('rendering-progress', handler);
    return () => ipcRenderer.removeListener('rendering-progress', handler);
  },
  
  // ===== FILE DIALOG =====
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // ===== UTILS =====
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  loadStorageBackup: () => ipcRenderer.invoke('load-storage-backup'),
  saveStorageBackup: (data) => ipcRenderer.invoke('save-storage-backup', data),
  loadMediaLibraryBackup: () => ipcRenderer.invoke('load-media-library-backup'),
  saveMediaLibraryBackup: (data) => ipcRenderer.invoke('save-media-library-backup', data),
  loadAccountsFromCookies: () => ipcRenderer.invoke('load-accounts-from-cookies'),

  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  
  // ✅ Mở link bằng trình duyệt mặc định
  openExternalLink: (url) => {
    ipcRenderer.send('open-external-link', url);
  },

  /**
   * Gửi yêu cầu đăng nhập Instagram
   */
  loginInstagram: (username, password, proxyUrl) => {
    ipcRenderer.send('login-instagram', { username, password, proxyUrl });
  },
  // ✅ THÊM 2 METHODS MỚI - WITH CLEANUP
  onPostMissed: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('post-missed', handler);
    return () => ipcRenderer.removeListener('post-missed', handler);
  },
  onReelMissed: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('reel-missed', handler);
    return () => ipcRenderer.removeListener('reel-missed', handler);
  },
  /**
   * Lắng nghe trạng thái đăng nhập
   */
  onLoginStatus: (callback) => {
    ipcRenderer.on('login-instagram-status', (event, data) => callback(data));
  },
  
  /**
   * Lắng nghe kết quả thành công
   */
  onLoginSuccess: (callback) => {
    ipcRenderer.on('login-instagram-success', (event, data) => callback(data));
  },
  
  /**
   * Lắng nghe lỗi
   */
  onLoginError: (callback) => {
    ipcRenderer.on('login-instagram-error', (event, data) => callback(data));
  },

  /**
   * Post to Instagram
   */
  postToInstagram: (postData) => {
    ipcRenderer.send('post-to-instagram', postData);
  },

  onPostSuccess: (callback) => {
    console.log('[Preload] Setting up post-success listener');
    const handler = (event, data) => {
      console.log('[Preload] Received post-success event:', data);
      callback(data);
    };
    ipcRenderer.on('post-success', handler);
    return () => {
      console.log('[Preload] Removing post-success listener');
      ipcRenderer.removeListener('post-success', handler);
    };
  },

  onPostError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('post-error', handler);
    return () => ipcRenderer.removeListener('post-error', handler);
  },
  // Save media file
  saveMediaFile: (data) => {
    return ipcRenderer.invoke('save-media-file', data);
  },

  // Delete media file
  deleteMediaFile: (filePath) => {
    return ipcRenderer.invoke('delete-media-file', filePath);
  },

  // Read media file as data URL (for video rendering)
  readMediaFile: (filePath) => {
    return ipcRenderer.invoke('read-media-file', filePath);
  },

  // Render video with FFmpeg (hardware accelerated)
  renderVideoFFmpeg: (options) => {
    return ipcRenderer.invoke('render-video-ffmpeg', options);
  },

  // Listen to FFmpeg progress updates
  onFFmpegProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ffmpeg-progress', handler);
    return () => ipcRenderer.removeListener('ffmpeg-progress', handler);
  },

  /**
   * Xóa tài khoản
   */
  deleteAccount: (accountId, cookiesPath, username) => {
    ipcRenderer.send('delete-instagram-account', { accountId, cookiesPath, username });
  },
  
  /**
   * Lắng nghe kết quả xóa tài khoản
   */
  onDeleteSuccess: (callback) => {
    ipcRenderer.on('delete-instagram-account-success', (event, data) => callback(data));
  },
  
  onDeleteError: (callback) => {
    ipcRenderer.on('delete-instagram-account-error', (event, data) => callback(data));
  },
  
  /**
   * Refresh account data
   */
  refreshAccount: (accountId, username, cookiesPath) => {
    ipcRenderer.send('refresh-instagram-account', { accountId, username, cookiesPath });
  },
  
  onRefreshSuccess: (callback) => {
    ipcRenderer.on('refresh-instagram-account-success', (event, data) => callback(data));
  },
  
  onRefreshError: (callback) => {
    ipcRenderer.on('refresh-instagram-account-error', (event, data) => callback(data));
  },

  // ✅ NEW: Get latest post URL (để cập nhật Activity Details)
  getLatestPostUrl: (username, cookiesPath) => {
    return ipcRenderer.invoke('get-latest-post-url', username, cookiesPath);
  },

  // Browser management
  openBrowser: (accountId, username, cookies, mobileMode) => {
    ipcRenderer.send('open-instagram-browser', { accountId, username, cookies, mobileMode });
  },

  onBrowserOpened: (callback) => {
    ipcRenderer.on('open-browser-success', (event, data) => callback(data));
  },

  onBrowserOpenError: (callback) => {
    ipcRenderer.on('open-browser-error', (event, data) => callback(data));
  },

  closeBrowser: (accountId) => {
    ipcRenderer.send('close-instagram-browser', { accountId });
  },

  onBrowserClosed: (callback) => {
    ipcRenderer.on('close-browser-success', (event, data) => callback(data));
  },

  onBrowserCloseError: (callback) => {
    ipcRenderer.on('close-browser-error', (event, data) => callback(data));
  },

  checkBrowserStatus: (accountId) => {
    ipcRenderer.send('check-browser-status', { accountId });
  },

  onBrowserStatus: (callback) => {
    ipcRenderer.on('browser-status-response', (event, data) => callback(data));
  },

  // Care Activities - Auto-Browse
  startAutoBrowse: (accounts, settings) => 
    ipcRenderer.invoke('start-auto-browse', { accounts, settings }),

  onAutoBrowseProgress: (callback) => {
    ipcRenderer.on('auto-browse-progress', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('auto-browse-progress');
    };
  },

  // Care Activities - Auto-Follow
  startAutoFollow: (accounts, settings) => 
  ipcRenderer.invoke('start-auto-follow', { accounts, settings }),
  
  // Care Activities - Auto-Follow Progress
  onAutoFollowProgress: (callback) => {
    ipcRenderer.on('auto-follow-progress', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('auto-follow-progress');
    };
  },
  // Care Activities - Schedules
  onCareScheduleCheck: (callback) => {
  ipcRenderer.on('check-care-schedules', (_event, data) => callback(data));
  return () => ipcRenderer.removeAllListeners('check-care-schedules');
  },

  runCareSchedule: (schedule, accounts, date, time) => 
    ipcRenderer.send('run-care-schedule', { schedule, accounts, date, time }),

  // runCareSchedule
  onCareScheduleCompleted: (callback) => {
    ipcRenderer.on('care-schedule-completed', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('care-schedule-completed');
  },

  // Load cookies từ file
  loadCookies: (cookiesPath) => {
    return ipcRenderer.invoke('load-cookies', cookiesPath);
  },

  /**
   * Xóa listener (cleanup)
   */
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('login-instagram-status');
    ipcRenderer.removeAllListeners('login-instagram-success');
    ipcRenderer.removeAllListeners('login-instagram-error');
    ipcRenderer.removeAllListeners('delete-instagram-account-success');
    ipcRenderer.removeAllListeners('delete-instagram-account-error');
  },

  // Thêm vào phần khai báo API
  testProxy: (proxyData) => ipcRenderer.invoke('test-proxy', proxyData),

  // Reel Scheduler
  syncScheduledReels: (reels) => ipcRenderer.invoke('sync-scheduled-reels', reels),
  getScheduledReels: () => ipcRenderer.invoke('get-scheduled-reels'),

  // Post Reel to Instagram
  postReelToInstagram: (reelData) => {
    ipcRenderer.send('post-reel-to-instagram', reelData);
  },

  onPostReelSuccess: (callback) => {
    console.log('[Preload] Setting up reel-success listener');
    const handler = (event, data) => {
      console.log('[Preload] Received reel-success event:', data);
      callback(data);
    };
    ipcRenderer.on('reel-success', handler);
    return () => {
      console.log('[Preload] Removing reel-success listener');
      ipcRenderer.removeListener('reel-success', handler);
    };
  },

  onPostReelError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('reel-error', handler);
    return () => ipcRenderer.removeListener('reel-error', handler);
  },

  // Scheduler listeners cho Reel
  onReelPublishingStart: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('reel-publishing-start', handler);
    return () => ipcRenderer.removeListener('reel-publishing-start', handler);
  },

  onReelPublishingSuccess: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('reel-publishing-success', handler);
    return () => ipcRenderer.removeListener('reel-publishing-success', handler);
  },

  onReelPublishingError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('reel-publishing-error', handler);
    return () => ipcRenderer.removeListener('reel-publishing-error', handler);
  },

  // ===== SCHEDULER API =====
  
  /**
   * Đồng bộ posts từ React lên Electron
   */
  syncScheduledPosts: (posts) => {
    return ipcRenderer.invoke('sync-scheduled-posts', posts);
  },

  /**
   * Lấy danh sách posts đã lưu
   */
  getScheduledPosts: () => {
    return ipcRenderer.invoke('get-scheduled-posts');
  },

  /**
   * Lắng nghe khi scheduler bắt đầu đăng bài
   */
  onPostPublishingStart: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('post-publishing-start', handler);
    return () => ipcRenderer.removeListener('post-publishing-start', handler);
  },

  /**
   * Lắng nghe khi đăng bài thành công
   */
  onPostPublishingSuccess: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('post-publishing-success', handler);
    return () => ipcRenderer.removeListener('post-publishing-success', handler);
  },

  /**
   * Lắng nghe khi đăng bài thất bại
   */
  onPostPublishingError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('post-publishing-error', handler);
    return () => ipcRenderer.removeListener('post-publishing-error', handler);
  },
  // ===== SCHEDULER CONTROL =====
  startPostScheduler: () => {
    return ipcRenderer.invoke('start-post-scheduler');
  },

  stopPostScheduler: () => {
    return ipcRenderer.invoke('stop-post-scheduler');
  },

  getSchedulerStatus: () => {
    return ipcRenderer.invoke('get-scheduler-status');
  },
  syncPosts: (posts) => ipcRenderer.invoke('sync-posts', posts),
  syncReels: (reels) => ipcRenderer.invoke('sync-reels', reels),
  onPostStatusUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('post-status-update', handler);
    return () => ipcRenderer.removeListener('post-status-update', handler);
  },

  // ===== REEL SCHEDULER CONTROL =====
  startReelScheduler: () => {
    return ipcRenderer.invoke('start-reel-scheduler');
  },

  stopReelScheduler: () => {
    return ipcRenderer.invoke('stop-reel-scheduler');
  },

  getReelSchedulerStatus: () => {
    return ipcRenderer.invoke('get-reel-scheduler-status');
  },

  onReelStatusUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('reel-status-update', handler);
    return () => ipcRenderer.removeListener('reel-status-update', handler);
  },
  // Chrome settings
  getChromePath: () => ipcRenderer.invoke('get-chrome-path'),
  getChromeSettings: () => ipcRenderer.invoke('get-chrome-settings'),
  browseChromePath: () => ipcRenderer.invoke('browse-chrome-path'),
  saveChromePath: (chromePath, autoDetect) => 
    ipcRenderer.invoke('save-chrome-path', chromePath, autoDetect),
  saveChromeSettings: (settings) => 
    ipcRenderer.invoke('save-chrome-settings', settings),
  testChromePath: (chromePath) => ipcRenderer.invoke('test-chrome-path', chromePath),
  
  // ✅ Stop All Activities
  stopAllActivities: () => ipcRenderer.invoke('stop-all-activities'),
  
  // ✅ Window Controls
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),

  // ===== APIFY SCRAPER =====
  apifyStartRun: (data) => ipcRenderer.invoke('apify-start-run', data),
  apifyCheckStatus: (data) => ipcRenderer.invoke('apify-check-status', data),
  apifyFetchDataset: (data) => ipcRenderer.invoke('apify-fetch-dataset', data),
  apifyDownloadMedia: (data) => ipcRenderer.invoke('apify-download-media', data),

  // Instagram Direct Download (without Apify)
  instagramDownloadPost: (data) => ipcRenderer.invoke('instagram-download-post', data),

  // Listen for account requests
  onRequestInstagramAccounts: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('request-instagram-accounts', handler);
    return () => ipcRenderer.removeListener('request-instagram-accounts', handler);
  },

  // Provide accounts to main process
  provideInstagramAccounts: (accounts) => {
    ipcRenderer.send('provide-instagram-accounts', accounts);
  },

  downloadMedia: (data) => ipcRenderer.invoke('download-media', data),
  getMediaPath: () => ipcRenderer.invoke('get-media-path'),
  copyFileToDownloads: (data) => ipcRenderer.invoke('copy-file-to-downloads', data),

  /**
   * Background Download APIs
   */
  startBackgroundDownload: (params) => ipcRenderer.invoke('start-background-download', params),
  getBackgroundTaskStatus: (taskId) => ipcRenderer.invoke('background:getTaskStatus', taskId),
  cancelBackgroundTask: (taskId) => ipcRenderer.invoke('background:cancelTask', taskId),
  
  // Listen to background task progress updates
  onBackgroundTaskProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('background-task-progress', handler);
    return () => ipcRenderer.removeListener('background-task-progress', handler);
  },

  // Download progress listener (for direct Instagram download)
  onDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },

  // Download complete listener (for direct Instagram download)
  onDownloadComplete: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-complete', handler);
    return () => ipcRenderer.removeListener('download-complete', handler);
  },

  // Download error listener (for direct Instagram download)
  onDownloadError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('download-error', handler);
    return () => ipcRenderer.removeListener('download-error', handler);
  },
});

// Alias cho CareActivities (để dùng window.electron thay vì window.electronAPI)
contextBridge.exposeInMainWorld('electron', {
  startAutoBrowse: (accounts, settings) => 
    ipcRenderer.invoke('start-auto-browse', { accounts, settings }),

  openExternalLink: (url) => {
    ipcRenderer.send('open-external-link', url);
  },

  onAutoBrowseProgress: (callback) => {
    ipcRenderer.on('auto-browse-progress', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('auto-browse-progress');
    };
  },
  startAutoFollow: (accounts, settings) => 
  ipcRenderer.invoke('start-auto-follow', { accounts, settings }),

  saveMediaFile: (data) => ipcRenderer.invoke('save-media-file', data),
  deleteMediaFile: (filePath) => ipcRenderer.invoke('delete-media-file', filePath),

  onAutoFollowProgress: (callback) => {
    ipcRenderer.on('auto-follow-progress', (_event, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('auto-follow-progress');
    };
  },
});

console.log('🔗 Preload script đã load xong!');