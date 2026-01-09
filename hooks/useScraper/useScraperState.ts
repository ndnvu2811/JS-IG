import { useState, useEffect } from 'react';
import { ScraperResult } from '../../types';

export interface ApifyRunStatus {
    status: 'idle' | 'starting' | 'running' | 'succeeded' | 'failed';
    progress: number;
    totalItems: number;
    currentItems: number;
    message: string;
    runId?: string;
    datasetId?: string;
}

export const useScraperState = () => {
    // Results state
    const [results, setResults] = useState<ScraperResult[]>(() => {
        const saved = localStorage.getItem('scraper-results');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Error parsing results:', e);
            }
        }
        return [];
    });

    // Run status
    const [runStatus, setRunStatus] = useState<ApifyRunStatus>({
        status: 'idle',
        progress: 0,
        totalItems: 0,
        currentItems: 0,
        message: ''
    });

    const [error, setError] = useState<string | null>(null);

    // Save results to localStorage
    useEffect(() => {
        localStorage.setItem('scraper-results', JSON.stringify(results));
    }, [results]);

    return {
        results,
        setResults,
        runStatus,
        setRunStatus,
        error,
        setError,
    };
};
