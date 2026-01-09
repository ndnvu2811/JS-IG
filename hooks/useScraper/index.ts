import { useEffect, useRef } from 'react';
import { useScraperConfig, type ScrapeConfig } from './useScraperConfig';
import { useScraperState, type ApifyRunStatus } from './useScraperState';
import { useScraperTransform } from './useScraperTransform';
import { useScraperApify } from './useScraperApify';
import { useScraperDownload, type DownloadProgress } from './useScraperDownload';
import { useScraperUtils } from './useScraperUtils';
import { useScraperNotifications } from './useScraperNotifications';

export type { ScrapeConfig, ApifyRunStatus, DownloadProgress };

export const useScraper = () => {
    const mediaPathRef = useRef<string>('');

    // Config management
    const { config, setConfig } = useScraperConfig();

    // State management
    const { results, setResults, runStatus, setRunStatus, error, setError } = useScraperState();

    // Transform utilities
    const { formatUsername, getMediaUrl, downloadMediaFile, transformToScraperResult } = useScraperTransform(mediaPathRef);

    // Apify scraping
    const { runScraper, cancelScraper } = useScraperApify(
        config,
        setRunStatus,
        setError,
        setResults,
        results,
        transformToScraperResult
    );

    // Direct download - now includes cancelDownload and downloadProgress
    const { downloadPostByUrl, startBackgroundDownload, cancelDownload, downloadProgress } = useScraperDownload(
        setRunStatus,
        downloadMediaFile
    );

    // Utility functions
    const { updateResult, exportResults, clearResults } = useScraperUtils(results, setResults);

    // Download notifications
    const { downloadNotification, clearNotification } = useScraperNotifications();

    // Get media path on mount
    useEffect(() => {
        const getPath = async () => {
            if (window.electronAPI?.getMediaPath) {
                mediaPathRef.current = await window.electronAPI.getMediaPath();
                console.log('📁 Media path:', mediaPathRef.current);
            }
        };
        getPath();
    }, []);

    return {
        config,
        setConfig,
        results,
        setResults,
        updateResult,
        runStatus,
        error,
        isLoading: runStatus.status === 'starting' || runStatus.status === 'running',
        runScraper,
        cancelScraper,
        exportResults,
        clearResults,
        downloadPostByUrl,
        startBackgroundDownload,
        downloadNotification,
        clearNotification,
        cancelDownload,
        downloadProgress
    };
};