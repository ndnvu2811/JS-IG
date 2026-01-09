import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';
import { ScrapeConfig, ApifyRunStatus } from '../../hooks/useScraper';

interface ScraperConfigFormProps {
    config: ScrapeConfig;
    runStatus: ApifyRunStatus;
    error: string | null;
    isLoading: boolean;
    onConfigChange: (config: ScrapeConfig) => void;
    onRunScraper: () => Promise<void>;
    onCancelScraper: () => void;
    onSwitchToResults: () => void;
}

const ScraperConfigForm: React.FC<ScraperConfigFormProps> = ({
    config,
    runStatus,
    error,
    isLoading,
    onConfigChange,
    onRunScraper,
    onCancelScraper,
    onSwitchToResults
}) => {
    const handleRun = async () => {
        await onRunScraper();
        onSwitchToResults();
    };

    return (
        <div className="h-full overflow-y-auto table-scrollbar">
            <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-8">
                <div className="bg-white dark:bg-content-dark p-6 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xl">
                    {/* Title */}
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-instagram-purple/10 text-instagram-purple">
                            <MaterialSymbol icon="settings" className="text-lg" />
                        </div>
                        Apify Configuration
                    </h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <MaterialSymbol icon="error" className="text-base" />
                            {error}
                        </div>
                    )}
                
                    {/* Form Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* API Token */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Apify API Token <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={config.apiToken}
                                onChange={(e) => onConfigChange({ ...config, apiToken: e.target.value })}
                                placeholder="apify_api_xxxxxxxxxxxxxxx"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-instagram-purple transition-all"
                            />
                        </div>

                        {/* Username */}
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Instagram Username <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={config.usernames}
                                onChange={(e) => onConfigChange({ ...config, usernames: e.target.value })}
                                placeholder="@username"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-instagram-purple transition-all"
                            />
                        </div>

                        {/* Results Type */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Results Type
                            </label>
                            <select
                                value={config.resultsType}
                                onChange={(e) => onConfigChange({ ...config, resultsType: e.target.value as 'posts' | 'reels' })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            >
                                <option value="posts">Posts</option>
                                <option value="reels">Reels</option>
                            </select>
                        </div>

                        {/* Results Limit */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Results Limit
                            </label>
                            <input
                                type="number"
                                value={config.resultsLimit}
                                onChange={(e) => onConfigChange({ ...config, resultsLimit: parseInt(e.target.value) || 100 })}
                                min={1}
                                max={10000}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm"
                            />
                        </div>

                        {/* From Date */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={config.dateFrom}
                                onChange={(e) => onConfigChange({ ...config, dateFrom: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            />
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={config.dateTo}
                                onChange={(e) => onConfigChange({ ...config, dateTo: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            />
                        </div>

                        {/* Action Button */}
                        <div className="col-span-2 pt-2">
                            {isLoading ? (
                                <button
                                    onClick={onCancelScraper}
                                    className="w-full py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <MaterialSymbol icon="stop" />
                                    Cancel Scraping
                                </button>
                            ) : (
                                <button
                                    onClick={handleRun}
                                    disabled={!config.apiToken || !config.usernames || !config.usernames.trim()}
                                    className="w-full py-3 rounded-lg font-bold text-white btn-instagram shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <MaterialSymbol icon="play_arrow" />
                                    Run Scraper
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScraperConfigForm;