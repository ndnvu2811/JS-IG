export enum View {
  Dashboard = 'Dashboard',
  Calendar = 'Calendar',
  Content = 'Content',
  Reels = 'Reels',
  Care = 'Care',
  Scraper = 'Scraper',
  Accounts = 'Accounts',
  Proxy = 'Proxy',
  MediaLibrary = 'MediaLibrary',
  Settings = 'Settings',
  ImageEditor = 'ImageEditor',
  EditReel = 'EditReel',
}

// ===== CONTENT MANAGEMENT TYPES =====

export enum PostStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Posting = 'Posting',
  Posted = 'Posted',
  Failed = 'Failed',
  Missed = 'Missed', 
}

export type PostType = 'Post' | 'Reel';

export interface Post {
  id: number;                      // ID duy nhất
  content: string;                 // Caption (nội dung)
  media: { type: 'image' | 'video'; url: string }[];                 // Mảng link ảnh/video
  status: PostStatus;              // Trạng thái
  rowNumber?: number;                 // Số thứ tự (dùng cho Scraper)
  account: string;                 // Username tài khoản
  type: PostType;                  // Loại bài (Post/Reel)
  scheduledTime?: string;          // Thời gian đăng (ISO string)
  postedUrl?: string;              // Link bài viết sau khi đăng
  createdAt: string;               // Thời gian tạo
  updatedAt: string;               // Thời gian cập nhật cuối
  shareToThreads?: boolean;        // ✅ Tự động share lên Threads
  batchName?: string;              // ✅ Tên batch (folder) trong Media Library
}

export type FilterType = 'All' | 'Draft' | 'Scheduled' | 'Posting' | 'Posted' | 'Failed' | 'Missed';

// ===== REELS MANAGEMENT TYPES =====

export enum ReelStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Posting = 'Posting',
  Posted = 'Posted',
  Failed = 'Failed',
  Missed = 'Missed', 
} 
export interface Reel {
  id: number;                      // ID duy nhất
  content: string;                 // Caption (nội dung)
  video: { url: string };          // Video duy nhất (không phải mảng)
  status: ReelStatus;              // Trạng thái
  rowNumber?: number;                 // Số thứ tự (dùng cho Scraper)
  account: string;                 // Username tài khoản
  scheduledTime?: string;          // Thời gian đăng (ISO string)
  postedUrl?: string;             // Link bài viết sau khi đăng
  aspectRatio?: string;           // Tùy chọn video (16:9, 4:5, 1:1, 9:16)
  createdAt: string;               // Thời gian tạo
  updatedAt: string;               // Thời gian cập nhật cuối
  shareToThreads?: boolean;        // ✅ Tự động share lên Threads
  batchName?: string;              // ✅ Tên batch (folder) trong Media Library
  processingStatus?: 'ready' | 'processing' | 'adjusted' | 'failed';  // ✅ Trạng thái xử lý video
  processingProgress?: number;     // ✅ Tiến độ xử lý video (0-100%)
}

export type ReelFilterType = 'All' | 'Draft' | 'Scheduled' | 'Posting' | 'Posted' | 'Failed' | 'Missed';

// ===== CALENDAR HISTORY TYPES =====

/**
 * Lưu lịch sử Posts đã đăng (từ trang Content)
 * Lưu vào localStorage key: 'posts-history'
 * Mục đích: Giữ lịch sử kể cả khi xóa Post gốc
 */
export interface PostHistory {
  id: string;                      // Unique ID: "post_history_1701234567890"
  originalPostId: number;          // ID của Post gốc (để trace back)
  account: string;                 // Username tài khoản
  content: string;                 // Caption
  media: { type: 'image' | 'video'; url: string }[];  // Media đã đăng
  
  // Thời gian
  scheduledAt?: string;            // Giờ dự kiến đăng (ISO string)
  postedAt?: string;               // Giờ thực tế đã đăng (ISO string)
  
  // Trạng thái (chỉ lưu 2 trạng thái)
  status: 'Scheduled' | 'Posted' | 'Missed';
  
  // Link Instagram (chỉ có khi Posted)
  postedUrl?: string;
  
  // Metadata
  createdAt: string;               // Thời gian tạo history record
}

/**
 * Lưu lịch sử Reels đã đăng (từ trang Reel)
 * Lưu vào localStorage key: 'reels-history'
 * Mục đích: Giữ lịch sử kể cả khi xóa Reel gốc
 */
export interface ReelHistory {
  id: string;                      // Unique ID: "reel_history_1701234567890"
  originalReelId: number;          // ID của Reel gốc
  account: string;                 // Username tài khoản
  content: string;                 // Caption
  video: { url: string };          // Video đã đăng
  
  // Thời gian
  scheduledAt?: string;            // Giờ dự kiến đăng (ISO string)
  postedAt?: string;               // Giờ thực tế đã đăng (ISO string)
  
  // Trạng thái
  status: 'Scheduled' | 'Posted' | 'Missed';
  
  // Link Instagram
  postedUrl?: string;
  
  // Metadata
  createdAt: string;
}

/**
 * ✅ Care Schedule structure (for time slots)
 */
export interface CareSchedule {
  date: string;           // YYYY-MM-DD
  times: string[];        // ["10:00", "14:00", "18:00"]
  repeat: boolean;        // Lặp lại hay không
}

/**
 * Lưu lịch sử Care Activities đã chạy
 * Lưu vào localStorage key: 'care-history'
 * Mục đích: Theo dõi các hoạt động chăm sóc đã thực hiện
 */
export interface CareHistory {
  id: string;                      // Unique ID: "care_history_1701234567890"
  originalScheduleId?: string;     // ID của CareActivitySchedule gốc (nếu có)
  scheduleId?: string;
  // Cấu hình đã chạy
  settings: CareSettings;          
  accounts: string[];              // Danh sách username đã tham gia
  
  // Thời gian
  scheduledAt?: string;            // Giờ dự kiến chạy (ISO string)
  executedAt?: string;             // Giờ thực tế đã chạy (ISO string)
  
  // Trạng thái
  status: 'Scheduled' | 'Completed' | 'Missed';
  schedule?: CareSchedule;
  // Kết quả (nếu đã chạy)
  result?: {
    totalActions: number;          // Tổng số hành động
    successCount: number;          // Số thành công
    failedCount: number;           // Số thất bại
    details?: string;              // Chi tiết (nếu có)
  };
  
  // Metadata
  createdAt: string;
}

// ===== ACCOUNT MANAGEMENT TYPES =====
export enum AccountStatus {
    Connected = 'Connected',
    Failed = 'Failed',
}

export interface InstagramAccount {
    id: number;
    username: string;
    avatarUrl: string;
    category: string;
    followers: string;
    following: string;
    posts: string;
    status: AccountStatus;
    proxyId?: string;
    cookiesPath?: string;      
    sessionId?: string;
    cookies?: any[];        
}

export interface CareSettings {
    // Run Mode
    autoBrowseRunMode: 'sequential' | 'parallel';
    
    // Auto-Browse Settings
    autoBrowseEnabled: boolean;
    autoBrowseAccounts: number[];  // ✅ CHANGED TO number[]
    autoBrowseDuration: number;
    autoBrowseScrollInterval: number;
    autoBrowseEnableLike: boolean;
    autoBrowseLikeCount: number;
    
    // Auto-Follow Settings (ADD ALL THESE)
    autoFollowEnabled: boolean;
    autoFollowAccounts: number[];  // ✅ CHANGED TO number[]
    autoFollowTargetUsername: string;  // ✅ NEW! (was autoFollowTargetAccount)
    autoFollowSource: 'followers' | 'following';
    autoFollowCount: number;
    autoFollowEnableLike: boolean;
    autoFollowEnableComment: boolean;
    autoFollowComments: string[];
}

export interface CareActivitySchedule {
  id: string;
  settings: CareSettings;
  schedule: {
    date: string;
    times: string[];
    repeat: boolean;
  };
  status?: 'scheduled' | 'completed' | 'missed';
  completedAt?: string;
}

export interface LoginSuccessData {
    accountId: string;
    username: string;
    avatar: string;
    followers: number;
    following: number;
    posts: number;
    cookiesPath: string;
    sessionId: string;
}

// ===== PROXY TYPES =====
export type ProxyType = 'http' | 'https' | 'socks5';
export type ProxyStatus = 'Active' | 'Inactive' | 'Testing' | 'Failed';

export interface Proxy {
    id: string;
    name?: string;
    host: string;
    port: number;
    type: ProxyType;
    username?: string;
    password?: string;
    status: ProxyStatus;
    responseTime?: number;
    lastTested?: Date;
    createdAt: Date;
}

export interface AppSettings {
  chromePath: string | null;
  autoDetectChrome: boolean;
}

// ===== ELECTRON API TYPES =====
export interface ElectronAPI {
    // Chrome settings
    getChromePath: () => Promise<string | null>;
    getChromeSettings: () => Promise<{ 
      chromePath: string; 
      autoDetectChrome: boolean;
      windowWidth?: number;
      windowHeight?: number;
    } | null>;
    browseChromePath: () => Promise<string | null>;
    saveChromePath: (chromePath: string, autoDetect: boolean) => Promise<{ success: boolean; error?: string }>;
    saveChromeSettings: (settings: { 
      chromePath: string; 
      autoDetectChrome: boolean;
      windowWidth: number;
      windowHeight: number;
    }) => Promise<{ success: boolean; error?: string }>;
    testChromePath: (chromePath: string) => Promise<{ success: boolean; error?: string }>;
    // Đăng nhập Instagram
    loginInstagram: (username: string, password: string, proxyUrl?: string) => void;
    
    // Lắng nghe các sự kiện
    onLoginStatus: (callback: (data: { status: string; message: string }) => void) => void;
    onLoginSuccess: (callback: (data: LoginSuccessData) => void) => void;
    onLoginError: (callback: (data: { error: string }) => void) => void;
    
    // Xóa tài khoản
    deleteAccount: (accountId: string, cookiesPath: string, username?: string) => void;
    onDeleteSuccess: (callback: (data: { accountId: string }) => void) => void;
    onDeleteError: (callback: (data: { error: string }) => void) => void;
    
    // Refresh account
    refreshAccount: (accountId: number, username: string, cookiesPath: string) => void;
    onRefreshSuccess: (callback: (data: { accountId: number; avatar: string; followers: number; following: number; posts: number }) => void) => void;
    onRefreshError: (callback: (data: { accountId: number; error: string }) => void) => void;
    
    // Cleanup
    removeAllListeners: () => void;

    // Browser management
    openBrowser: (accountId: number, username: string, cookies: any[]) => void;
    onBrowserOpened: (callback: (data: { accountId: number }) => void) => void;
    onBrowserOpenError: (callback: (data: { accountId: number; error: string }) => void) => void;
    
    closeBrowser: (accountId: number) => void;
    onBrowserClosed: (callback: (data: { accountId: number }) => void) => void;
    onBrowserCloseError: (callback: (data: { accountId: number; error: string }) => void) => void;
    
    checkBrowserStatus: (accountId: number) => void;
    onBrowserStatus: (callback: (data: { accountId: number; isOpen: boolean }) => void) => void;
    
    loadCookies: (cookiesPath: string) => Promise<{ success: boolean; cookies?: any[]; error?: string }>;

    // Test Proxy
    testProxy: (proxyData: { url: string; proxy: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
    
    // Reel posting
    postReelToInstagram: (data: any) => void;
    onPostReelSuccess: (callback: (data: { reelId: number; reelUrl: string }) => void) => void;
    onPostReelError: (callback: (data: { reelId: number; error: string }) => void) => void;
    syncReels: (reels: Reel[]) => Promise<{ success: boolean; error?: string }>;
    
    // Reel scheduler
    syncScheduledReels: (reels: any[]) => Promise<{ success: boolean; error?: string }>;
    onReelMissed: (callback: (data: { reelId: number; missedAt: string }) => void) => void;
    
    // Reel scheduler events
    onReelPublishingStart: (callback: (data: { reelId: number }) => void) => void;
    onReelPublishingSuccess: (callback: (data: { reelId: number; publishedAt: string; reelUrl: string }) => void) => void;
    onReelPublishingError: (callback: (data: { reelId: number; error: string }) => void) => void;

    // Care Activities - Auto-Browse
    startAutoBrowse: (accounts: InstagramAccount[], settings: CareSettings) => Promise<{ success: boolean; error?: string; results?: any[] }>;
    onAutoBrowseProgress: (callback: (data: any) => void) => () => void;

    // Care Activities - Auto-Follow
    startAutoFollow: (accounts: InstagramAccount[], settings: CareSettings) => Promise<{ success: boolean; error?: string; results?: any[] }>;
    onAutoFollowProgress: (callback: (data: any) => void) => () => void;

    // Post management
    postNow: (postData: any) => Promise<any>;
    syncPosts: (posts: Post[]) => Promise<{ success: boolean; error?: string }>;

    // Scheduler management ✅ THÊM MỚI
    startScheduler: () => Promise<{ success: boolean; message: string }>;
    stopScheduler: () => Promise<{ success: boolean; message: string }>;
    getSchedulerStatus: () => Promise<{ isRunning: boolean; checkInterval: number }>;

    // Event listeners ✅ THÊM MỚI
    onPostStatusUpdate: (callback: (data: { postId: number; status: PostStatus }) => void) => void;
    onPostPublishingSuccess: (callback: (data: { postId: number; publishedAt: string; postUrl: string }) => void) => void;
    onPostPublishingError: (callback: (data: { postId: number; error: string }) => void) => void;
    onPostMissed: (callback: (data: { postId: number; missedAt: string }) => void) => () => void;
    
    // Post Now events (different from scheduler)
    onPostSuccess: (callback: (data: { postId: number; postUrl: string }) => void) => () => void;
    onPostError: (callback: (data: { postId: number; error: string }) => void) => () => void;

    // Reel Scheduler events - Add status update
    onReelStatusUpdate: (callback: (data: { reelId: number; status: string }) => void) => void;

    // Scheduler Care Activities
    onCareScheduleCheck: (callback: (data: { currentDate: string; currentTime: string }) => void) => () => void;
    runCareSchedule: (schedule: any, accounts: any[], date: string, time: string) => void;
    onCareScheduleCompleted?: (callback: (data: { scheduleId: string; success: boolean }) => void) => void;
    
    // License & Machine ID
    getMachineId: () => Promise<string | null>;

    //Lưu media files
    saveMediaFile: (data: { fileData: string; fileName: string; fileType: string }) => Promise<{ success: boolean; path?: string; fileName?: string; error?: string }>;
    deleteMediaFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    readMediaFile: (filePath: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
    clearAllMedia: () => Promise<{ success: boolean; deletedCount?: number; error?: string }>;
    
    // ✅ Stop All Activities
    stopAllActivities: () => Promise<{ success: boolean; message?: string; closedCount?: number; error?: string }>;

    // Apify Scraper
    apifyStartRun: (data: { apiToken: string; input: any }) => Promise<{ success: boolean; runId?: string; datasetId?: string; error?: string }>;
    apifyCheckStatus: (data: { apiToken: string; runId: string }) => Promise<{ success: boolean; status?: string; error?: string }>;
    apifyFetchDataset: (data: { apiToken: string; datasetId: string; offset?: number; limit?: number }) => Promise<{ success: boolean; items?: any[]; error?: string }>;
    apifyDownloadMedia: (data: { url: string; savePath: string }) => Promise<{ success: boolean; path?: string; error?: string }>;

    downloadMedia: (data: { url: string; savePath: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
    getMediaPath: () => Promise<string>;
    copyFileToDownloads: (data: { sourcePath: string; fileName: string; folderName?: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
    
    // Instagram Direct Download (without Apify)
    instagramDownloadPost: (data: { postUrl: string }) => Promise<{ success: boolean; media?: Array<{ type: string; url: string }>; error?: string }>;
    
    // Background Download
    startBackgroundDownload: (params: { taskId: string; urls: string[]; contentType: 'post' | 'reel'; startingNumber: number; cookiesPath?: string; apiToken: string; mediaPath: string }) => Promise<{ success: boolean; taskId?: string; error?: string }>;
    getBackgroundTaskStatus: (taskId: string) => Promise<any>;
    cancelBackgroundTask: (taskId: string) => Promise<{ success: boolean }>;
    onBackgroundTaskProgress: (callback: (data: any) => void) => () => void;

    // Canvas Frames Rendering
    saveFramesToDisk: (data: { frames: any[]; totalFrames: number }) => Promise<{ success: boolean; framesDir?: string; error?: string }>;
    encodeFramesToVideo: (data: { framesDir: string; audioPath: string | null; outputPath: string; fps: number }) => Promise<{ success: boolean; outputPath?: string; error?: string }>;

    // Full Pipeline Rendering
    renderReelVideo: (options: { videoUrl: string; session: ReelSession; outputPath: string }) => Promise<{ success: boolean; videoPath?: string; error?: string }>;
    
    // Progress Listener
    onRenderProgress: (callback: (data: { stage: string; percent?: number }) => void) => () => void;
}

// ===== GLOBAL WINDOW TYPE =====
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
// ===== SCRAPER TYPES =====
export interface ScraperResult {
    id: string;
    stt: number;
    url: string;
    status: 'Run' | 'Done' | 'Draft';
    imageUrl: string;
    caption: string;
    captionNew: string;
    media: { type: string; url: string }[];
    timestamp: string;
}
// ===== MEDIA LIBRARY TYPES =====
export interface MediaLibraryItem {
    id: string;
    name: string;
    type: 'image' | 'video';
    url: string;
    size: number;
    createdAt: string;
    // Optional fields cho Scraper integration
    sourceUrl?: string;      // URL Instagram gốc
    scrapedFrom?: string;    // Username được scrape
    postId?: string;         // ID bài post gốc
}
export interface MediaLibraryItem {
    id: string;
    name: string;
    type: 'image' | 'video';
    url: string;
    size: number;
    createdAt: string;
    batchName?: string;
}

// Image Editor Types
export interface FilterState {
    brightness: number;
    contrast: number;
    saturate: number;
    sepia: number;
    grayscale: number;
    hueRotate: number;
    blur: number;
}

export type AspectRatio = 'free' | '1:1' | '4:5' | '16:9';

export interface CropBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ImageSession {
    url: string;
    name: string; 
    filters: FilterState;
    aspectRatio: AspectRatio;
    rotation: number;
    isFlippedH: boolean;
    isFlippedV: boolean;
    cropBox: CropBox;
    zoom: number;
}
// Reel Editor Types
export interface TextOverlay {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
}

export interface LogoOverlay {
    id: string;
    url: string;
    x: number;
    y: number;
    size: number;
    opacity: number;
}

export interface ReelSession {
    videoUrl: string | null;
    videoScale: number;
    videoX: number;
    videoY: number;
    musicUrl: string | null;
    originalVolume: number;
    musicVolume: number;
    texts: TextOverlay[];
    logos: LogoOverlay[];
    logoUrl?: string | null;
    logoSettings?: any;
}
export {};