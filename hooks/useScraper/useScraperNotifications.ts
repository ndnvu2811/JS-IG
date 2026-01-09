import { useEffect, useState } from 'react';
import { syncMediaToLibrary } from '../../utils/library';

interface DownloadNotification {
    id: string;
    type: 'progress' | 'success' | 'error';
    message: string;
    progress?: number;
    totalCount?: number;
    downloadedCount?: number;
    currentIndex?: number;
}

export const useScraperNotifications = () => {
    const [downloadNotification, setDownloadNotification] = useState<DownloadNotification | null>(null);

    // Listen for download progress notifications from Electron
    useEffect(() => {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI) return;

        console.log('🔗 Setting up download notification listeners...');

        // Progress notification - fires for each file downloaded
        const handleDownloadProgress = (data: any) => {
            console.log('📥 Download progress:', data);
            
            // Show progress like: "Downloaded 1/3 files" or "Downloaded 2/3 files"
            const message = data.message || `Downloaded ${data.filesDownloaded}/${data.totalFiles} files`;
            
            setDownloadNotification({
                id: data.taskId || 'download_' + Date.now(),
                type: 'progress',
                message: message,
                progress: data.progress || Math.round((data.filesDownloaded / data.totalFiles) * 100),
                totalCount: data.totalFiles,
                downloadedCount: data.filesDownloaded,
                currentIndex: data.filesDownloaded,
            });
        };

        // Completion notification - sync to Media Library
        const handleDownloadComplete = async (data: any) => {
            console.log('✅ Download complete:', data);
            
            // Handle error case
            if (!data.success) {
                console.error('❌ Download failed:', data.error);
                setDownloadNotification({
                    id: data.taskId || 'download_' + Date.now(),
                    type: 'error',
                    message: `❌ Download failed: ${data.error || 'Unknown error'}`,
                });
                return;
            }
            
            try {
                // Sync downloaded files to Media Library (IndexedDB)
                if (data.files && data.files.length > 0) {
                    console.log('📂 Syncing to Media Library:', data.files.length, 'files');
                    
                    // Create media items from downloaded file objects
                    const mediaItems = data.files.map((fileObj: any) => {
                        // Handle both old format (string path) and new format ({path, type})
                        const filePath = typeof fileObj === 'string' ? fileObj : fileObj.path;
                        const fileType = typeof fileObj === 'string' ? 'image' : fileObj.type;
                        
                        // Convert file path to file:// URL for IndexedDB
                        const fileUrl = 'file://' + filePath.replace(/\\/g, '/');
                        
                        console.log(`  📝 Adding: ${filePath} (${fileType})`);
                        
                        return {
                            type: fileType,
                            url: fileUrl
                        };
                    });
                    
                    console.log(`📋 Media items to add:`, mediaItems);
                    
                    // Add to Media Library with batch name
                    await syncMediaToLibrary(
                        Date.now(), // Use timestamp as postId
                        mediaItems,
                        'Scraper',
                        `Scraper_Download_${new Date().toISOString().split('T')[0]}`
                    );
                    
                    console.log('✅ Files added to Media Library IndexedDB');
                    
                    // Trigger Media Library reload
                    window.dispatchEvent(new Event('reload-media-library'));
                }
            } catch (error) {
                console.error('❌ Error syncing to Media Library:', error);
            }
            
            setDownloadNotification({
                id: data.taskId || 'download_' + Date.now(),
                type: 'success',
                message: data.message || `✅ Successfully downloaded ${data.downloadedCount} file${data.downloadedCount > 1 ? 's' : ''}! Added to Media Library.`,
                downloadedCount: data.downloadedCount,
                totalCount: data.totalCount,
            });
            // Auto-clear after 8 seconds
            setTimeout(() => setDownloadNotification(null), 8000);
        };

        // Error notification
        const handleDownloadError = (data: any) => {
            console.error('❌ Download error:', data);
            setDownloadNotification({
                id: data.taskId || 'download_' + Date.now(),
                type: 'error',
                message: `❌ Download failed: ${data.error || 'Unknown error'}`,
            });
        };

        // Setup listeners
        let cleanups: (() => void)[] = [];

        if (electronAPI.onDownloadProgress) {
            const cleanup = electronAPI.onDownloadProgress(handleDownloadProgress);
            if (cleanup) cleanups.push(cleanup);
        }

        if (electronAPI.onDownloadComplete) {
            const cleanup = electronAPI.onDownloadComplete(handleDownloadComplete);
            if (cleanup) cleanups.push(cleanup);
        }

        if (electronAPI.onDownloadError) {
            const cleanup = electronAPI.onDownloadError(handleDownloadError);
            if (cleanup) cleanups.push(cleanup);
        }

        return () => {
            cleanups.forEach(cleanup => cleanup?.());
        };
    }, []);

    const clearNotification = () => {
        setDownloadNotification(null);
    };

    return {
        downloadNotification,
        clearNotification,
    };
};
