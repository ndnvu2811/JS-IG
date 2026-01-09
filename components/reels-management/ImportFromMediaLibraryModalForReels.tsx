import React, { useState, useEffect, useMemo } from 'react';
import { MediaLibraryItem } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';
import { getAllMediaItems } from '../../utils/library';

interface ImportFromMediaLibraryModalForReelsProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: { url: string }[]) => void;
    reelId: number;
}

const ImportFromMediaLibraryModalForReels: React.FC<ImportFromMediaLibraryModalForReelsProps> = ({
    isOpen,
    onClose,
    onImport,
    reelId
}) => {
    const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMediaItems();
        }
    }, [isOpen]);

    const loadMediaItems = async () => {
        setIsLoading(true);
        try {
            const items = await getAllMediaItems();
            // Filter only videos
            const videoItems = items.filter(item => item.type === 'video');
            setMediaItems(videoItems);
            setSelectedVideos(new Set());
        } catch (error) {
            console.error('Failed to load media:', error);
            setMediaItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter and search videos
    const filteredVideos = useMemo(() => {
        return mediaItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [mediaItems, searchQuery]);

    const handleSelectVideo = (videoId: string) => {
        const newSet = new Set(selectedVideos);
        if (newSet.has(videoId)) {
            newSet.delete(videoId);
        } else {
            newSet.add(videoId);
        }
        setSelectedVideos(newSet);
    };

    const handleSelectAll = () => {
        if (selectedVideos.size === filteredVideos.length) {
            setSelectedVideos(new Set());
        } else {
            setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
        }
    };

    const handleImport = () => {
        const selectedItems = mediaItems.filter(item =>
            selectedVideos.has(item.id)
        );
        const importItems = selectedItems.map(item => ({
            url: item.url
        }));
        onImport(importItems);
        onClose();
    };

    if (!isOpen) return null;

    const totalItemsSelected = selectedVideos.size;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="video_library" className="text-xl text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Import Videos from Media Library</h2>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            {filteredVideos.length} videos
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
                            placeholder="Search by filename..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none transition"
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
                            <MaterialSymbol icon="folder_off" className="text-5xl mb-3" />
                            <p>No videos found</p>
                            <p className="text-sm">Upload videos to Media Library first</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All */}
                            <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedVideos.size === filteredVideos.length && filteredVideos.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-300">
                                    Select All ({filteredVideos.length} videos)
                                </span>
                            </label>

                            {/* Videos Grid - 2 Columns */}
                            <div className="grid grid-cols-2 gap-3">
                                {filteredVideos.map((video) => {
                                    const isSelected = selectedVideos.has(video.id);
                                    return (
                                        <label
                                            key={video.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                                                isSelected
                                                    ? 'bg-blue-600/20 border border-blue-500'
                                                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectVideo(video.id)}
                                                className="w-5 h-5 rounded accent-blue-500 cursor-pointer flex-shrink-0"
                                            />
                                            <MaterialSymbol icon="play_circle" className="text-lg text-blue-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {video.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(video.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
                    <div className="text-sm text-gray-400">
                        {selectedVideos.size > 0 && totalItemsSelected > 0 && (
                            <span className="font-medium text-blue-300">
                                {totalItemsSelected} video(s) selected
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
                            disabled={selectedVideos.size === 0}
                            className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <MaterialSymbol icon="check" className="text-base" />
                            Import ({totalItemsSelected})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportFromMediaLibraryModalForReels;
