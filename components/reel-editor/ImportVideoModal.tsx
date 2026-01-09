import React, { useState, useEffect, useMemo } from 'react';
import { MediaLibraryItem } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';
import { getAllMediaItems } from '../../utils/library';

interface ImportVideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (video: MediaLibraryItem) => void;
}

const ImportVideoModal: React.FC<ImportVideoModalProps> = ({
    isOpen,
    onClose,
    onImport
}) => {
    const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadMediaItems();
        }
    }, [isOpen]);

    const loadMediaItems = async () => {
        setIsLoading(true);
        try {
            const items = await getAllMediaItems();
            // Filter to only videos
            const videoItems = items.filter(item => item.type === 'video');
            setMediaItems(videoItems);
            setSelectedItemId(null);
        } catch (error) {
            console.error('Failed to load media:', error);
            setMediaItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter videos by search query
    const filteredVideos = useMemo(() => {
        return mediaItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [mediaItems, searchQuery]);

    const handleImport = () => {
        const selectedItem = mediaItems.find(item => item.id === selectedItemId);
        if (selectedItem) {
            onImport(selectedItem);
            setSearchQuery('');
            setSelectedItemId(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="video_library" className="text-xl text-instagram-purple" />
                        <h2 className="text-lg font-bold text-white">Import Video from Media Library</h2>
                        <span className="px-2 py-0.5 bg-instagram-purple/20 text-instagram-purple text-xs rounded-full">
                            {filteredVideos.length} video(s)
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
                        <MaterialSymbol icon="close" className="text-xl text-white" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                    <div className="relative">
                        <MaterialSymbol icon="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                        <input
                            type="text"
                            placeholder="Search videos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-instagram-purple focus:outline-none transition"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <MaterialSymbol icon="hourglass_empty" className="text-5xl mb-3 animate-spin" />
                            <p>Loading videos...</p>
                        </div>
                    ) : filteredVideos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <MaterialSymbol icon="video_off" className="text-5xl mb-3" />
                            <p>No videos found</p>
                            <p className="text-sm">Upload videos to Media Library first</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {filteredVideos.map((video) => {
                                const isSelected = selectedItemId === video.id;
                                return (
                                    <button
                                        key={video.id}
                                        onClick={() => setSelectedItemId(video.id)}
                                        className={`relative group rounded-lg overflow-hidden border-2 transition ${
                                            isSelected
                                                ? 'border-instagram-purple bg-instagram-purple/10'
                                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                                        }`}
                                    >
                                        {/* Video Preview */}
                                        <div className="relative w-full aspect-video bg-gray-900 flex items-center justify-center">
                                            {video.url.startsWith('data:') || video.url.startsWith('http') ? (
                                                <video
                                                    src={video.url}
                                                    className="w-full h-full object-cover"
                                                    onError={() => {
                                                        // Fallback if video fails to load
                                                    }}
                                                />
                                            ) : (
                                                // For file system videos
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <MaterialSymbol icon="video_file" className="text-3xl text-gray-500" />
                                                    <span className="text-xs text-gray-400">Video File</span>
                                                </div>
                                            )}
                                            
                                            {/* Play Icon Overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
                                                <MaterialSymbol icon="play_circle" className="text-4xl text-white/80 group-hover:text-white" />
                                            </div>

                                            {/* Selection Indicator */}
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-instagram-purple rounded-full flex items-center justify-center">
                                                    <MaterialSymbol icon="check" className="text-sm text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Video Info */}
                                        <div className="p-3 bg-gray-900/50">
                                            <p className="text-xs font-medium text-white truncate">
                                                {video.name}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(video.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
                    <div className="text-sm text-gray-400">
                        {selectedItemId && (
                            <span className="font-medium text-instagram-purple">
                                1 video selected
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!selectedItemId}
                            className="px-4 py-2 rounded-lg text-white btn-instagram disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <MaterialSymbol icon="check" className="text-base" />
                            Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportVideoModal;
