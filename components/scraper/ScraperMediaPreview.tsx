import React, { useState } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ScraperMediaPreviewProps {
    isOpen: boolean;
    images: string[];
    onClose: () => void;
    onDeleteImage?: (index: number) => void;
}

const ScraperMediaPreview: React.FC<ScraperMediaPreviewProps> = ({
    isOpen,
    images,
    onClose,
    onDeleteImage
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    if (!isOpen || images.length === 0) return null;

    const isVideo = (url: string) => {
        return url.includes('.mp4') || url.includes('video') || url.includes('.mov');
    };

    // Reset selected khi đóng
    const handleClose = () => {
        setSelectedIndex(null);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8"
            onClick={handleClose}
        >
            {/* Main Container - 80% size */}
            <div 
                className="relative w-[80%] h-[80%] bg-gray-900 rounded-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="photo_library" className="text-xl text-instagram-purple" />
                        <span className="text-white font-bold">
                            Media Gallery ({images.length} items)
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <MaterialSymbol icon="close" className="text-xl text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {selectedIndex === null ? (
                        /* ========== THUMBNAILS GRID ========== */
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((url, index) => (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedIndex(index)}
                                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border-2 border-transparent hover:border-instagram-purple transition-all"
                                    >
                                        {isVideo(url) ? (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                <video 
                                                    src={url} 
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                    <MaterialSymbol icon="play_circle" className="text-5xl text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={url}
                                                alt={`Media ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                        
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                            <MaterialSymbol 
                                                icon="zoom_in" 
                                                className="text-3xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>

                                        {/* Index badge */}
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded-md text-xs text-white font-bold">
                                            {index + 1}
                                        </div>

                                        {/* Type badge */}
                                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-md text-[10px] text-white uppercase">
                                            {isVideo(url) ? 'Video' : 'Image'}
                                        </div>
                                        {/* Delete button */}
                                        {onDeleteImage && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteImage(index);
                                                }}
                                                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-[10px] shadow-md opacity-0 group-hover:opacity-100 transition-all">
                                                <MaterialSymbol icon="delete" className="w-5 h-5 text-white" />
                                            </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                        /* ========== FULL PREVIEW ========== */
                        <div className="flex-1 flex">
                            {/* Main Preview */}
                            <div className="flex-1 flex items-center justify-center p-6 relative">
                                {/* Back button */}
                                <button
                                    onClick={() => setSelectedIndex(null)}
                                    className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-sm font-bold transition-colors"
                                >
                                    <MaterialSymbol icon="arrow_back" />
                                    Back to Gallery
                                </button>

                                {/* Navigation arrows */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedIndex(
                                                selectedIndex > 0 ? selectedIndex - 1 : images.length - 1
                                            )}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <MaterialSymbol icon="chevron_left" className="text-3xl text-white" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedIndex(
                                                selectedIndex < images.length - 1 ? selectedIndex + 1 : 0
                                            )}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                                        >
                                            <MaterialSymbol icon="chevron_right" className="text-3xl text-white" />
                                        </button>
                                    </>
                                )}

                                {/* Media content */}
                                {isVideo(images[selectedIndex]) ? (
                                    <video
                                        src={images[selectedIndex]}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                ) : (
                                    <img
                                        src={images[selectedIndex]}
                                        alt={`Preview ${selectedIndex + 1}`}
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                )}

                                {/* Counter */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full text-white text-sm font-bold">
                                    {selectedIndex + 1} / {images.length}
                                </div>
                            </div>

                            {/* Thumbnails sidebar */}
                            <div className="w-32 border-l border-gray-700 p-2 overflow-y-auto">
                                <div className="flex flex-col gap-2">
                                    {images.map((url, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedIndex(index)}
                                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                                                index === selectedIndex 
                                                    ? 'border-instagram-purple' 
                                                    : 'border-transparent hover:border-gray-500'
                                            }`}
                                        >
                                            {isVideo(url) ? (
                                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                                    <MaterialSymbol icon="play_circle" className="text-xl text-white" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={url}
                                                    alt={`Thumb ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScraperMediaPreview;