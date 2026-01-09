/**
 * Custom Stop All Confirmation Modal
 * Save to: src/components/StopAllModal.tsx
 */

import React from 'react';
import MaterialSymbol from './icons/MaterialSymbol';

interface StopAllModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const StopAllModal: React.FC<StopAllModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onCancel}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <MaterialSymbol icon="warning" className="text-3xl text-white fill" />
                        <h2 className="text-xl font-bold text-white">Stop All Activities</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Are you sure you want to stop all running activities?
                    </p>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                            This will:
                        </p>
                        <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>Close all browser windows</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>Stop current automation tasks</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-0.5">•</span>
                                <span>Cancel pending operations</span>
                            </li>
                        </ul>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        ℹ️ Scheduled posts and activities will remain unchanged.
                    </p>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-lg font-medium
                        bg-white dark:bg-gray-800 
                        text-gray-700 dark:text-gray-300
                        border-2 border-gray-300 dark:border-gray-600
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 rounded-lg font-bold
                        bg-gradient-to-r from-red-500 to-red-600
                        hover:from-red-600 hover:to-red-700
                        text-white shadow-lg hover:shadow-xl
                        transition-all"
                    >
                        Stop All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StopAllModal;