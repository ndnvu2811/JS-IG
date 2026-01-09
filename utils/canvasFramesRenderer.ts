/**
 * HYBRID CANVAS RENDERER - FAST VERSION
 * 
 * ⚡ FAST: Render 86s video in ~10-30 seconds
 * 
 * Strategy:
 * 1. Create 1 PNG overlay (text + logos) - instant
 * 2. Send to backend FFmpeg to overlay on video - fast
 * 
 * ✅ No audio during rendering
 * ✅ Works in background
 * ✅ No duplicate renders
 * ✅ Smooth text rendering (2x supersampling)
 */

import { ReelSession } from '../types';

interface HybridRenderResult {
  success: boolean;
  videoPath?: string;
  error?: string;
}

let activeRenderSession: string | null = null;
let renderCancelled = false;

export function cancelActiveRender(): void {
  renderCancelled = true;
  activeRenderSession = null;
  window.dispatchEvent(new CustomEvent('reel-render-end'));
}

export function resetRenderState(): void {
  renderCancelled = false;
  activeRenderSession = null;
}

export function isRenderActive(): boolean {
  return activeRenderSession !== null;
}

function normalizeVideoUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('media-file://')) {
    return url;
  }
  if (url.includes('\\') || /^[A-Z]:/.test(url)) {
    return 'media-file://' + url.replace(/\\/g, '/');
  }
  if (url.startsWith('/')) {
    return 'media-file://' + url;
  }
  return url;
}

/**
 * Save video to temp file if it's a data URL
 */
async function saveVideoToTemp(videoUrl: string): Promise<string> {
  // If already a file path, just clean it
  if (!videoUrl.startsWith('data:') && !videoUrl.startsWith('blob:')) {
    let cleanPath = videoUrl;
    if (videoUrl.startsWith('media-file://')) {
      cleanPath = videoUrl.replace('media-file:///', '').replace('media-file://', '');
    }
    return cleanPath;
  }

  // Need to save data URL to temp file
  const api = (window as any).electronAPI || (window as any).electron;
  
  if (!api || !api.saveTempVideo) {
    throw new Error('electronAPI.saveTempVideo not available');
  }

  const result = await api.saveTempVideo({ videoData: videoUrl });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to save temp video');
  }

  return result.filePath;
}

/**
 * Load image helper
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => reject(new Error('Image load timeout')), 30000);
    img.onload = () => { clearTimeout(timeout); resolve(img); };
    img.onerror = () => { clearTimeout(timeout); reject(new Error('Image load failed')); };
    img.src = src;
  });
}

/**
 * Get preview dimensions from DOM
 */
function getPreviewDimensions(): { width: number; height: number } {
  const videoContainer = document.querySelector('.aspect-\\[9\\/16\\]');
  if (videoContainer) {
    const rect = videoContainer.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }
  return { width: 360, height: 640 };
}

/**
 * ⚡ Create overlay PNG with text and logos ONLY
 * This is very fast - just drawing on canvas once
 * Uses 2x supersampling for smooth text
 */
async function createOverlayPNG(
  session: ReelSession,
  width: number = 1080,
  height: number = 1920
): Promise<string> {
  console.log('🎨 Creating overlay PNG...', width, 'x', height);
  
  const preview = getPreviewDimensions();
  console.log('  Preview dimensions:', preview.width, 'x', preview.height);
  
  // Use 2x supersampling for smoother text
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  
  const ctx = canvas.getContext('2d', { 
    alpha: true,
    willReadFrequently: false
  })!;
  
  // Enable smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Scale context for supersampling
  ctx.scale(scale, scale);
  
  // Clear with transparency (for overlay)
  ctx.clearRect(0, 0, width, height);

  const scaleX = width / preview.width;
  const scaleY = height / preview.height;

  // Pre-load logos
  const logoImages: Map<string, HTMLImageElement> = new Map();
  for (const logo of session.logos || []) {
    try {
      const img = await loadImage(normalizeVideoUrl(logo.url));
      logoImages.set(logo.url, img);
    } catch (e) {
      console.warn('Logo load failed:', logo.url.substring(0, 40));
    }
  }

  // Draw logos
  for (const logo of session.logos || []) {
    const img = logoImages.get(logo.url);
    if (img) {
      const lx = (logo.x / 100) * width;
      const ly = (logo.y / 100) * height;
      const lw = (logo.size / 100) * width;
      const lh = lw * (img.height / img.width);
      
      ctx.globalAlpha = (logo.opacity ?? 100) / 100;
      ctx.drawImage(img, lx, ly, lw, lh);
      ctx.globalAlpha = 1;
    }
  }

  // Draw texts with smooth rendering
  for (const text of session.texts || []) {
    const fontSize = text.fontSize * scaleX;
    
    // Use web-safe fonts
    ctx.font = `900 ${fontSize}px "Segoe UI", "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = text.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const x = (text.x / 100) * width;
    const y = (text.y / 100) * height;
    
    // Layer 1: Soft outer glow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20 * scaleX;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(text.text, x, y);
    
    // Layer 2: Medium shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10 * scaleX;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3 * scaleX;
    ctx.fillText(text.text, x, y);
    
    // Layer 3: Sharp shadow
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4 * scaleX;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 * scaleX;
    ctx.fillText(text.text, x, y);
    
    // Layer 4: Final crisp text (no shadow)
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(text.text, x, y);
  }

  // Downscale with high quality
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext('2d')!;
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'high';
  outputCtx.drawImage(canvas, 0, 0, width, height);

  return outputCanvas.toDataURL('image/png');
}

/**
 * ⚡ HYBRID RENDER - FAST METHOD
 * 
 * 1. Create 1 PNG overlay (instant)
 * 2. Send to backend FFmpeg (fast hardware encoding)
 */
export async function hybridRender(
  videoUrl: string,
  session: ReelSession,
  onProgress?: (progress: number, stage: string) => void
): Promise<HybridRenderResult> {
  if (activeRenderSession) {
    return { success: false, error: 'Render already in progress' };
  }

  const sessionId = `render_${Date.now()}`;
  activeRenderSession = sessionId;
  renderCancelled = false;

  window.dispatchEvent(new CustomEvent('reel-render-start'));

  try {
    onProgress?.(5, 'Creating overlay...');
    
    // Step 1: Create overlay PNG (instant)
    const overlayPNG = await createOverlayPNG(session, 1080, 1920);
    
    if (renderCancelled) {
      activeRenderSession = null;
      return { success: false, error: 'Cancelled' };
    }

    onProgress?.(10, 'Encoding video...');

    const api = (window as any).electronAPI || (window as any).electron;
    
    if (!api || !api.hybridRenderVideo) {
      activeRenderSession = null;
      return { success: false, error: 'electronAPI.hybridRenderVideo not available' };
    }

    // Step 2: Get clean video path
    let cleanVideoUrl: string;
    try {
      cleanVideoUrl = await saveVideoToTemp(videoUrl);
    } catch (err) {
      activeRenderSession = null;
      window.dispatchEvent(new CustomEvent('reel-render-end'));
      return { success: false, error: `Video save error: ${err}` };
    }

    // Step 3: Get audio path if any
    let audioPath: string | null = null;
    const audioSource = (session as any).audioUrl || (session as any).audio?.url || (session as any).audioPath || session.musicUrl;
    if (audioSource) {
      audioPath = audioSource;
      if (audioPath && audioPath.startsWith('media-file://')) {
        audioPath = audioPath.replace('media-file:///', '').replace('media-file://', '');
      }
    }

    // Step 4: Call backend FFmpeg (FAST!)
    const result = await api.hybridRenderVideo({
      videoPath: cleanVideoUrl,
      overlayPNG: overlayPNG,
      audioPath: audioPath,
      videoTransform: {
        scale: session.videoScale || 100,
        x: session.videoX || 0,
        y: session.videoY || 0
      }
    });

    activeRenderSession = null;
    window.dispatchEvent(new CustomEvent('reel-render-end'));

    if (result.success) {
      onProgress?.(100, 'Complete!');
      return { success: true, videoPath: result.videoPath };
    } else {
      return { success: false, error: result.error };
    }

  } catch (error) {
    activeRenderSession = null;
    window.dispatchEvent(new CustomEvent('reel-render-end'));
    return { success: false, error: String(error) };
  }
}

/**
 * Legacy function - redirects to hybridRender
 */
export async function exportCanvasFrames(
  videoUrl: string,
  session: ReelSession,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; totalFrames?: number; framesDir?: string; error?: string }> {
  const result = await hybridRender(videoUrl, session, (p) => onProgress?.(p));
  if (result.success) {
    return { success: true, totalFrames: 1, framesDir: result.videoPath };
  }
  return { success: false, error: result.error };
}

/**
 * Legacy function - not needed with hybrid method
 */
export async function encodeFramesToVideo(
  framesDir: string,
  audioPath: string | undefined | null,
  outputPath: string,
  fps: number = 30,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; videoPath?: string; error?: string }> {
  // With hybrid method, framesDir IS the video path
  return { success: true, videoPath: framesDir };
}