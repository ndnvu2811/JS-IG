/**
 * INSTAGRAM TOOL CARE - MAIN ENTRY POINT
 * 
 * Modules:
 * - app-lifecycle.js: Manages app startup, lifecycle, and schedulers
 * - window-manager.js: Creates and manages main window
 * - ipc-handlers.js: Organizes all IPC handlers by feature
 */

// Setup FFmpeg path (required for video processing)
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
console.log('📹 FFmpeg ready:', ffmpegPath);

// Initialize app lifecycle and register all handlers
const { registerLifecycleEvents } = require('./app-lifecycle');
registerLifecycleEvents();

console.log('✅ App initialized');
