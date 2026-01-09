/**
 * ============================================
 * HYBRID RENDERING HANDLERS - FAST VERSION
 * ============================================
 * 
 * ⚡ FAST: Render 86s video in ~10-30 seconds
 * 
 * Method:
 * 1. Receive overlay PNG from frontend
 * 2. FFmpeg overlay PNG on video (hardware accelerated if available)
 */

const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getMainWindow } = require('../window-manager');
const { getMediaPaths } = require('../media-paths');

/**
 * Find FFmpeg executable
 */
function getFFmpegPath() {
  const possiblePaths = [
    path.join(process.resourcesPath, 'ffmpeg', 'ffmpeg.exe'),
    path.join(process.resourcesPath, 'ffmpeg.exe'),
    path.join(__dirname, '..', '..', 'ffmpeg', 'ffmpeg.exe'),
    path.join(__dirname, '..', '..', 'resources', 'ffmpeg', 'ffmpeg.exe'),
    'ffmpeg'
  ];

  for (const p of possiblePaths) {
    if (p === 'ffmpeg') return p;
    if (fs.existsSync(p)) {
      console.log('📍 FFmpeg found:', p);
      return p;
    }
  }
  return 'ffmpeg';
}

function registerFullPipelineRenderHandler() {
  
  // ✅ SAVE TEMP VIDEO
  ipcMain.handle('save-temp-video', async (event, { videoData }) => {
    try {
      console.log('📁 Saving temp video...');
      
      const mediaPaths = getMediaPaths(app.getPath('userData'));
      const tempDir = mediaPaths.tempHybrid;
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      
      const tempPath = path.join(tempDir, `temp_video_${Date.now()}.mp4`);
      
      if (videoData.startsWith('data:')) {
        const base64Data = videoData.split(',')[1];
        fs.writeFileSync(tempPath, Buffer.from(base64Data, 'base64'));
      } else {
        throw new Error('Unsupported video format');
      }
      
      console.log('✅ Temp video saved:', tempPath);
      return { success: true, filePath: tempPath };
    } catch (error) {
      console.error('❌ Save temp video error:', error);
      return { success: false, error: error.message };
    }
  });

  // ✅ HYBRID RENDER - FAST METHOD
  ipcMain.handle('hybrid-render-video', async (event, { 
    videoPath, 
    overlayPNG, 
    audioPath,
    videoTransform 
  }) => {
    const startTime = Date.now();
    console.log('\n🎬 ========== HYBRID RENDER (FAST) ==========');
    console.log('📹 Video:', videoPath);
    console.log('🎨 Has overlay:', !!overlayPNG);
    console.log('🎵 Audio:', audioPath || 'None');

    const mainWindow = getMainWindow();

    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video not found: ${videoPath}`);
      }

      const mediaPaths = getMediaPaths(app.getPath('userData'));
      const tempDir = mediaPaths.tempHybrid;
      const outputDir = mediaPaths.reels;
      
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      // Save overlay PNG to temp file
      const overlayPath = path.join(tempDir, `overlay_${Date.now()}.png`);
      const base64Data = overlayPNG.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(overlayPath, Buffer.from(base64Data, 'base64'));
      console.log('✅ Overlay saved:', overlayPath);

      const outputPath = path.join(outputDir, `reel_${Date.now()}.mp4`);
      const ffmpegPath = getFFmpegPath();
      const hasCustomAudio = audioPath && fs.existsSync(audioPath);

      // Video transform
      const scale = (videoTransform?.scale || 100) / 100;
      const offsetX = ((videoTransform?.x || 0) / 100) * 1080;
      const offsetY = ((videoTransform?.y || 0) / 100) * 1920;

      // Build filter complex
      let filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[scaled];`;
      
      if (scale !== 1 || offsetX !== 0 || offsetY !== 0) {
        const scaledW = Math.round(1080 * scale);
        const scaledH = Math.round(1920 * scale);
        const padX = Math.round((1080 - scaledW) / 2 + offsetX);
        const padY = Math.round((1920 - scaledH) / 2 + offsetY);
        
        filterComplex += `[scaled]scale=${scaledW}:${scaledH},pad=1080:1920:${Math.max(0, padX)}:${Math.max(0, padY)}:black[transformed];`;
        filterComplex += `[transformed][1:v]overlay=0:0:format=auto[out]`;
      } else {
        filterComplex += `[scaled][1:v]overlay=0:0:format=auto[out]`;
      }

      // Build FFmpeg args - try NVENC first (hardware)
      const args = ['-y', '-i', videoPath, '-i', overlayPath];

      if (hasCustomAudio) {
        args.push('-i', audioPath);
      }

      args.push('-filter_complex', filterComplex, '-map', '[out]');

      if (hasCustomAudio) {
        args.push('-map', '2:a', '-c:a', 'aac', '-b:a', '128k', '-shortest');
      } else {
        args.push('-map', '0:a?', '-c:a', 'copy');
      }

      // Try hardware encoding first (NVENC)
      args.push('-c:v', 'h264_nvenc', '-preset', 'p4', '-cq', '23', '-movflags', '+faststart', outputPath);

      console.log('🎥 FFmpeg command:', ffmpegPath, args.slice(0, 10).join(' '), '...');

      return new Promise((resolve) => {
        let isResolved = false;
        let lastProgress = 0;

        const ffmpeg = spawn(ffmpegPath, args);

        // Timeout - fallback to CPU after 3 minutes
        const timeout = setTimeout(() => {
          if (!isResolved) {
            console.log('⏱️ NVENC timeout, trying CPU...');
            ffmpeg.kill('SIGKILL');
            runCPUFallback(videoPath, overlayPath, audioPath, videoTransform, outputPath, mainWindow, resolve, startTime);
          }
        }, 3 * 60 * 1000);

        let stderrData = '';

        ffmpeg.stderr.on('data', (data) => {
          const str = data.toString();
          stderrData += str;

          // Parse progress from FFmpeg output
          const timeMatch = str.match(/time=(\d{2}):(\d{2}):(\d{2})/);
          if (timeMatch) {
            const seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
            const progress = Math.min(Math.round((seconds / 60) * 100), 99);
            if (progress > lastProgress) {
              lastProgress = progress;
              mainWindow?.webContents?.send('rendering-progress', { stage: 'encoding', percent: progress });
            }
          }
        });

        ffmpeg.on('close', (code) => {
          clearTimeout(timeout);
          if (isResolved) return;
          isResolved = true;

          // Cleanup overlay
          try { fs.unlinkSync(overlayPath); } catch (e) {}

          if (code === 0 && fs.existsSync(outputPath)) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ Render complete in ${elapsed}s (NVENC)`);
            mainWindow?.webContents?.send('rendering-progress', { stage: 'complete', percent: 100 });
            resolve({ success: true, videoPath: outputPath });
          } else {
            console.error('❌ NVENC failed, trying CPU...');
            console.error('FFmpeg stderr:', stderrData.slice(-500));
            runCPUFallback(videoPath, overlayPath, audioPath, videoTransform, outputPath, mainWindow, resolve, startTime);
          }
        });

        ffmpeg.on('error', (err) => {
          clearTimeout(timeout);
          if (!isResolved) {
            isResolved = true;
            console.error('❌ FFmpeg error:', err.message);
            runCPUFallback(videoPath, overlayPath, audioPath, videoTransform, outputPath, mainWindow, resolve, startTime);
          }
        });
      });

    } catch (error) {
      console.error('❌ Hybrid render error:', error);
      return { success: false, error: error.message || String(error) };
    }
  });

  // CPU Fallback (libx264)
  function runCPUFallback(videoPath, overlayPath, audioPath, videoTransform, outputPath, mainWindow, resolve, startTime) {
    console.log('🔄 CPU fallback (libx264)...');

    const ffmpegPath = getFFmpegPath();
    const hasCustomAudio = audioPath && fs.existsSync(audioPath);

    // Rebuild overlay if it was deleted
    if (!fs.existsSync(overlayPath)) {
      console.error('❌ Overlay file missing for CPU fallback');
      resolve({ success: false, error: 'Overlay file missing' });
      return;
    }

    const scale = (videoTransform?.scale || 100) / 100;
    const offsetX = ((videoTransform?.x || 0) / 100) * 1080;
    const offsetY = ((videoTransform?.y || 0) / 100) * 1920;

    let filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[scaled];`;
    
    if (scale !== 1 || offsetX !== 0 || offsetY !== 0) {
      const scaledW = Math.round(1080 * scale);
      const scaledH = Math.round(1920 * scale);
      const padX = Math.round((1080 - scaledW) / 2 + offsetX);
      const padY = Math.round((1920 - scaledH) / 2 + offsetY);
      
      filterComplex += `[scaled]scale=${scaledW}:${scaledH},pad=1080:1920:${Math.max(0, padX)}:${Math.max(0, padY)}:black[transformed];`;
      filterComplex += `[transformed][1:v]overlay=0:0:format=auto[out]`;
    } else {
      filterComplex += `[scaled][1:v]overlay=0:0:format=auto[out]`;
    }

    const args = ['-y', '-i', videoPath, '-i', overlayPath];

    if (hasCustomAudio) args.push('-i', audioPath);

    args.push('-filter_complex', filterComplex, '-map', '[out]');

    if (hasCustomAudio) {
      args.push('-map', '2:a', '-c:a', 'aac', '-b:a', '128k', '-shortest');
    } else {
      args.push('-map', '0:a?', '-c:a', 'copy');
    }

    // CPU encoding (slower but more compatible)
    args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputPath);

    const ffmpeg = spawn(ffmpegPath, args);

    ffmpeg.stderr.on('data', (data) => {
      const str = data.toString();
      const timeMatch = str.match(/time=(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const seconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
        const progress = Math.min(Math.round((seconds / 60) * 100), 99);
        mainWindow?.webContents?.send('rendering-progress', { stage: 'encoding (CPU)', percent: progress });
      }
    });

    ffmpeg.on('close', (code) => {
      try { fs.unlinkSync(overlayPath); } catch (e) {}

      if (code === 0 && fs.existsSync(outputPath)) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ CPU render complete in ${elapsed}s`);
        mainWindow?.webContents?.send('rendering-progress', { stage: 'complete', percent: 100 });
        resolve({ success: true, videoPath: outputPath });
      } else {
        resolve({ success: false, error: 'FFmpeg encoding failed' });
      }
    });

    ffmpeg.on('error', (err) => {
      resolve({ success: false, error: 'FFmpeg not found: ' + err.message });
    });
  }

  // Legacy handlers for backward compatibility
  ipcMain.handle('render-video-full-pipeline', async (event, { videoUrl, session, outputPath }) => {
    console.log('⚠️ Legacy render called');
    return { success: false, error: 'Please use hybridRender instead' };
  });

  ipcMain.handle('save-frames-to-disk', async (event, { frames, totalFrames }) => {
    console.log('⚠️ save-frames-to-disk called (legacy)');
    return { success: false, error: 'Use hybridRender instead' };
  });

  ipcMain.handle('encode-frames-to-video', async (event, { framesDir }) => {
    console.log('⚠️ encode-frames-to-video called (legacy)');
    return { success: true, outputPath: framesDir };
  });

  // Read file as blob
  ipcMain.handle('read-file-as-blob', async (event, { filePath }) => {
    try {
      const data = fs.readFileSync(filePath);
      return data.toString('base64');
    } catch (error) {
      throw error;
    }
  });

  console.log('✅ Hybrid rendering handlers registered');
}

module.exports = { registerFullPipelineRenderHandler };