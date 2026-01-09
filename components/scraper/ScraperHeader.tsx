import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

type TabType = 'download' | 'config' | 'results';

interface ScraperHeaderProps {
    pageDescription: string;
    isEditingDesc: boolean;
    activeTab: TabType;
    resultsCount: number;
    onDescriptionChange: (value: string) => void;
    onEditingChange: (editing: boolean) => void;
    onTabChange: (tab: TabType) => void;
}

const ScraperHeader: React.FC<ScraperHeaderProps> = ({
    pageDescription,
    isEditingDesc,
    activeTab,
    resultsCount,
    onDescriptionChange,
    onEditingChange,
    onTabChange
}) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Title & Description */}
            <div className="flex flex-col gap-1">
                <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">
                    Scraper
                </h1>
                <div className="flex items-center gap-2 group">
                    {isEditingDesc ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={pageDescription}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white min-w-[300px]"
                                autoFocus
                                onBlur={() => onEditingChange(false)}
                                onKeyDown={(e) => e.key === 'Enter' && onEditingChange(false)}
                            />
                            <button onClick={() => onEditingChange(false)} className="text-emerald-500">
                                <MaterialSymbol icon="save" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                                {pageDescription}
                            </p>
                            <button
                                onClick={() => onEditingChange(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <MaterialSymbol icon="edit" className="text-xs" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-200 dark:bg-gray-800/50 rounded-xl">
                <button
                    onClick={() => onTabChange('download')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'download'
                            ? 'bg-white dark:bg-content-dark text-emerald-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <MaterialSymbol icon="download" className={activeTab === 'download' ? 'fill' : ''} />
                    Download
                </button>
                <button
                    onClick={() => onTabChange('config')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'config'
                            ? 'bg-white dark:bg-content-dark text-instagram-purple shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <MaterialSymbol icon="settings" className={activeTab === 'config' ? 'fill' : ''} />
                    Configuration
                </button>
                <button
                    onClick={() => onTabChange('results')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all relative ${
                        activeTab === 'results'
                            ? 'bg-white dark:bg-content-dark text-instagram-purple shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <MaterialSymbol icon="list_alt" className={activeTab === 'results' ? 'fill' : ''} />
                    Content Dashboard
                    {resultsCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-instagram-purple text-white rounded-full">
                            {resultsCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default ScraperHeader;