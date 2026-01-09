import React, { useEffect } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';
import { getMediaUrl } from '../../utils/mediaUtils';

interface MediaItem {
    type: 'image' | 'video';
    url: string;
}

interface MediaPreviewModalProps {
    media: MediaItem;
    onClose: () => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ media, onClose }) => {
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative max-w-4xl w-full max-h-[90vh] p-4 animate-in fade-in-0 zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-4 p-2 text-white hover:text-gray-300 transition-colors z-10"
                    aria-label="Close preview"
                >
                    <MaterialSymbol icon="close" className="text-3xl" />
                </button>

                {media.type === 'image' ? (
                    <img 
                        src={media.url.startsWith('data:') ? media.url : getMediaUrl(media.url)} 
                        alt="Media preview" 
                        className="max-w-full max-h-[85vh] object-contain rounded-lg mx-auto" 
                        onError={(e) => {
                            console.error('Image load error:', media.url);
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white">Image not found</text></svg>';
                        }}
                    />
                ) : (
                    <video 
                        src={media.url.startsWith('data:') ? media.url : getMediaUrl(media.url)} 
                        controls 
                        autoPlay 
                        className="max-w-full max-h-[85vh] rounded-lg mx-auto"
                        onError={(e) => {
                            console.error('Video load error:', media.url);
                        }}
                    >
                        Your browser does not support the video tag.
                    </video>
                )}
            </div>
        </div>
    );
};

export default MediaPreviewModal;