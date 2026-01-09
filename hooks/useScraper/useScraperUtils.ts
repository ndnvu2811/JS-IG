import { useCallback } from 'react';
import { ScraperResult } from '../../types';

export const useScraperUtils = (results: ScraperResult[], setResults: (results: ScraperResult[]) => void) => {

    /**
     * Update single result
     */
    const updateResult = useCallback((id: string, updates: Partial<ScraperResult>) => {
        setResults(results.map(r => r.id === id ? { ...r, ...updates } : r));
    }, [results]);

    /**
     * Export results to JSON
     */
    const exportResults = useCallback(() => {
        if (results.length === 0) return;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
            JSON.stringify(results, null, 2)
        );
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `instagram_scrape_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }, [results]);

    /**
     * Clear all results
     */
    const clearResults = useCallback(() => {
        setResults([]);
        localStorage.removeItem('scraper-results');
    }, []);

    return {
        updateResult,
        exportResults,
        clearResults,
    };
};
