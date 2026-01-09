
import React from 'react';
import MaterialSymbol from '../icons/MaterialSymbol';

interface EditorHeaderProps {
    title: string;
    imageCount: number;
    currentIndex: number;
    onImport: () => void;
    onDelete: () => void;
    onSaveBatch: () => void;
    onExport: () => void;
    isProcessing: boolean;
    isWaiting: boolean;
    isSyncing: boolean;
    hasActiveSession: boolean;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
    title, imageCount, currentIndex,
    onImport, onDelete, onSaveBatch, onExport, isProcessing, isWaiting, isSyncing, hasActiveSession
}) => {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6 flex-shrink-0">
            <div className="flex items-center gap-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-gray-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">{title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                         {imageCount > 0 ? `Editing image ${currentIndex + 1} of ${imageCount}` : 'Manage your visual content.'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button onClick={onImport} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-border-dark px-4 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all shadow-sm">
                    <MaterialSymbol icon="add_photo_alternate" className="text-lg" /> Import
                </button>

                {imageCount > 0 && (
                    <button onClick={onDelete} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-border-dark px-4 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm">
                        <MaterialSymbol icon="delete" className="text-lg" /> Delete
                    </button>
                )}
                
                {imageCount > 0 && (
                    <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-3">
                        <button
                            onClick={onSaveBatch}
                            disabled={isProcessing || isWaiting || isSyncing}
                            className={`flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 text-sm text-white shadow-lg transition-all ${isProcessing || isWaiting || isSyncing ? 'opacity-60 cursor-wait' : ''}`}
                        >
                            <MaterialSymbol icon={isProcessing ? 'sync' : (isWaiting || isSyncing) ? 'schedule' : 'library_add'} className={`text-lg ${isProcessing ? 'animate-spin' : ''}`} />
                            {isProcessing ? 'Processing...' : (isWaiting || isSyncing) ? 'Wait...' : 'Save'}
                        </button>

                        <button
                            onClick={onExport}
                            disabled={!hasActiveSession || isProcessing}
                            className={`flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-sm text-white shadow-lg transition-all active:scale-95 ${hasActiveSession ? 'btn-instagram' : 'bg-gray-400 dark:bg-gray-800 opacity-50 cursor-not-allowed'}`}
                        >
                            <MaterialSymbol icon="download" className="text-lg" /> Export
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default EditorHeader;
