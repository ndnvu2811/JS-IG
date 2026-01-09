import React, { useState } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';
import { uploadMediaFile, getMediaUrl, deleteMediaFile, createVideoCache } from '../../utils/mediaUtils';
import { getAllMediaItems, deleteMediaItem, syncMediaToLibrary } from '../../utils/library';

interface VideoInputProps {
    video: { url: string };
    onChange: (video: { url: string }) => void;
    processingStatus?: 'ready' | 'processing' | 'adjusted' | 'failed';
    processingProgress?: number;
}

const VideoInput: React.FC<VideoInputProps> = ({ video, onChange, processingStatus = 'ready', processingProgress = 0 }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation: Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
        alert('Invalid video format. Please upload MP4, MOV, or AVI files.');
        return;
    }

    // Validation: Check file size (max 4GB)
    const maxSize = 4294967296;
    if (file.size > maxSize) {
        alert('Video file is too large. Maximum size is 4GB.');
        return;
    }

    // ✅ THÊM: Validation aspect ratio
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    
    videoElement.onloadedmetadata = async () => {
        window.URL.revokeObjectURL(videoElement.src);
        
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;
        const aspectRatio = width / height;
        
        // Instagram Reels aspect ratios
        const VERTICAL_RATIO = 9 / 16;     // 0.5625 (9:16 - khuyến nghị)
        const SQUARE_RATIO = 1;            // 1.0 (1:1)
        const HORIZONTAL_RATIO = 16 / 9;   // 1.7778 (16:9)
        
        // Check if video is vertical (best for Reels)
        const isVertical = Math.abs(aspectRatio - VERTICAL_RATIO) < 0.1;
        const isSquare = Math.abs(aspectRatio - SQUARE_RATIO) < 0.1;
        const isHorizontal = Math.abs(aspectRatio - HORIZONTAL_RATIO) < 0.1;
        
        if (!isVertical && !isSquare && !isHorizontal) {
            const proceed = window.confirm(
                `⚠️ Video aspect ratio: ${width}x${height} (${aspectRatio.toFixed(2)})\n\n` +
                `Instagram Reels works best with:\n` +
                `• 9:16 (Vertical) - Recommended\n` +
                `• 1:1 (Square)\n` +
                `• 16:9 (Horizontal)\n\n` +
                `Your video may not display properly on Instagram.\n\n` +
                `Do you want to continue anyway?`
                );
                
                if (!proceed) {
                    return;
                }
            } else if (isHorizontal || isSquare) {
                // Warn but allow
                const proceed = window.confirm(
                    `ℹ️ Your video is ${isSquare ? 'Square (1:1)' : 'Horizontal (16:9)'}\n\n` +
                    `For best results on Instagram Reels, use Vertical (9:16) format.\n\n` +
                    `Continue with this video?`
                );
                
                if (!proceed) {
                    return;
                }
            }
            
            // If validation passed, proceed with upload
            setIsUploading(true);
            
            try {
                console.log('📤 Uploading video:', file.name);
                console.log('📐 Video dimensions:', `${width}x${height}`, `(${aspectRatio.toFixed(2)})`);

                const result = await uploadMediaFile(file);

                if (result) {
                    // ✅ Always create fresh cache - even if video was imported before
                    console.log('🎥 Creating new video cache (FRESH)...');
                    const cacheResult = await createVideoCache(result.path);
                    
                    if (cacheResult) {
                        // ✅ NEW: Sync to Media Library
                        console.log('📚 Adding to Media Library...');
                        await syncMediaToLibrary(
                            Date.now(),
                            [{ type: 'video', url: cacheResult.path }],
                            'Reel',
                            `Reel_Upload_${Date.now()}`
                        );
                        
                        onChange({ url: cacheResult.path });
                        console.log('✅ Video uploaded with NEW CACHE:', cacheResult.path);
                    } else {
                        // Fallback to original if cache creation fails
                        onChange({ url: result.path });
                        console.log('⚠️ Using original path (cache creation failed):', result.path);
                    }
                } else {
                    throw new Error('Upload failed');
                }

                setIsUploading(false);
            } catch (error: any) {
                console.error('Upload error:', error);
                alert(`Failed to upload video: ${error.message}`);
                setIsUploading(false);
            }
        };
        
            videoElement.onerror = () => {
                alert('Failed to load video metadata. The file may be corrupted.');
            };
            
            videoElement.src = URL.createObjectURL(file);
            };

    const handleDelete = async () => {
        if (!video.url) return;

        try {
            // ✅ Xóa trong Media Library nếu là base64 hoặc local file
            const allItems = await getAllMediaItems();
            const itemToDelete = allItems.find(item => item.url === video.url);
            
            if (itemToDelete) {
                console.log('🗑️ Deleting from Media Library:', itemToDelete.name);
                await deleteMediaItem(itemToDelete.id);
            }
            
            // Xóa file vật lý nếu không phải base64 và không phải http
            if (!video.url.startsWith('data:') && !video.url.startsWith('http')) {
                await deleteMediaFile(video.url);
            }
            
            onChange({ url: '' });
            console.log('✅ Video deleted');
        } catch (error) {
            console.error('❌ Delete error:', error);
            alert('Failed to delete video');
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            {!video.url ? (
                // Upload button
                <label className="relative flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                    />
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-1">
                            <MaterialSymbol icon="progress_activity" className="text-2xl text-gray-400 dark:text-gray-500 animate-spin" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Uploading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <MaterialSymbol icon="videocam" className="text-2xl text-gray-400 dark:text-gray-500" />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                                Upload<br />Video
                            </span>
                        </div>
                    )}
                </label>
            ) : (
                // Video thumbnail with play button
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-900 group">
            <video
                src={video.url.startsWith('data:') ? video.url : getMediaUrl(video.url)}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
            />
            <div 
                className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center cursor-pointer hover:bg-opacity-30 transition-opacity"
                onClick={() => setShowPreview(true)}
            >
                <div>
                    <MaterialSymbol icon="play_arrow" className="text-xl text-gray-900 dark:text-white" />
                </div>
            </div>

            {/* Delete button (Only part that is modified) */}
            <button
                onClick={handleDelete}
                className="absolute top-1 right-1 w-5 h-5 bg-black/80 hover:bg-black rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-70 transition-opacity z-30"
                aria-label="Remove video"
            >
                <MaterialSymbol icon="close" className="text-xs" />
            </button>
        </div>
            )}

            {/* Video status indicator */}
            {video.url && (
                <div className="text-xs text-center">
                    {processingStatus === 'processing' ? (
                        <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 animate-pulse">
                            <MaterialSymbol icon="autorenew" className="text-sm animate-spin" />
                            <span className="font-medium">
                                Quick Adjust {processingProgress > 0 ? `${processingProgress}%` : '...'}
                            </span>
                        </div>
                    ) : processingStatus === 'adjusted' ? (
                        <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                            <MaterialSymbol icon="auto_awesome" className="text-sm" />
                            <span className="font-medium">Adjusted</span>
                        </div>
                    ) : processingStatus === 'failed' ? (
                        <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400">
                            <MaterialSymbol icon="error" className="text-sm" />
                            <span className="font-medium">Failed</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                            <MaterialSymbol icon="check_circle" className="text-sm" />
                            <span className="font-medium">Video ready</span>
                        </div>
                    )}
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && video.url && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="relative w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            onClick={() => setShowPreview(false)}
                            className="absolute -top-12 right-4 p-2 text-white hover:text-gray-300 transition-colors"
                        >
                            <MaterialSymbol icon="close" className="text-3xl" />
                        </button>
                        
                        {/* Video player */}
                        <video
                            src={getMediaUrl(video.url)}
                            controls
                            autoPlay
                            className="w-full max-h-[85vh] bg-black rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoInput;