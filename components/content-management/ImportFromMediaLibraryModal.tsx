import React, { useState, useEffect, useMemo } from 'react';
import { MediaLibraryItem } from '../../types';
import MaterialSymbol from '../icons/MaterialSymbol';
import { getAllMediaItems } from '../../utils/library';

interface ImportFromMediaLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (items: { type: 'image' | 'video'; url: string }[]) => void;
    postId: number;
}

interface FolderInfo {
    name: string;
    items: MediaLibraryItem[];
    imageCount: number;
    videoCount: number;
}

const ImportFromMediaLibraryModal: React.FC<ImportFromMediaLibraryModalProps> = ({
    isOpen,
    onClose,
    onImport,
    postId
}) => {
    const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
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
            setMediaItems(items);
            setSelectedFolders(new Set());
        } catch (error) {
            console.error('Failed to load media:', error);
            setMediaItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Organize items by batchName (folder)
    const folders = useMemo(() => {
        const folderMap = new Map<string, MediaLibraryItem[]>();
        
        mediaItems.forEach(item => {
            const folderName = item.batchName || 'Unsorted';
            if (!folderMap.has(folderName)) {
                folderMap.set(folderName, []);
            }
            folderMap.get(folderName)!.push(item);
        });

        const result: FolderInfo[] = [];
        folderMap.forEach((items, folderName) => {
            const imageCount = items.filter(i => i.type === 'image').length;
            const videoCount = items.filter(i => i.type === 'video').length;
            
            result.push({
                name: folderName,
                items,
                imageCount,
                videoCount,
            });
        });

        // ✅ NEW: Filter by search query + only show folders with images (Content Manager only supports images)
        return result.filter(folder =>
            folder.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            folder.imageCount > 0  // Only show folders that contain at least one image
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [mediaItems, searchQuery]);

    const handleSelectFolder = (folderName: string) => {
        const newSet = new Set(selectedFolders);
        if (newSet.has(folderName)) {
            newSet.delete(folderName);
        } else {
            newSet.add(folderName);
        }
        setSelectedFolders(newSet);
    };

    const handleSelectAll = () => {
        if (selectedFolders.size === folders.length) {
            setSelectedFolders(new Set());
        } else {
            setSelectedFolders(new Set(folders.map(f => f.name)));
        }
    };

    const handleImport = () => {
        const selectedItems = mediaItems.filter(item => {
            const folderName = item.batchName || 'Unsorted';
            return selectedFolders.has(folderName) && item.type === 'image';  // ✅ Only import images
        });
        const importItems = selectedItems.map(item => ({
            type: item.type as 'image' | 'video',
            url: item.url
        }));
        onImport(importItems);
        onClose();
    };

    if (!isOpen) return null;

    const totalItemsSelected = mediaItems.filter(item => {
        const folderName = item.batchName || 'Unsorted';
        return selectedFolders.has(folderName);
    }).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="folder" className="text-xl text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Import from Media Library</h2>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            {folders.length} folders
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
                            placeholder="Search folders..."
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
                            <p>Loading folders...</p>
                        </div>
                    ) : folders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <MaterialSymbol icon="folder_off" className="text-5xl mb-3" />
                            <p>No folders found</p>
                            <p className="text-sm">Upload media to Media Library first</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Select All */}
                            <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedFolders.size === folders.length && folders.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-300">
                                    Select All ({folders.length} folders)
                                </span>
                            </label>

                            {/* Folders List */}
                            <div className="space-y-2">
                                {folders.map((folder) => {
                                    const isSelected = selectedFolders.has(folder.name);
                                    return (
                                        <label
                                            key={folder.name}
                                            className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                                                isSelected
                                                    ? 'bg-blue-600/20 border border-blue-500'
                                                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleSelectFolder(folder.name)}
                                                className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                                            />
                                            <MaterialSymbol icon="folder" className="text-2xl text-blue-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">
                                                    {folder.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {folder.imageCount > 0 && `📷 ${folder.imageCount}`}
                                                    {folder.imageCount > 0 && folder.videoCount > 0 && ' • '}
                                                    {folder.videoCount > 0 && `🎥 ${folder.videoCount}`}
                                                </p>
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {folder.items.length} items
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
                        {selectedFolders.size > 0 && totalItemsSelected > 0 && (
                            <span className="font-medium text-blue-300">
                                {selectedFolders.size} folder(s) • {totalItemsSelected} item(s) selected
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
                            disabled={selectedFolders.size === 0}
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

export default ImportFromMediaLibraryModal;
