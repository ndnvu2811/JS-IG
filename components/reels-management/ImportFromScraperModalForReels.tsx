import React, { useState, useEffect } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ScraperItem {
    id: string;
    caption: string;
    captionNew: string;
    media: { type: string; url: string }[];
    url: string;
}

interface ImportFromScraperModalForReelsProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: ScraperItem[]) => void;
}

const ImportFromScraperModalForReels: React.FC<ImportFromScraperModalForReelsProps> = ({
    isOpen,
    onClose,
    onImport
}) => {
    const [scraperItems, setScraperItems] = useState<ScraperItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            const data = localStorage.getItem('scraper-results');
            if (data) {
                try {
                    const allItems = JSON.parse(data);
                    // ✅ Filter: Chỉ lấy items có media type = 'video'
                    const videoItems = allItems.filter((item: ScraperItem) => {
                        return item.media && item.media.length > 0 && item.media[0].type === 'video';
                    });
                    setScraperItems(videoItems);
                    console.log(`🎬 Video items for reels import: ${videoItems.length} / ${allItems.length} total`);
                } catch (e) {
                    setScraperItems([]);
                }
            }
            setSelectedIds(new Set());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectAll = () => {
        if (selectedIds.size === scraperItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(scraperItems.map(item => item.id)));
        }
    };

    const handleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleImport = () => {
        const selected = scraperItems.filter(item => selectedIds.has(item.id));
        onImport(selected);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="download" className="text-xl text-pink-400" />
                        <h2 className="text-lg font-bold text-white">Import Videos for Reels</h2>
                        <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs rounded-full">
                            {scraperItems.length} videos available
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
                        <MaterialSymbol icon="close" className="text-xl text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {scraperItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <MaterialSymbol icon="inbox" className="text-5xl mb-3" />
                            <p>No videos found</p>
                            <p className="text-sm">Go to Scraper page to scrape videos first</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All */}
                            <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === scraperItems.length && scraperItems.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 rounded text-pink-500 bg-gray-700 border-gray-600"
                                />
                                <span className="text-white font-medium">Select All ({scraperItems.length})</span>
                            </label>

                            {/* Items */}
                            {scraperItems.map((item) => (
                                <label
                                    key={item.id}
                                    className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                                        selectedIds.has(item.id)
                                            ? 'bg-pink-500/20 border-2 border-pink-500'
                                            : 'bg-gray-800 border-2 border-transparent hover:border-gray-600'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(item.id)}
                                        onChange={() => handleSelect(item.id)}
                                        className="w-5 h-5 mt-1 rounded text-pink-500 bg-gray-700 border-gray-600"
                                    />
                                    
                                    {/* Video Thumbnail */}
                                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700 relative">
                                        {item.media && item.media.length > 0 ? (
                                            <>
                                                <img
                                                    src={item.media[0].url}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                    <MaterialSymbol icon="play_circle" className="text-3xl text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <MaterialSymbol icon="video_library" className="text-2xl text-gray-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm line-clamp-3">
                                            {item.captionNew || item.caption || '(No caption)'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <MaterialSymbol icon="video_library" className="text-sm text-pink-400" />
                                                Video
                                            </span>
                                            {item.captionNew && (
                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                                                    AI Generated
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-700">
                    <span className="text-sm text-gray-400">
                        {selectedIds.size} videos selected
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={selectedIds.size === 0}
                            className="px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-red-600"
                        >
                            Import {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportFromScraperModalForReels;
