
import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface LibraryToolbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterType: 'all' | 'image' | 'video';
    setFilterType: (type: 'all' | 'image' | 'video') => void;
    isFolderView: boolean;
    isAllSelected: boolean;
    onSelectAllChange: () => void;
}

const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
    searchQuery, setSearchQuery, filterType, setFilterType, isFolderView, isAllSelected, onSelectAllChange
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-6">
            <div className="flex items-center gap-4 flex-1">
                {isFolderView && (
                    <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-instagram-purple focus:ring-instagram-purple cursor-pointer"
                            checked={isAllSelected}
                            onChange={onSelectAllChange}
                        />
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 select-none">Select All</span>
                    </div>
                )}
                <div className="relative flex-1 max-w-sm">
                    <MaterialSymbol icon="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by filename..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-instagram-purple outline-none"
                    />
                </div>
            </div>
            {!isFolderView && (
                <div className="flex items-center gap-3">
                    <button
                        onClick={onSelectAllChange}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                        <MaterialSymbol icon={isAllSelected ? "check_box" : "check_box_outline_blank"} className="text-xl text-gray-600 dark:text-gray-400" />
                    </button>
                    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {(['all', 'image', 'video'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${
                                    filterType === type ? 'bg-white dark:bg-gray-700 text-instagram-purple shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryToolbar;
