import { useState, useEffect } from 'react';

export interface ScrapeConfig {
    apiToken: string;
    usernames: string;
    resultsType: 'posts' | 'reels';
    resultsLimit: number;
    dateFrom: string;
    dateTo: string;
}

export const useScraperConfig = () => {
    const [config, setConfig] = useState<ScrapeConfig>(() => {
        const saved = localStorage.getItem('apify-config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    apiToken: parsed.apiToken || '',
                    usernames: parsed.usernames || '',
                    resultsType: parsed.resultsType || 'posts',
                    resultsLimit: parsed.resultsLimit || 100,
                    dateFrom: parsed.dateFrom || '',
                    dateTo: parsed.dateTo || ''
                };
            } catch (e) {
                console.error('Error parsing config:', e);
            }
        }
        return {
            apiToken: '',
            usernames: '',
            resultsType: 'posts',
            resultsLimit: 100,
            dateFrom: '',
            dateTo: ''
        };
    });

    // Save config to localStorage
    useEffect(() => {
        localStorage.setItem('apify-config', JSON.stringify(config));
    }, [config]);

    return {
        config,
        setConfig,
    };
};
