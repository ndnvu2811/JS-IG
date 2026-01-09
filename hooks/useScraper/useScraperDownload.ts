import { useCallback, useState, useRef } from 'react';
import { ApifyRunStatus } from './useScraperState';
import { syncMediaToLibrary } from '../../utils/library';

// Progress state type for UI
export interface DownloadProgress {
    currentUrl: number;
    totalUrls: number;
    message: string;
    status: 'idle' | 'scraping' | 'downloading' | 'waiting' | 'completed' | 'error';
}

export const useScraperDownload = (
    setRunStatus: (status: ApifyRunStatus | ((prev: ApifyRunStatus) => ApifyRunStatus)) => void,
    downloadMediaFile: (url: string, folderName: string, index: number, isVideo: boolean) => Promise<string | null>
) => {
    // Progress state for UI
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
        currentUrl: 0,
        totalUrls: 0,
        message: '',
        status: 'idle'
    });

    // Ref to track cancellation
    const isCancelledRef = useRef(false);

    /**
     * Cancel ongoing download
     */
    const cancelDownload = useCallback(() => {
        console.log('🛑 Download cancelled by user');
        isCancelledRef.current = true;
        setDownloadProgress({
            currentUrl: 0,
            totalUrls: 0,
            message: 'Download cancelled',
            status: 'idle'
        });
        setRunStatus({
            status: 'idle',
            progress: 0,
            totalItems: 0,
            currentItems: 0,
            message: 'Cancelled'
        });
    }, [setRunStatus]);

    /**
     * Download posts by URLs (Direct method without Apify)
     * Supports batch download with 60s delay between each URL
     * Downloads ALL carousel images using div._aagw and div._9zm2 (Next button)
     * Syncs to Media Library (IndexedDB) after each URL completes
     * 
     * NOTE: 
     * - Post mode: Only accepts /p/ URLs (images or video posts)
     * - Reel mode: Accepts BOTH /p/ and /reel/ URLs (videos can be in either)
     */
    const downloadPostByUrl = useCallback(async (
        postUrls: string[], 
        contentType: 'post' | 'reel' = 'post',
        startingNumber: number = 1
    ) => {
        // Reset cancellation flag
        isCancelledRef.current = false;

        console.log('📋 Download params:', { postUrls, contentType, startingNumber });
        
        // ========================================
        // RELAXED URL VALIDATION
        // - Post mode: /p/ only
        // - Reel mode: /p/ OR /reel/ (videos can be in /p/ URLs too!)
        // ========================================
        let validUrls: string[];
        
        if (contentType === 'reel') {
            // Reel mode: Accept both /p/ and /reel/ URLs
            const pattern = /instagram\.com\/(p|reel|reels)\//;
            validUrls = postUrls.filter(url => url.match(pattern));
            
            if (validUrls.length === 0) {
                throw new Error('No valid Instagram URLs provided. URLs must contain "instagram.com/p/" or "instagram.com/reel/"');
            }
        } else {
            // Post mode: Only /p/ URLs
            const pattern = /instagram\.com\/p\//;
            validUrls = postUrls.filter(url => url.match(pattern));
            
            if (validUrls.length === 0) {
                throw new Error('No valid Instagram post URLs provided. URLs must contain "instagram.com/p/"');
            }
        }

        // Create folder prefix based on content type
        const folderPrefix = contentType === 'reel' ? 'Scraper_Reel' : 'Scraper_Post';
        
        console.log(`📥 Downloading ${validUrls.length} ${contentType}(s), starting from ${folderPrefix}_${startingNumber}`);

        // Initialize progress
        setDownloadProgress({
            currentUrl: 0,
            totalUrls: validUrls.length,
            message: `Starting download...`,
            status: 'scraping'
        });

        setRunStatus({
            status: 'starting',
            progress: 0,
            totalItems: validUrls.length,
            currentItems: 0,
            message: `📥 Starting download: ${validUrls.length} URLs`
        });

        let successCount = 0;
        let failedUrls: string[] = [];
        let totalMediaDownloaded = 0;

        for (let urlIndex = 0; urlIndex < validUrls.length; urlIndex++) {
            // Check if cancelled
            if (isCancelledRef.current) {
                console.log('🛑 Download cancelled, stopping...');
                break;
            }

            const postUrl = validUrls[urlIndex];
            const fileNumber = startingNumber + urlIndex;
            const folderName = `${folderPrefix}_${fileNumber}`;
            
            try {
                // Update progress - Scraping
                setDownloadProgress({
                    currentUrl: urlIndex,
                    totalUrls: validUrls.length,
                    message: `Scraping ${folderName}...`,
                    status: 'scraping'
                });

                setRunStatus(prev => ({
                    ...prev,
                    status: 'running',
                    currentItems: urlIndex,
                    message: `🔍 [${urlIndex + 1}/${validUrls.length}] Scraping ${folderName}...`
                }));

                console.log(`\n📥 [${urlIndex + 1}/${validUrls.length}] Downloading: ${postUrl}`);
                console.log(`📁 Saving to folder: ${folderName}`);

                // Use Puppeteer to scrape Instagram directly
                const result = await window.electronAPI.instagramDownloadPost({
                    postUrl
                });

                if (isCancelledRef.current) break;

                if (!result.success || !result.media || result.media.length === 0) {
                    throw new Error(result.error || 'No media found in this post');
                }

                console.log(`✅ Found ${result.media.length} media items in ${folderName}`);

                // Update progress - Downloading
                setDownloadProgress({
                    currentUrl: urlIndex,
                    totalUrls: validUrls.length,
                    message: `Downloading ${result.media.length} files to ${folderName}...`,
                    status: 'downloading'
                });

                // Download media files
                const mediaItems: { type: string; url: string; localPath?: string }[] = [];

                for (let i = 0; i < result.media.length; i++) {
                    if (isCancelledRef.current) break;

                    const mediaItem = result.media[i];
                    const isVideo = mediaItem.type === 'video';

                    const localPath = await downloadMediaFile(
                        mediaItem.url,
                        folderName,
                        i + 1,
                        isVideo
                    );

                    mediaItems.push({
                        type: mediaItem.type,
                        url: mediaItem.url,
                        localPath: localPath || undefined
                    });

                    totalMediaDownloaded++;
                    console.log(`  ✅ Downloaded ${isVideo ? 'video' : 'image'} ${i + 1}/${result.media.length}`);
                }

                if (isCancelledRef.current) break;

                // ========================================
                // SYNC TO MEDIA LIBRARY (IndexedDB)
                // This makes files appear in Media Library UI
                // ========================================
                const processedMedia = mediaItems.map(m => ({
                    type: m.type as 'image' | 'video',
                    url: m.localPath || m.url
                }));

                if (processedMedia.length > 0) {
                    await syncMediaToLibrary(
                        fileNumber,
                        processedMedia,
                        'Scraper',
                        folderName
                    );
                    console.log(`✅ Synced to Media Library: ${folderName} (${processedMedia.length} files)`);
                }

                successCount++;

                // Update progress - Completed this URL
                const completedCount = urlIndex + 1;
                setDownloadProgress({
                    currentUrl: completedCount,
                    totalUrls: validUrls.length,
                    message: `Completed ${folderName} (${completedCount}/${validUrls.length})`,
                    status: completedCount === validUrls.length ? 'completed' : 'downloading'
                });

                setRunStatus(prev => ({
                    ...prev,
                    progress: Math.round((completedCount / validUrls.length) * 100),
                    currentItems: completedCount,
                    message: `✅ ${completedCount}/${validUrls.length} completed`
                }));

                // Delay 60s before next URL (except for last one)
                if (urlIndex < validUrls.length - 1 && !isCancelledRef.current) {
                    console.log('\n⏳ Waiting 60 seconds before next URL...');
                    
                    for (let sec = 60; sec > 0; sec -= 1) {
                        if (isCancelledRef.current) break;
                        
                        setDownloadProgress({
                            currentUrl: completedCount,
                            totalUrls: validUrls.length,
                            message: `Waiting ${sec}s before next URL...`,
                            status: 'waiting'
                        });
                        
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

            } catch (err: any) {
                console.error(`\n❌ [${urlIndex + 1}/${validUrls.length}] Download error for ${folderName}:`, err);
                failedUrls.push(postUrl);
                
                setDownloadProgress({
                    currentUrl: urlIndex + 1,
                    totalUrls: validUrls.length,
                    message: `Error on ${folderName}: ${err.message}`,
                    status: 'error'
                });
                
                // Continue to next URL even if this one failed
                if (urlIndex < validUrls.length - 1 && !isCancelledRef.current) {
                    for (let sec = 60; sec > 0; sec -= 1) {
                        if (isCancelledRef.current) break;
                        
                        setDownloadProgress({
                            currentUrl: urlIndex + 1,
                            totalUrls: validUrls.length,
                            message: `Error on ${folderName}, waiting ${sec}s...`,
                            status: 'waiting'
                        });
                        
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        }

        // Final status
        if (isCancelledRef.current) {
            setDownloadProgress({
                currentUrl: 0,
                totalUrls: 0,
                message: 'Download cancelled',
                status: 'idle'
            });
            setRunStatus({
                status: 'idle',
                progress: 0,
                totalItems: 0,
                currentItems: 0,
                message: 'Cancelled'
            });
            return;
        }

        const finalMessage = failedUrls.length === 0
            ? `🎉 All ${successCount} URLs completed! (${totalMediaDownloaded} files)`
            : `⚠️ ${successCount} succeeded, ${failedUrls.length} failed`;

        setDownloadProgress({
            currentUrl: validUrls.length,
            totalUrls: validUrls.length,
            message: finalMessage,
            status: 'completed'
        });

        setRunStatus({
            status: failedUrls.length === validUrls.length ? 'failed' : 'succeeded',
            progress: 100,
            totalItems: validUrls.length,
            currentItems: validUrls.length,
            message: finalMessage
        });

        // Reset progress after 3 seconds
        setTimeout(() => {
            setDownloadProgress({
                currentUrl: 0,
                totalUrls: 0,
                message: '',
                status: 'idle'
            });
            setRunStatus({
                status: 'idle',
                progress: 0,
                totalItems: 0,
                currentItems: 0,
                message: ''
            });
        }, 3000);
    }, [downloadMediaFile, setRunStatus]);

    /**
     * Start background download that continues even when navigating away
     */
    const startBackgroundDownload = useCallback(async (
        postUrls: string[], 
        contentType: 'post' | 'reel' = 'post',
        startingNumber: number = 1,
        account?: any,
        apiToken?: string
    ): Promise<void> => {
        console.log('🌀 Starting background download:', { postUrls, contentType, startingNumber, account });

        // Validate account exists and has cookies
        if (!account) {
            throw new Error('❌ No Instagram account selected. Please add and select an account first.');
        }

        if (!account.cookiesPath) {
            throw new Error('❌ Account has no cookies. Please login to your Instagram account again.');
        }

        // Relaxed URL validation - same as downloadPostByUrl
        let validUrls: string[];
        
        if (contentType === 'reel') {
            const pattern = /instagram\.com\/(p|reel|reels)\//;
            validUrls = postUrls.filter(url => url.match(pattern));
            
            if (validUrls.length === 0) {
                throw new Error('No valid Instagram URLs provided. URLs must contain "instagram.com/p/" or "instagram.com/reel/"');
            }
        } else {
            const pattern = /instagram\.com\/p\//;
            validUrls = postUrls.filter(url => url.match(pattern));
            
            if (validUrls.length === 0) {
                throw new Error('No valid Instagram post URLs provided. URLs must contain "instagram.com/p/"');
            }
        }

        // Create folder prefix for logging
        const folderPrefix = contentType === 'reel' ? 'Scraper_Reel' : 'Scraper_Post';
        console.log(`📁 Will create folders: ${folderPrefix}_${startingNumber} → ${folderPrefix}_${startingNumber + validUrls.length - 1}`);

        // Generate task ID for tracking
        const taskId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`📋 Task ID: ${taskId}`);

        // Start background task in Electron
        if (!window.electronAPI?.startBackgroundDownload) {
            console.error('❌ Background download API not available');
            throw new Error('Background download API not available');
        }

        try {
            console.log('📤 Sending download request to Electron...');
            const params = {
                taskId,
                urls: validUrls,
                contentType,
                startingNumber,
                cookiesPath: account.cookiesPath,
                apiToken: apiToken || '',
                mediaPath: (window as any).__MEDIA_PATH || ''
            };
            console.log('Request params:', params);
            
            const result = await window.electronAPI.startBackgroundDownload(params) as any;
            console.log('📨 Response from Electron:', result);

            if (result.success) {
                console.log(`✅ Background task started with ID: ${taskId}`);
                if (result.downloadedCount !== undefined) {
                    console.log(`📥 Downloaded ${result.downloadedCount} files from ${result.totalCount} posts`);
                }
            } else {
                console.error('❌ Download failed:', result.error);
                throw new Error(result.error || 'Unknown download error');
            }
        } catch (err) {
            console.error('❌ Failed to start background download:', err);
            throw err;
        }
    }, []);

    return {
        downloadPostByUrl,
        startBackgroundDownload,
        cancelDownload,
        downloadProgress,
    };
};