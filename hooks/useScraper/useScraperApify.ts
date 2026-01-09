import { useCallback, useRef } from 'react';
import { ApifyRunStatus } from './useScraperState';
import { ScrapeConfig } from './useScraperConfig';

export const useScraperApify = (
    config: ScrapeConfig,
    setRunStatus: (status: ApifyRunStatus | ((prev: ApifyRunStatus) => ApifyRunStatus)) => void,
    setError: (error: string | null) => void,
    setResults: (results: any[] | ((prev: any[]) => any[])) => void,
    results: any[],
    transformToScraperResult: (item: any, stt: number) => Promise<any>
) => {
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const isRunningRef = useRef<boolean>(false);

    /**
     * Main function: Run Scraper
     */
    const runScraper = useCallback(async () => {
        // Validate
        if (!config.apiToken || !config.apiToken.trim()) {
            setError('Please enter your Apify API Token');
            return;
        }

        if (!config.usernames || !config.usernames.trim()) {
            setError('Please enter a username');
            return;
        }

        if (!window.electronAPI?.apifyStartRun) {
            setError('Electron API not available. Please restart the app.');
            return;
        }

        // Reset state
        setError(null);
        isRunningRef.current = true;
        setRunStatus({
            status: 'starting',
            progress: 0,
            totalItems: 0,
            currentItems: 0,
            message: 'Starting Apify actor...'
        });

        // Prepare input
        const directUrls: string[] = [];
        const usernames = config.usernames.split('\n').map(u => u.trim()).filter(u => u);
        
        for (const username of usernames) {
            const u = username.trim();
            if (!u) continue;
            const clean = u.startsWith('@') ? u.substring(1) : u;
            if (u.startsWith('http')) {
                directUrls.push(u);
            } else {
                directUrls.push(`https://www.instagram.com/${clean}/`);
            }
        }

        const input: any = {
            directUrls,
            resultsLimit: config.resultsLimit,
            resultsType: config.resultsType,
            searchType: 'user',
            addParentData: false
        };

        if (config.dateFrom) {
            input.onlyPostsNewerThan = config.dateFrom;
        }

        // Step 1: Start actor run
        console.log('🚀 Starting Apify run with input:', input);
        const startResult = await window.electronAPI.apifyStartRun({
            apiToken: config.apiToken,
            input
        });

        if (!startResult.success || !startResult.runId || !startResult.datasetId) {
            setError(startResult.error || 'Failed to start scraper');
            setRunStatus(prev => ({ ...prev, status: 'failed', message: 'Failed to start' }));
            isRunningRef.current = false;
            return;
        }

        console.log('✅ Run started:', startResult);

        setRunStatus(prev => ({
            ...prev,
            status: 'running',
            runId: startResult.runId,
            datasetId: startResult.datasetId,
            message: 'Scraping in progress...'
        }));

        // Step 2: Poll for status and results
        let lastItemCount = 0;
        const startingStt = results.length + 1;
        let currentStt = startingStt;

        const pollInterval = setInterval(async () => {
            if (!isRunningRef.current) {
                clearInterval(pollInterval);
                return;
            }

            // Check run status
            const statusResult = await window.electronAPI.apifyCheckStatus({
                apiToken: config.apiToken,
                runId: startResult.runId!
            });

            console.log('📊 Status:', statusResult);

            if (!statusResult.success) {
                console.error('Status check failed:', statusResult.error);
                return;
            }

            const status = statusResult.status;

            // Fetch new items
            const datasetResult = await window.electronAPI.apifyFetchDataset({
                apiToken: config.apiToken,
                datasetId: startResult.datasetId!,
                offset: lastItemCount,
                limit: 100
            });

            if (datasetResult.success && datasetResult.items && datasetResult.items.length > 0) {
                // Filter by date range
                let filteredItems = datasetResult.items;
                
                if (config.dateFrom || config.dateTo) {
                    filteredItems = datasetResult.items.filter((item: any) => {
                        if (!item.timestamp) return true;
                        const postDate = new Date(item.timestamp);
                        
                        if (config.dateFrom) {
                            const fromDate = new Date(config.dateFrom);
                            fromDate.setHours(0, 0, 0, 0);
                            if (postDate < fromDate) return false;
                        }
                        
                        if (config.dateTo) {
                            const toDate = new Date(config.dateTo);
                            toDate.setHours(23, 59, 59, 999);
                            if (postDate > toDate) return false;
                        }
                        
                        return true;
                    });
                }

                console.log(`📦 Fetched ${datasetResult.items.length}, after filter: ${filteredItems.length}`);

                if (filteredItems.length === 0 && datasetResult.items.length > 0) {
                    console.log('⚠️ All items filtered out by date range');
                }

                lastItemCount += datasetResult.items.length;

                setRunStatus(prev => ({
                    ...prev,
                    message: `Downloading media for ${lastItemCount + 1}...`
                }));

                for (const item of datasetResult.items) {
                    const result = await transformToScraperResult(item, currentStt);
                    setResults(prev => [...prev, result]);
                    currentStt++;
                }

                setRunStatus(prev => ({
                    ...prev,
                    currentItems: lastItemCount,
                    progress: Math.min(95, (lastItemCount / config.resultsLimit) * 100),
                    message: `Scraped ${lastItemCount} items...`
                }));
            }

            // Check if completed
            if (status === 'SUCCEEDED') {
                const actualCount = currentStt - startingStt;
                setRunStatus({
                    status: 'succeeded',
                    progress: 100,
                    totalItems: actualCount,
                    currentItems: actualCount,
                    message: actualCount > 0 
                        ? `Completed! Scraped ${actualCount} items` 
                        : 'Completed! No posts found in selected date range'
                });
            }
        }, 5000);

        pollingRef.current = pollInterval;

    }, [config, results.length]);

    /**
     * Cancel scraping
     */
    const cancelScraper = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        isRunningRef.current = false;
        setRunStatus({
            status: 'idle',
            progress: 0,
            totalItems: 0,
            currentItems: 0,
            message: 'Cancelled'
        });
    }, []);

    return {
        runScraper,
        cancelScraper,
    };
};
