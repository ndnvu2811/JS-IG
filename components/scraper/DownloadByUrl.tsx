import React, { useState, useEffect, useRef } from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';
import { InstagramAccount, MediaLibraryItem } from '../../types';
import { getAllMediaItems } from '../../utils/library';

// Type cho downloaded result
interface DownloadedFolder {
    folderName: string;
    mediaCount: number;
    items: MediaLibraryItem[];
    downloadedAt: string;
}

interface DownloadByUrlProps {
    accounts: InstagramAccount[];
    onDownload: (urls: string[], contentType: 'post' | 'reel', startingNumber: number) => Promise<void>;
    onCancel?: () => void;
    isLoading: boolean;
    // Progress tracking
    progress?: {
        currentUrl: number;
        totalUrls: number;
        message: string;
        status: 'idle' | 'scraping' | 'downloading' | 'waiting' | 'completed' | 'error';
    };
}

const DownloadByUrl: React.FC<DownloadByUrlProps> = ({
    accounts,
    onDownload,
    onCancel,
    isLoading,
    progress
}) => {
    const [postUrls, setPostUrls] = useState('');
    const [contentType, setContentType] = useState<'post' | 'reel'>('post');
    const [startingNumber, setStartingNumber] = useState(1);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // State cho kết quả download
    const [downloadedFolders, setDownloadedFolders] = useState<DownloadedFolder[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // Track download session
    const downloadSessionRef = useRef<{
        folderPrefix: string;
        startNum: number;
        count: number;
    } | null>(null);
    
    // Track đã load những folder nào rồi
    const loadedFoldersRef = useRef<Set<string>>(new Set());
    
    // Track previous currentUrl để biết khi nào có URL mới hoàn thành
    const prevCurrentUrl = useRef<number>(0);

    // Parse URLs để đếm
    const parsedUrls = postUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    // Tính toán tên folder preview
    const getPreviewFolderNames = () => {
        if (parsedUrls.length === 0) return '';
        const prefix = contentType === 'reel' ? 'Scraper_Reel' : 'Scraper_Post';
        if (parsedUrls.length === 1) {
            return `${prefix}_${startingNumber}`;
        }
        return `${prefix}_${startingNumber}, ${prefix}_${startingNumber + 1}, ... ${prefix}_${startingNumber + parsedUrls.length - 1}`;
    };

    // Load kết quả cho MỘT folder cụ thể
    const loadSingleFolderResult = async (folderName: string) => {
        // Skip nếu đã load rồi
        if (loadedFoldersRef.current.has(folderName)) {
            console.log(`⏭️ Already loaded: ${folderName}`);
            return;
        }

        try {
            console.log(`📂 Loading single folder: ${folderName}`);
            
            const allItems = await getAllMediaItems();
            const folderItems = allItems.filter(item => item.batchName === folderName);
            
            if (folderItems.length > 0) {
                console.log(`✅ Found ${folderItems.length} items in ${folderName}`);
                
                // Đánh dấu đã load
                loadedFoldersRef.current.add(folderName);
                
                // Thêm vào đầu danh sách
                setDownloadedFolders(prev => [{
                    folderName,
                    mediaCount: folderItems.length,
                    items: folderItems,
                    downloadedAt: new Date().toISOString()
                }, ...prev]);
            } else {
                console.log(`⚠️ No items found for ${folderName} yet`);
            }
        } catch (err) {
            console.error('Error loading folder result:', err);
        }
    };

    // Theo dõi progress để load kết quả SAU MỖI URL hoàn thành
    useEffect(() => {
        if (!downloadSessionRef.current) return;
        if (!progress) return;

        const { folderPrefix, startNum } = downloadSessionRef.current;
        const currentUrl = progress.currentUrl;

        // Khi currentUrl tăng lên (có URL mới hoàn thành)
        // VÀ status là 'waiting' hoặc 'completed' hoặc 'downloading' (đã sync xong)
        if (currentUrl > prevCurrentUrl.current && currentUrl > 0) {
            // URL vừa hoàn thành có index = currentUrl - 1 (vì currentUrl đã tăng)
            // Nhưng thực ra currentUrl = số URLs đã hoàn thành
            // Folder vừa xong = folderPrefix_startNum+(currentUrl-1)
            const completedFolderIndex = currentUrl - 1;
            const completedFolderName = `${folderPrefix}_${startNum + completedFolderIndex}`;
            
            console.log(`🎯 URL #${currentUrl} completed, loading: ${completedFolderName}`);
            
            // Delay 1.5s để IndexedDB cập nhật
            setTimeout(() => {
                loadSingleFolderResult(completedFolderName);
            }, 1500);
        }

        // Cập nhật previous
        prevCurrentUrl.current = currentUrl;

    }, [progress?.currentUrl, progress?.status]);

    // Reset khi bắt đầu download mới
    useEffect(() => {
        if (progress?.status === 'scraping' && prevCurrentUrl.current === 0) {
            // Bắt đầu download mới, reset loaded folders
            loadedFoldersRef.current = new Set();
            prevCurrentUrl.current = 0;
        }
    }, [progress?.status]);

    const handleDownload = async () => {
        if (!postUrls.trim()) return;
        if (accounts.length === 0) {
            setDownloadError('No Instagram accounts available. Please add an account first.');
            return;
        }

        setDownloadError(null);
        setSuccessMessage(null);

        const urls = parsedUrls;
        const currentStartNum = startingNumber;
        const currentContentType = contentType;

        if (urls.length === 0) {
            setDownloadError('Please enter at least one URL');
            return;
        }

        // Reset tracking
        loadedFoldersRef.current = new Set();
        prevCurrentUrl.current = 0;

        // Lưu thông tin session
        const folderPrefix = currentContentType === 'reel' ? 'Scraper_Reel' : 'Scraper_Post';
        downloadSessionRef.current = {
            folderPrefix,
            startNum: currentStartNum,
            count: urls.length
        };

        console.log('📋 Starting download:', { 
            urls: urls.length, 
            contentType: currentContentType, 
            startingNumber: currentStartNum,
            folderPrefix
        });

        try {
            await onDownload(urls, currentContentType, currentStartNum);
            
            // Clear input và update starting number SAU KHI download xong
            setPostUrls('');
            setStartingNumber(prev => prev + urls.length);
            
        } catch (err: any) {
            console.error('❌ Download error:', err);
            setDownloadError(err.message || 'Failed to start download');
            setSuccessMessage(null);
            downloadSessionRef.current = null;
        }
    };

    const handleButtonClick = () => {
        if (isLoading && onCancel) {
            onCancel();
            downloadSessionRef.current = null;
            loadedFoldersRef.current = new Set();
            prevCurrentUrl.current = 0;
        } else {
            handleDownload();
        }
    };

    // Xóa folder khỏi kết quả hiển thị
    const removeFromResults = (folderName: string) => {
        setDownloadedFolders(prev => prev.filter(f => f.folderName !== folderName));
        loadedFoldersRef.current.delete(folderName);
    };

    // Clear tất cả kết quả
    const clearAllResults = () => {
        setDownloadedFolders([]);
        loadedFoldersRef.current = new Set();
    };

    // Calculate progress percentage
    const progressPercent = progress && progress.totalUrls > 0 
        ? Math.round((progress.currentUrl / progress.totalUrls) * 100)
        : 0;

    return (
        <div className="h-full overflow-y-auto table-scrollbar">
            <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8">
                {/* Form Card */}
                <div className="bg-white dark:bg-content-dark p-8 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xl">
                    {/* Icon Header */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                            <MaterialSymbol icon="download" className="text-4xl" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        Download by Post URL
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                        Enter Instagram post or reel URLs to download all media
                    </p>

                    {/* Progress Display */}
                    {isLoading && progress && progress.status !== 'idle' && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="animate-spin">
                                    <MaterialSymbol icon="sync" className="text-2xl text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                            {progress.status === 'waiting' ? 'Waiting...' : 'Downloading...'}
                                        </span>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {progress.currentUrl}/{progress.totalUrls}
                                        </span>
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                        {progress.message}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <div className="text-right mt-1">
                                <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                                    {progressPercent}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {successMessage && !isLoading && (
                        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <MaterialSymbol icon="check_circle" className="text-lg" />
                                {successMessage}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {downloadError && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <MaterialSymbol icon="error" className="text-lg" />
                                {downloadError}
                            </div>
                        </div>
                    )}

                    {/* Content Type Selection */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Content Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setContentType('post')}
                                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                                        contentType === 'post'
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
                                    }`}
                                >
                                    <MaterialSymbol icon="image" className="text-lg" />
                                    Post
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContentType('reel')}
                                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                                        contentType === 'reel'
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
                                    }`}
                                >
                                    <MaterialSymbol icon="movie" className="text-lg" />
                                    Reel
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Starting Number
                            </label>
                            <div className="relative">
                                <MaterialSymbol icon="tag" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="number"
                                    min="1"
                                    value={startingNumber}
                                    onChange={(e) => setStartingNumber(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Folder Preview */}
                    {parsedUrls.length > 0 && (
                        <div className="mb-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <MaterialSymbol icon="folder" className="text-amber-500" />
                            <span>Folders: {getPreviewFolderNames()}</span>
                        </div>
                    )}

                    {/* URL Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Instagram Post URLs <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MaterialSymbol icon="link" className="absolute left-3 top-4 text-gray-400" />
                            <textarea
                                value={postUrls}
                                onChange={(e) => setPostUrls(e.target.value)}
                                placeholder={`https://www.instagram.com/p/ABC123.../\nhttps://www.instagram.com/p/XYZ789.../\n(One URL per line)`}
                                rows={5}
                                disabled={isLoading}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none disabled:opacity-50"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <MaterialSymbol icon="info" className="text-sm" />
                            One URL per line. 60s delay between posts.
                        </p>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleButtonClick}
                        disabled={!postUrls.trim() && !isLoading}
                        className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all transform ${
                            isLoading
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                        } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 hover:scale-[1.02] active:scale-[0.98]`}
                    >
                        {isLoading ? (
                            <>
                                <MaterialSymbol icon="close" className="text-xl" />
                                Cancel Download
                            </>
                        ) : (
                            <>
                                <MaterialSymbol icon="download" className="text-xl" />
                                Download Media
                            </>
                        )}
                    </button>
                </div>

                {/* Downloaded Results Section */}
                {downloadedFolders.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-content-dark p-6 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xl animate-in fade-in slide-in-from-bottom-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <MaterialSymbol icon="folder_open" className="text-xl text-emerald-500" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Downloaded Results
                                </h3>
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                                    {downloadedFolders.length}
                                </span>
                            </div>
                            <button
                                onClick={clearAllResults}
                                className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
                            >
                                <MaterialSymbol icon="delete_sweep" className="text-sm" />
                                Clear All
                            </button>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {downloadedFolders.map((folder) => (
                                <div
                                    key={folder.folderName}
                                    className="group relative bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-lg"
                                >
                                    {/* Thumbnail */}
                                    <div 
                                        className="aspect-square bg-gray-200 dark:bg-gray-700 relative cursor-pointer"
                                        onClick={() => {
                                            const firstImage = folder.items.find(i => i.type === 'image');
                                            if (firstImage) setPreviewImage(firstImage.url);
                                        }}
                                    >
                                        {folder.items[0] && (
                                            folder.items[0].type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                                                    <MaterialSymbol icon="play_circle" className="text-5xl text-white/80" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={folder.items[0].url}
                                                    alt={folder.folderName}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            )
                                        )}
                                        
                                        {/* Media count badge */}
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded-full text-white text-xs font-bold flex items-center gap-1">
                                            <MaterialSymbol icon={folder.items.some(i => i.type === 'video') ? 'movie' : 'image'} className="text-xs" />
                                            {folder.mediaCount}
                                        </div>

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <MaterialSymbol icon="visibility" className="text-3xl text-white" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {folder.folderName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {folder.mediaCount} file{folder.mediaCount > 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromResults(folder.folderName);
                                        }}
                                        className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove from list"
                                    >
                                        <MaterialSymbol icon="close" className="text-sm text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Note */}
                        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1">
                            <MaterialSymbol icon="info" className="text-sm" />
                            Files are saved to Media Library. This list resets when you leave.
                        </p>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <MaterialSymbol icon="close" className="text-xl text-gray-700 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadByUrl;