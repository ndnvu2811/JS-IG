import React, { useState, useRef } from 'react';
import MediaPreviewModal from './MediaPreviewModal';
import MaterialSymbol from '../icons/MaterialSymbol';
import VideoWarningModal from '../content-management/VideoWarningModal';
import { uploadMediaFile, getMediaUrl, deleteMediaFile } from '../../utils/mediaUtils';
import { getAllMediaItems, deleteMediaItem, syncMediaToLibrary } from '../../utils/library';

interface MediaItem {
    type: 'image' | 'video';
    url: string;
}

interface MediaInputProps {
    media: MediaItem[];
    onChange: (media: MediaItem[]) => void;
    onMediaRemove?: (removedMedia: MediaItem[]) => void;
}

const MediaInput: React.FC<MediaInputProps> = ({ media, onChange, onMediaRemove }) => {
    const [showUrlModal, setShowUrlModal] = useState(false);
    const [urlListValue, setUrlListValue] = useState('');
    const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showVideoWarning, setShowVideoWarning] = useState(false);
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // ✅ CHECK VIDEO FIRST
            const hasVideo = Array.from(files).some(file => file.type.startsWith('video/'));
            
            if (hasVideo) {
                setShowVideoWarning(true);
                if(event.target) event.target.value = '';
                return;
            }
            
            // ✅ UPLOAD FILES USING mediaUtils
            const newMediaItems: MediaItem[] = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                try {
                    const result = await uploadMediaFile(file);
                    
                    if (result) {
                        const mediaType = file.type.startsWith('video') ? 'video' : 'image';
                        newMediaItems.push({ 
                            type: mediaType, 
                            url: result.path  // ✅ Lưu absolute path
                        });
                        console.log('✅ Media uploaded:', result.path);
                    } else {
                        console.error('Failed to upload:', file.name);
                        alert(`Failed to upload ${file.name}`);
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    alert(`Error uploading ${file.name}`);
                }
            }
            
            if (newMediaItems.length > 0) {
                // ✅ NEW: Sync to Media Library
                console.log('📚 Adding to Media Library...');
                await syncMediaToLibrary(
                    Date.now(),
                    newMediaItems,
                    'Post',
                    `Post_Upload_${Date.now()}`
                );
                
                onChange([...media, ...newMediaItems]);
            }
            
            if(event.target) event.target.value = '';
        }
    };

    const convertDriveLink = (url: string): string => {
    // Loại 1: https://drive.google.com/file/d/ID/view
    const fileMatch = url.match(/\/file\/d\/([^\/\?]+)/);
    if (fileMatch) {
        return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    }
    
    // Loại 2: https://drive.google.com/open?id=ID
    const openMatch = url.match(/[?&]id=([^&]+)/);
    if (openMatch && url.includes('drive.google.com')) {
        return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
    }
    
    // Loại 3: https://drive.google.com/uc?id=ID (đã đúng format)
    if (url.includes('drive.google.com/uc')) {
        return url;
    }
    
    // Link khác (Imgur, ImgBB...) → giữ nguyên
    return url;
    };

    const handleAddUrls = () => {
    if (urlListValue.trim()) {
        const urls = urlListValue.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        const newMediaItems: MediaItem[] = urls.map(url => {
            const convertedUrl = convertDriveLink(url); // ← Tự động convert Drive
            const isVideo = url.includes('youtube.com') || url.includes('vimeo.com') || url.endsWith('.mp4');
            return { type: isVideo ? 'video' : 'image', url: convertedUrl };
        });
        onChange([...media, ...newMediaItems]);
        setUrlListValue('');
        setShowUrlModal(false);
        }
    };
    
    const handleRemoveMedia = async (index: number) => {
        const mediaItem = media[index];
        
        // ✅ Xóa trong Media Library nếu là base64 hoặc local file
        if (mediaItem.url) {
            try {
                const allItems = await getAllMediaItems();
                const itemToDelete = allItems.find(item => item.url === mediaItem.url);
                
                if (itemToDelete) {
                    console.log('🗑️ Deleting from Media Library:', itemToDelete.name);
                    await deleteMediaItem(itemToDelete.id);
                }
                
                // Xóa file vật lý nếu không phải base64 và không phải http
                if (!mediaItem.url.startsWith('data:') && !mediaItem.url.startsWith('http')) {
                    await deleteMediaFile(mediaItem.url);
                }
            } catch (error) {
                console.error('❌ Error deleting media:', error);
            }
        }
        
        const newMedia = media.filter((_, i) => i !== index);
        onChange(newMedia);
        
        // ✅ Notify parent để xóa trong Library
        if (onMediaRemove) {
            onMediaRemove(newMedia);
        }
    };

    const AddMediaButton = () => (
        <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-colors flex-shrink-0"
            aria-label="Add media via file upload"
        >
            <MaterialSymbol icon="add_photo_alternate" />
        </button>
    );

    return (
        <>
            <div className="flex flex-col gap-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                />
                {/* Video Warning Modal */}
                <VideoWarningModal
                    isOpen={showVideoWarning}
                    onClose={() => setShowVideoWarning(false)}
                    onGoToReels={() => {
                        setShowVideoWarning(false);
                        window.dispatchEvent(new CustomEvent('navigate-to-reels'));
                    }}
                />
                {/* Dùng flex wrap thay vì grid để responsive */}
                <div className="grid grid-cols-2 gap-2 min-h-[72px]">
                    {media.map((m, index) => (
                        <div 
                            key={index} 
                            className="relative w-16 h-16 flex-shrink-0 rounded bg-cover bg-center group bg-gray-200 dark:bg-gray-800 cursor-pointer"
                            onClick={() => setPreviewMedia(m)}
                        >
                            {m.type === 'video' ? (
                    <>
                        <video 
                            src={m.url.startsWith('data:') ? m.url : getMediaUrl(m.url)} 
                            className="w-full h-full object-cover rounded"
                            preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
                            <MaterialSymbol icon="play_circle" className="text-2xl text-white" />
                        </div>
                    </>
                ) : (
                    <img 
                        src={m.url.startsWith('data:') ? m.url : getMediaUrl(m.url)} 
                        alt={`media-${index}`} 
                        className="w-full h-full object-cover rounded" 
                    />
                )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveMedia(index); }}
                                className="absolute top-0 right-0 -m-1 w-5 h-5 bg-black bg-opacity-70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove media"
                            >
                                <MaterialSymbol icon="close" className="text-sm" />
                            </button>
                        </div>
                    ))}
                    <AddMediaButton />
                </div>
                {/* Nút Add URL mở modal */}
                <button
                    type="button"
                    onClick={() => setShowUrlModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <MaterialSymbol icon="add_link" className="text-base" />
                    Add URL
                </button>
            </div>

            {/* Modal Add URL */}
            {showUrlModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowUrlModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[800px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Media URLs</h3>
                            <button 
                                onClick={() => setShowUrlModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <MaterialSymbol icon="close" className="text-xl" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Paste one or multiple URLs (one per line)<br/>
                            <span className="text-xs text-yellow-500">
                                💡 For Google Drive: Share → Anyone with link → Copy link
                            </span>
                        </p>
                        <textarea
                            value={urlListValue}
                            onChange={(e) => setUrlListValue(e.target.value)}
                            placeholder="https://example.com/image1.jpg&#10;https://example.com/video.mp4&#10;https://example.com/image2.png"
                            className="w-full h-32 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none table-scrollbar"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                type="button"
                                onClick={handleAddUrls}
                                className="flex-1 px-4 py-2 text-sm font-bold text-white rounded-md bg-primary hover:opacity-90 transition-opacity"
                            >
                                Add URLs
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowUrlModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Preview */}
            {previewMedia && (
                <MediaPreviewModal 
                    media={previewMedia}
                    onClose={() => setPreviewMedia(null)}
                />
            )}
        </>
    );
};
export default MediaInput;