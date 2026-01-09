import { useRef, useEffect } from 'react';
import { ScraperResult } from '../../types';
import { syncMediaToLibrary } from '../../utils/library';

export const useScraperTransform = (mediaPathRef: React.MutableRefObject<string>) => {

    /**
     * Format username to Instagram URL
     */
    const formatUsername = (username: string): string => {
        const u = username.trim();
        if (!u) return '';
        const clean = u.startsWith('@') ? u.substring(1) : u;
        if (u.startsWith('http')) return u;
        return `https://www.instagram.com/${clean}/`;
    };

    /**
     * Convert file path to media URL
     */
    const getMediaUrl = (filePath: string): string => {
        if (!filePath) return '';
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
        if (filePath.startsWith('media-file://')) return filePath;
        
        let cleanPath = filePath.replace(/\\/g, '/');
        if (cleanPath.match(/^[A-Z]:/i)) {
            return `media-file://${cleanPath}`;
        } else if (cleanPath.startsWith('/')) {
            return `media-file://${cleanPath}`;
        }
        return `media-file:///${cleanPath}`;
    };

    /**
     * Download media file to local
     */
    const downloadMediaFile = async (
        url: string,
        folderName: string,
        index: number,
        isVideo: boolean,
        customFileName?: string
    ): Promise<string | null> => {
        if (!window.electronAPI?.downloadMedia || !mediaPathRef.current) {
            console.warn('⚠️ Download API not available, using original URL');
            return null;
        }

        try {
            const ext = isVideo ? 'mp4' : 'jpg';
            const fileName = customFileName 
                ? `${customFileName}.${ext}`
                : `${index}_${new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]}.${ext}`;
            const savePath = `${mediaPathRef.current}/${folderName}/${fileName}`;

            console.log(`📥 Downloading: ${url} -> ${savePath}`);

            const result = await window.electronAPI.downloadMedia({ url, savePath });

            if (result.success && result.path) {
                console.log(`✅ Downloaded: ${result.path}`);
                return getMediaUrl(result.path);
            } else {
                console.error(`❌ Download failed: ${result.error}`);
                return null;
            }
        } catch (err) {
            console.error('Download error:', err);
            return null;
        }
    };

    /**
     * Transform Apify item to ScraperResult with downloaded media
     */
    const transformToScraperResult = async (
        item: any,
        stt: number
    ): Promise<ScraperResult> => {
        const mediaItems: { type: string; url: string; localPath?: string }[] = [];
        const folderName = stt.toString();
        const addedUrls = new Set<string>();

        // Helper: lấy base URL (bỏ query params)
        const getBaseUrl = (url: string) => url.split('?')[0];

        // Download displayUrl (main image)
        if (item.displayUrl) {
            const localPath = await downloadMediaFile(item.displayUrl, folderName, 1, false);
            mediaItems.push({
                type: 'image',
                url: item.displayUrl,
                localPath: localPath || undefined
            });
            addedUrls.add(getBaseUrl(item.displayUrl));
        }

        // Download carousel images (skip duplicates)
        if (item.images && Array.isArray(item.images)) {
            let imgIndex = mediaItems.length + 1;
            for (const imgUrl of item.images) {
                const baseUrl = getBaseUrl(imgUrl);
                if (!addedUrls.has(baseUrl)) {
                    const localPath = await downloadMediaFile(imgUrl, folderName, imgIndex, false);
                    mediaItems.push({
                        type: 'image',
                        url: imgUrl,
                        localPath: localPath || undefined
                    });
                    addedUrls.add(baseUrl);
                    imgIndex++;
                }
            }
        }

        // Download video
        if (item.videoUrl) {
            const localPath = await downloadMediaFile(item.videoUrl, folderName, mediaItems.length + 1, true);
            mediaItems.push({
                type: 'video',
                url: item.videoUrl,
                localPath: localPath || undefined
            });
        }

        const processedMedia = mediaItems.map(m => ({
            type: m.type,
            url: m.localPath || m.url
        }));

        const firstLocalPath = mediaItems.find(m => m.localPath)?.localPath;

        // ✅ Auto-save to Media Library
        if (processedMedia.length > 0) {
            try {
                await syncMediaToLibrary(
                    stt, 
                    processedMedia.map(m => ({ type: m.type as 'image' | 'video', url: m.url })), 
                    'Scraper'
                );
                console.log(`✅ Auto-saved media to Library: Scraper_${stt}`);
            } catch (error) {
                console.error('❌ Failed to save to library:', error);
            }
        }

        return {
            id: item.id || `scraped-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${stt}`,
            stt,
            url: item.url || item.inputUrl || '',
            status: 'Done',
            imageUrl: firstLocalPath || item.displayUrl || '',
            caption: item.caption || '',
            captionNew: '',
            media: processedMedia,
            timestamp: item.timestamp || new Date().toISOString()
        };
    };

    return {
        formatUsername,
        getMediaUrl,
        downloadMediaFile,
        transformToScraperResult,
    };
};
