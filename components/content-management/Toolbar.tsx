
import React from 'react';
import BulkActionsDropdown from './BulkActionsDropdown';
import MaterialSymbol from '../icons/MaterialSymbol';

interface ToolbarProps {
    selectedPostIds: Set<number>;
    onBulkSchedule: () => void;
    onBulkClearSchedule: () => void;
    onBulkDelete: () => void;
    filter: string;
    onFilterChange: (newFilter: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    selectedPostIds,
    onBulkSchedule,
    onBulkClearSchedule,
    onBulkDelete,
    filter,
    onFilterChange
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 p-2 rounded-lg bg-white dark:bg-content-dark border border-gray-200 dark:border-border-dark">
            <div className="flex items-center gap-4">
                <BulkActionsDropdown
                    selectedCount={selectedPostIds.size}
                    onSchedule={onBulkSchedule}
                    onClearSchedule={onBulkClearSchedule}
                    onDelete={onBulkDelete}
                />
                <button
                    onClick={onBulkDelete}
                    disabled={selectedPostIds.size === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <MaterialSymbol icon="delete" className="text-base" />
                    <span>Delete</span>
                </button>
            </div>
            <div className="flex items-center gap-4">
                <MaterialSymbol icon="filter_list" className="text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Filter by status:</span>
                <div className="flex items-center gap-2">
                    {['All', 'Posted', 'Draft', 'Scheduled'].map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full ${filter === f ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Toolbar;