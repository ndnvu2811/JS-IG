import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TextOverlay, LogoOverlay } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ReelWorkspaceProps {
    videoUrl: string | null;
    videoScale: number;
    setVideoScale: (v: number) => void;
    videoX: number;
    videoY: number;
    musicUrl: string | null;
    originalVolume: number;
    musicVolume: number;
    texts: TextOverlay[];
    logos: LogoOverlay[];
    onTextMove: (id: string, x: number, y: number) => void;
    onLogoMove: (id: string, x: number, y: number) => void;
    onImportClick: () => void;
}

const ReelWorkspace: React.FC<ReelWorkspaceProps> = ({
    videoUrl, videoScale, setVideoScale, videoX, videoY,
    musicUrl, originalVolume, musicVolume, texts, logos,
    onTextMove, onLogoMove, onImportClick
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // ✅ NEW: Track if component is being used for rendering (should be muted)
    const [isRenderMode, setIsRenderMode] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    // ✅ NEW: Listen for render events to mute audio
    useEffect(() => {
        const handleRenderStart = () => {
            console.log('🔇 ReelWorkspace: Render started - muting audio');
            setIsRenderMode(true);
            
            // Force mute
            if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.volume = 0;
            }
            if (audioRef.current) {
                audioRef.current.muted = true;
                audioRef.current.volume = 0;
                audioRef.current.pause();
            }
        };
        
        const handleRenderEnd = () => {
            console.log('🔊 ReelWorkspace: Render ended - restoring audio');
            setIsRenderMode(false);
        };

        // Listen for custom events
        window.addEventListener('reel-render-start', handleRenderStart);
        window.addEventListener('reel-render-end', handleRenderEnd);
        
        return () => {
            window.removeEventListener('reel-render-start', handleRenderStart);
            window.removeEventListener('reel-render-end', handleRenderEnd);
        };
    }, []);

    // Đồng bộ âm lượng - ✅ MODIFIED: Check render mode
    useEffect(() => {
        if (videoRef.current && !isRenderMode) {
            videoRef.current.volume = originalVolume / 100;
            videoRef.current.muted = originalVolume === 0;
        }
    }, [originalVolume, isRenderMode]);

    useEffect(() => {
        if (audioRef.current && !isRenderMode) {
            audioRef.current.volume = musicVolume / 100;
            audioRef.current.muted = musicVolume === 0;
        }
    }, [musicVolume, isRenderMode]);

    // ✅ NEW: Force mute when in render mode
    useEffect(() => {
        if (isRenderMode) {
            if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.volume = 0;
            }
            if (audioRef.current) {
                audioRef.current.muted = true;
                audioRef.current.volume = 0;
                audioRef.current.pause();
            }
        }
    }, [isRenderMode]);

    // ✅ CLEANUP on unmount
    useEffect(() => {
        return () => {
            console.log('🧹 ReelWorkspace unmounting - cleanup audio');
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.muted = true;
                videoRef.current.volume = 0;
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.muted = true;
                audioRef.current.volume = 0;
            }
        };
    }, []);

    // Đồng bộ trạng thái phát - ✅ MODIFIED: Check render mode
    const handleSyncPlay = useCallback(() => {
        if (isRenderMode) return; // Don't sync when rendering
        
        if (audioRef.current && videoRef.current) {
            audioRef.current.currentTime = videoRef.current.currentTime;
            audioRef.current.play().catch(() => {
                // Ignore autoplay errors
            });
        }
    }, [isRenderMode]);

    const handleSyncPause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    }, []);

    const handleSyncSeek = useCallback(() => {
        if (isRenderMode) return; // Don't sync when rendering
        
        if (audioRef.current && videoRef.current) {
            audioRef.current.currentTime = videoRef.current.currentTime;
        }
    }, [isRenderMode]);

    const handleDragStart = useCallback((e: React.MouseEvent, id: string, type: 'text' | 'logo') => {
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Get initial position
        const item = type === 'text' 
            ? texts.find(t => t.id === id)
            : logos.find(l => l.id === id);
        
        if (!item) return;
        
        const initialX = item.x;
        const initialY = item.y;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
            const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
            
            if (type === 'text') {
                onTextMove(id, initialX + dx, initialY + dy);
            } else {
                onLogoMove(id, initialX + dx, initialY + dy);
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [texts, logos, onTextMove, onLogoMove]);

    const togglePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    }, []);

    const [isPlaying, setIsPlaying] = useState(false);
    const [showZoom, setShowZoom] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        
        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    return (
        <div className="flex-[2] bg-black dark:bg-black rounded-2xl border border-gray-200 dark:border-black overflow-hidden relative shadow-inner flex items-center justify-center h-full p-8">
            {!videoUrl ? (
                <div 
                    onClick={onImportClick}
                    className="flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl cursor-pointer hover:border-instagram-purple hover:bg-white/5 transition-all group w-full h-full"
                >
                    <div className="w-16 h-16 rounded-2xl bg-instagram-purple/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <MaterialSymbol icon="video_settings" className="text-3xl text-instagram-purple" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upload Reel Video</h3>
                    <p className="text-xs text-gray-500 mt-1 font-medium">9:16 Video required</p>
                </div>
            ) : (
                <div className="flex flex-col w-full h-full gap-4">
                    {/* Video Container - Full size */}
                    <div 
                        ref={containerRef}
                        className="relative flex-1 bg-black rounded-lg overflow-hidden shadow-lg flex items-center justify-center"
                    >
                        <div className="relative aspect-[9/16] h-full w-auto bg-black rounded-lg overflow-hidden shadow-xl">
                            {/* ✅ Video element - no controls */}
                            <video 
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full h-full object-contain"
                                style={{
                                    transform: `translate(${videoX}%, ${videoY}%) scale(${videoScale / 100})`,
                                    transformOrigin: 'center center'
                                }}
                                loop
                                playsInline
                                muted={isRenderMode || originalVolume === 0}
                                onPlay={handleSyncPlay}
                                onPause={handleSyncPause}
                                onSeeking={handleSyncSeek}
                                onLoadedMetadata={(e) => {
                                    console.log('✅ Video loaded:', e.currentTarget.duration);
                                    setVideoDuration(e.currentTarget.duration);
                                }}
                                onTimeUpdate={(e) => {
                                    setCurrentTime(e.currentTarget.currentTime);
                                }}
                                onError={(e) => {
                                    console.error('❌ Video load error:', e);
                                    console.error('Video URL:', videoUrl);
                                }}
                            />

                        {/* ✅ Audio element - hidden and controlled */}
                        {musicUrl && !isRenderMode && (
                            <audio 
                                ref={audioRef}
                                src={musicUrl}
                                className="hidden"
                                loop
                                muted={isRenderMode || musicVolume === 0}
                            />
                        )}
                            {/* Render mode indicator */}
                            {isRenderMode && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                    🔇 Rendering...
                                </div>
                            )}

                            {/* Overlays */}
                            <div className="absolute inset-0 pointer-events-none">
                            {texts.map(t => (
                                <div 
                                    key={t.id}
                                    onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, t.id, 'text'); }}
                                    className="absolute pointer-events-auto cursor-move select-none whitespace-nowrap p-2 transition-transform hover:scale-105 active:scale-95"
                                    style={{ 
                                        left: `${t.x}%`, 
                                        top: `${t.y}%`, 
                                        fontSize: `${t.fontSize}px`, 
                                        color: t.color,
                                        textShadow: '0px 4px 10px rgba(0,0,0,0.8), 0px 0px 4px rgba(0,0,0,0.5)',
                                        fontWeight: '900',
                                        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
                                    }}
                                >
                                    {t.text}
                                </div>
                            ))}

                            {logos.map(logo => (
                                <div 
                                    key={logo.id}
                                    onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, logo.id, 'logo'); }}
                                    className="absolute pointer-events-auto cursor-move select-none p-1 rounded hover:bg-white/10 border border-transparent hover:border-white/20 transition-colors"
                                    style={{ 
                                        left: `${logo.x}%`, 
                                        top: `${logo.y}%`, 
                                        width: `${logo.size}%`,
                                        opacity: logo.opacity / 100
                                    }}
                                >
                                    <img src={logo.url} className="w-full h-auto object-contain" alt="Logo Watermark" />
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>

                    {/* Controls Below Video */}
                    <div className="flex items-center justify-center gap-4">
                        {/* Time display - Left */}
                        <div className="text-gray-300 text-xs font-mono border-2 border-white rounded px-2 py-1">
                            {String(Math.floor(currentTime / 3600)).padStart(2, '0')}:
                            {String(Math.floor((currentTime % 3600) / 60)).padStart(2, '0')}:
                            {String(Math.floor(currentTime % 60)).padStart(2, '0')} / {String(Math.floor(videoDuration / 3600)).padStart(2, '0')}:
                            {String(Math.floor((videoDuration % 3600) / 60)).padStart(2, '0')}:
                            {String(Math.floor(videoDuration % 60)).padStart(2, '0')}
                        </div>

                        {/* Play Button - Center */}
                        <button
                            onClick={togglePlayPause}
                            className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center transition-all hover:border-white/80"
                        >
                            <MaterialSymbol 
                                icon={isPlaying ? "pause" : "play_arrow"} 
                                className="text-sm text-white" 
                            />
                        </button>

                        {/* Zoom Button - Right */}
                        <button
                            onClick={() => setShowZoom(!showZoom)}
                            className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center transition-all hover:border-white/80"
                        >
                            <MaterialSymbol 
                                icon={showZoom ? "zoom_out" : "zoom_in"} 
                                className="text-xs text-white" 
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReelWorkspace;