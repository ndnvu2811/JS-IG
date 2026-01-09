import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ScraperEmptyStateProps {
    onGoToConfig: () => void;
}

const ScraperEmptyState: React.FC<ScraperEmptyStateProps> = ({ onGoToConfig }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-20">
            <div className="p-8 rounded-full bg-gray-200 dark:bg-gray-800 mb-4">
                <MaterialSymbol icon="inbox" className="text-6xl text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                No results yet
            </h3>
            <p className="text-gray-500 mt-2">
                Configure and run the scraper to get started.
            </p>
            <button
                onClick={onGoToConfig}
                className="mt-6 text-instagram-purple font-bold hover:underline"
            >
                Go to Configuration
            </button>
        </div>
    );
};

export default ScraperEmptyState;